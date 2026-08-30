import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, UserPlus, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RevisalModule({ tenant, themeColor }) {
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination & Search State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    employee_id: '',
    salary: '',
    cor_code: '',
    hire_date: new Date().toISOString().split('T')[0],
    contract_number: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, contRes] = await Promise.all([
        fetch(`/api/tenants/${tenant.id}/employees`),
        fetch(`/api/tenants/${tenant.id}/revisal`)
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (contRes.ok) setContracts(await contRes.json());
    } catch (err) {
      console.error(err);
      setErrorMsg('A apărut o eroare la încărcarea datelor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/revisal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setErrorMsg('Eroare la salvarea contractului.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Eroare de rețea la salvare.');
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    const url = `/api/tenants/${tenant.id}/revisal/export`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `revisal_export.xml`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    setTimeout(() => setDownloading(false), 1000);
  };

  // Filtering & Pagination Logic
  const filteredContracts = contracts.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.employee_name?.toLowerCase().includes(s) ||
      c.cnp?.includes(s) ||
      c.cor_code?.includes(s) ||
      c.contract_number?.toLowerCase().includes(s)
    );
  });

  const total = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [total, rowsPerPage, page, safePage]);

  const currentRows = filteredContracts.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="text-primary-500" size={24} />
            Integrare REVISAL (XML)
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Gestionează contractele de muncă și generează XML-ul oficial pentru Inspecția Muncii.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-10 px-5 text-sm flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-sm transition-colors"
          >
            <UserPlus size={18} /> Adaugă Contract
          </button>
          
          <button 
            onClick={handleDownload}
            disabled={downloading || contracts.length === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            <Download size={18} /> {downloading ? 'Se generează...' : 'Descarcă XML Revisal'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-bold text-red-800">{errorMsg}</p>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Search Bar Top */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white mr-4 whitespace-nowrap">Contracte Active</h3>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
            <input
              type="text"
              className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              style={{ paddingLeft: 36, paddingRight: search ? 80 : 16, borderRadius: 9999 }}
              placeholder="Caută contract/angajat..."
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
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Angajat & CNP</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contract</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Salariu Brut</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Angajării</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Cod COR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400 font-medium">Se încarcă contractele...</td></tr>
              ) : currentRows.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/50">Nu există contracte înregistrate (sau care să corespundă căutării).</td></tr>
              ) : (
                currentRows.map((contract, index) => (
                  <tr key={contract.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                      {(safePage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-white text-sm">{contract.employee_name}</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{contract.cnp}</div>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      Nr. {contract.contract_number || contract.id}
                    </td>
                    <td className="py-3 px-4 text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {contract.salary} RON
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {new Date(contract.hire_date).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono font-medium text-slate-500 dark:text-slate-400 text-right">
                      {contract.cor_code}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Înregistrare Contract Nou</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Angajat (CNP)</label>
                <select 
                  required 
                  value={formData.employee_id} 
                  onChange={e => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                >
                  <option value="">- Alege Angajat -</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.cnp})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Salariu de bază</label>
                  <input type="number" required value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="ex. 3500" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Cod COR</label>
                  <input type="text" required value={formData.cor_code} onChange={e => setFormData({...formData, cor_code: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="ex. 123456" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Nr. Contract</label>
                  <input type="text" value={formData.contract_number} onChange={e => setFormData({...formData, contract_number: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="ex. 1/2023" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Data Început</label>
                  <input type="date" required value={formData.hire_date} onChange={e => setFormData({...formData, hire_date: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 px-5 text-sm flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Anulează</button>
                <button type="submit" className="flex-1 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: themeColor }}>Salvează Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
