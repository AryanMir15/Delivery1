// Customer App - Live Tracking Screen with FREE OpenStreetMap
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useQuery } from '@apollo/client';
import { GET_ORDER } from '../api/queries';
import socketService from '../services/socketService';

const { width, height } = Dimensions.get('window');

const LiveTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  
  const [userLocation, setUserLocation] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const mapRef = useRef(null);

  // Fetch order details
  const { data, loading, refetch } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    pollInterval: 10000, // Refresh order data every 10 seconds
  });

  const order = data?.order;

  // Get user's current location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Location permission is needed for tracking');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        console.log('📍 User location:', location.coords);
      } catch (error) {
        console.error('Error getting location:', error);
        // Fallback to order delivery address
        if (order?.deliveryAddress?.location) {
          setUserLocation({
            latitude: order.deliveryAddress.location[0],
            longitude: order.deliveryAddress.location[1],
          });
        }
      }
    })();
  }, [order]);

  // Subscribe to rider location updates via Socket.io
  useEffect(() => {
    if (!orderId) return;

    console.log('📍 Starting live tracking for order:', orderId);
    setIsTracking(true);

    // Subscribe to order tracking
    socketService.subscribeToOrder(orderId, 'customer', (locationData) => {
      if (locationData.lat && locationData.lng) {
        console.log('📍 Updating rider location:', locationData);
        setRiderLocation({
          latitude: locationData.lat,
          longitude: locationData.lng,
        });
      } else {
        console.log('⚠️ Waiting for rider location...');
      }
    });

    return () => {
      console.log('📍 Stopping live tracking');
      socketService.unsubscribeFromOrder(orderId);
      setIsTracking(false);
    };
  }, [orderId]);

  // Auto-fit map to show both markers
  useEffect(() => {
    if (mapRef.current && userLocation && riderLocation) {
      setTimeout(() => {
        mapRef.current.fitToCoordinates([userLocation, riderLocation], {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [userLocation, riderLocation]);

  const handleCallRider = () => {
    if (order?.rider?.phone) {
      Linking.openURL(`tel:${order.rider.phone}`);
    } else {
      Alert.alert('Not Available', 'Rider phone number not available');
    }
  };

  const handleMessageRider = () => {
    if (order?.rider?.phone) {
      Linking.openURL(`sms:${order.rider.phone}`);
    } else {
      Alert.alert('Not Available', 'Rider phone number not available');
    }
  };

  const getStatusInfo = () => {
    const status = order?.orderStatus?.toUpperCase();
    switch (status) {
      case 'DELIVERED':
        return { icon: 'check-circle', color: '#4CAF50', title: 'Delivered!', subtitle: 'Your order has been delivered' };
      case 'PICKED':
        return { icon: 'bike-fast', color: '#2196F3', title: 'On the way', subtitle: 'Rider is heading to you' };
      case 'ACCEPTED':
        return { icon: 'chef-hat', color: '#FF9800', title: 'Preparing', subtitle: 'Restaurant is preparing your order' };
      default:
        return { icon: 'clock-outline', color: '#999', title: 'Order Placed', subtitle: 'Waiting for confirmation' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <Text style={styles.headerSubtitle}>Order #{order?.orderId}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
          <Icon name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 9.0320,
          longitude: userLocation?.longitude || 38.7469,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* User/Delivery Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Delivery Location"
            description={order?.deliveryAddress?.deliveryAddress}
          >
            <View style={styles.homeMarker}>
              <Icon name="home" size={30} color="#4CAF50" />
            </View>
          </Marker>
        )}

        {/* Rider Location Marker */}
        {riderLocation && (
          <Marker
            coordinate={riderLocation}
            title={order?.rider?.name || 'Rider'}
            description="Rider Location"
          >
            <View style={styles.riderMarker}>
              <Icon name="bike-fast" size={30} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {userLocation && riderLocation && (
          <Polyline
            coordinates={[riderLocation, userLocation]}
            strokeColor="#2196F3"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Tracking Status Indicator */}
      <View style={styles.trackingIndicator}>
        <View style={[styles.trackingDot, isTracking && styles.trackingDotActive]} />
        <Text style={styles.trackingText}>
          {isTracking ? 'Live Tracking Active' : 'Connecting...'}
        </Text>
      </View>

      {/* Order Status Card */}
      <View style={styles.statusCard}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusInfo.color}20` }]}>
            <Icon name={statusInfo.icon} size={32} color={statusInfo.color} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>
        </View>

        {/* Rider Info */}
        {order?.rider && (
          <View style={styles.riderInfo}>
            <View style={styles.riderAvatar}>
              <Icon name="account" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.riderDetails}>
              <Text style={styles.riderName}>{order.rider.name}</Text>
              <Text style={styles.riderPhone}>{order.rider.phone}</Text>
            </View>
            <View style={styles.riderActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallRider}>
                <Icon name="phone" size={24} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleMessageRider}>
                <Icon name="message-text" size={24} color="#2196F3" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.addressContainer}>
          <Icon name="map-marker" size={24} color="#FF6B35" />
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Delivery Address</Text>
            <Text style={styles.addressText}>
              {order?.deliveryAddress?.deliveryAddress || 'Address not available'}
            </Text>
            {order?.deliveryAddress?.details && (
              <Text style={styles.addressDetails}>{order.deliveryAddress.details}</Text>
            )}
          </View>
        </View>

        {/* ETA */}
        {order?.orderStatus === 'PICKED' && riderLocation && (
          <View style={styles.etaContainer}>
            <Icon name="clock-fast" size={20} color="#2196F3" />
            <Text style={styles.etaText}>Estimated arrival: 15-20 min</Text>
          </View>
        )}

        {/* No Rider Yet */}
        {!order?.rider && (
          <View style={styles.noRiderContainer}>
            <Icon name="information-outline" size={24} color="#FF9800" />
            <Text style={styles.noRiderText}>Waiting for rider assignment...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  homeMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
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
  trackingIndicator: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#999',
    marginRight: 8,
  },
  trackingDotActive: {
    backgroundColor: '#4CAF50',
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: height * 0.5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  riderPhone: {
    fontSize: 14,
    color: '#666',
  },
  riderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginBottom: 16,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 12,
    color: '#666',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 8,
  },
  noRiderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  noRiderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginLeft: 8,
  },
});

export default LiveTrackingScreen;
