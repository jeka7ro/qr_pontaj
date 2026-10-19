const express = require('express');
const router = express.Router();
const { lookupAnafCompany } = require('../services/anafService');

// GET /api/company/lookup?cui=42322117
router.get('/lookup', async (req, res) => {
  try {
    const rawCui = req.query.cui || req.query.query || '';
    const cleanCui = String(rawCui).replace(/[^0-9]/g, '');

    if (!cleanCui) {
      return res.status(400).json({ success: false, message: 'CUI invalid sau lipsă' });
    }

    const company = await lookupAnafCompany(cleanCui);
    if (!company) {
      return res.json({ success: false, found: false, message: 'Compania nu a fost găsită în registrul ANAF' });
    }

    return res.json({
      success: true,
      found: true,
      company
    });
  } catch (err) {
    console.error('Eroare lookup ANAF:', err);
    return res.status(500).json({ success: false, message: 'Eroare internă la interogare' });
  }
});

module.exports = router;
