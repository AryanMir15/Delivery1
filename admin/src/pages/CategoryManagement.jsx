import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import Layout from '../components/Layout';

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      _id
      title
      description
      businessType
      icon
      color
      requiresPrescription
      allowsBulkOrders
      serviceType
      sortOrder
      isActive
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $isActive: Boolean!) {
    updateCategory(id: $id, isActive: $isActive) {
      _id
      isActive
    }
  }
`;

const CategoryManagement = () => {
  const { data, loading, refetch } = useQuery(GET_CATEGORIES);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);
  const [filter, setFilter] = useState('all');

  const categories = data?.categories || [];

  const handleToggleActive = async (categoryId, currentStatus) => {
    try {
      await updateCategory({
        variables: {
          id: categoryId,
          isActive: !currentStatus,
        },
      });
      refetch();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (filter === 'all') return true;
    if (filter === 'active') return cat.isActive;
    if (filter === 'inactive') return !cat.isActive;
    return cat.serviceType === filter;
  });

  const getCategoryIcon = (businessType) => {
    const icons = {
      grocery: '🛒',
      restaurant: '🍽️',
      pharmacy: '💊',
      electronics: '📱',
      fashion: '👕',
      furniture: '🛋️',
      flowers: '🌸',
      agriculture: '🌾',
      beverages: '☕',
      logistics: '📦',
      beauty: '💄',
      medical: '🏥',
      stationery: '✏️',
      pet_supplies: '🐾',
      automotive: '🚗',
    };
    return icons[businessType] || '📦';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl">Loading categories...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Category Management</h1>
          <p className="text-gray-600 mt-2">Manage all business categories across the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Categories</p>
                <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {categories.filter((c) => c.isActive).length}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Product-based</p>
                <p className="text-2xl font-bold text-blue-600">
                  {categories.filter((c) => c.serviceType === 'product').length}
                </p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Service-based</p>
                <p className="text-2xl font-bold text-purple-600">
                  {categories.filter((c) => c.serviceType === 'service' || c.serviceType === 'both').length}
                </p>
              </div>
              <div className="text-4xl">🔧</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'active'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'inactive'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
            <button
              onClick={() => setFilter('product')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'product'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setFilter('service')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'service'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Services
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-4xl mr-3">{getCategoryIcon(category.businessType)}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{category.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{category.businessType.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(category._id, category.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">{category.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                    {category.serviceType}
                  </span>
                  {category.requiresPrescription && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      Rx Required
                    </span>
                  )}
                  {category.allowsBulkOrders && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Bulk Orders
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Sort Order: {category.sortOrder}</span>
                  <button className="text-orange-500 hover:text-orange-600 font-medium">
                    Edit →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No categories found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryManagement;
