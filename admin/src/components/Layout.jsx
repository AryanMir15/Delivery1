import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Store,
  Package,
  ShoppingCart,
  Bike,
  MapPin,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Rocket,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  User
} from 'lucide-react';

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const adminName = adminUser.name || 'Admin User';
  const adminEmail = adminUser.email || 'admin@test.com';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/categories', label: 'Categories', icon: FolderOpen },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/vendors', label: 'Vendors', icon: Store },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/riders', label: 'Delivery Agents', icon: Bike },
    { path: '/live-tracking', label: 'Live Tracking', icon: MapPin },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const notifications = [
    { id: 1, text: 'New order received', time: '2 min ago' },
    { id: 2, text: 'Vendor registration pending', time: '15 min ago' },
    { id: 3, text: 'System update available', time: '1 hour ago' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Rocket className="logo-icon" size={32} strokeWidth={2.5} />
            {!sidebarCollapsed && <span className="logo-text">Delivery Admin</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? 'active' : ''}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <IconComponent className="menu-icon" size={20} strokeWidth={2} />
                    {!sidebarCollapsed && <span className="menu-label">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <LogOut className="menu-icon" size={20} />
            {!sidebarCollapsed && <span className="menu-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Navigation Bar */}
        <header className="top-navbar">
          <div className="navbar-left">
            <h1 className="page-breadcrumb">
              {menuItems.find((item) => item.path === location.pathname)?.label ||
                'Dashboard'}
            </h1>
          </div>

          <div className="navbar-right">
            {/* Search */}
            <div className="navbar-search">
              <Search className="search-icon" size={18} />
              <input type="text" placeholder="Search..." />
            </div>

            {/* Notifications */}
            <div className="navbar-item">
              <button
                className="icon-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
              >
                <Bell className="icon" size={20} />
                <span className="badge">3</span>
              </button>
              {showNotifications && (
                <div className="dropdown-menu notifications-menu">
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                  </div>
                  <div className="dropdown-body">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="notification-item">
                        <p>{notif.text}</p>
                        <span className="time">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dropdown-footer">
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      View all notifications
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="navbar-item">
              <button
                className="user-profile-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
              >
                <div className="user-avatar">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name">{adminName}</span>
                  <span className="user-role">Administrator</span>
                </div>
                <ChevronDown className="dropdown-arrow" size={16} />
              </button>
              {showUserMenu && (
                <div className="dropdown-menu user-menu">
                  <div className="dropdown-header">
                    <div className="user-avatar large">
                      {adminName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{adminName}</h4>
                      <p>{adminEmail}</p>
                    </div>
                  </div>
                  <div className="dropdown-body">
                    <Link to="/settings" onClick={() => setShowUserMenu(false)}>
                      <Settings size={18} /> Settings
                    </Link>
                    <Link to="/settings" onClick={() => setShowUserMenu(false)}>
                      <User size={18} /> Profile
                    </Link>
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      <HelpCircle size={18} /> Help & Support
                    </a>
                  </div>
                  <div className="dropdown-footer">
                    <button onClick={handleLogout} className="logout-dropdown-btn">
                      <LogOut size={18} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">{children}</main>

        {/* Footer */}
        <footer className="main-footer">
          <div className="footer-content">
            <p>© 2024 Food Delivery Admin. All rights reserved.</p>
            <div className="footer-links">
              <a href="#" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              <span>•</span>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>
              <span>•</span>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Overlay for dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="dropdown-overlay"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
}

export default Layout;
