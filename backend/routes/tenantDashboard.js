const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { evaluateModules } = require('../utils/modulesHelper');

const router = express.Router();

// Middleware: Trebuie să fii logat și să fii TENANT_ADMIN
router.use(authenticateToken);
router.use(requireRole('TENANT_ADMIN'));

// GET /api/tenant/dashboard/info - Preia detaliile companiei (tenant) + setările locației (site)
router.get('/info', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Acest utilizator nu este asociat unui tenant.' });
    }

    // Luăm datele tenant-ului
    const tenantQuery = `
      SELECT id, name, logo_url, favicon_url, theme_color, created_at, modules 
      FROM qrp_tenants 
      WHERE id = $1
    `;
    const tenantResult = await pool.query(tenantQuery, [tenantId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Compania nu a fost găsită.' });
    }

    const tenant = tenantResult.rows[0];
    if (tenant.modules) {
      tenant.modules = evaluateModules(tenant.modules);
    }

    // Luăm datele locației (site) asociate acestui tenant (pentru generarea QR)
    const siteQuery = `
      SELECT id, name as tip_modul, qr_mode, allowed_radius_meters 
      FROM qrp_sites 
      WHERE tenant_id = $1 
      ORDER BY id ASC LIMIT 1
    `;
    const siteResult = await pool.query(siteQuery, [tenantId]);
    const site = siteResult.rows[0] || null;

    res.json({
      tenant,
      site
    });
  } catch (error) {
    console.error('Error fetching tenant dashboard info:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});


// GET /api/tenant/dashboard/live
router.get('/live', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const query = `
      SELECT e.id, e.first_name, e.last_name, e.avatar_path,
             COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 'OUT') as current_status,
             (SELECT MIN(created_at) FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'IN' AND (created_at AT TIME ZONE 'Europe/Bucharest')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date) as first_in_today,
             (SELECT MAX(created_at) FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'OUT' AND (created_at AT TIME ZONE 'Europe/Bucharest')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date) as last_scan_time,
             (SELECT MAX(created_at) FROM qrp_timesheets WHERE employee_id = e.id) as absolute_last_scan,
             (SELECT s.name FROM qrp_sites s JOIN qrp_timesheets t ON t.site_id = s.id WHERE t.employee_id = e.id AND t.action_type = 'IN' ORDER BY t.created_at DESC LIMIT 1) as site_name,
             (SELECT start_time FROM qrp_shifts WHERE employee_id = e.id AND date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date LIMIT 1) as scheduled_start_time,
             (SELECT end_time FROM qrp_shifts WHERE employee_id = e.id AND date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date LIMIT 1) as scheduled_end_time
      FROM qrp_employees e
      WHERE e.tenant_id = $1
      ORDER BY 
        CASE WHEN COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN' THEN 1 
             ELSE 2 END, 
        e.first_name ASC
    `;
    const result = await pool.query(query, [tenantId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la preluarea angajatilor live' });
  }
});

// GET /api/tenant/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    // Total Employees
    const empRes = await pool.query('SELECT COUNT(*) as count FROM qrp_employees WHERE tenant_id = $1', [tenantId]);
    const totalEmployees = parseInt(empRes.rows[0].count);
    
    // Present Now & Today Checkins
    const presentRes = await pool.query(`
      SELECT COUNT(*) as count FROM qrp_employees e
      WHERE e.tenant_id = $1 
      AND COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN'
    `, [tenantId]);
    const presentNow = parseInt(presentRes.rows[0].count);
    
    const checkinsRes = await pool.query(`
      SELECT COUNT(DISTINCT employee_id) as count 
      FROM qrp_timesheets 
      WHERE tenant_id = $1 
      AND action_type = $2 
      AND (created_at AT TIME ZONE 'Europe/Bucharest')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date
    `, [tenantId, 'IN']);
    const todayCheckins = parseInt(checkinsRes.rows[0].count);
    
    // Site Breakdowns for "IN"
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
    
    const presentDetails = [];
    const colorPalette = ['#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24', '#38bdf8', '#f87171'];
    
    let colorIndex = 0;
    for (const row of sitesRes.rows) {
      const siteName = row.name || 'Fara locatie';
      const c = colorPalette[colorIndex % colorPalette.length];
      presentDetails.push({ name: siteName, value: parseInt(row.present_count), fillId: 'site_' + row.id, color: c });
      colorIndex++;
    }
    
    const rootData = [
      { name: 'Prezenți', value: presentNow, fillId: 'url(#present)' },
      { name: 'Absenți', value: totalEmployees - presentNow, fillId: 'url(#absent)' }
    ];
    
    const donutDataDetails = {
      'Prezenți': presentDetails
    };
    
    // Weekly Data
    const weeklyQueryStr = `
      WITH date_series AS (
        SELECT generate_series((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date - INTERVAL '6 days', (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date, '1 day')::date AS d
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
    const dayMap = { 'Mon': 'L', 'Tue': 'M', 'Wed': 'Mi', 'Thu': 'J', 'Fri': 'V', 'Sat': 'S', 'Sun': 'D' };
    const weeklyData = weeklyRes.rows.map(r => ({
      name: dayMap[r.name] || r.name,
      value: parseInt(r.value)
    }));
    
    res.json({
      totalEmployees,
      presentNow,
      todayCheckins,
      donutDataRoot: rootData,
      donutDataDetails,
      siteColors: presentDetails.map(p => ({ id: p.fillId.replace('url(#','').replace(')',''), color: p.color })),
      weeklyData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la preluarea statisticilor' });
  }
});

// GET /api/tenant/dashboard/pending-notifications
router.get('/pending-notifications', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    // mock empty for now to fix the 404
    res.json([]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare la notificari' });
  }
});

module.exports = router;
