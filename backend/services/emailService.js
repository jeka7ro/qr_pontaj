/**
 * Email Service using Brevo (Sendinblue) Transactional API
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Trimitere email generic prin Brevo
 */
async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'jeka7ro@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Pontaj Digital';

  if (!apiKey) {
    console.error('[EmailService] Lipseste BREVO_API_KEY in .env!');
    throw new Error('Serviciul de email nu este configurat corespunzator.');
  }

  const payload = {
    sender: {
      name: senderName,
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
 * Template Email pentru Resetare Parola
 */
async function sendPasswordResetEmail({ to, resetUrl, userName }) {
  const name = userName || 'Administrator';
  const subject = '🔐 Resetare parolă cont Pontaj Digital';

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 560px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 36px 30px; text-align: center; }
    .brand { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .brand-sub { color: #94a3b8; font-size: 13px; font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 40px 32px; color: #1e293b; }
    h1 { font-size: 20px; font-weight: 700; margin-top: 0; color: #0f172a; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 16px 0; }
    .btn-wrapper { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
    .alert-box { background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin: 24px 0; font-size: 13px; color: #64748b; line-height: 1.5; }
    .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .url-fallback { word-break: break-all; color: #3b82f6; font-size: 12px; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h2 class="brand">PONTAJ DIGITAL</h2>
        <div class="brand-sub">Platformă de Gestiune & Kiosk</div>
      </div>
      
      <div class="content">
        <h1>Salut, ${name} 👋</h1>
        <p>Am primit o solicitare de resetare a parolei pentru contul tău asociat acestei adrese de email.</p>
        <p>Pentru a alege o parolă nouă, apasă pe butonul securizat de mai jos:</p>
        
        <div class="btn-wrapper">
          <a href="${resetUrl}" class="btn" target="_blank">Resetează Parola</a>
        </div>

        <div class="alert-box">
          ⏱️ <strong>Atenție:</strong> Acest link de securitate este valabil timp de <strong>30 de minute</strong> și poate fi utilizat o singură dată. Dacă nu ai solicitat tu această resetare, poți ignora acest mesaj – contul tău este în siguranță.
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
          Dacă butonul de mai sus nu funcționează, copiază și lipește următorul link în bara browserului:<br>
          <a href="${resetUrl}" class="url-fallback">${resetUrl}</a>
        </p>
      </div>

      <div class="footer">
        &copy; ${new Date().getFullYear()} Pontaj Digital. Toate drepturile rezervate.<br>
        Acest mesaj a fost trimis automat de sistemul de securitate.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Salut ${name},\n\nAi solicitat resetarea parolei pentru contul Pontaj Digital.\nAccesează următorul link pentru a introduce o parolă nouă (valabil 30 de minute):\n\n${resetUrl}\n\nDacă nu ai solicitat această resetare, ignoră acest email.`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Template Notificare: Parola a fost schimbata cu succes
 */
async function sendPasswordChangedEmail({ to, userName }) {
  const name = userName || 'Administrator';
  const subject = '✅ Parola contului tău a fost actualizată';

  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 560px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 36px 30px; text-align: center; }
    .brand { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .brand-sub { color: #94a3b8; font-size: 13px; font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 40px 32px; color: #1e293b; text-align: center; }
    .icon-badge { width: 64px; height: 64px; border-radius: 50%; background-color: #ecfdf5; border: 2px solid #10b981; color: #10b981; font-size: 32px; line-height: 60px; margin: 0 auto 20px auto; }
    h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 12px 0; }
    .alert-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: left; font-size: 13px; color: #991b1b; }
    .footer { background-color: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h2 class="brand">PONTAJ DIGITAL</h2>
        <div class="brand-sub">Platformă de Gestiune & Kiosk</div>
      </div>
      
      <div class="content">
        <div class="icon-badge">✓</div>
        <h1>Parolă schimbată cu succes</h1>
        <p>Salut, <strong>${name}</strong>. Parola contului tău a fost actualizată recent.</p>
        <p>Te poți autentifica acum în platformă folosind noua parolă.</p>

        <div class="alert-box">
          🛡️ <strong>Nu ai fost tu?</strong> Dacă nu ai efectuat tu această modificare, te rugăm să contactezi de urgență administratorul de sistem sau să resetezi imediat parola contului tău.
        </div>
      </div>

      <div class="footer">
        &copy; ${new Date().getFullYear()} Pontaj Digital. Notificare automată de securitate.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({ to, subject, html, text: `Salut ${name},\nParola contului tau Pontaj Digital a fost schimbata cu succes.` });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
