import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Check, X, FileText, Lock } from 'lucide-react';
import { useLanguage } from '../utils/i18n.jsx';

const GDPR_LABELS = {
  ro: {
    ariaLabel: 'Notă de informare GDPR și protecția datelor',
    bannerTitle: 'Protecția Datelor & Art. 119',
    bannerText: 'Evidența timpului de muncă conform RGPD (UE 2016/679) & Codul Muncii.',
    details: 'Detalii',
    ok: 'Am înțeles',
    modalTitle: 'Notă de Informare — Prelucrarea Datelor',
    modalSub: 'Conformitate RGPD (UE 2016/679) • Art. 119 Codul Muncii',
    legalBasis: 'Temei Legal Obligatoriu',
    legalPre: 'Conform ',
    legalStrong: 'Art. 119 din Legea nr. 53/2003 (Codul Muncii)',
    legalPost: ', angajatorul are obligația legală de a ține evidența orelor de muncă prestate zilnic de fiecare salariat.',
    h1: '1. Operatorul de Date',
    p1a: 'Datele sunt prelucrate de către angajatorul dumneavoastră (în calitate de ',
    p1b: 'Operator',
    p1c: ') prin intermediul platformei QR Pontaj (în calitate de ',
    p1d: 'Persoană Împuternicită',
    p1e: '), exclusiv în scopul gestionării raporturilor de muncă și a pontajului.',
    h2: '2. Categorii de Date Prelucrate',
    p2: 'Nume, prenume, cod de angajat, ora exactă a scanărilor (intrare/ieșire), punctul de lucru și date tehnice de securitate a sesiunii (adresă IP, identificator kiosk).',
    h3: '3. Scopul și Temeiul Juridic',
    p3a: 'Prelucrarea se efectuează în baza ',
    p3b: 'Art. 6 alin. (1) lit. (c) din RGPD',
    p3c: ' (obligație legală Codul Muncii) și ',
    p3d: 'Art. 6 alin. (1) lit. (f)',
    p3e: ' (interesul legitim al angajatorului pentru securitatea muncii și prevenirea fraudelor).',
    h4: '4. Perioada de Stocare',
    p4: 'Înregistrările de pontaj sunt păstrate conform termenelor legale aplicabile documentelor de evidență a muncii pentru controalele ITM.',
    h5: '5. Drepturile Persoanelor Vizate',
    p5a: 'Beneficiați de dreptul de acces (Art. 15), rectificare (Art. 16), restricționare (Art. 18) și dreptul de a depune plângere la ',
    p5b: 'ANSPDCP',
    p5c: ' (www.dataprotection.ro).',
    footer: 'Conformitate legislativă România'
  },
  en: {
    ariaLabel: 'GDPR information notice and data protection',
    bannerTitle: 'Data Protection & Art. 119',
    bannerText: 'Working time records in line with GDPR (EU 2016/679) & the Romanian Labour Code.',
    details: 'Details',
    ok: 'Got it',
    modalTitle: 'Information Notice — Data Processing',
    modalSub: 'GDPR compliance (EU 2016/679) • Art. 119 Labour Code',
    legalBasis: 'Mandatory Legal Basis',
    legalPre: 'Under ',
    legalStrong: 'Art. 119 of Law no. 53/2003 (Labour Code)',
    legalPost: ', the employer has a legal obligation to keep a record of the hours worked daily by each employee.',
    h1: '1. Data Controller',
    p1a: 'The data is processed by your employer (as ',
    p1b: 'Controller',
    p1c: ') through the QR Pontaj platform (as ',
    p1d: 'Processor',
    p1e: '), exclusively for managing employment relations and time tracking.',
    h2: '2. Categories of Data Processed',
    p2: 'First name, last name, employee code, exact time of scans (check-in/check-out), work site and technical session security data (IP address, kiosk identifier).',
    h3: '3. Purpose and Legal Basis',
    p3a: 'Processing is carried out under ',
    p3b: 'Art. 6(1)(c) GDPR',
    p3c: ' (legal obligation under the Labour Code) and ',
    p3d: 'Art. 6(1)(f)',
    p3e: " (the employer's legitimate interest in workplace security and fraud prevention).",
    h4: '4. Retention Period',
    p4: 'Time records are kept for the legal periods applicable to labour record documents for labour inspectorate (ITM) checks.',
    h5: '5. Data Subject Rights',
    p5a: 'You have the right of access (Art. 15), rectification (Art. 16), restriction (Art. 18) and the right to lodge a complaint with ',
    p5b: 'ANSPDCP',
    p5c: ' (www.dataprotection.ro).',
    footer: 'Romanian legislative compliance'
  },
  fr: {
    ariaLabel: 'Note d\'information RGPD et protection des données',
    bannerTitle: 'Protection des données & Art. 119',
    bannerText: 'Suivi du temps de travail conformément au RGPD (UE 2016/679) et au Code du travail roumain.',
    details: 'Détails',
    ok: 'Compris',
    modalTitle: 'Note d\'information — Traitement des données',
    modalSub: 'Conformité RGPD (UE 2016/679) • Art. 119 Code du travail',
    legalBasis: 'Base légale obligatoire',
    legalPre: 'Conformément à l\'',
    legalStrong: 'Art. 119 de la loi n° 53/2003 (Code du travail)',
    legalPost: ', l\'employeur a l\'obligation légale de tenir un registre des heures de travail effectuées chaque jour par chaque salarié.',
    h1: '1. Responsable du traitement',
    p1a: 'Les données sont traitées par votre employeur (en qualité de ',
    p1b: 'Responsable du traitement',
    p1c: ') via la plateforme QR Pontaj (en qualité de ',
    p1d: 'Sous-traitant',
    p1e: '), exclusivement pour la gestion des relations de travail et du pointage.',
    h2: '2. Catégories de données traitées',
    p2: 'Nom, prénom, code employé, heure exacte des scans (entrée/sortie), lieu de travail et données techniques de sécurité de la session (adresse IP, identifiant du kiosque).',
    h3: '3. Finalité et base juridique',
    p3a: 'Le traitement est effectué sur la base de l\'',
    p3b: 'art. 6, par. 1, point c) du RGPD',
    p3c: ' (obligation légale du Code du travail) et de l\'',
    p3d: 'art. 6, par. 1, point f)',
    p3e: ' (intérêt légitime de l\'employeur pour la sécurité au travail et la prévention de la fraude).',
    h4: '4. Durée de conservation',
    p4: 'Les enregistrements de pointage sont conservés selon les délais légaux applicables aux documents de suivi du travail pour les contrôles de l\'inspection du travail (ITM).',
    h5: '5. Droits des personnes concernées',
    p5a: 'Vous disposez d\'un droit d\'accès (art. 15), de rectification (art. 16), de limitation (art. 18) et du droit d\'introduire une réclamation auprès de l\'',
    p5b: 'ANSPDCP',
    p5c: ' (www.dataprotection.ro).',
    footer: 'Conformité législative Roumanie'
  },
  nl: {
    ariaLabel: 'GDPR-informatiebericht en gegevensbescherming',
    bannerTitle: 'Gegevensbescherming & Art. 119',
    bannerText: 'Registratie van werktijd conform de AVG (EU 2016/679) en het Roemeense arbeidswetboek.',
    details: 'Details',
    ok: 'Begrepen',
    modalTitle: 'Informatiebericht — Gegevensverwerking',
    modalSub: 'AVG-naleving (EU 2016/679) • Art. 119 Arbeidswetboek',
    legalBasis: 'Verplichte wettelijke grondslag',
    legalPre: 'Volgens ',
    legalStrong: 'Art. 119 van wet nr. 53/2003 (Arbeidswetboek)',
    legalPost: ' is de werkgever wettelijk verplicht de dagelijks gewerkte uren van elke werknemer bij te houden.',
    h1: '1. Verwerkingsverantwoordelijke',
    p1a: 'De gegevens worden verwerkt door uw werkgever (als ',
    p1b: 'Verwerkingsverantwoordelijke',
    p1c: ') via het platform QR Pontaj (als ',
    p1d: 'Verwerker',
    p1e: '), uitsluitend voor het beheer van arbeidsverhoudingen en tijdregistratie.',
    h2: '2. Categorieën verwerkte gegevens',
    p2: 'Voornaam, achternaam, werknemerscode, exact tijdstip van scans (in-/uitklokken), werkplek en technische beveiligingsgegevens van de sessie (IP-adres, kioskidentificatie).',
    h3: '3. Doel en rechtsgrond',
    p3a: 'De verwerking vindt plaats op grond van ',
    p3b: 'Art. 6 lid 1 sub c AVG',
    p3c: ' (wettelijke verplichting uit het arbeidswetboek) en ',
    p3d: 'Art. 6 lid 1 sub f',
    p3e: ' (gerechtvaardigd belang van de werkgever voor veiligheid op het werk en fraudepreventie).',
    h4: '4. Bewaartermijn',
    p4: 'Tijdregistraties worden bewaard volgens de wettelijke termijnen voor arbeidsdocumenten, voor controles door de arbeidsinspectie (ITM).',
    h5: '5. Rechten van betrokkenen',
    p5a: 'U heeft recht op inzage (Art. 15), rectificatie (Art. 16), beperking (Art. 18) en het recht om een klacht in te dienen bij ',
    p5b: 'ANSPDCP',
    p5c: ' (www.dataprotection.ro).',
    footer: 'Roemeense wettelijke naleving'
  }
};

