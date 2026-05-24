const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uoqfnvrdbicbepjxapcf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcWZudnJkYmljYmVwanhhcGNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0Njc0MywiZXhwIjoyMDkzOTIyNzQzfQ.5_gRBfi7ap9PZYE0T_iPnujIDJgsHFJWdXEHSZJFRL8'
);

async function setup() {
  // Try inserting a dummy record to see if table exists
  const { data, error } = await supabase
    .from('maintenance_whitelist')
    .select('*')
    .limit(1);

  if (error && error.code === '42P01') {
    console.log('Table does not exist. Please create it in Supabase SQL Editor with:');
    console.log(`
CREATE TABLE IF NOT EXISTS maintenance_whitelist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  added_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON maintenance_whitelist
  USING (true) WITH CHECK (true);
    `);
  } else if (error) {
    console.log('Other error:', error.message);
  } else {
    console.log('Table exists! Rows:', data.length);
  }
}

setup();
