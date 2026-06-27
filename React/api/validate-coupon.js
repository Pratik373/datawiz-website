const { createClient } = require('@supabase/supabase-js');
const PLANS = require('./_plans');

module.exports = async function handler(req, res) {
  console.log(`\n[API] /api/validate-coupon called with method: ${req.method}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    console.warn(`[API] Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { couponCode, plan, user_id } = req.body;
    console.log(`[API] Validating coupon: '${couponCode}' for plan: '${plan}' and user_id: '${user_id}'`);

    // 1. Calculate base price
    let baseAmount = 0;
    const selected = PLANS[plan];
    if (selected) {
      baseAmount = selected.amount;
    } else if (plan === 'upgrade') {
      baseAmount = 50; // Upgrade price is ₹50
    } else {
      console.error(`[API] Invalid plan: '${plan}'`);
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Double check upgrade status from DB if user_id is provided
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
      }
    }

    // 2. Validate coupon code
    let discount = 0;
    let valid = false;
    const code = (couponCode || '').toUpperCase().trim();

    if (code === 'DATAWIZ100') {
      // Cap to (baseAmount - 1) so paid plans are never accidentally made free
      discount = Math.min(100, baseAmount - 1);
      valid = true;
    } else if (code === 'SAVE50') {
      discount = Math.min(50, baseAmount - 1);
      valid = true;
    } else if (code === 'SAVE20') {
      discount = Math.min(20, baseAmount - 1);
      valid = true;
    } else if (code === 'FREE') {
      // Explicit 100% free coupon — intentionally makes order free
      discount = baseAmount;
      valid = true;
    } else if (code) {
      console.log(`[API] Coupon code '${code}' is invalid.`);
      return res.status(200).json({ valid: false, error: 'Invalid coupon code' });
    } else {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const finalAmount = Math.max(0, baseAmount - discount);
    console.log(`[API] Coupon applied! Base: ₹${baseAmount}, Discount: -₹${discount}, Final: ₹${finalAmount}`);

    return res.status(200).json({
      valid,
      discount,
      finalAmount,
    });
  } catch (err) {
    console.error('[API] validate-coupon error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};