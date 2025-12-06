import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: null,
  isTracking: false,
  locationHistory: [],
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
      state.locationHistory.push({
        ...action.payload,
        timestamp: Date.now(),
      });
      // Keep only last 100 locations
      if (state.locationHistory.length > 100) {
        state.locationHistory.shift();
      }
    },
    startTracking: (state) => {
      state.isTracking = true;
      state.error = null;
    },
    stopTracking: (state) => {
      state.isTracking = false;
    },
    setLocationError: (state, action) => {
      state.error = action.payload;
      state.isTracking = false;
    },
    clearLocationHistory: (state) => {
      state.locationHistory = [];
    },
  },
});

export const {
  setCurrentLocation,
  startTracking,
  stopTracking,
  setLocationError,
  clearLocationHistory,
} = locationSlice.actions;

export default locationSlice.reducer;
