CREATE TABLE IF NOT EXISTS qrp_tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(255),
    favicon_url VARCHAR(255),
    theme_color VARCHAR(50) DEFAULT '#3B82F6', -- albastru default
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qrp_sites (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    allowed_radius_meters INTEGER DEFAULT 100, 
    qr_mode VARCHAR(20) DEFAULT 'STATIC', -- 'STATIC' sau 'DYNAMIC'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qrp_users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE, -- NULL pentru SuperAdmin
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'SUPERADMIN', 'TENANT_ADMIN'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qrp_employees (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
    cnp VARCHAR(13) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    pin VARCHAR(4), -- Ultimele 4 cifre din CNP
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qrp_timesheets (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES qrp_tenants(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES qrp_employees(id) ON DELETE CASCADE,
    site_id INTEGER REFERENCES qrp_sites(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL, -- 'CHECK_IN' sau 'CHECK_OUT'
    gps_lat DECIMAL(10, 8),
    gps_lng DECIMAL(11, 8),
    is_valid_gps BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
