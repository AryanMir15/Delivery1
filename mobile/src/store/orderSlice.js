import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
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
      state.error = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const orderIndex = state.orders.findIndex(
        (order) => order._id === orderId || order.id === orderId
      );
      if (orderIndex >= 0) {
        state.orders[orderIndex].orderStatus = status;
      }
      if (state.currentOrder && (state.currentOrder._id === orderId || state.currentOrder.id === orderId)) {
        state.currentOrder.orderStatus = status;
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setOrders,
  setCurrentOrder,
  addOrder,
  updateOrderStatus,
  setLoading,
  setError,
  clearOrders,
} = orderSlice.actions;

export default orderSlice.reducer;