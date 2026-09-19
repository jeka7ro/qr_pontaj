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

module.exports = router;
