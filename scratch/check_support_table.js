require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uoqfnvrdbicbepjxapcf.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.log('No SERVICE_ROLE_KEY found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTable() {
  console.log('Checking if support_messages table exists...');
  const { data, error } = await supabase.from('support_messages').select('*').limit(1);
  if (error) {
    console.log('Error checking support_messages:', error.message);
  } else {
    console.log('support_messages table exists! Row count sample:', data.length);
  }
}

checkTable();
