const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Your Razorpay webhook secret set in Razorpay Dashboard
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const body = req.body;

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(body))
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  if (body.event === 'payment.captured') {
    const payment = body.payload.payment.entity;
    
    // Notes contain custom data sent during order creation (e.g. plan, tests)
    const notes = payment.notes || {};
    const plan = notes.plan || 'unknown';
    const tests = parseInt(notes.tests) || 0;
    
    // Wait, we need a user_id to add credits. 
    // Usually, you pass user_id in the notes when creating the order.
    // If not, the frontend verify-payment handles it. 
    // This is just a basic webhook template for now.
    console.log(`Payment captured for order ${payment.order_id}, amount: ${payment.amount}`);
  }

  return res.status(200).json({ status: 'ok' });
};
