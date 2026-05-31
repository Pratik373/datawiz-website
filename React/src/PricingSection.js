import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { STARTER_ORIGINAL_PRICE_INR, STARTER_PRICE_INR } from './pricingConfig';
import './PricingSection.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: STARTER_PRICE_INR,
    originalPrice: STARTER_ORIGINAL_PRICE_INR,
    tests: 'Unlimited',
    perTest: 'Unlimited access',
    color: '#6f57ff',
    features: ['Unlimited Full Mock Tests', 'Section A + Section B', 'Answer Key & Review', 'Score Analysis'],
    badge: null,
  }
];

export default function PricingSection() {
  const [loading, setLoading] = useState(null); // plan id being processed
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load Razorpay script once
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }, []);

  const handleBuy = async (plan) => {
    setMessage('');
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }

    setLoading(plan.id);
    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, user_id: session.user.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error);

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Datawiz6',
        description: `${plan.name} — ${plan.tests} Mock Tests`,
        order_id: order.id,
        prefill: {
          email: session.user.email,
        },
        theme: { color: plan.color },
        handler: async (response) => {
          // 3. Verify payment on server
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              user_id:             session.user.id,
              tests_to_add:        plan.tests,
              plan:                plan.id,
              amount:              order.amount / 100
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            window.location.href = '/mock-tests';
          } else {
            setMessage('❌ Payment verification failed. Contact support.');
          }
          setLoading(null);
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessage('❌ Something went wrong: ' + err.message);
      setLoading(null);
    }
  };

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-badge">PRICING</div>
      <h2 className="pricing-title">Choose Your Test Pack</h2>
      <p className="pricing-subtitle">
        Get access to full-length CDAC C-CAT mock tests with detailed answer review &amp; score analysis.
      </p>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`pricing-card ${plan.badge ? 'pricing-card-featured' : ''}`}>
            {plan.badge && <div className="pricing-card-badge">{plan.badge}</div>}
            <div className="pricing-card-header" style={{ borderColor: plan.color }}>
              <h3>{plan.name}</h3>
              <div className="pricing-price">
                {plan.originalPrice > plan.price && (
                  <span className="pricing-original-price">₹{plan.originalPrice}</span>
                )}
                <span className="pricing-currency">₹</span>
                <span className="pricing-amount">{plan.price}</span>
              </div>
              <div className="pricing-per-test">{plan.perTest}</div>
              <div className="pricing-tests-count" style={{ color: plan.color }}>
                {plan.tests} Full Mock Tests
              </div>
            </div>

            <ul className="pricing-features">
              {plan.features.map((f, i) => (
                <li key={i}>
                  <span className="pricing-check" style={{ color: plan.color }}>✓</span> {f}
                </li>
              ))}
            </ul>

            <button
              className="pricing-btn"
              style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.id === 'pro' ? '#6f57ff' : '#4ab9ff'})` }}
              onClick={() => handleBuy(plan)}
              disabled={loading === plan.id}
            >
              {loading === plan.id ? 'Processing…' : `Buy ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {message && (
        <div className={`pricing-message ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <p className="pricing-secure">
        🔒 Secure payment powered by <strong>Razorpay</strong>
      </p>
    </section>
  );
}
