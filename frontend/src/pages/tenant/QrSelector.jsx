import React, { useState, useEffect } from 'react';
import { MapPin, QrCode, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

export default function QrSelector({ tenant, themeColor }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, [tenant.id]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/locations`);
      if (!res.ok) throw new Error('Nu am putut încărca locațiile.');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openKiosk = (locationId) => {
    const url = `/kiosk/${tenant.id}/${locationId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Afișaj Kiosk (Scanare QR)</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Alege un punct de lucru din lista de mai jos pentru a deschide interfața Full-Screen dedicată tabletei. Această interfață va împiedica ecranul să intre în stand-by.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Nu există puncte de lucru</h3>
          <p className="text-slate-500 dark:text-slate-400">Te rugăm să adaugi cel puțin un punct de lucru din meniul aferent înainte de a deschide un Kiosk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map(loc => (
            <div key={loc.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1">{loc.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{loc.address || 'Fără adresă'}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-6">
                <button
                  onClick={() => openKiosk(loc.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: themeColor }}
                >
                  <QrCode size={18} />
                  Deschide Mod Kiosk
                  <ExternalLink size={16} className="ml-1 opacity-70" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
