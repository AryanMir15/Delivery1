import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_ORDER } from '../api/queries';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const OrderTrackingScreenComplete = ({ route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={s.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!data?.order) {
    return (
      <View style={s.errorContainer}>
        <Text style={s.errorText}>Order not found</Text>
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
          icon: 'Searching for Rider',
          title: 'Searching for Rider',
          message: 'We are finding the best rider for your delivery',
          color: colors.warning
        };
      case 'accepted':
        return {
          icon: 'Rider Accepted',
          title: 'Rider Accepted',
          message: 'Rider is heading to the restaurant',
          color: colors.info
        };
      case 'picked':
        return {
          icon: 'Order Picked Up',
          title: 'Order Picked Up',
          message: 'Rider is on the way to you',
          color: colors.accent
        };
      case 'delivered':
        return {
          icon: 'Order Delivered',
          title: 'Order Delivered',
          message: 'Enjoy your meal!',
          color: colors.success
        };
      default:
        return {
          icon: status,
          title: status,
          message: 'Order in progress',
          color: colors.textSecondary
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

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      style={s.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Order Header */}
      <View style={s.header}>
        <Text style={s.orderNumber}>Order #{order.orderId}</Text>
        <Text style={s.orderDate}>
          Placed: {formatDateTime(order.createdAt)}
        </Text>
      </View>

      {/* Status Progress */}
      <View style={s.progressSection}>
        <View style={s.progressBar}>
          <View
            style={[
              s.progressFill,
              { width: `${progress.percentage}%`, backgroundColor: statusInfo.color }
            ]}
          />
        </View>
        <Text style={s.progressText}>
          Step {progress.current} of {progress.total}
        </Text>
      </View>

      {/* Current Status */}
      <View style={[s.statusCard, { borderLeftColor: statusInfo.color }]}>
        <Text style={s.statusIcon}>{statusInfo.icon}</Text>
        <View style={s.statusContent}>
          <Text style={[s.statusTitle, { color: statusInfo.color }]}>
            {statusInfo.title}
          </Text>
          <Text style={s.statusMessage}>{statusInfo.message}</Text>
        </View>
      </View>

      {/* Progress Timeline */}
      <View style={s.timelineSection}>
        <Text style={s.sectionTitle}>Order Progress</Text>
        
        <View style={s.timelineItem}>
          <View style={[s.timelineDot, status !== 'pending' && s.timelineDotComplete]} />
          <View style={s.timelineContent}>
            <Text style={s.timelineTitle}>Order Placed</Text>
            <Text style={s.timelineTime}>{formatDateTime(order.createdAt)}</Text>
            <Text style={s.timelineStatus}>Completed</Text>
          </View>
        </View>

        <View style={s.timelineItem}>
          <View style={[
            s.timelineDot,
            ['accepted', 'picked', 'delivered'].includes(status) && s.timelineDotComplete
          ]} />
          <View style={s.timelineContent}>
            <Text style={s.timelineTitle}>Rider Accepted</Text>
            <Text style={s.timelineTime}>
              {order.acceptedAt ? formatDateTime(order.acceptedAt) : 'Waiting...'}
            </Text>
            <Text style={[
              s.timelineStatus,
              ['accepted', 'picked', 'delivered'].includes(status) && s.timelineStatusComplete
            ]}>
              {['accepted', 'picked', 'delivered'].includes(status) ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={s.timelineItem}>
          <View style={[
            s.timelineDot,
            ['picked', 'delivered'].includes(status) && s.timelineDotComplete
          ]} />
          <View style={s.timelineContent}>
            <Text style={s.timelineTitle}>Order Picked Up</Text>
            <Text style={s.timelineTime}>
              {order.pickedAt ? formatDateTime(order.pickedAt) : 'Waiting...'}
            </Text>
            <Text style={[
              s.timelineStatus,
              ['picked', 'delivered'].includes(status) && s.timelineStatusComplete
            ]}>
              {['picked', 'delivered'].includes(status) ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={s.timelineItem}>
          <View style={[
            s.timelineDot,
            status === 'delivered' && s.timelineDotComplete
          ]} />
          <View style={s.timelineContent}>
            <Text style={s.timelineTitle}>Order Delivered</Text>
            <Text style={s.timelineTime}>
              {order.deliveredAt ? formatDateTime(order.deliveredAt) : 'Waiting...'}
            </Text>
            <Text style={[
              s.timelineStatus,
              status === 'delivered' && s.timelineStatusComplete
            ]}>
              {status === 'delivered' ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Shop Information */}
      {order.restaurant && (
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>Shop Information</Text>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Name:</Text>
            <Text style={s.infoValue}>{order.restaurant.name}</Text>
            
            <Text style={s.infoLabel}>Address:</Text>
            <Text style={s.infoValue}>{order.restaurant.address}</Text>
            
            {shopCoords && (
              <>
                <Text style={s.infoLabel}>Location:</Text>
                <Text style={s.infoValue}>
                  [{shopCoords.longitude.toFixed(4)}, {shopCoords.latitude.toFixed(4)}]
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Delivery Information */}
      {order.deliveryAddress && (
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>Delivery Information</Text>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Address:</Text>
            <Text style={s.infoValue}>{order.deliveryAddress.deliveryAddress}</Text>
            
            <Text style={s.infoLabel}>Details:</Text>
            <Text style={s.infoValue}>{order.deliveryAddress.details}</Text>
            
            <Text style={s.infoLabel}>Label:</Text>
            <Text style={s.infoValue}>{order.deliveryAddress.label}</Text>
            
            {customerCoords && (
              <>
                <Text style={s.infoLabel}>Location:</Text>
                <Text style={s.infoValue}>
                  [{customerCoords.longitude.toFixed(4)}, {customerCoords.latitude.toFixed(4)}]
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Rider Information */}
      {order.rider && (
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>Rider Information</Text>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Name:</Text>
            <Text style={s.infoValue}>{order.rider.name}</Text>
            
            <Text style={s.infoLabel}>Phone:</Text>
            <Text style={s.infoValue}>{order.rider.phone}</Text>
            
            <Text style={s.infoLabel}>Vehicle:</Text>
            <Text style={s.infoValue}>
              {order.rider.vehicleType} - {order.rider.vehicleNumber}
            </Text>
            
            {riderCoords && (
              <>
                <Text style={s.infoLabel}>Current Location:</Text>
                <Text style={s.infoValue}>
                  [{riderCoords.longitude.toFixed(4)}, {riderCoords.latitude.toFixed(4)}]
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Map View */}
      {(shopCoords || customerCoords || riderCoords) && (
        <View style={s.mapSection}>
          <Text style={s.sectionTitle}>Live Tracking</Text>
          <MapView
            style={s.map}
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
                <View style={s.riderMarker}>
                  <Text style={s.riderMarkerText}>Rider</Text>
                </View>
              </Marker>
            )}

            {/* Route Line */}
            {riderCoords && customerCoords && (
              <Polyline
                coordinates={[riderCoords, customerCoords]}
                strokeColor={colors.success}
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>
      )}

      {/* Payment Information */}
      <View style={s.infoSection}>
        <Text style={s.sectionTitle}>Payment Information</Text>
        <View style={s.infoCard}>
          <View style={s.paymentRow}>
            <Text style={s.paymentLabel}>Order Amount:</Text>
            <Text style={s.paymentValue}>PKR {order.orderAmount.toFixed(2)}</Text>
          </View>
          <View style={s.paymentRow}>
            <Text style={s.paymentLabel}>Paid Amount:</Text>
            <Text style={s.paymentValue}>PKR {order.paidAmount.toFixed(2)}</Text>
          </View>
          <View style={s.paymentRow}>
            <Text style={s.paymentLabel}>Payment Method:</Text>
            <Text style={s.paymentValue}>{order.paymentMethod}</Text>
          </View>
        </View>
      </View>

      <View style={s.bottomSpacer} />
    </ScrollView>
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
  },
  loadingText: {
    marginTop: Math.round(10 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Math.round(16 * scale),
    color: colors.error,
  },
  header: {
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderNumber: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(5 * scale),
  },
  progressSection: {
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    marginTop: Math.round(10 * scale),
  },
  progressBar: {
    height: Math.round(8 * scale),
    backgroundColor: colors.border,
    borderRadius: Math.round(4 * scale),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Math.round(4 * scale),
  },
  progressText: {
    textAlign: 'center',
    marginTop: Math.round(10 * scale),
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  statusCard: {
    backgroundColor: colors.surface,
    margin: Math.round(10 * scale),
    padding: Math.round(20 * scale),
    borderRadius: Math.round(12 * scale),
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIcon: {
    fontSize: Math.round(40 * scale),
    marginRight: Math.round(15 * scale),
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    marginBottom: Math.round(5 * scale),
  },
  statusMessage: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  timelineSection: {
    backgroundColor: colors.surface,
    marginTop: Math.round(10 * scale),
    padding: Math.round(20 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    marginBottom: Math.round(15 * scale),
    color: colors.textPrimary,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Math.round(20 * scale),
  },
  timelineDot: {
    width: Math.round(16 * scale),
    height: Math.round(16 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.divider,
    marginRight: Math.round(15 * scale),
    marginTop: Math.round(2 * scale),
  },
  timelineDotComplete: {
    backgroundColor: colors.success,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(3 * scale),
  },
  timelineTime: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(3 * scale),
  },
  timelineStatus: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },
  timelineStatusComplete: {
    color: colors.success,
  },
  infoSection: {
    backgroundColor: colors.surface,
    marginTop: Math.round(10 * scale),
    padding: Math.round(20 * scale),
  },
  infoCard: {
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(8 * scale),
  },
  infoLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
    marginTop: Math.round(10 * scale),
    marginBottom: Math.round(3 * scale),
  },
  infoValue: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(10 * scale),
  },
  paymentLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mapSection: {
    backgroundColor: colors.surface,
    marginTop: Math.round(10 * scale),
    padding: Math.round(20 * scale),
  },
  map: {
    height: Math.round(300 * scale),
    borderRadius: Math.round(8 * scale),
    marginTop: Math.round(10 * scale),
  },
  riderMarker: {
    backgroundColor: colors.success,
    padding: Math.round(8 * scale),
    borderRadius: Math.round(20 * scale),
  },
  riderMarkerText: {
    fontSize: Math.round(20 * scale),
  },
  bottomSpacer: {
    height: Math.round(20 * scale),
  },
});

export default OrderTrackingScreenComplete;
