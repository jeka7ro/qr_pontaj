const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const router = express.Router();
const db = require('../db');
const pool = db; // mapăm pool la db direct ca să meargă în restul codului
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shiftsRouter = require('./shifts');
const leavesRouter = require('./leaves');
const sagaRouter = require('./saga');
const billingRouter = require('./billing');
const revisalRouter = require('./revisal');
const erpRouter = require('./erp');
const whatsappRouter = require('./whatsapp');
const assetsRouter = require('./assets');
const hardwareScanRouter = require('./hardwareScan');
const { evaluateModules } = require('../utils/modulesHelper');

const storage = multer.memoryStorage();
const upload = multer({ storage });
const supabase = require('../supabaseClient');

const uploadToSupabase = async (file, folder = 'avatars') => {
  if (!file) return null;
  const fileName = `${folder}/${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });
    
  if (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
  
  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);
    
  return publicUrlData.publicUrl;
};

const sanitizeFaviconUrl = (url) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  if (
    trimmed.startsWith('data:') || 
    trimmed.startsWith('/uploads') ||
    trimmed.match(/\.(ico|png|jpg|jpeg|svg|webp)($|\?)/i) ||
    trimmed.includes('google.com/s2/favicons') ||
    trimmed.includes('gstatic.com/faviconV2')
  ) {
    return trimmed;
  }
  
  try {
    let hostname = trimmed;
    if (!hostname.startsWith('http://') && !hostname.startsWith('https://')) {
      hostname = 'https://' + hostname;
    }
    const parsed = new URL(hostname);
    const domain = parsed.hostname.replace(/^www\./, '');
    if (domain && domain.includes('.')) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
    return trimmed;
  } catch (e) {
    return trimmed;
  }
};

// POST /api/tenants/upload-branding - Încărcare imagini branding (Logo, Favicon, Fundal)
router.post('/upload-branding', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Niciun fișier trimis.' });
    }
    
    // Încercăm Supabase Storage mai întâi
    try {
      const publicUrl = await uploadToSupabase(req.file, 'branding');
      if (publicUrl) {
        return res.json({ url: publicUrl });
      }
    } catch (supaErr) {
      console.warn('Supabase upload warning, fallback to local:', supaErr.message);
    }
    
    // Fallback: stocare locală în uploads/branding
    const uploadsDir = path.join(__dirname, '../uploads/branding');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(req.file.originalname) || '.png';
    const localFileName = `branding_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadsDir, localFileName);
    fs.writeFileSync(filePath, req.file.buffer);
    
    const localUrl = `/uploads/branding/${localFileName}`;
    return res.json({ url: localUrl });
  } catch (err) {
    console.error('Upload branding error:', err);
    res.status(500).json({ error: 'Eroare la încărcarea fișierului.' });
  }
});

// GET /api/tenants/public-branding - Preluare branding public (logo, fundal, culori) pentru login și portal
router.get('/public-branding', async (req, res) => {
  try {
    let { subdomain, email, tenantId } = req.query;

    // Detectare din host header dacă nu este trimis explicit
    if (!subdomain && !email && !tenantId) {
      const host = req.headers['x-forwarded-host'] || req.headers.host || '';
      const parts = host.split('.');
      if (parts.length >= 3 && !['localhost', 'qr', 'scan', 'pontaj', 'up', 'www'].includes(parts[0])) {
        subdomain = parts[0];
      }
    }

    let tenant = null;

    if (tenantId) {
      const result = await pool.query(
        'SELECT id, name, subdomain, logo_url, favicon_url, theme_color, portal_bg_color, portal_bg_image_url FROM qrp_tenants WHERE id = $1',
        [tenantId]
      );
      if (result.rows.length > 0) tenant = result.rows[0];
    }

    if (!tenant && subdomain) {
      const result = await pool.query(
        'SELECT id, name, subdomain, logo_url, favicon_url, theme_color, portal_bg_color, portal_bg_image_url FROM qrp_tenants WHERE LOWER(subdomain) = LOWER($1)',
        [subdomain.trim()]
      );
      if (result.rows.length > 0) tenant = result.rows[0];
    }

    if (!tenant && email && email.includes('@')) {
      // Căutare tenant după utilizatorul înregistrat
      const userRes = await pool.query(
        'SELECT tenant_id FROM qrp_users WHERE LOWER(email) = LOWER($1)',
        [email.trim()]
      );
      if (userRes.rows.length > 0 && userRes.rows[0].tenant_id) {
        const result = await pool.query(
          'SELECT id, name, subdomain, logo_url, favicon_url, theme_color, portal_bg_color, portal_bg_image_url FROM qrp_tenants WHERE id = $1',
          [userRes.rows[0].tenant_id]
        );
        if (result.rows.length > 0) tenant = result.rows[0];
      }
      
      if (!tenant) {
        // Fallback: căutare după domeniul de email (ex: admin@unda.ro -> unda)
        const domainMatch = email.trim().split('@')[1];
        if (domainMatch) {
          const rootName = domainMatch.split('.')[0];
          const result = await pool.query(
            'SELECT id, name, subdomain, logo_url, favicon_url, theme_color, portal_bg_color, portal_bg_image_url FROM qrp_tenants WHERE LOWER(subdomain) = LOWER($1) OR LOWER(name) ILIKE $2',
            [rootName, `%${rootName}%`]
          );
          if (result.rows.length > 0) tenant = result.rows[0];
        }
      }
    }

    if (!tenant) {
      return res.json({ found: false });
    }

    let logoUrl = tenant.logo_url;
    if (logoUrl && logoUrl.includes('/webp-express/webp-images/') && logoUrl.endsWith('.webp')) {
      logoUrl = logoUrl.replace('/webp-express/webp-images/', '/').replace(/\.webp$/, '');
    }

    res.json({
      found: true,
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      logo_url: logoUrl,
      favicon_url: tenant.favicon_url,
      theme_color: tenant.theme_color || '#2563EB',
      portal_bg_color: tenant.portal_bg_color || null,
      portal_bg_image_url: tenant.portal_bg_image_url || null
    });
  } catch (error) {
    console.error('Error in public-branding:', error);
    res.status(500).json({ error: 'Eroare la preluarea setărilor de branding.' });
  }
});

// Mount sub-routers
router.use('/:id/shifts', shiftsRouter);
router.use('/:id/leaves', leavesRouter);
router.use('/:id/saga', sagaRouter);
router.use('/:id/billing', billingRouter);
router.use('/:id/revisal', revisalRouter);
router.use('/:id/erp', erpRouter);
router.use('/:id/whatsapp', whatsappRouter);
router.use('/:id/assets', assetsRouter);
router.use('/:id/hardware-scan', hardwareScanRouter);

