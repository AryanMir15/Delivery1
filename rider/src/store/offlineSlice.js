import { createSlice } from '@reduxjs/toolkit';

const offlineSlice = createSlice({
  name: 'offline',
  initialState: {
    isOnline: true,
    pendingActions: [],
    cachedOrders: [],
    lastSync: null,
  },
  reducers: {
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    addPendingAction: (state, action) => {
      state.pendingActions.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    removePendingAction: (state, action) => {
      state.pendingActions = state.pendingActions.filter(
        (item) => item.id !== action.payload
      );
    },
    clearPendingActions: (state) => {
      state.pendingActions = [];
    },
    setCachedOrders: (state, action) => {
      state.cachedOrders = action.payload;
      state.lastSync = Date.now();
    },
  },
});

export const {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  clearPendingActions,
  setCachedOrders,
} = offlineSlice.actions;

export default offlineSlice.reducer;
