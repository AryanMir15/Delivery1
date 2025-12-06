const Joi = require('joi');

// Vendor creation validation schema
const createVendorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required'
  }),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).min(10).max(20).required().messages({
    'string.pattern.base': 'Please provide a valid phone number',
    'string.empty': 'Phone number is required',
    'string.min': 'Phone number must be at least 10 digits',
    'string.max': 'Phone number cannot exceed 20 digits'
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 50 characters',
    'string.empty': 'Password is required'
  }),
  address: Joi.object({
    street: Joi.string().max(255).messages({
      'string.max': 'Street address cannot exceed 255 characters'
    }),
    city: Joi.string().max(100).messages({
      'string.max': 'City cannot exceed 100 characters'
    }),
    state: Joi.string().max(100).messages({
      'string.max': 'State cannot exceed 100 characters'
    }),
    zipCode: Joi.string().max(20).messages({
      'string.max': 'Zip code cannot exceed 20 characters'
    }),
    country: Joi.string().max(100).default('United States')
  }).optional(),
  isActive: Joi.boolean().default(true),
  permissions: Joi.array().items(
    Joi.string().valid(
      'manage_vendors',
      'manage_restaurants',
      'manage_users',
      'manage_orders',
      'manage_settings',
      'view_analytics',
      'manage_payments',
      'system_administration'
    )
  ).optional()
});

// Vendor update validation schema
const updateVendorSchema = Joi.object({
  name: Joi.string().min(2).max(100).messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  email: Joi.string().email().messages({
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).min(10).max(20).messages({
    'string.pattern.base': 'Please provide a valid phone number',
    'string.min': 'Phone number must be at least 10 digits',
    'string.max': 'Phone number cannot exceed 20 digits'
  }),
  password: Joi.string().min(6).max(50).messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 50 characters'
  }),
  address: Joi.object({
    street: Joi.string().max(255).messages({
      'string.max': 'Street address cannot exceed 255 characters'
    }),
    city: Joi.string().max(100).messages({
      'string.max': 'City cannot exceed 100 characters'
    }),
    state: Joi.string().max(100).messages({
      'string.max': 'State cannot exceed 100 characters'
    }),
    zipCode: Joi.string().max(20).messages({
      'string.max': 'Zip code cannot exceed 20 characters'
    }),
    country: Joi.string().max(100).default('United States')
  }).optional(),
  isActive: Joi.boolean(),
  permissions: Joi.array().items(
    Joi.string().valid(
      'manage_vendors',
      'manage_restaurants',
      'manage_users',
      'manage_orders',
      'manage_settings',
      'view_analytics',
      'manage_payments',
      'system_administration'
    )
  ).optional()
});

// Vendor query validation schema
const vendorQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(255).optional(),
  isActive: Joi.boolean().optional(),
  role: Joi.string().valid('vendor', 'restaurant', 'owner').optional()
});

// Vendor ID validation
const vendorIdSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid vendor ID format'
  })
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    req.query = value;
    next();
  };
};

// Params validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors
      });
    }

    req.params = value;
    next();
  };
};

module.exports = {
  createVendorSchema,
  updateVendorSchema,
  vendorQuerySchema,
  vendorIdSchema,
  validate,
  validateQuery,
  validateParams
};