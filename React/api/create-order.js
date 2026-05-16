const Razorpay = require('razorpay');

const PLANS = {
  starter: { amount: 199, tests: 5, name: 'Starter Pack' },
  pro:     { amount: 299, tests: 10, name: 'Pro Pack' },
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan } = req.body;
    const selected = PLANS[plan];
    if (!selected) return res.status(400).json({ error: 'Invalid plan' });

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount:   selected.amount * 100, // paise
      currency: 'INR',
      receipt:  `dw_${plan}_${Date.now()}`,
      notes:    { plan, tests: selected.tests },
    });

    return res.status(200).json({
      id:       order.id,
      amount:   order.amount,
      currency: order.currency,
      tests:    selected.tests,
      planName: selected.name,
    });
  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
};
