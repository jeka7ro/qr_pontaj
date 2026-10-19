const express = require('express');
const router = express.Router();
const db = require('../db');
const { lookupAnafCompany } = require('../services/anafService');

// POST /api/accountants/register — Înregistrare gratuită partener contabil
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, cui, city } = req.body;

    if (!name || !email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Numele și adresa de email sunt obligatorii.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCui = (cui || '').replace(/[^0-9]/g, '');

    // Verificăm dacă există deja
    const existing = await db.query('SELECT * FROM qrp_accountant_partners WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.json({ success: true, partner: existing.rows[0], isExisting: true });
    }

    // Generăm un cod unic de referral (ex: CONTA-B94F)
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referralCode = `CONTA-${randomHex}`;

    const insertRes = await db.query(`
      INSERT INTO qrp_accountant_partners (name, email, phone, cui, city, referral_code, commission_rate, status)
      VALUES ($1, $2, $3, $4, $5, $6, 20.0, 'active')
      RETURNING *;
    `, [name.trim(), cleanEmail, phone || '', cleanCui, city || '', referralCode]);

    res.json({ success: true, partner: insertRes.rows[0], isNew: true });
  } catch (err) {
    console.error('Eroare înregistrare contabil:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/accountants/:id — Profil partener contabil
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partnerRes = await db.query('SELECT * FROM qrp_accountant_partners WHERE id = $1', [id]);
    if (partnerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partener inexistent' });
    }
    res.json({ success: true, partner: partnerRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/accountants/:id/clients — Lista clienților (firme) asociați
router.get('/:id/clients', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        t.id,
        t.name,
        t.subdomain,
        t.vat_number as cui,
        t.billing_address,
        t.subscription_status,
        t.created_at,
        COUNT(DISTINCT e.id) as active_employees,
        at.created_at as linked_at
      FROM qrp_accountant_tenants at
      JOIN qrp_tenants t ON at.tenant_id = t.id
      LEFT JOIN qrp_employees e ON e.tenant_id = t.id AND (e.is_archived IS NULL OR e.is_archived = false)
      WHERE at.accountant_id = $1
      GROUP BY t.id, t.name, t.subdomain, t.vat_number, t.billing_address, t.subscription_status, t.created_at, at.created_at
      ORDER BY t.name ASC;
    `;

    const result = await db.query(query, [id]);
    
    // Calculăm comisionul estimat: 20% din (5 EUR * nr angajați)
    const clients = result.rows.map(c => {
      const empCount = parseInt(c.active_employees, 10) || 0;
      const monthlyRevenue = empCount * 5.0; // 5 EUR / angajat
      const monthlyCommission = monthlyRevenue * 0.20; // 20%
      return {
        ...c,
        employee_count: empCount,
        monthly_revenue_eur: monthlyRevenue,
        commission_eur: monthlyCommission
      };
    });

    const totalEmployees = clients.reduce((acc, c) => acc + c.employee_count, 0);
    const totalCommissionEur = clients.reduce((acc, c) => acc + c.commission_eur, 0);

    res.json({
      success: true,
      clients,
      stats: {
        totalClients: clients.length,
        totalEmployees,
        totalCommissionEur
      }
    });
  } catch (err) {
    console.error('Eroare get clients contabil:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/accountants/:id/link-client — Asociază o firmă existentă sau creează cont nou prin CUI
router.post('/:id/link-client', async (req, res) => {
  try {
    const { id } = req.params;
    const { cui, name, email, phone } = req.body;

    const cleanCui = (cui || '').replace(/[^0-9]/g, '');

    // Căutăm dacă firma există deja în qrp_tenants după CUI sau nume
    let tenant = null;
    if (cleanCui) {
      const tRes = await db.query('SELECT * FROM qrp_tenants WHERE vat_number LIKE $1 LIMIT 1', [`%${cleanCui}%`]);
      if (tRes.rows.length > 0) tenant = tRes.rows[0];
    }

    if (!tenant && name) {
      const tRes = await db.query('SELECT * FROM qrp_tenants WHERE LOWER(name) = LOWER($1) LIMIT 1', [name.trim()]);
      if (tRes.rows.length > 0) tenant = tRes.rows[0];
    }

    // Dacă nu există încă firma în platformă, o putem crea pe loc (sau interoga ANAF pentru date exacte)
    if (!tenant) {
      let companyName = name;
      let companyAddress = '';

      if (cleanCui) {
        const anafData = await lookupAnafCompany(cleanCui);
        if (anafData) {
          companyName = companyName || anafData.name;
          companyAddress = anafData.address;
        }
      }

      if (!companyName) {
        return res.status(400).json({ success: false, message: 'Nu s-a putut identifica denumirea companiei. Introduceți un CUI sau nume valid.' });
      }

      const generatedSubdomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || `client${Date.now().toString().slice(-5)}`;
      
      const newTenant = await db.query(`
        INSERT INTO qrp_tenants (name, subdomain, vat_number, billing_address, contact_email, contact_phone, subscription_status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING *;
      `, [companyName, generatedSubdomain, cleanCui, companyAddress, email || '', phone || '']);

      tenant = newTenant.rows[0];
    }

    // Asociem firma cu partenerul contabil
    await db.query(`
      INSERT INTO qrp_accountant_tenants (accountant_id, tenant_id)
      VALUES ($1, $2)
      ON CONFLICT (accountant_id, tenant_id) DO NOTHING;
    `, [id, tenant.id]);

    res.json({ success: true, message: `Compania ${tenant.name} a fost asociată cu succes în contul tău de contabil!`, tenant });
  } catch (err) {
    console.error('Eroare asociere client contabil:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
