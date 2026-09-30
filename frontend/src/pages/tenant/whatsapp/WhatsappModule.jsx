import React, { useState, useEffect } from 'react';
import { MessageCircle, Save, QrCode, ShieldAlert, CheckCircle2, Loader2, LogOut, ShieldCheck, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ConfirmModal from '../../../components/ConfirmModal';

export default function WhatsappModule({ tenant, themeColor }) {
  const [settings, setSettings] = useState({
    phone_number: '',
    alerts_enabled: false,
    notify_late: true,
    notify_overtime: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  
  // WhatsApp connection state
  const [wsStatus, setWsStatus] = useState('INITIALIZING');
  const [qrCode, setQrCode] = useState(null);

  // Fetch settings
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

  // Poll WhatsApp status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}/whatsapp/status`);
        if (res.ok) {
          const data = await res.json();
          setWsStatus(data.status);
          setQrCode(data.qr);
        }
      } catch (err) {
        console.error('Error polling whatsapp status:', err);
      }
    };
    
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [tenant.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Setările de notificare au fost salvate cu succes!' });
        setTimeout(() => setToast(null), 3500);
      } else {
        setToast({ type: 'error', message: 'Eroare la salvarea setărilor.' });
        setTimeout(() => setToast(null), 3500);
      }
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Eroare de conexiune la salvare.' });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const executeLogout = async () => {
    setWsStatus('INITIALIZING');
    try {
      await fetch(`/api/tenants/${tenant.id}/whatsapp/logout`, { method: 'POST' });
      setToast({ type: 'success', message: 'Dispozitivul WhatsApp a fost deconectat.' });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      console.error('Logout error', err);
      setToast({ type: 'error', message: 'Eroare la deconectarea dispozitivului.' });
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="space-y-6 w-full relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200' 
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/80 dark:border-red-800 dark:text-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> : <ShieldAlert size={18} className="text-red-600 dark:text-red-400 shrink-0" />}
          <span className="text-sm font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}
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
                className="w-full flex items-center justify-center gap-2 h-10 px-5 text-sm text-white rounded-full font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                <Save size={18} /> {saving ? 'Se salvează...' : 'Salvează Configurarea'}
              </button>

              <div className="pt-2 text-[11px] text-slate-400 flex items-start gap-1.5 leading-tight">
                <ShieldCheck size={14} className="text-primary-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Notă GDPR:</strong> Notificările automate transmit strict alerte operaționale de pontaj către manageri autorizați, conform Art. 6 alin. (1) lit. f) RGPD.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mb-6">
            <MessageCircle size={32} color="#25D366" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Conexiune Dispozitiv</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Sistemul necesită o sesiune activă de WhatsApp Web pentru a trimite mesaje gratuite.
          </p>

          {wsStatus === 'CONNECTED' ? (
            <div className="flex flex-col items-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg w-full">
              <CheckCircle2 size={48} className="text-green-500 mb-3" />
              <p className="font-bold text-green-700 dark:text-green-400">Conectat cu Succes</p>
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1 mb-4">Alertele sunt gata să fie trimise.</p>
              
              <button 
                onClick={() => setShowConfirmLogout(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} /> Deconectează
              </button>
            </div>
          ) : wsStatus === 'QR_READY' && qrCode ? (
            <>
              <div className="p-4 bg-white dark:bg-white border border-slate-200 dark:border-slate-700 rounded-lg">
                <QRCodeSVG value={qrCode} size={180} />
              </div>
              <p className="text-xs text-slate-400 mt-4 font-semibold uppercase tracking-wider">
                Scanați codul din aplicația WhatsApp (Dispozitive Asociate)
              </p>
            </>
          ) : wsStatus === 'ERROR' ? (
            <div className="flex flex-col items-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg w-full">
              <ShieldAlert size={40} className="text-red-500 mb-2" />
              <p className="font-bold text-red-700 dark:text-red-400">Eroare de Conexiune</p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Nu am putut inițializa clientul WhatsApp.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg w-full">
              <Loader2 size={32} className="text-slate-300 dark:text-slate-600 animate-spin mb-4" />
              <p className="font-bold text-slate-600 dark:text-slate-300">Se inițializează...</p>
              <p className="text-xs text-slate-400 mt-1">Acest proces poate dura până la 15 secunde.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        onConfirm={executeLogout}
        title="Deconectare WhatsApp"
        message="Ești sigur că vrei să deconectezi această sesiune WhatsApp Web? Alertele automate nu vor mai putea fi transmise până la o nouă scanare QR."
        confirmText="Deconectează"
        cancelText="Anulează"
        isDanger={true}
      />
    </div>
  );
}
