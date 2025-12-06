import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import socketService from './socketService';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

class LocationTrackingService {
  constructor() {
    this.isTracking = false;
    this.currentOrderId = null;
    this.watchSubscription = null;
  }

  // Request location permissions
  async requestPermissions() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission denied');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('⚠️ Background location permission denied');
        return { foreground: true, background: false };
      }

      console.log('✅ Location permissions granted');
      return { foreground: true, background: true };
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      throw error;
    }
  }

  // Start tracking location
  async startTracking(orderId = null) {
    try {
      if (this.isTracking) {
        console.log('⚠️ Already tracking location');
        return;
      }

      const permissions = await this.requestPermissions();
      
      if (!permissions.foreground) {
        throw new Error('Location permission required');
      }

      this.currentOrderId = orderId;
      this.isTracking = true;

      // Start foreground location tracking
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      console.log('✅ Location tracking started');
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      this.isTracking = false;
      throw error;
    }
  }

  // Stop tracking location
  async stopTracking() {
    try {
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }

      this.isTracking = false;
      this.currentOrderId = null;

      console.log('✅ Location tracking stopped');
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error);
    }
  }

  // Handle location update
  handleLocationUpdate(location) {
    const { latitude, longitude, speed, heading } = location.coords;

    const locationData = {
      lat: latitude,
      lng: longitude,
      speed: speed || 0,
      heading: heading || 0,
      orderId: this.currentOrderId,
      timestamp: Date.now(),
    };

    // Send to backend via Socket.io
    socketService.sendLocation(locationData);

    console.log(`📍 Location update: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  }

  // Get current location once
  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        speed: location.coords.speed || 0,
        heading: location.coords.heading || 0,
      };
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      throw error;
    }
  }

  // Update order being tracked
  setOrderId(orderId) {
    this.currentOrderId = orderId;
  }

  // Check if tracking
  isTrackingActive() {
    return this.isTracking;
  }
}

export default new LocationTrackingService();
