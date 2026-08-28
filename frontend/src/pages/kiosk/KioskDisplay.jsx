import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, AlertCircle, Maximize, Smartphone, WifiOff } from 'lucide-react';

export default function KioskDisplay() {
  const { tenantId, kioskId } = useParams();
  const [tenant, setTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kiosk_tenant_${tenantId}`)) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!tenant);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());
  const [qrPayload, setQrPayload] = useState('');
  
  // Security PIN and layout state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orientation, setOrientation] = useState(() => localStorage.getItem(`kiosk_orientation_${kioskId}`) || 'horizontal');
  const [kioskColors, setKioskColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kiosk_colors_${kioskId}`)) || {}; } catch { return {}; }
  });
  const [kioskContent, setKioskContent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kiosk_content_${kioskId}`)) || {}; } catch { return {}; }
  });
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [networkIp, setNetworkIp] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Anti-standby state
  const wakeLockRef = useRef(null);

  // 1. Incarcare date Tenant pentru branding (logo, culori)
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
        const res = await fetch(`${apiUrl}/api/tenants/${tenantId}`);
        if (!res.ok) throw new Error('Nu am putut încărca datele tenantului.');
        const data = await res.json();
        setTenant(data);
        localStorage.setItem(`kiosk_tenant_${tenantId}`, JSON.stringify(data));
      } catch (err) {
        if (!localStorage.getItem(`kiosk_tenant_${tenantId}`)) {
          setError(err.message);
        }
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

  // 3. Generare QR (update la fiecare 5 secunde) + Auto-Refresh Setări Kiosk
  useEffect(() => {
    let resolvedIp = networkIp;
    
    // Fetch network IP just once if on localhost
    const getNetworkIp = async () => {
      if (window.location.hostname.includes('localhost') && !resolvedIp) {
        try {
          const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
          const res = await fetch(`${apiUrl}/api/system/ip`);
          if (res.ok) {
            const data = await res.json();
            if (data.ip && data.ip !== 'localhost') {
              resolvedIp = data.ip;
              setNetworkIp(resolvedIp);
            }
          }
        } catch (e) {
          console.warn('Eroare fetch IP:', e);
        }
      }
    };

    const updateQrAndMeta = async () => {
      await getNetworkIp();
      
      // QR Payload
      let baseUrl = window.location.origin;
      if (window.location.hostname.includes('localhost') && resolvedIp) {
        baseUrl = `${window.location.protocol}//${resolvedIp}:${window.location.port || 5188}`;
      }
      
      const ts = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
      const payload = `${baseUrl}/scan?t=${tenantId}&k=${kioskId}&ts=${ts}`;
      setQrPayload(payload);

      // Fetch kiosk settings silently
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
        const kiosksRes = await fetch(`${apiUrl}/api/tenants/${tenantId}/kiosks`);
        if (kiosksRes.ok) {
          const kiosksData = await kiosksRes.json();
          const myKiosk = kiosksData.find(k => k.id === parseInt(kioskId));
          if (myKiosk) {
            setOrientation(myKiosk.kiosk_orientation || 'horizontal');
            localStorage.setItem(`kiosk_orientation_${kioskId}`, myKiosk.kiosk_orientation || 'horizontal');
            
            const newColors = {
              timer: myKiosk.kiosk_timer_color || '',
              timer_bg: myKiosk.kiosk_timer_bg_color || '',
              bg: myKiosk.kiosk_bg_color || '',
              logo_bg: myKiosk.kiosk_logo_bg || '',
              logo_size: myKiosk.kiosk_logo_size || 1,
              logo_x: myKiosk.kiosk_logo_x ?? 5,
              logo_y: myKiosk.kiosk_logo_y ?? 5
            };
            setKioskColors(newColors);
            localStorage.setItem(`kiosk_colors_${kioskId}`, JSON.stringify(newColors));

            const newContent = {
              title: myKiosk.kiosk_title || 'Pontaj Digital',
              subtitle: myKiosk.kiosk_subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.'
            };
            setKioskContent(newContent);
            localStorage.setItem(`kiosk_content_${kioskId}`, JSON.stringify(newContent));
          }
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
      } catch (e) {
        setIsOffline(true);
      }
    };

    updateQrAndMeta(); // initial call
    const interval = setInterval(updateQrAndMeta, 5000); // 5 secunde refresh
    return () => clearInterval(interval);
  }, [tenantId, kioskId]);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;


        if (localStorage.getItem(`kiosk_auth_${kioskId}`) === 'true') {
          setIsAuthorized(true);
          setCheckingAuth(false);
          return;
        }
        
        const res = await fetch(`${apiUrl}/api/tenants/${tenantId}/kiosks/${kioskId}/auth_kiosk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: '' })
        });
        
        const data = await res.json();
        
        if (data.orientation) {
          setOrientation(data.orientation);
          localStorage.setItem(`kiosk_orientation_${kioskId}`, data.orientation);
        }
        if (data.colors) {
          setKioskColors(data.colors);
        }

        if (data.message === 'Fără PIN' || data.message === 'Autorizat') {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error('Error checking kiosk auth:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [tenantId, kioskId]);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pinEntry.length !== 4) return;
    
    setPinError('');
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const res = await fetch(`${apiUrl}/api/tenants/${tenantId}/kiosks/${kioskId}/auth_kiosk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinEntry })
      });
      
      if (!res.ok) {
        setPinError('PIN Incorect');
        setPinEntry('');
        return;
      }
      
      const data = await res.json();
      if (data.orientation) {
        setOrientation(data.orientation);
        localStorage.setItem(`kiosk_orientation_${kioskId}`, data.orientation);
      }
      if (data.colors) {
        setKioskColors(data.colors);
      }
      if (data.content) {
        setKioskContent(data.content);
      }
      
      localStorage.setItem(`kiosk_auth_${kioskId}`, 'true');
      setIsAuthorized(true);
    } catch (err) {
      setPinError('Eroare de conexiune.');
    }
  };

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
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const blankVideoBase64 = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAW1wNDFpc29tAAAAO21vb3YAAABsbXZoZAAAAADAwMAAAMDAwAAKAAAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABtZGF0';

  if (loading && !tenant) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <h2 className="text-xl text-white font-bold">Se încarcă Kiosk-ul...</h2>
      </div>
    );
  }

  const themeColor = tenant?.theme_color || '#3b82f6';
  const customBgColor = kioskColors.bg || '';
  const customTimerColor = kioskColors.timer || themeColor;
  const customLogoBg = kioskColors.logo_bg || 'rgba(15, 23, 42, 0.5)'; // bg-slate-900/50 fallback

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans" style={{ backgroundColor: customBgColor || '#020617', '--tenant-color': themeColor }}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
            <Smartphone size={40} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Kiosk Securizat</h2>
          <p className="text-slate-400 font-medium mb-8">Introduceți codul PIN pentru a debloca tableta.</p>
          
          <form onSubmit={handlePinSubmit} className="w-full">
            <div className="flex justify-center gap-3 mb-8">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-14 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2 transition-colors ${
                    pinEntry.length > i 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  {pinEntry.length > i ? '•' : ''}
                </div>
              ))}
            </div>
            
            {pinError && <p className="text-red-500 font-bold mb-6">{pinError}</p>}
            
            <div className="grid grid-cols-3 gap-3 mb-6 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => pinEntry.length < 4 && setPinEntry(prev => prev + num)}
                  className="h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-black text-xl transition-colors"
                >
                  {num}
                </button>
              ))}
              <div className="h-16"></div>
              <button
                type="button"
                onClick={() => pinEntry.length < 4 && setPinEntry(prev => prev + '0')}
                className="h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-black text-xl transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinEntry(prev => prev.slice(0, -1))}
                className="h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-xl transition-colors flex items-center justify-center"
              >
                ⌫
              </button>
            </div>
            
            <button 
              type="submit"
              disabled={pinEntry.length !== 4}
              className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-black uppercase tracking-wider transition-colors"
            >
              Deblochează
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: customBgColor || '#020617' }}>
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Eroare Kiosk</h1>
        <p className="text-slate-400 text-lg">{error}</p>
      </div>
    );
  }

  const isVertical = orientation === 'vertical';

  // Formatare data & timp pentru display urias
  const timeString = time.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden" style={{ backgroundColor: customBgColor || '#020617', '--tenant-color': themeColor }}>
      {/* 100% full-screen transparent video layer (Ultimate Fix for WebOS Standby) */}
      <video src={blankVideoBase64} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full opacity-[0.01] pointer-events-none z-0" />
      
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {tenant?.logo_url ? (
          <div 
            className={`p-3 rounded-2xl pointer-events-auto absolute ${kioskColors.show_logo_bg !== false ? 'border border-slate-800 shadow-sm backdrop-blur-sm' : ''}`} 
            style={{
              left: `${kioskColors.logo_x ?? 5}%`,
              top: `${kioskColors.logo_y ?? 5}%`,
              transform: `translate(-${kioskColors.logo_x ?? 5}%, -${kioskColors.logo_y ?? 5}%)`,
              backgroundColor: kioskColors.show_logo_bg !== false ? customLogoBg : 'transparent',
              zIndex: 10
            }}
          >
            <img 
              src={tenant.logo_url.startsWith('http') ? tenant.logo_url : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${tenant.logo_url}`} 
              alt={tenant.name} 
              className="object-contain transition-all"
              style={{ height: `${(kioskColors.logo_size || 1) * 1.5 + 2}rem` }}
            />
          </div>
        ) : (
          <div 
            className={`text-xl md:text-2xl font-black text-white px-6 py-3 rounded-full pointer-events-auto absolute ${kioskColors.show_logo_bg !== false ? 'bg-slate-900/50 border border-slate-800' : ''}`} 
            style={{
              left: `${kioskColors.logo_x ?? 5}%`,
              top: `${kioskColors.logo_y ?? 5}%`,
              transform: `translate(-${kioskColors.logo_x ?? 5}%, -${kioskColors.logo_y ?? 5}%)`,
              zIndex: 10
            }}
          >
            {tenant?.name || 'Companie'}
          </div>
        )}
        
        <button 
          onClick={toggleFullscreen}
          className="w-12 h-12 rounded-full bg-slate-900/50 border border-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors absolute bottom-6 right-6 md:bottom-8 md:right-8 z-50 pointer-events-auto"
          title="Fullscreen"
        >
          <Maximize size={24} />
        </button>

        {isOffline && (
          <div className="absolute top-6 right-6 z-50 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 pointer-events-auto">
            <WifiOff size={18} /> Offline
          </div>
        )}
      </div>

      {/* Continut Principal */}
      <div 
        className="flex-1 flex items-center justify-center p-6 pb-12 overflow-y-auto transition-all"
        style={{
          paddingTop: tenant?.logo_url && (kioskColors.logo_y ?? 5) < 40 
            ? `${((kioskColors.logo_size || 1) * 1.5 + 2) + ((kioskColors.logo_y ?? 5) / 5) + 4}rem` 
            : '1.5rem'
        }}
      >
        <div className={`w-full max-w-6xl flex ${isVertical ? 'flex-col gap-10' : 'flex-col lg:flex-row'} items-center justify-between gap-8 lg:gap-16`}>
          
          {/* Zona Stanga: Info & Ceas */}
          <div className={`flex flex-col text-white ${isVertical ? 'items-center text-center' : ''}`}>
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight ${isVertical ? 'text-center' : ''}`}>
              {kioskContent.title || 'Pontaj Digital'}
            </h1>
            <p className={`text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-md ${isVertical ? 'text-center' : ''}`}>
              {kioskContent.subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.'}
            </p>
            
            <div className={`p-8 rounded-[2rem] ${isVertical ? 'w-full max-w-md flex flex-col items-center' : 'inline-flex flex-col'} ${kioskColors.show_timer_bg !== false ? 'border border-slate-800 backdrop-blur-sm shadow-2xl' : ''}`} style={kioskColors.show_timer_bg !== false ? { backgroundColor: kioskColors.timer_bg || customLogoBg } : {}}>
              <div className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter" style={{ color: customTimerColor, textShadow: `0 0 40px ${customTimerColor}40`, fontVariantNumeric: 'tabular-nums' }}>
                {timeString}
              </div>
              <div className="text-2xl md:text-3xl text-slate-400 font-bold mt-2 tracking-wide uppercase">
                {dateString}
              </div>
            </div>
          </div>

          {/* Zona Dreapta: Codul QR */}
          <div className={`flex flex-col items-center ${isVertical ? 'w-full max-w-sm' : 'shrink-0'}`}>
            <div className={`bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl relative ${isVertical ? 'w-full aspect-square flex items-center justify-center' : ''}`}>
              {/* Pulsing glow behind QR */}
              <div className="absolute inset-0 rounded-[3rem] animate-pulse-slow opacity-20" style={{ backgroundColor: themeColor, filter: 'blur(30px)', zIndex: -1 }}></div>
              
              {qrPayload ? (
                <QRCodeSVG 
                  value={qrPayload} 
                  size={isVertical ? 280 : 320} 
                  level="H"
                  includeMargin={false}
                  className="rounded-xl drop-shadow-sm relative z-10"
                  fgColor="#0f172a" 
                />
              ) : (
                <div className={`w-[320px] h-[320px] ${isVertical ? 'w-[280px] h-[280px]' : ''} bg-slate-100 rounded-xl flex items-center justify-center relative z-10`}>
                  <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                </div>
              )}
            </div>
            
            <div className="mt-8 flex items-center gap-3 bg-slate-900/50 px-6 py-3 rounded-full border border-slate-800 text-slate-300 font-medium text-sm md:text-base backdrop-blur-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: themeColor }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: themeColor }}></span>
              </span>
              Codul se actualizează automat
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
