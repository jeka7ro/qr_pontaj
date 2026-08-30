const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      DROP POLICY IF EXISTS "Allow all operations for uploads bucket" ON storage.objects;
      
      CREATE POLICY "Allow anon insert"
      ON storage.objects
      FOR INSERT
      TO anon
      WITH CHECK (bucket_id = 'uploads');

      CREATE POLICY "Allow anon select"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'uploads');

      CREATE POLICY "Allow anon update"
      ON storage.objects
      FOR UPDATE
      TO anon
      USING (bucket_id = 'uploads');
    `);
    console.log("Anon policies created.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
