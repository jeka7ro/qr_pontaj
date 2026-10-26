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

    // 2. Fast-path instantaneu (<15ms) pentru întrebările rapide prestabilite din interfață
    const pTrim = prompt.trim().toLowerCase();
    if (
      pTrim.includes('cum pun ecranul pe tablet') || 
      pTrim.includes('cum pun ecranul pe tv') || 
      pTrim.includes('cum blochez pe tableta') ||
      pTrim.includes('kiosk pe tableta') ||
      pTrim.includes('cum conectez un kiosk') ||
      pTrim.includes('cum creez un kiosk') ||
      pTrim.includes('conectez un kiosk') ||
      pTrim.includes('creez un kiosk')
    ) {
      const instantAnswer = `Pentru a conecta și afișa un ecran de pontaj (Kiosk) pe tabletă sau televizor, este esențial să parcurgeți acești **4 pași clari**:

### Pasul 1: Crearea Punctului de Lucru (OBLIGATORIU)
Un ecran Kiosk NU poate fi creat dacă nu există cel puțin un punct de lucru în sistem, deoarece fiecare tabletă trebuie asociată unei locații fizice:
1. Mergeți în meniul din stânga la **Puncte de Lucru** (sau accesați **/admin/locations**).
2. Apăsați pe butonul **+ Adaugă Punct de Lucru**.
3. Introduceți numele locației (ex: *Sediul Central*, *Depozit*, *Magazin*) și adresa, apoi apăsați **Salvează**.

### Pasul 2: Adăugarea Kiosk-ului
După ce aveți cel puțin un Punct de Lucru salvat:
1. Mergeți în meniul din stânga la **Tablete Kiosk** (sau **/admin/qr**).
2. Apăsați pe butonul **+ Adaugă Kiosk**.
3. Introduceți un nume pentru tabletă (ex: *Tableta Intrare Recepție*).
4. La rubrica **Punct de Lucru**, selectați din listă locația creată la Pasul 1.
5. (Opțional) Bifați opțiunea de backup **Permite Pontaj cu PIN** pentru salariații fără telefon.
6. Apăsați **Salvează**.

### Pasul 3: Copierea Link-ului pe Tabletă sau TV
1. În tabelul cu Kiosk-uri, apăsați pe butonul albastru **Copiază Link Tabletă**.
2. Deschideți browser-ul de pe dispozitiv (Safari pe iPad, Chrome pe Android sau browser-ul Smart TV).
3. Introduceți linkul copiat (sau trimiteți-l pe tabletă prin WhatsApp / Email) și accesați-l. Ecranul de pontaj cu cod QR dinamic va porni automat.

### Pasul 4: Blocarea ecranului (Kiosk Mode Anti-Ieșire)
Pentru ca angajații să nu poată ieși din ecranul de pontaj:
- **Pe iPad (Recomandat)**: Din **Configurări -> Accesibilitate -> Acces Ghidat**, activați opțiunea. Deschideți linkul în Safari și apăsați de 3 ori consecutiv pe butonul fizic Power -> apăsați **Start** în colțul din dreapta-sus. Tableta va rămâne blocată exclusiv pe pontaj.
- **Pe Android**: Din **Configurări -> Securitate**, activați **Fixare aplicație (Pin App)**. Deschideți Chrome cu linkul și fixați ecranul.
- **Pe Smart TV / PC**: Apăsați tasta **F11** sau butonul de Full Screen din browser.

---
**Vrei să te ajut să creezi un Punct de Lucru chiar acum?**
Sau vrei să te duc direct pe pagina Puncte de Lucru cu formularul deschis? Alege una dintre acțiunile de mai jos:`;

      return res.json({ answer: instantAnswer });
    }

    if (
      pTrim.includes('punct de lucru') || 
      pTrim.includes('puncte de lucru') || 
      pTrim.includes('creez punct') || 
      pTrim.includes('creaza punct') || 
      pTrim.includes('adauga punct') ||
      pTrim.includes('du-ma la puncte') ||
      pTrim.includes('du ma la puncte') ||
      pTrim.includes('ajuta-ma sa creez') ||
      pTrim.includes('vreau sa creez un punct')
    ) {
      const instantAnswer = `Pentru a începe configurarea pontajului pe tablete, primul pas obligatoriu este **crearea unui Punct de Lucru**:

Fiecare punct de lucru reprezintă sediul fizic (ex: *Sediul Central*, *Depozit*, *Magazin*, *Șantier*) la care vor fi alocate tabletele Kiosk.

**Vrei să te duc la pagina Puncte de Lucru și să deschid direct formularul?**
Sau vrei să creăm punctul de lucru chiar acum, direct de aici din asistent?

Alege acțiunea dorită din butoanele interactive de mai jos:`;

      return res.json({ answer: instantAnswer });
    }

    if (pTrim.includes('cum se ponteaz') || pTrim.includes('cum se scaneaz')) {
      const instantAnswer = `Procedura de pontaj pentru salariați (fără aplicație instalată):

1. **Deschiderea camerei foto**:
   - Angajatul deschide camera foto standard a telefonului său mobil (iPhone sau Android).
   - Nu este necesară instalarea niciunei aplicații din App Store sau Google Play.

2. **Scanarea codului QR dinamic**:
   - Îndreaptă camera către codul QR afișat pe tableta Kiosk. Codul se regenerează la fiecare 5 secunde împotriva fraudelor.

3. **Confirmarea pontajului**:
   - Pe telefon apare notificarea web securizată; angajatul apasă pe ea, alege **Venire** sau **Plecare** și confirmă. Pontajul este înregistrat instantaneu cu timestamp și verificare GPS.`;

      return res.json({ answer: instantAnswer });
    }

    if (pTrim.includes('pontaj cu pin') || pTrim.includes('fara telefon') || pTrim.includes('fara baterie')) {
      const instantAnswer = `Pontajul de rezervă cu cod PIN pe tabletă:

1. **Activarea opțiunii**:
   - La crearea sau editarea Kiosk-ului, asigurați-vă că este bifată opțiunea **Permite Pontaj cu PIN**.

2. **Utilizarea de către angajat**:
   - Pe ecranul tabletei Kiosk apăsați pe butonul **Pontaj cu PIN**.
   - Angajatul își introduce codul PIN alocat din panoul de administrare pentru validarea prezenței.`;

      return res.json({ answer: instantAnswer });
    }

    // 3. Construim contextul de sistem pentru QR Pontaj
    const systemInstructionText = `Ești Asistentul Oficial QR Pontaj (asistent de suport tehnic și operațional). Răspunzi exclusiv în limba română, amabil, extrem de clar, structurat cu pași simpli (1, 2, 3) și formatat în markdown curat.

DESPRE QR PONTAJ:
- Este o platformă românească B2B & B2C de pontaj digital inteligent, conformă cu legislația muncii din România (Codul Muncii, ITM).
- Pontajul se face prin coduri QR dinamice (anti-fraudă), care se regenerează automat la fiecare 5 secunde.
- Angajații NU trebuie să instaleze nicio aplicație din magazin! Deschid doar camera foto a telefonului personal și scanează codul de pe ecran.
- Sistemul verifică geolocația GPS la scanare pentru a valida prezența la sediu.
- Există și mod de backup 'Pontaj cu PIN' direct pe tabletă pentru angajații fără telefon sau cu bateria descărcată.
- Generare condică de prezență lunară (PDF, Excel) și fișiere compatibile cu Saga Software (import direct în salarii).

CUM SE CONFIGUREAZĂ UN KIOSK (REGULĂ OBLIGATORIE):
- ATENȚIE MAXIMĂ: Pentru a crea un Kiosk, este OBLIGATORIU să fie creat mai întâi cel puțin un Punct de Lucru în meniul 'Puncte de Lucru' (/admin/locations). Un Kiosk cere obligatoriu asocierea unui punct de lucru.
- Pasul 1: Creare Punct de Lucru (Meniu 'Puncte de Lucru' -> '+ Adaugă Punct de Lucru').
- Pasul 2: Adăugare Kiosk (Meniu 'Tablete Kiosk' -> '+ Adaugă Kiosk' -> selectare Punct de Lucru creat la Pasul 1).
- Pasul 3: Copiere Link Tabletă (apăsare pe butonul 'Copiază Link Tabletă' și deschidere în Safari pe iPad, Chrome pe Android sau Smart TV).
- Pasul 4: Blocare ecran în mod Kiosk (iPad: Acces Ghidat cu 3 click-uri Power; Android: Fixare aplicație / Pin App; Smart TV: tasta F11).

REGULI STRICTE DE RĂSPUNS:
- REGULĂ ABSOLUTĂ: ESTE STRICT INTERZISĂ FOLOSIREA DE CARACTERE EMOJI (fără fețe, fără emoticoane, fără simboluri grafice emoji sub nicio formă).
- Folosește exclusiv text curat și litere în limba română.
- Răspunde concis și la obiect în pași numerotați clari.
- Nu folosi fonturi robotizate monospace.
- Fii amabil, profesionist și orientat spre soluții practice.`;

    // 4. Formatăm istoricul pentru API-ul Google Gemini v1beta
    const contents = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) {
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

    // 5. Apelăm prioritar modelul Google Gemini 3.8 Flash, cu fallback rapid la Gemini 3 Flash Preview
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3-flash-preview'];
    let candidateText = null;

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700,
      }
    };

    for (const modelName of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

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
            console.log(`[AI Assistant] Răspuns generat cu succes via ${modelName}`);
            break;
          }
        } else {
          console.warn(`[AI Assistant] Modelul ${modelName} a returnat HTTP ${geminiRes.status}. Se încearcă modelul de rezervă...`);
        }
      } catch (callErr) {
        console.warn(`[AI Assistant] Modelul ${modelName} indisponibil sau timeout (${callErr.message}). Se încearcă modelul de rezervă...`);
      }
    }

    if (!candidateText) {
      // Fallback inteligent instant pe baza ghidului oficial QR Pontaj dacă rețeaua Google este indisponibilă
      const p = prompt.toLowerCase();
      if (p.includes('tableta') || p.includes('tv') || p.includes('kiosk') || p.includes('ecran')) {
        candidateText = `Pentru a afișa ecranul de pontaj pe tabletă sau televizor:\n\n1. **Creați Kiosk-ul**: Mergeți în meniul **Tablete Kiosk** și apăsați **+ Adaugă Kiosk**.\n2. **Copiați Linkul**: În tabelul de Kiosk-uri, apăsați pe butonul **Copiază Link Tabletă**.\n3. **Deschideți pe tabletă**: Introduceți linkul în Safari (pe iPad), Chrome (pe Android) sau browser-ul din Smart TV.\n4. **Blocați pe ecranul de pontaj (Kiosk Mode)**:\n   - **Pe iPad**: Din Configurări -> Accesibilitate -> activați **Acces Ghidat**. Deschideți linkul în Safari și apăsați de 3 ori pe butonul Power -> Start.\n   - **Pe Android**: Activați **Fixare aplicație (Pin App)** din Securitate.\n   - **Pe Smart TV / PC**: Apăsați tasta F11 sau butonul Full Screen.`;
      } else if (p.includes('ponteaz') || p.includes('scan') || p.includes('camera')) {
        candidateText = `Procedura de pontaj pentru salariați:\n\n1. Angajatul deschide camera foto a telefonului personal (fără a instala nicio aplicație suplimentară).\n2. Îndreaptă camera către codul QR dinamic afișat pe tabletă.\n3. Pe ecranul telefonului apare notificarea web securizată; apasă pe ea, selectează **Venire** sau **Plecare** și confirmă. Pontajul este salvat instant.`;
      } else if (p.includes('pin') || p.includes('fara telefon') || p.includes('baterie')) {
        candidateText = `Pontajul de rezervă cu cod PIN:\n\n1. Din pagina de editare a Kiosk-ului, asigurați-vă că este activată opțiunea de pontaj cu PIN.\n2. Pe ecranul tabletei Kiosk există butonul **Pontaj cu PIN**.\n3. Angajatul fără telefon sau cu bateria descărcată își introduce codul PIN propriu pentru înregistrare.`;
      } else {
        candidateText = 'Nu am putut genera un răspuns în acest moment din cauza indisponibilității temporare a serverelor AI. Vă rugăm să consultați ghidul din pagina Tablete Kiosk sau să reformulați întrebarea.';
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
