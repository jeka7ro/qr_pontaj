/**
 * Serviciu oficial pentru interogarea registrului public ANAF
 * Endpoint v9: https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva
 * Cu fallback automat pe FirmeAPI.ro (100 cereri/zi gratuite) când ANAF nu răspunde.
 */

const { lookupFirmeApiCompany, lookupFirmeApiBatch } = require('./firmeApiService');

async function lookupAnafCompany(rawCui) {
  if (!rawCui) return null;
  const digitsOnly = String(rawCui).replace(/[^0-9]/g, '');
  if (!digitsOnly || digitsOnly.length < 2) return null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const anafRes = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ cui: parseInt(digitsOnly, 10), data: today }]),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!anafRes.ok) {
        if (attempt === 1) continue;
        break;
      }
      const data = await anafRes.json();
      const item = data.found && data.found.length > 0 ? data.found[0] : null;
      if (!item || !item.date_generale) break;

      const gen = item.date_generale;
      const adr = item.adresa_sediu_social || {};

      const rawAddress = gen.adresa || '';
      const fallbackAddress = [
        adr.sdenumire_Judet ? `Jud. ${adr.sdenumire_Judet}` : '',
        adr.sdenumire_Localitate || '',
        adr.sdenumire_Strada ? `${adr.sdenumire_Strada} ${adr.snumar_Strada || ''}`.trim() : '',
        adr.sdetalii_Adresa || ''
      ].filter(Boolean).join(', ');

      return {
        cui: String(gen.cui),
        name: gen.denumire || '',
        address: rawAddress || fallbackAddress || '',
        city: adr.sdenumire_Localitate || '',
        county: adr.sdenumire_Judet || '',
        street: adr.sdenumire_Strada || '',
        streetNumber: adr.snumar_Strada || '',
        postalCode: gen.codPostal || adr.scod_Postal || '',
        phone: gen.telefon || '',
        regCom: gen.nrRegCom || '',
        isVatPayer: Boolean(item.inregistrare_scop_Tva?.scpTVA),
        status: gen.stare_inregistrare || 'ACTIV',
        source: 'anaf'
      };
    } catch (err) {
      if (attempt === 1) continue;
      console.warn('[ANAF] Auto-lookup warning, trying FirmeAPI fallback:', err.message);
    }
  }

  // Fallback automat la FirmeAPI.ro dacă ANAF v9 nu a returnat rezultat sau a dat timeout
  try {
    const fallbackCompany = await lookupFirmeApiCompany(digitsOnly);
    if (fallbackCompany && fallbackCompany.name) {
      return fallbackCompany;
    }
  } catch (fbErr) {
    console.warn('[ANAF -> FirmeAPI Fallback] warning:', fbErr.message);
  }

  return null;
}

/**
 * Interogare în lot (bulk) pentru o listă de CUI-uri
 * @param {Array<string|number>} cuiList - Listă de coduri fiscale
 * @returns {Promise<{ found: Array, notFound: Array }>}
 */
async function lookupAnafBatch(cuiList) {
  if (!Array.isArray(cuiList) || cuiList.length === 0) {
    return { found: [], notFound: [] };
  }

  // Curățăm și deduplicăm CUI-urile
  const cleanCuis = Array.from(new Set(
    cuiList
      .map(c => String(c || '').replace(/[^0-9]/g, ''))
      .filter(c => c && c.length >= 2)
  )).slice(0, 100); // Limităm la 100 per apel pentru stabilitate

  if (cleanCuis.length === 0) {
    return { found: [], notFound: [] };
  }

  const today = new Date().toISOString().split('T')[0];
  const payload = cleanCuis.map(cui => ({
    cui: parseInt(cui, 10),
    data: today
  }));

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const anafRes = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!anafRes.ok) {
        throw new Error(`Serverul ANAF a răspuns cu codul ${anafRes.status}.`);
      }

      const data = await anafRes.json();
      const rawFound = data.found || [];
      const notFound = (data.notFound || []).map(String);

      const normalizedFound = rawFound.map(item => {
        const gen = item.date_generale || {};
        const adr = item.adresa_sediu_social || {};

        const rawAddress = gen.adresa || '';
        const fallbackAddress = [
          adr.sdenumire_Judet ? `Jud. ${adr.sdenumire_Judet}` : '',
          adr.sdenumire_Localitate || '',
          adr.sdenumire_Strada ? `${adr.sdenumire_Strada} ${adr.snumar_Strada || ''}`.trim() : '',
          adr.sdetalii_Adresa || ''
        ].filter(Boolean).join(', ');

        return {
          cui: String(gen.cui),
          name: gen.denumire || '',
          address: rawAddress || fallbackAddress || '',
          city: adr.sdenumire_Localitate || '',
          county: adr.sdenumire_Judet || '',
          street: adr.sdenumire_Strada || '',
          streetNumber: adr.snumar_Strada || '',
          postalCode: gen.codPostal || adr.scod_Postal || '',
          phone: gen.telefon || '',
          regCom: gen.nrRegCom || '',
          isVatPayer: Boolean(item.inregistrare_scop_Tva?.scpTVA),
          status: gen.stare_inregistrare || 'ACTIV',
          caen: String(gen.cod_CAEN || ''),
          caenDescription: gen.denumire_CAEN || ''
        };
      });

      return {
        found: normalizedFound,
        notFound
      };
    } catch (err) {
      lastError = err;
      if (attempt === 1) {
        // Așteptăm 1.5 secunde înainte de a doua încercare
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
    }
  }

  console.warn('[ANAF Batch] Error querying ANAF v9 after 2 attempts, trying FirmeAPI fallback:', lastError?.message);
  try {
    const fb = await lookupFirmeApiBatch(cleanCuis);
    if (fb && Array.isArray(fb.found) && (fb.found.length > 0 || fb.notFound.length > 0)) {
      return {
        found: fb.found,
        notFound: fb.notFound,
        usage: fb.usage,
        usedFallback: 'firmeapi'
      };
    }
  } catch (fbErr) {
    console.warn('[ANAF Batch -> FirmeAPI Fallback] error:', fbErr.message);
  }
  throw new Error(lastError?.message || 'Serviciul oficial ANAF nu răspunde în timp util. Reîncercați în câteva momente.');
}

module.exports = { lookupAnafCompany, lookupAnafBatch };
