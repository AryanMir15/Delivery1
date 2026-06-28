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

import { GET_RIDER_ORDERS } from '../../api/queries';

const OrdersScreen = ({ navigation }) => {
  const { rider } = useSelector((state) => state.auth);
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFC107';
      case 'accepted':
      case 'preparing':
        return '#2EC4B6';
      case 'ready':
      case 'picked':
        return '#17A2B8';
      case 'delivered':
        return '#28A745';
      case 'cancelled':
        return '#E63946';
      default:
        return '#6C757D';
    }
  };

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
      style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Icon
        name={icon}
        size={18}
        color={selectedFilter === filter ? '#FFFFFF' : '#6C757D'}
      />
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => {
    const earnings = calculateEarnings(item);
    const statusColor = getStatusColor(item.orderStatus);
    const statusIcon = getStatusIcon(item.orderStatus);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id || item._id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderId}>#{item.orderId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Icon name={statusIcon} size={14} color="#FFFFFF" />
              <Text style={styles.statusText}>{item.orderStatus}</Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.orderDate)}</Text>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.locationRow}>
            <Icon name="store" size={18} color="#FF6B35" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.restaurant?.name}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.restaurant?.address}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <Icon name="map-marker" size={18} color="#2EC4B6" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.user?.name || 'Customer'}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.deliveryAddress?.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderMeta}>
            <Icon name="package-variant" size={16} color="#6C757D" />
            <Text style={styles.metaText}>{item.items?.length || 0} items</Text>
          </View>
          <View style={styles.orderMeta}>
            <Icon name="cash" size={16} color="#6C757D" />
            <Text style={styles.metaText}>ETB {item.orderAmount?.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>Earned:</Text>
            <Text style={styles.earningsAmount}>ETB {earnings.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="clipboard-list-outline" size={80} color="#A8DADC" />
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'active'
          ? 'No active orders'
          : selectedFilter === 'completed'
          ? 'No completed orders'
          : 'No orders yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {selectedFilter === 'active'
          ? 'Accept orders from the home screen'
          : selectedFilter === 'completed'
          ? 'Your completed deliveries will appear here'
          : 'Your order history will appear here'}
      </Text>
    </View>
  );

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
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>ETB {totalEarnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>{orders.length} total orders</Text>
      </View>

      {renderStats()}

      <View style={styles.filterContainer}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2EC4B6']} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E9ECEF',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterButtonActive: {
    backgroundColor: '#2EC4B6',
    borderColor: '#2EC4B6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  orderDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  orderBody: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6C757D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 4,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 11,
    color: '#6C757D',
    marginBottom: 2,
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2EC4B6',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default OrdersScreen;
