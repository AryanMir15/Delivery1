import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import StatusBadge from '../../components/StatusBadge';

import { GET_ORDERS_BY_RESTAURANT } from '../../api/queries';
import { VENDOR_UPDATE_ORDER_STATUS } from '../../api/mutations';
import { updateOrder } from '../../store/orderSlice';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const [updating, setUpdating] = useState(false);

  const { data, refetch } = useQuery(GET_ORDERS_BY_RESTAURANT, {
    variables: { restaurant: route.params.restaurantId },
    fetchPolicy: 'network-only',
  });

  const [updateOrderStatus] = useMutation(VENDOR_UPDATE_ORDER_STATUS);

  const order = data?.ordersByRestaurant?.find((o) => o._id === orderId);

  const s = styles(colors, typography, scale);

  if (!order) {
    return (
      <View style={s.loadingContainer}>
        <Text>Loading order...</Text>
      </View>
    );
  }

  const handleUpdateStatus = async (newStatus) => {
    Alert.alert(
      'Confirm Status Update',
      `Change order status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              const { data } = await updateOrderStatus({
                variables: {
                  id: orderId,
                  orderStatus: newStatus,
                },
              });

              if (data?.updateOrderStatus) {
                dispatch(updateOrder(data.updateOrderStatus));
                Alert.alert('Success', 'Order status updated');
                refetch();
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectOrder = () => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              await updateOrderStatus({
                variables: {
                  id: orderId,
                  orderStatus: 'cancelled',
                  reason: 'Rejected by vendor',
                },
              });
              Alert.alert('Order Rejected', 'The order has been cancelled');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject order');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCallCustomer = () => {
    if (order.user.phone) {
      Linking.openURL(`tel:${order.user.phone}`);
    } else {
      Alert.alert('No Phone', 'Customer phone number not available');
    }
  };

  const getNextStatus = () => {
    const statusFlow = {
      pending: 'accepted',
      accepted: 'preparing',
      preparing: 'ready',
      ready: 'picked',
    };
    return statusFlow[order.orderStatus];
  };

  const nextStatus = getNextStatus();

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
    <ScrollView style={s.container} contentContainerStyle={s.scrollInner}>
      {/* Order Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.orderId}>#{order.orderId}</Text>
          <StatusBadge status={order.orderStatus} />
        </View>
        <Text style={s.orderDate}>
          {new Date(order.orderDate).toLocaleString()}
        </Text>
      </View>

      {/* Customer Info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Customer Information</Text>
        <View style={s.customerInfo}>
          <View style={s.infoRow}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
            <Text style={s.infoText}>{order.user.name}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="call" size={20} color={colors.textSecondary} />
            <Text style={s.infoText}>{order.user.phone || 'N/A'}</Text>
            {order.user.phone && (
              <TouchableOpacity
                style={s.callButton}
                onPress={handleCallCustomer}
              >
                <Ionicons name="call" size={16} color={colors.textInverse} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Delivery Address</Text>
        <View style={s.addressContainer}>
          <Ionicons name="location" size={20} color={colors.accent} />
          <View style={s.addressText}>
            <Text style={s.address}>
              {order.deliveryAddress.deliveryAddress}
            </Text>
            {order.deliveryAddress.details && (
              <Text style={s.addressDetails}>
                {order.deliveryAddress.details}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Order Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={s.itemCard}>
            <View style={s.itemHeader}>
              <Text style={s.itemQuantity}>{item.quantity}x</Text>
              <View style={s.itemInfo}>
                <Text style={s.itemTitle}>{item.title}</Text>
                {item.variation && (
                  <Text style={s.itemVariation}>
                    {item.variation.title}
                  </Text>
                )}
                {item.addons && item.addons.length > 0 && (
                  <View style={s.addons}>
                    {item.addons.map((addon, addonIndex) => (
                      <Text key={addonIndex} style={s.addonText}>
                        + {addon.title}
                      </Text>
                    ))}
                  </View>
                )}
                {item.specialInstructions && (
                  <Text style={s.specialInstructions}>
                    Note: {item.specialInstructions}
                  </Text>
                )}
              </View>
              <Text style={s.itemPrice}>
                PKR {(item.variation?.price || 0) * item.quantity}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Special Instructions */}
      {order.instructions && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Special Instructions</Text>
          <View style={s.instructionsBox}>
            <Text style={s.instructionsText}>{order.instructions}</Text>
          </View>
        </View>
      )}

      {/* Payment Info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Payment Details</Text>
        <View style={s.paymentDetails}>
          <View style={s.paymentRow}>
            <Text style={s.paymentLabel}>Subtotal</Text>
            <Text style={s.paymentValue}>
              PKR {(order.orderAmount - order.deliveryCharges - order.taxationAmount).toFixed(2)}
            </Text>
          </View>
          <View style={s.paymentRow}>
            <Text style={s.paymentLabel}>Delivery Fee</Text>
            <Text style={s.paymentValue}>
              PKR {order.deliveryCharges.toFixed(2)}
            </Text>
          </View>
          <View style={s.paymentRow}>
            <Text style={s.paymentLabel}>Tax</Text>
            <Text style={s.paymentValue}>
              PKR {order.taxationAmount.toFixed(2)}
            </Text>
          </View>
          {order.tipping > 0 && (
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Tip</Text>
              <Text style={s.paymentValue}>
                PKR {order.tipping.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[s.paymentRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>
              PKR {order.orderAmount.toFixed(2)}
            </Text>
          </View>
          <View style={s.paymentMethodRow}>
            <Ionicons
              name={order.paymentMethod === 'cash' ? 'cash' : 'card'}
              size={20}
              color={colors.textSecondary}
            />
            <Text style={s.paymentMethodText}>
              {order.paymentMethod.toUpperCase()}
            </Text>
            <View
              style={[
                s.paymentStatusBadge,
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
        </View>
      </View>

      {/* Action Buttons */}
      {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
        <View style={s.actionsContainer}>
          {order.orderStatus === 'pending' && (
            <>
              <TouchableOpacity
                style={[s.actionButton, s.rejectButton]}
                onPress={handleRejectOrder}
                disabled={updating}
              >
                <Ionicons name="close-circle" size={20} color={colors.textInverse} />
                <Text style={s.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionButton, s.acceptButton]}
                onPress={() => handleUpdateStatus('accepted')}
                disabled={updating}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                <Text style={s.actionButtonText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}

          {nextStatus && order.orderStatus !== 'pending' && (
            <TouchableOpacity
              style={[s.actionButton, s.updateButton]}
              onPress={() => handleUpdateStatus(nextStatus)}
              disabled={updating}
            >
              <Ionicons name="arrow-forward-circle" size={20} color={colors.textInverse} />
              <Text style={s.actionButtonText}>
                Mark as {nextStatus}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollInner: {
    paddingBottom: Math.round(40 * scale),
  },
  header: {
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.round(8 * scale),
  },
  orderId: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  orderDate: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    marginTop: Math.round(10 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(15 * scale),
  },
  customerInfo: {
    gap: Math.round(12 * scale),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(10 * scale),
  },
  infoText: {
    flex: 1,
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  callButton: {
    backgroundColor: colors.accent,
    width: Math.round(32 * scale),
    height: Math.round(32 * scale),
    borderRadius: Math.round(16 * scale),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  addressText: {
    flex: 1,
  },
  address: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
    lineHeight: 20,
  },
  addressDetails: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  itemCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: Math.round(12 * scale),
  },
  itemHeader: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  itemQuantity: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.accent,
    width: Math.round(40 * scale),
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemVariation: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(2 * scale),
  },
  addons: {
    marginTop: Math.round(4 * scale),
  },
  addonText: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },
  specialInstructions: {
    fontSize: Math.round(12 * scale),
    color: colors.warning,
    fontStyle: 'italic',
    marginTop: Math.round(4 * scale),
  },
  itemPrice: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  instructionsBox: {
    backgroundColor: `${colors.warning}20`,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(8 * scale),
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  instructionsText: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  paymentDetails: {
    gap: Math.round(12 * scale),
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: Math.round(12 * scale),
    marginTop: Math.round(8 * scale),
  },
  totalLabel: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(10 * scale),
    marginTop: Math.round(8 * scale),
  },
  paymentMethodText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  paymentStatusBadge: {
    paddingHorizontal: Math.round(10 * scale),
    paddingVertical: Math.round(4 * scale),
    borderRadius: Math.round(12 * scale),
  },
  paymentStatusText: {
    fontSize: Math.round(11 * scale),
    color: colors.textInverse,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: Math.round(20 * scale),
    gap: Math.round(10 * scale),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    gap: Math.round(8 * scale),
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  updateButton: {
    backgroundColor: colors.info,
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
  },
});
