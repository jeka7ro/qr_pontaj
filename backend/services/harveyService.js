const db = require('../db');
const emailService = require('./emailService');

/**
 * Serviciul Harvey SDR — Agent autonom de prospectare și vânzări B2B
 */

// Extragere emailuri dintr-un text HTML
function extractEmailFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  
  // Căutare mai întâi în link-uri mailto:
  const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (mailtoMatch && mailtoMatch[1]) {
    const email = mailtoMatch[1].toLowerCase().trim();
    if (!email.includes('sentry') && !email.includes('wix') && !email.includes('wordpress')) {
      return email;
    }
  }

  // Căutare regex generală pentru emailuri comune de business
  const emailRegex = /\b[A-Za-z0-9._%+-]+@(?!example\.com|wix\.com|sentry\.io)[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = html.match(emailRegex) || [];
  
  // Prioritizăm adresele tipice de contact / office / rezervari
  const prioritized = matches.find(e => {
    const l = e.toLowerCase();
    return l.startsWith('office@') || l.startsWith('contact@') || l.startsWith('rezervari@') || l.startsWith('hr@') || l.startsWith('manager@') || l.startsWith('info@');
  });

  return prioritized ? prioritized.toLowerCase() : (matches[0] ? matches[0].toLowerCase() : null);
}

// Căutare rapidă email pe site-ul oficial (cu căutare pe homepage și pagini de contact)
async function scrapeEmailFromWebsite(websiteUrl) {
  if (!websiteUrl) return null;
  try {
    let cleanUrl = websiteUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const fetchPage = async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        clearTimeout(timeout);
        if (res.ok) {
          const html = await res.text();
          return extractEmailFromHtml(html);
        }
      } catch (e) {}
      return null;
    };

    let email = await fetchPage(cleanUrl);
    if (email) return email;

    // Verificăm subpaginile uzuale de contact
    const base = cleanUrl.replace(/\/+$/, '');
    email = await fetchPage(`${base}/contact`);
    if (email) return email;

    email = await fetchPage(`${base}/despre-noi`);
    if (email) return email;

    email = await fetchPage(`${base}/contact-us`);
    if (email) return email;

  } catch (err) {
    // Ignorăm erorile de timeout sau SSL ale site-urilor externe
  }
  return null;
}

// Detectare automată a limbii locale pe baza orașului, țării sau adresei
function detectLeadLanguage(city, country, address) {
  const str = `${city || ''} ${country || ''} ${address || ''}`.toLowerCase();
  if (
    str.includes('bruxelles') || 
    str.includes('brussel') || 
    str.includes('liège') || 
    str.includes('liege') || 
    str.includes('namur') || 
    str.includes('charleroi') || 
    str.includes('mons') || 
    str.includes('wallon') ||
    str.includes('belg') ||
    str.includes('france') ||
    str.includes('paris')
  ) {
    return 'fr';
  }
  if (
    str.includes('antwerpen') || 
    str.includes('antwerp') || 
    str.includes('gent') || 
    str.includes('gand') || 
    str.includes('brugge') || 
    str.includes('bruges') || 
    str.includes('leuven') || 
    str.includes('vlaand') || 
    str.includes('flanders') || 
    str.includes('nederland') || 
    str.includes('holland') || 
    str.includes('amsterdam') || 
    str.includes('rotterdam')
  ) {
    return 'nl';
  }
  if (
    str.includes('deutschland') || 
    str.includes('germany') || 
    str.includes('berlin') || 
    str.includes('münchen') || 
    str.includes('munich') || 
    str.includes('österreich') || 
    str.includes('austria') || 
    str.includes('wien')
  ) {
    return 'de';
  }
  if (
    str.includes('românia') || 
    str.includes('romania') || 
    str.includes('bucurești') || 
    str.includes('bucuresti') || 
    str.includes('cluj') || 
    str.includes('timișoara') || 
    str.includes('timisoara') || 
    str.includes('iași') || 
    str.includes('iasi') || 
    str.includes('brașov') || 
    str.includes('brasov') || 
    str.includes('constanța') || 
    str.includes('constanta') || 
    str.includes('craiova') || 
    str.includes('oradea') || 
    str.includes('sibiu')
  ) {
    return 'ro';
  }
  return 'en';
}

