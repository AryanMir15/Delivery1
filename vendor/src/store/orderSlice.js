import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  pendingOrders: [],
  activeOrders: [],
  completedOrders: [],
  selectedOrder: null,
  loading: false,
  error: null,
  stats: {
    todayOrders: 0,
    todayRevenue: 0,
    pendingCount: 0,
    activeCount: 0,
  },
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.pendingOrders = action.payload.filter(
        (order) => order.orderStatus === 'pending'
      );
      state.activeOrders = action.payload.filter(
        (order) =>
          ['accepted', 'preparing', 'ready', 'picked'].includes(order.orderStatus)
      );
      state.completedOrders = action.payload.filter(
        (order) => order.orderStatus === 'delivered'
      );
      
      // Calculate stats
      const today = new Date().toDateString();
      const todayOrders = action.payload.filter(
        (order) => new Date(order.orderDate).toDateString() === today
      );
      state.stats.todayOrders = todayOrders.length;
      state.stats.todayRevenue = todayOrders.reduce(
        (sum, order) => sum + order.orderAmount,
        0
      );
      state.stats.pendingCount = state.pendingOrders.length;
      state.stats.activeCount = state.activeOrders.length;
    },
    addNewOrder: (state, action) => {
      state.orders.unshift(action.payload);
      if (action.payload.orderStatus === 'pending') {
        state.pendingOrders.unshift(action.payload);
        state.stats.pendingCount += 1;
      }
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex((o) => o._id === action.payload._id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      // Recalculate filtered lists
      state.pendingOrders = state.orders.filter(
        (order) => order.orderStatus === 'pending'
      );
      state.activeOrders = state.orders.filter(
        (order) =>
          ['accepted', 'preparing', 'ready', 'picked'].includes(order.orderStatus)
      );
      state.stats.pendingCount = state.pendingOrders.length;
      state.stats.activeCount = state.activeOrders.length;
    },
    selectOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setOrders,
  addNewOrder,
  updateOrder,
  selectOrder,
  setLoading,
  setError,
  clearError,
} = orderSlice.actions;

export default orderSlice.reducer;
