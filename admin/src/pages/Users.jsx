import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import Layout from '../components/Layout';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      _id
      name
      email
      phone
      role
      isActive
      createdAt
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
      isActive
    }
  }
`;

function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    isActive: true,
  });

  const { data, loading, error, refetch } = useQuery(GET_USERS);
  const [updateUser] = useMutation(UPDATE_USER);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser({
        variables: {
          id: selectedUser.id,
          userInput: formData,
        },
      });
      setShowModal(false);
      refetch();
      alert('User updated successfully!');
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  const filteredUsers = data?.users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Users Management</h1>
        <p className="page-subtitle">Manage all platform users</p>
      </div>

      {loading && <div className="loading">Loading users...</div>}
      {error && <div className="error">Error: {error.message}</div>}

      {!loading && !error && (
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">All Users ({filteredUsers?.length || 0})</h3>
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredUsers?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No users found</div>
              <div className="empty-state-text">
                {searchTerm ? 'Try a different search term' : 'No users in the system yet'}
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers?.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>
                      <span className={`badge badge-blue`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          user.isActive ? 'badge-green' : 'badge-red'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(user)}
                        >
                          ✏️ Edit
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
              <h2 className="modal-title">Edit User</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
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
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.value === 'true' })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-blue">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Users;
