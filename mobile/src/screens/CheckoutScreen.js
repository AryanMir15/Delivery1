import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';
import { PLACE_ORDER, INITIALIZE_PAYMENT } from '../api/mutations';
import { clearCart } from '../store/cartSlice';
import AuthGuard from '../utils/authGuard';
import chapaService from '../services/chapaService';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash on Delivery', icon: 'cash' },
  { id: 'chapa', name: 'Chapa Payment', icon: 'credit-card-outline' },
  { id: 'telebirr', name: 'Telebirr', icon: 'cellphone' },
  { id: 'cbebirr', name: 'CBE Birr', icon: 'bank' },
];

const CheckoutScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);

  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [deliveryAddress, setDeliveryAddress] = useState({
    deliveryAddress: '123 Main St, City',
    details: 'Apartment 4B',
    label: 'Home',
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isPickup, setIsPickup] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    if (!user) {
      AuthGuard.showLoginPrompt('checkout', navigation);
    }
  }, [user, navigation]);

  const [placeOrderMutation, { loading }] = useMutation(PLACE_ORDER, {
    onCompleted: async (data) => {
      if (data.placeOrder) {
        const orderId = data.placeOrder._id;
        
        // If payment method is Chapa, initialize payment
        if (selectedPayment === 'chapa' || selectedPayment === 'telebirr' || selectedPayment === 'cbebirr') {
          initializePaymentMutation({
            variables: {
              orderId,
              paymentMethod: selectedPayment,
              // Use placeholder URLs - mobile app doesn't rely on these
              returnUrl: 'https://yourapp.com/payment/success',
              callbackUrl: 'https://yourapp.com/payment/callback',
            },
          });
        } else {
          // For cash payment, go directly to order tracking
          dispatch(clearCart());
          navigation.navigate('OrderTracking', { orderId });
        }
      }
    },
    onError: (error) => {
      Alert.alert('Order Failed', error.message);
    },
  });

  const [initializePaymentMutation, { loading: paymentLoading }] = useMutation(
    INITIALIZE_PAYMENT,
    {
      onCompleted: async (data) => {
        if (data.initializePayment.success) {
          const { checkoutUrl, txRef, orderId } = data.initializePayment;
          
          try {
            // Open Chapa checkout
            const result = await chapaService.openCheckout(checkoutUrl, txRef);
            
            if (result.cancelled) {
              Alert.alert(
                'Payment Cancelled',
                'You cancelled the payment. Your order is pending payment.',
                [
                  { text: 'View Orders', onPress: () => navigation.navigate('Orders') },
                  { text: 'OK', style: 'cancel' },
                ]
              );
            } else {
              // Navigate to payment verification screen
              dispatch(clearCart());
              navigation.navigate('Payment', {
                txRef,
                orderId,
                orderAmount: cart.total,
              });
            }
          } catch (error) {
            console.error('Payment error:', error);
            Alert.alert('Payment Error', 'Failed to open payment page. Please try again.');
          }
        } else {
          Alert.alert('Payment Error', data.initializePayment.error || 'Failed to initialize payment');
        }
      },
      onError: (error) => {
        console.error('Payment initialization error:', error);
        Alert.alert('Payment Error', error.message);
      },
    }
  );

  const handlePlaceOrder = () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!isPickup && !deliveryAddress.deliveryAddress) {
      Alert.alert('Error', 'Please add a delivery address');
      return;
    }

    Alert.alert(
      'Confirm Order',
      `Total: PKR ${cart.total.toFixed(2)}\nPayment: ${
        PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.name
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: () => {
            const orderInput = cart.items.map((item) => ({
              food: item.food,
              title: item.title,
              description: item.description,
              image: item.image,
              quantity: item.quantity,
              variation: {
                title: item.variation.title,
                price: item.variation.price,
                discounted: item.variation.discounted,
              },
              addons: item.addons || [],
              specialInstructions: item.specialInstructions || '',
            }));

            placeOrderMutation({
              variables: {
                restaurant: cart.restaurant,
                orderInput,
                paymentMethod: selectedPayment,
                address: {
                  deliveryAddress: deliveryAddress.deliveryAddress,
                  location: [0, 0], // TODO: Get actual coordinates
                  details: deliveryAddress.details,
                  label: deliveryAddress.label,
                },
                tipping: cart.tip,
                taxationAmount: cart.tax,
                orderDate: new Date().toISOString(),
                isPickedUp: isPickup,
                deliveryCharges: cart.deliveryFee,
                instructions: deliveryInstructions,
              },
            });
          },
        },
      ]
    );
  };
  const s = styles(colors, typography, scale);


  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Type */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Type</Text>
          <View style={s.deliveryTypeContainer}>
            <TouchableOpacity
              style={[
                s.deliveryTypeButton,
                !isPickup && s.deliveryTypeButtonActive,
              ]}
              onPress={() => setIsPickup(false)}
            >
              <Icon
                name="bike-fast"
                size={24}
                color={!isPickup ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  s.deliveryTypeText,
                  !isPickup && s.deliveryTypeTextActive,
                ]}
              >
                Delivery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.deliveryTypeButton,
                isPickup && s.deliveryTypeButtonActive,
              ]}
              onPress={() => setIsPickup(true)}
            >
              <Icon
                name="store"
                size={24}
                color={isPickup ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  s.deliveryTypeText,
                  isPickup && s.deliveryTypeTextActive,
                ]}
              >
                Pickup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        {!isPickup && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Address', 'Address management coming soon!')}
              >
                <Text style={s.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={s.addressCard}>
              <View style={s.addressIcon}>
                <Icon name="map-marker" size={24} color={colors.accent} />
              </View>
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
          </View>
        )}

        {/* Delivery Instructions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={s.instructionsInput}
            placeholder="E.g., Ring the doorbell, Leave at door"
            placeholderTextColor={colors.inputPlaceholder}
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Method */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                s.paymentCard,
                selectedPayment === method.id && s.paymentCardSelected,
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={s.paymentLeft}>
                <View
                  style={[
                    s.paymentIcon,
                    selectedPayment === method.id && s.paymentIconSelected,
                  ]}
                >
                  <Icon
                    name={method.icon}
                    size={24}
                    color={selectedPayment === method.id ? colors.accent : colors.textSecondary}
                  />
                </View>
                <Text style={s.paymentName}>{method.name}</Text>
              </View>
              <View
                style={[
                  s.radioButton,
                  selectedPayment === method.id && s.radioButtonSelected,
                ]}
              >
                {selectedPayment === method.id && (
                  <View style={s.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Summary</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Items ({cart.items.length})</Text>
            <Text style={s.summaryValue}>{'PKR ' + String(cart.subtotal.toFixed(2))}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Delivery Fee</Text>
            <Text style={s.summaryValue}>{'PKR ' + String(cart.deliveryFee.toFixed(2))}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tax</Text>
            <Text style={s.summaryValue}>{'PKR ' + String(cart.tax.toFixed(2))}</Text>
          </View>
          {cart.tip > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Tip</Text>
              <Text style={s.summaryValue}>{'PKR ' + String(cart.tip.toFixed(2))}</Text>
            </View>
          )}
          {cart.discount > 0 && (
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.success }]}>
                Discount
              </Text>
              <Text style={[s.summaryValue, { color: colors.success }]}>
                -PKR {cart.discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={s.dividerLine} />
          <View style={s.summaryRow}>
            <Text style={s.summaryTotal}>Total</Text>
            <Text style={s.summaryTotalValue}>{'PKR ' + String(cart.total.toFixed(2))}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.placeOrderButton, (loading || paymentLoading) && s.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading || paymentLoading}
        >
          {(loading || paymentLoading) ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Text style={s.placeOrderText}>
                {selectedPayment === 'cash' ? 'Place Order' : 'Proceed to Payment'}
              </Text>
              <Text style={s.placeOrderPrice}>{'PKR ' + String(cart.total.toFixed(2))}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(20 * scale),
    paddingVertical: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: Math.round(16 * scale),
  },
  section: {
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    marginBottom: Math.round(12 * scale),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.round(16 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(16 * scale),
  },
  changeText: {
    fontSize: Math.round(14 * scale),
    color: colors.accent,
    fontWeight: '600',
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    gap: Math.round(12 * scale),
  },
  deliveryTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  deliveryTypeButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSurface,
  },
  deliveryTypeText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: Math.round(8 * scale),
  },
  deliveryTypeTextActive: {
    color: colors.accent,
  },
  addressCard: {
    flexDirection: 'row',
    padding: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressIcon: {
    width: Math.round(48 * scale),
    height: Math.round(48 * scale),
    borderRadius: Math.round(24 * scale),
    backgroundColor: colors.accentSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(12 * scale),
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginBottom: Math.round(4 * scale),
  },
  addressText: {
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  addressDetails: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  instructionsInput: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: Math.round(100 * scale),
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: Math.round(12 * scale),
  },
  paymentCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSurface,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: Math.round(48 * scale),
    height: Math.round(48 * scale),
    borderRadius: Math.round(24 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(12 * scale),
  },
  paymentIconSelected: {
    backgroundColor: colors.accentSurface,
  },
  paymentName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  radioButton: {
    width: Math.round(24 * scale),
    height: Math.round(24 * scale),
    borderRadius: Math.round(12 * scale),
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.accent,
  },
  radioButtonInner: {
    width: Math.round(12 * scale),
    height: Math.round(12 * scale),
    borderRadius: Math.round(6 * scale),
    backgroundColor: colors.accent,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(12 * scale),
  },
  summaryLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Math.round(12 * scale),
  },
  summaryTotal: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    paddingVertical: Math.round(16 * scale),
    paddingHorizontal: Math.round(20 * scale),
    borderRadius: Math.round(12 * scale),
  },
  placeOrderButtonDisabled: {
    opacity: 0.7,
  },
  placeOrderText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textInverse,
  },
  placeOrderPrice: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textInverse,
  },
});

export default CheckoutScreen;
