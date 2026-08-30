const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/tenants/:id/revisal
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT c.*, e.full_name as employee_name, e.cnp 
      FROM qrp_contracts c
      JOIN qrp_employees e ON c.employee_id = e.id
      WHERE c.tenant_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Eroare la preluarea contractelor' });
  }
});

// POST /api/tenants/:id/revisal
router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, salary, cor_code, hire_date, contract_number } = req.body;
    
    if (!employee_id || !salary || !hire_date) {
      return res.status(400).json({ error: 'Campuri obligatorii lipsa.' });
    }
    
    const result = await db.query(
      `INSERT INTO qrp_contracts (tenant_id, employee_id, salary, cor_code, hire_date, contract_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, employee_id, salary, cor_code, hire_date, contract_number]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Eroare la crearea contractului' });
  }
});

// GET /api/tenants/:id/revisal/export
router.get('/export', async (req, res) => {
  try {
    const { id } = req.params;
    // Preluăm contractele și formăm un XML
    const result = await db.query(
      `SELECT c.*, e.full_name, e.cnp 
       FROM qrp_contracts c
       JOIN qrp_employees e ON c.employee_id = e.id
       WHERE c.tenant_id = $1`,
      [id]
    );

    let xml = `<?xml version="1.0" encoding="utf-8"?>\n<Revisal>\n  <Salariati>\n`;
    
    result.rows.forEach(row => {
      xml += `    <Salariat>
      <Nume>${row.full_name}</Nume>
      <Cnp>${row.cnp}</Cnp>
      <Contracte>
        <Contract>
          <Numar>${row.contract_number || '1'}</Numar>
          <DataInceput>${new Date(row.hire_date).toISOString().split('T')[0]}</DataInceput>
          <Salariu>${row.salary}</Salariu>
          <Cor>${row.cor_code || '111111'}</Cor>
        </Contract>
      </Contracte>
    </Salariat>\n`;
    });

    xml += `  </Salariati>\n</Revisal>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=revisal_export.xml`);
    res.send(xml);

  } catch (error) {
    console.error('Error generating revisal:', error);
    res.status(500).json({ error: 'Eroare la generarea revisal' });
  }
});

module.exports = router;
