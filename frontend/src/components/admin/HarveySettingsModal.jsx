import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Mail, User, ShieldCheck, CheckCircle2, AlertCircle, Save, Loader2, MapPin, Phone } from 'lucide-react';

export default function HarveySettingsModal({ isOpen, onClose, onSaved }) {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [googlePlacesApiKey, setGooglePlacesApiKey] = useState('');
  const [senderName, setSenderName] = useState('Smart QR Pontaj');
  const [senderEmail, setSenderEmail] = useState('jeka7ro@gmail.com');
  const [senderPhone, setSenderPhone] = useState('+40 757 77 77 12');
  const [dailySendLimit, setDailySendLimit] = useState(25);
  const [defaultPitch, setDefaultPitch] = useState('pontaj_digital');
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [hasGooglePlacesKey, setHasGooglePlacesKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await fetch('/api/admin/harvey/settings');
      } catch (e) {
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
        res = await fetch(`${baseUrl}/api/admin/harvey/settings`);
      }
      const data = await res.json();
      if (data.success && data.settings) {
        setSenderName(data.settings.sender_name || 'Smart QR Pontaj');
        setSenderEmail(data.settings.sender_email || 'contact@pontaj.app');
        setSenderPhone(data.settings.sender_phone || '+40 757 77 77 12');
        setDailySendLimit(data.settings.daily_send_limit || 25);
        setDefaultPitch(data.settings.default_pitch || 'pontaj_digital');
        setAnthropicApiKey(data.settings.anthropic_api_key || '');
        setHasAnthropicKey(data.settings.has_anthropic_key);
        setGooglePlacesApiKey(data.settings.google_places_api_key || '');
        setHasGooglePlacesKey(data.settings.has_google_places_key);
      }
    } catch (err) {
      setError('Eroare la încărcarea setărilor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let res;
      const payload = {
        senderName,
        senderEmail,
        senderPhone,
        dailySendLimit: Number(dailySendLimit),
        defaultPitch,
        anthropicApiKey,
        googlePlacesApiKey
      };

      try {
        res = await fetch('/api/admin/harvey/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
        res = await fetch(`${baseUrl}/api/admin/harvey/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la salvare.');
      }

      setSuccessMsg('Setările campaniilor Harvey au fost actualizate!');
      if (onSaved) onSaved(data.settings);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Setări Harvey SDR & Claude
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configurare model AI, expeditor Brevo și limite de trimitere
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Anthropic API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Key size={13} className="text-primary-600" />
                Anthropic API Key (Claude)
              </label>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                hasAnthropicKey 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {hasAnthropicKey ? 'Claude 3.5 Activ' : 'Mod Template Activ'}
              </span>
            </div>
            <input
              type="password"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              placeholder={hasAnthropicKey ? '••••••••••••••••' : 'sk-ant-api03-... (Opțional)'}
              className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Dacă nu introduci o cheie Anthropic, sistemul folosește generatorul inteligent cu șabloane optimizate pe fiecare nișă.
            </p>
          </div>

          {/* Google Places API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin size={13} className="text-primary-600" />
                Google Places API Key (Căutare Google Maps)
              </label>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                hasGooglePlacesKey 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              }`}>
                {hasGooglePlacesKey ? 'Google Places Activ' : 'OpenStreetMap Gratuit'}
              </span>
            </div>
            <input
              type="password"
              value={googlePlacesApiKey}
              onChange={(e) => setGooglePlacesApiKey(e.target.value)}
              placeholder={hasGooglePlacesKey ? '••••••••••••••••' : 'AIzaSy... (Cheie API Google Cloud)'}
              className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Activează căutarea directă și ultra-precisă de firme din Google Maps (cu numere de telefon reale, adrese și recenzii). Dacă nu e setat, se folosește OpenStreetMap (gratuit).
            </p>
          </div>

          {/* Nume & Email & Telefon Expeditor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 whitespace-nowrap">
                Nume Expeditor
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Smart QR Pontaj"
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 whitespace-nowrap">
                Email Expeditor (Brevo)
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="contact@pontaj.app"
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 whitespace-nowrap flex items-center gap-1">
                <Phone size={12} className="text-primary-600 shrink-0" />
                <span>Telefon / WhatsApp</span>
              </label>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="+40 757 77 77 12"
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Limită Zilnică Trimitere */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Limită Maximă Trimiteri Zilnice
              </label>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                {dailySendLimit} emailuri / zi
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={dailySendLimit}
              onChange={(e) => setDailySendLimit(e.target.value)}
              className="w-full accent-primary-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Protejează reputația domeniului tău de trimitere împotriva filtrării ca spam. Recomandat: 20–30 emailuri/zi.
            </p>
          </div>

          {/* Pitch Implicit */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Unghi de Abordare Implicit
            </label>
            <select
              value={defaultPitch}
              onChange={(e) => setDefaultPitch(e.target.value)}
              className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs cursor-pointer"
            >
              <option value="pontaj_digital">Pontaj Digital & SAGA (General)</option>
              <option value="itm_compliance">Conformitate & Protecție ITM</option>
              <option value="kiosk_tableta">Terminal Kiosk pe Tabletă la Intrare</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors whitespace-nowrap shrink-0"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Salvează Setările</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
