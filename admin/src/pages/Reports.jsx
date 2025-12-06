import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';

const GET_ORDERS_FOR_REPORT = gql`
  query GetOrdersForReport {
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
      orderStatus
      paymentMethod
      paymentStatus
      orderAmount
      deliveryCharges
      orderDate
    }
  }
`;

function Reports() {
  const [dateRange, setDateRange] = useState('all');
  const [reportType, setReportType] = useState('orders');

  const { data, loading, error } = useQuery(GET_ORDERS_FOR_REPORT);

  const filterOrdersByDate = (orders) => {
    if (!orders) return [];
    
    const now = new Date();
    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      
      switch (dateRange) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
    
    return filtered;
  };

  const filteredOrders = filterOrdersByDate(data?.allOrders);

  const generateReport = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      alert('No data available for the selected period');
      return;
    }

    const totalRevenue = filteredOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.orderAmount + o.deliveryCharges, 0);

    const reportData = {
      period: dateRange,
      totalOrders: filteredOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
      deliveredOrders: filteredOrders.filter((o) => o.orderStatus === 'delivered').length,
      cancelledOrders: filteredOrders.filter((o) => o.orderStatus === 'cancelled').length,
      generatedAt: new Date().toLocaleString(),
    };

    console.log('Report Generated:', reportData);
    alert(`Report Generated!\n\nTotal Orders: ${reportData.totalOrders}\nTotal Revenue: $${reportData.totalRevenue}\nDelivered: ${reportData.deliveredOrders}\nCancelled: ${reportData.cancelledOrders}`);
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and view system reports</p>
      </div>

      {loading && <div className="loading">Loading data...</div>}
      {error && <div className="error">Error: {error.message}</div>}

      {!loading && !error && (
        <>
          <div className="table-container" style={{ marginBottom: '24px' }}>
            <div className="table-header">
              <h3 className="table-title">Report Configuration</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="orders">Orders Report</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="users">Users Report</option>
                    <option value="vendors">Vendors Report</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-blue" onClick={generateReport}>
                📊 Generate Report
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{filteredOrders?.length || 0}</div>
              <div className="stat-change">In selected period</div>
            </div>

            <div className="stat-card green">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">
                $
                {filteredOrders
                  ?.filter((o) => o.paymentStatus === 'paid')
                  .reduce((sum, o) => sum + o.orderAmount + o.deliveryCharges, 0)
                  .toFixed(2) || '0.00'}
              </div>
              <div className="stat-change positive">Paid orders only</div>
            </div>

            <div className="stat-card green">
              <div className="stat-label">Delivered Orders</div>
              <div className="stat-value">
                {filteredOrders?.filter((o) => o.orderStatus === 'delivered').length || 0}
              </div>
              <div className="stat-change positive">Successfully completed</div>
            </div>

            <div className="stat-card red">
              <div className="stat-label">Cancelled Orders</div>
              <div className="stat-value">
                {filteredOrders?.filter((o) => o.orderStatus === 'cancelled').length || 0}
              </div>
              <div className="stat-change">Needs attention</div>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Recent Orders ({filteredOrders?.length || 0})</h3>
            </div>
            {filteredOrders?.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">No data available</div>
                <div className="empty-state-text">
                  No orders found for the selected period
                </div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders?.slice(0, 10).map((order) => (
                    <tr key={order._id}>
                      <td><strong>{order.orderId}</strong></td>
                      <td>{order.user?.name || 'N/A'}</td>
                      <td>{order.restaurant?.name || 'N/A'}</td>
                      <td>${(order.orderAmount + order.deliveryCharges).toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${
                          order.orderStatus === 'delivered' ? 'green' :
                          order.orderStatus === 'cancelled' ? 'red' : 'blue'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          order.paymentStatus === 'paid' ? 'badge-green' : 'badge-red'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

export default Reports;
