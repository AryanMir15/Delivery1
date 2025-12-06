import React from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';

const GET_ANALYTICS = gql`
  query GetAnalytics {
    users {
      id
      role
      createdAt
    }
    vendors {
      _id
      isActive
    }
    allOrders(page: 1) {
      _id
      orderStatus
      orderAmount
      deliveryCharges
      orderDate
      paymentStatus
    }
    restaurants {
      id
      isActive
    }
  }
`;

function Analytics() {
  const { data, loading, error } = useQuery(GET_ANALYTICS);

  if (loading) return <Layout><div className="loading">Loading analytics...</div></Layout>;
  if (error) return <Layout><div className="error">Error: {error.message}</div></Layout>;

  // Calculate statistics
  const totalUsers = data?.users?.length || 0;
  const customers = data?.users?.filter((u) => u.role === 'customer').length || 0;
  const riders = data?.users?.filter((u) => u.role === 'rider').length || 0;
  const vendors = data?.vendors?.length || 0;
  const activeVendors = data?.vendors?.filter((v) => v.isActive).length || 0;
  const restaurants = data?.restaurants?.length || 0;
  const activeRestaurants = data?.restaurants?.filter((r) => r.isActive).length || 0;

  const orders = data?.allOrders || [];
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered').length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'cancelled').length;

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.orderAmount + o.deliveryCharges, 0);

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentOrders = orders.filter(
    (o) => new Date(o.orderDate) >= sevenDaysAgo
  ).length;
  const recentUsers = data?.users?.filter(
    (u) => new Date(u.createdAt) >= sevenDaysAgo
  ).length || 0;

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">Platform performance and insights</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">${totalRevenue.toFixed(2)}</div>
          <div className="stat-change positive">From {totalOrders} orders</div>
        </div>

        <div className="stat-card green">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-change positive">
            {recentOrders} in last 7 days
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-change positive">
            {recentUsers} new this week
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-label">Avg Order Value</div>
          <div className="stat-value">${avgOrderValue.toFixed(2)}</div>
          <div className="stat-change">Per order</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">User Statistics</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Users:</span>
              <strong>{totalUsers}</strong>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Customers:</span>
              <strong>{customers}</strong>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Riders:</span>
              <strong>{riders}</strong>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Vendors:</span>
              <strong>{vendors}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Vendors:</span>
              <strong>{activeVendors}</strong>
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <h3 className="table-title">Order Statistics</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Orders:</span>
              <strong>{totalOrders}</strong>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Pending:</span>
              <strong style={{ color: 'var(--blue)' }}>{pendingOrders}</strong>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivered:</span>
              <strong style={{ color: 'var(--green)' }}>{deliveredOrders}</strong>
            </div>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Cancelled:</span>
              <strong style={{ color: 'var(--red)' }}>{cancelledOrders}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Success Rate:</span>
              <strong>
                {totalOrders > 0
                  ? ((deliveredOrders / totalOrders) * 100).toFixed(1)
                  : 0}
                %
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">Restaurant Statistics</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Total Restaurants
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--blue)' }}>
                {restaurants}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Active Restaurants
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--green)' }}>
                {activeRestaurants}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Inactive Restaurants
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--red)' }}>
                {restaurants - activeRestaurants}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Analytics;
