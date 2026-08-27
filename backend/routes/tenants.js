const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');
const pool = db; // mapăm pool la db direct ca să meargă în restul codului
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });


// GET /api/tenants - Lista de tenanți și detaliile lor
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id, t.name as nume, t.theme_color as culoare, t.logo_url,
        s.qr_mode as mod_qr, s.allowed_radius_meters as raza_gps, s.name as tip_modul
      FROM qrp_tenants t
      LEFT JOIN qrp_sites s ON s.tenant_id = t.id
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
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
      mod_qr
    } = req.body;

    // 1. Validare simplă
    if (!nume_locatie || !email_admin || !parola_initiala) {
      return res.status(400).json({ error: 'Nume locație, email și parola sunt obligatorii' });
    }

    await client.query('BEGIN'); // Start transaction

    // 2. Inserare în qrp_tenants
    const tenantQuery = `
      INSERT INTO qrp_tenants (name, logo_url, favicon_url, theme_color)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const tenantResult = await client.query(tenantQuery, [
      nume_locatie, 
      logo_url || null, 
      favicon_url || null, 
      culoare_tema || '#3B82F6'
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

    const query = `
      INSERT INTO qrp_users (tenant_id, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, created_at
    `;
    const result = await pool.query(query, [req.params.id, email, passwordHash, 'TENANT_ADMIN']);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Acest email este deja folosit' });
    }
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Eroare la crearea adminului' });
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
      mod_qr
    } = req.body;

    if (!nume_locatie) {
      return res.status(400).json({ error: 'Nume locație este obligatoriu' });
    }

    await client.query('BEGIN');

    // 1. Update qrp_tenants
    const tenantQuery = `
      UPDATE qrp_tenants 
      SET name = $1, logo_url = $2, favicon_url = $3, theme_color = $4
      WHERE id = $5
    `;
    await client.query(tenantQuery, [
      nume_locatie, 
      logo_url || null, 
      favicon_url || null, 
      culoare_tema || '#3B82F6',
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

// ================= EMPLOYEES (HR) =================

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
    const { first_name, last_name, cnp, id_card_series, birth_date, address, job_title, pin_code, location_id, contract_start_date, work_schedule, contract_notes, salary } = req.body;
    
    if (!first_name || !last_name || !cnp) {
      return res.status(400).json({ error: 'Nume, prenume și CNP sunt obligatorii.' });
    }

    // Generate random PIN if not provided
    const finalPin = pin_code || Math.floor(1000 + Math.random() * 9000).toString();
    
    let avatarPath = null;
    let idCardPath = null;
    if (req.files) {
      if (req.files.avatar && req.files.avatar.length > 0) {
        avatarPath = `/uploads/avatars/${req.files.avatar[0].filename}`;
      }
      if (req.files.id_card && req.files.id_card.length > 0) {
        idCardPath = `/uploads/avatars/${req.files.id_card[0].filename}`; // using same folder for now or we could use /uploads/documents/
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const query = `
        INSERT INTO qrp_employees (
          tenant_id, first_name, last_name, cnp, id_card_series, 
          birth_date, address, job_title, pin_code, avatar_path, location_id, id_card_path,
          contract_start_date, work_schedule, contract_notes, salary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      const values = [
        req.params.id, first_name, last_name, cnp, id_card_series || null, 
        birth_date || null, address || null, job_title || null, finalPin, avatarPath,
        location_id ? parseInt(location_id) : null, idCardPath,
        contract_start_date || null, work_schedule || null, contract_notes || null, salary || null
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
    
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
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
        e.first_name, e.last_name, e.avatar_path, e.job_title,
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

module.exports = router;

// PUT /api/tenants/:id/employees/:empId
router.put('/:id/employees/:empId', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'id_card', maxCount: 1 }]), async (req, res) => {
  try {
    const { first_name, last_name, cnp, id_card_series, birth_date, address, job_title, pin_code, location_id, contract_start_date, work_schedule, contract_notes, salary } = req.body;
    let avatarPath = req.body.existing_avatar || null;
    let idCardPath = req.body.existing_id_card || null;
    
    if (req.files) {
      if (req.files.avatar && req.files.avatar.length > 0) {
        avatarPath = `/uploads/avatars/${req.files.avatar[0].filename}`;
      }
      if (req.files.id_card && req.files.id_card.length > 0) {
        idCardPath = `/uploads/avatars/${req.files.id_card[0].filename}`;
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
            birth_date=$5, address=$6, job_title=$7, pin_code=$8, avatar_path=$9,
            location_id=$10, id_card_path=$11, contract_start_date=$12, work_schedule=$13, contract_notes=$14, salary=$15
        WHERE id=$16 AND tenant_id=$17
        RETURNING *
      `;
      const values = [
        first_name, last_name, cnp, id_card_series || null, 
        birth_date || null, address || null, job_title || null, pin_code, avatarPath,
        location_id ? parseInt(location_id) : null, idCardPath,
        contract_start_date || null, work_schedule || null, contract_notes || null, salary || null,
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
    const { name, address } = req.body;
    const result = await pool.query(
      'INSERT INTO qrp_locations (tenant_id, name, address) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, name, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Eroare la creare' });
  }
});

router.put('/:id/locations/:locId', async (req, res) => {
  try {
    const { name, address } = req.body;
    const result = await pool.query(
      'UPDATE qrp_locations SET name=$1, address=$2 WHERE id=$3 AND tenant_id=$4 RETURNING *',
      [name, address, req.params.locId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
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
