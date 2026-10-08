import React, { useState, useEffect } from 'react';
import { X, Settings, Coffee, Smartphone, Check, Loader2, AlertCircle, Image, Upload, Trash2 } from 'lucide-react';
import { useTranslation } from '../utils/i18n.jsx';

export default function TenantSettingsModal({ isOpen, onClose, tenant, onUpdateTenant }) {
  const { t } = useTranslation();
  const [allowEmployeePortal, setAllowEmployeePortal] = useState(true);
  const [allowBreaks, setAllowBreaks] = useState(false);
  const [portalBgImageUrl, setPortalBgImageUrl] = useState('');
  const [portalBgColor, setPortalBgColor] = useState('');
  const [uploadingBg, setUploadingBg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tenant) {
      setAllowEmployeePortal(tenant.allow_employee_portal !== false);
      setAllowBreaks(Boolean(tenant.allow_breaks));
      setPortalBgImageUrl(tenant.portal_bg_image_url || '');
      setPortalBgColor(tenant.portal_bg_color || '');
      setError(null);
      setSuccess(false);
    }
  }, [tenant, isOpen]);

  if (!isOpen) return null;

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBg(true);
    setError(null);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch(`${apiUrl}/api/tenants/upload-branding`, {
        method: 'POST',
        body: uploadData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la încărcarea imaginii de fundal.');

      setPortalBgImageUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingBg(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const res = await fetch(`${apiUrl}/api/tenants/${tenant.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allow_employee_portal: allowEmployeePortal,
          allow_breaks: allowBreaks,
          portal_bg_image_url: portalBgImageUrl,
          portal_bg_color: portalBgColor
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Eroare la salvarea setărilor.');

      setSuccess(true);
      if (onUpdateTenant) {
        onUpdateTenant(data);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const themeColor = tenant?.theme_color || '#ec094d';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: themeColor }}>
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{t('tenantSettingsTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('tenantSettingsSubtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <Check size={18} className="shrink-0" />
              <span>{t('settingsSavedSuccess')}</span>
            </div>
          )}

          {/* 1. Comutator ON/OFF: Acces Portal Angajați */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('allowEmployeePortalTitle')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('allowEmployeePortalDesc')}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={allowEmployeePortal} 
                  onChange={(e) => setAllowEmployeePortal(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            {!allowEmployeePortal && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t('employeePortalBlockedNote')}
              </div>
            )}
          </div>

          {/* 2. Comutator ON/OFF: Înregistrare Pauze */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Coffee size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('allowBreaksTitle')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('allowBreaksDesc')}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={allowBreaks} 
                  onChange={(e) => setAllowBreaks(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* 3. Fundal Autentificare & Portal */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Image size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('authBgTitle')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('authBgDesc')}
                  </p>
                </div>
              </div>
              {portalBgImageUrl && (
                <button
                  type="button"
                  onClick={() => setPortalBgImageUrl('')}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>{t('deleteTooltip')}</span>
                </button>
              )}
            </div>

            {portalBgImageUrl && (
              <div className="relative rounded-xl overflow-hidden h-28 border border-slate-200 dark:border-slate-700 bg-slate-950 shadow-inner">
                <img 
                  src={portalBgImageUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${portalBgImageUrl}` : portalBgImageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                  <span className="text-[11px] font-medium text-white/90 truncate">{portalBgImageUrl}</span>
                </div>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('bgImageLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={portalBgImageUrl}
                    onChange={(e) => setPortalBgImageUrl(e.target.value)}
                    placeholder={t('bgImagePlaceholder')}
                    className="flex-1 px-3.5 h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs"
                  />
                  <label 
                    className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 shadow-xs active:scale-98"
                    title={t('uploadFileBtn')}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      disabled={uploadingBg}
                      onChange={handleBgUpload}
                    />
                    {uploadingBg ? <Loader2 size={14} className="animate-spin text-slate-500" /> : <Upload size={14} className="text-slate-500" />}
                    <span>{uploadingBg ? t('uploadingFile') : t('uploadFileBtn')}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('bgColorLabel')}
                </label>
                <div className="flex items-center gap-3">
                  <label 
                    className="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-sm cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 active:scale-95 ring-2 ring-transparent hover:ring-primary-500/20"
                    style={{ backgroundColor: portalBgColor || '#020617' }}
                    title={t('bgColorHelp')}
                  >
                    <input 
                      type="color" 
                      value={portalBgColor || '#020617'} 
                      onChange={(e) => setPortalBgColor(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <input 
                    type="text" 
                    value={portalBgColor} 
                    onChange={(e) => setPortalBgColor(e.target.value)}
                    placeholder="#020617"
                    className="w-32 px-3 h-10 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-xs"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t('bgColorHelp')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-7 h-11 rounded-full text-white font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: themeColor }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
