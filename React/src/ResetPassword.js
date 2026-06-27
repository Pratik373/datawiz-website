import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './LoginPage.css'; // reuse same styles

/* ─── Password strength helpers (same as LoginPage) ─── */
const passwordRules = [
  { id: 'len',    label: 'At least 8 characters',         test: (p) => p.length >= 8 },
  { id: 'upper',  label: 'One uppercase letter (A–Z)',     test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',  label: 'One lowercase letter (a–z)',     test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0–9)',               test: (p) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'One special character (!@#$…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthLevel(password) {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: 0, label: 'Very Weak',  color: '#ff4d6a' };
  if (passed === 2) return { level: 1, label: 'Weak',       color: '#ff884d' };
  if (passed === 3) return { level: 2, label: 'Fair',       color: '#ffd04d' };
  if (passed === 4) return { level: 3, label: 'Strong',     color: '#4dcb7f' };
  return               { level: 4, label: 'Very Strong', color: '#4ab9ff' };
}

const logoUrl = '/assets/logo.jpeg';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [ready, setReady]                   = useState(false); // true once recovery session confirmed
  const [invalid, setInvalid]               = useState(false); // true if link is bad/expired
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirmPw, setShowConfirmPw]   = useState(false);
  const [pwFocused, setPwFocused]           = useState(false);
  const [loading, setLoading]               = useState(false);
  const [message, setMessage]               = useState('');
  const [messageType, setMessageType]       = useState('');
  const [done, setDone]                     = useState(false);

  const strength = getStrengthLevel(password);

  /* ─────────────────────────────────────────────
     Detect PASSWORD_RECOVERY event from Supabase.
     The magic token is in the URL hash; Supabase
     processes it automatically via onAuthStateChange.
  ───────────────────────────────────────────── */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          // Recovery token is valid — show the form
          setReady(true);
        } else if (event === 'SIGNED_IN' && !ready) {
          // Some browsers fire SIGNED_IN right after PASSWORD_RECOVERY;
          // if we already flagged ready just continue
        }
      }
    );

    // Also check if Supabase already processed the hash before this component mounted
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        // No session found after a short wait — link is probably bad/expired
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!s) setInvalid(true);
          });
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Submit new password ─── */
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const failedRules = passwordRules.filter((r) => !r.test(password));
    if (failedRules.length > 0) {
      setMessage(`Password must have: ${failedRules.map((r) => r.label).join(', ')}.`);
      setMessageType('error');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message || 'Could not update password. Please try again.');
      setMessageType('error');
    } else {
      // Sign out so the user lands on a clean login screen
      await supabase.auth.signOut();
      setDone(true);
    }
    setLoading(false);
  };

  /* ─────────── RENDER ─────────── */

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="login-root">
        <div className="login-card">
          <LogoRow />
          <div className="confirm-icon">🎉</div>
          <h2 className="login-title">Password updated!</h2>
          <p className="confirm-text">
            Your password has been changed successfully.<br />
            You can now sign in with your new password.
          </p>
          <button
            className="login-btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </button>
        </div>
        <Glows />
      </div>
    );
  }

  /* ── Invalid / expired link ── */
  if (invalid) {
    return (
      <div className="login-root">
        <div className="login-card">
          <LogoRow />
          <div className="confirm-icon">⚠️</div>
          <h2 className="login-title">Link expired</h2>
          <p className="confirm-text">
            This password reset link is invalid or has expired.<br />
            Please request a new one.
          </p>
          <button
            className="login-btn-primary"
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </button>
        </div>
        <Glows />
      </div>
    );
  }

  /* ── Loading / waiting for token ── */
  if (!ready) {
    return (
      <div className="login-root">
        <div className="login-card">
          <LogoRow />
          <p className="confirm-text" style={{ textAlign: 'center', marginTop: '1rem' }}>
            Verifying your reset link…
          </p>
          <div className="reset-spinner" />
        </div>
        <Glows />
      </div>
    );
  }

  /* ── Main: Set new password form ── */
  return (
    <div className="login-root">
      <div className="login-card">
        <LogoRow />
        <h2 className="login-title">Set new password</h2>
        <p className="login-subtitle">Choose a strong password for your account.</p>

        <form className="login-form" onSubmit={handleUpdatePassword} noValidate>
          {/* ── New Password ── */}
          <div className="login-field">
            <label htmlFor="rp-password">New Password</label>
            <div className="password-wrapper">
              <input
                id="rp-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Strength bar */}
            {password && (
              <div className="strength-bar-wrap">
                <div className="strength-segments">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="strength-seg"
                      style={{ background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.08)' }}
                    />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            {/* Rules checklist */}
            {(pwFocused || password) && (
              <ul className="pw-rules">
                {passwordRules.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li key={r.id} className={ok ? 'rule-ok' : 'rule-fail'}>
                      <span className="rule-icon">{ok ? '✓' : '✗'}</span>
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div className="login-field">
            <label htmlFor="rp-confirm">Confirm New Password</label>
            <div className="password-wrapper">
              <input
                id="rp-confirm"
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className={
                  confirmPassword
                    ? confirmPassword === password ? 'input-match' : 'input-mismatch'
                    : ''
                }
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPw((v) => !v)}
                tabIndex={-1}
              >
                {showConfirmPw ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmPassword && (
              <span className={confirmPassword === password ? 'pw-match-ok' : 'pw-match-err'}>
                {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
              </span>
            )}
          </div>

          {message && (
            <div className={`login-message ${messageType}`}>{message}</div>
          )}

          <button
            id="rp-submit-btn"
            type="submit"
            className="login-btn-primary"
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
      <Glows />
    </div>
  );
}

function LogoRow() {
  return (
    <div className="login-logo-row">
      <img src={logoUrl} alt="DataWiz" className="login-logo" />
      <span className="login-brand">DataWiz</span>
    </div>
  );
}

function Glows() {
  return (
    <>
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />
    </>
  );
}
