const Stripe = require('stripe');
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendWelcomeEmail } = require('./emailService');

/**
 * Creeaza o sesiune de Stripe Checkout pentru abonare per-seat
 */
async function createCheckoutSession({
  tenantId = null,
  companyName,
  subdomain,
  adminEmail,
  adminName,
  vatNumber = '',
  billingAddress = '',
  seats = 10,
  countryCode = 'BE',
  successUrl,
  cancelUrl
}) {
  const parsedSeats = Math.max(1, parseInt(seats, 10) || 1);
  const priceId = process.env.STRIPE_PRICE_ID_EUR;

  if (!priceId) {
    throw new Error('STRIPE_PRICE_ID_EUR nu este configurat');
  }

  const cleanSubdomain = (subdomain || companyName || 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 30);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: parsedSeats
      }
    ],
    customer_email: adminEmail,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: {
      enabled: true
    },
    subscription_data: {
      metadata: {
        tenant_id: tenantId ? tenantId.toString() : '',
        company_name: companyName,
        subdomain: cleanSubdomain,
        country_code: countryCode,
        seats: parsedSeats.toString(),
        vat_number: vatNumber || '',
        billing_address: billingAddress || ''
      }
    },
    metadata: {
      tenant_id: tenantId ? tenantId.toString() : '',
      company_name: companyName,
      subdomain: cleanSubdomain,
      admin_email: adminEmail,
      admin_name: adminName || companyName,
      country_code: countryCode,
      seats: parsedSeats.toString(),
      vat_number: vatNumber || '',
      billing_address: billingAddress || ''
    },
    success_url: successUrl || `https://${cleanSubdomain}.pontaj.app/setup-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `https://qr.pontaj.app/pricing`
  });

  return {
    url: session.url,
    session_id: session.id
  };
}

/**
 * Creeaza o sesiune pentru Portalul Clientului Stripe (Customer Portal)
 */
async function createPortalSession(customerId, returnUrl) {
  if (!customerId) {
    throw new Error('Customer ID Stripe lipseste');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || 'https://qr.pontaj.app'
  });

  return { url: session.url };
}

/**
 * Actualizeaza numarul de locuri (seats) al unui abonament cu calcul prorata automat
 */
async function updateSubscriptionSeats(subscriptionId, newSeats) {
  const parsedSeats = Math.max(1, parseInt(newSeats, 10));

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (!subscription || !subscription.items || !subscription.items.data.length) {
    throw new Error('Abonamentul nu are iteme active in Stripe');
  }

  const itemId = subscription.items.data[0].id;

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemId,
        quantity: parsedSeats
      }
    ],
    proration_behavior: 'create_prorations'
  });

  // Actualizam in baza de date
  await db.query(
    `UPDATE qrp_tenants 
     SET subscription_seats = $1, subscription_status = $2 
     WHERE stripe_subscription_id = $3`,
    [parsedSeats, updatedSubscription.status.toUpperCase(), subscriptionId]
  );

  return {
    success: true,
    subscription_id: subscriptionId,
    seats: parsedSeats,
    status: updatedSubscription.status
  };
}

/**
 * Proceseaza evenimentele Webhook de la Stripe
 */
