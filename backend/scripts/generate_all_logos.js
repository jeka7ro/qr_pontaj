const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // 1. Square Avatar for Google: Blue QR icon + 'Pontaj.app' underneath, inside safe circular zone
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  const htmlSquare = `<!DOCTYPE html>
  <html>
  <head>
    <link href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@900&display=swap' rel='stylesheet'>
    <style>
      body {
        margin: 0; padding: 0;
        width: 512px; height: 512px;
        background: #0f172a;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      }
      .icon {
        width: 170px; height: 170px;
        border-radius: 46px;
        background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 16px 40px rgba(37,99,235,0.45);
        margin-bottom: 24px;
      }
      .icon svg {
        width: 95px; height: 95px;
        stroke: #ffffff; stroke-width: 2.2;
        fill: none; stroke-linecap: round; stroke-linejoin: round;
      }
      .text {
        font-size: 46px; font-weight: 900;
        color: #ffffff; letter-spacing: -1.2px;
        line-height: 1;
      }
      .text span { color: #3b82f6; }
    </style>
  </head>
  <body>
    <div class='icon'>
      <svg viewBox='0 0 24 24'>
        <rect width='5' height='5' x='3' y='3' rx='1'></rect>
        <rect width='5' height='5' x='16' y='3' rx='1'></rect>
        <rect width='5' height='5' x='3' y='16' rx='1'></rect>
        <path d='M21 16h-3a2 2 0 0 0-2 2v3'></path>
        <path d='M21 21v.01'></path>
        <path d='M12 7v3a2 2 0 0 1-2 2H7'></path>
        <path d='M3 12h.01'></path>
        <path d='M12 3h.01'></path>
        <path d='M12 16v.01'></path>
        <path d='M16 12h1'></path>
        <path d='M21 12v.01'></path>
        <path d='M12 21v-1'></path>
      </svg>
    </div>
    <div class='text'>Pontaj<span>.app</span></div>
  </body>
  </html>`;

  await page.setContent(htmlSquare, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(__dirname, '../../logo_google_cu_text.png') });
  console.log('Saved logo_google_cu_text.png');

  // 2. Varianta pe fundal alb pentru Google
  const htmlSquareWhite = htmlSquare
    .replace('background: #0f172a;', 'background: #ffffff;')
    .replace('color: #ffffff;', 'color: #0f172a;');
  await page.setContent(htmlSquareWhite, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(__dirname, '../../logo_google_fundal_alb.png') });
  console.log('Saved logo_google_fundal_alb.png');

  // 3. Horizontal Full Logo (Icon + Text side-by-side)
  await page.setViewport({ width: 500, height: 140, deviceScaleFactor: 2 });
  const htmlHoriz = `<!DOCTYPE html>
  <html>
  <head>
    <link href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@900&display=swap' rel='stylesheet'>
    <style>
      body {
        margin: 0; padding: 20px;
        background: transparent;
        display: inline-flex; align-items: center; gap: 18px;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      }
      .icon {
        width: 72px; height: 72px;
        border-radius: 22px;
        background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 10px 24px rgba(37,99,235,0.35);
      }
      .icon svg {
        width: 40px; height: 40px;
        stroke: #ffffff; stroke-width: 2.2;
        fill: none; stroke-linecap: round; stroke-linejoin: round;
      }
      .text {
        font-size: 52px; font-weight: 900;
        color: #0f172a; letter-spacing: -1.4px;
        line-height: 1;
      }
      .text span { color: #2563eb; }
    </style>
  </head>
  <body>
    <div class='icon'>
      <svg viewBox='0 0 24 24'>
        <rect width='5' height='5' x='3' y='3' rx='1'></rect>
        <rect width='5' height='5' x='16' y='3' rx='1'></rect>
        <rect width='5' height='5' x='3' y='16' rx='1'></rect>
        <path d='M21 16h-3a2 2 0 0 0-2 2v3'></path>
        <path d='M21 21v.01'></path>
        <path d='M12 7v3a2 2 0 0 1-2 2H7'></path>
        <path d='M3 12h.01'></path>
        <path d='M12 3h.01'></path>
        <path d='M12 16v.01'></path>
        <path d='M16 12h1'></path>
        <path d='M21 12v.01'></path>
        <path d='M12 21v-1'></path>
      </svg>
    </div>
    <div class='text'>Pontaj<span>.app</span></div>
  </body>
  </html>`;

  await page.setContent(htmlHoriz, { waitUntil: 'networkidle0' });
  const bodyEl = await page.$('body');
  await bodyEl.screenshot({ path: path.join(__dirname, '../../logo_complet.png'), omitBackground: true });
  console.log('Saved logo_complet.png');

  await browser.close();
})();