// GET /api/tenants - Lista de tenanți și detaliile lor
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id, t.name as nume, t.subdomain, t.theme_color as culoare, t.logo_url, t.favicon_url, t.modules,
        s.qr_mode as mod_qr, s.allowed_radius_meters as raza_gps, s.name as tip_modul
      FROM qrp_tenants t
      LEFT JOIN qrp_sites s ON s.tenant_id = t.id
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    
    // Evaluate modules expiration for each tenant
    const processedRows = result.rows.map(row => ({
      ...row,
      modules: evaluateModules(row.modules)
    }));
    
    res.json(processedRows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Eroare la preluarea tenanților' });
  }
});

// POST /api/tenants - Creare tenant nou (Tranzacție)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      nume_locatie, 
      nume_admin,
      tip_modul, 
      culoare_tema, 
      logo_url, 
      favicon_url,
      email_admin,
      parola_initiala,
      distanta_gps,
      mod_qr,
      modules
    } = req.body;

    // 1. Validare simplă
    if (!nume_locatie || !email_admin || !parola_initiala) {
      return res.status(400).json({ error: 'Nume locație, email și parola sunt obligatorii' });
    }

    await client.query('BEGIN'); // Start transaction

    // 2. Inserare în qrp_tenants
    const subdomain = nume_locatie.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tenantQuery = `
      INSERT INTO qrp_tenants (name, logo_url, favicon_url, theme_color, subdomain, modules)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const tenantResult = await client.query(tenantQuery, [
      nume_locatie,
      logo_url || null,
      sanitizeFaviconUrl(favicon_url),
      culoare_tema || '#2563EB',
      subdomain,
      modules || {}
    ]);
    const tenantId = tenantResult.rows[0].id;

    // 3. Inserare în qrp_sites (O singură locație inițială per tenant creat)
    const siteQuery = `
      INSERT INTO qrp_sites (tenant_id, name, qr_mode, allowed_radius_meters)
      VALUES ($1, $2, $3, $4)
    `;
    await client.query(siteQuery, [
      tenantId,
      'Punct de Lucru Principal',
      mod_qr || 'STATIC',
      distanta_gps ? parseInt(distanta_gps, 10) : 100
    ]);

    // 4. Inserare în qrp_users (Administratorul local)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(parola_initiala, saltRounds);
    
    // Generare token securizat pentru posibilitatea setării/schimbării parolei imediat (48 ore valabilitate)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const userQuery = `
      INSERT INTO qrp_users (tenant_id, email, password_hash, role, reset_token, reset_token_expires, name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await client.query(userQuery, [
      tenantId,
      email_admin,
      passwordHash,
      'TENANT_ADMIN',
      resetToken,
      resetTokenExpires,
      nume_admin || nume_locatie
    ]);

    await client.query('COMMIT'); // Commit transaction

    // Determinare URL frontend pentru linkuri din email - OBLIGATORIU domeniu public de producție (NICIODATĂ localhost)
    const baseDomain = process.env.BASE_DOMAIN || 'qr.pontaj.app';
    const tenantDomain = subdomain ? `https://${subdomain}.${baseDomain}` : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost') ? process.env.FRONTEND_URL : `https://${baseDomain}`);

    const resetPasswordUrl = `${tenantDomain}/reset-password?token=${resetToken}`;
    const loginUrl = `${tenantDomain}/login`;

    // Trimitem emailul de bun venit asincron (fara emoji, cu logo tenant si culori tenant)
    emailService.sendWelcomeEmail({
      to: email_admin,
      userName: nume_admin || nume_locatie,
      companyName: nume_locatie,
      tenantLogo: logo_url || null,
      themeColor: culoare_tema || '#2563EB',
      loginUrl,
      resetPasswordUrl,
      initialPassword: parola_initiala,
      subdomain
    }).catch(err => console.error('[TenantCreate] Eroare trimitere welcome email:', err));

    res.status(201).json({ 
      message: 'Tenant creat cu succes',
      tenantId 
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback pe eroare
    console.error('Transaction error:', error);
    
    // Verificare eroare de duplicat email
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Acest email este deja folosit' });
    }
    
    res.status(500).json({ error: 'Eroare la crearea tenant-ului' });
  } finally {
    client.release();
  }
});

// GET /api/tenants/subdomain/:subdomain - Detalii tenant prin subdomeniu
router.get('/subdomain/:subdomain', async (req, res) => {
  try {
    const sub = req.params.subdomain.replace(/-/g, '').toLowerCase();
    const query = `
      SELECT t.id, t.name, t.subdomain, t.logo_url, t.favicon_url, t.theme_color, t.portal_bg_image_url, t.portal_bg_color
      FROM qrp_tenants t
      WHERE LOWER(t.subdomain) = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [sub]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant nu a fost găsit' });
    }
    const tenant = result.rows[0];
    if (tenant.modules) tenant.modules = evaluateModules(tenant.modules);
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant by subdomain:', error);
    res.status(500).json({ error: 'Eroare server' });
  }
});

// GET /api/tenants/:id - Detalii tenant
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT t.id, t.name, t.subdomain, t.logo_url, t.favicon_url, t.theme_color, t.modules, t.portal_bg_image_url, t.portal_bg_color,
             s.qr_mode 
      FROM qrp_tenants t
      LEFT JOIN qrp_sites s ON s.tenant_id = t.id
      WHERE t.id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant nu a fost găsit' });
    }
    
    const tenant = result.rows[0];
    if (tenant.modules) tenant.modules = evaluateModules(tenant.modules);
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Eroare la preluarea tenantului' });
  }
});

// PUT /api/tenants/:id/portal-settings - Update fundal portal angajați (accesat de tenant)
router.put('/:id/portal-settings', async (req, res) => {
  try {
    const { portal_bg_image_url, portal_bg_color } = req.body;
    const result = await pool.query(
      `UPDATE qrp_tenants 
       SET portal_bg_image_url = $1, portal_bg_color = $2 
       WHERE id = $3 RETURNING *`,
      [portal_bg_image_url || null, portal_bg_color || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant nu a fost găsit' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating portal settings:', error);
    res.status(500).json({ error: 'Eroare la salvarea setărilor portalului' });
  }
});

// GET /api/tenants/:id/admins - Lista de admini pentru un tenant
router.get('/:id/admins', async (req, res) => {
  try {
    const query = `
      SELECT id, email, name, created_at 
      FROM qrp_users 
      WHERE tenant_id = $1 AND role = 'TENANT_ADMIN'
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Eroare la preluarea adminilor' });
  }
});

