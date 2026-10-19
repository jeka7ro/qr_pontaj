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

async function buildPdfV2() {
  const logoImg = getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.jpg'));
  const kioskImg = getBase64Image(path.join(__dirname, '../screenshot_kiosk_display.png'));
  const dashboardImg = getBase64Image(path.join(__dirname, '../screenshot_dashboard.png'));
  const timesheetImg = getBase64Image(path.join(__dirname, '../screenshot_timesheets.png'));
  const employeesImg = getBase64Image(path.join(__dirname, '../screenshot_employees.png'));

  const htmlContent = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Prezentare Executivă — GetApp Smart QR</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
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
      font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      letter-spacing: -0.015em;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 12.5px;
      line-height: 1.45;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 14mm 16mm;
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

    /* Top Corporate Header */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 12px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-img {
      height: 38px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .brand-meta-divider {
      width: 1px;
      height: 28px;
      background: #cbd5e1;
    }
    .brand-meta {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-meta-tagline {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      letter-spacing: -0.2px;
    }
    .brand-meta-url {
      font-size: 11px;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: 0.2px;
    }
    .header-doc-info {
      text-align: right;
    }
    .doc-type {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
    }
    .doc-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    /* Bottom Corporate Footer */
    .bottom-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
    }
    .footer-contacts span {
      margin-right: 14px;
    }
    .footer-contacts strong {
      color: #0f172a;
    }

    /* Executive Hero Block */
    .hero-box {
      background: #090d16;
      color: #ffffff;
      border-radius: 12px;
      padding: 16px 20px;
      position: relative;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .hero-eyebrow {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 2px 8px;
      border-radius: 20px;
      margin-bottom: 6px;
    }
    .hero-heading {
      font-size: 20px;
      font-weight: 900;
      line-height: 1.22;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .hero-description {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
      max-width: 620px;
    }

    /* Metrics Strip */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 11px;
      display: flex;
      flex-direction: column;
    }
    .metric-val {
      font-size: 21px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .metric-val.blue { color: #2563eb; }
    .metric-val.emerald { color: #059669; }
    .metric-label {
      font-size: 10.5px;
      font-weight: 800;
      color: #334155;
      margin-bottom: 2px;
    }
    .metric-sub {
      font-size: 9.5px;
      color: #64748b;
      line-height: 1.3;
    }

    /* Comparison Table (Pro-Business, Zero fluff) */
    .comp-table-wrap {
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 10.5px;
    }
    .comp-table th {
      background: #f1f5f9;
      color: #334155;
      padding: 7px 10px;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #cbd5e1;
    }
    .comp-table th.highlight {
      background: #eff6ff;
      color: #1d4ed8;
      border-bottom: 2px solid #2563eb;
    }
    .comp-table td {
      padding: 6.5px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #475569;
    }
    .comp-table tr:last-child td {
      border-bottom: none;
    }
    .comp-table td.criteria {
      font-weight: 700;
      color: #0f172a;
      width: 25%;
    }
    .comp-table td.highlight {
      background: #f8faff;
      font-weight: 700;
      color: #1e3a8a;
    }

    /* Kiosk Feature Display */
    .kiosk-feature-box {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 14px;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .kiosk-mock-frame {
      background: #000000;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #1e293b;
      box-shadow: 0 6px 16px -3px rgba(0, 0, 0, 0.35);
    }
    .kiosk-mock-frame img {
      width: 100%;
      height: 54mm;
      object-fit: cover;
      object-position: center;
      display: block;
      background: #000000;
    }
    .kiosk-points {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .kiosk-point {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .kiosk-icon {
      width: 22px;
      height: 22px;
      border-radius: 5px;
      background: #eff6ff;
      color: #2563eb;
      font-weight: 800;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid #dbeafe;
    }
    .kiosk-point-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1px;
    }
    .kiosk-point-desc {
      font-size: 10px;
      color: #64748b;
      line-height: 1.35;
    }

    /* Section Subheaders */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .section-sub {
      font-size: 10px;
      color: #64748b;
    }

    /* Page 2: Three Pillars */
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 16px;
    }
    .pillar-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .pillar-num {
      font-size: 10px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .pillar-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
    }
    .pillar-desc {
      font-size: 11px;
      color: #64748b;
      line-height: 1.45;
    }
    .pillar-check {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 11px;
      color: #334155;
      margin-top: 4px;
    }
    .pillar-check li {
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }
    .pillar-check li span.bullet {
      color: #2563eb;
      font-weight: 800;
    }

    /* Visual Showcase Frame on Page 2 */
    .showcase-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 14px;
      align-items: stretch;
      margin-bottom: 14px;
    }
    .showcase-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      background: #f8fafc;
      padding: 12px;
      display: flex;
      flex-direction: column;
    }
    .showcase-header {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .showcase-tag {
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .showcase-img-wrap {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
      flex: 1;
    }
    .showcase-img-wrap img {
      width: 100%;
      height: 65mm;
      object-fit: cover;
      object-position: top;
      display: block;
    }

    /* Auto-Close Shift Callout Card */
    .autoclose-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
    }
    .autoclose-info h4 {
      font-size: 13px;
      font-weight: 800;
      color: #166534;
      margin-bottom: 2px;
    }
    .autoclose-info p {
      font-size: 11px;
      color: #15803d;
      line-height: 1.4;
    }
    .autoclose-badge {
      background: #16a34a;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
      white-space: nowrap;
    }

    /* Compliance & Security Strip */
    .compliance-strip {
      background: #0f172a;
      color: #ffffff;
      border-radius: 10px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .compliance-col-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #38bdf8;
      margin-bottom: 3px;
    }
    .compliance-col-desc {
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.4;
    }

    /* Page 3: Commercial Offer */
    .offer-hero {
      background: #f8fafc;
      border: 1.5px solid #2563eb;
      border-radius: 14px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
    }
    .offer-title-wrap h3 {
      font-size: 11px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }
    .offer-title-wrap h2 {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .offer-title-wrap p {
      font-size: 11.5px;
      color: #475569;
      max-width: 440px;
      line-height: 1.45;
    }
    .price-tag-box {
      background: #ffffff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 16px 22px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    }
    .price-value {
      font-size: 38px;
      font-weight: 900;
      color: #1e40af;
      line-height: 1;
      margin-bottom: 4px;
    }
    .price-unit {
      font-size: 11.5px;
      font-weight: 700;
      color: #64748b;
    }
    .price-min {
      font-size: 10px;
      font-weight: 800;
      color: #2563eb;
      background: #eff6ff;
      padding: 3px 8px;
      border-radius: 4px;
      margin-top: 6px;
      display: inline-block;
    }

    /* What's Included Grid */
    .included-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .included-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .included-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 11.5px;
      color: #334155;
    }
    .included-check {
      color: #059669;
      font-weight: 900;
      font-size: 13px;
    }
    .included-item strong {
      color: #0f172a;
    }

    /* 3-Step Rollout */
    .rollout-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .rollout-card {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 10px;
      padding: 14px;
      border-top: 3px solid #2563eb;
    }
    .rollout-card.green { border-top-color: #10b981; }
    .rollout-card.purple { border-top-color: #8b5cf6; }
    .rollout-step {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .rollout-title {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .rollout-desc {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }

    /* Bottom CTA Card */
    .cta-strip {
      background: #090d16;
      border-radius: 12px;
      padding: 18px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .cta-text-left h4 {
      font-size: 16px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 3px;
    }
    .cta-text-left p {
      font-size: 11.5px;
      color: #94a3b8;
    }
    .cta-contacts-line {
      display: flex;
      gap: 16px;
      margin-top: 6px;
      font-size: 11px;
      color: #cbd5e1;
    }
    .cta-contacts-line strong {
      color: #ffffff;
    }
    .cta-action-btn {
      background: #2563eb;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 12px 22px;
      border-radius: 8px;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGINA 1: OVERVIEW STRATEGIC & KIOSK TABLETĂ ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          <div class="brand-meta-divider"></div>
          <div class="brand-meta">
            <span class="brand-meta-tagline">Sistem Inteligent de Pontaj Digital</span>
            <span class="brand-meta-url">www.getapp.ro &bull; contact@getapp.ro</span>
          </div>
        </div>
        <div class="header-doc-info">
          <div class="doc-type">Documentație Oficială de Produs</div>
          <div class="doc-title">Propunere Comercială & Arhitectură SaaS</div>
        </div>
      </div>

      <div class="hero-box">
        <span class="hero-eyebrow">Transformare Digitală & Conformitate Legală</span>
        <h1 class="hero-heading">Sistemul Inteligent de Pontaj Digital<br>prin Coduri QR Dinamice și Kiosk pe Tabletă</h1>
        <p class="hero-description">
          Elimină definitiv condica de prezență pe hârtie, cartelele de plastic pierdute și zecile de ore irosite la sfârșitul lunii pentru calculul orelor. 
          O platformă cloud securizată, conformă 100% cu Codul Muncii și normele GDPR europene.
        </p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-val blue">&lt; 1 sec</div>
          <div class="metric-label">Timp de Pontare</div>
          <div class="metric-sub">Scanare instantanee a ecusonului sau codului de pe telefon.</div>
        </div>
        <div class="metric-card">
          <div class="metric-val emerald">0 € Cost</div>
          <div class="metric-label">Fără Hardware Dedicat</div>
          <div class="metric-sub">Funcționează pe orice tabletă comercială iPad sau Android.</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">100% GDPR</div>
          <div class="metric-label">Fără Date Biometrice</div>
          <div class="metric-sub">Fără amprente sau scanare facială invazivă. Risc juridic zero.</div>
        </div>
        <div class="metric-card">
          <div class="metric-val blue">15 Min</div>
          <div class="metric-label">Implementare Imediată</div>
          <div class="metric-sub">Import din Excel și pornire în aceeași zi, fără cablări.</div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Comparație Tehnologică: Pontaj Tradițional vs. GetApp Smart QR</span>
        <span class="section-sub">Standard de Eficiență Operațională</span>
      </div>

      <div class="comp-table-wrap">
        <table class="comp-table">
          <thead>
            <tr>
              <th>Criteriu Analizat</th>
              <th>Foi de Hârtie / Condică</th>
              <th>Cartele / Ceas Pontaj</th>
              <th class="highlight">GetApp Smart QR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="criteria">Costuri Echipament</td>
              <td>Redus inițial (cost mare HR)</td>
              <td>2.000 € – 5.000 € cititoare</td>
              <td class="highlight">0 € (Rulează pe orice tabletă)</td>
            </tr>
            <tr>
              <td class="criteria">Risc Legal & GDPR</td>
              <td>Date nesecurizate pe birou</td>
              <td>Risc biometric / amenzi ANSPDCP</td>
              <td class="highlight">100% Conform Art. 5 GDPR</td>
            </tr>
            <tr>
              <td class="criteria">Fraude („Pontaj pentru coleg”)</td>
              <td>Comportament frecvent</td>
              <td>Cartele transmise între colegi</td>
              <td class="highlight">Eliminat (QR dinamic la 15s + PIN)</td>
            </tr>
            <tr>
              <td class="criteria">Sincronizare Salarizare</td>
              <td>Ore întregi de transcriere manuală</td>
              <td>Exporturi text rigide / greoaie</td>
              <td class="highlight">1-Click Export SAGA / Excel / ERP</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="kiosk-feature-box">
        <div class="kiosk-mock-frame">
          <img src="${kioskImg}" alt="Kiosk Tablet Screen">
        </div>
        <div class="kiosk-points">
          <div class="kiosk-point">
            <div class="kiosk-icon">&#10003;</div>
            <div>
              <div class="kiosk-point-title">Mod Kiosk 24/7 Anti-Standby</div>
              <div class="kiosk-point-desc">Tehnologie activă keep-awake. Ecranul tabletei nu intră în sleep și afișează permanent ceasul digital și QR-ul criptat.</div>
            </div>
          </div>
          <div class="kiosk-point">
            <div class="kiosk-icon">&#10003;</div>
            <div>
              <div class="kiosk-point-title">Scanare Duală Instantanee</div>
              <div class="kiosk-point-desc">Angajații pot apropia ecusonul/telefonul de camera tabletei sau pot introduce codul PIN numeric personal.</div>
            </div>
          </div>
          <div class="kiosk-point">
            <div class="kiosk-icon">&#10003;</div>
            <div>
              <div class="kiosk-point-title">Gestionare Multi-Locație</div>
              <div class="kiosk-point-desc">Configurați terminale la recepție, porți de acces sau depozite, monitorizate centralizat dintr-un singur cont.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Tel: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div>Pagina 1 din 3 — Prezentare Executivă</div>
    </div>
  </div>

  <!-- ==================== PAGINA 2: ARHITECTURĂ, GRAFICE & MODUL HR ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          <div class="brand-meta-divider"></div>
          <div class="brand-meta">
            <span class="brand-meta-tagline">Sistem Inteligent de Pontaj Digital</span>
            <span class="brand-meta-url">www.getapp.ro &bull; contact@getapp.ro</span>
          </div>
        </div>
        <div class="header-doc-info">
          <div class="doc-type">Panou de Administrare & HR Analytics</div>
          <div class="doc-title">Control Operațional & Închidere Automată Ture</div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Cei 3 Piloni Tehnologici ai Platformei Smart QR</span>
        <span class="section-sub">Arhitectură Cloud Multi-Tenant cu Audit Securizat</span>
      </div>

      <div class="pillars-grid">
        <div class="pillar-card">
          <span class="pillar-num">Pilonul 1</span>
          <h3 class="pillar-title">Terminal Kiosk & Securitate Acces</h3>
          <p class="pillar-desc">Tableta devine un punct fix de control cu criptare SSL pe 256 de biți.</p>
          <ul class="pillar-check">
            <li><span class="bullet">&#10003;</span> <span>QR dinamic regenerat la 15 secunde</span></li>
            <li><span class="bullet">&#10003;</span> <span>Ecran permanent activ (Anti-Standby)</span></li>
            <li><span class="bullet">&#10003;</span> <span>Feedback vizual și sonor la scanare</span></li>
          </ul>
        </div>

        <div class="pillar-card">
          <span class="pillar-num">Pilonul 2</span>
          <h3 class="pillar-title">Monitorizare Live & Planificator Ture</h3>
          <p class="pillar-desc">Vizibilitate secundă cu secundă asupra prezenței la muncă.</p>
          <ul class="pillar-check">
            <li><span class="bullet">&#10003;</span> <span>Filtru interactiv Donut: Prezenți / Absenți</span></li>
            <li><span class="bullet">&#10003;</span> <span>Închidere automată la final de tură</span></li>
            <li><span class="bullet">&#10003;</span> <span>Planificare pe zile și departamente</span></li>
          </ul>
        </div>

        <div class="pillar-card">
          <span class="pillar-num">Pilonul 3</span>
          <h3 class="pillar-title">Fișe Pontaj & Exporturi Salarii</h3>
          <p class="pillar-desc">Automatizarea completă a calculului orelor pentru contabilitate.</p>
          <ul class="pillar-check">
            <li><span class="bullet">&#10003;</span> <span>Ore zi, noapte, weekend, suplimentare</span></li>
            <li><span class="bullet">&#10003;</span> <span>Export direct SAGA, ERP și Excel</span></li>
            <li><span class="bullet">&#10003;</span> <span>Conformitate Art. 119 Codul Muncii</span></li>
          </ul>
        </div>
      </div>

      <div class="showcase-grid">
        <div class="showcase-card">
          <div class="showcase-header">
            <span>Panou de Control Live — Monitorizare & Grafice Interactive</span>
            <span class="showcase-tag">LIVE DASHBOARD</span>
          </div>
          <div class="showcase-img-wrap">
            <img src="${dashboardImg}" alt="Dashboard Smart QR">
          </div>
        </div>

        <div class="showcase-card">
          <div class="showcase-header">
            <span>Rapoarte Pontaje & Modul HR</span>
            <span class="showcase-tag">1-CLICK EXPORT</span>
          </div>
          <div class="showcase-img-wrap">
            <img src="${timesheetImg}" alt="Timesheets Smart QR">
          </div>
        </div>
      </div>

      <div class="autoclose-card">
        <div class="autoclose-info">
          <h4>Funcționalitate Inteligentă: Închidere Automată a Turelor (Auto-Close Shift)</h4>
          <p>
            Dacă un angajat uită să ponteze ieșirea la finalul programului, sistemul finalizează automat pontajul la ora programată a turei, 
            eliminând erorile de calcul și intervențiile manuale din partea departamentului HR.
          </p>
        </div>
        <span class="autoclose-badge">ACTIVABIL DA / NU</span>
      </div>

      <div class="compliance-strip">
        <div>
          <div class="compliance-col-title">Zero Biometrie / Fără Camere de Spionaj</div>
          <div class="compliance-col-desc">Nu se stochează amprente sau trăsături faciale. Se respectă strict dreptul la intimitate al fiecărui salariat.</div>
        </div>
        <div>
          <div class="compliance-col-title">Criptare Cloud & Izolare Tenant</div>
          <div class="compliance-col-desc">Comunicații securizate pe 256 biți, baze de date izolate per companie și backup zilnic automat.</div>
        </div>
        <div>
          <div class="compliance-col-title">Conformitate Integrală ITM</div>
          <div class="compliance-col-desc">Generare de registre exacte cerute de inspectorii de muncă, cu ora de intrare și ora de ieșire.</div>
        </div>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Tel: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div>Pagina 2 din 3 — Prezentare Executivă</div>
    </div>
  </div>

  <!-- ==================== PAGINA 3: OFERTĂ COMERCIALĂ & IMPLEMENTARE ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          <div class="brand-meta-divider"></div>
          <div class="brand-meta">
            <span class="brand-meta-tagline">Sistem Inteligent de Pontaj Digital</span>
            <span class="brand-meta-url">www.getapp.ro &bull; contact@getapp.ro</span>
          </div>
        </div>
        <div class="header-doc-info">
          <div class="doc-type">Ofertă Comercială & Implementare</div>
          <div class="doc-title">Plan de Abonament & Lansare Rapidă</div>
        </div>
      </div>

      <div class="offer-hero">
        <div class="offer-title-wrap">
          <h3>Abonamentul Recomandat pentru Companii</h3>
          <h2>Smart Monthly Plan</h2>
          <p>
            Plătești strict pentru numărul de angajați activi din organizație. Fără costuri ascunse de instalare, 
            fără servere costisitoare și fără contracte obligatorii pe termen lung.
          </p>
          <div style="font-size: 11px; color: #1e40af; font-weight: 700; margin-top: 8px;">
            Pentru companii cu cerințe complexe, sunt disponibile și pachetele superioare <strong>Pro</strong> și <strong>Premium</strong>.
          </div>
        </div>

        <div class="price-tag-box">
          <div class="price-value">15 €</div>
          <div class="price-unit">/ angajat activ / lună</div>
          <div class="price-min">Minim 150 € / lună / companie</div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Ce Include Abonamentul Smart</span>
        <span class="section-sub">Acces Complet la Ecosistemul Digital</span>
      </div>

      <div class="included-grid">
        <ul class="included-list">
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Terminale Kiosk Nelimitate</strong> pe oricâte tablete sau intrări sunt necesare.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Panou Live & Monitorizare în Timp Real</strong> de pe telefon sau calculator.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Fișe Individuale și Colective de Pontaj</strong> calculate automat.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Exporturi Instant Excel & SAGA</strong> gata de trimis către contabilitate.</span></li>
        </ul>
        <ul class="included-list">
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Planificator Ture & Închidere Automată</strong> la final de program (Auto-Close).</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Modul HR & Import 1-Click din Excel</strong> cu generare automată de ecusoane.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Securitate Cloud & Conformitate GDPR</strong> cu backup zilnic garantat.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Asistență Tehnică Directă & Onboarding Asistat</strong> pentru pornire rapidă.</span></li>
        </ul>
      </div>

      <div class="section-header">
        <span class="section-title">Lansare în 3 Pași Simpli (Gata în 15 Minute)</span>
        <span class="section-sub">Fără Deranj Operațional</span>
      </div>

      <div class="rollout-grid">
        <div class="rollout-card">
          <div class="rollout-step">Pasul 1 — 2 Minute</div>
          <div class="rollout-title">Import Echipa</div>
          <div class="rollout-desc">Încărcați tabelul Excel cu salariații. Sistemul emite automat ecusoanele QR și codurile PIN.</div>
        </div>
        <div class="rollout-card green">
          <div class="rollout-step">Pasul 2 — 3 Minute</div>
          <div class="rollout-title">Activare Tabletă</div>
          <div class="rollout-desc">Deschideți adresa web a terminalului Kiosk pe tableta de la intrare. Nu necesită instalare greoaie.</div>
        </div>
        <div class="rollout-card purple">
          <div class="rollout-step">Pasul 3 — Imediat</div>
          <div class="rollout-title">Pontaj Automat</div>
          <div class="rollout-desc">Angajații scanează codul la venire și plecare. Orele și orele suplimentare se calculează automat.</div>
        </div>
      </div>

      <div class="cta-strip">
        <div class="cta-text-left">
          <h4>Doriți să testați sistemul gratuit în compania dumneavoastră?</h4>
          <p>Oferim 14 zile de testare gratuită completă — fără card bancar, fără costuri de activare.</p>
          <div class="cta-contacts-line">
            <span>Telefon: <strong>0757 77 77 12</strong></span>
            <span>Email: <strong>contact@getapp.ro</strong></span>
            <span>Web: <strong>www.getapp.ro</strong></span>
          </div>
        </div>
        <a href="mailto:contact@getapp.ro" class="cta-action-btn">Solicită Demo Gratuit</a>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Tel: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div>Pagina 3 din 3 — Prezentare Executivă</div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../presentation_v2_temp.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Saved presentation_v2_temp.html');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000)); // wait for fonts

  const pdfPath = path.join(__dirname, '../Prezentare_Executiva_Smart_QR.pdf');
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

  console.log(`Successfully generated Executive PDF at: ${pdfPath}`);

  // Save PNG preview of each page
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const pageElements = await page.$$('.page');
  for (let i = 0; i < pageElements.length; i++) {
    const previewPath = path.join(__dirname, `../pdf_v2_page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: previewPath });
    console.log(`Saved page preview: ${previewPath}`);
  }

  await browser.close();
  fs.unlinkSync(htmlPath);
}

buildPdfV2().catch(err => {
  console.error('Error generating executive PDF:', err);
  process.exit(1);
});
