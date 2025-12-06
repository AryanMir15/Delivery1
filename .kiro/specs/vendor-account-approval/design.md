# Design Document

## Overview

The vendor account approval system implements a multi-stage workflow for onboarding vendors to the platform. The system consists of three main components: admin vendor management interface, vendor authentication and authorization, and status-based access control. The design ensures that only approved vendors can manage shops and products while maintaining a smooth user experience for pending vendors.

The system extends the existing User model to support vendor-specific fields including approval status, business categories, and approval history. It integrates with the existing GraphQL API, admin dashboard, and vendor mobile app to provide a cohesive experience across all platforms.

## Architecture

### System Components

1. **Backend API Layer**
   - GraphQL mutations for vendor CRUD operations
   - Enhanced authentication middleware for status checking
   - Email notification service for status changes
   - Approval history tracking service

2. **Admin Dashboard**
   - Vendor management interface (React + Vite)
   - Approval workflow UI
   - Vendor list with filtering and search
   - Approval history viewer

3. **Vendor Mobile App**
   - Enhanced login screen with error handling
   - Status-aware dashboard
   - Restricted feature access for pending vendors
   - Status notification banners

4. **Database Layer**
   - Extended User model with vendor approval fields
   - ApprovalHistory collection for audit trail
   - Indexed queries for efficient vendor filtering

### Data Flow

```
Admin Creates Vendor → User Record (isActive: false) → Email Notification
                                    ↓
                          Vendor Logs In → Token Generated
                                    ↓
                          Status Check → Pending/Approved/Rejected
                                    ↓
                          UI Adapts Based on Status
                                    ↓
Admin Approves → isActive: true → Email Notification → Full Access Granted
```

## Components and Interfaces

### Backend Components

#### 1. Enhanced User Model

```javascript
// Extended fields for vendor approval
{
  // Existing fields...
  role: 'vendor',
  isActive: Boolean,  // false = pending, true = approved
  
  // New vendor-specific fields
  businessCategories: [String],  // ['grocery', 'pharmacy', etc.]
  approvalStatus: {
    status: String,  // 'pending', 'approved', 'rejected'
    reason: String,  // rejection reason if applicable
    reviewedBy: ObjectId,  // admin who reviewed
    reviewedAt: Date,
    submittedAt: Date
  },
  vendorProfile: {
    businessName: String,
    businessType: String,
    taxId: String,
    licenseNumber: String,
    description: String
  }
}
```

#### 2. ApprovalHistory Model

```javascript
{
  vendorId: ObjectId,
  action: String,  // 'created', 'approved', 'rejected', 'reactivated'
  performedBy: ObjectId,  // admin user
  reason: String,
  previousStatus: String,
  newStatus: String,
  metadata: Object,  // additional context
  timestamp: Date
}
```

#### 3. GraphQL Type Definitions

```graphql
extend type User {
  businessCategories: [String!]
  approvalStatus: ApprovalStatus
  vendorProfile: VendorProfile
  approvalHistory: [ApprovalHistoryEntry!]
}

type ApprovalStatus {
  status: String!
  reason: String
  reviewedBy: User
  reviewedAt: String
  submittedAt: String!
}

type VendorProfile {
  businessName: String
  businessType: String
  taxId: String
  licenseNumber: String
  description: String
}

type ApprovalHistoryEntry {
  id: ID!
  action: String!
  performedBy: User!
  reason: String
  previousStatus: String
  newStatus: String!
  timestamp: String!
}

extend type Mutation {
  approveVendor(
    vendorId: ID!
    notes: String
  ): User!
  
  rejectVendor(
    vendorId: ID!
    reason: String!
  ): User!
  
  updateVendorBusinessCategories(
    vendorId: ID!
    categories: [String!]!
  ): User!
}

extend type Query {
  vendorsByStatus(
    status: String!
    page: Int
    limit: Int
  ): VendorPaginationResponse!
  
  vendorApprovalHistory(
    vendorId: ID!
  ): [ApprovalHistoryEntry!]!
}
```

#### 4. Authentication Middleware Enhancement

```javascript
// Enhanced context builder for GraphQL
const getUser = async (token) => {
  if (!token) return null;
  
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.id);
  
  // Add status information to context
  return {
    ...user.toObject(),
    isPending: user.role === 'vendor' && !user.isActive,
    isApproved: user.role === 'vendor' && user.isActive,
    canManageShops: user.role === 'vendor' && user.isActive
  };
};

// Permission checker
const requireApprovedVendor = (context) => {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  if (context.user.role !== 'vendor') {
    throw new Error('Vendor role required');
  }
  if (!context.user.isActive) {
    throw new Error('Account pending approval');
  }
};
```

