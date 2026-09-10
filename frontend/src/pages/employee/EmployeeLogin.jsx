import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, KeyRound, User, Loader2, AlertCircle, Eye, EyeOff, Zap, ShieldCheck, Trash2 } from 'lucide-react';
import { updatePageFavicon } from '../../utils/favicon';

export default function EmployeeLogin() {
  const [employeeCode, setEmployeeCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [savedCredentials, setSavedCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Verifică dacă utilizatorul are deja o sesiune activă (Persistent Login)
    const existingToken = localStorage.getItem('employee_token');
    const existingData = localStorage.getItem('employee_data');
    if (existingToken && existingData) {
      navigate('/employee-dashboard', { replace: true });
      return;
    }

    // 2. Încarcă credențialele memorate pentru auto-completare și login rapid
    const saved = localStorage.getItem('emp_saved_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.code && parsed?.pin) {
          setEmployeeCode(parsed.code);
          setPinCode(parsed.pin);
          setSavedCredentials(parsed);
          setRememberMe(true);
        }
      } catch (e) { /* ignore */ }
    }

    // 3. Încarcă datele tenantului pentru branding
    const fetchTenant = async () => {
      try {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        const subdomain = parts[0];
        if (subdomain === 'localhost' || /^[0-9]+$/.test(parts[0])) return;

        const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
        const res = await fetch(`${baseUrl}/api/tenants/subdomain/${subdomain}`);
        if (res.ok) {
          const data = await res.json();
          setTenant(data);
          if (data.favicon_url || data.logo_url) {
            updatePageFavicon(data.favicon_url || data.logo_url, `${data.name || 'Portal'} - Autentificare`);
          }
        }
      } catch (err) {
        console.error('Error fetching tenant for login:', err);
      }
    };
    fetchTenant();
  }, [navigate]);

  const executeLogin = async (codeToUse, pinToUse) => {
    if (!codeToUse || !pinToUse) {
      setError('Te rugăm să completezi atât Codul de Angajat, cât și PIN-ul.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const response = await fetch(`${baseUrl}/api/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_code: codeToUse, pin_code: pinToUse })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cod angajat sau PIN incorect.');
      }

      // Salvează permanent credențialele în browser dacă rememberMe e activ (implicit activ)
      if (rememberMe) {
        const empName = `${data.employee?.first_name || ''} ${data.employee?.last_name || ''}`.trim();
        localStorage.setItem('emp_saved_credentials', JSON.stringify({
          code: codeToUse,
          pin: pinToUse,
          name: empName,
          job: data.employee?.job_title || ''
        }));
      } else {
        localStorage.removeItem('emp_saved_credentials');
      }

      // Salvează tokenul și datele angajatului
      localStorage.setItem('employee_token', data.token);
      localStorage.setItem('employee_data', JSON.stringify(data.employee));
      
      navigate('/employee-dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeLogin(employeeCode, pinCode);
  };

  const handleClearSaved = () => {
    localStorage.removeItem('emp_saved_credentials');
    setSavedCredentials(null);
    setEmployeeCode('');
    setPinCode('');
  };

  const tc = tenant?.theme_color || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="p-8 text-center text-white" style={{ backgroundColor: tc }}>
          <div className="w-[84px] h-[84px] bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm overflow-hidden">
            {tenant?.logo_url ? (
              <img 
                src={( tenant.logo_url?.startsWith('http') ? tenant.logo_url : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${tenant.logo_url}` )} 
                alt="Logo" 
                className="w-full h-full object-contain p-2" 
              />
            ) : (
              <User size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1">{tenant?.name || 'Portal Angajați'}</h1>
          <p className="text-white/80 text-sm">Autentificare rapidă & program</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3 text-sm border border-red-200 dark:border-red-900">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Banner Conectare Rapidă (1-Click Login când există date memorate) */}
          {savedCredentials && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm"
                  style={{ backgroundColor: tc }}
                >
                  {savedCredentials.name ? savedCredentials.name.slice(0, 2).toUpperCase() : <User size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Cont Salvat</span>
                    <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                    {savedCredentials.name || `Cod: ${savedCredentials.code}`}
                  </p>
                  {savedCredentials.job && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{savedCredentials.job}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => executeLogin(savedCredentials.code, savedCredentials.pin)}
                disabled={loading}
                className="px-4 py-2.5 rounded-full text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: tc }}
                title="Conectare cu un singur click fără reintroducere cod sau PIN"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="fill-current" />}
                <span>Logare Rapidă</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Cod Angajat</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    id="employee_code"
                    name="username"
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-slate-800 dark:text-white outline-none transition-shadow"
                    placeholder="ex: EMP001"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cod PIN</label>
                  {savedCredentials && (
                    <button
                      type="button"
                      onClick={handleClearSaved}
                      className="text-[11px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Trash2 size={11} /> Șterge datele salvate
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={18} />
                  </div>
                  <input
                    id="pin_code"
                    name="password"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 font-black text-slate-800 dark:text-white tracking-widest outline-none transition-shadow"
                    placeholder="••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Memorare credențiale în browser */}
            <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div 
                  className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-xs"
                  style={rememberMe ? { backgroundColor: tc } : {}}
                ></div>
              </div>
              <div className="flex-1">
                <span className="text-xs text-slate-800 dark:text-white font-bold block">Ține-mă minte pe acest dispozitiv</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400">Nu va mai trebui să reintroduci codul sau PIN-ul</span>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-black py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 cursor-pointer"
              style={{ backgroundColor: tc }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
              <span>{loading ? 'Se verifică...' : 'Intră în cont'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
