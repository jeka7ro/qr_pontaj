const express = require('express');
const router = express.Router();
const pool = require('../db');

// Global object to store active SSE connections per location
// Format: { [locationId]: [res1, res2, ...] }
const sseClients = {};
const adminSseClients = {};


// SSE Endpoint for Admin Dashboard
router.get('/admin-stream/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  res.write(`data: {"status": "connected"}\n\n`);

  if (!adminSseClients[tenantId]) {
    adminSseClients[tenantId] = [];
  }
  adminSseClients[tenantId].push(res);

  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    if (adminSseClients[tenantId]) {
      adminSseClients[tenantId] = adminSseClients[tenantId].filter(client => client !== res);
    }
  });
});

// SSE Endpoint for Kiosk Displays
router.get('/stream/:kioskId', (req, res) => {
  const { kioskId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection heartbeat
  res.write(`data: {"status": "connected"}\n\n`);

  if (!sseClients[kioskId]) {
    sseClients[kioskId] = [];
  }
  sseClients[kioskId].push(res);

  // Periodic keepalive to prevent proxy/browser timeouts
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 20000);

  // Remove client when connection closes
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    if (sseClients[kioskId]) {
      sseClients[kioskId] = sseClients[kioskId].filter(client => client !== res);
    }
  });
});

