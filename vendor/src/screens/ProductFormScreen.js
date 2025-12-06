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
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { CREATE_FOOD, UPDATE_FOOD, UPLOAD_IMAGE } from '../api/mutations';
import { GET_CATEGORIES } from '../api/queries';
import { addProduct, updateProduct } from '../store/productSlice';

export default function ProductFormScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { selectedRestaurant } = useSelector((state) => state.auth);
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
  const [uploadImage] = useMutation(UPLOAD_IMAGE);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Primary Image Upload */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Primary Image *</Text>
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={() => handlePickImage(true)}
          >
            {formData.image ? (
              <Image source={{ uri: formData.image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#999" />
                <Text style={styles.imagePlaceholderText}>Add Primary Photo</Text>
              </View>
            )}
            {uploading && uploadingIndex === null && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Additional Images Gallery */}
        <View style={styles.imageSection}>
          <View style={styles.gallerySectionHeader}>
            <Text style={styles.label}>Additional Images (Optional)</Text>
            <Text style={styles.galleryHint}>
              {formData.images.length}/5 images
            </Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
          >
            <View style={styles.galleryContainer}>
              {/* Existing Images */}
              {formData.images.map((img, index) => (
                <View key={index} style={styles.galleryItem}>
                  <Image source={{ uri: img }} style={styles.galleryImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                  {uploading && uploadingIndex === index && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#4CAF50" />
                    </View>
                  )}
                </View>
              ))}
              
              {/* Add More Button */}
              {formData.images.length < 5 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => handlePickImage(false, formData.images.length)}
                >
                  <Ionicons name="add-circle" size={40} color="#4CAF50" />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          <Text style={styles.galleryNote}>
            Tip: Add multiple angles and details of your product
          </Text>
        </View>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Margherita Pizza"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your product..."
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.categoryChip,
                    formData.category === cat._id && styles.categoryChipActive,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, category: cat._id });
                    setSelectedCategory(cat);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      formData.category === cat._id && styles.categoryChipTextActive,
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
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sub Category (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Vegetarian, Spicy"
            value={formData.subCategory}
            onChangeText={(text) => setFormData({ ...formData, subCategory: text })}
          />
        </View>

        {/* Variations */}
        <View style={styles.inputGroup}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Variations *</Text>
            <TouchableOpacity
              style={styles.addVariationButton}
              onPress={handleAddVariation}
            >
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          {formData.variations.map((variation, index) => (
            <View key={index} style={styles.variationCard}>
              <View style={styles.variationHeader}>
                <Text style={styles.variationTitle}>Variation {index + 1}</Text>
                {formData.variations.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveVariation(index)}>
                    <Ionicons name="trash" size={20} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Size/Type (e.g., Small, Medium, Large)"
                value={variation.title}
                onChangeText={(text) => handleVariationChange(index, 'title', text)}
              />

              <View style={styles.priceRow}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Price (ETB) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={variation.price.toString()}
                    onChangeText={(text) => handleVariationChange(index, 'price', text)}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Discounted Price</Text>
                  <TextInput
                    style={styles.input}
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
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Update Product' : 'Create Product'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#4CAF50',
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
    marginTop: 10,
    fontSize: 16,
    color: '#999',
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
    marginBottom: 10,
  },
  galleryHint: {
    fontSize: 12,
    color: '#666',
  },
  galleryScroll: {
    marginBottom: 5,
  },
  galleryContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  galleryItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    marginTop: 5,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  galleryNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryList: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addVariationButton: {
    padding: 5,
  },
  variationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  variationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  variationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
