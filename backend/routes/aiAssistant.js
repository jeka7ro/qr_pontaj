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

    // 2. Fast-path instantaneu (<10ms) EXCLUSIV pentru clicurile exacte pe butoanele prestabilite
    const pTrim = prompt.trim();
    const pLower = pTrim.toLowerCase();

    // Numai dacă utilizatorul a apăsat pe o opțiune predefinită exactă folosim template-ul optimizat
    const isExactKioskSetup = pTrim === 'Cum conectez un Kiosk?' || pTrim === 'Configurare Kiosk Tabletă' || pTrim === 'Pasul 2: Adăugare Kiosk Nou';
    const isExactLocationSetup = pTrim === 'Pasul 1: Creare Punct de Lucru' || pTrim === 'Creare Punct de Lucru';
    const isExactScanGuide = pTrim === 'Cum se pontează un angajat?' || pTrim === 'Scanare & Pontaj Angajați';
    const isExactPinBackup = pTrim === 'Pontaj de rezervă cu PIN' || pTrim === 'Pontaj cu PIN';

    if (isExactKioskSetup) {
      const instantAnswer = `Pentru a conecta și afișa un ecran de pontaj (Kiosk) pe tabletă sau televizor, parcurgeți acești **4 pași clari**:

### Pasul 1: Crearea Punctului de Lucru (OBLIGATORIU)
Un ecran Kiosk NU poate fi creat dacă nu există cel puțin un punct de lucru salvat în sistem:
1. Mergeți în meniul din stânga la **Puncte de Lucru** (sau accesați **/admin/locations**).
2. Apăsați pe butonul **+ Adaugă Punct de Lucru**.
3. Introduceți denumirea (ex: *Sediul Central*, *Depozit*, *Magazin*) și adresa, apoi apăsați **Salvează**.

### Pasul 2: Adăugarea Kiosk-ului
După ce aveți locația salvată:
1. Mergeți la **Tablete Kiosk** (sau **/admin/qr**).
2. Apăsați **+ Adaugă Kiosk**.
3. Denumiți tableta (ex: *Tableta Recepție*) și selectați Punctul de Lucru creat la Pasul 1.
4. (Opțional) Bifați **Permite Pontaj cu PIN** pentru salariații fără telefon.
5. Apăsați **Salvează**.

### Pasul 3: Copierea Link-ului pe Dispozitiv
1. În tabelul cu Kiosk-uri, apăsați butonul **Copiază Link Tabletă**.
2. Deschideți browser-ul de pe tabletă (Safari pe iPad sau Chrome pe Android) și accesați linkul. Ecranul de pontaj cu QR dinamic va porni automat.

### Pasul 4: Blocarea ecranului (Mod Kiosk)
- **Pe iPad**: Din *Configurări -> Accesibilitate -> Acces Ghidat*, activați opțiunea. În Safari apăsați de 3 ori pe butonul fizic Power și apăsați *Start*.
- **Pe Android**: Din *Securitate*, activați *Fixare aplicație (Pin App)*.

Puteți folosi butoanele de acțiune directă de mai jos pentru a deschide fereastra dorită:`;

      return res.json({ answer: instantAnswer });
    }

    if (isExactLocationSetup) {
      const instantAnswer = `Primul pas obligatoriu în sistem este **crearea unui Punct de Lucru**:

Fiecare tabletă sau ecran Kiosk trebuie asociat unui sediu fizic (ex: *Sediul Central*, *Depozit*, *Magazin*, *Șantier*). Fără acest pas, crearea Kiosk-ului este blocată.

Apăsați pe butonul de mai jos pentru a deschide direct fereastra de creare a punctului de lucru:`;

      return res.json({ answer: instantAnswer });
    }

    if (isExactScanGuide) {
      const instantAnswer = `Procedura de pontaj pentru salariați (fără aplicație instalată):

1. **Deschiderea camerei foto**:
   - Angajatul deschide camera foto standard a telefonului său mobil (iOS sau Android).
   - Nu este necesară instalarea niciunei aplicații din App Store sau Google Play.

2. **Scanarea codului QR dinamic**:
   - Îndreaptă camera către codul QR afișat pe tableta Kiosk. Codul se regenerează la fiecare 5 secunde pentru securitate anti-fraudă.

3. **Confirmarea prezenței**:
   - Pe telefon apare notificarea web securizată; angajatul apasă pe ea, alege **Venire** sau **Plecare** și confirmă. Pontajul este salvat instantaneu cu timestamp și verificare GPS.`;

      return res.json({ answer: instantAnswer });
    }

    if (isExactPinBackup) {
      const instantAnswer = `Pontajul de rezervă cu cod PIN pe tabletă:

1. **Activarea opțiunii**:
   - La crearea sau editarea Kiosk-ului, asigurați-vă că este bifată opțiunea **Permite Pontaj cu PIN**.

2. **Utilizarea de către angajat**:
   - Pe ecranul tabletei Kiosk există butonul dedicat **Pontaj cu PIN**.
   - Angajatul își introduce codul PIN alocat din panoul de administrare pentru validarea prezenței chiar dacă nu are telefon sau bateria s-a descărcat.`;

      return res.json({ answer: instantAnswer });
    }

    // 3. Toate celelalte întrebări sunt procesate conversațional prin Google Gemini
    const systemInstructionText = `Ești Asistentul AI Oficial QR Pontaj. Ești un asistent inteligent, prietenos, comunicativ și extrem de bine informat despre platforma QR Pontaj și legislația muncii din România.

ROLUL TĂU:
- Comunici natural, conversațional și clar cu utilizatorul, ca un asistent AI dedicat.
- Înțelegi contextul întrebărilor și răspunzi specific la ce te întreabă utilizatorul, fără șabloane rigide.
- Răspunzi exclusiv în limba română corectă și profesionistă.

DESPRE PLATFORMA QR PONTAJ:
- Platformă românească B2B & B2C de pontaj digital inteligent, conformă cu legislația muncii din România (Codul Muncii, ITM).
- Pontajul se face prin coduri QR dinamice (anti-fraudă), care se regenerează automat la fiecare 5 secunde.
- Angajații NU au nevoie de aplicație instalată! Scanează direct cu camera foto a telefonului personal (iPhone sau Android).
- Verificare geolocație GPS la scanare pentru a preveni pontajele din afara sediului.
- Opțiune 'Pontaj cu PIN' de backup direct pe tableta Kiosk pentru salariații fără telefon mobil sau cu bateria descărcată.
- Generare condică de prezență lunară (PDF, Excel) și fișiere compatibile cu Saga Software (import direct în salarii).
- Multi-locație: o companie poate avea oricâte puncte de lucru (sedii, magazine, șantiere) și oricâte tablete Kiosk.

REGULĂ IMPORTANTĂ PENTRU KIOSK-URI:
- Pentru a crea un Kiosk, este OBLIGATORIU să existe cel puțin un Punct de Lucru creat în prealabil în meniul 'Puncte de Lucru' (/admin/locations).
- Dispozitive recomandate: Tablete iPad (cu funcția Acces Ghidat / Guided Access activată pentru blocarea ecranului), tablete Android (cu funcția Pin App / Fixare aplicație) sau Smart TV / monitoare.

REGULI STRICTE DE RĂSPUNS:
- REGULĂ ABSOLUTĂ: ESTE STRICT INTERZISĂ FOLOSIREA DE CARACTERE EMOJI (fără emoticoane, fără fețe, fără simboluri grafice emoji). Folosește exclusiv text și litere în limba română.
- Nu folosi fonturi robotizate monospace.
- Fii amabil, concis, orientat spre rezolvarea imediată a nevoii utilizatorului.`;

    // 4. Formatăm istoricul pentru API-ul Google Gemini v1beta
    const contents = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-8)) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(msg.text || msg.content || '') }]
        });
      }
    }

    let userMessageWithContext = prompt.trim();
    if (pageContext) {
      userMessageWithContext = `[Context pagină: ${pageContext}]\n${userMessageWithContext}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessageWithContext }]
    });

    // 5. Apelăm prioritar gemini-3.6-flash (rapid, cotă disponibilă), urmat de gemini-3-flash-preview, gemini-3.5-flash și gemini-3.8-flash
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.8-flash'];
    let candidateText = null;

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

    for (const modelName of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6500);

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            candidateText = text;
            console.log(`[AI Assistant] Răspuns conversațional generat cu succes via ${modelName}`);
            break;
          }
        } else {
          console.warn(`[AI Assistant] Modelul ${modelName} a returnat status ${geminiRes.status}. Se încearcă următorul model...`);
        }
      } catch (callErr) {
        console.warn(`[AI Assistant] Modelul ${modelName} eroare/timeout (${callErr.message}). Se încearcă următorul model...`);
      }
    }

    if (!candidateText) {
      // Fallback inteligent dacă toate modelele sunt indisponibile
      const p = prompt.toLowerCase();
      if (p.includes('tableta') || p.includes('tv') || p.includes('kiosk') || p.includes('ecran')) {
        candidateText = `Pentru a afișa ecranul de pontaj pe tabletă sau televizor:\n\n1. **Creați un Punct de Lucru**: În meniul Puncte de Lucru, adăugați sediul firmei (pas obligatoriu).\n2. **Creați Kiosk-ul**: În meniul Tablete Kiosk, apăsați + Adaugă Kiosk și asociați punctul de lucru.\n3. **Copiați Linkul**: Apăsați butonul Copiază Link Tabletă și deschideți-l pe dispozitiv în Safari sau Chrome.\n4. **Blocați ecranul**: Pe iPad activați Acces Ghidat (3 apăsări pe butonul Power), iar pe Android activați Fixare aplicație.`;
      } else if (p.includes('ponteaz') || p.includes('scan') || p.includes('camera')) {
        candidateText = `Procedura de pontaj pentru salariați:\n\n1. Angajatul deschide camera foto standard a telefonului său mobil.\n2. Îndreaptă camera către codul QR dinamic afișat pe tabletă.\n3. Apasă pe notificarea apărută pe telefon, alege Venire sau Plecare și confirmă. Pontajul este înregistrat instant cu timestamp și verificare GPS.`;
      } else if (p.includes('pin') || p.includes('fara telefon') || p.includes('baterie')) {
        candidateText = `Pontajul de rezervă cu cod PIN pe tabletă:\n\n1. Asigurați-vă că este bifată opțiunea Permite Pontaj cu PIN în setările Kiosk-ului.\n2. Pe ecranul tabletei există butonul Pontaj cu PIN.\n3. Angajatul își introduce codul PIN alocat pentru pontaj direct de pe tabletă.`;
      } else {
        candidateText = 'Vă stau la dispoziție cu orice detalii despre configurarea pontajului, tablete Kiosk, rapoarte sau gestionarea salariaților. Cu ce vă pot fi de folos?';
      }
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
