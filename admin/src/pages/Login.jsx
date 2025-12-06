import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';

const ADMIN_LOGIN = gql`
  mutation OwnerLogin($email: String!, $password: String!) {
    ownerLogin(email: $email, password: $password) {
      userId
      token
      email
      userType
      name
    }
  }
`;

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [login, { loading }] = useMutation(ADMIN_LOGIN, {
    onCompleted: (data) => {
      if (data.ownerLogin) {
        localStorage.setItem('adminToken', data.ownerLogin.token);
        localStorage.setItem('adminUser', JSON.stringify(data.ownerLogin));
        navigate('/');
      }
    },
    onError: (err) => {
      setError(err.message || 'Login failed. Please check your credentials.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    login({
      variables: {
        email: formData.email,
        password: formData.password,
      },
    });
  };

  return (
    <div className="modern-login-page">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="login-branding">
          <div className="brand-logo">
            <span className="logo-icon">🚀</span>
            <h1>FoodAdmin</h1>
          </div>
          <h2 className="brand-title">Delivery Management System</h2>
          <p className="brand-description">
            Manage your entire food delivery platform from one powerful dashboard.
            Track orders, manage vendors, monitor analytics, and more.
          </p>
          <div className="brand-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Real-time Order Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Vendor Management</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Analytics & Reports</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>User Administration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your admin account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="login-demo">
            <div className="demo-badge">Demo Credentials</div>
            <div className="demo-info">
              <p><strong>Email:</strong> admin@test.com</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
          </div>

          <div className="login-footer">
            <p>© 2024 FoodAdmin. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
