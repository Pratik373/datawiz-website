const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = 'https://uoqfnvrdbicbepjxapcf.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('payments').select('*').limit(5);
  if (error) {
    console.error('Error fetching payments:', error);
  } else {
    console.log('Payments rows:', JSON.stringify(data, null, 2));
  }
}
main();
