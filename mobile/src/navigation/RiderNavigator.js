import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';

import RiderHomeScreen from '../screens/rider/RiderHomeScreen';
import RiderOrdersScreen from '../screens/rider/RiderOrdersScreen';
import EarningsScreen from '../screens/rider/EarningsScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';
import DeliveryScreen from '../screens/rider/DeliveryScreen';
import RiderOrderDetailScreen from '../screens/rider/RiderOrderDetailScreen';
import WalletScreen from '../screens/rider/WalletScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={RiderHomeScreen} />
    <Stack.Screen name="OrderDetail" component={RiderOrderDetailScreen} />
    <Stack.Screen name="Delivery" component={DeliveryScreen} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersMain" component={RiderOrdersScreen} />
    <Stack.Screen name="OrderDetail" component={RiderOrderDetailScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={RiderProfileScreen} />
    <Stack.Screen name="Wallet" component={WalletScreen} />
  </Stack.Navigator>
);

const ActiveOrderBadge = () => {
  const activeOrder = useSelector((state) => state.order.activeOrder);
  if (!activeOrder) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>1</Text>
    </View>
  );
};

const RiderNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Orders':
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
              break;
            case 'Earnings':
              iconName = focused ? 'cash-multiple' : 'cash';
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
              {route.name === 'Home' && <ActiveOrderBadge />}
            </View>
          );
        },
        tabBarActiveTintColor: '#2EC4B6',
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
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
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

export default RiderNavigator;
