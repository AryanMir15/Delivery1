# Multi-Category Delivery Platform

A complete multi-platform delivery and shopping system supporting multiple business categories including groceries, pharmacy, electronics, fashion, restaurants, and more.

## 🚀 Features

### Customer Features
- Browse multiple shop categories (15+ types)
- Search and filter products
- Shopping cart with real-time calculations
- Multiple payment methods (Cash, Card)
- Order tracking with live GPS
- Order history and reordering
- Product reviews and ratings
- Personalized recommendations
- Push notifications

### Vendor/Shop Features
- Product catalog management
- Order management and processing
- Real-time order notifications
- Sales analytics and reports
- Inventory tracking
- Shop profile customization
- Opening hours management
- Delivery zone configuration

### Rider/Driver Features
- Accept/reject delivery requests
- Live GPS navigation
- Real-time location sharing
- Earnings tracking
- Order history
- Online/offline status toggle
- Multiple order management
- Route optimization

### Admin Features
- Platform oversight dashboard
- Vendor management and approval
- User management
- Rider management
- Order monitoring
- Analytics and reporting
- System configuration
- Revenue tracking

## 🏗️ Architecture

### Technology Stack

**Backend**
- Node.js 16+ with Express.js
- GraphQL with Apollo Server 3
- MongoDB with Mongoose ODM
- Socket.io for real-time features
- JWT authentication
- Nodemailer for emails

**Mobile Apps (Customer & Rider)**
- React Native 0.74.5
- Expo SDK 51
- Redux Toolkit for state management
- Apollo Client 3.8 for GraphQL
- React Navigation 6
- React Native Maps (rider app)
- Expo Location for GPS

**Admin Dashboard**
- React 19
- Vite 7
- TypeScript 5.9
- Apollo Client 3.14
- React Router DOM 7
- Recharts 3 for analytics

**Customer Web App**
- React 18
- Redux Toolkit
- Apollo Client 3.8
- React Router DOM 6
- Styled Components
- Framer Motion

## 📁 Project Structure

```
delivery-platform/
├── admin/              # Admin dashboard (React + Vite + TypeScript)
├── frontend/           # Customer web app (React)
├── mobile/             # Customer mobile app (React Native + Expo)
├── rider/              # Rider mobile app (React Native + Expo)
├── config/             # Backend configuration files
├── graphql/            # GraphQL schema and resolvers
├── middlewares/        # Express middleware (auth, etc.)
├── models/             # Mongoose database models
├── mutations/          # GraphQL mutations
├── queries/            # GraphQL queries
├── resolvers/          # GraphQL resolvers
├── routes/             # REST API routes
├── uploads/            # Static file uploads
├── utils/              # Utility functions
├── app.js              # Express app setup
├── server.js           # Server entry point
└── package.json        # Backend dependencies
```

## 🚦 Getting Started

### Prerequisites

- Node.js 16 or higher
- MongoDB 4.4 or higher
- npm or yarn
- Expo CLI (for mobile apps)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd delivery-platform
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb://localhost:27017/delivery-app
JWT_SECRET=your-secret-key-here
PORT=4000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

4. **Install mobile app dependencies**
```bash
cd mobile
npm install
cd ../rider
npm install
cd ..
```

5. **Install admin dashboard dependencies**
```bash
cd admin
npm install
cd ..
```

6. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

### Running the Applications

#### Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Clean start (kill port first)
npm run dev:clean
```

#### Mobile App (Customer)
```bash
cd mobile
npm start
# Then press 'a' for Android or 'i' for iOS
```

#### Rider App
```bash
cd rider
npm start
# Then press 'a' for Android or 'i' for iOS
```

#### Admin Dashboard
```bash
cd admin
npm run dev
# Opens at http://localhost:5173
```

#### Frontend Web App
```bash
cd frontend
npm start
# Opens at http://localhost:3000
```

## 🔧 Configuration

### Mobile App API Configuration

Edit `mobile/src/api/apolloClient.js` and `rider/src/api/apolloClient.js`:

```javascript
// For Android Emulator
const API_URL = 'http://10.0.2.2:4000/graphql';

// For iOS Simulator
const API_URL = 'http://localhost:4000/graphql';

// For Physical Device (replace with your IP)
const API_URL = 'http://192.168.1.100:4000/graphql';
```

### Google Maps API (Rider App)

Add your Google Maps API key in `rider/app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

## 📱 User Roles & Credentials

### Default Test Accounts

