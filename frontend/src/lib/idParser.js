export function parseIdCardText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const result = {
    cnp: null,
    id_card_series: null,
    last_name: null,
    first_name: null,
    birth_date: null,
    gender: null,
    address: null
  };

  // 1. Extract CNP
  const fullText = text.replace(/[\s\.\-,_:\n\r]/g, '').toUpperCase();
  
  // STRATEGIA 1 (Infailibilă): Reconstrucția CNP-ului din MRZ (Machine Readable Zone)
  // De ce? Pe buletinul românesc, CNP-ul este printat cu cifre intercalate roșii și negre.
  // Tesseract OCR ratează cifrele roșii pentru că nu au contrast suficient.
  // În schimb, zona MRZ de jos este mereu alb-negru și are format fix de 36 caractere (TD2).
  // Structura Rândului 2 din MRZ: [DocumentNumber:9][Check:1][ROU:3][DOB:6][Check:1][Sex:1][Expiry:6][Check:1][CNP_Parts:7][Check:1]
  // Exemplu: RK192171<2ROU8011026M281102814301267
  // CNP = CNP_Parts[0] + DOB + CNP_Parts[1..6] (adică 1 + 801102 + 430126 = 1801102430126)
  
  // Căutăm tiparul MRZ rândul 2 pentru România
  const mrzLine2Match = fullText.match(/([A-Z0-9<]{9})\dROU(\d{6})\d[MF](\d{6})\d(\d{7})\d/);
  if (mrzLine2Match) {
    const dob = mrzLine2Match[2]; // ex: 801102
    const cnpParts = mrzLine2Match[4]; // ex: 1430126
    result.cnp = cnpParts.charAt(0) + dob + cnpParts.substring(1);
  } 
  
  // STRATEGIA 2 (Fallback): Dacă din vreo cauză nu găsim MRZ-ul perfect, căutăm un CNP de 13 cifre oriunde în text
  if (!result.cnp) {
    let cnpMatch = fullText.match(/([1-8]\d{12})/);
    if (cnpMatch) {
      result.cnp = cnpMatch[1];
    } else {
      // Fallback cu normalizare OCR (O=0, l=1 etc)
      const fuzzyFull = fullText.replace(/[O]/g, '0').replace(/[IL]/g, '1').replace(/[S]/g, '5').replace(/[Z]/g, '2').replace(/[B]/g, '8');
      const fuzzyMatch = fuzzyFull.match(/([1-8]\d{12})/);
      if (fuzzyMatch) {
        result.cnp = fuzzyMatch[1];
      }
    }
  }

  if (result.cnp) {
    const yearPrefix = ['1', '2'].includes(result.cnp[0]) ? '19' : (['5', '6'].includes(result.cnp[0]) ? '20' : '19');
    const yy = result.cnp.substring(1, 3);
    const mm = result.cnp.substring(3, 5);
    const dd = result.cnp.substring(5, 7);
    result.birth_date = `${yearPrefix}${yy}-${mm}-${dd}`;
    
    if (['1', '5'].includes(result.cnp[0])) result.gender = 'M';
    if (['2', '6'].includes(result.cnp[0])) result.gender = 'F';
  }

  // 2. Extract Series + Number (pattern: XX 123456)
  for (const line of lines) {
    const seriesMatch = line.match(/\b([A-Z]{2})\s*(\d{6})\b/);
    if (seriesMatch) {
      result.id_card_series = `${seriesMatch[1]} ${seriesMatch[2]}`;
      break;
    }
  }

  // 3. Extract names from MRZ line
  let mrz_surname = null;
  let mrz_firstname = null;
  for (const line of lines) {
    const cleaned = line.replace(/\s/g, '').toUpperCase();
    let mrzMatch = cleaned.match(/IDROU[A-Z]*?([A-Z]{2,})<<([A-Z]+)/);
    if (!mrzMatch) {
      mrzMatch = cleaned.match(/IDROU([A-ZĂÂÎȘȚ]{2,})<<([A-ZĂÂÎȘȚ]+)/);
    }
    if (mrzMatch) {
      mrz_surname = mrzMatch[1].replace(/</g, '').trim();
      mrz_firstname = mrzMatch[2].replace(/</g, '').trim();
      break;
    }
  }

  if (!mrz_surname) {
    for (const line of lines) {
      const cleaned = line.replace(/\s/g, '').toUpperCase();
      // Relaxed MRZ matching
      if ((cleaned.startsWith('IDROU') || cleaned.startsWith('1DROU') || cleaned.startsWith('IDR0U')) && cleaned.includes('<<')) {
        const afterIdrou = cleaned.substring(5);
        const parts = afterIdrou.split('<<');
        const nameParts = parts.map(p => p.replace(/</g, '').trim()).filter(p => p.length > 0);
        if (nameParts.length >= 2) {
          mrz_surname = nameParts[0];
          mrz_firstname = nameParts[1];
          break;
        } else if (nameParts.length === 1 && nameParts[0].length > 3) {
          mrz_surname = nameParts[0];
          break;
        }
      }
    }
  }

  // 4. Fallback: Search for keywords 'Nume' and 'Prenume' if MRZ fails
  if (!mrz_surname || !mrz_firstname) {
    for (let i = 0; i < lines.length; i++) {
      const upperLine = lines[i].toUpperCase();
      
      // Căutare Nume
      if (!mrz_surname && (upperLine.includes('NUME') || upperLine.includes('NOM') || upperLine.includes('SURNAME'))) {
        if (i + 1 < lines.length && !lines[i + 1].toUpperCase().includes('PRENUME')) {
          mrz_surname = lines[i + 1].trim();
        }
      }
      
      // Căutare Prenume
      if (!mrz_firstname && (upperLine.includes('PRENUME') || upperLine.includes('PRENOM') || upperLine.includes('GIVEN'))) {
        if (i + 1 < lines.length && !lines[i + 1].toUpperCase().includes('CETATENIE') && !lines[i + 1].toUpperCase().includes('NATIONALITATE')) {
          mrz_firstname = lines[i + 1].trim();
        }
      }
    }
  }

  if (mrz_surname) result.last_name = mrz_surname.replace(/[^a-zA-ZĂÂÎȘȚăâîșț \-]/g, '');
  if (mrz_firstname) result.first_name = mrz_firstname.replace(/[^a-zA-ZĂÂÎȘȚăâîșț \-]/g, '');

  // 5. Extract Address (Fuzzy & Keyword matching)
  let foundAddress = false;
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase();
    
    // Cazul 1: Găsim clar titlul "DOMICILIU" sau o variantă stâlcită (D0MICILIU, ADRE55E)
    const isDomiciliuTitle = upperLine.includes('DOMICILI') || upperLine.includes('D0MICILI') || upperLine.includes('ADRESS') || upperLine.includes('ADRE55') || upperLine.includes('DOM.') || upperLine.includes('D0M.');
    
    // Cazul 2: OCR-ul a sărit complet peste titlu și suntem direct pe rândul cu adresa
    const hasAddressMarkers = upperLine.includes('JUD.') || upperLine.includes('MUN.') || upperLine.includes('STR.') || upperLine.includes('COM.') || upperLine.includes('SAT ') || upperLine.includes('SECTOR');

    if (isDomiciliuTitle) {
      let addrLines = [];
      if (i + 1 < lines.length && !lines[i + 1].toUpperCase().includes('EMIS DE')) addrLines.push(lines[i + 1].trim());
      if (i + 2 < lines.length && !lines[i + 2].toUpperCase().includes('EMIS DE') && !lines[i + 2].toUpperCase().includes('VALABILITATE')) addrLines.push(lines[i + 2].trim());
      
      const combined = addrLines.join(', ').replace(/[^a-zA-ZĂÂÎȘȚăâîșț0-9 \-,.\/]/g, '').trim();
      if (combined.length > 5) {
        result.address = combined;
        foundAddress = true;
        break;
      }
    } else if (hasAddressMarkers && !foundAddress) {
      // Linia curentă E DEJA adresa! O salvăm și pe următoarea dacă aparține adresei.
      let addrLines = [lines[i].trim()];
      if (i + 1 < lines.length && !lines[i + 1].toUpperCase().includes('EMIS DE') && !lines[i + 1].toUpperCase().includes('VALABILITATE') && !lines[i + 1].toUpperCase().match(/IDROU/)) {
        addrLines.push(lines[i + 1].trim());
      }
      result.address = addrLines.join(', ').replace(/[^a-zA-ZĂÂÎȘȚăâîșț0-9 \-,.\/]/g, '').trim();
      foundAddress = true;
      break;
    }
  }

  return result;
}
