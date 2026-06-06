const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'Study-Material';

function createSupabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

module.exports = async function handler(req, res) {
  try {
    const supabase = createSupabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await supabase.storage.from(BUCKET).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) return res.status(500).json({ error: error.message });

      const materials = (data || [])
        .filter((file) => file.name && file.name !== '.emptyFolderPlaceholder' && !file.name.endsWith('/'))
        .map((file) => ({
          name: file.name,
          size: file.metadata?.size || null,
          updated_at: file.updated_at || file.created_at || null,
        }));

      return res.status(200).json({ materials });
    }

    if (req.method === 'POST') {
      const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      const { fileName, download } = req.body || {};

      if (!token) return res.status(401).json({ error: 'Please login to access this material.' });
      if (!fileName) return res.status(400).json({ error: 'Missing file name.' });

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return res.status(401).json({ error: 'Please login again to access this material.' });
      }

      const options = download ? { download: fileName } : undefined;
      const { data: urlData, error: urlError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(fileName, 60 * 30, options);

      if (urlError || !urlData?.signedUrl) {
        return res.status(500).json({ error: urlError?.message || 'Could not create material link.' });
      }

      return res.status(200).json({ url: urlData.signedUrl });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[API] study-materials error:', err);
    return res.status(500).json({ error: err.message });
  }
};
