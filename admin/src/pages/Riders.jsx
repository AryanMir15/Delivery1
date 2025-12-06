import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import Layout from '../components/Layout';

const GET_RIDERS = gql`
  query GetRiders {
    users {
      id
      _id
      name
      email
      phone
      role
      profileImage
      vehicleType
      licenseNumber
      vehicleNumber
      available
      isActive
      createdAt
    }
  }
`;

const CREATE_RIDER = gql`
  mutation Register(
    $name: String!
    $email: String!
    $phone: String
    $password: String!
    $role: String
    $vehicleType: String
    $licenseNumber: String
    $vehicleNumber: String
  ) {
    register(
      name: $name
      email: $email
      phone: $phone
      password: $password
      role: $role
      vehicleType: $vehicleType
      licenseNumber: $licenseNumber
      vehicleNumber: $vehicleNumber
    ) {
      userId
      token
      name
      email
      isActive
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $userInput: UserInput) {
    updateUser(id: $id, userInput: $userInput) {
      id
      name
      email
      phone
      vehicleType
      licenseNumber
      vehicleNumber
      isActive
    }
  }
`;

function Riders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Bulk operations
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Sorting
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'bike',
    licenseNumber: '',
    vehicleNumber: '',
  });

  const { data, loading, error, refetch } = useQuery(GET_RIDERS);
  const [createRider] = useMutation(CREATE_RIDER);
  const [updateUser] = useMutation(UPDATE_USER);

  // Filter riders (case-insensitive)
  const riders = data?.users?.filter((user) => 
    user.role?.toLowerCase() === 'rider'
  ) || [];

  const vehicleTypes = [
    { value: 'bike', label: '🏍️ Motorcycle', icon: '🏍️' },
    { value: 'bicycle', label: '🚲 Bicycle', icon: '🚲' },
    { value: 'car', label: '🚗 Car', icon: '🚗' },
    { value: 'scooter', label: '🛵 Scooter', icon: '🛵' },
    { value: 'van', label: '🚐 Van', icon: '🚐' },
  ];

  // Handler functions
  const handleCreate = () => {
    setEditMode(false);
    setFormData({
      id: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      vehicleType: 'bike',
      licenseNumber: '',
      vehicleNumber: '',
    });
    setShowModal(true);
  };

  const handleEdit = (rider) => {
    setEditMode(true);
    setFormData({
      id: rider.id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone || '',
      password: '',
      vehicleType: rider.vehicleType || 'bike',
      licenseNumber: rider.licenseNumber || '',
      vehicleNumber: rider.vehicleNumber || '',
    });
    setShowModal(true);
  };

  const handleViewDetails = (rider) => {
    setSelectedRider(rider);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = async (riderId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this rider?`)) {
      return;
    }
    
    try {
      await updateUser({
        variables: {
          id: riderId,
          userInput: {
            isActive: !currentStatus,
          },
        },
      });
      await refetch();
      alert(`✅ Rider ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('❌ Error updating status: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editMode) {
        // Update existing rider
        const userInput = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          vehicleType: formData.vehicleType,
          licenseNumber: formData.licenseNumber,
          vehicleNumber: formData.vehicleNumber,
        };

        console.log('Updating rider:', userInput);
        await updateUser({
          variables: {
            id: formData.id,
            userInput,
          },
        });
        alert('✅ Rider updated successfully!');
      } else {
        // Create new rider
        console.log('Creating rider:', formData);
        await createRider({
          variables: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: 'rider',
            vehicleType: formData.vehicleType,
            licenseNumber: formData.licenseNumber,
            vehicleNumber: formData.vehicleNumber,
          },
        });
        alert('✅ Rider created successfully!');
      }

      setShowModal(false);
      await refetch();
    } catch (err) {
      console.error('Error saving rider:', err);
      const errorMessage = err.message || err.graphQLErrors?.[0]?.message || 'Failed to save rider';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk operations handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRiders(filteredRiders.map(r => r.id));
    } else {
      setSelectedRiders([]);
    }
  };

  const handleSelectRider = (riderId) => {
    setSelectedRiders(prev => 
      prev.includes(riderId) 
        ? prev.filter(id => id !== riderId)
        : [...prev, riderId]
    );
  };

  const handleBulkActivate = async () => {
    if (!window.confirm(`Activate ${selectedRiders.length} selected riders?`)) return;
    
    try {
      for (const riderId of selectedRiders) {
        await updateUser({
          variables: {
            id: riderId,
            userInput: { isActive: true }
          }
        });
      }
      await refetch();
      setSelectedRiders([]);
      alert(`✅ ${selectedRiders.length} riders activated successfully!`);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!window.confirm(`Deactivate ${selectedRiders.length} selected riders?`)) return;
    
    try {
      for (const riderId of selectedRiders) {
        await updateUser({
          variables: {
            id: riderId,
            userInput: { isActive: false }
          }
        });
      }
      await refetch();
      setSelectedRiders([]);
      alert(`✅ ${selectedRiders.length} riders deactivated successfully!`);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Vehicle Type', 'License Number', 'Vehicle Number', 'Status', 'Availability', 'Joined Date'];
    const csvData = filteredRiders.map(rider => [
      rider.name,
      rider.email,
      rider.phone || 'N/A',
      rider.vehicleType || 'N/A',
      rider.licenseNumber || 'N/A',
      rider.vehicleNumber || 'N/A',
      rider.isActive ? 'Active' : 'Inactive',
      rider.available ? 'Available' : 'Offline',
      new Date(rider.createdAt).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('✅ CSV exported successfully!');
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters
  const filteredRiders = riders?.filter((rider) => {
    const matchesSearch = rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.phone?.includes(searchTerm);
    const matchesVehicle = vehicleFilter === 'all' || rider.vehicleType === vehicleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && rider.isActive) ||
                         (statusFilter === 'inactive' && !rider.isActive);
    return matchesSearch && matchesVehicle && matchesStatus;
  });

  // Apply sorting
  const sortedRiders = [...(filteredRiders || [])].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'name' || sortField === 'email') {
      aVal = aVal?.toLowerCase() || '';
      bVal = bVal?.toLowerCase() || '';
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Apply pagination
  const totalPages = Math.ceil(sortedRiders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRiders = sortedRiders.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, vehicleFilter, statusFilter]);

  // Debug logging
  console.log('🏍️ Riders Debug:', {
    totalUsers: data?.users?.length,
    riderUsers: riders?.length,
    filteredRiders: filteredRiders?.length,
    loading,
    error: error?.message
  });

  return (
    <Layout>
      <div className="page-header">
        <h1>Delivery Agents</h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {selectedRiders.length > 0 && (
            <>
              <button 
                className="btn btn-green" 
                onClick={handleBulkActivate}
                title="Activate selected riders"
              >
                ✅ Activate ({selectedRiders.length})
              </button>
              <button 
                className="btn btn-red" 
                onClick={handleBulkDeactivate}
                title="Deactivate selected riders"
              >
                🚫 Deactivate ({selectedRiders.length})
              </button>
              <button 
                className="btn btn-cancel" 
                onClick={() => setSelectedRiders([])}
                title="Clear selection"
              >
                ✕ Clear
              </button>
            </>
          )}
          <button 
            className="btn btn-green" 
            onClick={handleExportCSV}
            disabled={loading || filteredRiders?.length === 0}
            title="Export to CSV"
          >
            📥 Export CSV
          </button>
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
            + Add Rider
          </button>
        </div>
      </div>

      {/* Statistics Card */}
      <div style={{
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
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
            {riders?.length || 0}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Riders</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
            {riders?.filter(r => r.isActive).length || 0}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Riders</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
            {riders?.filter(r => r.available).length || 0}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Available Now</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>
            {riders?.filter(r => !r.isActive).length || 0}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Inactive</div>
        </div>
      </div>

      {/* Vehicle Type Breakdown */}
      <div style={{
        background: 'var(--white)',
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow)',
      }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          🚗 Vehicle Type Distribution
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {vehicleTypes.map(vt => {
            const count = riders?.filter(r => r.vehicleType === vt.value).length || 0;
            const percentage = riders?.length ? ((count / riders.length) * 100).toFixed(1) : 0;
            return (
              <div 
                key={vt.value}
                style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '16px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '2px solid var(--border)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--blue)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => setVehicleFilter(vt.value)}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>
                  {vt.icon}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', textAlign: 'center', marginBottom: '4px' }}>
                  {count}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                  {vt.label.split(' ')[1]}
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'var(--border)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--green) 0%, var(--green-dark) 100%)',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                  {percentage}%
                </div>
              </div>
            );
          })}
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
            placeholder="🔍 Search by name, email, or phone..."
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
        <div style={{ minWidth: '180px' }}>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Vehicles</option>
            {vehicleTypes.map((vt) => (
              <option key={vt.value} value={vt.value}>
                {vt.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: '150px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
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
          📊 {filteredRiders?.length || 0} rider{filteredRiders?.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <div>Loading riders...</div>
        </div>
      ) : error ? (
        <div className="error">
          <strong>Error loading riders:</strong> {error.message}
        </div>
      ) : (
        <div className="table-container">
          {filteredRiders?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏍️</div>
              <div className="empty-state-title">No riders found</div>
              <div className="empty-state-text">
                {searchTerm ? 'Try a different search term' : 'Create your first delivery agent'}
              </div>
              <button className="btn btn-blue" onClick={handleCreate}>
                + Add Rider
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRiders.length === paginatedRiders.length && paginatedRiders.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort"
                  >
                    Rider {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('email')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort"
                  >
                    Contact {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Vehicle Info</th>
                  <th>Availability</th>
                  <th 
                    onClick={() => handleSort('isActive')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort"
                  >
                    Status {sortField === 'isActive' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRiders?.map((rider) => (
                  <tr key={rider.id} style={{ 
                    background: selectedRiders.includes(rider.id) ? 'rgba(79, 70, 229, 0.05)' : 'transparent' 
                  }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRiders.includes(rider.id)}
                        onChange={() => handleSelectRider(rider.id)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {rider.profileImage ? (
                          <img
                            src={rider.profileImage}
                            alt={rider.name}
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
                              background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '18px',
                            }}
                          >
                            {rider.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>
                            {rider.name}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            ID: {rider._id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ marginBottom: '4px' }}>📧 {rider.email}</div>
                        {rider.phone && (
                          <div style={{ color: 'var(--text-secondary)' }}>
                            📱 {rider.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span className="badge badge-blue">
                            {vehicleTypes.find(v => v.value === rider.vehicleType)?.icon || '🚗'} {rider.vehicleType?.toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        {rider.licenseNumber && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            License: {rider.licenseNumber}
                          </div>
                        )}
                        {rider.vehicleNumber && (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Vehicle: {rider.vehicleNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          rider.available ? 'badge-green' : 'badge-red'
                        }`}
                      >
                        {rider.available ? '✓ Available' : '✗ Offline'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          rider.isActive ? 'badge-green' : 'badge-red'
                        }`}
                      >
                        {rider.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleViewDetails(rider)}
                          title="View details"
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(rider)}
                          title="Edit rider"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={`btn-icon ${
                            rider.isActive ? 'btn-delete' : 'btn-edit'
                          }`}
                          onClick={() => handleToggleStatus(rider.id, rider.isActive)}
                          title={rider.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {rider.isActive ? '🚫' : '✅'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {sortedRiders.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderTop: '2px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedRiders.length)} of {sortedRiders.length} riders
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '6px 12px',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="btn-sm btn-blue"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  ⏮️ First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn-sm btn-blue"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  ◀️ Prev
                </button>
                
                {/* Page numbers */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className="btn-sm"
                        style={{
                          background: currentPage === pageNum ? 'var(--blue)' : 'var(--bg)',
                          color: currentPage === pageNum ? 'white' : 'var(--text)',
                          border: '2px solid',
                          borderColor: currentPage === pageNum ? 'var(--blue)' : 'var(--border)',
                          minWidth: '40px',
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-sm btn-blue"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next ▶️
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="btn-sm btn-blue"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Last ⏭️
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editMode ? 'Edit Delivery Agent' : 'Register New Delivery Agent'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter rider's full name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="rider@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Password {!editMode && '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editMode}
                  placeholder={editMode ? 'Leave blank to keep current password' : 'Enter secure password'}
                />
              </div>

              {/* Vehicle Information */}
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid var(--border-light)' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                  🚗 Vehicle Information
                </h3>
                
                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    required
                  >
                    {vehicleTypes.map((vt) => (
                      <option key={vt.value} value={vt.value}>
                        {vt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>License Number</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="DL123456789"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      placeholder="ABC-1234"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-blue" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : editMode ? '💾 Update Rider' : '➕ Create Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRider && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rider Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                👤 Personal Information
              </h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Name:</strong> {selectedRider.name}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Email:</strong> {selectedRider.email}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Phone:</strong> {selectedRider.phone || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Joined:</strong>{' '}
                {new Date(selectedRider.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                🚗 Vehicle Information
              </h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Vehicle Type:</strong>{' '}
                {vehicleTypes.find(v => v.value === selectedRider.vehicleType)?.label || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>License Number:</strong> {selectedRider.licenseNumber || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Vehicle Number:</strong> {selectedRider.vehicleNumber || 'N/A'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                📊 Status
              </h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Account Status:</strong>{' '}
                <span
                  className={`badge ${
                    selectedRider.isActive ? 'badge-green' : 'badge-red'
                  }`}
                >
                  {selectedRider.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Availability:</strong>{' '}
                <span
                  className={`badge ${
                    selectedRider.available ? 'badge-green' : 'badge-red'
                  }`}
                >
                  {selectedRider.available ? '✓ Available' : '✗ Offline'}
                </span>
              </p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedRider);
                }}
              >
                ✏️ Edit Rider
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Riders;
