/**
 * ONE-TIME SCRIPT: Revoke fraudulent free Pro access
 *
 * Users affected (got Pro for ₹0 due to coupon overflow bug):
 *   - Gaytri Bhadane
 *   - Pratik Dange
 *
 * What this script does:
 *   1. Looks up users by email in Supabase Auth
 *   2. Deletes their fraudulent ₹0 payment records (plan='pro', amount=0)
 *   3. Resets their user_credits to 0
 *
 * Usage:
 *   node scripts/revoke-free-access.js
 *
 * Set env vars first (or copy from .env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // fallback
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Target users ─────────────────────────────────────────────────────────────
// Add the exact email addresses for these two users below.
// You can find them in your Supabase Auth → Users dashboard.
const TARGET_EMAILS = [
  'gaytribhadane3@gmail.com',  // Gaytri Bhadane
  'pmdange99@gmail.com',       // Pratik Dange
];

async function revokeAccess() {
  console.log('🔍 Looking up users by email...\n');

  for (const email of TARGET_EMAILS) {
    console.log(`──────────────────────────────────────`);
    console.log(`Processing: ${email}`);

    // 1. Find user ID from Supabase Auth
    const { data: usersPage, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      console.error(`  ❌ Could not list users: ${listErr.message}`);
      continue;
    }

    const authUser = usersPage.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!authUser) {
      console.warn(`  ⚠️  User not found in Auth: ${email}`);
      console.warn(`  → Check the email address is correct in Supabase Auth dashboard.`);
      continue;
    }

    const userId = authUser.id;
    console.log(`  ✅ Found user: ${authUser.email} (ID: ${userId})`);

    // 2. Check existing payments (for audit)
    const { data: payments } = await supabase
      .from('payments')
      .select('id, plan, amount, status, created_at')
      .eq('user_id', userId);

    console.log(`  📋 Current payments: ${JSON.stringify(payments, null, 2)}`);

    // 3. Delete ONLY the fraudulent ₹0 payment records (plan=pro, amount=0)
    const { data: deleted, error: delErr } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', userId)
      .eq('amount', 0)
      .select();

    if (delErr) {
      console.error(`  ❌ Failed to delete payments: ${delErr.message}`);
    } else if (deleted?.length > 0) {
      console.log(`  🗑️  Deleted ${deleted.length} fraudulent payment record(s).`);
    } else {
      console.log(`  ℹ️  No ₹0 payment records found to delete.`);
    }

    // 4. Reset user_credits to 0
    const { error: creditErr } = await supabase
      .from('user_credits')
      .upsert(
        { user_id: userId, tests_remaining: 0, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (creditErr) {
      console.error(`  ❌ Failed to reset credits: ${creditErr.message}`);
    } else {
      console.log(`  ✅ Credits reset to 0.`);
    }

    console.log(`  ✅ Done for ${email}\n`);
  }

  console.log('──────────────────────────────────────');
  console.log('✅ Script complete. Refresh your admin Payments dashboard to confirm.');
}

revokeAccess().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
