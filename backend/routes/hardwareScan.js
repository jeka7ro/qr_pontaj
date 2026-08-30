const express = require('express');
const router = express.Router({ mergeParams: true });
const pool = require('../db');

// POST /api/tenants/:id/hardware-scan
router.post('/', async (req, res) => {
  const { id: tenantId } = req.params;
  const { payload, kiosk_id } = req.body;

  try {
    if (!payload || typeof payload !== 'string' || !payload.startsWith('QRP-EMP-')) {
      return res.status(400).json({ error: 'Cod QR invalid pentru angajat.' });
    }

    // Payload format: QRP-EMP-{tenantId}-{employeeId}
    const parts = payload.split('-');
    if (parts.length !== 4) {
      return res.status(400).json({ error: 'Format QR nerecunoscut.' });
    }

    const qrTenantId = parseInt(parts[2], 10);
    const employeeId = parseInt(parts[3], 10);

    if (qrTenantId !== parseInt(tenantId, 10)) {
      return res.status(403).json({ error: 'Codul QR nu aparține acestei companii.' });
    }

    // Găsim angajatul
    const empResult = await pool.query(
      'SELECT id, first_name, last_name, avatar_path FROM qrp_employees WHERE id = $1 AND tenant_id = $2',
      [employeeId, tenantId]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Angajatul nu a fost găsit.' });
    }
    const employee = empResult.rows[0];

    // Găsim ultimul pontaj de azi
    const todayStr = new Date().toISOString().split('T')[0];
    const lastScanRes = await pool.query(
      `SELECT action_type 
       FROM qrp_timesheets 
       WHERE employee_id = $1 AND DATE(timestamp) = $2
       ORDER BY timestamp DESC LIMIT 1`,
      [employeeId, todayStr]
    );

    let nextAction = 'INTRARE';
    if (lastScanRes.rows.length > 0 && lastScanRes.rows[0].action_type === 'INTRARE') {
      nextAction = 'IESIRE';
    }

    // Salvăm pontajul
    const insertRes = await pool.query(
      'INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenantId, employeeId, nextAction, kiosk_id || null]
    );

    res.json({
      success: true,
      action: nextAction,
      timestamp: insertRes.rows[0].timestamp,
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: employee.avatar_path
      }
    });

  } catch (err) {
    console.error('Eroare hardware scan:', err);
    res.status(500).json({ error: 'Eroare internă a serverului.' });
  }
});

module.exports = router;
