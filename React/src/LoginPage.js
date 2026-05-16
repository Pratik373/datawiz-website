import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './LoginPage.css';

/* ─── Password strength helpers ─── */
const passwordRules = [
  { id: 'len',    label: 'At least 8 characters',           test: (p) => p.length >= 8 },
  { id: 'upper',  label: 'One uppercase letter (A–Z)',       test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',  label: 'One lowercase letter (a–z)',       test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0–9)',                 test: (p) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'One special character (!@#$…)',   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrengthLevel(password) {
  const passed = passwordRules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: 0, label: 'Very Weak',  color: '#ff4d6a' };
  if (passed === 2) return { level: 1, label: 'Weak',       color: '#ff884d' };
  if (passed === 3) return { level: 2, label: 'Fair',       color: '#ffd04d' };
  if (passed === 4) return { level: 3, label: 'Strong',     color: '#4dcb7f' };
  return               { level: 4, label: 'Very Strong', color: '#4ab9ff' };
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();

  // mode: 'login' | 'signup' | 'confirmation' | 'forgot' | 'reset-sent'
  const [mode, setMode] = useState('login');

  /* shared fields */
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  /* signup-only */
  const [fullName, setFullName]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPw, setShowConfirmPw]   = useState(false);

  /* ui state */
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage]           = useState('');
  const [messageType, setMessageType]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);

  const logoUrl =
    'https://uoqfnvrdbicbepjxapcf.supabase.co/storage/v1/object/public/Assests/WhatsApp%20Image%202025-12-24%20at%2010.23.29%20PM.jpeg';

  const strength = getStrengthLevel(password);

  /* ── Auth state guard ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't auto-redirect if we're handling a password recovery token
      if (session && session.user?.recovery_sent_at === undefined) {
        window.location.href = '/CCATMOCK.html';
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // PASSWORD_RECOVERY means the reset link was clicked — let /reset-password handle it
        if (event === 'PASSWORD_RECOVERY') return;
        if (session) window.location.href = '/CCATMOCK.html';
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  const clearMessages = () => { setMessage(''); setMessageType(''); };

  const switchMode = (next) => {
    setMode(next);
    clearMessages();
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setShowPassword(false);
    setShowConfirmPw(false);
  };

  /* ════════════════════════════════
     HANDLERS
  ════════════════════════════════ */

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Please enter your email and password.');
      setMessageType('error');
      return;
    }
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setMessage('Please confirm your email before logging in. Check your inbox.');
        setMessageType('warning');
      } else {
        setMessage(error.message || 'Login failed. Please try again.');
        setMessageType('error');
      }
    } else {
      // Successful login redirect
      window.location.href = '/CCATMOCK.html';
    }
    setLoading(false);
  };

  /* ── Sign Up ── */
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setMessage('Please enter your full name.'); setMessageType('error'); return;
    }
    if (!email || !password) {
      setMessage('Please fill all fields.'); setMessageType('error'); return;
    }
    const failedRules = passwordRules.filter((r) => !r.test(password));
    if (failedRules.length > 0) {
      setMessage(`Password must have: ${failedRules.map((r) => r.label).join(', ')}.`);
      setMessageType('error'); return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.'); setMessageType('error'); return;
    }

    setLoading(true); clearMessages();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) {
      setMessage(error.message || 'Sign up failed. Please try again.');
      setMessageType('error');
    } else {
      setMode('confirmation');
    }
    setLoading(false);
  };

  /* ── Google OAuth ── */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true); clearMessages();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/CCATMOCK.html`,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      },
    });
    if (error) {
      if (error.message?.toLowerCase().includes('provider') || error.status === 400) {
        setMessage('Google sign-in is not enabled yet. Please enable the Google provider in your Supabase dashboard under Authentication → Providers → Google.');
      } else {
        setMessage(error.message || 'Google sign-in failed.');
      }
      setMessageType('error');
      setGoogleLoading(false);
    }
  };

  /* ── Resend confirmation ── */
  const resendConfirmation = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      setMessage(error.message || 'Could not resend. Please try again.'); setMessageType('error');
    } else {
      setMessage('Confirmation email resent! Check your inbox.'); setMessageType('success');
    }
    setLoading(false);
  };

  /* ── Forgot password ── */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address.'); setMessageType('error'); return;
    }
    setLoading(true); clearMessages();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setMessage(error.message || 'Could not send reset email. Please try again.');
      setMessageType('error');
    } else {
      setMode('reset-sent');
    }
    setLoading(false);
  };

  /* ════════════════════════════════
     RENDER HELPERS
  ════════════════════════════════ */

  /* ── Password strength bar ── */
  const StrengthBar = () => {
    if (!password) return null;
    return (
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
    );
  };

  /* ── Password rules checklist ── */
  const RulesChecklist = () => {
    if (!pwFocused && !password) return null;
    return (
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
    );
  };

  /* ── Google button (shared) ── */
  const GoogleBtn = () => (
    <button
      className="google-btn"
      onClick={handleGoogleLogin}
      disabled={googleLoading || loading}
      id="google-login-btn"
      type="button"
    >
      <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {googleLoading ? 'Redirecting…' : 'Continue with Google'}
    </button>
  );

  /* ── Divider ── */
  const Divider = () => (
    <div className="login-divider"><span>or</span></div>
  );

  /* ════════════════════════════════
     SCREENS
  ════════════════════════════════ */

  /* ── Email Confirmation ── */
  if (mode === 'confirmation') {
    return (
      <div className="login-root">
        <div className="login-card">
          <LogoRow logoUrl={logoUrl} />
          <div className="confirm-icon">📧</div>
          <h2 className="login-title">Check your inbox</h2>
          <p className="confirm-text">
            We've sent a confirmation link to <strong>{email}</strong>.<br />
            Click the link to activate your account, then log in.
          </p>
          {message && <div className={`login-message ${messageType}`}>{message}</div>}
          <button className="login-btn-secondary" onClick={resendConfirmation} disabled={loading}>
            {loading ? 'Sending…' : 'Resend confirmation email'}
          </button>
          <p className="login-switch">
            Already confirmed?{' '}
            <button className="login-link-btn" onClick={() => switchMode('login')}>Log In</button>
          </p>
        </div>
        <Glows />
      </div>
    );
  }

  /* ── Reset Sent ── */
  if (mode === 'reset-sent') {
    return (
      <div className="login-root">
        <BackBtn onClick={() => navigate('/')} />
        <div className="login-card">
          <LogoRow logoUrl={logoUrl} />
          <div className="confirm-icon">🔐</div>
          <h2 className="login-title">Reset link sent!</h2>
          <p className="confirm-text">
            We've emailed a password reset link to <strong>{email}</strong>.<br />
            Check your inbox and follow the instructions.
          </p>
          <p className="login-switch">
            <button className="login-link-btn" onClick={() => switchMode('login')}>
              ← Back to Sign In
            </button>
          </p>
        </div>
        <Glows />
      </div>
    );
  }

  /* ── Forgot Password ── */
  if (mode === 'forgot') {
    return (
      <div className="login-root">
        <BackBtn onClick={() => navigate('/')} />
        <div className="login-card">
          <LogoRow logoUrl={logoUrl} />
          <h2 className="login-title">Forgot password?</h2>
          <p className="login-subtitle">Enter your email and we'll send you a reset link.</p>

          <form className="login-form" onSubmit={handleForgotPassword}>
            <div className="login-field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {message && <div className={`login-message ${messageType}`}>{message}</div>}

            <button
              id="forgot-submit-btn"
              type="submit"
              className="login-btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          <p className="login-switch">
            <button className="login-link-btn" onClick={() => switchMode('login')}>
              ← Back to Sign In
            </button>
          </p>
        </div>
        <Glows />
      </div>
    );
  }

  /* ── Login / Signup ── */
  return (
    <div className="login-root">
      <BackBtn onClick={() => navigate('/')} />

      <div className="login-card">
        <LogoRow logoUrl={logoUrl} />

        <h2 className="login-title">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'Sign in to access your C-CAT Mock Test'
            : 'Join free and start your C-CAT preparation'}
        </p>

        <GoogleBtn />
        <Divider />

        <form
          className="login-form"
          onSubmit={mode === 'login' ? handleLogin : handleSignUp}
          noValidate
        >
          {/* ── Name (signup only) ── */}
          {mode === 'signup' && (
            <div className="login-field">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Pratik Dange"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading || googleLoading}
                autoComplete="name"
              />
            </div>
          )}

          {/* ── Email ── */}
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || googleLoading}
              autoComplete="email"
            />
          </div>

          {/* ── Password ── */}
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Create a strong password' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                disabled={loading || googleLoading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

            {/* Strength bar & rules for signup */}
            {mode === 'signup' && (
              <>
                <StrengthBar />
                <RulesChecklist />
              </>
            )}
          </div>

          {/* ── Confirm Password (signup only) ── */}
          {mode === 'signup' && (
            <div className="login-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="confirm-password"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  autoComplete="new-password"
                  className={
                    confirmPassword
                      ? confirmPassword === password
                        ? 'input-match'
                        : 'input-mismatch'
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
          )}

          {/* ── Forgot password link (login only) ── */}
          {mode === 'login' && (
            <div className="forgot-row">
              <button
                type="button"
                className="login-link-btn"
                onClick={() => switchMode('forgot')}
              >
                Forgot password?
              </button>
            </div>
          )}

          {message && (
            <div className={`login-message ${messageType}`}>{message}</div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="login-btn-primary"
            disabled={loading || googleLoading}
          >
            {loading
              ? mode === 'login' ? 'Signing in…' : 'Creating account…'
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* ── Mode toggle ── */}
        <p className="login-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="login-link-btn"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      <Glows />
    </div>
  );
}

/* ── Small shared sub-components ── */
function LogoRow({ logoUrl }) {
  return (
    <div className="login-logo-row">
      <img src={logoUrl} alt="Datawiz6" className="login-logo" />
      <span className="login-brand">Datawiz6</span>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button className="login-back-btn" onClick={onClick}>
      ← Back to Home
    </button>
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
