const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  await client.connect();
  try {
    const res = await client.query('SELECT id, name, public FROM storage.buckets');
    console.table(res.rows);
  } catch (err) {
    console.log("No storage.buckets accessible or error:", err.message);
  }
  await client.end();
}
test();
