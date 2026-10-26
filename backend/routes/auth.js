const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

const crypto = require('crypto');
const emailService = require('../services/emailService');
const { logLoginEvent } = require('../utils/loginLogger');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip_address = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || '').replace(/^::ffff:/, '');
    const user_agent = req.headers['user-agent'] || null;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    // Găsim user-ul în BD cu datele tenant-ului
    const userResult = await pool.query(`
      SELECT u.*, t.name as tenant_name, t.subscription_status, t.demo_expires_at 
      FROM qrp_users u 
      LEFT JOIN qrp_tenants t ON u.tenant_id = t.id 
      WHERE LOWER(u.email) = LOWER($1)
    `, [email.trim()]);

    if (userResult.rows.length === 0) {
      await logLoginEvent({
        email: email.trim(),
        login_type: 'ADMIN',
        ip_address,
        user_agent,
        status: 'FAILED',
        failure_reason: 'Utilizatorul nu există'
      });
      return res.status(401).json({ error: 'Credențiale incorecte' });
    }

    const user = userResult.rows[0];

    // Verificăm dacă tenant-ul este suspendat manual de către SuperAdmin
    if (user.role !== 'SUPERADMIN' && user.subscription_status === 'SUSPENDED') {
      await logLoginEvent({
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        user_id: user.id,
        email: user.email,
        user_name: user.name,
        role: user.role,
        login_type: 'ADMIN',
        ip_address,
        user_agent,
        status: 'BLOCKED',
        failure_reason: 'Acces companie suspendat de către administrator'
      });
      return res.status(403).json({ 
        error: 'Accesul pentru această companie este temporar suspendat. Te rugăm să contactezi echipa de asistență.',
        code: 'TENANT_SUSPENDED' 
      });
    }

    // Verificăm parola unică salvată în baza de date
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logLoginEvent({
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        user_id: user.id,
        email: user.email,
        user_name: user.name,
        role: user.role,
        login_type: user.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN',
        ip_address,
        user_agent,
        status: 'FAILED',
        failure_reason: 'Parolă incorectă'
      });
      return res.status(401).json({ error: 'Credențiale incorecte' });
    }

    // Înregistrăm log-ul de succes
    await logLoginEvent({
      tenant_id: user.tenant_id,
      tenant_name: user.tenant_name,
      user_id: user.id,
      email: user.email,
      user_name: user.name,
      role: user.role,
      login_type: user.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN',
      ip_address,
      user_agent,
      status: 'SUCCESS'
    });

    // Generăm token-ul
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
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
      'SELECT u.id, u.email, u.tenant_id, t.name as tenant_name, t.subdomain as tenant_subdomain, t.logo_url as tenant_logo, t.theme_color as tenant_theme_color FROM qrp_users u LEFT JOIN qrp_tenants t ON t.id = u.tenant_id WHERE LOWER(u.email) = $1',
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

    // Determinăm URL-ul frontend-ului pentru email - OBLIGATORIU domeniu public de producție (NICIODATĂ localhost)
    const baseDomain = process.env.BASE_DOMAIN || 'qr.pontaj.app';
    const subdomain = user.tenant_subdomain;
    const targetHost = subdomain 
      ? `https://${subdomain}.${baseDomain}` 
      : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost') ? process.env.FRONTEND_URL : `https://${baseDomain}`);

    const resetUrl = `${targetHost}/reset-password?token=${resetToken}`;
    const displayName = user.tenant_name || user.email.split('@')[0];

    // Trimitem emailul prin Brevo
    await emailService.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName: displayName,
      companyName: user.tenant_name,
      tenantLogo: user.tenant_logo,
      themeColor: user.tenant_theme_color,
      subdomain
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

/**
 * GET /api/auth/superadmin-session
 * Returnează sau sincronizează sesiunea activă de SuperAdmin pentru platformă
 */
