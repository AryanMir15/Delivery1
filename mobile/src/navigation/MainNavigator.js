import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import CategoryHomeScreen from '../screens/CategoryHomeScreen';
import HomeScreen from '../screens/HomeScreenSimple'; // Using simplified version
import SearchScreen from '../screens/SearchScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RestaurantScreen from '../screens/RestaurantScreen';
import FoodDetailScreen from '../screens/FoodDetailScreenSimple';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import RecentlyViewedScreen from '../screens/RecentlyViewedScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="CategoryHome" component={CategoryHomeScreen} />
    <Stack.Screen name="Restaurant" component={RestaurantScreen} />
    <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} />
    <Stack.Screen name="RecentlyViewed" component={RecentlyViewedScreen} />
  </Stack.Navigator>
);

// Orders Stack
const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersMain" component={OrdersScreen} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  </Stack.Navigator>
);

// Cart Badge Component
const CartBadge = ({ count }) => {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
    </View>
  );
};

const MainNavigator = () => {
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TabNavigator">
        {() => (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                switch (route.name) {
                  case 'Home':
                    iconName = focused ? 'home' : 'home-outline';
                    break;
                  case 'Search':
                    iconName = focused ? 'magnify' : 'magnify';
                    break;
                  case 'Cart':
                    iconName = focused ? 'cart' : 'cart-outline';
                    break;
                  case 'Orders':
                    iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
                    break;
                  case 'Profile':
                    iconName = focused ? 'account' : 'account-outline';
                    break;
                  default:
                    iconName = 'circle';
                }

                return (
                  <View>
                    <Icon name={iconName} size={size} color={color} />
                    {route.name === 'Cart' && <CartBadge count={cartCount} />}
                  </View>
                );
              },
              tabBarActiveTintColor: '#FF6B35',
              tabBarInactiveTintColor: '#6C757D',
              tabBarStyle: {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 1,
                borderTopColor: '#E9ECEF',
                paddingBottom: 5,
                paddingTop: 5,
                height: 60,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Orders" component={OrdersStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
          </Tab.Navigator>
        )}
      </Stack.Screen>
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -10,
    top: -5,
    backgroundColor: '#E63946',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MainNavigator;