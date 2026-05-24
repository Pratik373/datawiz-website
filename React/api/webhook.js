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
    
    // We need the user_id from the notes that we passed during order creation
    const userId = notes.user_id;

    if (userId) {
      // Connect to Supabase using service role to bypass RLS
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Check if this payment was already processed by the frontend
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('razorpay_payment_id', payment.id)
        .single();

      if (!existingPayment) {
        console.log(`[Webhook] Processing payment ${payment.id} for user ${userId}`);
        
        // Insert payment record
        await supabase.from('payments').insert([{
          user_id: userId,
          razorpay_order_id: payment.order_id,
          razorpay_payment_id: payment.id,
          plan: plan,
          amount: payment.amount / 100, // convert back from paise
          status: 'successful'
        }]);

        // Add credits
        const { data: existingCredits } = await supabase
          .from('user_credits')
          .select('tests_remaining')
          .eq('user_id', userId)
          .single();

        const newCredits = (existingCredits?.tests_remaining || 0) + tests;

        await supabase.from('user_credits').upsert(
          { user_id: userId, tests_remaining: newCredits, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
        console.log(`[Webhook] Added ${tests} tests to user ${userId}.`);
      } else {
        console.log(`[Webhook] Payment ${payment.id} was already processed.`);
      }
    } else {
      console.warn(`[Webhook] No user_id found in payment notes for order ${payment.order_id}`);
    }
  }

  return res.status(200).json({ status: 'ok' });
};
