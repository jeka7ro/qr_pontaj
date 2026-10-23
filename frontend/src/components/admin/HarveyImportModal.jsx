import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../../utils/apiUrl';

export default function HarveyImportModal({ isOpen, onClose, onImportSuccess }) {
  const [tab, setTab] = useState('paste'); // 'paste' | 'file'
  const [pasteText, setPasteText] = useState('');
  const [parsedLeads, setParsedLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Parser simplu și robust pentru CSV / TSV / Text delimitat
  const parseRawText = (text) => {
    setErrorMsg('');
    if (!text || !text.trim()) {
      setParsedLeads([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    // Detectăm separatorul (, sau ; sau \t)
    const firstLine = lines[0];
    let sep = ',';
    if (firstLine.includes('\t')) sep = '\t';
    else if (firstLine.includes(';')) sep = ';';

    const leads = [];
    const hasHeader = firstLine.toLowerCase().includes('email') || 
                      firstLine.toLowerCase().includes('nume') || 
                      firstLine.toLowerCase().includes('company') ||
                      firstLine.toLowerCase().includes('firma');

    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      // Split simplu ținând cont de ghilimele opționale
      const cols = line.split(sep).map(c => c.replace(/^["']|["']$/g, '').trim());
      
      let company = '';
      let email = '';
      let city = 'București';
      let phone = '';
      let industry = 'General';

      // Detectăm inteligent care coloană conține emailul (@)
      const emailColIdx = cols.findIndex(c => c.includes('@') && c.includes('.'));
      if (emailColIdx !== -1) {
        email = cols[emailColIdx].toLowerCase();
        // Presupunem că prima coloană diferită de email este compania
        const nonEmailCols = cols.filter((_, idx) => idx !== emailColIdx);
        if (nonEmailCols.length > 0) company = nonEmailCols[0];
        if (nonEmailCols.length > 1) city = nonEmailCols[1];
        if (nonEmailCols.length > 2) phone = nonEmailCols[2];
        if (nonEmailCols.length > 3) industry = nonEmailCols[3];
      } else if (cols.length >= 2) {
        company = cols[0];
        email = cols[1].toLowerCase();
        if (cols[2]) city = cols[2];
        if (cols[3]) phone = cols[3];
        if (cols[4]) industry = cols[4];
      }

      if (company && email && email.includes('@')) {
        leads.push({
          company_name: company,
          email,
          city: city || 'București',
          phone: phone || '',
          industry: industry || 'General',
          country: 'RO'
        });
      }
    }

    setParsedLeads(leads);
    if (leads.length === 0) {
      setErrorMsg('Nu s-au putut extrage lead-uri valide. Asigurați-vă că fiecare rând conține un nume de firmă și o adresă de email validă.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setPasteText(content);
        parseRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedLeads.length === 0) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leads: parsedLeads })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la importul lead-urilor');
      }

      if (onImportSuccess) {
        onImportSuccess(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Eroare la trimiterea către server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Import Rapid Lead-uri (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adaugă sute de companii dintr-un fișier sau tabel copiat direct din Excel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setTab('paste')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tab === 'paste'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Lipește Text / Tabel (Copy-Paste)
          </button>
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              tab === 'file'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Încarcă Fișier (.CSV / .TXT)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {tab === 'paste' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Lipește rândurile din fișierul tău (Format: Nume Companie, Email, Oraș, Telefon, Industrie)
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  parseRawText(e.target.value);
                }}
                placeholder="Exemplu:&#10;Restaurant Trattoria Bella, contact@trattoriabella.ro, București, 0722111222, HORECA&#10;Cabinet Contabilitate Dan, office@contadan.ro, Cluj-Napoca, 0744333444, Cabinete Contabilitate & SAGA"
                rows={6}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-normal focus:outline-none focus:border-emerald-500 dark:text-white"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30">
              <FileText className="mx-auto text-slate-400 mb-3" size={36} />
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                Selectează un fișier CSV sau text exportat din Excel / Google Sheets
              </p>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Previzualizare Lead-uri Detectate */}
          {parsedLeads.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  {parsedLeads.length} lead-uri valide detectate gata de import
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {parsedLeads.slice(0, 50).map((l, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div>
                      <strong className="text-slate-800 dark:text-white">{l.company_name}</strong>
                      <span className="text-slate-400 ml-2">({l.city} &bull; {l.industry})</span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{l.email}</span>
                  </div>
                ))}
                {parsedLeads.length > 50 && (
                  <div className="p-2 text-center text-xs text-slate-400">
                    + încă {parsedLeads.length - 50} lead-uri
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Fiecare lead va primi automat pitch-ul profesional adaptat nișei sale.
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={loading || parsedLeads.length === 0}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
              <span className="whitespace-nowrap">
                {loading ? 'Se importă...' : `Importă ${parsedLeads.length} Lead-uri`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
