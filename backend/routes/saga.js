const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

/**
 * Calculează orele de noapte (între 22:00 și 06:00, conform Art. 125 Codul Muncii)
 * pentru intervalul [start, end].
 */
function calculateNightHours(start, end) {
  let nightMs = 0;
  let cur = new Date(start.getTime());
  const endMs = end.getTime();
  const stepMs = 15 * 60 * 1000; // verificăm în pași de 15 minute

  while (cur.getTime() < endMs) {
    const next = new Date(Math.min(cur.getTime() + stepMs, endMs));
    const localHour = parseInt(cur.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', hour12: false }), 10);
    if (localHour >= 22 || localHour < 6) {
      nightMs += (next.getTime() - cur.getTime());
    }
    cur = next;
  }
  return nightMs / (1000 * 60 * 60);
}

// GET /api/tenants/:id/saga/export
// Parametri:
//   month: '1'-'12'
//   year: '2026'
//   type: 'events' (implicit, pontaj brut ceas/QR) | 'summary' (centralizator salarii cu ore noapte/weekend/suplimentare)
//   separator: ',' | ';' (implicit ',')
router.get('/export', async (req, res) => {
  try {
    const { id } = req.params;
    const month = parseInt(req.query.month || (new Date().getMonth() + 1), 10);
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const exportType = (req.query.type || 'events').toLowerCase();
    const sep = req.query.separator === ';' ? ';' : ',';

    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: 'Luna și anul sunt obligatorii și trebuie să fie numere valide.' });
    }

    // Extragem angajații și pontajele pentru luna și anul cerut
    const query = `
      SELECT 
        e.id as employee_id,
        COALESCE(e.employee_code, '') as employee_code,
        COALESCE(e.cnp, '') as cnp,
        TRIM(CONCAT(e.last_name, ' ', e.first_name)) as full_name,
        COALESCE(e.job_title, 'Salariat') as job_title,
        e.work_schedule,
        t.action_type,
        t.created_at
      FROM qrp_employees e
      JOIN qrp_timesheets t ON e.id = t.employee_id 
        AND EXTRACT(MONTH FROM (t.created_at AT TIME ZONE 'Europe/Bucharest')) = $1
        AND EXTRACT(YEAR FROM (t.created_at AT TIME ZONE 'Europe/Bucharest')) = $2
      WHERE e.tenant_id = $3
      ORDER BY full_name, t.created_at ASC
    `;

    // Verificăm dacă tenantul se află în mod Demo
    const tenantRes = await db.query('SELECT name, is_demo, subscription_status FROM qrp_tenants WHERE id = $1', [id]);
    const tData = tenantRes.rows[0];
    const isDemo = Boolean(
      tData?.is_demo === true || 
      tData?.subscription_status === 'DEMO' || 
      tData?.subscription_status === 'PENDING_SUBSCRIPTION' ||
      tData?.subscription_status !== 'ACTIVE'
    );

    // Format 1: CENTRALIZATOR LUNAR SALARII SAGA & EXCEL
    if (exportType === 'summary' || exportType === 'centralizator') {
      const byEmp = {};
      result.rows.forEach(r => {
        if (!byEmp[r.employee_id]) {
          byEmp[r.employee_id] = {
            code: r.employee_code,
            cnp: r.cnp,
            name: r.full_name,
            jobTitle: r.job_title,
            scans: []
          };
        }
        byEmp[r.employee_id].scans.push(r);
      });

      // Header SAGA Centralizator Salarii
      let csv = '\uFEFF'; // UTF-8 BOM pentru deschidere directă corectă în Excel fără caractere stricate
      if (isDemo) {
        csv += `# CONT DEMONSTRATIV PONTAJ.APP — PĂSTRAT EXCLUSIV PENTRU TESTARE • NECONFORM PENTRU AUDIT ITM SAU SALARII OFICIALE\n`;
      }
      csv += ['Marca', 'CNP', 'Nume_Salariat', 'Functie', 'Zile_Lucrate', 'Ore_Normale', 'Ore_Noapte', 'Ore_Weekend', 'Ore_Suplimentare', 'Total_Ore'].join(sep) + '\n';

      for (const empId of Object.keys(byEmp)) {
        const emp = byEmp[empId];
        let totalHours = 0;
        let nightHours = 0;
        let weekendHours = 0;
        const workDays = new Set();

        let lastIn = null;
        for (const scan of emp.scans) {
          if (scan.action_type === 'IN') {
            lastIn = new Date(scan.created_at);
          } else if (scan.action_type === 'OUT' && lastIn) {
            const outDate = new Date(scan.created_at);
            const diffMs = outDate.getTime() - lastIn.getTime();
            if (diffMs > 0 && diffMs < 24 * 3600 * 1000) {
              const durationHours = diffMs / (1000 * 3600);
              totalHours += durationHours;

              const dateStr = lastIn.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest' });
              workDays.add(dateStr);

              const dayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Bucharest', weekday: 'short' }).format(lastIn);
              if (dayName === 'Sat' || dayName === 'Sun') {
                weekendHours += durationHours;
              }

              nightHours += calculateNightHours(lastIn, outDate);
            }
            lastIn = null;
          }
        }

        const daysCount = workDays.size;
        const normalDailyHours = 8;
        const standardExpected = daysCount * normalDailyHours;
        const overtimeHours = Math.max(0, totalHours - standardExpected);
        const normalHours = totalHours - overtimeHours;

        const rowValues = [
          `"${emp.code}"`,
          `"${emp.cnp}"`,
          `"${emp.name.replace(/"/g, '""')}"`,
          `"${emp.jobTitle.replace(/"/g, '""')}"`,
          daysCount,
          normalHours.toFixed(2),
          nightHours.toFixed(2),
          weekendHours.toFixed(2),
          overtimeHours.toFixed(2),
          totalHours.toFixed(2)
        ];
        csv += rowValues.join(sep) + '\n';
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=saga_centralizator_salarii_${month}_${year}.csv`);
      return res.send(csv);
    }

    // Format 2 (Implicit): EVENIMENTE BRUTE PONTAJ ELECTRONIC SAGA C (Ceasuri / Dispozitive Pontaj)
    // Format compatibil cu SAGA C -> Diverse -> Import pontaj din fisiere
    let csv = '\uFEFF'; // UTF-8 BOM
    if (isDemo) {
      csv += `# CONT DEMONSTRATIV PONTAJ.APP — PĂSTRAT EXCLUSIV PENTRU TESTARE • NECONFORM PENTRU AUDIT ITM SAU SALARII OFICIALE\n`;
    }
    csv += ['Marca', 'CNP', 'Nume_Salariat', 'Data', 'Ora', 'Sens', 'Tip'].join(sep) + '\n';

    result.rows.forEach(row => {
      if (row.created_at) {
        const date = new Date(row.created_at);
        // Formatare explicită în Europe/Bucharest: DD.MM.YYYY și HH:MM:SS
        const dataStr = date.toLocaleDateString('ro-RO', {
          timeZone: 'Europe/Bucharest',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const oraStr = date.toLocaleTimeString('ro-RO', {
          timeZone: 'Europe/Bucharest',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        // În SAGA: Sens 1 = Intrare, Sens 2 = Ieșire
        const sens = row.action_type === 'IN' ? '1' : '2';
        const tipText = row.action_type === 'IN' ? 'IN' : 'OUT';

        const rowValues = [
          `"${row.employee_code}"`,
          `"${row.cnp}"`,
          `"${row.full_name.replace(/"/g, '""')}"`,
          dataStr,
          oraStr,
          sens,
          tipText
        ];
        csv += rowValues.join(sep) + '\n';
      }
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=export_saga_pontaj_${month}_${year}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('[SAGA Export] Error generating export:', error);
    res.status(500).json({ error: 'Eroare la generarea exportului SAGA', details: error.message });
  }
});

module.exports = router;
