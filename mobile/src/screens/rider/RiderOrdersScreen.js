import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';

import { useTheme } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import StatusBadge from '../../components/StatusBadge';
import { GET_RIDER_ORDERS } from '../../api/queries';

const OrdersScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const { user: rider } = useSelector((state) => state.auth);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, active, completed
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, refetch } = useQuery(GET_RIDER_ORDERS, {
    fetchPolicy: 'cache-and-network',
  });

  const orders = data?.ordersByRider || [];

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const getFilteredOrders = () => {
    switch (selectedFilter) {
      case 'active':
        return orders.filter(
          (order) =>
            order.orderStatus === 'accepted' ||
            order.orderStatus === 'preparing' ||
            order.orderStatus === 'ready' ||
            order.orderStatus === 'picked'
        );
      case 'completed':
        return orders.filter(
          (order) => order.orderStatus === 'delivered' || order.orderStatus === 'cancelled'
        );
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'clock-outline';
      case 'accepted':
      case 'preparing':
        return 'check-circle';
      case 'ready':
        return 'package-variant';
      case 'picked':
        return 'bike-fast';
      case 'delivered':
        return 'check-all';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Just now';
    
    // Handle both timestamp (number) and ISO string
    const date = new Date(typeof dateValue === 'string' ? dateValue : parseInt(dateValue));
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Just now';
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const calculateEarnings = (order) => {
    return (order.deliveryCharges || 0) + (order.tipping || 0);
  };

  const renderFilterButton = (filter, label, icon) => (
    <TouchableOpacity
      style={[s.filterButton, selectedFilter === filter && s.filterButtonActive]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Icon
        name={icon}
        size={18}
        color={selectedFilter === filter ? colors.surface : colors.textSecondary}
      />
      <Text
        style={[
          s.filterButtonText,
          selectedFilter === filter && s.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => {
    const earnings = calculateEarnings(item);
    const statusIcon = getStatusIcon(item.orderStatus);

    return (
      <TouchableOpacity
        style={s.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
      >
        <View style={s.orderHeader}>
          <View style={s.orderIdContainer}>
            <Text style={s.orderId}>#{item.orderId}</Text>
            <StatusBadge status={item.orderStatus} size="small" />
          </View>
          <Text style={s.orderDate}>{formatDate(item.orderDate)}</Text>
        </View>

        <View style={s.orderBody}>
          <View style={s.locationRow}>
            <Icon name="store" size={18} color={colors.warning} />
            <View style={s.locationInfo}>
              <Text style={s.locationName}>{item.restaurant?.name}</Text>
              <Text style={s.locationAddress} numberOfLines={1}>
                {item.restaurant?.address}
              </Text>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.locationRow}>
            <Icon name="map-marker" size={18} color={colors.accent} />
            <View style={s.locationInfo}>
              <Text style={s.locationName}>{item.user?.name || 'Customer'}</Text>
              <Text style={s.locationAddress} numberOfLines={1}>
                {item.deliveryAddress?.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.orderFooter}>
          <View style={s.orderMeta}>
            <Icon name="package-variant" size={16} color={colors.textSecondary} />
            <Text style={s.metaText}>{item.items?.length || 0} items</Text>
          </View>
          <View style={s.orderMeta}>
            <Icon name="cash" size={16} color={colors.textSecondary} />
            <Text style={s.metaText}>PKR {item.orderAmount?.toFixed(2)}</Text>
          </View>
          <View style={s.earningsContainer}>
            <Text style={s.earningsLabel}>Earned:</Text>
            <Text style={s.earningsAmount}>PKR {earnings.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={s.emptyContainer}>
      <Icon name="clipboard-list-outline" size={80} color={colors.accentLight} />
      <Text style={s.emptyTitle}>
        {selectedFilter === 'active'
          ? 'No active orders'
          : selectedFilter === 'completed'
          ? 'No completed orders'
          : 'No orders yet'}
      </Text>
      <Text style={s.emptySubtext}>
        {selectedFilter === 'active'
          ? 'Accept orders from the home screen'
          : selectedFilter === 'completed'
          ? 'Your completed deliveries will appear here'
          : 'Your order history will appear here'}
      </Text>
    </View>
  );

  const s = styles(colors, typography, scale);

  const renderStats = () => {
    const activeCount = orders.filter(
      (o) =>
        o.orderStatus === 'accepted' ||
        o.orderStatus === 'preparing' ||
        o.orderStatus === 'ready' ||
        o.orderStatus === 'picked'
    ).length;

    const completedCount = orders.filter((o) => o.orderStatus === 'delivered').length;

    const totalEarnings = orders
      .filter((o) => o.orderStatus === 'delivered')
      .reduce((sum, order) => sum + calculateEarnings(order), 0);

    return (
      <View style={s.statsContainer}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{activeCount}</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{completedCount}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>PKR {totalEarnings.toFixed(0)}</Text>
          <Text style={s.statLabel}>Total Earned</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Orders</Text>
        <Text style={s.subtitle}>{orders.length} total orders</Text>
      </View>

      {renderStats()}

      <View style={s.filterContainer}>
        {renderFilterButton('all', 'All', 'format-list-bulleted')}
        {renderFilterButton('active', 'Active', 'bike-fast')}
        {renderFilterButton('completed', 'Completed', 'check-all')}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id || item._id}
        renderItem={renderOrderItem}
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
        }
        contentContainerStyle={s.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(16 * scale),
    paddingBottom: Math.round(12 * scale),
  },
  title: {
    fontSize: Math.round(28 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: Math.round(16 * scale),
    paddingHorizontal: Math.round(16 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(12 * scale),
    gap: Math.round(8 * scale),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(10 * scale),
    paddingHorizontal: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterButtonText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: Math.round(6 * scale),
  },
  filterButtonTextActive: {
    color: colors.surface,
  },
  listContainer: {
    padding: Math.round(16 * scale),
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    marginBottom: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.round(12 * scale),
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(6 * scale),
  },

  orderDate: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  orderBody: {
    marginBottom: Math.round(12 * scale),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Math.round(8 * scale),
  },
  locationInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  locationName: {
    fontSize: Math.round(15 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(2 * scale),
  },
  locationAddress: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Math.round(8 * scale),
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(4 * scale),
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: Math.round(11 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(2 * scale),
  },
  earningsAmount: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Math.round(60 * scale),
    paddingHorizontal: Math.round(32 * scale),
  },
  emptyTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(8 * scale),
  },
  emptySubtext: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OrdersScreen;
