import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { GET_RESTAURANT, GET_FOODS } from '../api/queries';
import { setSelectedRestaurant } from '../store/restaurantSlice';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const RestaurantScreen = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const { restaurant: initialRestaurant } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch restaurant details
  const { data: restaurantData } = useQuery(GET_RESTAURANT, {
    variables: { id: initialRestaurant.id },
    onCompleted: (data) => {
      if (data.restaurant) {
        dispatch(setSelectedRestaurant(data.restaurant));
      }
    },
  });

  // Fetch restaurant foods
  const { data: foodsData } = useQuery(GET_FOODS, {
    variables: { restaurant: initialRestaurant.id },
  });

  const restaurant = restaurantData?.restaurant || initialRestaurant;
  const foods = foodsData?.foods || [];

  // Group foods by category
  const foodsByCategory = foods.reduce((acc, food) => {
    const categoryName = food.category.title;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(food);
    return acc;
  }, {});

  const categories = Object.keys(foodsByCategory);
  const filteredFoods = selectedCategory ? foodsByCategory[selectedCategory] : foods;

  const renderHeader = () => (
    <View style={s.header}>
      <Image source={{ uri: restaurant.image }} style={s.restaurantImage} />
      <View style={s.headerOverlay}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        <TouchableOpacity style={s.favoriteButton}>
          <Icon name="heart-outline" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRestaurantInfo = () => (
    <View style={s.restaurantInfo}>
      <Text style={s.restaurantName}>{restaurant.name}</Text>
      <Text style={s.restaurantCuisine}>{restaurant.shopType}</Text>

      <View style={s.restaurantMeta}>
        <View style={s.ratingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={s.ratingText}>{String(restaurant.rating || '4.2')}</Text>
          <Text style={s.reviewCount}>{`(${restaurant.reviewCount || '150'} reviews)`}</Text>
        </View>
        <Text style={s.deliveryTime}>{`${restaurant.deliveryTime || '25-35'} min`}</Text>
        <Text style={s.minOrder}>{`Min PKR ${restaurant.minimumOrder || '15'}`}</Text>
      </View>

      <Text style={s.restaurantDescription}>
        {restaurant.description || 'Quality products from a trusted shop.'}
      </Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={s.searchContainer}>
      <Icon name="magnify" size={20} color={colors.textSecondary} style={s.searchIcon} />
      <TextInput
        style={s.searchInput}
        placeholder="Search products..."
        placeholderTextColor={colors.inputPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.categoriesScroll}
      contentContainerStyle={s.categoriesContainer}
    >
      <TouchableOpacity
        style={[
          s.categoryTab,
          !selectedCategory && s.selectedCategoryTab,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text style={[
          s.categoryTabText,
          !selectedCategory && s.selectedCategoryTabText,
        ]}>
          All
        </Text>
      </TouchableOpacity>

      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            s.categoryTab,
            selectedCategory === category && s.selectedCategoryTab,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            s.categoryTabText,
            selectedCategory === category && s.selectedCategoryTabText,
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={s.foodItem}
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
    >
      <Image source={{ uri: item.image }} style={s.foodImage} />
      <View style={s.foodInfo}>
        <Text style={s.foodName} numberOfLines={2}>{item.title}</Text>
        <Text style={s.foodDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={s.foodPrice}>
          PKR {item.variations?.[0]?.price || '12.99'}
          {item.variations?.[0]?.discounted && (
            <Text style={s.foodOriginalPrice}>
              PKR {(item.variations[0].price * 1.2).toFixed(2)}
            </Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
  const s = styles(colors, typography, scale);


  return (
    <SafeAreaView style={s.container}>
      {renderHeader()}

      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {renderRestaurantInfo()}
        {renderSearchBar()}
        {renderCategoryTabs()}

        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderFoodItem}
          scrollEnabled={false}
          contentContainerStyle={s.foodsContainer}
        />
      </ScrollView>
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
  restaurantImage: {
    width: '100%',
    height: Math.round(200 * scale),
    resizeMode: 'cover',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(50 * scale),
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginTop: Math.round(-20 * scale),
    backgroundColor: colors.surface,
    borderTopLeftRadius: Math.round(20 * scale),
    borderTopRightRadius: Math.round(20 * scale),
  },
  restaurantInfo: {
    padding: Math.round(16 * scale),
  },
  restaurantName: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  restaurantCuisine: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Math.round(12 * scale),
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    marginLeft: Math.round(4 * scale),
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(4 * scale),
  },
  deliveryTime: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  minOrder: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  restaurantDescription: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    paddingHorizontal: Math.round(16 * scale),
    marginHorizontal: Math.round(16 * scale),
    marginBottom: Math.round(16 * scale),
    height: Math.round(44 * scale),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: Math.round(12 * scale),
  },
  searchInput: {
    flex: 1,
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
  },
  categoriesScroll: {
    marginBottom: Math.round(16 * scale),
  },
  categoriesContainer: {
    paddingHorizontal: Math.round(16 * scale),
  },
  categoryTab: {
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(8 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(20 * scale),
    marginRight: Math.round(8 * scale),
  },
  selectedCategoryTab: {
    backgroundColor: colors.accent,
  },
  categoryTabText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedCategoryTabText: {
    color: colors.textInverse,
  },
  foodsContainer: {
    paddingHorizontal: Math.round(16 * scale),
  },
  foodItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(12 * scale),
    marginBottom: Math.round(12 * scale),
  },
  foodImage: {
    width: Math.round(80 * scale),
    height: Math.round(80 * scale),
    borderRadius: Math.round(8 * scale),
    marginRight: Math.round(12 * scale),
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  foodDescription: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
  },
  foodPrice: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  foodOriginalPrice: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginLeft: Math.round(8 * scale),
  },
});

export default RestaurantScreen;