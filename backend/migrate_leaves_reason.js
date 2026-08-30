const { Client } = require('pg');
require('dotenv').config({path: __dirname + '/.env'});

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE qrp_leaves ADD COLUMN IF NOT EXISTS reason TEXT`);
    console.log("Coloana 'reason' adaugata cu succes.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
