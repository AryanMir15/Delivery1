import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';

import { GET_ORDER } from '../api/queries';
import { UPDATE_RIDER_ORDER_STATUS } from '../api/mutations';
import { updateOrderStatus } from '../store/orderSlice';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const dispatch = useDispatch();

  const { data, loading, error } = useQuery(GET_ORDER, {
    variables: { id: orderId },
    skip: !orderId,
  });

  const [updateStatus, { loading: updating }] = useMutation(UPDATE_RIDER_ORDER_STATUS, {
    onCompleted: (data) => {
      if (data.updateOrderStatus) {
        dispatch(
          updateOrderStatus({
            orderId: data.updateOrderStatus.id,
            status: data.updateOrderStatus.orderStatus,
          })
        );
        Alert.alert('Success', 'Order status updated successfully');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2EC4B6" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data?.order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={60} color="#E63946" />
          <Text style={styles.errorText}>Failed to load order</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const order = data.order;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFC107';
      case 'accepted':
      case 'preparing':
        return '#2EC4B6';
      case 'ready':
      case 'picked':
        return '#17A2B8';
      case 'delivered':
        return '#28A745';
      case 'cancelled':
        return '#E63946';
      default:
        return '#6C757D';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'clock-outline';
      case 'accepted':
      case 'preparing':
        return 'check-circle';
      case 'ready':
        return 'package-variant';
      case 'picked':
        return 'bike-fast';
      case 'delivered':
        return 'check-all';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Just now';
    
    // Handle both timestamp (number) and ISO string
    const date = new Date(typeof dateValue === 'string' ? dateValue : parseInt(dateValue));
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Just now';
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Error', 'Phone number not available');
    }
  };

  const handleNavigate = () => {
    navigation.navigate('Delivery', { order });
  };

  const statusColor = getStatusColor(order.orderStatus);
  const statusIcon = getStatusIcon(order.orderStatus);
  const earnings = (order.deliveryCharges || 0) + (order.tipping || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Header Card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>#{order.orderId}</Text>
              <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Icon name={statusIcon} size={16} color="#FFFFFF" />
              <Text style={styles.statusText}>{order.orderStatus}</Text>
            </View>
          </View>

          {/* Timeline */}
          {order.orderStatus !== 'pending' && (
            <View style={styles.timeline}>
              {order.acceptedAt && (
                <View style={styles.timelineItem}>
                  <Icon name="check-circle" size={20} color="#2EC4B6" />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Accepted</Text>
                    <Text style={styles.timelineTime}>{formatDate(order.acceptedAt)}</Text>
                  </View>
                </View>
              )}
              {order.pickedAt && (
                <View style={styles.timelineItem}>
                  <Icon name="package-variant" size={20} color="#2EC4B6" />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Picked Up</Text>
                    <Text style={styles.timelineTime}>{formatDate(order.pickedAt)}</Text>
                  </View>
                </View>
              )}
              {order.deliveredAt && (
                <View style={styles.timelineItem}>
                  <Icon name="check-all" size={20} color="#28A745" />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>Delivered</Text>
                    <Text style={styles.timelineTime}>{formatDate(order.deliveredAt)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Restaurant Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="store" size={24} color="#FF6B35" />
            <Text style={styles.cardTitle}>Restaurant</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{order.restaurant?.name}</Text>
            <Text style={styles.infoSubtitle}>{order.restaurant?.address}</Text>
            {order.restaurant?.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(order.restaurant.phone)}
              >
                <Icon name="phone" size={16} color="#2EC4B6" />
                <Text style={styles.callButtonText}>{order.restaurant.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="account" size={24} color="#2EC4B6" />
            <Text style={styles.cardTitle}>Customer</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{order.user?.name || 'Customer'}</Text>
            <Text style={styles.infoSubtitle}>{order.deliveryAddress?.deliveryAddress}</Text>
            {order.deliveryAddress?.details && (
              <Text style={styles.infoDetails}>{order.deliveryAddress.details}</Text>
            )}
            {order.user?.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(order.user.phone)}
              >
                <Icon name="phone" size={16} color="#2EC4B6" />
                <Text style={styles.callButtonText}>{order.user.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="package-variant" size={24} color="#2EC4B6" />
            <Text style={styles.cardTitle}>Order Items ({order.items?.length || 0})</Text>
          </View>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.food?.title}</Text>
                {item.variation && (
                  <Text style={styles.itemVariation}>{item.variation.title}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Special Instructions */}
        {order.instructions && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="note-text" size={24} color="#FFC107" />
              <Text style={styles.cardTitle}>Special Instructions</Text>
            </View>
            <Text style={styles.instructions}>{order.instructions}</Text>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="cash" size={24} color="#2EC4B6" />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Amount</Text>
            <Text style={styles.summaryValue}>ETB {order.orderAmount?.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>ETB {order.deliveryCharges?.toFixed(2)}</Text>
          </View>

          {order.tipping > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={[styles.summaryValue, styles.tipValue]}>
                ETB {order.tipping.toFixed(2)}
              </Text>
            </View>
          )}

          {order.taxationAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>ETB {order.taxationAmount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ETB{' '}
              {(
                (order.orderAmount || 0) +
                (order.deliveryCharges || 0) +
                (order.tipping || 0) +
                (order.taxationAmount || 0)
              ).toFixed(2)}
            </Text>
          </View>

          <View style={styles.earningsBox}>
            <Icon name="wallet" size={20} color="#28A745" />
            <Text style={styles.earningsLabel}>Your Earnings:</Text>
            <Text style={styles.earningsValue}>ETB {earnings.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={handleNavigate}
              disabled={updating}
            >
              <Icon name="navigation" size={20} color="#FFFFFF" />
              <Text style={styles.navigateButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E63946',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2EC4B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#6C757D',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  timeline: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineContent: {
    marginLeft: 12,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
  },
  timelineTime: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginLeft: 12,
  },
  infoContent: {
    paddingLeft: 36,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  infoDetails: {
    fontSize: 13,
    color: '#6C757D',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E0F7F5',
    borderRadius: 8,
    marginTop: 8,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2EC4B6',
    marginLeft: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingLeft: 36,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    width: 40,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#1D3557',
    fontWeight: '500',
  },
  itemVariation: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  instructions: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    paddingLeft: 36,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingLeft: 36,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  tipValue: {
    color: '#28A745',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 8,
    marginLeft: 36,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2EC4B6',
  },
  earningsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginLeft: 36,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#155724',
    marginLeft: 8,
    flex: 1,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navigateButton: {
    flexDirection: 'row',
    backgroundColor: '#2EC4B6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderDetailScreen;
