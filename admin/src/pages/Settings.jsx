import React, { useState } from 'react';
import Layout from '../components/Layout';

function Settings() {
  const [settings, setSettings] = useState({
    siteName: 'Multi-Category Delivery Platform',
    siteEmail: 'admin@delivery.et',
    currency: 'ETB',
    taxRate: '15',
    deliveryFee: '50.00',
    minOrderAmount: '100.00',
    enableNotifications: true,
    enableEmailAlerts: true,
    maintenanceMode: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would save to backend
    console.log('Settings saved:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure system settings</p>
      </div>

      {saved && (
        <div className="success">
          ✅ Settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="table-container" style={{ marginBottom: '24px' }}>
          <div className="table-header">
            <h3 className="table-title">General Settings</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="form-group">
              <label>Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Site Email</label>
              <input
                type="email"
                value={settings.siteEmail}
                onChange={(e) =>
                  setSettings({ ...settings, siteEmail: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
              >
                <option value="ETB">ETB - Ethiopian Birr</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ marginBottom: '24px' }}>
          <div className="table-header">
            <h3 className="table-title">Order Settings</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.taxRate}
                onChange={(e) =>
                  setSettings({ ...settings, taxRate: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Default Delivery Fee (ETB)</label>
              <input
                type="number"
                step="0.01"
                value={settings.deliveryFee}
                onChange={(e) =>
                  setSettings({ ...settings, deliveryFee: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Minimum Order Amount (ETB)</label>
              <input
                type="number"
                step="0.01"
                value={settings.minOrderAmount}
                onChange={(e) =>
                  setSettings({ ...settings, minOrderAmount: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="table-container" style={{ marginBottom: '24px' }}>
          <div className="table-header">
            <h3 className="table-title">Notification Settings</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, enableNotifications: e.target.checked })
                  }
                  style={{ marginRight: '12px', width: '20px', height: '20px' }}
                />
                <span>Enable Push Notifications</span>
              </label>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) =>
                    setSettings({ ...settings, enableEmailAlerts: e.target.checked })
                  }
                  style={{ marginRight: '12px', width: '20px', height: '20px' }}
                />
                <span>Enable Email Alerts</span>
              </label>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ marginBottom: '24px' }}>
          <div className="table-header">
            <h3 className="table-title">System Settings</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  style={{ marginRight: '12px', width: '20px', height: '20px' }}
                />
                <span>Maintenance Mode</span>
              </label>
              <small style={{ color: 'var(--text-secondary)', marginLeft: '32px' }}>
                Enable this to put the platform in maintenance mode
              </small>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-blue" style={{ width: 'auto', padding: '14px 32px' }}>
          💾 Save Settings
        </button>
      </form>
    </Layout>
  );
}

export default Settings;
