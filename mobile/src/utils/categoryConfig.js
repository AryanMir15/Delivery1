// Category-specific configurations for product details

export const CATEGORY_CONFIGS = {
  // Grocery & Supermarket
  grocery: {
    name: 'Grocery',
    showExpiry: true,
    showNutrition: true,
    showWeight: true,
    showBrand: true,
    showOrigin: true,
    requiresPrescription: false,
    showStorage: true,
    additionalFields: ['expiryDate', 'weight', 'brand', 'origin', 'storageInstructions'],
    icon: 'cart',
    color: '#4CAF50',
  },
  
  // Pharmacy
  pharmacy: {
    name: 'Pharmacy',
    showExpiry: true,
    showDosage: true,
    showManufacturer: true,
    requiresPrescription: true,
    showSideEffects: true,
    showUsageInstructions: true,
    additionalFields: ['expiryDate', 'dosage', 'manufacturer', 'sideEffects', 'usageInstructions'],
    icon: 'pill',
    color: '#2196F3',
  },
  
  // Electronics & Gadgets
  electronics: {
    name: 'Electronics',
    showWarranty: true,
    showSpecifications: true,
    showBrand: true,
    showModel: true,
    showCompatibility: true,
    additionalFields: ['warranty', 'specifications', 'brand', 'model', 'compatibility'],
    icon: 'cellphone',
    color: '#9C27B0',
  },
  
  // Clothing & Fashion
  fashion: {
    name: 'Fashion',
    showSize: true,
    showColor: true,
    showMaterial: true,
    showBrand: true,
    showCareInstructions: true,
    additionalFields: ['sizes', 'colors', 'material', 'brand', 'careInstructions'],
    icon: 'tshirt-crew',
    color: '#E91E63',
  },
  
  // Furniture & Home
  furniture: {
    name: 'Furniture',
    showDimensions: true,
    showMaterial: true,
    showWeight: true,
    showAssembly: true,
    showWarranty: true,
    additionalFields: ['dimensions', 'material', 'weight', 'assemblyRequired', 'warranty'],
    icon: 'sofa',
    color: '#795548',
  },
  
  // Flowers & Gifts
  flowers: {
    name: 'Flowers',
    showOccasion: true,
    showFreshness: true,
    showCareInstructions: true,
    showDeliveryTime: true,
    additionalFields: ['occasion', 'freshness', 'careInstructions', 'deliveryTime'],
    icon: 'flower',
    color: '#FF4081',
  },
  
  // Agriculture
  agriculture: {
    name: 'Agriculture',
    showOrigin: true,
    showOrganic: true,
    showHarvestDate: true,
    showStorage: true,
    additionalFields: ['origin', 'organic', 'harvestDate', 'storageInstructions'],
    icon: 'sprout',
    color: '#8BC34A',
  },
  
  // Beverages & Cafes
  beverages: {
    name: 'Beverages',
    showIngredients: true,
    showCaffeine: true,
    showTemperature: true,
    showSize: true,
    additionalFields: ['ingredients', 'caffeineContent', 'servingTemperature', 'sizes'],
    icon: 'coffee',
    color: '#FF9800',
  },
  
  // Beauty & Salon
  beauty: {
    name: 'Beauty',
    showIngredients: true,
    showSkinType: true,
    showBrand: true,
    showExpiry: true,
    showUsageInstructions: true,
    additionalFields: ['ingredients', 'skinType', 'brand', 'expiryDate', 'usageInstructions'],
    icon: 'face-woman',
    color: '#F06292',
  },
  
  // Stationery
  stationery: {
    name: 'Stationery',
    showBrand: true,
    showQuantity: true,
    showMaterial: true,
    showColor: true,
    additionalFields: ['brand', 'quantity', 'material', 'colors'],
    icon: 'pencil',
    color: '#FFC107',
  },
  
  // Pet Supplies
  pet_supplies: {
    name: 'Pet Supplies',
    showPetType: true,
    showAge: true,
    showIngredients: true,
    showExpiry: true,
    additionalFields: ['petType', 'ageGroup', 'ingredients', 'expiryDate'],
    icon: 'paw',
    color: '#FF5722',
  },
  
  // Automotive
  automotive: {
    name: 'Automotive',
    showCompatibility: true,
    showBrand: true,
    showModel: true,
    showWarranty: true,
    additionalFields: ['compatibility', 'brand', 'model', 'warranty'],
    icon: 'car',
    color: '#607D8B',
  },
  
  // Medical Services
  medical: {
    name: 'Medical',
    showQualifications: true,
    showAvailability: true,
    showDuration: true,
    requiresAppointment: true,
    additionalFields: ['qualifications', 'availability', 'duration'],
    icon: 'medical-bag',
    color: '#00BCD4',
  },
  
  // Default/Restaurant
  restaurant: {
    name: 'Food',
    showIngredients: true,
    showCalories: true,
    showSpiceLevel: true,
    showPreparationTime: true,
    additionalFields: ['ingredients', 'calories', 'spiceLevel', 'preparationTime'],
    icon: 'food',
    color: '#FF6B35',
  },
};

