const { Client } = require('pg');
require('dotenv').config({path: __dirname + '/.env'});

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, subdomain, theme_color, logo_url FROM qrp_tenants WHERE id = 1`);
  console.log(res.rows);
  await client.end();
}
run();
