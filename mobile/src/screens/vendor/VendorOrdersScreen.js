import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import StatusBadge from '../../components/StatusBadge';
import OrdersIcon from '../../components/OrdersIcon';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GET_ORDERS_BY_RESTAURANT, GET_RESTAURANTS_BY_OWNER } from '../../api/queries';
import { setOrders } from '../../store/orderSlice';

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'time' },
  { key: 'active', label: 'Active', icon: 'checkmark-done' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { key: 'all', label: 'All', icon: 'list' },
];

export default function OrdersScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const orders = useSelector((state) => state.order.orders);

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.orderStatus === 'pending'),
    [orders]
  );
  const activeOrders = useMemo(
    () => orders.filter((o) => ['accepted', 'preparing', 'ready'].includes(o.orderStatus)),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => ['delivered', 'cancelled'].includes(o.orderStatus)),
    [orders]
  );

  useQuery(GET_RESTAURANTS_BY_OWNER, {
    onCompleted: (data) => {
      if (data?.restaurantsByOwner?.[0]) {
        setSelectedRestaurant(data.restaurantsByOwner[0]);
      }
    },
  });

  const { refetch, loading } = useQuery(GET_ORDERS_BY_RESTAURANT, {
    variables: { restaurant: selectedRestaurant?._id },
    skip: !selectedRestaurant,
    onCompleted: (data) => {
      if (data?.ordersByRestaurant) {
        dispatch(setOrders(data.ordersByRestaurant));
      }
    },
    pollInterval: 5000, // Poll every 5 seconds for new orders
  });

  const getOrdersByTab = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'active':
        return activeOrders;
      case 'completed':
        return completedOrders;
      case 'all':
        return orders;
      default:
        return [];
    }
  };

  const s = styles(colors, typography, scale);

  const renderOrderCard = ({ item: order }) => (
    <TouchableOpacity
      style={s.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
    >
      <View style={s.orderHeader}>
        <View>
          <Text style={s.orderId}>#{order.orderId}</Text>
          <Text style={s.orderCustomer}>{order.user.name}</Text>
        </View>
        <StatusBadge status={order.orderStatus} />
      </View>

      <View style={s.orderItems}>
        <Text style={s.itemsLabel}>Items:</Text>
        {order.items.slice(0, 2).map((item, index) => (
          <Text key={index} style={s.itemText}>
            • {item.quantity}x {item.title}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={s.moreItems}>
            +{order.items.length - 2} more items
          </Text>
        )}
      </View>

      <View style={s.orderFooter}>
        <View style={s.paymentInfo}>
          <Ionicons
            name={order.paymentMethod === 'cash' ? 'cash' : 'card'}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={s.paymentText}>
            {order.paymentMethod.toUpperCase()}
          </Text>
          <View
            style={[
              s.paymentStatus,
              {
                backgroundColor:
                  order.paymentStatus === 'paid' ? `${colors.statusDelivered}15` : `${colors.statusPending}15`,
              },
            ]}
          >
            <Text style={[s.paymentStatusText, {
              color: order.paymentStatus === 'paid' ? colors.statusDelivered : colors.statusPending,
            }]}>
              {order.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={s.orderAmount}>PKR {order.orderAmount.toFixed(2)}</Text>
      </View>

      <View style={s.orderTime}>
        <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
        <Text style={s.timeText}>
          {new Date(order.orderDate).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <View style={s.container}>
      {/* Tabs */}
      <View style={s.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? colors.accent : colors.textTertiary}
            />
            <Text
              style={[
                s.tabText,
                activeTab === tab.key && s.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={getOrdersByTab()}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <OrdersIcon size={64} color={colors.textTertiary} />
            <Text style={s.emptyText}>No orders found</Text>
            <Text style={s.emptySubtext}>
              Orders will appear here when customers place them
            </Text>
          </View>
        }
      />
    </View>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(15 * scale),
    gap: Math.round(5 * scale),
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.accent,
  },
  listContent: {
    padding: Math.round(15 * scale),
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(10 * scale),
    padding: Math.round(15 * scale),
    marginBottom: Math.round(15 * scale),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.round(12 * scale),
  },
  orderId: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  orderCustomer: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  orderItems: {
    marginBottom: Math.round(12 * scale),
    paddingTop: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemsLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
    marginBottom: Math.round(5 * scale),
  },
  itemText: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    marginBottom: Math.round(3 * scale),
  },
  moreItems: {
    fontSize: Math.round(12 * scale),
    color: colors.accent,
    fontStyle: 'italic',
    marginTop: Math.round(3 * scale),
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(8 * scale),
  },
  paymentText: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  paymentStatus: {
    paddingHorizontal: Math.round(8 * scale),
    paddingVertical: Math.round(2 * scale),
    borderRadius: Math.round(10 * scale),
  },
  paymentStatusText: {
    fontSize: Math.round(10 * scale),
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  orderAmount: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  orderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Math.round(8 * scale),
    gap: Math.round(5 * scale),
  },
  timeText: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(60 * scale),
  },
  emptyText: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textTertiary,
    marginTop: Math.round(15 * scale),
  },
  emptySubtext: {
    fontSize: Math.round(14 * scale),
    color: colors.textTertiary,
    marginTop: Math.round(8 * scale),
    textAlign: 'center',
  },
});
