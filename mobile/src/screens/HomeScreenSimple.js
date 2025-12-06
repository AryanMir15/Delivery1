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

const { width } = Dimensions.get('window');

const HomeScreenSimple = ({ navigation }) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{`Hello, ${userName}! 👋`}</Text>
            <View style={styles.locationContainer}>
              <Icon name="map-marker" size={16} color="#FF6B35" />
              <Text style={styles.locationText} numberOfLines={1}>{String(address)}</Text>
            </View>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="cart-outline" size={24} color="#1D3557" />
              {cartItems.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{String(cartItems.length)}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell-outline" size={24} color="#1D3557" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{String(unreadCount)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Icon name="magnify" size={20} color="#6C757D" />
          <Text style={styles.searchPlaceholder}>Search for food, groceries, medicine...</Text>
        </TouchableOpacity>

        {/* Quick Access */}
        <View style={styles.quickAccessSection}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('Favorites')}
          >
            <Icon name="heart" size={28} color="#E63946" />
            <Text style={styles.quickAccessText}>Favorites</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('RecentlyViewed')}
          >
            <Icon name="history" size={28} color="#2EC4B6" />
            <Text style={styles.quickAccessText}>Recently Viewed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('Orders')}
          >
            <Icon name="clipboard-text" size={28} color="#FF6B35" />
            <Text style={styles.quickAccessText}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="account" size={28} color="#457B9D" />
            <Text style={styles.quickAccessText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <FlatList
            data={categories}
            horizontal
            keyExtractor={(item) => String(item._id || item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => navigation.navigate('CategoryHome', { category: item })}
              >
                <Image source={{ uri: item.image || '' }} style={styles.categoryImage} />
                <Text style={styles.categoryText}>{String(item.title || '')}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Top Shops */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Shops Near You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={restaurants.slice(0, 5)}
            horizontal
            keyExtractor={(item) => String(item._id || item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.restaurantCard}
                onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
              >
                <Image source={{ uri: item.image || '' }} style={styles.restaurantImage} />
                <Text style={styles.restaurantName}>{String(item.name || '')}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Recommended Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <Text style={styles.productCount}>{foods.length} items</Text>
          </View>
          <View style={styles.foodsGrid}>
            {foods.map((item) => (
              <View key={String(item._id || item.id)} style={styles.foodGridItem}>
                <TouchableOpacity
                  style={styles.foodCard}
                  onPress={() => navigation.navigate('FoodDetail', { food: item })}
                >
                  <Image source={{ uri: item.image || '' }} style={styles.foodImage} />
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={2}>{String(item.title || '')}</Text>
                    <Text style={styles.foodRestaurant} numberOfLines={1}>{String(item.restaurant?.name || '')}</Text>
                    <Text style={styles.foodPrice}>{`${item.variations?.[0]?.price || '0'} ETB`}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1D3557', marginBottom: 4 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 13, color: '#6C757D', marginLeft: 4, flex: 1 },
  headerButtons: { flexDirection: 'row' },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: { fontSize: 14, color: '#ADB5BD', marginLeft: 12, flex: 1 },
  quickAccessSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAccessText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D3557',
    marginTop: 8,
    textAlign: 'center',
  },
  section: { marginVertical: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1D3557' },
  seeAllText: { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
  productCount: { fontSize: 14, color: '#6C757D' },
  categoryCard: { width: 80, marginHorizontal: 8, alignItems: 'center' },
  categoryImage: { width: 60, height: 60, borderRadius: 30 },
  categoryText: { marginTop: 4, fontSize: 12 },
  restaurantCard: { width: 150, marginHorizontal: 8 },
  restaurantImage: { width: 150, height: 100, borderRadius: 8 },
  restaurantName: { marginTop: 4, fontSize: 14 },
  foodsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  foodGridItem: { width: '48%', marginBottom: 16, paddingHorizontal: 4 },
  foodCard: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  foodImage: { width: '100%', height: 120, borderRadius: 8 },
  foodInfo: { padding: 8 },
  foodName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  foodRestaurant: { fontSize: 11, color: '#6C757D', marginBottom: 4 },
  foodPrice: { fontSize: 14, color: '#FF6B35', fontWeight: 'bold' },
});

export default HomeScreenSimple;
