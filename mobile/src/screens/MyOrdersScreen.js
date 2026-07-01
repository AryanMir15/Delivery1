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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';
import StatusBadge from '../components/StatusBadge';
import { GET_ORDERS_BY_USER } from '../api/queries';
import { formatTimeAgo } from '../utils/dateFormatter';

const MyOrdersScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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

  const s = styles(colors, typography, scale);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Use imported date formatter
  const formatDateTime = (dateInput) => {
    return formatTimeAgo(dateInput);
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
    const statusText = getStatusText(order.orderStatus);

    // Calculate total amount
    const totalAmount = (order.orderAmount || 0) + 
                       (order.deliveryCharges || 0) + 
                       (order.taxationAmount || 0) + 
                       (order.tipping || 0);

    return (
      <TouchableOpacity
        style={s.orderCard}
        onPress={() => navigation.navigate('OrderTracking', {
          orderId: order._id,
          orderNumber: order.orderId
        })}
        activeOpacity={0.7}
      >
        {/* Order Header */}
        <View style={s.orderHeader}>
          <View style={s.orderHeaderLeft}>
            <Text style={s.orderId}>Order #{order.orderId}</Text>
            <Text style={s.orderDate}>
              {formatDateTime(order.orderDate)}
            </Text>
          </View>
          <StatusBadge status={order.orderStatus} />
        </View>

        {/* Restaurant Info */}
        {order.restaurant && (
          <View style={s.restaurantSection}>
            <View style={s.restaurantInfo}>
              <Text style={s.restaurantName}>{order.restaurant.name}</Text>
              {order.restaurant.address && (
                <Text style={s.restaurantAddress} numberOfLines={1}>
                  {order.restaurant.address}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <View style={s.itemsSection}>
            <Text style={s.itemsLabel}>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </Text>
            {order.items.slice(0, 2).map((item, index) => (
              <Text key={index} style={s.itemText} numberOfLines={1}>
                • {item.title || item.food?.title || 'Item'} x {item.quantity}
              </Text>
            ))}
            {order.items.length > 2 && (
              <Text style={s.moreItems}>
                +{order.items.length - 2} more
              </Text>
            )}
          </View>
        )}

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={s.deliverySection}>
            <View style={s.deliveryInfo}>
              <Text style={s.deliveryAddress} numberOfLines={1}>
                {order.deliveryAddress.deliveryAddress}
              </Text>
              {order.deliveryAddress.details && (
                <Text style={s.deliveryDetails} numberOfLines={1}>
                  {order.deliveryAddress.details}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Rider Info (if assigned) */}
        {order.rider && (
          <View style={s.riderSection}>
            <View style={s.riderInfo}>
              <Text style={s.riderName}>Rider: {order.rider.name}</Text>
            </View>
          </View>
        )}

        {/* Order Amount */}
        <View style={s.amountSection}>
          <View style={s.amountRow}>
            <Text style={s.amountLabel}>Order Amount:</Text>
            <Text style={s.amountValue}>
              PKR {order.orderAmount?.toFixed(2) || '0.00'}
            </Text>
          </View>
          {order.deliveryCharges > 0 && (
            <View style={s.amountRow}>
              <Text style={s.amountLabel}>Delivery:</Text>
              <Text style={s.amountValue}>
                PKR {order.deliveryCharges.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={s.amountRow}>
            <Text style={s.amountLabel}>Total:</Text>
            <Text style={s.amountValueBold}>
              PKR {totalAmount.toFixed(2)}
            </Text>
          </View>
          <View style={s.amountRow}>
            <Text style={s.amountLabel}>Payment:</Text>
            <Text style={s.paymentMethod}>
              {order.paymentMethod?.toUpperCase() || 'N/A'}
            </Text>
          </View>
          <View style={s.amountRow}>
            <Text style={s.amountLabel}>Status:</Text>
            <Text style={[
              s.paymentStatus,
              { color: order.paymentStatus === 'PAID' ? colors.statusDelivered : 
                       order.paymentStatus === 'FAILED' ? colors.statusCancelled : colors.statusPending }
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
            style={s.retryPaymentButton}
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
            <Text style={s.retryPaymentText}>Retry Payment</Text>
          </TouchableOpacity>
        )}

        {/* Track Button */}
        <View style={s.trackButton}>
          <Text style={s.trackButtonText}>
            {order.orderStatus === 'delivered' ? 'View Details' : 'Track Order'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={s.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Loading your orders...</Text>
      </SafeAreaView>
    );
  }

  // Show error if query failed
  if (error) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>My Orders</Text>
        </View>
        <View style={s.errorContainer}>
          <Text style={s.errorTitle}>Connection Error</Text>
          <Text style={s.errorMessage}>{error.message}</Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={() => refetch()}
          >
            <Text style={s.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>
        <Text style={s.headerSubtitle}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
        </Text>
      </View>

      {/* Stats */}
      <View style={s.statsContainer}>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{activeOrders.length}</Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{completedOrders.length}</Text>
          <Text style={s.statLabel}>Completed</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNumber}>{cancelledOrders.length}</Text>
          <Text style={s.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyText}>No orders yet</Text>
          <Text style={s.emptySubText}>
            Start ordering your favorite food!
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={item => item._id}
          contentContainerStyle={s.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: Math.round(10 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.accent,
    padding: Math.round(20 * scale),
    paddingTop: Math.round(50 * scale),
  },
  headerTitle: {
    fontSize: Math.round(28 * scale),
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  headerSubtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textInverse,
    marginTop: Math.round(5 * scale),
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: Math.round(15 * scale),
    gap: Math.round(10 * scale),
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(8 * scale),
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  statLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(5 * scale),
  },
  listContainer: {
    padding: Math.round(15 * scale),
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(15 * scale),
    marginBottom: Math.round(15 * scale),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.round(15 * scale),
    paddingBottom: Math.round(15 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(5 * scale),
  },
  orderDate: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },

  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(3 * scale),
  },
  restaurantAddress: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
  },
  itemsSection: {
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(10 * scale),
    borderRadius: Math.round(8 * scale),
    marginBottom: Math.round(12 * scale),
  },
  itemsLabel: {
    fontSize: Math.round(12 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: Math.round(5 * scale),
  },
  itemText: {
    fontSize: Math.round(13 * scale),
    color: colors.textPrimary,
    marginBottom: Math.round(2 * scale),
  },
  moreItems: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Math.round(3 * scale),
  },
  deliverySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryAddress: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    marginBottom: Math.round(3 * scale),
  },
  deliveryDetails: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  riderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(10 * scale),
    borderRadius: Math.round(8 * scale),
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(3 * scale),
  },
  amountSection: {
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    marginBottom: Math.round(12 * scale),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(5 * scale),
  },
  amountLabel: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: Math.round(13 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  amountValueBold: {
    fontSize: Math.round(15 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  paymentMethod: {
    fontSize: Math.round(13 * scale),
    fontWeight: '600',
    color: colors.info,
  },
  paymentStatus: {
    fontSize: Math.round(13 * scale),
    fontWeight: '600',
  },
  retryPaymentButton: {
    backgroundColor: colors.info,
    padding: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    alignItems: 'center',
    marginBottom: Math.round(8 * scale),
  },
  retryPaymentText: {
    color: colors.textInverse,
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
  },
  trackButton: {
    backgroundColor: colors.accent,
    padding: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    alignItems: 'center',
  },
  trackButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Math.round(40 * scale),
  },
  emptyText: {
    fontSize: Math.round(18 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(10 * scale),
  },
  emptySubText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Math.round(40 * scale),
  },
  errorTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(10 * scale),
  },
  errorMessage: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Math.round(20 * scale),
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(30 * scale),
    paddingVertical: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
  },
});

export default MyOrdersScreen;
