# Vendor Workflow Analysis & Issues

## Overview
Analysis of the vendor account creation, approval, and login workflow across Admin Dashboard, Backend API, and Vendor Mobile App.

---

## Current Workflow

### 1. Admin Creates Vendor Account (Admin Dashboard)
**Location:** `admin/src/pages/Vendors.jsx`

**Process:**
- Admin fills vendor form with:
  - Personal info: firstName, lastName, name, email, password, phoneNumber, image
  - Business info: businessName, businessType, businessCategory, address, etc.
- Calls `createVendor` mutation
- Backend creates User with `role: 'vendor'` and `isActive: true`

**GraphQL Mutation:**
```graphql
mutation CreateVendor($vendorInput: VendorInput!) {
  createVendor(vendorInput: $vendorInput) {
    _id
    name
    email
  }
}
```

### 2. Backend Vendor Creation (Backend)
**Location:** `graphql/resolvers.js` (line 2497)

**Current Implementation:**
```javascript
createVendor: async (parent, { vendorInput }, context) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: vendorInput.email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create new vendor user
  const vendor = new User({
    name: vendorInput.name || `${vendorInput.firstName} ${vendorInput.lastName}`,
    email: vendorInput.email,
    password: vendorInput.password,
    phone: vendorInput.phoneNumber,
    role: 'vendor',
    profileImage: vendorInput.image,
    isActive: true,  // ⚠️ ISSUE: Always set to true
  });

  await vendor.save();
  return { /* vendor data */ };
}
```

### 3. Vendor Login (Vendor Mobile App)
**Location:** `vendor/src/screens/auth/LoginScreen.js`

**Process:**
- Vendor enters email and password
- Calls `ownerLogin` mutation
- Backend validates credentials and role

**GraphQL Mutation:**
```graphql
mutation OwnerLogin($email: String!, $password: String!) {
  ownerLogin(email: $email, password: $password) {
    userId
    token
    email
    userType
    restaurants { _id name image address }
    name
    image
  }
}
```

### 4. Backend Owner Login (Backend)
**Location:** `graphql/resolvers.js` (line 865)

**Current Implementation:**
```javascript
ownerLogin: async (parent, { email, password }) => {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // ⚠️ ISSUE: Only allows 'admin' or 'restaurant' roles
  if (user.role !== 'admin' && user.role !== 'restaurant') {
    throw new Error('Not authorized. Admin or restaurant owner access required.');
  }

  // Generate token and return user data
  const token = generateToken(user._id);
  let restaurants = [];
  if (user.role === 'restaurant') {
    restaurants = await Restaurant.find({ owner: user._id, isActive: true });
  }

  return { userId, token, email, userType, restaurants, name, image };
}
```

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue #1: Role Mismatch in ownerLogin
**Problem:** The `ownerLogin` mutation only accepts users with role `'admin'` or `'restaurant'`, but vendors are created with role `'vendor'`.

**Location:** `graphql/resolvers.js` line 880-882
```javascript
if (user.role !== 'admin' && user.role !== 'restaurant') {
  throw new Error('Not authorized. Admin or restaurant owner access required.');
}
```

**Impact:** Vendors cannot log in to the Vendor app even with correct credentials.

**Error Message:** "Not authorized. Admin or restaurant owner access required."

---

### Issue #2: Missing Account Status/Approval System
**Problem:** The requirement states "Account status is pending until approved by admin", but:
- No `accountStatus` or `approvalStatus` field in User model
- Vendors are created with `isActive: true` immediately
- No approval workflow exists

**Location:** 
- `models/User.js` - Missing status field
- `graphql/resolvers.js` line 2510 - Always sets `isActive: true`

**Impact:** No way to implement pending approval workflow.

---

### Issue #3: Business Category Selection Not Stored
**Problem:** Admin form collects business categories, but they're not saved:
- Form has `businessCategory` field (food, grocery, pharmacy, etc.)
- `VendorInput` GraphQL type doesn't include business fields
- User model doesn't have business category fields

**Location:**
- `admin/src/pages/Vendors.jsx` - Form collects data
- `graphql/typeDefs.js` line 633 - VendorInput missing fields
- `models/User.js` - No business category field

**Impact:** Business category information is lost.

---

