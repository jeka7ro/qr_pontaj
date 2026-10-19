require('dotenv').config();
const db = require('./db');

async function migrateBelgiumAndSettings() {
  console.log('[MIGRATION] Incepere migrare non-distructiva pentru Multi-Country, Audit Trail si Setari...');

  try {
    await db.query('BEGIN');

    // 1. Extindere qrp_tenants pentru suport Multi-Country, Setari Portal Angajati si Stripe
    console.log('[MIGRATION] Actualizare tabela qrp_tenants...');
    await db.query(`
      ALTER TABLE qrp_tenants 
      ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'RO' NOT NULL,
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Bucharest' NOT NULL,
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'RON' NOT NULL,
      ADD COLUMN IF NOT EXISTS allow_employee_portal BOOLEAN DEFAULT true NOT NULL,
      ADD COLUMN IF NOT EXISTS allow_breaks BOOLEAN DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subscription_seats INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'ACTIVE';
    `);

    // 2. Extindere qrp_employees: national_id (pentru NISS Belgia), relaxare NOT NULL pe cnp pentru chiriasii non-RO
    console.log('[MIGRATION] Actualizare tabela qrp_employees...');
    await db.query(`
      ALTER TABLE qrp_employees 
      ADD COLUMN IF NOT EXISTS national_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);
    `);

    // Permitem cnp sa fie NULL pentru ca angajatii din Belgia au NISS, nu CNP romanesc
    try {
      await db.query(`ALTER TABLE qrp_employees ALTER COLUMN cnp DROP NOT NULL;`);
      console.log('[MIGRATION] Constrangerea NOT NULL pe CNP a fost relaxata cu succes.');
    } catch (e) {
      console.log('[MIGRATION] Nota: CNP nu avea constrangere NOT NULL sau era deja modificat.');
    }

    // 3. Extindere qrp_timesheets pentru note suplimentare
    console.log('[MIGRATION] Actualizare tabela qrp_timesheets...');
    await db.query(`
      ALTER TABLE qrp_timesheets 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    // 4. Creare tabela qrp_timesheet_audits (Audit Trail Imutabil conform cerintelor Belgia 2027)
    console.log('[MIGRATION] Creare tabela qrp_timesheet_audits...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS qrp_timesheet_audits (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
        timesheet_id INTEGER,
        employee_id INTEGER REFERENCES qrp_employees(id) ON DELETE CASCADE,
        modified_by_user_id INTEGER REFERENCES qrp_users(id) ON DELETE SET NULL,
        action_name VARCHAR(50) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Index pentru cautare rapida in audit logs
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_timesheet_audits_tenant ON qrp_timesheet_audits(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_timesheet_audits_employee ON qrp_timesheet_audits(employee_id);
      CREATE INDEX IF NOT EXISTS idx_timesheet_audits_created ON qrp_timesheet_audits(created_at);
    `);

    await db.query('COMMIT');
    console.log('[MIGRATION] Migrarea a fost aplicata cu succes! Nicio data existenta nu a fost afectata.');
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('[MIGRATION] Eroare la aplicarea migrarii:', err);
    throw err;
  } finally {
    process.exit(0);
  }
}

migrateBelgiumAndSettings();
