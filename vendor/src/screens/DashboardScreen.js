import React, { useEffect, useState } from 'react';
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

import { GET_ORDERS_BY_RESTAURANT, GET_RESTAURANTS_BY_OWNER } from '../api/queries';
import { UPDATE_RESTAURANT } from '../api/mutations';
import { setOrders } from '../store/orderSlice';
import { setShop, toggleAvailability } from '../store/shopSlice';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { selectedRestaurant } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.orders);
  const { shop } = useSelector((state) => state.shop);
  const [refreshing, setRefreshing] = useState(false);

  const { data: restaurantData, refetch: refetchRestaurant } = useQuery(
    GET_RESTAURANTS_BY_OWNER,
    {
      onCompleted: (data) => {
        if (data?.restaurantsByOwner?.[0]) {
          dispatch(setShop(data.restaurantsByOwner[0]));
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
      pollInterval: 10000, // Poll every 10 seconds
    }
  );

  const [updateRestaurant] = useMutation(UPDATE_RESTAURANT);

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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.shopName}>{shop?.name || 'Your Shop'}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.statusButton,
            shop?.isAvailable ? styles.statusOpen : styles.statusClosed,
          ]}
          onPress={handleToggleAvailability}
        >
          <Ionicons
            name={shop?.isAvailable ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {shop?.isAvailable ? 'Open' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Ionicons name="cash-outline" size={32} color="#4CAF50" />
          <Text style={styles.statValue}>
            ETB {stats.todayRevenue.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="receipt-outline" size={32} color="#2196F3" />
          <Text style={styles.statValue}>{stats.todayOrders}</Text>
          <Text style={styles.statLabel}>Today's Orders</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={32} color="#FF9800" />
          <Text style={styles.statValue}>{stats.pendingCount}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-done-outline" size={32} color="#9C27B0" />
          <Text style={styles.statValue}>{stats.activeCount}</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Orders')}
          >
            <Ionicons name="receipt" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>View Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Products', { screen: 'ProductForm' })}
          >
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Ionicons name="fast-food" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Ionicons name="stats-chart" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {ordersData?.ordersByRestaurant?.slice(0, 5).map((order) => (
          <TouchableOpacity
            key={order._id}
            style={styles.orderCard}
            onPress={() =>
              navigation.navigate('Orders', {
                screen: 'OrderDetail',
                params: { orderId: order._id },
              })
            }
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{order.orderId}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.orderStatus) },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {order.orderStatus.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.orderCustomer}>{order.user.name}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderAmount}>ETB {order.orderAmount}</Text>
              <Text style={styles.orderTime}>
                {new Date(order.orderDate).toLocaleTimeString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {(!ordersData?.ordersByRestaurant ||
          ordersData.ordersByRestaurant.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function getStatusColor(status) {
  const colors = {
    pending: '#FF9800',
    accepted: '#2196F3',
    preparing: '#9C27B0',
    ready: '#00BCD4',
    picked: '#3F51B5',
    delivered: '#4CAF50',
    cancelled: '#F44336',
  };
  return colors[status] || '#757575';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusOpen: {
    backgroundColor: '#4CAF50',
  },
  statusClosed: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    margin: 5,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardPrimary: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
});
