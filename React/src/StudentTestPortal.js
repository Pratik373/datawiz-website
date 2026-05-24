import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './StudentTestPortal.css';

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_Spy62mcDroIz0U';

export default function StudentTestPortal() {
  const navigate = useNavigate();
  const [user, setUser]           = useState(null);
  const [hasPaid, setHasPaid]     = useState(false);
  const [isAdmin, setIsAdmin]     = useState(false);
  const [tests, setTests]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [answers, setAnswers]     = useState({});

  // Modal states
  const [selectedTest, setSelectedTest]   = useState(null); // confirm modal
  const [buyModal, setBuyModal]           = useState(false); // payment popup
  const [activePdfUrl, setActivePdfUrl]   = useState(null); // pdf viewer
  const [starting, setStarting]           = useState(false);
  const [buyLoading, setBuyLoading]       = useState(false);
  const [buyMessage, setBuyMessage]       = useState('');

  // ── Auth + data load ──
  useEffect(() => {
    // Load Razorpay script
    if (!document.getElementById('razorpay-script')) {
      const s = document.createElement('script');
      s.id  = 'razorpay-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(s);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setIsAdmin(session.user.email === 'adminspp@datawiz.com');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setUser(session.user);
        setIsAdmin(session.user.email === 'adminspp@datawiz.com');
      } else {
        setUser(null);
        setIsAdmin(false);
        setHasPaid(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check payment status once user is known
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_credits')
      .select('tests_remaining')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setHasPaid((data?.tests_remaining || 0) > 0);
      });
  }, [user]);

  // Fetch tests list (public endpoint)
  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/student-tests');
      const data = await res.json();
      setTests(data.tests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  // ── Handlers ──
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const canAccessPremium = isAdmin || hasPaid;

  const handleFreeTestClick = () => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/mock-tests');
      navigate('/login');
      return;
    }
    window.location.href = '/CCATMOCK.html';
  };

  const handlePremiumTestClick = (test) => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/mock-tests');
      navigate('/login');
      return;
    }
    if (!canAccessPremium) {
      setBuyModal(true);
      return;
    }
    setSelectedTest(test);
  };

  const confirmStartTest = async () => {
    if (!selectedTest) return;
    setStarting(true);
    try {
      const res  = await fetch('/api/start-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: user.id, test_id: selectedTest.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to start test.');
      if (data.test_type === 'file') setActivePdfUrl(data.url);
      else alert('This manual test will be available soon!');
    } catch (err) {
      alert(err.message);
    } finally {
      setStarting(false);
      setSelectedTest(null);
    }
  };

  // ── Razorpay buy flow from popup ──
  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return; }
    setBuyLoading(true);
    setBuyMessage('');
    try {
      const orderRes = await fetch('/api/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: 'starter', user_id: user.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error);

      const options = {
        key:         RAZORPAY_KEY_ID,
        amount:      order.amount,
        currency:    order.currency,
        name:        'Datawiz6',
        description: 'Unlimited Mock Test Access',
        order_id:    order.id,
        prefill:     { email: user.email },
        theme:       { color: '#6f57ff' },
        handler: async (response) => {
          setBuyMessage('Verifying payment…');
          const verifyRes = await fetch('/api/verify-payment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              user_id:             user.id,
              tests_to_add:        99999,
              plan:                'starter',
              amount:              199,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            setHasPaid(true);
            setBuyModal(false);
            setBuyMessage('');
          } else {
            setBuyMessage('❌ Verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setBuyLoading(false) },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      setBuyMessage('❌ ' + err.message);
    } finally {
      setBuyLoading(false);
    }
  };

  // ── Full-screen PDF + OMR viewer ──
  if (activePdfUrl) {
    const totalQuestions = selectedTest?.questions_count > 0 ? selectedTest.questions_count : 100;
    return (
      <div className="stp-pdf-viewer">
        <div className="stp-pdf-header">
          <h2 className="stp-pdf-title">Datawiz6 — {selectedTest?.title || 'Secure Test Viewer'}</h2>
          <button className="stp-pdf-close" onClick={() => {
            if (window.confirm('Finish test? Your bubble sheet answers will be lost.')) {
              setActivePdfUrl(null); setSelectedTest(null); setAnswers({});
            }
          }}>Finish Test</button>
        </div>
        <div className="stp-pdf-split-container">
          <div className="stp-pdf-left">
            <iframe src={activePdfUrl} className="stp-pdf-iframe" title="Secure Test" onContextMenu={e => e.preventDefault()} />
          </div>
          <div className="stp-pdf-right">
            <div className="stp-omr-header">
              <h3>Digital OMR Sheet</h3>
              <p>Click a bubble to record your answer</p>
            </div>
            <div className="stp-omr-grid">
              {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(qNum => (
                <div key={qNum} className="stp-omr-row">
                  <span className="stp-omr-qnum">Q{qNum}.</span>
                  <div className="stp-omr-options">
                    {['A','B','C','D'].map(opt => (
                      <button
                        key={opt}
                        className={`stp-omr-bubble ${answers[qNum] === opt ? 'selected' : ''}`}
                        onClick={() => setAnswers(prev => ({ ...prev, [qNum]: opt }))}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stp-root">
      {/* Navbar */}
      <nav className="stp-nav">
        <div className="stp-nav-inner">
          <button className="stp-back-btn" onClick={() => navigate('/')}>← Back to Home</button>
          <div className="stp-nav-right">
            {user ? (
              <>
                <span className={`stp-credits ${canAccessPremium ? '' : 'empty'}`}>
                  {isAdmin ? '🛡 Admin' : canAccessPremium ? '✅ Premium Access' : '🔒 Free Plan'}
                </span>
                <span className="stp-user-email">{user.email}</span>
                <button className="stp-back-btn" style={{ marginLeft: '1rem' }} onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <button className="stp-btn-start" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }} onClick={() => navigate('/login')}>
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="stp-header">
        <h1 className="stp-title">CDAC C-CAT Mock Tests</h1>
        <p className="stp-subtitle">
          {canAccessPremium
            ? 'You have unlimited access to all tests. Start practising!'
            : 'Try the free test below — unlock all premium tests for just ₹199.'}
        </p>
      </header>

      <main className="stp-main">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: '#8e9dcc' }}>Loading tests…</div>
        ) : (
          <div className="stp-grid">

            {/* ── FREE CARD (always shown) ── */}
            <div className="stp-card stp-card-free">
              <span className="stp-card-type" style={{ background: 'rgba(126,232,184,0.15)', color: '#7ee8b8' }}>🆓 FREE</span>
              <h3 className="stp-card-title">C-CAT Full Mock Test</h3>
              <p className="stp-card-desc">
                100-question interactive mock test covering all C-CAT sections — completely free to try!
              </p>
              <div className="stp-card-meta">
                <span>⏱ 120 mins</span>
                <span>📋 100 Qs</span>
                <span>✅ Sections A &amp; B</span>
              </div>
              <button className="stp-btn-start stp-btn-free" onClick={handleFreeTestClick}>
                Start Free Test
              </button>
            </div>

            {/* ── PREMIUM CARDS from DB ── */}
            {tests.map(test => (
              <div key={test.id} className={`stp-card ${!canAccessPremium ? 'stp-card-locked' : ''}`}>
                <span className="stp-card-type">
                  {canAccessPremium ? (test.type === 'file' ? 'PDF TEST' : 'MANUAL TEST') : '🔒 PREMIUM'}
                </span>
                <h3 className="stp-card-title">{test.title}</h3>
                <p className="stp-card-desc">{test.description || 'Full-length premium mock test.'}</p>
                <div className="stp-card-meta">
                  <span>⏱ {test.duration_minutes} mins</span>
                  {test.questions_count > 0 && <span>📋 {test.questions_count} Qs</span>}
                </div>
                {canAccessPremium ? (
                  <button className="stp-btn-start" onClick={() => handlePremiumTestClick(test)}>
                    Start Test
                  </button>
                ) : (
                  <button className="stp-btn-start stp-btn-locked" onClick={() => handlePremiumTestClick(test)}>
                    🔒 Unlock — ₹199
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Confirm start modal (for paid users) ── */}
      {selectedTest && (
        <div className="stp-modal-overlay" onClick={() => setSelectedTest(null)}>
          <div className="stp-modal" onClick={e => e.stopPropagation()}>
            <h3 className="stp-modal-title">Ready to begin?</h3>
            <p className="stp-modal-desc">You are about to start <strong>"{selectedTest.title}"</strong>.</p>
            <div className="stp-modal-actions">
              <button className="stp-modal-btn secondary" onClick={() => setSelectedTest(null)} disabled={starting}>Cancel</button>
              <button className="stp-modal-btn primary" onClick={confirmStartTest} disabled={starting}>
                {starting ? 'Loading…' : 'Start Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Buy / Unlock modal ── */}
      {buyModal && (
        <div className="stp-modal-overlay" onClick={() => { setBuyModal(false); setBuyMessage(''); }}>
          <div className="stp-modal stp-buy-modal" onClick={e => e.stopPropagation()}>
            <div className="stp-buy-badge">🚀 Unlock All Tests</div>
            <h3 className="stp-modal-title">Get Unlimited Access</h3>
            <div className="stp-buy-price">
              <span className="stp-buy-currency">₹</span>
              <span className="stp-buy-amount">199</span>
              <span className="stp-buy-period">one-time</span>
            </div>
            <ul className="stp-buy-features">
              <li>✅ Unlimited Full Mock Tests</li>
              <li>✅ PDF Test Papers with OMR Sheet</li>
              <li>✅ All Future Tests Included</li>
              <li>✅ Section A + Section B Coverage</li>
            </ul>
            {buyMessage && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{buyMessage}</p>}
            <button className="stp-modal-btn primary" style={{ width: '100%', padding: '1rem' }} onClick={handleBuyNow} disabled={buyLoading}>
              {buyLoading ? 'Opening Payment…' : 'Buy Now — ₹199'}
            </button>
            <button className="stp-modal-btn secondary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => { setBuyModal(false); setBuyMessage(''); }}>
              Maybe Later
            </button>
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#8e9dcc' }}>🔒 Secure payment via Razorpay</p>
          </div>
        </div>
      )}
    </div>
  );
}
