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

    await pool.query(`
      ALTER TABLE qrp_kiosks 
      ADD COLUMN IF NOT EXISTS kiosk_timer_bg_color VARCHAR(50),
      ADD COLUMN IF NOT EXISTS kiosk_title VARCHAR(255) DEFAULT 'Pontaj Digital',
      ADD COLUMN IF NOT EXISTS kiosk_subtitle TEXT DEFAULT 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.';
    `);
    console.log('Added new kiosk configuration columns');

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
