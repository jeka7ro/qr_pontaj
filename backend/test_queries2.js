require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const tenantId = 1;
    // Present Now & Today Checkins
    const presentRes = await pool.query(`
      SELECT COUNT(*) as count FROM qrp_employees e
      WHERE e.tenant_id = $1 
      AND COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN'
    `, [tenantId]);
    console.log("Present:", presentRes.rows);
    
    // Site Breakdowns
    const sitesRes = await pool.query(`
      SELECT s.id, s.name, COUNT(e.id) as present_count
      FROM qrp_employees e
      LEFT JOIN (
        SELECT DISTINCT ON (employee_id) employee_id, site_id 
        FROM qrp_timesheets 
        WHERE action_type = 'IN' 
        ORDER BY employee_id, created_at DESC
      ) t ON t.employee_id = e.id
      LEFT JOIN qrp_sites s ON s.id = t.site_id
      WHERE e.tenant_id = $1 
      AND COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN'
      GROUP BY s.id, s.name
    `, [tenantId]);
    console.log("Sites:", sitesRes.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
