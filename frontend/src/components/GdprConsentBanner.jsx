import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Check, X, FileText, Lock } from 'lucide-react';

export default function GdprConsentBanner() {
  const location = useLocation();
  const [acknowledged, setAcknowledged] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isAck = localStorage.getItem('qrp_gdpr_acknowledged') === 'true';
    setAcknowledged(isAck);

    const handleOpen = () => setShowModal(true);
    window.addEventListener('open-gdpr-modal', handleOpen);
    return () => window.removeEventListener('open-gdpr-modal', handleOpen);
  }, []);

  // Pe tablete Kiosk (/kiosk/*) nu afișăm bannerul pentru a păstra ecranul 100% curat și rapid
  if (location.pathname.startsWith('/kiosk')) {
    return null;
  }

  const handleAcknowledge = () => {
    localStorage.setItem('qrp_gdpr_acknowledged', 'true');
    setAcknowledged(true);
    setShowModal(false);
  };

  return (
    <>
      {/* 1. Banner plutitor fix în partea de jos a ecranului cu containere rotunjite (rounded-3xl) și butoane pill (rounded-full) */}
      {!acknowledged && (
        <aside
          role="region"
          aria-label="Notă de informare GDPR și protecția datelor"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="max-w-5xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-900/15 dark:shadow-black/60 p-5 sm:p-6 pointer-events-auto flex flex-col md:flex-row md:items-center justify-between gap-5 text-slate-800 dark:text-slate-100">
            
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50 shadow-xs">
                <ShieldCheck size={24} />
              </div>
              <div className="text-xs sm:text-sm leading-relaxed">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                    Notă de Informare privind Protecția Datelor (GDPR)
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    Art. 119 Codul Muncii
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Această platformă prelucrează datele cu caracter personal necesare evidenței orelor de muncă conform{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">Art. 119 din Codul Muncii</strong>,{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">Regulamentului (UE) 2016/679 (GDPR)</strong> și{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">Legii nr. 190/2018</strong>. Utilizăm cookie-uri tehnice esențiale pentru securitatea sesiunii.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex-1 md:flex-initial h-11 px-5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <FileText size={15} />
                <span>Detalii & Drepturi</span>
              </button>

              <button
                type="button"
                onClick={handleAcknowledge}
                className="flex-1 md:flex-initial h-11 px-6 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>Am luat la cunoștință</span>
              </button>
            </div>

          </div>
        </aside>
      )}

      {/* 2. Modal detaliat cu toate cerințele legale GDPR & Codul Muncii */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Notă de Informare privind Prelucrarea Datelor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Conformitate RGPD (UE 2016/679) &bull; Legea 190/2018 &bull; Art. 119 Codul Muncii
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corp Modal */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 rounded-2xl text-blue-900 dark:text-blue-200">
                <div className="font-bold flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  <Lock size={14} />
                  <span>Temei Legal Obligatoriu</span>
                </div>
                Conform <strong>Art. 119 din Legea nr. 53/2003 (Codul Muncii)</strong>, angajatorul are obligația legală de a ține la locul de muncă evidența orelor de muncă prestate zilnic de fiecare salariat, cu evidențierea orelor de începere și de sfârșit ale programului de lucru.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                  1. Operatorul de Date
                </h4>
                <p>
                  Datele sunt prelucrate de către angajatorul dumneavoastră (în calitate de <strong>Operator</strong>) prin intermediul platformei QR Pontaj (în calitate de <strong>Persoană Împuternicită</strong>), exclusiv în scopul gestionării raporturilor de muncă și a pontajului.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                  2. Categorii de Date Prelucrate
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Nume, prenume, cod de angajat și funcția ocupată.</li>
                  <li>Data, ora exactă a scanării (intrare/ieșire) și locația punctului de lucru.</li>
                  <li>Informații tehnice de securitate: adresă IP la pontaj, identificator dispozitiv kiosk, jurnal tranzacție.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                  3. Scopurile și Temeiurile Juridice (Art. 6 RGPD)
                </h4>
                <p>
                  Prelucrarea se efectuează în baza <strong>Art. 6 alin. (1) lit. (c) din RGPD</strong> (îndeplinirea unei obligații legale a angajatorului prevăzută de Codul Muncii) și <strong>Art. 6 alin. (1) lit. (f)</strong> (interesul legitim al angajatorului de securitate a muncii și prevenire a fraudelor la pontaj).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                  4. Perioada de Stocare
                </h4>
                <p>
                  Înregistrările de pontaj și condicile de prezență sunt păstrate conform termenelor legale aplicabile documentelor de evidență a muncii și cerințelor de control ale Inspecției Muncii (ITM).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1.5">
                  5. Drepturile Dumneavoastră (Art. 15-22 RGPD)
                </h4>
                <p>
                  În calitate de persoană vizată, beneficiați de dreptul de acces la datele proprii de pontaj, dreptul la rectificare (prin raportare la departamentul HR), dreptul la restricționarea prelucrării și dreptul de a depune o plângere la <strong>ANSPDCP</strong> (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal, www.dataprotection.ro).
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-medium text-center sm:text-left">
                Document actualizat conform legislației muncii din România.
              </span>
              <button
                type="button"
                onClick={handleAcknowledge}
                className="w-full sm:w-auto h-11 px-7 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>Am luat la cunoștință</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
