const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const db = require('../db');

// GET /api/stripe/config
// Returneaza cheia publica Stripe si detaliile configuratiei publice
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    pricePerSeatEur: 9.90,
    currency: 'EUR'
  });
});

// POST /api/stripe/create-checkout-session
// Genereaza linkul Stripe Checkout pentru plata per-seat a abonamentului
router.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      tenantId,
      companyName,
      subdomain,
      adminEmail,
      adminName,
      vatNumber,
      billingAddress,
      seats,
      countryCode,
      successUrl,
      cancelUrl
    } = req.body;

    if (!companyName || !adminEmail) {
      return res.status(400).json({ error: 'Numele companiei si adresa de email sunt obligatorii' });
    }

    const sessionData = await stripeService.createCheckoutSession({
      tenantId,
      companyName,
      subdomain,
      adminEmail,
      adminName,
      vatNumber,
      billingAddress,
      seats: seats || 10,
      countryCode: countryCode || 'BE',
      successUrl,
      cancelUrl
    });

    res.json(sessionData);
  } catch (error) {
    console.error('Eroare create-checkout-session:', error);
    res.status(500).json({ error: error.message || 'Eroare la crearea sesiunii Stripe Checkout' });
  }
});

// POST /api/stripe/create-portal-session
// Redirectioneaza clientul catre Stripe Customer Portal pentru administrare card/facturi
router.post('/create-portal-session', async (req, res) => {
  try {
    const { tenantId, customerId, returnUrl } = req.body;

    let targetCustomerId = customerId;
    if (!targetCustomerId && tenantId) {
      const tenantRes = await db.query(
        `SELECT stripe_customer_id FROM qrp_tenants WHERE id = $1`,
        [tenantId]
      );
      if (tenantRes.rows.length > 0) {
        targetCustomerId = tenantRes.rows[0].stripe_customer_id;
      }
    }

    if (!targetCustomerId) {
      return res.status(400).json({ error: 'Compania nu are un cont Stripe Customer asociat' });
    }

    const portal = await stripeService.createPortalSession(targetCustomerId, returnUrl);
    res.json(portal);
  } catch (error) {
    console.error('Eroare create-portal-session:', error);
    res.status(500).json({ error: error.message || 'Eroare la crearea sesiunii portal' });
  }
});

// POST /api/stripe/update-seats
// Mareste sau micsoreaza numarul de angajati inclusi in abonament (cu calcul prorata automat)
router.post('/update-seats', async (req, res) => {
  try {
    const { tenantId, subscriptionId, newSeats } = req.body;

    let targetSubId = subscriptionId;
    if (!targetSubId && tenantId) {
      const tenantRes = await db.query(
        `SELECT stripe_subscription_id FROM qrp_tenants WHERE id = $1`,
        [tenantId]
      );
      if (tenantRes.rows.length > 0) {
        targetSubId = tenantRes.rows[0].stripe_subscription_id;
      }
    }

    if (!targetSubId) {
      return res.status(400).json({ error: 'Abonamentul Stripe nu a fost gasit' });
    }

    const result = await stripeService.updateSubscriptionSeats(targetSubId, newSeats);
    res.json(result);
  } catch (error) {
    console.error('Eroare update-seats:', error);
    res.status(500).json({ error: error.message || 'Eroare la actualizarea numarului de angajati' });
  }
});

// GET /api/stripe/subscription/:tenantId
// Returneaza statusul abonamentului Stripe pentru tenant
router.get('/subscription/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const result = await db.query(`
      SELECT 
        id, name, subdomain, country_code, currency,
        stripe_customer_id, stripe_subscription_id,
        subscription_seats, subscription_status,
        price_per_employee, billing_per_employee
      FROM qrp_tenants
      WHERE id = $1
    `, [tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant inexistent' });
    }

    const tenant = result.rows[0];

    // Numar angajati activi curenti
    const countRes = await db.query(`
      SELECT COUNT(*)::int as active_count
      FROM qrp_employees
      WHERE tenant_id = $1 AND (is_archived = false OR is_archived IS NULL)
    `, [tenantId]);

    const activeEmployees = countRes.rows[0]?.active_count || 0;
    const seats = tenant.subscription_seats || 0;
    const availableSeats = Math.max(0, seats - activeEmployees);

    res.json({
      ...tenant,
      active_employees: activeEmployees,
      available_seats: availableSeats,
      needs_upgrade: activeEmployees >= seats && seats > 0
    });
  } catch (error) {
    console.error('Eroare preluare status abonament:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stripe/webhook
// Webhook receptor pentru evenimentele automate Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    let event;
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && sig) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Daca nu este configurat webhook secret (in dev/test), parsam direct json
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    await stripeService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
