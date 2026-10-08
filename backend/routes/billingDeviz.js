const express = require('express');
const router = express.Router();
const db = require('../db');
const bnrService = require('../services/bnrService');

// GET /api/billing/deviz/bnr-rate
// Returneaza cursul oficial BNR pentru o data data (implicit azi sau data specificata)
router.get('/bnr-rate', async (req, res) => {
  try {
    const { date, currency, refresh } = req.query;
    const forceRefresh = refresh === 'true' || refresh === '1';
    const rateData = await bnrService.getBnrRate(date, currency || 'EUR', forceRefresh);
    res.json({
      success: true,
      ...rateData,
      source: 'Banca Nationala a Romaniei (curs.bnr.ro)'
    });
  } catch (error) {
    res.status(500).json({ error: 'Eroare preluare curs BNR: ' + error.message });
  }
});

// GET /api/billing/deviz/clients
// Returnează lista de clienți activi cu tarifare per angajat pentru selectorul din Smart Invoice
router.get('/clients', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, subdomain, logo_url, billing_start_date, COALESCE(price_per_employee, 0)::numeric as price_per_employee
      FROM qrp_tenants 
      WHERE billing_per_employee = true
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Eroare preluare clienți: ' + error.message });
  }
});

// GET /api/billing/deviz
// Endpoint dedicat integrării cu aplicația de facturi (facturaspev / smart invoice)
// Returnează structura completă de factură + deviz nominal cu zile pe fiecare angajat
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const tenantId = req.query.tenant_id ? parseInt(req.query.tenant_id, 10) : null;
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const tvaPercent = parseFloat(req.query.tva_percent) || 21; // TVA 21%

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month - 1, daysInMonth, 23, 59, 59, 999);

    // Curs BNR oficial in functie de data / zi
    let exchangeRate = parseFloat(req.query.exchange_rate);
    let exchangeRateDate = null;
    let bnrSource = null;
    if (!exchangeRate || isNaN(exchangeRate)) {
      let targetDateStr = req.query.date;
      if (!targetDateStr) {
        const isCurrentMonth = (year === now.getFullYear() && month === (now.getMonth() + 1));
        if (isCurrentMonth) {
          targetDateStr = now.toISOString().slice(0, 10);
        } else {
          targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
        }
      }
      const bnrInfo = await bnrService.getBnrRate(targetDateStr, 'EUR');
      exchangeRate = bnrInfo.rate;
      exchangeRateDate = bnrInfo.bnr_date;
      bnrSource = bnrInfo.is_fallback ? 'Fallback' : 'BNR Oficial';
    }

    // Query tenanți
    let tenantSql = `
      SELECT 
        id, name, subdomain, logo_url, favicon_url, theme_color,
        billing_start_date,
        COALESCE(country_code, 'RO') as country_code,
        COALESCE(currency, 'RON') as currency,
        COALESCE(price_per_employee, 0)::numeric as price_per_employee
      FROM qrp_tenants 
      WHERE billing_per_employee = true
    `;
    const params = [];
    if (tenantId) {
      tenantSql += ` AND id = $1`;
      params.push(tenantId);
    }
    tenantSql += ` ORDER BY name ASC`;

    const tenantsResult = await db.query(tenantSql, params);

    if (tenantId && tenantsResult.rows.length === 0) {
      return res.status(404).json({ error: `Tenantul cu ID ${tenantId} nu a fost găsit sau nu are tarifare per angajat.` });
    }

    const devize = [];

    for (const tenant of tenantsResult.rows) {
      // Verificare dacă luna este anterioară contractului
      if (tenant.billing_start_date) {
        const startDate = new Date(tenant.billing_start_date);
        if (monthEnd < startDate) {
          continue; // Perioadă de testare ignorată
        }
      }

      const price = parseFloat(tenant.price_per_employee) || 0;
      const contractStartDate = tenant.billing_start_date ? new Date(tenant.billing_start_date) : null;

      // Preluare angajați
      const empSql = `
        SELECT id, first_name, last_name, job_title, created_at, is_archived, archived_at
        FROM qrp_employees
        WHERE tenant_id = $1
        ORDER BY last_name ASC, first_name ASC
      `;
      const empResult = await db.query(empSql, [tenant.id]);

      const isRomania = (tenant.country_code || 'RO').toUpperCase() === 'RO';
      const fullRateEmployees = [];
      const halfRateEmployees = [];

      for (const emp of empResult.rows) {
        const created = new Date(emp.created_at);
        if (created > monthEnd) continue;

        if (emp.is_archived && emp.archived_at) {
          const archived = new Date(emp.archived_at);
          if (archived < monthStart || (contractStartDate && archived < contractStartDate)) {
            continue;
          }
        }

        let startDay = 1;
        let isHiredThisMonth = false;
        if (contractStartDate && created <= contractStartDate) {
          startDay = 1;
          isHiredThisMonth = false;
        } else if (created > monthStart) {
          startDay = created.getDate();
          isHiredThisMonth = true;
        }

        let endDay = daysInMonth;
        let isArchivedThisMonth = false;
        if (emp.is_archived && emp.archived_at) {
          const archived = new Date(emp.archived_at);
          if (archived <= monthEnd) {
            endDay = archived.getDate();
            isArchivedThisMonth = true;
          }
        }

        const days = Math.max(1, Math.min(daysInMonth, endDay - startDay + 1));
        const ratePercent = days >= 15 ? 100 : 50;
        const amountEur = days >= 15 ? price : (price * 0.5);
        const amountRon = isRomania ? parseFloat((amountEur * exchangeRate).toFixed(2)) : null;

        let note = `Lună completă (1–${daysInMonth})`;
        let intervalStr = `01.${month.toString().padStart(2, '0')}.${year} – ${daysInMonth.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;

        if (isArchivedThisMonth) {
          const archDate = new Date(emp.archived_at);
          const fArch = `${archDate.getDate().toString().padStart(2, '0')}.${(archDate.getMonth() + 1).toString().padStart(2, '0')}.${archDate.getFullYear()}`;
          note = `Arhivat pe ${fArch} (< 15 zile)`;
          intervalStr = `01.${month.toString().padStart(2, '0')}.${year} – ${fArch}`;
        } else if (isHiredThisMonth) {
          const crDate = new Date(emp.created_at);
          const fCr = `${crDate.getDate().toString().padStart(2, '0')}.${(crDate.getMonth() + 1).toString().padStart(2, '0')}.${crDate.getFullYear()}`;
          note = `Adăugat pe ${fCr}`;
          intervalStr = `${fCr} – ${daysInMonth.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
        }

        const item = {
          nr_crt: 0, // se populează la sortare/combinare
          employee_id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Angajat #${emp.id}`,
          job_title: emp.job_title || 'Nespecificat',
          interval_activ: intervalStr,
          days_active: days,
          days_in_month: daysInMonth,
          rate_percent: ratePercent,
          unit_price_eur: price,
          amount_eur: parseFloat(amountEur.toFixed(2)),
          amount_ron: amountRon,
          note
        };

        if (ratePercent === 100) {
          fullRateEmployees.push(item);
        } else {
          halfRateEmployees.push(item);
        }
      }

      // Re-indexare tabel deviz nominal (toți angajații activi)
      const allDevizItems = [...halfRateEmployees, ...fullRateEmployees].map((item, idx) => ({
        ...item,
        nr_crt: idx + 1
      }));

      // Calcule totale
      const totalEurBase = (fullRateEmployees.length * price) + (halfRateEmployees.length * (price * 0.5));
      const totalRonBase = isRomania ? parseFloat((totalEurBase * exchangeRate).toFixed(2)) : null;

      const tvaMultiplier = tvaPercent / 100;
      const tvaEur = parseFloat((totalEurBase * tvaMultiplier).toFixed(2));
      const tvaRon = isRomania ? parseFloat((totalRonBase * tvaMultiplier).toFixed(2)) : null;

      const totalWithTvaEur = parseFloat((totalEurBase + tvaEur).toFixed(2));
      const totalWithTvaRon = isRomania ? parseFloat((totalRonBase + tvaRon).toFixed(2)) : null;

      // Generare Linii Factură (Invoice Lines pentru facturaspev)
      const invoiceLines = [];
      const monthNames = [
        '', 'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
      ];
      const monthName = monthNames[month] || month;

      if (fullRateEmployees.length > 0) {
        const lineBaseEur = fullRateEmployees.length * price;
        const lineTvaEur = parseFloat((lineBaseEur * tvaMultiplier).toFixed(2));

        const lineObj = {
          line_number: 1,
          description: `Abonament lunar servicii Smart QR Pontaj - ${monthName} ${year} (Angajați activi lună completă)`,
          quantity: fullRateEmployees.length,
          unit_measure: 'pers',
          unit_price_eur: price,
          base_amount_eur: parseFloat(lineBaseEur.toFixed(2)),
          tva_percent: tvaPercent,
          tva_amount_eur: lineTvaEur,
          total_with_tva_eur: parseFloat((lineBaseEur + lineTvaEur).toFixed(2))
        };

        if (isRomania) {
          const lineBaseRon = parseFloat((lineBaseEur * exchangeRate).toFixed(2));
          const lineTvaRon = parseFloat((lineBaseRon * tvaMultiplier).toFixed(2));
          lineObj.unit_price_ron = parseFloat((price * exchangeRate).toFixed(4));
          lineObj.base_amount_ron = lineBaseRon;
          lineObj.tva_amount_ron = lineTvaRon;
          lineObj.total_with_tva_ron = parseFloat((lineBaseRon + lineTvaRon).toFixed(2));
        }

        invoiceLines.push(lineObj);
      }

      if (halfRateEmployees.length > 0) {
        const halfPrice = price * 0.5;
        const lineBaseEur = halfRateEmployees.length * halfPrice;
        const lineTvaEur = parseFloat((lineBaseEur * tvaMultiplier).toFixed(2));

        const lineObj = {
          line_number: invoiceLines.length + 1,
          description: `Abonament lunar servicii Smart QR Pontaj - ${monthName} ${year} (Angajați cotă redusă < 15 zile)`,
          quantity: halfRateEmployees.length,
          unit_measure: 'pers',
          unit_price_eur: parseFloat(halfPrice.toFixed(2)),
          base_amount_eur: parseFloat(lineBaseEur.toFixed(2)),
          tva_percent: tvaPercent,
          tva_amount_eur: lineTvaEur,
          total_with_tva_eur: parseFloat((lineBaseEur + lineTvaEur).toFixed(2))
        };

        if (isRomania) {
          const lineBaseRon = parseFloat((lineBaseEur * exchangeRate).toFixed(2));
          const lineTvaRon = parseFloat((lineBaseRon * tvaMultiplier).toFixed(2));
          lineObj.unit_price_ron = parseFloat((halfPrice * exchangeRate).toFixed(4));
          lineObj.base_amount_ron = lineBaseRon;
          lineObj.tva_amount_ron = lineTvaRon;
          lineObj.total_with_tva_ron = parseFloat((lineBaseRon + lineTvaRon).toFixed(2));
        }

        invoiceLines.push(lineObj);
      }

      devize.push({
        // Date furnizor (Trade Invest Network S.R.L.)
        supplier: {
          name: 'S.C. TRADE INVEST NETWORK S.R.L.',
          cui: '42322117',
          iban: 'RO31BACX0000001999343001',
          bank: 'UniCredit Bank',
          address: 'București, Sector 1, Str. Popa Savu, Nr. 78, Biroul 1, Et. 1, Ap. 3'
        },
        // Date client
        client: {
          tenant_id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          country_code: tenant.country_code || 'RO',
          is_romania: isRomania,
          contract_reference: 'Contract SaaS Nr. 9 din 09.09.2026',
          billing_start_date: tenant.billing_start_date
        },
        // Date perioadă
        billing_period: {
          month,
          month_name: monthName,
          year,
          days_in_month: daysInMonth
        },
        // Curs & Taxe (Curs BNR si RON DOAR pentru clienti din Romania)
        currency: 'EUR',
        billing_currency: isRomania ? 'RON' : (tenant.currency || 'EUR'),
        exchange_rate: isRomania ? exchangeRate : null,
        exchange_rate_date: isRomania ? exchangeRateDate : null,
        bnr_source: isRomania ? bnrSource : null,
        tva_percent: tvaPercent,
        // Sumar factură
        totals: {
          active_employees_count: allDevizItems.length,
          full_rate_count: fullRateEmployees.length,
          half_rate_count: halfRateEmployees.length,
          base_total_eur: parseFloat(totalEurBase.toFixed(2)),
          base_total_ron: totalRonBase,
          tva_total_eur: tvaEur,
          tva_total_ron: tvaRon,
          grand_total_with_tva_eur: totalWithTvaEur,
          grand_total_with_tva_ron: totalWithTvaRon
        },
        // Linii de factură pregătite pentru SPV / Smart Invoice
        invoice_lines: invoiceLines,
        // Deviz nominal complet cu zile pe angajați
        deviz_nominal: allDevizItems
      });
    }

    if (tenantId) {
      return res.json(devize[0] || null);
    }

    res.json({
      month,
      year,
      exchange_rate: exchangeRate,
      exchange_rate_date: exchangeRateDate,
      bnr_source: bnrSource,
      tva_percent: tvaPercent,
      tenants_count: devize.length,
      devize
    });
  } catch (error) {
    console.error('Error generating billing deviz:', error);
    res.status(500).json({ error: 'Eroare la generarea devizului de facturare: ' + error.message });
  }
});

module.exports = router;
