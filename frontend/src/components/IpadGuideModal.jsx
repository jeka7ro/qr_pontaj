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
  ExternalLink
} from 'lucide-react';

export default function IpadGuideModal({ isOpen, onClose, themeColor = '#2563EB' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const guideText = `Setări QR iPad (Acces Ghidat)

Dacă ai deja un iPad Pro, este absolut perfect și nu mai are rost să cumperi altă tabletă! Ecranele de la iPad Pro sunt excepționale, iar Apple are o funcție specială (deja instalată) construită exact pentru acest lucru.

Funcția se numește Guided Access (Acces Ghidat). Ea "blochează" iPad-ul într-o singură aplicație (în cazul tău, pe pagina web cu codul QR).
Angajații nu vor putea ieși din acea pagină pentru a-ți vedea pozele, email-urile sau contul de iCloud, indiferent pe ce butoane apasă. Doar tu poți debloca tableta cu un cod PIN pe care îl știi doar tu.

Iată cum o setezi în 3 pași simpli:

Pasul 1: Activează funcția din setări
1. Mergi la Settings (Configurări) pe iPad.
2. Caută secțiunea Accessibility (Accesibilitate).
3. Derulează până jos și apasă pe Guided Access (Acces Ghidat) și activează bifând butonul (să se facă verde).
4. Tot acolo, apasă pe Passcode Settings (Setări cod de acces) -> Set Guided Access Passcode (Setați codul) și alege un cod PIN din 4 cifre (ex: 1234). Memorează acest cod, pentru că vei avea nevoie de el să deblochezi ecranul mai târziu.

Pasul 2: Setează ecranul să nu se stingă
1. Rămâi pe ecranul cu Guided Access din Setări.
2. Mai jos, vei vedea opțiunea Display Auto-Lock (Auto-blocare ecran).
3. Setează pe Never (Niciodată). (Astfel, cât timp iPad-ul e blocat pe QR, ecranul nu se va stinge).

Pasul 3: Blochează ecranul pe aplicația de Pontaj
1. Deschide browserul (Safari sau Chrome) și accesează linkul cu codul QR.
2. Apasă de 3 ori foarte rapid pe butonul de Power (butonul de pornire de sus).
3. Îți va apărea un meniu pe ecran. Apasă pe Start în colțul din dreapta sus.

Gata! 🚀 Acum iPad-ul este complet "înghețat" pe acea pagină. Angajații pot doar să scaneze codul QR. Dacă încearcă să gliseze în sus sau să apese pe butonul de power ca să iasă pe ecranul principal, iPad-ul va cere codul tău PIN.

Cum ieși din acest mod:
Apasă iar de 3 ori rapid pe butonul de Power, introdu codul PIN stabilit și dă "End" (Terminare) în stânga sus.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(guideText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
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
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                  Apple iPad • Guided Access
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Setări QR iPad (Acces Ghidat)
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-slate-700 dark:text-slate-300 text-sm">

          {/* Intro Box */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white dark:from-slate-800 dark:via-slate-800/70 dark:to-slate-900 p-5 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={20} />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Ai deja un iPad Pro sau alt model iPad?
                </h4>
                <p className="leading-relaxed">
                  Este <strong className="text-slate-900 dark:text-white">absolut perfect</strong> și nu mai are rost să cumperi altă tabletă! Ecranele de la iPad Pro sunt excepționale, iar Apple are o funcție specială (deja instalată în sistem) construită exact pentru acest lucru.
                </p>
                <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-blue-100/80 dark:border-slate-700/60 space-y-1.5">
                  <div className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Ce face funcția Guided Access (Acces Ghidat)?
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Ea <strong className="text-slate-800 dark:text-slate-200">"blochează" iPad-ul într-o singură aplicație</strong> (pe pagina web cu codul QR). Angajații <strong>nu vor putea ieși din acea pagină</strong> pentru a-ți vedea pozele, email-urile sau contul de iCloud, indiferent pe ce butoane apasă. Doar tu poți debloca tableta cu un cod PIN pe care îl știi doar tu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Configurare în 3 pași simpli</span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </h4>

            {/* Pasul 1 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  1
                </span>
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings size={16} className="text-blue-500" />
                  Pasul 1: Activează funcția din setări
                </h5>
              </div>

              <div className="space-y-2.5 pl-10 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">1.</span>
                  <span>Mergi la <strong className="text-slate-900 dark:text-white">Settings (Configurări)</strong> pe iPad.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">2.</span>
                  <span>Caută secțiunea <strong className="text-slate-900 dark:text-white">Accessibility (Accesibilitate)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">3.</span>
                  <span>
                    Derulează până jos și apasă pe <strong className="text-slate-900 dark:text-white">Guided Access (Acces Ghidat)</strong> și activează comutatorul (să se facă verde).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">4.</span>
                  <span>
                    Tot acolo, apasă pe <strong className="text-slate-900 dark:text-white">Passcode Settings (Setări cod de acces)</strong> ➔ <strong className="text-slate-900 dark:text-white">Set Guided Access Passcode (Setați codul)</strong> și alege un cod PIN din 4 cifre (ex: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400">1234</code>).
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 mt-1">
                  <KeyRound size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <span><strong>Important:</strong> Memorează acest cod PIN! Vei avea nevoie de el de fiecare dată când vrei să deblochezi ecranul.</span>
                </div>
              </div>
            </div>

            {/* Pasul 2 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  2
                </span>
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sun size={16} className="text-amber-500" />
                  Pasul 2: Setează ecranul să nu se stingă
                </h5>
              </div>

              <div className="space-y-2.5 pl-10 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">1.</span>
                  <span>Rămâi pe ecranul cu <strong className="text-slate-900 dark:text-white">Guided Access</strong> din Setări.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">2.</span>
                  <span>Mai jos, vei vedea opțiunea <strong className="text-slate-900 dark:text-white">Display Auto-Lock (Auto-blocare ecran)</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">3.</span>
                  <span>
                    Setează pe <strong className="text-blue-600 dark:text-blue-400 font-bold">Never (Niciodată)</strong>. Astfel, cât timp iPad-ul e blocat pe codul QR, ecranul va rămâne pornit permanent pentru angajați.
                  </span>
                </div>
              </div>
            </div>

            {/* Pasul 3 */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  3
                </span>
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Power size={16} className="text-emerald-500" />
                  Pasul 3: Blochează ecranul pe aplicația de Pontaj
                </h5>
              </div>

              <div className="space-y-2.5 pl-10 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">1.</span>
                  <span>Deschide browserul (<strong className="text-slate-900 dark:text-white">Safari</strong> sau <strong className="text-slate-900 dark:text-white">Chrome</strong> pe iPad) și accesează linkul Kiosk cu codul QR.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">2.</span>
                  <span>
                    <strong className="text-slate-900 dark:text-white">Apasă de 3 ori foarte rapid</strong> pe butonul de <strong className="text-slate-900 dark:text-white">Power</strong> (butonul fizic de pornire de sus/lateral).
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-400 dark:text-slate-500">3.</span>
                  <span>
                    Îți va apărea un meniu pe tot ecranul. Apasă pe <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Start</strong> în colțul din dreapta sus.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Success Callout */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h5 className="font-black text-emerald-900 dark:text-emerald-100 text-sm">Gata! 🚀 iPad-ul este securizat</h5>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                Acum iPad-ul este complet "înghețat" pe acea pagină. Angajații pot doar să scaneze codul QR. Dacă încearcă să gliseze în sus sau să apese pe butonul de power ca să iasă pe ecranul principal, iPad-ul va cere codul tău PIN.
              </p>
            </div>
          </div>

          {/* Exit info */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
              <Lock size={16} />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Cum ieși din acest mod și folosești iPad-ul normal?
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Apasă iar <strong>de 3 ori rapid pe butonul de Power</strong>, introdu codul PIN stabilit la Pasul 1 și apasă pe <strong>"End" (Terminare)</strong> în colțul din stânga sus.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 h-10 text-xs font-bold rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-500" />
                <span>Copiat în clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={15} className="text-slate-400" />
                <span>Copiază Ghidul Text</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-6 h-10 text-sm font-bold text-white rounded-full shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: themeColor }}
          >
            Am înțeles, închide
          </button>
        </div>
      </div>
    </div>
  );
}
