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

async function buildPdfEn() {
  const logoImg = getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.jpg'));
  const kioskImg = getBase64Image(path.join(__dirname, '../screenshot_kiosk_display.png'));
  const dashboardImg = getBase64Image(path.join(__dirname, '../screenshot_dashboard.png'));
  const liveTableImg = getBase64Image(path.join(__dirname, '../screenshot_live_table.png'));
  const timesheetImg = getBase64Image(path.join(__dirname, '../screenshot_timesheets.png'));
  const employeesImg = getBase64Image(path.join(__dirname, '../screenshot_employees.png'));

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Commercial Presentation — GetApp Smart QR</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      letter-spacing: -0.014em;
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
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
    .brand-web {
      font-size: 11px;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: 0.3px;
      padding-left: 2px;
    }
    .header-tagline {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Footer Bar */
    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    /* Hero Banner */
    .hero-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 16px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }
    .hero-badge {
      display: inline-block;
      background: rgba(37, 99, 235, 0.25);
      border: 1px solid rgba(96, 165, 250, 0.4);
      color: #93c5fd;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 3px 10px;
      border-radius: 20px;
      margin-bottom: 10px;
    }
    .hero-title {
      font-size: 22px;
      font-weight: 900;
      line-height: 1.25;
      letter-spacing: -0.6px;
      margin-bottom: 8px;
      color: #ffffff;
    }
    .hero-desc {
      font-size: 12px;
      line-height: 1.5;
      color: #cbd5e1;
      max-width: 95%;
    }

    /* Feature Grid (3 cards) */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      transition: all 0.2s;
    }
    .feature-icon {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #2563eb;
      margin-bottom: 4px;
    }
    .feature-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .feature-text {
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }

    /* Mockup Container */
    .mockup-container {
      background: #0f172a;
      border-radius: 14px;
      padding: 8px;
      box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.25);
      border: 1px solid #334155;
      margin-bottom: 12px;
    }
    .mockup-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px 8px 8px;
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
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      margin-left: 6px;
      letter-spacing: 0.3px;
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

    /* GDPR & Security Banner */
    .gdpr-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1.5px solid #334155;
      border-radius: 12px;
      padding: 10px 14px;
      color: #ffffff;
      margin-top: 6px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }
    .gdpr-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 7px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .gdpr-badge {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      background: #10b981;
      color: #ffffff;
      padding: 2.5px 8px;
      border-radius: 4px;
    }
    .gdpr-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.2px;
    }
    .gdpr-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    .gdpr-col-title {
      font-size: 10px;
      font-weight: 800;
      color: #60a5fa;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .gdpr-col-desc {
      font-size: 9.5px;
      color: #cbd5e1;
      line-height: 1.35;
    }

    /* Pricing Section */
    .pricing-hero {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #2563eb;
      border-radius: 16px;
      padding: 22px 26px;
      margin-bottom: 20px;
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
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 6px;
      letter-spacing: -0.4px;
    }
    .pricing-sub {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.5;
      max-width: 460px;
    }
    .pricing-box {
      background: #ffffff;
      border-radius: 14px;
      padding: 18px 24px;
      text-align: center;
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.12);
      border: 1px solid #bfdbfe;
      min-width: 150px;
    }
    .price-value {
      font-size: 40px;
      font-weight: 900;
      color: #1d4ed8;
      line-height: 1;
      letter-spacing: -1px;
    }
    .price-unit {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      margin-top: 4px;
    }
    .price-minimum {
      display: inline-block;
      margin-top: 8px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 10.5px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    /* CTA Card */
    .cta-card {
      background: #0f172a;
      color: #ffffff;
      border-radius: 14px;
      padding: 20px 26px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
    }
    .cta-text h4 {
      font-size: 17px;
      font-weight: 800;
      margin-bottom: 4px;
      color: #ffffff;
    }
    .cta-text p {
      font-size: 12px;
      color: #94a3b8;
    }
    .cta-button {
      background: #2563eb;
      color: #ffffff;
      font-weight: 800;
      font-size: 13.5px;
      padding: 13px 24px;
      border-radius: 10px;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
      transition: background 0.2s;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: INTRODUCTION & KIOSK TABLET ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <img src="${logoImg}" alt="GetApp Smart QR" style="height: 48px; width: auto; object-fit: contain; display: block;">
          <div class="brand-web">www.getapp.ro</div>
        </div>
        <div class="header-tagline">Smart QR Time & Attendance Solution</div>
      </div>

      <div class="hero-banner">
        <div class="hero-badge">Cloud Architecture & Tablet Kiosks</div>
        <h1 class="hero-title">Intelligent Digital Time & Attendance<br>via Dynamic QR Codes & Tablet Kiosks</h1>
        <p class="hero-desc">
          Completely eliminate paper sign-in sheets, lost keycards, and hours wasted on month-end payroll computations. 
          Enterprise-grade, fully encrypted, and 100% compliant with EU GDPR and statutory labor regulations.
        </p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">Sub-1 Second</div>
          <div class="feature-title">Ultra-Fast Check-In</div>
          <div class="feature-text">Team members present their digital ID badge or smartphone to the tablet camera. Instant audio-visual confirmation.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">Zero Fraud</div>
          <div class="feature-title">Dynamic QR & GDPR</div>
          <div class="feature-text">Tokens refresh automatically every 15 seconds. Zero invasive biometrics, ensuring complete employee privacy.</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">No Custom Hardware</div>
          <div class="feature-title">Runs on Any Tablet</div>
          <div class="feature-text">Compatible with any standard iPad or Android tablet. Zero proprietary hardware cost and zero maintenance overhead.</div>
        </div>
      </div>

      <div class="section-title">Front-Desk & Entrance Tablet Kiosk (Reception, Lobby, or Gate)</div>
      
      <div class="mockup-container">
        <div class="mockup-header">
          <span class="mockup-dot red"></span>
          <span class="mockup-dot yellow"></span>
          <span class="mockup-dot green"></span>
          <span class="mockup-label">Active Kiosk Terminal — Live Display (Digital Clock, Date, Encrypted Dynamic QR)</span>
        </div>
        <img src="${kioskImg}" class="mockup-img" style="max-height: 145mm; object-fit: contain; background: #000;" alt="Kiosk Tablet Screen">
      </div>

      <div class="two-cols" style="margin-top: 6px;">
        <ul class="check-list">
          <li><span class="check-bullet">&#10003;</span> <span><strong>24/7 Anti-Standby</strong>: Intelligent keep-awake ensures the tablet remains active continuously in secure kiosk mode.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>Dual Method</strong>: Fast dynamic QR scan or individual numeric PIN entry for each employee.</span></li>
        </ul>
        <ul class="check-list">
          <li><span class="check-bullet">&#10003;</span> <span><strong>Full GDPR Protection</strong>: End-to-end SSL/TLS encryption; zero biometric or facial storage.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>Multi-Location Support</strong>: Centrally manage unlimited branches and work sites from one cloud account.</span></li>
        </ul>
      </div>
    </div>

    <div class="footer-bar">
      <div class="left">GetApp Smart QR — Tel: +40 757 77 77 12 | Email: contact@getapp.ro | Web: www.getapp.ro</div>
      <div class="right">Page 1 of 3</div>
    </div>
  </div>

  <!-- ==================== PAGE 2: REAL-TIME DASHBOARD & HR MODULE ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <img src="${logoImg}" alt="GetApp Smart QR" style="height: 48px; width: auto; object-fit: contain; display: block;">
          <div class="brand-web">www.getapp.ro</div>
        </div>
        <div class="header-tagline">Management Dashboard & HR Analytics</div>
      </div>

      <div class="section-title">Real-Time Dashboard & Interactive Attendance Analytics</div>
      <p style="font-size: 11.5px; color: #475569; margin-bottom: 7px;">
        Complete operational oversight in real time: key metrics (total workforce, currently present, absent), interactive donut status distribution, weekly hours trends, and second-by-second live shift tracking.
      </p>

      <div class="mockup-container" style="margin-bottom: 10px;">
        <div class="mockup-header">
          <span class="mockup-dot red"></span>
          <span class="mockup-dot yellow"></span>
          <span class="mockup-dot green"></span>
          <span class="mockup-label">Live Control Panel — Core KPIs, Interactive Donut Chart, Weekly Hours Evolution & Live Staff Roster</span>
        </div>
        <img src="${dashboardImg}" class="mockup-img" style="max-height: 80mm; object-fit: cover; object-position: top;" alt="Dashboard with Interactive Charts">
      </div>

      <div class="two-cols" style="margin-bottom: 8px;">
        <div>
          <div class="section-title" style="font-size: 13.5px; margin-bottom: 6px;">Monthly Reports & Timesheets</div>
          <div class="mockup-container" style="margin-bottom: 5px; padding: 6px;">
            <img src="${timesheetImg}" class="mockup-img" style="max-height: 46mm; object-fit: cover; object-position: top;" alt="Timesheet Reports and Graphs">
          </div>
          <ul class="check-list">
            <li><span class="check-bullet">&#10003;</span> <span><strong>Automatic Hour Calculations</strong>: Daytime, nighttime, weekend, and overtime tallies.</span></li>
            <li><span class="check-bullet">&#10003;</span> <span><strong>Excel & ERP Export</strong>: Ready-to-use centralized payroll reports for accounting & audits.</span></li>
          </ul>
        </div>

        <div>
          <div class="section-title" style="font-size: 13.5px; margin-bottom: 6px;">HR Module & Team Management</div>
          <div class="mockup-container" style="margin-bottom: 5px; padding: 6px;">
            <img src="${employeesImg}" class="mockup-img" style="max-height: 46mm; object-fit: cover; object-position: top;" alt="HR Employee Management">
          </div>
          <ul class="check-list">
            <li><span class="check-bullet">&#10003;</span> <span><strong>1-Click Excel Import</strong>: Onboard 50 to 500+ employees in under 2 minutes.</span></li>
            <li><span class="check-bullet">&#10003;</span> <span><strong>Digital Badges & PINs</strong>: Automated generation of printable QR access cards.</span></li>
          </ul>
        </div>
      </div>

      <div class="gdpr-banner">
        <div class="gdpr-header">
          <span class="gdpr-badge">FULL PROTECTION</span>
          <span class="gdpr-title">Total Legal Compliance & Strict EU GDPR Data Security</span>
        </div>
        <div class="gdpr-grid">
          <div class="gdpr-col">
            <div class="gdpr-col-title">Zero Biometric Data</div>
            <div class="gdpr-col-desc">No invasive fingerprint or facial scans. Uses secure, rotating dynamic QR tokens and private PINs, strictly complying with GDPR Article 5.</div>
          </div>
          <div class="gdpr-col">
            <div class="gdpr-col-title">Cloud Security & Encryption</div>
            <div class="gdpr-col-desc">256-bit SSL/TLS secure communications, tenant-isolated databases, automated daily backups, and tamper-proof immutable audit logs.</div>
          </div>
          <div class="gdpr-col">
            <div class="gdpr-col-title">Labor Law Compliance</div>
            <div class="gdpr-col-desc">Clear, auditable records of exact shift start and end times mandated by labor authorities. Certified collective timesheet registers.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div class="left">GetApp Smart QR — Tel: +40 757 77 77 12 | Email: contact@getapp.ro | Web: www.getapp.ro</div>
      <div class="right">Page 2 of 3</div>
    </div>
  </div>

  <!-- ==================== PAGE 3: COMMERCIAL OFFER & PRICING ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <img src="${logoImg}" alt="GetApp Smart QR" style="height: 48px; width: auto; object-fit: contain; display: block;">
          <div class="brand-web">www.getapp.ro</div>
        </div>
        <div class="header-tagline">Commercial Proposal & Implementation</div>
      </div>

      <div class="pricing-hero" style="padding: 22px 26px; margin-bottom: 20px;">
        <div class="pricing-details">
          <div class="pricing-tag">Recommended Core Subscription</div>
          <div class="pricing-heading" style="font-size: 24px; margin-bottom: 6px;">Smart Monthly Plan</div>
          <div class="pricing-sub" style="font-size: 12.5px; max-width: 460px; line-height: 1.5;">
            Zero installation charges, no expensive server licenses, and no forced long-term lock-in.
            Pay strictly for the number of active employees in your organization.
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #1d4ed8; font-weight: 600; line-height: 1.4;">
            For organizations with advanced enterprise requirements, <strong>Pro</strong> and <strong>Premium</strong> tiers with custom integrations are also available.
          </div>
        </div>
        <div class="pricing-box" style="padding: 18px 24px;">
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Smart Plan</div>
          <div class="price-value" style="font-size: 40px;">15 €</div>
          <div class="price-unit" style="font-size: 12px; margin-top: 4px;">/ employee / month</div>
          <div class="price-minimum" style="font-size: 10.5px; margin-top: 8px;">Min. 150 € / month / company</div>
        </div>
      </div>

      <div class="section-title" style="margin-bottom: 12px;">What the Smart Subscription Includes</div>
      <div class="two-cols" style="margin-bottom: 26px; gap: 24px;">
        <ul class="check-list" style="gap: 14px;">
          <li><span class="check-bullet">&#10003;</span> <span><strong>Unlimited Kiosk Terminals</strong> on as many tablets or entrance devices as you require.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>Live Dashboard & Real-Time Monitoring</strong> of attendance on any mobile or desktop device.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>Complete Timesheet Reports & Registers</strong> fully compliant with statutory labor standards.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>Automatic Excel & CSV Exports</strong> for seamless transmission to payroll and accounting.</span></li>
        </ul>
        <ul class="check-list" style="gap: 14px;">
          <li><span class="check-bullet">&#10003;</span> <span><strong>Shift Planner & Leave Management</strong> with approvals and automated end-of-shift closing.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>WhatsApp & Email Notifications</strong> for delays, absences, and critical system alerts.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>Full Protection & Daily Backups</strong>: 256-bit data encryption, cloud security, and full GDPR compliance.</span></li>
          <li><span class="check-bullet">&#10003;</span> <span><strong>Direct Technical Support & Fast-Track Onboarding</strong> for effortless initial account setup.</span></li>
        </ul>
      </div>

      <div class="section-title" style="margin-bottom: 12px;">Deployment in 3 Simple Steps (Ready in 15 Minutes)</div>
      <div class="features-grid" style="margin-bottom: 26px;">
        <div class="feature-card" style="border-left: 4px solid #2563eb; padding: 16px 18px;">
          <div class="feature-icon" style="font-size: 11px;">Step 1</div>
          <div class="feature-title" style="font-size: 15px; margin-bottom: 6px;">Import Team</div>
          <div class="feature-text">Upload your Excel employee roster. The system instantly generates digital badges and individual PIN codes.</div>
        </div>
        <div class="feature-card" style="border-left: 4px solid #10b981; padding: 16px 18px;">
          <div class="feature-icon" style="font-size: 11px;">Step 2</div>
          <div class="feature-title" style="font-size: 15px; margin-bottom: 6px;">Activate Tablet</div>
          <div class="feature-text">Open the secure Kiosk web application on your reception or entrance tablet. Instantly ready for scanning.</div>
        </div>
        <div class="feature-card" style="border-left: 4px solid #8b5cf6; padding: 16px 18px;">
          <div class="feature-icon" style="font-size: 11px;">Step 3</div>
          <div class="feature-title" style="font-size: 15px; margin-bottom: 6px;">Automated Tracking</div>
          <div class="feature-text">Staff scan their badges upon arrival and departure. Working hours and overtime are compiled automatically in real time.</div>
        </div>
      </div>

      <div class="cta-card" style="padding: 20px 26px;">
        <div class="cta-text">
          <h4 style="font-size: 17px; margin-bottom: 4px;">Ready to test the system in your organization?</h4>
          <p style="font-size: 12.5px; margin-bottom: 8px;">We offer a 14-day comprehensive free trial with full feature access — no upfront fees, no credit card required.</p>
          <div style="font-size: 11.5px; color: #94a3b8; display: flex; gap: 16px; margin-top: 6px;">
            <span>Tel: <strong style="color: #ffffff;">+40 757 77 77 12</strong></span>
            <span>Email: <strong style="color: #ffffff;">contact@getapp.ro</strong></span>
            <span>Web: <strong style="color: #ffffff;">www.getapp.ro</strong></span>
          </div>
        </div>
        <a href="mailto:contact@getapp.ro" class="cta-button" style="font-size: 13.5px; padding: 13px 24px;">Request Free Demo</a>
      </div>
    </div>

    <div class="footer-bar">
      <div class="left">GetApp Smart QR — Tel: +40 757 77 77 12 | Email: contact@getapp.ro | Web: www.getapp.ro</div>
      <div class="right">Page 3 of 3</div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../presentation_en_temp.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Saved presentation_en_temp.html');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000)); // wait for Google Fonts

  const pdfPath = path.join(__dirname, '../Commercial_Presentation_Smart_QR.pdf');
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

  console.log(`Successfully generated English PDF at: ${pdfPath}`);

  // Save PNG preview of each page
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const pageElements = await page.$$('.page');
  for (let i = 0; i < pageElements.length; i++) {
    const previewPath = path.join(__dirname, `../pdf_en_page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: previewPath });
    console.log(`Saved page preview: ${previewPath}`);
  }

  await browser.close();
}

buildPdfEn().catch(err => {
  console.error('Error generating English PDF:', err);
  process.exit(1);
});
