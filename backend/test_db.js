const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  await client.connect();
  const res = await client.query('SELECT id, tenant_id, first_name, last_name FROM qrp_employees');
  console.table(res.rows);
  await client.end();
}
test();
