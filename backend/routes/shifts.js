const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/tenants/:id/shifts
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query; // optional filtering
    
    let query = `
      SELECT s.*, (e.first_name || ' ' || e.last_name) as employee_name, e.cnp as employee_cnp 
      FROM qrp_shifts s
      JOIN qrp_employees e ON s.employee_id = e.id
      WHERE s.tenant_id = $1
    `;
    const params = [id];
    
    if (start_date && end_date) {
      query += ` AND s.date >= $2 AND s.date <= $3`;
      params.push(start_date, end_date);
    }
    
    query += ` ORDER BY s.date ASC, s.start_time ASC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Eroare la preluarea turelor' });
  }
});

// POST /api/tenants/:id/shifts
router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, date, start_time, end_time, shift_type, notes } = req.body;
    
    if (!employee_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Toate câmpurile (angajat, data, ora start/stop) sunt obligatorii.' });
    }
    
    // Verificam sa nu existe deja o tura pentru acest angajat in aceeasi zi
    const checkQuery = await db.query(
      `SELECT id FROM qrp_shifts WHERE employee_id = $1 AND date = $2`,
      [employee_id, date]
    );
    if (checkQuery.rowCount > 0) {
      return res.status(400).json({ error: 'Acest angajat are deja o tură planificată pentru ziua selectată.' });
    }
    
    const result = await db.query(
      `INSERT INTO qrp_shifts (tenant_id, employee_id, date, start_time, end_time, shift_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, employee_id, date, start_time, end_time, shift_type || 'DAY', notes || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Eroare la crearea turei' });
  }
});

// PUT /api/tenants/:id/shifts/:shiftId
router.put('/:shiftId', async (req, res) => {
  try {
    const { id, shiftId } = req.params;
    const { employee_id, date, start_time, end_time, shift_type, notes } = req.body;
    
    if (!employee_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Toate câmpurile (angajat, data, ora start/stop) sunt obligatorii.' });
    }
    
    // Verificam sa nu existe deja o tura pentru acest angajat in aceeasi zi (excluzand tura curenta)
    const checkQuery = await db.query(
      `SELECT id FROM qrp_shifts WHERE employee_id = $1 AND date = $2 AND id != $3`,
      [employee_id, date, shiftId]
    );
    if (checkQuery.rowCount > 0) {
      return res.status(400).json({ error: 'Acest angajat are deja o tură planificată pentru ziua selectată.' });
    }
    
    const result = await db.query(
      `UPDATE qrp_shifts 
       SET employee_id = $1, date = $2, start_time = $3, end_time = $4, shift_type = $5, notes = $6
       WHERE id = $7 AND tenant_id = $8
       RETURNING *`,
      [employee_id, date, start_time, end_time, shift_type || 'DAY', notes || null, shiftId, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tura nu a fost găsită' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: 'Eroare la actualizarea turei' });
  }
});

// DELETE /api/tenants/:id/shifts/:shiftId
router.delete('/:shiftId', async (req, res) => {
  try {
    const { id, shiftId } = req.params;
    
    const result = await db.query(
      `DELETE FROM qrp_shifts WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [shiftId, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tura nu a fost găsită' });
    }
    
    res.json({ success: true, message: 'Tura ștearsă cu succes' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Eroare la ștergerea turei' });
  }
});

module.exports = router;
