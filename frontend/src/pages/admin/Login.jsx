import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, X, Send, Clock } from 'lucide-react';
import { updatePageFavicon } from '../../utils/favicon';

// Helper pentru extragerea tenantului fixat din URL (query param ?tenant=... sau subdomeniu hostname)
const getUrlTenant = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('tenant') || urlParams.get('t');
    if (param) return param.toLowerCase().trim();

    const hostParts = window.location.hostname.split('.');
    if (hostParts.length >= 2 && !['localhost', 'qr', 'scan', 'pontaj', 'www'].includes(hostParts[0])) {
      return hostParts[0].toLowerCase().trim();
    }
  } catch {
    return null;
  }
  return null;
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const lockedTenant = getUrlTenant();

  // Inițializare email: dacă suntem pe un tenant specific (?tenant=rollmaster), NU pre-populăm cu emailul altui tenant (ex: admin@unda.ro)!
  const [email, setEmail] = useState(() => {
    if (lockedTenant) {
      const tenantSpecificEmail = localStorage.getItem(`saved_admin_email_${lockedTenant}`);
      if (tenantSpecificEmail) return tenantSpecificEmail;
      const globalEmail = localStorage.getItem('saved_admin_email');
      if (globalEmail && globalEmail.toLowerCase().includes(lockedTenant)) {
        return globalEmail;
      }
      return '';
    }
    return localStorage.getItem('saved_admin_email') || '';
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (lockedTenant) {
      return !!localStorage.getItem(`saved_admin_email_${lockedTenant}`);
    }
    return !!localStorage.getItem('saved_admin_email');
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenant dynamic branding state
  const [tenantBranding, setTenantBranding] = useState(null);
  const [isFetchingBranding, setIsFetchingBranding] = useState(false);
  const lastFetchedEmailRef = useRef('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Helper pentru interogarea branding-ului public
  const fetchBranding = async (queryObj) => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const params = new URLSearchParams(queryObj);
      setIsFetchingBranding(true);
      const res = await fetch(`${apiUrl}/api/tenants/public-branding?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.found) {
          setTenantBranding(data);
          if (data.favicon_url || data.logo_url) {
            updatePageFavicon(data.favicon_url || data.logo_url, `${data.name || 'Panou'} - Autentificare`);
          } else if (data.name) {
            document.title = `${data.name} - Autentificare`;
          }
          return true;
        } else {
          setTenantBranding(null);
        }
      }
    } catch (err) {
      console.warn('Eroare la preluarea branding-ului public:', err);
    } finally {
      setIsFetchingBranding(false);
    }
    return false;
  };

  // 1. Verificare inițială la montare: dacă există tenant în URL (?tenant=rollmaster), acesta are prioritate absolută!
  useEffect(() => {
    if (lockedTenant) {
      fetchBranding({ subdomain: lockedTenant });
      return;
    }

    // Dacă nu avem tenant în URL, verificăm dacă avem un email salvat
    const savedEmail = localStorage.getItem('saved_admin_email');
    if (savedEmail && savedEmail.includes('@')) {
      lastFetchedEmailRef.current = savedEmail.toLowerCase().trim();
      fetchBranding({ email: savedEmail });
    }
  }, [lockedTenant]);

  // 2. Schimbare dinamică a temei pe măsură ce utilizatorul tastează emailul (DOAR dacă pagina nu e fixată pe un tenant din URL)
  useEffect(() => {
    if (lockedTenant) return; // NICIODATĂ nu suprascrie tenantul fixat din URL

    if (!email || !email.includes('@')) {
      if (!email || email.trim() === '') {
        setTenantBranding(null);
        lastFetchedEmailRef.current = '';
      }
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const domainPart = cleanEmail.split('@')[1];
    if (!domainPart || domainPart.length < 3) return;
    if (cleanEmail === lastFetchedEmailRef.current) return;

    const timer = setTimeout(() => {
      lastFetchedEmailRef.current = cleanEmail;
      fetchBranding({ email: cleanEmail });
    }, 400);

    return () => clearTimeout(timer);
  }, [email, lockedTenant]);

  const handleEmailBlur = () => {
    if (lockedTenant) return;
    if (email && email.includes('@')) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== lastFetchedEmailRef.current) {
        lastFetchedEmailRef.current = cleanEmail;
        fetchBranding({ email: cleanEmail });
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Introdu adresa de email.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'A apărut o eroare.');
      }
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(err.message || 'Eroare de conexiune.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const currentSubdomain = tenantBranding?.subdomain || lockedTenant;
      if (rememberMe) {
        localStorage.setItem('saved_admin_email', email);
        if (currentSubdomain) {
          localStorage.setItem(`saved_admin_email_${currentSubdomain}`, email);
        }
      } else {
        localStorage.removeItem('saved_admin_email');
        if (currentSubdomain) {
          localStorage.removeItem(`saved_admin_email_${currentSubdomain}`);
        }
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Eroare la autentificare');
        return;
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.role === 'SUPERADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Eroare de rețea. Verificați conexiunea la server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tematica Restaurant (cu imagine de fundal și atmosferă dark) este STRICT pentru Unda!
  // Pentru Roll Master și oricare alt tenant fără imagine de restaurant, este FALSE garantat!
  const isRestaurantTheme = tenantBranding?.subdomain === 'unda' && !!tenantBranding?.portal_bg_image_url;
  const brandColor = tenantBranding?.theme_color || '#2563eb';
  const isDarkBrand = brandColor === '#000000' || brandColor === '#111827' || brandColor === '#0f172a';

  return (
    <div 
      className={`min-h-screen relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 select-none overflow-hidden transition-colors duration-500 ${
        isRestaurantTheme ? '' : 'bg-slate-50 dark:bg-slate-900'
      }`}
      style={!isRestaurantTheme && tenantBranding?.portal_bg_color ? { backgroundColor: tenantBranding.portal_bg_color } : {}}
    >
      
      {/* 1. Fundal Restaurant STRICT și EXCLUSIV pentru tenantul Unda */}
      {isRestaurantTheme && (
        <div 
          className="fixed inset-0 bg-cover bg-center transition-all duration-1000 ease-out -z-10 scale-105 transform"
          style={{ backgroundImage: `url(${tenantBranding.portal_bg_image_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/80 backdrop-blur-[1px]" />
        </div>
      )}

      {/* 2. Header & Logo Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
        {tenantBranding?.logo_url ? (
          <div className="flex flex-col items-center">
            {isRestaurantTheme ? (
              <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl mb-4 transition-all hover:scale-105">
                <img 
                  src={tenantBranding.logo_url} 
                  alt={tenantBranding.name || 'Logo'} 
                  className="h-14 max-w-[220px] object-contain drop-shadow-md"
                />
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center mb-3">
                <img 
                  src={tenantBranding.logo_url} 
                  alt={tenantBranding.name || 'Logo'} 
                  className="max-h-12 max-w-[220px] object-contain"
                />
              </div>
            )}
            
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
              isRestaurantTheme ? 'text-white drop-shadow-sm' : 'text-slate-900 dark:text-white'
            }`}>
              {tenantBranding.name}
            </h1>
            <p className={`mt-1 text-xs font-bold uppercase tracking-widest ${
              isRestaurantTheme ? 'text-slate-300/80' : 'text-slate-500 dark:text-slate-400'
            }`}>
              Panou Administrare &bull; Pontaj
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-600 text-white flex items-center justify-center shadow-xl shadow-primary-500/25 mb-4 border border-white/10">
              <KeyRound size={28} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              QR Pontaj
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Autentificare Platformă
            </p>
          </div>
        )}
      </div>

      {/* 3. Card Autentificare */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 w-full animate-in fade-in zoom-in-95 duration-300">
        <div className={`py-8 px-6 sm:px-10 rounded-3xl border transition-all ${
          isRestaurantTheme 
            ? 'backdrop-blur-2xl bg-white/95 dark:bg-slate-900/90 shadow-2xl shadow-black/50 border-white/40 dark:border-slate-800' 
            : 'bg-white dark:bg-slate-800/95 shadow-xl shadow-slate-200/50 dark:shadow-none border-slate-100 dark:border-slate-700/60'
        }`}>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Adresă de Email
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  autoComplete="username email"
                  className="block w-full pl-10 pr-4 h-11 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none text-sm transition-all shadow-xs"
                  style={{
                    '--tw-ring-color': brandColor
                  }}
                  placeholder={lockedTenant ? `admin@${lockedTenant}.ro` : "admin@companie.ro"}
                />
                {isFetchingBranding && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Parolă
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 h-11 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none text-sm transition-all shadow-xs"
                  style={{
                    '--tw-ring-color': brandColor
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Ține-mă minte</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotError('');
                  setForgotSuccess(false);
                  setForgotEmail(email || '');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:underline transition-all cursor-pointer"
              >
                Ai uitat parola?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-full text-white text-sm font-bold shadow-md transition-all transform active:scale-98 cursor-pointer disabled:opacity-60"
                style={{
                  backgroundColor: isRestaurantTheme && isDarkBrand ? '#0f172a' : brandColor,
                  border: isRestaurantTheme && isDarkBrand ? '1px solid rgba(255, 255, 255, 0.25)' : 'none',
                  boxShadow: isRestaurantTheme && isDarkBrand ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : `0 6px 16px -2px ${brandColor}40`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Se conectează...</span>
                  </>
                ) : (
                  <span>Intră în cont</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Ai uitat parola? */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setShowForgotModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {forgotSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-black mb-2">Verifică Emailul!</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Dacă adresa <strong className="text-slate-900 dark:text-white">{forgotEmail}</strong> este înregistrată, ai primit un email cu linkul de resetare.
                  <br /><br />
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                    <Clock size={13} className="shrink-0" />
                    <span>Linkul este valabil timp de 30 de minute.</span>
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full h-11 rounded-full text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
                  style={{
                    backgroundColor: isRestaurantTheme && isDarkBrand ? '#0f172a' : brandColor,
                    border: isRestaurantTheme && isDarkBrand ? '1px solid rgba(255, 255, 255, 0.25)' : 'none'
                  }}
                >
                  Am înțeles, închide
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3">
                    <KeyRound size={22} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Ai uitat parola?</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Introdu adresa de email a contului tău de administrator și îți vom trimite un link securizat pentru resetare.
                  </p>
                </div>

                {forgotError && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Adresă de Email
                  </label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@companie.ro"
                      className="block w-full pl-10 pr-4 h-11 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-sm transition-all"
                      style={{
                        '--tw-ring-color': brandColor
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-full text-white text-sm font-bold shadow-md transition-all disabled:opacity-60 cursor-pointer"
                    style={{
                      backgroundColor: isRestaurantTheme && isDarkBrand ? '#0f172a' : brandColor,
                      border: isRestaurantTheme && isDarkBrand ? '1px solid rgba(255, 255, 255, 0.25)' : 'none'
                    }}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Se trimite...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Trimite Link de Resetare</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full h-10 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