// Generare șablon inteligent de pitch când nu este configurată cheia Anthropic
function generateFallbackPitch({ companyName, industry, city, pitchFocus, language = 'ro', senderName = 'Smart QR Pontaj', senderEmail = 'contact@pontaj.app', senderPhone = '+40 757 77 77 12' }) {
  const lang = (language || 'ro').toLowerCase();

  // FR — Français (Belgique / France)
  if (lang === 'fr') {
    let subject = `Solution de pointage digital QR pour ${companyName}`;
    let hook = `Pointage digital instantané par QR dynamique et borne tablette, feuilles d'heures automatiques et export secrétariat social.`;
    let body = `Bonjour,

Nous vous proposons une solution smart de pointage électronique pour simplifier la gestion des présences et la paie chez ${companyName} : QRTime.

Comment ça fonctionne :
• Sans matériel coûteux : une simple tablette ou smartphone à l'entrée avec QR code dynamique sécurisé ;
• Feuilles d’heures automatiques : suivi en temps réel des présences, des heures de nuit et des heures supplémentaires ;
• Paie simplifiée : export direct vers vos logiciels de gestion et secrétariats sociaux (SD Worx, Securex, Liantis, Partena...).

Conditions :
• 15 jours d'essai gratuit complet, sans engagement et sans carte bancaire ;
• Tarif transparent : 5,00 € / collaborateur / mois.

Découvrez la solution et activez votre test gratuit ici :
https://qrtime.be

Pour toute question ou une démonstration, vous pouvez répondre directement à cet email ou nous contacter par téléphone.

Cordialement,
${senderName || "L'équipe QRTime"}
Email : ${senderEmail}
Tél / WhatsApp : ${senderPhone}
Web : https://qrtime.be`;

    if (pitchFocus === 'itm_compliance') {
      subject = `Conformité enregistrement du temps de travail — ${companyName}`;
      hook = 'Focus sur la conformité stricte du temps de travail et la protection lors des contrôles sociaux.';
      body = `Bonjour,

Nous vous proposons QRTime pour garantir une conformité irréprochable du temps de travail chez ${companyName} :
• Zéro registre papier ou feuilles volantes signées a posteriori ;
• Chaque pointage est horodaté à la seconde près avec validation du lieu de travail ;
• Rapports complets d'inspection exportables en un clic pour votre secrétariat social.

Conditions :
• 15 jours d'essai gratuit complet, sans carte bancaire ;
• Tarif de 5,00 € / collaborateur / mois.

Testez gratuitement :
https://qrtime.be

Pour toute précision, répondez directement à cet email ou appelez-nous.

Cordialement,
${senderName || "L'équipe QRTime"}
Email : ${senderEmail}
Tél / WhatsApp : ${senderPhone}
Web : https://qrtime.be`;
    } else if (pitchFocus === 'kiosk_tableta') {
      subject = `Borne de pointage intelligente sur tablette — ${companyName}`;
      hook = 'Transformez n’importe quelle tablette en terminal de pointage connecté avec QR dynamique.';
      body = `Bonjour,

Nous vous proposons de transformer une simple tablette à l'entrée de ${companyName} en terminal de pointage connecté grâce à QRTime Kiosk :
• Pointage en 1 seconde par scan de QR code dynamique ;
• Tableau de bord en temps réel des collaborateurs présents ;
• Feuilles d'heures consolidées automatiquement pour la paie à la fin du mois.

Conditions :
• 15 jours d'essai gratuit complet ;
• Sans matériel coûteux, tarif clair de 5,00 € / collaborateur / mois.

Activez votre essai gratuit :
https://qrtime.be

À votre disposition pour toute question par retour d'email ou par téléphone.

Cordialement,
${senderName || "L'équipe QRTime"}
Email : ${senderEmail}
Tél / WhatsApp : ${senderPhone}
Web : https://qrtime.be`;
    }

    return { subject, body, aiHook: hook };
  }

  // NL — Nederlands (België / Nederland)
  if (lang === 'nl') {
    let subject = `Digitale tijdsregistratie via QR voor ${companyName}`;
    let hook = `Eenvoudige prikklok via QR/tablet, automatische urenstaten en export voor sociaal secretariaat.`;
    let body = `Beste,

Wij stellen u een slimme oplossing voor digitale tijdsregistratie voor om de urenadministratie bij ${companyName} te vereenvoudigen: QRTime.

Hoe het werkt:
• Geen dure apparatuur: gebruik een gewone tablet of smartphone aan de ingang met dynamische QR-codes;
• Automatische urenstaten: realtime overzicht van gewerkte uren, nacht- en overuren;
• Eenvoudige loonverwerking: directe export naar uw sociaal secretariaat (SD Worx, Securex, Liantis, etc.).

Voorwaarden:
• 15 dagen volledige gratis proefperiode, zonder verplichtingen of kredietkaart;
• Helder tarief: 5,00 € / medewerker / maand.

Test het platform direct of activeer uw demo via:
https://qrtime.be

Heeft u vragen of wenst u een korte toelichting? Beantwoord gerust deze e-mail of bel ons direct.

Met vriendelijke groet,
${senderName || 'Het QRTime team'}
E-mail: ${senderEmail}
Tel / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;

    if (pitchFocus === 'itm_compliance') {
      subject = `Conforme aanwezigheidsregistratie — ${companyName}`;
      hook = 'Focus op strikte naleving van arbeidstijden en bescherming bij inspecties.';
      body = `Beste,

Wij bieden ${companyName} een waterdicht digitaal systeem voor urenregistratie ter bescherming bij inspecties:
• Geen papieren lijsten meer die achteraf worden ingevuld;
• Elke inkloktijd wordt exact geregistreerd met locatieverificatie;
• Complete inspectierapporten direct exporteerbaar voor uw sociaal secretariaat.

Voorwaarden:
• 15 dagen gratis proefperiode, zonder kredietkaart;
• 5,00 € / medewerker / maand.

Start uw test hier:
https://qrtime.be

Vragen? Beantwoord gerust deze e-mail of neem telefonisch contact op.

Met vriendelijke groet,
${senderName || 'Het QRTime team'}
E-mail: ${senderEmail}
Tel / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;
    } else if (pitchFocus === 'kiosk_tableta') {
      subject = `Slimme tablet prikklok aan de ingang — ${companyName}`;
      hook = 'Verander elke tablet in een professionele prikklok met dynamische QR-code.';
      body = `Beste,

Transformeer elke standaard tablet aan de ingang van ${companyName} in een slimme prikklok via QRTime Kiosk:
• Medewerkers klokken in 1 seconde in via een dynamische QR-code;
• Realtime overzicht van aanwezigen op uw management dashboard;
• Automatisch maandoverzicht voor de loonadministratie.

Voorwaarden:
• 15 dagen gratis testen zonder verplichting;
• Slechts 5,00 € / medewerker / maand.

Activeer uw test direct:
https://qrtime.be

Met vriendelijke groet,
${senderName || 'Het QRTime team'}
E-mail: ${senderEmail}
Tel / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;
    }

    return { subject, body, aiHook: hook };
  }

  // EN — English (International)
  if (lang === 'en') {
    let subject = `Smart QR Clock-in & Attendance for ${companyName}`;
    let hook = `Dynamic QR clock-in on tablet/phone, automated timesheets, and 1-click payroll export.`;
    let body = `Hello,

We are offering a smart digital time tracking solution designed to eliminate paper timesheets and payroll hassles for ${companyName}: QRTime.

How it works:
• No expensive hardware: use any standard tablet or smartphone at the entrance with secure dynamic QR codes;
• Real-time attendance: automatic tracking of working hours, night shifts, and overtime;
• Seamless payroll: 1-click export to standard payroll formats, CSV, and Excel.

Conditions:
• 15-day full free trial, no credit card required, cancel anytime;
• Transparent pricing: 5.00 € / employee / month.

Start your free trial or explore the platform here:
https://qrtime.be

If you'd like a quick demo or setup assistance, simply reply to this email or call us directly.

Best regards,
${senderName || 'The QRTime Team'}
Email: ${senderEmail}
Phone / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;

    if (pitchFocus === 'itm_compliance') {
      subject = `Labor law compliance & audit-ready timesheets — ${companyName}`;
      hook = 'Strict work hours verification and legal compliance for audits.';
      body = `Hello,

We help ${companyName} maintain audit-proof attendance records effortlessly:
• Eliminates paper sign-in sheets signed after the fact;
• Every clock-in is timestamped with precise location verification;
• Official attendance audits generated on demand for payroll and labor authorities.

Conditions:
• 15-day free trial, no credit card required;
• Flat rate of 5.00 € / employee / month.

Start here:
https://qrtime.be

Feel free to reply to this email or give us a call for any questions.

Best regards,
${senderName || 'The QRTime Team'}
Email: ${senderEmail}
Phone / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;
    } else if (pitchFocus === 'kiosk_tableta') {
      subject = `Smart tablet time clock kiosk for ${companyName}`;
      hook = 'Turn any entrance tablet into an intelligent check-in kiosk with dynamic QR.';
      body = `Hello,

Turn any standard tablet at the entrance of ${companyName} into a smart time clock kiosk:
• Staff scan their unique dynamic QR badge in 1 second;
• Live attendance dashboard for managers;
• Monthly timesheets consolidated automatically for payroll.

Conditions:
• 15 days full free trial;
• No expensive biometric hardware, flat rate of 5.00 € / employee / month.

Activate your demo today:
https://qrtime.be

Best regards,
${senderName || 'The QRTime Team'}
Email: ${senderEmail}
Phone / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;
    }

    return { subject, body, aiHook: hook };
  }

  // DE — Deutsch (Germany / Austria / Belgium)
  if (lang === 'de') {
    let subject = `Smarte digitale Zeiterfassung per QR für ${companyName}`;
    let hook = `Sekundenschnelles Stempeln per QR/Tablet, rechtssichere Zeiterfassung und Lohnexport.`;
    let body = `Guten Tag,

wir bieten Ihnen eine smarte Lösung zur digitalen Zeiterfassung, um manuelle Stundenzettel bei ${companyName} vollständig abzulösen: QRTime.

So funktioniert es:
• Keine teure Stempeluhr-Hardware: jedes gewöhnliche Tablet oder Smartphone am Eingang dient als Terminal mit dynamischem QR-Code;
• Lückenlose Erfassung: minutengenaue Arbeitszeiten, Nacht- und Wochenendzuschläge in Echtzeit;
• Schnelle Lohnabrechnung: 1-Klick-Export für die Lohnbuchhaltung und Excel.

Konditionen:
• 15 Tage kostenloser Vollzugriff ohne Kreditkarte und ohne Vertragsbindung;
• Transparenter Preis: 5,00 € / Mitarbeiter / Monat.

Starten Sie Ihren kostenlosen Testzugang hier:
https://qrtime.be

Für Fragen oder eine kurze Vorführung antworten Sie einfach auf diese E-Mail oder rufen Sie uns direkt an.

Mit freundlichen Grüßen,
${senderName || 'Ihr QRTime Team'}
E-Mail: ${senderEmail}
Tel / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;

    if (pitchFocus === 'itm_compliance') {
      subject = `Rechtssichere Arbeitszeiterfassung — ${companyName}`;
      hook = 'Fokus auf lückenlose Einhaltung der Arbeitszeiterfassungspflicht.';
      body = `Guten Tag,

mit QRTime erfüllen Sie die gesetzliche Pflicht zur Arbeitszeiterfassung für ${companyName} lückenlos und ohne Papierkram:
• Keine unleserlichen Papierzettel mehr;
• Jede Buchung minutengenau mit Standortvalidierung erfasst;
• Prüffähige Arbeitszeitberichte auf Knopfdruck für Lohnbuchhaltung und Prüfer.

Konditionen:
• 15 Tage kostenlos testen, ohne Kreditkarte;
• 5,00 € / Mitarbeiter / Monat.

Jetzt kostenlos starten:
https://qrtime.be

Mit freundlichen Grüßen,
${senderName || 'Ihr QRTime Team'}
E-Mail: ${senderEmail}
Tel / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;
    } else if (pitchFocus === 'kiosk_tableta') {
      subject = `Smarte Tablet-Stechuhr am Eingang für ${companyName}`;
      hook = 'Verwandeln Sie jedes Tablet in ein Zeiterfassungsterminal mit dynamischem QR-Code.';
      body = `Guten Tag,

verwandeln Sie jedes handelsübliche Tablet am Eingang von ${companyName} in ein professionelles Zeiterfassungsterminal:
• Mitarbeiter scannen ihren dynamischen Code in 1 Sekunde;
• Live-Übersicht aller anwesenden Mitarbeiter im Management-Dashboard;
• Am Monatsende fertige Stundenübersichten für die Lohnabrechnung.

Konditionen:
• 15 Tage kostenlos testen ohne Vertragsbindung;
• Nur 5,00 € / Mitarbeiter / Monat.

Testzugang sofort aktivieren:
https://qrtime.be

Mit freundlichen Grüßen,
${senderName || 'Ihr QRTime Team'}
E-Mail: ${senderEmail}
Tel / WhatsApp: ${senderPhone}
Web: https://qrtime.be`;
    }

    return { subject, body, aiHook: hook };
  }

  // RO — Română (Implicit România)
  const normInd = (industry || '').toLowerCase();
  const isAccounting = normInd.includes('contabil') || normInd.includes('saga') || normInd.includes('audit');

  if (isAccounting) {
    let subject = `Parteneriat SAGA Salarii și pontaj electronic pentru clienții dvs. — ${companyName}`;
    let hook = 'Parteneriat cu contabili: eliminați condicile pe hârtie ale clienților dvs., export 1-Click în SAGA și comision 20%.';
    let body = `Bună ziua,

Vă propunem un parteneriat prin care eliminați definitiv condicile pe hârtie și pontajele întârziate primite lunar de la clienții ${companyName}: Pontaj.app.

Ce vă oferim pentru cabinetul dvs.:
• Export 1-Click direct în SAGA Salarii: atât log de pontaj detaliat, cât și centralizator lunar cu ore normale, ore de noapte (22:00-06:00), weekend și suplimentare calculate automat;
• Clienții dvs. folosesc o simplă tabletă sau telefon la intrare pentru pontaj QR securizat conform Art. 119 Codul Muncii;
• Acces gratuit pentru cabinetul dvs. la panoul centralizator + comision recurent de 20% lunar pentru fiecare client activ recomandat.

Condiții pentru clienți:
• 15 zile test gratuit complet, fără card bancar;
• Ulterior, tarif transparent de 5.00 € / angajat / lună (minim 50 € / lună / firmă, reduceri de volum: 4.50 € de la 50 angajați și 4.00 € de la 100 angajați).

Puteți testa direct exportul SAGA și platforma aici:
https://pontaj.app

Dacă doriți activarea unui cont de partener contabil, ne puteți răspunde direct la acest email sau ne puteți contacta telefonic la ${senderPhone}.

Cu respect,
${senderName || 'Echipa Pontaj.app'}
Email: ${senderEmail}
Telefon / WhatsApp: ${senderPhone}
Web: https://pontaj.app`;
    return { subject, body, aiHook: hook };
  }

  let subject = `Pontaj digital QR și evidență ITM — ${companyName}`;
  let hook = `Evidență exactă a orelor pe tabletă, condică conformă Art. 119 și export direct în SAGA Salarii.`;
  let body = `Bună ziua,

Vă contactez scurt în legătură cu gestionarea prezenței și evidența orelor de muncă pentru echipa ${companyName}.

În contextul cerințelor prevăzute de Art. 119 din Codul Muncii și al timpului consumat lunar cu centralizarea foilor de prezență, vă propunem o soluție simplă prin Pontaj.app:

• Terminal Kiosk pe tabletă la intrare: salariații scanează codul QR dinamic în sub o secundă, fără aparate biometrice costisitoare (soluție cloud, folosiți orice tabletă existentă; tableta și/sau suportul digital nu sunt oferite de noi și sunt în responsabilitatea clientului);
• Condică de prezență conformă Art. 119: înregistrează automat orele exacte de intrare și ieșire, gata oricând pentru controlul ITM;
• Integrare directă cu SAGA Salarii și Excel: calcul automat pentru orele de zi, de noapte și de weekend, cu export 1-Click direct în contabilitate.

Condiții comerciale:
• 15 zile test gratuit complet (fără card bancar, fără obligații contractuale);
• Ulterior, tarif transparent de 5.00 € / angajat / lună (minim 50 € / lună / firmă);
• Reduceri automate de volum: 4.50 € (de la 50 angajați) și 4.00 € (de la 100 angajați);
• Echipamente: tableta și/sau suportul digital nu sunt oferite de noi și sunt în responsabilitatea clientului (soluție 100% software în cloud).

Puteți testa direct platforma sau activa un cont demonstrativ accesând:
https://pontaj.app

Dacă doriți o scurtă prezentare sau asistență la configurare, ne puteți răspunde direct la acest email sau ne puteți contacta telefonic la ${senderPhone}.

Cu respect,
${senderName || 'Echipa Pontaj.app'}
Email: ${senderEmail}
Telefon / WhatsApp: ${senderPhone}
Web: https://pontaj.app`;

  if (pitchFocus === 'itm_compliance') {
    subject = `Evidență pontaj conformă Art. 119 ITM — ${companyName}`;
    hook = 'Conformitate strictă Art. 119 Codul Muncii și protecție la controlul ITM fără condici pe hârtie.';
    body = `Bună ziua,

Conform Art. 119 din Codul Muncii, fiecare angajator are obligația legală de a ține la locul de muncă evidența orelor de începere și sfârșit ale fiecărui salariat, cu ora exactă.

Vă propunem Pontaj.app — soluția digitală care elimină riscul amenzilor ITM și condicile pe hârtie pentru ${companyName}:
• Pontaj securizat pe tabletă sau smartphone cu cod QR dinamic și minut exact;
• Rapoarte de control generate instant în formatul solicitat de inspectorii de muncă;
• Export automat 1-Click în SAGA Salarii și Excel pentru contabilitate.

Condiții:
• 15 zile perioadă de probă gratuită, fără card bancar;
• Tarif: 5.00 € / angajat / lună (minim 50 € / firmă, reduceri de volum de la 50 și 100 angajați);
• Echipamente: tableta și/sau suportul digital nu sunt oferite de noi și sunt în responsabilitatea clientului (soluție 100% software în cloud).

Puteți începe testul gratuit direct aici:
https://pontaj.app

Pentru detalii suplimentare sau asistență, răspundeți direct la acest email sau ne puteți contacta telefonic la ${senderPhone}.

Cu respect,
${senderName || 'Echipa Pontaj.app'}
Email: ${senderEmail}
Telefon / WhatsApp: ${senderPhone}
Web: https://pontaj.app`;
  } else if (pitchFocus === 'kiosk_tableta') {
    subject = `Terminal de pontaj pe tabletă la intrare — ${companyName}`;
    hook = 'Transformați orice tabletă într-un terminal inteligent de pontaj cu QR dinamic.';
    body = `Bună ziua,

Vă propunem transformarea oricărei tablete obișnuite într-un terminal inteligent de pontaj la intrarea în ${companyName}, prin Kiosk Pontaj.app:
• Angajații scanează codul de pe telefon sau ecran în 2 secunde;
• Prezența și orele exacte sunt transmise în timp real în panoul de management;
• Generare automată a condicii legale ITM și export direct în SAGA Salarii / Excel la sfârșit de lună.

Condiții:
• 15 zile de testare gratuită completă;
• Fără aparate de mii de euro, tarif de 5.00 € / angajat / lună (minim 50 € / firmă, reduceri de volum);
• Echipamente: tableta și/sau suportul digital nu sunt oferite de noi și sunt în responsabilitatea clientului (soluție 100% software în cloud).

Activați contul demonstrativ pe loc:
https://pontaj.app

Dacă aveți întrebări, ne puteți contacta direct la ${senderPhone} sau puteți răspunde la acest email.

Cu respect,
${senderName || 'Echipa Pontaj.app'}
Email: ${senderEmail}
Telefon / WhatsApp: ${senderPhone}
Web: https://pontaj.app`;
  }

  return { subject, body, aiHook: hook };
}

