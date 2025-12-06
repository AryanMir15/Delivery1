import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { GET_FOODS, GET_RESTAURANTS } from '../api/queries';
import SessionService from '../services/SessionService';
import RecommendationEngine from '../services/RecommendationEngine';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CategoryHomeScreen = ({ navigation, route }) => {
  const { category } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(20);
  
  const user = useSelector(state => state.auth.user);
  const userId = user?._id || null;

  // Fetch products with error handling
  const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery(GET_FOODS);
  const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError, refetch: refetchRestaurants } = useQuery(GET_RESTAURANTS);

  // Log errors
  useEffect(() => {
    if (productsError) {
      console.error('❌ Products Query Error:', productsError.message);
      console.error('   GraphQL Errors:', productsError.graphQLErrors);
      console.error('   Network Error:', productsError.networkError);
    }
    if (restaurantsError) {
      console.error('❌ Restaurants Query Error:', restaurantsError.message);
    }
  }, [productsError, restaurantsError]);

  // Track category view and get smart product limit
  useEffect(() => {
    const initializeSession = async () => {
      if (!userId) {
        await SessionService.initializeGuestSession();
      } else {
        await SessionService.loadUserSession(userId);
      }
    };
    initializeSession();
  }, [userId]);

  // Track category view and apply smart recommendations
  useEffect(() => {
    if (category && productsData?.foods) {
      const trackAndRecommend = async () => {
        // Track category view (non-blocking)
        SessionService.trackCategoryView(category._id, userId).catch(err =>
          console.error('Track error:', err)
        );
        
        // Get smart product recommendations for this category
        const allProducts = productsData.foods;
        
        // Filter by category - check both _id and title
        const categoryProducts = allProducts.filter(product => {
          const productCategoryId = product.category?._id || product.category;
          const productCategoryTitle = product.category?.title;
          
          return productCategoryId === category._id || 
                 productCategoryId === category.id ||
                 productCategoryTitle === category.title;
        });
        
        console.log('Category products found:', categoryProducts.length);
        
        // If we have category products, use recommendation engine
        if (categoryProducts.length > 0) {
          // Use recommendation engine in background
          RecommendationEngine.getCategoryProducts(
            category._id,
            allProducts,
            userId,
            20
          ).then(recommended => {
            setDisplayedProducts(recommended);
          }).catch(err => {
            console.error('Recommendation error:', err);
            setDisplayedProducts(categoryProducts);
          });
        } else {
          // Fallback: show all products if no category match
          console.log('No category match, showing all products');
          setDisplayedProducts(allProducts);
        }
        
        setDisplayLimit(categoryProducts.length || allProducts.length);
      };
      trackAndRecommend();
    } else if (productsData?.foods) {
      // No category selected, show all products
      console.log('No category, showing all products:', productsData.foods.length);
      setDisplayedProducts(productsData.foods);
    }
  }, [category, productsData, userId]);

  // Use displayed products from recommendations
  const filteredProducts = displayedProducts;

  // Map category titles to shopTypes
  const categoryToShopType = {
    'Shops & Products': 'restaurant',
    'Grocery & Supermarket': 'grocery',
    'Pharmacies': 'pharmacy',
    'Electronics & Gadgets': 'electronics',
    'Clothing & Fashion': 'fashion',
    'Furniture & Home': 'furniture',
    'Flowers & Gifts': 'flowers',
    'Agriculture': 'agriculture',
    'Beverages & Cafes': 'beverages',
    'Beauty & Salon': 'beauty',
    'Stationery': 'stationery',
    'Pet Supplies': 'pet_supplies',
    'Automotive': 'automotive',
    'Medical Services': 'medical',
    'Logistics': 'logistics'
  };

  // Filter vendors by category from params
  const allVendors = restaurantsData?.restaurants || [];
  const shopType = category ? categoryToShopType[category.title] : null;
  const filteredVendors = category
    ? allVendors.filter(vendor =>
      vendor.shopType === shopType && vendor.isActive
    )
    : allVendors.filter(v => v.isActive);

  // Enhanced debugging
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 CategoryHomeScreen Debug:');
    console.log('   productsData:', productsData ? 'exists' : 'null');
    console.log('   productsData.foods:', productsData?.foods ? productsData.foods.length : 0);
    console.log('   displayedProducts:', displayedProducts.length);
    console.log('   filteredProducts:', filteredProducts.length);
    console.log('   filteredVendors:', filteredVendors.length);
    console.log('   category:', category?.title || 'All');
    console.log('   productsLoading:', productsLoading);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, [productsData, displayedProducts, filteredProducts, category, productsLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProducts(), refetchRestaurants()]);
    } catch (error) {
      console.log('Refresh error:', error);
    }
    setRefreshing(false);
  };



  console.log('📊 Filtered products:', filteredProducts.length);
  console.log('📊 Filtered vendors:', filteredVendors.length);



  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      await SessionService.trackSearch(query, filteredProducts.length, userId);
    }
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Icon name="magnify" size={22} color="#6C757D" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        placeholderTextColor="#A8DADC"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {searchQuery ? (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Icon name="close-circle" size={20} color="#6C757D" />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderCategoryCircle = ({ item }) => {
    const isSelected = category?._id === item._id;

    return (
      <TouchableOpacity
        style={styles.categoryCircle}
        onPress={() => navigation.navigate('CategoryHome', { category: item })}
      >
        <View style={[
          styles.circleContainer,
          { backgroundColor: item.color || '#FF6B35' },
          isSelected && styles.circleSelected
        ]}>
          <Icon name={item.icon || 'store'} size={32} color="#FFFFFF" />
          {item.requiresPrescription && (
            <View style={styles.circleBadge}>
              <Icon name="file-document" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>
        <Text style={[
          styles.circleCategoryTitle,
          isSelected && styles.circleCategoryTitleSelected
        ]} numberOfLines={2}>
          {item.title.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFeaturedProduct = ({ item }) => {
    const handleProductPress = async () => {
      // Track product view
      const categoryId = item.category?._id || item.category;
      await SessionService.trackProductView(item._id, categoryId, userId);
      
      navigation.navigate('FoodDetail', { food: item });
    };

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={handleProductPress}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.featuredImage}
          resizeMode="cover"
        />
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.featuredRestaurant} numberOfLines={1}>
            {item.restaurant?.name}
          </Text>
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredPrice}>
              {`${item.variations?.[0]?.price || 0} ETB`}
            </Text>
            <TouchableOpacity style={styles.addButton}>
              <Icon name="plus" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVendorCard = ({ item }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.vendorImage}
        resizeMode="cover"
      />
      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.vendorType} numberOfLines={1}>
          {item.shopType}
        </Text>
        <View style={styles.vendorMeta}>
          <View style={styles.vendorRating}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.vendorRatingText}>{String(item.rating || '4.5')}</Text>
          </View>
          <View style={styles.vendorDelivery}>
            <Icon name="clock-outline" size={14} color="#6C757D" />
            <Text style={styles.vendorDeliveryText}>{`${item.deliveryTime || '25-35'} min`}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{category?.title || 'All Categories'}</Text>
          <Text style={styles.headerSubtitle}>
            {`${filteredProducts.length} products • ${filteredVendors.length} vendors`}
          </Text>
        </View>
      </View>

      {renderSearchBar()}

      <ScrollView
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
      >
        {/* All Products Section - Grid Layout */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {category ? `${category.title} Products` : 'All Products'}
            </Text>
            <Text style={styles.productCount}>{`${filteredProducts.length} items`}</Text>
          </View>

          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item) => (
                <View key={item._id || item.id} style={styles.productGridItem}>
                  {renderFeaturedProduct({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyFeatured}>
              <Icon name="food-off" size={48} color="#A8DADC" />
              <Text style={styles.emptyFeaturedText}>
                {category ? `No ${category.title} products available` : 'No products available'}
              </Text>
            </View>
          )}
        </View>

        {/* Vendors Section */}
        <View style={styles.vendorsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {category ? `${category.title} Vendors` : 'All Vendors'}
            </Text>
            <Text style={styles.vendorCount}>{`${filteredVendors.length} vendors`}</Text>
          </View>

          {restaurantsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading vendors...</Text>
            </View>
          ) : filteredVendors.length > 0 ? (
            <View style={styles.vendorsList}>
              {filteredVendors.map((vendor) => (
                <View key={vendor._id || vendor.id}>
                  {renderVendorCard({ item: vendor })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyVendors}>
              <Icon name="store-off" size={48} color="#A8DADC" />
              <Text style={styles.emptyVendorsText}>
                {category ? `No ${category.title} vendors available` : 'No vendors available'}
              </Text>
            </View>
          )}
        </View>



        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Orders')}
            >
              <Icon name="clipboard-text" size={32} color="#FF6B35" />
              <Text style={styles.quickActionText}>My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="cart" size={32} color="#2196F3" />
              <Text style={styles.quickActionText}>Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="account" size={32} color="#4CAF50" />
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Search')}
            >
              <Icon name="magnify" size={32} color="#9C27B0" />
              <Text style={styles.quickActionText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6C757D',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1D3557',
    marginLeft: 12,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  categoriesHorizontal: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryCircle: {
    alignItems: 'center',
    marginRight: 20,
    width: 85,
  },
  categoryCardWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  categoryBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlayGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  circleBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  circleCategoryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D3557',
    textAlign: 'center',
    lineHeight: 14,
  },
  circleContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  circleSelected: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  circleCategoryTitleSelected: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  recentOrdersSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  ordersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyOrders: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyOrdersText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 16,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderRestaurant: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  orderRestaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  orderRestaurantInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  orderRestaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  orderItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  orderItemsText: {
    fontSize: 14,
    color: '#6C757D',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  orderIdText: {
    fontSize: 12,
    color: '#6C757D',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 100,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginRight: 8,
  },
  mainScroll: {
    flex: 1,
  },
  featuredSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  productsSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  productCount: {
    fontSize: 14,
    color: '#6C757D',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  productGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F9FA',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
    height: 36,
  },
  featuredRestaurant: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 8,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6C757D',
  },
  emptyFeatured: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyFeaturedText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 12,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E63946',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 12,
  },
  // Vendors Section
  vendorsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  vendorCount: {
    fontSize: 14,
    color: '#6C757D',
  },
  vendorsList: {
    marginTop: 12,
  },
  vendorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  vendorImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  vendorInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  vendorType: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 8,
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  vendorRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D3557',
    marginLeft: 4,
  },
  vendorDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorDeliveryText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
  },
  emptyVendors: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyVendorsText: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 12,
    textAlign: 'center',
  },
});


export default CategoryHomeScreen;
