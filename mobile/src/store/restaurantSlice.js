import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  restaurants: [],
  selectedRestaurant: null,
  categories: [],
  foods: [],
  cuisines: [],
  searchQuery: '',
  filters: {
    category: null,
    cuisine: null,
    minRating: 0,
    maxDeliveryTime: null,
    sortBy: 'recommended', // recommended, rating, deliveryTime, distance
  },
  isLoading: false,
  error: null,
};

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    setRestaurants: (state, action) => {
      state.restaurants = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setSelectedRestaurant: (state, action) => {
      state.selectedRestaurant = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setFoods: (state, action) => {
      state.foods = action.payload;
    },
    setCuisines: (state, action) => {
      state.cuisines = action.payload;
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
        cuisine: null,
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
    clearRestaurantData: (state) => {
      state.selectedRestaurant = null;
      state.foods = [];
    },
  },
});

export const {
  setRestaurants,
  setSelectedRestaurant,
  setCategories,
  setFoods,
  setCuisines,
  setSearchQuery,
  setFilters,
  clearFilters,
  setLoading,
  setError,
  clearRestaurantData,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;