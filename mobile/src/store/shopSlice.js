import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shops: [],
  selectedShop: null,
  categories: [],
  products: [],
  types: [],
  searchQuery: '',
  filters: {
    category: null,
    type: null,
    minRating: 0,
    maxDeliveryTime: null,
    sortBy: 'recommended', // recommended, rating, deliveryTime, distance
  },
  isLoading: false,
  error: null,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setShops: (state, action) => {
      state.shops = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setSelectedShop: (state, action) => {
      state.selectedShop = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setTypes: (state, action) => {
      state.types = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: null,
        type: null,
        minRating: 0,
        maxDeliveryTime: null,
        sortBy: 'recommended',
      };
      state.searchQuery = '';
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearShopData: (state) => {
      state.selectedShop = null;
      state.products = [];
    },
  },
});

export const {
  setShops,
  setSelectedShop,
  setCategories,
  setProducts,
  setTypes,
  setSearchQuery,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  clearShopData,
} = shopSlice.actions;

export default shopSlice.reducer;