### Issue #4: Inconsistent Role Naming
**Problem:** Multiple role names used inconsistently:
- User model: `'vendor'`, `'restaurant'`, `'admin'`
- ownerLogin checks: `'admin'` and `'restaurant'` only
- Admin dashboard filters: case-insensitive vendor check

**Location:** Throughout codebase

**Impact:** Confusion and authentication failures.

---

### Issue #5: VendorInput Schema Incomplete
**Problem:** The GraphQL `VendorInput` type only accepts basic fields:

**Current Schema:**
```graphql
input VendorInput {
  _id: ID
  name: String
  email: String
  password: String
  image: String
  firstName: String
  lastName: String
  phoneNumber: String
}
```

**Missing Fields:**
- businessName
- businessType
- businessCategory
- address fields (street, city, state, zipCode, country)
- taxId
- licenseNumber
- description
- accountStatus

---

## 📋 REQUIRED FIXES

### Fix #1: Update ownerLogin to Accept Vendor Role
**File:** `graphql/resolvers.js` (line 880)

**Change:**
```javascript
// OLD:
if (user.role !== 'admin' && user.role !== 'restaurant') {
  throw new Error('Not authorized. Admin or restaurant owner access required.');
}

// NEW:
if (user.role !== 'admin' && user.role !== 'restaurant' && user.role !== 'vendor') {
  throw new Error('Not authorized. Admin, restaurant owner, or vendor access required.');
}
```

**Alternative (Better):** Check for owner-type roles
```javascript
const allowedRoles = ['admin', 'restaurant', 'vendor', 'owner'];
if (!allowedRoles.includes(user.role)) {
  throw new Error('Not authorized. Owner access required.');
}
```

---

### Fix #2: Add Account Status Field to User Model
**File:** `models/User.js`

**Add Field:**
```javascript
accountStatus: {
  type: String,
  enum: ['pending', 'approved', 'rejected', 'suspended'],
  default: 'pending',
  required: function() { return this.role === 'vendor'; }
},
approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
},
approvedAt: {
  type: Date,
},
rejectionReason: {
  type: String,
},
```

---

### Fix #3: Add Business Fields to User Model
**File:** `models/User.js`

**Add Fields:**
```javascript
// Vendor/Business specific fields
businessName: {
  type: String,
  trim: true,
},
businessType: {
  type: String,
  enum: ['restaurant', 'store', 'market', 'other'],
},
businessCategory: {
  type: String,
  enum: ['food', 'grocery', 'pharmacy', 'bakery', 'cafe', 'fastfood', 'finedining', 'other'],
},
businessDescription: {
  type: String,
},
taxId: {
  type: String,
  trim: true,
},
licenseNumber: {
  type: String,
  trim: true,
},
```

---

### Fix #4: Update VendorInput GraphQL Type
**File:** `graphql/typeDefs.js` (line 633)

**Update:**
```graphql
input VendorInput {
  _id: ID
  name: String
  email: String
  password: String
  image: String
  firstName: String
  lastName: String
  phoneNumber: String
  # Business fields
  businessName: String
  businessType: String
  businessCategory: String
  businessDescription: String
  # Address fields
  street: String
  city: String
  state: String
  zipCode: String
  country: String
  # Legal fields
  taxId: String
  licenseNumber: String
  # Status
  accountStatus: String
}
```

---

### Fix #5: Update createVendor Resolver
**File:** `graphql/resolvers.js` (line 2497)

**Update:**
```javascript
createVendor: async (parent, { vendorInput }, context) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: vendorInput.email });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create new vendor user
  const vendor = new User({
    name: vendorInput.name || `${vendorInput.firstName} ${vendorInput.lastName}`,
    email: vendorInput.email,
    password: vendorInput.password,
    phone: vendorInput.phoneNumber,
    role: 'vendor',
    profileImage: vendorInput.image,
    isActive: false,  // ✅ Changed: Inactive until approved
    accountStatus: 'pending',  // ✅ New: Pending approval
    // Business fields
    businessName: vendorInput.businessName,
    businessType: vendorInput.businessType,
    businessCategory: vendorInput.businessCategory,
    businessDescription: vendorInput.businessDescription,
    // Address
    address: {
      street: vendorInput.street,
      city: vendorInput.city,
      state: vendorInput.state,
      zipCode: vendorInput.zipCode,
      country: vendorInput.country || 'United States',
    },
    // Legal
    taxId: vendorInput.taxId,
    licenseNumber: vendorInput.licenseNumber,
  });

  await vendor.save();

  return {
    _id: vendor._id,
    unique_id: vendor._id.toString(),
    email: vendor.email,
    password: vendorInput.password,
    plainPassword: vendorInput.password,
    name: vendor.name,
    image: vendor.profileImage,
    firstName: vendorInput.firstName,
    lastName: vendorInput.lastName,
    phoneNumber: vendor.phone,
    userType: 'vendor',
    isActive: false,
    accountStatus: 'pending',
    restaurants: []
  };
},
```