### Frontend Components

#### 1. Admin Vendor Management (admin/src/pages/Vendors.jsx)

**Enhanced Features:**
- Status filter dropdown (All, Pending, Approved, Rejected)
- Approval action buttons
- Approval history modal
- Rejection reason input dialog

**Key Functions:**
```javascript
const handleApprove = async (vendorId, notes) => {
  await approveVendor({ variables: { vendorId, notes } });
  // Send notification
  // Refresh list
};

const handleReject = async (vendorId, reason) => {
  await rejectVendor({ variables: { vendorId, reason } });
  // Send notification
  // Refresh list
};
```

#### 2. Vendor Login Screen (vendor/src/screens/auth/LoginScreen.js)

**Enhanced Features:**
- Clear error message display
- Loading state management
- Proper navigation after login
- Back button handling

**Key Improvements:**
```javascript
const handleLogin = async () => {
  try {
    dispatch(loginStart());
    const { data } = await ownerLogin({ variables: { email, password } });
    
    // Save token
    await AsyncStorage.setItem('vendorToken', data.ownerLogin.token);
    
    // Dispatch success with user data including status
    dispatch(loginSuccess({
      user: data.ownerLogin.user,
      token: data.ownerLogin.token,
      isPending: !data.ownerLogin.user.isActive
    }));
    
    // Navigation handled by RootNavigator based on auth state
  } catch (error) {
    dispatch(loginFailure(error.message));
    // Error displayed in UI, user stays on login screen
  }
};
```

#### 3. Vendor Dashboard with Status Banner (vendor/src/screens/DashboardScreen.js)

**Status Banner Component:**
```javascript
const StatusBanner = ({ status, reason }) => {
  if (status === 'approved') return null;
  
  return (
    <View style={styles.statusBanner}>
      {status === 'pending' && (
        <>
          <Icon name="clock" />
          <Text>Account Pending Approval</Text>
          <Text>Your account is under review. You'll be notified once approved.</Text>
        </>
      )}
      {status === 'rejected' && (
        <>
          <Icon name="alert" />
          <Text>Account Rejected</Text>
          <Text>Reason: {reason}</Text>
          <Text>Contact support for assistance</Text>
        </>
      )}
    </View>
  );
};
```

#### 4. Feature Access Guard Component

```javascript
const FeatureGuard = ({ children, requiresApproval = true }) => {
  const { user } = useSelector(state => state.auth);
  
  if (requiresApproval && !user.isActive) {
    return (
      <View style={styles.restrictedAccess}>
        <Icon name="lock" size={48} />
        <Text>Feature Restricted</Text>
        <Text>This feature is available after account approval</Text>
      </View>
    );
  }
  
  return children;
};
```

## Data Models

### User Model Extensions

```javascript
// Add to existing User schema
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Vendor approval fields
  businessCategories: [{
    type: String,
    enum: [
      'grocery', 'pharmacy', 'electronics', 'fashion',
      'furniture', 'flowers', 'agriculture', 'beverages',
      'beauty', 'medical', 'stationery', 'pet_supplies',
      'automotive', 'restaurant', 'other'
    ]
  }],
  
  approvalStatus: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reason: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  vendorProfile: {
    businessName: String,
    businessType: {
      type: String,
      enum: ['restaurant', 'store', 'market', 'other']
    },
    taxId: String,
    licenseNumber: String,
    description: String
  }
});

// Indexes for efficient queries
userSchema.index({ role: 1, 'approvalStatus.status': 1 });
userSchema.index({ businessCategories: 1 });
```

### ApprovalHistory Model

