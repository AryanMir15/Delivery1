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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';
import { PLACE_ORDER, INITIALIZE_PAYMENT, VERIFY_PAYMENT } from '../api/mutations';
import { clearCart } from '../store/cartSlice';
import chapaPaymentService from '../services/chapaPaymentService';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const CheckoutScreenWithChapa = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
    <View style={s.container}>
      <ScrollView style={s.scrollView}>
        {/* Order Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Summary</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>PKR {totalAmount.toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Delivery Charges</Text>
            <Text style={s.summaryValue}>PKR {deliveryCharges.toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tax (15%)</Text>
            <Text style={s.summaryValue}>PKR {taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>PKR {finalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Address</Text>
          {deliveryAddress ? (
            <View style={s.addressCard}>
              <Ionicons name="location" size={20} color={colors.success} />
              <View style={s.addressInfo}>
                <Text style={s.addressLabel}>{deliveryAddress.label}</Text>
                <Text style={s.addressText}>
                  {deliveryAddress.deliveryAddress}
                </Text>
                {deliveryAddress.details && (
                  <Text style={s.addressDetails}>{deliveryAddress.details}</Text>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={s.addAddressButton}
              onPress={() => navigation.navigate('SelectAddress')}
            >
              <Text style={s.addAddressText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                s.paymentMethod,
                paymentMethod === method.id && s.paymentMethodSelected,
                !method.enabled && s.paymentMethodDisabled,
              ]}
              onPress={() => method.enabled && setPaymentMethod(method.id)}
              disabled={!method.enabled}
            >
              <View style={s.paymentMethodLeft}>
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={paymentMethod === method.id ? colors.success : colors.textSecondary}
                />
                <View style={s.paymentMethodInfo}>
                  <Text
                    style={[
                      s.paymentMethodName,
                      paymentMethod === method.id && s.paymentMethodNameSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  <Text style={s.paymentMethodDescription}>
                    {method.description}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  s.radio,
                  paymentMethod === method.id && s.radioSelected,
                ]}
              >
                {paymentMethod === method.id && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Special Instructions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Special Instructions (Optional)</Text>
          <Text style={s.instructionsInput} onPress={() => {/* Add text input modal */}}>
            {instructions || 'Add any special instructions for your order...'}
          </Text>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.placeOrderButton, isProcessing && s.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Text style={s.placeOrderText}>Place Order</Text>
              <Text style={s.placeOrderAmount}>PKR {finalAmount.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    padding: Math.round(16 * scale),
    marginBottom: Math.round(8 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    marginBottom: Math.round(12 * scale),
    color: colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(8 * scale),
  },
  summaryLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  totalRow: {
    marginTop: Math.round(8 * scale),
    paddingTop: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalLabel: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.success,
  },
  addressCard: {
    flexDirection: 'row',
    padding: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
    borderWidth: 1,
    borderColor: colors.divider,
  },
  addressInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  addressLabel: {
    fontSize: Math.round(14 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  addressText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(2 * scale),
  },
  addressDetails: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },
  addAddressButton: {
    padding: Math.round(16 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
    borderWidth: 1,
    borderColor: colors.success,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addAddressText: {
    color: colors.success,
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: Math.round(8 * scale),
  },
  paymentMethodSelected: {
    borderColor: colors.success,
    backgroundColor: colors.surfaceVariant,
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
    marginLeft: Math.round(12 * scale),
    flex: 1,
  },
  paymentMethodName: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(2 * scale),
  },
  paymentMethodNameSelected: {
    color: colors.success,
  },
  paymentMethodDescription: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  radio: {
    width: Math.round(20 * scale),
    height: Math.round(20 * scale),
    borderRadius: Math.round(10 * scale),
    borderWidth: 2,
    borderColor: colors.surfaceDisabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.success,
  },
  radioDot: {
    width: Math.round(10 * scale),
    height: Math.round(10 * scale),
    borderRadius: Math.round(5 * scale),
    backgroundColor: colors.success,
  },
  instructionsInput: {
    padding: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
    borderWidth: 1,
    borderColor: colors.divider,
    minHeight: Math.round(60 * scale),
    color: colors.textSecondary,
    fontSize: Math.round(14 * scale),
  },
  footer: {
    padding: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  placeOrderButton: {
    backgroundColor: colors.success,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(8 * scale),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
  },
  placeOrderAmount: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
  },
});

export default CheckoutScreenWithChapa;
