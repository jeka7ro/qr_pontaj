const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
    `);
    console.log("RLS disabled on storage.objects.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
