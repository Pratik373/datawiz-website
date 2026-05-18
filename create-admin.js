/**
 * create-admin.js
 * ---------------
 * Run once to register the admin account in Supabase Auth and link it
 * to the public.admin_users row that was seeded by the migration.
 *
 * Usage:
 *   node create-admin.js
 *
 * The service-role key is read from .env.local automatically.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://uoqfnvrdbicbepjxapcf.supabase.co';

// Never commit the service-role key. Read from env or paste temporarily.
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '<PASTE_SERVICE_ROLE_KEY_HERE>';

const ADMIN_EMAIL    = 'adminspp@datawiz.com';
const ADMIN_PASSWORD = 'adminspp6';
const ADMIN_NAME     = 'Primary Admin';
// ─────────────────────────────────────────────────────────────────────────────

if (SERVICE_ROLE_KEY === '<PASTE_SERVICE_ROLE_KEY_HERE>') {
  console.error(
    '\n❌  ERROR: Set your SUPABASE_SERVICE_ROLE_KEY environment variable first.\n' +
    '   Windows PowerShell example:\n' +
    '     $env:SUPABASE_SERVICE_ROLE_KEY="your-key-here"\n' +
    '     node create-admin.js\n'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n🔧  Creating admin account: ${ADMIN_EMAIL} …\n`);

  // 1. Create (or re-use) the Auth user via the Admin API
  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email:             ADMIN_EMAIL,
      password:          ADMIN_PASSWORD,
      email_confirm:     true,           // skip the confirmation email
      user_metadata:     { display_name: ADMIN_NAME, role: 'admin' },
    });

  let userId;

  if (createError) {
    // If user already exists, fetch them instead
    if (createError.message?.toLowerCase().includes('already been registered') ||
        createError.code === 'email_exists') {
      console.log('ℹ️  Auth user already exists — fetching existing user …');
      const { data: listData, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const existing = listData.users.find(u => u.email === ADMIN_EMAIL);
      if (!existing) throw new Error('Could not find existing admin user.');
      userId = existing.id;
      console.log(`✅  Found existing Auth user  id=${userId}`);
    } else {
      throw createError;
    }
  } else {
    userId = createData.user.id;
    console.log(`✅  Auth user created          id=${userId}`);
  }

  // 2. Upsert the admin_users row so user_id is linked
  const { error: upsertError } = await supabase
    .from('admin_users')
    .upsert(
      { email: ADMIN_EMAIL, user_id: userId, display_name: ADMIN_NAME },
      { onConflict: 'email' }
    );

  if (upsertError) throw upsertError;
  console.log('✅  admin_users row linked\n');

  console.log('🎉  Admin account is ready!');
  console.log(`    Email    : ${ADMIN_EMAIL}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log('\n    Log in at  /admin/login\n');
}

main().catch(err => {
  console.error('\n❌  Script failed:', err.message || err);
  process.exit(1);
});
