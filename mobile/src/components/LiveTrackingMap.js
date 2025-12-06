import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import socketService from '../services/socketService';

const LiveTrackingMap = ({ orderId, driverId, deliveryLocation, restaurantLocation }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverStatus, setDriverStatus] = useState('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    // Connect socket and start tracking
    const initializeTracking = async () => {
      const connected = await socketService.connect();
      
      if (connected) {
        socketService.trackOrder(orderId, driverId);
      }
    };

    initializeTracking();

    // Listen for driver location updates
    const handleLocationUpdate = (data) => {
      if (data.driverId === driverId) {
        setDriverLocation({
          latitude: data.lat,
          longitude: data.lng,
          speed: data.speed,
          heading: data.heading,
        });
        setIsLoading(false);

        // Animate map to show driver location
        if (mapRef.current && data.lat && data.lng) {
          mapRef.current.animateToRegion({
            latitude: data.lat,
            longitude: data.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 1000);
        }
      }
    };

    // Listen for driver status changes
    const handleStatusChange = (data) => {
      if (data.driverId === driverId) {
        setDriverStatus(data.status);
      }
    };

    socketService.on('driver_location_update', handleLocationUpdate);
    socketService.on('driver_status_changed', handleStatusChange);

    // Cleanup
    return () => {
      socketService.off('driver_location_update', handleLocationUpdate);
      socketService.off('driver_status_changed', handleStatusChange);
      socketService.stopTracking(orderId);
    };
  }, [orderId, driverId]);

  // Calculate initial region
  const getInitialRegion = () => {
    if (driverLocation) {
      return {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    
    if (restaurantLocation) {
      return {
        latitude: restaurantLocation.latitude,
        longitude: restaurantLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Default to Addis Ababa
    return {
      latitude: 9.0320,
      longitude: 38.7469,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  // Fit map to show all markers
  const fitToMarkers = () => {
    if (mapRef.current && driverLocation && deliveryLocation) {
      const markers = [driverLocation, deliveryLocation];
      if (restaurantLocation) {
        markers.push(restaurantLocation);
      }
      
      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (driverLocation && deliveryLocation) {
      setTimeout(fitToMarkers, 500);
    }
  }, [driverLocation, deliveryLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={getInitialRegion()}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Restaurant Marker */}
        {restaurantLocation && (
          <Marker
            coordinate={restaurantLocation}
            title="Restaurant"
            description="Pickup Location"
          >
            <View style={styles.markerContainer}>
              <Icon name="store" size={30} color="#FF6B6B" />
            </View>
          </Marker>
        )}

        {/* Driver Marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description={`Status: ${driverStatus}`}
            rotation={driverLocation.heading || 0}
          >
            <View style={styles.driverMarkerContainer}>
              <Icon name="bike-fast" size={35} color="#2EC4B6" />
            </View>
          </Marker>
        )}

        {/* Delivery Location Marker */}
        {deliveryLocation && (
          <Marker
            coordinate={deliveryLocation}
            title="Delivery Location"
            description="Your Address"
          >
            <View style={styles.markerContainer}>
              <Icon name="map-marker" size={35} color="#4ECDC4" />
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {driverLocation && deliveryLocation && (
          <Polyline
            coordinates={[driverLocation, deliveryLocation]}
            strokeColor="#2EC4B6"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2EC4B6" />
          <Text style={styles.loadingText}>Connecting to driver...</Text>
        </View>
      )}

      {/* Driver Status Badge */}
      {driverLocation && (
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: driverStatus === 'online' ? '#4CAF50' : '#FF9800' }]} />
          <Text style={styles.statusText}>
            {driverStatus === 'online' ? 'Driver Active' : 'Driver Offline'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  driverMarkerContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#2EC4B6',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default LiveTrackingMap;
