import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

export default function CreateTenantModal({ onClose, onTenantCreated, editTenant = null }) {
  const [formData, setFormData] = useState({
    nume_locatie: '',
    tip_modul: 'Restaurant / HORECA',
    logo_url: '',
    favicon_url: '',
    culoare_tema: '#2563EB',
    email_admin: '',
    parola_initiala: '',
    distanta_gps: '100',
    mod_qr: 'STATIC'
  });
  
  useEffect(() => {
    if (editTenant) {
      setFormData({
        nume_locatie: editTenant.nume || '',
        tip_modul: editTenant.tip_modul || 'Restaurant / HORECA',
        logo_url: editTenant.logo_url || '',
        favicon_url: editTenant.favicon_url || '',
        culoare_tema: editTenant.culoare || '#2563EB',
        email_admin: '', // Nu e folosit la editare
        parola_initiala: '',
        distanta_gps: editTenant.raza_gps?.toString() || '100',
        mod_qr: editTenant.mod_qr || 'STATIC'
      });
    }
  }, [editTenant]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editTenant 
        ? `http://localhost:5001/api/tenants/${editTenant.id}` 
        : 'http://localhost:5001/api/tenants';
      const method = editTenant ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'A apărut o eroare la crearea tenantului.');
      }

      if (onTenantCreated) {
        onTenantCreated();
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {editTenant ? 'Editează Tenant' : 'Creează Tenant Nou'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          )}

          <form id="create-tenant-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">1. Detalii Generale</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nume Locație *</label>
                  <input 
                    type="text" 
                    name="nume_locatie"
                    value={formData.nume_locatie}
                    onChange={handleChange}
                    required
                    className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm" 
                    placeholder="ex: La Trattoria" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Tip Modul</label>
                  <select 
                    name="tip_modul"
                    value={formData.tip_modul}
                    onChange={handleChange}
                    className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm"
                  >
                    <option value="Restaurant / HORECA">Restaurant / HORECA</option>
                    <option value="Șantier / Construcții">Șantier / Construcții</option>
                    <option value="Sală de Sport / Fitness">Sală de Sport / Fitness</option>
                    <option value="Birou / Corporate">Birou / Corporate</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">2. Branding (White-Label)</h4>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Logo Section */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Logo Companie</label>
                  <div className="flex flex-col space-y-2">
                    <input 
                      type="text" 
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      placeholder="Adresa Web (URL)..." 
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm" 
                    />
                    <div className="relative flex items-center justify-center text-sm text-slate-500">
                      <span className="bg-white px-2">SAU</span>
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-100"></div>
                      </div>
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-3 text-center hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center justify-center h-24 overflow-hidden relative">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <>
                          <Upload size={16} className="text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500">Încarcă Fișier (Max 2MB)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Favicon & Color Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Culoare Temă (Hex)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="color" 
                        name="culoare_tema"
                        value={formData.culoare_tema}
                        onChange={handleChange}
                        className="h-10 w-10 rounded-full border border-slate-200 cursor-pointer p-0.5 shadow-sm" 
                      />
                      <input 
                        type="text" 
                        name="culoare_tema"
                        value={formData.culoare_tema}
                        onChange={handleChange}
                        className="flex-1 px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Favicon</label>
                    <div className="flex flex-col space-y-2">
                      <input 
                        type="text" 
                        name="favicon_url"
                        value={formData.favicon_url}
                        onChange={handleChange}
                        placeholder="Adresa Web (URL)..." 
                        className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm" 
                      />
                      <input type="file" className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!editTenant && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">3. Cont Admin Local</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Administrator *</label>
                    <input 
                      type="email" 
                      name="email_admin"
                      value={formData.email_admin}
                      onChange={handleChange}
                      required
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm" 
                      placeholder="admin@locatie.ro" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Parolă Inițială *</label>
                    <input 
                      type="password" 
                      name="parola_initiala"
                      value={formData.parola_initiala}
                      onChange={handleChange}
                      required
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">4. Setări GPS & QR</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Distanță GPS (metri)</label>
                  <select 
                    name="distanta_gps"
                    value={formData.distanta_gps}
                    onChange={handleChange}
                    className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm"
                  >
                    <option value="50">50m (Strict)</option>
                    <option value="100">100m (Standard)</option>
                    <option value="200">200m (Relaxat)</option>
                    <option value="500">500m (Extins)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Mod Generare QR</label>
                  <select 
                    name="mod_qr"
                    value={formData.mod_qr}
                    onChange={handleChange}
                    className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm"
                  >
                    <option value="STATIC">Static (Tipărit)</option>
                    <option value="DYNAMIC">Dinamic (Pe Tabletă)</option>
                  </select>
                </div>
              </div>
            </div>

            {editTenant && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">5. Link-uri Rapide</h4>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-1">Link Panou Manager Locație</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/login`} 
                        className="flex-1 px-3 h-9 text-xs rounded-full border border-slate-200 bg-white outline-none text-slate-600 font-mono" 
                      />
                      <a 
                        href={`${window.location.origin}/login`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-4 h-9 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-bold flex items-center transition-colors"
                      >
                        Deschide
                      </a>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-700 mb-1">Aplicație Scanare Angajați (URL Cod QR)</p>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={`${window.location.origin}/s/${editTenant.id}`} className="flex-1 px-3 h-9 text-xs rounded-full border border-slate-200 bg-white outline-none text-slate-600 font-mono" />
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${editTenant.id}`)}
                        className="px-4 h-9 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-bold flex items-center transition-colors"
                      >
                        Copiază
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose} 
            className="px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors"
          >
            Anulează
          </button>
          <button 
            type="submit"
            form="create-tenant-form"
            disabled={loading}
            className="px-5 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Se salvează...' : (editTenant ? 'Salvează Modificările' : 'Salvează și Creează')}
          </button>
        </div>
      </div>
    </div>
  );
}
