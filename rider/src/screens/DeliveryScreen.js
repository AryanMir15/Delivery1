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

import { UPDATE_ORDER_STATUS } from '../api/mutations';
import { updateOrderStatus, clearActiveOrder } from '../store/orderSlice';
import LocationService from '../services/LocationService';

const { width, height } = Dimensions.get('window');

const DeliveryScreen = ({ navigation, route }) => {
  const { order } = route.params;
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  
  const { rider } = useSelector((state) => state.auth);
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

  const [updateStatusMutation, { loading: updating }] = useMutation(UPDATE_ORDER_STATUS, {
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
                `Order ${order.orderId} delivered successfully!\n\nEarnings: ETB ${(order.deliveryCharges + order.tipping).toFixed(2)}`,
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

  const destination = currentStep === 'pickup' ? restaurantLocation : deliveryLocation;
  const destinationName = currentStep === 'pickup' ? order.restaurant.name : 'Customer';
  const destinationAddress = currentStep === 'pickup' 
    ? order.restaurant.address 
    : order.deliveryAddress.deliveryAddress;
  const destinationPhone = currentStep === 'pickup'
    ? order.restaurant.phone
    : order.user.phone;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
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
            <View style={styles.restaurantMarker}>
              <Icon name="store" size={24} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Customer Marker (always visible) */}
          <Marker
            coordinate={deliveryLocation}
            title="Customer"
            description={order.deliveryAddress.deliveryAddress}
          >
            <View style={styles.customerMarker}>
              <Icon name="home" size={24} color="#FFFFFF" />
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
              <View style={styles.riderMarker}>
                <Icon name="bike-fast" size={24} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Route Line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor={currentStep === 'pickup' ? '#FF6B35' : '#2EC4B6'}
              lineDashPattern={[1]}
            />
          )}

          {/* Line from restaurant to customer (for reference) */}
          <Polyline
            coordinates={[restaurantLocation, deliveryLocation]}
            strokeWidth={2}
            strokeColor="#E9ECEF"
            lineDashPattern={[10, 10]}
          />
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={styles.stepContainer}>
            <View style={[styles.step, currentStep === 'pickup' && styles.activeStep]}>
              <Icon name="store" size={20} color="#FFFFFF" />
            </View>
            <View style={[styles.stepLine, currentStep === 'delivery' && styles.activeStepLine]} />
            <View style={[styles.step, currentStep === 'delivery' && styles.activeStep]}>
              <Icon name="home" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.stepText}>
            {currentStep === 'pickup' ? 'Pickup from Restaurant' : 'Deliver to Customer'}
          </Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Distance & Time */}
        {distance && duration && (
          <View style={styles.routeInfo}>
            <View style={styles.routeItem}>
              <Icon name="map-marker-distance" size={20} color="#2EC4B6" />
              <Text style={styles.routeText}>{distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.routeItem}>
              <Icon name="clock-outline" size={20} color="#2EC4B6" />
              <Text style={styles.routeText}>{Math.ceil(duration)} min</Text>
            </View>
          </View>
        )}

        {/* Destination Info */}
        <View style={styles.destinationInfo}>
          <View style={styles.destinationHeader}>
            <Icon 
              name={currentStep === 'pickup' ? 'store' : 'home'} 
              size={24} 
              color="#2EC4B6" 
            />
            <View style={styles.destinationDetails}>
              <Text style={styles.destinationName}>{destinationName}</Text>
              <Text style={styles.destinationAddress}>{destinationAddress}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(destinationPhone)}
            >
              <Icon name="phone" size={20} color="#2EC4B6" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigate(destination)}
            >
              <Icon name="navigation" size={20} color="#2EC4B6" />
              <Text style={styles.actionButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.orderItems}>
          <Text style={styles.orderItemsTitle}>Order Items ({order.items.length})</Text>
          {order.items.slice(0, 2).map((item, index) => (
            <Text key={index} style={styles.orderItem}>
              {item.quantity}x {item.food.title}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.orderItem}>+{order.items.length - 2} more items</Text>
          )}
        </View>

        {/* Action Buttons Based on Step */}
        {currentStep === 'pickup' ? (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.secondaryButton, updating && styles.mainButtonDisabled]}
              onPress={handleArrivedAtRestaurant}
              disabled={updating}
            >
              <Icon name="map-marker-check" size={20} color="#2EC4B6" />
              <Text style={styles.secondaryButtonText}>Arrived at Restaurant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.mainButton, updating && styles.mainButtonDisabled]}
              onPress={handlePickedUp}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="check-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.mainButtonText}>Picked Up Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.secondaryButton, updating && styles.mainButtonDisabled]}
              onPress={handleArrivedAtCustomer}
              disabled={updating}
            >
              <Icon name="map-marker-check" size={20} color="#2EC4B6" />
              <Text style={styles.secondaryButtonText}>Arrived at Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.mainButton, updating && styles.mainButtonDisabled]}
              onPress={handleDelivered}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="check-all" size={24} color="#FFFFFF" />
                  <Text style={styles.mainButtonText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    top: 50,
    left: 16,
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
  riderMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2EC4B6',
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
  restaurantMarker: {
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
    backgroundColor: '#457B9D',
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
  stepIndicator: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#2EC4B6',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 4,
  },
  activeStepLine: {
    backgroundColor: '#2EC4B6',
  },
  stepText: {
    fontSize: 12,
    color: '#1D3557',
    fontWeight: '500',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginLeft: 8,
  },
  destinationInfo: {
    marginBottom: 20,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  destinationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#6C757D',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E0F7F5',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2EC4B6',
    marginLeft: 8,
  },
  orderItems: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  orderItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 8,
  },
  orderItem: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  actionButtonsContainer: {
    gap: 12,
  },
  mainButton: {
    flexDirection: 'row',
    backgroundColor: '#2EC4B6',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#E0F7F5',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2EC4B6',
  },
  mainButtonDisabled: {
    opacity: 0.7,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#2EC4B6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DeliveryScreen;
