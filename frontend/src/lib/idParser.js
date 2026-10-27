/**
 * Parser inteligent pentru documente de identitate din România:
 * 1. Buletin Clasic / Vechi (C.I. format mare, MRZ TD2 pe 2 rânduri, serie 2 litere + 6 cifre, adresă tipărită)
 * 2. Buletin Nou / Cartea Electronică de Identitate (C.E.I. format mic ID-1, MRZ TD1 pe 3 rânduri, număr document 2 litere + 7 cifre, FĂRĂ adresă fizică)
 * 3. Adeverință / Dovadă de Domiciliu (eliberată prin aplicația RO CEI Reader a MAI sau evidența populației, format PDF/Poză cu adresa completă)
 */

export function parseIdCardText(text) {
  if (!text || typeof text !== 'string') {
    return {
      document_type: 'unknown',
      cnp: null,
      id_card_series: null,
      last_name: null,
      first_name: null,
      birth_date: null,
      gender: null,
      address: null,
      is_new_format: false,
      needs_residence_certificate: false
    };
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const result = {
    document_type: 'unknown',
    cnp: null,
    id_card_series: null,
    last_name: null,
    first_name: null,
    birth_date: null,
    gender: null,
    address: null,
    is_new_format: false,
    needs_residence_certificate: false
  };

  const fullText = text.replace(/[\s\.\-,_:\n\r]/g, '').toUpperCase();

  // =========================================================================
  // CAZUL 1: ADEVERINȚĂ DE DOMICILIU (Generată prin RO CEI Reader a MAI / Certificat)
  // Format structurat cheie-valoare: Nume de familie, Prenume, CNP, Număr document, Domiciliu
  // =========================================================================
  const isCeiReaderDoc = text.includes('RO CEI Reader') || 
                         (text.includes('Domiciliu:') && (text.includes('CNP:') || text.includes('Cetățenie') || text.includes('Număr document')));

  if (isCeiReaderDoc) {
    result.document_type = 'residence_certificate';
    result.is_new_format = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Nume de familie (asigurăm că nu confundăm cu "Prenume")
      const lastNameMatch = line.match(/(?:^|\b)(?<!Pre)Nume(?:\s+de\s+familie)?\s*:\s*([^\n\r]+)/i);
      if (lastNameMatch && !result.last_name) {
        result.last_name = lastNameMatch[1].trim();
      }

      // Prenume
      const firstNameMatch = line.match(/(?:^|\b)Prenume\s*:\s*([^\n\r]+)/i);
      if (firstNameMatch && !result.first_name) {
        result.first_name = firstNameMatch[1].trim();
      }

      // CNP (13 cifre)
      const cnpMatch = line.match(/CNP\s*:\s*([1-8]\d{12})/i);
      if (cnpMatch) {
        result.cnp = cnpMatch[1];
      }

      // Număr document (ex: MB1254244)
      const docNoMatch = line.match(/(?:Num[aă]r\s+document|Nr\.\s*document)\s*:\s*([A-Z0-9]+)/i);
      if (docNoMatch) {
        result.id_card_series = docNoMatch[1].trim().toUpperCase();
      }

      // Data nașterii (DD.MM.YYYY)
      const dobMatch = line.match(/Data\s+na[sș]terii\s*:\s*(\d{2})[.\/](\d{2})[.\/](\d{4})/i);
      if (dobMatch) {
        result.birth_date = `${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`;
      }

      // Sex (M / F)
      const sexMatch = line.match(/Sex\s*:\s*([MF])/i);
      if (sexMatch) {
        result.gender = sexMatch[1].toUpperCase();
      }

      // Domiciliu complet (ex: Mun.Bucureşti Sec.1 Int.Valului nr.5)
      const domMatch = line.match(/Domiciliu\s*:\s*([^\n\r]+)/i);
      if (domMatch) {
        let addr = domMatch[1].trim();
        // Eliminăm texte de footer dacă sunt lipite pe aceeași linie
        addr = addr.replace(/Document\s+foto.*/i, '').trim();
        result.address = addr;
      }
    }

    if (result.cnp && !result.birth_date) {
      result.birth_date = getBirthDateFromCnp(result.cnp);
    }
    if (result.cnp && !result.gender) {
      if (['1', '5'].includes(result.cnp[0])) result.gender = 'M';
      if (['2', '6'].includes(result.cnp[0])) result.gender = 'F';
    }

    if (result.last_name) result.last_name = result.last_name.replace(/[^a-zA-ZĂÂÎȘȚăâîșț \-]/g, '').trim();
    if (result.first_name) result.first_name = result.first_name.replace(/[^a-zA-ZĂÂÎȘȚăâîșț \-]/g, '').trim();

    return result;
  }

  // =========================================================================
  // CAZUL 2: BULETIN NOU (Verso cu MRZ TD1 - 3 rânduri x 30 caractere)
  // Rândul 1: IDROU[DocNo:9][Check:1][CNP:13]<<
  // Rândul 2: [DOB:6][Check:1][Sex:1][Expiry:6][Check:1]ROU<<<<<<<<<<<[Check:1]
  // Rândul 3: [Surname]<<[GivenName]<<<<<<<<<<<<<<<
  // =========================================================================
  const td1Row1Match = fullText.match(/IDROU([A-Z0-9<]{9})\d([1-8]\d{12})/);
  if (td1Row1Match) {
    result.document_type = 'id_card_new_back';
    result.is_new_format = true;
    result.id_card_series = td1Row1Match[1].replace(/</g, '').trim();
    result.cnp = td1Row1Match[2];

    const td1Row2Match = fullText.match(/(\d{6})\d([MF])(\d{6})\dROU/);
    if (td1Row2Match) {
      result.gender = td1Row2Match[2];
    }

    for (const line of lines) {
      const cleaned = line.replace(/\s/g, '').toUpperCase();
      if (cleaned.includes('<<') && !cleaned.includes('IDROU') && !cleaned.includes('ROU<')) {
        const parts = cleaned.split('<<');
        if (parts.length >= 2) {
          result.last_name = parts[0].replace(/[^A-ZĂÂÎȘȚ]/g, '').trim();
          result.first_name = parts[1].split('<')[0].replace(/[^A-ZĂÂÎȘȚ]/g, '').trim();
          break;
        }
      }
    }
  }

  // =========================================================================
  // CAZUL 3: BULETIN CLASIC / VECHI (MRZ TD2 - 2 rânduri x 36 caractere)
  // Rândul 2: [DocumentNumber:9][Check:1][ROU:3][DOB:6][Check:1][Sex:1][Expiry:6][Check:1][CNP_Parts:7][Check:1]
  // =========================================================================
  if (!result.cnp) {
    const td2Row2Match = fullText.match(/([A-Z0-9<]{9})\dROU(\d{6})\d[MF](\d{6})\d(\d{7})\d/);
    if (td2Row2Match) {
      result.document_type = 'id_card_old';
      const dob = td2Row2Match[2]; // ex: 801102
      const cnpParts = td2Row2Match[4]; // ex: 1430126
      result.cnp = cnpParts.charAt(0) + dob + cnpParts.substring(1);
    }
  }

  // =========================================================================
  // CAZUL 4: CĂUTARE CNP DIRECT SAU FALLBACK FUZZY (13 cifre)
  // =========================================================================
  if (!result.cnp) {
    const cnpLineMatch = text.match(/(?:CNP|PIN)\s*[:\/\n\r\s]*([1-8]\d{12})\b/i);
    if (cnpLineMatch) {
      result.cnp = cnpLineMatch[1];
    } else {
      const cnpMatch = fullText.match(/([1-8]\d{12})/);
      if (cnpMatch) {
        result.cnp = cnpMatch[1];
      } else {
        const fuzzyFull = fullText.replace(/[O]/g, '0').replace(/[IL]/g, '1').replace(/[S]/g, '5').replace(/[Z]/g, '2').replace(/[B]/g, '8');
        const fuzzyMatch = fuzzyFull.match(/([1-8]\d{12})/);
        if (fuzzyMatch) {
          result.cnp = fuzzyMatch[1];
        }
      }
    }
  }

  if (result.cnp) {
    result.birth_date = getBirthDateFromCnp(result.cnp);
    if (!result.gender) {
      if (['1', '5'].includes(result.cnp[0])) result.gender = 'M';
      if (['2', '6'].includes(result.cnp[0])) result.gender = 'F';
    }
  }

  // =========================================================================
  // EXTRAGERE SERIE ȘI NUMĂR (Format Nou vs Format Clasic)
  // =========================================================================
  if (!result.id_card_series) {
    // 1. Format nou cu prefix explicit: "Nr. document / Document no. MB1254244"
    const newDocMatch = text.match(/(?:Nr\.\s*document|Document\s*no\.?|Num[aă]r\s*document)\s*[:\/\n\r\s]*([A-Z]{2}\d{7})\b/i);
    if (newDocMatch) {
      result.id_card_series = newDocMatch[1].toUpperCase();
      if (result.document_type === 'unknown') {
        result.document_type = 'id_card_new_front';
        result.is_new_format = true;
      }
    } else {
      // 2. Pattern generic 2 litere + 7 cifre (ex: MB1254244)
      const pattern7 = text.match(/\b([A-Z]{2}\d{7})\b/i);
      if (pattern7) {
        result.id_card_series = pattern7[1].toUpperCase();
        if (result.document_type === 'unknown') {
          result.document_type = 'id_card_new_front';
          result.is_new_format = true;
        }
      } else {
        // 3. Format vechi cu prefix SERIA: "SERIA RX NR 654321"
        for (const line of lines) {
          const explicitOldSeries = line.match(/(?:SERIA\s+)?([A-Z]{2})\s+(?:NR\.?\s*)?(\d{6})\b/i);
          if (explicitOldSeries && explicitOldSeries[1].toUpperCase() !== 'NR') {
            result.id_card_series = `${explicitOldSeries[1].toUpperCase()} ${explicitOldSeries[2]}`;
            if (result.document_type === 'unknown') result.document_type = 'id_card_old';
            break;
          }
        }
        // 4. Fallback vechi generic: 2 litere + 6 cifre
        if (!result.id_card_series) {
          for (const line of lines) {
            const seriesMatch = line.match(/\b([A-Z]{2})\s*(\d{6})\b/);
            if (seriesMatch && seriesMatch[1].toUpperCase() !== 'NR') {
              result.id_card_series = `${seriesMatch[1]} ${seriesMatch[2]}`;
              if (result.document_type === 'unknown') result.document_type = 'id_card_old';
              break;
            }
          }
        }
      }
    }
  }

  // =========================================================================
  // EXTRAGERE NUME ȘI PRENUME
  // =========================================================================
  // Dacă nu au fost deja găsite din MRZ TD1:
  // A. Căutare din MRZ TD2 (buletin vechi)
  if (!result.last_name || !result.first_name) {
    for (const line of lines) {
      const cleaned = line.replace(/\s/g, '').toUpperCase();
      let mrzMatch = cleaned.match(/IDROU[A-Z]*?([A-Z]{2,})<<([A-Z]+)/);
      if (!mrzMatch) {
        mrzMatch = cleaned.match(/IDROU([A-ZĂÂÎȘȚ]{2,})<<([A-ZĂÂÎȘȚ]+)/);
      }
      if (mrzMatch) {
        if (!result.last_name) result.last_name = mrzMatch[1].replace(/</g, '').trim();
        if (!result.first_name) result.first_name = mrzMatch[2].replace(/</g, '').trim();
        break;
      }
    }
  }

  // B. Căutare după etichete textuale ("Nume / Surname", "Prenume / Given names")
  if (!result.last_name || !result.first_name) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!result.last_name && (line.match(/(?:^|\b)(?<!Pre)Nume\s*[\/\n:]\s*Surname/i) || line.match(/^(?<!Pre)Nume\s*[:\/]/i))) {
        if (i + 1 < lines.length && !lines[i + 1].match(/Prenume|Given/i)) {
          result.last_name = lines[i + 1].trim();
        }
      }
      if (!result.first_name && (line.match(/(?:^|\b)Prenume\s*[\/\n:]\s*Given/i) || line.match(/^Prenume\s*[:\/]/i))) {
        if (i + 1 < lines.length && !lines[i + 1].match(/Sex|Cet[aă]țenie|National/i)) {
          result.first_name = lines[i + 1].trim();
        }
      }
    }
  }

  // =========================================================================
  // EXTRAGERE ADRESĂ (Specifică buletinului clasic vechi)
  // Notă: Noul buletin (format ID-1) NU are adresa tipărită fizic pe el!
  // =========================================================================
  if (!result.address && result.document_type !== 'id_card_new_front' && result.document_type !== 'id_card_new_back') {
    let foundAddress = false;
    for (let i = 0; i < lines.length; i++) {
      const upperLine = lines[i].toUpperCase();
      const isDomiciliuTitle = upperLine.includes('DOMICILI') || upperLine.includes('D0MICILI') || upperLine.includes('ADRESS') || upperLine.includes('ADRE55') || upperLine.includes('DOM.') || upperLine.includes('D0M.');
      const hasAddressMarkers = upperLine.includes('JUD.') || upperLine.includes('MUN.') || upperLine.includes('STR.') || upperLine.includes('COM.') || upperLine.includes('SAT ') || upperLine.includes('SECTOR') || upperLine.includes(' B-DUL') || upperLine.includes(' BD.') || upperLine.includes(' ORAȘ') || upperLine.includes(' ORAS') || upperLine.includes(' ORS.') || upperLine.includes(' SOS.') || upperLine.includes(' ȘOS.');

      if (isDomiciliuTitle) {
        let addrLines = [];
        let currentLineAddr = upperLine.replace(/DOMICILI[U]?/g, '').replace(/ADRESS[E]?/g, '').replace(/ADDRESS/g, '').replace(/D0MICILI[U]?/g, '').replace(/DOM\./g, '').replace(/[\/\\:\-]/g, ' ').trim();
        if (currentLineAddr.length > 5) {
          addrLines.push(lines[i].replace(/domicili[u]?/ig, '').replace(/adress[e]?/ig, '').replace(/address/ig, '').replace(/[\/\\:\-]/g, ' ').trim());
        }
        if (i + 1 < lines.length && !lines[i + 1].toUpperCase().includes('EMIS DE')) addrLines.push(lines[i + 1].trim());
        if (i + 2 < lines.length && !lines[i + 2].toUpperCase().includes('EMIS DE') && !lines[i + 2].toUpperCase().includes('VALABILITATE')) addrLines.push(lines[i + 2].trim());
        const combined = addrLines.join(', ').replace(/[^a-zA-ZĂÂÎȘȚăâîșț0-9 \-,.\/]/g, '').trim();
        if (combined.length > 5) {
          result.address = combined;
          foundAddress = true;
          break;
        }
      } else if (hasAddressMarkers && !foundAddress) {
        let addrLines = [lines[i].trim()];
        if (i + 1 < lines.length && !lines[i + 1].toUpperCase().includes('EMIS DE') && !lines[i + 1].toUpperCase().includes('VALABILITATE') && !lines[i + 1].toUpperCase().match(/IDROU/)) {
          addrLines.push(lines[i + 1].trim());
        }
        result.address = addrLines.join(', ').replace(/[^a-zA-ZĂÂÎȘȚăâîșț0-9 \-,.\/]/g, '').trim();
        foundAddress = true;
        break;
      }
    }
  }

  // Curățare finală diacritice și caractere parazite
  if (result.last_name) result.last_name = result.last_name.replace(/[^a-zA-ZĂÂÎȘȚăâîșț \-]/g, '').trim();
  if (result.first_name) result.first_name = result.first_name.replace(/[^a-zA-ZĂÂÎȘȚăâîșț \-]/g, '').trim();

  // Flag util pentru UI: indică dacă este un buletin nou care necesită și adeverință de domiciliu
  if ((result.document_type === 'id_card_new_front' || result.document_type === 'id_card_new_back') && !result.address) {
    result.needs_residence_certificate = true;
  }

  return result;
}

/**
 * Extrage data de nastere (format YYYY-MM-DD) dintr-un CNP romanesc
 */
export function getBirthDateFromCnp(cnp) {
  if (!cnp || typeof cnp !== 'string') return null;
  const clean = cnp.trim().replace(/\D/g, '');
  if (clean.length < 7) return null;

  const s = clean[0];
  let yearPrefix = null;
  if (['1', '2', '7', '8'].includes(s)) yearPrefix = '19';
  else if (['5', '6'].includes(s)) yearPrefix = '20';
  else if (['3', '4'].includes(s)) yearPrefix = '18';
  else return null;

  const yy = clean.substring(1, 3);
  const mm = clean.substring(3, 5);
  const dd = clean.substring(5, 7);

  const m = parseInt(mm, 10);
  const d = parseInt(dd, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  return `${yearPrefix}${yy}-${mm}-${dd}`;
}
