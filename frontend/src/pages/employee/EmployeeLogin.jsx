import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, KeyRound, User, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function EmployeeLogin() {
  const [employeeCode, setEmployeeCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Încarcă credențialele memorate
    const saved = localStorage.getItem('emp_saved_credentials');
    if (saved) {
      try {
        const { code, pin } = JSON.parse(saved);
        setEmployeeCode(code || '');
        setPinCode(pin || '');
        setRememberMe(true);
      } catch(e) { /* ignore */ }
    }

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
        }
      } catch (err) {
        console.error('Error fetching tenant for login:', err);
      }
    };
    fetchTenant();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!employeeCode || !pinCode) {
      setError('Te rugăm să completezi ambele câmpuri.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const response = await fetch(`${baseUrl}/api/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_code: employeeCode, pin_code: pinCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Eroare la autentificare');
      }

      // Salvează sau șterge credențialele memorate
      if (rememberMe) {
        localStorage.setItem('emp_saved_credentials', JSON.stringify({ code: employeeCode, pin: pinCode }));
      } else {
        localStorage.removeItem('emp_saved_credentials');
      }

      // Salvează tokenul și detaliile
      localStorage.setItem('employee_token', data.token);
      localStorage.setItem('employee_data', JSON.stringify(data.employee));
      
      navigate('/employee-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tc = tenant?.theme_color || '#2563eb';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 text-center text-white" style={{ backgroundColor: tc }}>
          <div className="w-[84px] h-[84px] bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm overflow-hidden">
            {tenant?.logo_url ? (
              <img src={( tenant.logo_url?.startsWith('http') ? tenant.logo_url : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${tenant.logo_url}` )} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <User size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-1">Portal Angajați</h1>
          <p className="text-white/80 text-sm">Autentifică-te pentru a-ți vedea orarul</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cod Angajat</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  id="employee_code"
                  name="employee_code"
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-medium text-slate-700 outline-none transition-shadow"
                  placeholder="ex: EMP001"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cod PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={18} />
                </div>
                <input
                  id="pin_code"
                  name="pin_code"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="4"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  autoComplete="current-password"
                  style={{ WebkitTextSecurity: showPin ? 'none' : 'disc' }}
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 tracking-widest outline-none transition-shadow"
                  placeholder="••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Memorare credențiale */}
          <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 p-3 rounded-2xl">
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only peer"
              />
              <div 
                className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-sm"
                style={rememberMe ? { backgroundColor: tc } : {}}
              ></div>
            </div>
            <div>
              <span className="text-sm text-slate-700 font-bold block">Ține-mă minte</span>
              <span className="text-[10px] text-slate-400">Salvează codul și PIN-ul pe acest dispozitiv</span>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
            style={{ backgroundColor: tc }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            <span>{loading ? 'Se verifică...' : 'Intră în cont'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
