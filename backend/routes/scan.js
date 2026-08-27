const express = require('express');
const router = express.Router();
const pool = require('../db');

// Inregistrare pontaj
router.post('/record', async (req, res) => {
  const { cnp, tenantId, locationId, actionType } = req.body;

  try {
    // 1. Gaseste angajatul dupa CNP si tenantId
    const empResult = await pool.query(
      'SELECT id, first_name, last_name, avatar_path FROM qrp_employees WHERE cnp = $1 AND tenant_id = $2',
      [cnp, tenantId]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Angajatul nu a fost găsit pentru acest cod numeric.' });
    }

    const employee = empResult.rows[0];

    // 2. Inserare timesheet
    // Nota: presupunem ca exista location_id in qrp_timesheets. Daca nu, va crapa aici.
    // Vom adauga doar tenant_id, employee_id, action_type (si location_id daca exista)
    try {
      await pool.query(
        'INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type) VALUES ($1, $2, $3)',
        [tenantId, employee.id, actionType]
      );
    } catch (insertErr) {
      console.error("Eroare la inserare in qrp_timesheets:", insertErr);
      throw insertErr;
    }

    res.json({
      success: true,
      message: 'Pontaj înregistrat cu succes!',
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: employee.avatar_path
      }
    });

  } catch (err) {
    console.error('Eroare pontaj:', err);
    res.status(500).json({ error: 'Eroare la înregistrarea pontajului.' });
  }
});

module.exports = router;
