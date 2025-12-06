// Rider App - Socket.io Service for Sending Location
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SOCKET_URL } from '../config/constants';

// Backend URL is configured in src/config/constants.js
// Change BACKEND_IP in that file to match your computer's IP address

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connecting = false;
  }

  async connect() {
    if (this.socket && this.connected) {
      console.log('✅ Rider socket already connected');
      return this.socket;
    }

    if (this.connecting) {
      console.log('⏳ Socket connection in progress...');
      return null;
    }

    this.connecting = true;
    console.log('🔌 Rider connecting to socket server:', SOCKET_URL);

    // Get auth token from storage - use riderToken to match apolloClient
    const token = await AsyncStorage.getItem('riderToken');
    
    if (!token) {
      console.warn('⚠️ No rider token found, socket connection may fail');
    }
    
    this.socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true,
      auth: {
        token: token || '',
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ Rider socket connected:', this.socket.id);
      this.connected = true;
      this.connecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Rider socket disconnected:', reason);
      this.connected = false;
      this.connecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.connecting = false;
      
      // Provide helpful error messages
      if (error.message.includes('timeout')) {
        console.error('💡 Check if backend server is running on', SOCKET_URL);
      } else if (error.message.includes('Authentication')) {
        console.error('💡 Token authentication failed. Try logging in again.');
      } else if (error.message.includes('websocket error')) {
        console.error('💡 WebSocket failed, trying polling transport...');
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      this.connected = true;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return this.socket;
  }

  // Send rider location to backend
  async sendLocation(data) {
    if (!this.socket) await this.connect();

    const { lat, lng, riderId, orderId } = data;
    
    if (!lat || !lng || !riderId || !orderId) {
      console.error('❌ Missing location data:', data);
      return;
    }

    // Only send if connected
    if (!this.connected) {
      console.warn('⚠️ Socket not connected, skipping location update');
      return;
    }

    try {
      this.socket.emit('rider_location', {
        lat,
        lng,
        riderId,
        orderId,
        timestamp: Date.now(),
      });

      console.log(`📍 Location sent: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (error) {
      console.error('❌ Error sending location:', error.message);
    }
  }

  // Notify delivery started
  async startDelivery(riderId, orderId) {
    if (!this.socket) await this.connect();

    console.log(`🏍️ Starting delivery: ${orderId}`);
    this.socket.emit('rider_start_delivery', { riderId, orderId });
  }

  // Notify delivery completed
  async completeDelivery(riderId, orderId) {
    if (!this.socket) await this.connect();

    console.log(`✅ Completing delivery: ${orderId}`);
    this.socket.emit('rider_complete_delivery', { riderId, orderId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('🔌 Rider socket disconnected');
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new SocketService();
