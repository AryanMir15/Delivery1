const axios = require('axios');

// MapTiler API Key - loaded from environment variable
const MAPTILER_API_KEY = process.env.MAPTILER_API_KEY;
const MAPTILER_BASE_URL = 'https://api.maptiler.com';

if (!MAPTILER_API_KEY) {
  console.warn('⚠️ MAPTILER_API_KEY not set in environment variables');
}

/**
 * Validate coordinates
 */
function validateCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  return true;
}

/**
 * Get route between two points using MapTiler Routing API
 * @param {Object} start - Start coordinates {lat, lng}
 * @param {Object} end - End coordinates {lat, lng}
 * @param {String} profile - Routing profile: 'driving', 'walking', 'cycling'
 * @returns {Object} Route data with distance, duration, and geometry
 */
async function getRoute(start, end, profile = 'driving') {
  try {
    // Validate coordinates
    if (!validateCoordinates(start.lat, start.lng)) {
      throw new Error(`Invalid start coordinates: ${start.lat}, ${start.lng}`);
    }
    if (!validateCoordinates(end.lat, end.lng)) {
      throw new Error(`Invalid end coordinates: ${end.lat}, ${end.lng}`);
    }

    const url = `${MAPTILER_BASE_URL}/directions/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}.json`;
    
    const response = await axios.get(url, {
      params: {
        key: MAPTILER_API_KEY,
        overview: 'full',
        geometries: 'geojson',
        steps: true
      }
    });

    if (!response.data || !response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];
    
    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry, // GeoJSON LineString
      steps: route.legs[0].steps.map(step => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration
      }))
    };
  } catch (error) {
    console.error('Routing error:', error.message);
    throw new Error(`Failed to get route: ${error.message}`);
  }
}

/**
 * Get multi-point route (shop -> rider -> customer)
 * @param {Object} shop - Shop coordinates {lat, lng}
 * @param {Object} rider - Rider coordinates {lat, lng}
 * @param {Object} customer - Customer coordinates {lat, lng}
 * @returns {Object} Complete route data
 */
async function getDeliveryRoute(shop, rider, customer) {
  try {
    // Get route from shop to rider
    const shopToRider = await getRoute(shop, rider);
    
    // Get route from rider to customer
    const riderToCustomer = await getRoute(rider, customer);
    
    return {
      shopToRider: {
        distance: shopToRider.distance,
        duration: shopToRider.duration,
        geometry: shopToRider.geometry,
        steps: shopToRider.steps
      },
      riderToCustomer: {
        distance: riderToCustomer.distance,
        duration: riderToCustomer.duration,
        geometry: riderToCustomer.geometry,
        steps: riderToCustomer.steps
      },
      totalDistance: shopToRider.distance + riderToCustomer.distance,
      totalDuration: shopToRider.duration + riderToCustomer.duration,
      estimatedArrival: new Date(Date.now() + (shopToRider.duration + riderToCustomer.duration) * 1000)
    };
  } catch (error) {
    console.error('Delivery route error:', error.message);
    throw error;
  }
}

/**
 * Calculate ETA based on current location and destination
 * @param {Object} current - Current coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @returns {Object} ETA information
 */
async function calculateETA(current, destination) {
  try {
    const route = await getRoute(current, destination);
    
    const etaMinutes = Math.ceil(route.duration / 60);
    const etaTime = new Date(Date.now() + route.duration * 1000);
    
    return {
      distance: route.distance,
      duration: route.duration,
      etaMinutes,
      etaTime: etaTime.toISOString(),
      distanceKm: (route.distance / 1000).toFixed(2)
    };
  } catch (error) {
    console.error('ETA calculation error:', error.message);
    throw error;
  }
}

/**
 * Get geocoding (address to coordinates)
 * @param {String} address - Address string
 * @returns {Object} Coordinates {lat, lng}
 */
async function geocodeAddress(address) {
  try {
    const url = `${MAPTILER_BASE_URL}/geocoding/${encodeURIComponent(address)}.json`;
    
    const response = await axios.get(url, {
      params: {
        key: MAPTILER_API_KEY,
        limit: 1
      }
    });

    if (!response.data || !response.data.features || response.data.features.length === 0) {
      throw new Error('Address not found');
    }

    const [lng, lat] = response.data.features[0].center;
    
    return {
      lat,
      lng,
      formattedAddress: response.data.features[0].place_name
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

/**
 * Reverse geocoding (coordinates to address)
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {String} Address
 */
async function reverseGeocode(lat, lng) {
  try {
    if (!validateCoordinates(lat, lng)) {
      throw new Error(`Invalid coordinates: ${lat}, ${lng}`);
    }

    const url = `${MAPTILER_BASE_URL}/geocoding/${lng},${lat}.json`;
    
    const response = await axios.get(url, {
      params: {
        key: MAPTILER_API_KEY
      }
    });

    if (!response.data || !response.data.features || response.data.features.length === 0) {
      throw new Error('Location not found');
    }

    return response.data.features[0].place_name;
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    throw new Error(`Failed to reverse geocode: ${error.message}`);
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {Number} Distance in meters
 */
function calculateDistance(point1, point2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

module.exports = {
  getRoute,
  getDeliveryRoute,
  calculateETA,
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  validateCoordinates
};
