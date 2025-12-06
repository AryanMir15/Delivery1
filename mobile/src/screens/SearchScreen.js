import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { GET_RESTAURANTS, GET_FOODS } from '../api/queries';

const SearchScreen = ({ navigation, route }) => {
  const { category } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('restaurants'); // shops, products
  const [filteredResults, setFilteredResults] = useState([]);

  const { data: restaurantsData, loading: restaurantsLoading } = useQuery(GET_RESTAURANTS);
  const { data: foodsData, loading: foodsLoading } = useQuery(GET_FOODS);

  const restaurants = restaurantsData?.restaurants || [];
  const foods = foodsData?.foods || [];

  useEffect(() => {
    if (category && restaurants.length > 0) {
      setActiveTab('restaurants');
      const filtered = restaurants.filter((r) =>
        r.cuisines?.includes(category.name)
      );
      setFilteredResults(filtered);
    }
  }, [category?.name, restaurants.length]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    if (activeTab === 'restaurants') {
      const filtered = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.address?.toLowerCase().includes(query) ||
          r.cuisines?.some((c) => c.toLowerCase().includes(query))
      );
      setFilteredResults(filtered);
    } else {
      const filtered = foods.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query) ||
          f.category?.title.toLowerCase().includes(query)
      );
      setFilteredResults(filtered);
    }
  }, [searchQuery, activeTab, restaurants.length, foods.length]);

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#1D3557" />
      </TouchableOpacity>

      <View style={styles.searchInputContainer}>
        <Icon name="magnify" size={22} color="#FF6B35" />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'restaurants' ? 'Search shops...' : 'Search products...'}
          placeholderTextColor="#A8DADC"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color="#6C757D" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'restaurants' && styles.activeTab]}
        onPress={() => setActiveTab('restaurants')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'restaurants' && styles.activeTabText,
          ]}
        >
          Shops
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'foods' && styles.activeTab]}
        onPress={() => setActiveTab('foods')}
      >
        <Text
          style={[styles.tabText, activeTab === 'foods' && styles.activeTabText]}
        >
          Products
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantItem}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
    >
      <Image source={{ uri: item.image }} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.restaurantCuisine} numberOfLines={1}>
          {item.shopType}
        </Text>
        <View style={styles.restaurantMeta}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{String(item.rating || '4.2')}</Text>
          </View>
          <Text style={styles.deliveryTime}>
            {`${item.deliveryTime || '25-35'} min`}
          </Text>
          <Text style={styles.minOrder}>{`Min ETB ${item.minimumOrder || '15'}`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
    >
      <Image source={{ uri: item.image }} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.foodRestaurant} numberOfLines={1}>
          {item.restaurant?.name}
        </Text>
        <Text style={styles.foodDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.foodPrice}>
          {`ETB ${item.variations?.[0]?.price || '12.99'}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="magnify" size={80} color="#A8DADC" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No results found' : 'Start searching'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `Try searching for something else`
          : `Search for shops or products`}
      </Text>
    </View>
  );

  const isLoading = restaurantsLoading || foodsLoading;

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchBar()}
      {renderTabs()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id || item._id}
          renderItem={
            activeTab === 'restaurants' ? renderRestaurantItem : renderFoodItem
          }
          ListEmptyComponent={renderEmptyState()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1D3557',
    marginLeft: 12,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 15,
    color: '#6C757D',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  restaurantItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#6C757D',
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#6C757D',
  },
  minOrder: {
    fontSize: 12,
    color: '#6C757D',
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
  foodRestaurant: {
    fontSize: 12,
    color: '#FF6B35',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchScreen;
