const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Restaurant = require('../models/Restaurant');
const {
  authenticateToken,
  requireVendorPermission,
  handleError,
  extractRequestMetadata
} = require('../middlewares/auth');
const {
  createVendorSchema,
  updateVendorSchema,
  vendorQuerySchema,
  vendorIdSchema,
  validate,
  validateQuery,
  validateParams
} = require('../utils/vendorValidation');

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/vendors - Get all vendors with pagination and filtering
router.get('/', 
  requireVendorPermission,
  validateQuery(vendorQuerySchema),
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        isActive,
        role
      } = req.query;

      // Build query
      const query = { role: { $in: ['vendor', 'restaurant', 'owner'] } };
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      if (role) {
        query.role = role;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const vendors = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean();

      // Get total count for pagination
      const totalCount = await User.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);

      // Get restaurant counts for each vendor
      const vendorsWithStats = await Promise.all(
        vendors.map(async (vendor) => {
          const restaurantCount = await Restaurant.countDocuments({ owner: vendor._id });
          return {
            ...vendor,
            restaurantCount,
            fullAddress: vendor.address ? 
              [vendor.address.street, vendor.address.city, vendor.address.state, vendor.address.zipCode]
                .filter(Boolean).join(', ') : null
          };
        })
      );

      // Log the action
      const metadata = extractRequestMetadata(req);
      await AuditLog.logVendorListView(req.user._id, metadata);

      res.json({
        success: true,
        message: 'Vendors retrieved successfully',
        data: {
          vendors: vendorsWithStats,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/vendors/:id - Get single vendor by ID
router.get('/:id',
  requireVendorPermission,
  validateParams(vendorIdSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const vendor = await User.findById(id)
        .select('-password')
        .populate('restaurants');

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      // Get vendor's restaurants
      const restaurants = await Restaurant.find({ owner: id });
      
      // Calculate vendor statistics
      const stats = {
        restaurantCount: restaurants.length,
        totalRevenue: 0, // Would need order data to calculate
        activeRestaurants: restaurants.filter(r => r.isActive).length,
        inactiveRestaurants: restaurants.filter(r => !r.isActive).length
      };

      // Log the action
      const metadata = extractRequestMetadata(req);
      await AuditLog.logVendorAction('VIEW_VENDOR', req.user._id, id, {}, metadata);

      res.json({
        success: true,
        message: 'Vendor retrieved successfully',
        data: {
          vendor: {
            ...vendor.toObject(),
            restaurants,
            fullAddress: vendor.address ? 
              [vendor.address.street, vendor.address.city, vendor.address.state, vendor.address.zipCode]
                .filter(Boolean).join(', ') : null,
            stats
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/vendors - Create new vendor
router.post('/',
  requireVendorPermission,
  validate(createVendorSchema),
  async (req, res, next) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        address,
        isActive = true,
        permissions = []
      } = req.body;

      // Check if vendor with email already exists
      const existingVendor = await User.findOne({ email });
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: 'Vendor with this email already exists',
          field: 'email'
        });
      }

      // Create new vendor
      const vendorData = {
        name,
        email,
        phone,
        password,
        role: 'vendor',
        isActive,
        address: address || {},
        permissions
      };

      const vendor = new User(vendorData);
      await vendor.save();

      // Log the action
      const metadata = extractRequestMetadata(req);
      await AuditLog.logVendorCreate(req.user._id, vendor, metadata);

      // Return vendor data (without password)
      const vendorResponse = {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        role: vendor.role,
        isActive: vendor.isActive,
        address: vendor.address,
        permissions: vendor.permissions,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: {
          vendor: vendorResponse
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/vendors/:id - Update vendor
router.put('/:id',
  requireVendorPermission,
  validateParams(vendorIdSchema),
  validate(updateVendorSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if vendor exists
      const existingVendor = await User.findById(id);
      if (!existingVendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingVendor.email) {
        const emailExists = await User.findOne({ 
          email: updateData.email,
          _id: { $ne: id }
        });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email already in use by another vendor',
            field: 'email'
          });
        }
      }

      // Store old values for audit log
      const oldValues = {
        name: existingVendor.name,
        email: existingVendor.email,
        phone: existingVendor.phone,
        isActive: existingVendor.isActive,
        role: existingVendor.role,
        address: existingVendor.address,
        permissions: existingVendor.permissions
      };

      // Update vendor
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          existingVendor[key] = updateData[key];
        }
      });

      await existingVendor.save();

      // Log the action
      const metadata = extractRequestMetadata(req);
      await AuditLog.logVendorUpdate(req.user._id, oldValues, existingVendor, metadata);

      // Return updated vendor data
      const vendorResponse = {
        _id: existingVendor._id,
        name: existingVendor.name,
        email: existingVendor.email,
        phone: existingVendor.phone,
        role: existingVendor.role,
        isActive: existingVendor.isActive,
        address: existingVendor.address,
        permissions: existingVendor.permissions,
        createdAt: existingVendor.createdAt,
        updatedAt: existingVendor.updatedAt
      };

      res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: {
          vendor: vendorResponse
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/vendors/:id - Delete vendor (soft delete)
router.delete('/:id',
  requireVendorPermission,
  validateParams(vendorIdSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if vendor exists
      const vendor = await User.findById(id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      // Check if vendor has associated restaurants
      const restaurantCount = await Restaurant.countDocuments({ owner: id });
      if (restaurantCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete vendor with ${restaurantCount} associated restaurant(s). Please reassign or delete the restaurants first.`
        });
      }

      // Soft delete - set isActive to false
      vendor.isActive = false;
      await vendor.save();

      // Log the action
      const metadata = extractRequestMetadata(req);
      await AuditLog.logVendorDelete(req.user._id, vendor, metadata);

      res.json({
        success: true,
        message: 'Vendor deleted successfully',
        data: {
          vendorId: vendor._id
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/vendors/:id/status - Toggle vendor status (activate/deactivate)
router.patch('/:id/status',
  requireVendorPermission,
  validateParams(vendorIdSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      // Check if vendor exists
      const vendor = await User.findById(id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const oldStatus = vendor.isActive;
      vendor.isActive = isActive;
      await vendor.save();

      // Log the action
      const action = isActive ? 'ACTIVATE_VENDOR' : 'DEACTIVATE_VENDOR';
      const metadata = extractRequestMetadata(req);
      await AuditLog.logVendorAction(action, req.user._id, id, {
        oldValue: { isActive: oldStatus },
        newValue: { isActive: isActive }
      }, metadata);

      res.json({
        success: true,
        message: `Vendor ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          vendorId: vendor._id,
          isActive: vendor.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/vendors/:id/permissions - Update vendor permissions
router.patch('/:id/permissions',
  requireVendorPermission,
  validateParams(vendorIdSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be an array'
        });
      }

      // Check if vendor exists
      const vendor = await User.findById(id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const oldPermissions = [...vendor.permissions];
      vendor.permissions = permissions;
      await vendor.save();

      // Log the action
      const metadata = extractRequestMetadata(req);
      await AuditLog.logVendorAction('UPDATE_PERMISSIONS', req.user._id, id, {
        oldValue: { permissions: oldPermissions },
        newValue: { permissions }
      }, metadata);

      res.json({
        success: true,
        message: 'Vendor permissions updated successfully',
        data: {
          vendorId: vendor._id,
          permissions: vendor.permissions
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/vendors/:id/audit-logs - Get vendor audit logs
router.get('/:id/audit-logs',
  requireVendorPermission,
  validateParams(vendorIdSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Check if vendor exists
      const vendor = await User.findById(id);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      // Get audit logs
      const skip = (page - 1) * limit;
      const auditLogs = await AuditLog.find({ entityId: id })
        .populate('performedBy', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalCount = await AuditLog.countDocuments({ entityId: id });
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: {
          auditLogs,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Error handling middleware
router.use(handleError);

module.exports = router;