// POST /api/tenants/:id/admins - Adaugă un nou admin pentru un tenant
router.post('/:id/admins', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Setăm și active_domain pe baza tenantului curent
    const tenantRes = await pool.query('SELECT name, subdomain, logo_url, theme_color FROM qrp_tenants WHERE id = $1', [req.params.id]);
    let activeDomain = null;
    let tenantName = 'Companie';
    let tenantLogo = null;
    let themeColor = '#2563EB';
    if (tenantRes.rows.length > 0) {
       tenantName = tenantRes.rows[0].name || 'Companie';
       tenantLogo = tenantRes.rows[0].logo_url || null;
       themeColor = tenantRes.rows[0].theme_color || '#2563EB';
       activeDomain = `${tenantRes.rows[0].subdomain}.qr.pontaj.app`;
    }

    // Generare token securizat pentru posibilitatea setării/schimbării parolei imediat (48 ore)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const query = `
      INSERT INTO qrp_users (tenant_id, email, password_hash, role, active_domain, reset_token, reset_token_expires, name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, name, created_at
    `;
    const result = await pool.query(query, [req.params.id, email, passwordHash, 'TENANT_ADMIN', activeDomain, resetToken, resetTokenExpires, name || email.split('@')[0]]);
    
    // Determinare URL frontend pentru linkuri din email - OBLIGATORIU domeniu public de producție (NICIODATĂ localhost)
    const baseDomain = process.env.BASE_DOMAIN || 'qr.pontaj.app';
    const subdomain = tenantRes.rows[0]?.subdomain;
    const tenantDomain = subdomain ? `https://${subdomain}.${baseDomain}` : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost') ? process.env.FRONTEND_URL : `https://${baseDomain}`);

    const resetPasswordUrl = `${tenantDomain}/reset-password?token=${resetToken}`;
    const loginUrl = `${tenantDomain}/login`;

    // Trimitem emailul de bun venit asincron (fara emoji, cu logo tenant si culori tenant)
    emailService.sendWelcomeEmail({
      to: email,
      userName: name || email.split('@')[0],
      companyName: tenantName,
      tenantLogo: tenantLogo,
      themeColor: themeColor,
      loginUrl,
      resetPasswordUrl,
      initialPassword: password,
      subdomain
    }).catch(err => console.error('[TenantAdminCreate] Eroare trimitere welcome email:', err));

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Acest email este deja folosit' });
    }
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Eroare la crearea adminului' });
  }
});

// DELETE /api/tenants/:id/admins/:adminId - Șterge un admin local
router.delete('/:id/admins/:adminId', async (req, res) => {
  try {
    // Verificăm să nu șteargă SUPERADMIN-ul sau ultimul admin? Aici permitem ștergerea oricărui TENANT_ADMIN local.
    const result = await pool.query('DELETE FROM qrp_users WHERE id = $1 AND tenant_id = $2 AND role = $3 RETURNING id', [req.params.adminId, req.params.id, 'TENANT_ADMIN']);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Adminul nu a fost găsit sau nu aparține acestui tenant.' });
    }
    res.json({ success: true, message: 'Admin șters cu succes.' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Eroare internă la ștergerea adminului.' });
  }
});

// PUT /api/tenants/:id - Editare tenant existent
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      nume_locatie, 
      tip_modul, 
      culoare_tema, 
      logo_url, 
      favicon_url,
      distanta_gps,
      mod_qr,
      modules,
      portal_bg_image_url,
      portal_bg_color
    } = req.body;

    if (!nume_locatie) {
      return res.status(400).json({ error: 'Nume locație este obligatoriu' });
    }

    await client.query('BEGIN');

    // 1. Update qrp_tenants
    const subdomain = nume_locatie.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tenantQuery = `
      UPDATE qrp_tenants 
      SET name = $1, subdomain = $2, logo_url = $3, favicon_url = $4, theme_color = $5, modules = $6, portal_bg_image_url = $7, portal_bg_color = $8
      WHERE id = $9
    `;
    await client.query(tenantQuery, [
      nume_locatie,
      subdomain,
      logo_url || null, 
      sanitizeFaviconUrl(favicon_url), 
      culoare_tema || '#3B82F6',
      modules || {},
      portal_bg_image_url || null,
      portal_bg_color || null,
      req.params.id
    ]);

    // 2. Update qrp_sites (Presupunem că e site-ul principal, tenant_id = id)
    const siteQuery = `
      UPDATE qrp_sites 
      SET name = $1, qr_mode = $2, allowed_radius_meters = $3
      WHERE tenant_id = $4
    `;
    await client.query(siteQuery, [
      tip_modul || 'Birou',
      mod_qr || 'STATIC',
      distanta_gps ? parseInt(distanta_gps, 10) : 100,
      req.params.id
    ]);

    await client.query('COMMIT');

    res.json({ message: 'Tenant actualizat cu succes' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Eroare la actualizarea tenant-ului' });
  } finally {
    client.release();
  }
});

