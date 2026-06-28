// Rider App - Location Tracking Service
import * as Location from 'expo-location';
import socketService from './socketService';

class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.currentRiderId = null;
    this.currentOrderId = null;
  }

  async startTracking(riderId, orderId) {
    if (this.isTracking) {
      console.log('⚠️ Already tracking location');
      return;
    }

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        return false;
      }

      console.log(`🏍️ Starting location tracking for order ${orderId}`);
      this.isTracking = true;
      this.currentRiderId = riderId;
      this.currentOrderId = orderId;

      // Connect socket
      socketService.connect();

      // Notify delivery started
      socketService.startDelivery(riderId, orderId);

      // Watch position and send updates every 3 seconds
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          
          // Send location to backend
          socketService.sendLocation({
            lat: latitude,
            lng: longitude,
            riderId: this.currentRiderId,
            orderId: this.currentOrderId,
          });
        }
      );

      console.log('✅ Location tracking started');
      return true;
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  stopTracking() {
    if (!this.isTracking) {
      console.log('⚠️ Not currently tracking');
      return;
    }

    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }

    // Notify delivery completed
    if (this.currentRiderId && this.currentOrderId) {
      socketService.completeDelivery(this.currentRiderId, this.currentOrderId);
    }

    this.isTracking = false;
    this.currentRiderId = null;
    this.currentOrderId = null;

    console.log('🛑 Location tracking stopped');
  }

  isCurrentlyTracking() {
    return this.isTracking;
  }

  getCurrentOrder() {
    return this.currentOrderId;
  }
}

export default new LocationService();
