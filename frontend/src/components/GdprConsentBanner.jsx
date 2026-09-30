import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Check, X, FileText, Lock } from 'lucide-react';

export default function GdprConsentBanner() {
  const location = useLocation();
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
          aria-label="Notă de informare GDPR și protecția datelor"
          className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="max-w-sm sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-3 sm:p-3.5 pointer-events-auto text-slate-800 dark:text-slate-100">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                <ShieldCheck size={14} className="text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-slate-900 dark:text-white">
                  Protecția Datelor & Art. 119
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Evidența timpului de muncă conform RGPD (UE 2016/679) & Codul Muncii.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="h-7 px-3 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Detalii
              </button>
              <button
                type="button"
                onClick={handleAcknowledge}
                className="h-7 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                Am înțeles
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
                    Notă de Informare — Prelucrarea Datelor
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Conformitate RGPD (UE 2016/679) &bull; Art. 119 Codul Muncii
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
                  <span>Temei Legal Obligatoriu</span>
                </div>
                Conform <strong>Art. 119 din Legea nr. 53/2003 (Codul Muncii)</strong>, angajatorul are obligația legală de a ține evidența orelor de muncă prestate zilnic de fiecare salariat.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  1. Operatorul de Date
                </h4>
                <p>
                  Datele sunt prelucrate de către angajatorul dumneavoastră (în calitate de <strong>Operator</strong>) prin intermediul platformei QR Pontaj (în calitate de <strong>Persoană Împuternicită</strong>), exclusiv în scopul gestionării raporturilor de muncă și a pontajului.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  2. Categorii de Date Prelucrate
                </h4>
                <p>
                  Nume, prenume, cod de angajat, ora exactă a scanărilor (intrare/ieșire), punctul de lucru și date tehnice de securitate a sesiunii (adresă IP, identificator kiosk).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  3. Scopul și Temeiul Juridic
                </h4>
                <p>
                  Prelucrarea se efectuează în baza <strong>Art. 6 alin. (1) lit. (c) din RGPD</strong> (obligație legală Codul Muncii) și <strong>Art. 6 alin. (1) lit. (f)</strong> (interesul legitim al angajatorului pentru securitatea muncii și prevenirea fraudelor).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  4. Perioada de Stocare
                </h4>
                <p>
                  Înregistrările de pontaj sunt păstrate conform termenelor legale aplicabile documentelor de evidență a muncii pentru controalele ITM.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                  5. Drepturile Persoanelor Vizate
                </h4>
                <p>
                  Beneficiați de dreptul de acces (Art. 15), rectificare (Art. 16), restricționare (Art. 18) și dreptul de a depune plângere la <strong>ANSPDCP</strong> (www.dataprotection.ro).
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 font-medium">
                Conformitate legislativă România
              </span>
              <button
                type="button"
                onClick={handleAcknowledge}
                className="h-8 px-5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                Am înțeles
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
