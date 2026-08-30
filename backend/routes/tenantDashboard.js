const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware: Trebuie să fii logat și să fii TENANT_ADMIN
router.use(authenticateToken);
router.use(requireRole('TENANT_ADMIN'));

// GET /api/tenant/dashboard/info - Preia detaliile companiei (tenant) + setările locației (site)
router.get('/info', async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Acest utilizator nu este asociat unui tenant.' });
    }

    // Luăm datele tenant-ului
    const tenantQuery = `
      SELECT id, name, logo_url, favicon_url, theme_color, created_at, modules 
      FROM qrp_tenants 
      WHERE id = $1
    `;
    const tenantResult = await pool.query(tenantQuery, [tenantId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Compania nu a fost găsită.' });
    }

    const tenant = tenantResult.rows[0];

    // Luăm datele locației (site) asociate acestui tenant (pentru generarea QR)
    const siteQuery = `
      SELECT id, name as tip_modul, qr_mode, allowed_radius_meters 
      FROM qrp_sites 
      WHERE tenant_id = $1 
      ORDER BY id ASC LIMIT 1
    `;
    const siteResult = await pool.query(siteQuery, [tenantId]);
    const site = siteResult.rows[0] || null;

    res.json({
      tenant,
      site
    });
  } catch (error) {
    console.error('Error fetching tenant dashboard info:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

module.exports = router;