// Verificare status (Intrat/Ieșit) inainte de a ponta
router.post('/status', async (req, res) => {
  const { employee_code, pin_code, tenant_id, kiosk_id } = req.body;
  try {
    const empResult = await pool.query(
      'SELECT id, first_name, last_name, avatar_path FROM qrp_employees WHERE employee_code = $1 AND pin_code = $2 AND tenant_id = $3',
      [employee_code, pin_code, tenant_id]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cod angajat sau PIN incorect.' });
    }

    const employee = empResult.rows[0];
    const lastEntryRes = await pool.query(
      'SELECT action_type FROM qrp_timesheets WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1',
      [employee.id]
    );

    let lastAction = 'OUT';
    if (lastEntryRes.rows.length > 0) {
      lastAction = lastEntryRes.rows[0].action_type;
      const lastCreated = new Date(lastEntryRes.rows[0].created_at);
      const diffHours = (Date.now() - lastCreated.getTime()) / (1000 * 3600);
      // Daca a uitat sa ponteze IESIRE si au trecut >14 ore, tratam ca OUT pentru a-i permite INTRARE in noua tura
      if (lastAction === 'IN' && diffHours > 14) {
        lastAction = 'OUT';
      }
    }
    
    // Obține setarea kiosk_show_photo
    let showPhoto = true;
    if (kiosk_id) {
      const kioskRes = await pool.query('SELECT kiosk_show_photo FROM qrp_kiosks WHERE id = $1', [kiosk_id]);
      if (kioskRes.rows.length > 0) {
        showPhoto = kioskRes.rows[0].kiosk_show_photo;
      }
    }

    res.json({ 
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: employee.avatar_path
      },
      lastAction,
      showPhoto
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Eroare la verificarea statusului' });
  }
});

// Inregistrare pontaj
router.post('/', async (req, res) => {
  const { employee_code, pin_code, tenant_id, kiosk_id, type } = req.body;

  try {
    // 1. Gaseste angajatul
    const empResult = await pool.query(
      'SELECT id, first_name, last_name, avatar_path FROM qrp_employees WHERE employee_code = $1 AND pin_code = $2 AND tenant_id = $3',
      [employee_code, pin_code, tenant_id]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cod angajat sau PIN incorect.' });
    }

    const employee = empResult.rows[0];

    // 2. Prevent consecutive duplicate actions + cooldown 60s
    const lastEntryRes = await pool.query(
      'SELECT action_type, created_at FROM qrp_timesheets WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1',
      [employee.id]
    );
    if (lastEntryRes.rows.length > 0) {
      const lastAction = lastEntryRes.rows[0].action_type;
      const lastTime = new Date(lastEntryRes.rows[0].created_at);
      const secondsSince = (Date.now() - lastTime.getTime()) / 1000;
      
      // Cooldown 60 secunde
      if (secondsSince < 60) {
        return res.status(400).json({ error: `Ai scanat prea repede. Așteaptă ${Math.ceil(60 - secondsSince)} secunde.` });
      }
      
      const isStaleIn = lastAction === 'IN' && (secondsSince > 14 * 3600);

      if (type === 'IN' && lastAction === 'IN' && !isStaleIn) {
        return res.status(400).json({ error: 'Sunteți deja pontat la intrare!' });
      }
      if (type === 'OUT' && lastAction === 'OUT') {
        return res.status(400).json({ error: 'Sunteți deja pontat la ieșire!' });
      }
    }

    // 2.5 Resolve location_id and show_photo from kiosk_id
    let location_id = null;
    let showPhoto = true;
    if (kiosk_id) {
      const kioskRes = await pool.query('SELECT location_id, kiosk_show_photo FROM qrp_kiosks WHERE id = $1', [kiosk_id]);
      if (kioskRes.rows.length > 0) {
        location_id = kioskRes.rows[0].location_id;
        showPhoto = kioskRes.rows[0].kiosk_show_photo;
      }
    }

    if (!location_id) {
      return res.status(400).json({ error: 'Acest Kiosk nu este alocat niciunui Punct de Lucru valid.' });
    }

    // 3. Inserare timesheet cu location_id (site_id in db)
    let newTimesheet;
    try {
      const tsResult = await pool.query(
        'INSERT INTO qrp_timesheets (tenant_id, employee_id, action_type, site_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [tenant_id, employee.id, type, location_id]
      );
      newTimesheet = tsResult.rows[0];
    } catch (insertErr) {
      console.error("Eroare la inserare in qrp_timesheets:", insertErr);
      throw insertErr;
    }

    // Daca s-a înregistrat o IESIRE, calculăm automat nr de ore pentru schimbul respectiv
    if (type === 'OUT') {
      const previousInRes = await pool.query(
        'SELECT id, created_at FROM qrp_timesheets WHERE employee_id=$1 AND action_type=$2 ORDER BY created_at DESC LIMIT 1',
        [employee.id, 'IN']
      );
      
      if (previousInRes.rows.length > 0) {
        // qrp_timesheets doesn't have an hours_worked column in the current schema
        // The hours worked calculation should be done at query time for reporting,
        // or a migration should be created to add this column.
      }
    }

    // 4. Salvare in istoric detalii
    await pool.query(
      'INSERT INTO qrp_employee_history (employee_id, change_type, new_value) VALUES ($1, $2, $3)',
      [employee.id, 'pontaj', `Pontaj ${type === 'IN' ? 'INTRARE' : 'IEȘIRE'} înregistrat via QR. Kiosk ID: ${kiosk_id}`]
    );

    const eventPayload = {
      type: type,
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: employee.avatar_path,
        showPhoto: showPhoto
      }
    };

    // Check if late (only for IN)
    let isLate = false;
    let shiftStart = null;
    let expectedTimeFormatted = null;

    if (type === 'IN') {
      const shiftRes = await pool.query(
        'SELECT start_time FROM qrp_shifts WHERE employee_id = $1 AND date = CURRENT_DATE LIMIT 1',
        [employee.id]
      );
      if (shiftRes.rows.length > 0) {
        shiftStart = shiftRes.rows[0].start_time; // e.g. "09:00:00"
        expectedTimeFormatted = shiftStart.substring(0, 5);
        
        // Time calculations (timezone independent, using local server time for simple matching)
        const now = new Date();
        const scanTime = now.getHours() * 60 + now.getMinutes(); 
        const [h, m] = shiftStart.split(':');
        const expectedTime = parseInt(h) * 60 + parseInt(m);
        
        // Late if scanned more than 5 minutes after shift start
        if (scanTime > expectedTime + 5) {
          isLate = true;
        }
      }
    }

    const eventPayload = {
      type: type,
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: employee.avatar_path,
        showPhoto: showPhoto
      }
    };

    const adminEventPayload = {
      type: type, // 'IN' or 'OUT'
      timesheet_id: newTimesheet ? newTimesheet.id : null,
      timestamp: new Date().toISOString(),
      isLate: isLate,
      shiftStart: expectedTimeFormatted,
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: employee.avatar_path
      }
    };

    // Emite eveniment catre Admin Dashboard (Live Updates)
    if (adminSseClients[tenant_id]) {
      adminSseClients[tenant_id].forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(adminEventPayload)}\n\n`);
        } catch(e) {}
      });
    }

    // Emite eveniment catre Kiosk-ul din acea locatie
    if (kiosk_id && sseClients[kiosk_id]) {
      sseClients[kiosk_id].forEach(client => {
        try {
          client.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
        } catch(e) {}
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pontaj inregistrat cu succes',
      timesheet_id: newTimesheet.id,
      employee: {
        first_name: employee.first_name,
        last_name: employee.last_name,
        avatar_path: employee.avatar_path,
        showPhoto
      }
    });
  } catch (err) {
    console.error('Eroare pontaj:', err);
    res.status(500).json({ error: 'Eroare la înregistrarea pontajului.' });
  }
});

// Solicitare resetare PIN de catre angajat
router.post('/reset-pin-request', async (req, res) => {
  const { employee_code, tenant_id } = req.body;
  if (!employee_code || !tenant_id) {
    return res.status(400).json({ error: 'Cod angajat și ID companie obligatorii.' });
  }

  try {
    const empResult = await pool.query(
      'SELECT id FROM qrp_employees WHERE employee_code = $1 AND tenant_id = $2',
      [employee_code, tenant_id]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cod angajat invalid.' });
    }

    await pool.query(
      'UPDATE qrp_employees SET pin_reset_requested = TRUE WHERE id = $1',
      [empResult.rows[0].id]
    );

    res.json({ success: true, message: 'Cererea de resetare a fost trimisă cu succes către administrator.' });
  } catch (err) {
    console.error('Eroare la cererea de resetare PIN:', err);
    res.status(500).json({ error: 'Eroare internă de server.' });
  }
});


router.notifyAdmin = (tenantId, eventData) => {
  if (adminSseClients[tenantId]) {
    adminSseClients[tenantId].forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(eventData)}\n\n`);
      } catch (e) {}
    });
  }
};
module.exports = router;

