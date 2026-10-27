/**
 * Serviciu pentru integrarea cu FirmeAPI.ro (Tier Gratuit 100 cereri / zi)
 * + Motor hibrid de căutare după Cod CAEN (ex: 5610 Restaurante), Domeniu, Oraș sau CUI
 * cu extragere automată de Telefon, Email, Website și verificare CUI oficială.
 */

const db = require('../db');

const FIRME_API_BASE = 'https://www.firmeapi.ro/api/free';

const CAEN_CATALOG = {
  '5610': { code: '5610', label: 'Restaurante', searchNiche: 'restaurante', category: 'HORECA & Ospitalitate' },
  '5630': { code: '5630', label: 'Cafenele și Baruri', searchNiche: 'cafenele si baruri', category: 'HORECA & Ospitalitate' },
  '5510': { code: '5510', label: 'Hoteluri și Pensiuni', searchNiche: 'hoteluri si pensiuni', category: 'HORECA & Ospitalitate' },
  '5621': { code: '5621', label: 'Catering și Evenimente', searchNiche: 'firme catering si organizare evenimente', category: 'HORECA & Ospitalitate' },
  '4120': { code: '4120', label: 'Construcții Clădiri', searchNiche: 'firme constructii civile si industriale', category: 'Construcții & Șantiere' },
  '4321': { code: '4321', label: 'Instalații Electrice și Tehnice', searchNiche: 'firme instalatii electrice si termice', category: 'Construcții & Șantiere' },
  '6920': { code: '6920', label: 'Contabilitate și Audit (SAGA)', searchNiche: 'firme contabilitate expert contabil', category: 'Contabilitate & Audit' },
  '8121': { code: '8121', label: 'Curățenie Profesională', searchNiche: 'firme curatenie profesionala', category: 'Servicii & Facility' },
  '8623': { code: '8623', label: 'Clinici Medicale și Stomatologice', searchNiche: 'clinici stomatologice si medicale', category: 'Medical & Clinici' },
  '4941': { code: '4941', label: 'Transporturi Rutiere și Logistică', searchNiche: 'firme transport marfa si logistica', category: 'Transport & Logistică' },
  '8010': { code: '8010', label: 'Pază și Protecție', searchNiche: 'firme paza si protectie', category: 'Securitate & Pază' },
  '9602': { code: '9602', label: 'Saloane Beauty & Coafură', searchNiche: 'saloane infrumusetare si coafura', category: 'Beauty & Saloane' },
  '4520': { code: '4520', label: 'Service Auto și Flote', searchNiche: 'service auto multimarca', category: 'Auto & Service' },
  '1071': { code: '1071', label: 'Brutării, Patiserii și Cofetării', searchNiche: 'brutarii patiserii cofetarii', category: 'Producție Alimentară' }
};

/**
 * Verifică starea și creditele rămase pe cheia FirmeAPI
 * @returns {Promise<{ active: boolean, requestsToday: number, dailyLimit: number, remaining: number }>}
 */
async function getFirmeApiUsage() {
  const apiKey = (process.env.FIRME_API_KEY || '').trim();
  if (!apiKey) {
    return { active: false, requestsToday: 0, dailyLimit: 100, remaining: 0, error: 'Lipsește FIRME_API_KEY' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${FIRME_API_BASE}/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { active: false, requestsToday: 0, dailyLimit: 100, remaining: 0, error: `HTTP ${res.status}` };
    }

    const json = await res.json();
    if (json && json.success && json.data) {
      return {
        active: Boolean(json.data.is_active),
        requestsToday: json.data.requests_today || 0,
        dailyLimit: json.data.daily_limit || 100,
        remaining: typeof json.data.remaining === 'number' ? json.data.remaining : 0
      };
    }
    return { active: false, requestsToday: 0, dailyLimit: 100, remaining: 0 };
  } catch (err) {
    console.warn('[FirmeAPI] getUsage warning:', err.message);
    return { active: false, requestsToday: 0, dailyLimit: 100, remaining: 0, error: err.message };
  }
}

/**
 * Caută o companie după CUI pe FirmeAPI.ro
 * @param {string|number} rawCui
 * @returns {Promise<object|null>}
 */
