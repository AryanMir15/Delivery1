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
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const SearchScreen = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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
    <View style={s.searchContainer}>
      <TouchableOpacity
        style={s.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={s.searchInputContainer}>
        <Icon name="magnify" size={22} color={colors.accent} />
        <TextInput
          style={s.searchInput}
          placeholder={activeTab === 'restaurants' ? 'Search shops...' : 'Search products...'}
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={s.tabContainer}>
      <TouchableOpacity
        style={[s.tab, activeTab === 'restaurants' && s.activeTab]}
        onPress={() => setActiveTab('restaurants')}
      >
        <Text
          style={[
            s.tabText,
            activeTab === 'restaurants' && s.activeTabText,
          ]}
        >
          Shops
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.tab, activeTab === 'foods' && s.activeTab]}
        onPress={() => setActiveTab('foods')}
      >
        <Text
          style={[s.tabText, activeTab === 'foods' && s.activeTabText]}
        >
          Products
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity
      style={s.restaurantItem}
      onPress={() => navigation.navigate('Restaurant', { restaurant: item })}
    >
      <Image source={{ uri: item.image }} style={s.restaurantImage} />
      <View style={s.restaurantInfo}>
        <Text style={s.restaurantName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={s.restaurantCuisine} numberOfLines={1}>
          {item.shopType}
        </Text>
        <View style={s.restaurantMeta}>
          <View style={s.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={s.ratingText}>{String(item.rating || '4.2')}</Text>
          </View>
          <Text style={s.deliveryTime}>
            {`${item.deliveryTime || '25-35'} min`}
          </Text>
          <Text style={s.minOrder}>{`Min PKR ${item.minimumOrder || '15'}`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }) => (
    <TouchableOpacity
      style={s.foodItem}
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
    >
      <Image source={{ uri: item.image }} style={s.foodImage} />
      <View style={s.foodInfo}>
        <Text style={s.foodName} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={s.foodRestaurant} numberOfLines={1}>
          {item.restaurant?.name}
        </Text>
        <Text style={s.foodDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={s.foodPrice}>
          {`PKR ${item.variations?.[0]?.price || '12.99'}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={s.emptyContainer}>
      <Icon name="magnify" size={80} color={colors.accentLight} />
      <Text style={s.emptyTitle}>
        {searchQuery ? 'No results found' : 'Start searching'}
      </Text>
      <Text style={s.emptySubtitle}>
        {searchQuery
          ? `Try searching for something else`
          : `Search for shops or products`}
      </Text>
    </View>
  );

  const isLoading = restaurantsLoading || foodsLoading;
  const s = styles(colors, typography, scale);


  return (
    <SafeAreaView style={s.container}>
      {renderSearchBar()}
      {renderTabs()}

      {isLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
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
          contentContainerStyle={s.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(12 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(12 * scale),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Math.round(16 * scale),
    paddingHorizontal: Math.round(16 * scale),
    height: Math.round(50 * scale),
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    marginLeft: Math.round(12 * scale),
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginVertical: Math.round(16 * scale),
    borderRadius: Math.round(16 * scale),
    padding: Math.round(6 * scale),
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Math.round(12 * scale),
    borderRadius: Math.round(12 * scale),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: Math.round(15 * scale),
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: Math.round(16 * scale),
    paddingBottom: Math.round(16 * scale),
  },
  restaurantItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(12 * scale),
    marginBottom: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantImage: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
    borderRadius: Math.round(8 * scale),
    marginRight: Math.round(12 * scale),
  },
  restaurantInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  restaurantCuisine: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
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
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(4 * scale),
  },
  deliveryTime: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  minOrder: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
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
  foodRestaurant: {
    fontSize: Math.round(12 * scale),
    color: colors.accent,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(32 * scale),
    paddingTop: Math.round(100 * scale),
  },
  emptyTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(8 * scale),
  },
  emptySubtitle: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
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
