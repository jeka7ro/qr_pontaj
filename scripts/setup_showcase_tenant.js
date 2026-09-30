const fs = require('fs');
const path = require('path');
const https = require('https');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

const AVATAR_URLS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80', // woman, executive
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80', // man, smiling
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80', // woman, hr
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80', // man, ops
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80', // woman, corporate
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80', // man, tech lead
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80', // woman, finance
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80', // man, director
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80', // woman, designer
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80', // man, sales
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=256&h=256&q=80', // woman, legal
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80', // man, dev
  'https://images.unsplash.com/photo-1534751516642-a171edd20188?auto=format&fit=crop&w=256&h=256&q=80', // woman, marketing
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&h=256&q=80', // man, business
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80', // woman, account
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80', // man, manager
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80', // woman, support
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80', // man, analyst
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=256&h=256&q=80', // woman, operations
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80'  // man, logistics
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

const EMPLOYEES_DATA = [
  { first_name: 'ELENA', last_name: 'RADULESCU', job_title: 'DIRECTOR GENERAL', code: 'EMP001', gender: 'F' },
  { first_name: 'ANDREI', last_name: 'IONESCU', job_title: 'DIRECTOR OPERAȚIUNI', code: 'EMP002', gender: 'M' },
  { first_name: 'IOANA', last_name: 'POPESCU', job_title: 'MANAGER HR & RESURSE', code: 'EMP003', gender: 'F' },
  { first_name: 'CRISTIAN', last_name: 'VASILE', job_title: 'SPECIALIST LOGISTICĂ', code: 'EMP004', gender: 'M' },
  { first_name: 'MARIA', last_name: 'STANCIU', job_title: 'CONTABIL ȘEF', code: 'EMP005', gender: 'F' },
  { first_name: 'RADU', last_name: 'MIHAI', job_title: 'SENIOR SOFTWARE ENGINEER', code: 'EMP006', gender: 'M' },
  { first_name: 'ALEXANDRA', last_name: 'DUMITRESCU', job_title: 'CONSULTANT VÂNZĂRI', code: 'EMP007', gender: 'F' },
  { first_name: 'BOGDAN', last_name: 'GHEORGHIU', job_title: 'COORDONATOR ECHIPĂ', code: 'EMP008', gender: 'M' },
  { first_name: 'ANA-MARIA', last_name: 'VOINEA', job_title: 'PRODUCT DESIGNER', code: 'EMP009', gender: 'F' },
  { first_name: 'DRAGOȘ', last_name: 'CONSTANTIN', job_title: 'KEY ACCOUNT MANAGER', code: 'EMP010', gender: 'M' },
  { first_name: 'DIANA', last_name: 'NEAGU', job_title: 'SPECIALIST MARKETING', code: 'EMP011', gender: 'F' },
  { first_name: 'FLORIN', last_name: 'PETRESCU', job_title: 'INGINER SISTEM', code: 'EMP012', gender: 'M' },
  { first_name: 'GABRIELA', last_name: 'ENACHE', job_title: 'SPECIALIST RECRUTARE', code: 'EMP013', gender: 'F' },
  { first_name: 'MARIUS', last_name: 'COMAN', job_title: 'RESPONSABIL ACHIZIȚII', code: 'EMP014', gender: 'M' },
  { first_name: 'LAURA', last_name: 'DIACONU', job_title: 'CUSTOMER SUCCESS', code: 'EMP015', gender: 'F' },
  { first_name: 'VICTOR', last_name: 'STOICA', job_title: 'SUPORT TEHNIC L2', code: 'EMP016', gender: 'M' },
  { first_name: 'SIMONA', last_name: 'MARIN', job_title: 'ASISTENT MANAGER', code: 'EMP017', gender: 'F' },
  { first_name: 'GEORGE', last_name: 'DIMA', job_title: 'ANALIST DATE & RAPOARTE', code: 'EMP018', gender: 'M' },
  { first_name: 'CORINA', last_name: 'ALBU', job_title: 'OFICIU & ADMINISTRARE', code: 'EMP019', gender: 'F' },
  { first_name: 'ADRIAN', last_name: 'TOMA', job_title: 'OPERATOR MONITORIZARE', code: 'EMP020', gender: 'M' }
];