async function lookupFirmeApiCompany(rawCui) {
  const apiKey = (process.env.FIRME_API_KEY || '').trim();
  if (!apiKey) return null;

  if (!rawCui) return null;
  const digitsOnly = String(rawCui).replace(/[^0-9]/g, '');
  if (!digitsOnly || digitsOnly.length < 2) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${FIRME_API_BASE}/firma/${digitsOnly}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) return null;
      console.warn(`[FirmeAPI] lookup failed HTTP ${res.status} for CUI ${digitsOnly}`);
      return null;
    }

    const json = await res.json();
    if (!json || !json.success || !json.data) {
      return null;
    }

    const d = json.data;
    const adr = d.adresa || {};

    const rawAddress = d.adresa_completa || '';
    const fallbackAddress = [
      adr.judet ? `Jud. ${adr.judet}` : '',
      adr.localitate || '',
      adr.strada ? `${adr.strada} ${adr.numar || ''}`.trim() : ''
    ].filter(Boolean).join(', ');

    return {
      cui: String(d.cui),
      name: d.denumire || '',
      address: rawAddress || fallbackAddress || '',
      city: adr.localitate || '',
      county: adr.judet || '',
      street: adr.strada || '',
      streetNumber: adr.numar || '',
      postalCode: adr.cod_postal || '',
      phone: '',
      email: '',
      website: '',
      regCom: d.nr_reg_com || '',
      isVatPayer: false,
      status: 'ACTIV',
      source: 'firmeapi'
    };
  } catch (err) {
    console.warn(`[FirmeAPI] Error fetching CUI ${digitsOnly}:`, err.message);
    return null;
  }
}

/**
 * Extrage email și telefon de pe website-ul unei companii (dacă este disponibil)
 */
async function quickScrapeWebsiteContact(websiteUrl) {
  if (!websiteUrl) return { email: '', phone: '', cui: '' };
  try {
    let cleanUrl = websiteUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(t);
    if (!res.ok) return { email: '', phone: '', cui: '' };
    const html = await res.text();

    // Extragere email
    const emailMatches = (html.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [])
      .map(e => e.toLowerCase().trim())
      .filter(e => !e.endsWith('.png') && !e.endsWith('.jpg') && !e.endsWith('.svg') && !e.endsWith('.webp') && !e.includes('sentry') && !e.includes('wix') && !e.includes('example'));
    const bestEmail = emailMatches.find(e => /^(office|contact|rezervari|receptie|info|hr|secretariat)@/.test(e)) || emailMatches[0] || '';

    // Extragere CUI
    let foundCui = '';
    const cuiMatch = html.match(/(?:CUI|CIF|Cod\s*Fiscal)[\s:\.\-]*([A-Z]{2})?\s*([0-9]{6,10})\b/i);
    if (cuiMatch && cuiMatch[2]) {
      foundCui = cuiMatch[2];
    }

    return { email: bestEmail, phone: '', cui: foundCui };
  } catch (e) {
    return { email: '', phone: '', cui: '' };
  }
}

/**
 * Îmbogățire date de contact (Telefon, Email, Website) pentru o listă de companii prin Gemini / Google Places
 */
async function enrichCompaniesContactDetails(companies, cityContext = 'București') {
  if (!Array.isArray(companies) || companies.length === 0) return companies;

  let geminiKey = process.env.GEMINI_API_KEY || null;
  if (!geminiKey) {
    try {
      const sRes = await db.query('SELECT gemini_api_key FROM sales_settings ORDER BY id ASC LIMIT 1');
      if (sRes.rows.length > 0 && sRes.rows[0].gemini_api_key) {
        geminiKey = sRes.rows[0].gemini_api_key;
      }
    } catch (e) {}
  }

  if (!geminiKey) return companies;

  const missingContact = companies.filter(c => !c.phone || !c.email);
  if (missingContact.length === 0) return companies;

  const listText = missingContact.map((c, idx) => `${idx + 1}. ${c.name} (CUI: ${c.cui || 'N/A'}, Localitate: ${c.city || cityContext})`).join('\n');
  const prompt = `Pentru următoarele companii reale din România, returnează datele oficiale de contact cunoscute public (număr de telefon din România +40..., adresă de email oficială office@/contact@..., website oficial și cod CAEN / domeniu scurt):
${listText}

Răspunde STRICT cu un array JSON valid:
[
  {
    "name": "Numele companiei",
    "cui": "CUI",
    "phone": "+40...",
    "email": "office@...",
    "website": "https://...",
    "caen": "cod CAEN 4 cifre",
    "caenDescription": "Descriere domeniu"
  }
]`;

  const models = ['gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-flash-latest'];
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
          if (Array.isArray(parsed)) {
            for (const comp of companies) {
              const match = parsed.find(p =>
                (p.cui && comp.cui && String(p.cui).replace(/\D/g, '') === String(comp.cui).replace(/\D/g, '')) ||
                (p.name && comp.name && p.name.toLowerCase().includes(comp.name.toLowerCase().slice(0, 8)))
              );
              if (match) {
                if (!comp.phone && match.phone) comp.phone = match.phone;
                if (!comp.email && match.email) comp.email = match.email;
                if (!comp.website && match.website) comp.website = match.website;
                if (!comp.caen && match.caen) comp.caen = match.caen;
                if (!comp.caenDescription && match.caenDescription) comp.caenDescription = match.caenDescription;
              }
            }
            break;
          }
        }
      }
    } catch (e) {}
  }

  return companies;
}

