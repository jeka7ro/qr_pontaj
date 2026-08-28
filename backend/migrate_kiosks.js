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

    // Create the qrp_kiosks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS qrp_kiosks (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
        location_id INTEGER REFERENCES qrp_locations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        kiosk_pin VARCHAR(4) DEFAULT NULL,
        kiosk_show_photo BOOLEAN DEFAULT true,
        kiosk_orientation VARCHAR(20) DEFAULT 'horizontal',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created qrp_kiosks table');

    // Drop kiosk-related columns from qrp_locations safely
    await pool.query(`
      ALTER TABLE qrp_locations 
      DROP COLUMN IF EXISTS kiosk_pin,
      DROP COLUMN IF EXISTS kiosk_show_photo,
      DROP COLUMN IF EXISTS kiosk_orientation;
    `);
    console.log('Dropped kiosk columns from qrp_locations');

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
