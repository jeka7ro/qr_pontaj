import React, { useState, useEffect } from 'react';
import { X, Upload, Copy, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { resolveFaviconUrl } from '../utils/favicon';

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
    mod_qr: 'STATIC',
    modules: {
      billing: false,
      leaves: false,
      export_saga: false,
      geofence: false,
      offline: false,
      revisal: false,
      erp: false,
      shifts: false,
      face_recognition: false,
      whatsapp: false,
      assets: false,
      show_upsells: true
    }
  });
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isLogo = field === 'logo_url';
    if (isLogo) setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const formPayload = new FormData();
      formPayload.append('file', file);
      
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/tenants/upload-branding`, {
        method: 'POST',
        body: formPayload
      });
      
      if (!res.ok) throw new Error('Eroare la încărcarea imaginii.');
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, [field]: data.url }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const handleAutoDetectFavicon = () => {
    if (!formData.favicon_url) return;
    const resolved = resolveFaviconUrl(formData.favicon_url);
    if (resolved) {
      setFormData(prev => ({ ...prev, favicon_url: resolved }));
    }
  };

  const resolvedFavicon = resolveFaviconUrl(formData.favicon_url);
  
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
        mod_qr: editTenant.mod_qr || 'STATIC',
        modules: {
          billing: false,
          leaves: false,
          export_saga: false,
          geofence: false,
          offline: false,
          revisal: false,
          erp: false,
          shifts: false,
          face_recognition: false,
          whatsapp: false,
          assets: false,
          show_upsells: true,
          ...(editTenant.modules || {})
        }
      });
    }
  }, [editTenant]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModuleToggle = (moduleName) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleName]: prev.modules[moduleName] ? false : true
      }
    }));
  };

  const handleTrialChange = (moduleName, e) => {
    const val = e.target.value;
    if (val === 'true') {
      setFormData(prev => ({
        ...prev,
        modules: { ...prev.modules, [moduleName]: true }
      }));
    } else if (val && val !== 'custom') {
      const days = parseInt(val, 10);
      const date = new Date();
      date.setDate(date.getDate() + days);
      setFormData(prev => ({
        ...prev,
        modules: { ...prev.modules, [moduleName]: date.toISOString() }
      }));
    }
  };

  const handleSelectAllToggle = (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        billing: isChecked,
        leaves: isChecked,
        export_saga: isChecked,
        geofence: isChecked,
        offline: isChecked,
        revisal: isChecked,
        erp: isChecked,
        shifts: isChecked,
        face_recognition: isChecked,
        whatsapp: isChecked,
        assets: isChecked
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editTenant 
        ? `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${editTenant.id}` 
        : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants`;
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {editTenant ? 'Editează Tenant' : 'Creează Tenant Nou'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          )}

          <form id="create-tenant-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">1. Detalii Generale</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Nume Locație *</label>
                  <input 
                    type="text" 
                    name="nume_locatie"
                    value={formData.nume_locatie}
                    onChange={handleChange}
                    required
                    className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" 
                    placeholder="ex: La Trattoria" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Tip Modul</label>
                  <select 
                    name="tip_modul"
                    value={formData.tip_modul}
                    onChange={handleChange}
                    className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm"
                  >
                    <option value="Restaurant / HORECA">Restaurant / HORECA</option>
                    <option value="Șantier / Construcții">Șantier / Construcții</option>
                    <option value="Sală de Sport / Fitness">Sală de Sport / Fitness</option>
                    <option value="Birou / Corporate">Birou / Corporate</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">2. Branding (White-Label)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Logo Companie</label>
                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                        className="text-[11px] text-red-500 hover:text-red-600 font-semibold"
                      >
                        Elimină
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <input 
                      type="text" 
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleChange}
                      placeholder="Adresa Web (URL)..." 
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" 
                    />
                    <div className="relative flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                      <span className="bg-white dark:bg-slate-900 px-2 text-xs">SAU</span>
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                      </div>
                    </div>
                    <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-col items-center justify-center h-24 overflow-hidden relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'logo_url')} 
                        disabled={uploadingLogo}
                      />
                      {formData.logo_url ? (
                        <img 
                          src={formData.logo_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${formData.logo_url}` : formData.logo_url} 
                          alt="Logo Preview" 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <>
                          <Upload size={16} className="text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {uploadingLogo ? 'Se încarcă...' : 'Încarcă Fișier (Max 2MB)'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Favicon & Color Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Culoare Temă (Hex)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="color" 
                        name="culoare_tema"
                        value={formData.culoare_tema}
                        onChange={handleChange}
                        className="h-10 w-10 rounded-full cursor-pointer shadow-sm border-0" 
                        style={{ 
                          border: `2px solid ${formData.culoare_tema || '#000000'}`, 
                          backgroundColor: 'white', 
                          padding: '3px' 
                        }}
                      />
                      <input 
                        type="text" 
                        name="culoare_tema"
                        value={formData.culoare_tema}
                        onChange={handleChange}
                        className="flex-1 px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Favicon</label>
                      {formData.favicon_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, favicon_url: '' }))}
                          className="text-[11px] text-red-500 hover:text-red-600 font-semibold"
                        >
                          Elimină
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          name="favicon_url"
                          value={formData.favicon_url}
                          onChange={handleChange}
                          placeholder="Ex: https://unda.ro sau link direct icon" 
                          className="flex-1 px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" 
                        />
                        {formData.favicon_url && !formData.favicon_url.match(/\.(ico|png|jpg|jpeg|svg|webp)($|\?)/i) && (
                          <button
                            type="button"
                            onClick={handleAutoDetectFavicon}
                            className="px-3 h-10 text-xs font-bold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shrink-0"
                            title="Transformă domeniul în favicon oficial"
                          >
                            Extrage
                          </button>
                        )}
                      </div>

                      {/* Preview & File Upload */}
                      <div className="flex items-center gap-3 p-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          {resolvedFavicon ? (
                            <img 
                              src={resolvedFavicon} 
                              alt="Favicon" 
                              className="w-7 h-7 object-contain"
                              onError={(e) => { e.target.style.display = 'none'; }} 
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">ICO</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs">
                            <Upload size={13} className="text-slate-500" />
                            <span>{uploadingFavicon ? 'Se încarcă...' : 'Încarcă fișier (.ico, .png)'}</span>
                            <input 
                              type="file" 
                              accept=".ico,.png,.jpg,.jpeg,.svg,.webp" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'favicon_url')} 
                              disabled={uploadingFavicon}
                            />
                          </label>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {resolvedFavicon ? 'Favicon activ și vizibil' : 'Sau alege un fișier local'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!editTenant && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">3. Cont Admin Local</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Email Administrator *</label>
                    <input 
                      type="email" 
                      name="email_admin"
                      value={formData.email_admin}
                      onChange={handleChange}
                      required
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm" 
                      placeholder="admin@locatie.ro" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Parolă Inițială *</label>
                    <input 
                      type="password" 
                      name="parola_initiala"
                      value={formData.parola_initiala}
                      onChange={handleChange}
                      required
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white dark:text-white uppercase tracking-wider">4. Funcționalități / Upsell (Feature Flags)</h4>
                
                {/* Global Upsell Toggle */}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-300 transition-colors">Afișează modulele inactive (cu lăcățel)</span>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.modules?.show_upsells !== false} // Default true
                      onChange={() => handleModuleToggle('show_upsells')}
                    />
                    <div 
                      className="w-9 h-5 bg-slate-200 dark:bg-slate-700 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
                      style={{ backgroundColor: formData.modules?.show_upsells !== false ? '#3B82F6' : undefined }}
                    ></div>
                  </div>
                </label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-4">Activează modulele pe care acest client le-a achiziționat. Dacă nu sunt active (și toggle-ul de sus e pornit), vor vedea un ecran de "Lăcățel" prin care să te contacteze.</p>
              
              <div className="flex justify-end mb-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300 transition-colors">Selectează Toate</span>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      onChange={handleSelectAllToggle}
                      checked={
                        formData.modules?.billing &&
                        formData.modules?.leaves &&
                        formData.modules?.export_saga &&
                        formData.modules?.geofence &&
                        formData.modules?.offline &&
                        formData.modules?.revisal &&
                        formData.modules?.erp &&
                        formData.modules?.shifts &&
                        formData.modules?.face_recognition &&
                        formData.modules?.whatsapp &&
                        formData.modules?.assets
                      }
                    />
                    <div 
                      className="w-11 h-6 bg-slate-200 dark:bg-slate-700 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ backgroundColor: (
                        formData.modules?.billing &&
                        formData.modules?.leaves &&
                        formData.modules?.export_saga &&
                        formData.modules?.geofence &&
                        formData.modules?.offline &&
                        formData.modules?.revisal &&
                        formData.modules?.erp &&
                        formData.modules?.shifts &&
                        formData.modules?.face_recognition &&
                        formData.modules?.whatsapp &&
                        formData.modules?.assets
                      ) ? '#3B82F6' : undefined }}
                    ></div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'billing', label: 'Facturare / Plăți Online' },
                  { id: 'leaves', label: 'Zile Libere (CO/CM)' },
                  { id: 'export_saga', label: 'Export Conta (SAGA)' },
                  { id: 'geofence', label: 'Geofence Avansat pe Hartă' },
                  { id: 'offline', label: 'Mod Offline (Reziliență)' },
                  { id: 'revisal', label: 'Integrare API REVISAL' },
                  { id: 'erp', label: 'Modul ERP & Contracte' },
                  { id: 'shifts', label: 'Planificator Ture (Shifts)' },
                  { id: 'face_recognition', label: 'Recunoaștere Facială (AI)' },
                  { id: 'whatsapp', label: 'Alerte WhatsApp/SMS' },
                  { id: 'assets', label: 'Gestiune Echipamente' }
                ].map(mod => {
                  const val = formData.modules[mod.id];
                  const isChecked = !!val;
                  const isTrial = typeof val === 'string' && val.length > 10;
                  
                  const formatTrialDate = (isoString) => {
                    if (!isoString) return '';
                    const d = new Date(isoString);
                    return d.toLocaleDateString('ro-RO');
                  };

                  return (
                    <div key={mod.id} className="flex flex-col p-3 border border-slate-200 dark:border-slate-700 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-300">{mod.label}</span>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isChecked}
                            onChange={() => handleModuleToggle(mod.id)}
                          />
                          <div 
                            onClick={() => handleModuleToggle(mod.id)}
                            className="w-11 h-6 bg-slate-200 dark:bg-slate-700 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                            style={{ backgroundColor: isChecked ? '#3B82F6' : undefined }}
                          ></div>
                        </div>
                      </div>
                      
                      {isChecked && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Licență:</span>
                          <select
                            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 text-slate-700 dark:text-slate-300 outline-none font-medium"
                            value={isTrial ? "custom" : "true"}
                            onChange={(e) => handleTrialChange(mod.id, e)}
                          >
                            <option value="true">Permanentă</option>
                            <option value="7">Probă (7 zile)</option>
                            <option value="14">Probă (14 zile)</option>
                            <option value="30">Probă (30 zile)</option>
                            <option value="90">Probă (3 luni)</option>
                            {isTrial && <option value="custom">Expiră la {formatTrialDate(val)}</option>}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {editTenant && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 dark:border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-white dark:text-white uppercase tracking-wider">6. Link-uri Rapide</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 dark:border-slate-700 p-4 rounded-lg space-y-4">
                  {(() => {
                    let host = window.location.host;
                    if (host.startsWith('admin.')) host = host.replace('admin.', '');
                    if (host.startsWith('www.')) host = host.replace('www.', '');
                    
                    const generateSlug = (text) => {
                      if (!text) return 'nou';
                      return text.toString().toLowerCase()
                        .replace(/[^a-z0-9]/g, ''); // removes spaces, hyphens, and any special chars
                    };
                    
                    const sub = editTenant.subdomain || generateSlug(editTenant.nume || formData.nume_locatie);
                    const managerLink = `${window.location.protocol}//${sub}.${host}/admin/login`;
                    const scanLink = `${window.location.protocol}//${sub}.${host}/`;
                    
                    return (
                      <>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">Link Panou Manager Locație</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={managerLink} 
                        className="flex-1 px-3 h-9 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none text-slate-600 dark:text-slate-300 font-medium" 
                      />
                      <a 
                        href={managerLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-9 h-9 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                        title="Deschide în tab nou"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(managerLink)}
                        className="w-9 h-9 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                        title="Copiază link"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">Aplicație Scanare Angajați (URL Cod QR)</p>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={scanLink} className="flex-1 px-3 h-9 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none text-slate-600 dark:text-slate-300 font-medium" />
                      <a 
                        href={scanLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-9 h-9 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                        title="Deschide în tab nou"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(scanLink)}
                        className="w-9 h-9 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                        title="Copiază link"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
            </div>
          </div>
        )}
          </form>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center"
          >
            Anulează
          </button>
          <button 
            type="submit"
            form="create-tenant-form"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 text-sm rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm transition-all disabled:opacity-50 text-center"
          >
            {loading ? 'Se salvează...' : (editTenant ? 'Salvează Modificările' : 'Salvează și Creează')}
          </button>
        </div>
      </div>
    </div>
  );
}