/**
 * Descoperă companii reale după Cod CAEN (ex: 5610) sau Domeniu / Cuvânt cheie + Oraș,
 * apoi verifică CUI-urile oficial în FirmeAPI.ro și extrage Telefon, Email și Website!
 */
async function discoverCompaniesByCaenOrQuery({ query, caen, city = 'București', limit = 10 }) {
  const cleanCode = String(caen || query || '').trim();
  const caenEntry = CAEN_CATALOG[cleanCode] || null;
  const targetCity = city && city !== 'all' ? city : 'București';
  const targetLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 3), 25);

  const searchDescription = caenEntry
    ? `cod CAEN ${caenEntry.code} (${caenEntry.label} / ${caenEntry.searchNiche})`
    : `domeniul / căutarea "${cleanCode}"`;

  let geminiKey = process.env.GEMINI_API_KEY || null;
  let googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY || null;
  try {
    const sRes = await db.query('SELECT gemini_api_key, google_places_api_key FROM sales_settings ORDER BY id ASC LIMIT 1');
    if (sRes.rows.length > 0) {
      if (!geminiKey && sRes.rows[0].gemini_api_key) geminiKey = sRes.rows[0].gemini_api_key;
      if (!googlePlacesKey && sRes.rows[0].google_places_api_key) googlePlacesKey = sRes.rows[0].google_places_api_key;
    }
  } catch (e) {}

  const discovered = [];
  const seenNames = new Set();

  // 1. Descoperire cu Gemini AI Directory (returnează și CUI-ul fiscal, telefonul, emailul și website-ul)
  if (geminiKey) {
    const prompt = `Ești un registru comercial și director B2B de maximă acuratețe pentru România.
Identifică ${targetLimit} companii / afaceri REALE, active și cunoscute din orașul ${targetCity}, România, care activează în ${searchDescription}.
Pentru fiecare companie returnează obligatoriu:
1. "name": Denumirea comercială sau denumirea juridică SRL/SA reală
2. "cui": Codul Unic de Înregistrare (CUI numeric real, 6-8 cifre, dacă este cunoscut)
3. "phone": Număr de telefon real din România (+40 7... sau +40 2... / +40 3...)
4. "email": Adresă de email oficială de contact (office@..., contact@..., rezervari@...)
5. "website": Website-ul oficial al afacerii (https://...)
6. "address": Adresa fizică exactă din ${targetCity}
7. "city": "${targetCity}"
8. "caen": "${caenEntry ? caenEntry.code : (cleanCode.match(/^\d{4}$/) ? cleanCode : '')}"
9. "caenDescription": "${caenEntry ? caenEntry.label : cleanCode}"

Răspunde STRICT cu un array JSON valid de obiecte, fără explicații suplimentare.`;

    const models = ['gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-flash-latest'];
    for (const model of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
          })
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
              for (const item of parsed) {
                if (!item.name) continue;
                const key = item.name.toLowerCase().trim();
                if (seenNames.has(key)) continue;
                seenNames.add(key);
                discovered.push(item);
              }
              break;
            }
          }
        }
      } catch (err) {
        console.warn(`[FirmeAPI Discovery] Model ${model} warning:`, err.message);
      }
    }
  }

  // 2. Verificare în FirmeAPI.ro (pentru CUI-urile identificate) + Scraping rapid pe website dacă lipsește email/CUI
  const usageBefore = await getFirmeApiUsage();
  let remainingBudget = usageBefore.remaining || 0;

  const finalCompanies = [];
  for (const item of discovered.slice(0, targetLimit)) {
    let scrapedEmail = '';
    let scrapedCui = '';

    if (item.website) {
      const scraped = await quickScrapeWebsiteContact(item.website);
      if (scraped.email) scrapedEmail = scraped.email;
      if (scraped.cui) scrapedCui = scraped.cui;
    }

    const candidateCui = scrapedCui || String(item.cui || '').replace(/[^0-9]/g, '');
    let officialData = null;

    if (candidateCui && candidateCui.length >= 5 && remainingBudget > 0) {
      const lookupRes = await lookupFirmeApiCompany(candidateCui);
      if (lookupRes) {
        remainingBudget--;
        // Verificăm ca denumirea din FirmeAPI să nu fie o persoană fizică sau o firmă complet diferită dacă CUI-ul nu a fost extras direct de pe site
        const offLower = (lookupRes.name || '').toLowerCase();
        const itemWords = (item.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9ăâîșț\s]/gi, '')
          .split(/\s+/)
          .filter(w => w.length >= 4 && !['srl', 'grup', 'company', 'impex', 'serv', 'prod', 'com', 'romania', 'bucuresti'].includes(w));

        const hasWordOverlap = itemWords.some(w => offLower.includes(w));
        const isPfaMismatch = offLower.includes('persoană fizică') || offLower.includes('persoana fizica');

        if (!isPfaMismatch && (scrapedCui || hasWordOverlap)) {
          officialData = lookupRes;
        }
      }
    }

    finalCompanies.push({
      cui: officialData?.cui || scrapedCui || '',
      name: officialData?.name || item.name,
      address: officialData?.address || item.address || `${targetCity}, România`,
      city: officialData?.city || item.city || targetCity,
      county: officialData?.county || targetCity,
      phone: item.phone || officialData?.phone || '',
      email: scrapedEmail || item.email || '',
      website: item.website || '',
      regCom: officialData?.regCom || item.regCom || '',
      caen: item.caen || (caenEntry ? caenEntry.code : ''),
      caenDescription: item.caenDescription || (caenEntry ? caenEntry.label : cleanCode),
      nicheCategory: caenEntry ? caenEntry.category : undefined,
      isVatPayer: Boolean(officialData?.isVatPayer),
      status: 'ACTIV',
      source: 'firmeapi'
    });
  }

  const updatedUsage = await getFirmeApiUsage();

  return {
    found: finalCompanies,
    notFound: [],
    usage: updatedUsage
  };
}

