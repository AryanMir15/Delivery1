# Technology Stack

## Backend

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **API**: GraphQL with Apollo Server 3
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: WebSocket subscriptions (subscriptions-transport-ws, graphql-ws)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Joi
- **Password Hashing**: bcryptjs

## Mobile Apps (Customer & Rider)

- **Framework**: React Native 0.74.5
- **Platform**: Expo SDK 51
- **State Management**: Redux Toolkit with Redux Persist
- **GraphQL Client**: Apollo Client 3.8
- **Navigation**: React Navigation 6 (Stack & Bottom Tabs)
- **UI Library**: React Native Paper
- **Maps**: React Native Maps (rider app)
- **Location**: Expo Location
- **Storage**: AsyncStorage

## Web Applications

### Admin Dashboard
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.9
- **GraphQL Client**: Apollo Client 3.14
- **Routing**: React Router DOM 7
- **Charts**: Recharts 3

### Frontend (Customer Web)
- **Framework**: React 18
- **Build Tool**: Create React App (react-scripts 5)
- **State Management**: Redux Toolkit
- **GraphQL Client**: Apollo Client 3.8
- **Routing**: React Router DOM 6
- **Styling**: Styled Components
- **Animation**: Framer Motion

## Development Tools

- **Package Manager**: npm
- **Process Manager**: nodemon (backend dev)
- **Linting**: ESLint
- **Code Formatting**: Prettier

## Common Commands

### Backend
```bash
npm install              # Install dependencies
npm start               # Start production server
npm run dev             # Start with nodemon (auto-reload)
npm run dev:clean       # Kill port and start fresh
npm run kill-port       # Kill process on port 4000
```

### Mobile Apps (mobile/ or rider/)
```bash
npm install             # Install dependencies
npm start               # Start Expo dev server
npm run android         # Run on Android
npm run ios             # Run on iOS (Mac only)
npx expo start          # Alternative start command
```

### Admin Dashboard
```bash
npm install             # Install dependencies
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Frontend (Web)
```bash
npm install             # Install dependencies
npm start               # Start dev server (port 3000)
npm run build           # Build for production
npm test                # Run tests
```

## Environment Configuration

Backend requires `.env` file with:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default 4000)
- Email configuration (SMTP settings)

Mobile apps require API URL configuration in `src/api/apolloClient.js`:
- Android Emulator: `http://10.0.2.2:4000/graphql`
- iOS Simulator: `http://localhost:4000/graphql`
- Physical Device: `http://YOUR_IP:4000/graphql`

Rider app additionally requires Google Maps API key in `app.json` and `DeliveryScreen.js`.