```javascript
const approvalHistorySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['created', 'approved', 'rejected', 'reactivated', 'updated'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: String,
  previousStatus: String,
  newStatus: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient history queries
approvalHistorySchema.index({ vendorId: 1, timestamp: -1 });
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundant Properties:**
- Properties 3.3 and 3.4 (approval/rejection emails) can be consolidated into a single "status change notification" property
- Properties 5.3 and 5.4 (pending vendor restrictions) can be combined into one "pending vendor authorization" property
- Properties 6.1 and 6.4 (approved vendor access) overlap and can be consolidated
- Properties 7.1, 7.2, and 7.3 (email notifications) can be consolidated into property 3.3/3.4 consolidation
- Properties 8.1, 8.2, and 8.3 (approval history display) can be combined into one comprehensive property

**Consolidated Properties:**
- Email notifications consolidated into one property covering all status changes
- Vendor restrictions consolidated into one property covering all protected operations
- Approval history consolidated into one property covering all required fields

This reduces the total number of properties from 35+ to approximately 20 focused, non-redundant properties.

### Correctness Properties

Property 1: Vendor creation sets correct initial state
*For any* valid vendor input data (name, email, password), creating a vendor account should result in a user with role="vendor" and isActive=false
**Validates: Requirements 1.1**

Property 2: Required fields validation
*For any* vendor creation attempt missing name, email, or password, the system should reject the creation with a validation error
**Validates: Requirements 1.2**

Property 3: Optional fields acceptance
*For any* vendor creation with or without optional fields (phone, image, business info), the creation should succeed if required fields are present
**Validates: Requirements 1.3**

Property 4: Email uniqueness constraint
*For any* existing vendor email, attempting to create another vendor with the same email should fail with a duplicate error
**Validates: Requirements 1.5**

Property 5: Vendor role filtering
*For any* database containing users with mixed roles, querying for vendors should return only users where role="vendor"
**Validates: Requirements 2.1**

Property 6: Status display mapping
*For any* vendor user, the displayed status should be "pending" when isActive=false and approvalStatus.status="pending", "approved" when isActive=true, and "rejected" when approvalStatus.status="rejected"
**Validates: Requirements 2.2**

Property 7: Shop count aggregation
*For any* vendor, the displayed shop count should equal the number of Shop documents where owner equals the vendor's ID
**Validates: Requirements 2.3**

Property 8: Status filtering
*For any* status value (pending/approved/rejected), filtering vendors by that status should return only vendors matching that status
**Validates: Requirements 2.4**

Property 9: Vendor search functionality
*For any* search term, the search results should include only vendors whose name, email, or business category contains the search term (case-insensitive)
**Validates: Requirements 2.5**

Property 10: Approval state transition
*For any* pending vendor, approving the account should set isActive=true and approvalStatus.status="approved"
**Validates: Requirements 3.1**

Property 11: Rejection state transition
*For any* vendor, rejecting the account should set isActive=false, approvalStatus.status="rejected", and store the rejection reason
**Validates: Requirements 3.2**

Property 12: Status change notifications
*For any* vendor status change (creation, approval, rejection), the system should trigger an email notification to the vendor with appropriate content for the status
**Validates: Requirements 1.4, 3.3, 3.4, 7.1, 7.2, 7.3**

Property 13: Audit trail creation
*For any* vendor status change, the system should create an ApprovalHistory record containing the admin ID, timestamp, previous status, new status, and reason (if applicable)
**Validates: Requirements 3.5, 8.5**

Property 14: Business categories storage
*For any* vendor with selected business categories, fetching the vendor should return the same categories that were stored
**Validates: Requirements 4.1, 4.3**

Property 15: Category validation
*For any* attempt to set business categories, only values from the predefined category list should be accepted
**Validates: Requirements 4.5**

Property 16: Shop category inheritance
*For any* vendor with business categories, creating a shop should default the shop's shopType to one of the vendor's categories
**Validates: Requirements 4.4**

Property 17: Pending vendor authentication
*For any* pending vendor (isActive=false), login with valid credentials should return a valid JWT token
**Validates: Requirements 5.1**

Property 18: Pending vendor authorization restrictions
*For any* pending vendor, attempting to create shops or products should be rejected with an "Account pending approval" error
**Validates: Requirements 5.3, 5.4**

Property 19: Profile status inclusion
*For any* vendor, fetching their profile should include approvalStatus fields (status, submittedAt, reviewedAt, reason)
**Validates: Requirements 5.5, 10.3**

Property 20: Approved vendor full access
*For any* approved vendor (isActive=true), all shop management operations (create shop, create product, update product, delete product) should succeed
**Validates: Requirements 6.1, 6.4**

Property 21: Shop ownership assignment
*For any* approved vendor creating a shop, the shop's owner field should be set to the vendor's user ID
**Validates: Requirements 6.2**

Property 22: Dashboard data access
*For any* approved vendor, querying dashboard data should return shop analytics and order statistics for shops owned by that vendor
**Validates: Requirements 6.3**

Property 23: Dynamic permission revocation
*For any* approved vendor whose status changes to rejected, subsequent attempts to manage shops or products should be rejected
**Validates: Requirements 6.5**

Property 24: Email retry logic
*For any* email notification failure, the system should retry up to 3 times before logging a permanent failure
**Validates: Requirements 7.5**

Property 25: Approval history completeness
*For any* vendor, querying approval history should return all ApprovalHistory records with action, performedBy (admin), timestamp, and status changes
**Validates: Requirements 8.1, 8.2, 8.3**

Property 26: History export inclusion
*For any* vendor data export, the exported data should include all approval history records for that vendor
**Validates: Requirements 8.4**

## Error Handling

### Error Types and Responses

1. **Authentication Errors**
   - Invalid credentials: `401 Unauthorized - "Invalid email or password"`
   - Missing token: `401 Unauthorized - "Authentication required"`
   - Expired token: `401 Unauthorized - "Token expired, please login again"`

2. **Authorization Errors**
   - Pending vendor restrictions: `403 Forbidden - "Account pending approval. Contact admin for status."`
   - Rejected vendor access: `403 Forbidden - "Account rejected. Reason: {reason}"`
   - Non-vendor role: `403 Forbidden - "Vendor role required"`

3. **Validation Errors**
   - Missing required fields: `400 Bad Request - "Missing required fields: {fields}"`
   - Invalid email format: `400 Bad Request - "Invalid email format"`
   - Duplicate email: `409 Conflict - "Email already registered"`
   - Invalid categories: `400 Bad Request - "Invalid business categories: {categories}"`

4. **Business Logic Errors**
   - Vendor not found: `404 Not Found - "Vendor not found"`
   - Already approved: `400 Bad Request - "Vendor already approved"`
   - Cannot approve rejected: `400 Bad Request - "Cannot approve rejected vendor without review"`

### Error Handling Strategy

```javascript
// Centralized error handler
const handleVendorError = (error, context) => {
  // Log error with context
  logger.error('Vendor operation failed', {
    error: error.message,
    stack: error.stack,
    userId: context.user?.id,
    operation: context.operation
  });
  
  // Map to user-friendly message
  const userMessage = getUserFriendlyMessage(error);
  
  // Send to client
  throw new ApolloError(userMessage, error.code || 'INTERNAL_ERROR', {
    originalError: error.message
  });
};

