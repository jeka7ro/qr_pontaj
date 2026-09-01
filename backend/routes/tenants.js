const express = require('express');
const bcrypt = require('bcrypt');
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
        t.id, t.name as nume, t.subdomain, t.theme_color as culoare, t.logo_url, t.modules,
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
      INSERT INTO qrp_tenants (name, subdomain, logo_url, favicon_url, theme_color, modules)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const tenantResult = await client.query(tenantQuery, [
      nume_locatie, 
      subdomain,
      logo_url || null, 
      favicon_url || null, 
      culoare_tema || '#2563EB',
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
      tip_modul || 'Birou', // Poate fi salvat ca nume de site de bază
      mod_qr || 'STATIC',
      distanta_gps ? parseInt(distanta_gps, 10) : 100
    ]);

    // 4. Inserare în qrp_users (Administratorul local)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(parola_initiala, saltRounds);
    
    const userQuery = `
      INSERT INTO qrp_users (tenant_id, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
    `;
    await client.query(userQuery, [
      tenantId,
      email_admin,
      passwordHash,
      'TENANT_ADMIN'
    ]);

    await client.query('COMMIT'); // Commit transaction

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
      SELECT t.id, t.name, t.subdomain, t.logo_url, t.theme_color, t.portal_bg_image_url, t.portal_bg_color
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
      SELECT id, email, created_at 
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Setăm și active_domain pe baza tenantului curent
    const tenantRes = await pool.query('SELECT subdomain FROM qrp_tenants WHERE id = $1', [req.params.id]);
    let activeDomain = null;
    if (tenantRes.rows.length > 0) {
       activeDomain = `${tenantRes.rows[0].subdomain}.qr.pontaj.app`;
    }

    const query = `
      INSERT INTO qrp_users (tenant_id, email, password_hash, role, active_domain)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, created_at
    `;
    const result = await pool.query(query, [req.params.id, email, passwordHash, 'TENANT_ADMIN', activeDomain]);
    
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
      favicon_url || null, 
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

// GET /api/tenants/:id/employees
router.get('/:id/employees', async (req, res) => {
  try {
    const query = `
      SELECT * FROM qrp_employees 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Eroare la preluarea angajaților' });
  }
});

// POST /api/tenants/:id/employees
router.post('/:id/employees', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'id_card', maxCount: 1 }]), async (req, res) => {
  try {
    const { first_name, last_name, cnp, id_card_series, birth_date, address, phone, email, job_title, pin_code, location_id, contract_start_date, work_schedule, contract_notes, salary } = req.body;
    
    if (!first_name || !last_name || !cnp) {
      return res.status(400).json({ error: 'Nume, prenume și CNP sunt obligatorii.' });
    }

    // Generate PIN from CNP (last 4 digits) or random if no CNP provided
    const finalPin = pin_code || (cnp && cnp.length >= 4 ? cnp.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString());
    
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
      
      // Auto-generate employee code with tenant prefix
      const tenantRes = await client.query('SELECT name FROM qrp_tenants WHERE id = $1', [req.params.id]);
      const prefix = tenantRes.rows[0].name.substring(0, 3).toUpperCase();
      const countRes = await client.query('SELECT MAX(CAST(REGEXP_REPLACE(employee_code, \'[^0-9]\', \'\', \'g\') AS INTEGER)) FROM qrp_employees WHERE tenant_id = $1', [req.params.id]);
      const nextId = (parseInt(countRes.rows[0].max) || 0) + 1;
      const employee_code = `${prefix}${nextId.toString().padStart(3, '0')}`;
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
        birth_date || null, address || null, phone || null, email || null, job_title || null, finalPin, avatarPath,
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
        t.id, t.action_type, t.created_at as timestamp, 
        e.id as employee_id, e.first_name, e.last_name, e.avatar_path, e.job_title, e.employee_code,
        l.name as location_name
      FROM qrp_timesheets t
      JOIN qrp_employees e ON t.employee_id = e.id
      LEFT JOIN qrp_locations l ON t.site_id = l.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY t.created_at DESC
      LIMIT 2000
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
        birth_date || null, address || null, phone || null, email || null, job_title || null, pin_code, avatarPath,
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

// DELETE /api/tenants/:id/employees/:empId
router.delete('/:id/employees/:empId', async (req, res) => {
  try {
    await pool.query('DELETE FROM qrp_employees WHERE id=$1 AND tenant_id=$2', [req.params.empId, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Eroare la stergere' });
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
    
    if (!dbPin) return res.json({ success: true, message: 'Fără PIN', orientation, locationId, colors, content });
    
    if (dbPin === pin) return res.json({ success: true, message: 'Autorizat', orientation, locationId, colors, content });
    else return res.status(401).json({ error: 'PIN Incorect' });
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
