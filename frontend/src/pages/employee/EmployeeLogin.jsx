import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, KeyRound, User, Loader2, AlertCircle } from 'lucide-react';

export default function EmployeeLogin() {
  const [employeeCode, setEmployeeCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm overflow-hidden">
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
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
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
                  type="password"
                  inputMode="numeric"
                  maxLength="4"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 tracking-widest outline-none transition-shadow"
                  placeholder="••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            <span>{loading ? 'Se verifică...' : 'Intră în cont'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
