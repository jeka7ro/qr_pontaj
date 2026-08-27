const pool = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    const email = 'jeka7ro@gmail.com';
    const plainPassword = '26August2026!';
    const role = 'SUPERADMIN';

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    // Check if user already exists
    const checkUser = await pool.query('SELECT id FROM qrp_users WHERE email = $1', [email]);
    
    if (checkUser.rows.length > 0) {
      console.log('Superadmin user already exists!');
    } else {
      // Insert the user
      await pool.query(
        'INSERT INTO qrp_users (email, password_hash, role) VALUES ($1, $2, $3)',
        [email, passwordHash, role]
      );
      console.log('Superadmin user created successfully!');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    pool.end();
  }
}

seed();
