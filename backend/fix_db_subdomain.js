const { Client } = require('pg');
require('dotenv').config({path: __dirname + '/.env'});

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  try {
    await client.query(`UPDATE qrp_tenants SET subdomain = 'roll-master' WHERE id = 1`);
    console.log("Subdomain updated to roll-master.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
