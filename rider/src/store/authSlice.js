import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  rider: null,
  token: null,
  isAuthenticated: false,
  isAvailable: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.rider = action.payload.rider;
      state.token = action.payload.token;
      state.isAvailable = action.payload.rider?.available || false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.rider = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.rider = null;
      state.token = null;
      state.isAvailable = false;
      state.error = null;
    },
    updateRider: (state, action) => {
      state.rider = { ...state.rider, ...action.payload };
    },
    setAvailability: (state, action) => {
      state.isAvailable = action.payload;
      if (state.rider) {
        state.rider.available = action.payload;
      }
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
  updateRider,
  setAvailability,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
