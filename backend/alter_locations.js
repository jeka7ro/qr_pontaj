const pool = require('./db');

async function checkLocations() {
    try {
        await pool.query(`
            ALTER TABLE qrp_locations 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
            ADD COLUMN IF NOT EXISTS radius INTEGER DEFAULT 100;
        `);
        console.log("qrp_locations altered successfully with geofence columns.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkLocations();
