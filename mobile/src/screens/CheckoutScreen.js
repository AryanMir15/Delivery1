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

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash on Delivery', icon: 'cash' },
  { id: 'chapa', name: 'Chapa Payment', icon: 'credit-card-outline' },
  { id: 'telebirr', name: 'Telebirr', icon: 'cellphone' },
  { id: 'cbebirr', name: 'CBE Birr', icon: 'bank' },
];

const CheckoutScreen = ({ navigation }) => {
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
      `Total: ETB ${cart.total.toFixed(2)}\nPayment: ${
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Type</Text>
          <View style={styles.deliveryTypeContainer}>
            <TouchableOpacity
              style={[
                styles.deliveryTypeButton,
                !isPickup && styles.deliveryTypeButtonActive,
              ]}
              onPress={() => setIsPickup(false)}
            >
              <Icon
                name="bike-fast"
                size={24}
                color={!isPickup ? '#FF6B35' : '#6C757D'}
              />
              <Text
                style={[
                  styles.deliveryTypeText,
                  !isPickup && styles.deliveryTypeTextActive,
                ]}
              >
                Delivery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.deliveryTypeButton,
                isPickup && styles.deliveryTypeButtonActive,
              ]}
              onPress={() => setIsPickup(true)}
            >
              <Icon
                name="store"
                size={24}
                color={isPickup ? '#FF6B35' : '#6C757D'}
              />
              <Text
                style={[
                  styles.deliveryTypeText,
                  isPickup && styles.deliveryTypeTextActive,
                ]}
              >
                Pickup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        {!isPickup && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Address', 'Address management coming soon!')}
              >
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addressCard}>
              <View style={styles.addressIcon}>
                <Icon name="map-marker" size={24} color="#FF6B35" />
              </View>
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
          </View>
        )}

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="E.g., Ring the doorbell, Leave at door"
            placeholderTextColor="#A8DADC"
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentCard,
                selectedPayment === method.id && styles.paymentCardSelected,
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.paymentLeft}>
                <View
                  style={[
                    styles.paymentIcon,
                    selectedPayment === method.id && styles.paymentIconSelected,
                  ]}
                >
                  <Icon
                    name={method.icon}
                    size={24}
                    color={selectedPayment === method.id ? '#FF6B35' : '#6C757D'}
                  />
                </View>
                <Text style={styles.paymentName}>{method.name}</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedPayment === method.id && styles.radioButtonSelected,
                ]}
              >
                {selectedPayment === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({cart.items.length})</Text>
            <Text style={styles.summaryValue}>{'ETB ' + String(cart.subtotal.toFixed(2))}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{'ETB ' + String(cart.deliveryFee.toFixed(2))}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>{'ETB ' + String(cart.tax.toFixed(2))}</Text>
          </View>
          {cart.tip > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={styles.summaryValue}>{'ETB ' + String(cart.tip.toFixed(2))}</Text>
            </View>
          )}
          {cart.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>
                Discount
              </Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                -ETB {cart.discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.dividerLine} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>{'ETB ' + String(cart.total.toFixed(2))}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.placeOrderButton, (loading || paymentLoading) && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading || paymentLoading}
        >
          {(loading || paymentLoading) ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>
                {selectedPayment === 'cash' ? 'Place Order' : 'Proceed to Payment'}
              </Text>
              <Text style={styles.placeOrderPrice}>{'ETB ' + String(cart.total.toFixed(2))}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginLeft: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 16,
  },
  changeText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  deliveryTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  deliveryTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  deliveryTypeButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3E0',
  },
  deliveryTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
    marginLeft: 8,
  },
  deliveryTypeTextActive: {
    color: '#FF6B35',
  },
  addressCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#1D3557',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#6C757D',
  },
  instructionsInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1D3557',
    textAlignVertical: 'top',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    marginBottom: 12,
  },
  paymentCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3E0',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIconSelected: {
    backgroundColor: '#FFF3E0',
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FF6B35',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  placeOrderButtonDisabled: {
    opacity: 0.7,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeOrderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CheckoutScreen;
