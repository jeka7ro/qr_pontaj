const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public select" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
      
      CREATE POLICY "Allow all operations for uploads bucket"
      ON storage.objects
      FOR ALL
      USING (bucket_id = 'uploads')
      WITH CHECK (bucket_id = 'uploads');
    `);
    console.log("All-in-one policy created.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
