import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, FolderOpen, MoreVertical, Trash2, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import ConfirmModal from '../../../components/ConfirmModal';

export default function ErpModule({ tenant, themeColor }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Pagination & Search State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({ name: '', budget: '', start_date: '', end_date: '' });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/erp/projects`);
      if (res.ok) setProjects(await res.json());
    } catch (err) {
      console.error(err);
      setErrorMsg('A apărut o eroare la încărcarea datelor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [tenant.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/erp/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchProjects();
        setFormData({ name: '', budget: '', start_date: '', end_date: '' });
      } else {
        setErrorMsg('Eroare la salvarea proiectului.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Eroare de rețea la salvare.');
    }
  };

  const confirmDelete = async () => {
    if(!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/erp/projects/${deleteConfirmId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProjects();
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering & Pagination Logic
  const filteredProjects = projects.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name?.toLowerCase().includes(s) || p.budget?.toString().includes(s);
  });

  const total = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [total, rowsPerPage, page, safePage]);

  const currentRows = filteredProjects.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-primary-500" size={24} />
            ERP: Proiecte & Contracte
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Gestionează centrele de cost și alocă pontajul direct pe proiecte.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor }}
        >
          <Plus size={18} /> Proiect Nou
        </button>
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
          <h3 className="font-bold text-slate-800 dark:text-white mr-4 whitespace-nowrap">Proiecte Active</h3>
          <div style={{ position: 'relative', width: '260px' }}>
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
            <input
              type="text"
              className="w-full h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              style={{ paddingLeft: 36, paddingRight: search ? 80 : 16, borderRadius: 9999 }}
              placeholder="Caută proiecte..."
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
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nume Proiect</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Buget Alocat</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">End</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Pontaje</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-24">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-400 font-medium">Se încarcă proiectele...</td></tr>
              ) : currentRows.length === 0 ? (
                <tr><td colSpan="7" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/50">Nu aveți niciun proiect activ. Creați primul proiect pentru a începe alocarea resurselor.</td></tr>
              ) : (
                currentRows.map((project, index) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                      {(safePage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FolderOpen size={16} />
                        </div>
                        <div className="font-bold text-slate-800 dark:text-white text-sm">{project.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-black text-slate-700 dark:text-slate-300">
                      {project.budget ? `${project.budget} RON` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString('ro-RO') : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('ro-RO') : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{project.timesheet_count} intrări</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => setDeleteConfirmId(project.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors inline-flex opacity-0 group-hover:opacity-100"
                          title="Șterge Proiect"
                        >
                        <Trash2 size={18} />
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Proiect / Contract Nou</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Nume Proiect</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="ex. Construcție Rezidențială" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Buget (Opțional)</label>
                <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" placeholder="ex. 50000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Data Început</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">Data Finalizare</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 px-5 text-sm flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Anulează</button>
                <button type="submit" className="flex-1 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: themeColor }}>Salvează Proiect</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Ștergere Proiect"
        message="Sigur doriți să ștergeți acest proiect? Toate pontajele alocate vor rămâne fără proiect."
      />
    </div>
  );
}
