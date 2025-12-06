import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PENDING_ORDERS_QUERY } from '../api/queries';
import { ACCEPT_ORDER_MUTATION } from '../api/mutations';

const PendingOrdersScreenComplete = ({ navigation }) => {
  const [timeLeft, setTimeLeft] = useState({});
  
  // Query pending orders (polls every 2 seconds)
  const { data, loading, refetch } = useQuery(GET_PENDING_ORDERS_QUERY, {
    pollInterval: 2000,
    fetchPolicy: 'network-only',
  });

  const [acceptOrder, { loading: accepting }] = useMutation(ACCEPT_ORDER_MUTATION);

  // Timer management (15 seconds per order)
  useEffect(() => {
    if (data?.pendingOrders) {
      const timers = {};
      
      data.pendingOrders.forEach(order => {
        if (!timeLeft[order._id]) {
          timers[order._id] = 15; // 15 second timer
        }
      });

      setTimeLeft(prev => ({ ...prev, ...timers }));

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(orderId => {
            if (updated[orderId] > 0) {
              updated[orderId]--;
            } else {
              // Remove expired orders
              delete updated[orderId];
            }
          });
          return updated;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [data]);

  // Format date/time
  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'Just now';
    
    // Handle both timestamp (number) and ISO string
    const date = new Date(typeof dateValue === 'string' ? dateValue : parseInt(dateValue));
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Just now';
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate distance (simple approximation)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const handleAcceptOrder = async (order) => {
    try {
      Alert.alert(
        'Accept Order',
        `Accept order #${order.orderId}?\n\nPickup: ${order.restaurant.name}\nDelivery: ${order.deliveryAddress.deliveryAddress}\nFee: ETB ${order.deliveryCharges.toFixed(2)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: async () => {
              try {
                const { data: acceptData } = await acceptOrder({
                  variables: { orderId: order._id }
                });

                if (acceptData.acceptOrderByRider) {
                  Alert.alert(
                    'Success!',
                    `Order #${acceptData.acceptOrderByRider.orderId} accepted successfully`,
                    [
                      {
                        text: 'View Order',
                        onPress: () => navigation.navigate('ActiveDelivery', {
                          orderId: acceptData.acceptOrderByRider._id,
                          orderNumber: acceptData.acceptOrderByRider.orderId
                        })
                      }
                    ]
                  );
                  refetch();
                }
              } catch (error) {
                if (error.message.includes('already accepted')) {
                  Alert.alert(
                    'Order Taken',
                    'This order was already accepted by another rider'
                  );
                } else {
                  Alert.alert('Error', error.message);
                }
                refetch();
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderOrderRequest = ({ item: order }) => {
    const timer = timeLeft[order._id] || 0;
    
    // Hide expired requests
    if (timer <= 0) {
      return null;
    }

    const shopCoords = order.restaurant.location.coordinates;
    const customerCoords = order.deliveryAddress.location.coordinates;
    const distance = calculateDistance(
      shopCoords[1], shopCoords[0],
      customerCoords[1], customerCoords[0]
    );

    return (
      <View style={styles.orderCard}>
        {/* Timer Badge */}
        <View style={[
          styles.timerBadge,
          timer <= 5 && styles.timerBadgeUrgent
        ]}>
          <Text style={styles.timerText}>{timer}s</Text>
        </View>

        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{order.orderId}</Text>
          <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
        </View>

        {/* Pickup Location */}
        <View style={styles.locationSection}>
          <View style={styles.locationIcon}>
            <Text style={styles.iconText}>🏪</Text>
          </View>
          <View style={styles.locationDetails}>
            <Text style={styles.locationLabel}>Pickup Location</Text>
            <Text style={styles.locationName}>{order.restaurant.name}</Text>
            <Text style={styles.locationAddress}>{order.restaurant.address}</Text>
            <Text style={styles.locationCoords}>
              [{shopCoords[0].toFixed(4)}, {shopCoords[1].toFixed(4)}]
            </Text>
          </View>
        </View>

        {/* Delivery Location */}
        <View style={styles.locationSection}>
          <View style={styles.locationIcon}>
            <Text style={styles.iconText}>🏠</Text>
          </View>
          <View style={styles.locationDetails}>
            <Text style={styles.locationLabel}>Delivery Location</Text>
            <Text style={styles.locationName}>{order.deliveryAddress.deliveryAddress}</Text>
            {order.deliveryAddress.details && (
              <Text style={styles.locationAddress}>{order.deliveryAddress.details}</Text>
            )}
            <Text style={styles.locationCoords}>
              [{customerCoords[0].toFixed(4)}, {customerCoords[1].toFixed(4)}]
            </Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{distance} km</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Delivery Fee</Text>
            <Text style={styles.detailValue}>ETB {order.deliveryCharges.toFixed(2)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Order Amount</Text>
            <Text style={styles.detailValue}>ETB {order.orderAmount?.toFixed(2) || 'N/A'}</Text>
          </View>
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(order)}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading pending orders...</Text>
      </View>
    );
  }

  const pendingOrders = data?.pendingOrders || [];
  const activeOrders = pendingOrders.filter(order => (timeLeft[order._id] || 0) > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Order Requests</Text>
        <Text style={styles.headerSubtitle}>
          {activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'} available
        </Text>
      </View>

      {activeOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Waiting for new orders...</Text>
          <Text style={styles.emptySubText}>
            You'll be notified when orders are available nearby
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          renderItem={renderOrderRequest}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
            />
          }
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  listContainer: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timerBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  timerBadgeUrgent: {
    backgroundColor: '#f44336',
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderHeader: {
    marginBottom: 15,
    paddingRight: 60,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  locationSection: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  locationCoords: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default PendingOrdersScreenComplete;
