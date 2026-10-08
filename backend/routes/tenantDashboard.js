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
      SELECT id, name, logo_url, favicon_url, theme_color, created_at, modules,
             subdomain, country_code, timezone, currency, allow_employee_portal, allow_breaks,
             portal_bg_image_url, portal_bg_color,
             stripe_customer_id, stripe_subscription_id, subscription_seats, subscription_status
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
      SELECT e.id, e.first_name, e.last_name, e.avatar_path, e.employee_code, e.job_title,
             COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1), 'OUT') as current_status,
             (SELECT is_manual FROM qrp_timesheets WHERE employee_id = e.id AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1) as current_is_manual,
             (SELECT created_at FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'IN' AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1) as last_in_time,
             (SELECT created_at FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'OUT' AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1) as last_out_time,
             (SELECT MAX(created_at) FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'OUT' AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') AND (created_at AT TIME ZONE 'Europe/Bucharest')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date) as last_scan_time,
             (SELECT MAX(created_at) FROM qrp_timesheets WHERE employee_id = e.id AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute')) as absolute_last_scan,
             COALESCE(
               (SELECT l.name FROM qrp_locations l JOIN qrp_timesheets t ON t.site_id = l.id WHERE t.employee_id = e.id AND t.action_type = 'IN' AND t.created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY t.created_at DESC LIMIT 1),
               (SELECT s.name FROM qrp_sites s JOIN qrp_timesheets t ON t.site_id = s.id WHERE t.employee_id = e.id AND t.action_type = 'IN' AND t.created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY t.created_at DESC LIMIT 1),
               (SELECT l.name FROM qrp_locations l WHERE l.tenant_id = e.tenant_id ORDER BY l.id ASC LIMIT 1),
               (SELECT s.name FROM qrp_sites s WHERE s.tenant_id = e.tenant_id ORDER BY s.id ASC LIMIT 1)
             ) as site_name,
             (SELECT start_time FROM qrp_shifts WHERE employee_id = e.id AND date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date LIMIT 1) as scheduled_start_time,
             (SELECT end_time FROM qrp_shifts WHERE employee_id = e.id AND date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date LIMIT 1) as scheduled_end_time,
             (SELECT shift_type FROM qrp_shifts WHERE employee_id = e.id AND date = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date LIMIT 1) as scheduled_shift_type
      FROM qrp_employees e
      WHERE e.tenant_id = $1
      ORDER BY 
        CASE WHEN COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN' THEN 1 
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
      AND COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN'
    `, [tenantId]);
    const presentNow = parseInt(presentRes.rows[0].count);
    
    const checkinsRes = await pool.query(`
      SELECT COUNT(DISTINCT employee_id) as count 
      FROM qrp_timesheets 
      WHERE tenant_id = $1 
      AND action_type = $2 
      AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute')
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
          AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute')
        ORDER BY employee_id, created_at DESC
      ) t ON t.employee_id = e.id
      LEFT JOIN qrp_sites s ON s.id = t.site_id
      WHERE e.tenant_id = $1 
      AND COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN'
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
    
    // Weekly Data (Ultimele 7 zile: Prezenți, Ore lucrate, Absenți)
    const seriesRes = await pool.query(`
      WITH date_series AS (
        SELECT generate_series(
          (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date - INTERVAL '6 days',
          (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date,
          '1 day'
        )::date AS d
      )
      SELECT 
        ds.d as day_date,
        TO_CHAR(ds.d, 'Dy') as day_name,
        TO_CHAR(ds.d, 'DD.MM') as day_formatted
      FROM date_series ds
      ORDER BY ds.d ASC
    `);
    
    const days = seriesRes.rows;
    const dayMap = { 'Mon': 'L', 'Tue': 'M', 'Wed': 'Mi', 'Thu': 'J', 'Fri': 'V', 'Sat': 'S', 'Sun': 'D' };
    
    // Preluare pontaje din ultimele 7 zile
    const tsRes = await pool.query(`
      SELECT 
        id,
        employee_id,
        action_type,
        created_at,
        (created_at AT TIME ZONE 'Europe/Bucharest')::date as work_date
      FROM qrp_timesheets 
      WHERE tenant_id = $1 
        AND (created_at AT TIME ZONE 'Europe/Bucharest')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date - INTERVAL '6 days'
      ORDER BY employee_id, created_at ASC
    `, [tenantId]);

    // Preluare ture planificate din ultimele 7 zile
    const shiftsRes = await pool.query(`
      SELECT 
        (date AT TIME ZONE 'Europe/Bucharest')::date as shift_date,
        count(DISTINCT employee_id) as planned_count
      FROM qrp_shifts
      WHERE tenant_id = $1
        AND (date AT TIME ZONE 'Europe/Bucharest')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Bucharest')::date - INTERVAL '6 days'
      GROUP BY (date AT TIME ZONE 'Europe/Bucharest')::date
    `, [tenantId]);
    
    const shiftsByDate = {};
    shiftsRes.rows.forEach(s => {
      const key = new Date(s.shift_date).toLocaleDateString('en-CA');
      shiftsByDate[key] = parseInt(s.planned_count, 10);
    });

    const now = new Date();

    const statsByDate = {};
    days.forEach(d => {
      const key = new Date(d.day_date).toLocaleDateString('en-CA');
      statsByDate[key] = {
        date: key,
        name: dayMap[d.day_name] || d.day_name,
        formattedDate: d.day_formatted,
        presentEmps: new Set(),
        totalHours: 0,
        planned: shiftsByDate[key] || 0
      };
    });

    const empDayTs = {};
    tsRes.rows.forEach(r => {
      const dateKey = new Date(r.work_date).toLocaleDateString('en-CA');
      if (!statsByDate[dateKey]) return;
      
      if (r.action_type === 'IN') {
        statsByDate[dateKey].presentEmps.add(r.employee_id);
      }
      
      const key = `${r.employee_id}_${dateKey}`;
      if (!empDayTs[key]) empDayTs[key] = [];
      empDayTs[key].push(r);
    });

    const todayStr = new Date(days[days.length - 1].day_date).toLocaleDateString('en-CA');

    Object.entries(empDayTs).forEach(([key, rows]) => {
      const dateKey = key.split('_')[1];
      let currentIn = null;
      rows.forEach(r => {
        if (r.action_type === 'IN') {
          currentIn = new Date(r.created_at);
        } else if (r.action_type === 'OUT' && currentIn) {
          const durMs = new Date(r.created_at) - currentIn;
          statsByDate[dateKey].totalHours += durMs / (1000 * 3600);
          currentIn = null;
        }
      });
      if (currentIn && dateKey === todayStr) {
        const durMs = now - currentIn;
        statsByDate[dateKey].totalHours += durMs / (1000 * 3600);
      }
    });

    const weeklyData = days.map(d => {
      const key = new Date(d.day_date).toLocaleDateString('en-CA');
      const item = statsByDate[key];
      const present = item.presentEmps.size;
      let absent = 0;
      if (item.planned > 0) {
        absent = Math.max(0, item.planned - present);
      } else if (present > 0) {
        absent = Math.max(0, totalEmployees - present);
      } else {
        absent = 0;
      }
      
      return {
        name: item.name,
        date: item.date,
        formattedDate: item.formattedDate,
        value: present,
        present: present,
        hours: Math.round(item.totalHours * 10) / 10,
        absent: absent,
        totalEmployees: totalEmployees,
        planned: item.planned
      };
    });
    
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

// POST /api/tenant/dashboard/close-all-shifts
router.post('/close-all-shifts', async (req, res) => {
  const client = await pool.connect();
  try {
    const tenantId = req.user.tenant_id;
    const { date, time, timestamp } = req.body;
    let finalTimestamp = timestamp;
    if (!finalTimestamp) {
      if (date && time) {
        finalTimestamp = `${date} ${time}:00`;
      } else {
        finalTimestamp = new Date().toISOString();
      }
    }

    await client.query('BEGIN');

    // Găsim toți angajații activi ai tenant-ului care au ultimul status 'IN'
    const activeQuery = `
      SELECT e.id, e.first_name, e.last_name, e.location_id,
             (SELECT site_id FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'IN' AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1) as last_site_id
      FROM qrp_employees e
      WHERE e.tenant_id = $1
        AND COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id AND created_at <= (CURRENT_TIMESTAMP + INTERVAL '1 minute') ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN'
    `;
    const activeEmployeesRes = await client.query(activeQuery, [tenantId]);
    const activeEmployees = activeEmployeesRes.rows;

    if (activeEmployees.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ success: true, count: 0, message: 'Nu există angajați prezenți în tura curentă.' });
    }

    // Luăm un site de fallback în caz că angajatul nu are site_id
    let defaultSiteId = null;
    const siteRes = await client.query('SELECT id FROM qrp_sites WHERE tenant_id = $1 ORDER BY id ASC LIMIT 1', [tenantId]);
    if (siteRes.rows.length > 0) defaultSiteId = siteRes.rows[0].id;

    for (const emp of activeEmployees) {
      const siteId = emp.last_site_id || emp.location_id || defaultSiteId;
      await client.query(
        `INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id, created_at, is_manual)
         VALUES ($1, $2, 'OUT', $3, $4, true)`,
        [tenantId, emp.id, siteId, finalTimestamp]
      );

      await client.query(
        `INSERT INTO qrp_employee_history (employee_id, change_type, new_value)
         VALUES ($1, 'pontaj', 'Tură ÎNCHISĂ MANUAL (colectiv) de către administrator.')`,
        [emp.id]
      );
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      count: activeEmployees.length,
      message: `Au fost închise cu succes turele pentru toți cei ${activeEmployees.length} angajați prezenți.`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error closing all shifts:', error);
    res.status(500).json({ error: 'Eroare la închiderea colectivă a turelor.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/tenant/dashboard/logs
 * Jurnalul complet al scanărilor și pontajelor pentru chiriașul curent
 */
router.get('/logs', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant lipsă' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 30));
    const offset = (page - 1) * limit;

    const { date, date_from, date_to, hour_from, hour_to, employee_id, status, action_type, search } = req.query;

    const conditions = ['tenant_id = $1'];
    const params = [tenantId];
    let paramIndex = 2;

    if (date) {
      conditions.push(`created_at::date = $${paramIndex}::date`);
      params.push(date);
      paramIndex++;
    } else if (date_from && date_to) {
      conditions.push(`created_at::date >= $${paramIndex}::date AND created_at::date <= $${paramIndex + 1}::date`);
      params.push(date_from, date_to);
      paramIndex += 2;
    }

    if (hour_from !== undefined && hour_from !== '' && hour_from !== 'all') {
      conditions.push(`EXTRACT(HOUR FROM created_at) >= $${paramIndex}`);
      params.push(parseInt(hour_from, 10));
      paramIndex++;
    }
    if (hour_to !== undefined && hour_to !== '' && hour_to !== 'all') {
      conditions.push(`EXTRACT(HOUR FROM created_at) <= $${paramIndex}`);
      params.push(parseInt(hour_to, 10));
      paramIndex++;
    }

    if (employee_id && employee_id !== 'all') {
      conditions.push(`employee_id = $${paramIndex}`);
      params.push(parseInt(employee_id, 10));
      paramIndex++;
    }

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex}`);
      params.push(status.toUpperCase());
      paramIndex++;
    }

    if (action_type && action_type !== 'all') {
      conditions.push(`action_type = $${paramIndex}`);
      params.push(action_type.toUpperCase());
      paramIndex++;
    }

    if (search && search.trim()) {
      conditions.push(`(
        employee_name ILIKE $${paramIndex} OR 
        employee_code ILIKE $${paramIndex} OR 
        location_name ILIKE $${paramIndex} OR 
        failure_reason ILIKE $${paramIndex} OR 
        ip_address ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM qrp_scan_logs ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const logsRes = await pool.query(
      `SELECT 
        id, 
        tenant_id, 
        kiosk_id, 
        location_id, 
        location_name, 
        employee_id, 
        employee_code, 
        employee_name, 
        action_type, 
        status, 
        failure_reason, 
        ip_address, 
        user_agent, 
        metadata, 
        created_at
      FROM qrp_scan_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const targetDateClause = date ? `AND created_at::date = '${date}'::date` : 'AND created_at >= CURRENT_DATE';
    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'SUCCESS' AND action_type = 'IN') as in_count,
        COUNT(*) FILTER (WHERE status = 'SUCCESS' AND action_type = 'OUT') as out_count,
        COUNT(*) FILTER (WHERE status = 'FAILED' OR status = 'REJECTED') as incident_count,
        COUNT(*) FILTER (WHERE status = 'MANUAL') as manual_count
      FROM qrp_scan_logs
      WHERE tenant_id = $1 ${targetDateClause}
    `, [tenantId]);
    const stats = statsRes.rows[0] || {};

    res.json({
      logs: logsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        total_events: parseInt(stats.total_events || 0, 10),
        in_count: parseInt(stats.in_count || 0, 10),
        out_count: parseInt(stats.out_count || 0, 10),
        incident_count: parseInt(stats.incident_count || 0, 10),
        manual_count: parseInt(stats.manual_count || 0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching tenant logs:', error);
    res.status(500).json({ error: 'Eroare la preluarea jurnalului de activitate' });
  }
});

/**
 * GET /api/tenant/dashboard/employees-and-locations
 * Lista angajaților și punctelor de lucru pentru formularele companiei
 */
router.get('/employees-and-locations', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const emps = await pool.query(
      `SELECT id, first_name, last_name, employee_code, avatar_path, job_title 
       FROM qrp_employees 
       WHERE tenant_id = $1 AND (is_archived IS FALSE OR is_archived IS NULL)
       ORDER BY last_name ASC, first_name ASC`,
      [tenantId]
    );

    const locs = await pool.query(
      `SELECT id, name, address 
       FROM qrp_locations 
       WHERE tenant_id = $1 
       ORDER BY name ASC`,
      [tenantId]
    );

    res.json({
      employees: emps.rows,
      locations: locs.rows
    });
  } catch (error) {
    console.error('Error fetching employees and locations:', error);
    res.status(500).json({ error: 'Eroare la preluarea listelor' });
  }
});

/**
 * POST /api/tenant/dashboard/manual-punch
 * Intervenție manuală efectivă din panoul companiei
 */
router.post('/manual-punch', async (req, res) => {
  const tenantId = req.user.tenant_id;
  const { employee_id, action_type, site_id, timestamp, reason } = req.body;

  if (!employee_id || !action_type || !reason) {
    return res.status(400).json({ error: 'Angajatul, tipul pontajului și motivul sunt obligatorii.' });
  }

  const validActions = ['IN', 'OUT', 'BREAK_START', 'BREAK_END'];
  if (!validActions.includes(action_type)) {
    return res.status(400).json({ error: 'Tip de pontaj invalid.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const empRes = await client.query(
      'SELECT id, first_name, last_name, employee_code, tenant_id FROM qrp_employees WHERE id = $1 AND tenant_id = $2',
      [employee_id, tenantId]
    );
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Angajatul nu a fost găsit în compania dvs.' });
    }
    const emp = empRes.rows[0];

    let locationId = site_id;
    let locationName = null;
    if (locationId) {
      const locRes = await client.query('SELECT name FROM qrp_locations WHERE id = $1 AND tenant_id = $2', [locationId, tenantId]);
      locationName = locRes.rows[0]?.name || null;
    } else {
      const defaultLoc = await client.query('SELECT id, name FROM qrp_locations WHERE tenant_id = $1 LIMIT 1', [tenantId]);
      if (defaultLoc.rows.length > 0) {
        locationId = defaultLoc.rows[0].id;
        locationName = defaultLoc.rows[0].name;
      }
    }

    const punchTime = timestamp ? new Date(timestamp) : new Date();

    const insertRes = await client.query(
      `INSERT INTO qrp_timesheets 
        (tenant_id, employee_id, action_type, site_id, is_manual, notes, created_at)
       VALUES ($1, $2, $3, $4, true, $5, $6) 
       RETURNING *`,
      [tenantId, employee_id, action_type, locationId || null, reason, punchTime]
    );
    const newTimesheet = insertRes.rows[0];

    // Audit trail
    await client.query(
      `INSERT INTO qrp_timesheet_audits 
        (tenant_id, timesheet_id, employee_id, modified_by_user_id, action_name, new_data, reason, created_at)
       VALUES ($1, $2, $3, $4, 'MANUAL_INTERVENTION', $5, $6, CURRENT_TIMESTAMP)`,
      [
        tenantId,
        newTimesheet.id,
        employee_id,
        req.user?.id || null,
        JSON.stringify({
          action_type,
          created_at: punchTime,
          location_id: locationId,
          operator: req.user?.email || 'Administrator Companie'
        }),
        `Intervenție manuală: ${reason}`
      ]
    );

    // Istoric angajat
    await client.query(
      `INSERT INTO qrp_employee_history (employee_id, change_type, new_value)
       VALUES ($1, 'pontaj_manual', $2)`,
      [employee_id, `Pontaj ${action_type} adăugat manual de administrator. Motiv: ${reason}`]
    );

    // Jurnal scanări / activitate
    await client.query(
      `INSERT INTO qrp_scan_logs 
        (tenant_id, tenant_name, location_id, location_name, employee_id, employee_code, employee_name, action_type, status, failure_reason, ip_address, user_agent, metadata)
       VALUES ($1, (SELECT name FROM qrp_tenants WHERE id = $1), $2, $3, $4, $5, $6, $7, 'MANUAL', $8, $9, $10, $11)`,
      [
        tenantId,
        locationId || null,
        locationName,
        employee_id,
        emp.employee_code,
        `${emp.first_name} ${emp.last_name}`,
        action_type,
        `Intervenție manuală: ${reason}`,
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
        req.headers['user-agent'] || null,
        JSON.stringify({ manual: true, operator: req.user?.email || 'Administrator' })
      ]
    );

    await client.query('COMMIT');

    // Notificare SSE
    try {
      const scanRouter = require('./scan');
      if (typeof scanRouter.notifyAdmin === 'function') {
        scanRouter.notifyAdmin(tenantId, {
          type: action_type,
          timesheet_id: newTimesheet.id,
          timestamp: punchTime.toISOString(),
          isManual: true,
          employee: {
            first_name: emp.first_name,
            last_name: emp.last_name,
            avatar_path: null,
            job_title: 'Angajat'
          }
        });
      }
    } catch (e) {
      console.warn('SSE notification skipped:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Pontajul a fost înregistrat cu succes.',
      timesheet: newTimesheet
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in tenant manual punch:', error);
    res.status(500).json({ error: 'Eroare la înregistrarea pontajului manual.' });
  } finally {
    client.release();
  }
});

module.exports = router;

