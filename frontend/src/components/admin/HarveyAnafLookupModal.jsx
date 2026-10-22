import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  FileCheck, 
  Phone, 
  MapPin, 
  CheckSquare, 
  Square,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function HarveyAnafLookupModal({ isOpen, onClose, onImportCompleted }) {
  if (!isOpen) return null;

  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLookup = async () => {
    setError(null);
    const lines = rawInput
      .split(/[\n,;\s]+/)
      .map(s => s.trim().replace(/^RO/i, '').replace(/[^0-9]/g, ''))
      .filter(s => s.length >= 2);

    const uniqueCuis = Array.from(new Set(lines));

    if (uniqueCuis.length === 0) {
      setError('Vă rugăm să introduceți cel puțin un cod CUI valid (cifre).');
      return;
    }

    setLoading(true);
    try {
      let res;
      try {
        // Încercare 1: Cale relativă (proxy Vite / producție)
        res = await fetch('/api/admin/harvey/anaf-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cuis: uniqueCuis })
        });
      } catch (proxyErr) {
        // Încercare 2: Fallback pe baseUrl explicit
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
        res = await fetch(`${baseUrl}/api/admin/harvey/anaf-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cuis: uniqueCuis })
        });
      }

      let data = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Răspuns invalid de la server (HTTP ${res.status}). Serverul ANAF poate fi temporar ocupat.`);
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Eroare la interogarea serviciului oficial ANAF. Reîncercați.');
      }

      setResults(data);
      // Selectăm automat toate companiile găsite
      setSelectedIndices((data.found || []).map((_, i) => i));

      if ((data.found || []).length === 0 && (data.notFound || []).length > 0) {
        setError(`Codurile CUI introduse (${data.notFound.join(', ')}) nu au fost găsite în registrul oficial ANAF.`);
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
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/admin/harvey/anaf-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: companiesToSave })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la salvarea companiilor.');
      }

      showToast(data.message);
      if (onImportCompleted) {
        onImportCompleted();
      }
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Interogare Oficială ANAF v9 (Bază CUI)</span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  Pilonul 3
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extrage automat firmele active, adresele oficiale și generează pitch-ul dedicat Cod Muncii Art. 119
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

        {/* Corp Modal */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex-1">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {toastMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Secțiunea de Input CUI-uri dacă nu avem încă rezultate */}
          {!results ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  Introduceți sau lipiți CUI-urile (separate prin virgulă, spațiu sau rând nou):
                </label>
                <span className="text-[11px] text-slate-400">
                  Maxim 100 de CUI-uri per interogare
                </span>
              </div>

              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Exemplu:&#10;14399840&#10;RO36402010&#10;41295831&#10;25390112"
                rows={7}
                className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm"
              />

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Sparkles size={15} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <strong>Sfat de targetare:</strong> Exportați lista din Termene.ro sau ListaFirme filtrată pe CAEN <strong>5610 (Restaurante)</strong>, <strong>4120 (Construcții)</strong> sau <strong>6920 (Contabilitate)</strong> cu 7-50 salariați.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleLookup}
                  disabled={loading}
                  className="px-6 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Interogare registru ANAF v9...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      <span>Interoghează Oficial ANAF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Rezultate ANAF */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Companii Identificate: <strong>{results.found.length}</strong>
                  </span>
                  {results.notFound.length > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      (Negăsite: {results.notFound.length})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {selectedIndices.length === results.found.length ? (
                      <>
                        <CheckSquare size={14} />
                        <span>Deselectează tot</span>
                      </>
                    ) : (
                      <>
                        <Square size={14} />
                        <span>Selectează toate ({results.found.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => { setResults(null); setSelectedIndices([]); }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Căutare nouă
                  </button>
                </div>
              </div>

              {/* Tabel companii identificate */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Companie & CUI</th>
                      <th className="p-3">Localitate & Adresă</th>
                      <th className="p-3">Nișă & Pitch Sugerat</th>
                      <th className="p-3 text-center">Status Fiscal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.found.map((c, idx) => {
                      const isSelected = selectedIndices.includes(idx);
                      return (
                        <tr
                          key={c.cui + idx}
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
                            <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              CUI: {c.cui} {c.regCom ? `• ${c.regCom}` : ''}
                            </div>
                            {c.phone && (
                              <div className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                <span>{c.phone}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{c.city || c.county}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs" title={c.address}>
                              {c.address}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                              {c.nicheCategory}
                            </span>
                            <div className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-xs">
                              {c.pitchSubject}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                              c.status === 'ACTIV' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {c.status} {c.isVatPayer ? '(TVA)' : ''}
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
                onClick={handleSaveToHarvey}
                disabled={saving || selectedIndices.length === 0}
                className="px-5 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Salvare...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Salvează în Harvey SDR ({selectedIndices.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
