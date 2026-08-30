const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/tenants/:id/saga/export
router.get('/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query; // '01'-'12', '2023'
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Luna și anul sunt obligatorii.' });
    }

    // Extrage angajații și pontajele pentru acea lună
    const query = `
      SELECT 
        e.cnp, e.full_name,
        t.action_type, t.created_at
      FROM qrp_employees e
      LEFT JOIN qrp_timesheets t ON e.id = t.employee_id 
        AND EXTRACT(MONTH FROM t.created_at) = $1
        AND EXTRACT(YEAR FROM t.created_at) = $2
      WHERE e.tenant_id = $3
      ORDER BY e.full_name, t.created_at ASC
    `;
    
    const result = await db.query(query, [month, year, id]);
    
    // Generăm un CSV simplu tip SAGA C
    let csv = 'CNP,Nume_Salariat,Data,Ora,Actiune\n';
    
    result.rows.forEach(row => {
      if (row.created_at) {
        const date = new Date(row.created_at);
        const dataStr = date.toLocaleDateString('ro-RO');
        const oraStr = date.toLocaleTimeString('ro-RO');
        csv += `${row.cnp},"${row.full_name}",${dataStr},${oraStr},${row.action_type === 'CHECK_IN' ? 'Intrare' : 'Iesire'}\n`;
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=export_saga_${month}_${year}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Error generating saga export:', error);
    res.status(500).json({ error: 'Eroare la generarea exportului' });
  }
});

module.exports = router;
