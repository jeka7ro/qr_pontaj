require('dotenv').config();
const { sendEmail } = require('../services/emailService');

(async () => {
  const recipient = process.argv[2] || process.env.ADMIN_NOTIFICATION_EMAIL || 'jeka7ro@gmail.com';
  
  const subject = 'Pontaj digital QR & condică ITM';

  const textContent = `Buna ziua,

Va contactez in legatura cu simplificarea gestiunii prezentei si evidenta orelor de munca pentru echipa companiei dvs.

In contextul cerintelor prevazute de Art. 119 din Codul Muncii si al timpului consumat lunar cu centralizarea foilor de prezenta, Pontaj.app elimina complet condicile pe hartie:

• Terminal Kiosk pe tableta la intrare: salariatii scaneaza codul QR dinamic in sub o secunda, fara aparate biometrice costisitoare (solutie 100% cloud, folositi orice tableta existenta; tableta si/sau suportul digital nu sunt oferite de noi si sunt in responsabilitatea clientului).
• Condica de prezenta conforma Art. 119: inregistreaza automat orele exacte de intrare si iesire, minut cu minut, gata oricand pentru controlul ITM.
• Integrare directa cu SAGA Salarii si Excel: calcul automat pentru orele de zi, de noapte (22:00 - 06:00), weekend si suplimentare, cu export 1-Click in contabilitate.

Scaneaza codul QR cu camera telefonului sau acceseaza direct:
https://qr.pontaj.app (test gratuit 15 zile)

Daca doriti o scurta prezentare online sau aveti intrebari despre configurare, ne puteti raspunde direct la acest email sau ne puteti contacta la 0757 77 77 12 ori direct pe WhatsApp:
https://wa.me/40757777712

Cu respect,
Echipa Pontaj.app
Email: contact@pontaj.app
Telefon: 0757 77 77 12
WhatsApp Direct: https://wa.me/40757777712
Web: https://qr.pontaj.app`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); text-align: left;">
          
          <!-- Header Modern, Compact si Curat cu Logo Pontaj.app -->
          <tr>
            <td style="background: #0f172a; padding: 16px 24px; border-bottom: 3px solid #2563eb;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Patrat Logo Albastru cu QR Centrat Geometric -->
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="width: 36px; height: 36px; border-collapse: collapse;">
                      <tr>
                        <td align="center" valign="middle" style="width: 36px; height: 36px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); background-color: #2563eb; border-radius: 10px; text-align: center; vertical-align: middle; padding: 0; margin: 0; font-size: 0; line-height: 0; box-shadow: 0 4px 10px rgba(37,99,235,0.4);">
                          <img 
                            src="https://images.weserv.nl/?url=api.iconify.design/lucide/qr-code.svg?color=%2523ffffff&w=48&h=48&output=png" 
                            width="20" 
                            height="20" 
                            alt="QR" 
                            style="display: block; margin: 0 auto; padding: 0; border: 0; width: 20px; height: 20px;" 
                          />
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.4px; line-height: 1;">
                      Pontaj<span style="color: #3b82f6;">.app</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Continut Principal -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
                Buna ziua,
              </p>
              <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155; line-height: 1.6;">
                Va contactez in legatura cu simplificarea gestiunii prezentei si evidenta orelor de munca pentru echipa companiei dvs.
              </p>
              <p style="font-size: 14px; margin: 0 0 20px 0; color: #334155; line-height: 1.6;">
                In contextul cerintelor prevazute de <strong>Art. 119 din Codul Muncii</strong> si al timpului consumat lunar cu centralizarea foilor de prezenta, <strong>Pontaj.app</strong> elimina complet condicile pe hartie:
              </p>

              <!-- Poza din Video: Barbat care scaneaza QR-ul de pe tableta montata la intrare -->
              <div style="margin: 22px 0 20px 0; text-align: center;">
                <a href="https://qr.pontaj.app" target="_blank" style="text-decoration: none; display: block;">
                  <img 
                    src="https://qr.pontaj.app/media/qrtime-demo-poster.jpg" 
                    alt="Salariat scaneaza codul QR de pe tableta la intrare" 
                    width="100%" 
                    style="display: block; width: 100%; max-width: 516px; height: auto; border-radius: 14px; border: 1px solid #cbd5e1; box-shadow: 0 6px 18px rgba(0,0,0,0.08); margin: 0 auto;" 
                  />
                </a>
                <div style="font-size: 11px; color: #64748b; margin-top: 8px; font-weight: 600;">
                  Terminal Kiosk pe tableta la intrare &bull; Scanare rapida sub o secunda cu orice telefon
                </div>
              </div>

              <!-- Beneficii Cheie -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155; line-height: 1.7;">
                      <li style="margin-bottom: 10px;">
                        <strong>Terminal Kiosk pe tableta la intrare:</strong> salariatii scaneaza codul QR dinamic in sub o secunda, fara aparate biometrice costisitoare (solutie 100% cloud, folositi orice tableta existenta; tableta si/sau suportul digital nu sunt oferite de noi si sunt in responsabilitatea clientului).
                      </li>
                      <li style="margin-bottom: 10px;">
                        <strong>Condica de prezenta conforma Art. 119:</strong> inregistreaza automat orele exacte de intrare si iesire, gata oricand pentru controlul ITM.
                      </li>
                      <li>
                        <strong>Integrare directa cu SAGA Salarii si Excel:</strong> calcul automat pentru orele de zi, de noapte (22:00 - 06:00), weekend si suplimentare, cu export 1-Click in contabilitate.
                      </li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Caseta cu Codul QR Scanabil cu Camera Telefonului -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%); border: 1.5px solid #bfdbfe; border-radius: 16px; margin-bottom: 24px; text-align: center;">
                <tr>
                  <td style="padding: 24px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #2563eb; letter-spacing: 0.8px; margin-bottom: 6px;">
                      TESTEAZA TEHNOLOGIA QR CHIAR ACUM
                    </div>
                    <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 14px;">
                      Scaneaza codul QR cu camera telefonului pentru a deschide demo-ul:
                    </div>
                    
                    <a href="https://qr.pontaj.app" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https%3A%2F%2Fqr.pontaj.app&color=0f172a&bgcolor=ffffff" width="140" height="140" alt="Cod QR Pontaj.app" style="display: block; margin: 0 auto; border-radius: 12px; border: 2px solid #2563eb; padding: 10px; background: #ffffff; box-shadow: 0 4px 14px rgba(37,99,235,0.18);" />
                    </a>
                    
                    <div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 12px;">
                      Deschide direct platforma Pontaj.app pe telefon (solutie 100% cloud, fara instalare)
                    </div>
                  </td>
                </tr>
              </table>



              <!-- Buton Principal de Actiune -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <a href="https://qr.pontaj.app" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 9999px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 14px rgba(37,99,235,0.28); white-space: nowrap;">
                      Activeaza Contul Gratuit de Test (15 Zile) &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; margin: 0 0 24px 0; color: #475569; line-height: 1.6;">
                Daca doriti o scurta prezentare online sau aveti intrebari despre configurare, ne puteti raspunde direct la acest email sau ne puteti contacta la <a href="tel:0757777712" style="color: #0f172a; text-decoration: none; font-weight: 700;">0757 77 77 12</a> ori direct pe <a href="https://wa.me/40757777712?text=Buna%20ziua,%20doresc%20detalii%20despre%20Pontaj.app" target="_blank" style="color: #16a34a; text-decoration: underline; font-weight: 700;">WhatsApp</a>.
              </p>

              <!-- Semnatura si Buton Direct WhatsApp -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; padding-top: 18px;">
                <tr>
                  <td valign="middle">
                    <div style="font-size: 14px; font-weight: 800; color: #0f172a;">Echipa Pontaj.app</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 3px;">
                      Email: <a href="mailto:contact@pontaj.app" style="color: #2563eb; text-decoration: none;">contact@pontaj.app</a> &bull; Telefon: <a href="tel:0757777712" style="color: #475569; text-decoration: none; font-weight: 600;">0757 77 77 12</a>
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                      Website: <a href="https://qr.pontaj.app" target="_blank" style="color: #2563eb; text-decoration: none;">https://qr.pontaj.app</a>
                    </div>
                  </td>
                  <td align="right" valign="middle" style="padding-left: 12px;">
                    <a href="https://wa.me/40757777712?text=Buna%20ziua,%20doresc%20detalii%20despre%20Pontaj.app" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff !important; text-decoration: none; padding: 10px 18px; border-radius: 9999px; font-weight: 800; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 8px rgba(22,163,74,0.3);">
                      Scrie pe WhatsApp &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Neutru -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9;">
              Pontaj.app &bull; Serviciu digital securizat de pontaj electronic in cloud
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  console.log('Trimitere email cu poza barbatului din video si iconita centrata:', recipient);
  const result = await sendEmail({
    to: recipient,
    subject: subject,
    text: textContent,
    html: htmlContent,
    senderName: 'Pontaj.app'
  });
  console.log('Rezultat trimitere Brevo:', result);
  process.exit(0);
})().catch(err => {
  console.error('Eroare la trimitere:', err);
  process.exit(1);
});
