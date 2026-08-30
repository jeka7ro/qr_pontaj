require('dotenv').config();
const pool = require('./db');
async function run() {
  await pool.query("UPDATE qrp_tenants SET modules = '{\"zile_libere\": true, \"hr_angajati\": true, \"export_conta\": true, \"geofence\": true, \"offline\": true, \"revisal\": true, \"erp\": true, \"ture\": true, \"facial\": true, \"whatsapp\": true, \"echipamente\": true}' WHERE id = 1");
  console.log("Modules unlocked!");
  process.exit(0);
}
run();
