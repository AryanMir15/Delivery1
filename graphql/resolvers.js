const User = require('../models/User');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Addon = require('../models/Addon');
const Variation = require('../models/Variation');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Configuration = require('../models/Configuration');
const OTP = require('../models/OTP');
const { generateToken } = require('../middlewares/auth');
const { sendOTPEmail, sendOTPSMS, generateOTP } = require('../utils/emailService');
const { PubSub } = require('graphql-subscriptions');
const chapaService = require('../utils/chapaService');

// PubSub instance for real-time subscriptions
const pubsub = new PubSub();

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    },
    profile: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return context.user;
    },
    users: async () => {
      return await User.find({});
    },
    user: async (parent, { id }) => {
      return await User.findById(id);
    },

    // Category queries
    categories: async () => {
      return await Category.find({ isActive: true });
    },
    category: async (parent, { id }) => {
      return await Category.findById(id);
    },

    // Restaurant queries
    restaurants: async () => {
      return await Restaurant.find({ isActive: true }).populate('owner');
    },
    restaurant: async (parent, { id }) => {
      return await Restaurant.findById(id).populate('owner');
    },
    restaurantsByOwner: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return await Restaurant.find({ owner: context.user._id }).populate('owner');
    },

    // Food queries
    foods: async (parent, { restaurant }) => {
      const query = { isActive: true };
      if (restaurant) {
        query.restaurant = restaurant;
      }
      return await Food.find(query)
        .populate('category')
        .populate('restaurant')
        .populate('variations');
    },
    food: async (parent, { id }) => {
      return await Food.findById(id)
        .populate('category')
        .populate('restaurant')
        .populate('variations');
    },

    // Addon queries
    addons: async () => {
      return await Addon.find({ isActive: true });
    },
    addon: async (parent, { id }) => {
      return await Addon.findById(id);
    },

    // Order queries
    orders: async (parent, { offset, limit }) => {
      const query = Order.find({ isActive: true })
        .populate('user')
        .populate('restaurant')
        .populate('rider')
        .populate('items.food')
        .sort({ createdAt: -1 });

      if (offset !== undefined) query.skip(offset);
      if (limit !== undefined) query.limit(limit);

      return await query;
    },
    order: async (parent, { id }) => {
      return await Order.findById(id)
        .populate('user')
        .populate('restaurant')
        .populate('rider')
        .populate('items.food');
    },
    
    // Pending orders for riders (orders waiting for acceptance)
    pendingOrders: async (parent, args, context) => {
      if (!context.user || context.user.role !== 'rider') {
        throw new Error('Only riders can view pending orders');
      }

      // Find orders where this rider is in pendingRiders array
      // and order status is still 'pending'
      return await Order.find({
        pendingRiders: context.user._id,
        orderStatus: 'pending',
        isActive: true
      })
        .populate('restaurant')
        .populate('user')
        .sort({ createdAt: -1 });
    },
    ordersByUser: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return await Order.find({ user: context.user._id, isActive: true })
        .populate('restaurant')
        .populate('rider')
        .populate('items.food')
        .sort({ createdAt: -1 });
    },
    availableOrdersForRider: async (parent, args, context) => {
      if (!context.user || context.user.role !== 'rider') {
        throw new Error('Only riders can access this');
      }
      
      // Find orders where this rider is in pendingRiders list and order is not yet assigned
      return await Order.find({
        pendingRiders: context.user._id,
        rider: null, // Not yet assigned
        orderStatus: 'pending',
        isActive: true
      })
        .populate('restaurant')
        .populate('user')
        .populate('items.food')
        .sort({ createdAt: -1 });
    },
    ordersByRestaurant: async (parent, { restaurant }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Check if user owns the restaurant or is admin
      const restaurantDoc = await Restaurant.findById(restaurant);
      if (!restaurantDoc) {
        throw new Error('Restaurant not found');
      }

      if (restaurantDoc.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      return await Order.find({ restaurant, isActive: true })
        .populate('user')
        .populate('rider')
        .populate('items.food')
        .sort({ createdAt: -1 });
    },
    ordersByRider: async (parent, args, context) => {
      if (!context.user || context.user.role !== 'rider') {
        throw new Error('Not authorized');
      }
      
      console.log('🔍 ordersByRider - Rider ID:', context.user._id);
      
      // Return both: orders assigned to this rider AND pending orders without a rider
      const orders = await Order.find({ 
        $or: [
          { rider: context.user._id, isActive: true },
          { orderStatus: 'pending', rider: null, isActive: true }
        ]
      })
        .populate('user')
        .populate('restaurant')
        .populate('rider')
        .populate('items.food')
        .sort({ createdAt: -1 });
      
      console.log('📦 Found orders:', orders.length);
      orders.forEach(o => console.log(`   - ${o.orderId}: ${o.orderStatus}, rider: ${o.rider?._id || 'none'}`));
      
      return orders;
    },

    // Zone queries
    zones: async () => {
      // TODO: Implement Zone model and return zones
      return [];
    },

    // Configuration
    configuration: async () => {
      // Return default configuration with all required fields
      return {
        _id: "default-config",
        email: process.env.DEFAULT_EMAIL || "",
        emailName: process.env.DEFAULT_EMAIL_NAME || "Food Delivery",
        enableEmail: process.env.ENABLE_EMAIL === 'true',
        currency: "USD",
        currencySymbol: "$",
        deliveryRate: 5.0,
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
        twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || "",
        twilioEnabled: process.env.TWILIO_ENABLED === 'true',
        skipWhatsAppOTP: process.env.SKIP_WHATSAPP_OTP === 'true',
        isPaidVersion: false,
        skipEmailVerification: true,
        skipMobileVerification: true,
        costType: "FIXED",
        googleApiKey: process.env.GOOGLE_API_KEY || "",
        firebaseKey: process.env.FIREBASE_KEY || "",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
        appId: process.env.FIREBASE_APP_ID || "",
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || "",
        vapidKey: process.env.VAPID_KEY || "",
        termsAndConditions: "Terms and Conditions",
        privacyPolicy: "Privacy Policy"
      };
    },

    // Vendors
    vendors: async () => {
      // Return users with vendor/owner role
      const vendors = await User.find({
        role: { $in: ['vendor', 'owner'] }
      });
       
      const vendorsWithRestaurants = await Promise.all(
        vendors.map(async (vendor) => {
          const restaurants = await Restaurant.find({ owner: vendor._id });
          return {
            _id: vendor._id,
            unique_id: vendor._id.toString(),
            email: vendor.email,
            userType: vendor.role,
            isActive: vendor.isActive || false,
            name: vendor.name || '',
            image: vendor.profileImage || '',
            restaurants: restaurants
          };
        })
      );
       
      return vendorsWithRestaurants;
    },

    // Web Notifications
    webNotifications: async () => {
      // Return sample notifications with required fields
      return [
        {
          _id: '1',
          title: 'Welcome!',
          body: 'Welcome to our food delivery app',
          navigateTo: '/home',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'New Order',
          body: 'You have received a new order',
          navigateTo: '/orders',
          read: false,
          createdAt: new Date().toISOString()
        }
      ];
    },

    // User favourite
    userFavourite: async (parent, { latitude, longitude }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Return restaurants that are in user's favourites
      // For now, return empty array - implement based on user's favourite list
      return [];
    },

    userFavorites: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const user = await User.findById(context.user._id);
      if (!user.favourite || user.favourite.length === 0) {
        return [];
      }

      return await Food.find({ _id: { $in: user.favourite } })
        .populate('category')
        .populate('restaurant')
        .populate('variations');
    },

    // Review queries
    reviews: async (parent, { restaurant, page = 1, limit = 10, rating }) => {
      const query = { restaurant, isActive: true };
      if (rating) {
        query.rating = rating;
      }

      const skip = (page - 1) * limit;
      
      const reviews = await Review.find(query)
        .populate('user', 'name profileImage')
        .populate('restaurant', 'name')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return reviews;
    },

    review: async (parent, { id }) => {
      return await Review.findById(id)
        .populate('user', 'name profileImage')
        .populate('restaurant', 'name')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        });
    },

    reviewsByUser: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return await Review.find({ user: context.user._id, isActive: true })
        .populate('restaurant', 'name image')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        })
        .sort({ createdAt: -1 });
    },

    restaurantReviewStats: async (parent, { restaurant }) => {
      const stats = await Review.aggregate([
        { $match: { restaurant: restaurant, isActive: true } },
        {
          $group: {
            _id: '$restaurant',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: []
        };
      }

      const result = stats[0];
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: result.ratingDistribution.filter(r => r === rating).length
      }));

      return {
        averageRating: Math.round(result.averageRating * 10) / 10,
        totalReviews: result.totalReviews,
        ratingDistribution: distribution
      };
    },

    canUserReviewOrder: async (parent, { orderId }, context) => {
      if (!context.user) {
        return false;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return false;
      }

      // Check if order belongs to user
      if (order.user.toString() !== context.user._id.toString()) {
        return false;
      }

      // Check if order is delivered
      if (order.orderStatus !== 'delivered') {
        return false;
      }

      // Check if user already reviewed this order
      const existingReview = await Review.findOne({
        order: orderId,
        user: context.user._id
      });

      return !existingReview;
    },

    // Coupon queries
    coupons: async (parent, { page = 1, limit = 10, search }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Only admin and restaurant owners can view all coupons
      if (context.user.role !== 'admin' && context.user.role !== 'restaurant') {
        throw new Error('Not authorized');
      }

      const skip = (page - 1) * limit;
      const query = {};

      if (search) {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // If restaurant owner, only show their coupons
      if (context.user.role === 'restaurant') {
        const restaurants = await Restaurant.find({ owner: context.user._id });
        const restaurantIds = restaurants.map(r => r._id);
        query.applicableRestaurants = { $in: restaurantIds };
      }

      return await Coupon.find(query)
        .populate('createdBy', 'name email')
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    },

    coupon: async (parent, { id, code }) => {
      let coupon;
      if (id) {
        coupon = await Coupon.findById(id)
          .populate('createdBy', 'name email')
          .populate('applicableRestaurants', 'name')
          .populate('applicableCategories', 'title')
          .populate('applicableFoods', 'title')
          .populate('usageHistory.user', 'name email');
      } else if (code) {
        coupon = await Coupon.findOne({ code: code.toUpperCase() })
          .populate('createdBy', 'name email')
          .populate('applicableRestaurants', 'name')
          .populate('applicableCategories', 'title')
          .populate('applicableFoods', 'title');
      }
      return coupon;
    },

    validateCoupon: async (parent, { code, orderAmount, restaurantId }, context) => {
      const coupon = await Coupon.findOne({ code: code.toUpperCase() })
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title');

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      if (!coupon.isValid()) {
        throw new Error('Coupon is not valid or has expired');
      }

      // Check if restaurant is applicable
      if (coupon.applicableRestaurants.length > 0) {
        const isApplicable = coupon.applicableRestaurants.some(
          restaurant => restaurant._id.toString() === restaurantId
        );
        if (!isApplicable) {
          throw new Error('Coupon is not applicable for this restaurant');
        }
      }

      // Check minimum order amount
      if (orderAmount < coupon.minimumAmount) {
        throw new Error(`Minimum order amount is ${coupon.minimumAmount}`);
      }

      // Check user usage limit
      if (context.user) {
        const userUsageCount = coupon.usageHistory.filter(
          usage => usage.user.toString() === context.user._id.toString()
        ).length;
        
        if (userUsageCount >= coupon.userUsageLimit) {
          throw new Error('You have reached the maximum usage limit for this coupon');
        }
      }

      return coupon;
    },

    couponsByCreator: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      return await Coupon.find({ createdBy: context.user._id })
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title')
        .sort({ createdAt: -1 });
    },

    availableCoupons: async (parent, { restaurantId, orderAmount }, context) => {
      const query = {
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      };

      if (restaurantId) {
        query.$or = [
          { applicableRestaurants: { $size: 0 } }, // No specific restaurants (applies to all)
          { applicableRestaurants: restaurantId }
        ];
      }

      if (orderAmount) {
        query.minimumAmount = { $lte: orderAmount };
      }

      // Filter out coupons that have reached usage limit
      query.$or = [
        { usageLimit: 0 }, // Unlimited
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ];

      const coupons = await Coupon.find(query)
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title');

      // Filter valid coupons
      return coupons.filter(coupon => coupon.isValid());
    },

    // Restaurant queries
    nearByRestaurantsPreview: async (parent, { latitude, longitude }) => {
      // TODO: Implement geospatial query for nearby restaurants
      return await Restaurant.find({ isActive: true }).populate('owner').limit(10);
    },

    nearByRestaurantsCuisines: async (parent, { latitude, longitude, shopType }) => {
      try {
        // Get all restaurants and extract unique cuisines
        const restaurants = await Restaurant.find({ isActive: true });

        const cuisinesMap = new Map();

        restaurants.forEach(restaurant => {
          if (restaurant.cuisines && Array.isArray(restaurant.cuisines)) {
            restaurant.cuisines.forEach(cuisineName => {
              // Filter by shopType if provided
              if (!shopType || restaurant.shopType === shopType) {
                if (!cuisinesMap.has(cuisineName)) {
                  cuisinesMap.set(cuisineName, {
                    _id: cuisineName, // Use cuisine name as ID for now
                    name: cuisineName,
                    description: `${cuisineName} cuisine`,
                    image: null, // TODO: Add cuisine images
                    shopType: restaurant.shopType || 'restaurant'
                  });
                }
              }
            });
          }
        });

        return Array.from(cuisinesMap.values());
      } catch (error) {
        console.error('Error fetching nearby restaurants cuisines:', error);
        return [];
      }
    },

    mostOrderedRestaurantsPreview: async (parent, { latitude, longitude, page = 1, limit = 10, shopType }) => {
      try {
        // For now, return restaurants sorted by creation date (newest first)
        // TODO: Implement proper ordering based on order count
        const query = { isActive: true };
        if (shopType) {
          query.shopType = shopType;
        }

        const restaurants = await Restaurant.find(query)
          .populate('owner')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        return restaurants;
      } catch (error) {
        console.error('Error fetching most ordered restaurants:', error);
        return [];
      }
    },

    // Admin-specific Restaurant queries with field mappings
    getClonedRestaurants: async () => {
      const restaurants = await Restaurant.find({}).populate('owner');
      return restaurants.map(restaurant => ({
        ...restaurant.toObject(),
        unique_restaurant_id: restaurant._id,
        orderId: restaurant.orderPrefix || '',
        userType: restaurant.owner ? restaurant.owner.role : 'unknown'
      }));
    },

    restaurantsPaginated: async (parent, { page = 1, limit = 10, search = '' }) => {
      const skip = (page - 1) * limit;
      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const restaurants = await Restaurant.find(query)
        .populate('owner')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const totalCount = await Restaurant.countDocuments(query);

      return {
        data: restaurants.map(restaurant => ({
          ...restaurant.toObject(),
          unique_restaurant_id: restaurant._id,
          orderId: restaurant.orderPrefix || '',
          userType: restaurant.owner ? restaurant.owner.role : 'unknown',
          status: restaurant.isActive ? 'active' : 'inactive'
        })),
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      };
    },

    // Admin-specific Order queries
    getActiveOrders: async (parent, { restaurantId, page = 1, rowsPerPage = 10, actions, search }) => {
      const skip = (page - 1) * rowsPerPage;
      const query = { isActive: true };
      
      if (restaurantId) {
        query.restaurant = restaurantId;
      }
      
      if (actions && actions.length > 0) {
        query.orderStatus = { $in: actions };
      }
      
      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: 'i' } },
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'deliveryAddress.deliveryAddress': { $regex: search, $options: 'i' } }
        ];
      }

      const orders = await Order.find(query)
        .populate('user')
        .populate('restaurant')
        .populate('rider')
        .populate('zone')
        .populate('items.food')
        .skip(skip)
        .limit(rowsPerPage)
        .sort({ createdAt: -1 });

      const totalCount = await Order.countDocuments(query);

      return {
        totalCount,
        orders: orders.map(order => ({
          ...order.toObject(),
          status: order.orderStatus
        }))
      };
    },

    ordersByRestId: async (parent, { restaurant, page = 1, rows = 10, search = '' }) => {
      const skip = (page - 1) * rows;
      const query = { restaurant, isActive: true };
      
      if (search) {
        query.$or = [
          { orderId: { $regex: search, $options: 'i' } },
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'deliveryAddress.deliveryAddress': { $regex: search, $options: 'i' } }
        ];
      }

      const orders = await Order.find(query)
        .populate('user')
        .populate('restaurant')
        .populate('rider')
        .populate('items.food')
        .skip(skip)
        .limit(rows)
        .sort({ createdAt: -1 });

      return orders.map(order => ({
        ...order.toObject(),
        status: order.orderStatus
      }));
    },

    allOrders: async (parent, { page = 1 }) => {
      const skip = (page - 1) * 20;
      const orders = await Order.find({ isActive: true })
        .populate('user')
        .populate('restaurant')
        .populate('rider')
        .populate('items.food')
        .skip(skip)
        .limit(20)
        .sort({ createdAt: -1 });

      return orders.map(order => ({
        ...order.toObject(),
        status: order.orderStatus
      }));
    },

    // Restaurant by owner query
    restaurantByOwner: async (parent, { id }) => {
      const vendor = await User.findById(id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      const restaurants = await Restaurant.find({ owner: id, isActive: true });

      return {
        _id: vendor._id,
        email: vendor.email,
        userType: vendor.role,
        restaurants: restaurants.map(restaurant => ({
          ...restaurant.toObject(),
          unique_restaurant_id: restaurant._id,
          orderId: restaurant.orderPrefix || ''
        }))
      };
    },
  },

  Mutation: {
    register: async (parent, { name, email, phone, password, role, vehicleType, licenseNumber, vehicleNumber }) => {
      console.log('Register mutation called for email:', email);
      // Check if user already exists
      console.log('Checking if user exists with email:', email);
      const existingUser = await User.findOne({ email });
      console.log('User.findOne result:', existingUser ? 'User found' : 'User not found');
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const userRole = role || 'customer';

      // Validate rider-specific fields
      if (userRole === 'rider') {
        if (!vehicleType || !licenseNumber || !vehicleNumber) {
          throw new Error('Riders must provide vehicleType, licenseNumber, and vehicleNumber');
        }
      }

      // Create new user
      const userData = {
        name,
        email,
        phone,
        password,
        role: userRole,
        roles: [userRole],
      };

      // Add rider-specific fields if role is rider
      if (userRole === 'rider') {
        userData.vehicleType = vehicleType;
        userData.licenseNumber = licenseNumber;
        userData.vehicleNumber = vehicleNumber;
        userData.available = false;
      }

      const user = new User(userData);

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      return {
        userId: user._id,
        token,
        tokenExpiration: null, // TODO: Add token expiration
        name: user.name,
        phone: user.phone,
        phoneIsVerified: false, // New user, not verified yet
        email: user.email,
        emailIsVerified: false, // New user, not verified yet
        picture: user.profileImage,
        addresses: [], // Empty for new user
        isNewUser: true,
        userTypeId: user.role,
        isActive: user.isActive,
        roles: user.roles || [user.role],
      };
    },

    login: async (parent, { email, password, type, name, notificationToken, isActive }) => {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = generateToken(user._id);

      return {
        userId: user._id,
        token,
        tokenExpiration: null, // TODO: Add token expiration
        name: user.name,
        phone: user.phone,
        phoneIsVerified: user.phoneIsVerified || false,
        email: user.email,
        emailIsVerified: user.emailIsVerified || false,
        picture: user.profileImage,
        addresses: [], // TODO: Implement user addresses
        isNewUser: false, // Existing user logging in
        userTypeId: user.role,
        isActive: user.isActive,
        roles: user.roles || [user.role],
      };
    },

    ownerLogin: async (parent, { email, password }) => {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Allowed roles: vendor, owner, admin, customer, rider (NOT restaurant)
      const allowedRoles = ['vendor', 'owner', 'admin', 'customer', 'rider'];
      if (!allowedRoles.includes(user.role)) {
        throw new Error('Not authorized. Restaurant role is not allowed.');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Your account is inactive. Please contact support.');
      }

      // Generate token
      const token = generateToken(user._id);

      // Get user's restaurants if they are a vendor or owner
      let restaurants = [];
      if (user.role === 'vendor' || user.role === 'owner') {
        restaurants = await Restaurant.find({ owner: user._id, isActive: true })
          .select('_id name image address');
      }

      return {
        userId: user._id,
        token,
        email: user.email,
        userType: user.role.toUpperCase(),
        restaurants,
        permissions: [], // TODO: Implement permissions system
        userTypeId: user.role,
        image: user.profileImage,
        name: user.name,
      };
    },

    emailExist: async (parent, { email }) => {
      const user = await User.findOne({ email });
      if (user) {
        return {
          userType: user.role,
          _id: user._id,
        };
      }
      return null;
    },

    phoneExist: async (parent, { phone }) => {
      const user = await User.findOne({ phone });
      if (user) {
        return {
          userType: user.role,
          _id: user._id,
        };
      }
      return null;
    },

    sendOtpToEmail: async (parent, { email }) => {
      try {
        const otp = generateOTP();
        
        // Store OTP in database
        await OTP.createOTP(email.toLowerCase(), otp, 'email', 'verification');
        
        // Send OTP via email
        await sendOTPEmail(email, otp);
        
        console.log(`OTP ${otp} sent to email: ${email}`);
        return { result: true };
      } catch (error) {
        console.error('Failed to send OTP email:', error);
        throw new Error('Failed to send OTP email');
      }
    },

    sendOtpToPhoneNumber: async (parent, { phone }) => {
      try {
        const otp = generateOTP();
        
        // Store OTP in database
        await OTP.createOTP(phone, otp, 'phone', 'verification');
        
        // Send OTP via SMS
        await sendOTPSMS(phone, otp);
        
        console.log(`OTP ${otp} sent to phone: ${phone}`);
        return { result: true };
      } catch (error) {
        console.error('Failed to send OTP SMS:', error);
        throw new Error('Failed to send OTP SMS');
      }
    },

    verifyOtp: async (parent, { otp, email, phone }) => {
      try {
        const identifier = email ? email.toLowerCase() : phone;
        const type = email ? 'email' : 'phone';
        
        // Verify OTP using the OTP model
        const verification = await OTP.verifyOTP(identifier, otp, type);
        
        if (verification.success) {
          console.log(`OTP verified successfully for ${identifier}`);
          
          // Update user verification status if user exists
          if (email) {
            await User.findOneAndUpdate(
              { email: email.toLowerCase() },
              { emailIsVerified: true }
            );
          } else if (phone) {
            await User.findOneAndUpdate(
              { phone },
              { phoneIsVerified: true }
            );
          }
          
          return { result: true };
        } else {
          console.log(`OTP verification failed: ${verification.message}`);
          return { result: false };
        }
      } catch (error) {
        console.error('Failed to verify OTP:', error);
        return { result: false };
      }
    },

    createUser: async (parent, { userInput }) => {
      try {
        const { phone, email, password, name, notificationToken, appleId, emailIsVerified } = userInput;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('User already exists with this email');
        }

        // Create new user
        const user = new User({
          name,
          email,
          phone,
          password,
          notificationToken,
          appleId,
          emailIsVerified: emailIsVerified || false,
          role: 'customer', // Default role
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        return {
          userId: user._id,
          token,
          tokenExpiration: null, // TODO: Add token expiration
          name: user.name,
          phone: user.phone,
          phoneIsVerified: false, // New user, not verified yet
          email: user.email,
          emailIsVerified: user.emailIsVerified || false,
          picture: user.profileImage,
          addresses: [], // Empty for new user
          isNewUser: true,
          userTypeId: user.role,
          isActive: user.isActive,
        };
      } catch (error) {
        console.error('Failed to create user:', error);
        throw new Error(error.message || 'Failed to create user');
      }
    },

    updateUser: async (parent, { id, userInput }, context) => {
      try {
        if (!context.user) {
          throw new Error('Not authenticated');
        }

        // Check if user is updating themselves or is admin
        if (context.user._id.toString() !== id && context.user.role !== 'admin') {
          throw new Error('Not authorized to update this user');
        }

        const updateData = {};
        if (userInput.name !== undefined) updateData.name = userInput.name;
        if (userInput.email !== undefined) updateData.email = userInput.email;
        if (userInput.phone !== undefined) updateData.phone = userInput.phone;
        if (userInput.password !== undefined) updateData.password = userInput.password;
        if (userInput.notificationToken !== undefined) updateData.notificationToken = userInput.notificationToken;
        if (userInput.appleId !== undefined) updateData.appleId = userInput.appleId;
        if (userInput.emailIsVerified !== undefined) updateData.emailIsVerified = userInput.emailIsVerified;
        if (userInput.phoneIsVerified !== undefined) updateData.phoneIsVerified = userInput.phoneIsVerified;
        if (userInput.isOrderNotification !== undefined) updateData.isOrderNotification = userInput.isOrderNotification;
        if (userInput.isOfferNotification !== undefined) updateData.isOfferNotification = userInput.isOfferNotification;
        if (userInput.favourite !== undefined) updateData.favourite = userInput.favourite;
        if (userInput.available !== undefined) updateData.available = userInput.available;
        if (userInput.roles !== undefined) updateData.roles = userInput.roles;

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) {
          throw new Error('User not found');
        }

        return updatedUser;
      } catch (error) {
        console.error('Failed to update user:', error);
        throw new Error(error.message || 'Failed to update user');
      }
    },

    // Category mutations
    createCategory: async (parent, { title, description, image }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const category = new Category({
        title,
        description,
        image,
      });

      return await category.save();
    },

    registerAsRider: async (parent, { vehicleType, licenseNumber, vehicleNumber }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      const roles = user.roles || [user.role];
      if (roles.includes('rider')) {
        throw new Error('Already registered as rider');
      }

      roles.push('rider');
      user.roles = roles;
      user.vehicleType = vehicleType;
      user.licenseNumber = licenseNumber;
      user.vehicleNumber = vehicleNumber;
      user.available = false;

      await user.save();
      return user;
    },

    registerAsVendor: async (parent, { shopName, shopType, address, phone }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const user = await User.findById(context.user._id);
      if (!user) {
        throw new Error('User not found');
      }

      const roles = user.roles || [user.role];
      if (roles.includes('vendor')) {
        throw new Error('Already registered as vendor');
      }

      roles.push('vendor');
      user.roles = roles;
      await user.save();

      const restaurant = new Restaurant({
        name: shopName,
        shopType: shopType || 'restaurant',
        address,
        phone: phone || user.phone,
        owner: user._id,
        isActive: true,
        isAvailable: false,
      });

      await restaurant.save();
      return restaurant;
    },

    updateCategory: async (parent, { id, title, description, image, isActive }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (isActive !== undefined) updateData.isActive = isActive;

      return await Category.findByIdAndUpdate(id, updateData, { new: true });
    },

    deleteCategory: async (parent, { id }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      await Category.findByIdAndUpdate(id, { isActive: false });
      return true;
    },

    // Restaurant mutations
    createRestaurant: async (parent, { restaurant: restaurantInput, owner }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const restaurant = new Restaurant({
        name: restaurantInput.name,
        address: restaurantInput.address,
        location: restaurantInput.location ? {
          type: 'Point',
          coordinates: restaurantInput.location
        } : undefined,
        phone: restaurantInput.phone,
        email: restaurantInput.email,
        username: restaurantInput.username,
        password: restaurantInput.password,
        owner: owner,
        shopType: restaurantInput.shopType || 'restaurant',
        cuisines: restaurantInput.cuisines || [],
        openingTimes: restaurantInput.openingTimes || [],
        minimumOrder: restaurantInput.minimumOrder || 0,
        deliveryTime: restaurantInput.deliveryTime || 30,
        tax: restaurantInput.tax || 0,
        commissionRate: restaurantInput.commissionRate || 0,
        orderPrefix: restaurantInput.orderPrefix,
        slug: restaurantInput.slug,
        logo: restaurantInput.logo,
        image: restaurantInput.image,
        isActive: restaurantInput.isActive !== undefined ? restaurantInput.isActive : true,
      });

      return await restaurant.save();
    },

    updateRestaurant: async (parent, {
      id, name, address, location, phone, email, shopType, cuisines,
      openingTimes, minimumOrder, deliveryTime, tax, isActive, isAvailable
    }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      if (restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (location !== undefined) updateData.location = { type: 'Point', coordinates: location };
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (shopType !== undefined) updateData.shopType = shopType;
      if (cuisines !== undefined) updateData.cuisines = cuisines;
      if (openingTimes !== undefined) updateData.openingTimes = openingTimes;
      if (minimumOrder !== undefined) updateData.minimumOrder = minimumOrder;
      if (deliveryTime !== undefined) updateData.deliveryTime = deliveryTime;
      if (tax !== undefined) updateData.tax = tax;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

      return await Restaurant.findByIdAndUpdate(id, updateData, { new: true }).populate('owner');
    },

    // Admin-specific restaurant mutations
    deleteRestaurant: async (parent, { id }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      restaurant.isActive = false;
      await restaurant.save();

      return {
        _id: restaurant._id,
        isActive: restaurant.isActive
      };
    },

    hardDeleteRestaurant: async (parent, { id }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      await Restaurant.findByIdAndDelete(id);
      return true;
    },

    editRestaurant: async (parent, { restaurant: restaurantInput }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const restaurant = await Restaurant.findById(restaurantInput._id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      if (restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const updateData = {};
      if (restaurantInput.name !== undefined) updateData.name = restaurantInput.name;
      if (restaurantInput.phone !== undefined) updateData.phone = restaurantInput.phone;
      if (restaurantInput.image !== undefined) updateData.image = restaurantInput.image;
      if (restaurantInput.logo !== undefined) updateData.logo = restaurantInput.logo;
      if (restaurantInput.slug !== undefined) updateData.slug = restaurantInput.slug;
      if (restaurantInput.address !== undefined) updateData.address = restaurantInput.address;
      if (restaurantInput.username !== undefined) updateData.username = restaurantInput.username;
      if (restaurantInput.password !== undefined) updateData.password = restaurantInput.password;
      if (restaurantInput.location !== undefined) updateData.location = { type: 'Point', coordinates: restaurantInput.location };
      if (restaurantInput.isAvailable !== undefined) updateData.isAvailable = restaurantInput.isAvailable;
      if (restaurantInput.minimumOrder !== undefined) updateData.minimumOrder = restaurantInput.minimumOrder;
      if (restaurantInput.tax !== undefined) updateData.tax = restaurantInput.tax;
      if (restaurantInput.openingTimes !== undefined) updateData.openingTimes = restaurantInput.openingTimes;
      if (restaurantInput.shopType !== undefined) updateData.shopType = restaurantInput.shopType;

      return await Restaurant.findByIdAndUpdate(restaurantInput._id, updateData, { new: true });
    },

    duplicateRestaurant: async (parent, { id, owner }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const originalRestaurant = await Restaurant.findById(id);
      if (!originalRestaurant) {
        throw new Error('Restaurant not found');
      }

      const duplicatedRestaurant = new Restaurant({
        name: `${originalRestaurant.name} (Copy)`,
        address: originalRestaurant.address,
        location: originalRestaurant.location,
        phone: originalRestaurant.phone,
        email: originalRestaurant.email,
        owner: owner,
        shopType: originalRestaurant.shopType,
        cuisines: originalRestaurant.cuisines,
        openingTimes: originalRestaurant.openingTimes,
        minimumOrder: originalRestaurant.minimumOrder,
        deliveryTime: originalRestaurant.deliveryTime,
        tax: originalRestaurant.tax,
        commissionRate: originalRestaurant.commissionRate,
        orderPrefix: originalRestaurant.orderPrefix,
        slug: `${originalRestaurant.slug}-copy-${Date.now()}`,
        logo: originalRestaurant.logo,
        image: originalRestaurant.image,
        isActive: originalRestaurant.isActive,
      });

      return await duplicatedRestaurant.save();
    },

    updateFoodOutOfStock: async (parent, { id, restaurant, categoryId }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const food = await Food.findById(id);
      if (!food) {
        throw new Error('Food not found');
      }

      // Check authorization
      const restaurantDoc = await Restaurant.findById(restaurant);
      if (!restaurantDoc || restaurantDoc.owner.toString() !== context.user._id.toString()) {
        throw new Error('Not authorized');
      }

      food.isOutOfStock = !food.isOutOfStock;
      await food.save();

      return food.isOutOfStock;
    },

    updateRestaurantDelivery: async (parent, { id, minDeliveryFee, deliveryDistance, deliveryFee }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      if (restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      // For now, just return success - delivery info can be stored in separate collection
      return {
        success: true,
        message: 'Delivery information updated',
        data: { _id: id }
      };
    },

    updateRestaurantBussinessDetails: async (parent, { id, bussinessDetails }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      if (restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      // For now, just return success - business details can be stored in separate collection
      return {
        success: true,
        message: 'Business details updated',
        data: { _id: id }
      };
    },

    updateDeliveryBoundsAndLocation: async (parent, {
      id, boundType, bounds, circleBounds, location, address, postCode, city
    }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      if (restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const updateData = {};
      if (location) updateData.location = { type: 'Point', coordinates: location };
      if (bounds) updateData.deliveryBounds = { type: 'Polygon', coordinates: bounds };
      if (address) updateData.address = address;

      await Restaurant.findByIdAndUpdate(id, updateData);

      return {
        success: true,
        message: 'Delivery bounds and location updated',
        data: {
          _id: id,
          deliveryBounds: bounds,
          location: location
        }
      };
    },

    // Food mutations
    createFood: async (parent, {
      title, description, image, category, restaurant, variations, subCategory
    }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Check if restaurant belongs to user
      const restaurantDoc = await Restaurant.findById(restaurant);
      if (!restaurantDoc || restaurantDoc.owner.toString() !== context.user._id.toString()) {
        throw new Error('Not authorized');
      }

      const food = new Food({
        title,
        description,
        image,
        category,
        restaurant,
        variations: variations || [],
        subCategory,
      });

      return await food.save();
    },

    updateFood: async (parent, {
      id, title, description, image, category, variations, subCategory, isOutOfStock, isActive
    }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const food = await Food.findById(id).populate('restaurant');
      if (!food) {
        throw new Error('Food not found');
      }

      if (food.restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (category !== undefined) updateData.category = category;
      if (variations !== undefined) updateData.variations = variations;
      if (subCategory !== undefined) updateData.subCategory = subCategory;
      if (isOutOfStock !== undefined) updateData.isOutOfStock = isOutOfStock;
      if (isActive !== undefined) updateData.isActive = isActive;

      return await Food.findByIdAndUpdate(id, updateData, { new: true })
        .populate('category')
        .populate('restaurant')
        .populate('variations');
    },

    deleteFood: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const food = await Food.findById(id).populate('restaurant');
      if (!food) {
        throw new Error('Food not found');
      }

      if (food.restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      await Food.findByIdAndUpdate(id, { isActive: false });
      return true;
    },

    // Addon mutations
    createAddon: async (parent, { title, description, quantityMinimum, quantityMaximum, options }, context) => {
      if (!context.user || context.user.role !== 'restaurant') {
        throw new Error('Not authorized');
      }

      const addon = new Addon({
        title,
        description,
        quantityMinimum: quantityMinimum || 0,
        quantityMaximum: quantityMaximum || 1,
        options,
      });

      return await addon.save();
    },

    updateAddon: async (parent, { id, title, description, quantityMinimum, quantityMaximum, options, isActive }, context) => {
      if (!context.user || context.user.role !== 'restaurant') {
        throw new Error('Not authorized');
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (quantityMinimum !== undefined) updateData.quantityMinimum = quantityMinimum;
      if (quantityMaximum !== undefined) updateData.quantityMaximum = quantityMaximum;
      if (options !== undefined) updateData.options = options;
      if (isActive !== undefined) updateData.isActive = isActive;

      return await Addon.findByIdAndUpdate(id, updateData, { new: true });
    },

    deleteAddon: async (parent, { id }, context) => {
      if (!context.user || context.user.role !== 'restaurant') {
        throw new Error('Not authorized');
      }

      await Addon.findByIdAndUpdate(id, { isActive: false });
      return true;
    },

    // Order mutations
    placeOrder: async (parent, {
      restaurant, orderInput, paymentMethod, address, tipping,
      taxationAmount, orderDate, expectedTime, isPickedUp, deliveryCharges, instructions
    }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Calculate order amount
      let orderAmount = 0;
      for (const item of orderInput) {
        let itemTotal = 0;
        if (item.variation && item.variation.price) {
          itemTotal = item.variation.price * item.quantity;
        }
        // Add addon prices
        if (item.addons) {
          for (const addon of item.addons) {
            if (addon.options) {
              for (const option of addon.options) {
                itemTotal += option.price || 0;
              }
            }
          }
        }
        orderAmount += itemTotal;
      }

      orderAmount += deliveryCharges + tipping + taxationAmount;

      // Generate orderId
      const orderCount = await Order.countDocuments();
      const orderId = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

      const order = new Order({
        orderId,
        user: context.user._id,
        restaurant,
        items: orderInput,
        deliveryAddress: {
          deliveryAddress: address.deliveryAddress,
          location: {
            type: 'Point',
            coordinates: address.location
          },
          details: address.details,
          label: address.label
        },
        paymentMethod,
        orderAmount,
        paidAmount: orderAmount, // Set paidAmount to match orderAmount
        deliveryCharges,
        tipping,
        taxationAmount,
        orderDate,
        expectedTime: expectedTime || null, // Add expected delivery time
        isPickedUp,
        instructions,
      });

      const savedOrder = await order.save();

      // Find 5 nearest available riders
      const restaurantData = await Restaurant.findById(restaurant);
      if (restaurantData && restaurantData.location && restaurantData.location.coordinates) {
        const [lng, lat] = restaurantData.location.coordinates;
        
        // Find available riders near the restaurant (within 10km)
        const nearbyRiders = await User.find({
          role: 'rider',
          available: true,
          isActive: true,
          currentLocation: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: 10000 // 10km in meters
            }
          }
        }).limit(5);

        // Store the order as pending for these riders
        if (nearbyRiders.length > 0) {
          savedOrder.pendingRiders = nearbyRiders.map(r => r._id);
          await savedOrder.save();
          
          console.log(`📍 Found ${nearbyRiders.length} nearby riders for order ${savedOrder.orderId}`);
        } else {
          console.log(`⚠️  No nearby riders found for order ${savedOrder.orderId}`);
        }
      }

      return savedOrder;
    },

    // New mutation for riders to accept orders
    acceptOrderByRider: async (parent, { orderId }, context) => {
      if (!context.user || context.user.role !== 'rider') {
        throw new Error('Only riders can accept orders');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is already assigned
      if (order.rider) {
        throw new Error('Order already accepted by another rider');
      }

      // Check if this rider was in the pending list
      if (order.pendingRiders && !order.pendingRiders.includes(context.user._id)) {
        throw new Error('This order was not assigned to you');
      }

      // Assign the rider (first come, first served)
      order.rider = context.user._id;
      order.orderStatus = 'accepted';
      order.assignedAt = new Date();
      order.acceptedAt = new Date();
      order.pendingRiders = []; // Clear pending riders

      await order.save();

      // TODO: Send notification to other pending riders that order was taken
      console.log(`✅ Rider ${context.user.name} accepted order ${order.orderId}`);

      return await Order.findById(orderId)
        .populate('user')
        .populate('restaurant')
        .populate('rider');
    },

    updateOrderStatus: async (parent, { id, orderStatus, reason }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const order = await Order.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check permissions
      const restaurant = await Restaurant.findById(order.restaurant);
      const canUpdate = (
        context.user.role === 'admin' ||
        (context.user.role === 'restaurant' && restaurant.owner.toString() === context.user._id.toString()) ||
        (context.user.role === 'rider' && order.rider && order.rider.toString() === context.user._id.toString())
      );

      if (!canUpdate) {
        throw new Error('Not authorized to update this order');
      }

      const updateData = { orderStatus };
      if (reason) updateData.reason = reason;

      // Set timestamps based on status
      const now = new Date();
      switch (orderStatus) {
        case 'accepted':
          updateData.acceptedAt = now;
          break;
        case 'preparing':
          updateData.preparationTime = order.preparationTime || 30;
          break;
        case 'ready':
          updateData.pickedAt = now;
          break;
        case 'picked':
          updateData.pickedAt = now;
          break;
        case 'delivered':
          updateData.deliveredAt = now;
          updateData.completionTime = now;
          break;
        case 'cancelled':
          updateData.cancelledAt = now;
          break;
      }

      return await Order.findByIdAndUpdate(id, updateData, { new: true })
        .populate('user')
        .populate('restaurant')
        .populate('rider');
    },

    assignRider: async (parent, { id, riderId }, context) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'restaurant')) {
        throw new Error('Not authorized');
      }

      const rider = await User.findById(riderId);
      if (!rider || rider.role !== 'rider') {
        throw new Error('Invalid rider');
      }

      return await Order.findByIdAndUpdate(id, {
        rider: riderId,
        assignedAt: new Date(),
        orderStatus: 'assigned'
      }, { new: true })
        .populate('user')
        .populate('restaurant')
        .populate('rider');
    },

    acceptOrderByRider: async (parent, { orderId }, context) => {
      if (!context.user || context.user.role !== 'rider') {
        throw new Error('Only riders can accept orders');
      }

      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is still available
      if (order.rider) {
        throw new Error('Order already assigned to another rider');
      }

      // Check if order is still pending
      if (order.orderStatus !== 'pending') {
        throw new Error('Order is no longer available');
      }

      // Check if this rider was in the pending list (if using auto-assignment)
      // If pendingRiders is empty or doesn't exist, any rider can accept (first come, first served)
      if (order.pendingRiders && order.pendingRiders.length > 0) {
        const riderIdString = context.user._id.toString();
        const isPending = order.pendingRiders.some(
          riderId => riderId.toString() === riderIdString
        );
        
        if (!isPending) {
          throw new Error('You were not selected for this order');
        }
      }
      // If no pendingRiders, it's open for any rider to accept (first come, first served)

      // Assign the order to this rider
      order.rider = context.user._id;
      order.orderStatus = 'accepted';
      order.acceptedAt = new Date();
      order.assignedAt = new Date();
      order.pendingRiders = []; // Clear pending riders list
      
      await order.save();

      console.log(`✅ Order ${order.orderId} accepted by rider ${context.user.name}`);

      // Publish update for real-time subscriptions
      pubsub.publish('ORDER_STATUS_UPDATED', {
        orderStatusUpdated: order
      });

      return await Order.findById(order._id)
        .populate('user')
        .populate('restaurant')
        .populate('rider')
        .populate('items.food');
    },

    updateRiderLocation: async (parent, { riderId, orderId, location, heading }, context) => {
      try {
        // Find the rider
        const rider = await User.findById(riderId);
        
        if (!rider) {
          return {
            success: false,
            message: 'Rider not found',
            rider: null
          };
        }

        if (rider.role !== 'rider') {
          return {
            success: false,
            message: 'User is not a rider',
            rider: null
          };
        }

        // Update rider location
        rider.currentLocation = {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        };

        // Update heading if provided
        if (heading !== null && heading !== undefined) {
          rider.heading = heading;
        }

        await rider.save();

        // Update order with rider location (optional - for historical tracking)
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order && order.rider && order.rider.toString() === riderId) {
            // You can add location history to order if needed
            console.log(`📍 Updated location for rider ${rider.name} on order ${order.orderId}`);
          }
        }

        // Publish location update for real-time subscriptions
        pubsub.publish('RIDER_LOCATION_UPDATED', {
          riderLocationUpdated: {
            riderId: rider._id,
            orderId: orderId,
            location: {
              latitude: location.latitude,
              longitude: location.longitude
            },
            heading: rider.heading,
            timestamp: new Date().toISOString()
          }
        });

        return {
          success: true,
          message: 'Location updated successfully',
          rider: rider
        };
      } catch (error) {
        console.error('Error updating rider location:', error);
        return {
          success: false,
          message: error.message,
          rider: null
        };
      }
    },

    // Review mutations
    createReview: async (parent, {
      orderId, restaurantId, rating, review, images, foodRating, deliveryRating, serviceRating
    }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      // Verify user can review this order
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.user.toString() !== context.user._id.toString()) {
        throw new Error('Not authorized to review this order');
      }

      if (order.orderStatus !== 'delivered') {
        throw new Error('Can only review delivered orders');
      }

      // Check if user already reviewed this order
      const existingReview = await Review.findOne({
        order: orderId,
        user: context.user._id
      });

      if (existingReview) {
        throw new Error('Order already reviewed');
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Create review
      const newReview = new Review({
        user: context.user._id,
        restaurant: restaurantId,
        order: orderId,
        rating,
        review,
        images: images || [],
        foodRating,
        deliveryRating,
        serviceRating,
        isVerified: true // Auto-verify reviews from completed orders
      });

      await newReview.save();

      // Update restaurant statistics
      await updateRestaurantRating(restaurantId);

      return await Review.findById(newReview._id)
        .populate('user', 'name profileImage')
        .populate('restaurant', 'name')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        });
    },

    updateReview: async (parent, {
      id, rating, review, images, foodRating, deliveryRating, serviceRating
    }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const reviewDoc = await Review.findById(id);
      if (!reviewDoc) {
        throw new Error('Review not found');
      }

      // Check if user owns the review or is admin
      if (reviewDoc.user.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized to update this review');
      }

      // Validate rating
      if (rating && (rating < 1 || rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const updateData = {};
      if (rating !== undefined) updateData.rating = rating;
      if (review !== undefined) updateData.review = review;
      if (images !== undefined) updateData.images = images;
      if (foodRating !== undefined) updateData.foodRating = foodRating;
      if (deliveryRating !== undefined) updateData.deliveryRating = deliveryRating;
      if (serviceRating !== undefined) updateData.serviceRating = serviceRating;

      await Review.findByIdAndUpdate(id, updateData);

      // Update restaurant statistics if rating changed
      if (rating !== undefined) {
        await updateRestaurantRating(reviewDoc.restaurant);
      }

      return await Review.findById(id)
        .populate('user', 'name profileImage')
        .populate('restaurant', 'name')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        });
    },

    deleteReview: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const reviewDoc = await Review.findById(id);
      if (!reviewDoc) {
        throw new Error('Review not found');
      }

      // Check if user owns the review or is admin
      if (reviewDoc.user.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized to delete this review');
      }

      await Review.findByIdAndUpdate(id, { isActive: false });

      // Update restaurant statistics
      await updateRestaurantRating(reviewDoc.restaurant);

      return true;
    },

    markReviewHelpful: async (parent, { id, isHelpful }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const reviewDoc = await Review.findById(id);
      if (!reviewDoc) {
        throw new Error('Review not found');
      }

      const userId = context.user._id.toString();
      const hasUserVoted = reviewDoc.helpful.users.includes(userId);

      if (isHelpful && !hasUserVoted) {
        // Add user's vote
        reviewDoc.helpful.users.push(userId);
        reviewDoc.helpful.count += 1;
      } else if (!isHelpful && hasUserVoted) {
        // Remove user's vote
        reviewDoc.helpful.users = reviewDoc.helpful.users.filter(
          uid => uid !== userId
        );
        reviewDoc.helpful.count = Math.max(0, reviewDoc.helpful.count - 1);
      }

      await reviewDoc.save();

      return await Review.findById(id)
        .populate('user', 'name profileImage')
        .populate('restaurant', 'name')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        });
    },

    replyToReview: async (parent, { id, message }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const reviewDoc = await Review.findById(id).populate('restaurant');
      if (!reviewDoc) {
        throw new Error('Review not found');
      }

      // Check if user owns the restaurant or is admin
      const restaurant = reviewDoc.restaurant;
      if (restaurant.owner.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized to reply to this review');
      }

      reviewDoc.reply = {
        message,
        date: new Date(),
        repliedBy: context.user._id
      };

      await reviewDoc.save();

      return await Review.findById(id)
        .populate('user', 'name profileImage')
        .populate('restaurant', 'name')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        });
    },

    moderateReview: async (parent, { id, isActive, reason }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      const reviewDoc = await Review.findById(id);
      if (!reviewDoc) {
        throw new Error('Review not found');
      }

      reviewDoc.isActive = isActive;
      if (reason && !isActive) {
        reviewDoc.reply = {
          message: `Review moderated: ${reason}`,
          date: new Date(),
          repliedBy: context.user._id
        };
      }

      await reviewDoc.save();

      // Update restaurant statistics
      await updateRestaurantRating(reviewDoc.restaurant);

      return await Review.findById(id)
        .populate('user', 'name profileImage')
        .populate('restaurant', 'name')
        .populate({
          path: 'order',
          select: 'orderId orderDate'
        });
    },

    // Coupon mutations
    createCoupon: async (parent, {
      code, description, discountType, discountValue, minimumAmount,
      maximumDiscountAmount, usageLimit, userUsageLimit, applicableRestaurants,
      applicableCategories, applicableFoods, validFrom, validUntil,
      isFirstTimeUser, daysOfWeek, startTime, endTime
    }, context) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'restaurant')) {
        throw new Error('Not authorized');
      }

      // If restaurant owner, verify they can create coupons for their restaurants
      if (context.user.role === 'restaurant' && applicableRestaurants) {
        const restaurants = await Restaurant.find({
          owner: context.user._id,
          _id: { $in: applicableRestaurants }
        });
        
        if (restaurants.length !== applicableRestaurants.length) {
          throw new Error('Not authorized to create coupons for these restaurants');
        }
      }

      const coupon = new Coupon({
        code: code ? code.toUpperCase() : undefined, // Will be generated if not provided
        description,
        discountType,
        discountValue,
        minimumAmount: minimumAmount || 0,
        maximumDiscountAmount,
        usageLimit: usageLimit || 0,
        userUsageLimit: userUsageLimit || 1,
        applicableRestaurants: applicableRestaurants || [],
        applicableCategories: applicableCategories || [],
        applicableFoods: applicableFoods || [],
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        isFirstTimeUser: isFirstTimeUser || false,
        daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        startTime,
        endTime,
        createdBy: context.user._id
      });

      await coupon.save();

      return await Coupon.findById(coupon._id)
        .populate('createdBy', 'name email')
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title');
    },

    updateCoupon: async (parent, {
      id, description, discountType, discountValue, minimumAmount,
      maximumDiscountAmount, usageLimit, userUsageLimit, applicableRestaurants,
      applicableCategories, applicableFoods, validFrom, validUntil,
      isActive, isFirstTimeUser, daysOfWeek, startTime, endTime
    }, context) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'restaurant')) {
        throw new Error('Not authorized');
      }

      const coupon = await Coupon.findById(id);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Check authorization - only creator or admin can update
      if (coupon.createdBy.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized to update this coupon');
      }

      const updateData = {};
      if (description !== undefined) updateData.description = description;
      if (discountType !== undefined) updateData.discountType = discountType;
      if (discountValue !== undefined) updateData.discountValue = discountValue;
      if (minimumAmount !== undefined) updateData.minimumAmount = minimumAmount;
      if (maximumDiscountAmount !== undefined) updateData.maximumDiscountAmount = maximumDiscountAmount;
      if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
      if (userUsageLimit !== undefined) updateData.userUsageLimit = userUsageLimit;
      if (applicableRestaurants !== undefined) updateData.applicableRestaurants = applicableRestaurants;
      if (applicableCategories !== undefined) updateData.applicableCategories = applicableCategories;
      if (applicableFoods !== undefined) updateData.applicableFoods = applicableFoods;
      if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
      if (validUntil !== undefined) updateData.validUntil = new Date(validUntil);
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFirstTimeUser !== undefined) updateData.isFirstTimeUser = isFirstTimeUser;
      if (daysOfWeek !== undefined) updateData.daysOfWeek = daysOfWeek;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;

      await Coupon.findByIdAndUpdate(id, updateData);

      return await Coupon.findById(id)
        .populate('createdBy', 'name email')
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title');
    },

    deleteCoupon: async (parent, { id }, context) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'restaurant')) {
        throw new Error('Not authorized');
      }

      const coupon = await Coupon.findById(id);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Check authorization - only creator or admin can delete
      if (coupon.createdBy.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized to delete this coupon');
      }

      await Coupon.findByIdAndUpdate(id, { isActive: false });
      return true;
    },

    applyCoupon: async (parent, { code, orderAmount, restaurantId }, context) => {
      const coupon = await Coupon.findOne({ code: code.toUpperCase() })
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title');

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      if (!coupon.isValid()) {
        throw new Error('Coupon is not valid or has expired');
      }

      // Check if restaurant is applicable
      if (coupon.applicableRestaurants.length > 0) {
        const isApplicable = coupon.applicableRestaurants.some(
          restaurant => restaurant._id.toString() === restaurantId
        );
        if (!isApplicable) {
          throw new Error('Coupon is not applicable for this restaurant');
        }
      }

      // Check minimum order amount
      if (orderAmount < coupon.minimumAmount) {
        throw new Error(`Minimum order amount is ${coupon.minimumAmount}`);
      }

      // Check user usage limit
      if (context.user) {
        const userUsageCount = coupon.usageHistory.filter(
          usage => usage.user.toString() === context.user._id.toString()
        ).length;
        
        if (userUsageCount >= coupon.userUsageLimit) {
          throw new Error('You have reached the maximum usage limit for this coupon');
        }
      }

      return coupon;
    },

    deactivateCoupon: async (parent, { id }, context) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'restaurant')) {
        throw new Error('Not authorized');
      }

      const coupon = await Coupon.findById(id);
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Check authorization - only creator or admin can deactivate
      if (coupon.createdBy.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized to deactivate this coupon');
      }

      await Coupon.findByIdAndUpdate(id, { isActive: false });

      return await Coupon.findById(id)
        .populate('createdBy', 'name email')
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title');
    },

    duplicateCoupon: async (parent, { id, newCode }, context) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'restaurant')) {
        throw new Error('Not authorized');
      }

      const originalCoupon = await Coupon.findById(id);
      if (!originalCoupon) {
        throw new Error('Coupon not found');
      }

      // Check authorization - only creator or admin can duplicate
      if (originalCoupon.createdBy.toString() !== context.user._id.toString() && context.user.role !== 'admin') {
        throw new Error('Not authorized to duplicate this coupon');
      }

      const duplicatedCoupon = new Coupon({
        code: newCode ? newCode.toUpperCase() : undefined, // Will be generated if not provided
        description: `Copy of ${originalCoupon.description}`,
        discountType: originalCoupon.discountType,
        discountValue: originalCoupon.discountValue,
        minimumAmount: originalCoupon.minimumAmount,
        maximumDiscountAmount: originalCoupon.maximumDiscountAmount,
        usageLimit: originalCoupon.usageLimit,
        userUsageLimit: originalCoupon.userUsageLimit,
        applicableRestaurants: originalCoupon.applicableRestaurants,
        applicableCategories: originalCoupon.applicableCategories,
        applicableFoods: originalCoupon.applicableFoods,
        validFrom: originalCoupon.validFrom,
        validUntil: originalCoupon.validUntil,
        isActive: true, // Always start as active
        isFirstTimeUser: originalCoupon.isFirstTimeUser,
        daysOfWeek: originalCoupon.daysOfWeek,
        startTime: originalCoupon.startTime,
        endTime: originalCoupon.endTime,
        createdBy: context.user._id
      });

      await duplicatedCoupon.save();

      return await Coupon.findById(duplicatedCoupon._id)
        .populate('createdBy', 'name email')
        .populate('applicableRestaurants', 'name')
        .populate('applicableCategories', 'title')
        .populate('applicableFoods', 'title');
    },

    // Payment mutations
    initializePayment: async (parent, { orderId, paymentMethod, returnUrl, callbackUrl }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        const order = await Order.findById(orderId).populate('user').populate('restaurant');
        if (!order) {
          throw new Error('Order not found');
        }

        // Verify order belongs to user
        if (order.user._id.toString() !== context.user._id.toString()) {
          throw new Error('Not authorized to pay for this order');
        }

        // Check if already paid
        if (order.paymentStatus === 'paid') {
          throw new Error('Order already paid');
        }

        // Generate transaction reference
        const txRef = chapaService.generateTxRef(order.orderId);

        // Initialize payment with Chapa
        const paymentData = {
          amount: order.orderAmount,
          currency: 'ETB',
          email: order.user.email,
          firstName: order.user.name.split(' ')[0] || 'Customer',
          lastName: order.user.name.split(' ').slice(1).join(' ') || 'User',
          phone: order.user.phone || '',
          txRef: txRef,
          callbackUrl: callbackUrl,
          returnUrl: returnUrl,
          customization: {
            title: `Order #${order.orderId}`,
            description: `Payment for order from ${order.restaurant.name}`,
            logo: order.restaurant.logo || ''
          }
        };

        const result = await chapaService.initializePayment(paymentData);

        if (!result.success) {
          return {
            success: false,
            error: result.error,
            orderId: orderId
          };
        }

        // Update order with payment reference
        order.paymentReference = txRef;
        order.paymentMethod = paymentMethod;
        order.paymentMetadata = {
          chapaCheckoutUrl: result.checkoutUrl,
          initiatedAt: new Date()
        };
        await order.save();

        return {
          success: true,
          checkoutUrl: result.checkoutUrl,
          txRef: txRef,
          orderId: orderId
        };
      } catch (error) {
        console.error('Payment initialization error:', error);
        return {
          success: false,
          error: error.message,
          orderId: orderId
        };
      }
    },

    verifyPayment: async (parent, { txRef }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      try {
        // Verify payment with Chapa
        const verification = await chapaService.verifyPayment(txRef);

        if (!verification.success) {
          return {
            success: false,
            error: verification.error
          };
        }

        // Find order by payment reference
        const order = await Order.findOne({ paymentReference: txRef })
          .populate('user')
          .populate('restaurant')
          .populate('rider');

        if (!order) {
          return {
            success: false,
            error: 'Order not found for this transaction'
          };
        }

        // Verify order belongs to user
        if (order.user._id.toString() !== context.user._id.toString()) {
          throw new Error('Not authorized');
        }

        // Update order payment status
        const paymentStatus = chapaService.normalizePaymentStatus(verification.status);
        order.paymentStatus = paymentStatus;
        order.paymentTransactionId = verification.txRef;
        order.paymentMetadata = {
          ...order.paymentMetadata,
          verifiedAt: new Date(),
          chapaStatus: verification.status,
          chapaResponse: verification.chargeResponseMessage
        };

        if (paymentStatus === 'paid') {
          order.paidAmount = verification.amount;
        }

        await order.save();

        return {
          success: true,
          status: paymentStatus,
          amount: verification.amount,
          currency: verification.currency,
          txRef: verification.txRef,
          order: order
        };
      } catch (error) {
        console.error('Payment verification error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    },

    updatePaymentStatus: async (parent, { orderId, paymentStatus, transactionId, paymentReference, metadata }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Only admin or order owner can update payment status
      if (context.user.role !== 'admin' && order.user.toString() !== context.user._id.toString()) {
        throw new Error('Not authorized');
      }

      order.paymentStatus = paymentStatus;
      if (transactionId) order.paymentTransactionId = transactionId;
      if (paymentReference) order.paymentReference = paymentReference;
      if (metadata) order.paymentMetadata = { ...order.paymentMetadata, ...metadata };

      if (paymentStatus === 'paid') {
        order.paidAmount = order.orderAmount;
      }

      await order.save();

      return await Order.findById(orderId)
        .populate('user')
        .populate('restaurant')
        .populate('rider');
    },

    // Vendor mutations
    createVendor: async (parent, { vendorInput }, context) => {
      // Check if user already exists
      const existingUser = await User.findOne({ email: vendorInput.email });
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new vendor user
      const vendor = new User({
        name: vendorInput.name || `${vendorInput.firstName} ${vendorInput.lastName}`,
        email: vendorInput.email,
        password: vendorInput.password,
        phone: vendorInput.phoneNumber,
        role: 'vendor',
        profileImage: vendorInput.image,
        isActive: true,
      });

      await vendor.save();

      return {
        _id: vendor._id,
        unique_id: vendor._id.toString(),
        email: vendor.email,
        password: vendorInput.password,
        plainPassword: vendorInput.password,
        name: vendor.name,
        image: vendor.profileImage,
        firstName: vendorInput.firstName,
        lastName: vendorInput.lastName,
        phoneNumber: vendor.phone,
        userType: 'vendor',
        isActive: true,
        restaurants: []
      };
    },

    editVendor: async (parent, { vendorInput }, context) => {
      if (!vendorInput._id) {
        throw new Error('Vendor ID is required');
      }

      const vendor = await User.findById(vendorInput._id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Update vendor fields
      if (vendorInput.name) vendor.name = vendorInput.name;
      if (vendorInput.firstName || vendorInput.lastName) {
        vendor.name = `${vendorInput.firstName || ''} ${vendorInput.lastName || ''}`.trim();
      }
      if (vendorInput.email) vendor.email = vendorInput.email;
      if (vendorInput.password) vendor.password = vendorInput.password;
      if (vendorInput.phoneNumber) vendor.phone = vendorInput.phoneNumber;
      if (vendorInput.image) vendor.profileImage = vendorInput.image;

      await vendor.save();

      const restaurants = await Restaurant.find({ owner: vendor._id });

      return {
        _id: vendor._id,
        unique_id: vendor._id.toString(),
        email: vendor.email,
        password: vendorInput.password || '********',
        plainPassword: vendorInput.password,
        name: vendor.name,
        image: vendor.profileImage,
        firstName: vendorInput.firstName,
        lastName: vendorInput.lastName,
        phoneNumber: vendor.phone,
        userType: vendor.role,
        isActive: vendor.isActive,
        restaurants: restaurants
      };
    },

    deleteVendor: async (parent, { id }, context) => {
      const vendor = await User.findById(id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Soft delete - set isActive to false
      vendor.isActive = false;
      await vendor.save();

      return true;
    },

    getVendor: async (parent, { id }) => {
      const vendor = await User.findById(id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Split name into first and last name
      const nameParts = vendor.name ? vendor.name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const restaurants = await Restaurant.find({ owner: vendor._id });

      return {
        _id: vendor._id,
        unique_id: vendor._id.toString(),
        email: vendor.email,
        password: '********',
        plainPassword: '********',
        name: vendor.name,
        image: vendor.profileImage,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: vendor.phone,
        userType: vendor.role,
        isActive: vendor.isActive,
        restaurants: restaurants
      };
    },

    // Upload image mutation
    uploadImageToS3: async (parent, { image }) => {
      const { uploadImage } = require('../utils/uploadService');
      
      try {
        const imageUrl = await uploadImage(image);
        return { imageUrl };
      } catch (error) {
        console.error('Upload error:', error);
        throw new Error('Failed to upload image');
      }
    },

    toggleFavorite: async (parent, { foodId }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const user = await User.findById(context.user._id);
      const favIndex = user.favourite.indexOf(foodId);

      if (favIndex > -1) {
        user.favourite.splice(favIndex, 1);
      } else {
        user.favourite.push(foodId);
      }

      await user.save();
      return user;
    },
  },

  User: {
    _id: (user) => user._id,
    addresses: async (user) => {
      // TODO: Implement address resolver
      return [];
    },
    restaurants: async (user) => {
      return await Restaurant.find({ owner: user._id });
    },
  },

  Address: {
    _id: (address) => address._id,
    selected: (address) => address.selected || false,
  },

  Restaurant: {
    owner: async (restaurant) => {
      return await User.findById(restaurant.owner);
    },
  },

  Food: {
    category: async (food) => {
      return await Category.findById(food.category);
    },
    restaurant: async (food) => {
      return await Restaurant.findById(food.restaurant);
    },
    variations: async (food) => {
      return await Variation.find({ _id: { $in: food.variations } });
    },
  },

  Variation: {
    addons: async (variation) => {
      return await Addon.find({ _id: { $in: variation.addons } });
    },
  },

  // Field alias resolvers for admin compatibility
  Restaurant: {
    unique_restaurant_id: (restaurant) => restaurant._id,
    orderId: (restaurant) => restaurant.orderPrefix || '',
    status: (restaurant) => restaurant.isActive ? 'active' : 'inactive',
  },

  User: {
    userType: (user) => user.role,
    status: (user) => user.isActive ? 'active' : 'inactive',
  },

  Order: {
    status: (order) => order.orderStatus,
    createdAt: (order) => order.createdAt ? order.createdAt.toISOString() : null,
    updatedAt: (order) => order.updatedAt ? order.updatedAt.toISOString() : null,
    acceptedAt: (order) => order.acceptedAt ? order.acceptedAt.toISOString() : null,
    pickedAt: (order) => order.pickedAt ? order.pickedAt.toISOString() : null,
    deliveredAt: (order) => order.deliveredAt ? order.deliveredAt.toISOString() : null,
    cancelledAt: (order) => order.cancelledAt ? order.cancelledAt.toISOString() : null,
    assignedAt: (order) => order.assignedAt ? order.assignedAt.toISOString() : null,
    completionTime: (order) => order.completionTime ? order.completionTime.toISOString() : null,
    restaurant: async (order) => {
      if (!order.restaurant) return null;
      // If already populated, return it
      if (order.restaurant.name) return order.restaurant;
      // Otherwise fetch it
      return await Restaurant.findById(order.restaurant);
    },
    user: async (order) => {
      if (!order.user) return null;
      // If already populated, return it
      if (order.user.name) return order.user;
      // Otherwise fetch it
      return await User.findById(order.user);
    },
    rider: async (order) => {
      if (!order.rider) return null;
      // If already populated, return it
      if (order.rider.name) return order.rider;
      // Otherwise fetch it
      return await User.findById(order.rider);
    },
    items: (order) => {
      // Return items array, filtering out any null/undefined entries
      return (order.items || []).filter(item => item && item._id);
    },
  },

  OrderItem: {
    id: (item) => item._id,
    food: async (item) => {
      if (!item.food) return null;
      // If already populated, return it
      if (item.food.title) return item.food;
      // Otherwise fetch it
      return await Food.findById(item.food);
    },
  },

  // Review field resolvers
  Review: {
    user: async (review) => {
      return await User.findById(review.user);
    },
    restaurant: async (review) => {
      return await Restaurant.findById(review.restaurant);
    },
    order: async (review) => {
      return await Order.findById(review.order);
    },
    helpful: async (review, args, context) => {
      let hasUserVoted = false;
      if (context.user) {
        hasUserVoted = review.helpful.users.includes(context.user._id.toString());
      }
      return {
        count: review.helpful.count,
        hasUserVoted
      };
    },
    reply: async (review) => {
      if (!review.reply || !review.reply.repliedBy) {
        return null;
      }
      
      const replier = await User.findById(review.reply.repliedBy);
      return {
        message: review.reply.message,
        date: review.reply.date,
        repliedBy: replier
      };
    }
  },

  User: {
    reviews: async (user) => {
      return await Review.find({ user: user._id, isActive: true })
        .populate('restaurant', 'name image')
        .sort({ createdAt: -1 });
    }
  },

  Restaurant: {
    reviews: async (restaurant) => {
      return await Review.find({ restaurant: restaurant._id, isActive: true })
        .populate('user', 'name profileImage')
        .sort({ createdAt: -1 });
    },
    averageRating: async (restaurant) => {
      const stats = await Review.aggregate([
        { $match: { restaurant: restaurant._id, isActive: true } },
        {
          $group: {
            _id: '$restaurant',
            averageRating: { $avg: '$rating' }
          }
        }
      ]);
      return stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0;
    },
    totalReviews: async (restaurant) => {
      return await Review.countDocuments({ restaurant: restaurant._id, isActive: true });
    }
  },

  // Subscription resolvers for real-time features
  Subscription: {
    webNotificationReceived: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['WEB_NOTIFICATION_RECEIVED'])
    },

    orderStatusUpdated: {
      subscribe: (_, { orderId }, { pubsub }) =>
        pubsub.asyncIterator([`ORDER_STATUS_UPDATED_${orderId}`])
    },

    restaurantUpdated: {
      subscribe: (_, { restaurantId }, { pubsub }) =>
        pubsub.asyncIterator([`RESTAURANT_UPDATED_${restaurantId}`])
    },

    riderUpdated: {
      subscribe: (_, { riderId }, { pubsub }) =>
        pubsub.asyncIterator([`RIDER_UPDATED_${riderId}`])
    },

    riderLocationUpdated: {
      subscribe: (_, { orderId }, { pubsub }) =>
        pubsub.asyncIterator([`RIDER_LOCATION_${orderId}`])
    }
  }
};

// Helper function to update restaurant rating statistics
async function updateRestaurantRating(restaurantId) {
  try {
    const stats = await Review.aggregate([
      { $match: { restaurant: restaurantId, isActive: true } },
      {
        $group: {
          _id: '$restaurant',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      const { averageRating, reviewCount } = stats[0];
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: reviewCount
      });
    } else {
      // No active reviews, reset stats
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: 0,
        reviewCount: 0
      });
    }
  } catch (error) {
    console.error('Error updating restaurant rating:', error);
  }
}

// Helper function to publish real-time notifications
function publishWebNotification(notification, { pubsub }) {
  pubsub.publish('WEB_NOTIFICATION_RECEIVED', {
    webNotificationReceived: notification
  });
}


// Helper function to publish order status updates
function publishOrderStatusUpdate(orderId, order, { pubsub }) {
  pubsub.publish(`ORDER_STATUS_UPDATED_${orderId}`, {
    orderStatusUpdated: order
  });
}

// Helper function to publish restaurant updates
function publishRestaurantUpdate(restaurantId, restaurant, { pubsub }) {
  pubsub.publish(`RESTAURANT_UPDATED_${restaurantId}`, {
    restaurantUpdated: restaurant
  });
}

// Export only the GraphQL resolvers and helper functions separately
module.exports = {
  resolvers,
  publishWebNotification,
  publishOrderStatusUpdate,
  publishRestaurantUpdate
};
