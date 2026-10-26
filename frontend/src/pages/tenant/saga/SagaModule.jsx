import React, { useState } from 'react';
import { FileSpreadsheet, Download, AlertCircle, Clock, CalendarDays } from 'lucide-react';

export default function SagaModule({ tenant }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [exportType, setExportType] = useState('events'); // 'events' | 'summary'
  const [separator, setSeparator] = useState(',');
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    const filename = exportType === 'summary' 
      ? `saga_centralizator_salarii_${month}_${year}.csv`
      : `export_saga_pontaj_${month}_${year}.csv`;

    const url = `/api/tenants/${tenant.id}/saga/export?month=${month}&year=${year}&type=${exportType}&separator=${encodeURIComponent(separator)}`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-500 shrink-0" size={24} />
            Export Contabilitate & Salarii (SAGA C)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fișiere 100% conforme cu modulul Salarii din SAGA Software și centralizator lunar de pontaj în format Excel/CSV.
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-10">
        
        {/* Selector Tip Export */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Alegeți formatul de export
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExportType('events')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExportType('events')}
              className={`p-5 rounded-2xl text-left border-2 transition-all cursor-pointer whitespace-normal ${
                exportType === 'events'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className={`shrink-0 ${exportType === 'events' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} size={20} />
                <span className="font-bold text-base whitespace-nowrap">Pontaj Electronic SAGA</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-normal break-words">
                Log detaliat al fiecărei scanări (Marcă, CNP, Dată, Oră, Sens intrare/ieșire). Format standard pentru importul de ceasuri/aparate de pontaj în SAGA C.
              </p>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setExportType('summary')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExportType('summary')}
              className={`p-5 rounded-2xl text-left border-2 transition-all cursor-pointer whitespace-normal ${
                exportType === 'summary'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className={`shrink-0 ${exportType === 'summary' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} size={20} />
                <span className="font-bold text-base whitespace-nowrap">Centralizator Lunar Salarii</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-normal break-words">
                Centralizator per angajat: Zile lucrate, Ore normale, Ore noapte (22:00-06:00), Ore weekend și Ore suplimentare. Gata pentru calculul statului de plată.
              </p>
            </div>
          </div>
        </div>

        {/* Perioadă și Delimitator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Luna
            </label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-medium focus:outline-none dark:text-white text-sm"
            >
              <option value="1">01 - Ianuarie</option>
              <option value="2">02 - Februarie</option>
              <option value="3">03 - Martie</option>
              <option value="4">04 - Aprilie</option>
              <option value="5">05 - Mai</option>
              <option value="6">06 - Iunie</option>
              <option value="7">07 - Iulie</option>
              <option value="8">08 - August</option>
              <option value="9">09 - Septembrie</option>
              <option value="10">10 - Octombrie</option>
              <option value="11">11 - Noiembrie</option>
              <option value="12">12 - Decembrie</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Anul
            </label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-medium focus:outline-none dark:text-white text-sm"
            >
              {[0, 1, 2].map(offset => {
                const y = new Date().getFullYear() - offset;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Separator CSV
            </label>
            <select
              value={separator}
              onChange={e => setSeparator(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-medium focus:outline-none dark:text-white text-sm"
            >
              <option value=",">Virgulă ( , ) — Standard SAGA / Google Sheets</option>
              <option value=";">Punct și virgulă ( ; ) — Excel România / Windows</option>
            </select>
          </div>
        </div>

        {/* Buton Export */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            Include codificare UTF-8 BOM compatibilă nativ cu Excel și diacritice românești.
          </div>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download size={18} className="shrink-0" />
            <span className="whitespace-nowrap">{loading ? 'Se generează...' : 'Descarcă Fișier SAGA CSV'}</span>
          </button>
        </div>

        {/* Info box instrucțiuni */}
        <div className="mt-8 flex items-start gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-300 rounded-2xl text-left text-xs leading-relaxed">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <strong className="block font-semibold mb-1">Ghid de import în SAGA C:</strong>
            Pentru pontajul electronic, deschideți SAGA C la meniul <em>Diverse &rarr; Import date din fișiere</em> (sau <em>Import din aparate de pontaj</em>) și selectați fișierul descărcat. Pentru centralizatorul de ore, coloanele pot fi introduse direct în modulul <em>State de salarii</em>.
          </div>
        </div>

      </div>
    </div>
  );
}
