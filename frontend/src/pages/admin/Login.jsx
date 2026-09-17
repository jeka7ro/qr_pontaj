import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem('saved_admin_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('saved_admin_email'));

  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

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
    
    try {
      if (rememberMe) {
        localStorage.setItem('saved_admin_email', email);
      } else {
        localStorage.removeItem('saved_admin_email');
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          QR Pontaj
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
          Autentificare Platformă
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-lg sm:px-10 border border-slate-100 dark:border-slate-700/50">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Adresă de email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username email"
                  className="block w-full pl-10 px-4 h-10 border border-slate-200 dark:border-slate-700 rounded-full focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none sm:text-sm transition-all shadow-sm"
                  placeholder="admin@restaurant.ro"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Parolă
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 px-4 h-10 border border-slate-200 dark:border-slate-700 rounded-full focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none sm:text-sm transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-300 font-medium">Ține-mă minte</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotError('');
                  setForgotSuccess(false);
                  setForgotEmail(email || '');
                }}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline transition-all cursor-pointer"
              >
                Ai uitat parola?
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center px-5 h-11 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                Intră în cont
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Ai uitat parola? (Brevo Email Reset) */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
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
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full inline-block">
                    ⏱️ Linkul este valabil timp de 30 de minute.
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-full h-11 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
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
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@restaurant.ro"
                      className="block w-full pl-10 pr-4 h-11 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-md shadow-primary-500/20 transition-all disabled:opacity-60 cursor-pointer"
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
