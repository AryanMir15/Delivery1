import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import Layout from '../components/Layout';

const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    allOrders(page: 1) {
      _id
      orderId
      user {
        name
        email
      }
      restaurant {
        name
      }
      rider {
        name
      }
      orderStatus
      paymentMethod
      paymentStatus
      orderAmount
      deliveryCharges
      orderDate
      items {
        title
        quantity
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $orderStatus: String!, $reason: String) {
    updateOrderStatus(id: $id, orderStatus: $orderStatus, reason: $reason) {
      _id
      orderStatus
    }
  }
`;

function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_ALL_ORDERS);
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({
        variables: {
          id: orderId,
          orderStatus: newStatus,
        },
      });
      refetch();
      alert('Order status updated successfully!');
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredOrders = data?.allOrders?.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.orderStatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const statusMap = {
      pending: 'blue',
      accepted: 'blue',
      preparing: 'blue',
      ready: 'green',
      picked: 'green',
      delivered: 'green',
      cancelled: 'red',
    };
    return statusMap[status.toLowerCase()] || 'blue';
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Orders Management</h1>
        <p className="page-subtitle">Track and manage all orders</p>
      </div>

      {loading && <div className="loading">Loading orders...</div>}
      {error && <div className="error">Error: {error.message}</div>}

      {!loading && !error && (
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">All Orders ({filteredOrders?.length || 0})</h3>
            <div className="table-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="picked">Picked</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {filteredOrders?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-title">No orders found</div>
              <div className="empty-state-text">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No orders in the system yet'}
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders?.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <strong>{order.orderId}</strong>
                    </td>
                    <td>{order.user?.name || 'N/A'}</td>
                    <td>{order.restaurant?.name || 'N/A'}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>${(order.orderAmount + order.deliveryCharges).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          order.paymentStatus === 'paid' ? 'badge-green' : 'badge-red'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleViewDetails(order)}
                        >
                          👁️ View
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

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Order Details - {selectedOrder.orderId}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>Customer Information</h3>
              <p>
                <strong>Name:</strong> {selectedOrder.user?.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedOrder.user?.email}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>Order Items</h3>
              {selectedOrder.items?.map((item, index) => (
                <p key={index}>
                  {item.quantity}x {item.title}
                </p>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>Payment Details</h3>
              <p>
                <strong>Subtotal:</strong> ${selectedOrder.orderAmount.toFixed(2)}
              </p>
              <p>
                <strong>Delivery:</strong> ${selectedOrder.deliveryCharges.toFixed(2)}
              </p>
              <p>
                <strong>Total:</strong> $
                {(selectedOrder.orderAmount + selectedOrder.deliveryCharges).toFixed(2)}
              </p>
              <p>
                <strong>Method:</strong> {selectedOrder.paymentMethod}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>Update Status</h3>
              <select
                value={selectedOrder.orderStatus}
                onChange={(e) => {
                  handleStatusChange(selectedOrder._id, e.target.value);
                  setShowModal(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '15px',
                }}
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="picked">Picked</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Orders;
