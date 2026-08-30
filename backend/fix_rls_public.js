const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      DROP POLICY IF EXISTS "Allow anon insert" ON storage.objects;
      
      CREATE POLICY "Allow public insert"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'uploads');
      
      CREATE POLICY "Allow public update"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'uploads');
    `);
    console.log("Public policies created.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
