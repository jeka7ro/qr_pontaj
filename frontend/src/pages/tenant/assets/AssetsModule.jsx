import React, { useState, useEffect } from 'react';
import { Drill, Plus, Trash2, KeyRound } from 'lucide-react';
import ConfirmModal from '../../../components/ConfirmModal';

export default function AssetsModule({ tenant, themeColor }) {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', serial_number: '', assigned_to: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, astRes] = await Promise.all([
        fetch(`/api/tenants/${tenant.id}/employees`),
        fetch(`/api/tenants/${tenant.id}/assets`)
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (astRes.ok) setAssets(await astRes.json());
    } catch (err) {
      console.error(err);
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
      const res = await fetch(`/api/tenants/${tenant.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
        setFormData({ name: '', serial_number: '', assigned_to: '' });
      } else {
        console.error('Eroare la salvare');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (assetId, employeeId) => {
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/assets/${assetId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: employeeId })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if(!assetToDelete) return;
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/assets/${assetToDelete}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Drill className="text-slate-400" size={24} />
            Gestiune Echipamente
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Inventariază sculele, utilajele sau telefoanele de muncă și alocă-le angajaților.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor }}
        >
          <Plus size={18} /> Adaugă Echipament
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Se încarcă echipamentele...</div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Inventarul este gol.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Denumire / Serie</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Status</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700">Alocare Curentă</th>
                  <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-700 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <KeyRound size={16} className="text-slate-400" /> {asset.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-1">SN: {asset.serial_number || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        asset.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {asset.status === 'AVAILABLE' ? 'DISPONIBIL' : 'ÎN FOLOSINȚĂ'}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1 focus:outline-none dark:text-white"
                        value={asset.assigned_to || ''}
                        onChange={(e) => handleAssign(asset.id, e.target.value)}
                      >
                        <option value="">-- Nelocat --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setAssetToDelete(asset.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        title="Șterge echipament"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Adaugă Echipament</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Denumire (ex: Bormașină Bosch)</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Număr Serial / Cod Inventar</label>
                <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full px-3 py-2 border rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Alocă direct la (Opțional)</label>
                <select 
                  value={formData.assigned_to} 
                  onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                  className="w-full px-3 py-2 border rounded-full dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="">- Nu aloca -</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 px-5 text-sm flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold">Anulează</button>
                <button type="submit" className="flex-1 py-2 text-white rounded-full font-bold" style={{ backgroundColor: themeColor }}>Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={confirmDelete}
        title="Ștergere Echipament"
        message="Sigur doriți să ștergeți acest echipament?"
      />
    </div>
  );
}
