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

async function buildEnglishPdf() {
  const logoImg = getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.png')) || getBase64Image(path.join(__dirname, '../logo_getapp_smartqr.jpg'));

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GetApp Smart QR — Executive Presentation (English)</title>
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
      font-size: 10.5px;
      line-height: 1.4;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 12mm 15mm;
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
      padding-bottom: 9px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 10px;
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
      height: 26px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .brand-meta-divider {
      width: 1px;
      height: 26px;
      background: rgba(255, 255, 255, 0.15);
    }
    .brand-meta {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .brand-meta-tagline {
      font-size: 11px;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.2px;
    }
    .brand-meta-url {
      font-size: 9.5px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.3px;
    }
    .header-doc-info {
      text-align: right;
    }
    .doc-type {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 2px 7px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 2px;
    }
    .doc-title {
      font-size: 10.5px;
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
      padding: 15px 18px;
      position: relative;
      overflow: hidden;
      margin-bottom: 10px;
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
      font-size: 8.5px;
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
    .hero-eyebrow-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
    }
    .hero-heading {
      font-size: 19.5px;
      font-weight: 900;
      line-height: 1.22;
      letter-spacing: -0.5px;
      color: #ffffff;
      margin-bottom: 5px;
    }
    .hero-heading span.gradient-text {
      background: linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-description {
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.45;
      max-width: 630px;
    }

    /* 4 Glowing Metric Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .metric-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9px;
      padding: 9px 11px;
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
      font-size: 20px;
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
      font-size: 9.5px;
      font-weight: 800;
      color: #e2e8f0;
      margin-bottom: 2px;
    }
    .metric-sub {
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.3;
    }

    /* Section Subheaders */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 7px;
    }
    .section-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title-tag {
      font-size: 8.5px;
      font-weight: 800;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .section-sub {
      font-size: 9px;
      color: #64748b;
    }

    /* Comparison Table (Dark Mode High Contrast) */
    .comp-table-wrap {
      margin-bottom: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9px;
      overflow: hidden;
      background: rgba(15, 23, 42, 0.6);
    }
    .comp-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 9.5px;
    }
    .comp-table th {
      background: rgba(30, 41, 59, 0.8);
      color: #94a3b8;
      padding: 6.5px 10px;
      font-size: 8.5px;
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
      grid-template-columns: 1.15fr 1fr;
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
      font-size: 7.5px;
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
      font-size: 7.5px;
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
      gap: 7px;
    }
    .kiosk-point {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    .kiosk-icon {
      width: 18px;
      height: 18px;
      border-radius: 5px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      font-weight: 800;
      font-size: 9.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .kiosk-point-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1px;
    }
    .kiosk-point-desc {
      font-size: 9px;
      color: #94a3b8;
      line-height: 1.35;
    }

    /* ==================== PAGE 2 STYLES ==================== */
    /* Live Analytics Dual Chart Card */
    .dashboard-analytics-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 11px;
      padding: 11px 13px;
      margin-bottom: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
    }
    .dash-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .dash-header-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .live-pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    .dash-header-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #ffffff;
    }
    .dash-header-meta {
      font-size: 9px;
      color: #64748b;
    }
    .charts-split {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 12px;
      align-items: center;
    }
    .chart-box {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .chart-box-title {
      font-size: 10px;
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
      gap: 4px;
      font-size: 8.5px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #94a3b8;
    }
    .legend-color {
      width: 7px;
      height: 7px;
      border-radius: 2px;
    }
    .legend-item strong {
      color: #ffffff;
    }

    /* Live Activity Table */
    .activity-feed-box {
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9px;
      overflow: hidden;
      margin-bottom: 10px;
      background: rgba(15, 23, 42, 0.6);
    }
    .activity-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }
    .activity-table th {
      background: rgba(30, 41, 59, 0.7);
      color: #94a3b8;
      padding: 5.5px 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .activity-table td {
      padding: 5.5px 9px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
    }
    .activity-table tr:last-child td {
      border-bottom: none;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .user-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #1e293b;
      color: #38bdf8;
      font-weight: 800;
      font-size: 8.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .badge-status {
      font-size: 8px;
      font-weight: 800;
      padding: 2px 6px;
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

    /* Auto-Close Shift Callout */
    .autoclose-dark-box {
      background: linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 9px;
      padding: 9px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
    }
    .autoclose-dark-info h4 {
      font-size: 11px;
      font-weight: 800;
      color: #34d399;
      margin-bottom: 2px;
    }
    .autoclose-dark-info p {
      font-size: 9px;
      color: #cbd5e1;
      line-height: 1.35;
    }
    .toggle-ui-pill {
      background: #10b981;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 5px;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
      white-space: nowrap;
    }

    /* Offer Hero Card (Page 2) */
    .offer-hero-dark {
      background: linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1.5px solid #2563eb;
      border-radius: 11px;
      padding: 13px 17px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      box-shadow: 0 8px 24px -5px rgba(37, 99, 235, 0.25);
    }
    .offer-title-wrap h3 {
      font-size: 9px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 2px;
    }
    .offer-title-wrap h2 {
      font-size: 19px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 3px;
    }
    .offer-title-wrap p {
      font-size: 9.5px;
      color: #cbd5e1;
      max-width: 420px;
      line-height: 1.35;
    }
    .offer-sub-note {
      font-size: 9px;
      color: #60a5fa;
      font-weight: 700;
      margin-top: 4px;
    }
    .price-tag-box-dark {
      background: #090d16;
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 9px;
      padding: 11px 16px;
      text-align: center;
      box-shadow: 0 0 18px rgba(37, 99, 235, 0.3);
    }
    .price-value-dark {
      font-size: 32px;
      font-weight: 900;
      color: #38bdf8;
      line-height: 1;
      margin-bottom: 2px;
      text-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
    }
    .price-unit-dark {
      font-size: 9.5px;
      font-weight: 700;
      color: #94a3b8;
    }
    .price-min-dark {
      font-size: 8.5px;
      font-weight: 800;
      color: #34d399;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 5px;
      display: inline-block;
    }

    /* Included Features & Rollout Compact Grid */
    .included-rollout-split {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .included-card-wrap {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9px;
      padding: 10px 12px;
    }
    .card-mini-title {
      font-size: 10px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 7px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .included-list-compact {
      list-style: none;
      display: grid;
      grid-template-columns: 1fr;
      gap: 5px;
    }
    .included-item-compact {
      display: flex;
      gap: 6px;
      align-items: flex-start;
      font-size: 9px;
      color: #cbd5e1;
    }
    .included-check-compact {
      color: #10b981;
      font-weight: 900;
      font-size: 10.5px;
    }

    /* 3-Step Mini Rollout */
    .rollout-vertical {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .rollout-step-item {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-left: 3px solid #38bdf8;
      border-radius: 6px;
      padding: 6px 9px;
    }
    .rollout-step-item.green { border-left-color: #10b981; }
    .rollout-step-item.purple { border-left-color: #a855f7; }
    .rollout-step-header {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .rollout-step-name {
      font-size: 10px;
      font-weight: 800;
      color: #ffffff;
    }
    .rollout-step-text {
      font-size: 8.5px;
      color: #94a3b8;
      line-height: 1.25;
    }

    /* Dark CTA Strip */
    .cta-strip-dark {
      background: linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(10, 16, 31, 0.95) 100%);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 11px;
      padding: 13px 17px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 20px rgba(37, 99, 235, 0.2);
    }
    .cta-text-left h4 {
      font-size: 13.5px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .cta-text-left p {
      font-size: 9.5px;
      color: #cbd5e1;
    }
    .cta-contacts-line {
      display: flex;
      gap: 14px;
      margin-top: 5px;
      font-size: 9px;
      color: #94a3b8;
    }
    .cta-contacts-line strong {
      color: #38bdf8;
    }
    .cta-action-btn-dark {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      font-size: 11.5px;
      font-weight: 800;
      padding: 10px 18px;
      border-radius: 7px;
      text-decoration: none;
      white-space: nowrap;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: STRATEGIC OVERVIEW & TABLET KIOSK (ENGLISH) ==================== -->
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
        <div class="metric-card accent-blue">
          <div class="metric-val cyan">&lt; 1 sec</div>
          <div class="metric-label">Clock-In Speed</div>
          <div class="metric-sub">Instant check-in via employee digital badge or mobile app.</div>
        </div>
        <div class="metric-card accent-emerald">
          <div class="metric-val emerald">0 € Cost</div>
          <div class="metric-label">Zero Proprietary Hardware</div>
          <div class="metric-sub">Runs smoothly on any commercial iPad or Android tablet.</div>
        </div>
        <div class="metric-card accent-purple">
          <div class="metric-val">100% GDPR</div>
          <div class="metric-label">No Biometrics Required</div>
          <div class="metric-sub">Zero fingerprint or facial recognition scanning. Zero legal liability.</div>
        </div>
        <div class="metric-card accent-blue">
          <div class="metric-val cyan">15 Mins</div>
          <div class="metric-label">Instant Deployment</div>
          <div class="metric-sub">1-Click Excel team import. Fully operational on day one.</div>
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
              <th>Paper Sign-in Sheets</th>
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

      <div class="kiosk-feature-box">
        <div class="kiosk-mockup">
          <div class="kiosk-mockup-top">
            <span>GETAPP SMART QR TERMINAL #1</span>
            <span>SECURED SSL &bull; 256-BIT</span>
          </div>
          <div class="kiosk-mockup-body">
            <div class="kiosk-time-box">
              <div class="kiosk-clock">08:15:32</div>
              <div class="kiosk-clock-label">MONDAY &bull; ACTIVE STATUS</div>
              <div style="margin-top: 5px; font-size: 7.5px; color: #34d399; font-weight: 800;">ANTI-STANDBY ACTIVE</div>
            </div>
            <div class="kiosk-qr-visual">
              <div class="kiosk-qr-scan-frame"></div>
              <!-- Crisp Vector SVG QR Code -->
              <svg width="64" height="64" viewBox="0 0 100 100">
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
              <div class="kiosk-point-title">24/7 Anti-Standby Kiosk Mode</div>
              <div class="kiosk-point-desc">Native keep-awake architecture. The tablet screen never sleeps and keeps the encrypted QR refreshed.</div>
            </div>
          </div>
          <div class="kiosk-point">
            <div class="kiosk-icon">&#10003;</div>
            <div>
              <div class="kiosk-point-title">Dual Instant Authentication</div>
              <div class="kiosk-point-desc">Workers clock in by scanning their personalized badge/phone or entering their private 4-digit PIN.</div>
            </div>
          </div>
          <div class="kiosk-point">
            <div class="kiosk-icon">&#10003;</div>
            <div>
              <div class="kiosk-point-title">Multi-Location Centralized Hub</div>
              <div class="kiosk-point-desc">Deploy entrance terminals across HQ, regional branches, and warehouses, monitored from a single dashboard.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-footer">
      <div class="footer-contacts">
        <span>Phone: <strong>+40 757 77 77 12</strong></span>
        <span>Email: <strong>contact@getapp.ro</strong></span>
        <span>Web: <strong>www.getapp.ro</strong></span>
      </div>
      <div><span class="footer-badge">GETAPP SMART QR</span> &bull; Page 1 of 2 — Executive Brief</div>
    </div>
  </div>

  <!-- ==================== PAGE 2: LIVE HR DASHBOARD, AUTO-CLOSE & COMMERCIAL OFFER (ENGLISH) ==================== -->
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

      <!-- Live Analytics Dual Chart Card (Vector SVG) -->
      <div class="dashboard-analytics-card">
        <div class="dash-header-row">
          <div class="dash-header-left">
            <span class="live-pulse-dot"></span>
            <span class="dash-header-title">Live Management Console — Real-Time Visual Analytics</span>
          </div>
          <span class="dash-header-meta">Live Sync Active &bull; 55 Employees Enrolled</span>
        </div>

        <div class="charts-split">
          <!-- Donut Attendance Chart -->
          <div class="chart-box">
            <div class="chart-box-title">
              <span>Today's Attendance Status</span>
              <span style="color: #34d399; font-weight: 800;">48 / 55 On Site</span>
            </div>
            <div class="donut-layout">
              <svg width="86" height="86" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="rgba(255, 255, 255, 0.08)" stroke-width="12" fill="none"/>
                <!-- Green 87% -->
                <circle cx="50" cy="50" r="38" stroke="#10b981" stroke-width="12" fill="none"
                        stroke-dasharray="207 238.7" stroke-dashoffset="0" transform="rotate(-90 50 50)" stroke-linecap="round"/>
                <!-- Blue 7% -->
                <circle cx="50" cy="50" r="38" stroke="#38bdf8" stroke-width="12" fill="none"
                        stroke-dasharray="17 238.7" stroke-dashoffset="-209" transform="rotate(-90 50 50)"/>
                <!-- Red 6% -->
                <circle cx="50" cy="50" r="38" stroke="#f43f5e" stroke-width="12" fill="none"
                        stroke-dasharray="12 238.7" stroke-dashoffset="-227" transform="rotate(-90 50 50)"/>
                <text x="50" y="47" text-anchor="middle" font-size="14" font-weight="900" fill="#ffffff" font-family="'Plus Jakarta Sans'">88%</text>
                <text x="50" y="60" text-anchor="middle" font-size="7.5" font-weight="700" fill="#64748b" font-family="'Plus Jakarta Sans'">PRESENT</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item"><span class="legend-color" style="background: #10b981;"></span> <strong>48</strong> Present On Duty</div>
                <div class="legend-item"><span class="legend-color" style="background: #38bdf8;"></span> <strong>4</strong> Approved Leave</div>
                <div class="legend-item"><span class="legend-color" style="background: #f43f5e;"></span> <strong>3</strong> Unexcused Absences</div>
              </div>
            </div>
          </div>

          <!-- Weekly Area Chart -->
          <div class="chart-box">
            <div class="chart-box-title">
              <span>Weekly Logged Hours</span>
              <span style="color: #38bdf8; font-weight: 800;">412 Hours Total</span>
            </div>
            <svg width="100%" height="68" viewBox="0 0 240 68">
              <defs>
                <linearGradient id="areaGradEn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <line x1="20" y1="14" x2="230" y2="14" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 2"/>
              <line x1="20" y1="33" x2="230" y2="33" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 2"/>
              <line x1="20" y1="52" x2="230" y2="52" stroke="rgba(255,255,255,0.06)"/>
              
              <polygon points="30,52 30,34 75,21 125,27 175,11 220,17 220,52" fill="url(#areaGradEn)"/>
              <polyline points="30,34 75,21 125,27 175,11 220,17" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
              
              <circle cx="30" cy="34" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              <circle cx="75" cy="21" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              <circle cx="125" cy="27" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              <circle cx="175" cy="11" r="3.5" fill="#34d399" stroke="#ffffff" stroke-width="1.5"/>
              <circle cx="220" cy="17" r="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2"/>
              
              <text x="30" y="63" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">MON</text>
              <text x="75" y="63" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">TUE</text>
              <text x="125" y="63" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">WED</text>
              <text x="175" y="63" text-anchor="middle" font-size="7.5" font-weight="700" fill="#38bdf8" font-family="'Plus Jakarta Sans'">THU</text>
              <text x="220" y="63" text-anchor="middle" font-size="7" fill="#64748b" font-family="'Plus Jakarta Sans'">FRI</text>
            </svg>
          </div>
        </div>
      </div>

      <!-- Live Activity Table -->
      <div class="activity-feed-box">
        <table class="activity-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department / Role</th>
              <th>Scan Timestamp</th>
              <th>Access Terminal</th>
              <th>Current Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">AI</div>
                  <div><strong style="color: #ffffff;">Andrew Ionescu</strong> (EMP002)</div>
                </div>
              </td>
              <td>Chief Operating Officer</td>
              <td>08:02:14 AM</td>
              <td>Main Reception Terminal</td>
              <td><span class="badge-status green">Clocked In &bull; On Shift</span></td>
            </tr>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">CV</div>
                  <div><strong style="color: #ffffff;">Christian Vasile</strong> (EMP005)</div>
                </div>
              </td>
              <td>Logistics Specialist</td>
              <td>08:14:50 AM</td>
              <td>Gate 2 Warehouse Hub</td>
              <td><span class="badge-status green">Clocked In &bull; On Shift</span></td>
            </tr>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">ER</div>
                  <div><strong style="color: #ffffff;">Elena Radulescu</strong> (EMP001)</div>
                </div>
              </td>
              <td>Managing Director</td>
              <td>08:45:02 AM</td>
              <td>Main Reception Terminal</td>
              <td><span class="badge-status green">Clocked In &bull; On Shift</span></td>
            </tr>
            <tr>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">IP</div>
                  <div><strong style="color: #ffffff;">Joanna Popescu</strong> (EMP008)</div>
                </div>
              </td>
              <td>Human Resources Lead</td>
              <td>12:30:11 PM</td>
              <td>Floor 1 Kiosk Tablet</td>
              <td><span class="badge-status blue">Lunch Break</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Auto-Close Shift Feature Callout -->
      <div class="autoclose-dark-box">
        <div class="autoclose-dark-info">
          <h4>Smart Automation: Automatic Shift Closure (Auto-Close Shift)</h4>
          <p>
            If an employee forgets to clock out at the end of their workday, the platform automatically finalizes the timesheet at the scheduled shift cutoff, 
            completely removing calculation anomalies and hundreds of tedious manual HR corrections every month.
          </p>
        </div>
        <div class="toggle-ui-pill">
          <span>&#10003; ENABLED</span>
          <span style="font-size: 8px; opacity: 0.85;">(YES / NO)</span>
        </div>
      </div>

      <!-- Commercial Pricing Hero -->
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
          <div class="rollout-step-item green">
            <div class="rollout-step-header"><span>Step 2</span> <span>3 Mins</span></div>
            <div class="rollout-step-name">Activate Kiosk Tablet</div>
            <div class="rollout-step-text">Open the web link on the entrance tablet; zero app installation friction.</div>
          </div>
          <div class="rollout-step-item purple">
            <div class="rollout-step-header"><span>Step 3</span> <span>Instant</span></div>
            <div class="rollout-step-name">Automated Attendance</div>
            <div class="rollout-step-text">Employees scan in seconds; hours and overtime calculate in real time.</div>
          </div>
        </div>
      </div>

      <!-- Dark CTA Strip -->
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
      <div><span class="footer-badge">GETAPP SMART QR</span> &bull; Page 2 of 2 — Executive Brief</div>
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
  await new Promise(r => setTimeout(r, 2000)); // wait for fonts to render

  const pdfPath = path.join(__dirname, '../Prezentare_Executiva_Smart_QR_EN.pdf');
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

  console.log(`Successfully generated 2-page English Executive PDF at: ${pdfPath}`);

  // Save PNG preview of each page
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const pageElements = await page.$$('.page');
  for (let i = 0; i < pageElements.length; i++) {
    const previewPath = path.join(__dirname, `../pdf_en_page_${i + 1}.png`);
    await pageElements[i].screenshot({ path: previewPath });
    console.log(`Saved page preview: ${previewPath}`);
  }

  await browser.close();
  fs.unlinkSync(htmlPath);
}

buildEnglishPdf().catch(err => {
  console.error('Error generating English executive PDF:', err);
  process.exit(1);
});
