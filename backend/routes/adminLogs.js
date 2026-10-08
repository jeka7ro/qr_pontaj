const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const jwt = require('jsonwebtoken');

// Endpoint-uri accesibile exclusiv de către SuperAdmin
const requireSuperAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 1. Verificare token când este furnizat
  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'SUPERADMIN') {
        req.user = decoded;
        return next();
      } else {
        // Administrator de tenant sau alt rol -> Strict INTERZIS
        return res.status(403).json({ 
          error: 'Acces interzis. Această secțiune este rezervată exclusiv conturilor SuperAdmin.',
          code: 'FORBIDDEN_TENANT'
        });
      }
    } catch (err) {
      const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      if (isLocal) {
        req.user = { role: 'SUPERADMIN', email: 'jeka7ro@gmail.com' };
        return next();
      }
      return res.status(401).json({ error: 'Sesiune expirată. Te rugăm să te autentifici din nou.', code: 'UNAUTHORIZED' });
    }
  }

  // 2. Mediu local / dezvoltare pe root domain
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  if (isLocal) {
    req.user = { role: 'SUPERADMIN', email: 'jeka7ro@gmail.com' };
    return next();
  }

  return res.status(401).json({ error: 'Autentificare necesară ca SuperAdmin.', code: 'UNAUTHORIZED' });
};

router.use(requireSuperAdmin);

/**
 * GET /api/admin/login-logs
 * Returnează jurnalele de autentificare din sistem
 */
router.get('/login-logs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, tenant_id, type, status } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(
        email ILIKE $${paramIndex} OR 
        user_name ILIKE $${paramIndex} OR 
        tenant_name ILIKE $${paramIndex} OR 
        ip_address ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (tenant_id && tenant_id !== 'all') {
      conditions.push(`tenant_id = $${paramIndex}`);
      params.push(parseInt(tenant_id, 10));
      paramIndex++;
    }

    if (type && type !== 'all') {
      conditions.push(`login_type = $${paramIndex}`);
      params.push(type.toUpperCase());
      paramIndex++;
    }

    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex}`);
      params.push(status.toUpperCase());
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Număr total de înregistrări corespunzătoare filtrului
    const countQuery = `SELECT COUNT(*) FROM qrp_login_logs ${whereClause}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    // 2. Extragere loguri paginate
    const logsQuery = `
      SELECT 
        id, 
        tenant_id, 
        tenant_name, 
        user_id, 
        email, 
        user_name, 
        role, 
        login_type, 
        ip_address, 
        user_agent, 
        status, 
        failure_reason, 
        created_at
      FROM qrp_login_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const logsRes = await pool.query(logsQuery, [...params, limit, offset]);

    // 3. Statistici sumare
    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_all,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_total,
        COUNT(*) FILTER (WHERE status = 'SUCCESS') as total_success,
        COUNT(*) FILTER (WHERE status != 'SUCCESS') as total_failed
      FROM qrp_login_logs
    `);
    const stats = statsRes.rows[0] || {};

    // 4. Lista tenanților pentru meniul de filtrare
    const tenantsRes = await pool.query('SELECT id, name, subdomain, logo_url FROM qrp_tenants ORDER BY name ASC');

    res.json({
      logs: logsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        total_all: parseInt(stats.total_all || 0, 10),
        today_total: parseInt(stats.today_total || 0, 10),
        total_success: parseInt(stats.total_success || 0, 10),
        total_failed: parseInt(stats.total_failed || 0, 10)
      },
      tenants: tenantsRes.rows
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ error: 'Eroare la preluarea jurnalului de autentificări' });
  }
});

/**
 * GET /api/admin/scan-logs
 * Jurnalul complet al încercărilor de scanare/pontaj la Kiosk (separate pe tenanți)
 */
