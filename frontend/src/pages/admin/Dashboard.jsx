import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  QrCode,
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
  TrendingUp,
  ShieldCheck,
  FileCheck,
  Power,
  PowerOff
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
import TrafficAnalyticsView from '../../components/admin/TrafficAnalyticsView';

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
    { name: 'Trafic & Lead-uri', path: '/admin/traffic', icon: TrendingUp },
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
              <Link to="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                  <QrCode size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-none">
                    Pontaj<span className="text-blue-600">.app</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                    Admin
                  </span>
                </div>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title="Micșorează meniul"
              >
                <Menu size={18} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <Link to="/admin/dashboard" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0" title="Pontaj.app">
                <QrCode size={20} />
              </Link>
            </div>
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
          <div className="flex items-center gap-3 md:hidden">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Comută meniul lateral"
            >
              <Menu size={22} />
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <QrCode size={16} />
              </div>
              <span className="font-black text-base text-slate-900 dark:text-white tracking-tight">
                Pontaj<span className="text-blue-600">.app</span>
              </span>
            </Link>
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
            <Route path="/traffic" element={<TrafficAnalyticsView />} />
            <Route path="/analytics" element={<TrafficAnalyticsView />} />
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

function TenantDetailsModal({ tenant, onClose, onTenantUpdated, onManageAdmins }) {
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
  const isOnline = Boolean(activeTenant.is_online_registration || activeTenant.terms_accepted_at);
  const isSuspended = activeTenant.subscription_status === 'SUSPENDED';
  const isDemo = isOnline && (activeTenant.subscription_status === 'DEMO' || !activeTenant.subscription_status);
  const createdDate = activeTenant.created_at ? new Date(activeTenant.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const expiresDate = activeTenant.demo_expires_at ? new Date(activeTenant.demo_expires_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  let hostname = window.location.hostname;
  if (hostname.startsWith('admin.')) hostname = hostname.replace('admin.', '');
  if (hostname.startsWith('www.')) hostname = hostname.replace('www.', '');
  const isLocal = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1';
  const port = window.location.port ? `:${window.location.port}` : '';
  const tenantBase = isLocal ? `${activeTenant.subdomain}.localhost${port}` : `${activeTenant.subdomain}.qr.pontaj.app`;
  const adminUrl = isLocal ? `http://${tenantBase}/admin/login` : `https://${tenantBase}/admin/login`;
  const universalLoginUrl = isLocal
    ? `http://localhost${port}/login?tenant=${activeTenant.subdomain}${activeTenant.contact_email ? `&email=${encodeURIComponent(activeTenant.contact_email)}` : ''}`
    : `https://qr.pontaj.app/login?tenant=${activeTenant.subdomain}${activeTenant.contact_email ? `&email=${encodeURIComponent(activeTenant.contact_email)}` : ''}`;

  const waLoginMessage = encodeURIComponent(
    `Bună ziua, ${activeTenant.contact_name || activeTenant.nume}!\n\n` +
    `Iată linkul de conectare la panoul dvs. de administrare QR Pontaj:\n` +
    `Link: ${universalLoginUrl}\n` +
    (activeTenant.contact_email ? `Email: ${activeTenant.contact_email}\n` : '') +
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
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase whitespace-nowrap shrink-0 ${
                isSuspended
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                  : isDemo 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                {isSuspended ? 'SUSPENDAT' : isOnline ? (isDemo ? 'DEMO ONLINE (15 ZILE)' : 'ABONAMENT ONLINE') : 'CONTRACT DIRECT (MANUAL)'}
              </span>
              {activeTenant.cui && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap shrink-0 ${
                  activeTenant.cui.startsWith('RO') || activeTenant.is_vat_payer
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  CUI: {activeTenant.cui.startsWith('RO') ? activeTenant.cui : (activeTenant.is_vat_payer ? `RO${activeTenant.cui}` : activeTenant.cui)}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {activeTenant.nume}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              subdomeniu: {activeTenant.subdomain}.qr.pontaj.app
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-5">
          {activeTenant.contact_phone ? (
            <>
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <Phone size={14} className="shrink-0" />
                <span>Apelează</span>
              </a>
              <a
                href={waUrlWithLogin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors whitespace-nowrap shrink-0"
                title="Trimite link de logare pe WhatsApp"
              >
                <MessageSquare size={14} className="shrink-0" />
                <span>WhatsApp</span>
              </a>
            </>
          ) : (
            <div className="col-span-2 py-2.5 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs text-center font-medium whitespace-nowrap shrink-0">
              Fără număr de telefon
            </div>
          )}
          {activeTenant.contact_email && (
            <a
              href={`mailto:${activeTenant.contact_email}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Mail size={14} className="shrink-0" />
              <span>Email</span>
            </a>
          )}
          {onManageAdmins && (
            <button
              onClick={() => onManageAdmins(activeTenant)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              <ShieldCheck size={14} className="shrink-0 text-blue-600" />
              <span>Admini</span>
            </button>
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
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
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeTenant.cui ? (activeTenant.cui.startsWith('RO') ? activeTenant.cui : (activeTenant.is_vat_payer ? `RO${activeTenant.cui}` : activeTenant.cui)) : 'Nespecificat'}
                    </span>
                    {activeTenant.cui && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                        activeTenant.cui.startsWith('RO') || activeTenant.is_vat_payer
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {activeTenant.cui.startsWith('RO') || activeTenant.is_vat_payer ? 'Plătitor TVA (RO)' : 'Neplătitor TVA'}
                      </span>
                    )}
                  </div>
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
                  {isOnline ? (isDemo ? 'Cont Online (Trial 15 Zile)' : 'Abonament Online Activ') : 'Client Creat Manual (Fără facturare online)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Salariați</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeTenant.total_employees_count != null ? activeTenant.total_employees_count : (activeTenant.active_employees_count || 0)} angajați ({activeTenant.active_employees_count || 0} activi)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tarifare Lunar</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {parseFloat(activeTenant.price_per_employee || 0).toFixed(2)} € / angajat
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Valabilitate</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {isOnline ? (expiresDate ? `până la ${expiresDate}` : 'Nelimitat') : 'Nelimitat (Permanent)'}
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 font-bold text-xs transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              <ExternalLink size={14} className="shrink-0" />
              <span>Deschide Panoul de Administrare ({activeTenant.subdomain}.qr.pontaj.app)</span>
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
  const [selectedTenantForStatus, setSelectedTenantForStatus] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleToggleTenantStatus = async (tenant, targetStatus) => {
    setStatusUpdating(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/tenants/${tenant.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la actualizarea statusului');
      }
      setData(prev => prev.map(t => t.id === tenant.id ? { ...t, subscription_status: targetStatus } : t));
      setSelectedTenantForStatus(null);
      setToastMessage({
        type: 'success',
        text: targetStatus === 'SUSPENDED'
          ? `Compania "${tenant.nume}" a fost suspendată. Accesul utilizatorilor și pontajul sunt oprite.`
          : `Accesul pentru compania "${tenant.nume}" a fost reactivat cu succes.`
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Eroare la modificarea statusului'
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setStatusUpdating(false);
    }
  };

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
        const isLocal = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1';
        const port = window.location.port ? `:${window.location.port}` : '';
        const tenantBase = isLocal ? `${row.subdomain}.localhost${port}` : `${row.subdomain}.qr.pontaj.app`;
        const adminUrl = isLocal ? `http://${tenantBase}/admin/login` : `https://${tenantBase}/admin/login`;
        
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
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap shrink-0 ${
                  row.cui.startsWith('RO') || row.is_vat_payer
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {row.cui.startsWith('RO') ? row.cui : (row.is_vat_payer ? `RO${row.cui}` : row.cui)}
                </span>
              )}
            </div>
            <a 
              href={adminUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <span>{row.subdomain}.qr.pontaj.app</span>
              <ExternalLink size={10} />
            </a>
          </div>
        );
      }
    },
    {
      key: 'employees',
      label: 'Angajați',
      render: (row) => {
        const total = row.total_employees_count != null ? parseInt(row.total_employees_count, 10) : (row.active_employees_count || 0);
        const active = row.active_employees_count != null ? parseInt(row.active_employees_count, 10) : 0;
        const archived = Math.max(0, total - active);

        return (
          <div className="flex flex-col gap-0.5 whitespace-nowrap shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 w-fit ${
              total > 0
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              <Users size={12} className="shrink-0" />
              <span>{total} {total === 1 ? 'angajat' : 'angajați'}</span>
            </span>
            {archived > 0 ? (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {active} activi &bull; {archived} arhivați
              </span>
            ) : total > 0 ? (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {active} activi
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 italic whitespace-nowrap">
                fără salariați
              </span>
            )}
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

        const loginUrl = `https://qr.pontaj.app/login?tenant=${row.subdomain}${row.contact_email ? `&email=${encodeURIComponent(row.contact_email)}` : ''}`;
        const waRowMessage = encodeURIComponent(
          `Bună ziua, ${row.contact_name || row.nume}!\n\n` +
          `Iată linkul de conectare la panoul dvs. de administrare Pontaj.app:\n` +
          `Link: ${loginUrl}\n` +
          (row.contact_email ? `Email: ${row.contact_email}\n` : '') +
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
        const isOnline = Boolean(row.is_online_registration || row.terms_accepted_at);
        const isSuspended = row.subscription_status === 'SUSPENDED';
        const isDemo = isOnline && (row.subscription_status === 'DEMO' || !row.subscription_status);
        const isDemoExpired = isDemo && row.demo_expires_at && new Date(row.demo_expires_at) < new Date();
        const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }) : '—';
        const demoExpiresStr = row.demo_expires_at ? new Date(row.demo_expires_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }) : null;

        if (isSuspended) {
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap shrink-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit whitespace-nowrap shrink-0 bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                SUSPENDAT
              </span>
              <span className="text-[10px] text-rose-500 font-medium whitespace-nowrap">
                Acces blocat
              </span>
            </div>
          );
        }

        if (isDemoExpired) {
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap shrink-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit whitespace-nowrap shrink-0 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                DEMO EXPIRAT
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                Expirat {demoExpiresStr}
              </span>
            </div>
          );
        }

        if (isDemo) {
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap shrink-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                DEMO
              </span>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {demoExpiresStr ? `expiră ${demoExpiresStr}` : dateStr}
              </span>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-0.5 whitespace-nowrap shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit whitespace-nowrap shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {isOnline ? 'ACTIV' : 'MANUAL'}
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
                    if (!e.currentTarget.src.includes('/logo_default_tenant.png')) {
                      e.currentTarget.src = '/logo_default_tenant.png';
                    }
                  }}
                />
              </div>
            ) : (
              <div 
                className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 bg-white shadow-xs overflow-hidden flex items-center justify-center shrink-0"
                title="Logo Implicit (QR Pontaj)"
              >
                <img 
                  src="/logo_default_tenant.png" 
                  alt="QR Pontaj" 
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
              {row.subscription_seats || 10} locuri ({row.total_employees_count || row.active_employees_count || 0} angajați)
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 whitespace-nowrap w-max shrink-0">
              Standard / Fix
            </span>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {row.total_employees_count || row.active_employees_count || 0} angajați înregistrați
            </span>
          </div>
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
            className="w-7 h-7 flex items-center justify-center rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer shrink-0"
            onClick={() => setSelectedTenantForAdmins(row)}
            title="Admini & Parole (Useri)"
          >
            <Users size={13} strokeWidth={2.2} />
          </button>
          {row.subscription_status === 'SUSPENDED' ? (
            <button 
              className="w-7 h-7 flex items-center justify-center rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer shrink-0"
              onClick={() => setSelectedTenantForStatus({
                tenant: row,
                targetStatus: (row.demo_expires_at && new Date(row.demo_expires_at) > new Date()) ? 'DEMO' : 'ACTIVE'
              })}
              title="Activează accesul companiei"
            >
              <Power size={13} strokeWidth={2.4} />
            </button>
          ) : (
            <button 
              className="w-7 h-7 flex items-center justify-center rounded-full border border-rose-200 dark:border-rose-800/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer shrink-0"
              onClick={() => setSelectedTenantForStatus({
                tenant: row,
                targetStatus: 'SUSPENDED'
              })}
              title="Suspendă manual accesul (blochează login & pontaj)"
            >
              <PowerOff size={13} strokeWidth={2.2} />
            </button>
          )}
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
          title="Tenanți Activi & Trial"
          data={data}
          columns={columns}
          searchPlaceholder="Caută după companie, contact, telefon, CUI..."
          headerActions={
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap shrink-0">
                {data.length} conturi
              </span>
              <button
                onClick={() => setActiveTab('harvey')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border border-blue-200 dark:border-blue-800"
              >
                <Sparkles size={14} className="shrink-0" />
                <span>Harvey AI ({harveyCount})</span>
              </button>
              <button 
                onClick={() => {
                  setSelectedTenantForEdit(null);
                  setInitialLeadForCreate(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center px-4 py-2 text-xs rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
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
        onManageAdmins={(t) => {
          setSelectedTenantForDetails(null);
          setSelectedTenantForAdmins(t);
        }}
      />

      {/* Modal Confirmare Suspendare / Activare Manuală Tenant */}
      {selectedTenantForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  selectedTenantForStatus.targetStatus === 'SUSPENDED'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}>
                  {selectedTenantForStatus.targetStatus === 'SUSPENDED' ? (
                    <PowerOff size={20} />
                  ) : (
                    <Power size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {selectedTenantForStatus.targetStatus === 'SUSPENDED'
                      ? 'Suspendare Acces Companie'
                      : 'Activare Acces Companie'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedTenantForStatus.tenant.nume}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenantForStatus(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedTenantForStatus.targetStatus === 'SUSPENDED' ? (
                <>
                  Ești sigur că vrei să suspenzi accesul companiei <strong className="text-slate-900 dark:text-white">{selectedTenantForStatus.tenant.nume}</strong>?
                  <div className="mt-2 text-rose-600 dark:text-rose-400 font-semibold space-y-1">
                    <div>&bull; Administratorii companiei nu se vor mai putea conecta la platformă.</div>
                    <div>&bull; Pontajele angajaților la Kiosk vor fi oprite temporar.</div>
                    <div>&bull; Poți reactiva accesul oricând dintr-un singur clic.</div>
                  </div>
                </>
              ) : (
                <>
                  Vrei să reactivezi accesul pentru compania <strong className="text-slate-900 dark:text-white">{selectedTenantForStatus.tenant.nume}</strong>?
                  <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold space-y-1">
                    <div>&bull; Administratorii se vor putea autentifica din nou în panoul de control.</div>
                    <div>&bull; Pontajele angajaților vor funcționa normal.</div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => setSelectedTenantForStatus(null)}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleToggleTenantStatus(selectedTenantForStatus.tenant, selectedTenantForStatus.targetStatus)}
                className={`px-5 py-2 rounded-full text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 ${
                  selectedTenantForStatus.targetStatus === 'SUSPENDED'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusUpdating && <RefreshCw size={13} className="animate-spin" />}
                <span>
                  {selectedTenantForStatus.targetStatus === 'SUSPENDED'
                    ? (statusUpdating ? 'Se suspendă...' : 'Confirmă Suspendarea')
                    : (statusUpdating ? 'Se activează...' : 'Activează Accesul')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificare Feedback Acțiuni */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-300 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800'
            : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </>
  );
}
