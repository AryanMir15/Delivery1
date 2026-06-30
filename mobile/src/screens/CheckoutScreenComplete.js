import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useMutation, useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { PLACE_ORDER } from '../api/mutations';
import { GET_RESTAURANTS } from '../api/queries';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const CheckoutScreenComplete = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const { restaurantId, cartItems } = route.params;
  
  // Form state with validation
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Location selection
  const [latitude, setLatitude] = useState(9.0320);
  const [longitude, setLongitude] = useState(38.7469);
  const [locationName, setLocationName] = useState('Bole, Addis Ababa');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSearchText, setLocationSearchText] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Real-time location search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [recentLocations, setRecentLocations] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Smart delivery time calculation
  const calculateSmartDeliveryTime = (orderData) => {
    const {
      restaurantLocation,
      deliveryLocation,
      orderItems,
      currentTime,
      restaurantType,
      orderValue
    } = orderData;

    let totalMinutes = 0;

    // 1. Base preparation time by restaurant type
    const preparationTimes = {
      'restaurant': 15, // Cooked food needs preparation
      'grocery': 8,     // Packed items, quick pickup
      'pharmacy': 5,    // Medicines, very quick
      'electronics': 10, // Need to check items
      'fashion': 7,     // Simple pickup
      'default': 12
    };
    
    const basePreparation = preparationTimes[restaurantType] || preparationTimes.default;
    totalMinutes += basePreparation;

    // 2. Order complexity factor
    const itemCount = orderItems.length;
    if (itemCount > 5) totalMinutes += 5; // Large orders take longer
    if (itemCount > 10) totalMinutes += 5; // Very large orders

    // 3. Distance-based delivery time (3 minutes per km in Addis Ababa traffic)
    const distance = calculateDistance(restaurantLocation, deliveryLocation);
    const deliveryTime = Math.ceil(distance * 3);
    totalMinutes += deliveryTime;

    // 4. Time of day factor (rush hours)
    const hour = new Date(currentTime).getHours();
    let rushDelay = 0;
    if (hour >= 12 && hour <= 14) rushDelay = 10; // Lunch rush
    if (hour >= 18 && hour <= 20) rushDelay = 15; // Dinner rush
    totalMinutes += rushDelay;

    // 5. Order value factor (premium service for high-value orders)
    if (orderValue > 500) totalMinutes -= 5;

    // 6. Bounds: 20-90 minutes
    totalMinutes = Math.max(20, Math.min(totalMinutes, 90));

    return {
      estimatedMinutes: totalMinutes,
      breakdown: {
        preparation: basePreparation,
        delivery: deliveryTime,
        complexity: itemCount > 5 ? (itemCount > 10 ? 10 : 5) : 0,
        rushHour: rushDelay,
        distance: `${distance.toFixed(1)} km`,
        priority: orderValue > 500 ? -5 : 0
      }
    };
  };

  // Calculate distance between two points
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLon = toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (degrees) => degrees * (Math.PI / 180);

  // Real-time location search using OpenStreetMap Nominatim API (free alternative to Google Places)
  const searchLocationsRealTime = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use Nominatim API for real-time location search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Addis Ababa, Ethiopia&limit=10&addressdetails=1`
      );
      
      const data = await response.json();
      
      const locations = data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        area: item.address?.suburb || item.address?.neighbourhood || item.address?.city_district || 'Addis Ababa',
        type: item.type,
        importance: item.importance,
        address: {
          road: item.address?.road,
          suburb: item.address?.suburb,
          city: item.address?.city || 'Addis Ababa',
          country: item.address?.country
        }
      }));

      setSearchResults(locations);
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const handleLocationSearch = (text) => {
    setLocationSearchText(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      searchLocationsRealTime(text);
    }, 500); // 500ms delay

    setSearchTimeout(newTimeout);
  };

  // Get nearby places based on current location
  const getNearbyPlaces = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`
      );
      
      const data = await response.json();
      
      // Search for nearby places
      const nearbyResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&lat=${lat}&lon=${lng}&limit=5&addressdetails=1`
      );
      
      const nearbyData = await nearbyResponse.json();
      
      const places = nearbyData.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        area: item.address?.suburb || item.address?.neighbourhood || 'Nearby',
        distance: calculateDistance({ lat, lng }, { lat: parseFloat(item.lat), lng: parseFloat(item.lon) })
      }));

      setNearbyPlaces(places);
    } catch (error) {
      console.error('Nearby places error:', error);
    }
  };

  // Handle location selection with real-time data
  const handleLocationSelect = (location) => {
    setLatitude(location.lat);
    setLongitude(location.lng);
    setLocationName(location.name);
    
    // Add to recent locations
    const newRecentLocation = {
      ...location,
      timestamp: Date.now()
    };
    
    setRecentLocations(prev => {
      const filtered = prev.filter(loc => loc.name !== location.name);
      return [newRecentLocation, ...filtered].slice(0, 5); // Keep only 5 recent
    });

    // Get nearby places for this location
    getNearbyPlaces(location.lat, location.lng);
    
    setShowLocationPicker(false);
  };

  // Get current GPS location with real-time reverse geocoding
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to get your current location.',
          [{ text: 'OK' }]
        );
        setIsGettingLocation(false);
        return;
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 15000,
      });

      const { latitude: lat, longitude: lng } = location.coords;
      
      // Use real-time reverse geocoding with OpenStreetMap
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        
        const data = await response.json();
        
        let locationName = 'Current Location';
        if (data && data.display_name) {
          const address = data.address || {};
          locationName = `${address.road || ''} ${address.suburb || address.neighbourhood || ''}, ${address.city || 'Addis Ababa'}`.trim();
          
          // Clean up the name
          if (locationName.startsWith(',')) {
            locationName = locationName.substring(1).trim();
          }
          if (locationName === '') {
            locationName = data.display_name.split(',').slice(0, 2).join(',');
          }
        }

        setLatitude(lat);
        setLongitude(lng);
        setLocationName(locationName);
        
        // Get nearby places for context
        getNearbyPlaces(lat, lng);
        
        Alert.alert('Location Updated', `Using your current location:\n${locationName}`);
        
      } catch (geocodeError) {
        console.error('Reverse geocoding error:', geocodeError);
        // Fallback to Expo's reverse geocoding
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        
        let locationName = 'Current Location';
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          locationName = `${address.street || ''} ${address.district || ''}, ${address.city || 'Addis Ababa'}`.trim();
        }

        setLatitude(lat);
        setLongitude(lng);
        setLocationName(locationName);
        
        Alert.alert('Location Updated', `Using your current location: ${locationName}`);
      }
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error', 
        'Could not get your current location. Please check your GPS settings and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Real-time delivery time calculation with live traffic consideration
  const calculateRealTimeDeliveryTime = async (orderData) => {
    const baseCalculation = calculateSmartDeliveryTime(orderData);
    
    // Add real-time factors
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    
    let realTimeAdjustment = 0;
    
    // Weekend adjustment
    if (currentDay === 0 || currentDay === 6) {
      realTimeAdjustment -= 5; // Faster on weekends
    }
    
    // Weather consideration (simplified - in real app, use weather API)
    const isRainyMonth = [6, 7, 8, 9].includes(new Date().getMonth()); // June-September
    if (isRainyMonth) {
      realTimeAdjustment += 10; // Slower during rainy season
    }
    
    // Distance-based traffic adjustment
    const distance = calculateDistance(orderData.restaurantLocation, orderData.deliveryLocation);
    if (distance > 5) {
      realTimeAdjustment += 5; // Extra time for long distances
    }
    
    const adjustedTime = Math.max(15, baseCalculation.estimatedMinutes + realTimeAdjustment);
    
    return {
      ...baseCalculation,
      estimatedMinutes: adjustedTime,
      realTimeFactors: {
        weekend: currentDay === 0 || currentDay === 6 ? -5 : 0,
        weather: isRainyMonth ? 10 : 0,
        distance: distance > 5 ? 5 : 0,
        total: realTimeAdjustment
      }
    };
  };
  
  // Get restaurant details
  const { data: restaurantData, loading: restaurantLoading } = useQuery(
    GET_RESTAURANTS
  );
  
  const [placeOrder, { loading: orderLoading }] = useMutation(PLACE_ORDER);
  
  const restaurant = restaurantData?.restaurants?.find(r => r._id === restaurantId);
  
  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.variation?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    const deliveryCharges = 5.00;
    const taxRate = 0.10; // 10%
    const taxAmount = subtotal * taxRate;
    const tip = 2.00;
    const total = subtotal + deliveryCharges + taxAmount + tip;
    
    return {
      subtotal: subtotal.toFixed(2),
      deliveryCharges: deliveryCharges.toFixed(2),
      tax: taxAmount.toFixed(2),
      tip: tip.toFixed(2),
      total: total.toFixed(2),
      taxAmount,
      deliveryCharges,
      tipAmount: tip
    };
  };
  
  const totals = calculateTotals();
  
  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    
    // Delivery address validation
    if (!deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
    } else if (deliveryAddress.trim().length < 10) {
      newErrors.deliveryAddress = 'Please enter a complete address';
    }
    
    // Address details validation
    if (!addressDetails.trim()) {
      newErrors.addressDetails = 'Address details are required (e.g., Building, Floor, Apartment)';
    }
    
    // Phone number validation
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    // Location validation
    if (!latitude || !longitude) {
      newErrors.location = 'Location coordinates are required';
    } else if (latitude < -90 || latitude > 90) {
      newErrors.location = 'Invalid latitude (must be between -90 and 90)';
    } else if (longitude < -180 || longitude > 180) {
      newErrors.location = 'Invalid longitude (must be between -180 and 180)';
    }
    
    // Cart validation
    if (!cartItems || cartItems.length === 0) {
      newErrors.cart = 'Cart is empty';
    }
    
    // Restaurant validation
    if (!restaurant) {
      newErrors.restaurant = 'Restaurant information not found';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handlePlaceOrder = async () => {
    // Validate form
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields correctly',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      // Prepare order items with complete data
      const orderInput = cartItems.map(item => ({
        food: item.food.id,
        title: item.food.title || 'Unknown Item',
        description: item.food.description || '',
        image: item.food.image || '',
        quantity: item.quantity,
        variation: {
          title: item.variation.title,
          price: item.variation.price,
          discounted: item.variation.discounted || 0,
          addons: [],
          isOutOfStock: false
        },
        addons: [],
        specialInstructions: item.specialInstructions || ''
      }));
      
      // Prepare address with complete data
      const address = {
        deliveryAddress: deliveryAddress.trim(),
        location: [parseFloat(longitude), parseFloat(latitude)],
        details: addressDetails.trim(),
        label: addressLabel
      };
      
      // Get current date/time and calculate smart delivery time
      const now = new Date();
      const orderDate = now.toISOString();
      
      // Smart automatic delivery time calculation
      const orderData = {
        restaurantLocation: restaurant?.location?.coordinates ? {
          lat: restaurant.location.coordinates[1],
          lng: restaurant.location.coordinates[0]
        } : { lat: 9.032, lng: 38.7578 },
        deliveryLocation: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        orderItems: cartItems,
        currentTime: now.toISOString(),
        restaurantType: restaurant?.shopType || 'restaurant',
        orderValue: totals.total
      };
      
      const deliveryEstimate = await calculateRealTimeDeliveryTime(orderData);
      const expectedTime = new Date(now.getTime() + deliveryEstimate.estimatedMinutes * 60000).toISOString();
      
      console.log('📦 Placing order with smart delivery calculation:', {
        restaurant: restaurantId,
        restaurantType: restaurant?.shopType,
        itemCount: orderInput.length,
        total: totals.total,
        address: address.deliveryAddress,
        location: `${latitude}, ${longitude}`,
        distance: deliveryEstimate.breakdown.distance,
        estimatedTime: `${deliveryEstimate.estimatedMinutes} minutes`,
        timeRange: `${deliveryEstimate.estimatedMinutes - 10}-${deliveryEstimate.estimatedMinutes + 10} min`,
        breakdown: deliveryEstimate.breakdown,
        orderDate,
        expectedTime
      });
      
      // Place order
      const { data } = await placeOrder({
        variables: {
          restaurant: restaurantId,
          orderInput,
          paymentMethod: 'card',
          address,
          tipping: parseFloat(totals.tipAmount),
          taxationAmount: parseFloat(totals.taxAmount),
          orderDate,
          expectedTime, // Add expected delivery time
          isPickedUp: false,
          deliveryCharges: parseFloat(totals.deliveryCharges),
          instructions: specialInstructions.trim() || 'No special instructions'
        }
      });
      
      const order = data.placeOrder;
      
      console.log('✅ Order placed successfully:', {
        orderId: order.orderId,
        status: order.orderStatus,
        paidAmount: order.paidAmount
      });
      
      // Show success message
      Alert.alert(
        'Order Placed Successfully!',
        `Order #${order.orderId}\nStatus: ${order.orderStatus}\nTotal: PKR ${order.paidAmount.toFixed(2)}`,
        [
          {
            text: 'Track Order',
            onPress: () => navigation.navigate('OrderTracking', {
              orderId: order._id,
              orderNumber: order.orderId
            })
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Order placement error:', error);
      Alert.alert(
        'Order Failed',
        error.message || 'Failed to place order. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const s = styles(colors, typography, scale);
  
  if (restaurantLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={s.loadingText}>Loading restaurant details...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView style={s.container}>
      {/* Restaurant Information */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Shop Information</Text>
        {restaurant && (
          <View style={s.infoCard}>
            <Text style={s.restaurantName}>{restaurant.name}</Text>
            <Text style={s.restaurantAddress}>{restaurant.address}</Text>
            <Text style={s.locationCoords}>
              Location: [{restaurant.location.coordinates[0].toFixed(4)}, {restaurant.location.coordinates[1].toFixed(4)}]
            </Text>
          </View>
        )}
      </View>
      
      {/* Order Items */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Order Items ({cartItems.length})</Text>
        {cartItems.map((item, index) => (
          <View key={index} style={s.itemCard}>
            <View style={s.itemHeader}>
              <Text style={s.itemTitle}>{item.food.title}</Text>
              <Text style={s.itemPrice}>
                PKR {(item.variation.price * item.quantity).toFixed(2)}
              </Text>
            </View>
            <Text style={s.itemDetails}>
              {item.variation.title} x {item.quantity}
            </Text>
            <Text style={s.itemPrice}>
              PKR {item.variation.price.toFixed(2)} each
            </Text>
          </View>
        ))}
      </View>
      
      {/* Location Selection */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Delivery Location</Text>
        <View style={s.locationDisplay}>
          <View style={s.locationInfo}>
            <Text style={s.locationName}>{locationName}</Text>
            <Text style={s.locationCoords}>
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
          </View>
          <TouchableOpacity
            style={s.changeLocationButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={s.changeLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Delivery Information</Text>
        
        <Text style={s.label}>Delivery Address *</Text>
        <TextInput
          style={[s.input, errors.deliveryAddress && s.inputError]}
          placeholder="Enter complete delivery address"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          multiline
        />
        {errors.deliveryAddress && (
          <Text style={s.errorText}>{errors.deliveryAddress}</Text>
        )}
        
        <Text style={s.label}>Address Details *</Text>
        <TextInput
          style={[s.input, errors.addressDetails && s.inputError]}
          placeholder="Building, Floor, Apartment number"
          value={addressDetails}
          onChangeText={setAddressDetails}
          multiline
        />
        {errors.addressDetails && (
          <Text style={s.errorText}>{errors.addressDetails}</Text>
        )}
        
        <Text style={s.label}>Address Label</Text>
        <View style={s.labelButtons}>
          {['Home', 'Work', 'Other'].map(label => (
            <TouchableOpacity
              key={label}
              style={[
                s.labelButton,
                addressLabel === label && s.labelButtonActive
              ]}
              onPress={() => setAddressLabel(label)}
            >
              <Text style={[
                s.labelButtonText,
                addressLabel === label && s.labelButtonTextActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={s.label}>Phone Number *</Text>
        <TextInput
          style={[s.input, errors.phoneNumber && s.inputError]}
          placeholder="+1234567890"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && (
          <Text style={s.errorText}>{errors.phoneNumber}</Text>
        )}
        
        <Text style={s.label}>Location Coordinates</Text>
        <View style={s.coordsRow}>
          <View style={s.coordInput}>
            <Text style={s.coordLabel}>Latitude</Text>
            <TextInput
              style={s.input}
              value={latitude.toString()}
              onChangeText={(text) => setLatitude(parseFloat(text) || 0)}
              keyboardType="numeric"
            />
          </View>
          <View style={s.coordInput}>
            <Text style={s.coordLabel}>Longitude</Text>
            <TextInput
              style={s.input}
              value={longitude.toString()}
              onChangeText={(text) => setLongitude(parseFloat(text) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>
        {errors.location && (
          <Text style={s.errorText}>{errors.location}</Text>
        )}
        
        <Text style={s.label}>Special Instructions (Optional)</Text>
        <TextInput
          style={s.input}
          placeholder="e.g., Please call when you arrive"
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
        />
      </View>
      
      {/* Order Summary */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Order Summary</Text>
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>PKR {totals.subtotal}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Delivery Charges</Text>
            <Text style={s.summaryValue}>PKR {totals.deliveryCharges}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tax (10%)</Text>
            <Text style={s.summaryValue}>PKR {totals.tax}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tip</Text>
            <Text style={s.summaryValue}>PKR {totals.tip}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>PKR {totals.total}</Text>
          </View>
        </View>
      </View>
      
      {/* Place Order Button */}
      <TouchableOpacity
        style={[s.placeOrderButton, orderLoading && s.buttonDisabled]}
        onPress={handlePlaceOrder}
        disabled={orderLoading}
      >
        {orderLoading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={s.placeOrderText}>
            Place Order - PKR {totals.total}
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={s.bottomSpacer} />

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.locationModal}>
            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Choose Delivery Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={s.closeButton}
              >
                <Text style={s.closeButtonText}>X</Text>
              </TouchableOpacity>
            </View>

            {/* GPS Location Button */}
            <TouchableOpacity
              style={[s.gpsButton, isGettingLocation && s.gpsButtonDisabled]}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={s.gpsButtonText}>Use Current Location</Text>
              )}
            </TouchableOpacity>

            {/* Search Box */}
            <View style={s.searchContainer}>
              <TextInput
                style={s.searchInput}
                placeholder="Search for a location in Addis Ababa..."
                value={locationSearchText}
                onChangeText={handleLocationSearch}
              />
              {isSearching && (
                <ActivityIndicator style={s.searchLoader} color={colors.success} />
              )}
            </View>

            {/* Search Results */}
            <ScrollView style={s.resultsContainer}>
              {/* Recent Locations */}
              {recentLocations.length > 0 && locationSearchText === '' && (
                <View style={s.recentSection}>
                  <Text style={s.sectionLabel}>Recent Locations</Text>
                  {recentLocations.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={s.locationOption}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <View style={s.locationOptionContent}>
                        <Text style={s.locationOptionName}>{location.area}</Text>
                        <Text style={s.locationOptionAddress}>{location.name}</Text>
                        <Text style={s.locationOptionCoords}>
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={s.searchSection}>
                  <Text style={s.sectionLabel}>Search Results</Text>
                  {searchResults.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={s.locationOption}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <View style={s.locationOptionContent}>
                        <Text style={s.locationOptionName}>{location.area}</Text>
                        <Text style={s.locationOptionAddress}>{location.name}</Text>
                        <Text style={s.locationOptionCoords}>
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No Results */}
              {locationSearchText.length >= 3 && searchResults.length === 0 && !isSearching && (
                <View style={s.noResults}>
                  <Text style={s.noResultsText}>No locations found</Text>
                  <Text style={s.noResultsSubtext}>Try different keywords</Text>
                </View>
              )}

              {/* Nearby Places */}
              {nearbyPlaces.length > 0 && locationSearchText === '' && (
                <View style={s.nearbySection}>
                  <Text style={s.sectionLabel}>Nearby Places</Text>
                  {nearbyPlaces.map((place, index) => (
                    <TouchableOpacity
                      key={index}
                      style={s.locationOption}
                      onPress={() => handleLocationSelect(place)}
                    >
                      <View style={s.locationOptionContent}>
                        <Text style={s.locationOptionName}>{place.area}</Text>
                        <Text style={s.locationOptionAddress}>{place.name}</Text>
                        <Text style={s.locationOptionDistance}>
                          {place.distance?.toFixed(1)} km away
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Math.round(10 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: Math.round(10 * scale),
    padding: Math.round(15 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    marginBottom: Math.round(15 * scale),
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  restaurantName: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(5 * scale),
  },
  restaurantAddress: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(5 * scale),
  },
  locationCoords: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
  },
  itemCard: {
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(12 * scale),
    borderRadius: Math.round(8 * scale),
    marginBottom: Math.round(10 * scale),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(5 * scale),
  },
  itemTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  itemDetails: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(3 * scale),
  },
  itemPrice: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.success,
  },
  label: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: Math.round(15 * scale),
    marginBottom: Math.round(5 * scale),
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: Math.round(8 * scale),
    padding: Math.round(12 * scale),
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: Math.round(12 * scale),
    marginTop: Math.round(5 * scale),
  },
  labelButtons: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
    marginTop: Math.round(5 * scale),
  },
  labelButton: {
    flex: 1,
    padding: Math.round(10 * scale),
    borderRadius: Math.round(8 * scale),
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  labelButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  labelButtonText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  labelButtonTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  coordInput: {
    flex: 1,
  },
  coordLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(5 * scale),
  },
  summaryCard: {
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(8 * scale),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(10 * scale),
  },
  summaryLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: Math.round(10 * scale),
    marginTop: Math.round(5 * scale),
  },
  totalLabel: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.success,
  },
  placeOrderButton: {
    backgroundColor: colors.success,
    margin: Math.round(15 * scale),
    padding: Math.round(18 * scale),
    borderRadius: Math.round(8 * scale),
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceDisabled,
  },
  placeOrderText: {
    color: colors.textInverse,
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: Math.round(20 * scale),
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  changeLocationButton: {
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(8 * scale),
    backgroundColor: colors.surfaceVariant,
    borderRadius: Math.round(8 * scale),
  },
  changeLocationText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  locationModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: Math.round(20 * scale),
    borderTopRightRadius: Math.round(20 * scale),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Math.round(16 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: Math.round(8 * scale),
  },
  closeButtonText: {
    fontSize: Math.round(20 * scale),
    color: colors.textSecondary,
  },
  gpsButton: {
    backgroundColor: colors.accent,
    margin: Math.round(16 * scale),
    padding: Math.round(14 * scale),
    borderRadius: Math.round(8 * scale),
    alignItems: 'center',
  },
  gpsButtonDisabled: {
    backgroundColor: colors.surfaceDisabled,
  },
  gpsButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Math.round(16 * scale),
    marginBottom: Math.round(8 * scale),
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: Math.round(8 * scale),
    padding: Math.round(12 * scale),
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  searchLoader: {
    marginLeft: Math.round(8 * scale),
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: Math.round(16 * scale),
  },
  sectionLabel: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: Math.round(12 * scale),
    marginBottom: Math.round(8 * scale),
  },
  locationOption: {
    padding: Math.round(12 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationOptionContent: {
    flex: 1,
  },
  locationOptionName: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(2 * scale),
  },
  locationOptionAddress: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(2 * scale),
  },
  locationOptionCoords: {
    fontSize: Math.round(11 * scale),
    color: colors.textTertiary,
  },
  locationOptionDistance: {
    fontSize: Math.round(12 * scale),
    color: colors.accent,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: Math.round(20 * scale),
  },
  noResultsText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  noResultsSubtext: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  recentSection: {
    marginBottom: Math.round(8 * scale),
  },
  searchSection: {
    marginBottom: Math.round(8 * scale),
  },
  nearbySection: {
    marginBottom: Math.round(16 * scale),
  },
});

export default CheckoutScreenComplete;
