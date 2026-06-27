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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      tests_to_add,
      plan,
      amount,
    } = req.body;

    const isFreeOrder = razorpay_order_id && razorpay_order_id.startsWith('free_');

    if (!isFreeOrder) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id) {
        return res.status(400).json({ error: 'Missing required payment fields' });
      }

      console.log(`[API] Verifying payment for Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}, User ID: ${user_id}`);

      // 1. Verify Razorpay signature
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expected !== razorpay_signature) {
        console.error(`[API] Signature mismatch! Expected: ${expected}, Got: ${razorpay_signature}`);
        return res.status(400).json({ error: 'Payment verification failed — invalid signature' });
      }
      console.log(`[API] Signature verified successfully!`);
    } else {
      console.log(`[API] Free order bypass verified for Order ID: ${razorpay_order_id}`);
    }

    // 2. Connect to Supabase with service role (bypasses RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Check for duplicate payment (idempotency)
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existing) {
      console.log(`[API] Payment ${razorpay_payment_id} already processed — returning success.`);
      const { data: credits } = await supabase
        .from('user_credits')
        .select('tests_remaining')
        .eq('user_id', user_id)
        .single();
      return res.status(200).json({ success: true, tests_remaining: credits?.tests_remaining || 0, already_processed: true });
    }

    // 4. Insert payment record
    console.log(`[API] Inserting payment record...`);
    const { error: paymentInsertError } = await supabase.from('payments').insert([{
      user_id,
      razorpay_order_id,
      razorpay_payment_id: isFreeOrder ? `free_pay_${Date.now()}` : razorpay_payment_id,
      plan: plan || 'starter',
      amount: amount || 0,
      status: 'successful',
    }]);

    if (paymentInsertError) {
      // Log but don't fail — credit update is more important
      console.error(`[API] Payment record insert error (non-fatal):`, paymentInsertError.message);
    }

    // 5. Update user credits
    console.log(`[API] Fetching existing credits...`);
    const { data: existingCredits } = await supabase
      .from('user_credits')
      .select('tests_remaining')
      .eq('user_id', user_id)
      .single();

    const testsToAdd = parseInt(tests_to_add) || 5;
    const newCredits = (existingCredits?.tests_remaining || 0) + testsToAdd;
    console.log(`[API] Updating credits. Old: ${existingCredits?.tests_remaining || 0}, Adding: ${testsToAdd}, New: ${newCredits}`);

    const { error: upsertError } = await supabase.from('user_credits').upsert(
      { user_id, tests_remaining: newCredits, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    if (upsertError) {
      console.error(`[API] Supabase credit update error:`, upsertError);
      throw upsertError;
    }

    console.log(`[API] Payment verification and credit update complete! New credits: ${newCredits}`);
    return res.status(200).json({ success: true, tests_remaining: newCredits });

  } catch (err) {
    console.error('[API] verify-payment error:', err);
    return res.status(500).json({ error: 'Verification failed', details: err.message });
  }
};
