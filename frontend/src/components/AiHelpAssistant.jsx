import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  X, 
  Send, 
  TabletSmartphone, 
  Smartphone, 
  Lock, 
  FileSpreadsheet, 
  HelpCircle, 
  Bot, 
  RotateCcw, 
  Minus, 
  MapPin, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  CheckCircle2, 
  Tv, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check,
  Plus,
  Loader2,
  QrCode,
  Users
} from 'lucide-react';

export default function AiHelpAssistant({ tenant, themeColor = '#007AFF', pageContext = '' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'visualGuide'
  const [guideStep, setGuideStep] = useState(1);
  const [devicePlatform, setDevicePlatform] = useState('ipad'); // 'ipad' | 'android' | 'tv'
  const [copiedLink, setCopiedLink] = useState(false);

  // Logo-ul oficial QR Pontaj sau cel personalizat al companiei
  const brandLogoUrl = (tenant?.logo_url && !tenant.logo_url.includes('default') && !tenant.logo_url.includes('smartqr') && !tenant.logo_url.includes('1792931780859'))
    ? tenant.logo_url
    : '/favicon.png';

  // Stare pentru modalul de Onboarding la prima încărcare
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  // Verificare la prima încărcare a aplicației (dacă utilizatorul nu a văzut încă ghidul)
  useEffect(() => {
    try {
      const seen = localStorage.getItem('qrp_onboarding_assistant_seen');
      if (!seen) {
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 650);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignorăm eventualele restricții de localStorage
    }
  }, []);

  // Cardurile explicative pentru turul pas cu pas
  const onboardingSlides = [
    {
      id: 'welcome',
      badge: 'Asistent Inteligent AI',
      badgeColor: 'bg-blue-100 text-[#007AFF] dark:bg-blue-950/60 dark:text-blue-400',
      title: 'Bun venit pe QR Pontaj!',
      subtitle: 'Asistentul tău dedicat este gata să te ajute 24/7',
      isLogo: true,
      description: 'Platforma QR Pontaj include un asistent inteligent permanent în colțul din dreapta-jos. Te ghidează pas cu pas în configurarea tabletelor, adăugarea locațiilor și gestionarea prezenței.',
      screenshot: '/screenshot_dashboard.png',
      screenshotTitle: 'Panou Principal • Prezențe Live & Monitorizare',
      highlights: [
        'Ghid pas cu pas oricând ai nevoie, direct din colțul ecranului',
        'Configurare automată Kiosk pentru Apple iPad, Android sau Smart TV',
        'Răspunsuri prompte la legislație, ITM, pontaj și rapoarte de salarizare'
      ],
      actionLabel: 'Deschide Panoul Principal',
      actionPath: '/admin/dashboard',
      actionType: 'navigate',
    },
    {
      id: 'locations',
      badge: 'Pasul 1 din 4',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400',
      title: 'Crearea Punctului de Lucru',
      subtitle: 'Locația fizică unde se va desfășura pontajul',
      icon: MapPin,
      iconBg: 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white',
      description: 'Înainte de a porni un ecran sau o tabletă, definește punctele de lucru (ex: Sediu Central, Depozit sau Șantier). Fiecare punct de lucru are o adresă și coordonate GPS pentru validarea prezenței.',
      screenshot: '/ro_dash_overview.png',
      screenshotTitle: 'Puncte de Lucru • Adrese & Rază GPS',
      highlights: [
        'Organizare pe sedii, sucursale, depozite sau puncte de lucru mobile',
        'Validare automată a perimetrului GPS la fiecare scanare',
        'Punctul de lucru este obligatoriu înainte de a crea primul Kiosk'
      ],
      actionLabel: 'Creează Punct de Lucru',
      actionPath: '/admin/locations?action=new',
      actionType: 'navigate',
    },
    {
      id: 'kiosks',
      badge: 'Pasul 2 din 4',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
      title: 'Adăugarea Tabletei Kiosk',
      subtitle: 'Ecranul fix pe care angajații scanează codul QR dinamic',
      icon: TabletSmartphone,
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
      description: 'Creează un Kiosk asociat punctului de lucru și copiază linkul securizat. Îl poți deschide pe orice tabletă (iPad sau Android) ori pe un televizor sau monitor montat la intrare.',
      screenshot: '/screenshot_kiosk_display.png',
      screenshotTitle: 'Terminal Kiosk • Cod QR Dinamic & Standby',
      highlights: [
        'Cod QR dinamic care se regenerează la fiecare 5 secunde anti-fraudă',
        'Nu permite folosirea de capturi de ecran sau trimiterea pozelor pe chat',
        'Instrucțiuni incluse pentru blocare ecran (Guided Access pe iPad)'
      ],
      actionLabel: 'Configurează Kiosk QR',
      actionPath: '/admin/qr?action=new',
      actionType: 'navigate',
    },
    {
      id: 'employees',
      badge: 'Pasul 3 din 4',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
      title: 'Înregistrare & Pontare Angajați',
      subtitle: 'Zero aplicații de instalat pe telefoanele angajaților',
      icon: Users,
      iconBg: 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white',
      description: 'Adaugă lista de angajați cu CNP/ID și norma de lucru. Pentru pontaj, angajații scanează simplu codul QR de pe Kiosk cu camera nativă a telefonului lor, fără a instala nimic.',
      screenshot: '/screenshot_employees.png',
      screenshotTitle: 'Gestiune Angajați • Drepturi Acces & Scanare',
      highlights: [
        'Fără aplicații greoaie descărcate din magazinele de aplicații',
        'Pontaj instantaneu (Sosire, Plecare, Pauză) cu marcaj orar și GPS',
        'Gestionare facilă a departamentelor, rolurilor și tipurilor de normă'
      ],
      actionLabel: 'Gestionează Angajați',
      actionPath: '/admin/employees',
      actionType: 'navigate',
    },
    {
      id: 'reports',
      badge: 'Pasul 4 din 4',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
      title: 'Condică de Prezență & Export Saga',
      subtitle: 'Evidență completă conformă ITM și sincronizare contabilă',
      icon: FileSpreadsheet,
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white',
      description: 'Platforma calculează automat orele lucrate, întârzierile și orele suplimentare. Poți descărca condica lunară în format PDF/Excel sau exporta direct fișierul compatibil Saga Soft.',
      screenshot: '/screenshot_timesheets.png',
      screenshotTitle: 'Condică de Pontaj • Grafice, ITM & Export SAGA',
      highlights: [
        'Condică de prezență oficială gata pentru semnat și controale ITM',
        'Export nativ pentru Saga Soft printr-un singur clic',
        'Statistici în timp real privind prezența activă în companie'
      ],
      actionLabel: 'Vezi Condica de Pontaj',
      actionPath: '/admin/timesheets',
      actionType: 'navigate',
    }
  ];

  const handleOpenOnboarding = () => {
    setOnboardingStep(0);
    setShowOnboarding(true);
  };

  const handleCloseOnboarding = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('qrp_onboarding_assistant_seen', 'true');
      } catch (e) {}
    }
    setShowOnboarding(false);
  };

  const handleSlideAction = (slide) => {
    if (slide.actionType === 'navigate' && slide.actionPath) {
      handleCloseOnboarding();
      handleNavigateTo(slide.actionPath);
    } else if (slide.actionType === 'next') {
      setOnboardingStep(prev => Math.min(prev + 1, onboardingSlides.length - 1));
    }
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Bună ziua! Sunt asistentul AI QR Pontaj. Cu ce vă pot ajuta astăzi?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    { label: 'Ghid Rapid Platformă (Tur)', action: 'tour', icon: Sparkles },
    { label: 'Pasul 1: Creare Punct de Lucru', action: 'locations_new', icon: MapPin },
    { label: 'Pasul 2: Adăugare Kiosk Nou', action: 'qr_new', icon: TabletSmartphone },
    { label: 'Ghid Vizual (4 Pași)', action: 'guide', icon: BookOpen },
    { label: 'Cum conectez un Kiosk?', icon: TabletSmartphone },
    { label: 'Configurare iPad Guided Access', action: 'ipad_guide', icon: ShieldCheck },
    { label: 'Cum se pontează un angajat?', icon: Smartphone },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

  const handleSend = async (customText = null) => {
    const textToSend = (typeof customText === 'string' ? customText : input).trim();
    if (!textToSend || loading) return;

    const newHistory = [
      ...messages,
      { role: 'user', text: textToSend }
    ];

    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          tenantId: tenant?.id,
          pageContext: pageContext || window.location.pathname,
          history: newHistory.slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            text: m.text
          }))
        })
      });

      if (!res.ok) {
        throw new Error('Eroare la comunicarea cu asistentul AI');
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'Nu am primit un răspuns valid de la server. Vă rugăm să reîncercați.'
        }
      ]);
    } catch (err) {
      console.error('[AiAssistant] Error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Conexiunea cu asistentul AI a fost întreruptă temporar. Puteți consulta Ghidul Vizual cu Ecrane din tab-ul de sus.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'Bună ziua! Sunt asistentul AI QR Pontaj. Cu ce vă pot ajuta astăzi?'
      }
    ]);
  };

  // Navigare rapidă către rutele admin din interiorul asistentului
  const handleNavigateTo = (path) => {
    try {
      navigate(path);
      setIsOpen(false);
    } catch (e) {
      window.location.href = path;
    }
  };

  // Gestionare clic pe întrebări rapide / scurtături de acțiune
  const handleQuickQuestionClick = (q) => {
    if (q.action === 'tour') {
      handleOpenOnboarding();
    } else if (q.action === 'locations_new') {
      handleNavigateTo('/admin/locations?action=new');
    } else if (q.action === 'qr_new') {
      handleNavigateTo('/admin/qr?action=new');
    } else if (q.action === 'guide') {
      setActiveTab('visualGuide');
    } else if (q.action === 'ipad_guide') {
      handleSend('Cum configurez Guided Access pe iPad pentru modul Kiosk?');
    } else {
      handleSend(q.label);
    }
  };

  // Formatare simplă text markdown fără fonturi robotizate și fără emoji
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold handling
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-2 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] shrink-0"></span>
            <span>{line.replace('### ', '')}</span>
          </h4>
        );
      }

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-2 shrink-0"></span>
            <span>{formattedParts}</span>
          </div>
        );
      }

      if (/^\d+\./.test(line.trim())) {
        return (
          <div key={idx} className="my-1.5 text-slate-800 dark:text-slate-200">
            {formattedParts}
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-1.5"></div>;
      }

      return (
        <p key={idx} className="my-1 text-slate-700 dark:text-slate-300 leading-relaxed">
          {formattedParts}
        </p>
      );
    });
  };

  // Verifică dacă mesajul asistentului se referă la Kiosk / Tablete pentru a atașa cardul interactiv
  const isKioskRelated = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return lower.includes('kiosk') || lower.includes('tableta') || lower.includes('ecran') || lower.includes('punct de lucru');
  };

  return (
    <>
      {/* Keyframe styles pentru animațiile QR-ului și efectul de atenție periodică */}
      <style>{`
        @keyframes smoothQrLaser {
          0% {
            top: 10%;
            opacity: 0.2;
          }
          18% {
            opacity: 1;
          }
          50% {
            top: 80%;
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            top: 10%;
            opacity: 0.2;
          }
        }
        @keyframes qrBreathe {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0px rgba(255,255,255,0));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 4px rgba(255,255,255,0.7));
          }
        }
        @keyframes attentionWiggle {
          0%, 82%, 100% {
            transform: scale(1) rotate(0deg);
          }
          85% {
            transform: scale(1.04) rotate(-2deg);
          }
          88% {
            transform: scale(1.05) rotate(2.5deg);
          }
          91% {
            transform: scale(1.03) rotate(-1.5deg);
          }
          94% {
            transform: scale(1.02) rotate(1deg);
          }
          97% {
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes haloWave {
          0%, 82% {
            opacity: 0;
            transform: scale(0.96);
          }
          86% {
            opacity: 0.65;
          }
          95% {
            opacity: 0;
            transform: scale(1.18);
          }
          100% {
            opacity: 0;
            transform: scale(1.22);
          }
        }
      `}</style>

      {/* macOS Style Floating Launcher Pill */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <div className="relative">
            {/* Halo fin de lumină sincronizat cu mișcarea periodică de atenție */}
            <div 
              className="absolute inset-0 rounded-full border border-blue-400/50 pointer-events-none"
              style={{ animation: 'haloWave 6.5s ease-out infinite' }}
            />

            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-[0_14px_36px_-4px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_40px_-4px_rgba(0,122,255,0.45)] border border-slate-700/80 hover:border-[#007AFF]/70 ring-1 ring-white/15 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap shrink-0 group cursor-pointer"
              style={{ animation: 'attentionWiggle 6.5s ease-in-out infinite' }}
              title="Deschide Asistentul AI QR Pontaj"
            >
              {/* Logo Oficial QR Pontaj / Companie — Format mărit, cu respirație luminoasă și laser optic */}
              <div className="relative w-9 h-9 rounded-full overflow-hidden shadow-md shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-700/80 group-hover:scale-105 transition-transform p-0.5">
                <img 
                  src={brandLogoUrl} 
                  alt="Logo QR Pontaj" 
                  className="w-full h-full object-contain rounded-full"
                  style={{ animation: 'qrBreathe 3.2s ease-in-out infinite' }}
                />
                <div 
                  className="absolute left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent rounded-full shadow-[0_0_8px_2px_rgba(56,189,248,0.95)] z-20 pointer-events-none"
                  style={{ animation: 'smoothQrLaser 2.2s ease-in-out infinite' }}
                />
              </div>

              {/* Denumire clară Asistent AI */}
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white whitespace-nowrap shrink-0 pr-1">
                Asistent AI QR Pontaj
              </span>
            </button>
          </div>
        )}
      </div>

      {/* macOS Window Card */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[415px] h-[525px] max-h-[82vh] backdrop-blur-3xl bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.32)] border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* macOS Title Bar with Traffic Lights */}
          <div className="px-3.5 py-2.5 bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between select-none shrink-0">
            {/* Traffic Lights */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer shadow-xs flex items-center justify-center group"
                title="Închide"
              >
                <X size={8} className="text-[#4A0002] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer shadow-xs flex items-center justify-center group"
                title="Minimizează"
              >
                <Minus size={8} className="text-[#5B3E00] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={handleResetChat}
                className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer shadow-xs flex items-center justify-center group"
                title="Resetează"
              >
                <RotateCcw size={7} className="text-[#004A0E] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Window Mode Switcher (macOS Segmented Control) */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-700/60 p-0.5 rounded-full border border-slate-300/40 dark:border-slate-600/40 shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bot size={12} className="text-[#007AFF] shrink-0" />
                <span className="whitespace-nowrap shrink-0">Chat AI</span>
              </button>
              <button
                onClick={() => setActiveTab('visualGuide')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'visualGuide'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen size={12} className="text-[#007AFF] shrink-0" />
                <span className="whitespace-nowrap shrink-0">Ghid Vizual (4 Pași)</span>
              </button>
            </div>

            {/* Window Status Indicator & Tour Trigger */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenOnboarding}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-[#007AFF] dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors whitespace-nowrap shrink-0 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer"
                title="Deschide Turul Ghidat al Platformei"
              >
                <img src={brandLogoUrl} alt="Logo" className="w-3.5 h-3.5 object-contain rounded-full shrink-0" />
                <span>Ghid Rapid</span>
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="hidden sm:inline">Online</span>
              </div>
            </div>
          </div>

          {/* TAB 1: Conversație Chat AI */}
          {activeTab === 'chat' && (
            <>
              {/* Quick Questions macOS Segmented Chips (afișate doar în conversație activă) */}
              {messages.length > 1 && (
                <div className="px-3 py-2 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none shrink-0">
                  {quickQuestions.map((q, qIdx) => {
                    const IconComp = q.icon;
                    return (
                      <button
                        key={qIdx}
                        onClick={() => handleQuickQuestionClick(q)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#007AFF] hover:text-[#007AFF] dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all whitespace-nowrap shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <IconComp size={11} className="text-[#007AFF] shrink-0" />
                        <span className="whitespace-nowrap shrink-0">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                {messages.map((msg, mIdx) => {
                  const isUser = msg.role === 'user';
                  // Cardul de pași apare DOAR după ce utilizatorul întreabă sau alege un topic (niciodată la deschidere pe mIdx === 0)
                  const showInteractiveCard = !isUser && mIdx > 0 && (isKioskRelated(msg.text) || msg.actionType === 'show_inline_create');
                  const isLocationSuccess = !isUser && msg.actionType === 'location_created';

                  return (
                    <div 
                      key={mIdx} 
                      className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="relative w-7 h-7 rounded-full overflow-hidden shadow-xs shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-0.5">
                          <img 
                            src={brandLogoUrl} 
                            alt="Logo" 
                            className="w-full h-full object-contain rounded-full" 
                          />
                          <div 
                            className="absolute left-0.5 right-0.5 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent rounded-full shadow-[0_0_5px_1px_rgba(56,189,248,0.9)] z-20 pointer-events-none"
                            style={{ animation: 'smoothQrLaser 2.2s ease-in-out infinite' }}
                          />
                        </div>
                      )}

                      <div 
                        className={`max-w-[88%] text-xs sm:text-sm leading-relaxed ${
                          isUser 
                            ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-xs font-medium' 
                            : 'bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-200/70 dark:border-white/10 shadow-xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="space-y-1">
                            {renderFormattedText(msg.text)}

                            {/* Selector de Topice Apple macOS (Apare DOAR la primul mesaj până când utilizatorul alege un topic sau scrie o întrebare) */}
                            {mIdx === 0 && messages.length === 1 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                  <Sparkles size={12} className="text-[#007AFF] shrink-0" />
                                  <span>Alegeți un subiect sau adresați orice întrebare:</span>
                                </div>

                                <div className="grid grid-cols-1 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={handleOpenOnboarding}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/80 hover:border-[#007AFF] dark:border-blue-800/60 transition-all text-left group cursor-pointer shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 shadow-xs flex items-center justify-center bg-white dark:bg-slate-800 border border-blue-200/60 p-0.5">
                                        <img src={brandLogoUrl} alt="Logo" className="w-full h-full object-contain rounded-md" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                          Ghid Rapid Platformă (Tur 4 Pași)
                                        </div>
                                        <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                                          Locații • Kiosks • Angajați • Condică Saga
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight size={13} className="text-[#007AFF] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSend('Configurare Kiosk Tabletă')}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50/90 hover:bg-blue-50/50 dark:bg-slate-800/80 dark:hover:bg-blue-950/30 border border-slate-200/80 hover:border-[#007AFF]/60 dark:border-slate-700/70 transition-all text-left group cursor-pointer shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-6 h-6 rounded-lg bg-blue-100/80 dark:bg-blue-900/50 text-[#007AFF] flex items-center justify-center shrink-0">
                                        <TabletSmartphone size={13} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                          Configurare Kiosk Tabletă
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                          Punct de lucru obligatoriu + adăugare Kiosk
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight size={13} className="text-slate-400 group-hover:text-[#007AFF] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSend('Cum blochez ecranul pe iPad cu Guided Access pentru modul Kiosk?')}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/30 border border-slate-200/80 hover:border-indigo-400/60 dark:border-slate-700/70 transition-all text-left group cursor-pointer shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-6 h-6 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                        <ShieldCheck size={13} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                          Ghid iPad Guided Access
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                          Blocare ecran tabletă anti-ieșire
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight size={13} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSend('Cum se pontează un angajat?')}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50/90 hover:bg-emerald-50/50 dark:bg-slate-800/80 dark:hover:bg-emerald-950/30 border border-slate-200/80 hover:border-emerald-400/60 dark:border-slate-700/70 transition-all text-left group cursor-pointer shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-6 h-6 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <Smartphone size={13} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                          Scanare & Pontaj Angajați
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                          Scanare QR dinamic cu camera fără aplicație
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight size={13} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSend('Cum funcționează condica de prezență și exportul pentru Saga Software?')}
                                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50/90 hover:bg-amber-50/50 dark:bg-slate-800/80 dark:hover:bg-amber-950/30 border border-slate-200/80 hover:border-amber-400/60 dark:border-slate-700/70 transition-all text-left group cursor-pointer shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-6 h-6 rounded-lg bg-amber-100/80 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                        <FileSpreadsheet size={13} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                          Export Saga & Rapoarte
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                          Condică lunară PDF/Excel și salarii
                                        </div>
                                      </div>
                                    </div>
                                    <ChevronRight size={13} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Card de confirmare creare locație cu succes */}
                            {isLocationSuccess && (
                              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
                                <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                    <span>Punct de lucru activ: {msg.createdLocationName}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                    Pasul 1 este finalizat! Poți trece acum la crearea tabletei Kiosk.
                                  </p>
                                  <div className="pt-1 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleNavigateTo('/admin/qr?action=new')}
                                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
                                    >
                                      <TabletSmartphone size={13} className="shrink-0" />
                                      <span>Du-mă la Tablete Kiosk (+ Adaugă Kiosk) →</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Card Proactiv de Acțiuni Directe — Pași Succesivi */}
                            {showInteractiveCard && (
                              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/60 shadow-xs space-y-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles size={14} className="text-[#007AFF] shrink-0" />
                                      <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                                        Pași Succesivi de Configurare
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('visualGuide')}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#007AFF] hover:text-[#007AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                                    >
                                      <BookOpen size={11} className="text-[#007AFF] shrink-0" />
                                      <span>Ghid Ecrane</span>
                                    </button>
                                  </div>

                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                                    Apasă pe butonul pasului dorit pentru a deschide direct fereastra de creare:
                                  </p>

                                  {/* Pasul 1: Creare Punct de Lucru */}
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 shadow-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#007AFF] dark:bg-blue-900/60 dark:text-blue-300 whitespace-nowrap shrink-0">
                                        Pasul 1 (Obligatoriu)
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                                        Punct de Lucru
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                                      Fără un sediu salvat în sistem, Kiosk-ul nu poate fi creat.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => handleNavigateTo('/admin/locations?action=new')}
                                      className="w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <MapPin size={13} className="shrink-0" />
                                        <span className="whitespace-nowrap shrink-0">Deschide Fereastra Creare Punct de Lucru</span>
                                      </div>
                                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
                                    </button>
                                  </div>

                                  {/* Pasul 2: Adăugare Tabletă Kiosk */}
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 shadow-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 whitespace-nowrap shrink-0">
                                        Pasul 2
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                                        Tabletă Kiosk
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                                      După salvarea sediului, adaugă tableta și asociaz-o locației.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => handleNavigateTo('/admin/qr?action=new')}
                                      className="w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600 hover:border-[#007AFF] hover:text-[#007AFF] transition-colors whitespace-nowrap shrink-0 shadow-2xs cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-2">
                                        <TabletSmartphone size={13} className="text-indigo-600 shrink-0" />
                                        <span className="whitespace-nowrap shrink-0">Deschide Fereastra Creare Kiosk</span>
                                      </div>
                                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
                                    </button>
                                  </div>

                                  <div className="pt-0.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('visualGuide')}
                                      className="text-[11px] font-semibold text-[#007AFF] hover:underline cursor-pointer whitespace-nowrap shrink-0"
                                    >
                                      Ghid complet ecrane & blocare Guided Access →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-[#007AFF] to-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs overflow-hidden">
                      <QrCode size={13} className="relative z-10 text-white" />
                      <div 
                        className="absolute left-1 right-1 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent rounded-full shadow-[0_0_5px_1px_rgba(56,189,248,0.9)] z-20 pointer-events-none"
                        style={{ animation: 'smoothQrLaser 2.2s ease-in-out infinite' }}
                      />
                    </div>
                    <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-200/70 dark:border-white/10 shadow-xs flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-bounce [animation-delay:0.4s]"></div>
                      <span className="text-xs text-slate-400 font-medium ml-1">Asistentul analizează...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer in macOS Spotlight Style */}
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 border-t border-slate-200/70 dark:border-slate-800 shrink-0">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Scrie o întrebare... (ex: Cum conectez un Kiosk?)"
                    disabled={loading}
                    className="flex-1 px-4 h-10 text-xs sm:text-sm rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#007AFF] transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#007AFF] text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="Trimite"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: Ghid Vizual Interactiv pe Ecrane (Mockups & Pași Reali) */}
          {activeTab === 'visualGuide' && (
            <div className="flex-1 overflow-y-auto flex flex-col p-4 bg-slate-50/60 dark:bg-slate-950/40">
              
              {/* Stepper Horizontal Navigation Bar */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-full border border-slate-300/40 dark:border-slate-700/50 mb-3.5 shrink-0">
                {[
                  { step: 1, label: '1. Punct Lucru', icon: MapPin },
                  { step: 2, label: '2. Kiosk Nou', icon: TabletSmartphone },
                  { step: 3, label: '3. Link Tabletă', icon: Copy },
                  { step: 4, label: '4. Kiosk Mode', icon: Lock }
                ].map((s) => {
                  const IconC = s.icon;
                  const isActive = guideStep === s.step;
                  const isDone = guideStep > s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setGuideStep(s.step)}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#007AFF] text-white shadow-xs'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={11} className="shrink-0" /> : <IconC size={11} className="shrink-0" />}
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ECRANUL PASULUI 1: Creare Punct de Lucru (OBLIGATORIU) */}
              {guideStep === 1 && (
                <div className="flex-1 flex flex-col space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 whitespace-nowrap shrink-0">
                      PASUL 1 • OBLIGATORIU ÎNAINTE DE KIOSK
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">1 din 4</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Creați Punctul de Lucru (Locația fizică)
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Un ecran Kiosk <strong>nu poate funcționa fără o locație asociată</strong>. Fiecare tabletă montată pe perete trebuie să știe la ce sediu înregistrează pontajele.
                  </p>

                  {/* Mockup Ecran Vizual: Puncte de Lucru */}
                  <div className="rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    {/* Mockup Window Title */}
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">Ecran: Puncte de Lucru (/admin/locations)</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#007AFF]">Pasul 1</span>
                    </div>

                    {/* Mockup Content */}
                    <div className="p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Gestiune Locații</div>
                          <div className="text-[10px] text-slate-400">Sediul Central, Puncte de Lucru</div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-[10px] font-black bg-[#007AFF] text-white shadow-xs animate-pulse whitespace-nowrap shrink-0">
                          + Adaugă Punct de Lucru
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-semibold">Nume Locație:</span>
                          <span className="ml-1.5 font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">Sediul Central</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Adresă Sediu:</span>
                          <span className="ml-1.5 font-medium text-slate-700 dark:text-slate-300">Str. Principală Nr. 10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buton Acțiune Directă */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleNavigateTo('/admin/locations')}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <MapPin size={13} className="shrink-0" />
                      <span>Mergi la Puncte de Lucru acum</span>
                      <ArrowRight size={13} className="shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setGuideStep(2)}
                      className="px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Pasul Următor →
                    </button>
                  </div>
                </div>
              )}

              {/* ECRANUL PASULUI 2: Creare Kiosk & Asociere Locație */}
              {guideStep === 2 && (
                <div className="flex-1 flex flex-col space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/60 whitespace-nowrap shrink-0">
                      PASUL 2 • CONFIGURARE TERMINAL
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">2 din 4</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Adăugați Kiosk-ul și asociați Punctul de Lucru
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Accesați pagina <strong>Tablete Kiosk</strong>, apăsați pe <strong>+ Adaugă Kiosk</strong>, introduceți denumirea și selectați locația creată la Pasul 1.
                  </p>

                  {/* Mockup Ecran Vizual: Formular Kiosk */}
                  <div className="rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">Formular: Adăugare Kiosk Nou</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600">Pasul 2</span>
                    </div>

                    <div className="p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 text-[11px]">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Nume Kiosk (Ex: Recepție)</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Tableta Intrare Principală</div>
                      </div>

                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800">
                        <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Punct de Lucru (Asociat din Pasul 1)</div>
                        <div className="font-extrabold text-blue-900 dark:text-blue-100 mt-0.5">✓ Sediul Central (Str. Principală 10)</div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Permite Pontaj cu PIN (opțional)</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">ACTIVAT</span>
                      </div>
                    </div>
                  </div>

                  {/* Buton Acțiune Directă */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleNavigateTo('/admin/qr')}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <TabletSmartphone size={13} className="shrink-0" />
                      <span>Mergi la Tablete Kiosk</span>
                      <ArrowRight size={13} className="shrink-0" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGuideStep(1)}
                        className="px-3 py-2 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        ← Înapoi
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuideStep(3)}
                        className="px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Pasul 3 →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ECRANUL PASULUI 3: Copiere Link Tabletă */}
              {guideStep === 3 && (
                <div className="flex-1 flex flex-col space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/60 whitespace-nowrap shrink-0">
                      PASUL 3 • LINK DEDICAT ECRAN
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">3 din 4</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Copiați Link-ul și deschideți-l pe Tabletă sau TV
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Fiecare Kiosk are un link securizat unic. Apăsați butonul <strong>Copiază Link Tabletă</strong> din tabel și deschideți-l în Safari (iPad), Chrome (Android) sau Smart TV.
                  </p>

                  {/* Mockup Ecran Vizual: Copiere Link */}
                  <div className="rounded-2xl border border-slate-300/80 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">Tabel Kiosk-uri Active</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">Pasul 3</span>
                    </div>

                    <div className="p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Tableta Intrare Principală</div>
                          <div className="text-[10px] text-slate-400">Sediul Central &bull; Cod QR Activ</div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-sm flex items-center gap-1 whitespace-nowrap shrink-0 animate-bounce">
                          <Copy size={11} className="shrink-0" />
                          <span>Copiază Link Tabletă</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10.5px] text-slate-500 flex items-center gap-1.5">
                        <ExternalLink size={12} className="text-[#007AFF] shrink-0" />
                        <span className="truncate">https://{tenant?.subdomain || 'firma'}.qr.pontaj.app/kiosk/...</span>
                      </div>
                    </div>
                  </div>

                  {/* Buton Acțiune Directă */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleNavigateTo('/admin/qr')}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Copy size={13} className="shrink-0" />
                      <span>Deschide tabelul de Kiosk-uri</span>
                      <ArrowRight size={13} className="shrink-0" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGuideStep(2)}
                        className="px-3 py-2 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        ← Înapoi
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuideStep(4)}
                        className="px-3.5 py-2 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Pasul 4 (Kiosk Mode) →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ECRANUL PASULUI 4: Blocare Ecran în Kiosk Mode (iPad / Android / TV) */}
              {guideStep === 4 && (
                <div className="flex-1 flex flex-col space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 whitespace-nowrap shrink-0">
                      PASUL 4 • ANTI-IEȘIRE & SECURITATE
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">4 din 4</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Blocați ecranul tabletei (Kiosk Mode Anti-Ieșire)
                  </h3>

                  {/* Selector Dispozitiv */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-full border border-slate-300/50">
                    <button
                      type="button"
                      onClick={() => setDevicePlatform('ipad')}
                      className={`py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer text-center ${
                        devicePlatform === 'ipad'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      iPad (Apple)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevicePlatform('android')}
                      className={`py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer text-center ${
                        devicePlatform === 'android'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Tabletă Android
                    </button>
                    <button
                      type="button"
                      onClick={() => setDevicePlatform('tv')}
                      className={`py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer text-center ${
                        devicePlatform === 'tv'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Smart TV / PC
                    </button>
                  </div>

                  {/* Instrucțiuni specifice dispozitivului */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 shadow-xs">
                    {devicePlatform === 'ipad' && (
                      <div className="space-y-2">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                          <Lock size={13} className="text-[#007AFF] shrink-0" />
                          <span>Configurare iPad prin Acces Ghidat (Guided Access):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 ml-1 text-slate-600 dark:text-slate-300">
                          <li>Pe iPad, mergeți la <strong>Configurări → Accesibilitate → Acces Ghidat</strong> și activați opțiunea.</li>
                          <li>Deschideți <strong>Safari</strong> și introduceți linkul copiat la Pasul 3.</li>
                          <li>Apăsați <strong>de 3 ori consecutiv pe butonul fizic Power</strong> (sus sau lateral).</li>
                          <li>Apăsați pe butonul <strong>Start</strong> din colțul din dreapta-sus.</li>
                          <li>Tableta este acum complet blocată pe ecranul de pontaj. Nimeni nu poate ieși sau accesa pozele.</li>
                        </ol>
                      </div>
                    )}

                    {devicePlatform === 'android' && (
                      <div className="space-y-2">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                          <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                          <span>Configurare Android prin Fixare Aplicație (App Pinning):</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 ml-1 text-slate-600 dark:text-slate-300">
                          <li>Pe tabletă, mergeți în <strong>Setări → Securitate → Fixare ecran / aplicație</strong> și activați-o.</li>
                          <li>Deschideți <strong>Google Chrome</strong> cu linkul Kiosk.</li>
                          <li>Deschideți lista de aplicații recente, apăsați pe iconița Chrome și alegeți <strong>Fixează / Pin</strong>.</li>
                        </ol>
                      </div>
                    )}

                    {devicePlatform === 'tv' && (
                      <div className="space-y-2">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                          <Tv size={13} className="text-indigo-600 shrink-0" />
                          <span>Configurare Smart TV sau Monitor PC:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 ml-1 text-slate-600 dark:text-slate-300">
                          <li>Deschideți browser-ul integrat al Smart TV-ului și accesați linkul Kiosk.</li>
                          <li>Apăsați tasta <strong>F11</strong> (pe tastatură sau PC) sau apăsați butonul de <strong>Ecran Complet (Full Screen)</strong> din meniul browser-ului TV.</li>
                          <li>Codul QR se va reîmprospăta dinamic la fiecare 5 secunde.</li>
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* Butoane Navigare Finală */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setGuideStep(3)}
                      className="px-3 py-2 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      ← Pasul Anterior
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0 shadow-md cursor-pointer"
                    >
                      Înapoi la Chat AI
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* MODAL ONBOARDING / GHID RAPID PLATFORMĂ LA PRIMA ACCESARE */}
      {showOnboarding && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
          onClick={handleCloseOnboarding}
        >
          <div 
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-5 sm:px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden shadow-xs shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-0.5">
                  <img 
                    src={brandLogoUrl} 
                    alt={tenant?.name || 'Logo'} 
                    className="w-full h-full object-contain rounded-full" 
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
                      Ghid Inițiere
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${onboardingSlides[onboardingStep].badgeColor}`}>
                      {onboardingSlides[onboardingStep].badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {tenant?.name ? `${tenant.name} • QR Pontaj` : 'QR Pontaj • Ghidul tău pas cu pas'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseOnboarding}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Închide ghidul"
              >
                <X size={17} />
              </button>
            </div>

            {/* Slide Content Body */}
            {(() => {
              const currentSlide = onboardingSlides[onboardingStep] || onboardingSlides[0];
              const SlideIcon = currentSlide.icon;

              return (
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                  {/* Titlu & Logo mare cu efecte fluide */}
                  <div className="flex items-start gap-4">
                    {currentSlide.isLogo ? (
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl p-1 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                        <img 
                          src={brandLogoUrl} 
                          alt={tenant?.name || 'QR Pontaj'} 
                          className="w-full h-full object-contain"
                          style={{ animation: 'qrBreathe 3.2s ease-in-out infinite' }}
                        />
                        <div 
                          className="absolute left-1.5 right-1.5 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent rounded-full shadow-[0_0_8px_2px_rgba(56,189,248,0.95)] z-20 pointer-events-none"
                          style={{ animation: 'smoothQrLaser 2.2s ease-in-out infinite' }}
                        />
                      </div>
                    ) : (
                      <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl ${currentSlide.iconBg} flex items-center justify-center shrink-0 shadow-md`}>
                        <SlideIcon size={26} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                        {currentSlide.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-[#007AFF] dark:text-blue-400 mt-0.5">
                        {currentSlide.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Paragraf explicativ */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentSlide.description}
                  </p>

                  {/* SCREENSHOT / PREVIZUALIZARE VIZUALĂ ECRAN */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 overflow-hidden shadow-xs">
                    {/* macOS Window Header Bar */}
                    <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 select-none">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shrink-0"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shrink-0"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shrink-0"></span>
                        <span className="ml-2 font-bold text-slate-700 dark:text-slate-200 truncate">
                          {currentSlide.screenshotTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium shrink-0 ml-2">
                        <span className="truncate">{currentSlide.actionPath}</span>
                      </div>
                    </div>

                    {/* Screenshot Image or Interactive Location Mockup */}
                    {currentSlide.screenshot ? (
                      <div 
                        className="relative group cursor-pointer overflow-hidden bg-slate-950" 
                        onClick={() => handleSlideAction(currentSlide)}
                        title="Apasă pentru a deschide acest ecran"
                      >
                        <img 
                          src={currentSlide.screenshot} 
                          alt={currentSlide.screenshotTitle} 
                          className="w-full h-40 sm:h-52 object-cover object-top group-hover:scale-[1.01] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="px-4 py-2 rounded-full text-xs font-bold bg-[#007AFF] text-white shadow-lg flex items-center gap-1.5 whitespace-nowrap shrink-0">
                            <span>Deschide Ecranul</span>
                            <ArrowRight size={13} className="shrink-0" />
                          </span>
                        </div>
                      </div>
                    ) : currentSlide.isLocationMockup ? (
                      <div className="p-3.5 space-y-2.5 bg-slate-50 dark:bg-slate-900/90 text-xs">
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">Gestiune Puncte de Lucru</div>
                            <div className="text-[10px] text-slate-400">Sediu Central, Filiale, Depozite, Șantiere</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSlideAction(currentSlide)}
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#007AFF] text-white shadow-xs whitespace-nowrap shrink-0 hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            + Adaugă Punct de Lucru
                          </button>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">Exemplu Sediu:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">Sediul Central (Activ)</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Validare Geografică:</span>
                            <span className="font-medium text-emerald-600">Rază GPS 150m activă</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Puncte Cheie */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Puncte cheie de reținut:
                    </div>
                    <div className="space-y-2">
                      {currentSlide.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-normal">
                          <CheckCircle2 size={15} className="text-[#007AFF] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CASETA CU LINKUL DIRECT ȘI ACȚIUNE DE NAVIGARE */}
                  {currentSlide.actionPath && (
                    <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200/90 dark:border-blue-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#007AFF] flex items-center justify-center shrink-0">
                          <ExternalLink size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Link Direct Pagina:
                          </div>
                          <a 
                            href={currentSlide.actionPath}
                            onClick={(e) => {
                              e.preventDefault();
                              handleSlideAction(currentSlide);
                            }}
                            className="font-bold text-[#007AFF] hover:underline dark:text-blue-300 truncate block cursor-pointer"
                          >
                            {typeof window !== 'undefined' ? window.location.origin : ''}{currentSlide.actionPath}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const fullUrl = `${window.location.origin}${currentSlide.actionPath}`;
                            navigator.clipboard.writeText(fullUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                          title="Copiază linkul direct"
                        >
                          {copiedLink ? <Check size={12} className="text-emerald-500 shrink-0" /> : <Copy size={12} className="shrink-0" />}
                          <span className="whitespace-nowrap shrink-0">{copiedLink ? 'Copiat!' : 'Copiază link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSlideAction(currentSlide)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#007AFF] hover:bg-blue-600 shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span className="whitespace-nowrap shrink-0">{currentSlide.actionLabel}</span>
                          <ArrowRight size={13} className="shrink-0" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Subsol Modal (Checkbox Nu mai afișa + Navigare) */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Checkbox Opțiune */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 order-2 sm:order-1">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded text-[#007AFF] border-slate-300 dark:border-slate-700 focus:ring-0 cursor-pointer"
                />
                <span className="whitespace-nowrap shrink-0">Nu mai afișa data viitoare</span>
              </label>

              {/* Indicatori Puncte + Butoane Înapoi / Următorul */}
              <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Buline Progres */}
                <div className="flex items-center gap-1.5">
                  {onboardingSlides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setOnboardingStep(dotIdx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        onboardingStep === dotIdx
                          ? 'w-6 bg-[#007AFF]'
                          : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                      }`}
                      title={`Mergi la pasul ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {onboardingStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(prev => prev - 1)}
                      className="px-3.5 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Înapoi
                    </button>
                  )}

                  {onboardingStep < onboardingSlides.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#007AFF] hover:bg-blue-600 text-white shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Următorul</span>
                      <ChevronRight size={14} className="shrink-0" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCloseOnboarding}
                      className="flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-bold bg-[#007AFF] hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Am înțeles, să începem!</span>
                      <Check size={14} className="shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
