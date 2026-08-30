require('dotenv').config();
const pool = require('./db');
async function run() {
  try {
    await pool.query(`ALTER TABLE qrp_tenants ADD COLUMN portal_bg_image_url TEXT;`);
    console.log('Added portal_bg_image_url');
  } catch(e) { console.log('portal_bg_image_url might exist:', e.message); }
  
  try {
    await pool.query(`ALTER TABLE qrp_tenants ADD COLUMN portal_bg_color VARCHAR(50);`);
    console.log('Added portal_bg_color');
  } catch(e) { console.log('portal_bg_color might exist:', e.message); }
  
  process.exit(0);
}
run();
