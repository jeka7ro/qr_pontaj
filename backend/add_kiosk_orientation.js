require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query("ALTER TABLE qrp_locations ADD COLUMN IF NOT EXISTS kiosk_orientation VARCHAR(20) DEFAULT 'horizontal';");
    console.log('Column kiosk_orientation added to qrp_locations');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
