import React, { useState, useEffect } from 'react';
import { Globe, WifiOff } from 'lucide-react';

export default function OfflineModule({ tenant, themeColor }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tenant.id]);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="text-slate-400" size={24} />
            Stare Conexiune
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Starea conexiunii la internet a acestui dispozitiv.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 dark:text-white">Conexiune</h3>
          <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
            {isOnline ? <Globe size={24} /> : <WifiOff size={24} />}
          </div>
        </div>

        <div className="text-3xl font-black mb-2 dark:text-white">
          {isOnline ? 'Conectat (Online)' : 'Fără Internet (Offline)'}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isOnline
            ? 'Acest dispozitiv este conectat la internet.'
            : 'Acest dispozitiv nu are internet. Pontajele nu pot fi trimise până revine conexiunea.'}
        </p>
      </div>
    </div>
  );
}
