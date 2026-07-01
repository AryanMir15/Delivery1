import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_ORDER } from '../api/queries';
import MapView, { Marker, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const { width } = Dimensions.get('window');
const ASPECT_RATIO = width / Dimensions.get('window').height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Google Maps API Key (optional - leave empty to use basic routing)
const GOOGLE_MAP_KEY = '';

// GraphQL Subscription for real-time location updates
const RIDER_LOCATION_SUBSCRIPTION = `
  subscription OnRiderLocationUpdate($orderId: ID!) {
    riderLocationUpdated(orderId: $orderId) {
      riderId
      orderId
      location {
        latitude
        longitude
      }
      heading
      timestamp
    }
  }
`;

const OrderTrackingScreenSmooth = ({ route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const { orderId, orderNumber } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  // Animated coordinate for smooth rider marker movement
  const [riderCoordinate] = useState(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    })
  );
  
  const [riderHeading, setRiderHeading] = useState(0);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  // Poll order status every 5 seconds
  const { data, loading, refetch } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  });

  // Subscribe to real-time rider location updates (if available)
  // const { data: locationData } = useSubscription(RIDER_LOCATION_SUBSCRIPTION, {
  //   variables: { orderId },
  //   skip: !orderId,
  // });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Animate rider marker when location updates
  useEffect(() => {
    if (data?.order?.rider?.currentLocation?.coordinates) {
      const [lng, lat] = data.order.rider.currentLocation.coordinates;
      animateRiderMarker(lat, lng);
      
      // Update heading if available
      if (data.order.rider.heading !== undefined) {
        setRiderHeading(data.order.rider.heading);
      }
    }
  }, [data?.order?.rider?.currentLocation]);

  const animateRiderMarker = (latitude, longitude) => {
    const newCoordinate = { latitude, longitude };
    
    if (Platform.OS === 'android') {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(newCoordinate, 5000);
      }
    } else {
      riderCoordinate.timing(newCoordinate).start();
    }
  };

  const fetchTime = (d, t) => {
    setDistance(d);
    setDuration(t);
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

  // Center map on all markers
  const centerMap = () => {
    if (mapRef.current && riderCoords && customerCoords) {
      const coordinates = [riderCoords, customerCoords];
      if (shopCoords && status !== 'picked') {
        coordinates.push(shopCoords);
      }
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 100,
          left: 50,
        },
        animated: true,
      });
    }
  };

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
    <View style={s.container}>
      {/* Map View - Full Screen */}
      {(shopCoords || customerCoords || riderCoords) && (
        <View style={s.mapContainer}>
          <MapView
            ref={mapRef}
            style={s.map}
            initialRegion={{
              latitude: customerCoords?.latitude || 0,
              longitude: customerCoords?.longitude || 0,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}
            onMapReady={centerMap}
          >
            {/* Shop Marker */}
            {shopCoords && status !== 'picked' && status !== 'delivered' && (
              <Marker
                coordinate={shopCoords}
                title="Shop Location"
                description={order.restaurant.name}
              >
                <View style={s.shopMarker}>
                  <Icon name="store" size={24} color={colors.textInverse} />
                </View>
              </Marker>
            )}

            {/* Customer Marker */}
            {customerCoords && (
              <Marker
                coordinate={customerCoords}
                title="Your Location"
                description={order.deliveryAddress.deliveryAddress}
              >
                <View style={s.customerMarker}>
                  <Icon name="home" size={24} color={colors.textInverse} />
                </View>
              </Marker>
            )}

            {/* Animated Rider Marker */}
            {riderCoords && (
              <Marker.Animated
                ref={markerRef}
                coordinate={riderCoordinate}
                title="Rider Location"
                description={order.rider.name}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[s.riderMarker, { transform: [{ rotate: `${riderHeading}deg` }] }]}>
                  <Icon name="bike-fast" size={28} color={colors.textInverse} />
                </View>
              </Marker.Animated>
            )}

            {/* Route with Directions */}
            {riderCoords && customerCoords && GOOGLE_MAP_KEY && (
              <MapViewDirections
                origin={riderCoords}
                destination={customerCoords}
                apikey={GOOGLE_MAP_KEY}
                strokeWidth={4}
                strokeColor={colors.success}
                optimizeWaypoints={true}
                onReady={result => {
                  fetchTime(result.distance, result.duration);
                }}
                onError={(errorMessage) => {
                  console.log('Directions error:', errorMessage);
                }}
              />
            )}
          </MapView>

          {/* Center Map Button */}
          <TouchableOpacity
            style={s.centerButton}
            onPress={centerMap}
          >
            <Icon name="crosshairs-gps" size={24} color={colors.success} />
          </TouchableOpacity>

          {/* Status Card Overlay */}
          <View style={s.statusOverlay}>
            <View style={[s.statusCard, { borderLeftColor: statusInfo.color }]}>
              <Text style={s.statusIcon}>{statusInfo.icon}</Text>
              <View style={s.statusContent}>
                <Text style={[s.statusTitle, { color: statusInfo.color }]}>
                  {statusInfo.title}
                </Text>
                <Text style={s.statusMessage}>{statusInfo.message}</Text>
              </View>
            </View>

            {/* ETA Info */}
            {distance && duration && (
              <View style={s.etaCard}>
                <View style={s.etaItem}>
                  <Icon name="map-marker-distance" size={18} color={colors.success} />
                  <Text style={s.etaText}>{distance.toFixed(1)} km</Text>
                </View>
                <View style={s.etaDivider} />
                <View style={s.etaItem}>
                  <Icon name="clock-outline" size={18} color={colors.success} />
                  <Text style={s.etaText}>{Math.ceil(duration)} min</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Bottom Sheet with Order Details */}
      <View style={s.bottomSheet}>
        <View style={s.handle} />
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Order Header */}
          <View style={s.orderHeader}>
            <Text style={s.orderNumber}>Order #{order.orderId}</Text>
            <Text style={s.orderDate}>{formatDateTime(order.createdAt)}</Text>
          </View>

          {/* Progress Bar */}
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

          {/* Rider Information */}
          {order.rider && (
            <View style={s.riderInfo}>
              <View style={s.riderAvatar}>
                <Icon name="account" size={32} color={colors.textInverse} />
              </View>
              <View style={s.riderDetails}>
                <Text style={s.riderName}>{order.rider.name}</Text>
                <Text style={s.riderVehicle}>
                  {order.rider.vehicleType} - {order.rider.vehicleNumber}
                </Text>
              </View>
              <TouchableOpacity style={s.callButton}>
                <Icon name="phone" size={24} color={colors.success} />
              </TouchableOpacity>
            </View>
          )}

          {/* Order Items */}
          <View style={s.orderItems}>
            <Text style={s.sectionTitle}>Order Items</Text>
            {order.items.map((item, index) => (
              <View key={index} style={s.orderItem}>
                <Text style={s.itemQuantity}>{item.quantity}x</Text>
                <Text style={s.itemName}>{item.food.title}</Text>
                <Text style={s.itemPrice}>PKR {item.food.price.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Payment Summary */}
          <View style={s.paymentSection}>
            <Text style={s.sectionTitle}>Payment Summary</Text>
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Order Amount:</Text>
              <Text style={s.paymentValue}>PKR {order.orderAmount.toFixed(2)}</Text>
            </View>
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Payment Method:</Text>
              <Text style={s.paymentValue}>{order.paymentMethod}</Text>
            </View>
          </View>

          <View style={s.bottomSpacer} />
        </ScrollView>
      </View>
    </View>
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
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  shopMarker: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customerMarker: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  riderMarker: {
    width: Math.round(50 * scale),
    height: Math.round(50 * scale),
    borderRadius: Math.round(25 * scale),
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButton: {
    position: 'absolute',
    top: Math.round(50 * scale),
    right: Math.round(16 * scale),
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusOverlay: {
    position: 'absolute',
    top: Math.round(50 * scale),
    left: Math.round(16 * scale),
    right: Math.round(70 * scale),
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusIcon: {
    fontSize: Math.round(32 * scale),
    marginRight: Math.round(12 * scale),
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    marginBottom: Math.round(2 * scale),
  },
  statusMessage: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  etaCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(12 * scale),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Math.round(8 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaDivider: {
    width: 1,
    height: Math.round(20 * scale),
    backgroundColor: colors.divider,
  },
  etaText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: Math.round(6 * scale),
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: Math.round(24 * scale),
    borderTopRightRadius: Math.round(24 * scale),
    maxHeight: '40%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: Math.round(40 * scale),
    height: Math.round(4 * scale),
    backgroundColor: colors.divider,
    borderRadius: Math.round(2 * scale),
    alignSelf: 'center',
    marginTop: Math.round(8 * scale),
    marginBottom: Math.round(16 * scale),
  },
  orderHeader: {
    paddingHorizontal: Math.round(20 * scale),
    paddingBottom: Math.round(16 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderNumber: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  orderDate: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  progressSection: {
    paddingHorizontal: Math.round(20 * scale),
    paddingVertical: Math.round(16 * scale),
  },
  progressBar: {
    height: Math.round(6 * scale),
    backgroundColor: colors.divider,
    borderRadius: Math.round(3 * scale),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Math.round(3 * scale),
  },
  progressText: {
    textAlign: 'center',
    marginTop: Math.round(8 * scale),
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.round(20 * scale),
    paddingVertical: Math.round(16 * scale),
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: Math.round(20 * scale),
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(16 * scale),
  },
  riderAvatar: {
    width: Math.round(48 * scale),
    height: Math.round(48 * scale),
    borderRadius: Math.round(24 * scale),
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderDetails: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  riderName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  riderVehicle: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(2 * scale),
  },
  callButton: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItems: {
    paddingHorizontal: Math.round(20 * scale),
    marginBottom: Math.round(16 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(12 * scale),
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Math.round(8 * scale),
  },
  itemQuantity: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
    width: Math.round(40 * scale),
  },
  itemName: {
    flex: 1,
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  itemPrice: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.success,
  },
  paymentSection: {
    paddingHorizontal: Math.round(20 * scale),
    paddingTop: Math.round(16 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(8 * scale),
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
  bottomSpacer: {
    height: Math.round(20 * scale),
  },
});

export default OrderTrackingScreenSmooth;
