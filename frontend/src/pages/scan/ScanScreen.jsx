import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Loader2, LogIn, LogOut, CheckCircle2, Eye, EyeOff, X, ShieldCheck, MapPin, Clock, Calendar, FileText, Coffee, Play } from 'lucide-react';

export default function ScanScreen() {
  const [searchParams] = useSearchParams();
  const [tenantId, setTenantId] = useState(() => searchParams.get('t') || searchParams.get('tenantId') || null);
  const [kioskId, setKioskId] = useState(() => searchParams.get('k') || searchParams.get('kioskId') || null);
  const tsParam = searchParams.get('ts');
  const ts = tsParam ? parseInt(tsParam, 10) : Math.floor(Date.now() / 1000);

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timingNotice, setTimingNotice] = useState(null);
  const getInitialCredentials = () => {
    try {
      const savedCreds = localStorage.getItem('emp_saved_credentials');
      if (savedCreds) {
        const parsed = JSON.parse(savedCreds);
        if (parsed.code) {
          return { code: parsed.code, pin: parsed.pin || '', remember: true };
        }
      }
    } catch (e) {}
    const legacyCode = localStorage.getItem('saved_employee_code') || '';
    const legacyPin = localStorage.getItem('saved_employee_pin') || '';
    return { code: legacyCode, pin: legacyPin, remember: !!legacyCode || true };
  };

  const initialCreds = React.useMemo(() => getInitialCredentials(), []);
  const [employeeCode, setEmployeeCode] = useState(initialCreds.code);
  const [pinCode, setPinCode] = useState(initialCreds.pin);
  const [rememberMe, setRememberMe] = useState(initialCreds.remember ?? true);
  const [showPin, setShowPin] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [scanDetails, setScanDetails] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  
  // Dynamic status state
  const [employeeStatus, setEmployeeStatus] = useState(null); // { lastAction: 'IN' | 'OUT', showPhoto: boolean }
  const [checkingStatus, setCheckingStatus] = useState(false);

  // GDPR & Legal Modal State
  const [showGdprModal, setShowGdprModal] = useState(false);

  // Forgot PIN Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null); // 'loading', 'success', 'error'
  const [forgotMsg, setForgotMsg] = useState('');

  // Validate URL and time - Auto-resolve tenant & tolerant to clock drifts
  useEffect(() => {
    let isMounted = true;

    const initScanScreen = async () => {
      setLoading(true);
      setError(null);
      setTimingNotice(null);

      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      let resolvedTenantId = searchParams.get('t') || searchParams.get('tenantId') || tenantId;
      let resolvedKioskId = searchParams.get('k') || searchParams.get('kioskId') || kioskId;

      // 1. Daca nu avem tenantId din URL, incercam sa-l deducem din subdomeniu (ex: unda.qr.pontaj.app -> unda)
      if (!resolvedTenantId) {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        if (parts[0] !== 'localhost' && !/^[0-9]+$/.test(parts[0]) && parts[0] !== 'qr' && parts[0] !== 'scan') {
          try {
            const brandingRes = await fetch(`${apiUrl}/api/tenants/public-branding?subdomain=${encodeURIComponent(parts[0])}`);
            if (brandingRes.ok) {
              const bData = await brandingRes.json();
              if (bData && bData.found) {
                resolvedTenantId = bData.id;
                if (isMounted) {
                  setTenantId(bData.id);
                  setTenant(bData);
                }
              }
            }
          } catch (e) {
            console.warn('Subdomain detection warning:', e);
          }
        }
      }

      // 2. Fetch tenant branding daca avem ID-ul dar nu avem obiectul complet
      if (resolvedTenantId) {
        try {
          const res = await fetch(`${apiUrl}/api/tenants/${resolvedTenantId}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setTenant(data);
              setTenantId(resolvedTenantId);
            }
          }
        } catch (err) {
          console.warn('Tenant fetch error:', err);
        }

        // 3. Daca nu avem kioskId, incarcam primul kiosk al locatiei
        if (!resolvedKioskId) {
          try {
            const kiosksRes = await fetch(`${apiUrl}/api/tenants/${resolvedTenantId}/kiosks`);
            if (kiosksRes.ok) {
              const kiosks = await kiosksRes.json();
              if (kiosks && kiosks.length > 0 && isMounted) {
                resolvedKioskId = kiosks[0].id;
                setKioskId(kiosks[0].id);
              }
            }
          } catch (kErr) {
            console.warn('Kiosk fetch error:', kErr);
          }
        }
      }

      // 4. Verificare timestamp toleranta (non-blocanta)
      if (tsParam) {
        const now = Math.floor(Date.now() / 1000);
        const parsedTs = parseInt(tsParam, 10);
        if (!isNaN(parsedTs) && (now - parsedTs > 900 || parsedTs - now > 300)) {
          if (isMounted) {
            setTimingNotice('Codul QR a fost scanat anterior. Daca intampinati erori, scanati codul curent de pe tableta.');
          }
        }
      }

      if (!resolvedTenantId && isMounted) {
        setError('Link invalid sau companie neidentificata. Va rugam sa scanati codul QR de pe ecranul tabletei.');
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initScanScreen();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleScan = async (actionType) => {
    if (!employeeCode || !pinCode) {
      setError('Te rugăm să introduci codul de angajat și PIN-ul.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('saved_employee_code', employeeCode);
      localStorage.setItem('saved_employee_pin', pinCode);
      try {
        localStorage.setItem('emp_saved_credentials', JSON.stringify({ code: employeeCode, pin: pinCode }));
      } catch (e) {}
    } else {
      localStorage.removeItem('saved_employee_code');
      localStorage.removeItem('saved_employee_pin');
      localStorage.removeItem('emp_saved_credentials');
    }

    setSubmitting(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const res = await fetch(`${apiUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          kiosk_id: kioskId,
          employee_code: employeeCode,
          pin_code: pinCode,
          type: actionType,
          ts
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Eroare la pontaj');
      }

      setEmployeeInfo(data.employee);
      setScanDetails({
        actionType,
        timestamp: data.timestamp || new Date().toISOString(),
        timesheetId: data.timesheet_id,
        locationName: data.location_name || employeeStatus?.locationName || tenant?.name || 'Punct de lucru alocat'
      });
      
      let msgLabel = 'INTRARE';
      if (actionType === 'OUT') msgLabel = 'IEȘIRE';
      if (actionType === 'BREAK_START') msgLabel = 'PAUZĂ ÎNCEPUTĂ';
      if (actionType === 'BREAK_END') msgLabel = 'RELUARE LUCRU';
      setSuccessMsg(`Pontaj înregistrat: ${msgLabel}`);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-check status when PIN is 4 digits
  useEffect(() => {
    if (employeeCode && pinCode.length === 4) {
      const checkStatus = async () => {
        setCheckingStatus(true);
        setError(null);
        try {
          const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
          const res = await fetch(`${apiUrl}/api/scan/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_id: tenantId,
              kiosk_id: kioskId,
              employee_code: employeeCode,
              pin_code: pinCode
            })
          });
          const data = await res.json();
          if (res.ok) {
            setEmployeeStatus({
              lastAction: data.lastAction,
              showPhoto: data.showPhoto,
              locationName: data.location_name,
              allowBreaks: !!data.allowBreaks
            });
          }
        } catch (e) {
          // Silent fail for status check, let the main scan handle errors
        } finally {
          setCheckingStatus(false);
        }
      };
      checkStatus();
    } else {
      setEmployeeStatus(null);
    }
  }, [pinCode, employeeCode, tenantId, kioskId]);

  const handleForgotPin = async () => {
    if (!forgotCode) {
      setForgotMsg('Introduceți codul de angajat.');
      setForgotStatus('error');
      return;
    }

    setForgotStatus('loading');
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const res = await fetch(`${apiUrl}/api/scan/reset-pin-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          employee_code: forgotCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la trimiterea cererii.');
      
      setForgotStatus('success');
      setForgotMsg(data.message);
    } catch (err) {
      setForgotStatus('error');
      setForgotMsg(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-red-100 dark:border-red-900 max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Eroare Scanare</h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-6">{error}</p>
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            Reîncearcă
          </button>
        </div>
      </div>
    );
  }

  const themeColor = tenant?.theme_color || '#3b82f6';

  const renderGdprModal = () => {
    if (!showGdprModal) return null;
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm select-none animate-in fade-in duration-200 text-left"
        onClick={() => setShowGdprModal(false)}
      >
        <div 
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Notă de Informare — Prelucrarea Datelor
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Regulamentul (UE) 2016/679 &bull; Art. 119 Codul Muncii
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowGdprModal(false)}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto text-xs text-slate-600 dark:text-slate-300 space-y-3.5 leading-relaxed">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-slate-800 dark:text-slate-200 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
                <Lock size={12} className="text-emerald-500" />
                <span>Temei Legal Obligatoriu</span>
              </div>
              Conform <strong>Art. 119 din Codul Muncii</strong> (Legea 53/2003 republicată), angajatorul are obligația legală de a ține evidența orelor de muncă prestate zilnic de fiecare salariat.
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                1. Operatorul de date
              </h4>
              <p>
                Datele dumneavoastră sunt prelucrate de către angajator: <strong>{tenant?.name || 'Compania angajatoare'}</strong>, în calitate de Operator, prin platforma QR Pontaj.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                2. Scopul prelucrării și temeiul legal
              </h4>
              <p className="mb-1.5">
                • <strong>Obligație legală (Art. 6 alin. 1 lit. c din RGPD):</strong> Evidența orelor de muncă și supunerea acestora controlului Inspecției Muncii (ITM) conform <strong>Art. 119 din Codul Muncii</strong>.
              </p>
              <p>
                • <strong>Interes legitim (Art. 6 alin. 1 lit. f din RGPD):</strong> Asigurarea exactității pontajului electronic și securitatea punctului de lucru.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                3. Categoriile de date colectate
              </h4>
              <p>
                La momentul scanării se înregistrează: numele, codul de angajat, tipul pontajului (intrare/ieșire), data și ora exactă, punctul de lucru, adresa IP și identificatorul dispozitivului/kiosk-ului.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                4. Perioada de stocare a datelor
              </h4>
              <p>
                Evidențele de pontaj se păstrează pe durata prevăzută de legislația muncii pentru documentele justificative de personal (ITM).
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-1">
                5. Drepturile dumneavoastră conform RGPD
              </h4>
              <p>
                Beneficiați de dreptul de acces la datele de pontaj (Art. 15), dreptul de rectificare prin HR (Art. 16), restricționare și dreptul de a depune plângere la <strong>ANSPDCP</strong> (www.dataprotection.ro).
              </p>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Conformitate legislația muncii România
            </span>
            <button
              type="button"
              onClick={() => setShowGdprModal(false)}
              className="px-5 h-8 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors shadow-xs cursor-pointer shrink-0"
            >
              Am înțeles
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (successMsg && scanDetails) {
    const isEntry = scanDetails.actionType === 'IN';
    const scanDate = new Date(scanDetails.timestamp);
    const dateFormatted = scanDate.toLocaleDateString('ro-RO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = scanDate.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: `${themeColor}10` }}>
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 size={36} />
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">
            Pontaj Înregistrat!
          </h1>
          
          <div 
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider my-3"
            style={{
              backgroundColor: scanDetails.actionType === 'IN' ? '#dcfce7' : 
                               scanDetails.actionType === 'BREAK_START' ? '#fef3c7' :
                               scanDetails.actionType === 'BREAK_END' ? '#e0e7ff' : '#f1f5f9',
              color: scanDetails.actionType === 'IN' ? '#166534' : 
                     scanDetails.actionType === 'BREAK_START' ? '#b45309' :
                     scanDetails.actionType === 'BREAK_END' ? '#4338ca' : '#334155'
            }}
          >
            {scanDetails.actionType === 'IN' && <LogIn size={14} />}
            {scanDetails.actionType === 'OUT' && <LogOut size={14} />}
            {scanDetails.actionType === 'BREAK_START' && <Coffee size={14} />}
            {scanDetails.actionType === 'BREAK_END' && <Play size={14} />}
            <span>
              {scanDetails.actionType === 'IN' && 'INTRARE ÎN TURĂ'}
              {scanDetails.actionType === 'OUT' && 'IEȘIRE DIN TURĂ'}
              {scanDetails.actionType === 'BREAK_START' && 'PAUZĂ LUCRU'}
              {scanDetails.actionType === 'BREAK_END' && 'RELUARE LUCRU'}
            </span>
          </div>

          {/* Legal ITM & Timestamp Details */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-left space-y-2.5 my-4 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={14} className="text-slate-400 shrink-0" /> Ora exactă:
              </span>
              <strong className="text-slate-900 dark:text-white text-sm font-bold tabular-nums tracking-tight">{timeFormatted}</strong>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar size={14} className="text-slate-400 shrink-0" /> Data:
              </span>
              <strong className="text-slate-800 dark:text-slate-200 capitalize text-right text-xs font-bold">{dateFormatted}</strong>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-slate-400 shrink-0" /> Punct de lucru:
              </span>
              <strong className="text-slate-800 dark:text-slate-200 truncate max-w-[150px] text-right text-xs font-bold" title={scanDetails.locationName}>
                {scanDetails.locationName}
              </strong>
            </div>

            {scanDetails.timesheetId && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Certificare electronică:</span>
                <span className="font-bold text-slate-600 dark:text-slate-300 tabular-nums">#PNT-{scanDetails.timesheetId}</span>
              </div>
            )}
          </div>

          {employeeInfo && employeeInfo.showPhoto !== false && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 flex items-center gap-3 text-left border border-slate-100 dark:border-slate-800 mb-5">
              {employeeInfo.avatar_path && !employeeInfo.avatar_path.includes('default-avatar') ? (
                <img 
                  src={(employeeInfo.avatar_path?.startsWith('http') ? employeeInfo.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employeeInfo.avatar_path}`)} 
                  alt="" 
                  className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                  onError={(e) => { 
                    e.target.style.display = 'none'; 
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 text-sm"
                style={employeeInfo.avatar_path && !employeeInfo.avatar_path.includes('default-avatar') ? { display: 'none' } : {}}
              >
                {employeeInfo.first_name?.[0] || '?'}{employeeInfo.last_name?.[0] || ''}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {employeeInfo.first_name} {employeeInfo.last_name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isEntry ? 'Bună dimineața / spor la lucru!' : 'La revedere, o zi bună!'}
                </p>
              </div>
            </div>
          )}

          {/* Card Notă GDPR & Temei Legal Art. 119 pe ecranul de succes */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 mb-5 text-left">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    Notă de Informare GDPR
                  </span>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200/60 dark:border-emerald-800/50">
                    Art. 119 ITM
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  Datele de pontaj sunt securizate și prelucrate conform Legii 53/2003 și RGPD (UE) 2016/679.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGdprModal(true)}
              className="mt-2.5 w-full h-8 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-650 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <FileText size={13} />
              <span>Notă de informare & Drepturi GDPR</span>
            </button>
          </div>


        </div>

        {renderGdprModal()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 flex flex-col p-6">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center border-b border-slate-800 bg-slate-950">
            {tenant.logo_url ? (
              <img src={tenant.logo_url.startsWith('http') ? tenant.logo_url : ( tenant.logo_url?.startsWith('http') ? tenant.logo_url : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${tenant.logo_url}` )} alt="Logo" className="h-14 object-contain mx-auto mb-3 filter drop-shadow-md" />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-sm mx-auto mb-3"
                style={{ backgroundColor: themeColor, color: '#fff' }}
              >
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-lg font-bold text-white">{tenant.name}</h1>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mt-1">Portal Pontaj</p>
          </div>

          <div className="p-6">
            {timingNotice && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-medium text-center">
                {timingNotice}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 text-sm">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Cod Angajat
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeCode}
                  onChange={e => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="Ex: EMP001"
                  className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm font-bold"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                PIN (4 cifre)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  style={{ WebkitTextSecurity: showPin ? 'none' : 'disc' }}
                  className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm font-bold tracking-[0.5em]"
                />
              </div>
              <div className="mt-2 flex justify-end px-2">
                <button
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-primary-500 hover:text-primary-600 font-bold px-2 py-0.5 rounded-full hover:bg-primary-50 transition-colors"
                >
                  Am uitat PIN-ul
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 ml-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-300 dark:text-slate-400 cursor-pointer">
                Ține minte codul meu
              </label>
            </div>

            {employeeStatus?.allowBreaks ? (
              // Mod cu suport de Pauze (ex: Belgia sau chiriași cu pauze activate)
              <div className="space-y-3 relative">
                {checkingStatus && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  </div>
                )}

                {(!employeeStatus?.lastAction || employeeStatus?.lastAction === 'OUT') && (
                  <button
                    onClick={() => handleScan('IN')}
                    disabled={submitting}
                    className="w-full relative overflow-hidden group h-14 rounded-full font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 focus:ring-4 focus:ring-green-100 dark:bg-slate-800"
                  >
                    <LogIn size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Intrare în Tură
                  </button>
                )}

                {(employeeStatus?.lastAction === 'IN' || employeeStatus?.lastAction === 'BREAK_END') && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleScan('BREAK_START')}
                      disabled={submitting}
                      className="h-14 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm bg-amber-500 hover:bg-amber-600 text-white focus:ring-4 focus:ring-amber-200"
                    >
                      <Coffee size={18} />
                      Pauză
                    </button>
                    <button
                      onClick={() => handleScan('OUT')}
                      disabled={submitting}
                      className="h-14 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm bg-slate-900 text-white hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 dark:border-2 dark:border-slate-700"
                    >
                      <LogOut size={18} />
                      Ieșire Tură
                    </button>
                  </div>
                )}

                {employeeStatus?.lastAction === 'BREAK_START' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleScan('BREAK_END')}
                      disabled={submitting}
                      className="h-14 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-4 focus:ring-emerald-200"
                    >
                      <Play size={18} />
                      Reia Lucrul
                    </button>
                    <button
                      onClick={() => handleScan('OUT')}
                      disabled={submitting}
                      className="h-14 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm bg-slate-900 text-white hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 dark:border-2 dark:border-slate-700"
                    >
                      <LogOut size={18} />
                      Ieșire Tură
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Modul Clasic existent (Intrare / Ieșire) - Nemodificat pentru chiriașii actuali
              <div className="grid grid-cols-2 gap-4 relative">
                {checkingStatus && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  </div>
                )}
                
                <button
                  onClick={() => handleScan('IN')}
                  disabled={submitting || (employeeStatus?.lastAction === 'IN')}
                  className={`relative overflow-hidden group h-14 rounded-full font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                    employeeStatus?.lastAction === 'IN'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                      : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 focus:ring-4 focus:ring-green-100 dark:bg-slate-800'
                  }`}
                >
                  <LogIn size={20} className={employeeStatus?.lastAction !== 'IN' ? "group-hover:-translate-x-1 transition-transform" : ""} />
                  Intrare
                </button>

                <button
                  onClick={() => handleScan('OUT')}
                  disabled={submitting || (employeeStatus?.lastAction === 'OUT' || employeeStatus?.lastAction === null)}
                  className={`relative overflow-hidden group h-14 rounded-full font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                    (employeeStatus?.lastAction === 'OUT' || employeeStatus?.lastAction === null)
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 dark:border-2 dark:border-slate-700'
                  }`}
                >
                  Ieșire
                  <LogOut size={20} className={(employeeStatus?.lastAction !== 'OUT' && employeeStatus?.lastAction !== null) ? "group-hover:translate-x-1 transition-transform" : ""} />
                </button>
              </div>
            )}
            
            {employeeStatus?.lastAction === 'IN' && (
              <p className="text-center text-xs font-bold text-green-600 mt-4 bg-green-50 py-2 rounded-full border border-green-100">
                Ești pontat ca INTRARE.
              </p>
            )}

            {employeeStatus?.lastAction === 'BREAK_START' && (
              <p className="text-center text-xs font-bold text-amber-700 mt-4 bg-amber-50 py-2 rounded-full border border-amber-200">
                Ești în PAUZĂ de lucru.
              </p>
            )}
            
            {employeeStatus?.lastAction === 'OUT' && (
              <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 bg-slate-50 dark:bg-slate-800/50 py-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                Ești pontat ca IEȘIRE.
              </p>
            )}

            {/* Notă discretă GDPR */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setShowGdprModal(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors py-1 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Notă GDPR & Art. 119 Codul Muncii</span>
              </button>
            </div>

          </div>
        </div>

        <p className="text-center text-xs font-medium text-slate-400 mt-8">
          Sistem protejat QR Pontaj © {new Date().getFullYear()} • Conform Art. 119 Codul Muncii
        </p>
      </div>

      {/* Forgot PIN Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Recuperare PIN</h3>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 dark:bg-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Introduceți codul de angajat pentru a notifica administratorul. Vă rugăm să solicitați personal noul PIN.
              </p>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={forgotCode}
                  onChange={e => setForgotCode(e.target.value.toUpperCase())}
                  placeholder="Ex: EMP001"
                  className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                />
              </div>

              {forgotMsg && (
                <div className={`p-3 rounded-lg text-sm font-bold mb-4 ${forgotStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {forgotMsg}
                </div>
              )}

              <button
                onClick={handleForgotPin}
                disabled={forgotStatus === 'loading' || forgotStatus === 'success'}
                className="w-full h-10 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                {forgotStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : 'Trimite Solicitare'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GDPR Modal */}
      {renderGdprModal()}
    </div>
  );
}
