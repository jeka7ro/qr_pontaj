import React, { useState } from 'react';
import { 
  Megaphone, 
  Copy, 
  Check, 
  Target, 
  Video, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Building2, 
  Hammer, 
  Calculator, 
  ExternalLink, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

const CAMPAIGNS = [
  {
    id: 'horeca',
    title: 'Campania 1: Restaurante & HORECA',
    subtitle: 'Nivel ridicat de conversie • Amenzi ITM Art. 119 & Export 1-Click SAGA',
    icon: Building2,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    targetAudience: {
      location: 'România (București + Ilfov, Cluj, Timișoara, Brașov, Constanța, Iași, Sibiu, Craiova, Oradea)',
      age: '25 - 58 ani',
      interests: 'Restaurant, Managementul restaurantelor, Ospitalitate, HORECA, Asociația HORA, Antreprenoriat',
      demographics: 'Administratori pagini Facebook de afaceri, Administratori pagini alimentație publică',
      placement: 'Feed Facebook, Feed Instagram, Stories & Reels'
    },
    hook: 'Control ITM vineri seară la ora 22:30? Ospătarii și bucătarii tăi au semnat condica azi?',
    headline: 'Scapă de condica pe hârtie • Export 1-Click în SAGA Salarii',
    description: 'Soluție de pontaj pe tabletă prin cod QR pentru HORECA. Conform Art. 119 Codul Muncii. Test gratuit 10 zile.',
    primaryText: `9 din 10 restaurante din România riscă sancțiuni de până la 10.000 lei conform Art. 119 din Codul Muncii din cauza condicii pe hârtie nesemnate sau completate retroactiv.

Cu QR Pontaj, transformi orice tabletă într-un terminal inteligent la intrarea personalului:
1. Angajații scanează codul QR personal la venire și la plecare în 1 secundă.
2. Condica de prezență este generată automat și în timp real, cu evidență separată pentru ore de noapte și weekend.
3. La final de lună, contabilul descarcă fișierul de import pentru SAGA Salarii într-un singur click.

Fără echipamente scumpe, fără cartele pierdute. Doar 5 € / salariat / lună.
Testează gratuit timp de 10 zile, fără obligații și fără card bancar.`,
    videoScript: [
      { time: '0 - 3s', visual: 'Teanc de foi de pontaj mâzgălite, tăiate cu un simbol de stop roșu.', voice: 'Încă mai aduni foi de pontaj pătate de cafea la sfârșit de lună?' },
      { time: '3 - 8s', visual: 'Ospătarul atinge tableta de la intrare, scanează QR-ul cu telefonul, ecranul confirmă verde.', voice: 'Angajații tăi scanează în 1 secundă. Condica conform Art. 119 este gata la secundă.' },
      { time: '8 - 12s', visual: 'Managerul apasă butonul Export SAGA Salarii în dashboard.', voice: 'La final de lună, exportul intră direct în SAGA Salarii cu 1-Click.' },
      { time: '12 - 15s', visual: 'Ecran final cu tableta Kiosk și oferta 5 € / om / lună.', voice: 'Testează gratuit 10 zile pe qrpontaj.ro. Simplu, legal, rapid.' }
    ]
  },
  {
    id: 'constructii',
    title: 'Campania 2: Firme de Construcții & Șantiere',
    subtitle: 'Echipe mobile • Verificare locație GPS • Fără foi de prezență pierdute',
    icon: Hammer,
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    targetAudience: {
      location: 'România (Toate județele active pe rezidențial și infrastructură)',
      age: '28 - 60 ani',
      interests: 'Construcții, Antreprenor general, Inginer constructor, Dezvoltare imobiliară, Lucrări de instalații',
      demographics: 'Administratori pagini construcții, Directori tehnici, Șefi de șantier',
      placement: 'Feed Facebook, Instagram Feed, Reels'
    },
    hook: 'Știi exact la ce oră a ajuns echipa pe șantier sau încă te bazezi pe ce zice maistrul pe caiet?',
    headline: 'Pontaj Șantiere cu GPS • Fără hârtii și fără erori',
    description: 'Muncitorii scanează pe telefon sau pe tableta din container. Datele ajung instant la birou. Compatibil SAGA.',
    primaryText: `Pe șantier, condica de prezență pe hârtie se pierde, se murdărește sau se semnează retroactiv la final de săptămână. Când vine un control ITM, amenzile sunt usturătoare.

QR Pontaj aduce ordinea pe șantiere:
• Muncitorii se pontează prin cod QR pe propriul smartphone sau pe o tabletă montată în container.
• Fiecare pontare înregistrează automat coordonatele GPS exacte (știi sigur că echipa este pe șantier).
• Datele ajung în timp real la sediu, fără să mai aștepți foile de la maiștri.
• Raport lunar complet cu ore suplimentare și export direct pentru contabilitate (SAGA Salarii).

Cost fix: 5 € / angajat / lună. Testează gratuit 10 zile pe șantierele tale.`,
    videoScript: [
      { time: '0 - 3s', visual: 'Muncitor în echipament de protecție pe șantier la prima oră a dimineții.', voice: 'Știi exact cine a ajuns azi la lucru pe șantier?' },
      { time: '3 - 8s', visual: 'Muncitorul scanează codul QR de pe panoul din container cu telefonul.', voice: 'Fiecare pontare salvează locația GPS și ora exactă. Fără cartele pierdute.' },
      { time: '8 - 12s', visual: 'Inginerul vede pe telefon lista live de prezență pe fiecare șantier.', voice: 'Ai control total în timp real direct din birou.' },
      { time: '12 - 15s', visual: 'Logo QR Pontaj cu textul: 5 € / om / lună • Test gratuit 10 zile.', voice: 'Începe acum fără costuri de instalare pe qrpontaj.ro.' }
    ]
  },
  {
    id: 'contabili',
    title: 'Campania 3: Cabinete de Contabilitate & Experți SAGA',
    subtitle: 'Pilonul 1 Parteneriat • Portal Gratuit Contabili • 20% Comision Recurent Lunar',
    icon: Calculator,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    targetAudience: {
      location: 'România (Național)',
      age: '26 - 65 ani',
      interests: 'Contabilitate, SAGA Software, CECCAR, Salarizare, Resurse Umane, Expert contabil, Fiscalitate',
      demographics: 'Contabili autorizați, Titulari cabinete individuale, Administratori firme contabilitate',
      placement: 'Feed Facebook, Instagram Feed, Desktop & Mobile'
    },
    hook: 'Stimate coleg contabil: De câte ori a trebuit să suni clienții în data de 28 pentru foile de pontaj?',
    headline: 'Portal Gratuit Contabili • Export 1-Click SAGA + 20% Comision Recurent',
    description: 'Elimină introducerea manuală a pontajelor în SAGA. Primești pontajele gata calculate și câștigi 20% lunar pe viață.',
    primaryText: `La fiecare sfârșit de lună, pierzi zeci de ore descifrând foi de pontaj mâzgălite și introducând manual orele de noapte, de weekend și suplimentare în SAGA Salarii.

Lansăm Portalul Gratuit QR Pontaj dedicat Cabinetelor de Contabilitate:
1. Clienții tăi își pontează salariații digital prin QR, iar tu ai acces centralizat la toți clienții.
2. Descarci la 1-Click fișierele de import SAGA (atât pontajul lunar gata calculat, cât și registrul de evenimente).
3. Primești un comision recurent de 20% lunar pe viață pentru fiecare client recomandat (ex: 20 firme cu 15 salariați = 300 € / lună venit pasiv).

Fără niciun cost pentru cabinetul tău. Creează-ți contul gratuit de partener acum.`,
    videoScript: [
      { time: '0 - 3s', visual: 'Contabil la birou copleșit de dosare și foi de prezență.', voice: 'Câte zile pierzi la sfârșit de lună bătând manual pontajele în SAGA?' },
      { time: '3 - 8s', visual: 'Portalul de contabilitate cu lista firmelor și butonul mare Descărcare SAGA.', voice: 'Cu Portalul Gratuit QR Pontaj, descarci fișierele de import SAGA la un singur click.' },
      { time: '8 - 12s', visual: 'Calculul comisionului de 20% lunar per client activ.', voice: 'Rezolvi calvarul pontajului și primești 20% comision recurent în fiecare lună.' },
      { time: '12 - 15s', visual: 'Pagina de înregistrare contabili qrpontaj.ro/contabil.', voice: 'Înscrie-te gratuit în rețeaua partenerilor pe qrpontaj.ro/contabil.' }
    ]
  }
];

export default function MarketingAdsKit() {
  const [activeTab, setActiveTab] = useState('horeca');
  const [copiedKey, setCopiedKey] = useState(null);
  const [adBudget, setAdBudget] = useState(250); // Buget lunar în EUR

  const currentCampaign = CAMPAIGNS.find(c => c.id === activeTab) || CAMPAIGNS[0];

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Calcule aproximative ROI
  const estimatedReach = Math.round(adBudget * 75); // ~75 persoane per EUR
  const estimatedClicks = Math.round(adBudget * 3.2); // ~3.2 clickuri per EUR
  const estimatedLeads = Math.max(1, Math.round(adBudget * 0.12)); // ~12% din clickuri lasă lead
  const estimatedClients = Math.max(1, Math.round(estimatedLeads * 0.22)); // ~22% conversie
  const estimatedEmployees = estimatedClients * 12; // medie 12 angajați per firmă
  const monthlyRevenue = estimatedEmployees * 5; // 5 EUR per angajat per lună

  return (
    <div className="space-y-6">
      {/* Header Secțiune */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Megaphone size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Hub Reclame Meta (Facebook & Instagram Ads)</span>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  Pilonul 6
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Campanii gata de lansare în Meta Ads Manager: texte testate, parametri de targetare și scenarii video
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://adsmanager.facebook.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <span>Deschide Ads Manager</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Selector Nișă / Campanie */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CAMPAIGNS.map(camp => {
          const Icon = camp.icon;
          const isActive = camp.id === activeTab;
          return (
            <button
              key={camp.id}
              onClick={() => setActiveTab(camp.id)}
              className={`px-4 h-10 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={15} />
              <span>{camp.title}</span>
            </button>
          );
        })}
      </div>

      {/* Grid Conținut Reclamă & Mockup Previzualizare */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Coloana Stânga: Detalii Reclamă, Texte și Setări Targetare (8 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Card Date Reclamă Copy-Paste */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Texte Reclamă (Copywriting & Hooks)</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${currentCampaign.badgeColor}`}>
                    Conversie Maximă
                  </span>
                </h3>
                <p className="text-xs text-slate-500">{currentCampaign.subtitle}</p>
              </div>

              <button
                onClick={() => handleCopy(currentCampaign.primaryText, 'all_text')}
                className="px-3.5 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedKey === 'all_text' ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span>Copiat!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copiază Textul</span>
                  </>
                )}
              </button>
            </div>

            {/* Hook / Deschidere */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hook / Prima Linie (Atrage atenția în feed):
                </label>
                <button
                  onClick={() => handleCopy(currentCampaign.hook, 'hook')}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedKey === 'hook' ? 'Copiat' : 'Copiază Hook'}
                </button>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200">
                {currentCampaign.hook}
              </div>
            </div>

            {/* Text Principal (Primary Text) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Text Principal Reclamă (Primary Text în Meta Ads Manager):
                </label>
                <button
                  onClick={() => handleCopy(currentCampaign.primaryText, 'primary')}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedKey === 'primary' ? 'Copiat' : 'Copiază'}
                </button>
              </div>
              <textarea
                readOnly
                value={currentCampaign.primaryText}
                rows={8}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none leading-relaxed resize-none"
              />
            </div>

            {/* Titlu și Descriere Reclamă */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Titlu (Headline):</label>
                  <button
                    onClick={() => handleCopy(currentCampaign.headline, 'headline')}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'headline' ? 'Copiat' : 'Copiază'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white">
                  {currentCampaign.headline}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Descriere (Link Desc):</label>
                  <button
                    onClick={() => handleCopy(currentCampaign.description, 'desc')}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedKey === 'desc' ? 'Copiat' : 'Copiază'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  {currentCampaign.description}
                </div>
              </div>
            </div>
          </div>

          {/* Card Setări Recomandate de Targetare (Ads Manager) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Setări de Targetare în Ads Manager</span>
              </h3>
              <span className="text-[11px] text-slate-500">Optimizat pentru cost redus per lead</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-500 text-[11px] mb-0.5">Locație & Vârstă:</div>
                <div className="font-semibold text-slate-900 dark:text-white">{currentCampaign.targetAudience.location}</div>
                <div className="text-slate-500 mt-1">Vârstă: {currentCampaign.targetAudience.age}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-500 text-[11px] mb-0.5">Plasamente (Placements):</div>
                <div className="font-semibold text-slate-900 dark:text-white">{currentCampaign.targetAudience.placement}</div>
                <div className="text-slate-500 mt-1">Mobile First • Instagram + FB</div>
              </div>

              <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-500 text-[11px] mb-0.5">Interese & Demografice Cheie:</div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {currentCampaign.targetAudience.interests}
                </div>
                <div className="text-blue-600 dark:text-blue-400 font-medium text-[11px] mt-1.5">
                  Demografice: {currentCampaign.targetAudience.demographics}
                </div>
              </div>
            </div>
          </div>

          {/* Scenariu Video 15s Reclamă */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Video size={16} className="text-amber-500" />
              <span>Scenariu Video Demonstrativ (15 Secunde)</span>
            </h3>

            <div className="space-y-2">
              {currentCampaign.videoScript.map((scene, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px] whitespace-nowrap shrink-0">
                    {scene.time}
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-white">Cadru: {scene.visual}</div>
                    <div className="text-slate-500 dark:text-slate-400 italic">Voce: „{scene.voice}”</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Coloana Dreapta: Mockup Previzualizare Feed & Calculator ROI (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Mockup Reclamă Feed Facebook / Instagram */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                  QR
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <span>QR Pontaj</span>
                    <CheckCircle2 size={12} className="text-blue-500" />
                  </div>
                  <div className="text-[10px] text-slate-400">Recomandat • Sponsorizat</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                Previzualizare Feed
              </span>
            </div>

            {/* Textul reclamei în mockup */}
            <div className="p-4 text-xs text-slate-800 dark:text-slate-200 space-y-2">
              <div className="font-bold text-blue-600 dark:text-blue-400">{currentCampaign.hook}</div>
              <p className="line-clamp-4 leading-relaxed text-slate-600 dark:text-slate-300">
                {currentCampaign.primaryText}
              </p>
            </div>

            {/* Imagine / Video Banner simulată */}
            <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 text-white text-center flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mb-3 text-blue-400">
                <Smartphone size={24} />
              </div>
              <div className="font-black text-base text-white mb-1">
                {currentCampaign.headline}
              </div>
              <div className="text-xs text-blue-200 max-w-xs mb-3">
                {currentCampaign.description}
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-[11px] whitespace-nowrap shrink-0 shadow-sm">
                5 € / angajat / lună • Test 10 zile gratuit
              </span>
            </div>

            {/* Bară CTA Reclamă */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">qrpontaj.ro</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {currentCampaign.headline}
                </div>
              </div>
              <button className="px-4 h-8 rounded-full bg-blue-600 text-white font-bold text-xs whitespace-nowrap shrink-0 shadow-xs cursor-pointer">
                Înregistrează-te
              </button>
            </div>
          </div>

          {/* Calculator Estimare Randament Buget Reclame */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <span>Calculator Estimare Rezultate</span>
              </h3>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {adBudget} € / lună
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                <span>Buget lunar alocat:</span>
                <span className="font-bold text-slate-900 dark:text-white">{adBudget} €</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={adBudget}
                onChange={(e) => setAdBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Afișări Estimate</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{estimatedReach.toLocaleString()}</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Lead-uri Calificate</div>
                <div className="text-sm font-black text-blue-600">{estimatedLeads} firme</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Clienți Convertiți</div>
                <div className="text-sm font-black text-emerald-600">{estimatedClients} clienți noi</div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Venit Recurent (MRR)</div>
                <div className="text-sm font-black text-emerald-600">+{monthlyRevenue} € / lună</div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Efect Recurent:</strong> Clienții B2B SaaS plătesc lunar timp de 12-36 luni. O investiție de {adBudget} € generează aproximativ {monthlyRevenue * 12} € pe an.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
