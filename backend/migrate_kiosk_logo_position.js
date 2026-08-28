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
      ADD COLUMN IF NOT EXISTS kiosk_logo_position VARCHAR(50) DEFAULT 'top-left';
    `);
    console.log('Added kiosk_logo_position column to qrp_kiosks');

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
