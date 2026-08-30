const pool = require('./db');

async function migrate() {
    try {
        console.log('Creare tabel qrp_shifts...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS qrp_shifts (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
                employee_id INTEGER REFERENCES qrp_employees(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                shift_type VARCHAR(20) DEFAULT 'DAY',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Tabelul qrp_shifts creat cu succes!');
    } catch (err) {
        console.error('Eroare la migrare:', err);
    } finally {
        process.exit();
    }
}

migrate();