// Get category config by shop type or category
export const getCategoryConfig = (shopType, categoryName) => {
  // Try to match by shop type first
  if (shopType && CATEGORY_CONFIGS[shopType]) {
    return CATEGORY_CONFIGS[shopType];
  }
  
  // Try to match by category name
  if (categoryName) {
    const normalizedName = categoryName.toLowerCase();
    for (const [key, config] of Object.entries(CATEGORY_CONFIGS)) {
      if (normalizedName.includes(key) || normalizedName.includes(config.name.toLowerCase())) {
        return config;
      }
    }
  }
  
  // Return default
  return CATEGORY_CONFIGS.restaurant;
};

// Get field label based on category
export const getFieldLabel = (fieldName, categoryConfig) => {
  const labels = {
    expiryDate: 'Expiry Date',
    weight: 'Weight',
    brand: 'Brand',
    origin: 'Origin',
    storageInstructions: 'Storage Instructions',
    dosage: 'Dosage',
    manufacturer: 'Manufacturer',
    sideEffects: 'Side Effects',
    usageInstructions: 'Usage Instructions',
    warranty: 'Warranty',
    specifications: 'Specifications',
    model: 'Model',
    compatibility: 'Compatibility',
    sizes: 'Available Sizes',
    colors: 'Available Colors',
    material: 'Material',
    careInstructions: 'Care Instructions',
    dimensions: 'Dimensions',
    assemblyRequired: 'Assembly Required',
    occasion: 'Occasion',
    freshness: 'Freshness',
    deliveryTime: 'Delivery Time',
    organic: 'Organic',
    harvestDate: 'Harvest Date',
    ingredients: 'Ingredients',
    caffeineContent: 'Caffeine Content',
    servingTemperature: 'Serving Temperature',
    skinType: 'Suitable for Skin Type',
    quantity: 'Quantity',
    petType: 'Pet Type',
    ageGroup: 'Age Group',
    qualifications: 'Qualifications',
    availability: 'Availability',
    duration: 'Duration',
    calories: 'Calories',
    spiceLevel: 'Spice Level',
    preparationTime: 'Preparation Time',
  };
  
  return labels[fieldName] || fieldName;
};

// Get icon for field
export const getFieldIcon = (fieldName) => {
  const icons = {
    expiryDate: 'calendar-clock',
    weight: 'weight',
    brand: 'tag',
    origin: 'map-marker',
    storageInstructions: 'fridge',
    dosage: 'pill',
    manufacturer: 'factory',
    sideEffects: 'alert-circle',
    usageInstructions: 'information',
    warranty: 'shield-check',
    specifications: 'format-list-bulleted',
    model: 'barcode',
    compatibility: 'check-circle',
    sizes: 'ruler',
    colors: 'palette',
    material: 'texture',
    careInstructions: 'washing-machine',
    dimensions: 'ruler-square',
    assemblyRequired: 'tools',
    occasion: 'gift',
    freshness: 'leaf',
    deliveryTime: 'clock-fast',
    organic: 'sprout',
    harvestDate: 'calendar',
    ingredients: 'format-list-bulleted',
    caffeineContent: 'coffee',
    servingTemperature: 'thermometer',
    skinType: 'face-woman',
    quantity: 'counter',
    petType: 'paw',
    ageGroup: 'account-group',
    qualifications: 'certificate',
    availability: 'calendar-check',
    duration: 'timer',
    calories: 'fire',
    spiceLevel: 'chili-hot',
    preparationTime: 'clock-outline',
  };
  
  return icons[fieldName] || 'information';
};

export default {
  CATEGORY_CONFIGS,
  getCategoryConfig,
  getFieldLabel,
  getFieldIcon,
};