// Retry logic for email notifications
const sendEmailWithRetry = async (emailData, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await emailService.send(emailData);
      logger.info('Email sent successfully', { attempt, to: emailData.to });
      return;
    } catch (error) {
      lastError = error;
      logger.warn('Email send failed', { attempt, error: error.message });
      
      if (attempt < maxRetries) {
        await delay(1000 * attempt); // Exponential backoff
      }
    }
  }
  
  // Log permanent failure
  logger.error('Email send permanently failed', {
    to: emailData.to,
    attempts: maxRetries,
    error: lastError.message
  });
  
  throw new Error('Failed to send email after retries');
};
```

## Testing Strategy

### Unit Testing

The system will use Jest for unit testing with the following focus areas:

1. **Model Validation Tests**
   - Test User model with vendor-specific fields
   - Test ApprovalHistory model creation
   - Test schema validation rules

2. **Resolver Logic Tests**
   - Test vendor creation with various inputs
   - Test approval/rejection logic
   - Test filtering and search logic
   - Test permission checks

3. **Service Layer Tests**
   - Test email notification service
   - Test approval history service
   - Test category validation

4. **Middleware Tests**
   - Test authentication with pending/approved vendors
   - Test authorization guards
   - Test error handling

### Property-Based Testing

The system will use **fast-check** (JavaScript property-based testing library) for comprehensive testing:

**Configuration:**
- Minimum 100 iterations per property test
- Custom generators for vendor data, categories, and status values
- Shrinking enabled for minimal failing examples

**Test Organization:**
- Each correctness property implemented as a separate test
- Tests tagged with property number and requirement reference
- Tests grouped by feature area (creation, approval, access control)

**Example Property Test Structure:**
```javascript
describe('Vendor Account Approval - Property Tests', () => {
  describe('Vendor Creation Properties', () => {
    it('Property 1: Vendor creation sets correct initial state', async () => {
      // **Feature: vendor-account-approval, Property 1: Vendor creation sets correct initial state**
      await fc.assert(
        fc.asyncProperty(
          vendorInputGenerator(),
          async (vendorInput) => {
            const vendor = await createVendor(vendorInput);
            expect(vendor.role).toBe('vendor');
            expect(vendor.isActive).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    // Additional property tests...
  });
});
```

**Custom Generators:**
```javascript
// Generator for valid vendor input
const vendorInputGenerator = () => fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
  businessCategories: fc.array(fc.constantFrom(...VALID_CATEGORIES), { minLength: 1, maxLength: 5 })
});

// Generator for vendor status
const vendorStatusGenerator = () => fc.constantFrom('pending', 'approved', 'rejected');

// Generator for search terms
const searchTermGenerator = () => fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.emailAddress(),
  fc.constantFrom(...VALID_CATEGORIES)
);
```

### Integration Testing

1. **End-to-End Workflow Tests**
   - Complete vendor onboarding flow
   - Approval workflow with email notifications
   - Login and access control flow

2. **Database Integration Tests**
   - Test with real MongoDB instance
   - Test indexes and query performance
   - Test transaction handling

3. **API Integration Tests**
   - Test GraphQL mutations and queries
   - Test authentication flow
   - Test error responses

### Manual Testing Checklist

1. **Admin Dashboard**
   - [ ] Create vendor with all fields
   - [ ] Create vendor with minimal fields
   - [ ] Approve pending vendor
   - [ ] Reject pending vendor with reason
   - [ ] Filter vendors by status
   - [ ] Search vendors by name/email
   - [ ] View approval history

2. **Vendor Mobile App**
   - [ ] Login as pending vendor
   - [ ] View pending status banner
   - [ ] Attempt to create shop (should fail)
   - [ ] Login as approved vendor
   - [ ] Create shop successfully
   - [ ] Create products successfully
   - [ ] View dashboard analytics

3. **Email Notifications**
   - [ ] Verify welcome email on creation
   - [ ] Verify approval email
   - [ ] Verify rejection email with reason

## Implementation Notes

### Database Migration

Existing vendors in the database will need migration:

```javascript
// Migration script
const migrateExistingVendors = async () => {
  const vendors = await User.find({ role: 'vendor' });
  
  for (const vendor of vendors) {
    // Set default approval status for existing vendors
    vendor.approvalStatus = {
      status: vendor.isActive ? 'approved' : 'pending',
      submittedAt: vendor.createdAt,
      reviewedAt: vendor.isActive ? vendor.updatedAt : null
    };
    
    // Set default business categories if not present
    if (!vendor.businessCategories || vendor.businessCategories.length === 0) {
      vendor.businessCategories = ['other'];
    }
    
    await vendor.save();
  }
  
  console.log(`Migrated ${vendors.length} vendors`);
};
```

### Performance Considerations

1. **Indexing Strategy**
   - Compound index on `(role, approvalStatus.status)` for efficient filtering
   - Index on `businessCategories` for category-based queries
   - Index on `(vendorId, timestamp)` in ApprovalHistory for history queries

2. **Query Optimization**
   - Use projection to limit returned fields
   - Implement pagination for vendor lists
   - Cache frequently accessed data (category lists)

3. **Email Queue**
   - Implement background job queue for email sending
   - Prevent blocking on email failures
   - Batch notifications when possible

### Security Considerations

1. **Password Security**
   - Enforce minimum password length (8 characters)
   - Hash passwords using bcrypt before storage
   - Never return password in API responses

2. **Token Security**
   - Use secure JWT secret
   - Set appropriate token expiration (30 days)
   - Implement token refresh mechanism

3. **Authorization**
   - Always verify vendor approval status before protected operations
   - Check ownership before allowing shop/product modifications
   - Validate admin permissions for approval operations

4. **Input Validation**
   - Sanitize all user inputs
   - Validate email format
   - Validate business categories against whitelist
   - Prevent injection attacks

### Monitoring and Logging

1. **Key Metrics**
   - Vendor creation rate
   - Approval/rejection rate
   - Average time to approval
   - Email delivery success rate
   - Login success/failure rate

2. **Logging Events**
   - Vendor account creation
   - Status changes (approval/rejection)
   - Failed login attempts
   - Authorization failures
   - Email send failures

3. **Alerts**
   - High rejection rate
   - Email delivery failures
   - Unusual login patterns
   - Database errors
