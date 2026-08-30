require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='qrp_tenants' AND column_name='modules';
    `);

    if (res.rows.length === 0) {
      console.log('Adaugare coloana modules in qrp_tenants...');
      await client.query(`
        ALTER TABLE qrp_tenants 
        ADD COLUMN modules JSONB DEFAULT '{}';
      `);
      console.log('Coloana a fost adaugata cu succes.');
    } else {
      console.log('Coloana modules exista deja.');
    }

    await client.query(`
      UPDATE qrp_tenants SET modules = '{}' WHERE modules IS NULL;
    `);

    await client.query('COMMIT');
    console.log('Migrarea a fost finalizata cu succes.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Eroare la migrare:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