/**
 * Caută o listă de CUI-uri pe FirmeAPI.ro (sau comută automat pe căutare CAEN/Domeniu dacă s-a introdus un cod CAEN de 4 cifre!)
 * @param {string[]} cuis
 * @param {object} options
 * @returns {Promise<{ found: object[], notFound: string[], usage: object }>}
 */
async function lookupFirmeApiBatch(cuis, options = {}) {
  const { city = 'București', limit = 10 } = options;

  // Dacă s-a trimis un singur cod de 4 cifre (ex: 5610, 4120, 6920) -> este COD CAEN, nu CUI!
  if (Array.isArray(cuis) && cuis.length === 1 && /^\d{4}$/.test(String(cuis[0]).trim())) {
    return discoverCompaniesByCaenOrQuery({
      caen: String(cuis[0]).trim(),
      city,
      limit
    });
  }

  const usage = await getFirmeApiUsage();
  const maxToProcess = Math.min(cuis.length, usage.remaining || 100);

  const found = [];
  const notFound = [];

  for (let i = 0; i < maxToProcess; i++) {
    const rawCui = cuis[i];
    const company = await lookupFirmeApiCompany(rawCui);
    if (company && company.name) {
      found.push(company);
    } else {
      notFound.push(String(rawCui));
    }
  }

  // Îmbogățim automat cu telefon, email și website companiile găsite după CUI
  if (found.length > 0) {
    await enrichCompaniesContactDetails(found, city);
  }

  // CUI-urile care au depășit limita zilnică dacă există
  if (cuis.length > maxToProcess) {
    for (let i = maxToProcess; i < cuis.length; i++) {
      notFound.push(`${cuis[i]} (limită zilnică atinsă)`);
    }
  }

  const updatedUsage = await getFirmeApiUsage();

  return {
    found,
    notFound,
    usage: updatedUsage
  };
}

module.exports = {
  CAEN_CATALOG,
  lookupFirmeApiCompany,
  getFirmeApiUsage,
  lookupFirmeApiBatch,
  discoverCompaniesByCaenOrQuery,
  enrichCompaniesContactDetails
};
