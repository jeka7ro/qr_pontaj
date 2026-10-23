import React, { useState } from 'react';
import { X, Plus, Building2, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../../utils/apiUrl';

export default function HarveyAddLeadModal({ isOpen, onClose, onLeadAdded }) {
  if (!isOpen) return null;

  const [companyName, setCompanyName] = useState('');
  const [cui, setCui] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [industry, setIndustry] = useState('Restaurante');
  const [notes, setNotes] = useState('');

  const [anafLoading, setAnafLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnafLookup = async () => {
    const cleanCui = cui.replace(/[^0-9]/g, '');
    if (!cleanCui) {
      setError('Introduceți un CUI format din cifre.');
      return;
    }

    setAnafLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/company/lookup?cui=${cleanCui}`);
      const data = await res.json();
      if (data.success && data.found && data.company) {
        setCompanyName(data.company.name || companyName);
        setAddress(data.company.address || address);
        setCity(data.company.city || city);
      } else {
        setError('Compania nu a fost găsită în baza de date ANAF.');
      }
    } catch (err) {
      setError('Eroare la interogarea ANAF.');
    } finally {
      setAnafLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Numele companiei este obligatoriu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          companyName,
          cui,
          city,
          address,
          website,
          email,
          phone,
          contactPerson,
          industry,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la adăugarea companiei.');
      }

      if (onLeadAdded) onLeadAdded(data.lead);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Adaugă Lead Manual în Pipeline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preluare date din ANAF și generare automată pitch
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CUI cu buton ANAF */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Cod Fiscal / CUI (Opțional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cui}
                onChange={(e) => setCui(e.target.value)}
                placeholder="Ex: 12345678"
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={handleAnafLookup}
                disabled={anafLoading || !cui}
                className="px-4 h-10 rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 hover:bg-primary-100 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                {anafLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Auto ANAF</span>
              </button>
            </div>
          </div>

          {/* Nume Companie */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Denumire Companie *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Bistro Gourmet SRL"
              className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
            />
          </div>

          {/* Oraș & Industrie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Oraș
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="București"
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Industrie / Nișă
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs cursor-pointer"
              >
                <option value="Restaurante">Restaurante / HORECA</option>
                <option value="Hoteluri & Pensiuni">Hoteluri & Pensiuni</option>
                <option value="Firme Curățenie">Firme Curățenie</option>
                <option value="Clinici Medicale">Clinici & Cabinete</option>
                <option value="Construcții">Construcții & Instalații</option>
                <option value="Logistică">Logistică & Depozite</option>
                <option value="General">General / Servicii</option>
              </select>
            </div>
          </div>

          {/* Email & Telefon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Adresă Email Contact
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@firma.ro"
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Număr Telefon
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xxxxxxxx"
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Website
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://firma.ro"
              className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors whitespace-nowrap shrink-0"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              <span>Adaugă & Generează Pitch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