router.get('/superadmin-session', async (req, res) => {
  try {
    const hostname = req.hostname || '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

    if (!isLocal) {
      // În producție, verificăm dacă solicitantul are deja un token valid de SuperAdmin
      const authHeader = req.headers['authorization'];
      const existingToken = authHeader && authHeader.split(' ')[1];
      if (!existingToken || existingToken === 'null') {
        return res.status(401).json({ error: 'Autentificare necesară.' });
      }
      try {
        const decoded = jwt.verify(existingToken, process.env.JWT_SECRET);
        if (decoded.role !== 'SUPERADMIN') {
          return res.status(403).json({ error: 'Acces interzis.' });
        }
      } catch {
        return res.status(401).json({ error: 'Sesiune expirată.' });
      }
    }

    // Preluăm contul de SuperAdmin din baza de date
    const superAdminRes = await pool.query(
      "SELECT id, email, name, role, tenant_id FROM qrp_users WHERE role = 'SUPERADMIN' LIMIT 1"
    );

    if (superAdminRes.rows.length === 0) {
      return res.status(404).json({ error: 'Contul SuperAdmin nu a fost găsit.' });
    }

    const superAdmin = superAdminRes.rows[0];

    const token = jwt.sign(
      {
        id: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPERADMIN',
        tenant_id: null,
        name: superAdmin.name || 'Eugeniu Cazmal'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name || 'Eugeniu Cazmal',
        role: 'SUPERADMIN',
        tenant_id: null
      }
    });
  } catch (error) {
    console.error('SuperadminSession error:', error);
    res.status(500).json({ error: 'Eroare la obținerea sesiunii SuperAdmin.' });
  }
});

const { lookupAnafCompany } = require('../services/anafService');

/**
 * POST /api/auth/demo-request
 * Înregistrare cont demo / solicitare acces și salvare completă în baza de date
 */
