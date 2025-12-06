import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';

import { GET_RIDER_ORDERS } from '../api/queries';
import { UPDATE_RIDER_AVAILABILITY, ACCEPT_ORDER_BY_RIDER } from '../api/mutations';
import { setOrders, setActiveOrder } from '../store/orderSlice';
import { setAvailability } from '../store/authSlice';
import LocationService from '../services/LocationService';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { rider, isAvailable } = useSelector((state) => state.auth);
  const { orders, activeOrder } = useSelector((state) => state.order);
  const currentLocation = useSelector((state) => state.location.currentLocation);
  
  const [refreshing, setRefreshing] = useState(false);
  const [rejectedOrders, setRejectedOrders] = useState([]);

  useEffect(() => {
    console.log('🚴 HomeScreen - Rider info:', {
      id: rider?.id,
      _id: rider?._id,
      name: rider?.name,
      email: rider?.email,
    });
  }, [rider]);

  // Poll when rider is online, fetch once when offline (to get active order)
  const { data, loading, error, refetch } = useQuery(GET_RIDER_ORDERS, {
    pollInterval: isAvailable ? 10000 : 0, // Poll every 10s when online, stop when offline
    fetchPolicy: 'network-only', // Always fetch fresh data
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    console.log('Query state - loading:', loading, 'error:', error?.message, 'data:', !!data);
    if (data) {
      console.log('Full data received:', JSON.stringify(data, null, 2));
    }
    if (data?.ordersByRider) {
      console.log('Orders fetched:', data.ordersByRider.length);
      dispatch(setOrders(data.ordersByRider));
    } else if (data && !data.ordersByRider) {
      console.log('Query returned but no ordersByRider field');
      dispatch(setOrders([]));
    }
  }, [data, loading, error, dispatch]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching orders:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      dispatch(setOrders([]));
    }
  }, [error, dispatch]);

  const [updateAvailability] = useMutation(UPDATE_RIDER_AVAILABILITY);
  const [acceptOrderMutation] = useMutation(ACCEPT_ORDER_BY_RIDER);

  // Don't start tracking on HomeScreen - only track during active deliveries
  // Location tracking will start when rider accepts an order in DeliveryScreen

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
      
      if (newStatus) {
        Alert.alert('You are now online', 'You will receive delivery requests');
      } else {
        // Stop tracking if going offline
        LocationService.stopTracking();
        Alert.alert('You are now offline', 'You will not receive delivery requests');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
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
        Alert.alert('✅ Success', 'Order accepted! Navigate to restaurant.');
        navigation.navigate('Delivery', { order: data.acceptOrderByRider });
      }
    } catch (error) {
      if (error.message.includes('already assigned')) {
        Alert.alert('Order Taken', 'This order was already accepted by another rider');
        refetch();
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleRejectOrder = (order) => {
    Alert.alert(
      'Reject Order',
      `Are you sure you want to reject this order from ${order.restaurant?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            // Add order ID to rejected list (local only)
            const orderId = order.id || order._id;
            setRejectedOrders([...rejectedOrders, orderId]);
            Alert.alert('✅ Order Rejected', 'This order will no longer be shown to you');
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
      case 'food':
        return 'food';
      case 'pharmacy':
        return 'pill';
      case 'electronics':
        return 'laptop';
      case 'farm':
        return 'sprout';
      default:
        return 'package-variant';
    }
  };

  const getCategoryColor = (orderType) => {
    switch (orderType?.toLowerCase()) {
      case 'food':
        return '#FF6B35';
      case 'pharmacy':
        return '#E63946';
      case 'electronics':
        return '#457B9D';
      case 'farm':
        return '#2A9D8F';
      default:
        return '#6C757D';
    }
  };

  const calculateDistance = (order) => {
    if (!currentLocation || !order.restaurant.location) {
      return 'N/A';
    }
    
    const distance = LocationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      order.restaurant.location.coordinates[1],
      order.restaurant.location.coordinates[0]
    );
    
    return `${distance.toFixed(1)} km`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Hello, {rider?.name}!</Text>
          <Text style={styles.subGreeting}>
            {isAvailable ? 'You are online' : 'You are offline'}
          </Text>
        </View>
        
        <View style={styles.availabilityToggle}>
          <Text style={styles.toggleLabel}>
            {isAvailable ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: '#E9ECEF', true: '#2EC4B6' }}
            thumbColor={isAvailable ? '#FFFFFF' : '#6C757D'}
          />
        </View>
      </View>

      {activeOrder && (
        <TouchableOpacity
          style={styles.activeOrderBanner}
          onPress={() => navigation.navigate('Delivery', { order: activeOrder })}
        >
          <Icon name="bike-fast" size={24} color="#FFFFFF" />
          <View style={styles.activeOrderInfo}>
            <Text style={styles.activeOrderText}>Active Delivery</Text>
            <Text style={styles.activeOrderSubtext}>
              Order #{activeOrder.orderId}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Icon name="package-variant" size={24} color="#2EC4B6" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="cash" size={24} color="#2EC4B6" />
          <Text style={styles.statValue}>ETB 0</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="star" size={24} color="#2EC4B6" />
          <Text style={styles.statValue}>5.0</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        {isAvailable ? 'Available Orders' : 'Go online to see orders'}
      </Text>
    </View>
  );

  const renderOrderItem = ({ item }) => {
    const categoryColor = getCategoryColor(item.orderType);
    const categoryIcon = getCategoryIcon(item.orderType);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleAcceptOrder(item)}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Icon name={categoryIcon} size={20} color="#FFFFFF" />
            <Text style={styles.categoryText}>
              {item.orderType || 'Food'}
            </Text>
          </View>
          <Text style={styles.orderAmount}>ETB {item.orderAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.locationRow}>
            <Icon name="store" size={18} color="#FF6B35" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{item.restaurant.name}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.restaurant.address}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <Icon name="map-marker" size={18} color="#2EC4B6" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>Customer</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.deliveryAddress.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderMeta}>
            <Icon name="map-marker-distance" size={16} color="#6C757D" />
            <Text style={styles.metaText}>{calculateDistance(item)}</Text>
          </View>
          <View style={styles.orderMeta}>
            <Icon name="package-variant" size={16} color="#6C757D" />
            <Text style={styles.metaText}>{item.items.length} items</Text>
          </View>
          <View style={styles.orderMeta}>
            <Icon name="cash" size={16} color="#6C757D" />
            <Text style={styles.metaText}>
              ETB {(item.deliveryCharges + item.tipping).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectOrder(item)}
          >
            <Icon name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptOrder(item)}
          >
            <Icon name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon 
        name={isAvailable ? "package-variant-closed" : "power-off"} 
        size={80} 
        color={isAvailable ? "#A8DADC" : "#E63946"} 
      />
      <Text style={styles.emptyTitle}>
        {isAvailable ? 'No orders available' : 'You are offline'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isAvailable
          ? 'New orders will appear here when customers place them'
          : 'Toggle online to start receiving new orders'}
      </Text>
      {!isAvailable && activeOrder && (
        <Text style={styles.emptyNote}>
          You have an active delivery. Complete it or go online for new orders.
        </Text>
      )}
    </View>
  );

  // Filter orders based on online/offline status
  const availableOrders = isAvailable ? orders.filter((order) => {
    const orderId = order.id || order._id;
    const isRejected = rejectedOrders.includes(orderId);
    const isPending = order.orderStatus === 'pending';
    const isAssignedToMe = order.rider && (order.rider.id === rider?.id || order.rider._id === rider?._id);
    
    // When ONLINE: Show pending orders (not rejected) or orders assigned to me (not active)
    const isActive = activeOrder && (activeOrder.id === orderId || activeOrder._id === orderId);
    return !isRejected && !isActive && (isPending || isAssignedToMe);
  }) : []; // When OFFLINE: Show NO order cards

  if (loading && !refreshing && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
            colors={['#2EC4B6']}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    marginRight: 8,
  },
  activeOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2EC4B6',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  activeOrderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activeOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeOrderSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  orderBody: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6C757D',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E63946',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#28A745',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  emptyNote: {
    fontSize: 14,
    color: '#2EC4B6',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
});

export default HomeScreen;
