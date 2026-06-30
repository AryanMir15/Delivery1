import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useMutation, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';

import { CREATE_FOOD, UPDATE_FOOD, VENDOR_UPLOAD_IMAGE } from '../../api/mutations';
import { GET_CATEGORIES, GET_RESTAURANTS_BY_OWNER } from '../../api/queries';
import { addProduct, updateProduct } from '../../store/productSlice';

export default function ProductFormScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();

  const { data: restaurantData } = useQuery(GET_RESTAURANTS_BY_OWNER);
  const selectedRestaurant = restaurantData?.restaurantsByOwner?.[0];

  const product = route.params?.product;
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    image: product?.image || '',
    images: product?.images || [], // Multiple images array
    category: product?.category?._id || '',
    subCategory: product?.subCategory || '',
    variations: product?.variations || [{ title: 'Regular', price: 0, discounted: 0 }],
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const [createFood, { loading: creating }] = useMutation(CREATE_FOOD);
  const [updateFood, { loading: updating }] = useMutation(UPDATE_FOOD);
  const [uploadImage] = useMutation(VENDOR_UPLOAD_IMAGE);

  const categories = categoriesData?.categories || [];

  useEffect(() => {
    if (product?.category) {
      setSelectedCategory(product.category);
    }
  }, [product]);

  const handlePickImage = async (isPrimary = true, index = null) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      if (!isPrimary) setUploadingIndex(index);
      
      try {
        const { data } = await uploadImage({
          variables: { image: `data:image/jpeg;base64,${result.assets[0].base64}` },
        });
        
        if (data?.uploadImageToS3?.imageUrl) {
          if (isPrimary) {
            // Set as primary image
            setFormData({ ...formData, image: data.uploadImageToS3.imageUrl });
          } else {
            // Add to gallery
            const newImages = [...formData.images];
            if (index !== null && index < newImages.length) {
              newImages[index] = data.uploadImageToS3.imageUrl;
            } else {
              newImages.push(data.uploadImageToS3.imageUrl);
            }
            setFormData({ ...formData, images: newImages });
          }
        }
      } catch (error) {
        Alert.alert('Upload Failed', 'Failed to upload image');
      } finally {
        setUploading(false);
        setUploadingIndex(null);
      }
    }
  };

  const handleRemoveImage = (index) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newImages = formData.images.filter((_, i) => i !== index);
            setFormData({ ...formData, images: newImages });
          },
        },
      ]
    );
  };

  const handleAddVariation = () => {
    setFormData({
      ...formData,
      variations: [...formData.variations, { title: '', price: 0, discounted: 0 }],
    });
  };

  const handleRemoveVariation = (index) => {
    const newVariations = formData.variations.filter((_, i) => i !== index);
    setFormData({ ...formData, variations: newVariations });
  };

  const handleVariationChange = (index, field, value) => {
    const newVariations = [...formData.variations];
    newVariations[index][field] = field === 'title' ? value : parseFloat(value) || 0;
    setFormData({ ...formData, variations: newVariations });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter product title');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (formData.variations.length === 0 || !formData.variations[0].price) {
      Alert.alert('Error', 'Please add at least one variation with price');
      return;
    }

    try {
      const variables = {
        title: formData.title,
        description: formData.description,
        image: formData.image,
        category: formData.category,
        restaurant: selectedRestaurant._id,
        subCategory: formData.subCategory,
        variations: formData.variations.map((v) => ({
          title: v.title,
          price: parseFloat(v.price),
          discounted: parseFloat(v.discounted) || 0,
        })),
      };

      if (isEditing) {
        const { data } = await updateFood({
          variables: { id: product._id, ...variables },
        });
        if (data?.updateFood) {
          dispatch(updateProduct(data.updateFood));
          Alert.alert('Success', 'Product updated successfully');
        }
      } else {
        const { data } = await createFood({ variables });
        if (data?.createFood) {
          dispatch(addProduct(data.createFood));
          Alert.alert('Success', 'Product created successfully');
        }
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save product');
    }
  };

  const loading = creating || updating;

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView style={s.container} contentContainerStyle={s.scrollInner}>
      <View style={s.form}>
        {/* Primary Image Upload */}
        <View style={s.imageSection}>
          <Text style={s.label}>Primary Image *</Text>
          <TouchableOpacity 
            style={s.imageContainer} 
            onPress={() => handlePickImage(true)}
          >
            {formData.image ? (
              <Image source={{ uri: formData.image }} style={s.image} />
            ) : (
              <View style={s.imagePlaceholder}>
                <Ionicons name="camera" size={40} color={colors.textTertiary} />
                <Text style={s.imagePlaceholderText}>Add Primary Photo</Text>
              </View>
            )}
            {uploading && uploadingIndex === null && (
              <View style={s.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Additional Images Gallery */}
        <View style={s.imageSection}>
          <View style={s.gallerySectionHeader}>
            <Text style={s.label}>Additional Images (Optional)</Text>
            <Text style={s.galleryHint}>
              {formData.images.length}/5 images
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={s.galleryScroll}
          >
            <View style={s.galleryContainer}>
              {/* Existing Images */}
              {formData.images.map((img, index) => (
                <View key={index} style={s.galleryItem}>
                  <Image source={{ uri: img }} style={s.galleryImage} />
                  <TouchableOpacity
                    style={s.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                  {uploading && uploadingIndex === index && (
                    <View style={s.uploadingOverlay}>
                      <ActivityIndicator size="small" color={colors.accent} />
                    </View>
                  )}
                </View>
              ))}
              
              {/* Add More Button */}
              {formData.images.length < 5 && (
                <TouchableOpacity
                  style={s.addImageButton}
                  onPress={() => handlePickImage(false, formData.images.length)}
                >
                  <Ionicons name="add-circle" size={40} color={colors.accent} />
                  <Text style={s.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          <Text style={s.galleryNote}>
            Tip: Add multiple angles and details of your product
          </Text>
        </View>

        {/* Title */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Product Name *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Margherita Pizza"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        {/* Description */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Description</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Describe your product..."
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    s.categoryChip,
                    formData.category === cat._id && s.categoryChipActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: cat._id });
                    setSelectedCategory(cat);
                  }}
                >
                  <Text
                    style={[
                      s.categoryChipText,
                      formData.category === cat._id && s.categoryChipTextActive,
                    ]}
                  >
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Sub Category */}
        <View style={s.inputGroup}>
          <Text style={s.label}>Sub Category (Optional)</Text>
          <TextInput
            style={s.input}
            placeholder="e.g., Vegetarian, Spicy"
            value={formData.subCategory}
            onChangeText={(text) => setFormData({ ...formData, subCategory: text })}
          />
        </View>

        {/* Variations */}
        <View style={s.inputGroup}>
          <View style={s.sectionHeader}>
            <Text style={s.label}>Variations *</Text>
            <TouchableOpacity
              style={s.addVariationButton}
              onPress={handleAddVariation}
            >
              <Ionicons name="add-circle" size={24} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {formData.variations.map((variation, index) => (
            <View key={index} style={s.variationCard}>
              <View style={s.variationHeader}>
                <Text style={s.variationTitle}>Variation {index + 1}</Text>
                {formData.variations.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveVariation(index)}>
                    <Ionicons name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={s.input}
                placeholder="Size/Type (e.g., Small, Medium, Large)"
                value={variation.title}
                onChangeText={(text) => handleVariationChange(index, 'title', text)}
              />

              <View style={s.priceRow}>
                <View style={s.priceInput}>
                  <Text style={s.priceLabel}>Price (PKR) *</Text>
                  <TextInput
                    style={s.input}
                    placeholder="0.00"
                    value={variation.price.toString()}
                    onChangeText={(text) => handleVariationChange(index, 'price', text)}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={s.priceInput}>
                  <Text style={s.priceLabel}>Discounted Price</Text>
                  <TextInput
                    style={s.input}
                    placeholder="0.00"
                    value={variation.discounted.toString()}
                    onChangeText={(text) =>
                      handleVariationChange(index, 'discounted', text)
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[s.submitButton, loading && s.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={s.submitButtonText}>
              {isEditing ? 'Update Product' : 'Create Product'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollInner: {
    paddingBottom: Math.round(40 * scale),
  },
  form: {
    padding: Math.round(20 * scale),
  },
  imageSection: {
    marginBottom: Math.round(20 * scale),
  },
  imageContainer: {
    width: '100%',
    height: Math.round(200 * scale),
    borderRadius: Math.round(10 * scale),
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: Math.round(10 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textTertiary,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gallerySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.round(10 * scale),
  },
  galleryHint: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  galleryScroll: {
    marginBottom: Math.round(5 * scale),
  },
  galleryContainer: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  galleryItem: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
    borderRadius: Math.round(8 * scale),
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: Math.round(5 * scale),
    right: Math.round(5 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
  },
  addImageButton: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    marginTop: Math.round(5 * scale),
    fontSize: Math.round(12 * scale),
    color: colors.accent,
    fontWeight: '600',
  },
  galleryNote: {
    fontSize: Math.round(11 * scale),
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Math.round(5 * scale),
  },
  inputGroup: {
    marginBottom: Math.round(20 * scale),
  },
  label: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(8 * scale),
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: Math.round(8 * scale),
    padding: Math.round(12 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
  },
  textArea: {
    height: Math.round(100 * scale),
    textAlignVertical: 'top',
  },
  categoryList: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  categoryChip: {
    paddingHorizontal: Math.round(20 * scale),
    paddingVertical: Math.round(10 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  categoryChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryChipText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.round(10 * scale),
  },
  addVariationButton: {
    padding: Math.round(5 * scale),
  },
  variationCard: {
    backgroundColor: colors.surface,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    marginBottom: Math.round(10 * scale),
    borderWidth: 1,
    borderColor: colors.divider,
  },
  variationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.round(10 * scale),
  },
  variationTitle: {
    fontSize: Math.round(14 * scale),
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
    marginTop: Math.round(10 * scale),
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(5 * scale),
  },
  submitButton: {
    backgroundColor: colors.accent,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(10 * scale),
    alignItems: 'center',
    marginTop: Math.round(20 * scale),
    marginBottom: Math.round(40 * scale),
  },
  submitButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  submitButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
  },
});
