const pool = require('./db');

async function migrate() {
  try {
    console.log("Adding evaluation columns to qrp_employees...");
    
    await pool.query(`
      ALTER TABLE qrp_employees 
      ADD COLUMN IF NOT EXISTS eval_punctuality INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS eval_attendance INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS eval_attitude INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS eval_performance INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS eval_reliability INTEGER DEFAULT 10;
    `);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

migrate();
