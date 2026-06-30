import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import StatusBadge from '../../components/StatusBadge';
import OrdersIcon from '../../components/OrdersIcon';
import DoorOpenIcon from '../../components/DoorOpenIcon';
import DoorClosedIcon from '../../components/DoorClosedIcon';

import { GET_ORDERS_BY_RESTAURANT, GET_RESTAURANTS_BY_OWNER, GET_FOODS } from '../../api/queries';
import { UPDATE_RESTAURANT } from '../../api/mutations';
import { setOrders } from '../../store/orderSlice';
import { setShop, toggleAvailability } from '../../store/vendorShopSlice';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale, isTablet } = useResponsive();

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const orders = useSelector((state) => state.order.orders);
  const { shop } = useSelector((state) => state.vendorShop);
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const todayOrders = orders.filter(
      (o) => new Date(o.orderDate).toDateString() === today
    );
    const yesterdayOrders = orders.filter(
      (o) => new Date(o.orderDate).toDateString() === yesterday
    );

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.orderAmount || 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.orderAmount || 0), 0);

    let revenueChange = null;
    if (yesterdayRevenue > 0) {
      revenueChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0);
      revenueChange = Number(revenueChange);
    }

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      pendingCount: orders.filter((o) => o.orderStatus === 'pending').length,
      activeCount: orders.filter((o) => ['accepted', 'preparing', 'ready'].includes(o.orderStatus)).length,
      revenueChange,
    };
  }, [orders]);

  const { data: restaurantData, refetch: refetchRestaurant } = useQuery(
    GET_RESTAURANTS_BY_OWNER,
    {
      onCompleted: (data) => {
        if (data?.restaurantsByOwner?.[0]) {
          const restaurant = data.restaurantsByOwner[0];
          setSelectedRestaurant(restaurant);
          dispatch(setShop(restaurant));
        }
      },
    }
  );

  const { data: ordersData, refetch: refetchOrders } = useQuery(
    GET_ORDERS_BY_RESTAURANT,
    {
      variables: { restaurant: selectedRestaurant?._id },
      skip: !selectedRestaurant,
      onCompleted: (data) => {
        if (data?.ordersByRestaurant) {
          dispatch(setOrders(data.ordersByRestaurant));
        }
      },
      pollInterval: 10000,
    }
  );

  const [updateRestaurant] = useMutation(UPDATE_RESTAURANT);

  const { data: foodsData } = useQuery(GET_FOODS, {
    variables: { restaurant: selectedRestaurant?._id },
    skip: !selectedRestaurant,
  });

  const outOfStockCount = useMemo(() => {
    if (!foodsData?.foods) return 0;
    return foodsData.foods.filter((f) => f.isOutOfStock).length;
  }, [foodsData]);

  const topSellers = useMemo(() => {
    if (orders.length === 0) return [];
    const itemCounts = {};
    orders.forEach((order) => {
      if (order.items) {
        order.items.forEach((item) => {
          const name = item.title || item.food?.title || 'Item';
          itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
        });
      }
    });
    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [orders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchRestaurant(), refetchOrders()]);
    setRefreshing(false);
  };

  const handleToggleAvailability = async () => {
    if (!shop) return;

    try {
      const newStatus = !shop.isAvailable;
      await updateRestaurant({
        variables: {
          id: shop._id,
          isAvailable: newStatus,
        },
      });
      dispatch(toggleAvailability());
      Alert.alert(
        'Success',
        `Shop is now ${newStatus ? 'Open' : 'Closed'}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update shop status');
    }
  };

  const s = styles(colors, typography, scale, isTablet);

  const renderComparison = () => {
    if (stats.revenueChange === null) return null;
    const isUp = stats.revenueChange > 0;
    const isDown = stats.revenueChange < 0;
    return (
      <View style={[s.comparisonBadge, isUp && s.comparisonUp, isDown && s.comparisonDown]}>
        <Ionicons
          name={isUp ? 'arrow-up' : isDown ? 'arrow-down' : 'remove'}
          size={10}
          color={isUp ? colors.statusDelivered : isDown ? colors.statusCancelled : colors.textTertiary}
        />
        <Text style={[s.comparisonText, isUp && s.comparisonTextUp, isDown && s.comparisonTextDown]}>
          {Math.abs(stats.revenueChange)}% vs yesterday
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        style={s.scrollContent}
        contentContainerStyle={s.scrollInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero Header */}
        <View style={s.hero}>
          <Text style={s.shopName}>{shop?.name || 'Your Shop'}</Text>

          <View style={s.revenueRow}>
            <Text style={s.revenueValue}>PKR {stats.todayRevenue.toLocaleString()}</Text>
            {renderComparison()}
          </View>
          <Text style={s.revenueLabel}>today's earnings</Text>

          <TouchableOpacity
            style={s.statusToggle}
            onPress={handleToggleAvailability}
          >
            {shop?.isAvailable ? (
              <DoorOpenIcon size={Math.round(20 * scale)} color={colors.statusDelivered} />
            ) : (
              <DoorClosedIcon size={Math.round(20 * scale)} color={colors.statusCancelled} />
            )}
            <Text style={[s.statusText, { color: shop?.isAvailable ? colors.statusDelivered : colors.statusCancelled }]}>
              {shop?.isAvailable ? 'Open' : 'Closed'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.todayOrders}</Text>
            <Text style={s.statLabel}>Orders</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.pendingCount}</Text>
            <Text style={s.statLabel}>Pending</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{stats.activeCount}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
        </View>

        {/* Top Products */}
        {topSellers.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Top Products</Text>
              <Ionicons name="trophy" size={Math.round(16 * scale)} color={colors.accent} />
            </View>
            {topSellers.map(([name, count], index) => (
              <View
                key={name}
                style={[s.productRow, index < topSellers.length - 1 && s.productRowBorder]}
              >
                <View style={[s.rankBadge, index === 0 && s.rankBadgeGold]}>
                  <Text style={[s.rankText, index === 0 && s.rankTextGold]}>{index + 1}</Text>
                </View>
                <Text style={s.productName} numberOfLines={1}>{name}</Text>
                <Text style={s.productCount}>{count}x</Text>
              </View>
            ))}
          </View>
        )}

        {/* Out of Stock Warning */}
        {outOfStockCount > 0 && (
          <View style={s.section}>
            <View style={s.outOfStockBanner}>
              <Ionicons name="alert-circle" size={Math.round(18 * scale)} color={colors.statusCancelled} />
              <Text style={s.outOfStockText}>
                {outOfStockCount} item{outOfStockCount !== 1 ? 's' : ''} out of stock
              </Text>
            </View>
          </View>
        )}

        {/* Recent Orders */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity style={s.seeAllBtn} onPress={() => navigation.navigate('Orders')}>
              <Text style={s.seeAllText}>See All</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {ordersData?.ordersByRestaurant?.slice(0, 5).map((order, index) => (
            <TouchableOpacity
              key={order._id}
              style={[s.orderCard, index === 0 && s.orderCardTop]}
              onPress={() =>
                navigation.navigate('Orders', {
                  screen: 'OrderDetail',
                  params: { orderId: order._id },
                })
              }
            >
              <View style={s.orderLeft}>
                <View style={s.orderIdRow}>
                  {index === 0 && (
                    <Ionicons name="trophy" size={Math.round(14 * scale)} color={colors.accent} style={{ marginRight: 4 }} />
                  )}
                  <Text style={s.orderId}>#{order.orderId}</Text>
                </View>
                <Text style={s.orderCustomer}>{order.user.name}</Text>
              </View>
              <View style={s.orderRight}>
                <StatusBadge status={order.orderStatus} />
                <Text style={s.orderAmount}>PKR {order.orderAmount}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {(!ordersData?.ordersByRestaurant ||
            ordersData.ordersByRestaurant.length === 0) && (
            <View style={s.emptyState}>
              <OrdersIcon size={48} color={colors.textTertiary} />
              <Text style={s.emptyText}>No orders yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale, isTablet) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 40 * scale,
    maxWidth: isTablet ? 720 : undefined,
    alignSelf: isTablet ? 'center' : undefined,
    width: isTablet ? '100%' : undefined,
  },
  // Hero Header
  hero: {
    alignItems: 'center',
    paddingVertical: 32 * scale,
    paddingHorizontal: 20 * scale,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    position: 'relative',
    elevation: 6,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  shopName: {
    fontSize: Math.round(26 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14 * scale,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  revenueValue: {
    fontSize: Math.round(36 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  revenueLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: 4,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  comparisonUp: {
    backgroundColor: `${colors.statusDelivered}18`,
  },
  comparisonDown: {
    backgroundColor: `${colors.statusCancelled}18`,
  },
  comparisonText: {
    fontSize: Math.round(12 * scale),
    fontWeight: '600',
    color: colors.textTertiary,
  },
  comparisonTextUp: {
    color: colors.statusDelivered,
  },
  comparisonTextDown: {
    color: colors.statusCancelled,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 18,
    right: 20,
  },
  statusText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16 * scale,
    marginTop: 16 * scale,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 22 * scale,
    paddingHorizontal: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  // Top Products
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12 * scale,
    paddingHorizontal: 4,
    gap: 12,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeGold: {
    backgroundColor: `${colors.accent}20`,
  },
  rankText: {
    fontSize: Math.round(13 * scale),
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  rankTextGold: {
    color: colors.accent,
  },
  productName: {
    flex: 1,
    fontSize: Math.round(15 * scale),
    fontWeight: '500',
    color: colors.textPrimary,
  },
  productCount: {
    fontSize: Math.round(15 * scale),
    fontWeight: '600',
    color: colors.accent,
  },
  // Out of Stock
  outOfStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.statusCancelled}12`,
    padding: 14 * scale,
    borderRadius: 12,
    gap: 10,
  },
  outOfStockText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.statusCancelled,
  },
  // Section
  section: {
    paddingHorizontal: 16 * scale,
    paddingTop: 24 * scale,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  seeAllText: {
    color: colors.accent,
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Order cards
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 18 * scale,
    borderRadius: 12,
    marginBottom: 10 * scale,
  },
  orderCardTop: {
    borderWidth: 1,
    borderColor: `${colors.accent}30`,
  },
  orderLeft: {
    flex: 1,
    marginRight: 12,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  orderCustomer: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: 3,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  orderAmount: {
    fontSize: Math.round(15 * scale),
    fontWeight: '600',
    color: colors.accent,
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    padding: 48 * scale,
  },
  emptyText: {
    marginTop: 12,
    fontSize: Math.round(16 * scale),
    color: colors.textTertiary,
  },
});