router.get('/scan-logs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, tenant_id, status, action_type } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(
        employee_name ILIKE $${paramIndex} OR 
        employee_code ILIKE $${paramIndex} OR 
        tenant_name ILIKE $${paramIndex} OR 
        location_name ILIKE $${paramIndex} OR 
        failure_reason ILIKE $${paramIndex} OR 
        ip_address ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (tenant_id && tenant_id !== 'all') {
      conditions.push(`tenant_id = $${paramIndex}`);
      params.push(parseInt(tenant_id, 10));
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM qrp_scan_logs ${whereClause}`;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const logsQuery = `
      SELECT 
        id, 
        tenant_id, 
        tenant_name, 
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
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const logsRes = await pool.query(logsQuery, [...params, limit, offset]);

    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_all,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_total,
        COUNT(*) FILTER (WHERE status = 'SUCCESS' AND created_at >= CURRENT_DATE) as today_success,
        COUNT(*) FILTER (WHERE status != 'SUCCESS' AND created_at >= CURRENT_DATE) as today_failed,
        COUNT(*) FILTER (WHERE status != 'SUCCESS') as total_failed
      FROM qrp_scan_logs
    `);
    const stats = statsRes.rows[0] || {};

    const tenantsRes = await pool.query('SELECT id, name, subdomain, logo_url FROM qrp_tenants ORDER BY name ASC');

    res.json({
      logs: logsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        total_all: parseInt(stats.total_all || 0, 10),
        today_total: parseInt(stats.today_total || 0, 10),
        today_success: parseInt(stats.today_success || 0, 10),
        today_failed: parseInt(stats.today_failed || 0, 10),
        total_failed: parseInt(stats.total_failed || 0, 10)
      },
      tenants: tenantsRes.rows
    });
  } catch (error) {
    console.error('Error fetching scan logs:', error);
    res.status(500).json({ error: 'Eroare la preluarea jurnalului de scanări' });
  }
});

/**
 * GET /api/admin/timesheets
 * Pontaje reale înregistrate în sistem, separate/filtrabile pe tenanți
 */
router.get('/timesheets', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, tenant_id, action_type, is_manual, date } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(
        e.first_name ILIKE $${paramIndex} OR 
        e.last_name ILIKE $${paramIndex} OR 
        e.employee_code ILIKE $${paramIndex} OR 
        t.name ILIKE $${paramIndex} OR 
        l.name ILIKE $${paramIndex} OR 
        ts.notes ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (tenant_id && tenant_id !== 'all') {
      conditions.push(`ts.tenant_id = $${paramIndex}`);
      params.push(parseInt(tenant_id, 10));
      paramIndex++;
    }

    if (action_type && action_type !== 'all') {
      conditions.push(`ts.action_type = $${paramIndex}`);
      params.push(action_type.toUpperCase());
      paramIndex++;
    }

    if (is_manual === 'true') {
      conditions.push(`ts.is_manual = true`);
    } else if (is_manual === 'false') {
      conditions.push(`(ts.is_manual IS FALSE OR ts.is_manual IS NULL)`);
    }

    if (date) {
      conditions.push(`ts.created_at::date = $${paramIndex}::date`);
      params.push(date);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) 
      FROM qrp_timesheets ts
      LEFT JOIN qrp_employees e ON ts.employee_id = e.id
      LEFT JOIN qrp_tenants t ON ts.tenant_id = t.id
      LEFT JOIN qrp_locations l ON ts.site_id = l.id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const query = `
      SELECT 
        ts.id,
        ts.tenant_id,
        t.name as tenant_name,
        t.subdomain as tenant_subdomain,
        ts.employee_id,
        COALESCE(e.first_name || ' ' || e.last_name, 'Angajat Necunoscut') as employee_name,
        e.employee_code,
        e.avatar_path,
        ts.action_type,
        ts.site_id,
        COALESCE(l.name, 'Locație Nespecificată') as location_name,
        ts.created_at,
        ts.is_manual,
        ts.auto_closed,
        ts.notes
      FROM qrp_timesheets ts
      LEFT JOIN qrp_employees e ON ts.employee_id = e.id
      LEFT JOIN qrp_tenants t ON ts.tenant_id = t.id
      LEFT JOIN qrp_locations l ON ts.site_id = l.id
      ${whereClause}
      ORDER BY ts.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const rowsRes = await pool.query(query, [...params, limit, offset]);

    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_punches,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_punches,
        COUNT(*) FILTER (WHERE is_manual = true) as manual_punches,
        COUNT(*) FILTER (WHERE auto_closed = true) as auto_closed_punches
      FROM qrp_timesheets
    `);
    const stats = statsRes.rows[0] || {};

    res.json({
      timesheets: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        total_punches: parseInt(stats.total_punches || 0, 10),
        today_punches: parseInt(stats.today_punches || 0, 10),
        manual_punches: parseInt(stats.manual_punches || 0, 10),
        auto_closed_punches: parseInt(stats.auto_closed_punches || 0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching admin timesheets:', error);
    res.status(500).json({ error: 'Eroare la preluarea pontajelor' });
  }
});

/**
 * GET /api/admin/tenants-context
 * Oferă lista tenanților, angajaților și locațiilor pentru formularele de intervenție manuală
 */
router.get('/tenants-context', async (req, res) => {
  try {
    const tenantsRes = await pool.query(`
      SELECT id, name, subdomain, logo_url 
      FROM qrp_tenants 
      ORDER BY name ASC
    `);

    const employeesRes = await pool.query(`
      SELECT 
        id, 
        tenant_id, 
        first_name, 
        last_name, 
        employee_code, 
        job_title
      FROM qrp_employees 
      WHERE is_archived IS NOT TRUE
      ORDER BY last_name ASC, first_name ASC
    `);

    const locationsRes = await pool.query(`
      SELECT id, tenant_id, name, address 
      FROM qrp_locations 
      ORDER BY name ASC
    `);

    res.json({
      tenants: tenantsRes.rows,
      employees: employeesRes.rows,
      locations: locationsRes.rows
    });
  } catch (error) {
    console.error('Error fetching tenants context:', error);
    res.status(500).json({ error: 'Eroare la încărcarea datelor de context' });
  }
});

/**
 * POST /api/admin/manual-punch
 * Intervenție manuală de urgență: înregistrare pontaj direct de către SuperAdmin
 */
router.post('/manual-punch', async (req, res) => {
  const { tenant_id, employee_id, action_type, site_id, timestamp, reason } = req.body;

  if (!tenant_id || !employee_id || !action_type || !reason) {
    return res.status(400).json({ 
      error: 'Câmpurile Companie, Angajat, Tip Pontaj și Motiv sunt obligatorii.' 
    });
  }

  const validActions = ['IN', 'OUT', 'BREAK_START', 'BREAK_END'];
  if (!validActions.includes(action_type)) {
    return res.status(400).json({ error: 'Tip de pontaj invalid.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const empRes = await client.query(
      'SELECT id, first_name, last_name, employee_code, tenant_id FROM qrp_employees WHERE id = $1',
      [employee_id]
    );
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Angajatul nu a fost găsit.' });
    }
    const emp = empRes.rows[0];

    let locationId = site_id;
    let locationName = null;
    if (locationId) {
      const locRes = await client.query('SELECT name FROM qrp_locations WHERE id = $1', [locationId]);
      locationName = locRes.rows[0]?.name || null;
    } else {
      const defaultLoc = await client.query('SELECT id, name FROM qrp_locations WHERE tenant_id = $1 LIMIT 1', [tenant_id]);
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
      [tenant_id, employee_id, action_type, locationId || null, reason, punchTime]
    );
    const newTimesheet = insertRes.rows[0];

    // Audit trail imutabil
    await client.query(
      `INSERT INTO qrp_timesheet_audits 
        (tenant_id, timesheet_id, employee_id, modified_by_user_id, action_name, new_data, reason, created_at)
       VALUES ($1, $2, $3, $4, 'MANUAL_INTERVENTION', $5, $6, CURRENT_TIMESTAMP)`,
      [
        tenant_id,
        newTimesheet.id,
        employee_id,
        req.user?.id || null,
        JSON.stringify({
          action_type,
          created_at: punchTime,
          location_id: locationId,
          operator: req.user?.email || 'SuperAdmin'
        }),
        `Intervenție manuală de urgență: ${reason}`
      ]
    );

    // Istoric angajat
    await client.query(
      `INSERT INTO qrp_employee_history (employee_id, change_type, new_value)
       VALUES ($1, 'pontaj_manual', $2)`,
      [employee_id, `Pontaj ${action_type} adăugat manual de SuperAdmin. Motiv: ${reason}`]
    );

    // Jurnal scanări
    await client.query(
      `INSERT INTO qrp_scan_logs 
        (tenant_id, tenant_name, location_id, location_name, employee_id, employee_code, employee_name, action_type, status, failure_reason, ip_address, user_agent, metadata, created_at)
       VALUES ($1, (SELECT name FROM qrp_tenants WHERE id = $1), $2, $3, $4, $5, $6, $7, 'MANUAL', $8, $9, $10, $11, $12)`,
      [
        tenant_id,
        locationId || null,
        locationName,
        employee_id,
        emp.employee_code,
        `${emp.first_name} ${emp.last_name}`,
        action_type,
        `Intervenție manuală de urgență: ${reason}`,
        req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
        req.headers['user-agent'] || null,
        JSON.stringify({ manual: true, operator: req.user?.email || 'SuperAdmin' }),
        punchTime
      ]
    );

    await client.query('COMMIT');

    // Notificare SSE către Dashboard-ul tenant-ului
    try {
      const scanRouter = require('./scan');
      if (typeof scanRouter.notifyAdmin === 'function') {
        scanRouter.notifyAdmin(tenant_id, {
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
      message: 'Pontajul manual a fost înregistrat cu succes în sistem.',
      timesheet: newTimesheet
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting manual punch:', error);
    res.status(500).json({ error: 'Eroare la înregistrarea pontajului manual.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/quick-checkout
 * Închidere rapidă tură / pontaj ieșire pentru un pontaj de intrare
 */
router.post('/quick-checkout', async (req, res) => {
  const { timesheet_id, reason } = req.body;
  if (!timesheet_id || !reason) {
    return res.status(400).json({ error: 'ID-ul pontajului și motivul sunt obligatorii.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inRes = await client.query(
      `SELECT ts.*, e.first_name, e.last_name, e.employee_code 
       FROM qrp_timesheets ts 
       JOIN qrp_employees e ON ts.employee_id = e.id 
       WHERE ts.id = $1`,
      [timesheet_id]
    );

    if (inRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pontajul inițial nu a fost găsit.' });
    }

    const inPunch = inRes.rows[0];
    const now = new Date();

    const outRes = await client.query(
      `INSERT INTO qrp_timesheets 
        (tenant_id, employee_id, action_type, site_id, is_manual, notes, created_at)
       VALUES ($1, $2, 'OUT', $3, true, $4, $5) 
       RETURNING *`,
      [inPunch.tenant_id, inPunch.employee_id, inPunch.site_id, reason, now]
    );

    await client.query(
      `INSERT INTO qrp_timesheet_audits 
        (tenant_id, timesheet_id, employee_id, modified_by_user_id, action_name, new_data, reason)
       VALUES ($1, $2, $3, $4, 'MANUAL_QUICK_CHECKOUT', $5, $6)`,
      [
        inPunch.tenant_id,
        outRes.rows[0].id,
        inPunch.employee_id,
        req.user?.id || null,
        JSON.stringify({ in_timesheet_id: inPunch.id, checkout_time: now }),
        `Ieșire manuală de urgență: ${reason}`
      ]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ieșirea a fost înregistrată cu succes.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error quick checkout:', error);
    res.status(500).json({ error: 'Eroare la înregistrarea ieșirii' });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/admin/timesheets/:id
 * Ștergere pontaj eronat cu motiv obligatoriu pentru audit trail
 */
router.delete('/timesheets/:id', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Motivul ștergerii este obligatoriu conform normelor de audit.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tsRes = await client.query('SELECT * FROM qrp_timesheets WHERE id = $1', [id]);
    if (tsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Înregistrarea de pontaj nu a fost găsită.' });
    }
    const oldPunch = tsRes.rows[0];

    await client.query(
      `INSERT INTO qrp_timesheet_audits 
        (tenant_id, timesheet_id, employee_id, modified_by_user_id, action_name, old_data, reason)
       VALUES ($1, $2, $3, $4, 'PUNCH_DELETED', $5, $6)`,
      [
        oldPunch.tenant_id,
        oldPunch.id,
        oldPunch.employee_id,
        req.user?.id || null,
        JSON.stringify(oldPunch),
        `Ștergere pontaj de către SuperAdmin: ${reason}`
      ]
    );

    await client.query('DELETE FROM qrp_timesheets WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Pontajul a fost șters cu succes.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting punch:', error);
    res.status(500).json({ error: 'Eroare la ștergerea pontajului.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/audits
 * Jurnalul complet de audit pentru intervențiile și modificările efectuate
 */
router.get('/audits', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, tenant_id } = req.query;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(
        e.first_name ILIKE $${paramIndex} OR 
        e.last_name ILIKE $${paramIndex} OR 
        t.name ILIKE $${paramIndex} OR 
        a.action_name ILIKE $${paramIndex} OR 
        a.reason ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (tenant_id && tenant_id !== 'all') {
      conditions.push(`a.tenant_id = $${paramIndex}`);
      params.push(parseInt(tenant_id, 10));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) 
      FROM qrp_timesheet_audits a
      LEFT JOIN qrp_employees e ON a.employee_id = e.id
      LEFT JOIN qrp_tenants t ON a.tenant_id = t.id
      LEFT JOIN qrp_users u ON a.modified_by_user_id = u.id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const query = `
      SELECT 
        a.id,
        a.tenant_id,
        t.name as tenant_name,
        a.timesheet_id,
        a.employee_id,
        COALESCE(e.first_name || ' ' || e.last_name, 'Angajat') as employee_name,
        a.modified_by_user_id,
        COALESCE(u.email, 'SuperAdmin') as modified_by_email,
        a.action_name,
        a.old_data,
        a.new_data,
        a.reason,
        a.created_at
      FROM qrp_timesheet_audits a
      LEFT JOIN qrp_employees e ON a.employee_id = e.id
      LEFT JOIN qrp_tenants t ON a.tenant_id = t.id
      LEFT JOIN qrp_users u ON a.modified_by_user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const rowsRes = await pool.query(query, [...params, limit, offset]);

    res.json({
      audits: rowsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Eroare la preluarea registrului de audit' });
  }
});

module.exports = router;

