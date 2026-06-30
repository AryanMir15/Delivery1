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

import { useTheme } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import StatusBadge from '../../components/StatusBadge';
import { GET_ORDER } from '../../api/queries';
import { UPDATE_RIDER_ORDER_STATUS } from '../../api/mutations';
import { updateOrderStatus } from '../../store/orderSlice';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();

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
      <SafeAreaView style={s.container}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={s.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data?.order) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.errorContainer}>
          <Icon name="alert-circle" size={60} color={colors.error} />
          <Text style={s.errorText}>Failed to load order</Text>
          <TouchableOpacity style={s.retryButton} onPress={() => navigation.goBack()}>
            <Text style={s.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const s = styles(colors, typography, scale);

  const order = data.order;

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

  const statusIcon = getStatusIcon(order.orderStatus);
  const earnings = (order.deliveryCharges || 0) + (order.tipping || 0);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.title}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Header Card */}
        <View style={s.card}>
          <View style={s.orderHeader}>
            <View>
              <Text style={s.orderId}>#{order.orderId}</Text>
              <Text style={s.orderDate}>{formatDate(order.orderDate)}</Text>
            </View>
            <StatusBadge status={order.orderStatus} />
          </View>

          {/* Timeline */}
          {order.orderStatus !== 'pending' && (
            <View style={s.timeline}>
              {order.acceptedAt && (
                <View style={s.timelineItem}>
                  <Icon name="check-circle" size={20} color={colors.accent} />
                  <View style={s.timelineContent}>
                    <Text style={s.timelineLabel}>Accepted</Text>
                    <Text style={s.timelineTime}>{formatDate(order.acceptedAt)}</Text>
                  </View>
                </View>
              )}
              {order.pickedAt && (
                <View style={s.timelineItem}>
                  <Icon name="package-variant" size={20} color={colors.accent} />
                  <View style={s.timelineContent}>
                    <Text style={s.timelineLabel}>Picked Up</Text>
                    <Text style={s.timelineTime}>{formatDate(order.pickedAt)}</Text>
                  </View>
                </View>
              )}
              {order.deliveredAt && (
                <View style={s.timelineItem}>
                  <Icon name="check-all" size={20} color={colors.success} />
                  <View style={s.timelineContent}>
                    <Text style={s.timelineLabel}>Delivered</Text>
                    <Text style={s.timelineTime}>{formatDate(order.deliveredAt)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Restaurant Info */}
        <View style={s.card}>
          <View style={s.cardHeader}>
              <Icon name="store" size={24} color={colors.warning} />
            <Text style={s.cardTitle}>Restaurant</Text>
          </View>
          <View style={s.infoContent}>
            <Text style={s.infoTitle}>{order.restaurant?.name}</Text>
            <Text style={s.infoSubtitle}>{order.restaurant?.address}</Text>
            {order.restaurant?.phone && (
              <TouchableOpacity
                style={s.callButton}
                onPress={() => handleCall(order.restaurant.phone)}
              >
                <Icon name="phone" size={16} color={colors.accent} />
                <Text style={s.callButtonText}>{order.restaurant.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Customer Info */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Icon name="account" size={24} color={colors.accent} />
            <Text style={s.cardTitle}>Customer</Text>
          </View>
          <View style={s.infoContent}>
            <Text style={s.infoTitle}>{order.user?.name || 'Customer'}</Text>
            <Text style={s.infoSubtitle}>{order.deliveryAddress?.deliveryAddress}</Text>
            {order.deliveryAddress?.details && (
              <Text style={s.infoDetails}>{order.deliveryAddress.details}</Text>
            )}
            {order.user?.phone && (
              <TouchableOpacity
                style={s.callButton}
                onPress={() => handleCall(order.user.phone)}
              >
                <Icon name="phone" size={16} color={colors.accent} />
                <Text style={s.callButtonText}>{order.user.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Icon name="package-variant" size={24} color={colors.accent} />
            <Text style={s.cardTitle}>Order Items ({order.items?.length || 0})</Text>
          </View>
          {order.items?.map((item, index) => (
            <View key={index} style={s.itemRow}>
              <Text style={s.itemQuantity}>{item.quantity}x</Text>
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.food?.title}</Text>
                {item.variation && (
                  <Text style={s.itemVariation}>{item.variation.title}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Special Instructions */}
        {order.instructions && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Icon name="note-text" size={24} color={colors.warning} />
              <Text style={s.cardTitle}>Special Instructions</Text>
            </View>
            <Text style={s.instructions}>{order.instructions}</Text>
          </View>
        )}

        {/* Payment Summary */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Icon name="cash" size={24} color={colors.accent} />
            <Text style={s.cardTitle}>Payment Summary</Text>
          </View>

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Order Amount</Text>
            <Text style={s.summaryValue}>PKR {order.orderAmount?.toFixed(2)}</Text>
          </View>

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Delivery Fee</Text>
            <Text style={s.summaryValue}>PKR {order.deliveryCharges?.toFixed(2)}</Text>
          </View>

          {order.tipping > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Tip</Text>
              <Text style={[s.summaryValue, s.tipValue]}>
                PKR {order.tipping.toFixed(2)}
              </Text>
            </View>
          )}

          {order.taxationAmount > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Tax</Text>
              <Text style={s.summaryValue}>PKR {order.taxationAmount.toFixed(2)}</Text>
            </View>
          )}

          <View style={s.divider} />

          <View style={s.summaryRow}>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalValue}>
              PKR{' '}
              {(
                (order.orderAmount || 0) +
                (order.deliveryCharges || 0) +
                (order.tipping || 0) +
                (order.taxationAmount || 0)
              ).toFixed(2)}
            </Text>
          </View>

          <View style={s.earningsBox}>
            <Icon name="wallet" size={20} color={colors.accent} />
            <Text style={s.earningsLabel}>Your Earnings:</Text>
            <Text style={s.earningsValue}>PKR {earnings.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
          <View style={s.actionsContainer}>
            <TouchableOpacity
              style={s.navigateButton}
              onPress={handleNavigate}
              disabled={updating}
            >
              <Icon name="navigation" size={20} color={colors.surface} />
              <Text style={s.navigateButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(12 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: Math.round(8 * scale),
  },
  title: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(16 * scale),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Math.round(32 * scale),
  },
  errorText: {
    fontSize: Math.round(18 * scale),
    fontWeight: '600',
    color: colors.error,
    marginTop: Math.round(16 * scale),
    marginBottom: Math.round(24 * scale),
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(24 * scale),
    paddingVertical: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginTop: Math.round(12 * scale),
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.round(16 * scale),
  },
  orderId: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  orderDate: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
  },

  timeline: {
    paddingTop: Math.round(16 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
  },
  timelineContent: {
    marginLeft: Math.round(12 * scale),
  },
  timelineLabel: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineTime: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(2 * scale),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
  },
  cardTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: Math.round(12 * scale),
  },
  infoContent: {
    paddingLeft: Math.round(36 * scale),
  },
  infoTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  infoSubtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(4 * scale),
  },
  infoDetails: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Math.round(8 * scale),
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Math.round(8 * scale),
    paddingHorizontal: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
    marginTop: Math.round(8 * scale),
  },
  callButtonText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginLeft: Math.round(6 * scale),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Math.round(8 * scale),
    paddingLeft: Math.round(36 * scale),
  },
  itemQuantity: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    width: Math.round(40 * scale),
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    fontWeight: '500',
  },
  itemVariation: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(2 * scale),
  },
  instructions: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    lineHeight: 20,
    paddingLeft: Math.round(36 * scale),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Math.round(8 * scale),
    paddingLeft: Math.round(36 * scale),
  },
  summaryLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: Math.round(14 * scale),
    fontWeight: '500',
    color: colors.textPrimary,
  },
  tipValue: {
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Math.round(8 * scale),
    marginLeft: Math.round(36 * scale),
  },
  totalLabel: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  earningsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`,
    padding: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    marginTop: Math.round(12 * scale),
    marginLeft: Math.round(36 * scale),
  },
  earningsLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.success,
    marginLeft: Math.round(8 * scale),
    flex: 1,
  },
  earningsValue: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  actionsContainer: {
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(16 * scale),
  },
  navigateButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent,
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateButtonText: {
    color: colors.surface,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    marginLeft: Math.round(8 * scale),
  },
});

export default OrderDetailScreen;
