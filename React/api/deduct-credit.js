const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('user_credits')
      .select('tests_remaining')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const current = data?.tests_remaining || 0;
    if (current <= 0) return res.status(403).json({ error: 'No tests remaining' });

    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ tests_remaining: current - 1, updated_at: new Date().toISOString() })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, tests_remaining: current - 1 });
  } catch (err) {
    console.error('deduct-credit error:', err);
    return res.status(500).json({ error: 'Failed to deduct credit' });
  }
};
