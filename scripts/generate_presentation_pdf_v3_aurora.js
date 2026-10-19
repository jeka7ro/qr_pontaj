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

async function buildAuroraPdf() {
  const logoImg = getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.png')) || getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.jpg'));
  const kioskAurora = getBase64Image(path.join(__dirname, '../assets/kiosk_aurora_render.jpg'));
  const dashboardAurora = getBase64Image(path.join(__dirname, '../assets/dashboard_aurora_render.jpg'));
  const badgeAurora = getBase64Image(path.join(__dirname, '../assets/badge_aurora_render.jpg'));

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GetApp Smart QR — Executive Pitch Deck (Aurora Edition)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
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
      color: #f1f5f9;
      background: #07050e;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      letter-spacing: -0.015em;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 10px;
      line-height: 1.4;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 12mm 14mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #07050e;
      background-image: 
        radial-gradient(1000px circle at 85% 10%, rgba(139, 92, 246, 0.22), transparent 50%),
        radial-gradient(800px circle at 15% 85%, rgba(244, 63, 94, 0.16), transparent 50%),
        radial-gradient(600px circle at 50% 50%, rgba(245, 158, 11, 0.08), transparent 50%);
    }
    .page:last-child {
      page-break-after: auto;
    }

    /* Top Corporate Header */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
      margin-bottom: 9px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      background: #ffffff;
      padding: 3px 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    }
    .brand-logo-img {
      height: 24px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .brand-meta-divider {
      width: 1px;
      height: 24px;
      background: rgba(168, 85, 247, 0.3);
    }
    .brand-meta {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-meta-tagline {
      font-size: 10.5px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.2px;
    }
    .brand-meta-url {
      font-size: 9px;
      font-weight: 700;
      color: #c084fc;
      letter-spacing: 0.3px;
    }
    .header-doc-info {
      text-align: right;
    }
    .doc-type {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #f43f5e;
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.3);
      padding: 2px 7px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 2px;
    }
    .doc-title {
      font-size: 10px;
      font-weight: 700;
      color: #e2e8f0;
    }

    /* Bottom Corporate Footer */
    .bottom-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid rgba(168, 85, 247, 0.15);
      font-size: 8.5px;
      color: #94a3b8;
      font-weight: 600;
    }
    .footer-contacts span {
      margin-right: 14px;
    }
    .footer-contacts strong {
      color: #e2e8f0;
    }
    .footer-badge {
      color: #c084fc;
      font-weight: 800;
    }

    /* Executive Hero Card (Aurora Edition) */
    .hero-box {
      background: linear-gradient(135deg, rgba(26, 16, 46, 0.95) 0%, rgba(13, 10, 24, 0.98) 100%);
      border: 1px solid rgba(192, 132, 252, 0.3);
      border-radius: 11px;
      padding: 13px 16px;
      position: relative;
      overflow: hidden;
      margin-bottom: 9px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.7);
    }
    .hero-glow-accent {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #fb7185;
      background: rgba(244, 63, 94, 0.12);
      border: 1px solid rgba(244, 63, 94, 0.3);
      padding: 2px 7px;
      border-radius: 20px;
      margin-bottom: 5px;
    }
    .hero-eyebrow-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #fb7185;
      box-shadow: 0 0 8px #fb7185;
    }
    .hero-heading {
      font-size: 18.5px;
      font-weight: 900;
      line-height: 1.22;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .hero-heading span.gradient-text {
      background: linear-gradient(135deg, #c084fc 0%, #f43f5e 50%, #fbbf24 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-description {
      font-size: 10px;
      color: #cbd5e1;
      line-height: 1.45;
      max-width: 640px;
    }

    /* 4 Glowing Metric Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      margin-bottom: 9px;
    }
    .metric-card {
      background: rgba(24, 17, 43, 0.7);
      border: 1px solid rgba(168, 85, 247, 0.15);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .metric-card.accent-violet {
      border-top: 2px solid #a855f7;
      background: linear-gradient(180deg, rgba(168, 85, 247, 0.12) 0%, rgba(24, 17, 43, 0.7) 100%);
    }
    .metric-card.accent-rose {
      border-top: 2px solid #f43f5e;
      background: linear-gradient(180deg, rgba(244, 63, 94, 0.12) 0%, rgba(24, 17, 43, 0.7) 100%);
    }
    .metric-card.accent-amber {
      border-top: 2px solid #f59e0b;
      background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(24, 17, 43, 0.7) 100%);
    }
    .metric-card.accent-indigo {
      border-top: 2px solid #6366f1;
      background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(24, 17, 43, 0.7) 100%);
    }
    .metric-val {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-bottom: 2px;
      text-shadow: 0 0 16px rgba(168, 85, 247, 0.4);
    }
    .metric-val.violet { color: #c084fc; text-shadow: 0 0 16px rgba(192, 132, 252, 0.6); }
    .metric-val.rose { color: #fb7185; text-shadow: 0 0 16px rgba(251, 113, 133, 0.6); }
    .metric-val.amber { color: #fbbf24; text-shadow: 0 0 16px rgba(251, 191, 36, 0.6); }
    .metric-label {
      font-size: 9px;
      font-weight: 800;
      color: #f1f5f9;
      margin-bottom: 1px;
    }
    .metric-sub {
      font-size: 8px;
      color: #94a3b8;
      line-height: 1.25;
    }

    /* Section Subheaders */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title-tag {
      font-size: 8px;
      font-weight: 800;
      color: #c084fc;
      background: rgba(168, 85, 247, 0.15);
      border: 1px solid rgba(168, 85, 247, 0.3);
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .section-sub {
      font-size: 8.5px;
      color: #94a3b8;
    }

    /* BENTO SHOWCASE (Page 1) */
    .bento-hero-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 10px;
      margin-bottom: 9px;
    }
    .bento-card {
      background: rgba(24, 17, 43, 0.75);
      border: 1px solid rgba(168, 85, 247, 0.15);
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 24px -5px rgba(0, 0, 0, 0.6);
    }
    .bento-img-wrap {
      width: 100%;
      height: 48mm;
      overflow: hidden;
      position: relative;
      background: #000000;
    }
    .bento-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .bento-badge-overlay {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(24, 17, 43, 0.85);
      border: 1px solid rgba(192, 132, 252, 0.4);
      color: #c084fc;
      font-size: 7.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      backdrop-filter: blur(8px);
      letter-spacing: 0.5px;
    }
    .bento-content {
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .bento-title {
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
    }
    .bento-desc {
      font-size: 8.5px;
      color: #cbd5e1;
      line-height: 1.35;
    }

    /* Comparison Table (Aurora Violet High Contrast) */
    .comp-table-wrap {
      margin-bottom: 8px;
      border: 1px solid rgba(168, 85, 247, 0.15);
      border-radius: 8px;
      overflow: hidden;
      background: rgba(24, 17, 43, 0.6);
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 9px;
    }
    .comp-table th {
      background: rgba(38, 26, 68, 0.8);
      color: #cbd5e1;
      padding: 5.5px 9px;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.15);
    }
    .comp-table th.highlight {
      background: rgba(168, 85, 247, 0.28);
      color: #f43f5e;
      border-bottom: 2px solid #f43f5e;
    }
    .comp-table td {
      padding: 5px 9px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #94a3b8;
    }
    .comp-table tr:last-child td {
      border-bottom: none;
    }
    .comp-table td.criteria {
      font-weight: 700;
      color: #f1f5f9;
      width: 25%;
    }
    .comp-table td.highlight {
      background: rgba(168, 85, 247, 0.12);
      font-weight: 700;
      color: #c084fc;
    }

    /* ==================== PAGE 2 STYLES (AURORA EDITION) ==================== */
    /* Panoramic 3D Dashboard Showcase */
    .dashboard-hero-card {
      background: rgba(24, 17, 43, 0.8);
      border: 1px solid rgba(192, 132, 252, 0.3);
      border-radius: 11px;
      overflow: hidden;
      margin-bottom: 9px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.7);
      display: grid;
      grid-template-columns: 1.25fr 1fr;
    }
    .dash-hero-img-wrap {
      width: 100%;
      height: 58mm;
      overflow: hidden;
      background: #000000;
      position: relative;
    }
    .dash-hero-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .dash-hero-caption-overlay {
      position: absolute;
      bottom: 8px;
      left: 8px;
      right: 8px;
      background: rgba(18, 12, 34, 0.9);
      backdrop-filter: blur(8px);
      padding: 4px 8px;
      border-radius: 5px;
      border: 1px solid rgba(192, 132, 252, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #cbd5e1;
    }
    .dash-hero-caption-overlay strong {
      color: #fb7185;
    }
    .dash-hero-details {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: linear-gradient(135deg, rgba(26, 16, 46, 0.9) 0%, rgba(13, 10, 24, 0.95) 100%);
    }
    .dash-feature-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .dash-feature-icon {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      background: rgba(168, 85, 247, 0.18);
      color: #c084fc;
      font-weight: 800;
      font-size: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(168, 85, 247, 0.35);
    }
    .dash-feature-text h5 {
      font-size: 10px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1px;
    }
    .dash-feature-text p {
      font-size: 8px;
      color: #cbd5e1;
      line-height: 1.25;
    }

    /* Auto-Close Shift Callout */
    .autoclose-dark-box {
      background: linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(24, 17, 43, 0.85) 100%);
      border: 1px solid rgba(192, 132, 252, 0.4);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 9px;
      box-shadow: 0 4px 16px rgba(168, 85, 247, 0.2);
    }
    .autoclose-dark-info h4 {
      font-size: 10.5px;
      font-weight: 800;
      color: #c084fc;
      margin-bottom: 1px;
    }
    .autoclose-dark-info p {
      font-size: 8.5px;
      color: #e2e8f0;
      line-height: 1.3;
    }
    .toggle-ui-pill {
      background: linear-gradient(135deg, #a855f7 0%, #db2777 100%);
      color: #ffffff;
      font-size: 8px;
      font-weight: 900;
      padding: 4px 9px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 0 12px rgba(219, 39, 119, 0.6);
      white-space: nowrap;
    }

    /* Commercial Pricing Hero */
    .offer-hero-dark {
      background: linear-gradient(135deg, rgba(109, 40, 217, 0.3) 0%, rgba(24, 17, 43, 0.9) 100%);
      border: 1.5px solid #a855f7;
      border-radius: 10px;
      padding: 11px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 9px;
      box-shadow: 0 8px 24px -5px rgba(168, 85, 247, 0.3);
    }
    .offer-title-wrap h3 {
      font-size: 8.5px;
      font-weight: 800;
      color: #c084fc;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 2px;
    }
    .offer-title-wrap h2 {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .offer-title-wrap p {
      font-size: 9px;
      color: #cbd5e1;
      max-width: 420px;
      line-height: 1.35;
    }
    .offer-sub-note {
      font-size: 8.5px;
      color: #f43f5e;
      font-weight: 700;
      margin-top: 3px;
    }
    .price-tag-box-dark {
      background: #0f0a1d;
      border: 1px solid rgba(192, 132, 252, 0.4);
      border-radius: 8px;
      padding: 9px 15px;
      text-align: center;
      box-shadow: 0 0 18px rgba(168, 85, 247, 0.35);
    }
    .price-value-dark {
      font-size: 30px;
      font-weight: 900;
      color: #f43f5e;
      line-height: 1;
      margin-bottom: 2px;
      text-shadow: 0 0 16px rgba(244, 63, 94, 0.6);
    }
    .price-unit-dark {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
    }
    .price-min-dark {
      font-size: 8px;
      font-weight: 800;
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
      display: inline-block;
    }

    /* Included Features & Rollout Compact Grid */
    .included-rollout-split {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 9px;
      margin-bottom: 9px;
    }
    .included-card-wrap {
      background: rgba(24, 17, 43, 0.7);
      border: 1px solid rgba(168, 85, 247, 0.15);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .card-mini-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .included-list-compact {
      list-style: none;
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
    }
    .included-item-compact {
      display: flex;
      gap: 6px;
      align-items: flex-start;
      font-size: 8.5px;
      color: #cbd5e1;
    }
    .included-check-compact {
      color: #fb7185;
      font-weight: 900;
      font-size: 10px;
    }

    /* 3-Step Mini Rollout */
    .rollout-vertical {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .rollout-step-item {
      background: rgba(24, 17, 43, 0.7);
      border: 1px solid rgba(168, 85, 247, 0.15);
      border-left: 3px solid #a855f7;
      border-radius: 5px;
      padding: 5px 8px;
    }
    .rollout-step-item.rose { border-left-color: #f43f5e; }
    .rollout-step-item.amber { border-left-color: #f59e0b; }
    .rollout-step-header {
      display: flex;
      justify-content: space-between;
      font-size: 7.5px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .rollout-step-name {
      font-size: 9.5px;
      font-weight: 800;
      color: #ffffff;
    }
    .rollout-step-text {
      font-size: 8px;
      color: #94a3b8;
      line-height: 1.25;
    }

    /* Dark CTA Strip (Aurora Edition) */
    .cta-strip-dark {
      background: linear-gradient(135deg, rgba(88, 28, 135, 0.6) 0%, rgba(24, 17, 43, 0.95) 100%);
      border: 1px solid rgba(192, 132, 252, 0.4);
      border-radius: 10px;
      padding: 11px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.3);
    }
    .cta-text-left h4 {
      font-size: 12.5px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1px;
    }
    .cta-text-left p {
      font-size: 9px;
      color: #e2e8f0;
    }
    .cta-contacts-line {
      display: flex;
      gap: 14px;
      margin-top: 4px;
      font-size: 8.5px;
      color: #cbd5e1;
    }
    .cta-contacts-line strong {
      color: #fb7185;
    }
    .cta-action-btn-dark {
      background: linear-gradient(135deg, #a855f7 0%, #e11d48 100%);
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      padding: 9px 16px;
      border-radius: 6px;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(225, 29, 72, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: STRATEGIC OVERVIEW & 3D HARDWARE SHOWCASE (AURORA EDITION) ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <div class="logo-badge">
            <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          </div>
          <div class="brand-meta-divider"></div>
          <div class="brand-meta">
            <span class="brand-meta-tagline">Enterprise Digital Time & Attendance</span>
            <span class="brand-meta-url">www.getapp.ro &bull; contact@getapp.ro</span>
          </div>
        </div>
        <div class="header-doc-info">
          <div class="doc-type">Official Product White Paper</div>
          <div class="doc-title">SaaS Architecture & Executive Overview</div>
        </div>
      </div>

      <div class="hero-box">
        <div class="hero-glow-accent"></div>
        <span class="hero-eyebrow"><span class="hero-eyebrow-dot"></span> Digital Workplace Transformation & Legal Compliance</span>
        <h1 class="hero-heading">Intelligent Digital Time & Attendance<br><span class="gradient-text">Powered by Dynamic QR Codes and Tablet Kiosks</span></h1>
        <p class="hero-description">
          Permanently eliminate messy paper timesheets, shared plastic badges, and hours spent recalculating payroll at month-end. 
          A secure, cloud-native attendance ecosystem engineered for modern enterprises, 100% compliant with European Labor Code and GDPR guidelines.
        </p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card accent-violet">
          <div class="metric-val violet">&lt; 1 sec</div>
          <div class="metric-label">Clock-In Speed</div>
          <div class="metric-sub">Instant check-in via employee digital badge or mobile app.</div>
        </div>
        <div class="metric-card accent-amber">
          <div class="metric-val amber">0 € Cost</div>
          <div class="metric-label">Zero Proprietary Hardware</div>
          <div class="metric-sub">Runs smoothly on any commercial iPad or Android tablet.</div>
        </div>
        <div class="metric-card accent-rose">
          <div class="metric-val rose">100% GDPR</div>
          <div class="metric-label">No Biometrics Required</div>
          <div class="metric-sub">Zero fingerprint or facial recognition scanning. Zero legal liability.</div>
        </div>
        <div class="metric-card accent-indigo">
          <div class="metric-val violet">15 Mins</div>
          <div class="metric-label">Instant Deployment</div>
          <div class="metric-sub">1-Click Excel team import. Fully operational on day one.</div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Hardware & Access Experience <span class="section-title-tag">3D Product Showcase</span></span>
        <span class="section-sub">Zero Hardware Lock-In &bull; Dynamic Cryptographic QR</span>
      </div>

      <!-- Bento 3D Showcase (Aurora Edition) -->
      <div class="bento-hero-grid">
        <div class="bento-card">
          <div class="bento-img-wrap">
            <span class="bento-badge-overlay">Kiosk Mode 24/7 &bull; Anti-Standby</span>
            <img src="${kioskAurora}" alt="3D Aurora Kiosk Tablet Terminal">
          </div>
          <div class="bento-content">
            <div class="bento-title">Smart Tablet Kiosk Terminal</div>
            <div class="bento-desc">Turns any standard iPad or Android tablet into a high-security entrance checkpoint. Features persistent keep-awake screen, large digital clock, dynamic QR rotation every 15s, and backup PIN pad.</div>
          </div>
        </div>

        <div class="bento-card">
          <div class="bento-img-wrap">
            <span class="bento-badge-overlay">Dynamic Verification &bull; Anti-Fraud</span>
            <img src="${badgeAurora}" alt="3D Aurora Badge Scan Experience">
          </div>
          <div class="bento-content">
            <div class="bento-title">Laser-Fast Badge & Phone Scanning</div>
            <div class="bento-desc">Employees present their dynamic digital badge on mobile or physical lanyard badge. Sub-second cryptographic validation eliminates "buddy punching" and fraudulent check-ins permanently.</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Technology Comparison: Traditional Systems vs. GetApp Smart QR <span class="section-title-tag">Benchmark</span></span>
        <span class="section-sub">Corporate Operational Efficiency Standard</span>
      </div>

      <div class="comp-table-wrap">
        <table class="comp-table">
          <thead>
            <tr>
              <th>Evaluation Criteria</th>
              <th>Paper Sign-In Sheets</th>
              <th>Plastic Badges / Clocks</th>
              <th class="highlight">GetApp Smart QR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="criteria">Hardware & Upfront Cost</td>
              <td>Low initial (Huge HR cost)</td>
              <td>2,000 € – 5,000 € readers</td>
              <td class="highlight">0 € (Runs on standard tablets)</td>
            </tr>
            <tr>
              <td class="criteria">GDPR & Legal Compliance</td>
              <td>Exposed paperwork on desk</td>
              <td>Biometric compliance risks</td>
              <td class="highlight">100% Compliant (Art. 5 GDPR)</td>
            </tr>
            <tr>
              <td class="criteria">Buddy Punching Fraud</td>
              <td>Widespread & unverified</td>
              <td>Cards handed between peers</td>
              <td class="highlight">Eliminated (15s Dynamic QR + PIN)</td>
            </tr>
            <tr>
              <td class="criteria">Payroll & ERP Integration</td>
              <td>Hours of manual retyping</td>
              <td>Rigid, outdated text exports</td>
              <td class="highlight">1-Click SAGA, ERP & Excel Sync</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Phone: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div><span class="footer-badge">GETAPP SMART QR</span> &bull; Page 1 of 2 — Aurora Edition</div>
    </div>
  </div>

  <!-- ==================== PAGE 2: 3D ANALYTICS DASHBOARD & COMMERCIAL OFFER (AURORA EDITION) ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <div class="logo-badge">
            <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          </div>
          <div class="brand-meta-divider"></div>
          <div class="brand-meta">
            <span class="brand-meta-tagline">Real-Time Operational Analytics</span>
            <span class="brand-meta-url">www.getapp.ro &bull; contact@getapp.ro</span>
          </div>
        </div>
        <div class="header-doc-info">
          <div class="doc-type">Live HR Analytics & Pricing</div>
          <div class="doc-title">Shift Automation & Global Rollout Plan</div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Live Management Console &bull; Real-Time Analytics <span class="section-title-tag">Live Intelligence</span></span>
        <span class="section-sub">Sub-Second Cloud Sync &bull; Automated Timesheet Compilation</span>
      </div>

      <!-- 3D Panoramic Dashboard Showcase (Aurora Edition) -->
      <div class="dashboard-hero-card">
        <div class="dash-hero-img-wrap">
          <img src="${dashboardAurora}" alt="3D Live Analytics Dashboard Aurora">
          <div class="dash-hero-caption-overlay">
            <span>Live Presence Donut: <strong>88% Attendance</strong></span>
            <span>Weekly Work Hours Curve &bull; Live Check-In Feed</span>
          </div>
        </div>
        <div class="dash-hero-details">
          <div class="dash-feature-item">
            <div class="dash-feature-icon">&#10003;</div>
            <div class="dash-feature-text">
              <h5>Real-Time Presence Donut & Status</h5>
              <p>Instant breakdown of employees on duty, approved leave, or absent. Drill down by department or facility in 1 click.</p>
            </div>
          </div>
          <div class="dash-feature-item">
            <div class="dash-feature-icon">&#10003;</div>
            <div class="dash-feature-text">
              <h5>Automated Overtime & Work Hours</h5>
              <p>Categorizes regular daytime, night-shift, weekend, and overtime hours automatically according to labor contracts.</p>
            </div>
          </div>
          <div class="dash-feature-item">
            <div class="dash-feature-icon">&#10003;</div>
            <div class="dash-feature-text">
              <h5>1-Click Payroll Sync (SAGA & ERP)</h5>
              <p>Direct export format fully compatible with SAGA Salarii, SAP, standard Excel sheets, and custom ERP webhook APIs.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-Close Shift Callout -->
      <div class="autoclose-dark-box">
        <div class="autoclose-dark-info">
          <h4>Smart Shift Automation: Automatic Shift Closure (Auto-Close Shift)</h4>
          <p>
            When employees forget to clock out at the end of their shift, the platform automatically finalizes the record at the scheduled shift cutoff, 
            completely removing manual calculations and recurring HR headaches.
          </p>
        </div>
        <div class="toggle-ui-pill">
          <span>&#10003; ENABLED</span>
          <span style="font-size: 7.5px; opacity: 0.9;">(YES / NO)</span>
        </div>
      </div>

      <!-- Commercial Pricing Hero (Aurora Edition) -->
      <div class="offer-hero-dark">
        <div class="offer-title-wrap">
          <h3>Recommended Corporate Subscription</h3>
          <h2>Smart Monthly Plan</h2>
          <p>
            Pay strictly for active registered employees. Zero hidden setup fees, zero costly on-premise servers, and zero lock-in contracts.
          </p>
          <div class="offer-sub-note">
            For organizations with specialized workflows, advanced <strong>Pro</strong> and <strong>Enterprise</strong> tiers are readily available.
          </div>
        </div>

        <div class="price-tag-box-dark">
          <div class="price-value-dark">15 €</div>
          <div class="price-unit-dark">/ active employee / month</div>
          <div class="price-min-dark">Min. 150 € / month / company</div>
        </div>
      </div>

      <!-- Features Included & Rapid 3-Step Rollout -->
      <div class="included-rollout-split">
        <div class="included-card-wrap">
          <div class="card-mini-title">&#10003; Full Platform Inclusions</div>
          <ul class="included-list-compact">
            <li class="included-item-compact"><span class="included-check-compact">&#10003;</span> <span><strong>Unlimited Tablet Kiosks</strong> on any entry point.</span></li>
            <li class="included-item-compact"><span class="included-check-compact">&#10003;</span> <span><strong>Real-Time Live Dashboard</strong> via mobile & desktop.</span></li>
            <li class="included-item-compact"><span class="included-check-compact">&#10003;</span> <span><strong>1-Click Payroll Sync</strong> (SAGA, Excel, CSV & ERP API).</span></li>
            <li class="included-item-compact"><span class="included-check-compact">&#10003;</span> <span><strong>Smart Shift Planner</strong> with Auto-Close automation.</span></li>
            <li class="included-item-compact"><span class="included-check-compact">&#10003;</span> <span><strong>GDPR Compliant & Daily Backup</strong> with zero biometrics.</span></li>
          </ul>
        </div>

        <div class="rollout-vertical">
          <div class="rollout-step-item">
            <div class="rollout-step-header"><span>Step 1</span> <span>2 Mins</span></div>
            <div class="rollout-step-name">Import Your Team</div>
            <div class="rollout-step-text">Upload Excel spreadsheet; QR badges and PINs generate automatically.</div>
          </div>
          <div class="rollout-step-item rose">
            <div class="rollout-step-header"><span>Step 2</span> <span>3 Mins</span></div>
            <div class="rollout-step-name">Activate Kiosk Tablet</div>
            <div class="rollout-step-text">Open the web link on the entrance tablet; zero app installation friction.</div>
          </div>
          <div class="rollout-step-item amber">
            <div class="rollout-step-header"><span>Step 3</span> <span>Instant</span></div>
            <div class="rollout-step-name">Automated Attendance</div>
            <div class="rollout-step-text">Employees scan in seconds; hours and overtime calculate in real time.</div>
          </div>
        </div>
      </div>

      <!-- Dark CTA Strip (Aurora Edition) -->
      <div class="cta-strip-dark">
        <div class="cta-text-left">
          <h4>Ready to test GetApp Smart QR in your company?</h4>
          <p>Experience our 14-day fully featured free pilot — No credit card required, zero setup costs.</p>
          <div class="cta-contacts-line">
            <span>Phone: <strong>+40 757 77 77 12</strong></span>
            <span>Email: <strong>contact@getapp.ro</strong></span>
            <span>Web: <strong>www.getapp.ro</strong></span>
          </div>
        </div>
        <a href="mailto:contact@getapp.ro" class="cta-action-btn-dark">Request Live Demo</a>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Phone: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div><span class="footer-badge">GETAPP SMART QR</span> &bull; Page 2 of 2 — Aurora Edition</div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../presentation_aurora_temp.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Saved presentation_aurora_temp.html');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000)); // wait for fonts

  const pdfPath = path.join(__dirname, '../Prezentare_Executiva_Smart_QR_Aurora_EN.pdf');
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

  console.log(`Successfully generated Aurora 2-page English PDF at: ${pdfPath}`);

  // Save PNG previews
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const pageElements = await page.$$('.page');
  for (let i = 0; i < pageElements.length; i++) {
    const previewPath = path.join(__dirname, `../pdf_aurora_en_page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: previewPath });
    console.log(`Saved page preview: ${previewPath}`);
  }

  await browser.close();
  fs.unlinkSync(htmlPath);
}

buildAuroraPdf().catch(err => {
  console.error('Error generating Aurora English PDF:', err);
  process.exit(1);
});
