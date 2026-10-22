import React, { useState, useEffect } from 'react';
import { X, Mail, Send, Sparkles, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Globe, Phone, MapPin, Building2, Save, Languages } from 'lucide-react';

// Steaguri vectoriale SVG compacte, clare, fără caractere emoji
const FlagRO = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#002B7F" d="M0 0h213.3v480H0z" />
      <path fill="#FCD116" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#CE1126" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

const FlagEN = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path fill="#FFF" d="m75 0 245 180L565 0h75v60L435 240l205 180v60h-75L320 300 75 480H0v-60l205-180L0 60V0h75z" />
    <path fill="#C8102E" d="m424 288 216 156v36h-48L376 312zm-208-96L0 36V0h48l216 156zm176-36 248-180v24L416 156zM224 324 0 456v-24l224-132z" />
    <path fill="#FFF" d="M256 0h128v480H256zM0 176h640v128H0z" />
    <path fill="#C8102E" d="M280 0h80v480h-80zM0 200h640v80H0z" />
  </svg>
);

const FlagFR = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#002654" d="M0 0h213.3v480H0z" />
      <path fill="#ECEFF4" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#CE1126" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

const FlagNL = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#AE1C28" d="M0 0h640v160H0z" />
      <path fill="#FFF" d="M0 160h640v160H0z" />
      <path fill="#21468B" d="M0 320h640v160H0z" />
    </g>
  </svg>
);

const FlagDE = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <path fill="#000" d="M0 0h640v160H0z" />
    <path fill="#D00" d="M0 160h640v160H0z" />
    <path fill="#FFCE00" d="M0 320h640v160H0z" />
  </svg>
);

