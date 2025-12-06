import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  activeOrder: null,
  completedOrders: [],
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.isLoading = false;
    },
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      
      // Update in orders list
      const orderIndex = state.orders.findIndex(o => o.id === orderId || o._id === orderId);
      if (orderIndex >= 0) {
        state.orders[orderIndex].orderStatus = status;
      }
      
      // Update active order
      if (state.activeOrder && (state.activeOrder.id === orderId || state.activeOrder._id === orderId)) {
        state.activeOrder.orderStatus = status;
        
        // Move to completed if delivered
        if (status === 'delivered') {
          state.completedOrders.unshift(state.activeOrder);
          state.activeOrder = null;
        }
      }
    },
    addCompletedOrder: (state, action) => {
      state.completedOrders.unshift(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearActiveOrder: (state) => {
      state.activeOrder = null;
    },
  },
});

export const {
  setOrders,
  setActiveOrder,
  updateOrderStatus,
  addCompletedOrder,
  setLoading,
  setError,
  clearActiveOrder,
} = orderSlice.actions;

export default orderSlice.reducer;
