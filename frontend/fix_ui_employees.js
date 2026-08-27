const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeesList.jsx', 'utf8');

// 1. Hide main button when modal open
content = content.replace(
  /<button\s*\n\s*onClick=\{([^}]+)\}\s*\n\s*className="px-5 h-10 rounded-lg text-white font-bold shadow-sm transition-all flex items-center gap-2"/g,
  `{!showAddModal && (<button 
          onClick={$1}
          className="px-5 h-10 rounded-lg text-white font-bold shadow-sm transition-all flex items-center gap-2"`
);
// close the conditional rendering of the button
content = content.replace(
  /Adaugă Angajat\s*\n\s*<\/button>/g,
  `Adaugă Angajat\n        </button>)}`
);

// 2. Fix Nr. Header
content = content.replace(
  /<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider" style={{ width: 60, textAlign: 'center' }}>Nr\.<\/th>/g,
  `<th style={{ width: 50, textAlign: 'center' }} className="py-3 font-bold text-xs tracking-wider text-slate-500">Nr.</th>`
);
content = content.replace(
  /<td className="px-6 py-4 text-center text-sm font-bold text-slate-400">/g,
  `<td style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>`
);

// 3. Fix Footer Paginare
const footerRegex = /\{\/\* FOOTER PAGINARE \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>/s;
const newFooter = `{/* FOOTER PAGINARE */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                  Afișează&nbsp;
                  <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 9999, padding: '2px 8px', outline: 'none' }}>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={9999}>Toți</option>
                  </select>
                </span>
                <span style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#64748b' }}>Total înregistrări: <strong className="text-slate-800">{total}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Pagina {safePage} din {totalPages || 1}</span>
                <button className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={16} /></button>
                <button className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}><ChevronRight size={16} /></button>
              </div>
            </div>`;
content = content.replace(footerRegex, newFooter);

fs.writeFileSync('src/components/EmployeesList.jsx', content);
