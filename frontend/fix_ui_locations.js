const fs = require('fs');
let content = fs.readFileSync('src/components/LocationsList.jsx', 'utf8');

// 1. Hide main button when modal open
content = content.replace(
  /<button \n\s*onClick=\{([^}]+)\}\n\s*className="px-5 h-10 rounded-lg text-white font-bold shadow-sm transition-all flex items-center gap-2"/g,
  `{!showAddForm && (<button 
          onClick={$1}
          className="px-5 h-10 rounded-lg text-white font-bold shadow-sm transition-all flex items-center gap-2"`
);
// close the conditional rendering of the button
content = content.replace(
  /Adaugă Locație\n\s*<\/button>/g,
  `Adaugă Locație\n        </button>)}`
);

// 2. Fix Nr. Header
content = content.replace(
  /<th style=\{\{ width: 50, textAlign: 'center' \}\} className="py-3 font-bold text-xs uppercase tracking-wider text-slate-500">Nr\.<\/th>/g,
  `<th style={{ width: 50, textAlign: 'center' }} className="py-3 font-bold text-xs tracking-wider text-slate-500">Nr.</th>`
);
content = content.replace(
  /<td style=\{\{ textAlign: 'center', color: '#64748b', fontSize: 13, fontWeight: 600 \}\}>/g,
  `<td style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>`
);

// 3. Move Search Bar ABOVE the table
// Let's first extract the search bar code.
const searchBarRegex = /<div style=\{\{ position: 'relative', width: '100%', maxWidth: '300px' \}\}>.*?<\/div>\s*<\/div>/s;
content = content.replace(searchBarRegex, `</div>`); // Remove it from the header

// And put it above the table card
const searchCode = `      {/* SEARCH BAR (Regula 1 - SmartDevize) */}
      <div className="mb-4">
        <div style={{ position: 'relative' }} className="w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
          <input
            className="w-full h-10 border border-slate-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium"
            style={{ paddingLeft: 36, paddingRight: search ? 80 : 16, borderRadius: 9999 }}
            placeholder="Caută..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'var(--primary-600, #dc2626)', color: 'white', borderRadius: 9999, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filteredLocations.length} / {total}
            </div>
          )}
        </div>
      </div>\n\n      {/* Tabel cu Reguli SmartDevize */}`;

content = content.replace(/\{\/\* Tabel cu Reguli SmartDevize \*\/\}/, searchCode);

// 4. Fix Footer Paginare
const footerRegex = /\{\/\* FOOTER PAGINARE \(Regula 3 - SmartDevize\) \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>/s;
const newFooter = `{/* FOOTER PAGINARE (Regula 3 - SmartDevize) */}
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
            <span style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Pagina {page} din {totalPages || 1}</span>
            <button className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
            <button className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent transition-colors" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
          </div>
        </div>`;
content = content.replace(footerRegex, newFooter);

fs.writeFileSync('src/components/LocationsList.jsx', content);
