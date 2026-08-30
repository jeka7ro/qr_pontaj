import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { CalendarDays, CheckCircle, XCircle, Plus, Clock, Search, ChevronLeft, ChevronRight, AlertCircle , Download} from 'lucide-react';

export default function LeavesModule({ tenant, themeColor }) {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  const [periodFilter, setPeriodFilter] = useState('all');

  const handlePeriodChange = (e) => {
    const val = e.target.value;
    setPeriodFilter(val);
    
    if (val === 'all') {
      setFilterStart('');
      setFilterEnd('');
      return;
    }
    
    const now = new Date();
    let start, end;
    
    switch (val) {
      case 'today':
        start = end = formatDate(new Date());
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = formatDate(yesterday);
        break;
      case 'this_week':
        const day = now.getDay() || 7; 
        const monday = new Date(now);
        monday.setDate(monday.getDate() - day + 1);
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        start = formatDate(monday);
        end = formatDate(sunday);
        break;
      case 'this_month':
        start = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
        end = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        break;
      case 'last_month':
        start = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        end = formatDate(new Date(now.getFullYear(), now.getMonth(), 0));
        break;
      default:
        start = ''; end = '';
    }
    setFilterStart(start);
    setFilterEnd(end);
  };

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: getTodayString(),
    end_date: getTomorrowString(),
    leave_type: 'CO',
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, leavesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/employees`),
        fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/leaves`)
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (leavesRes.ok) setLeaves(await leavesRes.json());
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ employee_id: '', start_date: getTodayString(), end_date: getTomorrowString(), leave_type: 'CO', reason: '' });
        fetchData();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Eroare la salvare');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Eroare de conexiune la salvare.');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/leaves/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination & Filtering Logic
  const filteredLeaves = leaves.filter(leave => {
    let matches = true;
    if (search) {
      const s = search.toLowerCase();
      matches = matches && (
        leave.employee_name?.toLowerCase().includes(s) ||
        leave.leave_type?.toLowerCase().includes(s) ||
        leave.status?.toLowerCase().includes(s)
      );
    }
    if (filterStart) {
      matches = matches && (new Date(leave.start_date) >= new Date(filterStart));
    }
    if (filterEnd) {
      matches = matches && (new Date(leave.end_date) <= new Date(filterEnd));
    }
    return matches;
  });

  const handleExport = () => {
    let csv = "ID,Nume Angajat,Tip Concediu,De La,Pana La,Status\n";
    filteredLeaves.forEach(l => {
      const type = l.leave_type === 'CO' ? 'Odihna (CO)' : l.leave_type === 'CM' ? 'Medical (CM)' : 'Invoire';
      const status = l.status === 'PENDING' ? 'In Asteptare' : l.status === 'APPROVED' ? 'Aprobat' : 'Respins';
      csv += `${l.id},"${l.employee_name || ''}",${type},${new Date(l.start_date).toLocaleDateString('ro-RO')},${new Date(l.end_date).toLocaleDateString('ro-RO')},${status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Concedii_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const total = filteredLeaves.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [total, rowsPerPage, page, safePage]);

  const currentRows = filteredLeaves.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header & KPI */}
      {!isModalOpen && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="text-primary-500" size={24} />
              Zile Libere (CO/CM)
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Gestionează concediile de odihnă și medicale ale angajaților.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 h-10 px-5 text-sm flex items-center justify-center text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={18} /> Adaugă Concediu
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-bold text-red-800">{errorMsg}</p>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Search Bar Top */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div style={{ position: 'relative' }} className="w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input
                type="text"
                className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all rounded-lg"
                style={{ paddingLeft: 40, paddingRight: search ? 80 : 16 }}
                placeholder="Caută cereri..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', backgroundColor: themeColor, color: 'white', borderRadius: 9999, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {filteredLeaves.length} / {total}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input 
                type="date" 
                value={filterStart}
                onChange={e => setFilterStart(e.target.value)}
                className="w-full md:w-auto h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <span className="text-slate-400 font-medium text-sm">-</span>
              <input 
                type="date" 
                value={filterEnd}
                onChange={e => setFilterEnd(e.target.value)}
                className="w-full md:w-auto h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 h-10 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-sm w-full md:w-auto justify-center whitespace-nowrap"
          >
            <Download size={16} /> Exportă
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 text-center">Nr. Crt.</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Angajat</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tip Concediu</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perioada</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400 font-medium">Se încarcă datele...</td></tr>
              ) : currentRows.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/50">Nu s-a găsit nicio cerere.</td></tr>
              ) : (
                currentRows.map((leave, index) => (
                  <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                      {(safePage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {leave.avatar_path ? (
                          <img src={`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${leave.avatar_path}`} className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700" alt="avatar" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {leave.employee_name?.[0] || 'U'}
                          </div>
                        )}
                        <span className="font-bold text-slate-800 dark:text-white text-sm">{leave.employee_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {leave.leave_type === 'CO' ? 'Odihnă (CO)' : leave.leave_type === 'CM' ? 'Medical (CM)' : 'Învoire'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(leave.start_date).toLocaleDateString('ro-RO')} - {new Date(leave.end_date).toLocaleDateString('ro-RO')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {leave.status === 'PENDING' && <span className="text-sm font-bold text-amber-600 dark:text-amber-500">În Așteptare</span>}
                      {leave.status === 'APPROVED' && <span className="text-sm font-bold text-green-600 dark:text-green-500">Aprobat</span>}
                      {leave.status === 'REJECTED' && <span className="text-sm font-bold text-slate-400 dark:text-slate-500 line-through">Respins</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {leave.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => updateStatus(leave.id, 'APPROVED')}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors"
                            title="Aprobă"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            onClick={() => updateStatus(leave.id, 'REJECTED')}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                            title="Respinge"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Procesat</span>
                      )}
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
            <span style={{ whiteSpace: 'nowrap' }}>Total înregistrări: <strong className="text-slate-700 dark:text-white">{filteredLeaves.length}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="text-sm font-medium text-slate-500 dark:text-slate-400">
            <span style={{ whiteSpace: 'nowrap' }}>Pagina {page} din {totalPages}</span>
            <button 
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
              onClick={() => setPage(p => p - 1)} 
              disabled={page === 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
              onClick={() => setPage(p => p + 1)} 
              disabled={page === totalPages}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Adăugare Cerere Manuală */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-transparent dark:border-slate-700">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6">Adaugă Concediu Nou</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Angajat</label>
                
                <div 
                  className="relative"
                  tabIndex={-1}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setShowEmpDropdown(false);
                    }
                  }}
                >
                  <div 
                    className="w-full px-4 h-10 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white text-sm font-medium flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-primary-500"
                    onClick={() => setShowEmpDropdown(!showEmpDropdown)}
                  >
                    <span className={formData.employee_id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                      {formData.employee_id 
                        ? employees.find(e => e.id == formData.employee_id)?.first_name + ' ' + employees.find(e => e.id == formData.employee_id)?.last_name 
                        : '- Caută Angajat -'}
                    </span>
                    <Search size={16} className="text-slate-400" />
                  </div>

                  {showEmpDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Caută nume sau prenume..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary-500 text-slate-900 dark:text-white"
                          value={empSearch}
                          onChange={e => setEmpSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {employees
                          .filter(e => (e.first_name + ' ' + e.last_name).toLowerCase().includes(empSearch.toLowerCase()))
                          .map(e => (
                            <div
                              key={e.id}
                              className={`px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${formData.employee_id == e.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                              onClick={() => {
                                setFormData({...formData, employee_id: e.id});
                                setShowEmpDropdown(false);
                                setEmpSearch('');
                              }}
                            >
                              {e.first_name} {e.last_name}
                            </div>
                        ))}
                        {employees.filter(e => (e.first_name + ' ' + e.last_name).toLowerCase().includes(empSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-sm text-slate-400 text-center">Nu am găsit niciun angajat</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">De la</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.start_date} 
                    onChange={e => setFormData({...formData, start_date: e.target.value})} 
                    className="w-full px-4 h-10 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Până la</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.end_date} 
                    onChange={e => setFormData({...formData, end_date: e.target.value})} 
                    className="w-full px-4 h-10 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tip Concediu</label>
                <select 
                  required
                  value={formData.leave_type} 
                  onChange={e => setFormData({...formData, leave_type: e.target.value})}
                  className="w-full px-4 h-10 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="CO">Concediu de Odihnă (CO)</option>
                  <option value="CM">Concediu Medical (CM)</option>
                  <option value="INVOIRE">Învoire</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Motiv / Observații (Opțional)</label>
                <textarea 
                  value={formData.reason} 
                  placeholder="Aplicația medicală, concediu fără plată etc."
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-2xl dark:bg-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 px-5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-colors">
                  Anulează
                </button>
                <button type="submit" className="flex-1 h-10 px-5 text-sm flex items-center justify-center text-white rounded-lg font-bold shadow-md hover:opacity-90 transition-opacity" style={{ backgroundColor: themeColor }}>
                  Salvează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