export default function GdprConsentBanner() {
  const location = useLocation();
  const { language } = useLanguage();
  const G = GDPR_LABELS[language] || GDPR_LABELS.ro;
  const [acknowledged, setAcknowledged] = useState(() => {
    try {
      return localStorage.getItem('qrp_gdpr_acknowledged') === 'true';
    } catch {
      return false;
    }
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const isAck = localStorage.getItem('qrp_gdpr_acknowledged') === 'true';
      setAcknowledged(isAck);
    } catch {}

    const handleOpen = () => setShowModal(true);
    window.addEventListener('open-gdpr-modal', handleOpen);
    return () => window.removeEventListener('open-gdpr-modal', handleOpen);
  }, []);

  // Pe tablete Kiosk (/kiosk/*) nu afișăm bannerul pentru a păstra ecranul 100% curat și rapid
  if (location.pathname.startsWith('/kiosk')) {
    return null;
  }

  const handleAcknowledge = () => {
    try {
      localStorage.setItem('qrp_gdpr_acknowledged', 'true');
    } catch {}
    setAcknowledged(true);
    setShowModal(false);
  };

  return (
    <>
      {/* 1. Banner plutitor discret, compact în colțul din dreapta jos (fără containere gigantice) */}
      {!acknowledged && (
        <aside
          role="region"
          aria-label={G.ariaLabel}
          className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="max-w-sm sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-3 sm:p-3.5 pointer-events-auto text-slate-800 dark:text-slate-100">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                <ShieldCheck size={14} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-slate-900 dark:text-white">
                  {G.bannerTitle}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  {G.bannerText}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="h-7 px-3 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {G.details}
              </button>
              <button
                type="button"
                onClick={handleAcknowledge}
                className="h-7 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                {G.ok}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Modal compact cu cerințele legale GDPR & Codul Muncii */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {G.modalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {G.modalSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Corp Modal */}
            <div className="p-5 overflow-y-auto space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-800 dark:text-slate-200 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                  <Lock size={12} className="text-emerald-500" />
                  <span>{G.legalBasis}</span>
                </div>
                {G.legalPre}<strong>{G.legalStrong}</strong>{G.legalPost}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  {G.h1}
                </h4>
                <p>
                  {G.p1a}<strong>{G.p1b}</strong>{G.p1c}<strong>{G.p1d}</strong>{G.p1e}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  {G.h2}
                </h4>
                <p>
                  {G.p2}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  {G.h3}
                </h4>
                <p>
                  {G.p3a}<strong>{G.p3b}</strong>{G.p3c}<strong>{G.p3d}</strong>{G.p3e}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  {G.h4}
                </h4>
                <p>
                  {G.p4}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  {G.h5}
                </h4>
                <p>
                  {G.p5a}<strong>{G.p5b}</strong>{G.p5c}
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 font-medium">
                {G.footer}
              </span>
              <button
                type="button"
                onClick={handleAcknowledge}
                className="h-8 px-5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                {G.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
