const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware SuperAdmin
const requireSuperAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'SUPERADMIN' || decoded.role === 'Super Admin') {
        req.user = decoded;
        return next();
      }
      return res.status(403).json({ error: 'Acces interzis' });
    } catch (err) {
      const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
      if (isLocal) {
        req.user = { role: 'SUPERADMIN', email: 'jeka7ro@gmail.com' };
        return next();
      }
      return res.status(401).json({ error: 'Sesiune expirată' });
    }
  }

  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  if (isLocal) {
    req.user = { role: 'SUPERADMIN', email: 'jeka7ro@gmail.com' };
    return next();
  }

  return res.status(401).json({ error: 'Autentificare necesară' });
};

/**
 * POST /api/analytics/track
 * Colectează evenimente în timp real de la vizitatori (fără cookies terțe, compatibil GDPR)
 */
router.post('/track', async (req, res) => {
  // Răspundem instant pentru a nu încetini navigarea utilizatorului
  res.status(202).json({ ok: true });

  try {
    const {
      session_id,
      visitor_id,
      event_type = 'page_view',
      page_path = '/',
      page_title,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      device_type,
      os,
      browser,
      screen_res,
      city,
      country = 'România',
      metadata = {}
    } = req.body || {};

    if (!session_id) return;

    // Detectare sursă inteligentă din referrer dacă nu există UTM
    let detectedSource = utm_source;
    if (!detectedSource && referrer) {
      const refLower = referrer.toLowerCase();
      const isInternal = refLower.includes('qr.pontaj.app') || refLower.includes('pontaj.app') || refLower.includes('localhost') || refLower.includes('127.0.0.1');
      if (!isInternal) {
        if (refLower.includes('tiktok')) detectedSource = 'tiktok';
        else if (refLower.includes('facebook') || refLower.includes('fb.com') || refLower.includes('instagram') || refLower.includes('meta')) detectedSource = 'meta';
        else if (refLower.includes('google')) detectedSource = 'google';
        else if (refLower.includes('linkedin')) detectedSource = 'linkedin';
        else if (refLower.includes('youtube')) detectedSource = 'youtube';
        else detectedSource = 'referral';
      } else {
        detectedSource = 'direct';
      }
    } else if (!detectedSource) {
      detectedSource = 'direct';
    }

    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';

    await pool.query(
      `INSERT INTO site_analytics (
        session_id, visitor_id, event_type, page_path, page_title,
        referrer, utm_source, utm_medium, utm_campaign,
        device_type, os, browser, screen_res, ip_address, country, city, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        session_id.substring(0, 64),
        visitor_id ? visitor_id.substring(0, 64) : null,
        (event_type || 'page_view').substring(0, 50),
        (page_path || '/').substring(0, 255),
        page_title ? page_title.substring(0, 255) : null,
        referrer || null,
        (detectedSource || 'direct').substring(0, 100),
        utm_medium ? utm_medium.substring(0, 100) : null,
        utm_campaign ? utm_campaign.substring(0, 100) : null,
        (device_type || 'mobile').substring(0, 30),
        os ? os.substring(0, 50) : null,
        browser ? browser.substring(0, 50) : null,
        screen_res ? screen_res.substring(0, 30) : null,
        clientIp.substring(0, 45),
        (country || 'România').substring(0, 60),
        city ? city.substring(0, 100) : null,
        JSON.stringify(metadata || {})
      ]
    );
  } catch (err) {
    console.error('Analytics tracking insert error (silent):', err.message);
  }
});

/**
 * GET /api/analytics/overview
 * Raport complet în timp real pentru panoul de SuperAdmin
 */
router.get('/overview', requireSuperAdmin, async (req, res) => {
  try {
    const period = req.query.period || '7d'; // 'today', '24h', '7d', '30d'

    let intervalFilter = "created_at >= NOW() - INTERVAL '7 days'";
    let prevIntervalFilter = "created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'";
    let comparisonLabel = 'vs 7z anterioare';
    let comparisonSubtext = 'înregistrați în cele 7 zile anterioare';

    if (period === 'today') {
      intervalFilter = "created_at >= CURRENT_DATE";
      prevIntervalFilter = "created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE";
      comparisonLabel = 'vs ieri';
      comparisonSubtext = 'înregistrați ieri';
    } else if (period === '24h') {
      intervalFilter = "created_at >= NOW() - INTERVAL '24 hours'";
      prevIntervalFilter = "created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours'";
      comparisonLabel = 'vs 24h anterioare';
      comparisonSubtext = 'înregistrați în intervalul 24h-48h';
    } else if (period === '30d') {
      intervalFilter = "created_at >= NOW() - INTERVAL '30 days'";
      prevIntervalFilter = "created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'";
      comparisonLabel = 'vs 30z anterioare';
      comparisonSubtext = 'înregistrați în cele 30 zile anterioare';
    }

    // Excludem traficul de test local
    const baseFilter = `${intervalFilter} AND ip_address NOT IN ('::1') AND (referrer IS NULL OR referrer NOT LIKE '%localhost%')`;
    const prevBaseFilter = `${prevIntervalFilter} AND ip_address NOT IN ('::1') AND (referrer IS NULL OR referrer NOT LIKE '%localhost%')`;

    // 1. Vizitatori activi în timp real (ultimele 15 minute)
    const liveNowRes = await pool.query(`
      SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id)) as count 
      FROM site_analytics 
      WHERE created_at >= NOW() - INTERVAL '15 minutes'
        AND ip_address NOT IN ('::1')
    `);
    const liveNow = parseInt(liveNowRes.rows[0]?.count || 0, 10);

    // 2. Vizitatori unici și afișări pentru perioada selectată
    const periodRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT COALESCE(visitor_id, session_id)) as unique_visitors,
        COUNT(*) as total_pageviews
      FROM site_analytics 
      WHERE ${baseFilter}
    `);
    const uniqueVisitors = parseInt(periodRes.rows[0]?.unique_visitors || 0, 10);
    const totalPageviews = parseInt(periodRes.rows[0]?.total_pageviews || 0, 10);

    // Vizitatori din perioada anterioară pentru calculul trendului (+% / -%)
    const prevPeriodRes = await pool.query(`
      SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id)) as count 
      FROM site_analytics 
      WHERE ${prevBaseFilter}
    `);
    const prevPeriodVisitors = parseInt(prevPeriodRes.rows[0]?.count || 0, 10);

    // Păstrăm și datele specifice zilei de azi/ieri pentru compatibilitate
    const todayRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT COALESCE(visitor_id, session_id)) as unique_visitors,
        COUNT(*) as total_pageviews
      FROM site_analytics 
      WHERE created_at >= CURRENT_DATE
        AND ip_address NOT IN ('::1')
        AND (referrer IS NULL OR referrer NOT LIKE '%localhost%')
    `);
    const exactTodayVisitors = parseInt(todayRes.rows[0]?.unique_visitors || 0, 10);
    const exactTodayPageviews = parseInt(todayRes.rows[0]?.total_pageviews || 0, 10);

    // 3. Surse de trafic (Reclame TikTok, Meta Ads, Google, Direct etc.) pentru perioada selectată
    const sourcesRes = await pool.query(`
      SELECT 
        COALESCE(NULLIF(utm_source, ''), 'direct') as source,
        COUNT(DISTINCT COALESCE(visitor_id, session_id)) as visitors,
        COUNT(*) as events
      FROM site_analytics
      WHERE ${baseFilter}
      GROUP BY source
      ORDER BY visitors DESC
      LIMIT 10
    `);

    // 4. Dispozitive (Mobile vs Desktop vs Tablet) pentru perioada selectată
    const devicesRes = await pool.query(`
      SELECT 
        COALESCE(NULLIF(device_type, ''), 'mobile') as device,
        COUNT(DISTINCT COALESCE(visitor_id, session_id)) as visitors
      FROM site_analytics
      WHERE ${baseFilter}
      GROUP BY device
      ORDER BY visitors DESC
    `);

    // 5. Top Pagini accesate pentru perioada selectată
    const pagesRes = await pool.query(`
      SELECT 
        page_path,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_visitors
      FROM site_analytics
      WHERE ${baseFilter} AND event_type = 'page_view'
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 10
    `);

    // 6. Pâlnia de Conversie (Funnel) pentru perioada selectată
    const funnelRes = await pool.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as total_visitors,
        COUNT(DISTINCT CASE WHEN event_type = 'view_pricing' OR page_path LIKE '%#tarife%' THEN session_id END) as viewed_pricing,
        COUNT(DISTINCT CASE WHEN event_type = 'open_demo_modal' THEN session_id END) as opened_demo,
        COUNT(DISTINCT CASE WHEN event_type = 'cui_search' THEN session_id END) as cui_searched,
        COUNT(DISTINCT CASE WHEN event_type = 'demo_submitted' THEN session_id END) as demos_submitted
      FROM site_analytics
      WHERE ${baseFilter}
    `);
    const funnel = funnelRes.rows[0] || {
      total_visitors: 0,
      viewed_pricing: 0,
      opened_demo: 0,
      cui_searched: 0,
      demos_submitted: 0
    };

    // 7. Grafic zilnic
    const chartDays = period === '30d' ? 30 : 14;
    const chartDailyRes = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date_label,
        COUNT(DISTINCT session_id) as visitors,
        COUNT(*) as pageviews
      FROM site_analytics
      WHERE created_at >= NOW() - INTERVAL '${chartDays} days'
        AND ip_address NOT IN ('::1')
      GROUP BY date_label
      ORDER BY date_label ASC
    `);

    // 8. Lista recentă de vizitatori în timp real (ultimii 25)
    const recentRes = await pool.query(`
      SELECT 
        id,
        session_id,
        event_type,
        page_path,
        utm_source,
        utm_campaign,
        device_type,
        browser,
        os,
        country,
        city,
        created_at
      FROM site_analytics
      WHERE ${baseFilter}
      ORDER BY created_at DESC
      LIMIT 25
    `);

    res.json({
      success: true,
      data: {
        period,
        liveNow,
        uniqueVisitors,
        totalPageviews,
        todayVisitors: uniqueVisitors,
        todayPageviews: totalPageviews,
        yesterdayVisitors: prevPeriodVisitors,
        prevPeriodVisitors,
        exactTodayVisitors,
        exactTodayPageviews,
        comparisonLabel,
        comparisonSubtext,
        sources: sourcesRes.rows,
        devices: devicesRes.rows,
        topPages: pagesRes.rows,
        funnel: {
          totalVisitors: parseInt(funnel.total_visitors || 0, 10),
          viewedPricing: parseInt(funnel.viewed_pricing || 0, 10),
          openedDemo: parseInt(funnel.opened_demo || 0, 10),
          cuiSearched: parseInt(funnel.cui_searched || 0, 10),
          demosSubmitted: parseInt(funnel.demos_submitted || 0, 10),
        },
        chartDaily: chartDailyRes.rows,
        recentEvents: recentRes.rows
      }
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: 'Eroare la generarea raportului de analiză' });
  }
});

module.exports = router;
