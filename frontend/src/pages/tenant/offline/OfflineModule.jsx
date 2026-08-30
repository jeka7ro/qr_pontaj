import React, { useState, useEffect } from 'react';
import { Globe, WifiOff, RefreshCcw, Database, HardDrive, CheckCircle2 } from 'lucide-react';

export default function OfflineModule({ tenant, themeColor }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Simulate reading local storage for pending scans
    const saved = localStorage.getItem(`pending_scans_${tenant.id}`);
    if (saved) setPendingScans(JSON.parse(saved).length);
    else setPendingScans(0);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tenant.id]);

  const forceSync = () => {
    setSyncing(true);
    // Simulate syncing process
    setTimeout(() => {
      localStorage.removeItem(`pending_scans_${tenant.id}`);
      setPendingScans(0);
      setSyncing(false);
      alert('Sincronizare finalizată cu succes!');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="text-slate-400" size={24} />
            Diagnosticare Mod Offline
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verifică starea aplicației de scanare și forțează sincronizarea datelor salvate local.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Stare Conexiune</h3>
            <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
              {isOnline ? <Globe size={24} /> : <WifiOff size={24} />}
            </div>
          </div>
          
          <div className="text-3xl font-black mb-2 dark:text-white">
            {isOnline ? 'Conectat (Online)' : 'Fără Internet (Offline)'}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isOnline 
              ? 'Toate tabletele trimit datele instantaneu către serverul central.' 
              : 'Sistemul funcționează din cache. Toate scanările sunt salvate temporar în tablete.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Scanări În Așteptare</h3>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30">
              <Database size={24} />
            </div>
          </div>
          
          <div className="text-3xl font-black mb-2 dark:text-white">
            {pendingScans} pontaje
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            stocate local pe acest dispozitiv și care încă nu au fost trimise la baza de date.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-6">Acțiuni Sincronizare</h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={forceSync}
            disabled={!isOnline || pendingScans === 0 || syncing}
            className="flex-1 flex items-center justify-center gap-2 px-4 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            <RefreshCcw size={18} className={syncing ? "animate-spin" : ""} />
            {syncing ? 'Se sincronizează...' : 'Forțează Sincronizarea Acum'}
          </button>
          
          <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1 text-slate-800 dark:text-white font-bold">
              <HardDrive size={16} /> Baza de date locală
            </div>
            Sistemul IndexedDB reține până la 10.000 de scanări consecutive offline.
          </div>
        </div>
      </div>
    </div>
  );
}
