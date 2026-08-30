const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'uploads'`);
  console.log(res.rows);
  await client.end();
}
run();
