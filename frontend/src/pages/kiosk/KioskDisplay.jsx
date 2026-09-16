import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, AlertCircle, Maximize, Smartphone, WifiOff, ScanLine, CheckCircle2, User, Lock, Delete, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { updatePageFavicon } from '../../utils/favicon';

export default function KioskDisplay() {
  const { tenantId, kioskId } = useParams();
  const [searchParams] = useSearchParams();
  const overrideMode = searchParams.get('mode');
  const [tenant, setTenant] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kiosk_tenant_${tenantId}`)) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!tenant);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());
  const [qrPayload, setQrPayload] = useState('');
  
  // Kiosk layout & branding state
  const [orientation, setOrientation] = useState(() => localStorage.getItem(`kiosk_orientation_${kioskId}`) || 'horizontal');
  const [kioskColors, setKioskColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kiosk_colors_${kioskId}`)) || {}; } catch { return {}; }
  });
  const [kioskContent, setKioskContent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`kiosk_content_${kioskId}`)) || {}; } catch { return {}; }
  });
  const [qrMode, setQrMode] = useState(() => localStorage.getItem(`kiosk_qr_mode_${kioskId}`) || 'DYNAMIC');

  const effectiveQrMode = qrMode === 'HARDWARE' || qrMode === 'SCANNER' ? 'HARDWARE' :
                          (qrMode === 'HYBRID' && overrideMode === 'scanner') ? 'HARDWARE' : 
                          (qrMode === 'HYBRID' && overrideMode === 'kiosk') ? 'DYNAMIC' : 
                          (qrMode === 'HYBRID' ? 'DYNAMIC' : qrMode);

  const [networkIp, setNetworkIp] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [scanBuffer, setScanBuffer] = useState('');
  const [scanSuccess, setScanSuccess] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Kiosk history state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPin, setHistoryPin] = useState('');
  const [historyPinShake, setHistoryPinShake] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

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
        if (data.favicon_url || data.logo_url) {
          updatePageFavicon(data.favicon_url || data.logo_url, `${data.name || 'Kiosk'} - Pontaj`);
        }
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
        const kiosksRes = await fetch(`${apiUrl}/api/tenants/${tenantId}/kiosks`, { cache: 'no-store' });
        if (kiosksRes.ok) {
          const kiosksData = await kiosksRes.json();
          const myKiosk = kiosksData.find(k => k.id === parseInt(kioskId));
          if (myKiosk) {
            setOrientation(myKiosk.kiosk_orientation || 'horizontal');
            localStorage.setItem(`kiosk_orientation_${kioskId}`, myKiosk.kiosk_orientation || 'horizontal');
            
            if (myKiosk.qr_mode) {
              setQrMode(myKiosk.qr_mode);
              localStorage.setItem(`kiosk_qr_mode_${kioskId}`, myKiosk.qr_mode);
            }

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

  // 4. SSE (Server-Sent Events) listener for remote scans (Dynamic QR)
  useEffect(() => {
    if (!kioskId) return;
    
    let eventSource = null;
    let timeoutId = null;

    const connectSSE = () => {
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      eventSource = new EventSource(`${apiUrl}/api/scan/stream/${kioskId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'connected') return;

          if (data.employee && data.type) {
            setScanSuccess({
              employee: data.employee,
              action: data.type,
              type: data.type,
              duplicate: data.duplicate || false,
              message: data.message || ''
            });
            
            // Clear after 4s (or 6.5s if birthday)
            const duration = data.employee?.is_birthday ? 6500 : 4000;
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              setScanSuccess(null);
            }, duration);
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        eventSource.close();
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [kioskId]);

  // Incarcare configuratie Kiosk (culori, orientare, branding)
  useEffect(() => {
    const fetchKioskConfig = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
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
        if (data.content) {
          setKioskContent(data.content);
        }
      } catch (err) {
        console.error('Error loading kiosk config:', err);
      }
    };
    fetchKioskConfig();
  }, [tenantId, kioskId]);

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

  // Hardware Scanner Hook
  const scanBufferRef = useRef('');
  useEffect(() => {
    if (effectiveQrMode !== 'HARDWARE') return;

    let timeout;
    const handleKeyDown = (e) => {
      // Ignorăm tastele modificatoare
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      
      if (e.key === 'Enter') {
        if (scanBufferRef.current.length > 5) {
          processHardwareScan(scanBufferRef.current);
        }
        scanBufferRef.current = '';
        return;
      }

      scanBufferRef.current += e.key;
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const buffer = scanBufferRef.current.trim();
        if (buffer.length > 5) {
          if ((buffer.startsWith('{') && buffer.endsWith('}')) || (buffer.startsWith('QRP-EMP-') && buffer.length > 10)) {
            processHardwareScan(buffer);
          }
        }
        scanBufferRef.current = '';
      }, 800);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [effectiveQrMode]);

  const processHardwareScan = async (payload) => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const res = await fetch(`${apiUrl}/api/tenants/${tenantId}/hardware-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload, kiosk_id: kioskId })
      });
      
      const data = await res.json();
      if (res.ok) {
        setScanSuccess(data);
        const duration = data.employee?.is_birthday ? 6500 : 4000;
        setTimeout(() => setScanSuccess(null), duration);
      } else {
        setScanError(data.error || 'Eroare scanare');
        setTimeout(() => setScanError(null), 3500);
      }
    } catch (err) {
      setScanError(err.message || 'Eroare conexiune.');
      setTimeout(() => setScanError(null), 3000);
    }
  };

  const fetchHistory = async (pinToVerify = historyPin) => {
    if (!pinToVerify || pinToVerify.length !== 4) {
      setHistoryError('Introduceți codul PIN de 4 cifre.');
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const res = await fetch(`${apiUrl}/api/tenants/${tenantId}/hardware-scan/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kiosk_id: kioskId, pin_code: pinToVerify })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PIN incorect.');
      setHistoryData(data);
    } catch (err) {
      setHistoryError(err.message || 'PIN incorect.');
      setHistoryPinShake(true);
      setTimeout(() => {
        setHistoryPinShake(false);
        setHistoryPin('');
      }, 500);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Keyboard listener for history modal
  useEffect(() => {
    if (!showHistoryModal || historyData) return;
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (historyLoading || historyPin.length >= 4) return;
        const next = historyPin + e.key;
        setHistoryPin(next);
        setHistoryError(null);
        if (next.length === 4) {
          fetchHistory(next);
        }
      } else if (e.key === 'Backspace') {
        setHistoryPin(prev => prev.slice(0, -1));
        setHistoryError(null);
      } else if (e.key === 'Escape') {
        setShowHistoryModal(false);
        setHistoryPin('');
        setHistoryError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHistoryModal, historyData, historyPin, historyLoading]);

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
            className={`p-3 rounded-lg pointer-events-auto absolute ${kioskColors.show_logo_bg !== false ? 'border border-slate-800 shadow-sm backdrop-blur-sm' : ''}`} 
            style={{
              left: `${kioskColors.logo_x ?? 5}%`,
              top: `${kioskColors.logo_y ?? 5}%`,
              transform: `translate(-${kioskColors.logo_x ?? 5}%, -${kioskColors.logo_y ?? 5}%)`,
              backgroundColor: kioskColors.show_logo_bg !== false ? customLogoBg : 'transparent',
              zIndex: 10
            }}
          >
            <img 
              src={tenant.logo_url?.startsWith('http') ? tenant.logo_url : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${tenant.logo_url}`} 
              alt={tenant.name} 
              className="object-contain transition-all"
              style={{ height: `${(kioskColors.logo_size || 1) * 1.5 + 2}rem` }}
            />
          </div>
        ) : (
          <div 
            className={`text-xl md:text-2xl font-black text-white px-5 h-10 text-sm flex items-center justify-center rounded-lg pointer-events-auto absolute ${kioskColors.show_logo_bg !== false ? 'bg-slate-900/50 border border-slate-800' : ''}`} 
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
        
        {/* Top Controls: iPhone Glassmorphism Island */}
        <div className="absolute top-5 right-5 flex items-center gap-3 z-50 pointer-events-auto">
          <button 
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-900/50 hover:bg-white/20 active:scale-95 backdrop-blur-2xl border border-white/20 shadow-xl shadow-black/20 flex items-center justify-center text-white/80 hover:text-white transition-all duration-150 cursor-pointer"
            title="Ecran complet"
          >
            <Maximize size={22} />
          </button>
          <button 
            onClick={() => {
              setShowHistoryModal(true);
              setHistoryPin('');
              setHistoryData(null);
              setHistoryError(null);
            }}
            className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-900/50 hover:bg-white/20 active:scale-95 backdrop-blur-2xl border border-white/20 shadow-xl shadow-black/20 flex items-center justify-center text-white/80 hover:text-white transition-all duration-150 cursor-pointer"
            title="Istoric Acces"
          >
            <User size={22} />
          </button>
        </div>

        {/* Istoric Modal - Tastatură pe ecran ca la iPhone (Fără tastatură iPad) */}
        {showHistoryModal && (
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[100] flex items-center justify-center pointer-events-auto p-4 select-none" 
            onClick={() => { setShowHistoryModal(false); setHistoryData(null); setHistoryPin(''); setHistoryError(null); }}
          >
            <div 
              className="bg-slate-950/85 border border-white/15 text-white w-full max-w-sm sm:max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl shadow-black/80 relative backdrop-blur-2xl flex flex-col items-center" 
              onClick={e => e.stopPropagation()}
            >
              {/* Buton Închidere */}
              <button 
                onClick={() => { setShowHistoryModal(false); setHistoryData(null); setHistoryPin(''); setHistoryError(null); }} 
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                title="Închide"
              >
                <X size={18} />
              </button>

              {!historyData ? (
                /* Tastatură Touch Screen iPhone (Passcode Pad) */
                <div className="w-full flex flex-col items-center">
                  {tenant?.logo_url ? (
                    <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 p-3 flex items-center justify-center mb-3 shadow-2xl backdrop-blur-xl">
                      <img 
                        src={tenant.logo_url.startsWith('http') ? tenant.logo_url : `${(import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')).replace(/\/$/, '')}/${tenant.logo_url.replace(/^\//, '')}`}
                        alt={tenant.name}
                        className="w-full h-full object-contain filter drop-shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3 shadow-inner">
                      <Lock size={26} />
                    </div>
                  )}
                  <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Introduceți codul PIN</h2>

                  {/* 4 Puncte Indicator iPhone */}
                  <div className={`flex items-center justify-center gap-4.5 my-6 ${historyPinShake ? 'animate-shake' : ''}`}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          historyPin.length > i
                            ? 'bg-white border-2 border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.9)]'
                            : 'border-2 border-white/40 bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Mesaj eroare / încărcare */}
                  <div className="h-6 text-xs font-semibold tracking-wide text-center">
                    {historyLoading ? (
                      <span className="text-white/70 flex items-center justify-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" /> Se verifică...
                      </span>
                    ) : historyError ? (
                      <span className="text-rose-400">{historyError}</span>
                    ) : null}
                  </div>

                  {/* Taste Numerice Rotunde iPhone */}
                  <div className="grid grid-cols-3 gap-3.5 sm:gap-4 mt-2">
                    {[
                      { num: '1', letters: '' },
                      { num: '2', letters: 'ABC' },
                      { num: '3', letters: 'DEF' },
                      { num: '4', letters: 'GHI' },
                      { num: '5', letters: 'JKL' },
                      { num: '6', letters: 'MNO' },
                      { num: '7', letters: 'PQRS' },
                      { num: '8', letters: 'TUV' },
                      { num: '9', letters: 'WXYZ' },
                      { special: 'cancel', label: 'Anulează' },
                      { num: '0', letters: '+' },
                      { special: 'delete' },
                    ].map((key) => {
                      if (key.special === 'cancel') {
                        return (
                          <button
                            key="cancel"
                            type="button"
                            onClick={() => { setShowHistoryModal(false); setHistoryPin(''); setHistoryError(null); }}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white/70 hover:text-white text-sm font-medium active:scale-90 transition-all duration-150 cursor-pointer"
                          >
                            Anulează
                          </button>
                        );
                      }
                      if (key.special === 'delete') {
                        return (
                          <button
                            key="delete"
                            type="button"
                            onClick={() => { setHistoryPin(prev => prev.slice(0, -1)); setHistoryError(null); }}
                            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all duration-150 cursor-pointer"
                            title="Șterge"
                          >
                            <Delete size={24} />
                          </button>
                        );
                      }
                      return (
                        <button
                          key={key.num}
                          type="button"
                          disabled={historyLoading || historyPin.length >= 4}
                          onClick={() => {
                            if (historyLoading || historyPin.length >= 4) return;
                            const next = historyPin + key.num;
                            setHistoryPin(next);
                            setHistoryError(null);
                            if (next.length === 4) {
                              fetchHistory(next);
                            }
                          }}
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/35 active:scale-90 backdrop-blur-2xl border border-white/20 text-white flex flex-col items-center justify-center transition-all duration-150 shadow-lg shadow-black/20 select-none cursor-pointer disabled:opacity-50"
                        >
                          <span className="text-2xl sm:text-3xl font-light leading-none">{key.num}</span>
                          {key.letters ? (
                            <span className="text-[9px] tracking-widest text-white/60 font-semibold uppercase mt-0.5">{key.letters}</span>
                          ) : (
                            <span className="h-[9px] mt-0.5"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Vizualizare Istoric Confirmat */
                <div className="w-full">
                  <div className="flex items-center justify-between mb-5 pr-8">
                    <div className="flex items-center gap-2.5">
                      {tenant?.logo_url ? (
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-1.5 flex items-center justify-center">
                          <img 
                            src={tenant.logo_url.startsWith('http') ? tenant.logo_url : `${(import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')).replace(/\/$/, '')}/${tenant.logo_url.replace(/^\//, '')}`}
                            alt={tenant.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <ShieldCheck size={22} />
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Istoric Pontaje</h2>
                        <p className="text-xs text-white/50">{historyData.length} înregistrări astăzi</p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[55vh] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                    {historyData.length === 0 ? (
                      <div className="text-center py-10 text-white/50">
                        <ScanLine size={36} className="mx-auto mb-2.5 opacity-30" />
                        <p className="text-sm font-medium">Nicio înregistrare astăzi.</p>
                      </div>
                    ) : (
                      historyData.map(scan => {
                        const isEntry = scan.action_type === 'INTRARE' || scan.action_type === 'IN';
                        return (
                          <div 
                            key={scan.id} 
                            className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all"
                          >
                            <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20 flex-shrink-0 bg-slate-800 flex items-center justify-center">
                              {scan.avatar_path ? (
                                <img 
                                  src={scan.avatar_path.startsWith('http') ? scan.avatar_path : `${import.meta.env.VITE_API_URL || ''}${scan.avatar_path}`} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <User size={20} className="text-white/60" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">{scan.first_name} {scan.last_name}</p>
                              <p className="text-xs text-white/50">
                                {new Date(scan.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isEntry 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {isEntry ? 'Intrare' : 'Ieșire'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-3">
                    <button
                      onClick={() => fetchHistory(historyPin)}
                      disabled={historyLoading}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white/90 border border-white/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw size={14} className={historyLoading ? 'animate-spin' : ''} /> Actualizează
                    </button>
                    <button
                      onClick={() => { setShowHistoryModal(false); setHistoryData(null); setHistoryPin(''); }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                    >
                      Blochează
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isOffline && (
          <div className="absolute top-6 right-6 z-50 bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 pointer-events-auto">
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
              {(!kioskContent.subtitle || kioskContent.subtitle === 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.') && effectiveQrMode === 'HARDWARE' 
                ? 'Apropie legitimația cu codul QR de cititorul optic pentru a înregistra ora de venire sau plecare.' 
                : (kioskContent.subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.')}
            </p>
            
            <div className={`p-8 md:px-12 md:py-10 rounded-[2rem] flex flex-col justify-center w-fit max-w-full ${isVertical ? 'items-center mx-auto' : 'items-start'} ${kioskColors.show_timer_bg !== false ? 'border border-slate-800 backdrop-blur-sm shadow-2xl' : ''}`} style={kioskColors.show_timer_bg !== false ? { backgroundColor: kioskColors.timer_bg || customLogoBg } : {}}>
              <div className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter" style={{ color: customTimerColor, textShadow: `0 0 40px ${customTimerColor}40`, fontVariantNumeric: 'tabular-nums' }}>
                {timeString}
              </div>
              <div className="text-2xl md:text-3xl text-slate-400 font-bold mt-2 tracking-wide uppercase">
                {dateString}
              </div>
            </div>
          </div>

          {/* Zona Dreapta: Codul QR / Hardware Scanner */}
          <div className={`flex flex-col items-center ${isVertical ? 'w-full max-w-sm' : 'shrink-0'}`}>
            <div className={`bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl relative ${isVertical ? 'w-full aspect-square flex items-center justify-center' : ''} transition-all duration-500 overflow-hidden`}>
              {/* Pulsing glow behind */}
              <div className="absolute inset-0 rounded-[3rem] animate-pulse-slow opacity-20" style={{ backgroundColor: themeColor, filter: 'blur(30px)', zIndex: -1 }}></div>
              
              {effectiveQrMode === 'HARDWARE' ? (
                // SCANNER IDLE (HARDWARE) - Cu logo-ul companiei
                <div className={`w-[320px] h-[320px] ${isVertical ? 'w-[280px] h-[280px]' : ''} flex flex-col items-center justify-center relative z-10`}>
                  <div className="w-32 h-32 rounded-full bg-slate-50 border-8 border-slate-100 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden p-4">
                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                    {tenant?.logo_url ? (
                      <img 
                        src={tenant.logo_url.startsWith('http') ? tenant.logo_url : `${(import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')).replace(/\/$/, '')}/${tenant.logo_url.replace(/^\//, '')}`}
                        alt={tenant.name}
                        className="w-full h-full object-contain relative z-10 filter drop-shadow-sm"
                      />
                    ) : (
                      <ScanLine size={48} className="text-slate-400 relative z-10" />
                    )}
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-[scan-beam_2s_ease-in-out_infinite]" style={{ animation: 'scanBeam 2s ease-in-out infinite' }}></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 text-center uppercase tracking-wider">Apropie Legitimația</h3>
                  <p className="text-slate-500 font-medium text-sm text-center mt-2 px-6">de cititorul optic conectat</p>
                  
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes scanBeam {
                      0%, 100% { top: 0; opacity: 0; }
                      10%, 90% { opacity: 1; }
                      50% { top: 100%; opacity: 1; }
                    }
                  `}} />
                </div>
              ) : (
                // CLASSIC QR (STATIC / DYNAMIC) - Cu logo-ul companiei în mijlocul codului QR
                qrPayload ? (
                  <div className="relative flex items-center justify-center">
                    <QRCodeSVG 
                      value={qrPayload} 
                      size={isVertical ? 280 : 320} 
                      level="H"
                      includeMargin={false}
                      className="rounded-lg drop-shadow-sm relative z-10"
                      fgColor="#0f172a" 
                      imageSettings={tenant?.logo_url ? {
                        src: tenant.logo_url.startsWith('http') 
                          ? tenant.logo_url 
                          : `${(import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')).replace(/\/$/, '')}/${tenant.logo_url.replace(/^\//, '')}`,
                        height: isVertical ? 54 : 64,
                        width: isVertical ? 54 : 64,
                        excavate: true,
                      } : undefined}
                    />
                    {tenant?.logo_url && (
                      <div className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-xl border-2 border-slate-100 flex items-center justify-center pointer-events-none">
                        <img 
                          src={tenant.logo_url.startsWith('http') ? tenant.logo_url : `${(import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')).replace(/\/$/, '')}/${tenant.logo_url.replace(/^\//, '')}`}
                          alt={tenant.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`w-[320px] h-[320px] ${isVertical ? 'w-[280px] h-[280px]' : ''} bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center relative z-10`}>
                    <Loader2 className="w-10 h-10 animate-spin text-slate-300" />
                  </div>
                )
              )}
            </div>
            
            {effectiveQrMode !== 'HARDWARE' && (
              <div className="mt-8 flex items-center gap-3 bg-slate-900/50 px-5 h-10 text-sm flex items-center justify-center rounded-lg border border-slate-800 text-slate-300 font-medium text-sm md:text-base backdrop-blur-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-lg opacity-75" style={{ backgroundColor: themeColor }}></span>
                  <span className="relative inline-flex rounded-lg h-3 w-3" style={{ backgroundColor: themeColor }}></span>
                </span>
                Codul se actualizează automat
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* POPUP CONFIRMARE PONTAJ: POZA ANGAJATULUI PE MIJLOC & MARE + URĂRI ZI DE NAȘTERE */}
      {scanSuccess && (() => {
        const isEntry = scanSuccess.action === 'INTRARE' || scanSuccess.action === 'IN' || scanSuccess.type === 'IN';
        const actionLabel = isEntry ? 'INTRARE' : 'IEȘIRE';
        const companyName = tenant?.name || 'Unda';
        
        // Verificare zi de naștere (din backend sau calculată din birth_date)
        const isBirthday = Boolean(
          scanSuccess.employee?.is_birthday || 
          (() => {
            if (!scanSuccess.employee?.birth_date) return false;
            const b = new Date(scanSuccess.employee.birth_date);
            const now = new Date();
            return (b.getUTCMonth() === now.getUTCMonth() && b.getUTCDate() === now.getUTCDate()) ||
                   (b.getMonth() === now.getMonth() && b.getDate() === now.getDate());
          })()
        );

        const avatarSrc = scanSuccess.employee?.avatar_path ? (
          scanSuccess.employee.avatar_path.startsWith('http') 
            ? scanSuccess.employee.avatar_path 
            : `${(import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')).replace(/\/$/, '')}/${scanSuccess.employee.avatar_path.replace(/^\//, '')}`
        ) : null;

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300 pointer-events-none select-none">
            <div 
              className="w-full max-w-xl md:max-w-2xl bg-slate-950/95 border border-white/20 rounded-[3rem] p-8 md:p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
              style={{
                boxShadow: isBirthday
                  ? '0 0 120px rgba(251, 191, 36, 0.45), 0 25px 70px rgba(0,0,0,0.9)'
                  : isEntry 
                    ? '0 0 100px rgba(16, 185, 129, 0.35), 0 25px 70px rgba(0,0,0,0.85)' 
                    : '0 0 100px rgba(245, 158, 11, 0.35), 0 25px 70px rgba(0,0,0,0.85)'
              }}
            >
              {/* Soft ambient aura */}
              <div 
                className="absolute -top-24 w-96 h-96 rounded-full blur-3xl opacity-40 pointer-events-none"
                style={{ backgroundColor: isBirthday ? '#f59e0b' : isEntry ? '#10b981' : '#f59e0b' }}
              />

              {/* Poza Angajatului: PE MIJLOC SI MULT MAI MARE */}
              <div className="relative mb-6">
                <div 
                  className={`w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full p-2 border-[8px] shadow-2xl flex items-center justify-center overflow-hidden bg-slate-900 transition-all ${
                    isBirthday
                      ? 'border-amber-400 ring-8 ring-purple-500/40 shadow-[0_0_90px_rgba(251,191,36,0.6)]'
                      : isEntry 
                        ? 'border-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.45)]' 
                        : 'border-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.45)]'
                  }`}
                >
                  {avatarSrc ? (
                    <img 
                      src={avatarSrc} 
                      alt="Avatar Angajat" 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  ) : (
                    <User size={130} className={isBirthday ? 'text-amber-300' : isEntry ? 'text-emerald-400' : 'text-amber-400'} />
                  )}
                </div>

                {/* Badge icon pe poza */}
                <div 
                  className={`absolute bottom-2 right-2 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-950 text-2xl ${
                    isBirthday
                      ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 animate-bounce'
                      : isEntry ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {isBirthday ? '🎂' : <CheckCircle2 size={36} />}
                </div>
              </div>

              {isBirthday ? (
                /* Mesaj Aniversare Zi de Naștere */
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 font-extrabold text-sm sm:text-base uppercase tracking-wider mb-2 animate-pulse">
                    <span>🎉</span>
                    <span>ZIUA TA DE NAȘTERE</span>
                    <span>🎈</span>
                  </div>

                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-pink-400">
                    La mulți ani, {scanSuccess.employee?.first_name}!
                  </h2>

                  <p className="text-lg sm:text-xl text-slate-100 font-semibold max-w-lg leading-relaxed mb-6">
                    Felicitări și cele mai frumoase urări din partea echipei <span className="text-amber-300 font-black">{companyName}</span>! 🎂✨
                  </p>

                  <div className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm sm:text-base font-black tracking-wider uppercase shadow-lg ${
                    isEntry 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-amber-500/10'
                  }`}>
                    <CheckCircle2 size={20} />
                    {actionLabel} ÎNREGISTRATĂ
                  </div>
                </div>
              ) : (
                /* Mesaj Normal de Pontaj */
                <div className="flex flex-col items-center">
                  <p className={`text-lg sm:text-xl font-bold tracking-wide uppercase mb-1.5 ${isEntry ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {scanSuccess.duplicate ? '⚠️ Deja pontat!' : (isEntry ? '👋 Bine ai venit!' : '👋 La revedere!')}
                  </p>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2">
                    {scanSuccess.employee?.first_name} {scanSuccess.employee?.last_name}
                  </h2>

                  <p className="text-base sm:text-lg text-slate-300 font-medium max-w-md mb-6">
                    {scanSuccess.duplicate 
                      ? scanSuccess.message 
                      : (isEntry ? 'Tura ta a început cu succes. Spor la muncă!' : 'Tura ta s-a încheiat cu succes. Odihnă plăcută!')}
                  </p>

                  <div className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-sm sm:text-base font-black tracking-wider uppercase shadow-lg ${
                    isEntry 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-amber-500/10'
                  }`}>
                    <CheckCircle2 size={20} />
                    {actionLabel} ÎNREGISTRATĂ
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* POPUP EROARE SCANARE */}
      {scanError && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300 pointer-events-none select-none">
          <div className="w-full max-w-md bg-slate-950/90 border border-rose-500/30 rounded-[3rem] p-8 flex flex-col items-center text-center shadow-[0_0_80px_rgba(239,68,68,0.3)]">
            <div className="w-24 h-24 rounded-full mb-5 flex items-center justify-center border-4 border-rose-500 bg-rose-500/10 text-rose-500 shadow-xl">
              <XCircle size={48} />
            </div>
            <h3 className="text-2xl font-black text-white leading-tight mb-2">
              Eroare Scanare
            </h3>
            <p className="text-base text-rose-300 font-medium">
              {scanError}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
