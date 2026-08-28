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
      ALTER TABLE qrp_employees 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    console.log('Added phone and email columns to qrp_employees');

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
