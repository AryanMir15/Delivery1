const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const cors = require('cors');
const connectDB = require('./config/database');
const typeDefs = require('./graphql/typeDefs');
const { resolvers } = require('./graphql/resolvers');
const { authMiddleware } = require('./middlewares/auth');
const vendorRoutes = require('./routes/vendors');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { initializeSocket } = require('./utils/socketService');

// Create PubSub instance for GraphQL subscriptions
const pubsub = new PubSub();
// Make pubsub globally accessible
global.pubsub = pubsub;

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io for real-time location tracking
initializeSocket(httpServer);

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// Increase JSON body parser limit to handle larger requests (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply JSON parsing to vendor routes with increased limit
app.use('/api/vendors', express.json({ limit: '10mb' }));

// Only apply JSON parsing to non-GraphQL routes
app.use('/health', express.json());
app.use('/upload', express.json({ limit: '10mb' }));

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Vendor management API routes
app.use('/api/vendors', vendorRoutes);

// Payment routes
const paymentRoutes = require('./routes/payment');
app.use('/payment', paymentRoutes);

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Apollo Server setup
const server = new ApolloServer({
  schema,
  context: async ({ req }) => {
    // Extract token from Authorization header
    const token = req.headers.authorization || '';
    let user = null;

    if (token) {
      try {
        // Verify token and get user
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        // Fetch full user from database
        const User = require('./models/User');
        user = await User.findById(decoded.id);
      } catch (error) {
        // Token invalid, user remains null
        console.error('Auth error:', error.message);
      }
    }

    return {
      user,
      pubsub: global.pubsub // Use global pubsub instance
    };
  },
  introspection: true,
  playground: true,
});

// Apply Apollo Server middleware
server.start().then(() => {
  server.applyMiddleware({ app, path: '/graphql' });
});

// Setup WebSocket server for subscriptions
const subscriptionServer = SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
    onConnect: function(connectionParams, webSocket, context) {
      // Handle authentication for WebSocket connections
      const token = connectionParams.authorization || connectionParams.Authorization || '';
      let user = null;

      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
          const User = require('./models/User');
          user = User.findById(decoded.id);
        } catch (error) {
          console.error('WebSocket Auth error:', error.message);
        }
      }

      return { user, pubsub };
    }
  },
  {
    server: httpServer,
    path: server.graphqlPath
  }
);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  subscriptionServer.close();
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

// Export both app and httpServer so server.js can start the server
module.exports = { app, httpServer };
