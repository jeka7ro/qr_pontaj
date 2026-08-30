import React, { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, Clock, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function BillingModule({ tenant, themeColor }) {
  const [invoices, setInvoices] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination & Search State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [planRes, invRes] = await Promise.all([
          fetch(`/api/tenants/${tenant.id}/billing/plan`),
          fetch(`/api/tenants/${tenant.id}/billing/invoices`)
        ]);
        if (planRes.ok) setPlan(await planRes.json());
        if (invRes.ok) setInvoices(await invRes.json());
      } catch (err) {
        console.error(err);
        setErrorMsg('A apărut o eroare la încărcarea datelor.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant.id]);

  // Filtering & Pagination Logic
  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true;
    const s = search.toLowerCase();
    const invId = inv.id.toString().padStart(4, '0');
    return invId.includes(s) || inv.status?.toLowerCase().includes(s) || inv.amount?.toString().includes(s);
  });

  const total = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [total, rowsPerPage, page, safePage]);

  const currentRows = filteredInvoices.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="text-primary-500" size={24} />
            Abonament & Facturi
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Gestionează planul curent și descarcă facturile fiscale.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-bold text-red-800">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Plan Summary Column */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative self-start">
          <div className="h-2 w-full absolute top-0" style={{ backgroundColor: themeColor }}></div>
          <div className="p-6">
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs mb-4 uppercase tracking-wider">Planul tău curent</h3>
            {loading ? (
              <div className="animate-pulse h-20 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            ) : plan ? (
              <>
                <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{plan.plan_name}</div>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-xl font-bold text-slate-800 dark:text-white">{plan.price}</span>
                  <span className="text-xs font-semibold text-slate-500 pb-1">{plan.currency} / lună</span>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Angajați</span>
                    <span className="font-bold text-slate-900 dark:text-white">{plan.employees_limit} max</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Următoarea plată</span>
                    <span className="font-bold text-slate-900 dark:text-white">{new Date(plan.renewal_date).toLocaleDateString('ro-RO')}</span>
                  </div>
                </div>

                <button 
                  className="w-full py-2.5 rounded-full font-bold text-sm transition-opacity hover:opacity-90 text-white shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  Modifică Plan
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Plan nedisponibil.</p>
            )}
          </div>
        </div>

        {/* Invoice Table Container */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          
          {/* Search Bar Top */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white mr-4 whitespace-nowrap">Istoric Facturi</h3>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input
                type="text"
                className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                style={{ paddingLeft: 36, paddingRight: search ? 80 : 16, borderRadius: 9999 }}
                placeholder="Caută facturi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', backgroundColor: themeColor, color: 'white', borderRadius: 9999, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {total} rez
                </div>
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 text-center">Nr.</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Factură</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scadență</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Valoare</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-24">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan="6" className="py-8 text-center text-slate-400 font-medium">Se încarcă facturile...</td></tr>
                ) : currentRows.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/50">Nu există facturi emise încă.</td></tr>
                ) : (
                  currentRows.map((invoice, index) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                        {(safePage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white text-sm">
                        INV-{invoice.id.toString().padStart(4, '0')}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {new Date(invoice.due_date).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="py-3 px-4 text-sm font-black text-slate-900 dark:text-white text-right">
                        {invoice.amount} RON
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider
                          ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}
                        >
                          {invoice.status === 'PAID' ? 'Achitată' : 'Neplătită'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors inline-flex">
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Paginare */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }} className="dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="text-sm font-medium text-slate-500 dark:text-slate-400">
              <span style={{ whiteSpace: 'nowrap' }} className="flex items-center gap-2">
                Afișează
                <select 
                  value={rowsPerPage} 
                  onChange={e => setRowsPerPage(Number(e.target.value))} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary-500 transition-shadow"
                  style={{ borderRadius: 9999, padding: '2px 8px' }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={9999}>Toți</option>
                </select>
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>Total: <strong className="text-slate-700 dark:text-white">{total}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="text-sm font-medium text-slate-500 dark:text-slate-400">
              <span style={{ whiteSpace: 'nowrap' }}>Pagina {page} din {totalPages}</span>
              <button 
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                onClick={() => setPage(p => p - 1)} 
                disabled={page === 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                onClick={() => setPage(p => p + 1)} 
                disabled={page === totalPages}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