// PUT /api/tenants/:id/admins/:adminId/password - Resetează parola unui admin local
router.put('/:id/admins/:adminId/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Noua parolă este obligatorie' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      UPDATE qrp_users 
      SET password_hash = $1 
      WHERE id = $2 AND tenant_id = $3 AND role = 'TENANT_ADMIN'
    `;
    const result = await pool.query(query, [passwordHash, req.params.adminId, req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Adminul local nu a fost găsit' });
    }

    res.json({ message: 'Parola a fost actualizată cu succes' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Eroare la resetarea parolei' });
  }
});



// ================= EMPLOYEES ======================

// GET /api/tenants/:id/employees
router.get('/:id/employees', async (req, res) => {
  try {
    const { status } = req.query;
    let filter = 'WHERE tenant_id = $1';
    if (status === 'archived') {
      filter += ' AND is_archived = TRUE';
    } else if (status !== 'all') {
      filter += ' AND (is_archived IS FALSE OR is_archived IS NULL)';
    }

    const query = `
      SELECT * FROM qrp_employees 
      ${filter} 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [req.params.id]);

    const countsRes = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_archived IS FALSE OR is_archived IS NULL) as active_count,
        COUNT(*) FILTER (WHERE is_archived = TRUE) as archived_count
      FROM qrp_employees
      WHERE tenant_id = $1
    `, [req.params.id]);

    res.setHeader('Access-Control-Expose-Headers', 'X-Active-Count, X-Archived-Count');
    res.setHeader('X-Active-Count', countsRes.rows[0]?.active_count || '0');
    res.setHeader('X-Archived-Count', countsRes.rows[0]?.archived_count || '0');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Eroare la preluarea angajaților' });
  }
});

function getBirthDateFromCnp(cnp) {
  if (!cnp || typeof cnp !== 'string') return null;
  const clean = cnp.trim().replace(/\D/g, '');
  if (clean.length < 7) return null;

  const s = clean[0];
  let yearPrefix = null;
  if (['1', '2', '7', '8'].includes(s)) yearPrefix = '19';
  else if (['5', '6'].includes(s)) yearPrefix = '20';
  else if (['3', '4'].includes(s)) yearPrefix = '18';
  else return null;

  const yy = clean.substring(1, 3);
  const mm = clean.substring(3, 5);
  const dd = clean.substring(5, 7);

  const m = parseInt(mm, 10);
  const d = parseInt(dd, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  return `${yearPrefix}${yy}-${mm}-${dd}`;
}

// POST /api/tenants/:id/employees - Adăugare angajat
router.post('/:id/employees', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'id_card', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      first_name, last_name, cnp, id_card_series, 
      birth_date, address, phone, email, job_title, pin_code, location_id,
      contract_start_date, work_schedule, contract_notes, salary
    } = req.body;
    
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'Numele și prenumele sunt obligatorii' });
    }

    // Extrage data nașterii din CNP dacă nu este furnizată explicit
    const finalBirthDate = birth_date || getBirthDateFromCnp(cnp);

    // Daca nu a fost setat un PIN, se genereaza unul automat de 4 cifre
    const finalPin = pin_code && pin_code.trim() ? pin_code.trim() : Math.floor(1000 + Math.random() * 9000).toString();

    let avatarPath = null;
    let idCardPath = null;
    
    if (req.files) {
      if (req.files.avatar && req.files.avatar.length > 0) {
        avatarPath = await uploadToSupabase(req.files.avatar[0], 'avatars');
      }
      if (req.files.id_card && req.files.id_card.length > 0) {
        idCardPath = await uploadToSupabase(req.files.id_card[0], 'documents');
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Generare cod unic secvențial, continuu (nu se refolosesc și nu se dublează codurile, inclusiv cele arhivate)
      const tenantRes = await client.query('SELECT name FROM qrp_tenants WHERE id = $1', [req.params.id]);
      const prefix = tenantRes.rows[0].name.substring(0, 3).toUpperCase();
      const countRes = await client.query('SELECT MAX(CAST(REGEXP_REPLACE(employee_code, \'[^0-9]\', \'\', \'g\') AS INTEGER)) FROM qrp_employees WHERE tenant_id = $1', [req.params.id]);
      const nextId = (parseInt(countRes.rows[0].max) || 0) + 1;
      let candidateNum = nextId;
      let employee_code = `${prefix}${candidateNum.toString().padStart(3, '0')}`;
      
      // Asigurare garanție absolută de unicitate (atât printre activi cât și printre cei arhivați)
      while (true) {
        const codeCheck = await client.query('SELECT 1 FROM qrp_employees WHERE tenant_id = $1 AND employee_code = $2', [req.params.id, employee_code]);
        if (codeCheck.rows.length === 0) break;
        candidateNum++;
        employee_code = `${prefix}${candidateNum.toString().padStart(3, '0')}`;
      }

      const query = `
        INSERT INTO qrp_employees (
          tenant_id, first_name, last_name, cnp, id_card_series, 
          birth_date, address, phone, email, job_title, pin_code, avatar_path, location_id, id_card_path,
          contract_start_date, work_schedule, contract_notes, salary, employee_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;
      const values = [
        req.params.id, first_name, last_name, cnp, id_card_series || null, 
        finalBirthDate || null, address || null, phone || null, email || null, job_title || null, finalPin, avatarPath,
        location_id ? parseInt(location_id) : null, idCardPath,
        contract_start_date || null, work_schedule || null, contract_notes || null, salary || null, employee_code
      ];
      
      const result = await client.query(query, values);
      const newEmp = result.rows[0];

      // Add to history
      await client.query(
        'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
        [newEmp.id, 'ANGAJARE', 'Inregistrare initiala in sistem.']
      );

      await client.query('COMMIT');
      res.status(201).json(newEmp);
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Acest CNP este deja înregistrat la acest Punct de Lucru / Companie.' });
    }
    res.status(500).json({ error: 'Eroare la crearea angajatului' });
  }
});

// GET /api/tenants/:id/timesheets
router.get('/:id/timesheets', async (req, res) => {
  try {
    const { startDate, endDate, locationId } = req.query;
    
    let queryParams = [req.params.id];
    let whereClauses = ['t.tenant_id = $1'];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      whereClauses.push(`t.created_at >= $${paramCount}`);
      queryParams.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      paramCount++;
      whereClauses.push(`t.created_at <= $${paramCount}`);
      queryParams.push(`${endDate} 23:59:59`);
    }

    if (locationId && locationId !== 'all') {
      paramCount++;
      whereClauses.push(`t.site_id = $${paramCount}`);
      queryParams.push(locationId);
    }

    const query = `
      SELECT 
        t.id, t.action_type, t.created_at as timestamp, t.is_manual, 
        e.id as employee_id, e.first_name, e.last_name, e.avatar_path, e.job_title, e.employee_code,
        l.name as location_name
      FROM qrp_timesheets t
      JOIN qrp_employees e ON t.employee_id = e.id
      LEFT JOIN qrp_locations l ON t.site_id = l.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY t.created_at DESC
      LIMIT 10000
    `;
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    res.status(500).json({ error: 'Eroare la preluarea pontajelor' });
  }
});

