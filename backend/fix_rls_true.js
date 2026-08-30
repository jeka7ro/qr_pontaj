const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  try {
    await client.query(`
      DROP POLICY IF EXISTS "Allow public insert" ON storage.objects;
      CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT WITH CHECK (true);
    `);
    console.log("Created true policy.");
  } catch(e) { console.error(e.message); }
  await client.end();
}
run();