// Apel direct către Claude (Anthropic API) pentru hiper-personalizare multi-limbă
async function generateClaudePitch({ companyName, industry, city, website, notes, pitchFocus, language = 'ro', apiKey, senderName = 'Smart QR Pontaj', senderEmail = 'contact@pontaj.app', senderPhone = '+40 757 77 77 12' }) {
  const lang = (language || 'ro').toLowerCase();

  const langDirectives = {
    fr: {
      langName: 'Français',
      brand: 'QRTime (https://qrtime.be)',
      context: 'Marché belge et francophone. Souligne le pointage digital rapide par smartphone (QR dynamique) et borne tablette kiosk à l’entrée, feuilles d’heures automatiques pour le secrétariat social (SD Worx, Securex, Liantis, Partena...), conformité stricte du temps de travail, pas de paperasse. INTERDICTION STRICTE DE MENTIONNER "ITM" OU "SAGA" (ce sont des termes uniquement roumains).'
    },
    nl: {
      langName: 'Nederlands',
      brand: 'QRTime (https://qrtime.be)',
      context: 'Belgische (Vlaanderen) en Nederlandse markt. Benadruk inklokken via smartphone (dynamische QR) en tablet prikklok aan de ingang, urenregistratie voor sociaal secretariaat (SD Worx, Securex, Liantis...), Dimona/aanwezigheidsregistratie. GEEN "ITM" OF "SAGA" GEBRUIKEN.'
    },
    en: {
      langName: 'English',
      brand: 'QRTime (https://qrtime.be)',
      context: 'International business audience. Focus on dynamic QR code and tablet kiosk clock-in, eliminating paper timesheets, automated payroll export and labor law compliance. NEVER MENTION "ITM" OR "SAGA".'
    },
    de: {
      langName: 'Deutsch',
      brand: 'QRTime (https://qrtime.be)',
      context: 'Deutscher und belgischer Markt. Fokus auf digitale Zeiterfassung per QR-Code und Tablet-Kiosk am Eingang, automatisierte Stundennachweise für die Lohnbuchhaltung, Rechtssicherheit bei Kontrollen. KEIN "ITM" ODER "SAGA".'
    },
    ro: {
      langName: 'Română',
      brand: 'Pontaj.app (https://pontaj.app)',
      context: 'Piața din România. Focus pe pontaj rapid prin QR dinamic și kiosk pe tabletă, eliminarea condicii pe hârtie, conformitate la controlul ITM conform Art. 119 Codul Muncii și export direct SAGA Salarii / Excel.'
    }
  };

  const directive = langDirectives[lang] || langDirectives.en;

  const prompt = `Ești un specialist de elită în vânzări B2B (SDR - Sales Development Representative) pentru "${directive.brand}".
Limba OBLIGATORIE pentru email este STRICT: ${directive.langName}.

Context specific de piață:
${directive.context}

Analizează prospectul:
- Nume companie: "${companyName}"
- Industrie/Domeniu: "${industry || 'Nespecificat'}"
- Oraș/Zonă: "${city || 'Local'}"
- Website: "${website || 'Nespecificat'}"
- Cârlig/Focalizare dorită: "${pitchFocus || 'pontaj_digital'}"
- Notițe suplimentare: "${notes || ''}"

Cerințe stricte pentru email:
1. Limba: Scrie ÎNTREGUL email (subiect, text, cârlig) în ${directive.langName} impecabilă, cu vocabular de afaceri natural și fluid.
2. Stil: Direct, profesionist, comercial fără bullshit. ESTE STRICT INTERZISĂ folosirea de introduceri de complezență siropoase sau false ("din respect pentru timpul dvs.", "urmărim activitatea dvs.", "ne-am gândit că", etc.). Treci direct la propunerea de valoare.
3. Lungime: scurt, între 70 și 120 cuvinte.
4. Structură clară:
   - Propunerea directă a soluției smart de pontaj QR.
   - Puncte forte: fără hardware scump (orice tabletă/telefon la intrare), conformitate legală (Art. 119 ITM în RO), export instant pentru contabilitate (SAGA Salarii / Excel în RO, sau secretariat social în BE/FR).
   - Condiții comerciale clare: 15 zile test gratuit complet fără card bancar, tarif transparent de 5.00 € / angajat / lună (minim 50 € / lună / firmă, reduceri de volum de la 50 angajați la 4.50 € și de la 100 angajați la 4.00 €). Menționează clar că tableta și/sau suportul digital nu sunt oferite de noi și sunt în responsabilitatea clientului (soluție 100% software în cloud).
   - Call to action clar: link direct către platformă sau răspuns la email / telefon.
   - OBLIGATORIU: Semnătură completă la finalul emailului cu:
     ${senderName}
     Email: ${senderEmail}
     Telefon / WhatsApp: ${senderPhone}
     Web: ${directive.brand}
5. FĂRĂ caractere emoji! Este strict interzisă folosirea de emoji în text sau în subiect.

Răspunde STRICT cu un obiect JSON valid, fără alte comentarii sau blocuri markdown (nu adăuga \`\`\`json):
{
  "aiHook": "1 frază scurtă care explică unghiul de atac ales pentru această firmă (în ${directive.langName})",
  "subject": "subiect natural și scurt (max 7-8 cuvinte, în ${directive.langName})",
  "body": "corpul complet al emailului în ${directive.langName}, semnat la final cu datele de contact complete (${senderName}, Email: ${senderEmail}, Telefon: ${senderPhone}, ${directive.brand})"
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[HarveyService] Anthropic API error:', res.status, errText);
      throw new Error(`Anthropic error ${res.status}`);
    }

    const data = await res.json();
    const rawContent = data.content?.[0]?.text?.trim() || '';
    
    // Curățăm posibile markere markdown
    const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      subject: parsed.subject || `Pointage / Zeiterfassung ${companyName}`,
      body: parsed.body || '',
      aiHook: parsed.aiHook || `Généré en ${directive.langName} avec Claude 3.5 Sonnet`
    };
  } catch (err) {
    console.error('[HarveyService] Eroare la apelul Claude, se folosește șablonul inteligent de fallback:', err.message);
    return generateFallbackPitch({ companyName, industry, city, pitchFocus, language: lang });
  }
}

// Căutare companii locale oficiale prin Google Places API (ultra-precis, adrese reale, telefoane, website-uri)
async function searchGooglePlacesForLeads({ apiKey, niches, cities, country = 'RO', limit = 20, mapCenter = null }) {
  if (!apiKey) return [];
  const leadsFound = [];
  const seenNames = new Set();
  const perQueryQuota = Math.max(3, Math.ceil(limit / Math.max(1, niches.length * cities.length)));

  for (const curNiche of niches) {
    for (const curCity of cities) {
      if (leadsFound.length >= limit) break;
      try {
        const query = `${curNiche} in ${curCity}, ${country}`;
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=ro&region=${(country || 'ro').toLowerCase()}`;
        if (mapCenter && mapCenter.lat && mapCenter.lon) {
          url += `&location=${mapCenter.lat},${mapCenter.lon}&radius=20000`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const gRes = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!gRes.ok) {
          console.warn('[GooglePlaces] HTTP Status:', gRes.status);
          continue;
        }

        const gData = await gRes.json();
        if (gData.status === 'REQUEST_DENIED') {
          console.warn('[GooglePlaces] REQUEST_DENIED:', gData.error_message || 'Verificați cheia Google Places API');
          return leadsFound;
        }

        const places = (gData.results || []).slice(0, perQueryQuota * 2);
        for (const place of places) {
          if (leadsFound.length >= limit) break;
          const rawName = place.name ? place.name.trim() : '';
          const lowerName = rawName.toLowerCase();
          if (!rawName || seenNames.has(lowerName)) continue;
          seenNames.add(lowerName);

          let phone = '';
          let website = '';
          let formattedAddress = place.formatted_address || '';
          let placeCity = curCity;
          let placeCounty = '';

          // Fetch Place Details dacă avem place_id
          if (place.place_id) {
            try {
              const detUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,international_phone_number,website,formatted_address,address_components&key=${apiKey}&language=ro`;
              const detRes = await fetch(detUrl);
              if (detRes.ok) {
                const detData = await detRes.json();
                if (detData.result) {
                  phone = detData.result.formatted_phone_number || detData.result.international_phone_number || '';
                  website = detData.result.website || '';
                  if (detData.result.formatted_address) {
                    formattedAddress = detData.result.formatted_address;
                  }
                  const components = detData.result.address_components || [];
                  const loc = components.find(c => c.types.includes('locality'));
                  const admin = components.find(c => c.types.includes('administrative_area_level_1'));
                  if (loc?.long_name) placeCity = loc.long_name;
                  if (admin?.long_name) placeCounty = admin.long_name;
                }
              }
            } catch (e) {
              // Ignorăm erori de detalii
            }
          }

          let email = null;
          if (website) {
            email = await scrapeEmailFromWebsite(website);
          }

          leadsFound.push({
            companyName: rawName,
            address: formattedAddress,
            city: placeCity,
            county: placeCounty,
            country: (country || 'RO').toUpperCase(),
            phone: phone,
            website: website,
            email: email,
            rating: place.rating || null,
            userRatingsTotal: place.user_ratings_total || 0,
            lat: place.geometry?.location?.lat || null,
            lon: place.geometry?.location?.lng || null,
            industry: curNiche,
            source: 'google_places'
          });
        }
      } catch (err) {
        console.warn('[GooglePlaces] Search step error:', err.message);
      }
    }
  }
  return leadsFound;
}

const harveyService = {
  // Preluare setări Harvey
  async getSettings() {
    const res = await db.query('SELECT * FROM sales_settings ORDER BY id ASC LIMIT 1');
    if (res.rows.length === 0) {
      return {
        sender_name: 'Smart QR Pontaj',
        sender_email: 'jeka7ro@gmail.com',
        sender_phone: '+40 757 77 77 12',
        daily_send_limit: 25,
        default_pitch: 'pontaj_digital',
        has_anthropic_key: !!process.env.ANTHROPIC_API_KEY,
        has_google_places_key: !!process.env.GOOGLE_PLACES_API_KEY
      };
    }
    const row = res.rows[0];
    return {
      ...row,
      sender_phone: row.sender_phone || '+40 757 77 77 12',
      has_anthropic_key: !!(row.anthropic_api_key || process.env.ANTHROPIC_API_KEY),
      anthropic_api_key: row.anthropic_api_key ? '••••••••' + row.anthropic_api_key.slice(-4) : '',
      has_google_places_key: !!(row.google_places_api_key || process.env.GOOGLE_PLACES_API_KEY),
      google_places_api_key: row.google_places_api_key ? '••••••••' + row.google_places_api_key.slice(-4) : ''
    };
  },

  // Salvare setări Harvey
  async updateSettings(data) {
    const { senderName, senderEmail, senderPhone, dailySendLimit, defaultPitch, anthropicApiKey, googlePlacesApiKey } = data;
    
    const updates = [
      'sender_name = $1',
      'sender_email = $2',
      'sender_phone = $3',
      'daily_send_limit = $4',
      'default_pitch = $5'
    ];
    const params = [
      senderName || 'Smart QR Pontaj',
      senderEmail || 'jeka7ro@gmail.com',
      senderPhone || '+40 757 77 77 12',
      parseInt(dailySendLimit, 10) || 25,
      defaultPitch || 'pontaj_digital'
    ];
    
    if (anthropicApiKey !== undefined) {
      if (anthropicApiKey === '') {
        updates.push('anthropic_api_key = NULL');
      } else if (!anthropicApiKey.includes('••••')) {
        params.push(anthropicApiKey.trim());
        updates.push(`anthropic_api_key = $${params.length}`);
      }
    }

    if (googlePlacesApiKey !== undefined) {
      if (googlePlacesApiKey === '') {
        updates.push('google_places_api_key = NULL');
      } else if (!googlePlacesApiKey.includes('••••')) {
        params.push(googlePlacesApiKey.trim());
        updates.push(`google_places_api_key = $${params.length}`);
      }
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE sales_settings 
      SET ${updates.join(', ')}
      WHERE id = (SELECT id FROM sales_settings ORDER BY id ASC LIMIT 1)
      RETURNING *;
    `;
    const res = await db.query(query, params);
    return res.rows[0];
  },

  // Căutare companii reale prin Google Places API sau Photon / OpenStreetMap
  async searchRealLeads({ niche = 'restaurante', city = 'București', niches = null, cities = null, country = 'RO', limit = 20, campaignId = null, mapCenter = null, bbox = null, googlePlacesApiKey = null }) {
    const targetNiches = Array.isArray(niches) && niches.length > 0 ? niches : [niche];
    const targetCities = Array.isArray(cities) && cities.length > 0 ? cities : [city];
    const targetCountry = (country || 'RO').toUpperCase();
    const requestedTotal = Math.max(4, parseInt(limit, 10) || 20);

    const savedLeads = [];

    // 1. Verificăm dacă avem o cheie Google Places API (din parametru, setări sau env)
    let googleApiKey = googlePlacesApiKey || process.env.GOOGLE_PLACES_API_KEY || null;
    if (!googleApiKey) {
      try {
        const sRes = await db.query('SELECT google_places_api_key FROM sales_settings ORDER BY id ASC LIMIT 1');
        if (sRes.rows.length > 0 && sRes.rows[0].google_places_api_key) {
          googleApiKey = sRes.rows[0].google_places_api_key;
        }
      } catch (e) {}
    }

    if (googleApiKey) {
      console.log('[HarveyService] Executare căutare companii prin Google Places API...');
      const googleResults = await searchGooglePlacesForLeads({
        apiKey: googleApiKey,
        niches: targetNiches,
        cities: targetCities,
        country: targetCountry,
        limit: requestedTotal,
        mapCenter
      });

      for (const item of googleResults) {
        if (savedLeads.length >= requestedTotal) break;

        const existing = await db.query(
          'SELECT id FROM sales_leads WHERE (LOWER(company_name) = LOWER($1) AND LOWER(city) = LOWER($2)) OR (email IS NOT NULL AND email != \'\' AND email = $3)',
          [item.companyName, item.city, item.email || '__no_email__']
        );

        if (existing.rows.length === 0) {
          const targetLang = detectLeadLanguage(item.city, item.country, item.address);
          const fallback = generateFallbackPitch({
            companyName: item.companyName,
            industry: item.industry,
            city: item.city,
            pitchFocus: 'pontaj_digital',
            language: targetLang
          });

          const insertRes = await db.query(`
            INSERT INTO sales_leads (
              campaign_id, company_name, city, country, address, website, email, phone, industry,
              ai_hook, draft_subject, draft_body, language, status, source, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending_review', 'google_places', $14, NOW(), NOW())
            RETURNING *;
          `, [
            campaignId, item.companyName, item.city, item.country, item.address, item.website, item.email, item.phone, item.industry,
            fallback.aiHook, fallback.subject, fallback.body, targetLang,
            item.rating ? `Google Rating: ${item.rating} (${item.userRatingsTotal || 0} recenzii)` : null
          ]);

          savedLeads.push(insertRes.rows[0]);
        }
      }

      if (savedLeads.length > 0) {
        return savedLeads;
      }
    }

    const CITY_COORDS = {
      // România
      'bucurești': { lat: 44.4323, lon: 26.1063 },
      'bucuresti': { lat: 44.4323, lon: 26.1063 },
      'cluj-napoca': { lat: 46.7712, lon: 23.6236 },
      'cluj': { lat: 46.7712, lon: 23.6236 },
      'timișoara': { lat: 45.7537, lon: 21.2257 },
      'timisoara': { lat: 45.7537, lon: 21.2257 },
      'iași': { lat: 47.1585, lon: 27.6014 },
      'iasi': { lat: 47.1585, lon: 27.6014 },
      'brașov': { lat: 45.6579, lon: 25.6012 },
      'brasov': { lat: 45.6579, lon: 25.6012 },
      'constanța': { lat: 44.1807, lon: 28.6343 },
      'constanta': { lat: 44.1807, lon: 28.6343 },
      'craiova': { lat: 44.3302, lon: 23.7949 },
      'oradea': { lat: 47.0722, lon: 21.9211 },
      'sibiu': { lat: 45.7983, lon: 24.1256 },
      'ploiesti': { lat: 44.9400, lon: 26.0240 },
      'ploiești': { lat: 44.9400, lon: 26.0240 },
      'galati': { lat: 45.4353, lon: 28.0080 },
      'galați': { lat: 45.4353, lon: 28.0080 },
      'arad': { lat: 46.1866, lon: 21.3123 },
      'pitesti': { lat: 44.8565, lon: 24.8692 },
      'pitești': { lat: 44.8565, lon: 24.8692 },
      'bacau': { lat: 46.5670, lon: 26.9146 },
      'bacău': { lat: 46.5670, lon: 26.9146 },
      // Belgia
      'bruxelles': { lat: 50.8503, lon: 4.3517 },
      'brussels': { lat: 50.8503, lon: 4.3517 },
      'antwerpen': { lat: 51.2194, lon: 4.4025 },
      'anvers': { lat: 51.2194, lon: 4.4025 },
      'gent': { lat: 51.0543, lon: 3.7174 },
      'gand': { lat: 51.0543, lon: 3.7174 },
      'liege': { lat: 50.6326, lon: 5.5797 },
      'liège': { lat: 50.6326, lon: 5.5797 },
      'charleroi': { lat: 50.4108, lon: 4.4446 },
      'brugge': { lat: 51.2093, lon: 3.2247 },
      'bruges': { lat: 51.2093, lon: 3.2247 },
      'namur': { lat: 50.4674, lon: 4.8719 },
      'mons': { lat: 50.4541, lon: 3.9523 },
      'leuven': { lat: 50.8798, lon: 4.7005 },
      // Franța
      'paris': { lat: 48.8566, lon: 2.3522 },
      'lyon': { lat: 45.7640, lon: 4.8357 },
      'marseille': { lat: 43.2965, lon: 5.3698 },
      'toulouse': { lat: 43.6047, lon: 1.4442 },
      'nice': { lat: 43.7102, lon: 7.2620 },
      'nantes': { lat: 47.2184, lon: -1.5536 },
      'strasbourg': { lat: 48.5734, lon: 7.7521 },
      'bordeaux': { lat: 44.8378, lon: -0.5792 },
      'lille': { lat: 50.6292, lon: 3.0573 },
      // Germania
      'berlin': { lat: 52.5200, lon: 13.4050 },
      'münchen': { lat: 48.1351, lon: 11.5820 },
      'munchen': { lat: 48.1351, lon: 11.5820 },
      'munich': { lat: 48.1351, lon: 11.5820 },
      'frankfurt': { lat: 50.1109, lon: 8.6821 },
      'hamburg': { lat: 53.5511, lon: 9.9937 },
      'köln': { lat: 50.9375, lon: 6.9603 },
      'koln': { lat: 50.9375, lon: 6.9603 },
      'cologne': { lat: 50.9375, lon: 6.9603 },
      'stuttgart': { lat: 48.7758, lon: 9.1829 },
      'düsseldorf': { lat: 51.2277, lon: 6.7735 },
      'dusseldorf': { lat: 51.2277, lon: 6.7735 },
      // Olanda / Țările de Jos
      'amsterdam': { lat: 52.3676, lon: 4.9041 },
      'rotterdam': { lat: 51.9244, lon: 4.4777 },
      'den haag': { lat: 52.0705, lon: 4.3007 },
      'haga': { lat: 52.0705, lon: 4.3007 },
      'the hague': { lat: 52.0705, lon: 4.3007 },
      'utrecht': { lat: 52.0907, lon: 5.1214 },
      'eindhoven': { lat: 51.4416, lon: 5.4697 },
      // Italia
      'roma': { lat: 41.9028, lon: 12.4964 },
      'rome': { lat: 41.9028, lon: 12.4964 },
      'milano': { lat: 45.4642, lon: 9.1900 },
      'milan': { lat: 45.4642, lon: 9.1900 },
      'napoli': { lat: 40.8518, lon: 14.2681 },
      'torino': { lat: 45.0703, lon: 7.6869 },
      'bologna': { lat: 44.4949, lon: 11.3426 },
      'firenze': { lat: 43.7696, lon: 11.2558 },
      // Spania
      'madrid': { lat: 40.4168, lon: -3.7038 },
      'barcelona': { lat: 41.3879, lon: 2.1699 },
      'valencia': { lat: 39.4699, lon: -0.3763 },
      'sevilla': { lat: 37.3891, lon: -5.9845 },
      'málaga': { lat: 36.7213, lon: -4.4214 },
      'malaga': { lat: 36.7213, lon: -4.4214 },
      // Marea Britanie
      'london': { lat: 51.5074, lon: -0.1278 },
      'londra': { lat: 51.5074, lon: -0.1278 },
      'manchester': { lat: 53.4808, lon: -2.2426 },
      'birmingham': { lat: 52.4862, lon: -1.8904 },
      // Austria
      'wien': { lat: 48.2082, lon: 16.3738 },
      'viena': { lat: 48.2082, lon: 16.3738 },
      'vienna': { lat: 48.2082, lon: 16.3738 },
      'graz': { lat: 47.0707, lon: 15.4395 },
      'salzburg': { lat: 47.8095, lon: 13.0550 }
    };

    const mapNicheToTerms = (n) => {
      const s = (n || '').toLowerCase();
      if (s.includes('contabil') || s.includes('saga') || s.includes('audit')) return ['contabilitate', 'expert contabil', 'audit', 'ceccar', 'servicii contabile'];
      if (s.includes('hotel') || s.includes('pensiu') || s.includes('cazar')) return ['hotel', 'pensiune', 'hostel', 'cazare'];
      if (s.includes('restauran')) return ['restaurant', 'bistro', 'trattoria', 'pizzerie', 'pub'];
      if (s.includes('curat')) return ['curatenie', 'cleaning'];
      if (s.includes('clinic') || s.includes('cabinet') || s.includes('medic')) return ['clinica', 'cabinet', 'medical', 'dentist'];
      if (s.includes('construct') || s.includes('instal')) return ['constructii', 'instalatii', 'termice'];
      if (s.includes('logistic') || s.includes('depozit')) return ['logistica', 'depozit', 'distributie'];
      if (s.includes('salon') || s.includes('infrumuset')) return ['salon', 'beauty', 'coafura'];
      if (s.includes('brutar') || s.includes('panific')) return ['brutarie', 'panificatie', 'patiserie', 'cofetarie'];
      if (s.includes('magazin') || s.includes('retail') || s.includes('supermarket')) return ['supermarket', 'magazin', 'minimarket'];
      return [n];
    };

    const cleanCity = (c) => {
      return (c || '').replace(/\s*\(Belgia\)/i, '').replace(/\s*\(România\)/i, '').trim();
    };

    const isValidCompanyName = (name, city) => {
      if (!name || typeof name !== 'string') return false;
      const n = name.trim().toLowerCase();
      if (n.length < 3) return false;
      const generic = ['hotel', 'restaurant', 'hostel', 'pensiune', 'motel', 'bar', 'cafe', 'pub', 'bistro', 'clinica', 'cabinet', 'salon'];
      if (generic.includes(n)) return false;
      if (/^(hotel|restaurant|clinica|salon|pensiune)\s*#?\d+$/i.test(n)) return false;
      if (n === (city || '').toLowerCase()) return false;
      if (n.startsWith('demolare ')) return false;

      // Excludere categorică culte, biserici, institute culturale și instituții publice
      const forbiddenKeywords = [
        'biseric', 'catedral', 'parohi', 'manastir', 'schit', 'sinagog', 'mosche',
        'church', 'eglise', 'kirche', 'cathedral', 'chapel', 'temple',
        'institutul', 'ambasad', 'consulat', 'primari', 'prefectur', 'minister',
        'inspectorat', 'tribunal', 'judecatori', 'parchet', 'penitenciar',
        'cimitir', 'monument', 'statuia', 'parcul ', 'liceul', 'scoala', 'gradinit',
        'universitat', 'facultat', 'colegiul', 'stare civil', 'evidenta persoanelor', 'serviciul public', 'directia ', 'agentia '
      ];
      if (forbiddenKeywords.some(k => n.includes(k))) return false;

      return true;
    };

    const quotaPerNiche = Math.max(2, Math.ceil(requestedTotal / targetNiches.length));

    // Iterăm prin FIECARE nișă în mod garantat, asigurând că nicio nișă nu este înfometată
    for (const curNiche of targetNiches) {
      let nicheSavedCount = 0;
      const terms = mapNicheToTerms(curNiche);

      for (const curCity of targetCities) {
        if (nicheSavedCount >= quotaPerNiche) break;

        const cCity = cleanCity(curCity);
        const normCityLower = cCity.toLowerCase();
        let coords = CITY_COORDS[normCityLower];
        if (mapCenter && mapCenter.lat && mapCenter.lon) {
          coords = { lat: Number(mapCenter.lat), lon: Number(mapCenter.lon) };
        }

        // Dacă orașul nu este în dicționar și nu s-au trimis coordonate manuale de pe hartă, geocodăm dinamic oriunde în lume
        if (!coords && cCity) {
          try {
            const geoRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(cCity + ' ' + (targetCountry || ''))}&limit=1`, {
              headers: { 'User-Agent': 'SmartQRPontajCRM/1.0 (contact@pontaj.app)' }
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.features && geoData.features.length > 0) {
                const [lon, lat] = geoData.features[0].geometry.coordinates;
                coords = { lat, lon };
              }
            }
          } catch (e) {
            // Ignorăm eroarea de geocodare și lăsăm căutarea prin text
          }
        }

        // Construim query-urile Photon: cu coordonate dacă sunt cunoscute + căutare text
        const urlsToTry = [];
        for (const term of terms) {
          if (coords) {
            let pUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&lat=${coords.lat}&lon=${coords.lon}&limit=50`;
            if (bbox && Array.isArray(bbox) && bbox.length === 4) {
              pUrl += `&bbox=${bbox.join(',')}`;
            }
            urlsToTry.push(pUrl);
          }
          urlsToTry.push(`https://photon.komoot.io/api/?q=${encodeURIComponent(term + ' ' + cCity)}&limit=50`);
        }

        const candidateFeatures = [];
        const seenCandidateNames = new Set();

        for (const url of urlsToTry) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) continue;
            const data = await response.json();
            const features = data.features || [];

            for (const feat of features) {
              const p = feat.properties || {};
              const rawName = p.name ? p.name.trim() : '';
              if (!isValidCompanyName(rawName, cCity)) continue;
              const lower = rawName.toLowerCase();
              if (seenCandidateNames.has(lower)) continue;
              seenCandidateNames.add(lower);

              const candCity = (p.city || p.town || p.suburb || p.municipality || '').toLowerCase();
              const candCounty = (p.county || p.state || '').toLowerCase();

              // Verificare strictă a orașului căutat:
              if (normCityLower.includes('bucur')) {
                if (candCounty && !candCounty.includes('bucur') && !candCounty.includes('ilfov')) {
                  continue;
                }
                if (candCity && !candCity.includes('bucur') && !candCity.includes('sector') && !candCity.includes('ilfov')) {
                  continue;
                }
              } else {
                if (candCity && !candCity.includes(normCityLower) && !normCityLower.includes(candCity) && !candCounty.includes(normCityLower)) {
                  continue;
                }
              }

              const detectedCity = p.suburb || p.city || p.town || cCity;
              candidateFeatures.push({ feat, p, rawName, detectedCity });
            }
          } catch (e) {
            console.warn('[HarveyService] Photon fetch error for', url, e.message);
          }
        }

        // Preluăm extratags din Nominatim pentru candidații care au osm_type și osm_id
        const osmIdsToLookup = candidateFeatures
          .filter(c => c.p.osm_type && c.p.osm_id)
          .map(c => `${c.p.osm_type.toUpperCase()}${c.p.osm_id}`);

        const nominatimTagsMap = new Map();
        for (let i = 0; i < osmIdsToLookup.length; i += 35) {
          const chunk = osmIdsToLookup.slice(i, i + 35).join(',');
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const lRes = await fetch(`https://nominatim.openstreetmap.org/lookup?osm_ids=${chunk}&format=json&extratags=1&addressdetails=1`, {
              signal: controller.signal,
              headers: { 'User-Agent': 'SmartQRPontajCRM/1.0 (contact@pontaj.app)' }
            });
            clearTimeout(timeout);
            if (lRes.ok) {
              const lData = await lRes.json();
              for (const item of lData) {
                const idKey = `${(item.osm_type || '').toUpperCase()[0]}${item.osm_id}`;
                nominatimTagsMap.set(idKey, item.extratags || {});
              }
            }
          } catch (e) {
            console.warn('[HarveyService] Nominatim lookup error:', e.message);
          }
        }

        // Sortăm candidații astfel încât cei cu email existent direct în OSM/Nominatim să fie procesați primii instantaneu
        candidateFeatures.sort((a, b) => {
          const idA = `${(a.p.osm_type || '').toUpperCase()[0]}${a.p.osm_id}`;
          const idB = `${(b.p.osm_type || '').toUpperCase()[0]}${b.p.osm_id}`;
          const hasEmailA = !!(a.p.email || a.p.extra?.email || nominatimTagsMap.get(idA)?.email || nominatimTagsMap.get(idA)?.['contact:email']);
          const hasEmailB = !!(b.p.email || b.p.extra?.email || nominatimTagsMap.get(idB)?.email || nominatimTagsMap.get(idB)?.['contact:email']);
          if (hasEmailA && !hasEmailB) return -1;
          if (!hasEmailA && hasEmailB) return 1;
          return 0;
        });

        let scrapeAttempts = 0;

        // Procesăm candidații pentru această nișă și oraș — DOAR companii cu email valid!
        for (const { feat, p, rawName, detectedCity } of candidateFeatures) {
          if (nicheSavedCount >= quotaPerNiche) break;
          if (savedLeads.length >= requestedTotal) break;

          const companyName = rawName;
          const road = p.street || '';
          const houseNumber = p.housenumber || '';
          const district = p.district || p.suburb || '';
          const fullAddress = [road, houseNumber, district, detectedCity].filter(Boolean).join(', ');

          const idKey = `${(p.osm_type || '').toUpperCase()[0]}${p.osm_id}`;
          const extraTags = nominatimTagsMap.get(idKey) || {};

          let website = p.website || p.extra?.website || extraTags.website || extraTags['contact:website'] || null;
          let email = p.email || p.extra?.email || extraTags.email || extraTags['contact:email'] || null;
          let phone = p.phone || p.extra?.phone || extraTags.phone || extraTags['contact:phone'] || null;

          if (!email && website && scrapeAttempts < 25) {
            scrapeAttempts++;
            email = await scrapeEmailFromWebsite(website);
          }

          // REGULĂ STRICTĂ: Nu salvăm companii fără email!
          if (!email || typeof email !== 'string' || !email.includes('@') || email.length < 5) {
            continue;
          }

          email = email.toLowerCase().trim();

          // Verificăm dacă există deja în baza de date
          const existing = await db.query(
            'SELECT id FROM sales_leads WHERE (LOWER(company_name) = LOWER($1) AND (LOWER(city) = LOWER($2) OR LOWER(city) LIKE $3)) OR (email IS NOT NULL AND email = $4)',
            [companyName, detectedCity, `%${cCity.toLowerCase()}%`, email]
          );

          if (existing.rows.length === 0) {
            const targetLang = detectLeadLanguage(detectedCity, feat.properties?.country, fullAddress);
            const fallback = generateFallbackPitch({
              companyName,
              industry: curNiche,
              city: detectedCity,
              pitchFocus: 'pontaj_digital',
              language: targetLang
            });

            const detectedCountryCode = (feat.properties?.countrycode || '').toUpperCase();
            if (targetCountry && detectedCountryCode && detectedCountryCode !== targetCountry) {
              continue;
            }
            const leadCountry = detectedCountryCode || targetCountry || 'RO';

            const insertRes = await db.query(`
              INSERT INTO sales_leads (
                campaign_id, company_name, city, country, address, website, email, phone, industry,
                ai_hook, draft_subject, draft_body, language, status, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending_review', NOW(), NOW())
              RETURNING *;
            `, [
              campaignId, companyName, detectedCity, leadCountry, fullAddress, website, email, phone, curNiche,
              fallback.aiHook, fallback.subject, fallback.body, targetLang
            ]);

            savedLeads.push(insertRes.rows[0]);
            nicheSavedCount++;
          }
        }
      }
    }

    // Dacă după căutare numărul este mai mic decât cel cerut, completăm DOAR cu lead-urile existente din ACELEAȘI orașe/țară care au email!
    if (savedLeads.length < requestedTotal) {
      const cleanCityNames = targetCities.map(c => cleanCity(c).toLowerCase());
      const existingRows = await db.query(`
        SELECT * FROM sales_leads 
        WHERE email IS NOT NULL AND email != ''
          AND (country = $1 OR $1 = 'GLOBAL' OR $1 = '')
          AND (
            $2::text[] IS NULL 
            OR cardinality($2::text[]) = 0 
            OR LOWER(city) = ANY($2::text[])
            OR EXISTS (
              SELECT 1 FROM unnest($2::text[]) AS tc 
              WHERE LOWER(sales_leads.city) LIKE '%' || tc || '%'
            )
          )
        ORDER BY created_at DESC 
        LIMIT $3
      `, [targetCountry, cleanCityNames, requestedTotal]);

      for (const row of existingRows.rows) {
        if (!savedLeads.some(l => l.id === row.id)) {
          savedLeads.push(row);
        }
        if (savedLeads.length >= requestedTotal) break;
      }
    }

    return savedLeads;
  },

  // Generare / Regenerare pitch cu Claude sau Fallback
  async generateLeadPitch(leadId, { customNotes = '', pitchFocus = 'pontaj_digital', language } = {}) {
    const leadRes = await db.query('SELECT * FROM sales_leads WHERE id = $1', [leadId]);
    if (leadRes.rows.length === 0) throw new Error('Lead-ul nu a fost găsit');
    const lead = leadRes.rows[0];

    const targetLang = language || lead.language || detectLeadLanguage(lead.city, null, lead.address);

    // Luăm cheia Anthropic și setările expeditorului din sales_settings
    const settingsRes = await db.query('SELECT * FROM sales_settings ORDER BY id ASC LIMIT 1');
    const settings = settingsRes.rows[0] || {};
    const apiKey = settings.anthropic_api_key || process.env.ANTHROPIC_API_KEY;
    const senderName = settings.sender_name || 'Smart QR Pontaj';
    const senderEmail = settings.sender_email || 'contact@pontaj.app';
    const senderPhone = settings.sender_phone || '+40 757 77 77 12';

    let pitch;
    if (apiKey) {
      pitch = await generateClaudePitch({
        companyName: lead.company_name,
        industry: lead.industry,
        city: lead.city,
        website: lead.website,
        notes: customNotes || lead.notes,
        pitchFocus,
        language: targetLang,
        apiKey,
        senderName,
        senderEmail,
        senderPhone
      });
    } else {
      pitch = generateFallbackPitch({
        companyName: lead.company_name,
        industry: lead.industry,
        city: lead.city,
        pitchFocus,
        language: targetLang,
        senderName,
        senderEmail,
        senderPhone
      });
    }

    const updated = await db.query(`
      UPDATE sales_leads
      SET draft_subject = $1, draft_body = $2, ai_hook = $3, language = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `, [pitch.subject, pitch.body, pitch.aiHook, targetLang, leadId]);

  },

  // Generator șablon email HTML stilizat la nivelul landing page-ului (executive dark gradient, cards, pills, CTA)
  formatLeadEmailHtml(lead, isTest = false) {
    const companyName = lead.company_name || 'Compania dvs.';
    const subject = isTest ? `[TEST PREVIZUALIZARE] ${lead.draft_subject || lead.pitch_subject || 'Smart QR Pontaj'}` : (lead.draft_subject || lead.pitch_subject || 'Smart QR Pontaj');
    const rawBody = lead.draft_body || lead.pitch_body || '';

    // Parsare inteligentă a paragrafelor
    const paragraphs = rawBody.split('\n\n').map(p => p.trim()).filter(Boolean);

    let greeting = 'Bună ziua,';
    let introParagraphs = [];
    let features = [];
    let closingNote = 'Dacă doriți o scurtă prezentare sau asistență la configurare, ne puteți contacta telefonic sau puteți răspunde direct la acest email.';

    for (const para of paragraphs) {
      if (para.toLowerCase().startsWith('bună ziua') || para.toLowerCase().startsWith('stimate')) {
        greeting = para.split('\n')[0];
      } else if (para.includes('•') || para.includes('- ') || /^\d+\./m.test(para)) {
        const lines = para.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
            const cleanText = trimmed.replace(/^[•\-\d\.]\s*/, '');
            if (!cleanText.toLowerCase().includes('15 zile test') && !cleanText.toLowerCase().includes('5.00 €') && !cleanText.toLowerCase().includes('comision recurent')) {
              features.push(cleanText);
            }
          }
        }
      } else if (para.toLowerCase().includes('cu respect') || para.toLowerCase().startsWith('smart qr')) {
        // Semnătura text brut este înlocuită de cardul executiv grafic
      } else if (para.toLowerCase().includes('puteți testa') || para.includes('https://')) {
        // Linkul brut este înlocuit de butonul mare CTA
      } else if (para.toLowerCase().includes('dacă doriți') || para.toLowerCase().includes('pentru detalii') || para.toLowerCase().includes('pentru întrebări')) {
        closingNote = para;
      } else {
        introParagraphs.push(para);
      }
    }

    // Generare carduri vizuale elegante cu iconițe vectoriale Lucide renderizate ca PNG via CDN (fără emoji-uri)
    const getIconConfig = (text, idx) => {
      const lower = text.toLowerCase();
      if (lower.includes('kiosk') || lower.includes('tablet') || lower.includes('telefon') || lower.includes('ecran') || lower.includes('aparat') || lower.includes('terminal')) {
        return {
          iconName: 'tablet',
          color: '%25232563eb', // Albastru Royal
          bg: '#eff6ff',
          border: '#bfdbfe'
        };
      }
      if (lower.includes('legal') || lower.includes('itm') || lower.includes('condic') || lower.includes('art. 119') || lower.includes('muncii') || lower.includes('lege')) {
        return {
          iconName: 'shield-check',
          color: '%2523059669', // Verde Smarald
          bg: '#ecfdf5',
          border: '#a7f3d0'
        };
      }
      if (lower.includes('saga') || lower.includes('export') || lower.includes('salarii') || lower.includes('contab') || lower.includes('excel') || lower.includes('calcul')) {
        return {
          iconName: 'file-spreadsheet',
          color: '%25234f46e5', // Indigo
          bg: '#eef2ff',
          border: '#c7d2fe'
        };
      }
      if (lower.includes('ore') || lower.includes('noapte') || lower.includes('weekend') || lower.includes('schimb') || lower.includes('timp') || lower.includes('minut')) {
        return {
          iconName: 'clock',
          color: '%25230284c7', // Bleu
          bg: '#f0f9ff',
          border: '#bae6fd'
        };
      }
      if (lower.includes('gps') || lower.includes('teren') || lower.includes('santier') || lower.includes('locati')) {
        return {
          iconName: 'map-pin',
          color: '%2523d97706', // Chihlimbar
          bg: '#fffbeb',
          border: '#fde68a'
        };
      }

      const defaults = [
        { iconName: 'tablet', color: '%25232563eb', bg: '#eff6ff', border: '#bfdbfe' },
        { iconName: 'shield-check', color: '%2523059669', bg: '#ecfdf5', border: '#a7f3d0' },
        { iconName: 'file-spreadsheet', color: '%25234f46e5', bg: '#eef2ff', border: '#c7d2fe' },
        { iconName: 'clock', color: '%25230284c7', bg: '#f0f9ff', border: '#bae6fd' },
        { iconName: 'qr-code', color: '%25237c3aed', bg: '#faf5ff', border: '#e9d5ff' }
      ];
      return defaults[idx % defaults.length];
    };

    const featureCardsHtml = features.map((f, idx) => {
      let title = '';
      let desc = f;
      if (f.includes(':')) {
        const parts = f.split(':');
        title = parts[0].trim();
        desc = parts.slice(1).join(':').trim();
      } else {
        title = `Punct Cheie ${idx + 1}`;
      }

      const cfg = getIconConfig(f, idx);
      const iconUrl = `https://images.weserv.nl/?url=api.iconify.design/lucide/${cfg.iconName}.svg?color=${cfg.color}&w=48&h=48&output=png`;

      return `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="44" valign="top" style="padding-right: 14px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="width: 38px; height: 38px; border-radius: 10px; background-color: ${cfg.bg}; border: 1.5px solid ${cfg.border}; text-align: center; vertical-align: middle;">
                      <img 
                        src="${iconUrl}" 
                        width="22" 
                        height="22" 
                        alt="${title}"
                        style="display: block; margin: 0 auto; width: 22px; height: 22px; border: 0;"
                      />
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle">
                <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px; letter-spacing: -0.2px;">${title}</div>
                <div style="font-size: 13px; color: #475569; line-height: 1.5;">${desc}</div>
              </td>
            </tr>
          </table>
        </div>
      `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; width: 100%;">
    <tr>
      <td align="center" style="padding: 30px 14px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Header Executive Dark Gradient Compact (Identic Landing) -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 18px 24px; text-align: left; border-bottom: 3px solid #2563eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" valign="middle" style="width: 36px; height: 36px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); border-radius: 10px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(37,99,235,0.35); border: 1px solid rgba(255,255,255,0.18); padding: 0; margin: 0; font-size: 0; line-height: 0;">
                          <img 
                            src="https://images.weserv.nl/?url=api.iconify.design/lucide/qr-code.svg?color=%2523ffffff&w=48&h=48&output=png" 
                            width="20" 
                            height="20" 
                            alt="QR"
                            style="display: block; margin: 0 auto; width: 20px; height: 20px; border: 0;"
                          />
                        </td>
                        <td style="padding-left: 10px;">
                          <div style="font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.4px; line-height: 1;">
                            Pontaj<span style="color: #60a5fa;">.app</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="background: rgba(255,255,255,0.08); color: #93c5fd; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 9999px; display: inline-block; white-space: nowrap; letter-spacing: 0.3px;">
                      Art. 119 ITM
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corp Principal Email -->
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              
              <!-- Salut și Introducere -->
              <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
                ${greeting}
              </div>
              <div style="font-size: 14.5px; line-height: 1.65; color: #334155; margin-bottom: 20px;">
                ${introParagraphs.map(p => `<p style="margin: 0 0 12px 0;">${p}</p>`).join('')}
              </div>

              <!-- Fotografie Video Prezentare (Kiosk QR pe Tabletă) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="https://qr.pontaj.app" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img 
                        src="https://qr.pontaj.app/media/qrtime-demo-poster.jpg" 
                        alt="Salariat scanează codul QR de pe tabletă la intrare" 
                        width="544" 
                        style="display: block; width: 100%; max-width: 544px; height: auto; border-radius: 14px; border: 1px solid #cbd5e1; box-shadow: 0 6px 18px rgba(0,0,0,0.08); margin: 0 auto;" 
                      />
                    </a>
                    <div style="font-size: 11px; color: #64748b; margin-top: 8px; font-weight: 600; text-align: center;">
                      Terminal Kiosk pe tabletă la intrare &bull; Scanare rapidă sub o secundă cu orice telefon
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Titlu Secțiune Beneficii -->
              <div style="font-size: 13px; font-weight: 700; color: #334155; margin: 20px 0 12px 0;">
                Cum funcționează pentru ${companyName}:
              </div>

              <!-- Carduri Beneficii (Fără Emoji, Iconițe Stilizate Lucide) -->
              ${featureCardsHtml}



              <!-- Buton Principal Call-To-Action (Landing Style) -->
              <div style="text-align: center; margin: 26px 0;">
                <a href="https://qr.pontaj.app/ro?ref=email" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 16px 36px; border-radius: 9999px; font-weight: 800; font-size: 15px; text-decoration: none; display: inline-block; letter-spacing: 0.2px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                  Activează Testul Gratuit (15 Zile) &rarr;
                </a>
                <div style="font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 500;">
                  Nu necesită descărcare &bull; Funcționează instant pe orice tabletă sau telefon
                </div>
              </div>

              <!-- Notă Încheiere -->
              <div style="font-size: 13.5px; color: #475569; line-height: 1.6; margin: 24px 0 20px 0; border-left: 3px solid #2563eb; padding-left: 14px;">
                ${closingNote}
              </div>

              <!-- Card Contact Direct & WhatsApp -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-top: 20px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <div style="font-size: 14px; font-weight: 800; color: #0f172a;">Echipa Pontaj.app</div>
                          <div style="font-size: 12.5px; color: #475569; margin-top: 3px;">
                            Telefon: <a href="tel:0757777712" style="color: #2563eb; text-decoration: none; font-weight: 700;">0757 77 77 12</a> &bull; Email: <a href="mailto:contact@pontaj.app" style="color: #2563eb; text-decoration: none; font-weight: 700;">contact@pontaj.app</a>
                          </div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                            Web: <a href="https://qr.pontaj.app" style="color: #2563eb; text-decoration: none;">https://qr.pontaj.app</a>
                          </div>
                        </td>
                        <td align="right" valign="middle" style="padding-left: 14px;">
                          <a href="https://wa.me/40757777712?text=Buna%20ziua,%20doresc%20detalii%20despre%20Pontaj.app" target="_blank" style="background-color: #16a34a; color: #ffffff !important; padding: 10px 18px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-block; white-space: nowrap; box-shadow: 0 2px 8px rgba(22,163,74,0.3);">
                            Scrie pe WhatsApp &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Legal -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 22px 28px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7; line-height: 1.6;">
              Pontaj.app &bull; Pontaj Electronic QR pe Orice Ecran<br/>
              Acest mesaj a fost transmis către <strong>${companyName}</strong>. Dacă nu doriți să mai primiți comunicări, puteți răspunde cu "Dezabonare".
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return { subject, html };
  },

  // Trimitere email către lead prin Brevo
  async sendLeadEmail(leadId) {
    const leadRes = await db.query('SELECT * FROM sales_leads WHERE id = $1', [leadId]);
    if (leadRes.rows.length === 0) throw new Error('Lead-ul nu a fost găsit');
    const lead = leadRes.rows[0];

    if (!lead.email) {
      throw new Error('Acest lead nu are o adresă de email validă salvată');
    }

    if (lead.status === 'sent') {
      throw new Error('Emailul a fost deja trimis către acest lead');
    }

    const settingsRes = await db.query('SELECT * FROM sales_settings LIMIT 1');
    const settings = settingsRes.rows[0] || { sender_name: 'Smart QR Pontaj', sender_email: 'contact@pontaj.app', daily_send_limit: 25 };

    // Verificăm limita zilnică
    const todayCountRes = await db.query(`
      SELECT COUNT(*) as count 
      FROM sales_leads 
      WHERE status = 'sent' AND email_sent_at >= CURRENT_DATE;
    `);
    const sentToday = parseInt(todayCountRes.rows[0]?.count || 0, 10);
    if (sentToday >= settings.daily_send_limit) {
      throw new Error(`Limita zilnică de ${settings.daily_send_limit} emailuri a fost atinsă pentru astăzi. Vă rugăm continuați mâine.`);
    }

    // Generăm HTML stilizat la nivelul landing page-ului
    const { subject, html } = this.formatLeadEmailHtml(lead, false);

    // Trimitere efectivă prin Brevo
    await emailService.sendEmail({
      to: lead.email,
      subject: subject,
      html: html,
      text: lead.draft_body,
      senderName: settings.sender_name || 'Smart QR Pontaj',
      senderEmail: settings.sender_email || 'contact@pontaj.app'
    });

    // Actualizăm statusul
    const updated = await db.query(`
      UPDATE sales_leads
      SET status = 'sent', email_sent_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `, [leadId]);

    return updated.rows[0];
  },

  // Trimitere email de test pentru previzualizare către administrator
  async sendTestLeadEmail(leadId, targetEmail = null) {
    const leadRes = await db.query('SELECT * FROM sales_leads WHERE id = $1', [leadId]);
    if (leadRes.rows.length === 0) throw new Error('Lead-ul nu a fost găsit');
    const lead = leadRes.rows[0];

    const settingsRes = await db.query('SELECT * FROM sales_settings LIMIT 1');
    const settings = settingsRes.rows[0] || { sender_name: 'Smart QR Pontaj', sender_email: 'contact@pontaj.app' };

    const recipient = targetEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'jeka7ro@gmail.com';

    // Generăm HTML stilizat cu marcaj de test
    const { subject, html } = this.formatLeadEmailHtml(lead, true);

    await emailService.sendEmail({
      to: recipient,
      subject: subject,
      html: html,
      text: lead.draft_body,
      senderName: settings.sender_name || 'Smart QR Pontaj',
      senderEmail: settings.sender_email || 'contact@pontaj.app'
    });

    return { success: true, recipient };
  },

  // Import în lot lead-uri din CSV / Excel / text
  async importBulkLeads(leadsArray, campaignId = null) {
    if (!Array.isArray(leadsArray) || leadsArray.length === 0) {
      return { success: false, message: 'Nu au fost trimise lead-uri pentru import.' };
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const lead of leadsArray) {
      try {
        const rawName = (lead.company_name || lead.nume_companie || lead.nume || lead.firma || '').trim();
        let email = (lead.email || '').trim().toLowerCase();
        const city = (lead.city || lead.oras || '').trim();
        const country = (lead.country || lead.tara || 'RO').trim().toUpperCase();
        const phone = (lead.phone || lead.telefon || '').trim();
        const industry = (lead.industry || lead.industrie || lead.nisa || 'General').trim();
        const website = (lead.website || lead.site || '').trim();
        const address = (lead.address || lead.adresa || '').trim();

        if (!rawName) {
          skipped++;
          continue;
        }

        if (!email || !email.includes('@') || email.length < 5) {
          skipped++;
          continue;
        }

        // Verificăm dacă există deja
        const existing = await db.query(
          'SELECT id FROM sales_leads WHERE email = $1 OR (LOWER(company_name) = LOWER($2) AND LOWER(city) = LOWER($3))',
          [email, rawName, city]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        const targetLang = detectLeadLanguage(city, country, address);
        const pitch = generateFallbackPitch({
          companyName: rawName,
          industry,
          city,
          pitchFocus: 'pontaj_digital',
          language: targetLang
        });

        await db.query(`
          INSERT INTO sales_leads (
            campaign_id, company_name, city, country, address, website, email, phone, industry,
            ai_hook, draft_subject, draft_body, language, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending_review', NOW(), NOW())
        `, [
          campaignId, rawName, city, country, address, website, email, phone, industry,
          pitch.aiHook, pitch.subject, pitch.body, targetLang
        ]);

        imported++;
      } catch (err) {
        errors.push(err.message);
      }
    }

    return { success: true, imported, skipped, errorsCount: errors.length };
  },

  generateFallbackPitch,
  generateClaudePitch,
  detectLeadLanguage
};

module.exports = harveyService;
