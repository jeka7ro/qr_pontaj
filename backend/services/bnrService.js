const https = require('https');

// Cache in-memory pentru cursurile BNR pe an
// Structura: { [year]: { rates: { [dateStr]: rate }, lastFetched: timestamp } }
const yearlyRatesCache = {};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 ora

/**
 * Efectueaza request HTTPS cu User-Agent catre un URL BNR
 */
function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TimeQR-BNR-Fetcher/1.0)'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHttps(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`BNR HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('BNR request timeout'));
    });
  });
}

/**
 * Extrage cursurile dintr-un XML BNR
 * Formatul XML contine: <Cube date="YYYY-MM-DD"><Rate currency="EUR">5.3501</Rate>...</Cube>
 */
function parseRatesFromXml(xml, targetCurrency = 'EUR') {
  const rates = {};
  const cubeRegex = /<Cube date="([^"]+)">([\s\S]*?)<\/Cube>/g;
  let match;
  while ((match = cubeRegex.exec(xml)) !== null) {
    const d = match[1];
    const content = match[2];
    const currRegex = new RegExp('<Rate currency="' + targetCurrency + '"[^>]*>([0-9.]+)</Rate>');
    const m = content.match(currRegex);
    if (m) {
      rates[d] = parseFloat(m[1]);
    }
  }
  return rates;
}

/**
 * Incarca cursurile pentru un an specificat, cu caching
 */
async function loadRatesForYear(year, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && yearlyRatesCache[year] && (now - yearlyRatesCache[year].lastFetched < CACHE_TTL_MS)) {
    return yearlyRatesCache[year].rates;
  }

  const primaryUrl = `https://curs.bnr.ro/files/xml/years/nbrfxrates${year}.xml`;
  const recentUrl = `https://curs.bnr.ro/nbrfxrates10days.xml`;

  try {
    const xml = await fetchHttps(primaryUrl);
    const rates = parseRatesFromXml(xml, 'EUR');
    
    // Daca e anul curent, unim si cu ultimele zile pentru a fi 100% la zi
    const currentYear = new Date().getFullYear();
    if (parseInt(year, 10) === currentYear) {
      try {
        const recentXml = await fetchHttps(recentUrl);
        const recentRates = parseRatesFromXml(recentXml, 'EUR');
        Object.assign(rates, recentRates);
      } catch (err) {
        // Ignoram eroarea secundara daca avem datele principale
      }
    }

    yearlyRatesCache[year] = {
      rates,
      lastFetched: now
    };
    return rates;
  } catch (error) {
    console.error(`Eroare la incarcarea fisierului anual BNR (${year}):`, error.message);
    
    // In caz de eroare, incercam feed-ul de 10 zile daca e anul curent
    try {
      const recentXml = await fetchHttps(recentUrl);
      const recentRates = parseRatesFromXml(recentXml, 'EUR');
      yearlyRatesCache[year] = {
        rates: recentRates,
        lastFetched: now
      };
      return recentRates;
    } catch (e2) {
      if (yearlyRatesCache[year] && Object.keys(yearlyRatesCache[year].rates).length > 0) {
        return yearlyRatesCache[year].rates;
      }
      throw error;
    }
  }
}

/**
 * Formateaza un obiect Date sau string ca YYYY-MM-DD
 */
function toDateString(d) {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) {
    const fallback = new Date();
    return fallback.toISOString().slice(0, 10);
  }
  return dateObj.toISOString().slice(0, 10);
}

/**
 * Obtine cursul BNR oficial pentru o data data.
 * Conform Codului Fiscal si BNR, daca data pica in weekend, sarbatoare legala
 * sau inainte de ora 13:00 a zilei curente, se foloseste ultimul curs comunicat
 * inainte sau la data respectiva.
 * 
 * @param {string|Date} targetDate Data solicitata (YYYY-MM-DD)
 * @param {string} currency Moneda (implicit EUR)
 * @param {boolean} forceRefresh Daca se doreste invalidarea cache-ului
 * @returns {Promise<{ rate: number, currency: string, requested_date: string, bnr_date: string, is_fallback: boolean }>}
 */
async function getBnrRate(targetDate, currency = 'EUR', forceRefresh = false) {
  const dateStr = toDateString(targetDate || new Date());
  const year = parseInt(dateStr.slice(0, 4), 10);

  try {
    const rates = await loadRatesForYear(year, forceRefresh);
    const sortedDates = Object.keys(rates).sort();

    if (sortedDates.length === 0) {
      throw new Error('Niciun curs disponibil in fisierul BNR');
    }

    // Cautam cel mai recent curs publicat pana la data solicitata inclusiv (<= dateStr)
    const validDates = sortedDates.filter(d => d <= dateStr);
    
    let chosenDate;
    if (validDates.length > 0) {
      chosenDate = validDates[validDates.length - 1];
    } else {
      // Daca data ceruta este inainte de prima data a anului (ex: 1 Ianuarie),
      // incercam sfarsitul anului precedent
      try {
        const prevRates = await loadRatesForYear(year - 1, false);
        const prevSorted = Object.keys(prevRates).sort();
        if (prevSorted.length > 0) {
          const prevDate = prevSorted[prevSorted.length - 1];
          return {
            rate: prevRates[prevDate],
            currency,
            requested_date: dateStr,
            bnr_date: prevDate,
            is_fallback: false
          };
        }
      } catch (err) {
        // Fallback la prima data din anul curent
      }
      chosenDate = sortedDates[0];
    }

    return {
      rate: rates[chosenDate],
      currency,
      requested_date: dateStr,
      bnr_date: chosenDate,
      is_fallback: false
    };
  } catch (error) {
    console.error(`Eroare getBnrRate pentru data ${dateStr}:`, error.message);
    // Fallback de siguranta in caz extrem de cadere a retelei
    return {
      rate: 5.3501,
      currency,
      requested_date: dateStr,
      bnr_date: dateStr,
      is_fallback: true,
      error: error.message
    };
  }
}

module.exports = {
  getBnrRate,
  loadRatesForYear
};
