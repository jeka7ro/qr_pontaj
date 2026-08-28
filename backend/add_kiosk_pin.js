require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    // Add column if it doesn't exist
    await pool.query('ALTER TABLE qrp_locations ADD COLUMN IF NOT EXISTS kiosk_pin VARCHAR(4) DEFAULT NULL;');
    console.log('Column kiosk_pin added to qrp_locations');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
