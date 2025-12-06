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

const ProductDetailScreen = ({ navigation, route }) => {
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
          <Icon 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#E63946" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductInfo = () => (
    <View style={styles.productInfo}>
      {/* Category Badge */}
      <View style={[styles.categoryBadge, { backgroundColor: categoryConfig.color }]}>
        <Icon name={categoryConfig.icon} size={16} color="#FFFFFF" />
        <Text style={styles.categoryBadgeText}>{categoryConfig.name}</Text>
      </View>

      <Text style={styles.productName}>{String(product.title || '')}</Text>
      <Text style={styles.productDescription}>{String(product.description || '')}</Text>
      
      {/* Prescription Required Warning */}
      {categoryConfig.requiresPrescription && (
        <View style={styles.prescriptionWarning}>
          <Icon name="file-document" size={20} color="#FF6B35" />
          <Text style={styles.prescriptionText}>Prescription Required</Text>
        </View>
      )}

      <View style={styles.shopInfo}>
        <Image
          source={{ uri: product.restaurant?.image }}
          style={styles.shopImage}
        />
        <View style={styles.shopDetails}>
          <Text style={styles.shopName}>{String(product.restaurant?.name || 'Shop')}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{String(product.restaurant?.rating || '4.2')}</Text>
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
    if (attributes.organic) features.push({ icon: 'leaf', text: 'Organic', color: '#4CAF50' });
    if (attributes.warranty) features.push({ icon: 'shield-check', text: 'Warranty', color: '#2196F3' });
    if (attributes.requiresPrescription || categoryConfig.requiresPrescription) features.push({ icon: 'file-document', text: 'Rx Required', color: '#FF6B35' });
    if (attributes.freeShipping) features.push({ icon: 'truck-fast', text: 'Free Shipping', color: '#9C27B0' });
    if (attributes.inStock !== false && !product.isOutOfStock) features.push({ icon: 'check-circle', text: 'In Stock', color: '#4CAF50' });
    if (attributes.assemblyRequired) features.push({ icon: 'tools', text: 'Assembly Required', color: '#FF9800' });

    if (features.length === 0) return null;

    return (
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={[styles.featureBadge, { borderColor: feature.color }]}>
            <Icon name={feature.icon} size={16} color={feature.color} />
            <Text style={[styles.featureText, { color: feature.color }]}>{feature.text}</Text>
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
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => toggleSection('specifications')}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Icon name="information-outline" size={24} color={categoryConfig.color} />
            <Text style={styles.sectionTitle}>Product Information</Text>
          </View>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#6C757D" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.collapsibleContent}>
            {fieldsToShow.map(field => {
              const value = attributes[field];
              if (!value) return null;

              // Handle array values
              const displayValue = Array.isArray(value) ? value.join(', ') : String(value);

              return (
                <View key={field} style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Icon name={getFieldIcon(field)} size={20} color={categoryConfig.color} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{getFieldLabel(field)}</Text>
                    <Text style={styles.infoValue}>{displayValue}</Text>
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
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => toggleSection('similar')}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Icon name="shopping" size={24} color={categoryConfig.color} />
            <Text style={styles.sectionTitle}>Similar Products</Text>
          </View>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#6C757D" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.collapsibleContent}>
            <Text style={styles.placeholderText}>
              Similar products in {categoryConfig.name} category will appear here
            </Text>
            <TouchableOpacity 
              style={styles.viewCategoryButton}
              onPress={() => navigation.navigate('CategoryHome', { 
                category: product.category 
              })}
            >
              <Text style={styles.viewCategoryButtonText}>
                View All {categoryConfig.name} Products
              </Text>
              <Icon name="arrow-right" size={20} color="#FFFFFF" />
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
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => toggleSection('reviews')}
        >
          <View style={styles.collapsibleHeaderLeft}>
            <Icon name="star" size={24} color="#FFD700" />
            <Text style={styles.sectionTitle}>
              Reviews {reviewCount > 0 && `(${reviewCount})`}
            </Text>
          </View>
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#6C757D" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.collapsibleContent}>
            {reviewCount === 0 ? (
              <Text style={styles.placeholderText}>
                No reviews yet. Be the first to review this product!
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                Reviews will be displayed here
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderVariations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Size</Text>
      {product.variations?.map((v) => (
        <TouchableOpacity
          key={v.id || v._id}
          style={[
            styles.variationItem,
            selectedVariation?.id === v.id && styles.selectedVariationItem,
          ]}
          onPress={() => setSelectedVariation(v)}
        >
          <View style={styles.variationInfo}>
            <Text style={styles.variationTitle}>{String(v.title || '')}</Text>
            {v.discounted && (
              <Text style={styles.originalPrice}>{`ETB ${v.price.toFixed(2)}`}</Text>
            )}
          </View>
          <Text style={styles.variationPrice}>
            {`ETB ${(v.discounted || v.price).toFixed(2)}`}
          </Text>
          <View style={[
            styles.radioButton,
            selectedVariation?.id === v.id && styles.radioButtonSelected,
          ]} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAddons = () => {
    if (!variation?.addons || variation.addons.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add-ons</Text>
        {variation.addons.map((addon) => (
          <View key={addon.id || addon._id} style={styles.addonGroup}>
            <Text style={styles.addonTitle}>{String(addon.title || '')}</Text>
            <Text style={styles.addonDescription}>
              {String(addon.description || `Select up to ${addon.quantityMaximum} options`)}
            </Text>
            
            {addon.options?.map((option) => (
              <TouchableOpacity
                key={option.id || option._id}
                style={styles.addonOption}
                onPress={() => handleAddonToggle(addon, option)}
              >
                <View style={styles.addonOptionInfo}>
                  <Text style={styles.addonOptionTitle}>{String(option.title || '')}</Text>
                  {option.description && (
                    <Text style={styles.addonOptionDescription}>
                      {String(option.description)}
                    </Text>
                  )}
                </View>
                <Text style={styles.addonOptionPrice}>
                  {`+ETB ${option.price.toFixed(2)}`}
                </Text>
                <View style={[
                  styles.checkbox,
                  isAddonOptionSelected(addon.id || addon._id, option.id || option._id) &&
                    styles.checkboxSelected,
                ]}>
                  {isAddonOptionSelected(addon.id || addon._id, option.id || option._id) && (
                    <Icon name="check" size={16} color="#FFFFFF" />
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
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Special Instructions</Text>
      <TextInput
        style={styles.instructionsInput}
        placeholder="Any special requests? (e.g., no onions, extra spicy)"
        placeholderTextColor="#A8DADC"
        value={specialInstructions}
        onChangeText={setSpecialInstructions}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderQuantitySelector = () => (
    <View style={styles.quantitySection}>
      <Text style={styles.sectionTitle}>Quantity</Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => setQuantity(Math.max(1, quantity - 1))}
        >
          <Icon name="minus" size={20} color="#1D3557" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{String(quantity)}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => setQuantity(quantity + 1)}
        >
          <Icon name="plus" size={20} color="#1D3557" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{`ETB ${calculateTotal().toFixed(2)}`}</Text>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Icon name="cart-plus" size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  productInfo: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  prescriptionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  prescriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 16,
    color: '#6C757D',
    lineHeight: 24,
    marginBottom: 16,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  shopImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
  },
  section: {
    padding: 16,
    borderTopWidth: 8,
    borderTopColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 12,
  },
  variationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedVariationItem: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  variationInfo: {
    flex: 1,
  },
  variationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#6C757D',
    textDecorationLine: 'line-through',
  },
  variationPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginRight: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  radioButtonSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  addonGroup: {
    marginBottom: 16,
  },
  addonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  addonDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  addonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  addonOptionInfo: {
    flex: 1,
  },
  addonOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D3557',
  },
  addonOptionDescription: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  addonOptionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  instructionsInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1D3557',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  quantitySection: {
    padding: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginHorizontal: 24,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: '#1D3557',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collapsibleContent: {
    paddingTop: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  viewCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  viewCategoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default ProductDetailScreen;
