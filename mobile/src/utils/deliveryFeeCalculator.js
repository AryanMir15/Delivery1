// Delivery Fee Calculator
// Calculates delivery fee based on distance, weight, and order value

const DELIVERY_CONFIG = {
  // Base delivery fee
  baseFee: 20, // PKR
  
  // Free delivery threshold
  freeDeliveryMinimum: 500, // PKR - orders above this get free delivery
  
  // Distance-based fees (per km)
  distanceRates: [
    { maxKm: 2, feePerKm: 0 },      // First 2km free
    { maxKm: 5, feePerKm: 5 },      // 2-5km: 5 PKR/km
    { maxKm: 10, feePerKm: 8 },     // 5-10km: 8 PKR/km
    { maxKm: 20, feePerKm: 12 },    // 10-20km: 12 PKR/km
    { maxKm: Infinity, feePerKm: 15 } // 20km+: 15 PKR/km
  ],
  
  // Weight-based fees (per kg)
  weightRates: [
    { maxKg: 5, fee: 0 },           // Up to 5kg free
    { maxKg: 10, fee: 10 },         // 5-10kg: 10 PKR
    { maxKg: 20, fee: 25 },         // 10-20kg: 25 PKR
    { maxKg: Infinity, fee: 50 }    // 20kg+: 50 PKR
  ],
  
  // Peak hour multiplier
  peakHours: {
    enabled: true,
    hours: [12, 13, 18, 19, 20], // Lunch and dinner times
    multiplier: 1.2 // 20% increase
  },
  
  // Minimum delivery fee
  minimumFee: 15, // PKR
};

/**
 * Calculate delivery fee based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} - Delivery fee in PKR
 */
export const calculateDistanceFee = (distanceKm) => {
  if (!distanceKm || distanceKm <= 0) return DELIVERY_CONFIG.baseFee;
  
  let fee = 0;
  let remainingDistance = distanceKm;
  
  for (const rate of DELIVERY_CONFIG.distanceRates) {
    if (remainingDistance <= 0) break;
    
    const previousMax = DELIVERY_CONFIG.distanceRates.indexOf(rate) > 0
      ? DELIVERY_CONFIG.distanceRates[DELIVERY_CONFIG.distanceRates.indexOf(rate) - 1].maxKm
      : 0;
    
    const rangeDistance = Math.min(remainingDistance, rate.maxKm - previousMax);
    fee += rangeDistance * rate.feePerKm;
    remainingDistance -= rangeDistance;
  }
  
  return Math.max(fee, DELIVERY_CONFIG.minimumFee);
};

/**
 * Calculate weight-based fee
 * @param {number} weightKg - Total weight in kilograms
 * @returns {number} - Weight fee in PKR
 */
export const calculateWeightFee = (weightKg) => {
  if (!weightKg || weightKg <= 0) return 0;
  
  for (const rate of DELIVERY_CONFIG.weightRates) {
    if (weightKg <= rate.maxKg) {
      return rate.fee;
    }
  }
  
  return DELIVERY_CONFIG.weightRates[DELIVERY_CONFIG.weightRates.length - 1].fee;
};

/**
 * Check if current time is peak hour
 * @returns {boolean}
 */
export const isPeakHour = () => {
  if (!DELIVERY_CONFIG.peakHours.enabled) return false;
  
  const currentHour = new Date().getHours();
  return DELIVERY_CONFIG.peakHours.hours.includes(currentHour);
};

/**
 * Calculate total delivery fee
 * @param {Object} params
 * @param {number} params.distanceKm - Distance in km
 * @param {number} params.weightKg - Weight in kg
 * @param {number} params.orderValue - Order value in PKR
 * @param {boolean} params.applyPeakHour - Apply peak hour multiplier
 * @returns {Object} - Breakdown of delivery fee
 */
export const calculateDeliveryFee = ({
  distanceKm = 0,
  weightKg = 0,
  orderValue = 0,
  applyPeakHour = true
}) => {
  // Check for free delivery
  if (orderValue >= DELIVERY_CONFIG.freeDeliveryMinimum) {
    return {
      total: 0,
      breakdown: {
        baseFee: 0,
        distanceFee: 0,
        weightFee: 0,
        peakHourFee: 0,
        discount: 'Free delivery for orders over PKR ' + DELIVERY_CONFIG.freeDeliveryMinimum
      },
      isFree: true
    };
  }
  
  // Calculate individual fees
  const distanceFee = calculateDistanceFee(distanceKm);
  const weightFee = calculateWeightFee(weightKg);
  
  // Base total
  let total = distanceFee + weightFee;
  
  // Apply peak hour multiplier
  let peakHourFee = 0;
  if (applyPeakHour && isPeakHour()) {
    peakHourFee = total * (DELIVERY_CONFIG.peakHours.multiplier - 1);
    total += peakHourFee;
  }
  
  // Ensure minimum fee
  total = Math.max(total, DELIVERY_CONFIG.minimumFee);
  
  return {
    total: Math.round(total * 100) / 100, // Round to 2 decimals
    breakdown: {
      baseFee: DELIVERY_CONFIG.baseFee,
      distanceFee: Math.round(distanceFee * 100) / 100,
      weightFee: Math.round(weightFee * 100) / 100,
      peakHourFee: Math.round(peakHourFee * 100) / 100,
      discount: null
    },
    isFree: false,
    distanceKm,
    weightKg
  };
};

/**
 * Get estimated weight from cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {number} - Estimated weight in kg
 */
export const estimateCartWeight = (cartItems) => {
  if (!cartItems || cartItems.length === 0) return 0;
  
  // Default weight per item if not specified
  const DEFAULT_ITEM_WEIGHT = 0.5; // kg
  
  return cartItems.reduce((total, item) => {
    const itemWeight = item.weight || DEFAULT_ITEM_WEIGHT;
    return total + (itemWeight * item.quantity);
  }, 0);
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Object} coord1 - {latitude, longitude}
 * @param {Object} coord2 - {latitude, longitude}
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
    Math.cos(toRad(coord2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimals
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get delivery fee message for display
 * @param {Object} feeData - Result from calculateDeliveryFee
 * @returns {string} - User-friendly message
 */
export const getDeliveryFeeMessage = (feeData) => {
  if (feeData.isFree) {
    return '🎉 Free Delivery!';
  }
  
  const messages = [];
  
  if (feeData.breakdown.distanceFee > 0) {
    messages.push(`Distance: PKR ${feeData.breakdown.distanceFee.toFixed(2)}`);
  }
  
  if (feeData.breakdown.weightFee > 0) {
    messages.push(`Weight: PKR ${feeData.breakdown.weightFee.toFixed(2)}`);
  }
  
  if (feeData.breakdown.peakHourFee > 0) {
    messages.push(`Peak hour: +PKR ${feeData.breakdown.peakHourFee.toFixed(2)}`);
  }
  
  return messages.join(' • ');
};

export default {
  calculateDeliveryFee,
  calculateDistance,
  estimateCartWeight,
  getDeliveryFeeMessage,
  DELIVERY_CONFIG
};
