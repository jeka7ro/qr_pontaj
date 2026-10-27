import React, { useState, useEffect } from 'react';
import { getApiUrl, getAuthHeaders } from '../../utils/apiUrl';
import { 
  X, 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Phone, 
  Mail,
  MapPin, 
  CheckSquare, 
  Square,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Tag
} from 'lucide-react';

const CAEN_QUICK_LIST = [
  { code: '5610', label: '5610 • Restaurante' },
  { code: '5510', label: '5510 • Hoteluri & Pensiuni' },
  { code: '5630', label: '5630 • Cafenele & Baruri' },
  { code: '4120', label: '4120 • Construcții Clădiri' },
  { code: '4321', label: '4321 • Instalații Tehnice' },
  { code: '6920', label: '6920 • Contabilitate (SAGA)' },
  { code: '8121', label: '8121 • Curățenie Profesională' },
  { code: '8623', label: '8623 • Clinici & Stomatologie' },
  { code: '4941', label: '4941 • Transport & Logistică' },
  { code: '8010', label: '8010 • Pază & Protecție' },
  { code: '9602', label: '9602 • Saloane Beauty' },
  { code: '1071', label: '1071 • Brutării & Patiserii' }
];

const ROMANIA_CITIES = [
  'București',
  'Cluj-Napoca',
  'Timișoara',
  'Iași',
  'Brașov',
  'Constanța',
  'Craiova',
  'Oradea',
  'Sibiu',
  'Ploiești',
  'Galați',
  'Arad',
  'Pitești',
  'Bacău',
  'Târgu Mureș',
  'Baia Mare',
  'Buzău',
  'Suceava'
];

