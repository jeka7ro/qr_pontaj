const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// GET /api/tenants/:id/billing/invoices
router.get('/invoices', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT * FROM qrp_invoices WHERE tenant_id = $1 ORDER BY due_date DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Eroare preluare facturi' });
  }
});

// GET /api/tenants/:id/billing/plan
router.get('/plan', async (req, res) => {
  try {
    const { id } = req.params;
    // Return dummy plan info for MVP
    res.json({
      plan_name: 'Premium',
      employees_limit: 100,
      price: 199.99,
      currency: 'RON',
      renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Eroare preluare plan' });
  }
});

module.exports = router;
