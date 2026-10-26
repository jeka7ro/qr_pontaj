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
  ChevronDown,
  RotateCcw
} from 'lucide-react';

export default function AiHelpAssistant({ tenant, themeColor = '#2563EB', pageContext = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Bună ziua! Sunt asistentul inteligent QR Pontaj. Vă pot ajuta cu pașii exacți pentru configurarea unui Kiosk pe tabletă, blocarea ecranului (iPad sau Android), modul de scanare pentru angajați sau exportul rapoartelor pentru contabilitate. Cu ce vă pot fi de folos?'
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

  // Formatare simplă text markdown (bold, liste numerotate, paragrafe)
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
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0"></span>
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
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-5 h-12 rounded-full text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 border-2 border-white/20 whitespace-nowrap shrink-0 group"
            style={{ backgroundColor: themeColor }}
            title="Deschide Asistentul QR Pontaj"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight whitespace-nowrap shrink-0">
              Asistent QR Pontaj
            </span>
          </button>
        )}
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[460px] h-[600px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-200">
          
          {/* Header */}
          <div 
            className="px-5 py-4 flex items-center justify-between text-white shrink-0 shadow-md"
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm tracking-tight truncate">
                    Asistent Inteligent QR Pontaj
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    AI Online
                  </span>
                </div>
                <p className="text-xs text-white/80 truncate mt-0.5">
                  Ghidaj pas cu pas pentru Kiosk, tabletă și pontaj
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleResetChat}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Resetează conversația"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Închide asistentul"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Questions Pills */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0">
            {quickQuestions.map((q, qIdx) => {
              const IconComp = q.icon;
              return (
                <button
                  key={qIdx}
                  onClick={() => handleSend(q.label)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all whitespace-nowrap shrink-0 shadow-sm disabled:opacity-50"
                >
                  <IconComp size={13} className="text-primary-500 shrink-0" />
                  <span className="whitespace-nowrap shrink-0">{q.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, mIdx) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={mIdx} 
                  className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Bot size={15} />
                    </div>
                  )}

                  <div 
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-sm ${
                      isUser 
                        ? 'text-white rounded-br-none font-medium' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700'
                    }`}
                    style={isUser ? { backgroundColor: themeColor } : {}}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  <Bot size={15} />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none p-3.5 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-xs text-slate-400 font-medium ml-1">Asistentul tastează...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
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
                placeholder="Scrie o întrebare... (ex: Cum deschid linkul pe tabletă?)"
                disabled={loading}
                className="flex-1 px-4 h-11 text-xs sm:text-sm rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0"
                style={{ backgroundColor: themeColor }}
                title="Trimite întrebarea"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
