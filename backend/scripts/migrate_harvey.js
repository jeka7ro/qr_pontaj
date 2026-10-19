const db = require('../db');

async function migrate() {
  try {
    console.log('Running migration for Harvey Sales Agent tables...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_settings (
        id SERIAL PRIMARY KEY,
        anthropic_api_key TEXT,
        sender_name VARCHAR(100) DEFAULT 'Smart QR Pontaj',
        sender_email VARCHAR(255) DEFAULT 'jeka7ro@gmail.com',
        daily_send_limit INT DEFAULT 25,
        default_pitch VARCHAR(100) DEFAULT 'pontaj_digital',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Inserăm un rând implicit în sales_settings dacă nu există
    const settingsCheck = await db.query('SELECT id FROM sales_settings LIMIT 1');
    if (settingsCheck.rows.length === 0) {
      await db.query(`
        INSERT INTO sales_settings (sender_name, sender_email, daily_send_limit, default_pitch)
        VALUES ('Smart QR Pontaj', 'jeka7ro@gmail.com', 25, 'pontaj_digital');
      `);
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        city VARCHAR(100),
        pitch_focus VARCHAR(100) DEFAULT 'pontaj_digital',
        daily_limit INT DEFAULT 20,
        claude_model VARCHAR(50) DEFAULT 'claude-3-5-sonnet-20241022',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sales_leads (
        id SERIAL PRIMARY KEY,
        campaign_id INT REFERENCES sales_campaigns(id) ON DELETE SET NULL,
        company_name VARCHAR(255) NOT NULL,
        cui VARCHAR(50),
        city VARCHAR(100),
        address TEXT,
        website VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        contact_person VARCHAR(255),
        industry VARCHAR(100),
        ai_hook TEXT,
        draft_subject TEXT,
        draft_body TEXT,
        status VARCHAR(50) DEFAULT 'pending_review',
        email_sent_at TIMESTAMP WITH TIME ZONE,
        converted_tenant_id INT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.end();
  }
}

migrate();
