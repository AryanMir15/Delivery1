import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_ORDERS_BY_USER } from '../api/queries';
import { formatTimeAgo } from '../utils/dateFormatter';

const MyOrdersScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);

  // Query orders with real-time updates using existing query
  const { data, loading, error, refetch } = useQuery(GET_ORDERS_BY_USER, {
    pollInterval: 3000, // Update every 3 seconds
    fetchPolicy: 'network-only', // Always fetch fresh data
    onError: (error) => {
      console.log('❌ Orders Query Error:', error.message);
      if (error.networkError) {
        console.log('Network Error:', error.networkError);
      }
      if (error.graphQLErrors) {
        console.log('GraphQL Errors:', error.graphQLErrors);
      }
    },
    onCompleted: (data) => {
      console.log('✅ Orders Query Success');
      console.log('Orders count:', data?.ordersByUser?.length || 0);
      if (data?.ordersByUser) {
        console.log('First order:', data.ordersByUser[0]);
      }
    }
  });

  // Log when component mounts
  React.useEffect(() => {
    console.log('📱 MyOrdersScreen mounted');
    console.log('Loading:', loading);
    console.log('Error:', error?.message);
    console.log('Data:', data);
  }, [loading, error, data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Use imported date formatter
  const formatDateTime = (dateInput) => {
    return formatTimeAgo(dateInput);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FF9800';
      case 'accepted':
        return '#2196F3';
      case 'picked':
        return '#9C27B0';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '🔍';
      case 'accepted':
        return '✅';
      case 'picked':
        return '📦';
      case 'delivered':
        return '🎉';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Searching for Rider';
      case 'accepted':
        return 'Rider Accepted';
      case 'picked':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderOrderCard = ({ item: order }) => {
    const statusColor = getStatusColor(order.orderStatus);
    const statusIcon = getStatusIcon(order.orderStatus);
    const statusText = getStatusText(order.orderStatus);

    // Calculate total amount
    const totalAmount = (order.orderAmount || 0) + 
                       (order.deliveryCharges || 0) + 
                       (order.taxationAmount || 0) + 
                       (order.tipping || 0);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderTracking', {
          orderId: order._id,
          orderNumber: order.orderId
        })}
        activeOpacity={0.7}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderId}>Order #{order.orderId}</Text>
            <Text style={styles.orderDate}>
              {formatDateTime(order.orderDate)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIcon}>{statusIcon}</Text>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        {/* Restaurant Info */}
        {order.restaurant && (
          <View style={styles.restaurantSection}>
            <Text style={styles.restaurantIcon}>🏪</Text>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
              {order.restaurant.address && (
                <Text style={styles.restaurantAddress} numberOfLines={1}>
                  {order.restaurant.address}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.itemsLabel}>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </Text>
            {order.items.slice(0, 2).map((item, index) => (
              <Text key={index} style={styles.itemText} numberOfLines={1}>
                • {item.title || item.food?.title || 'Item'} x {item.quantity}
              </Text>
            ))}
            {order.items.length > 2 && (
              <Text style={styles.moreItems}>
                +{order.items.length - 2} more
              </Text>
            )}
          </View>
        )}

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.deliverySection}>
            <Text style={styles.deliveryIcon}>🏠</Text>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryAddress} numberOfLines={1}>
                {order.deliveryAddress.deliveryAddress}
              </Text>
              {order.deliveryAddress.details && (
                <Text style={styles.deliveryDetails} numberOfLines={1}>
                  {order.deliveryAddress.details}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Rider Info (if assigned) */}
        {order.rider && (
          <View style={styles.riderSection}>
            <Text style={styles.riderIcon}>🏍️</Text>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>Rider: {order.rider.name}</Text>
            </View>
          </View>
        )}

        {/* Order Amount */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Order Amount:</Text>
            <Text style={styles.amountValue}>
              ETB {order.orderAmount?.toFixed(2) || '0.00'}
            </Text>
          </View>
          {order.deliveryCharges > 0 && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Delivery:</Text>
              <Text style={styles.amountValue}>
                ETB {order.deliveryCharges.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total:</Text>
            <Text style={styles.amountValueBold}>
              ETB {totalAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Payment:</Text>
            <Text style={styles.paymentMethod}>
              {order.paymentMethod?.toUpperCase() || 'N/A'}
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Status:</Text>
            <Text style={[
              styles.paymentStatus,
              { color: order.paymentStatus === 'PAID' ? '#4CAF50' : 
                       order.paymentStatus === 'FAILED' ? '#F44336' : '#FF9800' }
            ]}>
              {order.paymentStatus || 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Retry Payment Button for Failed/Pending Payments */}
        {order.paymentStatus !== 'PAID' && 
         order.paymentMethod !== 'cash' && 
         order.orderStatus !== 'cancelled' && (
          <TouchableOpacity
            style={styles.retryPaymentButton}
            onPress={() => {
              // Navigate to payment retry
              Alert.alert(
                'Retry Payment',
                'Would you like to retry payment for this order?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Retry',
                    onPress: () => {
                      // TODO: Implement payment retry logic
                      Alert.alert('Coming Soon', 'Payment retry feature will be available soon');
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.retryPaymentText}>💳 Retry Payment</Text>
          </TouchableOpacity>
        )}

        {/* Track Button */}
        <View style={styles.trackButton}>
          <Text style={styles.trackButtonText}>
            {order.orderStatus === 'delivered' ? 'View Details' : 'Track Order'} →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  // Show error if query failed
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const orders = data?.ordersByUser || [];
  
  // Debug log
  console.log('Rendering orders:', orders.length);

  // Separate orders by status
  const activeOrders = orders.filter(o => 
    ['pending', 'accepted', 'picked'].includes(o.orderStatus?.toLowerCase())
  );
  const completedOrders = orders.filter(o => 
    o.orderStatus?.toLowerCase() === 'delivered'
  );
  const cancelledOrders = orders.filter(o => 
    o.orderStatus?.toLowerCase() === 'cancelled'
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeOrders.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedOrders.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{cancelledOrders.length}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubText}>
            Start ordering your favorite food!
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  restaurantAddress: {
    fontSize: 13,
    color: '#666',
  },
  itemsSection: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 3,
  },
  deliverySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  deliveryDetails: {
    fontSize: 12,
    color: '#666',
  },
  riderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  riderIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  riderPhone: {
    fontSize: 12,
    color: '#666',
  },
  amountSection: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  amountLabel: {
    fontSize: 13,
    color: '#666',
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  amountValueBold: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentMethod: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  paymentStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  retryPaymentButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  retryPaymentText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timestampSection: {
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginBottom: 3,
  },
  trackButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyOrdersScreen;
