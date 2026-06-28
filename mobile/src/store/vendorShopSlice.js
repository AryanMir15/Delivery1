import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shop: null,
  loading: false,
  error: null,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setShop: (state, action) => {
      state.shop = action.payload;
    },
    updateShop: (state, action) => {
      state.shop = { ...state.shop, ...action.payload };
    },
    toggleAvailability: (state) => {
      if (state.shop) {
        state.shop.isAvailable = !state.shop.isAvailable;
      }
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
  setShop,
  updateShop,
  toggleAvailability,
  setLoading,
  setError,
  clearError,
} = shopSlice.actions;

export default shopSlice.reducer;