export default function HarveyAnafLookupModal({ isOpen, onClose, onImportCompleted, initialProvider = 'anaf' }) {
  const [provider, setProvider] = useState(initialProvider || 'anaf'); // 'anaf' | 'firmeapi'
  const [firmeApiUsage, setFirmeApiUsage] = useState(null);
  const [selectedCaen, setSelectedCaen] = useState('5610');
  const [selectedCity, setSelectedCity] = useState('București');
  const [resultLimit, setResultLimit] = useState(10);
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setProvider(initialProvider || 'anaf');
      fetchFirmeApiUsage();
    }
  }, [isOpen, initialProvider]);

  const fetchFirmeApiUsage = async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/firmeapi-usage`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.usage) {
          setFirmeApiUsage(data.usage);
        }
      }
    } catch (err) {
      // Ignorăm silențios
    }
  };

  if (!isOpen) return null;

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLookup = async (overrideCaen = null) => {
    setError(null);
    const trimmedInput = rawInput.trim();
    const targetCaen = overrideCaen || (!trimmedInput ? selectedCaen : null);

    let payload = {
      city: selectedCity,
      limit: resultLimit
    };

    if (targetCaen) {
      payload.caen = targetCaen;
    } else if (/^\d{4}$/.test(trimmedInput)) {
      // Utilizatorul a introdus un cod CAEN de 4 cifre (ex: 5610)
      payload.caen = trimmedInput;
    } else {
      // Verificăm dacă inputul conține o listă de CUI-uri (5-10 cifre) sau o căutare după nume/domeniu
      const tokens = trimmedInput
        .split(/[\n,;]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const allLookLikeCuis = tokens.length > 0 && tokens.every(t => /^(RO)?\s*\d{5,10}$/i.test(t));

      if (allLookLikeCuis) {
        payload.cuis = Array.from(new Set(tokens.map(t => t.replace(/[^0-9]/g, ''))));
      } else {
        payload.query = trimmedInput;
      }
    }

    setLoading(true);
    try {
      const baseUrl = getApiUrl();
      const endpoint = provider === 'firmeapi'
        ? '/api/admin/harvey/firmeapi-batch'
        : '/api/admin/harvey/anaf-batch';

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      let data = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Răspuns invalid de la server (HTTP ${res.status}). Serverul poate fi temporar ocupat.`);
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Eroare la interogarea serviciului. Reîncercați.');
      }

      if (data.usage) {
        setFirmeApiUsage(data.usage);
      }

      setResults(data);
      setSelectedIndices((data.found || []).map((_, i) => i));

      // Notificăm imediat lista principală pentru a actualiza tab-urile și tabelul
      if (onImportCompleted) {
        onImportCompleted(provider);
      }

      if ((data.found || []).length === 0) {
        setError('Nu au fost găsite companii pentru criteriile selectate. Încercați un alt cod CAEN sau oraș.');
      } else {
        const savedText = data.savedCount !== undefined
          ? (data.savedCount > 0
              ? `S-au extras și salvat automat ${data.savedCount} companii noi în Harvey SDR!`
              : `Au fost identificate ${data.found.length} companii (deja existente în baza de date).`)
          : `S-au extras ${data.found.length} companii!`;
        showToast(savedText);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (!results?.found) return;
    if (selectedIndices.length === results.found.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(results.found.map((_, i) => i));
    }
  };

  const toggleSelectIndex = (idx) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(prev => prev.filter(i => i !== idx));
    } else {
      setSelectedIndices(prev => [...prev, idx]);
    }
  };

  const handleSaveToHarvey = async () => {
    if (!results?.found || selectedIndices.length === 0) {
      setError('Selectați cel puțin o companie pentru a o salva în Harvey SDR.');
      return;
    }

    setSaving(true);
    setError(null);

    const companiesToSave = selectedIndices.map(idx => results.found[idx]);

    try {
      const baseUrl = getApiUrl();
      const saveEndpoint = provider === 'firmeapi'
        ? '/api/admin/harvey/firmeapi-save'
        : '/api/admin/harvey/anaf-save';

      const res = await fetch(`${baseUrl}${saveEndpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ companies: companiesToSave })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la salvarea companiilor.');
      }

      showToast(data.message);
      if (onImportCompleted) {
        onImportCompleted(provider);
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              provider === 'firmeapi'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
            }`}>
              {provider === 'firmeapi' ? <Zap size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>
                  {provider === 'firmeapi'
                    ? 'Căutare Companii FirmeAPI.ro (CAEN, Domeniu sau CUI)'
                    : 'Căutare Companii ANAF v9 (CAEN, Domeniu sau CUI)'}
                </span>
                {provider === 'firmeapi' && firmeApiUsage ? (
                  <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    Rămase azi: {firmeApiUsage.remaining} / {firmeApiUsage.dailyLimit || 100}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    Date Fiscale + Contact
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selectează un cod CAEN și orașul (sau introdu nume / CUI) pentru a extrage firme active cu telefon, email, website și CUI verificat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector Provider (ANAF v9 vs FirmeAPI.ro) */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setProvider('anaf'); setError(null); }}
              className={`px-3.5 h-8 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                provider === 'anaf'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck size={13} className="shrink-0" />
              <span>ANAF v9 Oficial (Nelimitat)</span>
            </button>

            <button
              type="button"
              onClick={() => { setProvider('firmeapi'); setError(null); fetchFirmeApiUsage(); }}
              className={`px-3.5 h-8 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                provider === 'firmeapi'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Zap size={13} className="shrink-0" />
              <span>FirmeAPI.ro (Rapid • 100/zi)</span>
            </button>
          </div>

          {firmeApiUsage && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              Cotă FirmeAPI azi: <strong>{firmeApiUsage.requestsToday}</strong> folosite • <strong>{firmeApiUsage.remaining}</strong> disponibile
            </span>
          )}
        </div>

        {/* Corp Modal */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex-1">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-900 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {toastMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-900 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{toastMessage}</span>
            </div>
          )}

          {!results ? (
            <div className="space-y-4">
              {/* 1. Selecție Rapidă Cod CAEN (1-Click) */}
              <div className="space-y-2">
                <label className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>1. Alege Codul CAEN / Domeniul de activitate:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CAEN_QUICK_LIST.map((item) => {
                    const isActive = selectedCaen === item.code && !rawInput.trim();
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setSelectedCaen(item.code);
                          setRawInput('');
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Oraș & Număr de Companii */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>2. Oraș / Județ:</span>
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {ROMANIA_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>3. Număr de companii de extras:</span>
                  </label>
                  <select
                    value={resultLimit}
                    onChange={(e) => setResultLimit(Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value={5}>5 companii verificate</option>
                    <option value={10}>10 companii verificate (Recomandat)</option>
                    <option value={15}>15 companii verificate</option>
                    <option value={20}>20 companii verificate</option>
                  </select>
                </div>
              </div>

              {/* 3. Căutare liberă opțională (alt CAEN, denumire firmă sau listă CUI-uri) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Opțional — Caută alt cod CAEN, nume de companie sau lipește CUI-uri specifice:
                  </label>
                  {rawInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setRawInput('')}
                      className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Șterge textul
                    </button>
                  )}
                </div>

                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Lasă gol pentru a căuta automat după codul CAEN selectat mai sus (ex: 5610 Restaurante), sau scrie aici un nume de firmă / domeniu / CUI-uri (ex: 14399840)..."
                  rows={3}
                  className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Căutare activă:{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {rawInput.trim()
                      ? `"${rawInput.trim().slice(0, 40)}" în ${selectedCity}`
                      : `CAEN ${selectedCaen} (${CAEN_QUICK_LIST.find(c => c.code === selectedCaen)?.label.split('• ')[1] || ''}) în ${selectedCity}`}
                  </strong>
                </div>

                <button
                  onClick={() => handleLookup()}
                  disabled={loading}
                  className={`px-6 h-10 rounded-full text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0 ${
                    provider === 'firmeapi'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin shrink-0" />
                      <span>Se extrag și se salvează automat companiile...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} className="shrink-0" />
                      <span>
                        {rawInput.trim()
                          ? `Extrage & Salvează din ${provider === 'firmeapi' ? 'FirmeAPI.ro' : 'ANAF'}`
                          : `Extrage & Salvează ${resultLimit} Firme (CAEN ${selectedCaen} • ${selectedCity})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Rezultate */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Companii Extrase & Salvate: <strong>{results.found.length}</strong></span>
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                    Cu Telefon: <strong>{results.found.filter(c => c.phone).length}</strong>
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold whitespace-nowrap shrink-0">
                    Cu Email: <strong>{results.found.filter(c => c.email).length}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onImportCompleted) onImportCompleted(provider);
                      onClose();
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
                  >
                    <span>Vezi direct în Tabel ({results.found.length})</span>
                  </button>

                  <button
                    onClick={() => { setResults(null); setSelectedIndices([]); }}
                    className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0 font-semibold"
                  >
                    Căutare nouă
                  </button>
                </div>
              </div>

              {/* Tabel companii identificate */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Companie & CUI</th>
                      <th className="p-3">Contact (Telefon & Email)</th>
                      <th className="p-3">Localitate & Adresă</th>
                      <th className="p-3">CAEN & Nișă</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.found.map((c, idx) => {
                      const isSelected = selectedIndices.includes(idx);
                      return (
                        <tr
                          key={(c.cui || '') + idx}
                          onClick={() => toggleSelectIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50/60 dark:bg-blue-950/30' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded-sm text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {c.website && (
                                <a
                                  href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-600 hover:text-blue-700 shrink-0"
                                  title={c.website}
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              CUI: {c.cui || 'N/A'} {c.regCom ? `• ${c.regCom}` : ''}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {c.phone ? (
                                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap shrink-0">
                                  <Phone size={11} className="shrink-0" />
                                  <span>{c.phone}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400">Fără telefon</div>
                              )}
                              {c.email ? (
                                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 truncate max-w-[190px]" title={c.email}>
                                  <Mail size={11} className="shrink-0" />
                                  <span className="truncate">{c.email}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400">Fără email</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{c.city || c.county}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={c.address}>
                              {c.address}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                              {c.caen ? `CAEN ${c.caen} • ` : ''}{c.nicheCategory}
                            </span>
                            <div className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-[160px]">
                              {c.caenDescription || c.pitchSubject}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {c.status || 'ACTIV'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {results && (
              <span><strong>{selectedIndices.length}</strong> din <strong>{results.found.length}</strong> companii selectate</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 h-9 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Închide
            </button>
            {results && (
              <button
                onClick={() => {
                  if (onImportCompleted) onImportCompleted(provider);
                  onClose();
                }}
                className="px-5 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Vezi în Harvey SDR ({results.found.length})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
