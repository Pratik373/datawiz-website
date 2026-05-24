const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, test_id } = req.body;
  if (!user_id || !test_id) {
    return res.status(400).json({ error: 'Missing user_id or test_id' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Check if user is admin via email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    const isAdmin = user && user.email === 'adminspp@datawiz.com';

    let hasAccess = isAdmin;

    if (!isAdmin) {
      // 1b. Check if user has access (credits > 0 indicates active subscription)
      const { data: creditData, error: creditError } = await supabase
        .from('user_credits')
        .select('tests_remaining')
        .eq('user_id', user_id)
        .single();

      if (!creditError && creditData && creditData.tests_remaining > 0) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied. Please buy the unlimited test pack.' });
    }

    // 2. Fetch test details
    const { data: test, error: testError } = await supabase
      .from('test_papers')
      .select('*')
      .eq('id', test_id)
      .single();

    if (testError || !test) {
      return res.status(404).json({ success: false, error: 'Test not found.' });
    }

    // 4. Return appropriate data based on test type
    if (test.type === 'file' && test.file_path) {
      const { data: urlData, error: urlError } = await supabase.storage
        .from('test-papers')
        .createSignedUrl(test.file_path, 7200); // 2 hours

      if (urlError || !urlData) {
        throw new Error('Failed to generate secure URL for test file.');
      }

      return res.status(200).json({ 
        success: true, 
        test_type: 'file',
        url: urlData.signedUrl
      });
    } else {
      // Manual test type - normally we'd return the questions here
      // But for now, we just return success
      return res.status(200).json({ 
        success: true, 
        test_type: 'manual',
        message: 'Manual tests coming soon.'
      });
    }

  } catch (err) {
    console.error('[API] start-test error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
