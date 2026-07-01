import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { GET_CATEGORIES, GET_RESTAURANTS, GET_FOODS } from '../api/queries';
import { setRestaurants, setCategories } from '../store/restaurantSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useResponsive from '../hooks/useResponsive';
import { palette } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path } from 'react-native-svg';
import DoorOpenIcon from '../components/DoorOpenIcon';
import DoorClosedIcon from '../components/DoorClosedIcon';
import BannerCarousel from '../components/BannerCarousel';
import ShokLogo from '../components/ShokLogo';

const BANNERS = [
  { id: '1', image: require('../../assets/banners/fries-banner.png') },
  { id: '2', image: require('../../assets/banners/Pakistani-food.png') },
  { id: '3', image: require('../../assets/banners/Banner-Eggs.png') },
  { id: '4', image: require('../../assets/banners/Veggies-banner.png') },
];

const { width } = Dimensions.get('window');

const RESTAURANT_IMAGES = {
  'Shah Biryani House': require('../../assets/banners/Biryani-banner.png'),
  'Khan BBQ Corner': require('../../assets/banners/BBQ-banner.png'),
  'Green Valley Fast Food': require('../../assets/banners/Chichen-banner.png'),
};

const FEATURED_RESTAURANTS = Object.keys(RESTAURANT_IMAGES);

function isOpenNow(openingTimes) {
  if (!openingTimes || !openingTimes.length) return true;
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  const todayEntry = openingTimes.find(t => t.day === today);
  if (!todayEntry || !todayEntry.times || !todayEntry.times.length) return false;
  return todayEntry.times.some(({ startTime, endTime }) => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return mins >= start && mins <= end;
  });
}

function YummyFace({ size = 14, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M7 10c.5-1 1.5-1 2 0" />
      <Path d="M15 10c.5-1 1.5-1 2 0" />
      <Path d="M8 14q4 3 8 0" />
      <Path d="M14.5 14.5c.2 1.5.8 3.5-1.5 3.5s-2-2-2-3.5" />
      <Path d="M12.2 15.2v1.8" strokeWidth="1.5" />
    </Svg>
  );
}

