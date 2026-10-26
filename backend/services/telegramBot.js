/**
 * Telegram Interactive Command Center pentru SuperAdmin (Pontaj.app)
 * Permite interogarea în timp real a bazei de date și a traficului de vizitatori
 * FĂRĂ EMOJI (conform regulilor stricte ale proiectului)
 */

const db = require('../db');
const { sendTelegramMessage } = require('./telegramService');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: 'Trafic Live' }, { text: 'Firme & Demo' }],
    [{ text: 'Expira Curand' }, { text: 'Activitate Pontaj' }],
    [{ text: 'Venituri MRR' }, { text: 'Ajutor & Comenzi' }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

/**
 * 1. Raport Trafic & Vizitatori pe Landing Page
 */
async function getTrafficReport() {
  try {
    const opFilter = `AND ip_address NOT IN ('::1', '127.0.0.1') AND (referrer IS NULL OR referrer NOT LIKE '%localhost%') AND page_path NOT LIKE '/kiosk%' AND page_path NOT LIKE '/scan%' AND page_path NOT LIKE '/admin%' AND page_path NOT LIKE '/portal%' AND page_path NOT LIKE '/employee%'`;

    const liveRes = await db.query(`
      SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id)) as count
      FROM site_analytics
      WHERE created_at >= NOW() - INTERVAL '5 minutes'
        ${opFilter};
    `);
    const liveNow = parseInt(liveRes.rows[0]?.count || 0, 10);

    const todayRes = await db.query(`
      SELECT 
        COUNT(DISTINCT COALESCE(visitor_id, session_id)) as unique_visitors,
        COUNT(*) as total_pageviews
      FROM site_analytics
      WHERE created_at >= CURRENT_DATE
        ${opFilter};
    `);
    const todayVisitors = parseInt(todayRes.rows[0]?.unique_visitors || 0, 10);
    const todayPageviews = parseInt(todayRes.rows[0]?.total_pageviews || 0, 10);

    const yesterdayRes = await db.query(`
      SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id)) as count
      FROM site_analytics
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
        AND created_at < CURRENT_DATE
        ${opFilter};
    `);
    const yesterdayVisitors = parseInt(yesterdayRes.rows[0]?.count || 0, 10);

    let trendText = 'In medie';
    if (yesterdayVisitors > 0) {
      const diff = Math.round(((todayVisitors - yesterdayVisitors) / yesterdayVisitors) * 100);
      trendText = diff >= 0 ? `+${diff}% fata de ieri` : `${diff}% fata de ieri`;
    }

    const sourcesRes = await db.query(`
      SELECT 
        COALESCE(NULLIF(utm_source, ''), 'direct') as source,
        COUNT(DISTINCT COALESCE(visitor_id, session_id)) as visitors
      FROM site_analytics
      WHERE created_at >= CURRENT_DATE
        ${opFilter}
      GROUP BY source
      ORDER BY visitors DESC
      LIMIT 5;
    `);

    let msg = `<b>[RAPORT TRAFIC &amp; VIZITATORI SITE]</b>\n\n`;
    msg += `<b>Live acum (ultimele 5 min):</b> <code>${liveNow}</code> vizitatori unici\n`;
    msg += `<b>Vizitatori unici azi:</b> <code>${todayVisitors}</code> (${trendText})\n`;
    msg += `<b>Pagini afisate azi:</b> <code>${todayPageviews}</code>\n`;
    msg += `<b>Vizitatori ieri (zi completa):</b> <code>${yesterdayVisitors}</code>\n\n`;

    msg += `<b>TOP SURSE TRAFIC AZI:</b>\n`;
    if (sourcesRes.rows.length === 0) {
      msg += `Niciun eveniment inregistrat inca astazi.\n`;
    } else {
      sourcesRes.rows.forEach((s, idx) => {
        msg += `${idx + 1}. <b>${escapeHtml(s.source)}:</b> ${s.visitors} vizitatori\n`;
      });
    }

    return msg;
  } catch (err) {
    console.error('[TelegramBot] Eroare raport trafic:', err);
    return `<b>[EROARE]</b> Nu am putut genera raportul de trafic: ${escapeHtml(err.message)}`;
  }
}

/**
 * 2. Situație Companii & Demo-uri
 */
async function getTenantsReport() {
  try {
    const countsRes = await db.query(`
      SELECT subscription_status, COUNT(*) as count
      FROM qrp_tenants
      GROUP BY subscription_status;
    `);

    let demoCount = 0;
    let activeCount = 0;
    let suspendedCount = 0;
    let totalCount = 0;

    countsRes.rows.forEach(r => {
      const c = parseInt(r.count, 10);
      totalCount += c;
      if (r.subscription_status === 'DEMO') demoCount = c;
      else if (r.subscription_status === 'ACTIVE') activeCount = c;
      else if (r.subscription_status === 'SUSPENDED') suspendedCount = c;
    });

    const newTodayRes = await db.query(`
      SELECT COUNT(*) as count FROM qrp_tenants WHERE created_at >= CURRENT_DATE;
    `);
    const todayNew = parseInt(newTodayRes.rows[0]?.count || 0, 10);

    const newWeekRes = await db.query(`
      SELECT COUNT(*) as count FROM qrp_tenants WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
    `);
    const weekNew = parseInt(newWeekRes.rows[0]?.count || 0, 10);

    const latestRes = await db.query(`
      SELECT name, contact_name, contact_phone, subscription_status, created_at
      FROM qrp_tenants
      ORDER BY created_at DESC
      LIMIT 3;
    `);

    let msg = `<b>[SITUATIE COMPANII &amp; CONTURI]</b>\n\n`;
    msg += `<b>Total firme inregistrate:</b> <code>${totalCount}</code>\n`;
    msg += `<b>Abonamente active:</b> <code>${activeCount}</code>\n`;
    msg += `<b>Conturi Demo in test:</b> <code>${demoCount}</code>\n`;
    if (suspendedCount > 0) {
      msg += `<b>Conturi suspendate:</b> <code>${suspendedCount}</code>\n`;
    }
    msg += `\n<b>INREGISTRARI NOI:</b>\n`;
    msg += `<b>Astazi:</b> <code>${todayNew}</code> conturi noi\n`;
    msg += `<b>Ultimele 7 zile:</b> <code>${weekNew}</code> conturi noi\n\n`;

    msg += `<b>ULTIMELE COMPANII INSCRISE:</b>\n`;
    latestRes.rows.forEach((t, idx) => {
      const dt = new Date(t.created_at).toLocaleDateString('ro-RO');
      msg += `${idx + 1}. <b>${escapeHtml(t.name)}</b> [${t.subscription_status}]\n`;
      msg += `   Contact: ${escapeHtml(t.contact_name || '-')} | Tel: ${escapeHtml(t.contact_phone || '-')} (${dt})\n`;
    });

    return msg;
  } catch (err) {
    console.error('[TelegramBot] Eroare raport firme:', err);
    return `<b>[EROARE]</b> Nu am putut genera situatia companiilor: ${escapeHtml(err.message)}`;
  }
}

/**
 * 3. Firme al căror Demo expiră în curând (Leads de vânzări)
 */
async function getExpiringDemosReport() {
  try {
    const res = await db.query(`
      SELECT id, name, subdomain, contact_name, contact_phone, contact_email, subscription_seats, demo_expires_at,
             ROUND(EXTRACT(EPOCH FROM (demo_expires_at - NOW())) / 3600) as hours_left
      FROM qrp_tenants
      WHERE subscription_status = 'DEMO'
        AND demo_expires_at IS NOT NULL
        AND demo_expires_at <= NOW() + INTERVAL '72 hours'
      ORDER BY demo_expires_at ASC
      LIMIT 8;
    `);

    if (res.rows.length === 0) {
      // Afișăm următoarele demo-uri active ordonate crescător
      const fallbackRes = await db.query(`
        SELECT id, name, subdomain, contact_name, contact_phone, contact_email, subscription_seats, demo_expires_at,
               ROUND(EXTRACT(EPOCH FROM (demo_expires_at - NOW())) / 86400) as days_left
        FROM qrp_tenants
        WHERE subscription_status = 'DEMO'
        ORDER BY demo_expires_at ASC
        LIMIT 5;
      `);

      let msg = `<b>[DEMO-URI IN CURS DE TESTARE]</b>\n`;
      msg += `Niciun demo nu expira in urmatoarele 72 de ore.\n\n`;
      msg += `<b>Urmatoarele demo-uri active:</b>\n`;
      fallbackRes.rows.forEach((d, idx) => {
        const days = Math.max(0, parseInt(d.days_left || 0, 10));
        msg += `${idx + 1}. <b>${escapeHtml(d.name)}</b> (${days} zile ramase)\n`;
        msg += `   Contact: ${escapeHtml(d.contact_name || '-')} | Tel: <code>${escapeHtml(d.contact_phone || '-')}</code>\n`;
        msg += `   Subdomeniu: ${escapeHtml(d.subdomain)}.qr.pontaj.app\n`;
      });
      return msg;
    }

    let msg = `<b>[ATENTIE VANZARI - DEMO-URI CARE EXPIRA]</b>\n`;
    msg += `Urmatoarele companii trebuie contactate pentru prelungire/abonament:\n\n`;

    res.rows.forEach((d, idx) => {
      const hours = parseInt(d.hours_left || 0, 10);
      const timeStr = hours < 0 ? `EXPIRAT (${Math.abs(hours)} ore in urma)` : `Expira in ${hours} ore`;
      msg += `${idx + 1}. <b>${escapeHtml(d.name)}</b> — <b>${timeStr}</b>\n`;
      msg += `   Contact: ${escapeHtml(d.contact_name || 'Admin')} | Angajati: ${d.subscription_seats || 10}\n`;
      msg += `   Telefon: <code>${escapeHtml(d.contact_phone || 'Fara telefon')}</code>\n`;
      msg += `   Email: ${escapeHtml(d.contact_email || '-')}\n`;
      if (d.contact_phone) {
        const cleanPhone = String(d.contact_phone).replace(/[^0-9]/g, '');
        const waPhone = cleanPhone.startsWith('0') ? '4' + cleanPhone : cleanPhone;
        msg += `   WhatsApp direct: https://wa.me/${waPhone}\n`;
      }
      msg += `\n`;
    });

    return msg;
  } catch (err) {
    console.error('[TelegramBot] Eroare demo-uri expirate:', err);
    return `<b>[EROARE]</b> Nu am putut genera raportul de demo-uri: ${escapeHtml(err.message)}`;
  }
}

/**
 * 4. Activitate Pontaj Live
 */
async function getPontajActivityReport() {
  try {
    const todayScansRes = await db.query(`
      SELECT COUNT(*) as count FROM qrp_scan_logs WHERE created_at >= CURRENT_DATE;
    `);
    const todayScans = parseInt(todayScansRes.rows[0]?.count || 0, 10);

    const allScansRes = await db.query(`
      SELECT COUNT(*) as count FROM qrp_scan_logs;
    `);
    const allScans = parseInt(allScansRes.rows[0]?.count || 0, 10);

    const activeShiftsRes = await db.query(`
      SELECT COUNT(*) as count FROM qrp_shifts WHERE end_time IS NULL AND date = CURRENT_DATE;
    `);
    const activeShifts = parseInt(activeShiftsRes.rows[0]?.count || 0, 10);

    const topTenantsTodayRes = await db.query(`
      SELECT t.name, COUNT(s.id) as scans
      FROM qrp_scan_logs s
      JOIN qrp_tenants t ON t.id = s.tenant_id
      WHERE s.created_at >= CURRENT_DATE
      GROUP BY t.id, t.name
      ORDER BY scans DESC
      LIMIT 5;
    `);

    let msg = `<b>[ACTIVITATE PONTAJ LIVE]</b>\n\n`;
    msg += `<b>Scanari QR efectuate azi:</b> <code>${todayScans}</code>\n`;
    msg += `<b>Salariati pontati la munca ACUM:</b> <code>${activeShifts}</code>\n`;
    msg += `<b>Total scanari in platforma (all-time):</b> <code>${allScans}</code>\n\n`;

    msg += `<b>TOP COMPANII DUPA SCANARI AZI:</b>\n`;
    if (topTenantsTodayRes.rows.length === 0) {
      msg += `Nicio scanare inregistrata inca astazi.\n`;
    } else {
      topTenantsTodayRes.rows.forEach((r, idx) => {
        msg += `${idx + 1}. <b>${escapeHtml(r.name)}:</b> ${r.scans} pontari\n`;
      });
    }

    return msg;
  } catch (err) {
    console.error('[TelegramBot] Eroare activitate pontaj:', err);
    return `<b>[EROARE]</b> Nu am putut genera activitatea de pontaj: ${escapeHtml(err.message)}`;
  }
}

/**
 * 5. Venituri & MRR
 */
async function getRevenueReport() {
  try {
    const activeTenantsRes = await db.query(`
      SELECT id, name, subscription_seats, price_per_employee, billing_per_employee
      FROM qrp_tenants
      WHERE subscription_status = 'ACTIVE';
    `);

    let totalSeats = 0;
    let totalMrrEur = 0;

    activeTenantsRes.rows.forEach(t => {
      const seats = parseInt(t.subscription_seats || 0, 10);
      const price = parseFloat(t.price_per_employee || 5.00);
      totalSeats += seats;
      totalMrrEur += (seats * price);
    });

    const activeEmpRes = await db.query(`
      SELECT COUNT(e.id) as count
      FROM qrp_employees e
      JOIN qrp_tenants t ON t.id = e.tenant_id
      WHERE t.subscription_status = 'ACTIVE'
        AND (e.is_archived = false OR e.is_archived IS NULL);
    `);
    const activeEmployees = parseInt(activeEmpRes.rows[0]?.count || 0, 10);

    let msg = `<b>[RAPORT FINANCIAR &amp; MRR ESTIMAT]</b>\n\n`;
    msg += `<b>Companii cu abonament activ:</b> <code>${activeTenantsRes.rows.length}</code>\n`;
    msg += `<b>Salariati activi in firmele pe abonament:</b> <code>${activeEmployees}</code>\n`;
    msg += `<b>Locuri contractate (seats):</b> <code>${totalSeats}</code>\n`;
    msg += `<b>MRR estimat:</b> <code>${totalMrrEur.toFixed(2)} EUR / luna</code>\n\n`;

    msg += `<b>LISTA COMPANII ABONATE:</b>\n`;
    activeTenantsRes.rows.forEach((t, idx) => {
      msg += `${idx + 1}. <b>${escapeHtml(t.name)}</b> — ${t.subscription_seats} locuri @ ${t.price_per_employee || 5} EUR\n`;
    });

    return msg;
  } catch (err) {
    console.error('[TelegramBot] Eroare venituri:', err);
    return `<b>[EROARE]</b> Nu am putut genera raportul de venituri: ${escapeHtml(err.message)}`;
  }
}

/**
 * 6. Căutare rapidă firmă după CUI, nume, telefon, email
 */
async function searchCompany(queryTerm) {
  if (!queryTerm || queryTerm.trim().length < 2) {
    return `<b>[CAUTARE]</b> Te rog sa introduci un termen de cel putin 2 caractere.\nExemplu: <code>/cauta Unda</code> sau <code>/cauta RO1234567</code>`;
  }

  const cleanTerm = `%${queryTerm.trim()}%`;
  try {
    const res = await db.query(`
      SELECT id, name, vat_number, subdomain, contact_name, contact_phone, contact_email,
             subscription_status, subscription_seats, demo_expires_at, created_at, billing_address
      FROM qrp_tenants
      WHERE vat_number ILIKE $1
         OR name ILIKE $1
         OR subdomain ILIKE $1
         OR contact_phone ILIKE $1
         OR contact_email ILIKE $1
      ORDER BY created_at DESC
      LIMIT 5;
    `, [cleanTerm]);

    if (res.rows.length === 0) {
      return `<b>[CAUTARE]</b> Nu a fost gasita nicio firma pentru: <code>${escapeHtml(queryTerm)}</code>`;
    }

    let msg = `<b>[REZULTATE CAUTARE FIRME] (${res.rows.length} gasite)</b>\n\n`;
    res.rows.forEach((t, idx) => {
      msg += `${idx + 1}. <b>${escapeHtml(t.name)}</b>\n`;
      msg += `   Status: <b>${t.subscription_status}</b>\n`;
      if (t.vat_number) msg += `   CUI: <code>${escapeHtml(t.vat_number)}</code>\n`;
      msg += `   Contact: ${escapeHtml(t.contact_name || '-')} | Tel: <code>${escapeHtml(t.contact_phone || '-')}</code>\n`;
      msg += `   Email: ${escapeHtml(t.contact_email || '-')}\n`;
      msg += `   Subdomeniu: <code>${escapeHtml(t.subdomain)}</code>.qr.pontaj.app\n`;
      msg += `   Link panou: https://${escapeHtml(t.subdomain)}.qr.pontaj.app/admin/login\n`;
      if (t.subscription_status === 'DEMO' && t.demo_expires_at) {
        msg += `   Demo expira la: ${new Date(t.demo_expires_at).toLocaleDateString('ro-RO')}\n`;
      }
      msg += `\n`;
    });

    return msg;
  } catch (err) {
    console.error('[TelegramBot] Eroare cautare firma:', err);
    return `<b>[EROARE]</b> Cautarea a esuat: ${escapeHtml(err.message)}`;
  }
}

/**
 * 7. Meniu Ajutor
 */
function getHelpMessage() {
  let msg = `<b>[CENTRU DE COMANDA TELEGRAM - PONTAJ.APP]</b>\n\n`;
  msg += `Foloseste butoanele rapide din partea de jos a ecranului sau comenzile text:\n\n`;
  msg += `• <b>Trafic Live</b> (sau <code>/trafic</code>): Utilizatori live acum, vizitatori azi, surse de trafic\n`;
  msg += `• <b>Firme &amp; Demo</b> (sau <code>/firme</code>): Total companii, conturi demo, abonamente active\n`;
  msg += `• <b>Expira Curand</b> (sau <code>/expira</code>): Demo-uri care expira in 48-72h cu date de contact\n`;
  msg += `• <b>Activitate Pontaj</b> (sau <code>/pontaj</code>): Scanari QR astazi, angajati pontati acum\n`;
  msg += `• <b>Venituri MRR</b> (sau <code>/bani</code>): Numar salariati facturati, MRR estimat\n`;
  msg += `• <b>Cautare rapida:</b> <code>/cauta &lt;nume sau CUI&gt;</code> pentru a gasi orice firma\n`;
  return msg;
}

/**
 * Procesează mesajul primit de la SuperAdmin
 */
async function handleIncomingMessage(message) {
  const text = (message.text || '').trim();
  const lower = text.toLowerCase();

  if (lower === '/start' || lower === '/ajutor' || lower === 'ajutor & comenzi' || lower === '/help') {
    return sendTelegramMessage(getHelpMessage(), { reply_markup: MAIN_KEYBOARD });
  }

  if (lower === '/trafic' || lower === '/stats' || lower === 'trafic live') {
    const report = await getTrafficReport();
    return sendTelegramMessage(report, { reply_markup: MAIN_KEYBOARD });
  }

  if (lower === '/firme' || lower === '/tenanti' || lower === 'firme & demo') {
    const report = await getTenantsReport();
    return sendTelegramMessage(report, { reply_markup: MAIN_KEYBOARD });
  }

  if (lower === '/expira' || lower === 'expira curand') {
    const report = await getExpiringDemosReport();
    return sendTelegramMessage(report, { reply_markup: MAIN_KEYBOARD });
  }

  if (lower === '/pontaj' || lower === 'activitate pontaj') {
    const report = await getPontajActivityReport();
    return sendTelegramMessage(report, { reply_markup: MAIN_KEYBOARD });
  }

  if (lower === '/bani' || lower === '/mrr' || lower === 'venituri mrr') {
    const report = await getRevenueReport();
    return sendTelegramMessage(report, { reply_markup: MAIN_KEYBOARD });
  }

  if (lower.startsWith('/cauta') || lower.startsWith('/caut ')) {
    const queryTerm = text.replace(/^\/cauta\s*|^\/caut\s*/i, '').trim();
    const report = await searchCompany(queryTerm);
    return sendTelegramMessage(report, { reply_markup: MAIN_KEYBOARD });
  }

  // Dacă utilizatorul a scris un număr CUI sau un nume fără comandă, căutăm automat
  if (text.length >= 3 && !text.startsWith('/')) {
    const report = await searchCompany(text);
    return sendTelegramMessage(report, { reply_markup: MAIN_KEYBOARD });
  }

  return sendTelegramMessage(
    `Comanda nerecunoscuta. Alege una dintre optiuni sau scrie <code>/cauta &lt;nume&gt;</code>.`,
    { reply_markup: MAIN_KEYBOARD }
  );
}

let isPolling = false;
let shouldStop = false;
let lastUpdateId = 0;

/**
 * Buclă de Long-Polling securizată
 */
async function startTelegramBotListener() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const authorizedChatId = String(process.env.TELEGRAM_CHAT_ID || '');

  if (!botToken || !authorizedChatId) {
    console.log('[TelegramBot] Listener inactiv: TELEGRAM_BOT_TOKEN sau TELEGRAM_CHAT_ID lipsesc.');
    return;
  }

  if (isPolling) return;
  isPolling = true;
  shouldStop = false;
  console.log('[TelegramBot] Listener pornit cu succes pentru Chat ID:', authorizedChatId);

  // Trimitem meniul principal la pornire pentru a afișa butoanele
  sendTelegramMessage(getHelpMessage(), { reply_markup: MAIN_KEYBOARD })
    .catch(e => console.warn('[TelegramBot] Eroare trimitere mesaj initial:', e.message));

  while (!shouldStop) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const data = await response.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;

          if (update.message && update.message.text) {
            const senderChatId = String(update.message.chat?.id || '');

            // Securitate strictă: răspundem exclusiv SuperAdmin-ului configurat
            if (senderChatId !== authorizedChatId) {
              console.warn(`[TelegramBot] Acces neautorizat respins de la Chat ID: ${senderChatId}`);
              continue;
            }

            await handleIncomingMessage(update.message);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'TimeoutError') {
        console.warn('[TelegramBot] Eroare polling (reincercam in 5s):', err.message);
      }
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  isPolling = false;
}

function stopTelegramBotListener() {
  shouldStop = true;
}

module.exports = {
  startTelegramBotListener,
  stopTelegramBotListener,
  getTrafficReport,
  getTenantsReport,
  getExpiringDemosReport,
  getPontajActivityReport,
  getRevenueReport,
  searchCompany,
  getHelpMessage
};
