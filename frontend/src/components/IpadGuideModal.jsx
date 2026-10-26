import React, { useState } from 'react';
import { 
  TabletSmartphone, 
  X, 
  ShieldCheck, 
  Settings, 
  Sun, 
  Power, 
  CheckCircle2, 
  Lock, 
  Copy, 
  Check, 
  Sparkles,
  KeyRound,
  ExternalLink,
  Monitor,
  Smartphone,
  ScanLine,
  Tv,
  CheckCheck
} from 'lucide-react';

export default function IpadGuideModal({ isOpen, onClose, themeColor = '#2563EB', initialTab = 'ipad' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const guideTextIpad = `Setări QR iPad (Acces Ghidat / Guided Access)

Dacă ai un iPad (Pro, Air sau standard), este excelent! Apple oferă nativ funcția Guided Access (Acces Ghidat), care blochează iPad-ul exclusiv pe ecranul de pontaj. Angajații nu pot ieși din pagină, nu pot accesa pozele, emailurile sau alte aplicații.

Pasul 1: Activează funcția din setări
1. Mergi la Settings (Configurări) pe iPad.
2. Caută secțiunea Accessibility (Accesibilitate).
3. Apasă pe Guided Access (Acces Ghidat) și activează comutatorul (verde).
4. La Passcode Settings (Setări cod), alege un cod PIN de 4 cifre (ex: 1234).

Pasul 2: Setează ecranul să nu se stingă
1. Tot în meniul Guided Access, caută Display Auto-Lock (Auto-blocare ecran).
2. Alege opțiunea Never (Niciodată).

Pasul 3: Blochează ecranul pe QR Pontaj
1. Deschide browserul Safari pe iPad și accesează linkul Kiosk-ului tău.
2. Apasă de 3 ori rapid pe butonul fizic Power (butonul de pornire).
3. În colțul din dreapta sus, apasă pe Start.

Pentru a ieși din modul blocat:
Apasă din nou de 3 ori rapid pe butonul Power, introdu codul PIN și apasă End (Terminare).`;

  const guideTextAndroid = `Setări Tablete Android (Fixare ecran / Pin App)

Pe orice tabletă cu sistem de operare Android (Samsung Galaxy Tab, Lenovo, Xiaomi etc.):

Pasul 1: Activează Fixarea aplicației (Pin App)
1. Intră în Setări (Settings) -> Securitate și confidențialitate (sau Ecran de blocare).
2. Caută 'Fixare aplicație' (App Pinning / Pin Windows) și activează opțiunea.
3. Bifează 'Solicită cod PIN/parolă pentru deblocare'.

Pasul 2: Setează ecranul să rămână aprins
1. În Setări -> Afișaj (Display) -> Oprire ecran (Screen Timeout).
2. Setează la durata maximă (sau conectează tableta la priză și activează 'Rămâi treaz în timpul încărcării' din Opțiuni dezvoltator).

Pasul 3: Fixează browserul pe codul QR
1. Deschide Google Chrome pe tabletă și accesează linkul Kiosk-ului.
2. Deschide meniul cu aplicații recente (Swipe în sus sau tasta cu 3 linii).
3. Apasă pe iconița browserului Chrome de deasupra ferestrei și alege 'Fixează această aplicație' (Pin this app).`;

  const guideTextTv = `Setări Smart TV sau PC / Mini PC

Dacă montezi un Smart TV sau un ecran conectat la un mini PC / laptop la intrare:

Pasul 1: Deschide browserul integrat pe TV
1. Deschide aplicația Web Browser (pe LG WebOS, Samsung Tizen sau Android TV).
2. Tastează linkul Kiosk-ului tău (sau scanează codul de trimitere pe mobil).

Pasul 2: Ecran complet (Full Screen)
1. Apasă pe butonul de Fullscreen din bara browserului TV sau tasta F11 pe tastatură.
2. Asigură-te că TV-ul nu are activat sleep timer automat (Standby eco).`;

  const guideTextEmployee = `Cum se pontează angajații (Fără nicio aplicație instalată)

1. Angajatul deschide camera nativă foto a telefonului personal (iPhone sau Android).
2. Îndreaptă camera către codul QR dinamic de pe ecranul tabletei.
3. Pe ecranul telefonului apare un link web; apasă pe el.
4. Apasă pe 'Pontaj Sosire' (la venire) sau 'Pontaj Plecare' (la plecare).
5. Pontajul este salvat instant cu timestamp și verificare de geolocație GPS!

Dacă un angajat nu are telefonul la el:
Poate folosi butonul 'Pontaj cu PIN' direct pe ecranul tabletei.`;

  const handleCopyCurrent = () => {
    let text = guideTextIpad;
    if (activeTab === 'android') text = guideTextAndroid;
    if (activeTab === 'tv') text = guideTextTv;
    if (activeTab === 'employee') text = guideTextEmployee;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20"
              style={{ backgroundColor: themeColor }}
            >
              <TabletSmartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  Ghid Complet Kiosk & Tabletă
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Cum se folosește ecranul de pontaj
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Închide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('ipad')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'ipad'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TabletSmartphone size={14} className="text-blue-500" />
            <span>Apple iPad (Guided Access)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone size={14} className="text-emerald-500" />
            <span>Tablete Android (Pin App)</span>
          </button>

          <button
            onClick={() => setActiveTab('tv')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'tv'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tv size={14} className="text-purple-500" />
            <span>Smart TV & PC (Fullscreen)</span>
          </button>

          <button
            onClick={() => setActiveTab('employee')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'employee'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ScanLine size={14} className="text-amber-500" />
            <span>Cum scanează angajații</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-slate-700 dark:text-slate-300 text-sm">

          {/* TAB 1: APPLE IPAD */}
          {activeTab === 'ipad' && (
            <>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white dark:from-slate-800 dark:via-slate-800/70 dark:to-slate-900 p-5 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Ai un iPad montat pe perete sau pe recepție?
                    </h4>
                    <p className="leading-relaxed">
                      Este soluția recomandată! Apple oferă nativ funcția <strong className="text-slate-900 dark:text-white">Guided Access (Acces Ghidat)</strong>, care „îngheață” ecranul pe aplicația de pontaj. Angajații nu pot ieși în ecranul principal, nu pot umbla în poze sau setări.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>Configurare iPad în 3 pași rapizi</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </h4>

                {/* Pasul 1 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                      1
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Settings size={16} className="text-blue-500" />
                      Activează Acces Ghidat din Configurări
                    </h5>
                  </div>
                  <div className="space-y-2 pl-10 text-xs sm:text-sm">
                    <p>1. Pe iPad, mergi la <strong className="text-slate-900 dark:text-white">Configurări (Settings)</strong> → <strong className="text-slate-900 dark:text-white">Accesibilitate (Accessibility)</strong>.</p>
                    <p>2. Derulează până jos la <strong className="text-slate-900 dark:text-white">Acces Ghidat (Guided Access)</strong> și activează comutatorul verde.</p>
                    <p>3. Apasă pe <strong className="text-slate-900 dark:text-white">Setări cod de acces</strong> și alege un cod PIN din 4 cifre pe care îl ții minte.</p>
                  </div>
                </div>

                {/* Pasul 2 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                      2
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sun size={16} className="text-amber-500" />
                      Setează ecranul să rămână aprins permanent
                    </h5>
                  </div>
                  <div className="space-y-2 pl-10 text-xs sm:text-sm">
                    <p>În același meniu Acces Ghidat, setează opțiunea <strong className="text-slate-900 dark:text-white">Auto-blocare ecran (Display Auto-Lock)</strong> pe <strong className="text-blue-600 dark:text-blue-400 font-bold">Niciodată (Never)</strong>.</p>
                  </div>
                </div>

                {/* Pasul 3 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                      3
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Power size={16} className="text-emerald-500" />
                      Blochează iPad-ul pe pagina de pontaj
                    </h5>
                  </div>
                  <div className="space-y-2 pl-10 text-xs sm:text-sm">
                    <p>1. Deschide browserul <strong className="text-slate-900 dark:text-white">Safari</strong> și accesează linkul Kiosk-ului tău.</p>
                    <p>2. Apasă <strong className="text-slate-900 dark:text-white">de 3 ori rapid pe butonul fizic Power (pornire)</strong>.</p>
                    <p>3. Apasă pe <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Start</strong> în colțul din dreapta sus.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong>Cum deblochezi iPad-ul când vrei să ieși:</strong> Apasă din nou de 3 ori rapid pe butonul Power, introdu codul PIN stabilit și apasă <strong>„Terminare” (End)</strong> în stânga sus.
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ANDROID TABLETS */}
          {activeTab === 'android' && (
            <>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-slate-800 dark:via-slate-800/70 dark:to-slate-900 p-5 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Folosești o tabletă Samsung, Lenovo sau Xiaomi cu Android?
                    </h4>
                    <p className="leading-relaxed">
                      Android are funcția nativă <strong className="text-slate-900 dark:text-white">Fixare aplicație (App Pinning)</strong>, care previne închiderea browserului sau părăsirea paginii de pontaj fără codul PIN al administratorului.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>Configurare Android în 3 pași</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                </h4>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">1</span>
                    <h5 className="font-bold text-slate-900 dark:text-white">Activează Fixarea aplicațiilor (App Pinning)</h5>
                  </div>
                  <div className="space-y-2 pl-10 text-xs sm:text-sm">
                    <p>1. Deschide <strong className="text-slate-900 dark:text-white">Setări (Settings)</strong> pe tabletă.</p>
                    <p>2. Caută la <strong className="text-slate-900 dark:text-white">Securitate și date confidențiale</strong> → <strong className="text-slate-900 dark:text-white">Alte setări de securitate</strong>.</p>
                    <p>3. Activează opțiunea <strong className="text-slate-900 dark:text-white">Fixare aplicație (Pin App / Pin Windows)</strong> și asigură-te că este bifată cererea de PIN la deblocare.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">2</span>
                    <h5 className="font-bold text-slate-900 dark:text-white">Deschide codul QR în Google Chrome</h5>
                  </div>
                  <div className="space-y-2 pl-10 text-xs sm:text-sm">
                    <p>Deschide browserul Google Chrome pe tabletă și accesează linkul Kiosk-ului tău.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">3</span>
                    <h5 className="font-bold text-slate-900 dark:text-white">Fixează fereastra</h5>
                  </div>
                  <div className="space-y-2 pl-10 text-xs sm:text-sm">
                    <p>1. Deschide lista de aplicații recente (glisare de jos sau tasta cu 3 linii).</p>
                    <p>2. Apasă pe pictograma rotundă Chrome de deasupra ferestrei și alege <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Fixează această aplicație (Pin)</strong>.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: SMART TV & PC */}
          {activeTab === 'tv' && (
            <>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white dark:from-slate-800 dark:via-slate-800/70 dark:to-slate-900 p-5 border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/10 dark:bg-purple-400/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Tv size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Afișare pe Smart TV sau Ecran Mare de Recepție
                    </h4>
                    <p className="leading-relaxed">
                      Poți folosi orice Smart TV conectat la Wi-Fi (LG WebOS, Samsung Tizen, Android TV) sau un televizor legat printr-un cablu HDMI la un mini PC / laptop.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2 text-xs sm:text-sm">
                  <h5 className="font-bold text-slate-900 dark:text-white">Cum se activează pe Smart TV:</h5>
                  <p>1. Deschide aplicația <strong className="text-slate-900 dark:text-white">Web Browser</strong> pe televizor.</p>
                  <p>2. Introdu linkul Kiosk-ului tău QR Pontaj.</p>
                  <p>3. Apasă pe pictograma de <strong className="text-purple-600 dark:text-purple-400 font-bold">Ecran Complet (Fullscreen)</strong> din bara browserului.</p>
                  <p>4. Dezactivează funcțiile de economisire energie (Eco Standby) din meniul televizorului pentru a evita intrarea în repaus.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2 text-xs sm:text-sm">
                  <h5 className="font-bold text-slate-900 dark:text-white">Cum se activează pe PC / Laptop:</h5>
                  <p>Deschide linkul în Chrome sau Edge și apasă tasta <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">F11</strong> pentru Full Screen fără bare de navigare.</p>
                </div>
              </div>
            </>
          )}

          {/* TAB 4: CUM SCANEAZĂ ANGAJAȚII */}
          {activeTab === 'employee' && (
            <>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white dark:from-slate-800 dark:via-slate-800/70 dark:to-slate-900 p-5 border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-600/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ScanLine size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Zero aplicații de instalat pentru angajați
                    </h4>
                    <p className="leading-relaxed">
                      Angajații folosesc exclusiv <strong className="text-slate-900 dark:text-white">camera foto standard a telefonului</strong>. Nu este nevoie să descarce nimic din App Store sau Google Play.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <Smartphone size={16} /> Fluxul normal cu telefonul
                  </div>
                  <p>1. Angajatul deschide camera foto a telefonului.</p>
                  <p>2. Îndreaptă camera spre codul QR de pe tabletă.</p>
                  <p>3. Apasă pe linkul galben apărut pe ecran.</p>
                  <p>4. Apasă „Pontaj Sosire” sau „Pontaj Plecare”.</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">Gata! Ora și locația sunt salvate instant.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <KeyRound size={16} /> Fără telefon? (Pontaj cu PIN)
                  </div>
                  <p>Dacă un angajat nu are telefonul sau are bateria descărcată:</p>
                  <p>1. Apasă pe butonul <strong className="text-slate-900 dark:text-white">„Pontaj cu PIN”</strong> direct pe ecranul tabletei.</p>
                  <p>2. Angajatul își introduce codul PIN alocat.</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">Pontajul se înregistrează imediat fără telefon.</p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <button
            onClick={handleCopyCurrent}
            className="flex items-center gap-2 px-4 h-10 text-xs font-bold rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <CheckCheck size={15} className="text-emerald-500 shrink-0" />
                <span className="whitespace-nowrap shrink-0">Copiat în clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={15} className="text-slate-400 shrink-0" />
                <span className="whitespace-nowrap shrink-0">Copiază instrucțiunile</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-6 h-10 text-sm font-bold text-white rounded-full shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            Am înțeles, închide
          </button>
        </div>
      </div>
    </div>
  );
}
