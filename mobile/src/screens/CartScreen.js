import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useMutation } from '@apollo/client';
import {
  removeFromCart,
  updateQuantity,
  setTip,
  applyCoupon,
  removeCoupon,
  clearCart,
} from '../store/cartSlice';
import { APPLY_COUPON } from '../api/mutations';

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const [couponCode, setCouponCode] = useState('');
  const [selectedTip, setSelectedTip] = useState(0);

  // Debug: Log cart state
  React.useEffect(() => {
    console.log('🛒 CartScreen - Cart State:', {
      itemCount: cart?.items?.length || 0,
      subtotal: cart?.subtotal || 0,
      deliveryFee: cart?.deliveryFee || 0,
      tax: cart?.tax || 0,
      total: cart?.total || 0,
      items: cart?.items || []
    });
  }, [cart]);

  const [applyCouponMutation, { loading: couponLoading }] = useMutation(APPLY_COUPON, {
    onCompleted: (data) => {
      if (data.applyCoupon) {
        dispatch(applyCoupon(data.applyCoupon));
        Alert.alert('Success', 'Coupon applied successfully!');
        setCouponCode('');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    applyCouponMutation({
      variables: {
        code: couponCode.trim().toUpperCase(),
        orderAmount: cart.subtotal,
        restaurantId: cart.restaurant,
      },
    });
  };

  const handleTipSelect = (tipAmount) => {
    setSelectedTip(tipAmount);
    dispatch(setTip(tipAmount));
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart');
      return;
    }
    navigation.navigate('Checkout');
  };

  const renderCartItem = (item, index) => {
    // Get price from variation or item
    const itemPrice = Number(item.variation?.price || item.price) || 0;
    const itemQuantity = Number(item.quantity) || 1;
    const itemTotal = itemPrice * itemQuantity;
    
    // Calculate addons total
    const addonsTotal = item.addons?.reduce((sum, addon) => {
      return sum + addon.options.reduce((optSum, opt) => optSum + (Number(opt.price) || 0), 0);
    }, 0) || 0;
    
    // Total price for this item including addons
    const totalPrice = ((itemTotal + addonsTotal * itemQuantity) || 0).toFixed(2);
    
    // Debug log
    console.log(`📦 Item ${index}:`, {
      title: item.title,
      price: itemPrice,
      quantity: itemQuantity,
      addonsTotal,
      totalPrice
    });

    return (
      <View key={index} style={styles.cartItem}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/80' }}
          style={styles.itemImage}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.title}</Text>
          <Text style={styles.itemVariation}>{item.variation?.title}</Text>
          
          {item.addons && item.addons.length > 0 && (
            <View style={styles.addonsContainer}>
              {item.addons.map((addon, addonIndex) => (
                <Text key={addonIndex} style={styles.addonText}>
                  + {addon.options.map(opt => opt.title).join(', ')}
                </Text>
              ))}
            </View>
          )}

          {item.specialInstructions && (
            <Text style={styles.instructions} numberOfLines={2}>
              Note: {item.specialInstructions}
            </Text>
          )}

          <View style={styles.itemFooter}>
            <Text style={styles.itemPrice}>{'ETB ' + String(totalPrice)}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => dispatch(updateQuantity({ index, quantity: item.quantity - 1 }))}
              >
                <Icon name="minus" size={16} color="#1D3557" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{String(item.quantity)}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => dispatch(updateQuantity({ index, quantity: item.quantity + 1 }))}
              >
                <Icon name="plus" size={16} color="#1D3557" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            Alert.alert(
              'Remove Item',
              'Are you sure you want to remove this item?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', onPress: () => dispatch(removeFromCart(index)), style: 'destructive' },
              ]
            );
          }}
        >
          <Icon name="close" size={20} color="#E63946" />
        </TouchableOpacity>
      </View>
    );
  };

  // Check if cart exists and has items
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#1D3557" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={100} color="#E9ECEF" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Cart ({cart.items.length})</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            Alert.alert(
              'Clear Cart',
              'Are you sure you want to clear your cart?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: () => dispatch(clearCart()), style: 'destructive' },
              ]
            );
          }}
        >
          <Icon name="delete-outline" size={24} color="#E63946" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.section}>
          {cart.items.map((item, index) => renderCartItem(item, index))}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          {cart.coupon ? (
            <View style={styles.appliedCoupon}>
              <View style={styles.couponInfo}>
                <Icon name="ticket-percent" size={24} color="#4CAF50" />
                <View style={styles.couponDetails}>
                  <Text style={styles.couponCode}>{cart.coupon.code}</Text>
                  <Text style={styles.couponDescription}>{cart.coupon.description}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => dispatch(removeCoupon())}>
                <Icon name="close-circle" size={24} color="#E63946" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInput}>
              <TextInput
                style={styles.couponTextInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#A8DADC"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyCoupon}
                disabled={couponLoading}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tip Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Tip for Rider</Text>
          <View style={styles.tipOptions}>
            {[0, 20, 50, 100].map((tip) => (
              <TouchableOpacity
                key={tip}
                style={[
                  styles.tipButton,
                  selectedTip === tip && styles.tipButtonSelected,
                ]}
                onPress={() => handleTipSelect(tip)}
              >
                <Text
                  style={[
                    styles.tipButtonText,
                    selectedTip === tip && styles.tipButtonTextSelected,
                  ]}
                >
                  {tip === 0 ? 'No Tip' : `ETB ${tip}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>{'ETB ' + String((Number(cart.subtotal) || 0).toFixed(2))}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>{'ETB ' + String((Number(cart.deliveryFee) || 0).toFixed(2))}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax</Text>
            <Text style={styles.billValue}>{'ETB ' + String((Number(cart.tax) || 0).toFixed(2))}</Text>
          </View>
          {cart.tip > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tip</Text>
              <Text style={styles.billValue}>{'ETB ' + String((Number(cart.tip) || 0).toFixed(2))}</Text>
            </View>
          )}
          {cart.discount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#4CAF50' }]}>Discount</Text>
              <Text style={[styles.billValue, { color: '#4CAF50' }]}>
                -ETB {(Number(cart.discount) || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.dividerLine} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total</Text>
            <Text style={styles.billTotalValue}>{'ETB ' + String((Number(cart.total) || 0).toFixed(2))}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutButtonPrice}>{'ETB ' + String((Number(cart.total) || 0).toFixed(2))}</Text>
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E9ECEF',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  itemVariation: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  addonsContainer: {
    marginBottom: 4,
  },
  addonText: {
    fontSize: 12,
    color: '#6C757D',
  },
  instructions: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginHorizontal: 12,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  couponInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponTextInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1D3557',
    marginRight: 12,
  },
  applyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponDetails: {
    marginLeft: 12,
    flex: 1,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  couponDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  tipOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tipButtonSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3E0',
  },
  tipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  tipButtonTextSelected: {
    color: '#FF6B35',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 12,
  },
  billTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  checkoutContainer: {
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
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkoutButtonPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 8,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CartScreen;
