import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';

import { useTheme, getStatusColor } from '../../theme';
import { palette } from '../../theme/colors';
import useResponsive from '../../hooks/useResponsive';
import { GET_RIDER_ORDERS } from '../../api/queries';
import { UPDATE_RIDER_AVAILABILITY, ACCEPT_ORDER_BY_RIDER } from '../../api/mutations';
import { setOrders, setActiveOrder } from '../../store/orderSlice';
import { setAvailability } from '../../store/authSlice';
import LocationService from '../../services/rider/LocationService';
import ShokLogo from '../../components/ShokLogo';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const { user: rider, isAvailable } = useSelector((state) => state.auth);
  const { orders, activeOrder } = useSelector((state) => state.order);
  const currentLocation = useSelector((state) => state.location.currentLocation);

  const [refreshing, setRefreshing] = useState(false);
  const [rejectedOrders, setRejectedOrders] = useState([]);

  const { data, loading, error, refetch } = useQuery(GET_RIDER_ORDERS, {
    pollInterval: isAvailable ? 10000 : 0,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (data?.ordersByRider) {
      dispatch(setOrders(data.ordersByRider));
    } else if (data && !data.ordersByRider) {
      dispatch(setOrders([]));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(setOrders([]));
    }
  }, [error, dispatch]);

  const [updateAvailability] = useMutation(UPDATE_RIDER_AVAILABILITY);
  const [acceptOrderMutation] = useMutation(ACCEPT_ORDER_BY_RIDER);

  const handleToggleAvailability = async () => {
    const newStatus = !isAvailable;
    try {
      await updateAvailability({
        variables: {
          id: rider.id || rider._id,
          available: newStatus,
        },
      });
      dispatch(setAvailability(newStatus));
      if (!newStatus) {
        LocationService.stopTracking();
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAcceptOrder = async (order) => {
    try {
      const { data } = await acceptOrderMutation({
        variables: {
          orderId: order.id || order._id,
        },
        refetchQueries: [{ query: GET_RIDER_ORDERS }],
      });
      if (data?.acceptOrderByRider) {
        dispatch(setActiveOrder(data.acceptOrderByRider));
        navigation.navigate('Delivery', { order: data.acceptOrderByRider });
      }
    } catch (err) {
      if (err.message.includes('already assigned')) {
        Alert.alert('Order Taken', 'This order was already accepted by another rider');
        refetch();
      } else {
        Alert.alert('Error', err.message);
      }
    }
  };

  const handleRejectOrder = (order) => {
    Alert.alert(
      'Reject Order',
      `Reject order from ${order.restaurant?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setRejectedOrders([...rejectedOrders, order.id || order._id]);
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const getCategoryIcon = (orderType) => {
    switch (orderType?.toLowerCase()) {
      case 'food': return 'food';
      case 'pharmacy': return 'pill';
      case 'electronics': return 'laptop';
      case 'farm': return 'sprout';
      default: return 'package-variant';
    }
  };

  const getCategoryColor = (orderType) => {
    switch (orderType?.toLowerCase()) {
      case 'food': return '#FF6B35';
      case 'pharmacy': return '#D94F44';
      case 'electronics': return '#6B9FD4';
      case 'farm': return '#5CB868';
      default: return palette.silver;
    }
  };

  const calculateDistance = (order) => {
    if (!currentLocation || !order.restaurant?.location) return 'N/A';
    const distance = LocationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      order.restaurant.location.coordinates[1],
      order.restaurant.location.coordinates[0]
    );
    return `${distance.toFixed(1)} km`;
  };

  const todayOrders = orders.filter(o => o.orderStatus === 'delivered').length;
  const todayEarnings = orders
    .filter(o => o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.deliveryCharges || 0), 0);

  const renderHeader = () => (
    <View style={s.header}>
      {/* Earnings Hero */}
      <View style={s.earningsHero}>
        <Text style={s.earningsLabel}>Today's Earnings</Text>
        <Text style={s.earningsValue}>PKR {todayEarnings.toFixed(0)}</Text>
        <Text style={s.earningsSub}>{todayOrders} deliveries completed</Text>
      </View>

      {/* Online Toggle */}
      <TouchableOpacity
        style={[s.togglePill, isAvailable && s.togglePillActive]}
        onPress={handleToggleAvailability}
        activeOpacity={0.8}
      >
        <View style={[s.toggleDot, isAvailable && s.toggleDotActive]} />
        <Text style={[s.toggleText, isAvailable && s.toggleTextActive]}>
          {isAvailable ? 'Online' : 'Offline'}
        </Text>
      </TouchableOpacity>

      {/* Active Order Banner */}
      {activeOrder && (
        <TouchableOpacity
          style={s.activeBanner}
          onPress={() => navigation.navigate('Delivery', { order: activeOrder })}
          activeOpacity={0.8}
        >
          <Icon name="bike-fast" size={22} color={palette.black} />
          <View style={s.activeBannerInfo}>
            <Text style={s.activeBannerTitle}>Active Delivery</Text>
            <Text style={s.activeBannerSub}>#{activeOrder.orderId}</Text>
          </View>
          <Icon name="chevron-right" size={22} color={palette.black} />
        </TouchableOpacity>
      )}

      {/* Section Header */}
      <Text style={s.sectionTitle}>
        {isAvailable ? 'Available Orders' : 'Go online to see orders'}
      </Text>
    </View>
  );

  const renderOrderItem = ({ item }) => {
    const categoryColor = getCategoryColor(item.orderType);
    const categoryIcon = getCategoryIcon(item.orderType);

    return (
      <View style={s.orderCard}>
        {/* Card Top: Category + Earning */}
        <View style={s.cardTop}>
          <View style={[s.categoryBadge, { backgroundColor: categoryColor }]}>
            <Icon name={categoryIcon} size={16} color={palette.black} />
            <Text style={s.categoryText}>{item.orderType || 'Food'}</Text>
          </View>
          <Text style={s.orderEarning}>PKR {(item.deliveryCharges + (item.tipping || 0)).toFixed(0)}</Text>
        </View>

        {/* Route */}
        <View style={s.routeContainer}>
          <View style={s.routeDot} />
          <View style={s.routeLine} />
          <View style={[s.routeDot, s.routeDotBottom]} />
        </View>

        <View style={s.routeInfo}>
          <View style={s.routeItem}>
            <Text style={s.routeLabel}>Pickup</Text>
            <Text style={s.routeName} numberOfLines={1}>{item.restaurant?.name}</Text>
            <Text style={s.routeAddress} numberOfLines={1}>{item.restaurant?.address}</Text>
          </View>
          <View style={s.routeItem}>
            <Text style={s.routeLabel}>Drop-off</Text>
            <Text style={s.routeName}>Customer</Text>
            <Text style={s.routeAddress} numberOfLines={1}>{item.deliveryAddress?.deliveryAddress}</Text>
          </View>
        </View>

        {/* Meta Row */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Icon name="map-marker-distance" size={14} color={palette.silverDark} />
            <Text style={s.metaText}>{calculateDistance(item)}</Text>
          </View>
          <View style={s.metaItem}>
            <Icon name="shopping" size={14} color={palette.silverDark} />
            <Text style={s.metaText}>{item.items?.length || 0} items</Text>
          </View>
          <Text style={s.orderAmount}>PKR {item.orderAmount?.toFixed(0)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.rejectBtn}
            onPress={() => handleRejectOrder(item)}
            activeOpacity={0.7}
          >
            <Text style={s.rejectBtnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.acceptBtn}
            onPress={() => handleAcceptOrder(item)}
            activeOpacity={0.7}
          >
            <Text style={s.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={s.emptyContainer}>
      <ShokLogo size={80} />
      <Text style={s.emptyTitle}>
        {isAvailable ? 'No orders right now' : 'You are offline'
      }</Text>
      <Text style={s.emptySubtitle}>
        {isAvailable
          ? 'New orders will appear here'
          : 'Tap the toggle above to start receiving orders'}
      </Text>
    </View>
  );

  const s = styles(colors, scale);

  const availableOrders = isAvailable ? orders.filter((order) => {
    const orderId = order.id || order._id;
    const isRejected = rejectedOrders.includes(orderId);
    const isPending = order.orderStatus === 'pending';
    const isAssignedToMe = order.rider && (order.rider.id === rider?.id || order.rider._id === rider?._id);
    const isActive = activeOrder && (activeOrder.id === orderId || activeOrder._id === orderId);
    return !isRejected && !isActive && (isPending || isAssignedToMe);
  }) : [];

  if (loading && !refreshing && !data) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingContainer}>
          <ShokLogo size={60} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={availableOrders}
        keyExtractor={(item) => item.id || item._id}
        renderItem={renderOrderItem}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.silver}
          />
        }
        contentContainerStyle={s.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = (colors, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.black,
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Earnings Hero
  earningsHero: {
    backgroundColor: palette.gray900,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  earningsLabel: {
    fontSize: 13,
    color: palette.silverDark,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: palette.silver,
    letterSpacing: 1,
  },
  earningsSub: {
    fontSize: 13,
    color: palette.gray500,
    marginTop: 4,
  },

  // Toggle Pill
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 30,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  togglePillActive: {
    backgroundColor: '#1A2E1A',
    borderColor: '#2A4A2A',
  },
  toggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.gray500,
  },
  toggleDotActive: {
    backgroundColor: palette.green,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.gray500,
  },
  toggleTextActive: {
    color: palette.silver,
  },

  // Active Banner
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.silver,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  activeBannerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activeBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.black,
  },
  activeBannerSub: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.silver,
    marginBottom: 12,
  },

  // Order Card
  orderCard: {
    backgroundColor: palette.gray900,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  categoryText: {
    color: palette.black,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  orderEarning: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.silver,
  },

  // Route
  routeContainer: {
    flexDirection: 'row',
    marginLeft: 5,
    marginBottom: 10,
    height: 30,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.silver,
  },
  routeDotBottom: {
    backgroundColor: palette.silver,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 4,
  },
  routeInfo: {
    gap: 8,
    marginBottom: 12,
  },
  routeItem: {
    marginLeft: 20,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.silverDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  routeName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.silver,
  },
  routeAddress: {
    fontSize: 13,
    color: palette.gray500,
    marginTop: 1,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: palette.silverDark,
  },
  orderAmount: {
    fontSize: 13,
    color: palette.silverDark,
    marginLeft: 'auto',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  rejectBtnText: {
    color: palette.silverDark,
    fontSize: 15,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: palette.silver,
  },
  acceptBtnText: {
    color: palette.black,
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.silver,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: palette.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.black,
  },
});

export default HomeScreen;
