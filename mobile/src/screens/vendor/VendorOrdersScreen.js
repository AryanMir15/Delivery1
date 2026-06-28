import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { GET_ORDERS_BY_RESTAURANT } from '../api/queries';
import { setOrders } from '../store/orderSlice';

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'time' },
  { key: 'active', label: 'Active', icon: 'checkmark-done' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { key: 'all', label: 'All', icon: 'list' },
];

export default function OrdersScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('pending');
  const { selectedRestaurant } = useSelector((state) => state.auth);
  const { pendingOrders, activeOrders, completedOrders, orders } = useSelector(
    (state) => state.orders
  );

  const { refetch, loading } = useQuery(GET_ORDERS_BY_RESTAURANT, {
    variables: { restaurant: selectedRestaurant?._id },
    skip: !selectedRestaurant,
    onCompleted: (data) => {
      if (data?.ordersByRestaurant) {
        dispatch(setOrders(data.ordersByRestaurant));
      }
    },
    pollInterval: 5000, // Poll every 5 seconds for new orders
  });

  const getOrdersByTab = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'active':
        return activeOrders;
      case 'completed':
        return completedOrders;
      case 'all':
        return orders;
      default:
        return [];
    }
  };

  const renderOrderCard = ({ item: order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <Text style={styles.orderCustomer}>{order.user.name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.orderStatus) },
          ]}
        >
          <Text style={styles.statusText}>
            {order.orderStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsLabel}>Items:</Text>
        {order.items.slice(0, 2).map((item, index) => (
          <Text key={index} style={styles.itemText}>
            • {item.quantity}x {item.title}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItems}>
            +{order.items.length - 2} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.paymentInfo}>
          <Ionicons
            name={order.paymentMethod === 'cash' ? 'cash' : 'card'}
            size={16}
            color="#666"
          />
          <Text style={styles.paymentText}>
            {order.paymentMethod.toUpperCase()}
          </Text>
          <View
            style={[
              styles.paymentStatus,
              {
                backgroundColor:
                  order.paymentStatus === 'paid' ? '#4CAF50' : '#FF9800',
              },
            ]}
          >
            <Text style={styles.paymentStatusText}>
              {order.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.orderAmount}>ETB {order.orderAmount.toFixed(2)}</Text>
      </View>

      <View style={styles.orderTime}>
        <Ionicons name="time-outline" size={14} color="#999" />
        <Text style={styles.timeText}>
          {new Date(order.orderDate).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? '#4CAF50' : '#999'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={getOrdersByTab()}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              Orders will appear here when customers place them
            </Text>
          </View>
        }
      />
    </View>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 5,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  listContent: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderItems: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  itemsLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  moreItems: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 3,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    fontSize: 12,
    color: '#666',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paymentStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
});
