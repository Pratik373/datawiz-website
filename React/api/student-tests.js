const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: tests, error } = await supabase
      .from('test_papers')
      .select('id, title, description, duration_minutes, type, questions_count, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ tests });
  } catch (err) {
    console.error('[API] student-tests error:', err);
    return res.status(500).json({ error: err.message });
  }
};
