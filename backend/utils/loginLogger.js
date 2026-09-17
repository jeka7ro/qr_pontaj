const pool = require('../db');

/**
 * Înregistrează evenimente de autentificare în tabela qrp_login_logs
 */
async function logLoginEvent({
  tenant_id = null,
  tenant_name = null,
  user_id = null,
  email = null,
  user_name = null,
  role = null,
  login_type = 'ADMIN',
  ip_address = null,
  user_agent = null,
  status = 'SUCCESS',
  failure_reason = null
}) {
  try {
    let resolvedTenantName = tenant_name;
    if (!resolvedTenantName && tenant_id) {
      const tRes = await pool.query('SELECT name FROM qrp_tenants WHERE id = $1', [tenant_id]);
      if (tRes.rows.length > 0) {
        resolvedTenantName = tRes.rows[0].name;
      }
    } else if (!resolvedTenantName && !tenant_id && role === 'SUPERADMIN') {
      resolvedTenantName = 'Platformă Centrală';
    }

    await pool.query(
      `INSERT INTO qrp_login_logs 
       (tenant_id, tenant_name, user_id, email, user_name, role, login_type, ip_address, user_agent, status, failure_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tenant_id,
        resolvedTenantName,
        user_id,
        email,
        user_name,
        role,
        login_type,
        ip_address,
        user_agent,
        status,
        failure_reason
      ]
    );
  } catch (err) {
    console.error('[LoginLogger] Eroare la înregistrarea log-ului:', err.message);
  }
}

module.exports = { logLoginEvent };