// POST /api/tenants/:id/clock
router.post('/:id/clock', async (req, res) => {
  try {
    const { pin_code } = req.body;
    if (!pin_code) return res.status(400).json({ error: 'PIN obligatoriu' });

    // Find employee
    const empQuery = `SELECT * FROM qrp_employees WHERE tenant_id = $1 AND pin_code = $2 LIMIT 1`;
    const empResult = await pool.query(empQuery, [req.params.id, pin_code]);
    
    if (empResult.rowCount === 0) {
      return res.status(404).json({ error: 'PIN incorect sau angajat inexistent' });
    }
    
    const employee = empResult.rows[0];

    // Get last action to toggle it
    const lastActionQuery = `
      SELECT action_type FROM qrp_timesheets 
      WHERE employee_id = $1 
      ORDER BY timestamp DESC LIMIT 1
    `;
    const lastActionResult = await pool.query(lastActionQuery, [employee.id]);
    let newAction = 'IN';
    if (lastActionResult.rowCount > 0 && lastActionResult.rows[0].action_type === 'IN') {
      newAction = 'OUT';
    }

    // Insert new timesheet record
    const insertQuery = `
      INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    await pool.query(insertQuery, [req.params.id, employee.id, newAction]);

    res.json({ 
      success: true, 
      action: newAction, 
      employee: { 
        first_name: employee.first_name, 
        last_name: employee.last_name,
        avatar_path: employee.avatar_path
      } 
    });

  } catch (error) {
    console.error('Error in clocking:', error);
    res.status(500).json({ error: 'Eroare la înregistrarea pontajului' });
  }
});

// POST /api/tenants/:id/employees/:employeeId/start-shift
router.post('/:id/employees/:employeeId/start-shift', async (req, res) => {
  try {
    const { date, time, timestamp } = req.body;
    let finalTimestamp = timestamp;
    if (!finalTimestamp) {
      if (date && time) {
        finalTimestamp = `${date} ${time}:00`;
      } else {
        finalTimestamp = new Date().toISOString();
      }
    }

    // Validate employee belongs to tenant & fetch details
    const empResult = await pool.query(
      'SELECT id, location_id, first_name, last_name FROM qrp_employees WHERE id = $1 AND tenant_id = $2',
      [req.params.employeeId, req.params.id]
    );
    if (empResult.rowCount === 0) {
      return res.status(404).json({ error: 'Angajat inexistent' });
    }
    const emp = empResult.rows[0];

    // Resolve site_id from emp.location_id or fallback
    let siteId = emp.location_id;
    if (!siteId) {
      const siteRes = await pool.query('SELECT id FROM qrp_sites WHERE tenant_id = $1 ORDER BY id ASC LIMIT 1', [req.params.id]);
      if (siteRes.rows.length > 0) siteId = siteRes.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id, created_at, is_manual)
      VALUES ($1, $2, 'IN', $3, $4, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [req.params.id, req.params.employeeId, siteId, finalTimestamp]);

    // Save to history
    await pool.query(
      'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
      [req.params.employeeId, 'pontaj', `Tură PORNITĂ MANUAL de către administrator.`]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error starting shift manually:', error);
    res.status(500).json({ error: 'Eroare la pornirea manuală a turei' });
  }
});

// POST /api/tenants/:id/employees/:employeeId/close-shift
router.post('/:id/employees/:employeeId/close-shift', async (req, res) => {
  try {
    const { date, time, timestamp } = req.body;
    let finalTimestamp = timestamp;
    if (!finalTimestamp) {
      if (date && time) {
        finalTimestamp = `${date} ${time}:00`;
      } else {
        finalTimestamp = new Date().toISOString();
      }
    }

    // Validate employee belongs to tenant & fetch details
    const empResult = await pool.query(
      'SELECT id, location_id, first_name, last_name FROM qrp_employees WHERE id = $1 AND tenant_id = $2',
      [req.params.employeeId, req.params.id]
    );
    if (empResult.rowCount === 0) {
      return res.status(404).json({ error: 'Angajat inexistent' });
    }
    const emp = empResult.rows[0];

    let siteId = emp.location_id;
    if (!siteId) {
      const siteRes = await pool.query('SELECT id FROM qrp_sites WHERE tenant_id = $1 ORDER BY id ASC LIMIT 1', [req.params.id]);
      if (siteRes.rows.length > 0) siteId = siteRes.rows[0].id;
    }

    const insertQuery = `
      INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id, created_at, is_manual)
      VALUES ($1, $2, 'OUT', $3, $4, true)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [req.params.id, req.params.employeeId, siteId, finalTimestamp]);

    // Save to history
    await pool.query(
      'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
      [req.params.employeeId, 'pontaj', `Tură ÎNCHISĂ MANUAL de către administrator.`]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error closing shift:', error);
    res.status(500).json({ error: 'Eroare la închiderea manuală a turei' });
  }
});

// POST /api/tenants/:id/close-all-shifts
router.post('/:id/close-all-shifts', async (req, res) => {
  const client = await pool.connect();
  try {
    const tenantId = req.params.id;
    const { date, time, timestamp } = req.body;
    let finalTimestamp = timestamp;
    if (!finalTimestamp) {
      if (date && time) {
        finalTimestamp = `${date} ${time}:00`;
      } else {
        finalTimestamp = new Date().toISOString();
      }
    }

    await client.query('BEGIN');

    const activeQuery = `
      SELECT e.id, e.first_name, e.last_name, e.location_id,
             (SELECT site_id FROM qrp_timesheets WHERE employee_id = e.id AND action_type = 'IN' ORDER BY created_at DESC LIMIT 1) as last_site_id
      FROM qrp_employees e
      WHERE e.tenant_id = $1
        AND COALESCE((SELECT action_type FROM qrp_timesheets WHERE employee_id = e.id ORDER BY created_at DESC LIMIT 1), 'OUT') = 'IN'
    `;
    const activeEmployeesRes = await client.query(activeQuery, [tenantId]);
    const activeEmployees = activeEmployeesRes.rows;

    if (activeEmployees.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ success: true, count: 0, message: 'Nu există angajați prezenți în tura curentă.' });
    }

    let defaultSiteId = null;
    const siteRes = await client.query('SELECT id FROM qrp_sites WHERE tenant_id = $1 ORDER BY id ASC LIMIT 1', [tenantId]);
    if (siteRes.rows.length > 0) defaultSiteId = siteRes.rows[0].id;

    for (const emp of activeEmployees) {
      const siteId = emp.last_site_id || emp.location_id || defaultSiteId;
      await client.query(
        `INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id, created_at, is_manual)
         VALUES ($1, $2, 'OUT', $3, $4, true)`,
        [tenantId, emp.id, siteId, finalTimestamp]
      );

      await client.query(
        `INSERT INTO qrp_employee_history (employee_id, change_type, new_value)
         VALUES ($1, 'pontaj', 'Tură ÎNCHISĂ MANUAL (colectiv) de către administrator.')`,
        [emp.id]
      );
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      count: activeEmployees.length,
      message: `Au fost închise cu succes turele pentru toți cei ${activeEmployees.length} angajați prezenți.`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error closing all shifts:', error);
    res.status(500).json({ error: 'Eroare la închiderea colectivă a turelor.' });
  } finally {
    client.release();
  }
});


// GET /api/tenants/:id/job-titles
router.get('/:id/job-titles', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM qrp_job_titles WHERE tenant_id = $1 ORDER BY name ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching job titles:', error);
    res.status(500).json({ error: 'Eroare la preluarea funcțiilor' });
  }
});

