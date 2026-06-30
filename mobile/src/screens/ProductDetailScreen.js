import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { GET_FOOD } from '../api/queries';
import { addToCart } from '../store/cartSlice';
import FavoritesService from '../services/FavoritesService';
import SessionService from '../services/SessionService';
import useProductTracking from '../hooks/useProductTracking';
import { getCategoryConfig, getFieldLabel, getFieldIcon } from '../utils/categoryConfig';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const ProductDetailScreen = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const cart = useSelector(state => state.cart);
  const userId = user?._id || null;
  
  const { product: initialProduct } = route.params;
  
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    specifications: false,
    ingredients: false,
    nutrition: false,
    reviews: false,
    similar: true, // Similar products expanded by default
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Track product view with time spent
  const categoryId = initialProduct?.category?._id || initialProduct?.category;
  useProductTracking(initialProduct?._id || initialProduct?.id, categoryId);

  // Use GET_FOOD query since that's what exists in the database
  const { data: productData } = useQuery(GET_FOOD, {
    variables: { id: initialProduct.id || initialProduct._id },
    skip: !initialProduct.id && !initialProduct._id,
  });

  const product = productData?.food || initialProduct;
  const variation = selectedVariation || product.variations?.[0];

  // Get category-specific configuration
  // Use restaurant since that's what exists in the database
  const shopType = product.restaurant?.shopType;
  const categoryName = product.category?.title || product.category?.name;
  const categoryConfig = getCategoryConfig(shopType, categoryName);

  // Check if product is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      if (product?._id || product?.id) {
        const result = await FavoritesService.isFavorite(userId, product._id || product.id);
        setIsFavorite(result);
      }
    };
    checkFavorite();
  }, [product, userId]);

  const handleToggleFavorite = async () => {
    if (!userId) {
      Alert.alert(
        'Login Required',
        'Please login to save favorites',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    const productId = product._id || product.id;
    
    if (isFavorite) {
      const result = await FavoritesService.removeFromFavorites(userId, productId);
      if (result.success) {
        setIsFavorite(false);
        Alert.alert('Success', 'Removed from favorites');
      }
    } else {
      const result = await FavoritesService.addToFavorites(userId, product);
      if (result.success) {
        setIsFavorite(true);
        Alert.alert('Success', 'Added to favorites');
      } else if (result.requiresLogin) {
        Alert.alert(
          'Login Required',
          'Please login to save favorites',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    }
  };

  const handleAddonToggle = (addon, option) => {
    const addonIndex = selectedAddons.findIndex((a) => a.id === addon.id);
    
    if (addonIndex >= 0) {
      const existingAddon = selectedAddons[addonIndex];
      const optionIndex = existingAddon.options.findIndex((o) => o.id === option.id);
      
      if (optionIndex >= 0) {
        // Remove option
        const newOptions = existingAddon.options.filter((o) => o.id !== option.id);
        if (newOptions.length === 0) {
          // Remove addon if no options left
          setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
        } else {
          const newAddons = [...selectedAddons];
          newAddons[addonIndex] = { ...existingAddon, options: newOptions };
          setSelectedAddons(newAddons);
        }
      } else {
        // Add option
        const newAddons = [...selectedAddons];
        newAddons[addonIndex] = {
          ...existingAddon,
          options: [...existingAddon.options, option],
        };
        setSelectedAddons(newAddons);
      }
    } else {
      // Add new addon with option
      setSelectedAddons([
        ...selectedAddons,
        {
          id: addon.id || addon._id,
          title: addon.title,
          options: [option],
        },
      ]);
    }
  };

  const isAddonOptionSelected = (addonId, optionId) => {
    const addon = selectedAddons.find((a) => a.id === addonId);
    return addon?.options.some((o) => o.id === optionId);
  };

  const calculateTotal = () => {
    let total = variation?.price || 0;
    
    selectedAddons.forEach((addon) => {
      addon.options.forEach((option) => {
        total += option.price || 0;
      });
    });
    
    return total * quantity;
  };

  const addItemToCart = async () => {
    const cartItem = {
      food: product.id || product._id,
      title: product.title,
      image: product.image,
      restaurant: product.restaurant?._id || product.restaurant?.id,
      restaurantName: product.restaurant?.name,
      variation: {
        id: variation.id || variation._id,
        title: variation.title,
        price: variation.price,
      },
      quantity: quantity,
      addons: selectedAddons,
      specialInstructions,
    };

    dispatch(addToCart(cartItem));

    // Track add to cart
    await SessionService.trackAddToCart(
      product._id || product.id,
      categoryId,
      quantity,
      userId
    );

    Alert.alert('Success', 'Item added to cart!', [
      {
        text: 'View Cart',
        onPress: () => navigation.navigate('Cart'),
      },
      {
        text: 'Continue Shopping',
        style: 'cancel',
      },
    ]);
  };

  const handleAddToCart = async () => {
    if (!variation) {
      Alert.alert('Error', 'Please select a variation');
      return;
    }

    // Allow adding from any category/restaurant
    addItemToCart();
  };

  const s = styles(colors, typography, scale);

  const renderHeader = () => (
    <View style={s.header}>
      <Image source={{ uri: product.image }} style={s.productImage} />
      <View style={s.headerOverlay}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        
        <TouchableOpacity style={s.favoriteButton} onPress={handleToggleFavorite}>
          <Icon 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? colors.error : colors.textInverse} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductInfo = () => (
    <View style={s.productInfo}>
      {/* Category Badge */}
      <View style={[s.categoryBadge, { backgroundColor: categoryConfig.color }]}>
        <Icon name={categoryConfig.icon} size={16} color={colors.textInverse} />
        <Text style={s.categoryBadgeText}>{categoryConfig.name}</Text>
      </View>

      <Text style={s.productName}>{String(product.title || '')}</Text>
      <Text style={s.productDescription}>{String(product.description || '')}</Text>
      
      {/* Prescription Required Warning */}
      {categoryConfig.requiresPrescription && (
        <View style={s.prescriptionWarning}>
          <Icon name="file-document" size={20} color={colors.accent} />
          <Text style={s.prescriptionText}>Prescription Required</Text>
        </View>
      )}

      <View style={s.shopInfo}>
        <Image
          source={{ uri: product.restaurant?.image }}
          style={s.shopImage}
        />
        <View style={s.shopDetails}>
          <Text style={s.shopName}>{String(product.restaurant?.name || 'Shop')}</Text>
          <View style={s.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={s.ratingText}>{String(product.restaurant?.rating || '4.2')}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Render key features badges
  const renderKeyFeatures = () => {
    const features = [];
    const attributes = product.attributes || product.metadata || product.additionalInfo || {};

    // Add category-specific badges
    if (attributes.organic) features.push({ icon: 'leaf', text: 'Organic', color: colors.accent });
    if (attributes.warranty) features.push({ icon: 'shield-check', text: 'Warranty', color: colors.info });
    if (attributes.requiresPrescription || categoryConfig.requiresPrescription) features.push({ icon: 'file-document', text: 'Rx Required', color: colors.accent });
    if (attributes.freeShipping) features.push({ icon: 'truck-fast', text: 'Free Shipping', color: colors.info });
    if (attributes.inStock !== false && !product.isOutOfStock) features.push({ icon: 'check-circle', text: 'In Stock', color: colors.success });
    if (attributes.assemblyRequired) features.push({ icon: 'tools', text: 'Assembly Required', color: colors.warning });

    if (features.length === 0) return null;

    return (
      <View style={s.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={[s.featureBadge, { borderColor: feature.color }]}>
            <Icon name={feature.icon} size={16} color={feature.color} />
            <Text style={[s.featureText, { color: feature.color }]}>{feature.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render category-specific information with collapsible sections
  const renderCategorySpecificInfo = () => {
    // Use attributes first, fallback to metadata for backward compatibility
    const attributes = product.attributes || product.metadata || product.additionalInfo || {};
    const fieldsToShow = categoryConfig.additionalFields || [];

    const hasData = fieldsToShow.some(field => attributes[field]);
    if (!hasData) return null;

    const isExpanded = expandedSections.specifications;

    return (
      <View style={s.section}>
        <TouchableOpacity 
          style={s.collapsibleHeader}
          onPress={() => toggleSection('specifications')}
        >
          <View style={s.collapsibleHeaderLeft}>
            <Icon name="information-outline" size={24} color={categoryConfig.color} />
            <Text style={s.sectionTitle}>Product Information</Text>
          </View>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.collapsibleContent}>
            {fieldsToShow.map(field => {
              const value = attributes[field];
              if (!value) return null;

              // Handle array values
              const displayValue = Array.isArray(value) ? value.join(', ') : String(value);

              return (
                <View key={field} style={s.infoRow}>
                  <View style={s.infoIconContainer}>
                    <Icon name={getFieldIcon(field)} size={20} color={categoryConfig.color} />
                  </View>
                  <View style={s.infoContent}>
                    <Text style={s.infoLabel}>{getFieldLabel(field)}</Text>
                    <Text style={s.infoValue}>{displayValue}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Render similar products (category-specific recommendations)
  const renderSimilarProducts = () => {
    // This would fetch similar products from the same category
    // For now, we'll show a placeholder
    const isExpanded = expandedSections.similar;

    return (
      <View style={s.section}>
        <TouchableOpacity 
          style={s.collapsibleHeader}
          onPress={() => toggleSection('similar')}
        >
          <View style={s.collapsibleHeaderLeft}>
            <Icon name="shopping" size={24} color={categoryConfig.color} />
            <Text style={s.sectionTitle}>Similar Products</Text>
          </View>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.collapsibleContent}>
            <Text style={s.placeholderText}>
              Similar products in {categoryConfig.name} category will appear here
            </Text>
            <TouchableOpacity 
              style={s.viewCategoryButton}
              onPress={() => navigation.navigate('CategoryHome', { 
                category: product.category 
              })}
            >
              <Text style={s.viewCategoryButtonText}>
                View All {categoryConfig.name} Products
              </Text>
              <Icon name="arrow-right" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render reviews section
  const renderReviews = () => {
    const isExpanded = expandedSections.reviews;
    const reviewCount = product.reviews?.length || 0;

    return (
      <View style={s.section}>
        <TouchableOpacity 
          style={s.collapsibleHeader}
          onPress={() => toggleSection('reviews')}
        >
          <View style={s.collapsibleHeaderLeft}>
            <Icon name="star" size={24} color="#FFD700" />
            <Text style={s.sectionTitle}>
              Reviews {reviewCount > 0 && `(${reviewCount})`}
            </Text>
          </View>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={s.collapsibleContent}>
            {reviewCount === 0 ? (
              <Text style={s.placeholderText}>
                No reviews yet. Be the first to review this product!
              </Text>
            ) : (
              <Text style={s.placeholderText}>
                Reviews will be displayed here
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderVariations = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Select Size</Text>
      {product.variations?.map((v) => (
        <TouchableOpacity
          key={v.id || v._id}
          style={[
            s.variationItem,
            selectedVariation?.id === v.id && s.selectedVariationItem,
          ]}
          onPress={() => setSelectedVariation(v)}
        >
          <View style={s.variationInfo}>
            <Text style={s.variationTitle}>{String(v.title || '')}</Text>
            {v.discounted && (
              <Text style={s.originalPrice}>{`PKR ${v.price.toFixed(2)}`}</Text>
            )}
          </View>
          <Text style={s.variationPrice}>
            {`PKR ${(v.discounted || v.price).toFixed(2)}`}
          </Text>
          <View style={[
            s.radioButton,
            selectedVariation?.id === v.id && s.radioButtonSelected,
          ]} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAddons = () => {
    if (!variation?.addons || variation.addons.length === 0) return null;

    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>Add-ons</Text>
        {variation.addons.map((addon) => (
          <View key={addon.id || addon._id} style={s.addonGroup}>
            <Text style={s.addonTitle}>{String(addon.title || '')}</Text>
            <Text style={s.addonDescription}>
              {String(addon.description || `Select up to ${addon.quantityMaximum} options`)}
            </Text>
            
            {addon.options?.map((option) => (
              <TouchableOpacity
                key={option.id || option._id}
                style={s.addonOption}
                onPress={() => handleAddonToggle(addon, option)}
              >
                <View style={s.addonOptionInfo}>
                  <Text style={s.addonOptionTitle}>{String(option.title || '')}</Text>
                  {option.description && (
                    <Text style={s.addonOptionDescription}>
                      {String(option.description)}
                    </Text>
                  )}
                </View>
                <Text style={s.addonOptionPrice}>
                  {`+PKR ${option.price.toFixed(2)}`}
                </Text>
                <View style={[
                  s.checkbox,
                  isAddonOptionSelected(addon.id || addon._id, option.id || option._id) &&
                    s.checkboxSelected,
                ]}>
                  {isAddonOptionSelected(addon.id || addon._id, option.id || option._id) && (
                    <Icon name="check" size={16} color={colors.textInverse} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderSpecialInstructions = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Special Instructions</Text>
      <TextInput
        style={s.instructionsInput}
        placeholder="Any special requests? (e.g., no onions, extra spicy)"
        placeholderTextColor={colors.accentLight}
        value={specialInstructions}
        onChangeText={setSpecialInstructions}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderQuantitySelector = () => (
    <View style={s.quantitySection}>
      <Text style={s.sectionTitle}>Quantity</Text>
      <View style={s.quantityContainer}>
        <TouchableOpacity
          style={s.quantityButton}
          onPress={() => setQuantity(Math.max(1, quantity - 1))}
        >
          <Icon name="minus" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.quantityText}>{String(quantity)}</Text>
        <TouchableOpacity
          style={s.quantityButton}
          onPress={() => setQuantity(quantity + 1)}
        >
          <Icon name="plus" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {renderHeader()}
      
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {renderProductInfo()}
        {renderKeyFeatures()}
        {renderVariations()}
        {renderCategorySpecificInfo()}
        {renderAddons()}
        {renderSpecialInstructions()}
        {renderQuantitySelector()}
        {renderSimilarProducts()}
        {renderReviews()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.footer}>
        <View style={s.totalContainer}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{`PKR ${calculateTotal().toFixed(2)}`}</Text>
        </View>
        <TouchableOpacity style={s.addToCartButton} onPress={handleAddToCart}>
          <Icon name="cart-plus" size={20} color={colors.textInverse} />
          <Text style={s.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: Math.round(300 * scale),
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(50 * scale),
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  productInfo: {
    padding: Math.round(16 * scale),
    backgroundColor: colors.surface,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Math.round(12 * scale),
    paddingVertical: Math.round(6 * scale),
    borderRadius: Math.round(20 * scale),
    marginBottom: Math.round(12 * scale),
  },
  categoryBadgeText: {
    color: colors.textInverse,
    fontSize: Math.round(12 * scale),
    fontWeight: '600',
    marginLeft: Math.round(6 * scale),
    textTransform: 'uppercase',
  },
  prescriptionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    marginBottom: Math.round(12 * scale),
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  prescriptionText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginLeft: Math.round(8 * scale),
  },
  productName: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(8 * scale),
  },
  productDescription: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: Math.round(16 * scale),
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(12 * scale),
  },
  shopImage: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    marginRight: Math.round(12 * scale),
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(4 * scale),
  },
  section: {
    padding: Math.round(16 * scale),
    borderTopWidth: 8,
    borderTopColor: colors.surfaceVariant,
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(12 * scale),
  },
  variationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(8 * scale),
  },
  selectedVariationItem: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  variationInfo: {
    flex: 1,
  },
  variationTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  originalPrice: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  variationPrice: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: Math.round(12 * scale),
  },
  radioButton: {
    width: Math.round(20 * scale),
    height: Math.round(20 * scale),
    borderRadius: Math.round(10 * scale),
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radioButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  addonGroup: {
    marginBottom: Math.round(16 * scale),
  },
  addonTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  addonDescription: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(12 * scale),
  },
  addonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
    marginBottom: Math.round(8 * scale),
  },
  addonOptionInfo: {
    flex: 1,
  },
  addonOptionTitle: {
    fontSize: Math.round(14 * scale),
    fontWeight: '500',
    color: colors.textPrimary,
  },
  addonOptionDescription: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(2 * scale),
  },
  addonOptionPrice: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: Math.round(12 * scale),
  },
  checkbox: {
    width: Math.round(20 * scale),
    height: Math.round(20 * scale),
    borderRadius: Math.round(4 * scale),
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  instructionsInput: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: Math.round(80 * scale),
  },
  quantitySection: {
    padding: Math.round(16 * scale),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(8 * scale),
  },
  quantityButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityText: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginHorizontal: Math.round(24 * scale),
    minWidth: Math.round(40 * scale),
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(4 * scale),
  },
  totalValue: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(24 * scale),
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
  },
  addToCartText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    marginLeft: Math.round(8 * scale),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Math.round(12 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  infoIconContainer: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(12 * scale),
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(4 * scale),
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(12 * scale),
    gap: Math.round(8 * scale),
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.round(12 * scale),
    paddingVertical: Math.round(8 * scale),
    borderRadius: Math.round(20 * scale),
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    marginRight: Math.round(8 * scale),
    marginBottom: Math.round(8 * scale),
  },
  featureText: {
    fontSize: Math.round(12 * scale),
    fontWeight: '600',
    marginLeft: Math.round(6 * scale),
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.round(12 * scale),
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsibleContent: {
    paddingTop: Math.round(8 * scale),
  },
  placeholderText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Math.round(20 * scale),
    fontStyle: 'italic',
  },
  viewCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: Math.round(14 * scale),
    paddingHorizontal: Math.round(20 * scale),
    borderRadius: Math.round(12 * scale),
    marginTop: Math.round(12 * scale),
  },
  viewCategoryButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    marginRight: Math.round(8 * scale),
  },
});

export default ProductDetailScreen;
