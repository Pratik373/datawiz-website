const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log(`\n[API] /api/verify-payment called with method: ${req.method}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    console.warn(`[API] Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, tests_to_add, plan, amount } = req.body;
    console.log(`[API] Verifying payment for Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}, User ID: ${user_id}`);

    // 1. Verify Razorpay signature
    console.log(`[API] Generating expected signature...`);
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      console.error(`[API] Signature mismatch! Expected: ${expected}, Got: ${razorpay_signature}`);
      return res.status(400).json({ error: 'Payment verification failed' });
    }
    console.log(`[API] Signature verified successfully!`);

    // 2. Update Supabase with service role (bypasses RLS)
    console.log(`[API] Connecting to Supabase to update credits...`);
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Insert payment record
    console.log(`[API] Inserting payment record...`);
    await supabase.from('payments').insert([{
      user_id,
      razorpay_order_id,
      razorpay_payment_id,
      plan,
      amount,
      status: 'successful'
    }]);

    console.log(`[API] Fetching existing credits...`);
    const { data: existing } = await supabase
      .from('user_credits')
      .select('tests_remaining')
      .eq('user_id', user_id)
      .single();

    const newCredits = (existing?.tests_remaining || 0) + parseInt(tests_to_add);
    console.log(`[API] Updating credits. Old: ${existing?.tests_remaining || 0}, New: ${newCredits}`);

    const { error } = await supabase.from('user_credits').upsert(
      { user_id, tests_remaining: newCredits, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error(`[API] Supabase update error:`, error);
      throw error;
    }

    console.log(`[API] Payment verification and credit update complete!`);
    return res.status(200).json({ success: true, tests_remaining: newCredits });
  } catch (err) {
    console.error('[API] verify-payment error:', err);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
};
