import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  restaurant: null,
  subtotal: 0,
  deliveryFee: 0,
  tax: 0,
  tip: 0,
  discount: 0,
  coupon: null,
  total: 0,
};

const calculateTotals = (state) => {
  // Calculate subtotal from all items
  state.subtotal = state.items.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 1;
    let itemTotal = itemPrice * itemQuantity;
    
    // Add addons price
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((addon) => {
        if (addon.options && addon.options.length > 0) {
          addon.options.forEach((option) => {
            const optionPrice = Number(option.price) || 0;
            itemTotal += optionPrice * itemQuantity;
          });
        }
      });
    }
    return sum + itemTotal;
  }, 0);

  // Auto-calculate delivery fee if not manually set
  if (state.items.length > 0 && state.deliveryFee === 0) {
    // Base delivery fee: ETB 20
    const baseDeliveryFee = 20;
    // Add ETB 5 for every ETB 100 in subtotal
    const additionalFee = Math.floor(state.subtotal / 100) * 5;
    // Maximum delivery fee: ETB 50
    state.deliveryFee = Math.min(baseDeliveryFee + additionalFee, 50);
  }

  // Calculate tax (default 15% if restaurant tax not set)
  const taxRate = Number(state.restaurant?.tax) || 15;
  state.tax = (Number(state.subtotal) || 0) * taxRate / 100;

  // Calculate final total
  state.total = (Number(state.subtotal) || 0) + 
                (Number(state.deliveryFee) || 0) + 
                (Number(state.tax) || 0) + 
                (Number(state.tip) || 0) - 
                (Number(state.discount) || 0);
  
  // Ensure total is never negative
  if (state.total < 0) {
    state.total = 0;
  }
  
  console.log('💰 Cart Totals:', {
    items: state.items.length,
    subtotal: state.subtotal.toFixed(2),
    deliveryFee: state.deliveryFee.toFixed(2),
    tax: state.tax.toFixed(2),
    tip: state.tip.toFixed(2),
    discount: state.discount.toFixed(2),
    total: state.total.toFixed(2)
  });
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      
      console.log('🛒 Adding to cart:', {
        itemId: item.food,
        title: item.title,
        category: item.category,
        restaurant: item.restaurant,
        currentItems: state.items.length
      });
      
      // Allow multiple products from different categories and restaurants
      // Check if item already exists with same variation and addons
      const existingIndex = state.items.findIndex(
        (cartItem) =>
          cartItem.food === item.food &&
          cartItem.variation?.id === item.variation?.id &&
          JSON.stringify(cartItem.addons || []) === JSON.stringify(item.addons || [])
      );

      if (existingIndex >= 0) {
        // Item exists, increment quantity
        console.log('📦 Duplicate found - incrementing quantity');
        state.items[existingIndex].quantity += item.quantity;
      } else {
        // New item, add to cart
        console.log('➕ New item - adding to cart');
        state.items.push({
          ...item,
          price: item.variation?.price || item.price || 0,
        });
      }
      
      // Set restaurant from first item if not set
      if (!state.restaurant && item.restaurant) {
        console.log('🏪 Setting restaurant:', item.restaurant);
        state.restaurant = item.restaurant;
      }
      
      console.log('📊 Cart now has', state.items.length, 'items');
      calculateTotals(state);
    },
    
    removeFromCart: (state, action) => {
      const index = action.payload;
      state.items.splice(index, 1);
      
      if (state.items.length === 0) {
        state.restaurant = null;
        state.coupon = null;
        state.discount = 0;
      }
      
      calculateTotals(state);
    },
    
    updateQuantity: (state, action) => {
      const { index, quantity } = action.payload;
      if (quantity <= 0) {
        state.items.splice(index, 1);
        if (state.items.length === 0) {
          state.restaurant = null;
          state.coupon = null;
          state.discount = 0;
        }
      } else {
        state.items[index].quantity = quantity;
      }
      
      calculateTotals(state);
    },
    
    setDeliveryFee: (state, action) => {
      state.deliveryFee = action.payload;
      calculateTotals(state);
    },
    
    setTip: (state, action) => {
      state.tip = action.payload;
      calculateTotals(state);
    },
    
    applyCoupon: (state, action) => {
      state.coupon = action.payload;
      state.discount = action.payload.discountAmount || 0;
      calculateTotals(state);
    },
    
    removeCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;
      calculateTotals(state);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.restaurant = null;
      state.subtotal = 0;
      state.deliveryFee = 0;
      state.tax = 0;
      state.tip = 0;
      state.discount = 0;
      state.coupon = null;
      state.total = 0;
    },
    
    updateItemInstructions: (state, action) => {
      const { index, instructions } = action.payload;
      state.items[index].specialInstructions = instructions;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setDeliveryFee,
  setTip,
  applyCoupon,
  removeCoupon,
  clearCart,
  updateItemInstructions,
} = cartSlice.actions;

export default cartSlice.reducer;