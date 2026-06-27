// Customer App - Socket.io Service for Live Tracking
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URL - change to your WiFi IP for physical device testing
// Android emulator: '10.0.2.2' | iOS simulator: 'localhost' | Physical: your WiFi IP
const SOCKET_URL = 'http://10.0.2.2:4000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    if (this.socket && this.connected) {
      console.log('✅ Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting to socket server:', SOCKET_URL);

    // Get auth token from storage
    const token = await AsyncStorage.getItem('token');

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
      auth: {
        token: token || '',
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ Customer socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Customer socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return this.socket;
  }

  // Subscribe to order tracking
  async subscribeToOrder(orderId, customerId, onLocationUpdate) {
    if (!this.socket) await this.connect();

    console.log(`📍 Customer subscribing to order: ${orderId}`);

    // Join order room
    this.socket.emit('subscribe_order', { orderId, customerId });

    // Listen for location updates
    this.socket.on('driver_location_update', (data) => {
      console.log('📍 Rider location received:', data);
      if (onLocationUpdate) {
        onLocationUpdate(data);
      }
    });

    // Listen for delivery events
    this.socket.on('delivery_started', (data) => {
      console.log('🏍️ Delivery started:', data);
    });

    this.socket.on('order_delivered', (data) => {
      console.log('✅ Order delivered:', data);
    });
  }

  // Unsubscribe from order tracking
  unsubscribeFromOrder(orderId) {
    if (!this.socket) return;

    console.log(`📍 Unsubscribing from order: ${orderId}`);
    this.socket.emit('unsubscribe_order', { orderId });
    this.socket.off('driver_location_update');
    this.socket.off('delivery_started');
    this.socket.off('order_delivered');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new SocketService();
