const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      CREATE POLICY "Allow public select"
      ON storage.objects FOR SELECT
      USING ( bucket_id = 'uploads' );
      
      CREATE POLICY "Allow public delete"
      ON storage.objects FOR DELETE
      USING ( bucket_id = 'uploads' );
    `);
    console.log("Select and delete policies created.");
  } catch(e) {
    console.error(e.message);
  }
  await client.end();
}
run();