async function main() {
  const avatarsDir = path.join(__dirname, '../backend/uploads/avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  console.log('Downloading 20 professional avatar images...');
  for (let i = 0; i < AVATAR_URLS.length; i++) {
    const dest = path.join(avatarsDir, `showcase_avatar_${i + 1}.jpg`);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
      try {
        await downloadFile(AVATAR_URLS[i], dest);
        console.log(`Downloaded avatar ${i + 1}/20`);
      } catch (err) {
        console.error(`Failed downloading avatar ${i + 1}:`, err.message);
      }
    }
  }

  // Ensure GetApp Smart QR logo is copied to branding
  const brandingDir = path.join(__dirname, '../backend/uploads/branding');
  if (!fs.existsSync(brandingDir)) fs.mkdirSync(brandingDir, { recursive: true });
  const srcLogo = path.join(__dirname, '../logo_getapp_smartqr.jpg');
  const destLogo = path.join(brandingDir, 'getapp_smart_qr.jpg');
  if (fs.existsSync(srcLogo)) {
    fs.copyFileSync(srcLogo, destLogo);
    console.log('Copied getapp_smart_qr.jpg to branding uploads');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to DB...');

  // 1. Create or update Tenant 4: GetApp Smart QR
  const checkTenant = await client.query(`SELECT id FROM qrp_tenants WHERE id = 4`);
  const tenantModules = {
    erp: true,
    assets: true,
    leaves: true,
    shifts: true,
    billing: true,
    offline: true,
    revisal: true,
    geofence: true,
    whatsapp: true,
    export_saga: true,
    show_upsells: false,
    face_recognition: true
  };

  if (checkTenant.rows.length === 0) {
    await client.query(`
      INSERT INTO qrp_tenants (id, name, logo_url, favicon_url, theme_color, subdomain, modules, portal_bg_image_url, portal_bg_color)
      VALUES (4, 'GetApp Smart QR', '/logos/getapp_smart_qr.jpg', '/logos/getapp_smart_qr.jpg', '#2563EB', 'smartqr', $1, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80', '#020617')
    `, [JSON.stringify(tenantModules)]);
    console.log('Created Tenant 4: GetApp Smart QR');
  } else {
    await client.query(`
      UPDATE qrp_tenants 
      SET name = 'GetApp Smart QR',
          logo_url = '/logos/getapp_smart_qr.jpg',
          favicon_url = '/logos/getapp_smart_qr.jpg',
          theme_color = '#2563EB',
          subdomain = 'smartqr',
          modules = $1,
          portal_bg_image_url = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
          portal_bg_color = '#020617'
      WHERE id = 4
    `, [JSON.stringify(tenantModules)]);
    console.log('Updated Tenant 4: GetApp Smart QR');
  }

  // 2. User for Tenant 4
  const checkUser = await client.query(`SELECT id FROM qrp_users WHERE email = 'demo@smartqr.ro'`);
  if (checkUser.rows.length === 0) {
    await client.query(`
      INSERT INTO qrp_users (email, password_hash, role, tenant_id, name)
      VALUES ('demo@smartqr.ro', '$2b$10$tQ2i2jrRLMesAQuO27kyieB8SL0kfoTP8yuxYKACacmAp6QtvMx0.', 'TENANT_ADMIN', 4, 'GetApp Admin')
    `);
    console.log('Created user demo@smartqr.ro');
  }

  // 3. Location for Tenant 4
  let locRes = await client.query(`SELECT id FROM qrp_locations WHERE tenant_id = 4 LIMIT 1`);
  let locationId;
  if (locRes.rows.length === 0) {
    const newLoc = await client.query(`
      INSERT INTO qrp_locations (tenant_id, name, address)
      VALUES (4, 'Sediu Central', 'Strada Tehnologiei 10, București')
      RETURNING id
    `);
    locationId = newLoc.rows[0].id;
    console.log('Created Location Sediu Central:', locationId);
  } else {
    locationId = locRes.rows[0].id;
  }

  // 4. Kiosk for Tenant 4
  let kioskRes = await client.query(`SELECT id FROM qrp_kiosks WHERE tenant_id = 4 LIMIT 1`);
  if (kioskRes.rows.length === 0) {
    await client.query(`
      INSERT INTO qrp_kiosks (tenant_id, location_id, name, kiosk_title, kiosk_subtitle, kiosk_show_photo, kiosk_timer_color, kiosk_bg_color, kiosk_orientation)
      VALUES (4, $1, 'Terminal Intrare Kiosk', 'Terminal Inteligent GetApp Smart QR', 'Apropiați codul QR de cameră pentru pontaj instantaneu', true, '#2563EB', '#020617', 'landscape')
    `, [locationId]);
    console.log('Created Kiosk for Tenant 4');
  } else {
    await client.query(`
      UPDATE qrp_kiosks
      SET kiosk_title = 'Terminal Inteligent GetApp Smart QR',
          kiosk_subtitle = 'Apropiați codul QR de cameră pentru pontaj instantaneu',
          kiosk_show_photo = true,
          kiosk_timer_color = '#2563EB',
          kiosk_bg_color = '#020617',
          kiosk_logo_x = 6,
          kiosk_logo_y = 6,
          kiosk_logo_size = 3,
          kiosk_logo_bg = '#ffffff',
          kiosk_show_logo_bg = true
      WHERE id = $1
    `, [kioskRes.rows[0].id]);
    console.log('Updated Kiosk for Tenant 4');
  }

  // 5. Employees for Tenant 4
  await client.query(`DELETE FROM qrp_timesheets WHERE tenant_id = 4`);
  await client.query(`DELETE FROM qrp_employees WHERE tenant_id = 4`);
  console.log('Cleared existing employees for Tenant 4');

  const createdEmpIds = [];
  for (let i = 0; i < EMPLOYEES_DATA.length; i++) {
    const e = EMPLOYEES_DATA[i];
    const avatarPath = `/uploads/avatars/showcase_avatar_${i + 1}.jpg`;
    const cnpPrefix = e.gender === 'F' ? '288' : '188';
    const cnp = `${cnpPrefix}0${(i % 9) + 1}15${100000 + i}`;
    const pin = String(1100 + i).slice(0, 4);
    const ins = await client.query(`
      INSERT INTO qrp_employees (
        tenant_id, cnp, first_name, last_name, job_title, employee_code, pin_code, avatar_path, location_id, work_schedule, salary
      ) VALUES (
        4, $1, $2, $3, $4, $5, $6, $7, $8, '09:00 - 17:00', 5000
      ) RETURNING id
    `, [cnp, e.first_name, e.last_name, e.job_title, e.code, pin, avatarPath, locationId]);
    createdEmpIds.push(ins.rows[0].id);
  }
  console.log(`Created ${createdEmpIds.length} employees with real photos!`);

  // 6. Punches for today
  // Now is around 17:50
  // Employee 0: Elena Radulescu -> Clocked in at 08:45 -> Active > 8h, OVERTIME +45m!
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Elena: IN at 08:45
  const tElenaIn = new Date(`${todayStr}T08:45:00+03:00`);
  await client.query(`
    INSERT INTO qrp_timesheets (tenant_id, employee_id, site_id, action_type, created_at, is_manual)
    VALUES (4, $1, $2, 'IN', $3, false)
  `, [createdEmpIds[0], locationId, tElenaIn.toISOString()]);

  // Andrei: IN at 09:12 (Active ~8h 40m or in schedule)
  const tAndreiIn = new Date(`${todayStr}T09:12:00+03:00`);
  await client.query(`
    INSERT INTO qrp_timesheets (tenant_id, employee_id, site_id, action_type, created_at, is_manual)
    VALUES (4, $1, $2, 'IN', $3, false)
  `, [createdEmpIds[1], locationId, tAndreiIn.toISOString()]);

  // Ioana: IN at 12:30 (Active ~5h 20m)
  const tIoanaIn = new Date(`${todayStr}T12:30:00+03:00`);
  await client.query(`
    INSERT INTO qrp_timesheets (tenant_id, employee_id, site_id, action_type, created_at, is_manual)
    VALUES (4, $1, $2, 'IN', $3, false)
  `, [createdEmpIds[2], locationId, tIoanaIn.toISOString()]);

  // Cristian: IN at 14:15 (Active ~3h 35m)
  const tCristianIn = new Date(`${todayStr}T14:15:00+03:00`);
  await client.query(`
    INSERT INTO qrp_timesheets (tenant_id, employee_id, site_id, action_type, created_at, is_manual)
    VALUES (4, $1, $2, 'IN', $3, false)
  `, [createdEmpIds[3], locationId, tCristianIn.toISOString()]);

  // Maria: IN at 08:00, OUT at 16:30 (Tură încheiată / Plecați)
  const tMariaIn = new Date(`${todayStr}T08:00:00+03:00`);
  const tMariaOut = new Date(`${todayStr}T16:30:00+03:00`);
  await client.query(`
    INSERT INTO qrp_timesheets (tenant_id, employee_id, site_id, action_type, created_at, is_manual)
    VALUES 
      (4, $1, $2, 'IN', $3, false),
      (4, $1, $2, 'OUT', $4, false)
  `, [createdEmpIds[4], locationId, tMariaIn.toISOString(), tMariaOut.toISOString()]);

  // Radu: IN at 08:30, OUT at 17:00 (Tură încheiată / Plecați)
  const tRaduIn = new Date(`${todayStr}T08:30:00+03:00`);
  const tRaduOut = new Date(`${todayStr}T17:00:00+03:00`);
  await client.query(`
    INSERT INTO qrp_timesheets (tenant_id, employee_id, site_id, action_type, created_at, is_manual)
    VALUES 
      (4, $1, $2, 'IN', $3, false),
      (4, $1, $2, 'OUT', $4, false)
  `, [createdEmpIds[5], locationId, tRaduIn.toISOString(), tRaduOut.toISOString()]);

  console.log('Showcase setup completed successfully!');
  await client.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
