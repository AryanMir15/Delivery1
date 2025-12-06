import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import Layout from '../components/Layout';

const GET_FOODS = gql`
  query GetFoods {
    foods {
      id
      title
      description
      image
      category {
        id
        title
      }
      restaurant {
        id
        name
      }
      variations {
        title
        price
        discounted
      }
      isOutOfStock
      isActive
      createdAt
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      title
    }
  }
`;

const UPDATE_FOOD = gql`
  mutation UpdateFood(
    $id: ID!
    $title: String
    $description: String
    $isOutOfStock: Boolean
    $isActive: Boolean
  ) {
    updateFood(
      id: $id
      title: $title
      description: $description
      isOutOfStock: $isOutOfStock
      isActive: $isActive
    ) {
      id
      title
      isActive
    }
  }
`;

const DELETE_FOOD = gql`
  mutation DeleteFood($id: ID!) {
    deleteFood(id: $id)
  }
`;

function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isOutOfStock: false,
    isActive: true,
  });

  const { data, loading, error, refetch } = useQuery(GET_FOODS);
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const [updateFood] = useMutation(UPDATE_FOOD);
  const [deleteFood] = useMutation(DELETE_FOOD);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      isOutOfStock: product.isOutOfStock,
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteFood({ variables: { id } });
        refetch();
        alert('Product deleted successfully!');
      } catch (err) {
        alert('Error deleting product: ' + err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateFood({
        variables: {
          id: selectedProduct.id,
          ...formData,
        },
      });
      setShowModal(false);
      refetch();
      alert('Product updated successfully!');
    } catch (err) {
      alert('Error updating product: ' + err.message);
    }
  };

  const filteredProducts = data?.foods?.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category?.id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Products Management</h1>
        <p className="page-subtitle">Manage food items and menu</p>
      </div>

      {loading && <div className="loading">Loading products...</div>}
      {error && <div className="error">Error: {error.message}</div>}

      {!loading && !error && (
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">All Products ({filteredProducts?.length || 0})</h3>
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              >
                <option value="all">All Categories</option>
                {categoriesData?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredProducts?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">No products found</div>
              <div className="empty-state-text">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No products in the system yet'}
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Restaurant</th>
                  <th>Price Range</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts?.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.title}</strong>
                      <br />
                      <small style={{ color: 'var(--text-secondary)' }}>
                        {product.description?.substring(0, 50)}
                        {product.description?.length > 50 ? '...' : ''}
                      </small>
                    </td>
                    <td>{product.category?.title || 'N/A'}</td>
                    <td>{product.restaurant?.name || 'N/A'}</td>
                    <td>
                      {product.variations?.length > 0
                        ? `$${Math.min(
                            ...product.variations.map((v) => v.discounted || v.price)
                          ).toFixed(2)} - $${Math.max(
                            ...product.variations.map((v) => v.price)
                          ).toFixed(2)}`
                        : 'N/A'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          product.isOutOfStock ? 'badge-red' : 'badge-green'
                        }`}
                      >
                        {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          product.isActive ? 'badge-green' : 'badge-red'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(product)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(product.id)}
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

      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Product</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Stock Status</label>
                <select
                  value={formData.isOutOfStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isOutOfStock: e.target.value === 'true',
                    })
                  }
                >
                  <option value="false">In Stock</option>
                  <option value="true">Out of Stock</option>
                </select>
              </div>
              <div className="form-group">
                <label>Active Status</label>
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

export default Products;
