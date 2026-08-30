const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/tenants/:id/erp/projects
router.get('/projects', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.*, 
             COUNT(t.id) as timesheet_count 
      FROM qrp_projects p
      LEFT JOIN qrp_timesheets t ON p.id = t.site_id AND t.tenant_id = p.tenant_id
      WHERE p.tenant_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Eroare la preluarea proiectelor' });
  }
});

// POST /api/tenants/:id/erp/projects
router.post('/projects', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, budget, start_date, end_date } = req.body;
    
    const result = await db.query(
      `INSERT INTO qrp_projects (tenant_id, name, budget, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, name, budget || null, start_date || null, end_date || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Eroare la crearea proiectului' });
  }
});

// DELETE /api/tenants/:id/erp/projects/:projectId
router.delete('/projects/:projectId', async (req, res) => {
  try {
    const { id, projectId } = req.params;
    await db.query(`DELETE FROM qrp_projects WHERE id = $1 AND tenant_id = $2`, [projectId, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Eroare la stergere' });
  }
});

module.exports = router;