function AnimatedSection({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

const CATEGORY_ICONS = {
  'Burgers':        { icon: 'hamburger',       bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/Burger-icon.jpg') },
  'Pizza':          { icon: 'pizza',           bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/Pizza-icon.jpg') },
  'Biryani':        { icon: 'rice',            bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/Biryani-icon.jpg') },
  'BBQ & Grills':   { icon: 'fire',            bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/BBQ-icon.jpg') },
  'Paratha Roll':   { icon: 'food-wrap',       bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/Paratha-roll-icon.jpg') },
  'Snacks':         { icon: 'food-drumstick',  bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/Snacks-icon.jpg') },
  'Cold Drinks':    { icon: 'cup-water',       bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/Cold-drinks-icon.jpg') },
  'Desserts':       { icon: 'cake-variant',    bg: '#111', tint: '#C0C0C0', image: require('../../assets/Icons/dessert-icon.jpg') },
};

const HomeScreenSimple = ({ navigation }) => {
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [address, setAddress] = useState('Tando Allahyar, Sindh');

  const userName = user?.name?.split(' ')[0] || 'there';

  const { data: categoriesData, refetch: refetchCategories } = useQuery(GET_CATEGORIES);
  const { data: restaurantsData, refetch: refetchRestaurants } = useQuery(GET_RESTAURANTS);
  const { data: foodsData, refetch: refetchFoods } = useQuery(GET_FOODS);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchRestaurants(), refetchFoods()]);
    setRefreshing(false);
  };

  const categories = categoriesData?.categories?.filter(cat => cat.isActive) || [];
  const restaurants = (restaurantsData?.restaurants || []).filter(
    r => r.isActive && FEATURED_RESTAURANTS.includes(r.name)
  );
  const allFoods = foodsData?.foods?.filter(food => food.isActive) || [];

  const getRecommendedProducts = () => {
    const recommended = [];
    const categoriesUsed = new Set();
    allFoods.forEach(food => {
      const catId = food.category?._id || food.category;
      if (!categoriesUsed.has(catId) || recommended.filter(f => f.category?._id === catId).length < 2) {
        recommended.push(food);
        categoriesUsed.add(catId);
      }
    });
    return recommended.sort(() => 0.5 - Math.random()).slice(0, 20);
  };

  const foods = getRecommendedProducts();
  const s = styles(scale);

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.silver}
            colors={[palette.silver]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Expansion Banner */}
        <AnimatedSection delay={0}>
          <View style={s.expansionBanner}>
            <Icon name="map-marker-radius" size={14} color="#fff" />
            <Text style={s.expansionText}>Currently available in Tando Allahyar only. Expanding soon!</Text>
          </View>
        </AnimatedSection>

        {/* Greeting + Actions */}
        <AnimatedSection delay={60}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.greeting}>Hello, {userName}!</Text>
              <View style={s.locationRow}>
                <Icon name="map-marker" size={14} color={palette.silver} />
                <Text style={s.locationText} numberOfLines={1}>{address}</Text>
                <Icon name="chevron-down" size={14} color={palette.gray500} />
              </View>
            </View>
            <View style={s.headerActions}>
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.7}>
                <Icon name="cart-outline" size={22} color={palette.silver} />
                {cartItems.length > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{cartItems.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.7}>
                <Icon name="bell-outline" size={22} color={palette.silver} />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedSection>

        {/* Search */}
        <AnimatedSection delay={80}>
          <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.7}>
            <Icon name="magnify" size={18} color={palette.gray500} />
            <Text style={s.searchPlaceholder}>Search for food, groceries...</Text>
          </TouchableOpacity>
        </AnimatedSection>

        {/* Banners */}
        <AnimatedSection delay={160}>
          <BannerCarousel
            banners={BANNERS}
            onPress={(item) => console.log('Banner pressed', item.id)}
          />
        </AnimatedSection>

        {/* Categories */}
        <AnimatedSection delay={240}>
          {categories.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Categories</Text>
              <FlatList
                data={categories.slice(0, 8)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item._id || item.id)}
                contentContainerStyle={s.categoryList}
                renderItem={({ item }) => {
                  const config = CATEGORY_ICONS[item.title] || { icon: 'food-variant', bg: '#111', tint: '#C0C0C0' };
                  return (
                    <TouchableOpacity
                      style={s.categoryCard}
                      onPress={() => navigation.navigate('CategoryHome', { category: item })}
                      activeOpacity={0.7}
                    >
                      <View style={[s.categoryIconWrap, { backgroundColor: config.bg, borderColor: config.bg }]}>
                        {config.image ? (
                          <Image source={config.image} style={s.categoryImage} />
                        ) : (
                          <Icon name={config.icon} size={26} color={config.tint} />
                        )}
                      </View>
                      <Text style={s.categoryName}>{item.title}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
        </AnimatedSection>

        {/* Top Shops */}
        <AnimatedSection delay={320}>
          {restaurants.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Popular Near You</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Search')} activeOpacity={0.7}>
                  <Text style={s.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={restaurants.slice(0, 6)}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item._id || item.id)}
                contentContainerStyle={s.shopList}
                renderItem={({ item }) => {
                  const shopImage = RESTAURANT_IMAGES[item.name] || (item.image ? { uri: item.image } : null);
                  const open = item.isAvailable !== false && isOpenNow(item.openingTimes);
                  return (
                    <TouchableOpacity
                      style={[s.shopCard, !open && s.shopCardClosed]}
                      onPress={() => navigation.navigate('RestaurantSheet', { restaurant: item })}
                      activeOpacity={0.7}
                    >
                      <View style={s.shopImageWrap}>
                        {shopImage ? (
                          <Image source={shopImage} style={s.shopImage} />
                        ) : (
                          <View style={s.shopImagePlaceholder}>
                            <Icon name="store" size={28} color={palette.gray700} />
                          </View>
                        )}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.75)']}
                          style={s.shopGradient}
                        />
                        <View style={s.shopLogoBadge}>
                          <ShokLogo size={44} />
                        </View>
                      </View>
                    <View style={s.shopInfo}>
                      <View style={s.shopInfoRow}>
                        <View style={s.shopInfoLeft}>
                          <Text style={s.shopName} numberOfLines={1}>{item.name}</Text>
                          <View style={s.shopMeta}>
                            <Icon name="star" size={12} color="#E5A100" />
                            <Text style={s.shopRating}>{item.rating?.toFixed(1) || '0.0'}</Text>
                            <Text style={s.shopDot}>·</Text>
                            <Icon name="clock-outline" size={11} color={palette.gray400} />
                            <Text style={s.shopTime}>{item.deliveryTime || 30} min</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
        </AnimatedSection>

        {/* Recommended Food */}
        <AnimatedSection delay={400}>
          {foods.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Recommended For You</Text>
              </View>
              <View style={s.productList}>
                {foods.filter(item => item.isOutOfStock !== true).map((item) => {
                  return (
                    <TouchableOpacity
                      key={String(item._id || item.id)}
                      style={s.productRow}
                      onPress={() => navigation.navigate('FoodDetail', { food: item })}
                      activeOpacity={0.7}
                    >
                      <View style={s.productImageWrap}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={s.productImage} resizeMode="cover" />
                        ) : (
                          <View style={s.productImagePlaceholder}>
                            <Icon name="food" size={22} color={palette.gray600} />
                          </View>
                        )}
                        <View style={s.productLogoBadge}>
                          <ShokLogo size={28} />
                        </View>
                      </View>
                      <View style={s.productInfo}>
                        <Text style={s.productName} numberOfLines={1}>{item.title}</Text>
                        <Text style={s.productShop} numberOfLines={1}>{item.restaurant?.name || ''}</Text>
                        <View style={s.productMeta}>
                          <Icon name="star" size={12} color="#E5A100" />
                          <Text style={s.productRating}>{item.restaurant?.rating?.toFixed(1) || '4.0'}</Text>
                          <Text style={s.productDot}>·</Text>
                          <Icon name="clock-outline" size={11} color={palette.gray500} />
                          <Text style={s.productTime}>{item.restaurant?.deliveryTime || 30} min</Text>
                        </View>
                        <Text style={s.productPrice}>{item.variations?.[0]?.price || '0'} PKR</Text>
                      </View>
                      <View style={s.productActions}>
                        <TouchableOpacity style={s.productHeartBtn} activeOpacity={0.7}>
                          <Icon name="heart-outline" size={16} color={palette.gray500} />
                        </TouchableOpacity>
                        <View style={s.productAddBtn}>
                          <Icon name="plus" size={20} color="#000" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </AnimatedSection>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.silver,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: palette.gray500,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.silver,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.black,
  },
  expansionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C62828',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  expansionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: palette.gray500,
    flex: 1,
  },
  section: {
    marginTop: 18,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: palette.silver,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.gray500,
  },

  // Categories
  categoryList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryCard: {
    alignItems: 'center',
    width: 72,
    gap: 6,
  },
  categoryIconWrap: {
    width: 67,
    height: 67,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.gray400,
    textAlign: 'center',
  },

  // Shops
  shopList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  shopCard: {
    width: Math.max(width * 0.77, 265),
    minWidth: 265,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1C1C1E',
  },
  shopCardClosed: {
    opacity: 0.7,
  },
  shopImageWrap: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 105,
  },
  shopImagePlaceholder: {
    width: '100%',
    height: 105,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  shopLogoBadge: {
    position: 'absolute',
    bottom: -22,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  shopLogoImg: {
    width: 28,
    height: 28,
  },
  shopStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  shopStatusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shopInfo: {
    padding: 12,
    paddingTop: 28,
  },
  shopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopInfoLeft: {
    flex: 1,
    marginRight: 10,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.silver,
    marginBottom: 5,
  },
  shopViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E85D3A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shopViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopRating: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.gray400,
  },
  shopDot: {
    fontSize: 12,
    color: palette.gray600,
  },
  shopTime: {
    fontSize: 12,
    color: palette.gray400,
  },

  // Product List
  productList: {
    paddingHorizontal: 16,
    gap: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  productImageWrap: {
    position: 'relative',
    width: 110,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productLogoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.silver,
    letterSpacing: 0.1,
  },
  productShop: {
    fontSize: 12,
    color: palette.gray500,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  productRating: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.silver,
  },
  productDot: {
    fontSize: 12,
    color: palette.gray600,
  },
  productTime: {
    fontSize: 12,
    color: palette.gray500,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: palette.silver,
    marginTop: 4,
  },
  productAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productActions: {
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  productHeartBtn: {
    padding: 4,
  },
});

export default HomeScreenSimple;
