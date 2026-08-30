require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('Adaugare coloana qr_mode in qrp_kiosks...');
    await pool.query(`ALTER TABLE qrp_kiosks ADD COLUMN IF NOT EXISTS qr_mode VARCHAR(20) DEFAULT 'DYNAMIC';`);
    console.log('Migrare completa cu succes.');
    process.exit(0);
  } catch (err) {
    console.error('Eroare la migrare:', err);
    process.exit(1);
  }
}

runMigration();
