const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    // Găsim user-ul în BD
    const userResult = await pool.query('SELECT * FROM qrp_users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credențiale incorecte' });
    }

    const user = userResult.rows[0];

    // Dacă utilizatorul are un domeniu asociat, permitem login-ul doar de pe acel domeniu (sau localhost pentru testare)
    const requestOrigin = req.get('origin') || req.get('referer') || '';
    if (user.active_domain && !requestOrigin.includes('localhost')) {
      if (!requestOrigin.includes(user.active_domain)) {
        return res.status(403).json({ error: 'Acest cont nu poate fi accesat de pe acest domeniu.' });
      }
    }

    // Verificăm parola
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credențiale incorecte' });
    }

    // Generăm token-ul
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login realizat cu succes',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Eroare internă de server' });
  }
});

module.exports = router;
