const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
      const isAdmin = user?.email === 'adminspp@datawiz.com';

      // 1. Fetch user credits
      const { data: credits } = await supabase
        .from('user_credits')
        .select('tests_remaining')
        .eq('user_id', user_id)
        .maybeSingle();

      let testsRemaining = credits?.tests_remaining || 0;

      // 2. Fetch user subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan')
        .eq('user_id', user_id)
        .maybeSingle();

      // 3. Fetch successful payments
      const { data: payments } = await supabase
        .from('payments')
        .select('plan, amount')
        .eq('user_id', user_id)
        .eq('status', 'successful');

      // 4. Calculate total purchased tests from payments and subscription
      let T_payments = 0;
      if (payments && payments.length > 0) {
        payments.forEach(p => {
          if (p.plan === 'pro') T_payments += 10;
          else if (p.plan === 'starter') T_payments += 5;
          else if (p.plan === 'upgrade') T_payments += 5;
        });
      }

      const T_sub = subscription?.plan === 'pro' ? 10 : (subscription?.plan === 'starter' ? 5 : 0);
      const T = Math.max(T_payments, T_sub);

      // 5. Reconcile if credits are missing
      if (T > 0 && testsRemaining < T) {
        console.log(`[Reconciliation] User ${user_id} has tests_remaining = ${testsRemaining}, expected = ${T}. Updating...`);
        const { error: reconcileError } = await supabase
          .from('user_credits')
          .upsert(
            { user_id, tests_remaining: T, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );

        if (!reconcileError) {
          testsRemaining = T;
        } else {
          console.error(`[Reconciliation] Failed to update credits:`, reconcileError);
        }
      }

      // Also reconcile user_subscriptions plan if it is missing or out of sync with payments
      if (T_payments > 0) {
        const expectedPlan = T_payments >= 10 ? 'pro' : 'starter';
        if (!subscription || subscription.plan !== expectedPlan) {
          console.log(`[Reconciliation] Updating user subscription for ${user_id} to ${expectedPlan}`);
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('user_subscriptions').upsert(
            {
              user_id,
              plan: expectedPlan,
              started_at: new Date().toISOString(),
              expires_at: expiresAt,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          );
        }
      }

      const hasProAccess = Boolean(subscription && ['pro', 'premium'].includes(subscription.plan)) || T_payments >= 10;

      return res.status(200).json({
        hasPremiumAccess: isAdmin || testsRemaining > 0,
        hasProAccess: isAdmin || hasProAccess,
        tests_remaining: testsRemaining,
        isAdmin,
      });

    } catch (reconcileErr) {
      console.error('[API] user-test-access reconciliation catch (falling back):', reconcileErr);
      
      // Safe fallback to the exact original code to guarantee it never crashes
      const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
      const isAdmin = user?.email === 'adminspp@datawiz.com';

      const { data: credits } = await supabase
        .from('user_credits')
        .select('tests_remaining')
        .eq('user_id', user_id)
        .maybeSingle();

      const { data: proPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', user_id)
        .in('plan', ['pro', 'upgrade'])
        .eq('status', 'successful')
        .maybeSingle();

      const hasProAccess = Boolean(proPayment);
      const testsRemaining = credits?.tests_remaining || 0;

      return res.status(200).json({
        hasPremiumAccess: isAdmin || testsRemaining > 0,
        hasProAccess: isAdmin || hasProAccess,
        tests_remaining: testsRemaining,
        isAdmin,
      });
    }
  } catch (err) {
    console.error('[API] user-test-access error:', err);
    return res.status(500).json({ error: 'Could not check access', details: err.message });
  }
};
