import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import OrdersIcon from '../components/OrdersIcon';

import VendorDashboardScreen from '../screens/vendor/VendorDashboardScreen';
import VendorOrdersScreen from '../screens/vendor/VendorOrdersScreen';
import VendorOrderDetailScreen from '../screens/vendor/VendorOrderDetailScreen';
import ProductsScreen from '../screens/vendor/ProductsScreen';
import ProductDetailScreen from '../screens/vendor/ProductDetailScreen';
import ProductFormScreen from '../screens/vendor/ProductFormScreen';
import AnalyticsScreen from '../screens/vendor/AnalyticsScreen';
import VendorProfileScreen from '../screens/vendor/VendorProfileScreen';
import ShopProfileScreen from '../screens/vendor/ShopProfileScreen';
import { useTheme } from '../theme';
import SharedTopBar from '../components/SharedTopBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
    <Stack.Screen name="DashboardMain" component={VendorDashboardScreen} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
    <Stack.Screen name="OrdersList" component={VendorOrdersScreen} />
    <Stack.Screen name="OrderDetail" component={VendorOrderDetailScreen} />
  </Stack.Navigator>
);

const ProductsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
    <Stack.Screen name="ProductsList" component={ProductsScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    <Stack.Screen name="ProductForm" component={ProductFormScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
    <Stack.Screen name="ProfileMain" component={VendorProfileScreen} />
    <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
  </Stack.Navigator>
);

const VendorNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <SharedTopBar />,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Orders':
              return <OrdersIcon size={size} color={color} />;
            case 'Products':
              iconName = focused ? 'food' : 'food-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'chart-line' : 'chart-line-variant';
              break;
            case 'Profile':
              iconName = focused ? 'account' : 'account-outline';
              break;
            default:
              iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
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
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Products" component={ProductsStack} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default VendorNavigator;
