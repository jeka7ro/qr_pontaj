require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const tenantId = 1;
    const weeklyQueryStr = `
      WITH date_series AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS d
      )
      SELECT 
        TO_CHAR(ds.d, 'Dy') as name,
        ds.d as full_date,
        COUNT(DISTINCT t.employee_id) as value
      FROM date_series ds
      LEFT JOIN qrp_timesheets t 
        ON t.created_at::date = ds.d 
        AND t.tenant_id = $1 
        AND t.action_type = 'IN'
      GROUP BY ds.d
      ORDER BY ds.d ASC
    `;
    const weeklyRes = await pool.query(weeklyQueryStr, [tenantId]);
    console.log(weeklyRes.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