**Customer**
- Email: `customer@test.com`
- Password: `Test123!`

**Vendor/Shop Owner**
- Email: `owner@test.com`
- Password: `Test123!`

**Rider**
- Email: `rider@test.com`
- Password: `Test123!`

**Admin**
- Email: `admin@test.com`
- Password: `Admin123!`

## 🗄️ Database Models

### Core Models
- **User** - Multi-role user model (customer, vendor, rider, admin)
- **Shop** - Shop/vendor information
- **Product** - Product catalog with variations and addons
- **Order** - Order management with items and status tracking
- **Review** - Shop and order reviews
- **Coupon** - Discount coupons and promotions
- **Category** - Product categories
- **Zone** - Delivery zones
- **Notification** - Push notifications
- **Analytics** - Platform analytics

## 🔌 API Documentation

### GraphQL Endpoint
```
http://localhost:4000/graphql
```

### WebSocket Endpoint (Real-time)
```
ws://localhost:4000/graphql
```

### Key Queries
- `foods` - Get products with filters
- `restaurants` - Get shops with filters
- `orders` - Get user orders
- `ordersByRestaurant` - Get shop orders
- `availableOrdersForRider` - Get available deliveries
- `riderOrders` - Get rider's assigned orders

### Key Mutations
- `login` - User authentication
- `createUser` - User registration
- `placeOrder` - Create new order
- `updateOrderStatus` - Update order status
- `assignRider` - Assign rider to order
- `updateRiderLocation` - Update rider GPS location

### Subscriptions
- `orderStatusChanged` - Real-time order updates
- `newOrder` - New order notifications
- `riderLocationUpdated` - Live GPS tracking

## 🎨 Supported Business Categories

1. Restaurant & Food Delivery
2. Grocery & Supermarket
3. Pharmacy & Healthcare
4. Electronics & Gadgets
5. Fashion & Clothing
6. Beauty & Cosmetics
7. Books & Stationery
8. Home & Furniture
9. Sports & Fitness
10. Toys & Games
11. Pet Supplies
12. Flowers & Gifts
13. Automotive Parts
14. Hardware & Tools
15. General Store

## 🌍 Localization

- Currency: Ethiopian Birr (ETB)
- Default Location: Addis Ababa, Ethiopia
- Timezone: East Africa Time (EAT)
- Language: English (expandable)

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with Joi
- CORS protection
- Rate limiting
- Secure file uploads

## 📊 Real-time Features

- Live order tracking with GPS
- Real-time order status updates
- Push notifications
- Live rider location sharing
- Instant order assignments
- WebSocket connections

## 🧪 Testing

```bash
# Backend tests
npm test

# Mobile app tests
cd mobile && npm test

# Admin tests
cd admin && npm test
```

## 📦 Building for Production

### Backend
```bash
npm start
```

### Mobile Apps
```bash
cd mobile
npx expo build:android
npx expo build:ios

cd ../rider
npx expo build:android
npx expo build:ios
```

### Admin Dashboard
```bash
cd admin
npm run build
npm run preview
```

### Frontend
```bash
cd frontend
npm run build
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
npm run kill-port
```

### Mobile App Not Connecting
1. Check API URL in apolloClient.js
2. Ensure backend is running
3. Check firewall settings
4. Use correct IP for physical devices

### Expo Cache Issues
```bash
cd mobile
npx expo start --clear
```

### MongoDB Connection Issues
1. Ensure MongoDB is running
2. Check MONGO_URI in .env
3. Verify network connectivity

## 📝 Development Guidelines

### Code Style
- Use ESLint for linting
- Follow Prettier formatting
- Use meaningful variable names
- Add comments for complex logic

### Git Workflow
- Create feature branches
- Write descriptive commit messages
- Review code before merging
- Keep commits atomic

### Component Structure
- Use functional components
- Implement proper prop types
- Keep components small and focused
- Separate business logic from UI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check documentation in `/docs`

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] AI-powered recommendations
- [ ] Voice ordering
- [ ] Loyalty program
- [ ] Subscription services
- [ ] Social features
- [ ] Advanced search filters

## 📚 Additional Documentation

- [Mobile App Guide](mobile/README.md)
- [Rider App Guide](rider/README.md)
- [Cleanup Summary](CLEANUP_SUMMARY.md)
- [API Documentation](docs/API.md) (coming soon)

---

**Built with ❤️ for efficient delivery management**
#   D e l i v e r y 1  
 