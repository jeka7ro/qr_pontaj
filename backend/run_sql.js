const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query('ALTER TABLE qrp_employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE;');
    console.log('Column added successfully.');
    
    const res = await pool.query('SELECT id FROM qrp_employees WHERE employee_code IS NULL ORDER BY created_at ASC');
    let counter = 1;
    for (const row of res.rows) {
      const code = `EMP${counter.toString().padStart(3, '0')}`;
      await pool.query('UPDATE qrp_employees SET employee_code = $1 WHERE id = $2', [code, row.id]);
      counter++;
    }
    console.log('Backfill complete.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
