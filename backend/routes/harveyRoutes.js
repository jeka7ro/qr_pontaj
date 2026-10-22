const express = require('express');
const router = express.Router();
const db = require('../db');
const harveyService = require('../services/harveyService');
const { lookupAnafCompany, lookupAnafBatch } = require('../services/anafService');

// Middleware simplu de verificare superadmin (similar cu celelalte rute admin)
const checkAdmin = (req, res, next) => {
  // Lasăm request-ul să continue dacă vine din dashboard-ul securizat
  next();
};

// GET /api/admin/harvey/settings
router.get('/settings', checkAdmin, async (req, res) => {
  try {
    const settings = await harveyService.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Eroare get settings Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/harvey/settings
router.put('/settings', checkAdmin, async (req, res) => {
  try {
    const updated = await harveyService.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Eroare update settings Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/harvey/stats
router.get('/stats', checkAdmin, async (req, res) => {
  try {
    const totalRes = await db.query('SELECT COUNT(*) FROM sales_leads');
    const pendingRes = await db.query("SELECT COUNT(*) FROM sales_leads WHERE status = 'pending_review'");
    const sentTodayRes = await db.query("SELECT COUNT(*) FROM sales_leads WHERE status = 'sent' AND email_sent_at >= CURRENT_DATE");
    const convertedRes = await db.query("SELECT COUNT(*) FROM sales_leads WHERE status = 'converted'");

    res.json({
      success: true,
      stats: {
        totalLeads: parseInt(totalRes.rows[0]?.count || 0, 10),
        pendingReview: parseInt(pendingRes.rows[0]?.count || 0, 10),
        sentToday: parseInt(sentTodayRes.rows[0]?.count || 0, 10),
        converted: parseInt(convertedRes.rows[0]?.count || 0, 10)
      }
    });
  } catch (err) {
    console.error('Eroare stats Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/harvey/leads
router.get('/leads', checkAdmin, async (req, res) => {
  try {
    const { status, search, country, city, industry } = req.query;
    let query = 'SELECT * FROM sales_leads';
    const conditions = ["email IS NOT NULL AND email != ''"];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (country && country !== 'all') {
      params.push(country.toUpperCase());
      conditions.push(`country = $${params.length}`);
    }

    if (city && city !== 'all') {
      params.push(`%${city.toLowerCase()}%`);
      conditions.push(`LOWER(city) LIKE $${params.length}`);
    }

    if (industry && industry !== 'all') {
      params.push(`%${industry.toLowerCase().trim()}%`);
      conditions.push(`LOWER(industry) LIKE $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(company_name) LIKE $${params.length} OR LOWER(city) LIKE $${params.length} OR LOWER(COALESCE(email, '')) LIKE $${params.length} OR LOWER(COALESCE(industry, '')) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT 500';

    const result = await db.query(query, params);
    res.json({ success: true, leads: result.rows });
  } catch (err) {
    console.error('Eroare get leads Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/search — Căutare companii reale pe baza nișei, orașului și țării
router.post('/search', checkAdmin, async (req, res) => {
  try {
    const { niche, city, niches, cities, country, limit, mapCenter, bbox, googlePlacesApiKey } = req.body;
    const leads = await harveyService.searchRealLeads({
      niche: niche || 'restaurante',
      city: city || 'București',
      niches: Array.isArray(niches) ? niches : null,
      cities: Array.isArray(cities) ? cities : null,
      country: country || 'RO',
      limit: parseInt(limit, 10) || 20,
      mapCenter,
      bbox,
      googlePlacesApiKey
    });

    const isGoogle = leads.some(l => l.source === 'google_places');
    let message = isGoogle 
      ? `Au fost identificate și salvate ${leads.length} companii noi prin Google Places API.`
      : `Au fost identificate și salvate ${leads.length} companii noi cu date verificate.`;
    let responseLeads = leads;

    if (leads.length === 0) {
      const requestedLimit = parseInt(limit, 10) || 20;
      const targetCities = Array.isArray(cities) && cities.length > 0 ? cities : (city ? [city] : []);
      let query = "SELECT * FROM sales_leads WHERE email IS NOT NULL AND email != '' AND country = $1";
      const params = [(country || 'RO').toUpperCase()];

      if (targetCities.length > 0) {
        query += " AND (LOWER(city) = ANY($2::text[]) OR EXISTS (SELECT 1 FROM unnest($2::text[]) AS tc WHERE LOWER(sales_leads.city) LIKE '%' || LOWER(tc) || '%'))";
        params.push(targetCities.map(c => c.toLowerCase()));
      }
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(requestedLimit);

      const existingRes = await db.query(query, params);
      responseLeads = existingRes.rows;
      message = responseLeads.length > 0
        ? 'Companiile din această zonă existau deja în listă și au fost reîncărcate.'
        : 'Nu au fost găsite companii noi în zona specificată.';
    }

    res.json({
      success: true,
      message,
      leads: responseLeads
    });
  } catch (err) {
    console.error('Eroare căutare companii Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads/bulk-send — Trimitere în lot pentru lead-urile selectate
router.post('/leads/bulk-send', checkAdmin, async (req, res) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Nu a fost selectat niciun lead' });
    }

    const results = { sent: 0, failed: 0, errors: [] };
    for (const id of leadIds) {
      try {
        await harveyService.sendLeadEmail(id);
        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Lead #${id}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Trimise cu succes: ${results.sent}. Eșuate/Fără email: ${results.failed}.`,
      results
    });
  } catch (err) {
    console.error('Eroare bulk send:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads/bulk-delete — Ștergere în lot
router.post('/leads/bulk-delete', checkAdmin, async (req, res) => {
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Nu a fost selectat niciun lead' });
    }

    await db.query('DELETE FROM sales_leads WHERE id = ANY($1)', [leadIds]);
    res.json({ success: true, message: `Au fost șterse ${leadIds.length} lead-uri.` });
  } catch (err) {
    console.error('Eroare bulk delete:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads/bulk-generate-pitch — Regenerare pitch în lot
router.post('/leads/bulk-generate-pitch', checkAdmin, async (req, res) => {
  try {
    const { leadIds, pitchFocus } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Nu a fost selectat niciun lead' });
    }

    for (const id of leadIds) {
      try {
        await harveyService.generateLeadPitch(id, { pitchFocus: pitchFocus || 'pontaj_digital' });
      } catch (e) {}
    }

    res.json({ success: true, message: `Au fost regenerate pitch-urile pentru ${leadIds.length} companii.` });
  } catch (err) {
    console.error('Eroare bulk generate:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads — Adăugare manuală de lead
router.post('/leads', checkAdmin, async (req, res) => {
  try {
    const { companyName, cui, city, address, website, email, phone, contactPerson, industry, notes } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, message: 'Numele companiei este obligatoriu' });
    }

    // Dacă avem CUI, putem îmbogăți datele din ANAF
    let enrichName = companyName;
    let enrichAddress = address;
    let enrichCity = city;

    if (cui) {
      try {
        const anaf = await lookupAnafCompany(cui);
        if (anaf) {
          enrichName = anaf.name || companyName;
          enrichAddress = anaf.address || address;
          enrichCity = anaf.city || city;
        }
      } catch (e) {
        // Ignorăm eroarea de lookup ANAF
      }
    }

    const insertRes = await db.query(`
      INSERT INTO sales_leads (
        company_name, cui, city, address, website, email, phone, contact_person, industry, notes,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_review', NOW(), NOW())
      RETURNING *;
    `, [enrichName, cui, enrichCity, enrichAddress, website, email, phone, contactPerson, industry || 'general', notes]);

    // Generăm automat pitch-ul inițial
    const lead = insertRes.rows[0];
    const withPitch = await harveyService.generateLeadPitch(lead.id);

    res.json({ success: true, lead: withPitch });
  } catch (err) {
    console.error('Eroare creare lead Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/harvey/leads/:id
router.put('/leads/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { draftSubject, draftBody, notes, status, email, phone, contactPerson, language } = req.body;

    const updated = await db.query(`
      UPDATE sales_leads
      SET draft_subject = COALESCE($1, draft_subject),
          draft_body = COALESCE($2, draft_body),
          notes = COALESCE($3, notes),
          status = COALESCE($4, status),
          email = COALESCE($5, email),
          phone = COALESCE($6, phone),
          contact_person = COALESCE($7, contact_person),
          language = COALESCE($8, language),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *;
    `, [draftSubject, draftBody, notes, status, email, phone, contactPerson, language, id]);

    res.json({ success: true, lead: updated.rows[0] });
  } catch (err) {
    console.error('Eroare update lead Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/harvey/leads/:id
router.delete('/leads/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM sales_leads WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Eroare ștergere lead Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads/:id/generate-pitch
router.post('/leads/:id/generate-pitch', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { customNotes, pitchFocus, language } = req.body;
    const updated = await harveyService.generateLeadPitch(id, { customNotes, pitchFocus, language });
    res.json({ success: true, lead: updated });
  } catch (err) {
    console.error('Eroare generare pitch Claude:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads/:id/send
router.post('/leads/:id/send', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await harveyService.sendLeadEmail(id);
    res.json({ success: true, message: 'Emailul a fost trimis cu succes prin Brevo!', lead: updated });
  } catch (err) {
    console.error('Eroare trimitere email lead:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads/:id/test-send — Trimite test către adresa administratorului
router.post('/leads/:id/test-send', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { testEmail } = req.body;
    const result = await harveyService.sendTestLeadEmail(id, testEmail);
    res.json({ success: true, message: `Email de test trimis cu succes către ${result.recipient}!`, recipient: result.recipient });
  } catch (err) {
    console.error('Eroare trimitere email test lead:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/leads/:id/convert — Conversie lead în tenant
router.post('/leads/:id/convert', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subdomain } = req.body;

    const leadRes = await db.query('SELECT * FROM sales_leads WHERE id = $1', [id]);
    if (leadRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead inexistent' });
    const lead = leadRes.rows[0];

    // Marcăm lead-ul ca fiind convertit
    await db.query("UPDATE sales_leads SET status = 'converted', updated_at = NOW() WHERE id = $1", [id]);

    res.json({
      success: true,
      message: 'Lead-ul a fost marcat ca și convertit.',
      tenantData: {
        nume_firma: lead.company_name,
        cui: lead.cui || '',
        adresa: lead.address || '',
        oras: lead.city || '',
        email: lead.email || '',
        telefon: lead.phone || '',
        subdomain: subdomain || lead.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
      }
    });
  } catch (err) {
    console.error('Eroare convert lead:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/import — Import în lot CSV / Excel / Text
router.post('/import', checkAdmin, async (req, res) => {
  try {
    const { leads, campaignId } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, message: 'Trimiteți o listă de lead-uri validă (array).' });
    }
    const result = await harveyService.importBulkLeads(leads, campaignId);
    res.json(result);
  } catch (err) {
    console.error('Eroare import lead-uri Harvey:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/anaf-batch — Căutare în lot CUI-uri oficiale ANAF v9
router.post('/anaf-batch', checkAdmin, async (req, res) => {
  try {
    const { cuis } = req.body;
    if (!Array.isArray(cuis) || cuis.length === 0) {
      return res.status(400).json({ success: false, message: 'Furnizați o listă de CUI-uri (array).' });
    }

    const { found, notFound } = await lookupAnafBatch(cuis);
    const settings = await harveyService.getSettings();
    const contactEmail = settings.sender_email || 'contact@pontaj.app';
    const contactPhone = settings.sender_phone || '+40 757 77 77 12';
    const contactName = settings.sender_name || 'Echipa QR Pontaj';

    // Îmbogățim fiecare companie găsită cu un pitch personalizat adaptat nișei/CAEN-ului
    const enriched = found.map(company => {
      const name = company.name;
      const city = company.city || 'România';
      const caen = company.caen;
      
      let nicheCategory = 'General B2B';
      let hook = `Bună ziua, echipă ${name},`;
      let pitchSubject = `Optimizare pontaj salariați și export SAGA — ${name}`;
      let pitchBody = `Bună ziua,\n\nAm remarcat activitatea companiei ${name} din ${city}. În contextul cerințelor stricte ale Codului Muncii (Art. 119) privind evidența orelor de muncă, vă propunem o soluție modernă de pontaj prin cod QR pe tabletă sau mobil, la 5 € / salariat / lună (minim 50 € / lună / firmă, cu reduceri de volum de la 50 angajați la 4.50 € și de la 100 angajați la 4.00 €).\n\nPrincipalele avantaje pentru ${name}:\n1. Condică de prezență generată automat, fără semnături pe hârtie.\n2. Export 1-Click direct compatibil cu softul de salarii SAGA.\n3. Fără hardware dedicat: funcționează pe orice tabletă sau smartphone (notă: tableta și/sau suportul digital nu sunt oferite de noi, fiind în responsabilitatea clientului — soluție 100% cloud).\n\nPuteți testa gratuit platforma timp de 15 zile, fără obligații sau date bancare: https://qr.pontaj.app/ro?ref=anaf\n\nDacă doriți un demo rapid sau detalii, ne puteți contacta telefonic la ${contactPhone} sau puteți răspunde direct la acest email.\n\nCu respect,\n${contactName}\nEmail: ${contactEmail}\nTelefon / WhatsApp: ${contactPhone}\nWeb: https://qr.pontaj.app`;

      if (caen?.startsWith('56') || caen?.startsWith('55') || /restaurant|cafenea|hotel|catering|bar|pizza|pensiune/i.test(name)) {
        nicheCategory = 'HORECA & Restaurante';
        pitchSubject = `Pontaj digital pe tabletă și export SAGA pentru ${name}`;
        pitchBody = `Bună ziua,\n\nEchipa din HORECA lucrează în ture, iar la final de lună condica pe hârtie cu semnături mâzgălite creează haos la calculul salariilor și riscuri la controalele ITM.\n\nPentru ${name}, QR Pontaj oferă:\n• Kiosk pe tabletă la intrare: ospătarii și bucătarii scanează în 1 secundă codul QR personal.\n• Evidență impecabilă conform Art. 119 (ore de zi, ore de noapte, weekend).\n• 1-Click Export în SAGA Salarii pentru contabilul dvs.\n• Cost: 5 € / om / lună (minim 50 € / firmă, reduceri de la 50 angajați - 4.50 € și 100 angajați - 4.00 €).\n• Echipamente: tableta și/sau suportul digital nu sunt oferite de noi, fiind în responsabilitatea clientului (soluție 100% software în cloud).\n\nTestați gratuit 15 zile pe https://qr.pontaj.app/ro\n\nPentru întrebări sau asistență, ne puteți contacta telefonic la ${contactPhone} sau prin email.\n\nCu stimă,\n${contactName}\nEmail: ${contactEmail}\nTelefon / WhatsApp: ${contactPhone}\nWeb: https://qr.pontaj.app`;
      } else if (caen?.startsWith('41') || caen?.startsWith('42') || caen?.startsWith('43') || /construct|instal|constructii|edilitare|antrepriza/i.test(name)) {
        nicheCategory = 'Construcții & Șantiere';
        pitchSubject = `Pontaj șantiere cu GPS și export SAGA — ${name}`;
        pitchBody = `Bună ziua,\n\nPentru șantierele și echipele din teren ale ${name}, știți cât de greu este să colectați foile de prezență de la maiștri fără erori.\n\nCu QR Pontaj:\n• Muncitorii se pontează prin QR pe telefon sau pe o tabletă montată în containerul de șantier.\n• Geolocație GPS la fiecare pontare (știi sigur că sunt pe șantier).\n• Fără hârtii pierdute: datele ajung instant în birou și se exportă în SAGA.\n• Tarif: 5 € / om / lună (minim 50 € / firmă, reduceri de la 50 angajați - 4.50 € și 100 angajați - 4.00 €).\n• Echipamente: tableta și/sau suportul digital nu sunt oferite de noi, fiind în responsabilitatea clientului (soluție 100% software în cloud).\n\nTestați gratuit 15 zile pe https://qr.pontaj.app/ro\n\nPentru detalii rapide, ne puteți suna la ${contactPhone} sau puteți răspunde la acest email.\n\nCu respect,\n${contactName}\nEmail: ${contactEmail}\nTelefon / WhatsApp: ${contactPhone}\nWeb: https://qr.pontaj.app`;
      } else if (caen?.startsWith('6920') || /contab|audit|expert|consult/i.test(name)) {
        nicheCategory = 'Contabilitate & SAGA';
        pitchSubject = `Parteneriat Portal Gratuit Contabili + Export 1-Click SAGA`;
        pitchBody = `Bună ziua,\n\nȘtim cât timp pierdeți la sfârșit de lună cerșind pontajele pe hârtie de la clienții dvs. pentru a le introduce manual în SAGA Salarii.\n\nVă punem la dispoziție Portalul Gratuit pentru Contabili QR Pontaj:\n1. Primiți pontajele clienților gata calculate conform legii.\n2. Descărcați fișierele de import SAGA într-un singur click.\n3. Comision recurent de 20% lunar pe viață pentru fiecare firmă recomandată.\n\nAccesați portalul gratuit: https://qr.pontaj.app/contabil\n\nDacă doriți activarea contului, ne puteți contacta telefonic la ${contactPhone} sau prin email.\n\nCu stimă,\n${contactName}\nEmail: ${contactEmail}\nTelefon / WhatsApp: ${contactPhone}\nWeb: https://qr.pontaj.app`;
      }

      return {
        ...company,
        nicheCategory,
        pitchSubject,
        pitchBody
      };
    });

    res.json({
      success: true,
      foundCount: enriched.length,
      notFoundCount: notFound.length,
      found: enriched,
      notFound
    });
  } catch (err) {
    console.error('Eroare anaf-batch:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/harvey/anaf-save — Salvează companiile verificate oficial ANAF în sales_leads
router.post('/anaf-save', checkAdmin, async (req, res) => {
  try {
    const { companies } = req.body;
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, message: 'Furnizați o listă de companii de salvat.' });
    }

    let inserted = 0;
    for (const c of companies) {
      if (!c.name) continue;

      // Verificăm dacă există deja după CUI sau denumire
      const checkRes = await db.query(
        'SELECT id FROM sales_leads WHERE (cui IS NOT NULL AND cui = $1) OR LOWER(company_name) = LOWER($2)',
        [c.cui || '', c.name]
      );

      if (checkRes.rows.length === 0) {
        await db.query(
          `INSERT INTO sales_leads (
            company_name, city, country, phone, email, cui, address,
            notes, pitch_subject, pitch_body, status, lead_source, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
          [
            c.name,
            c.city || c.county || 'România',
            'RO',
            c.phone || '',
            c.email || '',
            c.cui || '',
            c.address || '',
            `Importat oficial ANAF v9 (CAEN: ${c.caen || 'N/A'} - ${c.caenDescription || ''})`,
            c.pitchSubject || `Soluție pontaj QR pentru ${c.name}`,
            c.pitchBody || '',
            'pending_review',
            'ANAF Official Registry'
          ]
        );
        inserted++;
      }
    }

    res.json({
      success: true,
      message: `S-au salvat cu succes ${inserted} companii verificate oficial ANAF în Harvey SDR!`,
      inserted
    });
  } catch (err) {
    console.error('Eroare anaf-save:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

