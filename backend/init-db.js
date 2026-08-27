const fs = require('fs');
const pool = require('./db');

async function runInitSql() {
  try {
    const sql = fs.readFileSync('./init.sql', 'utf8');
    await pool.query(sql);
    console.log('Database tables created successfully (with qrp_ prefix).');
  } catch (err) {
    console.error('Error running init.sql:', err);
  } finally {
    pool.end();
  }
}

runInitSql();
