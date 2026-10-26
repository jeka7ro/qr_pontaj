/**
 * Email Service using Brevo (Sendinblue) Transactional API
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Convertește URL-urile webp-express în PNG original pentru compatibilitate maximă în clienții de email (Gmail/Outlook)
 */
function sanitizeEmailLogo(url, subdomain = null) {
  const baseDomain = process.env.BASE_DOMAIN || 'qr.pontaj.app';

  // Pentru chiriașii cunoscuți sau URL-uri care trimit către ei, folosim fișierele CDN garantate din platformă
  if (subdomain === 'unda' || (url && url.includes('unda'))) {
    return `https://${baseDomain}/logos/unda.png`;
  }
  if (subdomain === 'rollmaster' || (url && url.includes('roll-master'))) {
    return `https://${baseDomain}/logos/rollmaster.png`;
  }

  if (!url) return null;

  if (url.startsWith('/uploads/') || url.startsWith('uploads/') || url.startsWith('/logos/') || url.startsWith('logos/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `https://${baseDomain}${cleanPath}`;
  }

  if (url.includes('/webp-express/webp-images/') && url.endsWith('.webp')) {
    return url.replace('/webp-express/webp-images/', '/').replace(/\.webp$/, '');
  }
  return url;
}

/**
 * Asigură că linkurile din emailuri folosesc ÎNTOTDEAUNA domeniul public de producție (NICIODATĂ localhost)
 */
function ensurePublicUrl(url, subdomain = null) {
  if (!url) return url;
  const baseDomain = process.env.BASE_DOMAIN || 'qr.pontaj.app';
  const targetHost = subdomain 
    ? `https://${subdomain}.${baseDomain}` 
    : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost') ? process.env.FRONTEND_URL : `https://${baseDomain}`);

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    try {
      const parsed = new URL(url);
      return `${targetHost}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (e) {
      return url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, targetHost);
    }
  }
  return url;
}

/**
 * Extrage și sanitizează toate adresele de email valide dintr-un string sau array
 * Suportă delimitatori multipli: punct și virgulă (;), virgulă (,), slash (/), bară (|), spații, newline
 */
function parseRecipients(to) {
  if (!to) return [];

  const rawList = [];
  if (Array.isArray(to)) {
    to.forEach(item => {
      if (typeof item === 'string') {
        rawList.push(item);
      } else if (item && typeof item === 'object' && item.email) {
        rawList.push(item.email);
      }
    });
  } else if (typeof to === 'string') {
    rawList.push(to);
  } else if (to && typeof to === 'object' && to.email) {
    rawList.push(to.email);
  }

  // Regex email conform standardelor
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const seen = new Set();
  const validEmails = [];

  for (const item of rawList) {
    if (!item) continue;
    const parts = String(item).split(/[;,\/\|\n\r\s]+/);
    for (let part of parts) {
      part = part.trim().replace(/^<|>$/g, '').replace(/^['"]|['"]$/g, '').toLowerCase();
      if (part && emailRegex.test(part) && !seen.has(part)) {
        seen.add(part);
        validEmails.push(part);
      }
    }
  }

  return validEmails;
}

/**
 * Trimitere email generic prin Brevo
 * Dacă sunt specificate mai multe adrese (ex: separate prin punct și virgulă sau array),
 * trimite către TOATE adresele de email valide.
 */
async function sendEmail({ to, subject, html, text, senderName }) {
  const recipients = parseRecipients(to);

  if (!recipients || recipients.length === 0) {
    throw new Error('Nu a fost specificată nicio adresă de email validă.');
  }

  // REGULĂ STRICTĂ: Nu trimitem NICIODATĂ emailuri reale către adrese mock, test sau demo
  const isMockAddress = (addr) => {
    if (!addr) return true;
    const lower = String(addr).toLowerCase().trim();
    return (
      lower.includes('example.com') ||
      lower.includes('exemplu.ro') ||
      lower.includes('test') ||
      lower.includes('mock') ||
      lower.includes('fake') ||
      lower.includes('andrei.popescu') ||
      lower.includes('demo') ||
      lower.endsWith('.test') ||
      lower.endsWith('.local')
    );
  };

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'contact@pontaj.app';
  const name = senderName || process.env.BREVO_SENDER_NAME || 'Pontaj.app';

  if (!apiKey) {
    console.error('[EmailService] Lipseste BREVO_API_KEY in .env!');
    throw new Error('Serviciul de email nu este configurat corespunzator.');
  }

  const results = [];
  const errors = [];

  // Expediem către fiecare adresă extrasă individual pentru livrare sigură și tracking independent
  for (const singleEmail of recipients) {
    if (isMockAddress(singleEmail)) {
      console.log(`[EmailService] Adresă mock/test detectată (${singleEmail}). Emailul NU este trimis către Brevo.`);
      results.push({ email: singleEmail, success: true, messageId: 'mock-suppressed-' + Date.now() });
      continue;
    }

    const payload = {
      sender: {
        name: name,
        email: senderEmail
      },
      to: [{ email: singleEmail }],
      subject: subject,
      htmlContent: html,
      textContent: text || subject
    };

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[EmailService] Brevo API Error pentru ${singleEmail}:`, data);
        errors.push(`${singleEmail}: ${data.message || 'Eroare Brevo'}`);
      } else {
        console.log(`[EmailService] Email trimis cu succes catre ${singleEmail}! MessageId: ${data.messageId}`);
        results.push({ email: singleEmail, success: true, messageId: data.messageId });
      }
    } catch (sendErr) {
      console.error(`[EmailService] Eroare la trimitere catre ${singleEmail}:`, sendErr);
      errors.push(`${singleEmail}: ${sendErr.message}`);
    }
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(`Eroare Brevo: ${errors.join(' | ')}`);
  }

  return {
    success: true,
    messageId: results.map(r => r.messageId).join(','),
    recipients: results.map(r => r.email),
    errors: errors.length > 0 ? errors : undefined,
    count: results.length
  };
}