export default function HarveyReviewEmailModal({ isOpen, onClose, lead, onUpdated, onSent }) {
  if (!isOpen || !lead) return null;

  const detectInitialLang = (item) => {
    if (item.language) return item.language;
    const str = `${item.city || ''} ${item.address || ''}`.toLowerCase();
    if (str.includes('bruxelles') || str.includes('brussel') || str.includes('belg') || str.includes('liège') || str.includes('liege') || str.includes('namur') || str.includes('charleroi') || str.includes('france') || str.includes('paris')) {
      return 'fr';
    }
    if (str.includes('antwerpen') || str.includes('gent') || str.includes('brugge') || str.includes('leuven') || str.includes('nederland') || str.includes('amsterdam')) {
      return 'nl';
    }
    if (str.includes('deutschland') || str.includes('germany') || str.includes('berlin') || str.includes('münchen') || str.includes('wien')) {
      return 'de';
    }
    if (str.includes('bucure') || str.includes('cluj') || str.includes('timi') || str.includes('iasi') || str.includes('iași') || str.includes('brasov') || str.includes('brașov') || str.includes('constan') || str.includes('craiova') || str.includes('rom')) {
      return 'ro';
    }
    return 'en';
  };

  const [selectedLanguage, setSelectedLanguage] = useState(() => detectInitialLang(lead));
  const [subject, setSubject] = useState(lead.draft_subject || '');
  const [body, setBody] = useState(lead.draft_body || '');
  const [email, setEmail] = useState(lead.email || '');
  const [pitchFocus, setPitchFocus] = useState('pontaj_digital');
  const [customNotes, setCustomNotes] = useState(lead.notes || '');

  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (lead) {
      const initialLang = detectInitialLang(lead);
      setSelectedLanguage(initialLang);
      setSubject(lead.draft_subject || '');
      setBody(lead.draft_body || '');
      setEmail(lead.email || '');
      setCustomNotes(lead.notes || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [lead?.id]);

  const languagesList = [
    { code: 'ro', label: 'RO', Flag: FlagRO, title: 'Română', fullName: 'Română' },
    { code: 'en', label: 'ENG', Flag: FlagEN, title: 'English', fullName: 'Engleză' },
    { code: 'fr', label: 'FR', Flag: FlagFR, title: 'Français', fullName: 'Franceză' },
    { code: 'nl', label: 'NL', Flag: FlagNL, title: 'Nederlands', fullName: 'Neerlandeză' },
    { code: 'de', label: 'DE', Flag: FlagDE, title: 'Deutsch', fullName: 'Germană' }
  ];

  const getLanguageLabel = (code) => {
    return languagesList.find((l) => l.code === code)?.fullName || code.toUpperCase();
  };

  const handleLanguageChange = async (newLang) => {
    if (newLang === selectedLanguage) return;
    setSelectedLanguage(newLang);
    setRegenerating(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${lead.id}/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: newLang,
          pitchFocus,
          customNotes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la schimbarea limbii.');
      }

      setSubject(data.lead.draft_subject || '');
      setBody(data.lead.draft_body || '');
      setSuccessMsg(`Mesaj adaptat automat în limba ${getLanguageLabel(newLang)}!`);
      if (onUpdated) onUpdated(data.lead);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftSubject: subject,
          draftBody: body,
          email: email,
          notes: customNotes,
          language: selectedLanguage
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la salvare.');
      }

      setSuccessMsg('Modificările au fost salvate cu succes.');
      if (onUpdated) onUpdated(data.lead);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateWithAi = async () => {
    setRegenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${lead.id}/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pitchFocus,
          customNotes,
          language: selectedLanguage
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la regenerare.');
      }

      setSubject(data.lead.draft_subject || '');
      setBody(data.lead.draft_body || '');
      setSuccessMsg(`Mesaj regenerat cu succes în limba ${getLanguageLabel(selectedLanguage)}!`);
      if (onUpdated) onUpdated(data.lead);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Vă rugăm introduceți o adresă de email validă.');
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Mai întâi salvăm ultimele modificări din formular
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      await fetch(`${baseUrl}/api/admin/harvey/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftSubject: subject,
          draftBody: body,
          email: email,
          language: selectedLanguage
        })
      });

      // Apoi apelăm endpoint-ul de trimitere prin Brevo
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Trimiterea emailului a eșuat.');
      }

      setSuccessMsg('Emailul a fost expediat cu succes prin Brevo!');
      if (onSent) onSent(data.lead);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${lead.id}/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: 'jeka7ro@gmail.com' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Trimiterea testului a eșuat.');
      }
      setSuccessMsg(`Email de test expediat cu succes către ${data.recipient}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingTest(false);
    }
  };

  // Opțiuni pitch dinamice în funcție de limba selectată
  const getPitchOptions = () => {
    if (selectedLanguage === 'fr') {
      return [
        { value: 'pontaj_digital', label: 'Pointage Digital & Feuilles de Présence (Général)' },
        { value: 'itm_compliance', label: 'Conformité Légale & Dimona (Inspection Sociale)' },
        { value: 'kiosk_tableta', label: 'Borne Tablette Kiosk à l’Entrée' }
      ];
    }
    if (selectedLanguage === 'nl') {
      return [
        { value: 'pontaj_digital', label: 'Digitale Tijdsregistratie & Sociaal Secretariaat' },
        { value: 'itm_compliance', label: 'Conforme Aanwezigheidsregistratie & Inspectie' },
        { value: 'kiosk_tableta', label: 'Tablet Prikklok aan de Ingang' }
      ];
    }
    if (selectedLanguage === 'en') {
      return [
        { value: 'pontaj_digital', label: 'Digital Time Tracking & Payroll Timesheets' },
        { value: 'itm_compliance', label: 'Labor Law & Overtime Compliance' },
        { value: 'kiosk_tableta', label: 'Tablet Kiosk Time Clock' }
      ];
    }
    if (selectedLanguage === 'de') {
      return [
        { value: 'pontaj_digital', label: 'Digitale Zeiterfassung & Lohnabrechnung' },
        { value: 'itm_compliance', label: 'Rechtssichere Zeiterfassung & Prüfungen' },
        { value: 'kiosk_tableta', label: 'Tablet-Stechuhr am Eingang' }
      ];
    }
    return [
      { value: 'pontaj_digital', label: 'Pontaj Digital & SAGA (General)' },
      { value: 'itm_compliance', label: 'Conformitate & Protecție ITM' },
      { value: 'kiosk_tableta', label: 'Terminal Kiosk pe Tabletă' }
    ];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Revizuire & Aprobare Email (Human-in-the-Loop)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lead.company_name} — {lead.city || 'Belgia / Internațional'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
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

          {/* Card Date Companie */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">COMPANIE & SEDIU</span>
              <p className="font-bold text-slate-800 dark:text-white text-sm">{lead.company_name}</p>
              {lead.address && <p className="text-slate-600 dark:text-slate-400 mt-0.5">{lead.address}</p>}
            </div>
            <div>
              <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">DATE DE CONTACT</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@companie.be"
                  className="w-full px-3 h-8 text-xs rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none"
                />
              </div>
              {lead.website && (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 hover:underline mt-1.5 font-medium"
                >
                  <Globe size={12} />
                  <span className="truncate max-w-[200px]">{lead.website}</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* Selector Limbă Email (RO, ENG, FR, NL, DE) */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
              <Languages size={15} className="text-primary-600 dark:text-primary-400 shrink-0" />
              <span>Limbă Email:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              {languagesList.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                const Flag = lang.Flag;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={regenerating}
                    title={lang.title}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Flag />
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Hook Bar */}
          {lead.ai_hook && (
            <div className="flex items-start gap-2 p-3 bg-primary-50/50 dark:bg-primary-950/30 rounded-2xl border border-primary-100 dark:border-primary-900/50 text-xs">
              <Sparkles size={16} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-primary-800 dark:text-primary-300">Unghi adaptat ({selectedLanguage.toUpperCase()}): </span>
                <span className="text-slate-700 dark:text-slate-300">{lead.ai_hook}</span>
              </div>
            </div>
          )}

          {/* Selector Unghi / Pitch & Regenerare */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                Unghi Pitch:
              </span>
              <select
                value={pitchFocus}
                onChange={(e) => setPitchFocus(e.target.value)}
                className="px-3 h-8 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[280px] truncate"
              >
                {getPitchOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleRegenerateWithAi}
              disabled={regenerating}
              className="px-3.5 h-8 rounded-full border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
              <span>Regenerează ({selectedLanguage.toUpperCase()})</span>
            </button>
          </div>

          {/* Câmp Subiect */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Subiect Email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subiectul emailului..."
              className="w-full px-4 h-10 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
            />
          </div>

          {/* Câmp Corp Mesaj */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Corp Email (Editabil)
            </label>
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Mesajul generat de AI..."
              className="w-full p-4 text-xs leading-relaxed rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs resize-y"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || sending || sendingTest}
            className="px-4 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Save size={14} className="shrink-0" />
            <span>{saving ? 'Se salvează...' : 'Salvează Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={saving || sending || sendingTest}
            className="px-4 h-10 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
            title="Trimite un test pe jeka7ro@gmail.com fără a schimba statusul lead-ului"
          >
            <Mail size={14} className="shrink-0" />
            <span>{sendingTest ? 'Se trimite test...' : 'Trimite Test pe Emailul Meu'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-5 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors whitespace-nowrap shrink-0"
            >
              Închide
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending || lead.status === 'sent'}
              className="px-6 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Send size={15} className="shrink-0" />
              <span>{sending ? 'Se trimite prin Brevo...' : lead.status === 'sent' ? 'Trimis Anterior' : 'Aprobă & Trimite Acum'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
