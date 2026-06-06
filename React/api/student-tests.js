const { createClient } = require('@supabase/supabase-js');

const DEFAULT_TESTS = [
  {
    id: 'free-ccat-set-1',
    title: 'Free C-CAT Mock Test',
    description: 'A full free C-CAT mock test available to every visitor without login.',
    duration_minutes: 120,
    type: 'html',
    questions_count: 100,
    local_url: '/CCATMOCK.html',
    access: 'free',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'premium-ccat-set-1',
    title: 'Premium C-CAT Mock Test — Set 1',
    description: 'Full-length premium C-CAT mock paper. Unlock with the Starter Pack.',
    duration_minutes: 120,
    type: 'html',
    questions_count: 100,
    local_url: '/CCAT_Mock_Test_Set1.html',
    access: 'premium',
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'premium-ccat-set-2',
    title: 'Premium C-CAT Mock Test — Set 2',
    description: 'Paid test-series mock paper with full-length C-CAT practice.',
    duration_minutes: 120,
    type: 'html',
    questions_count: 100,
    local_url: '/CCAT_Mock_Test_Set2.html',
    access: 'premium',
    created_at: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'premium-ccat-set-3',
    title: 'Premium C-CAT Mock Test — Set 3',
    description: 'Paid test-series mock paper with full-length C-CAT practice.',
    duration_minutes: 120,
    type: 'html',
    questions_count: 100,
    local_url: '/CCAT_Mock_Test_Set3.html',
    access: 'premium',
    created_at: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'premium-ccat-set-4',
    title: 'Premium C-CAT Mock Test — Set 4',
    description: 'Paid test-series mock paper with full-length C-CAT practice.',
    duration_minutes: 120,
    type: 'html',
    questions_count: 100,
    local_url: '/CCAT_Mock_Test_Set4.html',
    access: 'premium',
    created_at: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'premium-ccat-set-5',
    title: 'Premium C-CAT Mock Test — Set 5',
    description: 'Paid test-series mock paper with full-length C-CAT practice.',
    duration_minutes: 120,
    type: 'html',
    questions_count: 100,
    local_url: '/CCAT_Mock_Test_Set5.html',
    access: 'premium',
    created_at: '2026-01-06T00:00:00.000Z',
  },
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: tests, error } = await supabase
      .from('test_papers')
      .select('id, title, description, duration_minutes, type, questions_count, local_url, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const dbTests = (tests || []).map((test, index) => ({
      ...test,
      access: index === 0 ? 'free' : 'premium',
    }));

    return res.status(200).json({ tests: dbTests.length > 0 ? dbTests : DEFAULT_TESTS });
  } catch (err) {
    console.error('[API] student-tests error:', err);
    // Return default tests as fallback so the page always loads
    return res.status(200).json({ tests: DEFAULT_TESTS, fallback: true });
  }
};
