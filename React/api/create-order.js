const Razorpay = require('razorpay');

const PLANS = {
  starter: { amount: 199, tests: 5, name: 'Starter Pack' },
  pro:     { amount: 299, tests: 10, name: 'Pro Pack' },
};

module.exports = async function handler(req, res) {
  console.log(`\n[API] /api/create-order called with method: ${req.method}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    console.warn(`[API] Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, user_id } = req.body;
    console.log(`[API] Requested plan: ${plan}`);
    const selected = PLANS[plan];
    if (!selected) {
      console.error(`[API] Error: Invalid plan '${plan}' requested`);
      return res.status(400).json({ error: 'Invalid plan' });
    }

    console.log(`[API] Initializing Razorpay with Key ID: ${process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing!'} and Secret: ${process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing!'}`);
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log(`[API] Creating order for amount: ${selected.amount} INR (${selected.amount * 100} paise)`);
    const order = await razorpay.orders.create({
      amount:   selected.amount * 100, // paise
      currency: 'INR',
      receipt:  `dw_${plan}_${Date.now()}`,
      notes:    { plan, tests: selected.tests, user_id },
    });

    console.log(`[API] Order created successfully! Order ID: ${order.id}`);
    return res.status(200).json({
      id:       order.id,
      amount:   order.amount,
      currency: order.currency,
      tests:    selected.tests,
      planName: selected.name,
    });
  } catch (err) {
    console.error('[API] create-order error:', err);
    return res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
};
