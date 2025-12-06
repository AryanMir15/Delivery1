import React from 'react';
import { gql, useQuery } from '@apollo/client';
import Layout from '../components/Layout';

const GET_STATS = gql`
  query GetStats {
    users {
      id
    }
    vendors {
      _id
    }
    allOrders(page: 1) {
      id
      orderStatus
    }
  }
`;

function Dashboard() {
  const { data, loading, error } = useQuery(GET_STATS);

  const stats = {
    totalUsers: data?.users?.length || 0,
    totalVendors: data?.vendors?.length || 0,
    activeOrders: data?.allOrders?.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length || 0,
    totalOrders: data?.allOrders?.length || 0,
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome to your delivery management system</p>
      </div>

      {loading && <div className="loading">Loading statistics...</div>}
      {error && <div className="error">Error loading data: {error.message}</div>}

      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-change positive">+12% from last month</div>
            </div>

            <div className="stat-card green">
              <div className="stat-label">Total Vendors</div>
              <div className="stat-value">{stats.totalVendors}</div>
              <div className="stat-change positive">+8% from last month</div>
            </div>

            <div className="stat-card red">
              <div className="stat-label">Active Orders</div>
              <div className="stat-value">{stats.activeOrders}</div>
              <div className="stat-change">Needs attention</div>
            </div>

            <div className="stat-card blue">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders}</div>
              <div className="stat-change positive">+25% from last month</div>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <h3 className="table-title">Recent Orders</h3>
              <button className="btn-sm btn-blue">View All</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.allOrders?.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(0, 8)}</td>
                    <td>Customer Name</td>
                    <td>
                      <span className={`badge badge-${
                        order.orderStatus === 'DELIVERED' ? 'green' :
                        order.orderStatus === 'CANCELLED' ? 'red' : 'blue'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>$0.00</td>
                    <td>{new Date().toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Dashboard;
