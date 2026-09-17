const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const crypto = require('crypto');
const emailService = require('../services/emailService');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    // Găsim user-ul în BD
    const userResult = await pool.query('SELECT * FROM qrp_users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credențiale incorecte' });
    }

    const user = userResult.rows[0];

    // Verificăm parola unică salvată în baza de date
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

/**
 * POST /api/auth/forgot-password
 * Solicitare link de resetare parolă pe email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Vă rugăm să introduceți adresa de email.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userResult = await pool.query(
      'SELECT u.id, u.email, u.tenant_id, t.name as tenant_name FROM qrp_users u LEFT JOIN qrp_tenants t ON t.id = u.tenant_id WHERE LOWER(u.email) = $1',
      [cleanEmail]
    );

    // Dacă utilizatorul nu există, returnăm mesaj de succes generic pentru a preveni colectarea de emailuri
    if (userResult.rows.length === 0) {
      console.log(`[ForgotPassword] Solicitare pentru email inexistent: ${cleanEmail}`);
      return res.json({ 
        success: true, 
        message: 'Dacă această adresă este înregistrată, vei primi un email cu instrucțiunile de resetare în câteva momente.' 
      });
    }

    const user = userResult.rows[0];

    // Generăm token securizat de 32 bytes (64 hex caractere)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minute valabilitate

    // Salvăm în baza de date
    await pool.query(
      'UPDATE qrp_users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetTokenExpires, user.id]
    );

    // Determinăm URL-ul frontend-ului din cerere
    let clientOrigin = req.headers.origin;
    if (!clientOrigin && req.headers.referer) {
      try {
        clientOrigin = new URL(req.headers.referer).origin;
      } catch (e) {}
    }
    if (!clientOrigin) {
      clientOrigin = process.env.FRONTEND_URL || 'http://localhost:5188';
    }

    const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;
    const displayName = user.tenant_name || user.email.split('@')[0];

    // Trimitem emailul prin Brevo
    await emailService.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName: displayName
    });

    res.json({
      success: true,
      message: 'Emailul de resetare a fost trimis cu succes! Verifică căsuța poștală.'
    });

  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ error: 'A apărut o eroare la trimiterea emailului. Vă rugăm încercați din nou.' });
  }
});

/**
 * GET /api/auth/verify-reset-token/:token
 * Verifică dacă tokenul din link este valid înainte de completarea formularului
 */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token lipsă.' });
    }

    const userResult = await pool.query(
      'SELECT id, email, reset_token_expires FROM qrp_users WHERE reset_token = $1',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ valid: false, error: 'Linkul de resetare este invalid sau a fost deja utilizat.' });
    }

    const user = userResult.rows[0];
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ valid: false, error: 'Linkul de resetare a expirat. Te rugăm să soliciți unul nou.' });
    }

    res.json({ valid: true, email: user.email });
  } catch (error) {
    console.error('VerifyResetToken error:', error);
    res.status(500).json({ valid: false, error: 'Eroare la verificarea linkului.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Salvarea noii parole
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Tokenul și noua parolă sunt obligatorii.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Parola trebuie să conțină cel puțin 6 caractere.' });
    }

    // Găsim user-ul asociat tokenului
    const userResult = await pool.query(
      'SELECT id, email, reset_token_expires FROM qrp_users WHERE reset_token = $1',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Linkul de resetare este invalid sau a fost deja utilizat.' });
    }

    const user = userResult.rows[0];
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ error: 'Linkul de resetare a expirat. Solicită un link nou.' });
    }

    // Hash-uim noua parolă
    const saltRounds = 10;
    const newHash = await bcrypt.hash(password, saltRounds);

    // Actualizăm parola și invalidăm tokenul
    await pool.query(
      'UPDATE qrp_users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [newHash, user.id]
    );

    // Trimitem confirmare de securitate pe email
    try {
      await emailService.sendPasswordChangedEmail({
        to: user.email,
        userName: user.email.split('@')[0]
      });
    } catch (e) {
      console.warn('[ResetPassword] Notificarea de confirmare nu a putut fi trimisă:', e.message);
    }

    res.json({
      success: true,
      message: 'Parola a fost actualizată cu succes! Te poți autentifica acum cu noua parolă.'
    });

  } catch (error) {
    console.error('ResetPassword error:', error);
    res.status(500).json({ error: 'Eroare internă la resetarea parolei.' });
  }
});

module.exports = router;

