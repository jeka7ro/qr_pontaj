import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Clock, MapPin, ShieldCheck, ChevronRight, X, Lock, FileText, CreditCard } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../utils/i18n.jsx';
import SelfServiceSubscribeModal from '../components/SelfServiceSubscribeModal';

export default function LandingPage() {
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900 transition-colors">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600">
            <QrCode size={32} strokeWidth={2.5} />
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">GetApp Smart QR</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button 
              type="button"
              onClick={() => setShowGdprModal(true)} 
              className="px-4 h-10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="hidden sm:inline">{t('gdprLegal')}</span>
            </button>
            <button 
              type="button"
              onClick={() => setShowSubscribeModal(true)}
              className="px-4 h-10 text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800 transition-colors flex items-center gap-1.5 rounded-full cursor-pointer"
            >
              <CreditCard size={14} />
              <span>Abonament (€9.90/angajat)</span>
            </button>
            <Link 
              to="/admin/login" 
              className="px-4 sm:px-5 h-10 text-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('login')}
            </Link>
            <Link 
              to="/admin/login" 
              className="px-5 sm:px-6 h-10 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-full shadow-lg shadow-primary-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{t('myAccount')}</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 sm:pt-40 sm:pb-24 lg:pb-32 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-8">
            {t('landingTitle')}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            {t('landingSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              type="button"
              onClick={() => setShowSubscribeModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold rounded-full shadow-xl shadow-primary-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard size={20} />
              <span>Comandă Online (Calcul per Angajat)</span>
            </button>
            <Link 
              to="/admin/login" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-base font-bold rounded-full shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {t('enterDashboard')}
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
              <Clock size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('realtimeTitle')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('realtimeDesc')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
              <MapPin size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('gpsTitle')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('gpsDesc')}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('antifraudTitle')}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('antifraudDesc')}
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer discret */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary-600">
            <QrCode size={20} strokeWidth={2.5} />
            <span className="font-extrabold text-slate-900 dark:text-white">QR Pontaj</span>
            <span className="text-slate-400 ml-1">&copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => setShowGdprModal(true)}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Notă GDPR & Art. 119
            </button>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <button
              type="button"
              onClick={() => setShowGdprModal(true)}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Confidențialitate & Securitate
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Notă GDPR & Conformitate Legală */}
      {showGdprModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm select-none animate-in fade-in duration-200 text-left"
          onClick={() => setShowGdprModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Notă de Informare — Protecția Datelor (GDPR)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Regulamentul (UE) 2016/679 &bull; Art. 119 Codul Muncii
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowGdprModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto text-xs text-slate-600 dark:text-slate-300 space-y-3.5 leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-800 dark:text-slate-200 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                  <Lock size={12} className="text-emerald-500" />
                  <span>Temei Legal Obligatoriu</span>
                </div>
                Conform <strong>Art. 119 din Legea nr. 53/2003 (Codul Muncii)</strong> republicată, angajatorul are obligația legală de a ține la locul de muncă evidența orelor de muncă prestate zilnic de fiecare salariat.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                  1. Rolurile privind datele cu caracter personal
                </h4>
                <p>
                  Compania angajatoare acționează în calitate de <strong>Operator de date</strong>, iar platforma <strong>QR Pontaj</strong> acționează în calitate de <strong>Persoană Împuternicită</strong> conform Art. 28 din RGPD, asigurând găzduirea și securitatea tehnică a sistemului de pontaj electronic.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                  2. Scopul prelucrării și temeiurile juridice
                </h4>
                <p className="mb-2">
                  • <strong>Obligație legală (Art. 6 alin. 1 lit. c din RGPD):</strong> Întocmirea foilor colective de prezență, pontajul zilnic și generarea documentelor justificative de muncă pentru controlul Inspecției Muncii (ITM).
                </p>
                <p>
                  • <strong>Interes legitim (Art. 6 alin. 1 lit. f din RGPD & Legea 190/2018):</strong> Verificarea prezenței la punctul de lucru declarat și securitatea accesului în incintă.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                  3. Datele colectate prin sistemul QR Pontaj
                </h4>
                <p>
                  Numele și prenumele salariatului, codul unic intern de pontaj, data și ora exactă a scanărilor (intrare/ieșire), punctul de lucru (locația fizică), coordonate GPS la scanare (dacă sunt activate pentru validarea perimetrului), adresa IP și identificatorul dispozitivului kiosk.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                  4. Măsuri de securitate și confidențialitate
                </h4>
                <p>
                  Toate transmisiunile de date sunt securizate prin protocoale criptate TLS/HTTPS. Datele fiecărei companii sunt strict izolate (arhitectură multi-tenant), iar parolele și codurile PIN sunt stocate exclusiv sub formă hash securizată.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-1">
                  5. Drepturile persoanelor vizate
                </h4>
                <p>
                  Salariații beneficiază de dreptul de acces la propriile înregistrări de pontaj (prin portalul dedicat angajaților), dreptul de rectificare a erorilor materiale, dreptul la restricționarea prelucrării și dreptul de a depune plângere la <strong>ANSPDCP</strong> (www.dataprotection.ro).
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Conformitate legislativă garantată &bull; QR Pontaj
              </span>
              <button
                type="button"
                onClick={() => setShowGdprModal(false)}
                className="px-5 h-8 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors shadow-xs cursor-pointer shrink-0"
              >
                Am înțeles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Self-Service Abonare Stripe */}
      <SelfServiceSubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
      />
    </div>
  );
}
