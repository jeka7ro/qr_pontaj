const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const whatsappService = require('../services/whatsappService');

// GET /api/tenants/:id/whatsapp
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM qrp_whatsapp_settings WHERE tenant_id = $1`, [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ phone_number: '', alerts_enabled: false, notify_late: true, notify_overtime: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Eroare la preluarea setarilor whatsapp' });
  }
});

// POST/PUT /api/tenants/:id/whatsapp
router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number, alerts_enabled, notify_late, notify_overtime } = req.body;
    
    // UPSERT
    const result = await db.query(
      `INSERT INTO qrp_whatsapp_settings (tenant_id, phone_number, alerts_enabled, notify_late, notify_overtime)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id) 
       DO UPDATE SET phone_number=$2, alerts_enabled=$3, notify_late=$4, notify_overtime=$5
       RETURNING *`,
      [id, phone_number, alerts_enabled, notify_late, notify_overtime]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Eroare la salvarea setarilor whatsapp' });
  }
});

// GET /api/tenants/:id/whatsapp/status
router.get('/status', (req, res) => {
  try {
    const { id } = req.params;
    const status = whatsappService.getStatus(id);
    res.json(status);
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ error: 'Eroare la preluarea statusului WhatsApp' });
  }
});

// POST /api/tenants/:id/whatsapp/logout
router.post('/logout', async (req, res) => {
  try {
    const { id } = req.params;
    await whatsappService.logout(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging out WhatsApp:', error);
    res.status(500).json({ error: 'Eroare la deconectarea WhatsApp' });
  }
});

module.exports = router;
