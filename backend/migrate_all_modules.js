const pool = require('./db');

async function migrateAll() {
    const client = await pool.connect();
    try {
        console.log('Starting massive migration for all 10 modules...');
        await client.query('BEGIN');

        // 1. Zile Libere (Leaves)
        await client.query(`
            CREATE TABLE IF NOT EXISTS qrp_leaves (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
                employee_id INTEGER REFERENCES qrp_employees(id) ON DELETE CASCADE,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                leave_type VARCHAR(50) NOT NULL, -- CO, CM, INVOIRE
                status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Geofence (Modificare qrp_sites dacă e nevoie. Au deja lat, lng, allowed_radius_meters. E perfect.)

        // 5. Facturare
        await client.query(`
            CREATE TABLE IF NOT EXISTS qrp_invoices (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
                amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(20) DEFAULT 'UNPAID', -- UNPAID, PAID
                due_date DATE,
                pdf_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. Revisal Contracts
        await client.query(`
            CREATE TABLE IF NOT EXISTS qrp_contracts (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
                employee_id INTEGER REFERENCES qrp_employees(id) ON DELETE CASCADE,
                salary DECIMAL(10, 2),
                cor_code VARCHAR(20),
                hire_date DATE,
                contract_number VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7. ERP & Proiecte
        await client.query(`
            CREATE TABLE IF NOT EXISTS qrp_projects (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                budget DECIMAL(12, 2),
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 9. WhatsApp Alerts
        await client.query(`
            CREATE TABLE IF NOT EXISTS qrp_whatsapp_settings (
                tenant_id INTEGER PRIMARY KEY REFERENCES qrp_tenants(id) ON DELETE CASCADE,
                phone_number VARCHAR(50),
                alerts_enabled BOOLEAN DEFAULT false,
                notify_late BOOLEAN DEFAULT true,
                notify_overtime BOOLEAN DEFAULT false
            );
        `);

        // 10. Assets (Gestiune Echipamente)
        await client.query(`
            CREATE TABLE IF NOT EXISTS qrp_assets (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                serial_number VARCHAR(100),
                assigned_to INTEGER REFERENCES qrp_employees(id) ON DELETE SET NULL,
                status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED, MAINTENANCE
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('Migration successful for all premium modules!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrateAll();
