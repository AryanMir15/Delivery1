const Order = require('../models/Order');
const User = require('../models/User');
const { calculateETA, calculateDistance, validateCoordinates } = require('./routingService');

class LocationTrackingService {
  constructor() {
    this.trackingIntervals = new Map(); // orderId -> intervalId
  }

  startTracking(orderId, riderId, io) {
    if (this.trackingIntervals.has(orderId)) {
      return; // Already tracking
    }

    console.log(`📍 Location tracking started for order ${orderId}`);
  }

  stopTracking(orderId) {
    if (this.trackingIntervals.has(orderId)) {
      clearInterval(this.trackingIntervals.get(orderId));
      this.trackingIntervals.delete(orderId);
      console.log(`📍 Location tracking stopped for order ${orderId}`);
    }
  }

  async calculateRiderETA(riderLocation, destination) {
    if (!validateCoordinates(riderLocation.lat, riderLocation.lng)) {
      throw new Error('Invalid rider coordinates');
    }
    if (!validateCoordinates(destination.lat, destination.lng)) {
      throw new Error('Invalid destination coordinates');
    }
    return await calculateETA(riderLocation, destination);
  }

  getDistanceToDestination(riderLocation, destination) {
    return calculateDistance(riderLocation, destination);
  }

  async isWithinGeofence(riderLocation, targetLocation, radiusMeters = 500) {
    const distance = calculateDistance(riderLocation, targetLocation);
    return distance <= radiusMeters;
  }
}

module.exports = new LocationTrackingService();
