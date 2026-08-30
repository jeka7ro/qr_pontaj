const { Client } = require('pg');
require('dotenv').config({path: __dirname + '/.env'});

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE qrp_shifts ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP`);
    console.log("Coloana 'seen_at' adaugata cu succes la qrp_shifts.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
