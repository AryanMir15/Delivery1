import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import Layout from '../components/Layout';

const GET_VENDORS = gql`
  query GetVendors {
    users {
      id
      _id
      name
      email
      phone
      role
      profileImage
      isActive
      restaurants {
        _id
        name
        shopType
      }
    }
  }
`;

const CREATE_VENDOR = gql`
  mutation CreateVendor($vendorInput: VendorInput!) {
    createVendor(vendorInput: $vendorInput) {
      _id
      name
      email
    }
  }
`;

const EDIT_VENDOR = gql`
  mutation EditVendor($vendorInput: VendorInput!) {
    editVendor(vendorInput: $vendorInput) {
      _id
      name
      email
    }
  }
`;

const DELETE_VENDOR = gql`
  mutation DeleteVendor($id: String!) {
    deleteVendor(id: $id)
  }
`;

const UPLOAD_IMAGE = gql`
  mutation UploadImageToS3($image: String!) {
    uploadImageToS3(image: $image) {
      imageUrl
    }
  }
`;

function Vendors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    image: '',
    businessName: '',
    businessType: 'restaurant',
    businessCategory: 'food',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    taxId: '',
    licenseNumber: '',
    description: '',
  });

  const { data, loading, error, refetch } = useQuery(GET_VENDORS);
  const [createVendor] = useMutation(CREATE_VENDOR);
  const [editVendor] = useMutation(EDIT_VENDOR);
  const [deleteVendor] = useMutation(DELETE_VENDOR);
  const [uploadImage] = useMutation(UPLOAD_IMAGE);

  // Filter only vendor users from all users (case-insensitive)
  const vendors = data?.users?.filter(user => 
    user.role?.toUpperCase() === 'VENDOR' || user.role?.toLowerCase() === 'vendor'
  ) || [];

  const businessCategories = [
    { value: 'food', label: '🍔 Food & Restaurant' },
    { value: 'grocery', label: '🛒 Grocery & Supermarket' },
    { value: 'pharmacy', label: '💊 Pharmacy & Health' },
    { value: 'bakery', label: '🍰 Bakery & Desserts' },
    { value: 'cafe', label: '☕ Cafe & Coffee Shop' },
    { value: 'fastfood', label: '🍕 Fast Food' },
    { value: 'finedining', label: '🍽️ Fine Dining' },
    { value: 'other', label: '📦 Other' },
  ];

  const handleCreate = () => {
    setEditMode(false);
    setImagePreview('');
    setFormData({
      _id: '',
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      image: '',
      businessName: '',
      businessType: 'restaurant',
      businessCategory: 'food',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      taxId: '',
      licenseNumber: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleEdit = (vendor) => {
    setEditMode(true);
    setImagePreview(vendor.profileImage || '');
    setFormData({
      _id: vendor._id,
      firstName: vendor.firstName || '',
      lastName: vendor.lastName || '',
      name: vendor.name || '',
      email: vendor.email,
      password: '',
      phoneNumber: vendor.phone || '',
      image: vendor.profileImage || '',
      businessName: vendor.businessName || '',
      businessType: vendor.businessType || 'restaurant',
      businessCategory: vendor.businessCategory || 'food',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zipCode: vendor.zipCode || '',
      country: vendor.country || 'United States',
      taxId: vendor.taxId || '',
      licenseNumber: vendor.licenseNumber || '',
      description: vendor.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await deleteVendor({ variables: { id } });
      refetch();
    } catch (err) {
      console.error('Error deleting vendor:', err);
      alert('Failed to delete vendor');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setImagePreview(base64);
      setUploading(true);
      try {
        const { data } = await uploadImage({ variables: { image: base64 } });
        setFormData({ ...formData, image: data.uploadImageToS3.imageUrl });
      } catch (err) {
        console.error('Error uploading image:', err);
        alert('Failed to upload image');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // VendorInput only accepts these fields based on schema
      const vendorInput = {
        _id: formData._id || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        phoneNumber: formData.phoneNumber,
        image: formData.image,
      };

      console.log('Submitting vendor:', vendorInput);

      if (editMode) {
        const result = await editVendor({ variables: { vendorInput } });
        console.log('✅ Edit result:', result);
      } else {
        const result = await createVendor({ variables: { vendorInput } });
        console.log('✅ Create result:', result);
      }
      
      // Close modal
      setShowModal(false);
      
      // Refetch data to show updated list
      console.log('🔄 Refetching vendors...');
      const refetchResult = await refetch();
      console.log('✅ Refetch complete:', refetchResult.data?.users?.length, 'users found');
      
      // Show success message
      alert(editMode ? '✅ Vendor updated successfully!' : '✅ Vendor created successfully!');
    } catch (err) {
      console.error('❌ Error saving vendor:', err);
      const errorMessage = err.message || err.graphQLErrors?.[0]?.message || 'Failed to save vendor';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVendors = vendors?.filter((vendor) => {
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || vendor.businessCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Debug logging
  console.log('📊 Vendors Debug:', {
    totalUsers: data?.users?.length,
    vendorUsers: vendors?.length,
    filteredVendors: filteredVendors?.length,
    loading,
    error: error?.message
  });

  return (
    <Layout>
      <div className="page-header">
        <h1>Vendors</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-green" 
            onClick={() => {
              console.log('🔄 Manual refetch triggered');
              refetch();
            }}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button className="btn btn-blue" onClick={handleCreate}>
            + Add Vendor
          </button>
        </div>
      </div>

      {/* Statistics Card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)',
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-lg)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
            {vendors?.length || 0}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Vendors</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
            {vendors?.filter(v => v.isActive).length || 0}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Vendors</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
            {vendors?.reduce((sum, v) => sum + (v.restaurants?.length || 0), 0) || 0}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Restaurants</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--white)',
        padding: '20px 24px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '15px',
              transition: 'all 0.3s',
            }}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Categories</option>
            {businessCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ 
          padding: '8px 16px',
          background: 'var(--bg)',
          borderRadius: '20px',
          color: 'var(--text-secondary)', 
          fontSize: '14px', 
          fontWeight: '600' 
        }}>
          📊 {filteredVendors?.length || 0} vendor{filteredVendors?.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div>Loading vendors...</div>
        </div>
      ) : error ? (
        <div className="error">
          <strong>Error loading vendors:</strong> {error.message}
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            Make sure the backend server is running on port 4000
          </div>
        </div>
      ) : (
        <div className="table-container">
          {filteredVendors?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏪</div>
              <div className="empty-state-title">No vendors found</div>
              <div className="empty-state-text">
                {searchTerm ? 'Try a different search term' : 'Create your first vendor'}
              </div>
              <button className="btn btn-blue" onClick={handleCreate}>
                + Add Vendor
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Contact</th>
                  <th>Restaurants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors?.map((vendor) => (
                  <tr key={vendor._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {vendor.profileImage ? (
                          <img
                            src={vendor.profileImage}
                            alt={vendor.name}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--border)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--blue) 0%, var(--purple) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '18px',
                            }}
                          >
                            {vendor.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>
                            {vendor.name || 'N/A'}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            ID: {vendor._id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ marginBottom: '4px' }}>📧 {vendor.email}</div>
                        {vendor.phone && (
                          <div style={{ color: 'var(--text-secondary)' }}>
                            📱 {vendor.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: 'var(--bg)',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          fontSize: '14px',
                        }}>
                          🏪 {vendor.restaurants?.length || 0}
                        </span>
                        {vendor.restaurants?.length > 0 && (
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            restaurant{vendor.restaurants.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          vendor.isActive ? 'badge-green' : 'badge-red'
                        }`}
                      >
                        {vendor.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(vendor)}
                          title="Edit vendor"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(vendor._id)}
                          title="Delete vendor"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editMode ? 'Edit Vendor' : 'Create New Vendor'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Profile Image */}
              <div className="form-group">
                <label>Profile Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid var(--border)',
                      }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    style={{ flex: 1 }}
                  />
                  {uploading && <span>Uploading...</span>}
                </div>
              </div>

              {/* Personal Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="How the vendor will be displayed"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password {!editMode && '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editMode}
                  placeholder={editMode ? 'Leave blank to keep current password' : 'Enter secure password'}
                />
              </div>

              {/* Business Information */}
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid var(--border-light)' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Business Information</h3>
                
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    placeholder="Official business name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Business Type</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) =>
                        setFormData({ ...formData, businessType: e.target.value })
                      }
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="store">Store</option>
                      <option value="market">Market</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Business Category</label>
                    <select
                      value={formData.businessCategory}
                      onChange={(e) =>
                        setFormData({ ...formData, businessCategory: e.target.value })
                      }
                    >
                      {businessCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Business Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the business..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Street address"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="CA"
                    />
                  </div>
                  <div className="form-group">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Tax ID / EIN</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) =>
                        setFormData({ ...formData, taxId: e.target.value })
                      }
                      placeholder="XX-XXXXXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>License Number</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, licenseNumber: e.target.value })
                      }
                      placeholder="Business license #"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-blue" disabled={uploading || submitting}>
                  {uploading ? '📤 Uploading...' : submitting ? '⏳ Saving...' : editMode ? '💾 Update Vendor' : '➕ Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Vendors;
