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

    // Rezolvăm location_id din kiosk
    let location_id = null;
    let showPhoto = true;
    if (kiosk_id) {
      const kioskRes = await pool.query('SELECT location_id, kiosk_show_photo FROM qrp_kiosks WHERE id = $1', [kiosk_id]);
      if (kioskRes.rows.length > 0) {
        location_id = kioskRes.rows[0].location_id;
        showPhoto = kioskRes.rows[0].kiosk_show_photo;
      }
    }

    // Găsim ultimul pontaj + verificăm cooldown anti-dublu-scan
    const lastScanRes = await pool.query(
      `SELECT action_type, created_at
       FROM qrp_timesheets 
       WHERE employee_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [employeeId]
    );

    // Protecție: dacă ultimul scan a fost în ultimele 60 secunde, refuză
    if (lastScanRes.rows.length > 0) {
      const lastScanTime = new Date(lastScanRes.rows[0].created_at);
      const secondsSinceLastScan = (Date.now() - lastScanTime.getTime()) / 1000;
      if (secondsSinceLastScan < 60) {
        const lastAction = lastScanRes.rows[0].action_type;
        const wasEntry = lastAction === 'IN' || lastAction === 'INTRARE';
        return res.json({
          success: true,
          duplicate: true,
          action: lastAction,
          type: lastAction,
          timestamp: lastScanRes.rows[0].created_at,
          message: wasEntry 
            ? `Ești deja pontat la INTRARE. Așteaptă ${Math.ceil(60 - secondsSinceLastScan)} secunde.`
            : `Ești deja pontat la IEȘIRE. Așteaptă ${Math.ceil(60 - secondsSinceLastScan)} secunde.`,
          employee: {
            first_name: employee.first_name,
            last_name: employee.last_name,
            avatar_path: showPhoto ? employee.avatar_path : null
          }
        });
      }
    }

    // Normalizăm: IN/INTRARE = intrat, OUT/IESIRE = ieșit
    let nextAction = 'IN';
    if (lastScanRes.rows.length > 0) {
      const lastAction = lastScanRes.rows[0].action_type;
      if (lastAction === 'IN' || lastAction === 'INTRARE') {
        nextAction = 'OUT';
      }
    }

    // Salvăm pontajul cu location_id corect (nu kiosk_id)
    const insertRes = await pool.query(
      'INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenantId, employeeId, nextAction, location_id]
    );

    // Salvare în istoric
    await pool.query(
      'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
      [employeeId, 'pontaj', `Pontaj ${nextAction === 'IN' ? 'INTRARE' : 'IEȘIRE'} via QR hardware. Kiosk ID: ${kiosk_id}`]
    );

    res.json({
      success: true,
      action: nextAction,
      type: nextAction,
      timestamp: insertRes.rows[0].created_at,
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: showPhoto ? employee.avatar_path : null
      }
    });

  } catch (err) {
    console.error('Eroare hardware scan:', err);
    res.status(500).json({ error: 'Eroare internă a serverului.' });
  }
});



// POST /api/tenants/:id/hardware-scan/history
router.post('/history', async (req, res) => {
  const { id: tenantId } = req.params;
  const { kiosk_id, pin_code } = req.body;

  try {
    if (!kiosk_id) {
      return res.status(400).json({ error: 'Kiosk ID lipsă.' });
    }

    // Găsim kioskul
    const kioskRes = await pool.query('SELECT kiosk_pin, location_id FROM qrp_kiosks WHERE id = $1 AND tenant_id = $2', [kiosk_id, tenantId]);
    if (kioskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Kiosk invalid.' });
    }

    const kiosk = kioskRes.rows[0];

    if (kiosk.kiosk_pin && kiosk.kiosk_pin !== pin_code) {
      return res.status(403).json({ error: 'PIN incorect.' });
    }

    // Aducem pontajele de azi de la locația kioskului
    // Wait, do we want all scans from this tenant? Or from this location?
    // Let's bring all scans for today from this tenant, but maybe only those at this location?
    // Let's just fetch all scans from today for this location, or all scans if kiosk has no location.
    
    let query = `
      SELECT t.id, t.action_type, t.created_at, e.first_name, e.last_name, e.avatar_path
      FROM qrp_timesheets t
      JOIN qrp_employees e ON t.employee_id = e.id
      WHERE t.tenant_id = $1 AND DATE(t.created_at) = CURRENT_DATE
    `;
    let params = [tenantId];

    if (kiosk.location_id) {
      query += ` AND t.site_id = $2`;
      params.push(kiosk.location_id);
    }

    query += ` ORDER BY t.created_at DESC`;

    const historyRes = await pool.query(query, params);

    res.json(historyRes.rows);

  } catch (err) {
    console.error('Eroare history scan:', err);
    res.status(500).json({ error: 'Eroare internă a serverului.' });
  }
});
module.exports = router;
