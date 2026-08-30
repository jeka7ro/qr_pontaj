import React, { useState } from 'react';
import { ScanFace, AlertTriangle, ShieldCheck, ShieldAlert, Fingerprint } from 'lucide-react';

export default function FaceRecognitionModule({ tenant, themeColor }) {
  const [strictness, setStrictness] = useState('medium');
  const [saving, setSaving] = useState(false);

  const saveSettings = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ScanFace className="text-slate-400" size={24} />
            Recunoaștere Facială (Anti-Fraudă)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sistemul folosește AI pentru a bloca pontajele false prin compararea feței de la chioșc cu poza angajatului.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Setări Strictețe AI</h3>
          
          <div className="space-y-4">
            <div 
              onClick={() => setStrictness('low')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors flex gap-4 ${strictness === 'low' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
              style={strictness === 'low' ? { borderColor: themeColor } : {}}
            >
              <ShieldCheck size={24} className={strictness === 'low' ? '' : 'text-slate-400'} style={strictness === 'low' ? { color: themeColor } : {}} />
              <div>
                <div className="font-bold text-slate-800 dark:text-white">Relaxat</div>
                <div className="text-sm text-slate-500 mt-1">Acceptă variații mari (ochelari, mască). Doar fețele clar diferite sunt respinse.</div>
              </div>
            </div>

            <div 
              onClick={() => setStrictness('medium')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors flex gap-4 ${strictness === 'medium' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
              style={strictness === 'medium' ? { borderColor: themeColor } : {}}
            >
              <Fingerprint size={24} className={strictness === 'medium' ? '' : 'text-slate-400'} style={strictness === 'medium' ? { color: themeColor } : {}} />
              <div>
                <div className="font-bold text-slate-800 dark:text-white">Echilibrat (Recomandat)</div>
                <div className="text-sm text-slate-500 mt-1">Precizie ridicată. Respinge pontajele dacă nu se confirmă structura feței cu poza din HR.</div>
              </div>
            </div>

            <div 
              onClick={() => setStrictness('high')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors flex gap-4 ${strictness === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
            >
              <ShieldAlert size={24} className={strictness === 'high' ? 'text-red-500' : 'text-slate-400'} />
              <div>
                <div className="font-bold text-slate-800 dark:text-white">Maxim (Strict)</div>
                <div className="text-sm text-slate-500 mt-1">Cere condiții optime de lumină. Respinge imediat orice imperfecțiune sau acoperire a feței.</div>
              </div>
            </div>
          </div>

          <button 
            onClick={saveSettings}
            disabled={saving}
            className="w-full mt-6 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {saving ? 'Se salvează...' : 'Salvează Setările AI'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-white">Incidente de Fraudă Reținute (Ultimele 24h)</h3>
          </div>
          <div className="p-8 text-center flex flex-col items-center justify-center h-[350px]">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white">Niciun incident detectat</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[250px]">
              Nu s-au înregistrat încercări de fraudare a pontajului (scanare cod QR alt coleg) în ultima perioadă.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
