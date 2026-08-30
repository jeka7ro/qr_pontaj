const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/tenants/:id/assets
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT a.*, e.full_name as assigned_to_name
      FROM qrp_assets a
      LEFT JOIN qrp_employees e ON a.assigned_to = e.id
      WHERE a.tenant_id = $1
      ORDER BY a.created_at DESC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Eroare la preluarea echipamentelor' });
  }
});

// POST /api/tenants/:id/assets
router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, serial_number, assigned_to } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Numele echipamentului este obligatoriu' });

    const result = await db.query(
      `INSERT INTO qrp_assets (tenant_id, name, serial_number, assigned_to, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, name, serial_number || null, assigned_to || null, assigned_to ? 'ASSIGNED' : 'AVAILABLE']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Eroare la crearea echipamentului' });
  }
});

// PUT /api/tenants/:id/assets/:assetId/assign
router.put('/:assetId/assign', async (req, res) => {
  try {
    const { id, assetId } = req.params;
    const { assigned_to } = req.body; // null for unassign

    const status = assigned_to ? 'ASSIGNED' : 'AVAILABLE';

    const result = await db.query(
      `UPDATE qrp_assets 
       SET assigned_to = $1, status = $2 
       WHERE id = $3 AND tenant_id = $4 
       RETURNING *`,
      [assigned_to || null, status, assetId, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning asset:', error);
    res.status(500).json({ error: 'Eroare la asignare' });
  }
});

// DELETE /api/tenants/:id/assets/:assetId
router.delete('/:assetId', async (req, res) => {
  try {
    const { id, assetId } = req.params;
    await db.query(`DELETE FROM qrp_assets WHERE id = $1 AND tenant_id = $2`, [assetId, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Eroare la stergere' });
  }
});

module.exports = router;
