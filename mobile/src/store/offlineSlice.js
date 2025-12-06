import { createSlice } from '@reduxjs/toolkit';

const offlineSlice = createSlice({
  name: 'offline',
  initialState: {
    isOnline: true,
    pendingActions: [],
    cachedData: {
      shops: [],
      products: [],
      categories: [],
      lastSync: null,
    },
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
    setCachedShops: (state, action) => {
      state.cachedData.shops = action.payload;
      state.cachedData.lastSync = Date.now();
    },
    setCachedProducts: (state, action) => {
      state.cachedData.products = action.payload;
    },
    setCachedCategories: (state, action) => {
      state.cachedData.categories = action.payload;
    },
  },
});

export const {
  setOnlineStatus,
  addPendingAction,
  removePendingAction,
  clearPendingActions,
  setCachedShops,
  setCachedProducts,
  setCachedCategories,
} = offlineSlice.actions;

export default offlineSlice.reducer;
