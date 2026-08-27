import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, AlertCircle, Maximize, Smartphone } from 'lucide-react';

export default function KioskDisplay() {
  const { tenantId, locationId } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());
  const [qrPayload, setQrPayload] = useState('');

  // Anti-standby state
  const wakeLockRef = useRef(null);

  // 1. Incarcare date Tenant pentru branding (logo, culori)
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/tenants/${tenantId}`);
        if (!res.ok) throw new Error('Nu am putut încărca datele tenantului.');
        const data = await res.json();
        setTenant(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [tenantId]);

  // 2. Ceas digital (update in fiecare secunda)
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Generare QR (update la fiecare 5 secunde)
  useEffect(() => {
    const updateQr = () => {
      const baseUrl = window.location.origin;
      const ts = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      const payload = `${baseUrl}/scan?t=${tenantId}&l=${locationId}&ts=${ts}`;
      setQrPayload(payload);
    };

    updateQr(); // initial call
    const interval = setInterval(updateQr, 5000); // 5 secunde refresh pentru securitate dinamica
    return () => clearInterval(interval);
  }, [tenantId, locationId]);

  // 4. WakeLock API (Prevenire Standby)
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active! Screen will not sleep.');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    // Re-cere wakelock daca tab-ul devine iar vizibil (de ex. schimbare de app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release()
          .then(() => console.log('Wake Lock released.'));
      }
    };
  }, []);

  // 5. Fullscreen helper (optional, pentru experienta reala kiosk)
  const requestFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Eroare Kiosk</h1>
        <p className="text-slate-400 text-lg">{error}</p>
      </div>
    );
  }

  const themeColor = tenant?.theme_color || '#3b82f6';

  // Formatare data & timp pentru display urias
  const timeString = time.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden fixed inset-0 selection:bg-transparent">

      {/* Background Decorativ Subtil */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${themeColor} 0%, transparent 50%)`,
          filter: 'blur(100px)'
        }}
      />

      <div className="w-full max-w-5xl px-8 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">

        {/* Partea Stanga: Logo, Nume si Timp */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-4 mb-8">
            {tenant.logo_url ? (
              <img src={`http://localhost:5001${tenant.logo_url}`} alt="Logo" className="h-16 md:h-24 object-contain filter drop-shadow-lg" />
            ) : (
              <div
                className="w-16 h-16 md:w-24 md:h-24 rounded-3xl flex items-center justify-center text-3xl md:text-5xl font-black shadow-lg"
                style={{ backgroundColor: themeColor, color: '#fff' }}
              >
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">{tenant.name}</h1>
              <p className="text-lg md:text-xl text-slate-400 font-medium mt-1 uppercase tracking-widest">Portal Angajați</p>
            </div>
          </div>

          <div className="mt-8 mb-4">
            <div className="text-7xl md:text-[8rem] font-black text-white leading-none tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {timeString}
            </div>
            <div className="text-2xl md:text-4xl text-slate-400 font-medium mt-4 capitalize">
              {dateString}
            </div>
          </div>
        </div>

        {/* Partea Dreapta: QR Code */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            {/* O mica animatie sa arate ca e activ */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 animate-pulse" />

            <QRCodeSVG
              value={qrPayload}
              size={320}
              fgColor="#0f172a"
              level="H"
              includeMargin={false}
              className="relative z-10"
            />
          </div>

          <div className="mt-8 text-center max-w-sm">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Smartphone className="w-8 h-8 text-white animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Deschide aplicația</h2>
            <p className="text-slate-400 text-lg">Scanează codul de mai sus pentru a înregistra intrarea sau ieșirea de la job.</p>

            {/* Link temporar de testare pentru desktop */}
            <a
              href={qrPayload}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block px-4 py-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-xs text-slate-300 transition-colors border border-slate-700"
            >
              (Test Desktop: Click Aici)
            </a>
          </div>
        </div>

      </div>

      {/* Buton ascuns/subtil pt Full Screen */}
      <button
        onClick={requestFullScreen}
        className="absolute bottom-6 right-6 p-4 rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
        title="Intră în modul Full Screen"
      >
        <Maximize size={24} />
      </button>

    </div>
  );
}
