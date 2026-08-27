import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Fingerprint, Loader2, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export default function ScanScreen() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('t');
  const locationId = searchParams.get('l');
  const ts = parseInt(searchParams.get('ts'), 10);

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cnp, setCnp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Validate URL and time
  useEffect(() => {
    if (!tenantId || !locationId || !ts) {
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
        const res = await fetch(`http://localhost:5001/api/tenants/${tenantId}`);
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
  }, [tenantId, locationId, ts]);

  const handleScan = async (actionType) => {
    if (!cnp || cnp.trim().length < 4) {
      alert('Te rog introdu codul numeric (CNP) corect.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:5001/api/scan/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnp, tenantId, locationId, actionType })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Eroare Scanare</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const themeColor = tenant?.theme_color || '#3b82f6';

  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: `${themeColor}10` }}>
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Succes!</h1>
          <p className="text-slate-600 font-medium mb-6">{successMsg}</p>

          {employeeInfo && (
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 text-left">
              {employeeInfo.avatar_path ? (
                <img src={`http://localhost:5001${employeeInfo.avatar_path}`} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                  {employeeInfo.first_name[0]}{employeeInfo.last_name[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">{employeeInfo.first_name} {employeeInfo.last_name}</p>
                <p className="text-xs text-slate-500">Zi făină în continuare!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center border-b border-slate-100" style={{ backgroundColor: `${themeColor}05` }}>
            {tenant.logo_url ? (
              <img src={`http://localhost:5001${tenant.logo_url}`} alt="Logo" className="h-12 object-contain mx-auto mb-3" />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm mx-auto mb-3"
                style={{ backgroundColor: themeColor, color: '#fff' }}
              >
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-lg font-bold text-slate-900">{tenant.name}</h1>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mt-1">Portal Pontaj</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 text-sm">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2 text-center">
                Introdu codul tău numeric (CNP)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                  <Fingerprint size={20} />
                </div>
                <input
                  type="number"
                  value={cnp}
                  onChange={e => setCnp(e.target.value)}
                  placeholder="Ex: 1900101..."
                  className="w-full pl-12 pr-4 h-14 text-lg rounded-2xl border-2 border-slate-200 focus:border-transparent focus:ring-4 outline-none transition-all text-center tracking-widest font-bold text-slate-800"
                  style={{ '--tw-ring-color': `${themeColor}50` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={submitting || error}
                onClick={() => handleScan('IN')}
                className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-green-50 hover:bg-green-100 text-green-700 font-bold transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={28} className="animate-spin" /> : <LogIn size={28} />}
                <span>INTRARE</span>
              </button>

              <button
                disabled={submitting || error}
                onClick={() => handleScan('OUT')}
                className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={28} className="animate-spin" /> : <LogOut size={28} />}
                <span>IEȘIRE</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-medium text-slate-400 mt-8">
          Sistem protejat QR Pontaj © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
