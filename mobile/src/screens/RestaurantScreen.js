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

const RestaurantScreen = ({ navigation, route }) => {
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
    <View style={styles.header}>
      <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
      <View style={styles.headerOverlay}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.favoriteButton}>
          <Icon name="heart-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRestaurantInfo = () => (
    <View style={styles.restaurantInfo}>
      <Text style={styles.restaurantName}>{restaurant.name}</Text>
      <Text style={styles.restaurantCuisine}>{restaurant.shopType}</Text>

      <View style={styles.restaurantMeta}>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{String(restaurant.rating || '4.2')}</Text>
          <Text style={styles.reviewCount}>{`(${restaurant.reviewCount || '150'} reviews)`}</Text>
        </View>
        <Text style={styles.deliveryTime}>{`${restaurant.deliveryTime || '25-35'} min`}</Text>
        <Text style={styles.minOrder}>{`Min ETB ${restaurant.minimumOrder || '15'}`}</Text>
      </View>

      <Text style={styles.restaurantDescription}>
        {restaurant.description || 'Quality products from a trusted shop.'}
      </Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Icon name="magnify" size={20} color="#6C757D" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        placeholderTextColor="#A8DADC"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesScroll}
      contentContainerStyle={styles.categoriesContainer}
    >
      <TouchableOpacity
        style={[
          styles.categoryTab,
          !selectedCategory && styles.selectedCategoryTab,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text style={[
          styles.categoryTabText,
          !selectedCategory && styles.selectedCategoryTabText,
        ]}>
          All
        </Text>
      </TouchableOpacity>

      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryTab,
            selectedCategory === category && styles.selectedCategoryTab,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategory === category && styles.selectedCategoryTabText,
          ]}>
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
    >
      <Image source={{ uri: item.image }} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.foodDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.foodPrice}>
          ETB {item.variations?.[0]?.price || '12.99'}
          {item.variations?.[0]?.discounted && (
            <Text style={styles.foodOriginalPrice}>
              ETB {(item.variations[0].price * 1.2).toFixed(2)}
            </Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderRestaurantInfo()}
        {renderSearchBar()}
        {renderCategoryTabs()}

        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderFoodItem}
          scrollEnabled={false}
          contentContainerStyle={styles.foodsContainer}
        />
      </ScrollView>
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
  restaurantImage: {
    width: '100%',
    height: 200,
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
    paddingHorizontal: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#1D3557',
    marginLeft: 4,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 14,
    color: '#1D3557',
  },
  minOrder: {
    fontSize: 14,
    color: '#1D3557',
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1D3557',
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategoryTab: {
    backgroundColor: '#FF6B35',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  selectedCategoryTabText: {
    color: '#FFFFFF',
  },
  foodsContainer: {
    paddingHorizontal: 16,
  },
  foodItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 8,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  foodOriginalPrice: {
    fontSize: 12,
    color: '#6C757D',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
});

export default RestaurantScreen;