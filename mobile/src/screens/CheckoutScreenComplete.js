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
import * as Location from 'expo-location';
import { useMutation, useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { PLACE_ORDER_MUTATION } from '../api/mutations';
import { GET_RESTAURANTS_QUERY } from '../api/queries';

const CheckoutScreenComplete = ({ navigation, route }) => {
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
    GET_RESTAURANTS_QUERY
  );
  
  const [placeOrder, { loading: orderLoading }] = useMutation(PLACE_ORDER_MUTATION);
  
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
        `Order #${order.orderId}\nStatus: ${order.orderStatus}\nTotal: ETB ${order.paidAmount.toFixed(2)}`,
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
  
  if (restaurantLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading restaurant details...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Restaurant Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏪 Shop Information</Text>
        {restaurant && (
          <View style={styles.infoCard}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
            <Text style={styles.locationCoords}>
              📍 Location: [{restaurant.location.coordinates[0].toFixed(4)}, {restaurant.location.coordinates[1].toFixed(4)}]
            </Text>
          </View>
        )}
      </View>
      
      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 Order Items ({cartItems.length})</Text>
        {cartItems.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.food.title}</Text>
              <Text style={styles.itemPrice}>
                ETB {(item.variation.price * item.quantity).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.itemDetails}>
              {item.variation.title} × {item.quantity}
            </Text>
            <Text style={styles.itemPrice}>
              ETB {item.variation.price.toFixed(2)} each
            </Text>
          </View>
        ))}
      </View>
      
      {/* Location Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Delivery Location</Text>
        <View style={styles.locationDisplay}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{locationName}</Text>
            <Text style={styles.locationCoords}>
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeLocationButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.changeLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 Delivery Information</Text>
        
        <Text style={styles.label}>Delivery Address *</Text>
        <TextInput
          style={[styles.input, errors.deliveryAddress && styles.inputError]}
          placeholder="Enter complete delivery address"
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          multiline
        />
        {errors.deliveryAddress && (
          <Text style={styles.errorText}>{errors.deliveryAddress}</Text>
        )}
        
        <Text style={styles.label}>Address Details *</Text>
        <TextInput
          style={[styles.input, errors.addressDetails && styles.inputError]}
          placeholder="Building, Floor, Apartment number"
          value={addressDetails}
          onChangeText={setAddressDetails}
          multiline
        />
        {errors.addressDetails && (
          <Text style={styles.errorText}>{errors.addressDetails}</Text>
        )}
        
        <Text style={styles.label}>Address Label</Text>
        <View style={styles.labelButtons}>
          {['Home', 'Work', 'Other'].map(label => (
            <TouchableOpacity
              key={label}
              style={[
                styles.labelButton,
                addressLabel === label && styles.labelButtonActive
              ]}
              onPress={() => setAddressLabel(label)}
            >
              <Text style={[
                styles.labelButtonText,
                addressLabel === label && styles.labelButtonTextActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="+1234567890"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && (
          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
        )}
        
        <Text style={styles.label}>Location Coordinates</Text>
        <View style={styles.coordsRow}>
          <View style={styles.coordInput}>
            <Text style={styles.coordLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latitude.toString()}
              onChangeText={(text) => setLatitude(parseFloat(text) || 0)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.coordInput}>
            <Text style={styles.coordLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={longitude.toString()}
              onChangeText={(text) => setLongitude(parseFloat(text) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>
        {errors.location && (
          <Text style={styles.errorText}>{errors.location}</Text>
        )}
        
        <Text style={styles.label}>Special Instructions (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Please call when you arrive"
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
        />
      </View>
      
      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>ETB {totals.subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charges</Text>
            <Text style={styles.summaryValue}>ETB {totals.deliveryCharges}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (10%)</Text>
            <Text style={styles.summaryValue}>ETB {totals.tax}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tip</Text>
            <Text style={styles.summaryValue}>ETB {totals.tip}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>ETB {totals.total}</Text>
          </View>
        </View>
      </View>
      
      {/* Place Order Button */}
      <TouchableOpacity
        style={[styles.placeOrderButton, orderLoading && styles.buttonDisabled]}
        onPress={handlePlaceOrder}
        disabled={orderLoading}
      >
        {orderLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>
            Place Order - ETB {totals.total}
          </Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.bottomSpacer} />

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Choose Delivery Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* GPS Location Button */}
            <TouchableOpacity
              style={[styles.gpsButton, isGettingLocation && styles.gpsButtonDisabled]}
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.gpsButtonText}>🎯 Use Current Location</Text>
              )}
            </TouchableOpacity>

            {/* Search Box */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location in Addis Ababa..."
                value={locationSearchText}
                onChangeText={handleLocationSearch}
              />
              {isSearching && (
                <ActivityIndicator style={styles.searchLoader} color="#4CAF50" />
              )}
            </View>

            {/* Search Results */}
            <ScrollView style={styles.resultsContainer}>
              {/* Recent Locations */}
              {recentLocations.length > 0 && locationSearchText === '' && (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionLabel}>🕐 Recent Locations</Text>
                  {recentLocations.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.locationOption}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <View style={styles.locationOptionContent}>
                        <Text style={styles.locationOptionName}>{location.area}</Text>
                        <Text style={styles.locationOptionAddress}>{location.name}</Text>
                        <Text style={styles.locationOptionCoords}>
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchSection}>
                  <Text style={styles.sectionLabel}>🔍 Search Results</Text>
                  {searchResults.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.locationOption}
                      onPress={() => handleLocationSelect(location)}
                    >
                      <View style={styles.locationOptionContent}>
                        <Text style={styles.locationOptionName}>{location.area}</Text>
                        <Text style={styles.locationOptionAddress}>{location.name}</Text>
                        <Text style={styles.locationOptionCoords}>
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No Results */}
              {locationSearchText.length >= 3 && searchResults.length === 0 && !isSearching && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No locations found</Text>
                  <Text style={styles.noResultsSubtext}>Try different keywords</Text>
                </View>
              )}

              {/* Nearby Places */}
              {nearbyPlaces.length > 0 && locationSearchText === '' && (
                <View style={styles.nearbySection}>
                  <Text style={styles.sectionLabel}>📍 Nearby Places</Text>
                  {nearbyPlaces.map((place, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.locationOption}
                      onPress={() => handleLocationSelect(place)}
                    >
                      <View style={styles.locationOptionContent}>
                        <Text style={styles.locationOptionName}>{place.area}</Text>
                        <Text style={styles.locationOptionAddress}>{place.name}</Text>
                        <Text style={styles.locationOptionDistance}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
  },
  labelButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  labelButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  labelButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  labelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  labelButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordInput: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default CheckoutScreenComplete;
