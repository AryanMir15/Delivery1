import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  deliveryAddress: null,
  isAvailable: false,
};

// Async thunk for storing token
export const setAuthToken = createAsyncThunk(
  'auth/setAuthToken',
  async (token) => {
    await AsyncStorage.setItem('authToken', token);
    return token;
  }
);

// Async thunk for removing token
export const removeAuthToken = createAsyncThunk(
  'auth/removeAuthToken',
  async () => {
    await AsyncStorage.removeItem('authToken');
    return null;
  }
);

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
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.deliveryAddress = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setDeliveryAddress: (state, action) => {
      state.deliveryAddress = action.payload;
    },
    setAvailability: (state, action) => {
      state.isAvailable = action.payload;
      if (state.user) {
        state.user.available = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setAuthToken.fulfilled, (state, action) => {
        state.token = action.payload;
      })
      .addCase(removeAuthToken.fulfilled, (state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setDeliveryAddress,
  setAvailability,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;