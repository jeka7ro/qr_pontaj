require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    await pool.query('BEGIN');

    // Add color columns to qrp_kiosks
    await pool.query(`
      ALTER TABLE qrp_kiosks 
      ADD COLUMN IF NOT EXISTS kiosk_timer_color VARCHAR(50) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS kiosk_bg_color VARCHAR(50) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS kiosk_logo_bg VARCHAR(50) DEFAULT NULL;
    `);
    console.log('Added color columns to qrp_kiosks');

    await pool.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
