const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  await client.connect();
  const res = await client.query('SELECT id, nume_companie, culoare, logo_path FROM qrp_tenants');
  console.table(res.rows);
  await client.end();
}
test();
