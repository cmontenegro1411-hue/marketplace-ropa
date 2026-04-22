const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.qvygvdgruhefwmeaorqi:f7481ba08daaf2c1eedbf27b9c9f287f339fcc01a3ce3de8eec2e9ca@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    await client.connect();
    await client.query('ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS successfully enabled on pending_registrations');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
