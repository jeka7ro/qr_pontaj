require('dotenv').config();
const pool = require('./db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE qrp_employees ADD COLUMN IF NOT EXISTS pin_reset_requested BOOLEAN DEFAULT FALSE;');
    
    // Create Documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS qrp_employee_documents (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES qrp_employees(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        document_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    process.exit(0);
  }
}

migrate();
