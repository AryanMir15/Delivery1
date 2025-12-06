import React, { useState, useEffect, useRef } from 'react';
import { gql, useQuery } from '@apollo/client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '../components/Layout';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GET_ACTIVE_DELIVERIES = gql`
  query GetActiveDeliveries {
    allOrders(page: 1) {
      id
      _id
      orderStatus
      deliveryAddress
      user {
        id
        name
        phone
      }
      rider {
        id
        name
        phone
        currentLocation {
          coordinates
        }
        available
        vehicleType
      }
      restaurant {
        id
        name
        address
        location {
          coordinates
        }
      }
      createdAt
    }
  }
`;

const GET_ALL_RIDERS = gql`
  query GetAllRiders {
    users {
      id
      _id
      name
      email
      phone
      role
      vehicleType
      available
      isActive
      currentLocation {
        coordinates
      }
    }
  }
`;

// Custom marker icons
const createCustomIcon = (emoji, color) => {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Map controller component
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

function LiveTracking() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRider, setSelectedRider] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default: New York
  const [zoom, setZoom] = useState(12);
  const [viewMode, setViewMode] = useState('all');

  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useQuery(GET_ACTIVE_DELIVERIES, {
    pollInterval: 10000,
  });

  const { data: ridersData, loading: ridersLoading, refetch: refetchRiders } = useQuery(GET_ALL_RIDERS, {
    pollInterval: 5000,
  });

  const riders = ridersData?.users?.filter(u => u.role?.toLowerCase() === 'rider') || [];
  const activeRiders = riders.filter(r => r.isActive && r.available);
  const ridersWithLocation = riders.filter(r => r.currentLocation?.coordinates?.length === 2);

  const activeDeliveries = ordersData?.allOrders?.filter(o => 
    ['PENDING', 'ACCEPTED', 'PICKED', 'ASSIGNED'].includes(o.orderStatus) && o.rider
  ) || [];

  useEffect(() => {
    const interval = setInterval(() => {
      refetchOrders();
      refetchRiders();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchOrders, refetchRiders]);

  // Auto-center map on first rider with location
  useEffect(() => {
    if (ridersWithLocation.length > 0 && mapCenter[0] === 40.7128) {
      const firstRider = ridersWithLocation[0];
      setMapCenter([
        firstRider.currentLocation.coordinates[1],
        firstRider.currentLocation.coordinates[0]
      ]);
    }
  }, [ridersWithLocation, mapCenter]);

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#F59E0B',
      'ACCEPTED': '#3B82F6',
      'ASSIGNED': '#8B5CF6',
      'PICKED': '#10B981',
      'DELIVERED': '#059669',
      'CANCELLED': '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getVehicleIcon = (vehicleType) => {
    const icons = {
      'bike': '🏍️',
      'bicycle': '🚲',
      'car': '🚗',
      'scooter': '🛵',
      'van': '🚐',
    };
    return icons[vehicleType] || '🚗';
  };

  const handleRiderClick = (rider) => {
    setSelectedRider(rider);
    if (rider.currentLocation?.coordinates?.length === 2) {
      setMapCenter([
        rider.currentLocation.coordinates[1],
        rider.currentLocation.coordinates[0]
      ]);
      setZoom(15);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    if (order.rider?.currentLocation?.coordinates?.length === 2) {
      setMapCenter([
        order.rider.currentLocation.coordinates[1],
        order.rider.currentLocation.coordinates[0]
      ]);
      setZoom(14);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>🗺️ Live Tracking & Location Control</h1>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-green" 
            onClick={() => {
              refetchOrders();
              refetchRiders();
            }}
          >
            🔄 Refresh
          </button>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: '10px 16px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Riders</option>
            <option value="active">Active Deliveries</option>
            <option value="available">Available Riders</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          color: 'white',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>
            {activeDeliveries.length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Deliveries</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          color: 'white',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>
            {activeRiders.length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Available Riders</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          color: 'white',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>
            {ridersWithLocation.length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Riders with GPS</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          color: 'white',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>
            {riders.length}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Riders</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Map Area */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          minHeight: '600px',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '2px solid var(--border-light)',
            background: 'var(--bg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              📍 Live Map View (OpenStreetMap)
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Auto-refresh: 5s • {ridersWithLocation.length} riders tracked
            </div>
          </div>

          {/* Leaflet Map */}
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: '550px', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={zoom} />

            {/* Rider Markers */}
            {ridersWithLocation.map((rider) => {
              const position = [
                rider.currentLocation.coordinates[1],
                rider.currentLocation.coordinates[0]
              ];
              const color = rider.available ? '#10B981' : '#EF4444';
              const icon = createCustomIcon(getVehicleIcon(rider.vehicleType), color);

              return (
                <Marker
                  key={rider.id}
                  position={position}
                  icon={icon}
                  eventHandlers={{
                    click: () => handleRiderClick(rider)
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                        {getVehicleIcon(rider.vehicleType)} {rider.name}
                      </h4>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Status:</strong>{' '}
                        <span style={{ color: rider.available ? '#10B981' : '#EF4444' }}>
                          {rider.available ? '✓ Available' : '✗ Busy'}
                        </span>
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Vehicle:</strong> {rider.vehicleType?.toUpperCase()}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Phone:</strong> {rider.phone || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6B7280' }}>
                        📍 {position[0].toFixed(4)}, {position[1].toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Restaurant Markers for Active Deliveries */}
            {activeDeliveries.map((order) => {
              if (!order.restaurant?.location?.coordinates) return null;
              
              const position = [
                order.restaurant.location.coordinates[1],
                order.restaurant.location.coordinates[0]
              ];
              const icon = createCustomIcon('🏪', '#8B5CF6');

              return (
                <Marker
                  key={`restaurant-${order.id}`}
                  position={position}
                  icon={icon}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                        🏪 {order.restaurant.name}
                      </h4>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Order:</strong> #{order._id.slice(-6)}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Status:</strong>{' '}
                        <span style={{ color: getStatusColor(order.orderStatus) }}>
                          {order.orderStatus}
                        </span>
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        <strong>Address:</strong> {order.restaurant.address}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Delivery Routes */}
            {activeDeliveries.map((order) => {
              if (!order.rider?.currentLocation?.coordinates || 
                  !order.restaurant?.location?.coordinates) return null;

              const riderPos = [
                order.rider.currentLocation.coordinates[1],
                order.rider.currentLocation.coordinates[0]
              ];
              const restaurantPos = [
                order.restaurant.location.coordinates[1],
                order.restaurant.location.coordinates[0]
              ];

              return (
                <Polyline
                  key={`route-${order.id}`}
                  positions={[restaurantPos, riderPos]}
                  color={getStatusColor(order.orderStatus)}
                  weight={3}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              );
            })}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Deliveries */}
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow)',
            maxHeight: '400px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '2px solid var(--border-light)',
              background: 'var(--bg)',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                🚚 Active Deliveries ({activeDeliveries.length})
              </h3>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {ordersLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading...
                </div>
              ) : activeDeliveries.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                  <div>No active deliveries</div>
                </div>
              ) : (
                activeDeliveries.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: selectedOrder?.id === order.id ? 'var(--bg)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOrder?.id !== order.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>
                        Order #{order._id.slice(-6)}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: getStatusColor(order.orderStatus) + '20',
                          color: getStatusColor(order.orderStatus),
                        }}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      👤 {order.user?.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      🏍️ {order.rider?.name || 'No rider'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      🏪 {order.restaurant?.name || 'Restaurant'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Riders */}
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow)',
            maxHeight: '400px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '2px solid var(--border-light)',
              background: 'var(--bg)',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                🏍️ Available Riders ({activeRiders.length})
              </h3>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {ridersLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading...
                </div>
              ) : activeRiders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏍️</div>
                  <div>No available riders</div>
                </div>
              ) : (
                activeRiders.map((rider) => (
                  <div
                    key={rider.id}
                    onClick={() => handleRiderClick(rider)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: selectedRider?.id === rider.id ? 'var(--bg)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRider?.id !== rider.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}>
                        {getVehicleIcon(rider.vehicleType)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                          {rider.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {rider.vehicleType?.toUpperCase() || 'N/A'}
                          {rider.currentLocation?.coordinates?.length === 2 && ' • 📍 GPS Active'}
                        </div>
                      </div>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--green)',
                        boxShadow: '0 0 8px var(--green)',
                      }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📦 Order Details</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                Order Information
              </h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Order ID:</strong> #{selectedOrder._id.slice(-8)}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Status:</strong>{' '}
                <span
                  className="badge"
                  style={{
                    background: getStatusColor(selectedOrder.orderStatus) + '20',
                    color: getStatusColor(selectedOrder.orderStatus),
                  }}
                >
                  {selectedOrder.orderStatus}
                </span>
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                👤 Customer
              </h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Phone:</strong> {selectedOrder.user?.phone || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Address:</strong> {selectedOrder.deliveryAddress || 'N/A'}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                🏍️ Rider
              </h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Name:</strong> {selectedOrder.rider?.name || 'Not assigned'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Phone:</strong> {selectedOrder.rider?.phone || 'N/A'}
              </p>
              {selectedOrder.rider?.currentLocation?.coordinates?.length === 2 && (
                <p style={{ marginBottom: '8px' }}>
                  <strong>Location:</strong> 📍 {selectedOrder.rider.currentLocation.coordinates[1].toFixed(4)}, {selectedOrder.rider.currentLocation.coordinates[0].toFixed(4)}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                🏪 Restaurant
              </h3>
              <p style={{ marginBottom: '8px' }}>
                <strong>Name:</strong> {selectedOrder.restaurant?.name || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Address:</strong> {selectedOrder.restaurant?.address || 'N/A'}
              </p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Rider Details Modal */}
      {selectedRider && (
        <div className="modal-overlay" onClick={() => setSelectedRider(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🏍️ Rider Location</h2>
              <button className="modal-close" onClick={() => setSelectedRider(null)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                Rider Information
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
                <strong>Vehicle:</strong> {getVehicleIcon(selectedRider.vehicleType)} {selectedRider.vehicleType?.toUpperCase() || 'N/A'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Status:</strong>{' '}
                <span className={`badge ${selectedRider.available ? 'badge-green' : 'badge-red'}`}>
                  {selectedRider.available ? '✓ Available' : '✗ Busy'}
                </span>
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
                📍 GPS Location
              </h3>
              {selectedRider.currentLocation?.coordinates?.length === 2 ? (
                <>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Latitude:</strong> {selectedRider.currentLocation.coordinates[1].toFixed(6)}
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Longitude:</strong> {selectedRider.currentLocation.coordinates[0].toFixed(6)}
                  </p>
                  <p style={{ marginBottom: '8px', color: 'var(--green)', fontWeight: '600' }}>
                    ✓ GPS Active - Location updating every 5 seconds
                  </p>
                </>
              ) : (
                <p style={{ color: 'var(--red)' }}>
                  ✗ No GPS location available
                </p>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-blue"
                onClick={() => setSelectedRider(null)}
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

export default LiveTracking;
