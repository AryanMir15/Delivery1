import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';
import { PLACE_ORDER, INITIALIZE_PAYMENT, VERIFY_PAYMENT } from '../api/mutations';
import { clearCart } from '../store/cartSlice';
import chapaPaymentService from '../services/chapaPaymentService';
import { Ionicons } from '@expo/vector-icons';

const CheckoutScreenWithChapa = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items, totalAmount } = useSelector((state) => state.cart);
  
  const { restaurant, deliveryAddress } = route.params || {};

  const [paymentMethod, setPaymentMethod] = useState('chapa');
  const [instructions, setInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const deliveryCharges = 50;
  const taxRate = 0.15;
  const taxAmount = totalAmount * taxRate;
  const tipping = 0;
  const finalAmount = totalAmount + deliveryCharges + taxAmount + tipping;

  const [placeOrder] = useMutation(PLACE_ORDER);
  const [initializePayment] = useMutation(INITIALIZE_PAYMENT);
  const [verifyPayment] = useMutation(VERIFY_PAYMENT);

  // Payment methods
  const paymentMethods = [
    {
      id: 'chapa',
      name: 'Chapa Payment',
      description: 'Pay with Telebirr, CBE Birr, or Card',
      icon: 'card-outline',
      enabled: true,
    },
    {
      id: 'cash',
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: 'cash-outline',
      enabled: true,
    },
  ];

  // Setup deep link listener for payment callbacks
  useEffect(() => {
    const cleanup = chapaPaymentService.setupDeepLinkListener(async (paymentData) => {
      if (paymentData.txRef && currentOrderId) {
        await handlePaymentVerification(paymentData.txRef);
      }
    });

    return cleanup;
  }, [currentOrderId]);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!restaurant) {
      Alert.alert('Error', 'Restaurant information is missing');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order items
      const orderInput = items.map((item) => ({
        food: item.id,
        title: item.title,
        description: item.description || '',
        image: item.image || '',
        quantity: item.quantity,
        variation: item.variation
          ? {
              title: item.variation.title,
              price: item.variation.price,
              discounted: item.variation.discounted || item.variation.price,
            }
          : null,
        addons: item.addons || [],
        specialInstructions: item.specialInstructions || '',
      }));

      // Place order
      const { data } = await placeOrder({
        variables: {
          restaurant: restaurant.id,
          orderInput,
          paymentMethod,
          address: {
            deliveryAddress: deliveryAddress.deliveryAddress,
            location: deliveryAddress.location.coordinates,
            details: deliveryAddress.details || '',
            label: deliveryAddress.label || 'Home',
          },
          tipping,
          taxationAmount: taxAmount,
          orderDate: new Date().toISOString(),
          expectedTime: null,
          isPickedUp: false,
          deliveryCharges,
          instructions,
        },
      });

      const order = data.placeOrder;
      setCurrentOrderId(order.id);

      // If payment method is Chapa, initialize payment
      if (paymentMethod === 'chapa') {
        await handleChapaPayment(order.id);
      } else {
        // Cash on delivery - order placed successfully
        dispatch(clearCart());
        setIsProcessing(false);
        
        Alert.alert(
          'Order Placed!',
          `Your order #${order.orderId} has been placed successfully.`,
          [
            {
              text: 'Track Order',
              onPress: () => navigation.replace('OrderTracking', { orderId: order.id }),
            },
          ]
        );
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Order placement error:', error);
      Alert.alert('Error', error.message || 'Failed to place order. Please try again.');
    }
  };

  const handleChapaPayment = async (orderId) => {
    try {
      // Initialize payment with Chapa
      const { data } = await initializePayment({
        variables: {
          orderId,
          paymentMethod: 'chapa',
          returnUrl: 'myapp://payment/callback',
          callbackUrl: 'myapp://payment/callback',
        },
      });

      const result = data.initializePayment;

      if (!result.success) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      // Open Chapa checkout
      await chapaPaymentService.openCheckout(
        result.checkoutUrl,
        // On success
        async () => {
          await handlePaymentVerification(result.txRef);
        },
        // On cancel
        () => {
          setIsProcessing(false);
          Alert.alert(
            'Payment Cancelled',
            'You can complete the payment later from your orders.',
            [
              {
                text: 'View Order',
                onPress: () => navigation.replace('MyOrders'),
              },
              { text: 'OK' },
            ]
          );
        },
        // On error
        (error) => {
          setIsProcessing(false);
          Alert.alert('Error', 'Failed to open payment page. Please try again.');
        }
      );
    } catch (error) {
      setIsProcessing(false);
      console.error('Payment initialization error:', error);
      Alert.alert('Error', error.message || 'Failed to initialize payment');
    }
  };

  const handlePaymentVerification = async (txRef) => {
    try {
      setIsProcessing(true);

      // Verify payment with backend
      const { data } = await verifyPayment({
        variables: { txRef },
      });

      const result = data.verifyPayment;

      if (result.success && result.status === 'paid') {
        // Payment successful
        dispatch(clearCart());
        setIsProcessing(false);

        Alert.alert(
          'Payment Successful!',
          `Your order #${result.order.orderId} has been confirmed.`,
          [
            {
              text: 'Track Order',
              onPress: () =>
                navigation.replace('OrderTracking', { orderId: result.order.id }),
            },
          ]
        );
      } else {
        // Payment failed or pending
        setIsProcessing(false);
        Alert.alert(
          'Payment Status',
          result.error || `Payment status: ${result.status}`,
          [
            {
              text: 'View Order',
              onPress: () => navigation.replace('MyOrders'),
            },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      setIsProcessing(false);
      console.error('Payment verification error:', error);
      Alert.alert('Error', 'Failed to verify payment. Please check your orders.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>ETB {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charges</Text>
            <Text style={styles.summaryValue}>ETB {deliveryCharges.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (15%)</Text>
            <Text style={styles.summaryValue}>ETB {taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>ETB {finalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {deliveryAddress ? (
            <View style={styles.addressCard}>
              <Ionicons name="location" size={20} color="#4CAF50" />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>{deliveryAddress.label}</Text>
                <Text style={styles.addressText}>
                  {deliveryAddress.deliveryAddress}
                </Text>
                {deliveryAddress.details && (
                  <Text style={styles.addressDetails}>{deliveryAddress.details}</Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('SelectAddress')}
            >
              <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                paymentMethod === method.id && styles.paymentMethodSelected,
                !method.enabled && styles.paymentMethodDisabled,
              ]}
              onPress={() => method.enabled && setPaymentMethod(method.id)}
              disabled={!method.enabled}
            >
              <View style={styles.paymentMethodLeft}>
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={paymentMethod === method.id ? '#4CAF50' : '#666'}
                />
                <View style={styles.paymentMethodInfo}>
                  <Text
                    style={[
                      styles.paymentMethodName,
                      paymentMethod === method.id && styles.paymentMethodNameSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  <Text style={styles.paymentMethodDescription}>
                    {method.description}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === method.id && styles.radioSelected,
                ]}
              >
                {paymentMethod === method.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <Text style={styles.instructionsInput} onPress={() => {/* Add text input modal */}}>
            {instructions || 'Add any special instructions for your order...'}
          </Text>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, isProcessing && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Text style={styles.placeOrderAmount}>ETB {finalAmount.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  addressCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 12,
    color: '#999',
  },
  addAddressButton: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addAddressText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  paymentMethodSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8f4',
  },
  paymentMethodDisabled: {
    opacity: 0.5,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentMethodNameSelected: {
    color: '#4CAF50',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#666',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#4CAF50',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  instructionsInput: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
    color: '#666',
    fontSize: 14,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeOrderAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutScreenWithChapa;
