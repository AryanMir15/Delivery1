import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { apolloClient } from '../api/apolloClient';
import { UPDATE_RIDER_LOCATION } from '../api/mutations';

class SmoothLocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.riderId = null;
    this.orderId = null;
    this.updateInterval = null;
    this.currentLocation = null;
    this.heading = 0;
  }

  async startTracking(riderId, orderId) {
    if (this.isTracking) {
      console.log('⚠️ Tracking already active');
      return true;
    }

    try {
      // Request location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.error('❌ Location permission denied');
        return false;
      }

      // Request background permissions for continuous tracking
      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('⚠️ Background location permission denied');
        }
      }

      this.riderId = riderId;
      this.orderId = orderId;
      this.isTracking = true;

      console.log('✅ Starting smooth location tracking...');
      console.log(`📍 Rider ID: ${riderId}, Order ID: ${orderId}`);

      // Start watching location with high accuracy
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      return true;
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  handleLocationUpdate(location) {
    const { latitude, longitude, heading, speed } = location.coords;
    
    this.currentLocation = {
      latitude,
      longitude,
      heading: heading || this.heading || 0,
      speed: speed || 0,
      timestamp: location.timestamp,
    };

    // Update heading if available
    if (heading !== null && heading !== undefined && heading !== -1) {
      this.heading = heading;
    }

    console.log(`📍 Location Update: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}] Heading: ${this.heading.toFixed(0)}°`);

    // Send to backend
    this.sendLocationToBackend();
  }

  async sendLocationToBackend() {
    if (!this.currentLocation || !this.riderId || !this.orderId) {
      return;
    }

    try {
      const { latitude, longitude, heading } = this.currentLocation;

      await apolloClient.mutate({
        mutation: UPDATE_RIDER_LOCATION,
        variables: {
          riderId: this.riderId,
          orderId: this.orderId,
          location: {
            latitude,
            longitude,
          },
          heading,
        },
      });

      console.log('✅ Location sent to backend');
    } catch (error) {
      console.error('❌ Error sending location to backend:', error.message);
    }
  }

  getCurrentLocation() {
    return this.currentLocation;
  }

  getHeading() {
    return this.heading;
  }

  async stopTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
    this.riderId = null;
    this.orderId = null;
    this.currentLocation = null;
    this.heading = 0;

    console.log('🛑 Location tracking stopped');
  }

  isActive() {
    return this.isTracking;
  }
}

export default new SmoothLocationService();
