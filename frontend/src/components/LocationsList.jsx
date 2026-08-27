import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

export default function LocationsList({ tenant, themeColor }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Table State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, [tenant.id]);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/locations`);
      if (!res.ok) throw new Error('Eroare la preluarea locațiilor');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => 
      loc.name.toLowerCase().includes(search.toLowerCase()) || 
      (loc.address && loc.address.toLowerCase().includes(search.toLowerCase()))
    );
  }, [locations, search]);

  const total = filteredLocations.length;
  const totalPages = rowsPerPage === 9999 ? 1 : Math.ceil(total / rowsPerPage);
  const currentData = rowsPerPage === 9999 ? filteredLocations : filteredLocations.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Reset page if search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.name) {
      setFormError('Numele locației este obligatoriu.');
      return;
    }

    try {
      const url = editingId 
        ? `http://localhost:5001/api/tenants/${tenant.id}/locations/${editingId}`
        : `http://localhost:5001/api/tenants/${tenant.id}/locations`;
        
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'A apărut o eroare.');
      }

      await fetchLocations();
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ name: '', address: '' });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/locations/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Nu s-a putut șterge locația.');
      await fetchLocations();
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <MapPin className="text-primary-500" size={24} /> Puncte de Lucru
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Gestionează locațiile și adresele pentru pontaj.</p>
        </div>
        
        {!showAddForm && (
          <button 
            onClick={() => { setShowAddForm(true); setFormData({ name: '', address: '' }); }}
            className="flex items-center gap-2 px-6 h-12 rounded-full text-white font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={20} />
            Adaugă Locație
        </button>)}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold text-red-800">Eroare</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Formular Adăugare/Editare */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editingId ? 'Editare Locație' : 'Locație Nouă'}</h2>
            <button 
              onClick={() => { setShowAddForm(false); setEditingId(null); setFormError(null); }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            {formError && <div className="mb-4 text-sm text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100">{formError}</div>}
            <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nume Locație *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sediu Central"
                  className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Adresă (opțional)</label>
                <input
                  type="text"
                  placeholder="Ex: Str. Lalelelor Nr. 12"
                  className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setEditingId(null); setFormError(null); }}
                  className="px-6 py-3 rounded-full font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full font-bold text-white shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
                  style={{ backgroundColor: themeColor }}
                >
                  {editingId ? 'Salvează Modificările' : 'Adaugă Locație'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* SEARCH BAR (Regula 1 - SmartDevize) */}
      <div className="mb-4">
        <div style={{ position: 'relative' }} className="w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
          <input
            className="w-full h-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium"
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
      </div>

      {/* Tabel cu Reguli SmartDevize */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        
        {/* Search Bar + Header Informațional */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
          <div className="font-bold text-slate-700 dark:text-white">Total: {total} înregistrări</div>
          </div>

        {/* Tabelul - vizibil mereu */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                <th style={{ width: 50, textAlign: 'center' }} className="py-3 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Nr.</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Nume Punct de Lucru</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Adresă</th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {currentData.length > 0 ? (
                currentData.map((loc, index) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="text-center text-slate-500 dark:text-slate-400 text-[13px]">
                      {(page - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-white">{loc.name}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                      {loc.address || <span className="text-slate-400 dark:text-slate-500 italic">Nespecificat</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {deleteConfirmId === loc.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-bold text-red-600">Sigur?</span>
                          <button onClick={() => handleDelete(loc.id)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-colors">Da</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full hover:bg-slate-300 transition-colors">Nu</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { 
                              setEditingId(loc.id); 
                              setFormData({ name: loc.name, address: loc.address || '' });
                              setShowAddForm(true); 
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-colors"
                            title="Editează"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(loc.id)}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            title="Șterge"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                    <MapPin className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium">Nu am găsit nicio locație.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINARE (Regula 3 - SmartDevize) */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <div className="flex items-center gap-4">
            <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400 font-bold">
              Afișează&nbsp;
              <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full px-2 py-0.5 outline-none dark:text-white">
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={9999}>Toți</option>
              </select>
            </span>
            <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400">Total înregistrări: <strong className="text-slate-800 dark:text-white">{total}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400 font-bold mr-2">Pagina {page} din {totalPages || 1}</span>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
