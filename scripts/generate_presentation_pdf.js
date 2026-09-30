const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '../backend/node_modules/puppeteer-core'));

function getBase64Image(filePath) {
  try {
    const fileData = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/svg+xml';
    return `data:${mime};base64,${fileData.toString('base64')}`;
  } catch (e) {
    console.warn(`Could not read ${filePath}:`, e.message);
    return '';
  }
}

async function buildPdf() {
  const logoImg = getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.jpg'));
  const kioskImg = getBase64Image(path.join(__dirname, '../screenshot_kiosk_display.png'));
  const liveTableImg = getBase64Image(path.join(__dirname, '../screenshot_live_table.png'));
  const timesheetImg = getBase64Image(path.join(__dirname, '../screenshot_timesheets.png'));
  const employeesImg = getBase64Image(path.join(__dirname, '../screenshot_employees.png'));

  const htmlContent = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Prezentare Comercială — GetApp Smart QR</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 13px;
      line-height: 1.45;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 16mm 18mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #ffffff;
    }
    .page:last-child {
      page-break-after: auto;
    }

    /* Page Header */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 14px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
    }
    .brand-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-title span {
      color: #2563eb;
    }
    .header-tagline {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      background: #f1f5f9;
      padding: 5px 12px;
      border-radius: 999px;
    }

    /* Page Footer */
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #64748b;
      margin-top: 8px;
    }
    .footer-bar .left {
      font-weight: 600;
    }
    .footer-bar .right {
      font-weight: 700;
      color: #2563eb;
    }

    /* Hero Section */
    .hero-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 16px;
      padding: 18px 22px;
      color: #ffffff;
      margin-bottom: 14px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
      position: relative;
      overflow: hidden;
    }
    .hero-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      background: rgba(37, 99, 235, 0.35);
      color: #93c5fd;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 8px;
      border: 1px solid rgba(147, 197, 253, 0.3);
    }
    .hero-title {
      font-size: 21px;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }
    .hero-desc {
      font-size: 12px;
      color: #cbd5e1;
      max-width: 90%;
      line-height: 1.45;
    }

    /* Feature Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .feature-icon {
      font-size: 16px;
      margin-bottom: 4px;
      color: #2563eb;
      font-weight: 800;
    }
    .feature-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .feature-text {
      font-size: 11px;
      color: #64748b;
      line-height: 1.35;
    }

    /* Screenshots / Mockups */
    .mockup-container {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      margin-bottom: 12px;
    }
    .mockup-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      padding-left: 6px;
    }
    .mockup-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .mockup-dot.red { background: #ef4444; }
    .mockup-dot.yellow { background: #f59e0b; }
    .mockup-dot.green { background: #10b981; }
    .mockup-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #475569;
      margin-left: 8px;
    }
    .mockup-img {
      width: 100%;
      height: auto;
      border-radius: 8px;
      display: block;
      border: 1px solid #e2e8f0;
    }

    /* Dual Column Layout */
    .two-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 12px;
    }

    /* Section Titles */
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.3px;
    }
    .section-title::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 16px;
      background: #2563eb;
      border-radius: 4px;
    }

    /* Highlights list */
    .check-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .check-list li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 11.5px;
      color: #334155;
      line-height: 1.4;
    }
    .check-bullet {
      color: #10b981;
      font-weight: 800;
      font-size: 13px;
      line-height: 1;
      margin-top: 1px;
    }

    /* Pricing Section */
    .pricing-hero {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #2563eb;
      border-radius: 16px;
      padding: 18px 22px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.15);
    }
    .pricing-details {
      max-width: 65%;
    }
    .pricing-tag {
      font-size: 10.5px;
      font-weight: 800;
      color: #1d4ed8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }
    .pricing-heading {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .pricing-sub {
      font-size: 12px;
      color: #475569;
      line-height: 1.4;
    }
    .pricing-box {
      background: #ffffff;
      border-radius: 14px;
      padding: 14px 20px;
      text-align: center;
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.12);
      border: 1px solid #bfdbfe;
      min-width: 140px;
    }
    .price-value {
      font-size: 32px;
      font-weight: 800;
      color: #1d4ed8;
      line-height: 1;
      letter-spacing: -1px;
    }
    .price-unit {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      margin-top: 4px;
    }
    .price-minimum {
      display: inline-block;
      margin-top: 6px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    /* Simulation Table */
    .table-calc {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .table-calc th {
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 8px 12px;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table-calc td {
      padding: 8px 12px;
      font-size: 11.5px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .table-calc tr:nth-child(even) td {
      background: #f8fafc;
    }
    .table-calc tr.highlight td {
      background: #eff6ff;
      font-weight: 700;
      color: #1d4ed8;
    }

    /* CTA Card */
    .cta-card {
      background: #0f172a;
      color: #ffffff;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .cta-text h4 {
      font-size: 15px;
      font-weight: 800;
      margin-bottom: 3px;
    }
    .cta-text p {
      font-size: 11.5px;
      color: #94a3b8;
    }
    .cta-button {
      background: #2563eb;
      color: #ffffff;
      font-weight: 800;
      font-size: 12px;
      padding: 10px 18px;
      border-radius: 10px;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGINA 1: INTRODUCERE & KIOSK TABLETĂ ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <img src="${logoImg}" alt="GetApp Smart QR" style="height: 56px; width: auto; object-fit: contain; display: block;">
        </div>
        <div class="header-tagline">Soluție Digitală de Pontaj Profesional</div>
      </div>

      <div class="hero-banner">
        <div class="hero-badge">Tehnologie Cloud & Tablete Kiosk</div>
        <h1 class="hero-title">Sistem Inteligent de Pontaj Digital<br>prin Cod QR Dinamic și Tabletă</h1>
        <p class="hero-desc">
          Elimină complet foile de prezență fizice, cartelele pierdute și timpul irosit la calculul lunar al orelor. 
          Pontaj sigur, instantaneu și 100% conform cu Art. 119 din Codul Muncii.
        </p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">Sub 1 Secundă</div>
          <div class="feature-title">Scanare Ultra-Rapidă</div>
          <div class="feature-text">Angajatul apropie legitimata sau ecranul telefonului de camera tabletei. Confirmare audio-vizuală instantanee.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">Zero Fraudă</div>
          <div class="feature-title">Cod QR Dinamic Rotativ</div>
          <div class="feature-text">Codul se regenerează automat la fiecare 15 secunde. Este imposibil de trimis prin WhatsApp sau fotografiat.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">Zero Hardware Suplimentar</div>
          <div class="feature-title">Rulează pe Orice Tabletă</div>
          <div class="feature-text">Funcționează pe orice iPad sau tabletă Android standard, fără dispozitive biometrice scumpe sau mentenanță.</div>
        </div>
      </div>

      <div class="section-title">Terminalul Kiosk de Intrare (Afișat la recepție sau poartă)</div>
      
      <div class="mockup-container">
        <div class="mockup-header">
          <span class="mockup-dot red"></span>
          <span class="mockup-dot yellow"></span>
          <span class="mockup-dot green"></span>
          <span class="mockup-label">Terminal Kiosk Activ - Ecran Tabletă (Ceas digital, Dată, QR Dinamic securizat)</span>
        </div>
        <img src="${kioskImg}" class="mockup-img" style="max-height: 145mm; object-fit: contain; background: #000;" alt="Kiosk Tablet Screen">
      </div>

      <div class="two-cols" style="margin-top: 6px;">
        <ul class="check-list">
          <li><span class="check-bullet">✓</span> <span><strong>Anti-Standby 24/7</strong>: Tableta rămâne aprinsă permanent în regim securizat kiosk.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Dublă opțiune</strong>: Scanare QR sau tastare cod PIN individual pentru fiecare angajat.</span></li>
        </ul>
        <ul class="check-list">
          <li><span class="check-bullet">✓</span> <span><strong>Branding personalizat</strong>: Sigla companiei tale și fundal adaptat identității vizuale.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Multi-locație</strong>: Gestionează puncte de lucru nelimitate de pe un singur cont central.</span></li>
        </ul>
      </div>
    </div>

    <div class="footer-bar">
      <div class="left">GetApp Smart QR — Soluție SaaS Enterprise de Evidență și Pontaj Digital</div>
      <div class="right">Pagina 1 din 3</div>
    </div>
  </div>

  <!-- ==================== PAGINA 2: DASHBOARD LIVE & MODUL HR ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <img src="${logoImg}" alt="GetApp Smart QR" style="height: 56px; width: auto; object-fit: contain; display: block;">
        </div>
        <div class="header-tagline">Panou Administrativ & Rapoarte</div>
      </div>

      <div class="section-title">Situație Live în Timp Real & Cronometru Tură (hh:mm:ss)</div>
      <p style="font-size: 11.5px; color: #475569; margin-bottom: 8px;">
        Vezi în fiecare secundă cine este la muncă, cine a întârziat și timpul exact lucrat. Cronometrul digital afișează orele, minutele și secundele în direct.
      </p>

      <div class="mockup-container" style="margin-bottom: 12px;">
        <div class="mockup-header">
          <span class="mockup-dot red"></span>
          <span class="mockup-dot yellow"></span>
          <span class="mockup-dot green"></span>
          <span class="mockup-label">Panou Control Live — Tabel Angajați, Statut Prezent/Absent, Timp Lucrat live</span>
        </div>
        <img src="${liveTableImg}" class="mockup-img" style="max-height: 85mm; object-fit: cover; object-position: top;" alt="Live Table">
      </div>

      <div class="two-cols" style="margin-bottom: 10px;">
        <div>
          <div class="section-title">Modul HR & Gestiune Echipă</div>
          <div class="mockup-container" style="margin-bottom: 6px;">
            <img src="${employeesImg}" class="mockup-img" style="max-height: 60mm; object-fit: cover; object-position: top;" alt="Employees List">
          </div>
          <ul class="check-list">
            <li><span class="check-bullet">✓</span> <span><strong>Import 1-Click din Excel</strong>: Încarci 50 sau 500 de salariați în sub 2 minute.</span></li>
            <li><span class="check-bullet">✓</span> <span><strong>Legitimații digitale & PIN</strong>: Generare automată carduri de acces pentru fiecare angajat.</span></li>
          </ul>
        </div>

        <div>
          <div class="section-title">Rapoarte Lunare & Export Excel / SAGA</div>
          <div class="mockup-container" style="margin-bottom: 6px;">
            <img src="${timesheetImg}" class="mockup-img" style="max-height: 60mm; object-fit: cover; object-position: top;" alt="Timesheet Report">
          </div>
          <ul class="check-list">
            <li><span class="check-bullet">✓</span> <span><strong>Calcul automat ore</strong>: Total ore lucrate, ore de noapte, weekend și suplimentare.</span></li>
            <li><span class="check-bullet">✓</span> <span><strong>Export Contabilitate</strong>: Foaie colectivă de prezență gata pentru salariu și control ITM.</span></li>
          </ul>
        </div>
      </div>

      <div style="background: #f1f5f9; border-radius: 10px; padding: 9px 14px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 11px; font-weight: 700; color: #1e293b;">Conformitate Legală Deplină:</span>
        <span style="font-size: 10.5px; color: #475569;">Respectă integral cerințele <strong>Codului Muncii (Art. 119)</strong> și reglementările <strong>RGPD / GDPR</strong>.</span>
      </div>
    </div>

    <div class="footer-bar">
      <div class="left">GetApp Smart QR — Eficiență Operațională și Control în Timp Real</div>
      <div class="right">Pagina 2 din 3</div>
    </div>
  </div>

  <!-- ==================== PAGINA 3: OFERTĂ COMERCIALĂ & COSTURI ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <img src="${logoImg}" alt="GetApp Smart QR" style="height: 56px; width: auto; object-fit: contain; display: block;">
        </div>
        <div class="header-tagline">Ofertă Comercială & Implementare</div>
      </div>

      <div class="pricing-hero" style="padding: 24px 28px; margin-bottom: 24px;">
        <div class="pricing-details">
          <div class="pricing-tag">Model Transparent & Fără Angajamente Ascunse</div>
          <div class="pricing-heading" style="font-size: 24px; margin-bottom: 8px;">Abonament Lunar All-Inclusive</div>
          <div class="pricing-sub" style="font-size: 13px; max-width: 450px; line-height: 1.5;">
            Fără costuri de instalare, fără licențe de server și fără perioadă contractuală forțată.
            Plătești exclusiv pentru numărul de angajați activi din companie, cu acces complet la toate funcționalitățile.
          </div>
        </div>
        <div class="pricing-box" style="padding: 20px 26px;">
          <div class="price-value" style="font-size: 42px;">5 €</div>
          <div class="price-unit" style="font-size: 12px; margin-top: 4px;">/ angajat / lună</div>
          <div class="price-minimum" style="font-size: 11px; margin-top: 8px;">Minim 50 € / lună / firmă</div>
        </div>
      </div>

      <div class="section-title" style="margin-bottom: 12px;">Ce Include Abonamentul Tău All-Inclusive</div>
      <div class="two-cols" style="margin-bottom: 26px; gap: 24px;">
        <ul class="check-list" style="gap: 14px;">
          <li><span class="check-bullet">✓</span> <span><strong>Aplicație Kiosk Nelimitată</strong> pe oricâte tablete sau terminale doriți.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Dashboard Live & Monitorizare</strong> a prezenței în timp real pe orice dispozitiv.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Rapoarte Complete & Condică de Prezență</strong> conformă 100% cu Codul Muncii.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Export Automat în Excel & SAGA C</strong> pentru transmitere rapidă la contabilitate.</span></li>
        </ul>
        <ul class="check-list" style="gap: 14px;">
          <li><span class="check-bullet">✓</span> <span><strong>Modul Planificator Ture & Concedii</strong> cu aprobări și pontaj orar flexibil.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Notificări WhatsApp & Email</strong> pentru întârzieri, absențe și alerte de sistem.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Backup Cloud Automat Zilnic</strong> și securitate garantată a datelor companiei.</span></li>
          <li><span class="check-bullet">✓</span> <span><strong>Suport Tehnic Direct & Asistență</strong> la configurarea inițială a contului.</span></li>
        </ul>
      </div>

      <div class="section-title" style="margin-bottom: 12px;">Implementare în 3 Pași Simpli (Gata în 15 Minute)</div>
      <div class="features-grid" style="margin-bottom: 26px;">
        <div class="feature-card" style="border-left: 4px solid #2563eb; padding: 16px 18px;">
          <div class="feature-icon" style="font-size: 11px;">Pasul 1</div>
          <div class="feature-title" style="font-size: 15px; margin-bottom: 6px;">Import Angajați</div>
          <div class="feature-text">Încarci tabelul Excel cu echipa. Sistemul generează automat legitimația digitală și codul PIN.</div>
        </div>
        <div class="feature-card" style="border-left: 4px solid #10b981; padding: 16px 18px;">
          <div class="feature-icon" style="font-size: 11px;">Pasul 2</div>
          <div class="feature-title" style="font-size: 15px; margin-bottom: 6px;">Activezi Tableta</div>
          <div class="feature-text">Deschizi link-ul Kiosk securizat pe tableta montată la recepție sau poartă. Gata de scanare.</div>
        </div>
        <div class="feature-card" style="border-left: 4px solid #8b5cf6; padding: 16px 18px;">
          <div class="feature-icon" style="font-size: 11px;">Pasul 3</div>
          <div class="feature-title" style="font-size: 15px; margin-bottom: 6px;">Pontaj Automat</div>
          <div class="feature-text">Angajații scanează codul la sosire și plecare. Orele lucrate și suplimentare se calculează automat.</div>
        </div>
      </div>

      <div class="cta-card" style="padding: 20px 26px;">
        <div class="cta-text">
          <h4 style="font-size: 17px; margin-bottom: 5px;">Vrei să testezi sistemul în compania ta?</h4>
          <p style="font-size: 12.5px;">Oferim 14 zile de testare gratuită completă, fără niciun cost inițial și fără card bancar.</p>
        </div>
        <a href="mailto:contact@qrpontaj.ro" class="cta-button" style="font-size: 13.5px; padding: 13px 24px;">Solicită Demo Gratuit</a>
      </div>
    </div>

    <div class="footer-bar">
      <div class="left">GetApp Smart QR — Contact Vânzări: contact@getapp.ro | Tel: 0722 000 000</div>
      <div class="right">Pagina 3 din 3</div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../presentation_temp.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Saved presentation_temp.html');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000)); // wait for Google Fonts

  const pdfPath = path.join(__dirname, '../Prezentare_Comerciala_QR_Pontaj.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });

  console.log(`Successfully generated PDF at: ${pdfPath}`);

  // Also save PNG preview of each page
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const pageElements = await page.$$('.page');
  for (let i = 0; i < pageElements.length; i++) {
    const previewPath = path.join(__dirname, `../pdf_page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: previewPath });
    console.log(`Saved page preview: ${previewPath}`);
  }

  await browser.close();
}

buildPdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
