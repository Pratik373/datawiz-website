const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');
const PLANS = require('./_plans');

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
    const { plan, user_id, couponCode } = req.body;
    console.log(`[API] Requested plan: ${plan}, user_id: ${user_id}, couponCode: ${couponCode}`);
    
    let selected = PLANS[plan];
    let baseAmount = 0;
    let testsToAdd = 5;
    let planName = '';

    if (selected) {
      baseAmount = selected.amount;
      testsToAdd = selected.tests;
      planName = selected.name;
    } else if (plan === 'upgrade') {
      baseAmount = 50;
      testsToAdd = 5;
      planName = 'Complete Pack Upgrade';
    } else {
      console.error(`[API] Error: Invalid plan '${plan}' requested`);
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Check if upgrading dynamically
    let isUpgrade = (plan === 'upgrade');
    if (plan === 'pro' && user_id) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: starterPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user_id)
        .eq('plan', 'starter')
        .eq('status', 'successful')
        .maybeSingle();

      if (starterPayment) {
        console.log(`[API] User has Starter Pack payment. Overriding plan to upgrade (₹50)`);
        baseAmount = 50;
        testsToAdd = 5;
        planName = 'Complete Pack Upgrade';
        isUpgrade = true;
      }
    }

    // Apply coupon if valid
    let discount = 0;
    let isExplicitlyFree = false;
    if (couponCode) {
      const code = (couponCode || '').toUpperCase().trim();
      if (code === 'DATAWIZ100') {
        // Cap discount to base amount so it never makes a paid plan accidentally free
        discount = Math.min(100, baseAmount - 1);
      } else if (code === 'SAVE50') {
        discount = Math.min(50, baseAmount - 1);
      } else if (code === 'SAVE20') {
        discount = Math.min(20, baseAmount - 1);
      } else if (code === 'FREE') {
        // Explicit 100% free coupon — intentionally bypasses Razorpay
        discount = baseAmount;
        isExplicitlyFree = true;
      }
    }

    const finalAmount = Math.max(0, baseAmount - discount);
    console.log(`[API] Final order amount computed: base ₹${baseAmount} - discount ₹${discount} = ₹${finalAmount} (explicitlyFree: ${isExplicitlyFree})`);

    if (isExplicitlyFree && finalAmount === 0) {
      console.log(`[API] Free order via explicit FREE coupon. Bypassing Razorpay.`);
      return res.status(200).json({
        id: `free_${plan}_${Date.now()}`,
        amount: 0,
        currency: 'INR',
        tests: testsToAdd,
        planName: planName,
        isFree: true,
      });
    }

    console.log(`[API] Initializing Razorpay with Key ID: ${process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing!'} and Secret: ${process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing!'}`);
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log(`[API] Creating order for amount: ${finalAmount} INR (${finalAmount * 100} paise)`);
    const order = await razorpay.orders.create({
      amount:   finalAmount * 100, // paise
      currency: 'INR',
      receipt:  `dw_${plan}_${Date.now()}`,
      notes:    { plan: isUpgrade ? 'pro' : plan, tests: testsToAdd, user_id, couponCode },
    });

    console.log(`[API] Order created successfully! Order ID: ${order.id}`);
    return res.status(200).json({
      id:       order.id,
      amount:   order.amount,
      currency: order.currency,
      tests:    testsToAdd,
      planName: planName,
      isFree:   false,
    });
  } catch (err) {
    console.error('[API] create-order error:', err);
    return res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
};
