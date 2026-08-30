import React, { useState, useEffect } from 'react';
import { MessageCircle, Save, QrCode, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function WhatsappModule({ tenant, themeColor }) {
  const [settings, setSettings] = useState({
    phone_number: '',
    alerts_enabled: false,
    notify_late: true,
    notify_overtime: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/whatsapp`);
        if (res.ok) setSettings(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Setări salvate!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="text-slate-400" size={24} />
            Alerte WhatsApp
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Primește notificări instant pe telefonul tău când apar anomalii la pontaj.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Configurare Notificări</h3>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Număr de Telefon (Manager)</label>
                <input 
                  type="text"
                  value={settings.phone_number || ''}
                  onChange={e => setSettings({...settings, phone_number: e.target.value})}
                  placeholder="+40 700 000 000"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none dark:text-white"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${settings.alerts_enabled ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.alerts_enabled ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.alerts_enabled || false}
                    onChange={e => setSettings({...settings, alerts_enabled: e.target.checked})}
                    className="hidden"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Activează Alertele WhatsApp</span>
                </label>

                <div className={`space-y-3 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ${settings.alerts_enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={settings.notify_late || false} onChange={e => setSettings({...settings, notify_late: e.target.checked})} className="rounded text-green-500 focus:ring-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Anunță-mă când cineva întârzie</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={settings.notify_overtime || false} onChange={e => setSettings({...settings, notify_overtime: e.target.checked})} className="rounded text-green-500 focus:ring-green-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Anunță-mă când cineva face ore suplimentare neaprobate</span>
                  </label>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                <Save size={18} /> {saving ? 'Se salvează...' : 'Salvează Configurarea'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-6">
            <MessageCircle size={32} color="#25D366" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Conectează Dispozitivul</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Pentru a putea trimite mesaje gratuit, vom asocia numărul de companie cu sistemul prin WhatsApp Web.
          </p>
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            <QrCode size={120} className="text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-xs text-slate-400 mt-4 font-semibold uppercase tracking-wider">Scanați codul din aplicația WhatsApp</p>
        </div>
      </div>
    </div>
  );
}
