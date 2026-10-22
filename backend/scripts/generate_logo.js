const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 340, height: 90, deviceScaleFactor: 2 });
  
  // 1. Logo pentru fundal închis (Dark Header)
  const htmlDark = `
  <!DOCTYPE html>
  <html>
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800;900&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background: transparent;
        display: flex;
        align-items: center;
        height: 100vh;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      }
      .logo-box {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
      }
      .icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(37,99,235,0.35);
      }
      .icon svg {
        width: 25px;
        height: 25px;
        stroke: #ffffff;
        stroke-width: 2.3;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .text {
        font-size: 26px;
        font-weight: 900;
        color: #ffffff;
        letter-spacing: -0.5px;
      }
      .text span {
        color: #60a5fa;
      }
    </style>
  </head>
  <body>
    <div class="logo-box" id="logo">
      <div class="icon">
        <svg viewBox="0 0 24 24">
          <rect width="5" height="5" x="3" y="3" rx="1"></rect>
          <rect width="5" height="5" x="16" y="3" rx="1"></rect>
          <rect width="5" height="5" x="3" y="16" rx="1"></rect>
          <path d="M21 16h-3a2 2 0 0 0-2 2v3"></path>
          <path d="M21 21v.01"></path>
          <path d="M12 7v3a2 2 0 0 1-2 2H7"></path>
          <path d="M3 12h.01"></path>
          <path d="M12 3h.01"></path>
          <path d="M12 16v.01"></path>
          <path d="M16 12h1"></path>
          <path d="M21 12v.01"></path>
          <path d="M12 21v-1"></path>
        </svg>
      </div>
      <div class="text">Pontaj<span>.app</span></div>
    </div>
  </body>
  </html>
  `;
  
  await page.setContent(htmlDark, { waitUntil: 'networkidle0' });
  const elDark = await page.$('#logo');
  const bufferDark = await elDark.screenshot({ omitBackground: true });
  
  const targetDir1 = path.join(__dirname, '../uploads/branding');
  const targetDir2 = path.join(__dirname, '../../frontend/public');
  if (!fs.existsSync(targetDir1)) fs.mkdirSync(targetDir1, { recursive: true });
  
  fs.writeFileSync(path.join(targetDir1, 'logo_pontaj_app_dark.png'), bufferDark);
  fs.writeFileSync(path.join(targetDir2, 'logo_pontaj_app_dark.png'), bufferDark);

  // 2. Logo pentru fundal deschis (Light Background)
  const htmlLight = htmlDark
    .replace('color: #ffffff;', 'color: #0f172a;')
    .replace('color: #60a5fa;', 'color: #2563eb;');
  
  await page.setContent(htmlLight, { waitUntil: 'networkidle0' });
  const elLight = await page.$('#logo');
  const bufferLight = await elLight.screenshot({ omitBackground: true });
  
  fs.writeFileSync(path.join(targetDir1, 'logo_pontaj_app_light.png'), bufferLight);
  fs.writeFileSync(path.join(targetDir2, 'logo_pontaj_app_light.png'), bufferLight);
  
  console.log('Ambele versiuni de logo Pontaj.app au fost generate cu succes!');
  await browser.close();
  process.exit(0);
})().catch(e => {
  console.error('Eroare generare logo:', e);
  process.exit(1);
});
