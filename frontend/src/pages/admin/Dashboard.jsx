import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  MapPin,
  Pencil,
  Trash2,
  Sun,
  Moon,
  History,
  Calculator,
  Activity,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  ExternalLink,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  X,
  FileText,
  RefreshCw,
  AlertCircle,
  Megaphone,
  FileCheck
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ProfileModal from '../../components/ProfileModal';
import CreateTenantModal from '../../components/CreateTenantModal';
import TenantAdminsModal from '../../components/TenantAdminsModal';
import LoginLogs from './LoginLogs';
import BillingCalculator from './BillingCalculator';
import LanguageToggle from '../../components/LanguageToggle';
import { resolveFaviconUrl } from '../../utils/favicon';
import HarveySdrView from '../../components/admin/HarveySdrView';
import MarketingAdsKit from '../../components/admin/MarketingAdsKit';

export default function AdminDashboard() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Inițializăm userul din localStorage sau setăm un default (Super Admin curent)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { nume: 'Eugeniu', prenume: 'Cazmal', email: 'jeka7ro@gmail.com', role: 'Super Admin', avatar: null };
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const syncSession = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isSuper = user && (user.role === 'SUPERADMIN' || user.role === 'Super Admin');

      if (!token || token === 'null' || token === 'undefined' || !isSuper) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
          const res = await fetch(`${apiUrl}/api/auth/superadmin-session`);
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              localStorage.setItem('token', data.token);
              if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                setCurrentUser(data.user);
              }
            }
          }
        } catch (e) {
          console.warn('Superadmin session auto-sync skipped:', e.message);
        }
      }
    };
    syncSession();
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const navItems = [
    { name: 'Tenanți', path: '/admin/dashboard', icon: Building2 },
    { name: 'Harvey AI (SDR)', path: '/admin/harvey', icon: Sparkles },
    { name: 'Portal Contabili', path: '/contabil', icon: FileCheck, targetBlank: true },
    { name: 'Kit Reclame Meta', path: '/admin/marketing', icon: Megaphone },
    { name: 'Calcul Facturi', path: '/admin/billing', icon: Calculator },
    { name: 'Utilizatori Admin', path: '/admin/users', icon: Users },
    { name: 'Jurnal & Intervenții', path: '/admin/logs', icon: Activity },
    { name: 'Setări Platformă', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 flex transition-colors">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0 w-60 shadow-2xl' : '-translate-x-full w-60'} md:translate-x-0 md:static ${sidebarOpen ? 'md:w-56' : 'md:w-20'} md:shadow-none bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col shrink-0 overflow-hidden`}>
        <div className={`h-16 flex items-center ${sidebarOpen ? 'justify-between px-5' : 'justify-center px-2'} border-b border-slate-200 dark:border-slate-700 shrink-0`}>
          {sidebarOpen ? (
            <>
              <span className="font-bold text-lg text-slate-800 dark:text-white truncate">SaaS Admin</span>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title="Micșorează meniul"
              >
                <Menu size={18} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Extinde meniul"
            >
              <Menu size={20} />
            </button>
          )}
        </div>
        
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                target={item.targetBlank ? '_blank' : undefined}
                rel={item.targetBlank ? 'noreferrer' : undefined}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                title={!sidebarOpen ? item.name : undefined}
                className={`flex items-center ${sidebarOpen ? 'space-x-3 px-3.5' : 'justify-center px-0'} h-11 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-bold' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:text-white font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-600 dark:text-primary-400 shrink-0' : 'text-slate-400 shrink-0'} />
                {sidebarOpen && <span className="truncate text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <Link 
            to="/admin/login" 
            onClick={handleLogout} 
            title={!sidebarOpen ? "Deconectare" : undefined}
            className={`flex items-center ${sidebarOpen ? 'space-x-3 px-3.5' : 'justify-center px-0'} h-11 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium text-sm`}
          >
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="truncate">Deconectare</span>}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Comută meniul lateral"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white md:hidden">SaaS Admin</span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5 ml-auto">
            {/* Selector Limbă */}
            <LanguageToggle />

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
              title="Comută tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg md:pr-4 transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-800 dark:text-white">
                  {currentUser.nume} {currentUser.prenume}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {currentUser.role || 'Super Admin'}
                </div>
              </div>
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 object-cover bg-white" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {(currentUser.nume?.[0] || '')}{(currentUser.prenume?.[0] || '')}
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-3 sm:p-4 md:p-5 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<TenantsList defaultTab="tenants" />} />
            <Route path="/harvey" element={<TenantsList defaultTab="harvey" />} />
            <Route path="/marketing" element={<MarketingAdsKit />} />
            <Route path="/billing" element={<BillingCalculator />} />
            <Route path="/logs" element={<LoginLogs />} />
            <Route path="/login-logs" element={<LoginLogs />} />
          </Routes>
        </main>
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          user={currentUser} 
          onSave={handleProfileUpdate}
        />
      </div>
    </div>
  );
}

function TenantDetailsModal({ tenant, onClose, onTenantUpdated }) {
  if (!tenant) return null;

  const [activeTenant, setActiveTenant] = useState(tenant);
  const [syncingAnaf, setSyncingAnaf] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [editingCui, setEditingCui] = useState(false);
  const [cuiInput, setCuiInput] = useState(tenant.cui || '');

  const handleSync = async (cuiToUse) => {
    const targetCui = cuiToUse !== undefined ? cuiToUse : (cuiInput || activeTenant.cui);
    const cleanDigits = String(targetCui || '').replace(/[^0-9]/g, '');
    if (!cleanDigits) {
      setSyncError('Introdu un CUI format din cifre pentru interogare ANAF');
      return;
    }

    setSyncingAnaf(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/tenants/${activeTenant.id}/sync-anaf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cui: targetCui })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Eroare la sincronizarea cu ANAF');
      }

      if (data.tenant) {
        setActiveTenant(prev => ({
          ...prev,
          billing_address: data.tenant.billing_address,
          cui: data.tenant.vat_number,
          nume: data.tenant.name
        }));
        setCuiInput(data.tenant.vat_number || targetCui);
        setEditingCui(false);
        setSyncSuccess(true);
        if (onTenantUpdated) {
          onTenantUpdated();
        }
      }
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncingAnaf(false);
    }
  };

  useEffect(() => {
    setActiveTenant(tenant);
    setCuiInput(tenant.cui || '');
    setSyncError(null);
    setSyncSuccess(false);

    // Dacă tenant-ul are CUI dar adresa de sediu social lipsește, interogăm automat ANAF la deschiderea ferestrei
    if (tenant.cui && !tenant.billing_address) {
      handleSync(tenant.cui);
    }
  }, [tenant]);

  const cleanPhone = activeTenant.contact_phone ? String(activeTenant.contact_phone).replace(/[^0-9+]/g, '') : '';
  const waPhone = cleanPhone.startsWith('0') ? '4' + cleanPhone : cleanPhone.replace('+', '');
  const isDemo = activeTenant.subscription_status === 'DEMO' || !activeTenant.subscription_status;
  const createdDate = activeTenant.created_at ? new Date(activeTenant.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const expiresDate = activeTenant.demo_expires_at ? new Date(activeTenant.demo_expires_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  let hostname = window.location.hostname;
  if (hostname.startsWith('admin.')) hostname = hostname.replace('admin.', '');
  if (hostname.startsWith('www.')) hostname = hostname.replace('www.', '');
  const port = window.location.port ? `:${window.location.port}` : '';
  const adminUrl = `https://${activeTenant.subdomain}.pontaj.app/admin/login`;
  const universalLoginUrl = `https://qrpontaj.ro/login?tenant=${activeTenant.subdomain}${activeTenant.contact_email ? `&email=${encodeURIComponent(activeTenant.contact_email)}` : ''}`;

  const waLoginMessage = encodeURIComponent(
    `Bună ziua, ${activeTenant.contact_name || activeTenant.nume}!\n\n` +
    `Iată linkul de conectare la panoul dvs. de administrare QR Pontaj:\n` +
    `🔗 Link: ${universalLoginUrl}\n` +
    (activeTenant.contact_email ? `📧 Email: ${activeTenant.contact_email}\n` : '') +
    `\nAplicația este configurată și pregătită pentru compania dvs.`
  );
  const waUrlWithLogin = `https://wa.me/${waPhone}?text=${waLoginMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative p-6 sm:p-7 text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                isDemo 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                {activeTenant.subscription_status || 'DEMO (10 Zile)'}
              </span>
              {activeTenant.cui && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  CUI: {activeTenant.cui}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {activeTenant.nume}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              subdomeniu: {activeTenant.subdomain}.pontaj.app
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-5">
          {activeTenant.contact_phone ? (
            <>
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Phone size={14} />
                <span>Apelează</span>
              </a>
              <a
                href={waUrlWithLogin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                title="Trimite link de logare pe WhatsApp"
              >
                <MessageSquare size={14} />
                <span>WhatsApp Logare</span>
              </a>
            </>
          ) : (
            <div className="sm:col-span-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs text-center font-medium">
              Fără număr de telefon
            </div>
          )}
          {activeTenant.contact_email && (
            <a
              href={`mailto:${activeTenant.contact_email}`}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
            >
              <Mail size={14} />
              <span>Email</span>
            </a>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-4 text-xs">
          {/* Card Date Contact */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="font-bold uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
              Persoană de Contact & Comunicații
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Nume & Prenume</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {activeTenant.contact_name || 'Nespecificat'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Telefon Principal (Client)</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeTenant.contact_phone || '—'}
                </span>
              </div>
              {activeTenant.anaf_phone && (
                <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[10px]">Telefon Opțional (ANAF):</span>
                  <a href={`tel:${String(activeTenant.anaf_phone).replace(/[^0-9+]/g, '')}`} className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600">
                    {activeTenant.anaf_phone}
                  </a>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">Adresă Email</span>
                <span className="font-semibold text-slate-900 dark:text-white break-all">
                  {activeTenant.contact_email || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Card Date Companie & ANAF */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
                Date Fiscale & Sediu Social (ANAF)
              </div>
              <button
                type="button"
                onClick={() => handleSync()}
                disabled={syncingAnaf || (!activeTenant.cui && !cuiInput)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                title="Reinteroghează serverul ANAF pentru cele mai recente date oficiale"
              >
                <RefreshCw size={13} className={syncingAnaf ? 'animate-spin' : ''} />
                <span>{syncingAnaf ? 'Preluare ANAF...' : 'Sincronizează ANAF'}</span>
              </button>
            </div>

            {syncError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-semibold">
                <AlertCircle size={14} className="shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {syncSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Datele fiscale și sediul social au fost preluate direct din registrul ANAF.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Denumire Firmă</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeTenant.nume}</span>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">CUI / CIF</span>
                  {!editingCui && (
                    <button
                      type="button"
                      onClick={() => setEditingCui(true)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      Modifică CUI
                    </button>
                  )}
                </div>
                {editingCui ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={cuiInput}
                      onChange={(e) => setCuiInput(e.target.value)}
                      placeholder="ex: 45691500"
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSync(cuiInput)}
                      disabled={syncingAnaf || !cuiInput.trim()}
                      className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Preia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCuiInput(activeTenant.cui || '');
                        setEditingCui(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Anulează
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeTenant.cui || 'Nespecificat'}
                  </span>
                )}
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-400 block text-[10px]">Adresă Sediu Social / Facturare</span>
                  {activeTenant.billing_address ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-bold">
                      Sursă: ANAF Oficial
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold">
                      Lipsă sediu social
                    </span>
                  )}
                </div>
                <div className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeTenant.billing_address || (
                    <span className="text-slate-400 italic">
                      Nu a fost găsită în ANAF sau nu a fost specificată. Apasă butonul de mai sus pentru preluare automată.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card Abonament & Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="font-bold uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
              Abonament & Termeni
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Tip Cont</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {isDemo ? 'Cont Demonstrativ (Trial)' : 'Abonament Activ'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Număr Angajați</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeTenant.subscription_seats || 10} angajați ({activeTenant.active_employees_count || 0} activi)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tarifare Lunar</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {parseFloat(activeTenant.price_per_employee || 0).toFixed(2)} € / angajat
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Valabilitate Demo</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {expiresDate ? `până la ${expiresDate}` : 'Nelimitat'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px]">Data Creării / Înregistrării</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{createdDate}</span>
              </div>
            </div>
          </div>

          {/* Observații / Notițe */}
          {activeTenant.registration_notes && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
              <span className="font-bold block text-[11px] uppercase tracking-wider mb-1">Observații trimise de client:</span>
              <p className="italic">{activeTenant.registration_notes}</p>
            </div>
          )}

          {/* Link direct panou */}
          <div className="pt-2">
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 font-bold text-xs transition-colors"
            >
              <ExternalLink size={14} />
              <span>Deschide Panoul de Administrare ({tenant.subdomain}.pontaj.app)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantsList({ defaultTab = 'tenants' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [initialLeadForCreate, setInitialLeadForCreate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenantForAdmins, setSelectedTenantForAdmins] = useState(null);
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState(null);
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [harveyCount, setHarveyCount] = useState(0);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const fetchHarveyCount = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/admin/harvey/stats`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.stats) {
          setHarveyCount(json.stats.totalLeads || 0);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchHarveyCount();
  }, [activeTab]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants`);
      if (!res.ok) throw new Error('Eroare la preluarea datelor');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const columns = [
    { 
      key: 'nume', 
      label: 'Companie & CUI',
      render: (row) => {
        let hostname = window.location.hostname;
        if (hostname.startsWith('admin.')) hostname = hostname.replace('admin.', '');
        if (hostname.startsWith('www.')) hostname = hostname.replace('www.', '');
        const port = window.location.port ? `:${window.location.port}` : '';
        const adminUrl = `${window.location.protocol}//${row.subdomain}.${hostname}${port}/admin/login`;
        
        return (
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setSelectedTenantForDetails(row)}
                className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors cursor-pointer whitespace-nowrap text-xs sm:text-sm"
                title="Vezi toate detaliile firmei"
              >
                {row.nume}
              </button>
              {row.cui && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold whitespace-nowrap shrink-0">
                  {row.cui}
                </span>
              )}
            </div>
            <a 
              href={adminUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <span>{row.subdomain}.pontaj.app</span>
              <ExternalLink size={10} />
            </a>
          </div>
        );
      }
    },
    {
      key: 'contact',
      label: 'Contact & Telefon',
      render: (row) => {
        const cleanPhone = row.contact_phone ? String(row.contact_phone).replace(/[^0-9+]/g, '') : '';
        const waPhone = cleanPhone.startsWith('0') ? '4' + cleanPhone : cleanPhone.replace('+', '');
        const hasContact = row.contact_name || row.contact_phone || row.contact_email;
        
        if (!hasContact) {
          return <span className="text-slate-400 text-xs italic">Nespecificat</span>;
        }

        const loginUrl = `https://qrpontaj.ro/login?tenant=${row.subdomain}${row.contact_email ? `&email=${encodeURIComponent(row.contact_email)}` : ''}`;
        const waRowMessage = encodeURIComponent(
          `Bună ziua, ${row.contact_name || row.nume}!\n\n` +
          `Iată linkul de conectare la panoul dvs. de administrare QR Pontaj:\n` +
          `🔗 Link: ${loginUrl}\n` +
          (row.contact_email ? `📧 Email: ${row.contact_email}\n` : '') +
          `\nAplicația este configurată și pregătită pentru compania dvs.`
        );
        const waRowUrl = `https://wa.me/${waPhone}?text=${waRowMessage}`;

        return (
          <div className="flex flex-col gap-0.5 text-xs whitespace-nowrap">
            {row.contact_name && (
              <div className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {row.contact_name}
              </div>
            )}
            {row.contact_phone && (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <a 
                  href={`tel:${cleanPhone}`} 
                  className="font-bold text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap"
                  title="Apelează telefonic"
                >
                  <Phone size={11} />
                  <span>{row.contact_phone}</span>
                </a>
                <a
                  href={waRowUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700"
                  title="Trimite link conectare pe WhatsApp"
                >
                  <MessageSquare size={12} />
                </a>
              </div>
            )}
            {row.anaf_phone && row.anaf_phone !== row.contact_phone && (
              <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0" title="Telefon opțional preluat din registrul ANAF">
                ANAF: {row.anaf_phone}
              </span>
            )}
            {row.contact_email && (
              <a 
                href={`mailto:${row.contact_email}`} 
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 truncate max-w-[140px] flex items-center gap-1 text-[11px]"
                title={row.contact_email}
              >
                <Mail size={10} className="shrink-0" />
                <span className="truncate">{row.contact_email}</span>
              </a>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isDemo = row.subscription_status === 'DEMO' || !row.subscription_status;
        const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }) : '—';
        return (
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit whitespace-nowrap shrink-0 ${
              isDemo 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}>
              {row.subscription_status || 'DEMO'}
            </span>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {dateStr}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'branding', 
      label: 'Branding',
      sortable: false,
      render: (row) => {
        const resolvedFav = resolveFaviconUrl(row.favicon_url);
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
            {row.logo_url ? (
              <div 
                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white shadow-xs overflow-hidden flex items-center justify-center shrink-0"
                title="Logo"
              >
                <img 
                  src={row.logo_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${row.logo_url}` : row.logo_url} 
                  alt={row.nume} 
                  className="w-full h-full object-contain p-0.5" 
                  onError={(e) => {
                    if (!e.currentTarget.src.includes('/logo_getapp_smartqr.jpg')) {
                      e.currentTarget.src = '/logo_getapp_smartqr.jpg';
                    }
                  }}
                />
              </div>
            ) : (
              <div 
                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white shadow-xs overflow-hidden flex items-center justify-center shrink-0"
                title="Logo Implicit (GetApp Smart QR)"
              >
                <img 
                  src="/logo_getapp_smartqr.jpg" 
                  alt="GetApp Smart QR" 
                  className="w-full h-full object-contain p-0.5" 
                />
              </div>
            )}

            {resolvedFav ? (
              <div 
                className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center shrink-0"
                title="Favicon activ"
              >
                <img 
                  src={resolvedFav} 
                  alt="Favicon" 
                  className="w-3.5 h-3.5 object-contain" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 italic">fără fav.</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'mod_qr', 
      label: 'Mod QR',
      render: (row) => (
        <div className="flex flex-col text-slate-700 dark:text-slate-300 font-medium text-xs whitespace-nowrap">
          <span className="font-bold text-xs whitespace-nowrap">{row.mod_qr || 'STATIC'}</span>
          <span className="text-[10px] text-slate-400 whitespace-nowrap">{row.raza_gps || 100}m</span>
        </div>
      )
    },
    {
      key: 'billing',
      label: 'Tarifare',
      render: (row) => (
        row.billing_per_employee ? (
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 whitespace-nowrap w-max shrink-0">
              {parseFloat(row.price_per_employee || 0).toFixed(2)} € / angajat
            </span>
            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
              {row.subscription_seats || 10} locuri ({row.active_employees_count || 0} pontați)
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 whitespace-nowrap w-max shrink-0">
            Standard / Fix
          </span>
        )
      )
    },
    {
      key: 'actions',
      label: 'Acțiuni',
      sortable: false,
      render: (row) => (
        <div className="flex justify-end gap-1 whitespace-nowrap shrink-0">
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-200 dark:border-blue-800/60 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer shrink-0"
            onClick={() => setSelectedTenantForDetails(row)}
            title="Vezi Toate Detaliile Companiei"
          >
            <Eye size={13} strokeWidth={2.2} />
          </button>
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            onClick={() => setSelectedTenantForAdmins(row)}
            title="Gestionează Admini"
          >
            <Users size={13} strokeWidth={2} />
          </button>
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-primary-50 hover:text-primary-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            onClick={() => {
              setSelectedTenantForEdit(row);
              setIsModalOpen(true);
            }}
            title="Editează"
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
            onClick={() => console.log('Delete', row.id)}
            title="Șterge"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-slate-500">Se încarcă tenanții...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Eroare: {error}</div>;

  return (
    <>
      {/* Selector Tab: doar când suntem în lista de Tenanți */}
      {activeTab === 'tenants' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Tenanți Activi &amp; Trial</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {data.length} conturi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/harvey"
              className="flex items-center gap-1.5 px-4 h-9 text-xs rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border border-blue-200 dark:border-blue-800"
            >
              <Sparkles size={14} className="shrink-0" />
              <span>Prospectare Harvey ({harveyCount} companii)</span>
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'harvey' ? (
        <HarveySdrView 
          onConvertToTenant={(lead) => {
            setInitialLeadForCreate(lead);
            setSelectedTenantForEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <DataTable 
          title="Tenanți & Înregistrări Landing"
          data={data}
          columns={columns}
          searchPlaceholder="Caută după companie, contact, telefon, CUI..."
          headerActions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('harvey')}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles size={14} className="text-primary-600 dark:text-primary-400 shrink-0" />
                <span>Harvey AI (SDR)</span>
              </button>
              <button 
                onClick={() => {
                  setSelectedTenantForEdit(null);
                  setInitialLeadForCreate(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center px-4 py-2.5 text-xs rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                Adaugă Tenant Manual
              </button>
            </div>
          }
        />
      )}

      {isModalOpen && (
        <CreateTenantModal 
          onClose={() => {
            setIsModalOpen(false);
            setInitialLeadForCreate(null);
          }} 
          onTenantCreated={async () => {
            fetchTenants();
            if (initialLeadForCreate?.id) {
              try {
                const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
                await fetch(`${baseUrl}/api/admin/harvey/leads/${initialLeadForCreate.id}/convert`, { method: 'POST' });
              } catch (e) {}
            }
          }}
          editTenant={selectedTenantForEdit}
          initialLead={initialLeadForCreate}
        />
      )}

      <TenantAdminsModal
        isOpen={!!selectedTenantForAdmins}
        onClose={() => setSelectedTenantForAdmins(null)}
        tenant={selectedTenantForAdmins}
      />

      <TenantDetailsModal 
        tenant={selectedTenantForDetails}
        onClose={() => setSelectedTenantForDetails(null)}
        onTenantUpdated={fetchTenants}
      />
    </>
  );
}
