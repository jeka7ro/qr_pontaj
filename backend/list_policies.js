const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck
    FROM pg_policy pol
    JOIN pg_class tab ON pol.polrelid = tab.oid
    JOIN pg_namespace nsp ON tab.relnamespace = nsp.oid
    WHERE nsp.nspname = 'storage' AND tab.relname = 'objects';
  `);
  console.log(res.rows);
  await client.end();
}
run();
