# Project Structure

## Root Directory Layout

```
/
├── admin/              # Admin dashboard (React + Vite)
├── frontend/           # Customer web app (React)
├── mobile/             # Customer mobile app (React Native + Expo)
├── rider/              # Rider/driver mobile app (React Native + Expo)
├── config/             # Backend configuration files
├── graphql/            # GraphQL schema and resolvers
├── middlewares/        # Express middleware (auth, etc.)
├── models/             # Mongoose database models
├── routes/             # REST API routes (if any)
├── utils/              # Utility functions (email, upload, validation)
├── uploads/            # Static file uploads directory
├── app.js              # Express app setup
├── server.js           # Server entry point
└── package.json        # Backend dependencies
```

## Backend Structure

### GraphQL Layer
- `graphql/typeDefs.js`: Complete GraphQL schema with types, queries, mutations, subscriptions
- `graphql/resolvers.js`: Resolver functions for all GraphQL operations
- Schema includes: User, Shop, Product, Order, Review, Coupon, Category, Zone, etc.

### Models (Mongoose Schemas)
- `models/User.js`: Multi-role user model (customer, vendor, rider, admin)
- `models/Shop.js`: Shop/vendor information (formerly Restaurant)
- `models/Product.js`: Product catalog with variations and addons (formerly Food)
- `models/Order.js`: Order management with items and status tracking
- `models/Review.js`: Shop and order reviews
- `models/Coupon.js`: Discount coupons and promotions
- Additional models: Category, Zone, Analytics, Notification, etc.

### Middleware & Utils
- `middlewares/auth.js`: JWT authentication middleware
- `utils/emailService.js`: Email sending functionality
- `utils/uploadService.js`: File upload handling
- `utils/vendorValidation.js`: Vendor data validation

## Mobile App Structure (mobile/ and rider/)

Both mobile apps follow similar structure:

```
src/
├── api/
│   ├── apolloClient.js     # Apollo Client configuration
│   ├── queries.js          # GraphQL queries
│   └── mutations.js        # GraphQL mutations
├── navigation/
│   ├── RootNavigator.js    # Main navigation container
│   ├── AuthNavigator.js    # Auth flow screens
│   └── MainNavigator.js    # Main app screens (tabs)
├── screens/
│   ├── auth/               # Login, Register, OTP screens
│   ├── HomeScreen.js       # Main dashboard
│   ├── CartScreen.js       # Shopping cart (customer)
│   ├── DeliveryScreen.js   # Live tracking (rider)
│   └── ...                 # Other feature screens
├── store/
│   ├── index.js            # Redux store configuration
│   ├── authSlice.js        # Authentication state
│   ├── cartSlice.js        # Cart state (customer)
│   ├── orderSlice.js       # Order state
│   └── locationSlice.js    # Location state (rider)
└── services/
    └── LocationService.js  # GPS tracking (rider only)
```

## Admin Dashboard Structure (admin/)

```
src/
├── components/
│   └── Layout.jsx          # Common layout wrapper
├── pages/
│   ├── Login.jsx           # Admin login
│   ├── Dashboard.jsx       # Main dashboard
│   ├── Vendors.jsx         # Vendor management
│   ├── Products.jsx        # Product management
│   ├── Orders.jsx          # Order management
│   ├── Users.jsx           # User management
│   ├── Riders.jsx          # Rider management
│   ├── Analytics.jsx       # Analytics and reports
│   └── Settings.jsx        # System settings
├── App.jsx                 # Main app component
└── main.jsx                # Entry point
```

## Frontend Web Structure (frontend/)

```
src/
├── api/
│   ├── apolloClient.js     # Apollo Client setup
│   ├── queries.js          # GraphQL queries
│   └── mutations.js        # GraphQL mutations
├── components/
│   └── Navigation.js       # Navigation component
├── screens/
│   ├── Landing.js          # Landing page
│   ├── Login.js            # User login
│   ├── Register.js         # User registration
│   ├── Home.js             # Main home page
│   ├── Category.js         # Category browsing
│   ├── SellerPage.js       # Shop page
│   ├── ProductDetails.js   # Product item details
│   ├── Cart.js             # Shopping cart
│   ├── Checkout.js         # Checkout process
│   ├── Orders.js           # Order history
│   ├── OrderTracking.js    # Track order
│   └── Account.js          # User account
├── store/
│   ├── index.js            # Redux store
│   ├── authSlice.js        # Auth state
│   ├── cartSlice.js        # Cart state
│   ├── orderSlice.js       # Order state
│   ├── productSlice.js     # Product state
│   └── vendorSlice.js      # Vendor state
└── App.js                  # Main app component
```

## Key Conventions

### File Naming
- React components: PascalCase (e.g., `HomeScreen.js`, `LoginScreen.js`)
- Utilities/services: camelCase (e.g., `emailService.js`, `apolloClient.js`)
- Models: PascalCase (e.g., `User.js`, `Order.js`)
- Redux slices: camelCase with "Slice" suffix (e.g., `authSlice.js`)

### Code Organization
- GraphQL operations grouped by entity type
- Redux slices organized by feature/domain
- Screens organized by user flow (auth, main features)
- Shared utilities in dedicated utils/ directory
- Models mirror GraphQL types closely

### API Communication
- All client apps use Apollo Client for GraphQL
- WebSocket subscriptions for real-time features
- REST endpoints only for file uploads and special cases
- Consistent error handling across all clients

### State Management
- Redux Toolkit for all React/React Native apps
- Redux Persist for mobile apps (offline support)
- Apollo Client cache for GraphQL data
- AsyncStorage for mobile local storage

### Authentication Flow
- JWT tokens stored in AsyncStorage (mobile) or localStorage (web)
- Token included in Apollo Client headers
- Auth middleware validates tokens on backend
- Multi-role support (customer, vendor, rider, admin)
