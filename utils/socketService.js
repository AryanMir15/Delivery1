const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const activeDrivers = new Map(); // driverId -> { socketId, location, status }
const activeCustomers = new Map(); // customerId -> socketId
const orderTracking = new Map(); // orderId -> { driverId, customerIds[] }

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['*'],
    },
    transports: ['polling', 'websocket'], // Try polling first
    allowEIO3: true, // Support older clients
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e8,
    allowUpgrades: true,
    perMessageDeflate: false,
  });

  console.log('🔌 Socket.io server starting with config:');
  console.log('   - CORS: enabled for all origins');
  console.log('   - Transports: polling, websocket');
  console.log('   - Auth: relaxed for testing');
  console.log('   - Listening on all interfaces');

  // Authentication middleware - VERY PERMISSIVE FOR TESTING
  io.use(async (socket, next) => {
    console.log('🔌 Socket connection attempt from:', socket.handshake.address);
    console.log('   Transport:', socket.conn.transport.name);
    
    try {
      const token = socket.handshake.auth.token;
      if (!token || token === '') {
        console.warn('⚠️ No token provided - allowing connection for testing');
        socket.userId = 'anonymous-' + Date.now();
        socket.userRole = 'rider';
        socket.userName = 'Anonymous Rider';
        return next(); // Allow connection
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          console.warn('⚠️ User not found - allowing anyway');
          socket.userId = 'anonymous-' + Date.now();
          socket.userRole = 'rider';
          socket.userName = 'Anonymous Rider';
          return next();
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.userName = user.name;
        console.log(`✅ Authenticated: ${user.name} (${user.role})`);
        return next();
      } catch (jwtError) {
        console.warn('⚠️ JWT verification failed - allowing anyway');
        socket.userId = 'anonymous-' + Date.now();
        socket.userRole = 'rider';
        socket.userName = 'Anonymous Rider';
        return next();
      }
    } catch (error) {
      console.error('❌ Socket auth error:', error.message);
      // Still allow connection
      socket.userId = 'anonymous-' + Date.now();
      socket.userRole = 'rider';
      socket.userName = 'Anonymous Rider';
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.userName} (${socket.userRole})`);

    // DRIVER EVENTS
    if (socket.userRole === 'rider') {
      handleDriverConnection(socket);
    }

    // CUSTOMER EVENTS
    if (socket.userRole === 'customer') {
      handleCustomerConnection(socket);
    }

    // Common disconnect
    socket.on('disconnect', () => {
      handleDisconnect(socket);
    });
  });

  console.log('🔌 Socket.io initialized');
  return io;
}

// DRIVER HANDLERS
function handleDriverConnection(socket) {
  const driverId = socket.userId;

  // Mark driver as online
  activeDrivers.set(driverId, {
    socketId: socket.id,
    location: null,
    status: 'online',
    lastUpdate: Date.now(),
  });

  socket.join(`driver:${driverId}`);
  
  console.log(`🚗 Driver ${socket.userName} is online`);

  // Broadcast driver online status
  io.emit('driver_status_changed', {
    driverId,
    status: 'online',
    timestamp: Date.now(),
  });

  // Listen for location updates from rider app
  socket.on('rider_location', async (data) => {
    try {
      const { lat, lng, speed, heading, orderId, riderId } = data;

      if (!lat || !lng) {
        console.error('❌ Invalid location data:', data);
        return socket.emit('error', { message: 'Invalid location data' });
      }

      // Update driver location in memory
      const driverData = activeDrivers.get(driverId);
      if (driverData) {
        driverData.location = { lat, lng, speed, heading };
        driverData.lastUpdate = Date.now();
      }

      // Update database
      await User.findByIdAndUpdate(driverId, {
        currentLocation: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        lastLocationUpdate: new Date(),
      });

      // Broadcast to customers tracking this order
      if (orderId) {
        io.to(`order:${orderId}`).emit('driver_location_update', {
          driverId,
          lat,
          lng,
          speed,
          heading,
          timestamp: Date.now(),
        });
        
        console.log(`📍 Driver ${socket.userName} location sent to order ${orderId}: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Driver availability toggle
  socket.on('driver_availability', async (data) => {
    try {
      const { available } = data;
      
      await User.findByIdAndUpdate(driverId, { available });
      
      const driverData = activeDrivers.get(driverId);
      if (driverData) {
        driverData.status = available ? 'online' : 'offline';
      }

      io.emit('driver_status_changed', {
        driverId,
        status: available ? 'online' : 'offline',
        timestamp: Date.now(),
      });

      console.log(`🚗 Driver ${socket.userName} availability: ${available}`);
    } catch (error) {
      console.error('Error updating driver availability:', error);
    }
  });

  // Driver accepts order or starts delivery
  socket.on('driver_accept_order', (data) => {
    const { orderId } = data;
    
    // Create tracking session
    const tracking = orderTracking.get(orderId);
    if (tracking) {
      tracking.driverId = driverId;
    } else {
      orderTracking.set(orderId, {
        driverId,
        customerIds: [],
      });
    }

    socket.join(`order:${orderId}`);
    
    // Notify customers
    io.to(`order:${orderId}`).emit('driver_assigned', {
      orderId,
      driverId,
      driverName: socket.userName,
      timestamp: Date.now(),
    });

    console.log(`✅ Driver ${socket.userName} accepted order ${orderId}`);
  });

  // Rider starts delivery (from rider app)
  socket.on('rider_start_delivery', (data) => {
    const { orderId, riderId } = data;
    
    // Create tracking session
    const tracking = orderTracking.get(orderId);
    if (tracking) {
      tracking.driverId = riderId || driverId;
    } else {
      orderTracking.set(orderId, {
        driverId: riderId || driverId,
        customerIds: [],
      });
    }

    socket.join(`order:${orderId}`);
    
    // Notify customers delivery started
    io.to(`order:${orderId}`).emit('delivery_started', {
      orderId,
      driverId: riderId || driverId,
      driverName: socket.userName,
      timestamp: Date.now(),
    });

    console.log(`🏍️ Driver ${socket.userName} started delivery for order ${orderId}`);
  });

  // Rider completes delivery
  socket.on('rider_complete_delivery', (data) => {
    const { orderId } = data;
    
    // Notify customers order delivered
    io.to(`order:${orderId}`).emit('order_delivered', {
      orderId,
      driverId,
      timestamp: Date.now(),
    });

    // Clean up tracking
    orderTracking.delete(orderId);
    socket.leave(`order:${orderId}`);

    console.log(`✅ Driver ${socket.userName} completed delivery for order ${orderId}`);
  });
}

// CUSTOMER HANDLERS
function handleCustomerConnection(socket) {
  const customerId = socket.userId;

  activeCustomers.set(customerId, socket.id);
  socket.join(`customer:${customerId}`);

  console.log(`👤 Customer ${socket.userName} connected`);

  // Customer starts tracking order (subscribe_order event from mobile app)
  socket.on('subscribe_order', (data) => {
    const { orderId, customerId: customerIdFromData } = data;

    socket.join(`order:${orderId}`);

    // Add customer to tracking
    const tracking = orderTracking.get(orderId);
    if (tracking) {
      if (!tracking.customerIds.includes(customerId)) {
        tracking.customerIds.push(customerId);
      }
    } else {
      orderTracking.set(orderId, {
        driverId: null,
        customerIds: [customerId],
      });
    }

    // Send current driver location if available
    const tracking2 = orderTracking.get(orderId);
    if (tracking2 && tracking2.driverId) {
      const driverData = activeDrivers.get(tracking2.driverId);
      if (driverData && driverData.location) {
        socket.emit('driver_location_update', {
          driverId: tracking2.driverId,
          ...driverData.location,
          timestamp: driverData.lastUpdate,
        });
      }
    }

    console.log(`📱 Customer ${socket.userName} tracking order ${orderId}`);
  });

  // Legacy track_order event for compatibility
  socket.on('track_order', (data) => {
    socket.emit('subscribe_order', data);
  });

  // Customer stops tracking (unsubscribe_order event from mobile app)
  socket.on('unsubscribe_order', (data) => {
    const { orderId } = data;
    socket.leave(`order:${orderId}`);

    const tracking = orderTracking.get(orderId);
    if (tracking) {
      tracking.customerIds = tracking.customerIds.filter(id => id !== customerId);
    }

    console.log(`📱 Customer ${socket.userName} stopped tracking order ${orderId}`);
  });

  // Legacy stop_tracking event for compatibility
  socket.on('stop_tracking', (data) => {
    socket.emit('unsubscribe_order', data);
  });
}

// DISCONNECT HANDLER
function handleDisconnect(socket) {
  const userId = socket.userId;
  const userRole = socket.userRole;

  if (userRole === 'rider') {
    const driverData = activeDrivers.get(userId);
    if (driverData) {
      driverData.status = 'offline';
    }

    io.emit('driver_status_changed', {
      driverId: userId,
      status: 'offline',
      timestamp: Date.now(),
    });

    console.log(`🚗 Driver ${socket.userName} disconnected`);
  }

  if (userRole === 'customer') {
    activeCustomers.delete(userId);
    console.log(`👤 Customer ${socket.userName} disconnected`);
  }
}

// UTILITY FUNCTIONS
function getActiveDrivers() {
  return Array.from(activeDrivers.entries()).map(([driverId, data]) => ({
    driverId,
    ...data,
  }));
}

function getDriverLocation(driverId) {
  const driverData = activeDrivers.get(driverId);
  return driverData ? driverData.location : null;
}

function notifyOrderUpdate(orderId, event, data) {
  if (io) {
    io.to(`order:${orderId}`).emit(event, {
      orderId,
      ...data,
      timestamp: Date.now(),
    });
  }
}

module.exports = {
  initializeSocket,
  getActiveDrivers,
  getDriverLocation,
  notifyOrderUpdate,
  getIO: () => io,
};
