const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const bnrService = require('../services/bnrService');

// GET /api/tenants/:id/billing/invoices
router.get('/invoices', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantRes = await db.query(
      `SELECT is_online_registration, terms_accepted_at FROM qrp_tenants WHERE id = $1`,
      [id]
    );
    if (tenantRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant inexistent' });
    }
    const isOnline = Boolean(tenantRes.rows[0].is_online_registration || tenantRes.rows[0].terms_accepted_at);
    if (!isOnline) {
      return res.json([]);
    }

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
    const tenantRes = await db.query(
      `SELECT id, name, billing_per_employee, price_per_employee, subscription_status, demo_expires_at, subscription_seats, COALESCE(country_code, 'RO') as country_code, COALESCE(currency, 'RON') as currency, is_online_registration, terms_accepted_at FROM qrp_tenants WHERE id = $1`,
      [id]
    );
    if (tenantRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant inexistent' });
    }
    const tenant = tenantRes.rows[0];
    const isOnline = Boolean(tenant.is_online_registration || tenant.terms_accepted_at);
    if (!isOnline) {
      return res.status(403).json({ error: 'Modulul de facturare online nu este disponibil pentru acest cont creat manual.' });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    const empRes = await db.query(
      `SELECT id, first_name, last_name, job_title, created_at, is_archived, archived_at 
       FROM qrp_employees 
       WHERE tenant_id = $1`,
      [id]
    );

    const isPerEmployee = Boolean(tenant.billing_per_employee);
    const price = parseFloat(tenant.price_per_employee) || 3.50;

    let fullCount = 0;
    let halfCount = 0;

    for (const emp of empRes.rows) {
      const created = new Date(emp.created_at);
      if (created > monthEnd) continue;
      if (emp.is_archived && emp.archived_at) {
        const archived = new Date(emp.archived_at);
        if (archived < monthStart) continue;
      }
      
      let startDay = 1;
      if (created > monthStart) {
        startDay = created.getDate();
      }

      let endDay = daysInMonth;
      if (emp.is_archived && emp.archived_at) {
        const archived = new Date(emp.archived_at);
        if (archived <= monthEnd) {
          endDay = archived.getDate();
        }
      }

      const days = Math.max(1, Math.min(daysInMonth, endDay - startDay + 1));

      if (days >= 15) fullCount++;
      else halfCount++;
    }

    const activeEmployees = fullCount + halfCount;
    const isRomania = (tenant.country_code || 'RO').toUpperCase() === 'RO';
    const estimatedEur = isPerEmployee ? (fullCount * price) + (halfCount * (price * 0.5)) : 199.99;
    
    let exchangeRate = null;
    let estimatedRon = null;
    if (isRomania) {
      const bnrInfo = await bnrService.getBnrRate(now, 'EUR');
      exchangeRate = bnrInfo.rate;
      estimatedRon = parseFloat((estimatedEur * exchangeRate).toFixed(2));
    }

    const isDemo = tenant.subscription_status === 'DEMO';
    const nextRenewal = isDemo && tenant.demo_expires_at ? new Date(tenant.demo_expires_at) : new Date(year, month, 1);

    res.json({
      billing_type: isPerEmployee ? 'per_employee' : 'flat',
      plan_name: isDemo ? 'Perioadă de Testare Gratuită (15 Zile)' : (isPerEmployee ? 'Tarifare per Angajat' : 'Plan Standard'),
      subscription_status: tenant.subscription_status || 'ACTIVE',
      is_demo: isDemo,
      demo_expires_at: tenant.demo_expires_at,
      subscription_seats: tenant.subscription_seats || 10,
      country_code: tenant.country_code || 'RO',
      is_romania: isRomania,
      price_per_employee: price,
      active_employees: activeEmployees,
      full_rate_count: fullCount,
      half_rate_count: halfCount,
      total_employees: empRes.rows.length,
      estimated_eur: parseFloat(estimatedEur.toFixed(2)),
      estimated_ron: estimatedRon,
      price: isPerEmployee ? price : 199.99,
      currency: isRomania ? 'RON' : (tenant.currency || 'EUR'),
      renewal_date: nextRenewal.toISOString(),
      exchange_rate: exchangeRate
    });
  } catch (error) {
    console.error('Error fetching billing plan:', error);
    res.status(500).json({ error: 'Eroare preluare plan' });
  }
});

module.exports = router;
