import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { GET_CATEGORIES, GET_RESTAURANTS, GET_FOODS } from '../api/queries';
import { setRestaurants, setCategories } from '../store/restaurantSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const { width } = Dimensions.get('window');

const HomeScreenSimple = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [address, setAddress] = useState('Addis Ababa, Ethiopia');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const userName = user?.name || 'Customer';

  // Fetch data with error handling
  const { data: categoriesData, error: categoriesError, refetch: refetchCategories } = useQuery(GET_CATEGORIES);
  const { data: restaurantsData, error: restaurantsError, refetch: refetchRestaurants } = useQuery(GET_RESTAURANTS);
  const { data: foodsData, error: foodsError, loading: foodsLoading, refetch: refetchFoods } = useQuery(GET_FOODS);

  // Log errors
  useEffect(() => {
    if (categoriesError) console.error('❌ Categories Error:', categoriesError.message);
    if (restaurantsError) console.error('❌ Restaurants Error:', restaurantsError.message);
    if (foodsError) console.error('❌ Foods Error:', foodsError.message);
  }, [categoriesError, restaurantsError, foodsError]);

  // Update unread count when screen is focused
  useEffect(() => {
    const checkUnreadCount = async () => {
      try {
        const hasVisited = await AsyncStorage.getItem('notificationsVisited');
        if (hasVisited === 'true') {
          setUnreadCount(0);
        } else {
          setUnreadCount(2); // Show initial count
        }
      } catch (error) {
        console.log('Error checking notifications:', error);
        setUnreadCount(2);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      checkUnreadCount();
    });

    // Check on mount
    checkUnreadCount();

    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchRestaurants(), refetchFoods()]);
    setRefreshing(false);
  };

  const categories = categoriesData?.categories?.filter(cat => cat.isActive) || [];
  const restaurants = restaurantsData?.restaurants?.filter(rest => rest.isActive) || [];
  
  const allFoods = foodsData?.foods?.filter(food => food.isActive) || [];

  // Debug logging
  useEffect(() => {
    console.log('📊 HomeScreen Data:');
    console.log('   foodsData:', foodsData ? 'exists' : 'null');
    console.log('   foods array:', foodsData?.foods ? foodsData.foods.length : 0);
    console.log('   allFoods:', allFoods.length);
    console.log('   categories:', categories.length);
    console.log('   restaurants:', restaurants.length);
  }, [foodsData, allFoods, categories, restaurants]);

  // Smart product recommendations based on user interests
  const getRecommendedProducts = () => {
    // Get user's recently viewed categories from AsyncStorage (simulated)
    // In production, this would come from user's browsing history
    
    // For now, show diverse products from different categories
    const recommended = [];
    const categoriesUsed = new Set();
    
    // Get 2 products from each category for variety
    allFoods.forEach(food => {
      const catId = food.category?._id || food.category;
      if (!categoriesUsed.has(catId) || recommended.filter(f => f.category?._id === catId).length < 2) {
        recommended.push(food);
        categoriesUsed.add(catId);
      }
    });
    
    // Shuffle and limit to 20 products
    return recommended.sort(() => 0.5 - Math.random()).slice(0, 20);
  };

  const foods = getRecommendedProducts();
  const s = styles(colors, typography, scale);


  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.greeting}>{`Hello, ${userName}! 👋`}</Text>
            <View style={s.locationContainer}>
              <Icon name="map-marker" size={16} color={colors.accent} />
              <Text style={s.locationText} numberOfLines={1}>{String(address)}</Text>
            </View>
          </View>
          
          <View style={s.headerButtons}>
            <TouchableOpacity 
              style={s.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="cart-outline" size={24} color={colors.textPrimary} />
              {cartItems.length > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{String(cartItems.length)}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={s.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell-outline" size={24} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={s.notificationBadge}>
                  <Text style={s.notificationBadgeText}>{String(unreadCount)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={s.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Icon name="magnify" size={20} color={colors.textSecondary} />
          <Text style={s.searchPlaceholder}>Search for food, groceries, medicine...</Text>
        </TouchableOpacity>

        {/* Quick Access */}
        <View style={s.quickAccessSection}>
          <TouchableOpacity
            style={s.quickAccessCard}
            onPress={() => navigation.navigate('Favorites')}
          >
            <Icon name="heart" size={28} color={colors.error} />
            <Text style={s.quickAccessText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.quickAccessCard}
            onPress={() => navigation.navigate('RecentlyViewed')}
          >
            <Icon name="history" size={28} color={colors.accent} />
            <Text style={s.quickAccessText}>Recently Viewed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.quickAccessCard}
            onPress={() => navigation.navigate('Orders')}
          >
            <Icon name="clipboard-text" size={28} color={colors.accent} />
            <Text style={s.quickAccessText}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.quickAccessCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="account" size={28} color={colors.info} />
            <Text style={s.quickAccessText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            horizontal
            keyExtractor={(item) => String(item._id || item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.categoryCard}
                onPress={() => navigation.navigate('CategoryHome', { category: item })}
              >
                <Image source={{ uri: item.image || '' }} style={s.categoryImage} />
                <Text style={s.categoryText}>{String(item.title || '')}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Top Shops */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Top Shops Near You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={s.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={restaurants.slice(0, 5)}
            horizontal
            keyExtractor={(item) => String(item._id || item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.restaurantCard}
                onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
              >
                <Image source={{ uri: item.image || '' }} style={s.restaurantImage} />
                <Text style={s.restaurantName}>{String(item.name || '')}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Recommended Products */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recommended For You</Text>
            <Text style={s.productCount}>{foods.length} items</Text>
          </View>
          <View style={s.foodsGrid}>
            {foods.map((item) => (
              <View key={String(item._id || item.id)} style={s.foodGridItem}>
                <TouchableOpacity
                  style={s.foodCard}
                  onPress={() => navigation.navigate('FoodDetail', { food: item })}
                >
                  <Image source={{ uri: item.image || '' }} style={s.foodImage} />
                  <View style={s.foodInfo}>
                    <Text style={s.foodName} numberOfLines={2}>{String(item.title || '')}</Text>
                    <Text style={s.foodRestaurant} numberOfLines={1}>{String(item.restaurant?.name || '')}</Text>
                    <Text style={s.foodPrice}>{`${item.variations?.[0]?.price || '0'} PKR`}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { 
    backgroundColor: colors.surface,
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(16 * scale),
    paddingBottom: Math.round(12 * scale),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: Math.round(24 * scale), fontWeight: 'bold', color: colors.textPrimary, marginBottom: Math.round(4 * scale) },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: Math.round(13 * scale), color: colors.textSecondary, marginLeft: Math.round(4 * scale), flex: 1 },
  headerButtons: { flexDirection: 'row' },
  cartButton: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: Math.round(8 * scale),
    right: Math.round(8 * scale),
    minWidth: Math.round(18 * scale),
    height: Math.round(18 * scale),
    borderRadius: Math.round(9 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(4 * scale),
  },
  cartBadgeText: { fontSize: Math.round(10 * scale), fontWeight: 'bold', color: colors.textInverse },
  notificationButton: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: Math.round(8 * scale),
  },
  notificationBadge: {
    position: 'absolute',
    top: Math.round(8 * scale),
    right: Math.round(8 * scale),
    minWidth: Math.round(18 * scale),
    height: Math.round(18 * scale),
    borderRadius: Math.round(9 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(4 * scale),
  },
  notificationBadgeText: { fontSize: Math.round(10 * scale), fontWeight: 'bold', color: colors.textInverse },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(14 * scale),
    marginHorizontal: Math.round(16 * scale),
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(8 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: { fontSize: Math.round(14 * scale), color: colors.textTertiary, marginLeft: Math.round(12 * scale), flex: 1 },
  quickAccessSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(16 * scale),
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(8 * scale),
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    paddingVertical: Math.round(16 * scale),
    paddingHorizontal: Math.round(8 * scale),
    marginHorizontal: Math.round(4 * scale),
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAccessText: {
    fontSize: Math.round(11 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: Math.round(8 * scale),
    textAlign: 'center',
  },
  section: { marginVertical: Math.round(16 * scale) },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Math.round(16 * scale),
    marginBottom: Math.round(12 * scale),
  },
  sectionTitle: { fontSize: Math.round(18 * scale), fontWeight: 'bold', color: colors.textPrimary },
  seeAllText: { fontSize: Math.round(14 * scale), color: colors.accent, fontWeight: '600' },
  productCount: { fontSize: Math.round(14 * scale), color: colors.textSecondary },
  categoryCard: { width: Math.round(80 * scale), marginHorizontal: Math.round(8 * scale), alignItems: 'center' },
  categoryImage: { width: Math.round(60 * scale), height: Math.round(60 * scale), borderRadius: Math.round(30 * scale) },
  categoryText: { marginTop: Math.round(4 * scale), fontSize: Math.round(12 * scale) },
  restaurantCard: { width: Math.round(150 * scale), marginHorizontal: Math.round(8 * scale) },
  restaurantImage: { width: Math.round(150 * scale), height: Math.round(100 * scale), borderRadius: Math.round(8 * scale) },
  restaurantName: { marginTop: Math.round(4 * scale), fontSize: Math.round(14 * scale) },
  foodsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Math.round(8 * scale) },
  foodGridItem: { width: '48%', marginBottom: Math.round(16 * scale), paddingHorizontal: Math.round(4 * scale) },
  foodCard: { backgroundColor: colors.surface, borderRadius: Math.round(8 * scale), overflow: 'hidden', shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  foodImage: { width: '100%', height: Math.round(120 * scale), borderRadius: Math.round(8 * scale) },
  foodInfo: { padding: Math.round(8 * scale) },
  foodName: { fontSize: Math.round(14 * scale), fontWeight: '600', marginBottom: Math.round(4 * scale) },
  foodRestaurant: { fontSize: Math.round(11 * scale), color: colors.textSecondary, marginBottom: Math.round(4 * scale) },
  foodPrice: { fontSize: Math.round(14 * scale), color: colors.accent, fontWeight: 'bold' },
});

export default HomeScreenSimple;
