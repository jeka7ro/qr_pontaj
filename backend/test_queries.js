require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`
      SELECT e.id, e.first_name, e.last_name, e.avatar_path,
        COALESCE(
          (SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1),
          'OUT'
        ) as current_status,
        (SELECT MIN(created_at) FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'IN' AND DATE(created_at) = CURRENT_DATE) as first_in_today,
        (SELECT MAX(created_at) FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'OUT' AND DATE(created_at) = CURRENT_DATE) as last_scan_time,
        (SELECT s.name FROM qrp_sites s JOIN qrp_timesheets t ON t.site_id = s.id WHERE t.employee_id = e.id AND t.action_type = 'IN' ORDER BY t.created_at DESC LIMIT 1) as site_name
      FROM qrp_employees e
      LIMIT 1
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
