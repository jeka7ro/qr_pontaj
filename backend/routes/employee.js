const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// POST /api/employee/login
router.post('/login', async (req, res) => {
  try {
    const { employee_code, pin_code } = req.body;
    
    if (!employee_code || !pin_code) {
      return res.status(400).json({ error: 'Cod angajat și PIN obligatorii.' });
    }

    const result = await db.query(
      `SELECT e.id, e.tenant_id, e.first_name, e.last_name, e.avatar_path, e.job_title, t.theme_color as tenant_culoare, t.logo_url as tenant_logo
       FROM qrp_employees e
       JOIN qrp_tenants t ON e.tenant_id = t.id
       WHERE e.employee_code = $1 AND e.pin_code = $2`,
      [employee_code, pin_code]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Cod angajat sau PIN incorect.' });
    }

    const emp = result.rows[0];
    
    // Generate token
    const token = jwt.sign(
      { 
        employee_id: emp.id, 
        tenant_id: emp.tenant_id,
        role: 'EMPLOYEE'
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      token,
      employee: {
        id: emp.id,
        tenant_id: emp.tenant_id,
        employee_code: employee_code,
        first_name: emp.first_name,
        last_name: emp.last_name,
        avatar_path: emp.avatar_path,
        job_title: emp.job_title,
        tenant_culoare: emp.tenant_culoare,
        tenant_logo: emp.tenant_logo
      }
    });

  } catch (error) {
    console.error('Error in employee login:', error);
    res.status(500).json({ error: 'Eroare de server la autentificare.' });
  }
});

// Middleware pentru a proteja rutele de angajat
const employeeAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token lipsă' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'EMPLOYEE') {
      return res.status(403).json({ error: 'Acces interzis' });
    }
    req.user = decoded; // { employee_id, tenant_id, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalid' });
  }
};

// GET /api/employee/dashboard
router.get('/dashboard', employeeAuthMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const result = await db.query(
      `SELECT e.id, e.tenant_id, e.first_name, e.last_name, e.avatar_path, e.job_title, 
              e.employee_code, e.phone, e.email, e.cnp, e.address,
              e.contract_start_date, e.birth_date,
              t.theme_color as tenant_culoare, t.logo_url as tenant_logo
       FROM qrp_employees e 
       JOIN qrp_tenants t ON e.tenant_id = t.id 
       WHERE e.id = $1`,
      [employee_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Angajat negăsit' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee dashboard:', error);
    res.status(500).json({ error: 'Eroare la preluarea datelor angajatului' });
  }
});

// GET /api/employee/shifts
router.get('/shifts', employeeAuthMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT s.id, s.date, s.start_time, s.end_time, s.shift_type, s.notes, s.seen_at,
             loc.name as location_name
      FROM qrp_shifts s
      LEFT JOIN qrp_employees e ON e.id = s.employee_id
      LEFT JOIN qrp_locations loc ON loc.id = e.location_id
      WHERE s.employee_id = $1
    `;
    const params = [employee_id];
    
    if (start_date && end_date) {
      query += ` AND s.date::date >= $2 AND s.date::date <= $3`;
      params.push(start_date, end_date);
    }
    
    query += ` ORDER BY s.date ASC, s.start_time ASC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee shifts:', error);
    res.status(500).json({ error: 'Eroare la preluarea turelor' });
  }
});

// PUT /api/employee/shifts/:shiftId/seen - Marchează tura ca văzută
router.put('/shifts/:shiftId/seen', employeeAuthMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const { shiftId } = req.params;
    
    const result = await db.query(
      `UPDATE qrp_shifts SET seen_at = NOW() WHERE id = $1 AND employee_id = $2 AND seen_at IS NULL RETURNING id, seen_at`,
      [shiftId, employee_id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ already_seen: true });
    }
    
    res.json({ seen_at: result.rows[0].seen_at });
  } catch (error) {
    console.error('Error marking shift as seen:', error);
    res.status(500).json({ error: 'Eroare la marcarea turei' });
  }
});

// POST /api/employee/shift-change-request - Cerere modificare tură
router.post('/shift-change-request', employeeAuthMiddleware, async (req, res) => {
  try {
    const { employee_id, tenant_id } = req.user;
    const { shift_id, reason } = req.body;
    
    if (!shift_id || !reason) {
      return res.status(400).json({ error: 'ID-ul turei și motivul sunt obligatorii.' });
    }

    // Verificăm că tura aparține angajatului
    const shiftCheck = await db.query('SELECT id, date, start_time, end_time FROM qrp_shifts WHERE id = $1 AND employee_id = $2', [shift_id, employee_id]);
    if (shiftCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tura nu a fost găsită.' });
    }

    const shift = shiftCheck.rows[0];
    
    // Salvăm ca o cerere de concediu de tip SHIFT_CHANGE  
    const result = await db.query(
      `INSERT INTO qrp_leaves (tenant_id, employee_id, start_date, end_date, leave_type, reason, status)
       VALUES ($1, $2, $3, $3, 'SHIFT_CHANGE', $4, 'PENDING')
       RETURNING *`,
      [tenant_id, employee_id, shift.date, `Modificare tură ${shift.start_time.slice(0,5)}-${shift.end_time.slice(0,5)}: ${reason}`]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shift change request:', error);
    res.status(500).json({ error: 'Eroare la trimiterea cererii' });
  }
});

// GET /api/employee/leaves - Cererile de concediu ale angajatului
router.get('/leaves', employeeAuthMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const result = await db.query(
      `SELECT id, start_date, end_date, leave_type, status, reason, created_at
       FROM qrp_leaves
       WHERE employee_id = $1
       ORDER BY created_at DESC`,
      [employee_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    res.status(500).json({ error: 'Eroare la preluarea cererilor' });
  }
});

// POST /api/employee/leaves - Creare cerere concediu
router.post('/leaves', employeeAuthMiddleware, async (req, res) => {
  try {
    const { employee_id, tenant_id } = req.user;
    const { start_date, end_date, leave_type, reason } = req.body;
    
    if (!start_date || !leave_type) {
      return res.status(400).json({ error: 'Data și tipul concediului sunt obligatorii.' });
    }
    
    const result = await db.query(
      `INSERT INTO qrp_leaves (tenant_id, employee_id, start_date, end_date, leave_type, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING *`,
      [tenant_id, employee_id, start_date, end_date || start_date, leave_type, reason || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Eroare la trimiterea cererii' });
  }
});

module.exports = router;
