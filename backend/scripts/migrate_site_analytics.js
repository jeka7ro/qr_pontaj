const pool = require('../db');

async function migrate() {
  console.log('Creating site_analytics table...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_analytics (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        visitor_id VARCHAR(64),
        event_type VARCHAR(50) DEFAULT 'page_view',
        page_path VARCHAR(255) DEFAULT '/',
        page_title VARCHAR(255),
        referrer TEXT,
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        device_type VARCHAR(30),
        os VARCHAR(50),
        browser VARCHAR(50),
        screen_res VARCHAR(30),
        ip_address VARCHAR(45),
        country VARCHAR(60) DEFAULT 'România',
        city VARCHAR(100),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON site_analytics(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_site_analytics_session_id ON site_analytics(session_id);
      CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON site_analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_site_analytics_utm_source ON site_analytics(utm_source);
    `);
    console.log('site_analytics table created successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