---

### Fix #6: Add Vendor Approval Mutations
**File:** `graphql/typeDefs.js`

**Add Mutations:**
```graphql
type Mutation {
  # ... existing mutations ...
  
  # Vendor approval
  approveVendor(id: ID!, approvedBy: ID!): VendorType!
  rejectVendor(id: ID!, reason: String!): VendorType!
  suspendVendor(id: ID!, reason: String!): VendorType!
}
```

**File:** `graphql/resolvers.js`

**Add Resolvers:**
```javascript
approveVendor: async (parent, { id, approvedBy }, context) => {
  // Check if requester is admin
  if (!context.user || context.user.role !== 'admin') {
    throw new Error('Not authorized. Admin access required.');
  }

  const vendor = await User.findById(id);
  if (!vendor || vendor.role !== 'vendor') {
    throw new Error('Vendor not found');
  }

  vendor.accountStatus = 'approved';
  vendor.isActive = true;
  vendor.approvedBy = approvedBy;
  vendor.approvedAt = new Date();
  
  await vendor.save();

  // TODO: Send approval email notification

  return {
    _id: vendor._id,
    unique_id: vendor._id.toString(),
    email: vendor.email,
    name: vendor.name,
    userType: vendor.role,
    isActive: true,
    accountStatus: 'approved',
  };
},

rejectVendor: async (parent, { id, reason }, context) => {
  if (!context.user || context.user.role !== 'admin') {
    throw new Error('Not authorized. Admin access required.');
  }

  const vendor = await User.findById(id);
  if (!vendor || vendor.role !== 'vendor') {
    throw new Error('Vendor not found');
  }

  vendor.accountStatus = 'rejected';
  vendor.isActive = false;
  vendor.rejectionReason = reason;
  
  await vendor.save();

  // TODO: Send rejection email notification

  return {
    _id: vendor._id,
    accountStatus: 'rejected',
  };
},
```

---

### Fix #7: Update ownerLogin to Check Account Status
**File:** `graphql/resolvers.js` (line 865)

**Update:**
```javascript
ownerLogin: async (parent, { email, password }) => {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Check if user has owner/vendor role
  const allowedRoles = ['admin', 'restaurant', 'vendor', 'owner'];
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Not authorized. Owner access required.');
  }

  // ✅ NEW: Check account status for vendors
  if (user.role === 'vendor') {
    if (user.accountStatus === 'pending') {
      throw new Error('Your account is pending approval. Please wait for admin approval.');
    }
    if (user.accountStatus === 'rejected') {
      throw new Error('Your account has been rejected. Please contact support.');
    }
    if (user.accountStatus === 'suspended') {
      throw new Error('Your account has been suspended. Please contact support.');
    }
    if (!user.isActive) {
      throw new Error('Your account is inactive. Please contact support.');
    }
  }

  // Generate token
  const token = generateToken(user._id);

  // Get user's restaurants
  let restaurants = [];
  if (user.role === 'restaurant' || user.role === 'vendor') {
    restaurants = await Restaurant.find({ owner: user._id, isActive: true })
      .select('_id name image address');
  }

  return {
    userId: user._id,
    token,
    email: user.email,
    userType: user.role.toUpperCase(),
    restaurants,
    permissions: [],
    userTypeId: user.role,
    image: user.profileImage,
    name: user.name,
  };
},
```

---

### Fix #8: Update Admin Vendors Page
**File:** `admin/src/pages/Vendors.jsx`