/**
 * Template Email de Bun Venit la crearea contului
 * Tipografie modernă (Plus Jakarta Sans/Inter), zero stiluri robotizate, zero monospace, logo tenant pe fundal de brand
 */
async function sendWelcomeEmail({ to, userName, companyName, loginUrl, resetPasswordUrl, initialPassword, tenantLogo, themeColor, subdomain }) {
  const name = userName || 'Administrator';
  const company = companyName || 'Smart QR';
  const brandColor = (themeColor && themeColor.startsWith('#')) ? themeColor : '#0f172a';
  const logoUrl = sanitizeEmailLogo(tenantLogo, subdomain);
  const subject = `Bun venit in Smart QR - Cont de acces ${company}`;
  const senderName = `${company} | Smart QR`;
  const cleanResetUrl = ensurePublicUrl(resetPasswordUrl, subdomain);
  const cleanLoginUrl = ensurePublicUrl(loginUrl, subdomain);

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          
          <!-- Header cu Fundal Culoarea Tenantului -->
          <tr>
            <td align="center" style="background-color: ${brandColor}; padding: 40px 24px; text-align: center;">
              ${logoUrl ? `
                <img src="${logoUrl}" alt="${company}" height="60" style="max-height: 60px; max-width: 240px; height: auto; width: auto; object-fit: contain; display: block; margin: 0 auto; border: 0;" />
              ` : `
                <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${company}</div>
              `}
              <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 2px; text-transform: uppercase; margin-top: 12px;">PLATFORMA SMART QR</div>
            </td>
          </tr>

          <!-- Continut Principal -->
          <tr>
            <td style="padding: 40px 36px; color: #1e293b;">
              <h1 style="font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 12px; color: #0f172a; letter-spacing: -0.3px;">Bun venit, ${name}</h1>
              <p style="font-size: 14px; line-height: 1.65; color: #475569; margin: 0 0 26px 0;">
                Contul dumneavoastră de administrator pentru compania <strong>${company}</strong> a fost creat cu succes în sistemul Smart QR.
              </p>

              <!-- Tabel Detalii Cont -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #edf2f7; border-radius: 14px; margin: 0 0 28px 0;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #edf2f7; width: 42%;">Nume utilizator:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #edf2f7;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #edf2f7;">Adresă de email:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #edf2f7;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; ${initialPassword ? 'border-bottom: 1px solid #edf2f7;' : ''}">Companie:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; ${initialPassword ? 'border-bottom: 1px solid #edf2f7;' : ''}">${company}</td>
                      </tr>
                      ${initialPassword ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">Parolă inițială:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">
                          <span style="background-color: #e2e8f0; color: #0f172a; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block;">${initialPassword}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Card Actiune Parola -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border: 1.5px solid #e2e8f0; border-radius: 14px; margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="padding: 28px 24px; text-align: center;">
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.2px;">Configurare sau schimbare parolă</div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 22px; line-height: 1.5;">Pentru a alege o nouă parolă personalizată pentru contul dumneavoastră, apăsați pe butonul de mai jos:</div>
                    
                    <a href="${cleanResetUrl}" target="_blank" style="display: inline-block; background-color: ${brandColor !== '#ffffff' ? brandColor : '#0f172a'}; color: #ffffff !important; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 700; font-size: 14px; letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">Setează Parola de Acces</a>
                    
                    ${cleanLoginUrl ? `
                    <div style="margin-top: 16px;">
                      <a href="${cleanLoginUrl}" target="_blank" style="color: #64748b !important; text-decoration: underline; font-weight: 600; font-size: 13px;">Sau accesați pagina de conectare</a>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- Nota Securitate -->
              <div style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; padding: 12px 16px; border-radius: 6px; margin: 0 0 24px 0; font-size: 12px; color: #64748b; line-height: 1.55;">
                Notă de securitate: Acest link este valabil timp de 48 de ore. Ulterior, puteți solicita oricând un link nou din pagina de autentificare prin opțiunea "Ai uitat parola?".
              </div>

              <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Link direct:<br>
                <a href="${cleanResetUrl}" style="word-break: break-all; color: #3b82f6; font-size: 11px; text-decoration: none;">${cleanResetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 22px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7; line-height: 1.6;">
              Smart QR &bull; Platformă de Gestiune & Pontaj Digital<br>
              Mesaj generat automat pentru ${company}.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `Bun venit, ${name}\n\nA fost configurat contul de acces pentru ${company} in sistemul Smart QR.\nUtilizator: ${name}\nEmail: ${to}\n${initialPassword ? `Parola initiala: ${initialPassword}\n` : ''}\nPentru a seta sau schimba parola, accesati linkul de mai jos (valabil 48 de ore):\n${resetPasswordUrl}\n\nAutentificare: ${loginUrl || resetPasswordUrl}\n\nSmart QR`;

  return sendEmail({ to, subject, html, text, senderName });
}

/**
 * Template Email pentru Resetare Parola (zero emoji, stiluri inline 100%)
 */
async function sendPasswordResetEmail({ to, resetUrl, userName, companyName, tenantLogo, themeColor, subdomain }) {
  const name = userName || 'Administrator';
  const company = companyName || 'Smart QR';
  const brandColor = (themeColor && themeColor.startsWith('#')) ? themeColor : '#0f172a';
  const logoUrl = sanitizeEmailLogo(tenantLogo);
  const subject = `Resetare parola cont ${company} - Smart QR`;
  const senderName = `${company} | Smart QR`;
  const cleanResetUrl = ensurePublicUrl(resetUrl, subdomain);

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          
          <!-- Header cu Fundal Culoarea Tenantului -->
          <tr>
            <td align="center" style="background-color: ${brandColor}; padding: 36px 24px; text-align: center;">
              ${logoUrl ? `
                <img src="${logoUrl}" alt="${company}" height="56" style="max-height: 56px; max-width: 220px; height: auto; width: auto; object-fit: contain; display: block; margin: 0 auto; border: 0;" />
              ` : `
                <div style="font-size: 24px; font-weight: 800; color: #ffffff;">${company}</div>
              `}
              <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 2px; text-transform: uppercase; margin-top: 10px;">PLATFORMA SMART QR</div>
            </td>
          </tr>

          <!-- Continut Principal -->
          <tr>
            <td style="padding: 36px 32px; color: #1e293b;">
              <h1 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #0f172a;">Salut, ${name}</h1>
              <p style="font-size: 14px; line-height: 1.65; color: #475569; margin: 14px 0;">
                A fost înregistrată o solicitare de resetare a parolei pentru contul dumneavoastră asociat acestei adrese de email.
              </p>
              <p style="font-size: 14px; line-height: 1.65; color: #475569; margin: 14px 0;">
                Pentru a alege o nouă parolă, apăsați pe butonul de mai jos:
              </p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${cleanResetUrl}" target="_blank" style="display: inline-block; background-color: ${brandColor !== '#ffffff' ? brandColor : '#0f172a'}; color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 700; font-size: 14px;">Resetează Parola</a>
              </div>

              <div style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; padding: 12px 16px; border-radius: 6px; margin: 24px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Acest link securizat este valabil timp de 30 de minute și poate fi utilizat o singură dată. Dacă nu ați solicitat resetarea, puteți ignora acest mesaj.
              </div>

              <div style="font-size: 11px; color: #94a3b8; margin-top: 24px;">
                Link direct:<br>
                <a href="${cleanResetUrl}" style="word-break: break-all; color: #3b82f6; font-size: 11px; text-decoration: none;">${cleanResetUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7;">
              Smart QR &bull; Notificare de securitate
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `Salut ${name},\n\nAi solicitat resetarea parolei pentru contul Smart QR.\nAcceseaza urmatorul link pentru a introduce o parola noua (valabil 30 de minute):\n\n${resetUrl}\n\nDaca nu ai solicitat aceasta resetare, ignora acest email.`;

  return sendEmail({ to, subject, html, text, senderName });
}

/**
 * Template Notificare: Parola a fost schimbata cu succes (zero emoji, stiluri inline 100%)
 */
async function sendPasswordChangedEmail({ to, userName, companyName, tenantLogo, themeColor }) {
  const name = userName || 'Administrator';
  const company = companyName || 'Smart QR';
  const brandColor = (themeColor && themeColor.startsWith('#')) ? themeColor : '#0f172a';
  const logoUrl = sanitizeEmailLogo(tenantLogo);
  const subject = `Notificare: Parola contului ${company} a fost actualizata`;
  const senderName = `${company} | Smart QR`;

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          
          <!-- Header cu Fundal Culoarea Tenantului -->
          <tr>
            <td align="center" style="background-color: ${brandColor}; padding: 36px 24px; text-align: center;">
              ${logoUrl ? `
                <img src="${logoUrl}" alt="${company}" height="56" style="max-height: 56px; max-width: 220px; height: auto; width: auto; object-fit: contain; display: block; margin: 0 auto; border: 0;" />
              ` : `
                <div style="font-size: 22px; font-weight: 800; color: #ffffff;">${company}</div>
              `}
              <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); letter-spacing: 2px; text-transform: uppercase; margin-top: 10px;">PLATFORMA SMART QR</div>
            </td>
          </tr>

          <!-- Continut Principal -->
          <tr>
            <td style="padding: 36px 32px; color: #1e293b;">
              <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Parola a fost actualizată</h1>
              <p style="font-size: 14px; line-height: 1.65; color: #475569; margin: 12px 0;">Salut, <strong>${name}</strong>. Parola contului dumneavoastră a fost actualizată cu succes.</p>
              <p style="font-size: 14px; line-height: 1.65; color: #475569; margin: 12px 0;">Vă puteți autentifica în platformă folosind noua parolă setată.</p>

              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 12px; color: #9f1239;">
                Dacă nu ați efectuat dumneavoastră această modificare, vă rugăm să contactați de urgență administratorul de sistem sau să resetați imediat parola contului.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7;">
              Smart QR &bull; Notificare automată de securitate
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to, subject, html, text, senderName });
}

/**
 * Template Email: Date de conectare Cont Demo / Activare QrTime.ro
 */
async function sendDemoAccessEmail({ to, contactName, companyName, initialPassword, loginUrl, employeesCount, mode, dpaAudit }) {
  const name = contactName || 'Administrator';
  const company = companyName || 'Companie Partener';
  const isDemo = mode === 'demo';
  const subject = isDemo 
    ? `Date de conectare cont Demo Pontaj.app — ${company}`
    : `Confirmare solicitare activare Pontaj.app — ${company}`;
  const senderName = 'Pontaj.app';
  const cleanLoginUrl = loginUrl || 'https://qr.pontaj.app/admin/login';
  const dateFormatted = dpaAudit?.dateRo || new Date().toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          
          <!-- Header Pontaj.app -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 36px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; border-radius: 12px; padding: 6px 14px; margin-bottom: 10px;">
                <span style="font-size: 18px; font-weight: 900; color: #1d4ed8; letter-spacing: -0.5px;">Pontaj<span style="color: #2563eb;">.app</span></span>
              </div>
              <div style="font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 2px; text-transform: uppercase;">
                ${isDemo ? 'CONT DEMO ACTIVAT (15 ZILE GRATUIT)' : 'SOLICITARE ACTIVARE PLATFORMĂ'}
              </div>
            </td>
          </tr>

          <!-- Continut Principal -->
          <tr>
            <td style="padding: 36px 32px; color: #1e293b;">
              <h1 style="font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 10px; color: #0f172a; letter-spacing: -0.3px;">
                Salut, ${name}!
              </h1>
              <p style="font-size: 14px; line-height: 1.65; color: #475569; margin: 0 0 24px 0;">
                ${isDemo 
                  ? `Contul tău demonstrativ pentru compania <strong>${company}</strong> este pregătit. Ai acces complet timp de 15 zile la toate funcționalitățile (pontaj QR dinamic, condică ITM conformă cu Art. 119 Codul Muncii și export SAGA Salarii).` 
                  : `Am înregistrat solicitarea ta de abonament pentru compania <strong>${company}</strong> (${employeesCount || 10} angajați).`
                }
              </p>

              <!-- Card Date Conectare -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; margin: 0 0 24px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #2563eb; margin-bottom: 12px;">
                      Datele tale de acces
                    </div>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #edf2f7; width: 40%;">Companie:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #edf2f7;">${company}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #edf2f7;">Username (Email):</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #edf2f7;">${to}</td>
                      </tr>
                      ${initialPassword ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #edf2f7;">Parolă de acces:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #edf2f7;">
                          <span style="background-color: #e0e7ff; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px;">${initialPassword}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">Status cont:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #16a34a; font-weight: 700; text-align: right;">Activ (15 Zile Gratuite)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Buton Actiune Directa -->
              <div style="text-align: center; margin: 26px 0;">
                <a href="${cleanLoginUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 15px 36px; border-radius: 9999px; font-weight: 800; font-size: 14px; box-shadow: 0 6px 20px rgba(37,99,235,0.35);">
                  Intră în Panoul de Administrare →
                </a>
              </div>

              <!-- Conectare cu Google -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin: 20px 0; font-size: 12px; color: #334155; line-height: 1.55;">
                <strong>Autentificare rapidă cu Google:</strong> Te poți conecta oricând în aplicație și prin butonul <strong>„Continuă cu Google”</strong> folosind această adresă de email, fără a fi nevoie să reții parola.
              </div>

              <!-- Confirmare Precontract & Acord DPA (Art. 28 GDPR) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 14px; margin: 24px 0 16px 0;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #166534; margin-bottom: 6px;">
                      Conformitate Legală &bull; Acord DPA (Art. 28 GDPR)
                    </div>
                    <p style="font-size: 12px; line-height: 1.6; color: #14532d; margin: 0 0 10px 0;">
                      Prin activarea contului, a fost înregistrat electronic <strong>Acordul de Prelucrare a Datelor cu Caracter Personal (DPA conform Art. 28 Regulamentul UE 2016/679)</strong> între <strong>${company}</strong> (în calitate de Operator) și <strong>Pontaj.app</strong> (Persoană Împuternicită).
                    </p>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 11px; color: #15803d;">
                      <tr>
                        <td style="padding: 3px 0; width: 45%;">Reprezentant / Semnatar:</td>
                        <td style="padding: 3px 0; font-weight: 700; text-align: right; color: #14532d;">${name}</td>
                      </tr>
                      ${dpaAudit?.cui ? `
                      <tr>
                        <td style="padding: 3px 0;">CUI / CIF Companie:</td>
                        <td style="padding: 3px 0; font-weight: 700; text-align: right; color: #14532d;">${dpaAudit.cui}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 3px 0;">Pistă audit electronică:</td>
                        <td style="padding: 3px 0; font-weight: 700; text-align: right; color: #14532d;">IP: ${dpaAudit?.clientIp || 'Înregistrat'} &bull; ${dateFormatted}</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0;">Versiune acord precontractual:</td>
                        <td style="padding: 3px 0; font-weight: 700; text-align: right; color: #14532d;">v2026.1-DPA-ART28</td>
                      </tr>
                    </table>
                    <div style="font-size: 10.5px; color: #166534; margin-top: 10px; border-top: 1px dashed #86efac; padding-top: 8px; line-height: 1.5;">
                      Acest document atestă conformitatea legală a prelucrării datelor salariaților în perioada de testare și utilizare a soluției Pontaj.app conform cerințelor ITM și ANSPDCP. Toate datele sunt stocate criptat pe servere securizate din UE.
                    </div>
                  </td>
                </tr>
              </table>

              <div style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 20px;">
                Ai întrebări sau dorești asistență la instalarea pe tabletele din locații? Echipa noastră te poate asista telefonic la <a href="tel:0757777712" style="color: #2563eb; font-weight: 700; text-decoration: none;">0757 77 77 12</a>.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7; line-height: 1.6;">
              Pontaj.app &bull; Pontaj Electronic QR pe Orice Ecran &amp; Conformitate Art. 119 Codul Muncii<br>
              Ai primit acest mesaj deoarece ai solicitat accesul la platforma Pontaj.app.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `Salut ${name},\n\nContul tau Pontaj.app pentru ${company} este gata.\nEmail: ${to}\n${initialPassword ? `Parola temporara: ${initialPassword}\n` : ''}\nAcceseaza panoul: ${cleanLoginUrl}\n\nConformitate GDPR: A fost inregistrat acordul DPA (Art. 28 GDPR) acceptat electronic de catre ${name} la ${dateFormatted} (IP: ${dpaAudit?.clientIp || 'Inregistrat'}).\n\nSuport: 0757 77 77 12\nPontaj.app`;

  return sendEmail({ to, subject, html, text, senderName });
}

/**
 * Notificare alertă SuperAdmin: Înregistrare nouă / Lead sosit prin Landing Page
 */
async function sendLeadNotificationToAdmin({
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
  duplicateReason
}) {
  const adminRecipient = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.BREVO_SENDER_EMAIL || 'jeka7ro@gmail.com';
  const cleanPhone = phone ? String(phone).replace(/[^0-9+]/g, '') : '';
  const waPhone = cleanPhone.startsWith('0') ? '4' + cleanPhone : cleanPhone.replace('+', '');
  const priceDisplay = planPrice ? `${planPrice} €` : '5.00 €';
  const dupPrefix = isSuspectDuplicate ? '[SUSPECT DUPLICAT] ' : '';
  const subject = `${dupPrefix}[Lead Nou ${mode === 'subscribe' ? 'ABONAMENT' : 'DEMO'}] ${companyName || 'Companie'} (${employeesCount || 10} ang. • ${priceDisplay}) — ${contactName || 'Persoană'} (${phone || 'Fără tel'})`;
  const baseDomain = process.env.BASE_DOMAIN || 'qr.pontaj.app';
  const superadminUrl = `https://${baseDomain}/admin/dashboard`;
  const tenantUrl = loginUrl || (subdomain ? `https://${subdomain}.${baseDomain}/admin/login` : `https://qr.pontaj.app/login`);

  const waLoginMessage = encodeURIComponent(
    `Bună ziua, ${contactName || companyName}!\n\n` +
    `Contul dvs. Pontaj.app pentru compania ${companyName} a fost configurat cu succes.\n\n` +
    `Link de conectare: ${tenantUrl}\n` +
    `Email: ${email}\n` +
    (initialPassword ? `Parolă inițială: ${initialPassword}\n\n` : '\n') +
    `Vă rugăm să accesați linkul pentru a începe utilizarea platformei.`
  );
  const waDirectUrl = `https://wa.me/${waPhone}?text=${waLoginMessage}`;

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
          
          <!-- Header Alert -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 28px; border-bottom: 3px solid #3b82f6;">
              <div style="display: inline-block; background-color: ${mode === 'subscribe' ? '#10b981' : '#3b82f6'}; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                ${mode === 'subscribe' ? 'SOLICITARE ABONAMENT (5 € / angajat)' : 'SOLICITARE DEMO GRATUIT (15 ZILE)'}
              </div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                ${companyName || 'Companie Nouă'}
              </h1>
              <div style="color: #94a3b8; font-size: 13px; margin-top: 6px;">
                Sosit prin formularul Landing Page (${new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })})
              </div>
            </td>
          </tr>

          <!-- Detalii Lead -->
          <tr>
            <td style="padding: 32px 28px;">
              ${isSuspectDuplicate ? `
              <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <div style="font-size: 13px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                  ALERTA FRAUDA / DUPLICAT DEMO
                </div>
                <div style="font-size: 12px; color: #b91c1c; font-weight: 600; line-height: 1.5;">
                  ${duplicateReason || 'Același IP, CUI sau număr de telefon a fost detectat pe conturi anterioare.'}
                </div>
              </div>` : ''}
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; width: 35%; border-bottom: 1px solid #e2e8f0;">Firma:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">${companyName}</td>
                      </tr>
                      ${cui ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">CUI / CIF:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                          <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 6px; font-weight: 800;">${cui}</span>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Persoană Contact:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${contactName || 'Nespecificat'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Telefon Direct (Client):</td>
                        <td style="padding: 8px 0; font-size: 15px; color: #2563eb; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                          ${phone ? `<a href="tel:${cleanPhone}" style="color: #2563eb; text-decoration: none;">${phone}</a>` : '<span style="color: #94a3b8;">Fără număr</span>'}
                        </td>
                      </tr>
                      ${(anafPhone && anafPhone !== phone) ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Telefon Opțional (ANAF):</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                          <a href="tel:${String(anafPhone).replace(/[^0-9+]/g, '')}" style="color: #475569; text-decoration: none;">${anafPhone}</a>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Email:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                          <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                        </td>
                      </tr>
                      ${initialPassword ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Parolă Inițială:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                          <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 6px; font-weight: 800;">${initialPassword}</span>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Nr. Angajați:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0;">${employeesCount || 10} angajați</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Pachet / Tarif Ales:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #166534; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                          ${planName || 'Standard'} &nbsp;&bull;&nbsp; <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px;">${planPrice ? planPrice + ' €' : '5.00 €'} / angajat / lună</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Venit Estimat / Lună:</td>
                        <td style="padding: 8px 0; font-size: 15px; color: #0f172a; font-weight: 900; border-bottom: 1px solid #e2e8f0;">
                          ${Math.max(50, Math.round((parseInt(employeesCount, 10) || 10) * (parseFloat(planPrice) || 5.00)))} € / lună (minim 50 €)
                        </td>
                      </tr>
                      ${subdomain ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Subdomeniu creat:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                          <a href="${tenantUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${subdomain}.${baseDomain}</a>
                        </td>
                      </tr>` : ''}
                      ${(address || city) ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Adresă Sediu:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${[address, city, county].filter(Boolean).join(', ')}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Precontract DPA (Art. 28 GDPR):</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #166534; font-weight: 800; border-bottom: 1px solid #e2e8f0;">
                          <span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px; font-size: 11px;">✓ Acceptat Electronic (IP: ${clientIp || 'Înregistrat'})</span>
                        </td>
                      </tr>
                      ${notes ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600;">Mesaj / Detalii:</td>
                        <td style="padding: 8px 0; font-size: 13px; color: #475569; font-style: italic;">${notes}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Butoane Acțiune Rapidă -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  ${phone ? `
                  <td align="center" style="padding-right: 8px;">
                    <a href="${waDirectUrl}" target="_blank" style="display: block; background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; text-align: center;">
                      Trimite Logare pe WhatsApp
                    </a>
                  </td>
                  <td align="center" style="padding-left: 8px; padding-right: 8px;">
                    <a href="tel:${cleanPhone}" style="display: block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; text-align: center;">
                      Apelează Acum
                    </a>
                  </td>
                  ` : ''}
                  <td align="center" style="padding-left: ${phone ? '8px' : '0'};">
                    <a href="${superadminUrl}" target="_blank" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; text-align: center;">
                      Panou SuperAdmin
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f1f5f9; padding: 16px; font-size: 11px; color: #64748b;">
              Notificare automată din sistemul Pontaj.app • Trimis către ${adminRecipient}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `LEAD NOU PONTAJ.APP\n\nCompanie: ${companyName}\nCUI: ${cui || '-'}\nContact: ${contactName}\nTelefon: ${phone}\nEmail: ${email}\nAngajati: ${employeesCount || 10}\nMod: ${mode}\nAdresa: ${address || '-'}\nSubdomeniu: ${subdomain}\n\nPanou: ${superadminUrl}`;

  // Notificare Telegram SuperAdmin (instantanee, non-blocantă)
  try {
    const telegramService = require('./telegramService');
    telegramService.sendNewAccountAlert({
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
      loginUrl: tenantUrl,
      isSuspectDuplicate,
      duplicateReason
    }).catch(tgErr => console.warn('[Telegram] Alert error:', tgErr.message));
  } catch (err) {
    console.warn('[Telegram] Require error:', err.message);
  }

  return sendEmail({
    to: adminRecipient,
    subject,
    html,
    text,
    senderName: 'Pontaj.app Notificări'
  });
}

module.exports = {
  sendEmail,
  parseRecipients,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendDemoAccessEmail,
  sendLeadNotificationToAdmin,
  ensurePublicUrl
};


