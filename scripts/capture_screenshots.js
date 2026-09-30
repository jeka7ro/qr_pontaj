const path = require('path');
const puppeteer = require(path.join(__dirname, '../backend/node_modules/puppeteer-core'));
const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

const token = jwt.sign(
  { id: 9, email: 'demo@smartqr.ro', role: 'TENANT_ADMIN', tenant_id: 4, name: 'GetApp Admin' },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5188/admin/login', { waitUntil: 'networkidle2' });
  console.log('At login, setting storage...');
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify({
      id: 9,
      email: 'demo@smartqr.ro',
      role: 'TENANT_ADMIN',
      tenant_id: 4,
      name: 'GetApp Admin'
    }));
    localStorage.setItem('theme', 'light');
    localStorage.setItem('qrp_gdpr_acknowledged', 'true');
    document.documentElement.classList.remove('dark');
  }, token);

  // 1. Dashboard
  await page.goto('http://localhost:5188/admin/dashboard', { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.setItem('qrp_gdpr_acknowledged', 'true'));
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(__dirname, '../screenshot_dashboard.png') });
  console.log('Saved screenshot_dashboard.png');

  // Scroll to live table header and capture
  await page.evaluate(() => {
    window.scrollTo(0, 440);
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(__dirname, '../screenshot_live_table.png') });
  console.log('Saved screenshot_live_table.png');

  // 2. Employees Module (HR)
  await page.goto('http://localhost:5188/admin/employees', { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.setItem('qrp_gdpr_acknowledged', 'true'));
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(__dirname, '../screenshot_employees.png') });
  console.log('Saved screenshot_employees.png');

  // 3. Timesheet Report
  await page.goto('http://localhost:5188/admin/timesheets', { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.setItem('qrp_gdpr_acknowledged', 'true'));
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(__dirname, '../screenshot_timesheets.png') });
  console.log('Saved screenshot_timesheets.png');

  // 4. Kiosk Display (Tablet screen)
  try {
    await page.goto('http://localhost:5188/kiosk/4/3', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(__dirname, '../screenshot_kiosk_display.png') });
    console.log('Saved screenshot_kiosk_display.png');
  } catch (e) {
    console.log('Kiosk display error:', e.message);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
