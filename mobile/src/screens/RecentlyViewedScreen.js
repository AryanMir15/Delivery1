import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useQuery } from '@apollo/client';
import SessionService from '../services/SessionService';
import { GET_FOODS } from '../api/queries';

const RecentlyViewedScreen = ({ navigation }) => {
  const user = useSelector(state => state.auth.user);
  const userId = user?._id || null;

  const [recentProducts, setRecentProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const { data: productsData, loading, refetch } = useQuery(GET_FOODS);

  useEffect(() => {
    loadRecentlyViewed();
  }, [productsData, userId]);

  const loadRecentlyViewed = async () => {
    try {
      const session = await SessionService.getSessionData(userId);
      if (!session || !productsData?.foods) return;

      // Get last 20 viewed products
      const viewedIds = session.viewedProducts
        .slice(-20)
        .reverse()
        .map(v => v.productId);

      // Filter products that exist
      const products = viewedIds
        .map(id => productsData.foods.find(p => p._id === id))
        .filter(Boolean);

      setRecentProducts(products);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    await loadRecentlyViewed();
    setRefreshing(false);
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productRestaurant} numberOfLines={1}>
          {item.restaurant?.name || 'Unknown Shop'}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>
            {item.variations?.[0]?.price || 0} ETB
          </Text>
          <TouchableOpacity style={styles.viewButton}>
            <Icon name="arrow-right" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recently Viewed</Text>
        <Text style={styles.headerCount}>{recentProducts.length}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : recentProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="history" size={80} color="#A8DADC" />
          <Text style={styles.emptyTitle}>No Recent Views</Text>
          <Text style={styles.emptyText}>
            Products you view will appear here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B35']}
            />
          }
        />
      )}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  headerCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    minWidth: 40,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  productRestaurant: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecentlyViewedScreen;
