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
 * Trimitere email generic prin Brevo

 */
async function sendEmail({ to, subject, html, text, senderName }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'jeka7ro@gmail.com';
  const name = senderName || process.env.BREVO_SENDER_NAME || 'Smart QR';

  if (!apiKey) {
    console.error('[EmailService] Lipseste BREVO_API_KEY in .env!');
    throw new Error('Serviciul de email nu este configurat corespunzator.');
  }

  const payload = {
    sender: {
      name: name,
      email: senderEmail
    },
    to: Array.isArray(to) ? to : [{ email: to }],
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
      console.error('[EmailService] Brevo API Error:', data);
      throw new Error(data.message || 'Eroare la trimiterea emailului prin Brevo.');
    }

    console.log(`[EmailService] Email trimis cu succes catre ${typeof to === 'string' ? to : JSON.stringify(to)}! MessageId: ${data.messageId}`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('[EmailService] Eroare la trimitere:', error);
    throw error;
  }
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

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  ensurePublicUrl
};

