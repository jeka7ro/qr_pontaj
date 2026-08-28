require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query('ALTER TABLE qrp_locations ADD COLUMN IF NOT EXISTS kiosk_show_photo BOOLEAN DEFAULT true;');
    console.log('Column kiosk_show_photo added to qrp_locations');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
