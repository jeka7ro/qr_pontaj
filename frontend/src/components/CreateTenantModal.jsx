import React, { useState, useEffect } from 'react';
import { X, Upload, Copy, ExternalLink, Image as ImageIcon, Globe, Smartphone, Coffee, Eye, EyeOff } from 'lucide-react';
import { resolveFaviconUrl } from '../utils/favicon';

export default function CreateTenantModal({ onClose, onTenantCreated, editTenant = null }) {
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [formData, setFormData] = useState({
    nume_locatie: '',
    nume_admin: '',
    tip_modul: 'Restaurant / HORECA',
    country_code: 'RO',
    timezone: 'Europe/Bucharest',
    allow_employee_portal: true,
    allow_breaks: false,
    logo_url: '',
    favicon_url: '',
    portal_bg_image_url: '',
    portal_bg_color: '',
    culoare_tema: '#2563EB',
    email_admin: '',
    parola_initiala: '',
    distanta_gps: '100',
    mod_qr: 'STATIC',
    billing_per_employee: false,
    price_per_employee: '3.50',
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
  const [uploadingBg, setUploadingBg] = useState(false);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'logo_url') setUploadingLogo(true);
    else if (field === 'portal_bg_image_url') setUploadingBg(true);
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
      if (field === 'logo_url') setUploadingLogo(false);
      else if (field === 'portal_bg_image_url') setUploadingBg(false);
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
        country_code: editTenant.country_code || 'RO',
        timezone: editTenant.timezone || (editTenant.country_code === 'BE' ? 'Europe/Brussels' : 'Europe/Bucharest'),
        allow_employee_portal: editTenant.allow_employee_portal !== false,
        allow_breaks: editTenant.allow_breaks === true || editTenant.country_code === 'BE',
        logo_url: editTenant.logo_url || '',
        favicon_url: editTenant.favicon_url || '',
        portal_bg_image_url: editTenant.portal_bg_image_url || '',
        portal_bg_color: editTenant.portal_bg_color || '',
        culoare_tema: editTenant.culoare || '#2563EB',
        email_admin: '', // Nu e folosit la editare
        parola_initiala: '',
        distanta_gps: editTenant.raza_gps?.toString() || '100',
        mod_qr: editTenant.mod_qr || 'STATIC',
        billing_per_employee: Boolean(editTenant.billing_per_employee),
        price_per_employee: editTenant.price_per_employee ? editTenant.price_per_employee.toString() : '3.50',
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

              {/* Selector Țară (România vs Belgia) */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Țară & Conformitate Juridică *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      country_code: 'RO',
                      timezone: 'Europe/Bucharest',
                      allow_breaks: false
                    }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.country_code === 'RO'
                        ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold shadow-xs ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-base font-extrabold flex items-center gap-2">
                      <span className="text-xl">🇷🇴</span> România
                    </div>
                    <div className="text-[11px] opacity-75 mt-1 font-medium">CNP obligatoriu, Fus Orar București, Export SAGA</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      country_code: 'BE',
                      timezone: 'Europe/Brussels',
                      allow_breaks: true
                    }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.country_code === 'BE'
                        ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold shadow-xs ring-2 ring-primary-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-base font-extrabold flex items-center gap-2">
                      <span className="text-xl">🇧🇪</span> Belgia
                    </div>
                    <div className="text-[11px] opacity-75 mt-1 font-medium">NISS, Fus Orar Bruxelles, Cerințe 2027, Pauze</div>
                  </button>
                </div>
              </div>

              {/* Setare ON/OFF: Acces Portal Angajați */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Acces Portal Angajați (Mobil / Cod & PIN)
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Permite angajaților să se autentifice pe telefon cu codul și PIN-ul pentru a-și vedea orele lucrate.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={formData.allow_employee_portal !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, allow_employee_portal: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                {!formData.allow_employee_portal && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Logarea angajaților de pe telefon va fi BLOCATĂ. Angajații vor putea ponta strict fizic la tabletă / Kiosk.
                  </div>
                )}
              </div>

              {/* Setare ON/OFF: Înregistrare Pauze */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Coffee size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Înregistrare Pauze de Masă
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Afișează opțiuni de pauză de masă și revenire pe ecranul de pontaj.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={Boolean(formData.allow_breaks)}
                      onChange={(e) => setFormData(prev => ({ ...prev, allow_breaks: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Secțiune Tarifare / Facturare per Angajat */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                    Tarifare & Facturare
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Activează includerea automată a acestui tenant în modulul de calcul facturi.
                  </p>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tarifare per angajat
                  </span>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={Boolean(formData.billing_per_employee)}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_per_employee: e.target.checked }))}
                    />
                    <div 
                      className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                    ></div>
                  </div>
                </label>
              </div>

              {formData.billing_per_employee && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Preț per Angajat Activ (€ / lună) *
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          name="price_per_employee"
                          value={formData.price_per_employee}
                          onChange={handleChange}
                          required={formData.billing_per_employee}
                          className="w-full pl-4 pr-12 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all font-semibold"
                          placeholder="3.50"
                        />
                        <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">EUR</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-white">Regulă prag 15 zile (contract):</div>
                      <div className="text-slate-500 dark:text-slate-400">• &lt; 15 zile activitate: 50% din tarif ({((parseFloat(formData.price_per_employee) || 0) * 0.5).toFixed(2)} €)</div>
                      <div className="text-slate-500 dark:text-slate-400">• ≥ 15 zile activitate: 100% din tarif ({((parseFloat(formData.price_per_employee) || 0)).toFixed(2)} €)</div>
                    </div>
                  </div>
                </div>
              )}
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
                      <label 
                        className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-xs cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 active:scale-95"
                        style={{ backgroundColor: formData.culoare_tema || '#3b82f6' }}
                        title="Alege culoarea temei"
                      >
                        <input 
                          type="color" 
                          name="culoare_tema"
                          value={formData.culoare_tema}
                          onChange={handleChange}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                        />
                      </label>
                      <input 
                        type="text" 
                        name="culoare_tema"
                        value={formData.culoare_tema}
                        onChange={handleChange}
                        className="flex-1 px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm font-medium" 
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

                  {/* Fundal Autentificare & Portal Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Fundal Autentificare & Portal (Login Background)
                      </label>
                      {formData.portal_bg_image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, portal_bg_image_url: '' }))}
                          className="text-[11px] text-red-500 hover:text-red-600 font-semibold cursor-pointer"
                        >
                          Elimină Fundal
                        </button>
                      )}
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Imagine Fundal (URL sau Fișier Local)
                        </label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            name="portal_bg_image_url"
                            value={formData.portal_bg_image_url}
                            onChange={handleChange}
                            placeholder="Lipește link-ul imaginii (ex: https://...)" 
                            className="flex-1 px-4 h-10 text-xs rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm font-medium" 
                          />
                          <label 
                            className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 shadow-sm active:scale-98"
                            title="Alege fișier local"
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'portal_bg_image_url')} 
                              disabled={uploadingBg}
                            />
                            {uploadingBg ? <Loader2 size={13} className="animate-spin text-slate-500" /> : <Upload size={13} className="text-slate-500" />}
                            <span>{uploadingBg ? 'Se încarcă...' : 'Încarcă fișier'}</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Culoare Fundal (Hex)
                        </label>
                        <div className="flex items-center gap-3">
                          <label 
                            className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-xs cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 active:scale-95"
                            style={{ backgroundColor: formData.portal_bg_color || '#020617' }}
                            title="Alege culoarea de fundal"
                          >
                            <input 
                              type="color" 
                              name="portal_bg_color"
                              value={formData.portal_bg_color || '#020617'}
                              onChange={handleChange}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                          </label>
                          <input 
                            type="text" 
                            name="portal_bg_color"
                            value={formData.portal_bg_color}
                            onChange={handleChange}
                            placeholder="#020617"
                            className="w-32 px-3 h-10 text-xs rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm font-mono uppercase font-bold text-center" 
                          />
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Nuanța de fundal pentru pagina de autentificare
                          </span>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Nume Administrator</label>
                    <input 
                      type="text" 
                      name="nume_admin"
                      value={formData.nume_admin}
                      onChange={handleChange}
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm" 
                      placeholder="Ex: Eugeniu Cazmal" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 mb-1">Email Administrator *</label>
                    <input 
                      type="email" 
                      name="email_admin"
                      value={formData.email_admin}
                      onChange={handleChange}
                      required
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm" 
                      placeholder="email@domeniu.ro" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Parolă Inițială *</label>
                    <div className="relative">
                      <input 
                        type={showInitialPassword ? "text" : "password"} 
                        name="parola_initiala"
                        value={formData.parola_initiala}
                        onChange={handleChange}
                        required
                        className="w-full pl-4 pr-10 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" 
                        placeholder="••••••••" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowInitialPassword(!showInitialPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={showInitialPassword ? "Ascunde parola" : "Vezi parola"}
                      >
                        {showInitialPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
