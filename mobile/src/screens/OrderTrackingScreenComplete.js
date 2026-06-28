import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_ORDER } from '../api/queries';
import MapView, { Marker, Polyline } from 'react-native-maps';

const OrderTrackingScreenComplete = ({ route }) => {
  const { orderId, orderNumber } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  // Poll order status every 3 seconds
  const { data, loading, refetch } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    pollInterval: 3000,
    fetchPolicy: 'network-only',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!data?.order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const order = data.order;
  const status = order.orderStatus;

  // Format date/time
  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'Just now';
    
    try {
      // Handle both timestamp (number) and ISO string
      const date = new Date(typeof dateValue === 'string' ? dateValue : parseInt(dateValue));
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Just now';
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Just now';
    }
  };

  // Get status progress
  const getStatusProgress = () => {
    const statuses = ['pending', 'accepted', 'picked', 'delivered'];
    const currentIndex = statuses.indexOf(status);
    return {
      current: currentIndex + 1,
      total: statuses.length,
      percentage: ((currentIndex + 1) / statuses.length) * 100
    };
  };

  const progress = getStatusProgress();

  // Render status message
  const renderStatusMessage = () => {
    switch (status) {
      case 'pending':
        return {
          icon: '🔍',
          title: 'Searching for Rider',
          message: 'We are finding the best rider for your delivery',
          color: '#FF9800'
        };
      case 'accepted':
        return {
          icon: '✅',
          title: 'Rider Accepted',
          message: 'Rider is heading to the restaurant',
          color: '#2196F3'
        };
      case 'picked':
        return {
          icon: '📦',
          title: 'Order Picked Up',
          message: 'Rider is on the way to you',
          color: '#9C27B0'
        };
      case 'delivered':
        return {
          icon: '🎉',
          title: 'Order Delivered',
          message: 'Enjoy your meal!',
          color: '#4CAF50'
        };
      default:
        return {
          icon: '📋',
          title: status,
          message: 'Order in progress',
          color: '#666'
        };
    }
  };

  const statusInfo = renderStatusMessage();

  // Prepare map coordinates
  const shopCoords = order.restaurant?.location?.coordinates
    ? {
        latitude: order.restaurant.location.coordinates[1],
        longitude: order.restaurant.location.coordinates[0]
      }
    : null;

  const customerCoords = order.deliveryAddress?.location?.coordinates
    ? {
        latitude: order.deliveryAddress.location.coordinates[1],
        longitude: order.deliveryAddress.location.coordinates[0]
      }
    : null;

  const riderCoords = order.rider?.currentLocation?.coordinates
    ? {
        latitude: order.rider.currentLocation.coordinates[1],
        longitude: order.rider.currentLocation.coordinates[0]
      }
    : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order.orderId}</Text>
        <Text style={styles.orderDate}>
          Placed: {formatDateTime(order.createdAt)}
        </Text>
      </View>

      {/* Status Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.percentage}%`, backgroundColor: statusInfo.color }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {progress.current} of {progress.total}
        </Text>
      </View>

      {/* Current Status */}
      <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
        <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
        <View style={styles.statusContent}>
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
            {statusInfo.title}
          </Text>
          <Text style={styles.statusMessage}>{statusInfo.message}</Text>
        </View>
      </View>

      {/* Progress Timeline */}
      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>📊 Order Progress</Text>
        
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, status !== 'pending' && styles.timelineDotComplete]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Order Placed</Text>
            <Text style={styles.timelineTime}>{formatDateTime(order.createdAt)}</Text>
            <Text style={styles.timelineStatus}>✅ Completed</Text>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <View style={[
            styles.timelineDot,
            ['accepted', 'picked', 'delivered'].includes(status) && styles.timelineDotComplete
          ]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Rider Accepted</Text>
            <Text style={styles.timelineTime}>
              {order.acceptedAt ? formatDateTime(order.acceptedAt) : 'Waiting...'}
            </Text>
            <Text style={[
              styles.timelineStatus,
              ['accepted', 'picked', 'delivered'].includes(status) && styles.timelineStatusComplete
            ]}>
              {['accepted', 'picked', 'delivered'].includes(status) ? '✅ Completed' : '⏳ Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <View style={[
            styles.timelineDot,
            ['picked', 'delivered'].includes(status) && styles.timelineDotComplete
          ]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Order Picked Up</Text>
            <Text style={styles.timelineTime}>
              {order.pickedAt ? formatDateTime(order.pickedAt) : 'Waiting...'}
            </Text>
            <Text style={[
              styles.timelineStatus,
              ['picked', 'delivered'].includes(status) && styles.timelineStatusComplete
            ]}>
              {['picked', 'delivered'].includes(status) ? '✅ Completed' : '⏳ Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <View style={[
            styles.timelineDot,
            status === 'delivered' && styles.timelineDotComplete
          ]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Order Delivered</Text>
            <Text style={styles.timelineTime}>
              {order.deliveredAt ? formatDateTime(order.deliveredAt) : 'Waiting...'}
            </Text>
            <Text style={[
              styles.timelineStatus,
              status === 'delivered' && styles.timelineStatusComplete
            ]}>
              {status === 'delivered' ? '✅ Completed' : '⏳ Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Shop Information */}
      {order.restaurant && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>🏪 Shop Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{order.restaurant.name}</Text>
            
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{order.restaurant.address}</Text>
            
            {shopCoords && (
              <>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>
                  [{shopCoords.longitude.toFixed(4)}, {shopCoords.latitude.toFixed(4)}]
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Delivery Information */}
      {order.deliveryAddress && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>🏠 Delivery Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{order.deliveryAddress.deliveryAddress}</Text>
            
            <Text style={styles.infoLabel}>Details:</Text>
            <Text style={styles.infoValue}>{order.deliveryAddress.details}</Text>
            
            <Text style={styles.infoLabel}>Label:</Text>
            <Text style={styles.infoValue}>{order.deliveryAddress.label}</Text>
            
            {customerCoords && (
              <>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>
                  [{customerCoords.longitude.toFixed(4)}, {customerCoords.latitude.toFixed(4)}]
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Rider Information */}
      {order.rider && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>🏍️ Rider Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{order.rider.name}</Text>
            
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{order.rider.phone}</Text>
            
            <Text style={styles.infoLabel}>Vehicle:</Text>
            <Text style={styles.infoValue}>
              {order.rider.vehicleType} - {order.rider.vehicleNumber}
            </Text>
            
            {riderCoords && (
              <>
                <Text style={styles.infoLabel}>Current Location:</Text>
                <Text style={styles.infoValue}>
                  [{riderCoords.longitude.toFixed(4)}, {riderCoords.latitude.toFixed(4)}]
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Map View */}
      {(shopCoords || customerCoords || riderCoords) && (
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>🗺️ Live Tracking</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: customerCoords?.latitude || 0,
              longitude: customerCoords?.longitude || 0,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Shop Marker */}
            {shopCoords && (
              <Marker
                coordinate={shopCoords}
                title="Shop Location"
                description={order.restaurant.name}
                pinColor="blue"
              />
            )}

            {/* Customer Marker */}
            {customerCoords && (
              <Marker
                coordinate={customerCoords}
                title="Delivery Location"
                description={order.deliveryAddress.deliveryAddress}
                pinColor="red"
              />
            )}

            {/* Rider Marker */}
            {riderCoords && (
              <Marker
                coordinate={riderCoords}
                title="Rider Location"
                description={order.rider.name}
              >
                <View style={styles.riderMarker}>
                  <Text style={styles.riderMarkerText}>🏍️</Text>
                </View>
              </Marker>
            )}

            {/* Route Line */}
            {riderCoords && customerCoords && (
              <Polyline
                coordinates={[riderCoords, customerCoords]}
                strokeColor="#4CAF50"
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>
      )}

      {/* Payment Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>💰 Payment Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Order Amount:</Text>
            <Text style={styles.paymentValue}>ETB {order.orderAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Paid Amount:</Text>
            <Text style={styles.paymentValue}>ETB {order.paidAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method:</Text>
            <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  progressSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
  },
  timelineSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginRight: 15,
    marginTop: 2,
  },
  timelineDotComplete: {
    backgroundColor: '#4CAF50',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  timelineTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  timelineStatus: {
    fontSize: 12,
    color: '#999',
  },
  timelineStatusComplete: {
    color: '#4CAF50',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mapSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  map: {
    height: 300,
    borderRadius: 8,
    marginTop: 10,
  },
  riderMarker: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
  },
  riderMarkerText: {
    fontSize: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default OrderTrackingScreenComplete;
