const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // 512x512 for Google Profile Picture / Gmail Avatar
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });

  // Exact circle from user's screenshot: rounded-full with blue to indigo/purple gradient and white QR
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        width: 512px;
        height: 512px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .circle {
        width: 460px;
        height: 460px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 16px 40px rgba(37, 99, 235, 0.35);
      }
      .circle svg {
        width: 250px;
        height: 250px;
        stroke: #ffffff;
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    </style>
  </head>
  <body>
    <div class="circle">
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
  </body>
  </html>`;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // 1. Transparent background (circle with transparent padding)
  await page.screenshot({
    path: path.join(__dirname, '../../logo_gmail.png'),
    omitBackground: true
  });
  console.log('Saved logo_gmail.png');

  // 2. White background version
  await page.evaluate(() => {
    document.body.style.background = '#ffffff';
  });
  await page.screenshot({
    path: path.join(__dirname, '../../logo_gmail_alb.png'),
    omitBackground: false
  });
  console.log('Saved logo_gmail_alb.png');

  // 3. Full bleed circle (512x512)
  await page.evaluate(() => {
    document.body.style.background = 'transparent';
    const c = document.querySelector('.circle');
    c.style.width = '512px';
    c.style.height = '512px';
    c.style.boxShadow = 'none';
    c.querySelector('svg').style.width = '280px';
    c.querySelector('svg').style.height = '280px';
  });
  await page.screenshot({
    path: path.join(__dirname, '../../logo_gmail_plin.png'),
    omitBackground: true
  });
  console.log('Saved logo_gmail_plin.png');

  await browser.close();
  console.log('Done generating Gmail icons.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
