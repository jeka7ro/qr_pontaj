const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT polname, polcmd, polqual, polwithcheck 
    FROM pg_policy p 
    JOIN pg_class c ON p.polrelid = c.oid 
    WHERE c.relname = 'objects';
  `);
  console.log(res.rows);
  await client.end();
}
run();
