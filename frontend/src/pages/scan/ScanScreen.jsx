import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Loader2, LogIn, LogOut, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';

export default function ScanScreen() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('t');
  const kioskId = searchParams.get('k');
  const ts = parseInt(searchParams.get('ts'), 10);

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeCode, setEmployeeCode] = useState(localStorage.getItem('saved_employee_code') || '');
  const [pinCode, setPinCode] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('saved_employee_code'));
  const [showPin, setShowPin] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  
  // Dynamic status state
  const [employeeStatus, setEmployeeStatus] = useState(null); // { lastAction: 'IN' | 'OUT', showPhoto: boolean }
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Forgot PIN Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotCode, setForgotCode] = useState('');
  const [forgotStatus, setForgotStatus] = useState(null); // 'loading', 'success', 'error'
  const [forgotMsg, setForgotMsg] = useState('');

  // Validate URL and time
  useEffect(() => {
    if (!tenantId || !kioskId || !ts) {
      setError('Link invalid. Vă rugăm să scanați codul QR de pe tabletă.');
      setLoading(false);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    // Allow a 30 second window (15s refresh + 15s scan delay allowance)
    if (now - ts > 30) {
      setError('Cod QR expirat. Vă rugăm să scanați noul cod afișat pe ecranul tabletei.');
      setLoading(false);
      return;
    }

    // Fetch tenant data for branding
    const fetchTenant = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
        const res = await fetch(`${apiUrl}/api/tenants/${tenantId}`);
        if (!res.ok) throw new Error('Nu am putut încărca datele companiei.');
        const data = await res.json();
        setTenant(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [tenantId, kioskId, ts]);

  const handleScan = async (actionType) => {
    if (!employeeCode || !pinCode) {
      setError('Te rugăm să introduci codul de angajat și PIN-ul.');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('saved_employee_code', employeeCode);
    } else {
      localStorage.removeItem('saved_employee_code');
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
          type: actionType
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Eroare la pontaj');
      }

      setEmployeeInfo(data.employee);
      setSuccessMsg(`Pontaj înregistrat: ${actionType === 'IN' ? 'INTRARE' : 'IEȘIRE'}`);

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
              showPhoto: data.showPhoto
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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm border border-red-100 dark:border-red-900 max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white mb-2">Eroare Scanare</h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const themeColor = tenant?.theme_color || '#3b82f6';

  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: `${themeColor}10` }}>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 dark:border-slate-800 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white mb-2">Succes!</h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium mb-6">{successMsg}</p>

          {employeeInfo && employeeInfo.showPhoto !== false && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex items-center gap-4 text-left">
              {employeeInfo.avatar_path ? (
                <img src={( employeeInfo.avatar_path?.startsWith('http') ? employeeInfo.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employeeInfo.avatar_path}` )} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-600">
                  {employeeInfo.first_name[0]}{employeeInfo.last_name[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{employeeInfo.first_name} {employeeInfo.last_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {successMsg.includes('INTRARE') ? 'Bună dimineața / ziua!' : 'La revedere, o zi faină!'}
                </p>
              </div>
            </div>
          )}
        </div>
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
                  type={showPin ? "text" : "password"}
                  maxLength={4}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
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
            
            {employeeStatus?.lastAction === 'IN' && (
              <p className="text-center text-xs font-bold text-green-600 mt-4 bg-green-50 py-2 rounded-full border border-green-100">
                Ești pontat ca INTRARE.
              </p>
            )}
            
            {employeeStatus?.lastAction === 'OUT' && (
              <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 bg-slate-50 dark:bg-slate-800/50 py-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                Ești pontat ca IEȘIRE.
              </p>
            )}

          </div>
        </div>

        <p className="text-center text-xs font-medium text-slate-400 mt-8">
          Sistem protejat QR Pontaj © {new Date().getFullYear()}
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
    </div>
  );
}
