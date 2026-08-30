import React, { useState } from 'react';
import { FileSpreadsheet, Download, AlertCircle } from 'lucide-react';

export default function SagaModule({ tenant, themeColor }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    // Download directly via window.location or fetch + blob
    const url = `/api/tenants/${tenant.id}/saga/export?month=${month}&year=${year}`;
    
    // Create an invisible link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `export_saga_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="text-slate-400" size={24} />
            Export Conta (SAGA C)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Descarcă formatul compatibil pentru importul automat în softul de contabilitate.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-10 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
          <FileSpreadsheet size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Generează Fișier SAGA</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full max-w-sm">
          <div className="w-full">
            <label className="block text-left text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Luna</label>
            <select 
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-medium focus:outline-none dark:text-white"
            >
              <option value="1">Ianuarie</option>
              <option value="2">Februarie</option>
              <option value="3">Martie</option>
              <option value="4">Aprilie</option>
              <option value="5">Mai</option>
              <option value="6">Iunie</option>
              <option value="7">Iulie</option>
              <option value="8">August</option>
              <option value="9">Septembrie</option>
              <option value="10">Octombrie</option>
              <option value="11">Noiembrie</option>
              <option value="12">Decembrie</option>
            </select>
          </div>
          <div className="w-full">
            <label className="block text-left text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Anul</label>
            <select 
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full font-medium focus:outline-none dark:text-white"
            >
              {[0, 1, 2].map(offset => {
                const y = new Date().getFullYear() - offset;
                return <option key={y} value={y}>{y}</option>
              })}
            </select>
          </div>
        </div>

        <button 
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Download size={20} />
          {loading ? 'Se generează...' : 'Descarcă CSV SAGA'}
        </button>
        
        <div className="mt-8 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-left text-sm">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p>
            Fișierul descărcat conține coloanele standard cerute de SAGA C. În SAGA, folosește opțiunea "Import Fișier" din modulul de Salariați / Pontaj.
          </p>
        </div>
      </div>
    </div>
  );
}
