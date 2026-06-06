const { createClient } = require('@supabase/supabase-js');

const DEFAULT_TESTS = [
  { id: 'free-ccat-set-1', url: '/CCAT_Mock_Test_Set1.html', access: 'free' },
  { id: 'premium-ccat-set-1', url: '/CCAT_Mock_Test_Set1.html', access: 'premium' },
  { id: 'premium-ccat-set-2', url: '/CCAT_Mock_Test_Set2.html', access: 'premium' },
  { id: 'premium-ccat-set-3', url: '/CCAT_Mock_Test_Set3.html', access: 'premium' },
  { id: 'premium-ccat-set-4', url: '/CCAT_Mock_Test_Set4.html', access: 'premium' },
  { id: 'premium-ccat-set-5', url: '/CCAT_Mock_Test_Set5.html', access: 'premium' },
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, test_id } = req.body;
  if (!test_id) {
    return res.status(400).json({ error: 'Missing test_id' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const defaultTest = DEFAULT_TESTS.find((test) => test.id === test_id);
    if (defaultTest) {
      if (defaultTest.access === 'free') {
        return res.status(200).json({ success: true, test_type: 'html', url: defaultTest.url });
      }

      if (!user_id) {
        return res.status(401).json({ success: false, error: 'Please login to access premium tests.' });
      }

      const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
      const isAdmin = user && user.email === 'adminspp@datawiz.com';
      let hasAccess = isAdmin;

      if (!isAdmin) {
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
        return res.status(403).json({ success: false, error: 'Access denied. Please buy the test series.' });
      }

      return res.status(200).json({ success: true, test_type: 'html', url: defaultTest.url });
    }

    if (!user_id) {
      return res.status(401).json({ success: false, error: 'Please login to access this test.' });
    }

    // 1. Fetch test details and identify the single free test.
    const { data: test, error: testError } = await supabase
      .from('test_papers')
      .select('*')
      .eq('id', test_id)
      .single();

    if (testError || !test) {
      return res.status(404).json({ success: false, error: 'Test not found.' });
    }

    const { data: freeTests } = await supabase
      .from('test_papers')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);

    const isFreeTest = freeTests?.[0]?.id === test.id;

    // 2. Check if user is admin via email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    const isAdmin = user && user.email === 'adminspp@datawiz.com';

    let hasAccess = isAdmin || isFreeTest;

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
      return res.status(403).json({ success: false, error: 'Access denied. Please buy the test series.' });
    }

    // 3. Return appropriate data based on test type
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
    } else if (test.type === 'html' && test.local_url) {
      return res.status(200).json({
        success: true,
        test_type: 'html',
        url: test.local_url
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
