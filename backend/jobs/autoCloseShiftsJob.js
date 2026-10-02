const db = require('../db');

let isRunning = false;

/**
 * Verifică și închide automat turele active pentru angajații care au depășit programul
 * și au activată opțiunea `auto_close = true`.
 */
async function checkAndAutoCloseShifts() {
  if (isRunning) return;
  isRunning = true;

  try {
    // 1. Găsim toate turele cu auto_close = true din ultimele 48 de ore până azi,
    // unde ora programată de final a trecut deja față de timpul curent (Europe/Bucharest).
    const query = `
      SELECT 
        s.id as shift_id,
        s.tenant_id,
        s.employee_id,
        to_char(s.date, 'YYYY-MM-DD') as shift_date,
        to_char(s.start_time, 'HH24:MI:SS') as start_time_str,
        to_char(s.end_time, 'HH24:MI:SS') as end_time_str,
        CASE 
          WHEN s.end_time < s.start_time THEN
            ((to_char(s.date + INTERVAL '1 day', 'YYYY-MM-DD') || ' ' || to_char(s.end_time, 'HH24:MI:SS'))::timestamp AT TIME ZONE 'Europe/Bucharest')
          ELSE
            ((to_char(s.date, 'YYYY-MM-DD') || ' ' || to_char(s.end_time, 'HH24:MI:SS'))::timestamp AT TIME ZONE 'Europe/Bucharest')
        END as scheduled_end_tz,
        e.first_name,
        e.last_name,
        e.location_id
      FROM qrp_shifts s
      JOIN qrp_employees e ON s.employee_id = e.id
      WHERE s.auto_close = true
        AND s.date >= (CURRENT_DATE - INTERVAL '2 days')
        AND s.date <= CURRENT_DATE
        AND (
          CASE 
            WHEN s.end_time < s.start_time THEN
              ((to_char(s.date + INTERVAL '1 day', 'YYYY-MM-DD') || ' ' || to_char(s.end_time, 'HH24:MI:SS'))::timestamp AT TIME ZONE 'Europe/Bucharest')
            ELSE
              ((to_char(s.date, 'YYYY-MM-DD') || ' ' || to_char(s.end_time, 'HH24:MI:SS'))::timestamp AT TIME ZONE 'Europe/Bucharest')
          END
        ) <= CURRENT_TIMESTAMP
    `;

    const candidateShifts = await db.query(query);

    for (const shift of candidateShifts.rows) {
      // Verificăm ultimul pontaj al angajatului
      const timesheetRes = await db.query(
        `SELECT id, action_type, site_id, created_at
         FROM qrp_timesheets
         WHERE employee_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [shift.employee_id]
      );

      if (timesheetRes.rowCount === 0) continue;
      const lastTimesheet = timesheetRes.rows[0];

      // Dacă angajatul este încă 'IN' (prezent)
      if (lastTimesheet.action_type === 'IN') {
        const lastInTime = new Date(lastTimesheet.created_at);
        const scheduledEnd = new Date(shift.scheduled_end_tz);

        // Verificăm ca intrarea să fi avut loc înainte de sfârșitul programat al turei
        if (lastInTime <= scheduledEnd) {
          let siteId = lastTimesheet.site_id || shift.location_id;
          if (!siteId) {
            const fallbackSite = await db.query(
              `SELECT id FROM qrp_sites WHERE tenant_id = $1 ORDER BY id ASC LIMIT 1`,
              [shift.tenant_id]
            );
            if (fallbackSite.rowCount > 0) siteId = fallbackSite.rows[0].id;
          }

          // Inserăm pontajul OUT la ora de final a turei
          await db.query(
            `INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id, created_at, is_manual, auto_closed)
             VALUES ($1, $2, 'OUT', $3, $4, true, true)`,
            [shift.tenant_id, shift.employee_id, siteId, shift.scheduled_end_tz]
          );

          // Înregistrăm în istoricul angajatului
          const startClean = (shift.start_time_str || '').substring(0, 5);
          const endClean = (shift.end_time_str || '').substring(0, 5);
          await db.query(
            `INSERT INTO qrp_employee_history (employee_id, change_type, new_value)
             VALUES ($1, $2, $3)`,
            [
              shift.employee_id,
              'pontaj',
              `Tura a fost inchisa automat de sistem conform programarii (${startClean} - ${endClean}).`
            ]
          );

          console.log(`[AutoClose] Tura ${shift.shift_id} a fost inchisa automat pentru angajatul ${shift.first_name} ${shift.last_name} la ora ${endClean}.`);
        }
      }
    }
  } catch (err) {
    console.error('[AutoClose] Eroare la verificarea inchiderii automate a turelor:', err);
  } finally {
    isRunning = false;
  }
}

function startAutoCloseJob(intervalMs = 60000) {
  setTimeout(checkAndAutoCloseShifts, 3000);
  return setInterval(checkAndAutoCloseShifts, intervalMs);
}

module.exports = {
  checkAndAutoCloseShifts,
  startAutoCloseJob
};