router.post('/demo-request', async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      contactName, 
      email, 
      password,
      companyName, 
      phone, 
      anafPhone,
      cui, 
      cnp,
      isPersonalAccount,
      employeesCount, 
      planName,
      planPrice,
      mode, 
      address, 
      city, 
      county, 
      notes 
    } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresă de email invalidă' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').trim(); // TELEFON DE BAZĂ (introdus de client)
    const cleanCui = (cui || '').trim();
    const cleanCnp = (cnp || '').toString().trim().replace(/\D/g, '');
    const isPhysical = Boolean(isPersonalAccount) || cleanCnp.length === 13;

    // Preluăm datele electronice de conectare pentru pista de audit GDPR (DPA Art. 28)
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const termsVersion = 'v2026.1-DPA-ART28';

    let anafData = null;
    let isVatPayer = false;
    let finalVatNumber = null;
    let vatStatus = 'PENDING';

    if (isPhysical) {
      // PERSOANĂ FIZICĂ (B2C) — CNP de 13 cifre sau cont personal
      // IMPORTANT: CNP-ul NU are niciodată prefixul "RO"!
      const cnpDigits = cleanCnp.length === 13 ? cleanCnp : (cleanCui.replace(/\D/g, '').length === 13 ? cleanCui.replace(/\D/g, '') : (cleanCnp || null));
      finalVatNumber = cnpDigits;
      isVatPayer = false;
      vatStatus = finalVatNumber ? 'CNP' : 'PERSOANA_FIZICA';
    } else {
      // PERSOANĂ JURIDICĂ (B2B) — CUI ANAF
      if (cleanCui) {
        anafData = await lookupAnafCompany(cleanCui);
      }
      isVatPayer = Boolean(anafData?.isVatPayer);
      const pureCui = cleanCui ? cleanCui.replace(/^RO/i, '').trim() : null;
      finalVatNumber = pureCui ? (isVatPayer ? `RO${pureCui}` : pureCui) : null;
      vatStatus = isVatPayer ? 'VALID' : (cleanCui ? 'NEPLATITOR' : 'PENDING');
    }

    const cleanAnafPhone = (anafPhone || anafData?.phone || '').trim(); // TELEFON OPȚIONAL (din registrul fiscal ANAF)
    const finalCompanyName = isPhysical 
      ? ((contactName || companyName || '').trim() || `Cont Personal ${cleanEmail.split('@')[0]}`)
      : (anafData?.name || (companyName || '').trim() || `Companie ${contactName || cleanEmail.split('@')[0]}`);
    
    const cleanAddress = anafData?.address || address || (city ? `${city}, ${county || ''}` : '') || null;
    const finalPhone = cleanPhone; // Numărul de contact de bază este cel introdus de client

    const accountNote = isPhysical
      ? `Persoană Fizică (B2C)${finalVatNumber ? ` • CNP: ${finalVatNumber}` : ' • Fără CNP'}`
      : `Persoană Juridică (B2B)${cleanCui ? ` • CUI: ${cleanCui}` : ''}`;
    const finalNotes = notes ? `${accountNote} • ${notes}` : accountNote;
    
    // Calculăm numărul de angajați și tariful per salariat corespunzător volumului
    const parsedSeats = parseInt(employeesCount, 10);
    const seats = (!isNaN(parsedSeats) && parsedSeats > 0) ? parsedSeats : 10;
    
    let pricePerEmployee = 5.00;
    if (seats >= 150) {
      pricePerEmployee = 4.00;
    } else if (seats > 50) {
      pricePerEmployee = 4.00;
    }

    const isDemo = mode !== 'subscribe';
    const subStatus = isDemo ? 'DEMO' : 'PENDING_SUBSCRIPTION';
    
    // Parolă aleasă de client la înregistrare (sau generată automat ca fallback sigur)
    const userChosenPassword = (password && typeof password === 'string' && password.trim().length >= 6) ? password.trim() : null;
    const finalPassword = userChosenPassword || ('Demo' + Math.floor(1000 + Math.random() * 9000) + '!');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(finalPassword, saltRounds);

    // =========================================================================
    // ANTIFRAUDĂ & PROTECȚIE DEMO MULTIPLU (Regulile CUI unic, Email unic, Telefon unic)
    // =========================================================================
    if (isDemo) {
      // 1. Regula EMAIL UNIC: Nu permitem crearea unui nou demo pe o adresă existentă
      const emailTenantCheck = await client.query(`
        SELECT u.id, u.email, u.tenant_id, t.name as tenant_name, t.subdomain, t.demo_expires_at, t.subscription_status 
        FROM qrp_users u 
        LEFT JOIN qrp_tenants t ON u.tenant_id = t.id 
        WHERE LOWER(u.email) = LOWER($1) 
        LIMIT 1
      `, [cleanEmail]);

      if (emailTenantCheck.rows.length > 0) {
        const eu = emailTenantCheck.rows[0];
        const baseDom = process.env.BASE_DOMAIN || 'qr.pontaj.app';
        const targetHost = eu.subdomain ? `https://${eu.subdomain}.${baseDom}` : `https://${baseDom}`;
        const loginUrl = `${targetHost}/admin/login?email=${encodeURIComponent(cleanEmail)}`;
        const isExpired = eu.demo_expires_at && new Date(eu.demo_expires_at) < new Date();

        if (isExpired) {
          return res.status(409).json({
            error: `Adresa de email ${cleanEmail} a beneficiat deja de perioada demo gratuită de 15 zile (expirată la ${new Date(eu.demo_expires_at).toLocaleDateString('ro-RO')}). Pentru a continua accesul în contul companiei ${eu.tenant_name || ''}, te rugăm să te conectezi și să activezi un abonament.`,
            loginUrl,
            alreadyHasDemo: true
          });
        } else {
          return res.status(409).json({
            error: `Ai deja un cont demo activ asociat adresei de email ${cleanEmail}${eu.demo_expires_at ? ` (valabil până la ${new Date(eu.demo_expires_at).toLocaleDateString('ro-RO')})` : ''}. Te rugăm să te conectezi în contul existent.`,
            loginUrl,
            alreadyHasDemo: true
          });
        }
      }

      // 2. Regula TELEFON UNIC: Fiecare număr beneficiază de o singură perioadă demo
      const digitsOnlyPhone = cleanPhone.replace(/\D/g, '');
      if (digitsOnlyPhone.length >= 9) {
        const phoneLast9 = digitsOnlyPhone.slice(-9);
        const phoneCheck = await client.query(`
          SELECT t.id, t.name, t.subdomain, t.contact_email, t.contact_phone, t.demo_expires_at 
          FROM qrp_tenants t 
          WHERE RIGHT(REGEXP_REPLACE(COALESCE(t.contact_phone, ''), '[^0-9]', '', 'g'), 9) = $1 
             OR RIGHT(REGEXP_REPLACE(COALESCE(t.anaf_phone, ''), '[^0-9]', '', 'g'), 9) = $1 
          LIMIT 1
        `, [phoneLast9]);

        if (phoneCheck.rows.length > 0) {
          const pt = phoneCheck.rows[0];
          if (pt.contact_email && pt.contact_email.toLowerCase() !== cleanEmail.toLowerCase()) {
            return res.status(409).json({
              error: `Numărul de telefon introdus (${cleanPhone}) a fost deja utilizat pentru activarea unei perioade demonstrative de 15 zile (compania ${pt.name}). Fiecare număr beneficiază de o singură perioadă demo gratuită. Pentru asistență sau activare abonament, te rugăm să contactezi suportul Pontaj.app.`
            });
          }
        }
      }

      // 3. Regula CUI UNIC (1 singur demo per companie)
      if (!isPhysical && cleanCui) {
        const digitsOnlyCui = cleanCui.replace(/\D/g, '');
        if (digitsOnlyCui.length >= 4) {
          const cuiCheck = await client.query(`
            SELECT id, name, subdomain, contact_email, demo_expires_at, subscription_status 
            FROM qrp_tenants 
            WHERE REGEXP_REPLACE(COALESCE(vat_number, ''), '[^0-9]', '', 'g') = $1 
            LIMIT 1
          `, [digitsOnlyCui]);

          if (cuiCheck.rows.length > 0) {
            const ct = cuiCheck.rows[0];
            const isSameEmail = ct.contact_email && ct.contact_email.toLowerCase() === cleanEmail.toLowerCase();
            const isExpired = ct.demo_expires_at && new Date(ct.demo_expires_at) < new Date();
            const baseDom = process.env.BASE_DOMAIN || 'qr.pontaj.app';
            const targetHost = ct.subdomain ? `https://${ct.subdomain}.${baseDom}` : `https://${baseDom}`;
            const loginUrl = `${targetHost}/admin/login?email=${encodeURIComponent(cleanEmail)}`;

            if (isSameEmail) {
              if (isExpired) {
                return res.status(409).json({
                  error: `Compania ${ct.name} (CUI: ${cleanCui}) a beneficiat deja de perioada demo gratuită de 15 zile (expirată la ${new Date(ct.demo_expires_at).toLocaleDateString('ro-RO')}). Pentru a continua accesul, te rugăm să te conectezi și să activezi un abonament.`,
                  loginUrl,
                  alreadyHasDemo: true
                });
              } else {
                return res.status(409).json({
                  error: `Compania ${ct.name} are deja un cont demo activ până la data de ${new Date(ct.demo_expires_at).toLocaleDateString('ro-RO')}. Te rugăm să te conectezi în contul existent.`,
                  loginUrl,
                  alreadyHasDemo: true
                });
              }
            } else {
              // Altă persoană / alt email încearcă să creeze demo pentru aceeași firmă
              let maskedEmail = 'administratorul existent';
              if (ct.contact_email && ct.contact_email.includes('@')) {
                const [uP, dP] = ct.contact_email.split('@');
                const maskedU = uP.length > 2 ? uP[0] + '***' + uP[uP.length - 1] : uP[0] + '***';
                maskedEmail = `${maskedU}@${dP}`;
              }

              return res.status(409).json({
                error: `Compania ${ct.name} (CUI: ${cleanCui}) figurează deja înregistrată în platformă cu adresa de contact ${maskedEmail}. Fiecare companie are un singur spațiu de lucru dedicat. Te rugăm să contactezi administratorul existent al firmei pentru a primi acces sau suportul Pontaj.app.`
              });
            }
          }
        }
      }
    }

    // Regula 4: Detecție IP suspect de duplicat
    let isSuspectDuplicate = false;
    let duplicateReason = null;
    if (clientIp && !['127.0.0.1', '::1', 'localhost'].includes(clientIp)) {
      const ipMatches = await client.query(`
        SELECT id, name, created_at, contact_email 
        FROM qrp_tenants 
        WHERE terms_accepted_ip = $1 
        LIMIT 3
      `, [clientIp]);
      if (ipMatches.rows.length > 0) {
        isSuspectDuplicate = true;
        duplicateReason = `Același IP (${clientIp}) detectat anterior la: ${ipMatches.rows.map(r => r.name).join(', ')}`;
      }
    }

    const finalNotesWithDup = isSuspectDuplicate 
      ? (finalNotes ? `${finalNotes} • [SUSPECT DUPLICAT: ${duplicateReason}]` : `[SUSPECT DUPLICAT: ${duplicateReason}]`)
      : finalNotes;

    await client.query('BEGIN');

    // 1. Verificăm dacă userul există deja
    const userCheck = await client.query('SELECT * FROM qrp_users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    
    let tenantId;
    let userId;
    let finalSubdomain;

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      userId = existingUser.id;
      tenantId = existingUser.tenant_id;

      // Actualizăm întotdeauna parola cu noua parolă temporară generată, pentru ca accesul să funcționeze garantat
      await client.query('UPDATE qrp_users SET password_hash = $1, name = COALESCE($2, name) WHERE id = $3', [
        passwordHash,
        contactName || finalCompanyName,
        userId
      ]);

      if (tenantId) {
        const tRes = await client.query('SELECT subdomain, name FROM qrp_tenants WHERE id = $1', [tenantId]);
        const existingSubdomain = tRes.rows[0]?.subdomain;
        const existingName = tRes.rows[0]?.name;

        // Dacă numele companiei/persoanei s-a schimbat la re-înregistrare, recalculăm subdomeniul corespunzător
        if (finalCompanyName && finalCompanyName !== existingName) {
          let cleanedName = finalCompanyName
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\b(s\.?r\.?l\.?|s\.?a\.?|pfa|i\.?i\.?|srl-d)\b/gi, '')
            .trim();
          let baseSub = cleanedName.replace(/[^a-z0-9]/g, '');
          if (!baseSub || baseSub.length < 3) {
            baseSub = 'client' + Math.floor(100 + Math.random() * 900);
          }
          baseSub = baseSub.substring(0, 20);

          let newSubdomain = baseSub;
          let counter = 1;
          while (true) {
            const subRes = await client.query('SELECT id FROM qrp_tenants WHERE LOWER(subdomain) = LOWER($1) AND id != $2', [newSubdomain, tenantId]);
            if (subRes.rows.length === 0) break;
            newSubdomain = `${baseSub}${counter}`;
            counter++;
          }
          finalSubdomain = newSubdomain;
        } else {
          finalSubdomain = existingSubdomain || 'smartqr';
        }

        await client.query(`
          UPDATE qrp_tenants 
          SET name = COALESCE($1, name),
              subdomain = COALESCE($17, subdomain),
              contact_name = COALESCE($2, contact_name),
              contact_phone = COALESCE($3, contact_phone),
              anaf_phone = COALESCE($4, anaf_phone),
              contact_email = COALESCE($5, contact_email),
              vat_number = COALESCE($6, vat_number),
              billing_address = COALESCE($7, billing_address),
              registration_notes = COALESCE($8, registration_notes),
              subscription_seats = $9,
              price_per_employee = $10,
              demo_expires_at = GREATEST(demo_expires_at, NOW() + INTERVAL '15 days'),
              terms_accepted_at = NOW(),
              terms_accepted_ip = $11,
              terms_accepted_by = $12,
              terms_version = $13,
              dpa_accepted_at = NOW(),
              dpa_version = $13,
              is_vat_payer = $15,
              vat_status = $16
          WHERE id = $14
        `, [
          finalCompanyName,
          contactName,
          cleanPhone || null,
          cleanAnafPhone || null,
          cleanEmail,
          finalVatNumber,
          cleanAddress,
          finalNotes,
          seats,
          pricePerEmployee,
          clientIp,
          contactName || cleanEmail,
          termsVersion,
          tenantId,
          isVatPayer,
          vatStatus,
          finalSubdomain
        ]);
      }
    } else {
      // 2. Generăm subdomeniu unic
      let cleanedName = finalCompanyName
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(s\.?r\.?l\.?|s\.?a\.?|pfa|i\.?i\.?|srl-d)\b/gi, '')
        .trim();
      let baseSub = cleanedName.replace(/[^a-z0-9]/g, '');
      if (!baseSub || baseSub.length < 3) {
        baseSub = 'client' + Math.floor(100 + Math.random() * 900);
      }
      baseSub = baseSub.substring(0, 20);

      finalSubdomain = baseSub;
      let counter = 1;
      while (true) {
        const subRes = await client.query('SELECT id FROM qrp_tenants WHERE LOWER(subdomain) = LOWER($1)', [finalSubdomain]);
        if (subRes.rows.length === 0) break;
        finalSubdomain = `${baseSub}${counter}`;
        counter++;
      }

      // 3. Inserare în qrp_tenants
      const demoExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      const defaultModules = {
        billing: true,
        export_saga: true,
        leaves: false,
        shifts: false,
        geofence: false,
        offline: false,
        revisal: false,
        erp: false,
        face_recognition: false,
        whatsapp: false,
        assets: false,
        show_upsells: false
      };

      const tenantInsertRes = await client.query(`
        INSERT INTO qrp_tenants (
          name, subdomain, vat_number, billing_address,
          contact_name, contact_phone, anaf_phone, contact_email, registration_notes,
          subscription_status, subscription_seats, price_per_employee, billing_per_employee,
          demo_expires_at, modules, country_code, timezone, currency,
          theme_color, allow_employee_portal, allow_breaks, logo_url, favicon_url,
          terms_accepted_at, terms_accepted_ip, terms_accepted_by, terms_version,
          dpa_accepted_at, dpa_version, is_online_registration, is_vat_payer, vat_status, created_at
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23,
          NOW(), $24, $25, $26,
          NOW(), $26, true, $27, $28, NOW()
        )
        RETURNING id
      `, [
        finalCompanyName,
        finalSubdomain,
        finalVatNumber || null,
        cleanAddress || null,
        contactName || null,
        cleanPhone || null,
        cleanAnafPhone || null,
        cleanEmail,
        finalNotesWithDup || null,
        subStatus,
        seats,
        pricePerEmployee,
        true,
        demoExpiresAt,
        defaultModules,
        'RO',
        'Europe/Bucharest',
        'RON',
        '#2563EB',
        true,
        true,
        '/logo_default_tenant.png',
        '/favicon.png',
        clientIp,
        contactName || cleanEmail,
        termsVersion,
        isVatPayer,
        vatStatus
      ]);
      tenantId = tenantInsertRes.rows[0].id;

      // 4. Inserare punct de lucru principal
      await client.query(`
        INSERT INTO qrp_sites (tenant_id, name, qr_mode, allowed_radius_meters)
        VALUES ($1, $2, $3, $4)
      `, [tenantId, 'Punct Principal', 'STATIC', 100]);

      // 5. Inserare administrator companie
      const userInsertRes = await client.query(`
        INSERT INTO qrp_users (tenant_id, email, password_hash, role, name, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, [tenantId, cleanEmail, passwordHash, 'TENANT_ADMIN', contactName || finalCompanyName]);
      userId = userInsertRes.rows[0].id;
    }

    // 6. Înregistrare Pistă de Audit Electronic / Precontract DPA (Art. 28 GDPR)
    try {
      const agreementHash = crypto.createHash('sha256')
        .update(`${finalCompanyName}|${cleanCui}|${cleanEmail}|${clientIp}|${termsVersion}|${Date.now()}`)
        .digest('hex');

      await client.query(`
        INSERT INTO qrp_legal_agreements (
          tenant_id, agreement_type, version, accepted_at,
          accepted_by_name, accepted_by_email, accepted_by_phone,
          company_name, company_cui, company_address,
          signer_ip, signer_user_agent, agreement_hash, metadata
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        tenantId,
        'DPA_ART28_TRIAL',
        termsVersion,
        contactName || finalCompanyName,
        cleanEmail,
        cleanPhone || null,
        finalCompanyName,
        cleanCui || null,
        cleanAddress || null,
        clientIp,
        userAgent,
        agreementHash,
        JSON.stringify({
          acceptedTerms: true,
          acceptedDpa: true,
          seats,
          planName: planName || (seats >= 150 ? 'Corporate' : seats > 50 ? 'Echipe Mari' : 'Standard'),
          legalBasis: 'GDPR Art. 28(9) & Legea 365/2002'
        })
      ]);
    } catch (legalAuditErr) {
      console.warn('[DemoRequest] Notificare inserare audit legal:', legalAuditErr.message);
    }

    await client.query('COMMIT');

    const baseDomain = process.env.BASE_DOMAIN || 'qr.pontaj.app';
    const targetHost = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) 
      ? `https://${finalSubdomain}.${baseDomain}` 
      : (process.env.FRONTEND_URL || `https://${baseDomain}`);
    const loginUrl = `${targetHost}/admin/login?email=${encodeURIComponent(cleanEmail)}`;

    // Trimitem email către client (asincron) cu confirmarea precontractuală DPA și datele de conectare
    const isMock = cleanEmail.includes('example.com') || 
                   cleanEmail.includes('exemplu.ro') ||
                   cleanEmail.endsWith('.test') || 
                   cleanEmail.endsWith('.local');

    if (!isMock) {
      emailService.sendDemoAccessEmail({
        to: cleanEmail,
        contactName: contactName || 'Administrator',
        companyName: finalCompanyName,
        initialPassword: finalPassword,
        loginUrl,
        employeesCount: seats,
        mode: mode || 'demo',
        subdomain: finalSubdomain,
        dpaAudit: {
          clientIp,
          termsVersion,
          cui: cleanCui,
          companyName: finalCompanyName,
          contactName: contactName || 'Administrator'
        }
      }).catch(mailErr => console.warn('[DemoRequest] Notificare client error:', mailErr.message));
    }

    // OBLIGATORIU: Trimitem notificare cu TOATE detaliile către SuperAdmin (Eugeniu / jeka7ro@gmail.com)
    emailService.sendLeadNotificationToAdmin({
      companyName: finalCompanyName,
      contactName: contactName || 'Nespecificat',
      phone: cleanPhone,
      anafPhone: cleanAnafPhone,
      email: cleanEmail,
      cui: cleanCui,
      address: cleanAddress,
      city: city || '',
      county: county || '',
      employeesCount: seats,
      planName: planName || (seats >= 150 ? 'Corporate (150+ salariați - Negociabil)' : seats > 50 ? 'Echipe Mari (51+ salariați - 4.00 €)' : 'Standard (1-50 salariați - 5.00 €)'),
      planPrice: pricePerEmployee,
      mode: mode || 'demo',
      subdomain: finalSubdomain,
      notes: `${notes || ''} [GDPR DPA Art. 28 Acceptat Electronic de la IP: ${clientIp}]`,
      clientIp: clientIp,
      dpaAccepted: true,
      initialPassword: finalPassword,
      loginUrl: loginUrl,
      isSuspectDuplicate,
      duplicateReason
    }).catch(adminMailErr => console.warn('[DemoRequest] Notificare SuperAdmin error:', adminMailErr.message));

    // Generăm token JWT pentru autentificare instantă în panoul tenant
    const token = jwt.sign(
      { 
        id: userId, 
        email: cleanEmail, 
        role: 'TENANT_ADMIN', 
        tenant_id: tenantId, 
        name: contactName || finalCompanyName,
        is_demo: isDemo 
      },
      process.env.JWT_SECRET,
      { expiresIn: '10d' }
    );

    const activeUser = {
      id: userId,
      email: cleanEmail,
      role: 'TENANT_ADMIN',
      tenant_id: tenantId,
      name: contactName || finalCompanyName,
      tenant_name: finalCompanyName,
      is_demo: isDemo
    };

    res.json({
      success: true,
      message: 'Compania și datele de acces au fost create cu succes.',
      token,
      user: activeUser,
      email: cleanEmail,
      password: finalPassword,
      tempPassword: finalPassword,
      isUserChosenPassword: Boolean(userChosenPassword),
      loginUrl,
      tenantId,
      subdomain: finalSubdomain
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('DemoRequest error:', error);
    res.status(500).json({ error: error.message || 'Eroare la procesarea solicitării' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/google
 * Autentificare cu Google (Google Sign-In) cu persistență automată a tenantului
 */
router.post('/google', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, name, google_id, picture } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresă de email lipsă de la Google' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const ip_address = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || '').replace(/^::ffff:/, '');
    const user_agent = req.headers['user-agent'] || null;

    // Verificăm dacă userul există deja în BD
    const userResult = await client.query(`
      SELECT u.*, t.name as tenant_name 
      FROM qrp_users u 
      LEFT JOIN qrp_tenants t ON u.tenant_id = t.id 
      WHERE LOWER(u.email) = LOWER($1)
    `, [cleanEmail]);

    let user;
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else {
      // Creăm o companie și un utilizator real pentru acest cont Google
      await client.query('BEGIN');
      const companyName = `Companie ${name || cleanEmail.split('@')[0]}`;
      let baseSub = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!baseSub || baseSub.length < 3) baseSub = 'google' + Math.floor(100 + Math.random() * 900);
      baseSub = baseSub.substring(0, 20);

      let finalSub = baseSub;
      let counter = 1;
      while (true) {
        const subRes = await client.query('SELECT id FROM qrp_tenants WHERE LOWER(subdomain) = LOWER($1)', [finalSub]);
        if (subRes.rows.length === 0) break;
        finalSub = `${baseSub}${counter}`;
        counter++;
      }

      const defaultModules = {
        billing: true, leaves: true, export_saga: true, geofence: false,
        offline: false, revisal: true, erp: true, shifts: true,
        face_recognition: false, whatsapp: false, assets: false, show_upsells: true
      };

      const tRes = await client.query(`
        INSERT INTO qrp_tenants (
          name, subdomain, contact_name, contact_email,
          subscription_status, subscription_seats, price_per_employee, billing_per_employee,
          demo_expires_at, modules, country_code, timezone, currency, theme_color,
          allow_employee_portal, allow_breaks, logo_url, favicon_url, is_online_registration, created_at
        )
        VALUES (
          $1, $2, $3, $4,
          'DEMO', 10, 5.00, true,
          NOW() + INTERVAL '15 days', $5, 'RO', 'Europe/Bucharest', 'RON', '#2563EB',
          true, true, '/logo_default_tenant.png', '/favicon.png', true, NOW()
        )
        RETURNING id
      `, [companyName, finalSub, name || cleanEmail.split('@')[0], cleanEmail, defaultModules]);
      const newTenantId = tRes.rows[0].id;

      await client.query(`
        INSERT INTO qrp_sites (tenant_id, name, qr_mode, allowed_radius_meters)
        VALUES ($1, 'Punct Principal', 'STATIC', 100)
      `, [newTenantId]);

      const dummyPass = await bcrypt.hash('GoogleAuth_' + Date.now(), 10);
      const uRes = await client.query(`
        INSERT INTO qrp_users (tenant_id, email, password_hash, role, name, created_at)
        VALUES ($1, $2, $3, 'TENANT_ADMIN', $4, NOW())
        RETURNING id
      `, [newTenantId, cleanEmail, dummyPass, name || cleanEmail.split('@')[0]]);
      const newUserId = uRes.rows[0].id;

      await client.query('COMMIT');

      user = {
        id: newUserId,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role: 'TENANT_ADMIN',
        tenant_id: newTenantId,
        tenant_name: companyName,
        is_demo: true,
        picture: picture || null
      };

      // Alertă SuperAdmin pentru autentificarea nouă Google
      emailService.sendLeadNotificationToAdmin({
        companyName,
        contactName: name || cleanEmail.split('@')[0],
        phone: '',
        email: cleanEmail,
        cui: '',
        address: '',
        employeesCount: 10,
        mode: 'demo',
        subdomain: finalSub,
        notes: 'Înregistrare automată prin Google Sign-In'
      }).catch(err => console.warn('[GoogleAuth] Alertă SuperAdmin error:', err.message));
    }

    await logLoginEvent({
      tenant_id: user.tenant_id,
      tenant_name: user.tenant_name,
      user_id: typeof user.id === 'number' ? user.id : null,
      email: user.email,
      user_name: user.name,
      role: user.role,
      login_type: 'GOOGLE',
      ip_address,
      user_agent,
      status: 'SUCCESS'
    });

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        tenant_id: user.tenant_id, 
        name: user.name,
        provider: 'google'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Autentificare cu Google realizată cu succes',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
        picture: picture || null,
        is_google: true
      }
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('GoogleAuth error:', error);
    res.status(500).json({ error: 'Eroare la autentificarea cu Google' });
  } finally {
    client.release();
  }
});

module.exports = router;