// POST /api/tenants/:id/job-titles
router.post('/:id/job-titles', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Numele funcției este obligatoriu' });

    const insertQuery = `
      INSERT INTO qrp_job_titles (tenant_id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [req.params.id, name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding job title:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Această funcție există deja.' });
    }
    res.status(500).json({ error: 'Eroare la adăugarea funcției' });
  }
});

// PUT /api/tenants/:id/job-titles/:roleId
router.put('/:id/job-titles/:roleId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Numele funcției este obligatoriu' });

    await client.query('BEGIN');
    
    // Obține numele vechi pentru a-l actualiza și la angajați
    const oldRoleRes = await client.query('SELECT name FROM qrp_job_titles WHERE id = $1 AND tenant_id = $2', [req.params.roleId, req.params.id]);
    if (oldRoleRes.rows.length === 0) throw new Error('Rolul nu a fost găsit.');
    const oldName = oldRoleRes.rows[0].name;

    const result = await client.query(
      'UPDATE qrp_job_titles SET name=$1 WHERE id=$2 AND tenant_id=$3 RETURNING *',
      [name, req.params.roleId, req.params.id]
    );

    // Actualizează și angajații
    if (oldName !== name) {
      await client.query(
        'UPDATE qrp_employees SET job_title=$1 WHERE job_title=$2 AND tenant_id=$3',
        [name, oldName, req.params.id]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating job title:', error);
    res.status(500).json({ error: 'Eroare la actualizarea funcției' });
  } finally {
    client.release();
  }
});

// DELETE /api/tenants/:id/job-titles/:roleId
router.delete('/:id/job-titles/:roleId', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldRoleRes = await client.query('SELECT name FROM qrp_job_titles WHERE id = $1 AND tenant_id = $2', [req.params.roleId, req.params.id]);
    if (oldRoleRes.rows.length > 0) {
      const oldName = oldRoleRes.rows[0].name;
      // Lasă angajații fără rol
      await client.query(
        'UPDATE qrp_employees SET job_title=NULL WHERE job_title=$1 AND tenant_id=$2',
        [oldName, req.params.id]
      );
    }

    await client.query('DELETE FROM qrp_job_titles WHERE id=$1 AND tenant_id=$2', [req.params.roleId, req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting job title:', error);
    res.status(500).json({ error: 'Eroare la ștergerea funcției' });
  } finally {
    client.release();
  }
});
// POST /api/tenants/:id/employees/:empId/reset-pin
router.post('/:id/employees/:empId/reset-pin', async (req, res) => {
  try {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    await pool.query(
      'UPDATE qrp_employees SET pin_code = $1, pin_reset_requested = FALSE WHERE id = $2 AND tenant_id = $3',
      [newPin, req.params.empId, req.params.id]
    );
    res.json({ success: true, newPin, message: 'PIN resetat cu succes.' });
  } catch (err) {
    console.error('Error resetting pin:', err);
    res.status(500).json({ error: 'Eroare la resetarea PIN-ului' });
  }
});

// PUT /api/tenants/:id/employees/:empId
router.put('/:id/employees/:empId', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'id_card', maxCount: 1 }]), async (req, res) => {
  try {
    const { 
      first_name, last_name, cnp, id_card_series, birth_date, address, phone, email,
      job_title, pin_code, location_id, contract_start_date, work_schedule, 
      contract_notes, salary,
      eval_punctuality, eval_attendance, eval_attitude, eval_performance, eval_reliability
    } = req.body;
    let avatarPath = req.body.existing_avatar || null;
    let idCardPath = req.body.existing_id_card || null;
    
    if (req.files) {
      if (req.files.avatar && req.files.avatar.length > 0) {
        avatarPath = await uploadToSupabase(req.files.avatar[0], 'avatars');
      }
      if (req.files.id_card && req.files.id_card.length > 0) {
        idCardPath = await uploadToSupabase(req.files.id_card[0], 'documents');
      }
    }

    const finalBirthDate = (birth_date && birth_date.trim()) || getBirthDateFromCnp(cnp);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch old data for history
      const oldRes = await client.query('SELECT * FROM qrp_employees WHERE id=$1 AND tenant_id=$2', [req.params.empId, req.params.id]);
      if (oldRes.rowCount === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ error: 'Not found' });
      }
      const oldEmp = oldRes.rows[0];

      const query = `
        UPDATE qrp_employees
        SET first_name=$1, last_name=$2, cnp=$3, id_card_series=$4, 
            birth_date=$5, address=$6, phone=$7, email=$8, job_title=$9, pin_code=$10, avatar_path=$11,
            location_id=$12, id_card_path=$13, contract_start_date=$14, work_schedule=$15, contract_notes=$16, salary=$17,
            eval_punctuality=COALESCE($18, eval_punctuality), 
            eval_attendance=COALESCE($19, eval_attendance), 
            eval_attitude=COALESCE($20, eval_attitude), 
            eval_performance=COALESCE($21, eval_performance), 
            eval_reliability=COALESCE($22, eval_reliability)
        WHERE id=$23 AND tenant_id=$24
        RETURNING *
      `;
      const values = [
        first_name, last_name, cnp, id_card_series || null, 
        finalBirthDate || null, address || null, phone || null, email || null, job_title || null, pin_code, avatarPath,
        location_id ? parseInt(location_id) : null, idCardPath,
        contract_start_date || null, work_schedule || null, contract_notes || null, salary || null,
        eval_punctuality ? parseInt(eval_punctuality) : null, 
        eval_attendance ? parseInt(eval_attendance) : null, 
        eval_attitude ? parseInt(eval_attitude) : null, 
        eval_performance ? parseInt(eval_performance) : null, 
        eval_reliability ? parseInt(eval_reliability) : null,
        req.params.empId, req.params.id
      ];
      const result = await client.query(query, values);
      const newEmp = result.rows[0];

      // Check for changes to log in history
      const changes = [];
      if (oldEmp.job_title !== newEmp.job_title) {
        changes.push({ type: 'MODIFICARE_FUNCTIE', old: oldEmp.job_title, new: newEmp.job_title });
      }
      if (oldEmp.location_id !== newEmp.location_id) {
        changes.push({ type: 'MUTARE_LOCATIE', old: oldEmp.location_id, new: newEmp.location_id });
      }
      if (oldEmp.work_schedule !== newEmp.work_schedule) {
        changes.push({ type: 'MODIFICARE_PROGRAM', old: oldEmp.work_schedule, new: newEmp.work_schedule });
      }
      if (oldEmp.salary !== newEmp.salary) {
        changes.push({ type: 'MODIFICARE_SALARIU', old: oldEmp.salary, new: newEmp.salary });
      }

      for (const change of changes) {
        await client.query(
          'INSERT INTO qrp_employee_history (employee_id, change_type, old_value, new_value) VALUES ($1, $2, $3, $4)',
          [newEmp.id, change.type, change.old ? String(change.old) : null, change.new ? String(change.new) : null]
        );
      }

      await client.query('COMMIT');
      res.json(newEmp);
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Acest CNP este deja înregistrat la acest Punct de Lucru / Companie.' });
    }
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Eroare la actualizarea angajatului' });
  }
});

// DELETE /api/tenants/:id/employees/:empId (Arhivare angajat / Soft Delete)
router.delete('/:id/employees/:empId', async (req, res) => {
  try {
    await pool.query(
      'UPDATE qrp_employees SET is_archived = TRUE, archived_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [req.params.empId, req.params.id]
    );

    await pool.query(
      'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
      [req.params.empId, 'ARHIVARE', 'Angajatul a fost mutat in arhiva.']
    );

    res.json({ success: true, message: 'Angajatul a fost arhivat cu succes.' });
  } catch (error) {
    console.error('Error archiving employee:', error);
    res.status(500).json({ error: 'Eroare la arhivarea angajatului' });
  }
});

// POST /api/tenants/:id/employees/bulk-delete (Arhivare în masă)
router.post('/:id/employees/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Niciun angajat selectat' });
    }
    await pool.query(
      'UPDATE qrp_employees SET is_archived = TRUE, archived_at = NOW() WHERE tenant_id = $1 AND id = ANY($2::int[])',
      [req.params.id, ids]
    );

    for (const empId of ids) {
      await pool.query(
        'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
        [empId, 'ARHIVARE', 'Angajatul a fost mutat in arhiva (actiune colectiva).']
      );
    }

    res.json({ success: true, count: ids.length, message: `${ids.length} angajați au fost arhivați.` });
  } catch (error) {
    console.error('Error in bulk archive employees:', error);
    res.status(500).json({ error: 'Eroare la arhivarea în masă a angajaților' });
  }
});

// POST /api/tenants/:id/employees/:empId/restore (Restaurare din arhivă)
router.post('/:id/employees/:empId/restore', async (req, res) => {
  try {
    await pool.query(
      'UPDATE qrp_employees SET is_archived = FALSE, archived_at = NULL WHERE id = $1 AND tenant_id = $2',
      [req.params.empId, req.params.id]
    );

    await pool.query(
      'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
      [req.params.empId, 'RESTAURARE', 'Angajatul a fost reactivat din arhiva.']
    );

    res.json({ success: true, message: 'Angajatul a fost reactivat cu succes.' });
  } catch (error) {
    console.error('Error restoring employee:', error);
    res.status(500).json({ error: 'Eroare la restaurarea angajatului' });
  }
});

// POST /api/tenants/:id/employees/bulk-restore (Restaurare în masă din arhivă)
router.post('/:id/employees/bulk-restore', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Niciun angajat selectat' });
    }
    await pool.query(
      'UPDATE qrp_employees SET is_archived = FALSE, archived_at = NULL WHERE tenant_id = $1 AND id = ANY($2::int[])',
      [req.params.id, ids]
    );

    for (const empId of ids) {
      await pool.query(
        'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
        [empId, 'RESTAURARE', 'Angajatul a fost reactivat din arhiva (actiune colectiva).']
      );
    }

    res.json({ success: true, count: ids.length, message: `${ids.length} angajați au fost reactivați.` });
  } catch (error) {
    console.error('Error in bulk restore employees:', error);
    res.status(500).json({ error: 'Eroare la reactivarea în masă a angajaților' });
  }
});

// POST /api/tenants/:id/employees/bulk-update
router.post('/:id/employees/bulk-update', async (req, res) => {
  try {
    const { ids, job_title, location_id, update_job_title, update_location } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Niciun angajat selectat' });
    }

    const updates = [];
    const values = [req.params.id, ids];
    let valIdx = 3;

    if (update_job_title) {
      updates.push(`job_title = $${valIdx++}`);
      values.push(job_title || null);
    }
    if (update_location) {
      updates.push(`location_id = $${valIdx++}`);
      values.push(location_id ? parseInt(location_id, 10) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Niciun câmp selectat pentru actualizare' });
    }

    const query = `
      UPDATE qrp_employees 
      SET ${updates.join(', ')} 
      WHERE tenant_id = $1 AND id = ANY($2::int[])
    `;
    await pool.query(query, values);

    res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error in bulk update employees:', error);
    res.status(500).json({ error: 'Eroare la actualizarea în masă a angajaților' });
  }
});


// ================= LOCATIONS =================
router.get('/:id/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM qrp_locations WHERE tenant_id = $1 ORDER BY id ASC', [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Eroare la preluarea locațiilor' });
  }
});

router.post('/:id/locations', async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius, qr_mode } = req.body;
    const result = await pool.query(
      'INSERT INTO qrp_locations (tenant_id, name, address, latitude, longitude, radius, qr_mode) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.params.id, name, address, latitude || null, longitude || null, radius || 100, qr_mode || 'DYNAMIC']
    );
    // Keep qrp_sites in sync
    await pool.query('UPDATE qrp_sites SET name = $1 WHERE tenant_id = $2', [name, req.params.id]).catch(() => {});
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Eroare la creare' });
  }
});

router.put('/:id/locations/:locId', async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius, qr_mode } = req.body;
    const result = await pool.query(
      'UPDATE qrp_locations SET name=$1, address=$2, latitude=$3, longitude=$4, radius=$5, qr_mode=$8 WHERE id=$6 AND tenant_id=$7 RETURNING *',
      [name, address, latitude || null, longitude || null, radius || 100, req.params.locId, req.params.id, qr_mode || 'DYNAMIC']
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Locație negăsită' });
    // Keep qrp_sites in sync
    await pool.query('UPDATE qrp_sites SET name = $1 WHERE tenant_id = $2', [name, req.params.id]).catch(() => {});
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

router.delete('/:id/locations/:locId', async (req, res) => {
  try {
    await pool.query('DELETE FROM qrp_locations WHERE id=$1 AND tenant_id=$2', [req.params.locId, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Eroare la ștergere' });
  }
});

// ================= KIOSKS =================
router.get('/:id/kiosks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT k.*, l.name as location_name, l.qr_mode 
      FROM qrp_kiosks k 
      LEFT JOIN qrp_locations l ON k.location_id = l.id
      WHERE k.tenant_id = $1 
      ORDER BY k.created_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching kiosks:', error);
    res.status(500).json({ error: 'Eroare la preluarea kiosk-urilor' });
  }
});

router.post('/:id/kiosks', async (req, res) => {
  try {
    const { name, location_id, kiosk_pin, kiosk_show_photo, kiosk_orientation, kiosk_timer_color, kiosk_bg_color, kiosk_logo_bg, kiosk_logo_size, kiosk_logo_position, kiosk_logo_x, kiosk_logo_y, kiosk_timer_bg_color, kiosk_title, kiosk_subtitle, kiosk_show_logo_bg, kiosk_show_timer_bg } = req.body;
    const result = await pool.query(
      'INSERT INTO qrp_kiosks (tenant_id, location_id, name, kiosk_pin, kiosk_show_photo, kiosk_orientation, kiosk_timer_color, kiosk_bg_color, kiosk_logo_bg, kiosk_logo_size, kiosk_logo_position, kiosk_logo_x, kiosk_logo_y, kiosk_timer_bg_color, kiosk_title, kiosk_subtitle, kiosk_show_logo_bg, kiosk_show_timer_bg) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
      [req.params.id, location_id, name, kiosk_pin || null, kiosk_show_photo !== undefined ? kiosk_show_photo : true, kiosk_orientation || 'horizontal', kiosk_timer_color || null, kiosk_bg_color || null, kiosk_logo_bg || null, kiosk_logo_size || 1, kiosk_logo_position || 'top-left', kiosk_logo_x || 5, kiosk_logo_y || 5, kiosk_timer_bg_color || null, kiosk_title || 'Pontaj Digital', kiosk_subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.', kiosk_show_logo_bg !== undefined ? kiosk_show_logo_bg : true, kiosk_show_timer_bg !== undefined ? kiosk_show_timer_bg : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating kiosk:', error);
    res.status(500).json({ error: 'Eroare la creare kiosk' });
  }
});

router.put('/:id/kiosks/:kioskId', async (req, res) => {
  try {
    const { name, location_id, kiosk_pin, kiosk_show_photo, kiosk_orientation, kiosk_timer_color, kiosk_bg_color, kiosk_logo_bg, kiosk_logo_size, kiosk_logo_position, kiosk_logo_x, kiosk_logo_y, kiosk_timer_bg_color, kiosk_title, kiosk_subtitle, kiosk_show_logo_bg, kiosk_show_timer_bg } = req.body;
    const result = await pool.query(
      'UPDATE qrp_kiosks SET name=$1, location_id=$2, kiosk_pin=$3, kiosk_show_photo=$4, kiosk_orientation=$5, kiosk_timer_color=$6, kiosk_bg_color=$7, kiosk_logo_bg=$8, kiosk_logo_size=$9, kiosk_logo_position=$10, kiosk_timer_bg_color=$11, kiosk_title=$12, kiosk_subtitle=$13, kiosk_show_logo_bg=$14, kiosk_show_timer_bg=$15, kiosk_logo_x=$18, kiosk_logo_y=$19 WHERE id=$16 AND tenant_id=$17 RETURNING *',
      [name, location_id, kiosk_pin || null, kiosk_show_photo !== undefined ? kiosk_show_photo : true, kiosk_orientation || 'horizontal', kiosk_timer_color || null, kiosk_bg_color || null, kiosk_logo_bg || null, kiosk_logo_size || 1, kiosk_logo_position || 'top-left', kiosk_timer_bg_color || null, kiosk_title || 'Pontaj Digital', kiosk_subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.', kiosk_show_logo_bg !== undefined ? kiosk_show_logo_bg : true, kiosk_show_timer_bg !== undefined ? kiosk_show_timer_bg : true, req.params.kioskId, req.params.id, kiosk_logo_x !== undefined ? kiosk_logo_x : 5, kiosk_logo_y !== undefined ? kiosk_logo_y : 5]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kiosk not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating kiosk:', error);
    res.status(500).json({ error: 'Eroare la actualizare kiosk' });
  }
});

router.delete('/:id/kiosks/:kioskId', async (req, res) => {
  try {
    await pool.query('DELETE FROM qrp_kiosks WHERE id=$1 AND tenant_id=$2', [req.params.kioskId, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting kiosk:', error);
    res.status(500).json({ error: 'Eroare la ștergere kiosk' });
  }
});

router.post('/:id/kiosks/:kioskId/auth_kiosk', async (req, res) => {
  try {
    const { pin } = req.body;
    const result = await pool.query(
      'SELECT kiosk_pin, kiosk_orientation, location_id, kiosk_timer_color, kiosk_bg_color, kiosk_logo_bg, kiosk_logo_size, kiosk_logo_x, kiosk_logo_y, kiosk_timer_bg_color, kiosk_title, kiosk_subtitle, kiosk_show_logo_bg, kiosk_show_timer_bg FROM qrp_kiosks WHERE id=$1 AND tenant_id=$2',
      [req.params.kioskId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Kiosk inexistent' });
    
    const dbPin = result.rows[0].kiosk_pin;
    const orientation = result.rows[0].kiosk_orientation || 'horizontal';
    const locationId = result.rows[0].location_id;
    const colors = {
      timer: result.rows[0].kiosk_timer_color,
      timer_bg: result.rows[0].kiosk_timer_bg_color,
      show_timer_bg: result.rows[0].kiosk_show_timer_bg,
      bg: result.rows[0].kiosk_bg_color,
      logo_bg: result.rows[0].kiosk_logo_bg,
      show_logo_bg: result.rows[0].kiosk_show_logo_bg,
      logo_size: result.rows[0].kiosk_logo_size,
      logo_x: result.rows[0].kiosk_logo_x,
      logo_y: result.rows[0].kiosk_logo_y
    };
    const content = {
      title: result.rows[0].kiosk_title || 'Pontaj Digital',
      subtitle: result.rows[0].kiosk_subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.'
    };
    
    // Kiosk display configuration is always returned so the live punch display never gets locked on reload
    return res.json({ success: true, message: 'Autorizat', orientation, locationId, colors, content });
  } catch (error) {
    console.error('Error authenticating kiosk:', error);
    res.status(500).json({ error: 'Eroare la autentificare' });
  }
});

// GET /api/tenants/:id/employees/:empId
router.get('/:id/employees/:empId', async (req, res) => {
  try {
    const query = `
      SELECT e.*, l.name as location_name 
      FROM qrp_employees e
      LEFT JOIN qrp_locations l ON e.location_id = l.id
      WHERE e.id = $1 AND e.tenant_id = $2
    `;
    const result = await pool.query(query, [req.params.empId, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Angajat negăsit' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Eroare preluare angajat' });
  }
});

// GET /api/tenants/:id/employees/:empId/history
router.get('/:id/employees/:empId/history', async (req, res) => {
  try {
    const query = `
      SELECT * FROM qrp_employee_history 
      WHERE employee_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [req.params.empId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Eroare istoric' });
  }
});

