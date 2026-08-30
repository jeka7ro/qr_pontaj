const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/tenants/:id/leaves
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT l.*, e.first_name || ' ' || e.last_name as employee_name, e.avatar_path 
      FROM qrp_leaves l
      JOIN qrp_employees e ON l.employee_id = e.id
      WHERE l.tenant_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ error: 'Eroare la preluarea cererilor de concediu' });
  }
});

// POST /api/tenants/:id/leaves
router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, start_date, end_date, leave_type } = req.body;
    
    if (!employee_id || !start_date || !end_date || !leave_type) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
    }
    
    const result = await db.query(
      `INSERT INTO qrp_leaves (tenant_id, employee_id, start_date, end_date, leave_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, employee_id, start_date, end_date, leave_type]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating leave:', error);
    res.status(500).json({ error: 'Eroare la crearea cererii' });
  }
});

// PUT /api/tenants/:id/leaves/:leaveId/status
router.put('/:leaveId/status', async (req, res) => {
  try {
    const { id, leaveId } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status invalid.' });
    }

    const result = await db.query(
      `UPDATE qrp_leaves SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, leaveId, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ error: 'Eroare la actualizarea statusului' });
  }
});

// DELETE /api/tenants/:id/leaves/:leaveId
router.delete('/:leaveId', async (req, res) => {
  try {
    const { id, leaveId } = req.params;
    await db.query(`DELETE FROM qrp_leaves WHERE id = $1 AND tenant_id = $2`, [leaveId, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({ error: 'Eroare la stergere' });
  }
});

module.exports = router;
