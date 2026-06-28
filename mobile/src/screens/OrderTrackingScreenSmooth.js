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
import { useQuery, useSubscription } from '@apollo/client';
import { GET_ORDER } from '../api/queries';
import MapView, { Marker, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

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

  return (
    <View style={styles.container}>
      {/* Map View - Full Screen */}
      {(shopCoords || customerCoords || riderCoords) && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
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
                <View style={styles.shopMarker}>
                  <Icon name="store" size={24} color="#FFFFFF" />
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
                <View style={styles.customerMarker}>
                  <Icon name="home" size={24} color="#FFFFFF" />
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
                <View style={[styles.riderMarker, { transform: [{ rotate: `${riderHeading}deg` }] }]}>
                  <Icon name="bike-fast" size={28} color="#FFFFFF" />
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
                strokeColor="#4CAF50"
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
            style={styles.centerButton}
            onPress={centerMap}
          >
            <Icon name="crosshairs-gps" size={24} color="#4CAF50" />
          </TouchableOpacity>

          {/* Status Card Overlay */}
          <View style={styles.statusOverlay}>
            <View style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}>
              <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                  {statusInfo.title}
                </Text>
                <Text style={styles.statusMessage}>{statusInfo.message}</Text>
              </View>
            </View>

            {/* ETA Info */}
            {distance && duration && (
              <View style={styles.etaCard}>
                <View style={styles.etaItem}>
                  <Icon name="map-marker-distance" size={18} color="#4CAF50" />
                  <Text style={styles.etaText}>{distance.toFixed(1)} km</Text>
                </View>
                <View style={styles.etaDivider} />
                <View style={styles.etaItem}>
                  <Icon name="clock-outline" size={18} color="#4CAF50" />
                  <Text style={styles.etaText}>{Math.ceil(duration)} min</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Bottom Sheet with Order Details */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>Order #{order.orderId}</Text>
            <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
          </View>

          {/* Progress Bar */}
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

          {/* Rider Information */}
          {order.rider && (
            <View style={styles.riderInfo}>
              <View style={styles.riderAvatar}>
                <Icon name="account" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.riderDetails}>
                <Text style={styles.riderName}>{order.rider.name}</Text>
                <Text style={styles.riderVehicle}>
                  {order.rider.vehicleType} - {order.rider.vehicleNumber}
                </Text>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Icon name="phone" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          )}

          {/* Order Items */}
          <View style={styles.orderItems}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {order.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.food.title}</Text>
                <Text style={styles.itemPrice}>ETB {item.food.price.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Payment Summary */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Order Amount:</Text>
              <Text style={styles.paymentValue}>ETB {order.orderAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method:</Text>
              <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  shopMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customerMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  riderMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 70,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusMessage: {
    fontSize: 12,
    color: '#666',
  },
  etaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    shadowColor: '#000',
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
    height: 20,
    backgroundColor: '#E0E0E0',
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  orderHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  riderVehicle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItems: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 40,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  paymentSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  bottomSpacer: {
    height: 20,
  },
});

export default OrderTrackingScreenSmooth;