// POST /api/tenants/:id/employees/:empId/avatar
router.post('/:id/employees/:empId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Niciun fișier selectat.' });
    const avatarPath = await uploadToSupabase(req.file, 'avatars');
    
    await pool.query('UPDATE qrp_employees SET avatar_path = $1 WHERE id = $2', [avatarPath, req.params.empId]);
    res.json({ success: true, avatar_path: avatarPath });
  } catch (err) {
    console.error('Eroare upload avatar:', err);
    res.status(500).json({ error: 'Eroare upload avatar' });
  }
});

// GET /api/tenants/:id/employees/:empId/documents
router.get('/:id/employees/:empId/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM qrp_employee_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC', [req.params.empId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare preluare documente' });
  }
});

// POST /api/tenants/:id/employees/:empId/documents
router.post('/:id/employees/:empId/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Niciun document selectat.' });
    
    const filePath = await uploadToSupabase(req.file, 'documents');
    const fileName = req.body.file_name || req.file.originalname;
    
    const result = await pool.query(
      'INSERT INTO qrp_employee_documents (employee_id, file_name, file_path) VALUES ($1, $2, $3) RETURNING *',
      [req.params.empId, fileName, filePath]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare upload document' });
  }
});

// DELETE /api/tenants/:id/employees/:empId/documents/:docId
router.delete('/:id/employees/:empId/documents/:docId', async (req, res) => {
  try {
    await pool.query('DELETE FROM qrp_employee_documents WHERE id = $1 AND employee_id = $2', [req.params.docId, req.params.empId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Eroare stergere document' });
  }
});

module.exports = router;
