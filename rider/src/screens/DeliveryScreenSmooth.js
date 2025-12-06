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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';

import { UPDATE_ORDER_STATUS } from '../api/mutations';
import { updateOrderStatus, clearActiveOrder } from '../store/orderSlice';
import SmoothLocationService from '../services/SmoothLocationService';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Google Maps API Key (if you have one, otherwise we'll use OSRM)
const GOOGLE_MAP_KEY = ''; // Add your key here or leave empty for OSRM

const DeliveryScreenSmooth = ({ navigation, route }) => {
  const { order } = route.params;
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  const { rider } = useSelector((state) => state.auth);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [currentStep, setCurrentStep] = useState('pickup');
  
  // Animated coordinate for smooth marker movement
  const [coordinate] = useState(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    })
  );
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [heading, setHeading] = useState(0);

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

    // Poll location every 5 seconds for smooth updates
    const locationInterval = setInterval(() => {
      updateCurrentLocation();
    }, 5000);

    return () => {
      clearInterval(locationInterval);
      SmoothLocationService.stopTracking();
    };
  }, []);

  const startLocationTracking = async () => {
    const riderId = rider?.id || rider?._id;
    const orderId = order?.id || order?._id;
    
    if (!riderId || !orderId) {
      console.error('❌ Missing rider or order ID for tracking');
      Alert.alert('Error', 'Cannot start location tracking - missing data');
      return;
    }
    
    const started = await SmoothLocationService.startTracking(riderId, orderId);
    setIsTracking(started);
    
    if (started) {
      updateCurrentLocation();
    }
  };

  const updateCurrentLocation = () => {
    const location = SmoothLocationService.getCurrentLocation();
    const currentHeading = SmoothLocationService.getHeading();
    
    if (location) {
      setCurrentLocation(location);
      setHeading(currentHeading);
      
      // Animate marker to new position
      animateMarker(location.latitude, location.longitude);
    }
  };

  const animateMarker = (latitude, longitude) => {
    const newCoordinate = { latitude, longitude };
    
    if (Platform.OS === 'android') {
      if (markerRef.current) {
        markerRef.current.animateMarkerToCoordinate(newCoordinate, 5000);
      }
    } else {
      coordinate.timing(newCoordinate).start();
    }
  };

  const onCenter = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  };

  const fetchTime = (d, t) => {
    setDistance(d);
    setDuration(t);
  };

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
              Alert.alert('✅ Order Picked Up', 'Now heading to customer!');
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

  const handleNavigate = (destination) => {
    const { latitude, longitude } = destination;
    const url = Platform.OS === 'ios'
      ? `maps://app?daddr=${latitude},${longitude}`
      : `google.navigation:q=${latitude},${longitude}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application');
    });
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
            latitude: destination.latitude,
            longitude: destination.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* Restaurant Marker */}
          <Marker
            coordinate={restaurantLocation}
            title={order.restaurant.name}
            description={order.restaurant.address}
          >
            <View style={styles.restaurantMarker}>
              <Icon name="store" size={24} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Customer Marker */}
          <Marker
            coordinate={deliveryLocation}
            title="Customer"
            description={order.deliveryAddress.deliveryAddress}
          >
            <View style={styles.customerMarker}>
              <Icon name="home" size={24} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Animated Rider Marker */}
          {currentLocation && (
            <Marker.Animated
              ref={markerRef}
              coordinate={coordinate}
              title="You"
              description="Your current location"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.riderMarker, { transform: [{ rotate: `${heading}deg` }] }]}>
                <Icon name="bike-fast" size={28} color="#FFFFFF" />
              </View>
            </Marker.Animated>
          )}

          {/* Route with Google Maps Directions or fallback */}
          {currentLocation && GOOGLE_MAP_KEY && (
            <MapViewDirections
              origin={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              destination={destination}
              apikey={GOOGLE_MAP_KEY}
              strokeWidth={4}
              strokeColor={currentStep === 'pickup' ? '#FF6B35' : '#2EC4B6'}
              optimizeWaypoints={true}
              onReady={result => {
                fetchTime(result.distance, result.duration);
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    top: 100,
                    right: 50,
                    bottom: 350,
                    left: 50,
                  },
                });
              }}
              onError={(errorMessage) => {
                console.log('Directions error:', errorMessage);
              }}
            />
          )}
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>

        {/* Center Button */}
        <TouchableOpacity
          style={styles.centerButton}
          onPress={onCenter}
        >
          <Icon name="crosshairs-gps" size={24} color="#2EC4B6" />
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
            {currentStep === 'pickup' ? 'Pickup' : 'Delivery'}
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
            {currentLocation?.speed && (
              <View style={styles.routeItem}>
                <Icon name="speedometer" size={20} color="#2EC4B6" />
                <Text style={styles.routeText}>{(currentLocation.speed * 3.6).toFixed(0)} km/h</Text>
              </View>
            )}
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

        {/* Action Buttons Based on Step */}
        {currentStep === 'pickup' ? (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.secondaryButton, updating && styles.mainButtonDisabled]}
              onPress={handleArrivedAtRestaurant}
              disabled={updating}
            >
              <Icon name="map-marker-check" size={20} color="#2EC4B6" />
              <Text style={styles.secondaryButtonText}>Arrived</Text>
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
                  <Text style={styles.mainButtonText}>Picked Up</Text>
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
              <Text style={styles.secondaryButtonText}>Arrived</Text>
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
                  <Text style={styles.mainButtonText}>Delivered</Text>
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
    top: 10,
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
  centerButton: {
    position: 'absolute',
    bottom: 20,
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
  riderMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    top: 10,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mainButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2EC4B6',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#2EC4B6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DeliveryScreenSmooth;
