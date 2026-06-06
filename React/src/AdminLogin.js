import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminSession } from './adminApi';
import { supabase } from './supabaseClient';
import './AdminLogin.css';

const logoUrl = 'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) setChecking(false);
        return;
      }

      try {
        await getAdminSession();
        if (active) navigate('/admin/dashboard', { replace: true });
      } catch (_error) {
        await supabase.auth.signOut({ scope: 'local' });
        if (active) setChecking(false);
      }
    }

    checkExistingSession();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setMessage('Enter admin email and password.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message || 'Login failed.');
      setLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setMessage('Session not established. Please try again.');
      setLoading(false);
      return;
    }

    try {
      await getAdminSession();
      navigate('/admin/dashboard', { replace: true });
    } catch (adminError) {
      await supabase.auth.signOut({ scope: 'local' });
      setMessage(adminError.message || 'Admin access required.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="admin-login-root">
        <div className="admin-login-card admin-login-loading">Checking admin session...</div>
      </div>
    );
  }

  return (
    <div className="admin-login-root">
      <button className="admin-back-btn" onClick={() => navigate('/')}>
        Back to Home
      </button>

      <section className="admin-login-card">
        <div className="admin-login-logo-row">
          <img src={logoUrl} alt="DataWiz" className="admin-login-logo" />
          <span className="admin-login-brand">DataWiz Admin</span>
        </div>

        <h1 className="admin-login-title">Admin Login</h1>
        <p className="admin-login-subtitle">Sign in with the admin account to manage mock tests and payments.</p>

        <form className="admin-login-form" onSubmit={handleLogin}>
          <label className="admin-login-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <div className="admin-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="admin-toggle-password"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {message && <div className="admin-login-message">{message}</div>}

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </div>
  );
}
