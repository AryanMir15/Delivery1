import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  selectedRestaurant: null,
  restaurants: [],
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.restaurants = action.payload.restaurants || [];
      state.selectedRestaurant = action.payload.restaurants?.[0] || null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.selectedRestaurant = null;
      state.restaurants = [];
      AsyncStorage.removeItem('vendorToken');
    },
    selectRestaurant: (state, action) => {
      state.selectedRestaurant = action.payload;
    },
    updateRestaurants: (state, action) => {
      state.restaurants = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  selectRestaurant,
  updateRestaurants,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
