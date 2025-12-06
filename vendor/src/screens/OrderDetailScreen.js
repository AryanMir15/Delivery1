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
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import { GET_ORDERS_BY_RESTAURANT } from '../api/queries';
import { UPDATE_ORDER_STATUS } from '../api/mutations';
import { updateOrder } from '../store/orderSlice';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const dispatch = useDispatch();
  const [updating, setUpdating] = useState(false);

  const { data, refetch } = useQuery(GET_ORDERS_BY_RESTAURANT, {
    variables: { restaurant: route.params.restaurantId },
    fetchPolicy: 'network-only',
  });

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS);

  const order = data?.ordersByRestaurant?.find((o) => o._id === orderId);

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
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
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.orderId}>#{order.orderId}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.orderStatus) },
            ]}
          >
            <Text style={styles.statusText}>
              {order.orderStatus.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>
          {new Date(order.orderDate).toLocaleString()}
        </Text>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.customerInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.infoText}>{order.user.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#666" />
            <Text style={styles.infoText}>{order.user.phone || 'N/A'}</Text>
            {order.user.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallCustomer}
              >
                <Ionicons name="call" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={20} color="#4CAF50" />
          <View style={styles.addressText}>
            <Text style={styles.address}>
              {order.deliveryAddress.deliveryAddress}
            </Text>
            {order.deliveryAddress.details && (
              <Text style={styles.addressDetails}>
                {order.deliveryAddress.details}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.variation && (
                  <Text style={styles.itemVariation}>
                    {item.variation.title}
                  </Text>
                )}
                {item.addons && item.addons.length > 0 && (
                  <View style={styles.addons}>
                    {item.addons.map((addon, addonIndex) => (
                      <Text key={addonIndex} style={styles.addonText}>
                        + {addon.title}
                      </Text>
                    ))}
                  </View>
                )}
                {item.specialInstructions && (
                  <Text style={styles.specialInstructions}>
                    Note: {item.specialInstructions}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>
                ETB {(item.variation?.price || 0) * item.quantity}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Special Instructions */}
      {order.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsText}>{order.instructions}</Text>
          </View>
        </View>
      )}

      {/* Payment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.paymentDetails}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Subtotal</Text>
            <Text style={styles.paymentValue}>
              ETB {(order.orderAmount - order.deliveryCharges - order.taxationAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Delivery Fee</Text>
            <Text style={styles.paymentValue}>
              ETB {order.deliveryCharges.toFixed(2)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Tax</Text>
            <Text style={styles.paymentValue}>
              ETB {order.taxationAmount.toFixed(2)}
            </Text>
          </View>
          {order.tipping > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tip</Text>
              <Text style={styles.paymentValue}>
                ETB {order.tipping.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ETB {order.orderAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.paymentMethodRow}>
            <Ionicons
              name={order.paymentMethod === 'cash' ? 'cash' : 'card'}
              size={20}
              color="#666"
            />
            <Text style={styles.paymentMethodText}>
              {order.paymentMethod.toUpperCase()}
            </Text>
            <View
              style={[
                styles.paymentStatusBadge,
                {
                  backgroundColor:
                    order.paymentStatus === 'paid' ? '#4CAF50' : '#FF9800',
                },
              ]}
            >
              <Text style={styles.paymentStatusText}>
                {order.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
        <View style={styles.actionsContainer}>
          {order.orderStatus === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectOrder}
                disabled={updating}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleUpdateStatus('accepted')}
                disabled={updating}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}

          {nextStatus && order.orderStatus !== 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.updateButton]}
              onPress={() => handleUpdateStatus(nextStatus)}
              disabled={updating}
            >
              <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                Mark as {nextStatus}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function getStatusColor(status) {
  const colors = {
    pending: '#FF9800',
    accepted: '#2196F3',
    preparing: '#9C27B0',
    ready: '#00BCD4',
    picked: '#3F51B5',
    delivered: '#4CAF50',
    cancelled: '#F44336',
  };
  return colors[status] || '#757575';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  customerInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  addressText: {
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  addressDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    width: 40,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemVariation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addons: {
    marginTop: 4,
  },
  addonText: {
    fontSize: 12,
    color: '#999',
  },
  specialInstructions: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  instructionsBox: {
    backgroundColor: '#FFF9C4',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
  },
  paymentDetails: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#666',
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
