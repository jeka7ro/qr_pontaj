require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS qrp_employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES qrp_tenants(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        cnp VARCHAR(20) UNIQUE,
        id_card_series VARCHAR(20),
        birth_date DATE,
        address TEXT,
        avatar_path TEXT,
        job_title VARCHAR(100),
        pin_code VARCHAR(10),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Created qrp_employees table.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS qrp_timesheets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES qrp_tenants(id) ON DELETE CASCADE,
        employee_id UUID REFERENCES qrp_employees(id) ON DELETE CASCADE,
        site_id UUID REFERENCES qrp_sites(id) ON DELETE SET NULL,
        action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('IN', 'OUT')),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(10, 8),
        photo_url TEXT
      );
    `);
    console.log("Created qrp_timesheets table.");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
