import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useQuery } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Circle, Path } from 'react-native-svg';

import { GET_RESTAURANT, GET_FOODS, GET_REVIEWS } from '../api/queries';
import { palette } from '../theme/colors';
import ShokLogo from '../components/ShokLogo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.92;

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

const RESTAURANT_IMAGES = {
  'Shah Biryani House': require('../../assets/banners/Biryani-banner.png'),
  'Khan BBQ Corner': require('../../assets/banners/BBQ-banner.png'),
  'Green Valley Fast Food': require('../../assets/banners/Chichen-banner.png'),
};

const RestaurantSheet = ({ navigation, route }) => {
  const { restaurant: initialRestaurant } = route.params;
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showReviews, setShowReviews] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 90,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.goBack());
  };

  const { data: restaurantData } = useQuery(GET_RESTAURANT, {
    variables: { id: initialRestaurant._id || initialRestaurant.id },
  });

  const { data: foodsData } = useQuery(GET_FOODS, {
    variables: { restaurant: initialRestaurant._id || initialRestaurant.id },
  });

  const { data: reviewsData } = useQuery(GET_REVIEWS, {
    variables: { shop: initialRestaurant._id || initialRestaurant.id, limit: 5 },
  });

  const restaurant = restaurantData?.restaurant || initialRestaurant;
  const foods = foodsData?.foods || [];
  const reviews = reviewsData?.reviews || [];

  const shopImage = RESTAURANT_IMAGES[restaurant.name] || (restaurant.image ? { uri: restaurant.image } : null);

  const foodsByCategory = {};
  foods.forEach(food => {
    const cat = food.category?.title || 'Other';
    if (!foodsByCategory[cat]) foodsByCategory[cat] = [];
    foodsByCategory[cat].push(food);
  });
  const categories = Object.keys(foodsByCategory);
  const displayedFoods = selectedCategory ? foodsByCategory[selectedCategory] || [] : foods;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handleBarWrap}>
          <View style={styles.handleBar} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Banner */}
          <View style={styles.bannerWrap}>
            {shopImage ? (
              <Image source={shopImage} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Icon name="store" size={40} color={palette.gray600} />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.bannerGradient}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Icon name="close" size={20} color={palette.silver} />
            </TouchableOpacity>
            <View style={styles.bannerBottom}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.locationRow}>
                <Icon name="map-marker-outline" size={13} color={palette.gray400} />
                <Text style={styles.locationText} numberOfLines={1}>{restaurant.address}</Text>
              </View>
            </View>
          </View>

          {/* Info Pills */}
          <View style={styles.infoPills}>
            <View style={styles.pill}>
              <Icon name="star" size={14} color="#E5A100" />
              <Text style={styles.pillText}>{restaurant.rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.pillSub}>({restaurant.reviewCount || 0})</Text>
            </View>
            <View style={styles.pillDot} />
            <View style={styles.pill}>
              <Icon name="clock-outline" size={14} color={palette.gray400} />
              <Text style={styles.pillText}>{restaurant.deliveryTime || 30} min</Text>
            </View>
            <View style={styles.pillDot} />
            <View style={styles.pill}>
              <Icon name="basket-outline" size={14} color={palette.gray400} />
              <Text style={styles.pillText}>Min {restaurant.minimumOrder || 0} PKR</Text>
            </View>
          </View>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsContainer}
            >
              <TouchableOpacity
                style={[styles.tab, !selectedCategory && styles.tabActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.tabText, !selectedCategory && styles.tabTextActive]}>All</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tab, selectedCategory === cat && styles.tabActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.tabText, selectedCategory === cat && styles.tabTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Food Grid */}
          <View style={styles.foodSection}>
            <Text style={styles.sectionTitle}>{selectedCategory || 'All Items'}</Text>
            <View style={styles.foodGrid}>
              {displayedFoods.map(item => {
                const available = item.isOutOfStock !== true;
                return (
                  <TouchableOpacity
                    key={String(item._id || item.id)}
                    style={[styles.foodCard, !available && styles.foodCardUnavailable]}
                    onPress={() => navigation.navigate('FoodDetail', { food: item })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.foodImageWrap}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.foodImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.foodImagePlaceholder}>
                          <Icon name="food" size={24} color={palette.gray600} />
                        </View>
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)']}
                        style={styles.foodGradient}
                      />
                      <TouchableOpacity style={styles.foodHeartBtn} activeOpacity={0.7}>
                        <Icon name="heart-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <View style={styles.foodLogoBadge}>
                        <ShokLogo size={36} />
                      </View>
                      {!available && (
                        <View style={styles.soldOutBadge}>
                          <Text style={styles.soldOutText}>Sold Out</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.foodShopRow}>
                        <Icon name="store-outline" size={10} color={palette.gray500} />
                        <Text style={styles.foodShop} numberOfLines={1}>{item.description}</Text>
                      </View>
                      <View style={styles.foodBottom}>
                        <View style={styles.foodPriceTag}>
                          <Text style={styles.foodPrice}>{item.variations?.[0]?.price || '0'}</Text>
                          <Text style={styles.foodCurrency}>PKR</Text>
                        </View>
                        {available && (
                          <View style={styles.foodAddBtn}>
                            <Text style={styles.foodAddText}>Add</Text>
                            <Icon name="plus" size={12} color="#fff" />
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <TouchableOpacity
              style={styles.reviewsHeader}
              onPress={() => setShowReviews(!showReviews)}
              activeOpacity={0.7}
            >
              <View style={styles.reviewsHeaderLeft}>
                <Icon name="message-text-outline" size={18} color={palette.silver} />
                <Text style={styles.reviewsTitle}>Reviews</Text>
                <Text style={styles.reviewsCount}>({restaurant.reviewCount || reviews.length})</Text>
              </View>
              <Icon name={showReviews ? 'chevron-up' : 'chevron-down'} size={20} color={palette.gray500} />
            </TouchableOpacity>

            {showReviews && (
              <View style={styles.reviewsList}>
                {reviews.length === 0 ? (
                  <View style={styles.noReviews}>
                    <Icon name="message-text-lock-outline" size={28} color={palette.gray600} />
                    <Text style={styles.noReviewsText}>No reviews yet</Text>
                  </View>
                ) : (
                  reviews.map(review => (
                    <View key={String(review._id || review.id)} style={styles.reviewCard}>
                      <View style={styles.reviewTop}>
                        <View style={styles.reviewAvatar}>
                          <Icon name="account" size={18} color={palette.gray500} />
                        </View>
                        <View style={styles.reviewAuthor}>
                          <Text style={styles.reviewName}>{review.user?.name || 'User'}</Text>
                          <Text style={styles.reviewDate}>
                            {review.createdAt ? new Date(parseInt(review.createdAt)).toLocaleDateString() : ''}
                          </Text>
                        </View>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Icon
                              key={String(star)}
                              name={star <= (review.rating || 0) ? 'star' : 'star-outline'}
                              size={12}
                              color="#E5A100"
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{review.review}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Banner
  bannerWrap: {
    position: 'relative',
    height: 220,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerBottom: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: palette.gray400,
    flex: 1,
  },

  // Info Pills
  infoPills: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.silver,
  },
  pillSub: {
    fontSize: 12,
    color: palette.gray500,
  },
  pillDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: palette.gray600,
  },

  // Tabs
  tabsScroll: {
    marginTop: 16,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  tabActive: {
    backgroundColor: '#E85D3A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.gray400,
  },
  tabTextActive: {
    color: '#fff',
  },

  // Food Grid
  foodSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.silver,
    marginBottom: 12,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  foodCard: {
    width: (Dimensions.get('window').width - 42) / 2,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  foodCardUnavailable: {
    opacity: 0.5,
  },
  foodImageWrap: {
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: 130,
  },
  foodImagePlaceholder: {
    width: '100%',
    height: 130,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  foodHeartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  foodLogoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  soldOutBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E53935',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  foodInfo: {
    padding: 10,
    paddingBottom: 12,
  },
  foodName: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.silver,
    marginBottom: 3,
  },
  foodShopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  foodShop: {
    fontSize: 10,
    color: palette.gray500,
    flex: 1,
  },
  foodBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodPriceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  foodPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: palette.silver,
  },
  foodCurrency: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.gray500,
  },
  foodAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E85D3A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  foodAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Reviews
  reviewsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.silver,
  },
  reviewsCount: {
    fontSize: 13,
    color: palette.gray500,
  },
  reviewsList: {
    marginTop: 12,
    gap: 10,
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noReviewsText: {
    fontSize: 13,
    color: palette.gray500,
  },
  reviewCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewAuthor: {
    flex: 1,
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.silver,
  },
  reviewDate: {
    fontSize: 11,
    color: palette.gray500,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewText: {
    fontSize: 12,
    color: palette.gray400,
    lineHeight: 18,
  },
});

export default RestaurantSheet;
