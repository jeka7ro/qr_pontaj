import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');

  // Verificare token la încărcarea paginii
  useEffect(() => {
    if (!token) {
      setTokenError('Linkul de resetare este invalid sau lipsește.');
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/auth/verify-reset-token/${token}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setTokenValid(true);
          setUserEmail(data.email || '');
        } else {
          setTokenError(data.error || 'Linkul de resetare a expirat sau nu este valid.');
        }
      } catch (err) {
        setTokenError('Eroare de conexiune la verificarea linkului.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele introduse nu coincid.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Eroare la resetarea parolei.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 3500);

    } catch (err) {
      setError('Eroare de rețea. Te rugăm să încerci din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          QR Pontaj
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
          Securitate Cont & Resetare Parolă
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100 dark:border-slate-800">
          
          {verifying ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">Se verifică linkul de resetare...</p>
            </div>
          ) : tokenError ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Link Expirat sau Invalid</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {tokenError}
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center gap-2 w-full px-5 h-11 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all"
              >
                <ArrowLeft size={16} /> Înapoi la Autentificare
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Parolă Actualizată!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Noua ta parolă a fost salvată cu succes. Te redirecționăm automat la pagina de autentificare...
              </p>
              <button
                type="button"
                onClick={() => navigate('/admin/login', { replace: true })}
                className="w-full flex items-center justify-center px-5 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                Mergi la Login acum
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={22} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Alege o Parolă Nouă</h3>
                {userEmail && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Pentru contul: <span className="font-semibold text-slate-700 dark:text-slate-300">{userEmail}</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Noua Parolă
                </label>
                <div className="relative rounded-lg">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minim 6 caractere"
                    className="block w-full pl-4 pr-11 h-11 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-sm transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirmă Noua Parolă
                </label>
                <div className="relative rounded-lg">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Reintrodu parola"
                    className="block w-full pl-4 pr-11 h-11 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-sm transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-5 h-11 rounded-full bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-sm font-bold shadow-md shadow-primary-500/20 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Se actualizează...</span>
                    </>
                  ) : (
                    <span>Actualizează Parola</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/admin/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Anulează și mergi la Login
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
