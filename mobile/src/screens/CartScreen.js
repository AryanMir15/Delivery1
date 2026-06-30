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
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const CartScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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
      <View key={index} style={s.cartItem}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/80' }}
          style={s.itemImage}
        />
        <View style={s.itemDetails}>
          <Text style={s.itemName}>{item.title}</Text>
          <Text style={s.itemVariation}>{item.variation?.title}</Text>
          
          {item.addons && item.addons.length > 0 && (
            <View style={s.addonsContainer}>
              {item.addons.map((addon, addonIndex) => (
                <Text key={addonIndex} style={s.addonText}>
                  + {addon.options.map(opt => opt.title).join(', ')}
                </Text>
              ))}
            </View>
          )}

          {item.specialInstructions && (
            <Text style={s.instructions} numberOfLines={2}>
              Note: {item.specialInstructions}
            </Text>
          )}

          <View style={s.itemFooter}>
            <Text style={s.itemPrice}>{'PKR ' + String(totalPrice)}</Text>
            <View style={s.quantityControls}>
              <TouchableOpacity
                style={s.quantityButton}
                onPress={() => dispatch(updateQuantity({ index, quantity: item.quantity - 1 }))}
              >
                <Icon name="minus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.quantityText}>{String(item.quantity)}</Text>
              <TouchableOpacity
                style={s.quantityButton}
                onPress={() => dispatch(updateQuantity({ index, quantity: item.quantity + 1 }))}
              >
                <Icon name="plus" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={s.removeButton}
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
          <Icon name="close" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  // Check if cart exists and has items
  const s = styles(colors, typography, scale);

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.emptyContainer}>
          <Icon name="cart-outline" size={100} color={colors.border} />
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySubtitle}>Add items to get started</Text>
          <TouchableOpacity
            style={s.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={s.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={s.headerTitle}>Cart ({cart.items.length})</Text>
        <TouchableOpacity
          style={s.clearButton}
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
          <Icon name="delete-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={s.section}>
          {cart.items.map((item, index) => renderCartItem(item, index))}
        </View>

        {/* Coupon Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Apply Coupon</Text>
          {cart.coupon ? (
            <View style={s.appliedCoupon}>
              <View style={s.couponInfo}>
                <Icon name="ticket-percent" size={24} color={colors.success} />
                <View style={s.couponDetails}>
                  <Text style={s.couponCode}>{cart.coupon.code}</Text>
                  <Text style={s.couponDescription}>{cart.coupon.description}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => dispatch(removeCoupon())}>
                <Icon name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.couponInput}>
              <TextInput
                style={s.couponTextInput}
                placeholder="Enter coupon code"
                placeholderTextColor={colors.inputPlaceholder}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={s.applyButton}
                onPress={handleApplyCoupon}
                disabled={couponLoading}
              >
                <Text style={s.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tip Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Add Tip for Rider</Text>
          <View style={s.tipOptions}>
            {[0, 20, 50, 100].map((tip) => (
              <TouchableOpacity
                key={tip}
                style={[
                  s.tipButton,
                  selectedTip === tip && s.tipButtonSelected,
                ]}
                onPress={() => handleTipSelect(tip)}
              >
                <Text
                  style={[
                    s.tipButtonText,
                    selectedTip === tip && s.tipButtonTextSelected,
                  ]}
                >
                  {tip === 0 ? 'No Tip' : `PKR ${tip}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bill Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bill Summary</Text>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Subtotal</Text>
            <Text style={s.billValue}>{'PKR ' + String((Number(cart.subtotal) || 0).toFixed(2))}</Text>
          </View>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Delivery Fee</Text>
            <Text style={s.billValue}>{'PKR ' + String((Number(cart.deliveryFee) || 0).toFixed(2))}</Text>
          </View>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Tax</Text>
            <Text style={s.billValue}>{'PKR ' + String((Number(cart.tax) || 0).toFixed(2))}</Text>
          </View>
          {cart.tip > 0 && (
            <View style={s.billRow}>
              <Text style={s.billLabel}>Tip</Text>
              <Text style={s.billValue}>{'PKR ' + String((Number(cart.tip) || 0).toFixed(2))}</Text>
            </View>
          )}
          {cart.discount > 0 && (
            <View style={s.billRow}>
              <Text style={[s.billLabel, { color: colors.success }]}>Discount</Text>
              <Text style={[s.billValue, { color: colors.success }]}>
                -PKR {(Number(cart.discount) || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={s.dividerLine} />
          <View style={s.billRow}>
            <Text style={s.billTotal}>Total</Text>
            <Text style={s.billTotalValue}>{'PKR ' + String((Number(cart.total) || 0).toFixed(2))}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={s.checkoutContainer}>
        <TouchableOpacity
          style={s.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={s.checkoutButtonText}>Proceed to Checkout</Text>
          <Text style={s.checkoutButtonPrice}>{'PKR ' + String((Number(cart.total) || 0).toFixed(2))}</Text>
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
  clearButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.dangerSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: colors.surface,
    padding: Math.round(20 * scale),
    marginBottom: Math.round(12 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(16 * scale),
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: Math.round(16 * scale),
    paddingBottom: Math.round(16 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: Math.round(80 * scale),
    height: Math.round(80 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.border,
  },
  itemDetails: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  itemName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  itemVariation: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(4 * scale),
  },
  addonsContainer: {
    marginBottom: Math.round(4 * scale),
  },
  addonText: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  instructions: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Math.round(8 * scale),
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Math.round(8 * scale),
    padding: Math.round(4 * scale),
  },
  quantityButton: {
    width: Math.round(28 * scale),
    height: Math.round(28 * scale),
    borderRadius: Math.round(6 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: Math.round(12 * scale),
  },
  removeButton: {
    width: Math.round(32 * scale),
    height: Math.round(32 * scale),
    borderRadius: Math.round(16 * scale),
    backgroundColor: colors.dangerSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Math.round(8 * scale),
  },
  couponInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponTextInput: {
    flex: 1,
    height: Math.round(50 * scale),
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    paddingHorizontal: Math.round(16 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    marginRight: Math.round(12 * scale),
  },
  applyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(24 * scale),
    paddingVertical: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
  },
  applyButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textInverse,
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.successSurface,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponDetails: {
    marginLeft: Math.round(12 * scale),
    flex: 1,
  },
  couponCode: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.success,
  },
  couponDescription: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  tipOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipButton: {
    flex: 1,
    paddingVertical: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    marginHorizontal: Math.round(4 * scale),
  },
  tipButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSurface,
  },
  tipButtonText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tipButtonTextSelected: {
    color: colors.accent,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(12 * scale),
  },
  billLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Math.round(12 * scale),
  },
  billTotal: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  billTotalValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  checkoutContainer: {
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
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    paddingVertical: Math.round(16 * scale),
    paddingHorizontal: Math.round(20 * scale),
    borderRadius: Math.round(12 * scale),
  },
  checkoutButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textInverse,
  },
  checkoutButtonPrice: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textInverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(40 * scale),
  },
  emptyTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(24 * scale),
  },
  emptySubtitle: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(8 * scale),
    marginBottom: Math.round(32 * scale),
  },
  browseButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(32 * scale),
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
  },
  browseButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textInverse,
  },
});

export default CartScreen;
