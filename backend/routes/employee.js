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
      `SELECT e.id, e.first_name, e.last_name, e.avatar_path, e.job_title, t.theme_color as tenant_culoare, t.logo_url as tenant_logo
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
      SELECT id, date, start_time, end_time, shift_type, notes
      FROM qrp_shifts
      WHERE employee_id = $1
    `;
    const params = [employee_id];
    
    if (start_date && end_date) {
      query += ` AND date >= $2 AND date <= $3`;
      params.push(start_date, end_date);
    }
    
    query += ` ORDER BY date ASC, start_time ASC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee shifts:', error);
    res.status(500).json({ error: 'Eroare la preluarea turelor' });
  }
});

module.exports = router;
