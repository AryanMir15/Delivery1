import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';

import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import { UPDATE_RIDER_ORDER_STATUS } from '../../api/mutations';
import { updateOrderStatus, clearActiveOrder } from '../../store/orderSlice';
import LocationService from '../../services/rider/LocationService';

const { width, height } = Dimensions.get('window');

const DeliveryScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  
  const { user: rider } = useSelector((state) => state.auth);
  const currentLocation = useSelector((state) => state.location.currentLocation);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [currentStep, setCurrentStep] = useState('pickup'); // pickup or delivery
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const restaurantLocation = {
    latitude: order.restaurant.location?.coordinates[1] || 0,
    longitude: order.restaurant.location?.coordinates[0] || 0,
  };

  const deliveryLocation = {
    latitude: order.deliveryAddress.location?.coordinates[1] || 0,
    longitude: order.deliveryAddress.location?.coordinates[0] || 0,
  };

  const [updateStatusMutation, { loading: updating }] = useMutation(UPDATE_RIDER_ORDER_STATUS, {
    onCompleted: (data) => {
      if (data.updateOrderStatus) {
        dispatch(updateOrderStatus({
          orderId: order.id || order._id,
          status: data.updateOrderStatus.orderStatus,
        }));
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  useEffect(() => {
    startLocationTracking();
    
    // Determine current step based on order status
    if (order.orderStatus === 'accepted' || order.orderStatus === 'preparing') {
      setCurrentStep('pickup');
    } else if (order.orderStatus === 'picked' || order.orderStatus === 'out for delivery') {
      setCurrentStep('delivery');
    }

    return () => {
      LocationService.stopTracking();
    };
  }, []);

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      // Center map on current location
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation]);

  const startLocationTracking = async () => {
    const riderId = rider?.id || rider?._id;
    const orderId = order?.id || order?._id;
    
    if (!riderId || !orderId) {
      console.error('❌ Missing rider or order ID for tracking');
      Alert.alert('Error', 'Cannot start location tracking - missing data');
      return;
    }
    
    const started = await LocationService.startTracking(riderId, orderId);
    setIsTracking(started);
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch route from OpenRouteService (free API, no key needed for basic use)
  const fetchRoute = async (origin, destination) => {
    try {
      // Using OSRM (Open Source Routing Machine) - completely free, no API key
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        
        setRouteCoordinates(coordinates);
        
        // Distance in km, duration in minutes
        const distanceKm = route.distance / 1000;
        const durationMin = route.duration / 60;
        
        setDistance(distanceKm);
        setDuration(durationMin);
        
        return coordinates;
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      // Fallback: draw straight line
      setRouteCoordinates([origin, destination]);
      
      // Calculate straight-line distance
      const dist = calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );
      setDistance(dist);
      setDuration(dist * 3); // Rough estimate: 3 min per km
    }
  };

  // Update route when location or step changes
  useEffect(() => {
    if (currentLocation) {
      const origin = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };
      fetchRoute(origin, destination);
    }
  }, [currentLocation, currentStep]);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      const coordinates = [
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        restaurantLocation,
        deliveryLocation,
      ].filter(coord => coord.latitude !== 0 && coord.longitude !== 0);

      if (coordinates.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: {
              top: 100,
              right: 50,
              bottom: 350,
              left: 50,
            },
            animated: true,
          });
        }, 500);
      }
    }
  }, [currentLocation, routeCoordinates]);

  const handleArrivedAtRestaurant = () => {
    Alert.alert(
      'Arrived at Restaurant',
      'Mark that you have arrived at the restaurant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateStatusMutation({
                variables: {
                  id: order.id || order._id,
                  orderStatus: 'ready',
                },
              });
              Alert.alert('✅ Status Updated', 'Restaurant notified of your arrival');
            } catch (error) {
              console.error('Error updating status:', error);
            }
          },
        },
      ]
    );
  };

  const handlePickedUp = () => {
    Alert.alert(
      'Confirm Pickup',
      'Have you picked up the order from the restaurant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateStatusMutation({
                variables: {
                  id: order.id || order._id,
                  orderStatus: 'picked',
                },
              });
              setCurrentStep('delivery');
              Alert.alert('✅ Order Picked Up', 'Now heading to customer. Follow the route!');
            } catch (error) {
              console.error('Error updating status:', error);
            }
          },
        },
      ]
    );
  };

  const handleArrivedAtCustomer = () => {
    Alert.alert(
      'Arrived at Customer',
      'Mark that you have arrived at the delivery location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert('✅ Customer Notified', 'Customer has been notified of your arrival');
          },
        },
      ]
    );
  };

  const handleDelivered = () => {
    Alert.alert(
      'Confirm Delivery',
      'Have you delivered the order to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateStatusMutation({
                variables: {
                  id: order.id || order._id,
                  orderStatus: 'delivered',
                },
              });
              dispatch(clearActiveOrder());
              
              Alert.alert(
                '🎉 Delivery Complete!',
                `Order ${order.orderId} delivered successfully!\n\nEarnings: PKR ${(order.deliveryCharges + order.tipping).toFixed(2)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('HomeMain')
                  }
                ]
              );
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update delivery status');
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // Center map on destination (in-app navigation)
  const handleNavigate = (destination) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
      
      Alert.alert(
        'Navigation',
        'Map centered on destination. Follow the route line to navigate.',
        [
          {
            text: 'Open External Maps',
            onPress: () => {
              const { latitude, longitude } = destination;
              const url = Platform.OS === 'ios'
                ? `maps://app?daddr=${latitude},${longitude}`
                : `google.navigation:q=${latitude},${longitude}`;
              
              Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Unable to open maps application');
              });
            }
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const s = styles(colors, typography, scale);

  const destination = currentStep === 'pickup' ? restaurantLocation : deliveryLocation;
  const destinationName = currentStep === 'pickup' ? order.restaurant.name : 'Customer';
  const destinationAddress = currentStep === 'pickup' 
    ? order.restaurant.address 
    : order.deliveryAddress.deliveryAddress;
  const destinationPhone = currentStep === 'pickup'
    ? order.restaurant.phone
    : order.user.phone;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          style={s.map}
          initialRegion={{
            latitude: currentLocation?.latitude || destination.latitude,
            longitude: currentLocation?.longitude || destination.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton
          followsUserLocation
        >
          {/* Restaurant Marker (always visible) */}
          <Marker
            coordinate={restaurantLocation}
            title={order.restaurant.name}
            description={order.restaurant.address}
          >
            <View style={s.restaurantMarker}>
              <Icon name="store" size={24} color={colors.surface} />
            </View>
          </Marker>

          {/* Customer Marker (always visible) */}
          <Marker
            coordinate={deliveryLocation}
            title="Customer"
            description={order.deliveryAddress.deliveryAddress}
          >
            <View style={s.customerMarker}>
              <Icon name="home" size={24} color={colors.surface} />
            </View>
          </Marker>

          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              title="You"
              description="Your current location"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={s.riderMarker}>
                <Icon name="bike-fast" size={24} color={colors.surface} />
              </View>
            </Marker>
          )}

          {/* Route Line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor={currentStep === 'pickup' ? colors.warning : colors.accent}
              lineDashPattern={[1]}
            />
          )}

          {/* Line from restaurant to customer (for reference) */}
          <Polyline
            coordinates={[restaurantLocation, deliveryLocation]}
            strokeWidth={2}
            strokeColor={colors.border}
            lineDashPattern={[10, 10]}
          />
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Step Indicator */}
        <View style={s.stepIndicator}>
          <View style={s.stepContainer}>
            <View style={[s.step, currentStep === 'pickup' && s.activeStep]}>
              <Icon name="store" size={20} color={colors.surface} />
            </View>
            <View style={[s.stepLine, currentStep === 'delivery' && s.activeStepLine]} />
            <View style={[s.step, currentStep === 'delivery' && s.activeStep]}>
              <Icon name="home" size={20} color={colors.surface} />
            </View>
          </View>
          <Text style={s.stepText}>
            {currentStep === 'pickup' ? 'Pickup from Restaurant' : 'Deliver to Customer'}
          </Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={s.bottomSheet}>
        {/* Distance & Time */}
        {distance && duration && (
          <View style={s.routeInfo}>
            <View style={s.routeItem}>
              <Icon name="map-marker-distance" size={20} color={colors.accent} />
              <Text style={s.routeText}>{distance.toFixed(1)} km</Text>
            </View>
            <View style={s.routeItem}>
              <Icon name="clock-outline" size={20} color={colors.accent} />
              <Text style={s.routeText}>{Math.ceil(duration)} min</Text>
            </View>
          </View>
        )}

        {/* Destination Info */}
        <View style={s.destinationInfo}>
          <View style={s.destinationHeader}>
            <Icon 
              name={currentStep === 'pickup' ? 'store' : 'home'} 
              size={24} 
              color={colors.accent} 
            />
            <View style={s.destinationDetails}>
              <Text style={s.destinationName}>{destinationName}</Text>
              <Text style={s.destinationAddress}>{destinationAddress}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={s.actionButtons}>
            <TouchableOpacity
              style={s.actionButton}
              onPress={() => handleCall(destinationPhone)}
            >
              <Icon name="phone" size={20} color={colors.accent} />
              <Text style={s.actionButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.actionButton}
              onPress={() => handleNavigate(destination)}
            >
              <Icon name="navigation" size={20} color={colors.accent} />
              <Text style={s.actionButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={s.orderItems}>
          <Text style={s.orderItemsTitle}>Order Items ({order.items.length})</Text>
          {order.items.slice(0, 2).map((item, index) => (
            <Text key={index} style={s.orderItem}>
              {item.quantity}x {item.food.title}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text style={s.orderItem}>+{order.items.length - 2} more items</Text>
          )}
        </View>

        {/* Action Buttons Based on Step */}
        {currentStep === 'pickup' ? (
          <View style={s.actionButtonsContainer}>
            <TouchableOpacity
              style={[s.secondaryButton, updating && s.mainButtonDisabled]}
              onPress={handleArrivedAtRestaurant}
              disabled={updating}
            >
              <Icon name="map-marker-check" size={20} color={colors.accent} />
              <Text style={s.secondaryButtonText}>Arrived at Restaurant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[s.mainButton, updating && s.mainButtonDisabled]}
              onPress={handlePickedUp}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Icon name="check-circle" size={24} color={colors.surface} />
                  <Text style={s.mainButtonText}>Picked Up Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.actionButtonsContainer}>
            <TouchableOpacity
              style={[s.secondaryButton, updating && s.mainButtonDisabled]}
              onPress={handleArrivedAtCustomer}
              disabled={updating}
            >
              <Icon name="map-marker-check" size={20} color={colors.accent} />
              <Text style={s.secondaryButtonText}>Arrived at Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[s.mainButton, updating && s.mainButtonDisabled]}
              onPress={handleDelivered}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Icon name="check-all" size={24} color={colors.surface} />
                  <Text style={s.mainButtonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Math.round(50 * scale),
    left: Math.round(16 * scale),
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.2,
    shadowRadius: Math.round(4 * scale),
    elevation: 4,
  },
  riderMarker: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.3,
    shadowRadius: Math.round(4 * scale),
    elevation: 5,
  },
  restaurantMarker: {
    width: Math.round(44 * scale),
    height: Math.round(44 * scale),
    borderRadius: Math.round(22 * scale),
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.3,
    shadowRadius: Math.round(4 * scale),
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
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.3,
    shadowRadius: Math.round(4 * scale),
    elevation: 5,
  },
  stepIndicator: {
    position: 'absolute',
    top: Math.round(50 * scale),
    right: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.2,
    shadowRadius: Math.round(4 * scale),
    elevation: 4,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(8 * scale),
  },
  step: {
    width: Math.round(36 * scale),
    height: Math.round(36 * scale),
    borderRadius: Math.round(18 * scale),
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: colors.accent,
  },
  stepLine: {
    width: Math.round(40 * scale),
    height: Math.round(2 * scale),
    backgroundColor: colors.border,
    marginHorizontal: Math.round(4 * scale),
  },
  activeStepLine: {
    backgroundColor: colors.accent,
  },
  stepText: {
    fontSize: Math.round(12 * scale),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: Math.round(24 * scale),
    borderTopRightRadius: Math.round(24 * scale),
    padding: Math.round(20 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(-4 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(8 * scale),
    elevation: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Math.round(20 * scale),
    paddingBottom: Math.round(20 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: Math.round(8 * scale),
  },
  destinationInfo: {
    marginBottom: Math.round(20 * scale),
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(16 * scale),
  },
  destinationDetails: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  destinationName: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  destinationAddress: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Math.round(12 * scale),
    paddingHorizontal: Math.round(24 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(12 * scale),
  },
  actionButtonText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginLeft: Math.round(8 * scale),
  },
  orderItems: {
    marginBottom: Math.round(20 * scale),
    paddingTop: Math.round(20 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderItemsTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(8 * scale),
  },
  orderItem: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(4 * scale),
  },
  actionButtonsContainer: {
    gap: Math.round(12 * scale),
  },
  mainButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    paddingVertical: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  mainButtonDisabled: {
    opacity: 0.7,
  },
  mainButtonText: {
    color: colors.surface,
    fontSize: Math.round(18 * scale),
    fontWeight: '600',
    marginLeft: Math.round(8 * scale),
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    marginLeft: Math.round(8 * scale),
  },
});

export default DeliveryScreen;
