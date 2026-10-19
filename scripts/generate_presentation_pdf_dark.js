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

async function buildDarkPdf() {
  const logoImg = getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.png')) || getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.jpg'));

  const htmlContent = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>GetApp Smart QR — Prezentare Executivă</title>
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
      background: #030712;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      letter-spacing: -0.015em;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 11px;
      line-height: 1.45;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 13mm 15mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #050814;
      background-image: 
        radial-gradient(900px circle at 85% 12%, rgba(37, 99, 235, 0.16), transparent 50%),
        radial-gradient(800px circle at 15% 85%, rgba(16, 185, 129, 0.1), transparent 50%),
        radial-gradient(600px circle at 50% 50%, rgba(30, 58, 138, 0.08), transparent 50%);
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 11px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: #ffffff;
      padding: 4px 10px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    .brand-logo-img {
      height: 28px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .brand-meta-divider {
      width: 1px;
      height: 28px;
      background: rgba(255, 255, 255, 0.15);
    }
    .brand-meta {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-meta-tagline {
      font-size: 11.5px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.2px;
    }
    .brand-meta-url {
      font-size: 10px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.3px;
    }
    .header-doc-info {
      text-align: right;
    }
    .doc-type {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 3px;
    }
    .doc-title {
      font-size: 11px;
      font-weight: 700;
      color: #cbd5e1;
    }

    /* Bottom Corporate Footer */
    .bottom-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
    }
    .footer-contacts span {
      margin-right: 14px;
    }
    .footer-contacts strong {
      color: #cbd5e1;
    }
    .footer-badge {
      color: #38bdf8;
    }

    /* Executive Hero Card (Dark Glass) */
    .hero-box {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 16, 31, 0.98) 100%);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 12px;
      padding: 16px 20px;
      position: relative;
      overflow: hidden;
      margin-bottom: 11px;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6);
    }
    .hero-glow-accent {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 140px;
      height: 140px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 2px 8px;
      border-radius: 20px;
      margin-bottom: 7px;
    }
    .hero-eyebrow-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
    }
    .hero-heading {
      font-size: 20.5px;
      font-weight: 900;
      line-height: 1.22;
      letter-spacing: -0.6px;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .hero-heading span.gradient-text {
      background: linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-description {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
      max-width: 630px;
    }

    /* 4 Glowing Metric Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 11px;
    }
    .metric-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .metric-card.accent-blue {
      border-top: 2px solid #38bdf8;
      background: linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%);
    }
    .metric-card.accent-emerald {
      border-top: 2px solid #10b981;
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%);
    }
    .metric-card.accent-purple {
      border-top: 2px solid #818cf8;
      background: linear-gradient(180deg, rgba(129, 140, 248, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%);
    }
    .metric-val {
      font-size: 21px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-bottom: 2px;
      text-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
    }
    .metric-val.cyan { color: #38bdf8; text-shadow: 0 0 16px rgba(56, 189, 248, 0.5); }
    .metric-val.emerald { color: #34d399; text-shadow: 0 0 16px rgba(52, 211, 153, 0.5); }
    .metric-label {
      font-size: 10px;
      font-weight: 800;
      color: #e2e8f0;
      margin-bottom: 2px;
    }
    .metric-sub {
      font-size: 9px;
      color: #64748b;
      line-height: 1.35;
    }

    /* Section Subheaders */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 7px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title-tag {
      font-size: 9px;
      font-weight: 800;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .section-sub {
      font-size: 9.5px;
      color: #64748b;
    }

    /* Comparison Table (Dark Mode High Contrast) */
    .comp-table-wrap {
      margin-bottom: 11px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      overflow: hidden;
      background: rgba(15, 23, 42, 0.6);
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 10px;
    }
    .comp-table th {
      background: rgba(30, 41, 59, 0.8);
      color: #94a3b8;
      padding: 7px 10px;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .comp-table th.highlight {
      background: rgba(37, 99, 235, 0.25);
      color: #38bdf8;
      border-bottom: 2px solid #38bdf8;
    }
    .comp-table td {
      padding: 6px 10px;
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
      background: rgba(37, 99, 235, 0.12);
      font-weight: 700;
      color: #38bdf8;
    }

    /* Tablet Kiosk Dark Showcase */
    .kiosk-feature-box {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 12px;
      align-items: center;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .kiosk-mockup {
      background: #000000;
      border: 2px solid #1e293b;
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.15);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kiosk-mockup-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #64748b;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 4px;
    }
    .kiosk-mockup-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      align-items: center;
    }
    .kiosk-time-box {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
    }
    .kiosk-clock {
      font-size: 18px;
      font-weight: 900;
      color: #38bdf8;
      letter-spacing: 0.5px;
      line-height: 1;
      margin-bottom: 2px;
    }
    .kiosk-clock-label {
      font-size: 8px;
      color: #94a3b8;
    }
    .kiosk-qr-visual {
      background: #ffffff;
      border-radius: 6px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .kiosk-qr-scan-frame {
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 2px dashed #38bdf8;
      border-radius: 8px;
      pointer-events: none;
    }
    .kiosk-qr-tag {
      font-size: 7.5px;
      font-weight: 800;
      color: #0284c7;
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      width: 20px;
      height: 20px;
      border-radius: 5px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      font-weight: 800;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .kiosk-point-title {
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1px;
    }
    .kiosk-point-desc {
      font-size: 9.5px;
      color: #94a3b8;
      line-height: 1.35;
    }

    /* ==================== PAGE 2: DASHBOARD & CHARTS ==================== */
    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 11px;
    }
    .pillar-card {
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.7);
      padding: 12px 13px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .pillar-num {
      font-size: 9px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .pillar-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.25;
    }
    .pillar-desc {
      font-size: 9.5px;
      color: #94a3b8;
      line-height: 1.35;
    }
    .pillar-check {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 9.5px;
      color: #cbd5e1;
      margin-top: 3px;
    }
    .pillar-check li {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .pillar-check li span.bullet {
      color: #10b981;
      font-weight: 800;
      font-size: 10px;
    }

    /* Live Analytics Dual Chart Card */
    .dashboard-analytics-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 11px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
    }
    .dash-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .dash-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .live-pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .dash-header-title {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
    }
    .dash-header-meta {
      font-size: 9.5px;
      color: #64748b;
    }
    .charts-split {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 14px;
      align-items: center;
    }
    .chart-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .chart-box-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #cbd5e1;
      display: flex;
      justify-content: space-between;
    }
    .donut-layout {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 9px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
    }
    .legend-color {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }
    .legend-item strong {
      color: #ffffff;
    }

    /* Live Activity Table */
    .activity-feed-box {
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 11px;
      background: rgba(15, 23, 42, 0.6);
    }
    .activity-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    .activity-table th {
      background: rgba(30, 41, 59, 0.7);
      color: #94a3b8;
      padding: 6px 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .activity-table td {
      padding: 6px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
    }
    .activity-table tr:last-child td {
      border-bottom: none;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #1e293b;
      color: #38bdf8;
      font-weight: 800;
      font-size: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .badge-status {
      font-size: 8.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      display: inline-block;
    }
    .badge-status.green {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-status.blue {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    /* Auto-Close Shift Dark Callout */
    .autoclose-dark-box {
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      margin-bottom: 11px;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
    }
    .autoclose-dark-info h4 {
      font-size: 11.5px;
      font-weight: 800;
      color: #34d399;
      margin-bottom: 2px;
    }
    .autoclose-dark-info p {
      font-size: 9.5px;
      color: #cbd5e1;
      line-height: 1.35;
    }
    .toggle-ui-pill {
      background: #10b981;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      padding: 5px 12px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
      white-space: nowrap;
    }

    /* 3 Compliance Boxes */
    .compliance-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .comp-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .comp-title {
      font-size: 10px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .comp-desc {
      font-size: 8.5px;
      color: #94a3b8;
      line-height: 1.3;
    }

    /* ==================== PAGE 3: COMMERCIAL OFFER & ROADMAP ==================== */
    .offer-hero-dark {
      background: linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1.5px solid #2563eb;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      box-shadow: 0 10px 30px -5px rgba(37, 99, 235, 0.25);
    }
    .offer-title-wrap h3 {
      font-size: 9.5px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 3px;
    }
    .offer-title-wrap h2 {
      font-size: 21px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .offer-title-wrap p {
      font-size: 10.5px;
      color: #cbd5e1;
      max-width: 430px;
      line-height: 1.4;
    }
    .offer-sub-note {
      font-size: 9.5px;
      color: #60a5fa;
      font-weight: 700;
      margin-top: 6px;
    }
    .price-tag-box-dark {
      background: #090d16;
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 10px;
      padding: 14px 20px;
      text-align: center;
      box-shadow: 0 0 20px rgba(37, 99, 235, 0.3);
    }
    .price-value-dark {
      font-size: 36px;
      font-weight: 900;
      color: #38bdf8;
      line-height: 1;
      margin-bottom: 2px;
      text-shadow: 0 0 18px rgba(56, 189, 248, 0.6);
    }
    .price-unit-dark {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
    }
    .price-min-dark {
      font-size: 9px;
      font-weight: 800;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 3px 7px;
      border-radius: 4px;
      margin-top: 6px;
      display: inline-block;
    }

    /* Included Features Grid */
    .included-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .included-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .included-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 10.5px;
      color: #cbd5e1;
    }
    .included-check {
      color: #10b981;
      font-weight: 900;
      font-size: 12px;
    }
    .included-item strong {
      color: #ffffff;
    }

    /* Export SAGA & ERP Showcase Box */
    .saga-showcase-box {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      margin-bottom: 12px;
    }
    .saga-tags {
      display: flex;
      gap: 6px;
    }
    .saga-tag {
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }

    /* 3-Step Rollout Dark */
    .rollout-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .rollout-card-dark {
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 23, 42, 0.7);
      border-radius: 10px;
      padding: 12px;
      border-top: 3px solid #38bdf8;
    }
    .rollout-card-dark.green { border-top-color: #10b981; }
    .rollout-card-dark.purple { border-top-color: #a855f7; }
    .rollout-step {
      font-size: 9px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .rollout-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 3px;
    }
    .rollout-desc {
      font-size: 9.5px;
      color: #94a3b8;
      line-height: 1.35;
    }

    /* Dark CTA Strip */
    .cta-strip-dark {
      background: linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(10, 16, 31, 0.95) 100%);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(37, 99, 235, 0.2);
    }
    .cta-text-left h4 {
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .cta-text-left p {
      font-size: 10.5px;
      color: #cbd5e1;
    }
    .cta-contacts-line {
      display: flex;
      gap: 16px;
      margin-top: 6px;
      font-size: 10px;
      color: #94a3b8;
    }
    .cta-contacts-line strong {
      color: #38bdf8;
    }
    .cta-action-btn-dark {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 800;
      padding: 12px 20px;
      border-radius: 8px;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGINA 1: OVERVIEW STRATEGIC & KIOSK TABLETĂ ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <div class="logo-badge">
            <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          </div>
          <div class="brand-meta-divider"></div>
          <div class="brand-meta">
            <span class="brand-meta-tagline">Sistem Inteligent de Pontaj Digital</span>
            <span class="brand-meta-url">www.getapp.ro &bull; contact@getapp.ro</span>
          </div>
        </div>
        <div class="header-doc-info">
          <div class="doc-type">Documentație Oficială de Produs</div>
          <div class="doc-title">Propunere Tehnică & Arhitectură SaaS</div>
        </div>
      </div>

      <div class="hero-box">
        <div class="hero-glow-accent"></div>
        <span class="hero-eyebrow"><span class="hero-eyebrow-dot"></span> Transformare Digitală & Conformitate Legală</span>
        <h1 class="hero-heading">Sistemul Inteligent de Pontaj Digital<br><span class="gradient-text">prin Coduri QR Dinamice și Kiosk pe Tabletă</span></h1>
        <p class="hero-description">
          Elimină definitiv condica de prezență pe hârtie, cartelele de plastic transmise între colegi și zecile de ore irosite lunar pentru calculul orelor. 
          O platformă cloud securizată, conformă 100% cu Codul Muncii și normele GDPR europene.
        </p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card accent-blue">
          <div class="metric-val cyan">&lt; 1 sec</div>
          <div class="metric-label">Timp de Pontare</div>
          <div class="metric-sub">Scanare instantanee a ecusonului sau codului de pe telefon.</div>
        </div>
        <div class="metric-card accent-emerald">
          <div class="metric-val emerald">0 € Cost</div>
          <div class="metric-label">Fără Hardware Dedicat</div>
          <div class="metric-sub">Funcționează pe orice tabletă comercială iPad sau Android.</div>
        </div>
        <div class="metric-card accent-purple">
          <div class="metric-val">100% GDPR</div>
          <div class="metric-label">Fără Date Biometrice</div>
          <div class="metric-sub">Fără amprente sau scanare facială invazivă. Risc juridic zero.</div>
        </div>
        <div class="metric-card accent-blue">
          <div class="metric-val cyan">15 Min</div>
          <div class="metric-label">Implementare Imediată</div>
          <div class="metric-sub">Import din Excel și pornire în aceeași zi, fără cablări.</div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Comparație Tehnologică: Pontaj Tradițional vs. GetApp Smart QR <span class="section-title-tag">Eficiență</span></span>
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
        <div class="kiosk-mockup">
          <div class="kiosk-mockup-top">
            <span>GETAPP SMART QR TERMINAL #1</span>
            <span>SECURED SSL &bull; 256-BIT</span>
          </div>
          <div class="kiosk-mockup-body">
            <div class="kiosk-time-box">
              <div class="kiosk-clock">08:15:32</div>
              <div class="kiosk-clock-label">LUNI &bull; STATUS ACTIV</div>
              <div style="margin-top: 6px; font-size: 8px; color: #34d399; font-weight: 800;">ANTI-STANDBY ON</div>
            </div>
            <div class="kiosk-qr-visual">
              <div class="kiosk-qr-scan-frame"></div>
              <!-- Crisp Vector SVG QR Code -->
              <svg width="68" height="68" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#ffffff"/>
                <!-- Corner 1 -->
                <rect x="5" y="5" width="30" height="30" fill="#0f172a"/>
                <rect x="10" y="10" width="20" height="20" fill="#ffffff"/>
                <rect x="15" y="15" width="10" height="10" fill="#2563eb"/>
                <!-- Corner 2 -->
                <rect x="65" y="5" width="30" height="30" fill="#0f172a"/>
                <rect x="70" y="10" width="20" height="20" fill="#ffffff"/>
                <rect x="75" y="15" width="10" height="10" fill="#2563eb"/>
                <!-- Corner 3 -->
                <rect x="5" y="65" width="30" height="30" fill="#0f172a"/>
                <rect x="10" y="70" width="20" height="20" fill="#ffffff"/>
                <rect x="15" y="75" width="10" height="10" fill="#2563eb"/>
                <!-- Dynamic Pattern -->
                <rect x="42" y="12" width="6" height="6" fill="#0f172a"/>
                <rect x="50" y="20" width="8" height="8" fill="#0f172a"/>
                <rect x="42" y="42" width="16" height="16" fill="#2563eb"/>
                <rect x="20" y="45" width="8" height="8" fill="#0f172a"/>
                <rect x="65" y="45" width="10" height="6" fill="#0f172a"/>
                <rect x="45" y="70" width="8" height="12" fill="#0f172a"/>
                <rect x="68" y="72" width="14" height="6" fill="#0f172a"/>
                <rect x="80" y="82" width="8" height="8" fill="#0f172a"/>
              </svg>
              <span class="kiosk-qr-tag">Scan QR / PIN</span>
            </div>
          </div>
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
      <div><span class="footer-badge">GETAPP SMART QR</span> &bull; Pagina 1 din 3 — Propunere Tehnică</div>
    </div>
  </div>

  <!-- ==================== PAGINA 2: DASHBOARD, GRAFICE LIVE & AUTO-CLOSE ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <div class="logo-badge">
            <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          </div>
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
        <span class="section-title">Cei 3 Piloni Tehnologici ai Platformei Smart QR <span class="section-title-tag">Arhitectură</span></span>
        <span class="section-sub">Arhitectură Cloud Multi-Tenant cu Audit Securizat</span>
      </div>

      <div class="pillars-grid">
        <div class="pillar-card">
          <span class="pillar-num">Pilonul 1</span>
          <h3 class="pillar-title">Terminal Kiosk Securizat</h3>
          <p class="pillar-desc">Tableta devine punct fix de control cu criptare SSL pe 256 de biți.</p>
          <ul class="pillar-check">
            <li><span class="bullet">&#10003;</span> <span>QR dinamic regenerat la 15s</span></li>
            <li><span class="bullet">&#10003;</span> <span>Ecran permanent activ (Anti-Standby)</span></li>
            <li><span class="bullet">&#10003;</span> <span>Feedback vizual și sonor la scanare</span></li>
          </ul>
        </div>

        <div class="pillar-card">
          <span class="pillar-num">Pilonul 2</span>
          <h3 class="pillar-title">Monitorizare Live & Ture</h3>
          <p class="pillar-desc">Vizibilitate secundă cu secundă asupra prezenței la muncă.</p>
          <ul class="pillar-check">
            <li><span class="bullet">&#10003;</span> <span>Filtru interactiv: Prezenți / Absenți</span></li>
            <li><span class="bullet">&#10003;</span> <span>Închidere automată la final de tură</span></li>
            <li><span class="bullet">&#10003;</span> <span>Planificare pe zile și echipe</span></li>
          </ul>
        </div>

        <div class="pillar-card">
          <span class="pillar-num">Pilonul 3</span>
          <h3 class="pillar-title">Fișe Pontaj & Salarizare</h3>
          <p class="pillar-desc">Automatizarea completă a calculului orelor pentru contabilitate.</p>
          <ul class="pillar-check">
            <li><span class="bullet">&#10003;</span> <span>Ore zi, noapte, weekend, extra</span></li>
            <li><span class="bullet">&#10003;</span> <span>Export direct SAGA, ERP și Excel</span></li>
            <li><span class="bullet">&#10003;</span> <span>Conformitate Art. 119 Codul Muncii</span></li>
          </ul>
        </div>
      </div>

      <!-- Live Analytics Dual Chart Card (Vector SVG) -->
      <div class="dashboard-analytics-card">
        <div class="dash-header-row">
          <div class="dash-header-left">
            <span class="live-pulse-dot"></span>
            <span class="dash-header-title">Panou de Control Live — Monitorizare & Grafice Interactive</span>
          </div>
          <span class="dash-header-meta">Actualizat în Timp Real &bull; 55 Salariați Înregistrați</span>
        </div>

        <div class="charts-split">
          <!-- Donut Attendance Chart -->
          <div class="chart-box">
            <div class="chart-box-title">
              <span>Status Prezență Azi</span>
              <span style="color: #34d399; font-weight: 800;">48 / 55 la Muncă</span>
            </div>
            <div class="donut-layout">
              <!-- SVG Donut -->
              <svg width="90" height="90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="rgba(255, 255, 255, 0.08)" stroke-width="12" fill="none"/>
                <!-- Green 87% (Circumference ~238.7. 87% = 207) -->
                <circle cx="50" cy="50" r="38" stroke="#10b981" stroke-width="12" fill="none"
                        stroke-dasharray="207 238.7" stroke-dashoffset="0" transform="rotate(-90 50 50)" stroke-linecap="round"/>
                <!-- Blue 7% = 17 -->
                <circle cx="50" cy="50" r="38" stroke="#38bdf8" stroke-width="12" fill="none"
                        stroke-dasharray="17 238.7" stroke-dashoffset="-209" transform="rotate(-90 50 50)"/>
                <!-- Red 6% = 14 -->
                <circle cx="50" cy="50" r="38" stroke="#f43f5e" stroke-width="12" fill="none"
                        stroke-dasharray="12 238.7" stroke-dashoffset="-227" transform="rotate(-90 50 50)"/>
                <text x="50" y="47" text-anchor="middle" font-size="14" font-weight="900" fill="#ffffff" font-family="'Plus Jakarta Sans'">88%</text>
                <text x="50" y="60" text-anchor="middle" font-size="7.5" font-weight="700" fill="#64748b" font-family="'Plus Jakarta Sans'">PREZENȚĂ</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-color" style="background: #10b981;"></span> <strong>48</strong> Prezenți la program</div>
                <div class="legend-item"><span class="legend-color" style="background: #38bdf8;"></span> <strong>4</strong> Învoiri / Concediu</div>
                <div class="legend-item"><span class="legend-color" style="background: #f43f5e;"></span> <strong>3</strong> Absenți nemotivat</div>
              </div>
            </div>
          </div>

          <!-- Weekly Area Chart -->
          <div class="chart-box">
            <div class="chart-box-title">
              <span>Evoluție Ore Lucrate / Săptămână</span>
              <span style="color: #38bdf8; font-weight: 800;">412 Ore Total</span>
            </div>
            <!-- SVG Weekly Trend Area Chart -->
            <svg width="100%" height="70" viewBox="0 0 240 70">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <!-- Grid lines -->
              <line x1="20" y1="15" x2="230" y2="15" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 2"/>
              <line x1="20" y1="35" x2="230" y2="35" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 2"/>
              <line x1="20" y1="55" x2="230" y2="55" stroke="rgba(255,255,255,0.06)"/>
              
              <!-- Area -->
              <polygon points="30,55 30,36 75,22 125,28 175,12 220,18 220,55" fill="url(#areaGrad)"/>
              <!-- Line -->
              <polyline points="30,36 75,22 125,28 175,12 220,18" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
              
              <!-- Data Dots -->
              <circle cx="30" cy="36" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              <circle cx="75" cy="22" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              <circle cx="125" cy="28" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              <circle cx="175" cy="12" r="3.5" fill="#34d399" stroke="#ffffff" stroke-width="1.5"/>
              <circle cx="220" cy="18" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              
              <!-- Labels -->
              <text x="30" y="65" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">LUN</text>
              <text x="75" y="65" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">MAR</text>
              <text x="125" y="65" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">MIE</text>
              <text x="175" y="65" text-anchor="middle" font-size="7.5" font-weight="700" fill="#38bdf8" font-family="'Plus Jakarta Sans'">JOI</text>
              <text x="220" y="65" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">VIN</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- Live Activity Table -->
      <div class="activity-feed-box">
        <table class="activity-table">
          <thead>
            <tr>
              <th>Salariat</th>
              <th>Departament</th>
              <th>Ora Scanare</th>
              <th>Punct de Acces</th>
              <th>Status Curent</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">AI</div>
                  <div><strong style="color: #ffffff;">Andrei Ionescu</strong> (EMP002)</div>
                </div>
              </td>
              <td>Director Operațiuni</td>
              <td>08:02:14</td>
              <td>Recepție Centrală</td>
              <td><span class="badge-status green">Prezent &bull; În Tură</span></td>
            </tr>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">CV</div>
                  <div><strong style="color: #ffffff;">Cristian Vasile</strong> (EMP005)</div>
                </div>
              </td>
              <td>Specialist Logistică</td>
              <td>08:14:50</td>
              <td>Poarta 2 Depozit</td>
              <td><span class="badge-status green">Prezent &bull; În Tură</span></td>
            </tr>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">ER</div>
                  <div><strong style="color: #ffffff;">Elena Rădulescu</strong> (EMP001)</div>
                </div>
              </td>
              <td>Director General</td>
              <td>08:45:02</td>
              <td>Recepție Centrală</td>
              <td><span class="badge-status green">Prezent &bull; În Tură</span></td>
            </tr>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">IP</div>
                  <div><strong style="color: #ffffff;">Ioana Popescu</strong> (EMP008)</div>
                </div>
              </td>
              <td>Manager Resurse Umane</td>
              <td>12:30:11</td>
              <td>Kiosk Birouri Et. 1</td>
              <td><span class="badge-status blue">Pauză Masă</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="autoclose-dark-box">
        <div class="autoclose-dark-info">
          <h4>Funcționalitate Inteligentă: Închidere Automată a Turelor (Auto-Close Shift)</h4>
          <p>
            Dacă un salariat uită să ponteze ieșirea la finalul programului, sistemul finalizează automat sesiunea la ora stabilită în planificatorul de ture, 
            eliminând erorile de calcul și sutele de intervenții manuale din partea departamentului de HR.
          </p>
        </div>
        <div class="toggle-ui-pill">
          <span>&#10003; ACTIVAT</span>
          <span style="font-size: 8px; opacity: 0.85;">(DA / NU)</span>
        </div>
      </div>

      <div class="compliance-grid">
        <div class="comp-card">
          <div class="comp-title">Zero Biometrie / Fără Camere</div>
          <div class="comp-desc">Nu se stochează amprente sau trăsături faciale. Dreptul la intimitate al fiecărui salariat este protejat integral.</div>
        </div>
        <div class="comp-card">
          <div class="comp-title">Criptare Cloud & Izolare Tenant</div>
          <div class="comp-desc">Comunicații securizate pe 256 de biți, baze de date izolate per companie și backup zilnic garantat.</div>
        </div>
        <div class="comp-card">
          <div class="comp-title">Conformitate Integrală ITM</div>
          <div class="comp-desc">Generare instantanee de registre cerute de inspectorii de muncă, cu ora exactă de venire și plecare.</div>
        </div>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Tel: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div><span class="footer-badge">GETAPP SMART QR</span> &bull; Pagina 2 din 3 — Propunere Tehnică</div>
    </div>
  </div>

  <!-- ==================== PAGINA 3: OFERTĂ COMERCIALĂ & IMPLEMENTARE ==================== -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand-block">
          <div class="logo-badge">
            <img src="${logoImg}" alt="GetApp Smart QR" class="brand-logo-img">
          </div>
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

      <div class="offer-hero-dark">
        <div class="offer-title-wrap">
          <h3>Abonamentul Recomandat pentru Companii</h3>
          <h2>Smart Monthly Plan</h2>
          <p>
            Plătești strict pentru numărul de angajați activi din organizație. Fără costuri ascunse de instalare, 
            fără servere dedicate de întreținut și fără contracte obligatorii pe termen lung.
          </p>
          <div class="offer-sub-note">
            Pentru organizații cu cerințe complexe, sunt disponibile și pachetele superioare <strong>Pro</strong> și <strong>Premium</strong>.
          </div>
        </div>

        <div class="price-tag-box-dark">
          <div class="price-value-dark">15 €</div>
          <div class="price-unit-dark">/ angajat activ / lună</div>
          <div class="price-min-dark">Minim 150 € / lună / companie</div>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Ce Include Abonamentul Smart <span class="section-title-tag">Complet</span></span>
        <span class="section-sub">Acces Nelimitat la Toate Modulele Platformei</span>
      </div>

      <div class="included-grid">
        <ul class="included-list">
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Terminale Kiosk Nelimitate</strong> pe oricâte tablete sau intrări sunt necesare.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Panou Live & Monitorizare în Timp Real</strong> de pe orice telefon sau PC.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Fișe Individuale și Colective de Pontaj</strong> calculate automat la secundă.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Exporturi Instant Excel & SAGA</strong> gata de trimis către departamentul financiar.</span></li>
        </ul>
        <ul class="included-list">
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Planificator Ture & Închidere Automată</strong> la final de program (Auto-Close).</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Modul HR & Import 1-Click din Excel</strong> cu generare automată de ecusoane.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Securitate Cloud & Conformitate GDPR</strong> cu backup zilnic automat.</span></li>
          <li class="included-item"><span class="included-check">&#10003;</span> <span><strong>Asistență Tehnică Directă & Onboarding Asistat</strong> pentru pornire în 15 min.</span></li>
        </ul>
      </div>

      <div class="saga-showcase-box">
        <div>
          <strong style="color: #ffffff; font-size: 11px;">Integrare Rapidă cu Softul de Contabilitate</strong>
          <p style="color: #94a3b8; font-size: 9.5px; margin-top: 1px;">Export direct al orelor lucrate conform cerințelor de stat (ore de zi, noapte, weekend, suplimentare).</p>
        </div>
        <div class="saga-tags">
          <span class="saga-tag">SAGA Salarii</span>
          <span class="saga-tag">Excel XLS/CSV</span>
          <span class="saga-tag">API ERP</span>
        </div>
      </div>

      <div class="section-header">
        <span class="section-title">Lansare în 3 Pași Simpli (Gata în 15 Minute) <span class="section-title-tag">Roadmap</span></span>
        <span class="section-sub">Fără Deranj Operațional sau Cablări</span>
      </div>

      <div class="rollout-grid">
        <div class="rollout-card-dark">
          <div class="rollout-step">Pasul 1 — 2 Minute</div>
          <div class="rollout-title">Import Echipa</div>
          <div class="rollout-desc">Încărcați tabelul Excel cu salariații. Sistemul emite automat ecusoanele QR și codurile PIN.</div>
        </div>
        <div class="rollout-card-dark green">
          <div class="rollout-step">Pasul 2 — 3 Minute</div>
          <div class="rollout-title">Activare Tabletă</div>
          <div class="rollout-desc">Deschideți link-ul terminalului pe tableta de la intrare. Fără instalare greoaie de aplicatii.</div>
        </div>
        <div class="rollout-card-dark purple">
          <div class="rollout-step">Pasul 3 — Imediat</div>
          <div class="rollout-title">Pontaj Automat</div>
          <div class="rollout-desc">Angajații scanează codul la intrare și ieșire. Orele și rapoartele se generează instant.</div>
        </div>
      </div>

      <div class="cta-strip-dark">
        <div class="cta-text-left">
          <h4>Doriți să testați sistemul gratuit în compania dumneavoastră?</h4>
          <p>Oferim 14 zile de testare gratuită completă — fără card bancar, fără costuri de activare.</p>
          <div class="cta-contacts-line">
            <span>Telefon: <strong>0757 77 77 12</strong></span>
            <span>Email: <strong>contact@getapp.ro</strong></span>
            <span>Web: <strong>www.getapp.ro</strong></span>
          </div>
        </div>
        <a href="mailto:contact@getapp.ro" class="cta-action-btn-dark">Solicită Demo Gratuit</a>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Tel: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div><span class="footer-badge">GETAPP SMART QR</span> &bull; Pagina 3 din 3 — Propunere Tehnică</div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.join(__dirname, '../presentation_dark_temp.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('Saved presentation_dark_temp.html');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000)); // wait for fonts to render

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

  console.log(`Successfully generated Dark Executive PDF at: ${pdfPath}`);

  // Save PNG preview of each page
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const pageElements = await page.$$('.page');
  for (let i = 0; i < pageElements.length; i++) {
    const previewPath = path.join(__dirname, `../pdf_dark_page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: previewPath });
    console.log(`Saved page preview: ${previewPath}`);
  }

  await browser.close();
  fs.unlinkSync(htmlPath);
}

buildDarkPdf().catch(err => {
  console.error('Error generating dark executive PDF:', err);
  process.exit(1);
});
