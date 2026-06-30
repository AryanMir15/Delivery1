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
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CategoryHomeScreen = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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

  const s = styles(colors, typography, scale);

  const renderSearchBar = () => (
    <View style={s.searchContainer}>
      <Icon name="magnify" size={22} color={colors.textSecondary} />
      <TextInput
        style={s.searchInput}
        placeholder="Search products..."
        placeholderTextColor={colors.accentLight}
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {searchQuery ? (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Icon name="close-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderCategoryCircle = ({ item }) => {
    const isSelected = category?._id === item._id;

    return (
      <TouchableOpacity
        style={s.categoryCircle}
        onPress={() => navigation.navigate('CategoryHome', { category: item })}
      >
        <View style={[
          s.circleContainer,
          { backgroundColor: item.color || colors.accent },
          isSelected && s.circleSelected
        ]}>
          <Icon name={item.icon || 'store'} size={32} color={colors.textInverse} />
          {item.requiresPrescription && (
            <View style={s.circleBadge}>
              <Icon name="file-document" size={10} color={colors.textInverse} />
            </View>
          )}
        </View>
        <Text style={[
          s.circleCategoryTitle,
          isSelected && s.circleCategoryTitleSelected
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
        style={s.featuredCard}
        onPress={handleProductPress}
      >
        <Image
          source={{ uri: item.image }}
          style={s.featuredImage}
          resizeMode="cover"
        />
        <View style={s.featuredInfo}>
          <Text style={s.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.featuredRestaurant} numberOfLines={1}>
            {item.restaurant?.name}
          </Text>
          <View style={s.featuredFooter}>
            <Text style={s.featuredPrice}>
              {`${item.variations?.[0]?.price || 0} PKR`}
            </Text>
            <TouchableOpacity style={s.addButton}>
              <Icon name="plus" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVendorCard = ({ item }) => (
    <TouchableOpacity
      style={s.vendorCard}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
    >
      <Image
        source={{ uri: item.image }}
        style={s.vendorImage}
        resizeMode="cover"
      />
      <View style={s.vendorInfo}>
        <Text style={s.vendorName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={s.vendorType} numberOfLines={1}>
          {item.shopType}
        </Text>
        <View style={s.vendorMeta}>
          <View style={s.vendorRating}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={s.vendorRatingText}>{String(item.rating || '4.5')}</Text>
          </View>
          <View style={s.vendorDelivery}>
            <Icon name="clock-outline" size={14} color={colors.textSecondary} />
            <Text style={s.vendorDeliveryText}>{`${item.deliveryTime || '25-35'} min`}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.headerContent}>
          <Text style={s.headerTitle}>{category?.title || 'All Categories'}</Text>
          <Text style={s.headerSubtitle}>
            {`${filteredProducts.length} products • ${filteredVendors.length} vendors`}
          </Text>
        </View>
      </View>

      {renderSearchBar()}

      <ScrollView
        style={s.mainScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
        }
      >
        {/* All Products Section - Grid Layout */}
        <View style={s.productsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              {category ? `${category.title} Products` : 'All Products'}
            </Text>
            <Text style={s.productCount}>{`${filteredProducts.length} items`}</Text>
          </View>

          {productsLoading ? (
            <View style={s.loadingContainer}>
              <Text style={s.loadingText}>Loading products...</Text>
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={s.productsGrid}>
              {filteredProducts.map((item) => (
                <View key={item._id || item.id} style={s.productGridItem}>
                  {renderFeaturedProduct({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={s.emptyFeatured}>
              <Icon name="food-off" size={48} color={colors.accentLight} />
              <Text style={s.emptyFeaturedText}>
                {category ? `No ${category.title} products available` : 'No products available'}
              </Text>
            </View>
          )}
        </View>

        {/* Vendors Section */}
        <View style={s.vendorsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              {category ? `${category.title} Vendors` : 'All Vendors'}
            </Text>
            <Text style={s.vendorCount}>{`${filteredVendors.length} vendors`}</Text>
          </View>

          {restaurantsLoading ? (
            <View style={s.loadingContainer}>
              <Text style={s.loadingText}>Loading vendors...</Text>
            </View>
          ) : filteredVendors.length > 0 ? (
            <View style={s.vendorsList}>
              {filteredVendors.map((vendor) => (
                <View key={vendor._id || vendor.id}>
                  {renderVendorCard({ item: vendor })}
                </View>
              ))}
            </View>
          ) : (
            <View style={s.emptyVendors}>
              <Icon name="store-off" size={48} color={colors.accentLight} />
              <Text style={s.emptyVendorsText}>
                {category ? `No ${category.title} vendors available` : 'No vendors available'}
              </Text>
            </View>
          )}
        </View>



        {/* Quick Actions */}
        <View style={s.quickActionsSection}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickActionsGrid}>
            <TouchableOpacity
              style={s.quickActionCard}
              onPress={() => navigation.navigate('Orders')}
            >
              <Icon name="clipboard-text" size={32} color={colors.accent} />
              <Text style={s.quickActionText}>My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionCard}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="cart" size={32} color={colors.info} />
              <Text style={s.quickActionText}>Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="account" size={32} color={colors.accent} />
              <Text style={s.quickActionText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.quickActionCard}
              onPress={() => navigation.navigate('Search')}
            >
              <Icon name="magnify" size={32} color={colors.accent} />
              <Text style={s.quickActionText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(16 * scale),
    backgroundColor: colors.surface,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  userName: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(4 * scale),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Math.round(4 * scale),
  },
  locationText: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(4 * scale),
  },
  notificationButton: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: Math.round(8 * scale),
    right: Math.round(8 * scale),
    backgroundColor: colors.accent,
    borderRadius: Math.round(8 * scale),
    minWidth: Math.round(16 * scale),
    height: Math.round(16 * scale),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: Math.round(10 * scale),
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginVertical: Math.round(12 * scale),
    borderRadius: Math.round(12 * scale),
    paddingHorizontal: Math.round(16 * scale),
    height: Math.round(48 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    marginLeft: Math.round(12 * scale),
  },
  titleContainer: {
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(16 * scale),
    paddingBottom: Math.round(8 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  categoriesHorizontal: {
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(16 * scale),
  },
  categoryCircle: {
    alignItems: 'center',
    marginRight: Math.round(20 * scale),
    width: Math.round(85 * scale),
  },
  categoryCardWrapper: {
    width: Math.round(80 * scale),
    height: Math.round(80 * scale),
    borderRadius: Math.round(40 * scale),
    overflow: 'hidden',
    marginBottom: Math.round(8 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
    borderWidth: 3,
    borderColor: colors.surface,
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
    width: Math.round(50 * scale),
    height: Math.round(50 * scale),
    borderRadius: Math.round(25 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  circleBadge: {
    position: 'absolute',
    top: Math.round(5 * scale),
    right: Math.round(5 * scale),
    width: Math.round(22 * scale),
    height: Math.round(22 * scale),
    borderRadius: Math.round(11 * scale),
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  circleCategoryTitle: {
    fontSize: Math.round(11 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: Math.round(14 * scale),
  },
  circleContainer: {
    width: Math.round(80 * scale),
    height: Math.round(80 * scale),
    borderRadius: Math.round(40 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  circleSelected: {
    borderWidth: 4,
    borderColor: colors.surface,
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  circleCategoryTitleSelected: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  recentOrdersSection: {
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(24 * scale),
    paddingBottom: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ordersContainer: {
    flex: 1,
    paddingHorizontal: Math.round(16 * scale),
  },
  emptyOrders: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(60 * scale),
  },
  emptyOrdersText: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(16 * scale),
  },
  emptyOrdersSubtext: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(8 * scale),
    textAlign: 'center',
    paddingHorizontal: Math.round(32 * scale),
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    marginBottom: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.round(12 * scale),
  },
  orderRestaurant: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Math.round(12 * scale),
  },
  orderRestaurantImage: {
    width: Math.round(50 * scale),
    height: Math.round(50 * scale),
    borderRadius: Math.round(8 * scale),
    marginRight: Math.round(12 * scale),
  },
  orderRestaurantInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  orderRestaurantName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  orderDate: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  orderStatusBadge: {
    paddingHorizontal: Math.round(12 * scale),
    paddingVertical: Math.round(6 * scale),
    borderRadius: Math.round(12 * scale),
  },
  orderStatusText: {
    fontSize: Math.round(11 * scale),
    fontWeight: '600',
    color: colors.textInverse,
    textTransform: 'uppercase',
  },
  orderItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderItemsText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  orderAmount: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Math.round(12 * scale),
  },
  orderIdText: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(16 * scale),
    marginTop: Math.round(8 * scale),
    marginBottom: Math.round(100 * scale),
  },
  viewAllText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginRight: Math.round(8 * scale),
  },
  mainScroll: {
    flex: 1,
  },
  featuredSection: {
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(24 * scale),
  },
  productsSection: {
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(24 * scale),
  },
  productCount: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Math.round(8 * scale),
    justifyContent: 'space-between',
  },
  productGridItem: {
    width: '48%',
    marginBottom: Math.round(16 * scale),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
    marginBottom: Math.round(16 * scale),
  },
  seeAllText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
  },
  featuredList: {
    paddingHorizontal: Math.round(16 * scale),
  },
  featuredCard: {
    width: Math.round(160 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(16 * scale),
    marginRight: Math.round(16 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: Math.round(120 * scale),
    backgroundColor: colors.surfaceVariant,
  },
  featuredInfo: {
    padding: Math.round(12 * scale),
  },
  featuredTitle: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
    height: Math.round(36 * scale),
  },
  featuredRestaurant: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  addButton: {
    width: Math.round(28 * scale),
    height: Math.round(28 * scale),
    borderRadius: Math.round(14 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: Math.round(16 * scale),
    marginTop: Math.round(24 * scale),
    marginBottom: Math.round(24 * scale),
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Math.round(16 * scale),
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: Math.round(16 * scale),
    padding: Math.round(20 * scale),
    alignItems: 'center',
    marginBottom: Math.round(16 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: Math.round(8 * scale),
  },
  loadingContainer: {
    paddingVertical: Math.round(40 * scale),
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  emptyFeatured: {
    paddingVertical: Math.round(40 * scale),
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
  },
  emptyFeaturedText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(12 * scale),
  },
  errorContainer: {
    paddingVertical: Math.round(40 * scale),
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
  },
  errorText: {
    fontSize: Math.round(16 * scale),
    color: colors.error,
    marginTop: Math.round(12 * scale),
    marginBottom: Math.round(16 * scale),
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(24 * scale),
    paddingVertical: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
  },
  retryText: {
    color: colors.textInverse,
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: Math.round(40 * scale),
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
  },
  emptyText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(12 * scale),
  },
  // Vendors Section
  vendorsSection: {
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(24 * scale),
    paddingBottom: Math.round(24 * scale),
  },
  vendorCount: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  vendorsList: {
    marginTop: Math.round(12 * scale),
  },
  vendorCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(12 * scale),
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  vendorImage: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
    resizeMode: 'cover',
  },
  vendorInfo: {
    flex: 1,
    padding: Math.round(12 * scale),
    justifyContent: 'space-between',
  },
  vendorName: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  vendorType: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
  },
  vendorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Math.round(16 * scale),
  },
  vendorRatingText: {
    fontSize: Math.round(12 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: Math.round(4 * scale),
  },
  vendorDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorDeliveryText: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(4 * scale),
  },
  emptyVendors: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(40 * scale),
  },
  emptyVendorsText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(12 * scale),
    textAlign: 'center',
  },
});


export default CategoryHomeScreen;
