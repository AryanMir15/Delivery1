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
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const RecentlyViewedScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const user = useSelector(state => state.auth.user);
  const userId = user?._id || null;

  const [recentProducts, setRecentProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const s = styles(colors, typography, scale);

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
      style={s.productCard}
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
    >
      <Image
        source={{ uri: item.image }}
        style={s.productImage}
        resizeMode="cover"
      />
      <View style={s.productInfo}>
        <Text style={s.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={s.productRestaurant} numberOfLines={1}>
          {item.restaurant?.name || 'Unknown Shop'}
        </Text>
        <View style={s.productFooter}>
          <Text style={s.productPrice}>
            {item.variations?.[0]?.price || 0} PKR
          </Text>
          <TouchableOpacity style={s.viewButton}>
            <Icon name="arrow-right" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Recently Viewed</Text>
        <Text style={s.headerCount}>{recentProducts.length}</Text>
      </View>

      {loading ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>Loading...</Text>
        </View>
      ) : recentProducts.length === 0 ? (
        <View style={s.emptyContainer}>
          <Icon name="history" size={80} color={colors.accentLight} />
          <Text style={s.emptyTitle}>No Recent Views</Text>
          <Text style={s.emptyText}>
            Products you view will appear here
          </Text>
          <TouchableOpacity
            style={s.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={s.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent]}
            />
          }
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerCount: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.accent,
    minWidth: Math.round(40 * scale),
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(32 * scale),
  },
  emptyTitle: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(24 * scale),
    marginBottom: Math.round(12 * scale),
  },
  emptyText: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: Math.round(24 * scale),
  },
  browseButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(32 * scale),
    paddingVertical: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    marginTop: Math.round(24 * scale),
  },
  browseButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
  },
  listContainer: {
    padding: Math.round(16 * scale),
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(12 * scale),
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
  },
  productInfo: {
    flex: 1,
    padding: Math.round(12 * scale),
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  productRestaurant: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  viewButton: {
    width: Math.round(36 * scale),
    height: Math.round(36 * scale),
    borderRadius: Math.round(18 * scale),
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RecentlyViewedScreen;
