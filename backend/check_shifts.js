const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  await client.connect();
  const res = await client.query(`
    SELECT s.id, s.employee_id, s.tenant_id, s.date, s.start_time, s.end_time, e.first_name, e.last_name
    FROM qrp_shifts s
    JOIN qrp_employees e ON s.employee_id = e.id
    WHERE s.date = '2026-08-31'
  `);
  console.table(res.rows);
  await client.end();
}
test();
