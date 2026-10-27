/**
 * Serviciu Notificări Telegram pentru Evenimente SuperAdmin
 * Trimite alerte instantanee la crearea de conturi noi (Demo / Abonament / Stripe / Google)
 * FĂRĂ EMOJI (conform regulilor stricte ale proiectului)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Trimite un mesaj generic în canalul / chat-ul configurat de Telegram
 */
async function sendTelegramMessage(text, options = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('[Telegram] Notificarea nu s-a trimis: TELEGRAM_BOT_TOKEN sau TELEGRAM_CHAT_ID lipsesc din .env');
    return { success: false, reason: 'Config lipsa' };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...options
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[Telegram] Eroare API Telegram:', data.description);
      return { success: false, error: data.description };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error) {
    console.error('[Telegram] Eroare retea / trimitere:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Notificare formatată la crearea unui cont nou (Demo / Abonament / etc.)
 */
async function sendNewAccountAlert({
  companyName,
  contactName,
  phone,
  anafPhone,
  email,
  cui,
  address,
  city,
  county,
  employeesCount,
  planName,
  planPrice,
  mode,
  subdomain,
  notes,
  clientIp,
  dpaAccepted,
  initialPassword,
  loginUrl,
  isSuspectDuplicate,
  duplicateReason,
  isPersonalAccount
}) {
  const isPhysical = Boolean(isPersonalAccount) || 
                     (!cui && Boolean(contactName)) ||
                     /persoan[aă]\s+fizic[aă]/i.test(companyName || '') || 
                     /persoan[aă]\s+fizic[aă]/i.test(notes || '') ||
                     /cont\s+personal/i.test(companyName || '');

  const entityEmoji = isPhysical ? '🪪' : '🏛️';
  const entityLabel = isPhysical ? 'PERSOANĂ FIZICĂ (B2C)' : 'PERSOANĂ JURIDICĂ (B2B)';

  const cleanPhone = phone ? String(phone).replace(/[^0-9+]/g, '') : '';
  const waPhone = cleanPhone.startsWith('0') ? '4' + cleanPhone : cleanPhone.replace('+', '');
  const priceDisplay = planPrice ? `${planPrice} EUR` : '5.00 EUR';
  const typeDisplay = mode === 'subscribe' ? 'SOLICITARE ABONAMENT (DIRECT)' : 'SOLICITARE DEMO GRATUIT (15 ZILE)';
  const addressFull = [address, city, county].filter(Boolean).join(', ') || 'Nespecificată';

  let text = '';
  text += `<b>${entityEmoji} [CONT NOU CREAT - PONTAJ.APP]</b>\n`;
  text += `<b>Tip Client:</b> ${entityEmoji} <b>${entityLabel}</b>\n`;
  text += `<b>Flux:</b> 🚀 ${escapeHtml(typeDisplay)}\n`;

  if (isSuspectDuplicate) {
    text += `\n<b>⚠️ [ALERTA - SUSPECT DUPLICAT]</b>\n`;
    text += `<b>Motiv:</b> ${escapeHtml(duplicateReason || 'Date recurente detectate')}\n`;
  }

  text += `\n<b>${isPhysical ? '🪪 DATE IDENTITATE &amp; CONTACT:' : '🏛️ DATE COMPANIE &amp; CONTACT:'}</b>\n`;
  if (isPhysical) {
    text += `<b>Titular / Nume:</b> 🧑 <b>${escapeHtml(contactName || companyName || 'Nespecificat')}</b>\n`;
    text += `<b>Statut Cont:</b> 🪪 Persoană Fizică (Uz individual / Fără CUI)\n`;
  } else {
    text += `<b>Companie / Firmă:</b> 🏛️ <b>${escapeHtml(companyName || 'Nespecificată')}</b>\n`;
    if (cui) {
      text += `<b>CUI / CIF:</b> 📄 <code>${escapeHtml(cui)}</code>\n`;
    }
    text += `<b>Persoană Contact:</b> 👤 <b>${escapeHtml(contactName || 'Nespecificat')}</b>\n`;
  }
  text += `<b>Telefon Direct:</b> 📱 ${cleanPhone ? `<code>${escapeHtml(cleanPhone)}</code>` : 'Nespecificat'}\n`;
  if (anafPhone && anafPhone !== phone) {
    text += `<b>Telefon ANAF:</b> 📞 <code>${escapeHtml(anafPhone)}</code>\n`;
  }
  text += `<b>Email:</b> ✉️ <code>${escapeHtml(email || 'Nespecificat')}</code>\n`;
  text += `<b>Adresa / Sediu:</b> 📍 ${escapeHtml(addressFull)}\n`;

  text += `\n<b>⚙️ CONFIGURARE CONT:</b>\n`;
  text += `<b>Nr. Angajati:</b> ${employeesCount || 10} salariați\n`;
  text += `<b>Tarif estimat:</b> ${escapeHtml(priceDisplay)} / angajat\n`;
  if (planName) {
    text += `<b>Pachet:</b> ${escapeHtml(planName)}\n`;
  }
  if (subdomain) {
    text += `<b>Subdomeniu:</b> <code>${escapeHtml(subdomain)}</code>\n`;
  }
  if (initialPassword) {
    text += `<b>Parolă Inițială:</b> <code>${escapeHtml(initialPassword)}</code>\n`;
  }
  if (loginUrl) {
    text += `<b>Link Logare:</b> <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a>\n`;
  }

  text += `\n<b>🔒 DETALII TEHNICE &amp; CONFORMITATE:</b>\n`;
  text += `<b>IP Client:</b> <code>${escapeHtml(clientIp || 'Înregistrat')}</code>\n`;
  text += `<b>DPA Art. 28 GDPR:</b> ${dpaAccepted ? 'Acceptat electronic' : 'Înregistrat'}\n`;
  if (notes) {
    text += `<b>Note / Mesaj:</b> ${escapeHtml(notes)}\n`;
  }

  // Butoane inline de actiune rapida
  const inlineKeyboard = [];
  const row1 = [];

  if (cleanPhone) {
    const waLoginMessage = encodeURIComponent(
      `Bună ziua!\n\n` +
      `Contul dvs. Pontaj.app pentru ${companyName || 'compania dvs.'} a fost creat cu succes:\n` +
      `Link acces: ${loginUrl || 'https://qr.pontaj.app'}\n` +
      `Email conectare: ${email}\n` +
      (initialPassword ? `Parolă inițială: ${initialPassword}\n\n` : '\n') +
      `Vă rugăm să accesați linkul pentru a începe utilizarea platformei.`
    );
    row1.push({
      text: '💬 Trimite pe WhatsApp',
      url: `https://wa.me/${waPhone}?text=${waLoginMessage}`
    });
  }

  if (loginUrl && loginUrl.startsWith('http')) {
    row1.push({
      text: '🌐 Deschide Panou Client',
      url: loginUrl
    });
  }

  if (row1.length > 0) {
    inlineKeyboard.push(row1);
  }

  const options = inlineKeyboard.length > 0 ? {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  } : {};

  return sendTelegramMessage(text, options);
}

module.exports = {
  sendTelegramMessage,
  sendNewAccountAlert
};
