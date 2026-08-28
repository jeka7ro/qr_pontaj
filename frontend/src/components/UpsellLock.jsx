import React from 'react';
import { Lock, Sparkles, ChevronRight } from 'lucide-react';

export default function UpsellLock({ title, description, themeColor }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 h-full min-h-[70vh]">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center relative overflow-hidden">
        {/* Background Decoration */}
        <div 
          className="absolute top-0 left-0 right-0 h-32 opacity-10"
          style={{ background: `linear-gradient(to bottom, ${themeColor || '#2563EB'}, transparent)` }}
        ></div>
        
        <div className="relative z-10">
          <div 
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-inner"
            style={{ backgroundColor: `${themeColor || '#2563EB'}15`, color: themeColor || '#2563EB' }}
          >
            <Lock size={32} />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} className="text-amber-500" />
            Modul Premium
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-3">{title}</h2>
          
          <p className="text-slate-600 mb-8 leading-relaxed">
            {description || 'Această funcționalitate nu este inclusă în abonamentul tău curent.'} 
            Contactează administratorul platformei pentru a debloca acest modul și a-ți eficientiza și mai mult afacerea.
          </p>
          
          <button 
            onClick={() => window.location.href = 'mailto:contact@qrpontaj.ro?subject=Deblocare Modul Premium'}
            className="w-full flex items-center justify-center gap-2 px-6 h-12 rounded-full font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: themeColor || '#2563EB', boxShadow: `0 10px 25px -5px ${themeColor || '#2563EB'}60` }}
          >
            Solicită Deblocarea <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
