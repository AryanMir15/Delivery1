import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import OrdersIcon from '../components/OrdersIcon';

import RiderHomeScreen from '../screens/rider/RiderHomeScreen';
import RiderOrdersScreen from '../screens/rider/RiderOrdersScreen';
import EarningsScreen from '../screens/rider/EarningsScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';
import DeliveryScreen from '../screens/rider/DeliveryScreen';
import RiderOrderDetailScreen from '../screens/rider/RiderOrderDetailScreen';
import WalletScreen from '../screens/rider/WalletScreen';
import { useTheme } from '../theme';
import SharedTopBar from '../components/SharedTopBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
    <Stack.Screen name="HomeMain" component={RiderHomeScreen} />
    <Stack.Screen name="OrderDetail" component={RiderOrderDetailScreen} />
    <Stack.Screen name="Delivery" component={DeliveryScreen} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
    <Stack.Screen name="OrdersMain" component={RiderOrdersScreen} />
    <Stack.Screen name="OrderDetail" component={RiderOrderDetailScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
    <Stack.Screen name="ProfileMain" component={RiderProfileScreen} />
    <Stack.Screen name="Wallet" component={WalletScreen} />
  </Stack.Navigator>
);

const ActiveOrderBadge = ({ colors }) => {
  const activeOrder = useSelector((state) => state.order.activeOrder);
  if (!activeOrder) return null;
  return (
    <View style={[styles.badge, { backgroundColor: colors.error }]}>
      <Text style={styles.badgeText}>1</Text>
    </View>
  );
};

const RiderNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
          header: () => <SharedTopBar />,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Orders':
              return <OrdersIcon size={size} color={color} />;
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
              {route.name === 'Home' && <ActiveOrderBadge colors={colors} />}
            </View>
          );
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          paddingBottom: 12,
          paddingTop: 5,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        contentStyle: { backgroundColor: '#000' },
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