**Add Approval Actions:**
```javascript
// Add mutations
const APPROVE_VENDOR = gql`
  mutation ApproveVendor($id: ID!, $approvedBy: ID!) {
    approveVendor(id: $id, approvedBy: $approvedBy) {
      _id
      accountStatus
      isActive
    }
  }
`;

const REJECT_VENDOR = gql`
  mutation RejectVendor($id: ID!, $reason: String!) {
    rejectVendor(id: $id, reason: $reason) {
      _id
      accountStatus
    }
  }
`;

// Add handlers
const handleApprove = async (vendorId) => {
  if (!window.confirm('Approve this vendor account?')) return;
  try {
    await approveVendor({ 
      variables: { 
        id: vendorId, 
        approvedBy: currentAdminId // Get from auth context
      } 
    });
    refetch();
    alert('✅ Vendor approved successfully!');
  } catch (err) {
    console.error('Error approving vendor:', err);
    alert('Failed to approve vendor');
  }
};

const handleReject = async (vendorId) => {
  const reason = window.prompt('Enter rejection reason:');
  if (!reason) return;
  try {
    await rejectVendor({ variables: { id: vendorId, reason } });
    refetch();
    alert('Vendor rejected');
  } catch (err) {
    console.error('Error rejecting vendor:', err);
    alert('Failed to reject vendor');
  }
};

// Update table to show status and approval actions
<td>
  <span className={`badge ${
    vendor.accountStatus === 'approved' ? 'badge-green' :
    vendor.accountStatus === 'pending' ? 'badge-yellow' :
    vendor.accountStatus === 'rejected' ? 'badge-red' :
    'badge-gray'
  }`}>
    {vendor.accountStatus || 'N/A'}
  </span>
</td>
<td>
  {vendor.accountStatus === 'pending' && (
    <>
      <button className="btn-icon btn-success" onClick={() => handleApprove(vendor._id)}>
        ✓ Approve
      </button>
      <button className="btn-icon btn-danger" onClick={() => handleReject(vendor._id)}>
        ✗ Reject
      </button>
    </>
  )}
</td>
```

---

## 🎯 SUMMARY OF CHANGES NEEDED

### Backend Changes:
1. ✅ Update `models/User.js` - Add accountStatus, business fields
2. ✅ Update `graphql/typeDefs.js` - Expand VendorInput, add approval mutations
3. ✅ Update `graphql/resolvers.js`:
   - Fix ownerLogin to accept 'vendor' role
   - Add account status check in ownerLogin
   - Update createVendor to set status='pending', isActive=false
   - Add approveVendor, rejectVendor, suspendVendor resolvers
   - Update editVendor to handle new fields

### Frontend Changes:
4. ✅ Update `admin/src/pages/Vendors.jsx`:
   - Add approval/rejection mutations and handlers
   - Update table to show account status
   - Add approve/reject action buttons
   - Update form submission to include all business fields

### Vendor App Changes:
5. ✅ Update `vendor/src/screens/auth/LoginScreen.js`:
   - Improve error messages for pending/rejected accounts
   - Show appropriate messages based on account status

---

## 🧪 TESTING CHECKLIST

### Test Case 1: Create Vendor
- [ ] Admin creates vendor with all fields
- [ ] Vendor is created with status='pending', isActive=false
- [ ] All business fields are saved correctly

### Test Case 2: Vendor Login (Pending)
- [ ] Vendor tries to login
- [ ] Receives error: "Your account is pending approval"
- [ ] Cannot access vendor app

### Test Case 3: Admin Approves Vendor
- [ ] Admin sees pending vendor in list
- [ ] Admin clicks "Approve"
- [ ] Vendor status changes to 'approved', isActive=true

### Test Case 4: Vendor Login (Approved)
- [ ] Vendor logs in successfully
- [ ] Receives token and user data
- [ ] Can access vendor app features

### Test Case 5: Admin Rejects Vendor
- [ ] Admin clicks "Reject" with reason
- [ ] Vendor status changes to 'rejected'
- [ ] Vendor receives appropriate error message on login

---

## 📝 NOTES

- Consider adding email notifications for approval/rejection
- Consider adding a vendor dashboard showing account status
- May want to add role='owner' as unified role for all shop owners
- Consider adding approval history/audit log
- Add validation for required business fields based on category

