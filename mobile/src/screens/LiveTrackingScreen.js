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
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const { width, height } = Dimensions.get('window');

const LiveTrackingScreen = ({ route, navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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
        return { icon: 'check-circle', color: colors.success, title: 'Delivered!', subtitle: 'Your order has been delivered' };
      case 'PICKED':
        return { icon: 'bike-fast', color: colors.info, title: 'On the way', subtitle: 'Rider is heading to you' };
      case 'ACCEPTED':
        return { icon: 'chef-hat', color: colors.warning, title: 'Preparing', subtitle: 'Restaurant is preparing your order' };
      default:
        return { icon: 'clock-outline', color: colors.textTertiary, title: 'Order Placed', subtitle: 'Waiting for confirmation' };
    }
  };

  const statusInfo = getStatusInfo();

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerTitle}>Live Tracking</Text>
          <Text style={s.headerSubtitle}>Order #{order?.orderId}</Text>
        </View>
        <TouchableOpacity style={s.refreshButton} onPress={refetch}>
          <Icon name="refresh" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={{
          latitude: userLocation?.latitude || 25.78,
          longitude: userLocation?.longitude || 68.66,
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
            <View style={s.homeMarker}>
              <Icon name="home" size={30} color={colors.success} />
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
            <View style={s.riderMarker}>
              <Icon name="bike-fast" size={30} color={colors.textInverse} />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {userLocation && riderLocation && (
          <Polyline
            coordinates={[riderLocation, userLocation]}
            strokeColor={colors.info}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Tracking Status Indicator */}
      <View style={s.trackingIndicator}>
        <View style={[s.trackingDot, isTracking && s.trackingDotActive]} />
        <Text style={s.trackingText}>
          {isTracking ? 'Live Tracking Active' : 'Connecting...'}
        </Text>
      </View>

      {/* Order Status Card */}
      <View style={s.statusCard}>
        {/* Status Header */}
        <View style={s.statusHeader}>
          <View style={[s.statusIcon, { backgroundColor: `${statusInfo.color}20` }]}>
            <Icon name={statusInfo.icon} size={32} color={statusInfo.color} />
          </View>
          <View style={s.statusInfo}>
            <Text style={s.statusTitle}>{statusInfo.title}</Text>
            <Text style={s.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>
        </View>

        {/* Rider Info */}
        {order?.rider && (
          <View style={s.riderInfo}>
            <View style={s.riderAvatar}>
              <Icon name="account" size={32} color={colors.textInverse} />
            </View>
            <View style={s.riderDetails}>
              <Text style={s.riderName}>{order.rider.name}</Text>
              <Text style={s.riderPhone}>{order.rider.phone}</Text>
            </View>
            <View style={s.riderActions}>
              <TouchableOpacity style={s.actionButton} onPress={handleCallRider}>
                <Icon name="phone" size={24} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity style={s.actionButton} onPress={handleMessageRider}>
                <Icon name="message-text" size={24} color={colors.info} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Address */}
        <View style={s.addressContainer}>
          <Icon name="map-marker" size={24} color={colors.accent} />
          <View style={s.addressInfo}>
            <Text style={s.addressLabel}>Delivery Address</Text>
            <Text style={s.addressText}>
              {order?.deliveryAddress?.deliveryAddress || 'Address not available'}
            </Text>
            {order?.deliveryAddress?.details && (
              <Text style={s.addressDetails}>{order.deliveryAddress.details}</Text>
            )}
          </View>
        </View>

        {/* ETA */}
        {order?.orderStatus === 'PICKED' && riderLocation && (
          <View style={s.etaContainer}>
            <Icon name="clock-fast" size={20} color={colors.info} />
            <Text style={s.etaText}>Estimated arrival: 15-20 min</Text>
          </View>
        )}

        {/* No Rider Yet */}
        {!order?.rider && (
          <View style={s.noRiderContainer}>
            <Icon name="information-outline" size={24} color={colors.warning} />
            <Text style={s.noRiderText}>Waiting for rider assignment...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(12 * scale),
    backgroundColor: colors.success,
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: Math.round(16 * scale),
  },
  headerTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  headerSubtitle: {
    fontSize: Math.round(14 * scale),
    color: 'rgba(255,255,255,0.9)',
    marginTop: Math.round(2 * scale),
  },
  refreshButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  homeMarker: {
    width: Math.round(50 * scale),
    height: Math.round(50 * scale),
    borderRadius: Math.round(25 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.success,
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
  trackingIndicator: {
    position: 'absolute',
    top: Math.round(80 * scale),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(8 * scale),
    borderRadius: Math.round(20 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  trackingDot: {
    width: Math.round(10 * scale),
    height: Math.round(10 * scale),
    borderRadius: Math.round(5 * scale),
    backgroundColor: colors.textTertiary,
    marginRight: Math.round(8 * scale),
  },
  trackingDotActive: {
    backgroundColor: colors.success,
  },
  trackingText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: Math.round(24 * scale),
    borderTopRightRadius: Math.round(24 * scale),
    padding: Math.round(20 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: Math.round(height * 0.5),
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(16 * scale),
  },
  statusIcon: {
    width: Math.round(60 * scale),
    height: Math.round(60 * scale),
    borderRadius: Math.round(30 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(16 * scale),
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  statusSubtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(16 * scale),
  },
  riderAvatar: {
    width: Math.round(50 * scale),
    height: Math.round(50 * scale),
    borderRadius: Math.round(25 * scale),
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(12 * scale),
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  riderPhone: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  riderActions: {
    flexDirection: 'row',
    gap: Math.round(8 * scale),
  },
  actionButton: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(16 * scale),
  },
  addressInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  addressLabel: {
    fontSize: Math.round(12 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginBottom: Math.round(4 * scale),
  },
  addressText: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  addressDetails: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
  },
  etaText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.info,
    marginLeft: Math.round(8 * scale),
  },
  noRiderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(12 * scale),
  },
  noRiderText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.warning,
    marginLeft: Math.round(8 * scale),
  },
});

export default LiveTrackingScreen;
