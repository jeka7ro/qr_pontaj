const path = require('path');
const puppeteer = require(path.join(__dirname, '../backend/node_modules/puppeteer-core'));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1200']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5188/', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: 'top_viewport_preview.png', clip: { x: 0, y: 0, width: 1440, height: 900 } });
  console.log('Saved top_viewport_preview.png');

  const heroSection = await page.$('#hero');
  if (heroSection) {
    await heroSection.screenshot({ path: 'hero_section.png' });
    console.log('Saved hero_section.png');
  }

  const videoSection = await page.$('#video');
  if (videoSection) {
    await videoSection.screenshot({ path: 'video_section.png' });
    console.log('Saved video_section.png');
  }

  const simulatorSection = await page.$('#simulator');
  if (simulatorSection) {
    await simulatorSection.screenshot({ path: 'simulator_section.png' });
    console.log('Saved simulator_section.png');
  }

  const dashboardSection = await page.$('#dashboard');
  if (dashboardSection) {
    await dashboardSection.screenshot({ path: 'dashboard_section.png' });
    console.log('Saved dashboard_section.png');
  }

  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
