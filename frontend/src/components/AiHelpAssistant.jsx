import React, { useState, useRef, useEffect } from 'react';
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
  Maximize2
} from 'lucide-react';

export default function AiHelpAssistant({ tenant, themeColor = '#007AFF', pageContext = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Bună ziua! Sunt asistentul inteligent QR Pontaj. Vă pot ajuta cu pașii exacți pentru configurarea unui Kiosk pe tabletă, blocarea ecranului pe iPad sau Android, modul de scanare pentru angajați sau descărcarea rapoartelor pentru contabilitate. Cu ce vă pot fi de folos?'
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
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
          text: 'Conexiunea cu asistentul AI a fost întreruptă temporar. Vă rugăm să consultați Ghidul de Kiosk din meniu sau să încercați din nou peste câteva secunde.'
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
        text: 'Conversația a fost resetată. Cu ce altceva vă mai pot ajuta legat de QR Pontaj sau configurarea Kiosk-urilor?'
      }
    ]);
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
        return <div key={idx} className="h-2"></div>;
      }

      return (
        <p key={idx} className="my-1 text-slate-700 dark:text-slate-300 leading-relaxed">
          {formattedParts}
        </p>
      );
    });
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
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[470px] h-[610px] max-h-[86vh] backdrop-blur-3xl bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-200">
          
          {/* macOS Title Bar with Traffic Lights */}
          <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between select-none shrink-0">
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

            {/* Window Title */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-tight">
              <Bot size={14} className="text-[#007AFF]" />
              <span>Asistent QR Pontaj</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>
            </div>

            {/* Action */}
            <button
              onClick={handleResetChat}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2 py-0.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors whitespace-nowrap shrink-0"
              title="Resetează conversația"
            >
              Curăță
            </button>
          </div>

          {/* Quick Questions macOS Segmented Chips */}
          <div className="px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none shrink-0">
            {quickQuestions.map((q, qIdx) => {
              const IconComp = q.icon;
              return (
                <button
                  key={qIdx}
                  onClick={() => handleSend(q.label)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#007AFF] hover:text-[#007AFF] dark:hover:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all whitespace-nowrap shrink-0 shadow-xs disabled:opacity-50"
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
                    className={`max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                      isUser 
                        ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-xs font-medium' 
                        : 'bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-200/70 dark:border-white/10 shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-1">
                        {renderFormattedText(msg.text)}
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
                placeholder="Scrie o întrebare... (ex: Cum blochez tableta?)"
                disabled={loading}
                className="flex-1 px-4 h-10 text-xs sm:text-sm rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#007AFF] transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#007AFF] text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shrink-0"
                title="Trimite"
              >
                <Send size={15} />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
