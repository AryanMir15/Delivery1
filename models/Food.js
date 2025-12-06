const mongoose = require('mongoose');

// Category-specific attribute schemas
const groceryAttributesSchema = {
  expiryDate: String,
  weight: String,
  brand: String,
  origin: String,
  storageInstructions: String,
  organic: Boolean,
  nutritionInfo: mongoose.Schema.Types.Mixed,
};

const pharmacyAttributesSchema = {
  dosage: String,
  manufacturer: String,
  expiryDate: String,
  sideEffects: String,
  usageInstructions: String,
  requiresPrescription: Boolean,
  activeIngredients: [String],
};

const electronicsAttributesSchema = {
  warranty: String,
  specifications: mongoose.Schema.Types.Mixed,
  brand: String,
  model: String,
  compatibility: String,
  batteryLife: String,
  dimensions: String,
};

const fashionAttributesSchema = {
  sizes: [String],
  colors: [String],
  material: String,
  brand: String,
  careInstructions: String,
  gender: String,
  season: String,
};

const furnitureAttributesSchema = {
  dimensions: String,
  material: String,
  weight: String,
  assemblyRequired: Boolean,
  warranty: String,
  color: String,
  style: String,
};

const foodSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  variations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variation'
  }],
  subCategory: {
    type: String,
    trim: true
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Category-specific attributes (flexible structure)
  attributes: {
    // Grocery
    expiryDate: String,
    weight: String,
    brand: String,
    origin: String,
    storageInstructions: String,
    organic: Boolean,
    nutritionInfo: mongoose.Schema.Types.Mixed,
    
    // Pharmacy
    dosage: String,
    manufacturer: String,
    sideEffects: String,
    usageInstructions: String,
    requiresPrescription: Boolean,
    activeIngredients: [String],
    
    // Electronics
    warranty: String,
    specifications: mongoose.Schema.Types.Mixed,
    model: String,
    compatibility: String,
    batteryLife: String,
    dimensions: String,
    
    // Fashion
    sizes: [String],
    colors: [String],
    material: String,
    careInstructions: String,
    gender: String,
    season: String,
    
    // Furniture
    assemblyRequired: Boolean,
    style: String,
    
    // Flowers
    occasion: String,
    freshness: String,
    deliveryTime: String,
    
    // Agriculture
    harvestDate: String,
    
    // Beverages
    ingredients: [String],
    caffeineContent: String,
    servingTemperature: String,
    
    // Beauty
    skinType: String,
    
    // Stationery
    quantity: String,
    
    // Pet Supplies
    petType: String,
    ageGroup: String,
    
    // Automotive
    vehicleCompatibility: String,
    
    // Medical Services
    qualifications: String,
    availability: String,
    duration: String,
    
    // Food/Restaurant
    calories: String,
    spiceLevel: String,
    preparationTime: String,
    allergens: [String],
    
    // General
    freeShipping: Boolean,
    inStock: Boolean,
  },
  
  // Legacy fields for backward compatibility
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  additionalInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
foodSchema.index({ restaurant: 1, category: 1 });
foodSchema.index({ title: 'text', description: 'text' });
foodSchema.index({ 'attributes.brand': 1 });
foodSchema.index({ 'attributes.organic': 1 });

// Virtual for getting category-specific attributes
foodSchema.virtual('categoryAttributes').get(function() {
  return this.attributes || {};
});

module.exports = mongoose.model('Food', foodSchema);