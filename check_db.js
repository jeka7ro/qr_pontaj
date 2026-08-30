const { Client } = require('pg');
require('dotenv').config({path: './backend/.env'});

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, nume, logo_url FROM qrp_tenants WHERE id = 1`);
  console.log(res.rows);
  
  const res2 = await client.query(`SELECT id, first_name, last_name, avatar_path FROM qrp_employees WHERE id = 1`);
  console.log(res2.rows);
  
  await client.end();
}
run();
