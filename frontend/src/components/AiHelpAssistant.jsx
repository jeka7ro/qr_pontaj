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
  Check
} from 'lucide-react';

export default function AiHelpAssistant({ tenant, themeColor = '#007AFF', pageContext = '' }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'visualGuide'
  const [guideStep, setGuideStep] = useState(1);
  const [devicePlatform, setDevicePlatform] = useState('ipad'); // 'ipad' | 'android' | 'tv'
  const [copiedLink, setCopiedLink] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Bună ziua! Sunt asistentul inteligent QR Pontaj. Vă pot ajuta cu pașii exacți pentru configurarea unui Kiosk pe tabletă (inclusiv crearea punctului de lucru obligatoriu), blocarea ecranului pe iPad sau Android, scanarea pentru angajați sau rapoartele pentru contabilitate.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    { label: 'Cum pun ecranul pe tabletă / TV?', icon: TabletSmartphone },
    { label: 'Cum se pontează un angajat?', icon: Smartphone },
    { label: 'Cum blochez iPad-ul cu Guided Access?', icon: Lock },
    { label: 'Cum export pontajul pentru Saga / Excel?', icon: FileSpreadsheet },
    { label: 'Ce fac dacă un angajat nu are telefon?', icon: HelpCircle },
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
        text: 'Conversația a fost resetată. Cu ce vă mai pot ajuta legat de QR Pontaj sau configurarea Kiosk-urilor?'
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
      {/* macOS Style Floating Launcher Pill */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full backdrop-blur-2xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white shadow-xl hover:shadow-2xl border border-slate-200/90 dark:border-white/15 transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap shrink-0 group"
            title="Deschide Asistentul QR Pontaj"
          >
            <div className="w-7 h-7 rounded-full bg-[#007AFF]/15 text-[#007AFF] dark:bg-[#007AFF]/25 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
              <Sparkles size={15} />
            </div>
            <span className="font-semibold text-xs sm:text-sm tracking-tight whitespace-nowrap shrink-0">
              Asistent QR Pontaj
            </span>
          </button>
        )}
      </div>

      {/* macOS Window Card */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[500px] h-[640px] max-h-[88vh] backdrop-blur-3xl bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-200">
          
          {/* macOS Title Bar with Traffic Lights */}
          <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between select-none shrink-0">
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

            {/* Window Status Indicator */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">Online</span>
            </div>
          </div>

          {/* TAB 1: Conversație Chat AI */}
          {activeTab === 'chat' && (
            <>
              {/* Quick Questions macOS Segmented Chips */}
              <div className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none shrink-0">
                {quickQuestions.map((q, qIdx) => {
                  const IconComp = q.icon;
                  return (
                    <button
                      key={qIdx}
                      onClick={() => handleSend(q.label)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#007AFF] hover:text-[#007AFF] dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all whitespace-nowrap shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <IconComp size={12} className="text-[#007AFF] shrink-0" />
                      <span className="whitespace-nowrap shrink-0">{q.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-slate-950/20">
                {messages.map((msg, mIdx) => {
                  const isUser = msg.role === 'user';
                  const showInteractiveCard = !isUser && isKioskRelated(msg.text);

                  return (
                    <div 
                      key={mIdx} 
                      className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-[#007AFF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Bot size={14} />
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

                            {/* Banner interactiv cu ecrane și navigare rapidă dacă răspunsul e despre Kiosk */}
                            {showInteractiveCard && (
                              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
                                <div className="p-3 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 shadow-xs">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <BookOpen size={14} className="text-[#007AFF] shrink-0" />
                                      <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                                        Ghid Vizual Interactiv pe Ecrane
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('visualGuide')}
                                      className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#007AFF] text-white hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
                                    >
                                      Deschide Ecrane →
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal mb-2.5">
                                    Include ecranul obligatoriu pentru Puncte de Lucru, formularul de Kiosk și ghidul iPad Guided Access.
                                  </p>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleNavigateTo('/admin/locations')}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-[#007AFF] hover:text-[#007AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                                    >
                                      <MapPin size={10} className="text-blue-600 shrink-0" />
                                      <span>1. Puncte de Lucru</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleNavigateTo('/admin/qr')}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-[#007AFF] hover:text-[#007AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                                    >
                                      <TabletSmartphone size={10} className="text-indigo-600 shrink-0" />
                                      <span>2. Tablete Kiosk</span>
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
                    <div className="w-7 h-7 rounded-full bg-[#007AFF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot size={14} />
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
    </>
  );
}
