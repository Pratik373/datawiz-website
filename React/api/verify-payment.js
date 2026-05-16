const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, tests_to_add, plan, amount } = req.body;

    // 1. Verify Razorpay signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // 2. Update Supabase with service role (bypasses RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Insert payment record
    await supabase.from('payments').insert([{
      user_id,
      razorpay_order_id,
      razorpay_payment_id,
      plan,
      amount,
      status: 'successful'
    }]);

    const { data: existing } = await supabase
      .from('user_credits')
      .select('tests_remaining')
      .eq('user_id', user_id)
      .single();

    const newCredits = (existing?.tests_remaining || 0) + parseInt(tests_to_add);

    const { error } = await supabase.from('user_credits').upsert(
      { user_id, tests_remaining: newCredits, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    if (error) throw error;

    return res.status(200).json({ success: true, tests_remaining: newCredits });
  } catch (err) {
    console.error('verify-payment error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
};
