const express = require('express');
const router = express.Router();
const pool = require('../db');

// Răspuns de asistență AI bazat pe Google Gemini 3.5 Flash Lite
router.post('/assistant', async (req, res) => {
  try {
    const { prompt, history = [], tenantId, pageContext } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Întrebarea este obligatorie.' });
    }

    // 1. Obținem cheia Gemini din sales_settings (sau fallback la process.env.GEMINI_API_KEY)
    let apiKey = process.env.GEMINI_API_KEY;
    try {
      const settingsRes = await pool.query('SELECT gemini_api_key FROM sales_settings LIMIT 1');
      if (settingsRes.rows.length > 0 && settingsRes.rows[0].gemini_api_key) {
        apiKey = settingsRes.rows[0].gemini_api_key;
      }
    } catch (dbErr) {
      console.warn('[AI Assistant] Nu s-a putut citi cheia din sales_settings:', dbErr.message);
    }

    if (!apiKey) {
      return res.status(200).json({
        answer: 'Pentru a activa Asistentul AI inteligent, te rugăm să configurezi cheia Google Gemini în panoul de administrare (Setări Harvey / Sales). Momentan poți consulta secțiunea de Kiosk-uri și Ghidul iPad / Tabletă direct din meniu.'
      });
    }

    // 2. Construim contextul de sistem pentru QR Pontaj
    const systemInstructionText = `Ești Asistentul Oficial QR Pontaj (asistent de suport tehnic și operațional). Răspunzi exclusiv în limba română, amabil, extrem de clar, structurat cu pași simpli (1, 2, 3) și formatat în markdown curat.

DESPRE QR PONTAJ:
- Este o platformă românească B2B & B2C de pontaj digital inteligent, conformă cu legislația muncii din România (Codul Muncii, ITM).
- Pontajul se face prin coduri QR dinamice (anti-fraudă), care se regenerează automat la fiecare 5 secunde.
- Angajații NU trebuie să instaleze nicio aplicație din magazin! Deschid doar camera foto a telefonului personal și scanează codul de pe ecran.
- Sistemul verifică geolocația GPS la scanare pentru a valida prezența la sediu.
- Există și mod de backup 'Pontaj cu PIN' direct pe tabletă pentru angajații fără telefon sau cu bateria descărcată.
- Generare condică de prezență lunară (PDF, Excel) și fișiere compatibile cu Saga Software (import direct în salarii).

CUM SE REZOLVĂ CELE MAI FRECVENTE SITUAȚII:
1. "Cum creez un Kiosk și cum îl folosesc pe tabletă?":
   - Pasul 1: Mergi în meniul 'Kiosk-uri & Tablete' și apasă '+ Adaugă Kiosk'. Completează numele (ex: Recepție) și asociază locația.
   - Pasul 2: În tabelul de Kiosk-uri, apasă pe butonul 'Copiază Link Tabletă' (sau folosește linkul generat).
   - Pasul 3: Deschide acest link în browser-ul de pe tableta montată pe perete la intrare (Safari pe iPad, Chrome pe Android sau browser pe Smart TV).
   - Pasul 4: Blochează ecranul pe aplicație:
     * Pe iPad: Folosește 'Acces Ghidat' (Guided Access) din Configurări -> Accesibilitate -> Acces Ghidat. Deschide link-ul în Safari și apasă de 3 ori pe butonul de pornire (Power) -> Start. Astfel tableta rămâne blocată doar pe ecranul de pontaj și nimeni nu poate umbla în poze sau alte aplicații.
     * Pe Android: Activează 'Fixare aplicație' (Pin App) din Setări de Securitate.
     * Pe Smart TV / PC: Apasă tasta F11 pentru Full Screen.
2. "Cum se pontează angajații?":
   - Angajatul deschide camera telefonului (iPhone sau Android).
   - Îndreaptă camera către codul QR de pe tabletă.
   - Pe ecranul telefonului apare o notificare web; apasă pe ea, alege 'Venire' sau 'Plecare' și confirmă. Gata, pontajul este salvat instant în baza de date!
3. "Ce fac dacă un angajat nu are telefon sau nu are baterie?":
   - La crearea sau editarea Kiosk-ului, bifează/setează un PIN de Kiosk (sau angajatul are PIN propriu).
   - Pe ecranul tabletei există butonul 'Pontaj cu PIN', unde angajatul își poate introduce codul manual.
4. "Cum export pontajul pentru contabilitate / Saga?":
   - Din meniul 'Rapoarte' sau 'Saga', selectează luna dorită și descarcă raportul de pontaj sau fișierul de import pentru Saga.

REGULI STRICTE DE RĂSPUNS:
- REGULĂ ABSOLUTĂ: ESTE STRICT INTERZISĂ FOLOSIREA DE CARACTERE EMOJI (fără fețe, fără emoticoane, fără simboluri grafice emoji sub nicio formă).
- Folosește exclusiv text curat și litere în limba română.
- Răspunde concis și la obiect în pași numerotați clari.
- Nu folosi fonturi robotizate monospace.
- Fii amabil, profesionist și orientat spre soluții practice.`;

    // 3. Formatăm istoricul pentru API-ul Google Gemini v1beta
    const contents = [];

    // Adăugăm mesajele anterioare din istoric dacă există
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) { // păstrăm ultimele 6 mesaje pentru context optim
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(msg.text || msg.content || '') }]
        });
      }
    }

    // Adăugăm întrebarea curentă a utilizatorului
    let userMessageWithContext = prompt.trim();
    if (pageContext) {
      userMessageWithContext = `[Context pagină: ${pageContext}]\n${userMessageWithContext}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessageWithContext }]
    });

    // 4. Apelăm modelul gemini-3.5-flash-lite
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      }
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('[AI Assistant] Gemini API error:', geminiRes.status, errText);
      return res.status(200).json({
        answer: 'Serviciul de asistență AI întâmpină o problemă temporară de conexiune. Te rugăm să consulți butonul Ghid iPad / Tabletă din pagina de Kiosk-uri sau să reîncerci în câteva momente.'
      });
    }

    const geminiData = await geminiRes.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return res.status(200).json({
        answer: 'Nu am putut genera un răspuns detaliat. Te rugăm să reformulezi întrebarea.'
      });
    }

    // Curățare forțată de caractere emoji (inclusiv diverse blocuri unicode emoji)
    const cleanAnswer = candidateText
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}]/gu, '')
      .trim();

    return res.json({ answer: cleanAnswer });
  } catch (err) {
    console.error('[AI Assistant] Eroare internă:', err);
    return res.status(500).json({
      error: 'Eroare la procesarea asistentului AI.',
      details: err.message
    });
  }
});

module.exports = router;