async function handleWebhookEvent(event) {
  const eventType = event.type;
  const dataObject = event.data.object;

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = dataObject;
      const metadata = session.metadata || {};
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const seats = parseInt(metadata.seats, 10) || 10;
      const companyName = metadata.company_name || 'Companie Noua';
      const subdomain = (metadata.subdomain || 'client').toLowerCase().replace(/[^a-z0-9]/g, '');
      const countryCode = metadata.country_code || 'BE';
      const adminEmail = metadata.admin_email || session.customer_email;
      const adminName = metadata.admin_name || 'Admin';
      const vatNumber = metadata.vat_number || '';
      const billingAddress = metadata.billing_address || '';
      const vatStatus = vatNumber ? 'VALID' : 'PENDING';

      // 1. Verificam daca tenantul exista deja (dupa ID sau subdomeniu)
      let tenantId = metadata.tenant_id ? parseInt(metadata.tenant_id, 10) : null;
      let existingTenant = null;

      if (tenantId) {
        const tRes = await db.query(`SELECT id FROM qrp_tenants WHERE id = $1`, [tenantId]);
        if (tRes.rows.length > 0) existingTenant = tRes.rows[0];
      }

      if (!existingTenant) {
        const subRes = await db.query(`SELECT id FROM qrp_tenants WHERE subdomain = $1`, [subdomain]);
        if (subRes.rows.length > 0) existingTenant = subRes.rows[0];
      }

      if (existingTenant) {
        // Actualizare tenant existent
        await db.query(`
          UPDATE qrp_tenants
          SET 
            stripe_customer_id = $1,
            stripe_subscription_id = $2,
            subscription_seats = $3,
            subscription_status = 'ACTIVE',
            billing_per_employee = true,
            price_per_employee = 9.90,
            currency = 'EUR',
            vat_number = COALESCE(NULLIF($5, ''), vat_number),
            vat_status = $6,
            billing_address = COALESCE(NULLIF($7, ''), billing_address)
          WHERE id = $4
        `, [customerId, subscriptionId, seats, existingTenant.id, vatNumber, vatStatus, billingAddress]);

        // Verificam daca are site configurat
        const existingSite = await db.query(`SELECT id FROM qrp_sites WHERE tenant_id = $1 LIMIT 1`, [existingTenant.id]);
        if (existingSite.rows.length === 0) {
          await db.query(`
            INSERT INTO qrp_sites (tenant_id, name, qr_mode, allowed_radius_meters)
            VALUES ($1, $2, $3, $4)
          `, [existingTenant.id, 'Sediul Principal', 'DYNAMIC', 100]);
        }

        // Verificam daca are cont user creat
        if (adminEmail) {
          const userCheck = await db.query(`SELECT id FROM qrp_users WHERE email = $1`, [adminEmail]);
          if (userCheck.rows.length === 0) {
            const tempPassword = crypto.randomBytes(6).toString('hex');
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            await db.query(`
              INSERT INTO qrp_users (
                tenant_id, email, password_hash, name, role
              ) VALUES (
                $1, $2, $3, $4, $5
              )
            `, [existingTenant.id, adminEmail, hashedPassword, adminName, 'admin']);
          }
        }
      } else {
        // Creare tenant nou conform specificului belgian/european
        const newTenantRes = await db.query(`
          INSERT INTO qrp_tenants (
            name, subdomain, country_code, timezone, currency,
            allow_employee_portal, allow_breaks,
            billing_per_employee, price_per_employee,
            stripe_customer_id, stripe_subscription_id,
            subscription_seats, subscription_status,
            vat_number, vat_status, billing_address
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7,
            $8, $9,
            $10, $11,
            $12, $13,
            $14, $15, $16
          ) RETURNING id
        `, [
          companyName,
          subdomain,
          countryCode,
          countryCode === 'BE' ? 'Europe/Brussels' : 'Europe/Bucharest',
          'EUR',
          true, // portal angajati activat implicit
          true, // pauze activate conform legii belgiene
          true, // tarifare per angajat
          9.90,
          customerId,
          subscriptionId,
          seats,
          'ACTIVE',
          vatNumber || null,
          vatStatus,
          billingAddress || null
        ]);

        const createdTenantId = newTenantRes.rows[0].id;

        // Creare locatie principala initiala in qrp_sites
        await db.query(`
          INSERT INTO qrp_sites (tenant_id, name, qr_mode, allowed_radius_meters)
          VALUES ($1, $2, $3, $4)
        `, [createdTenantId, 'Sediul Principal', 'DYNAMIC', 100]);

        // Creare cont utilizator administrator daca avem email
        if (adminEmail) {
          const tempPassword = crypto.randomBytes(6).toString('hex');
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          await db.query(`
            INSERT INTO qrp_users (
              tenant_id, email, password_hash, name, role
            ) VALUES (
              $1, $2, $3, $4, $5
            ) ON CONFLICT (email) DO NOTHING
          `, [createdTenantId, adminEmail, hashedPassword, adminName, 'admin']);

          // Trimitere email automat de bun venit cu datele de conectare
          sendWelcomeEmail({
            to: adminEmail,
            userName: adminName,
            companyName: companyName,
            loginUrl: `https://${subdomain}.pontaj.app/admin/login`,
            initialPassword: tempPassword,
            subdomain: subdomain
          }).catch(err => console.error('[StripeWebhook] Eroare trimitere email bun venit:', err?.message || err));
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = dataObject;
      const subId = subscription.id;
      const status = subscription.status.toUpperCase();
      const quantity = subscription.items?.data?.[0]?.quantity || null;

      if (quantity !== null) {
        await db.query(`
          UPDATE qrp_tenants
          SET subscription_seats = $1, subscription_status = $2
          WHERE stripe_subscription_id = $3
        `, [quantity, status, subId]);
      } else {
        await db.query(`
          UPDATE qrp_tenants
          SET subscription_status = $1
          WHERE stripe_subscription_id = $2
        `, [status, subId]);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = dataObject;
      const subId = subscription.id;
      await db.query(`
        UPDATE qrp_tenants
        SET subscription_status = 'CANCELED'
        WHERE stripe_subscription_id = $1
      `, [subId]);
      break;
    }

    default:
      break;
  }

  return { received: true };
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  updateSubscriptionSeats,
  handleWebhookEvent
};
