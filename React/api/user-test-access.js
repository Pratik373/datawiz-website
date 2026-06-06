const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    const isAdmin = user?.email === 'adminspp@datawiz.com';

    const { data: credits } = await supabase
      .from('user_credits')
      .select('tests_remaining')
      .eq('user_id', user_id)
      .single();

    const testsRemaining = credits?.tests_remaining || 0;
    return res.status(200).json({
      hasPremiumAccess: isAdmin || testsRemaining > 0,
      tests_remaining: testsRemaining,
      isAdmin,
    });
  } catch (err) {
    console.error('[API] user-test-access error:', err);
    return res.status(500).json({ error: 'Could not check access', details: err.message });
  }
};
