const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function fix() {
  await client.connect();
  try {
    await client.query(`
      CREATE POLICY "Allow public uploads"
      ON storage.objects FOR INSERT
      WITH CHECK ( bucket_id = 'uploads' );
    `);
    console.log("Policy created.");
  } catch (err) {
    console.error("Error creating policy:", err.message);
  }
  
  try {
    await client.query(`
      CREATE POLICY "Allow public updates"
      ON storage.objects FOR UPDATE
      USING ( bucket_id = 'uploads' );
    `);
    console.log("Update policy created.");
  } catch(err) {}

  await client.end();
}
fix();
