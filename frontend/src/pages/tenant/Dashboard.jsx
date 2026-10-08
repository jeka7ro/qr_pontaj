import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  QrCode, Users, LogOut, Menu, X, Info, MapPin, Sun, Moon, CreditCard, 
  CalendarDays, FileSpreadsheet, Globe, Map, BookOpenCheck, Calculator, 
  CalendarClock, ScanFace, MessageSquare, Wrench, Table, ChevronDown,
  Bell, LogIn, Briefcase, Clock, User, PanelLeftClose, PanelLeftOpen, ChevronRight, Settings,
  Activity
} from 'lucide-react';
import TenantSettingsModal from '../../components/TenantSettingsModal';

const getAvatarUrl = (avatarPath, firstName, lastName) => {
  if (avatarPath && !avatarPath.includes('default-avatar')) {
    if (avatarPath.startsWith('http')) return avatarPath;
    const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
    return `${baseUrl}${avatarPath}`;
  }
  return null;
};
import EmployeesList from '../../components/EmployeesList';
import TimesheetReport from '../../components/TimesheetReport';
import DashboardCharts from '../../components/DashboardCharts';
import EmployeeProfile from '../../components/EmployeeProfile';
import LocationsList from '../../components/LocationsList';
import UpsellLock from '../../components/UpsellLock';
import QrSelector from './QrSelector';
import RolesList from './RolesList';
import ShiftsModule from './shifts/ShiftsModule';
import LeavesModule from './leaves/LeavesModule';
import SagaModule from './saga/SagaModule';
import GeofenceModule from './geofence/GeofenceModule';
import OfflineModule from './offline/OfflineModule';
import BillingModule from './billing/BillingModule';
import RevisalModule from './revisal/RevisalModule';
import ErpModule from './erp/ErpModule';
import FaceRecognitionModule from './face_recognition/FaceRecognitionModule';
import WhatsappModule from './whatsapp/WhatsappModule';
import AssetsModule from './assets/AssetsModule';
import TenantLogsModule from './logs/TenantLogsModule';
import { QRCodeSVG } from 'qrcode.react';
import { updatePageFavicon } from '../../utils/favicon';
import LanguageToggle from '../../components/LanguageToggle';
import { useTranslation } from '../../utils/i18n.jsx';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('tenant_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('tenant_sidebar_collapsed', String(next));
      return next;
    });
  };
  const [pendingNotifs, setPendingNotifs] = useState([]);
  const [dismissedNotifs, setDismissedNotifs] = useState(new Set());
  const [shiftsExpanded, setShiftsExpanded] = useState(() => location.pathname.startsWith('/admin/shifts'));
  const [liveScans, setLiveScans] = useState([]);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/shifts')) {
      setShiftsExpanded(true);
    }
  }, [location.pathname]);

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

  // Sincronizare limbă pe baza țării tenantului dacă utilizatorul nu a ales manual altceva
  useEffect(() => {
    if (tenantInfo?.tenant) {
      const country = (tenantInfo.tenant.country_code || 'RO').toUpperCase();
      const explicit = localStorage.getItem('app_language_explicit');
      if (explicit !== 'true') {
        const defaultLang = country === 'BE' ? 'nl' : 'ro';
        setLanguage(defaultLang, false);
      }
    }
  }, [tenantInfo, setLanguage]);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin/login');
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenant/dashboard/info`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 401 || res.status === 403) {
          localStorage.clear();
          navigate('/admin/login');
          return;
        }
        
        if (!res.ok) throw new Error('Eroare la preluarea datelor companiei');
        
        const data = await res.json();
        setTenantInfo(data);
        
        // Dacă e setată culoarea, o aplicăm global pentru acest dashboard
        if (data.tenant?.theme_color) {
          document.documentElement.style.setProperty('--color-tenant-theme', data.tenant.theme_color);
        }

        // Aplicăm Favicon-ul specific tenantului și titlul paginii
        if (data.tenant?.favicon_url || data.tenant?.logo_url) {
          updatePageFavicon(data.tenant.favicon_url || data.tenant.logo_url, `${data.tenant.name || 'QR Pontaj'} - Panou Administrare`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInfo();
  }, [navigate]);


  useEffect(() => {
    if (!tenantInfo?.tenant?.id) return;
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenant/dashboard/pending-notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPendingNotifs(data);
        }
      } catch (err) {
        console.error('Error fetching notifications', err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [tenantInfo?.tenant?.id]);

  
  useEffect(() => {
    if (!tenantInfo?.tenant?.id) return;
    const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
    const evtSource = new EventSource(`${baseUrl}/api/scan/admin-stream/${tenantInfo.tenant.id}`);
    
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'connected') return;
        
        // Add new scan to state
        const newScan = { ...data, id: Date.now() };
        setLiveScans(prev => [newScan, ...prev].slice(0, 5)); // pastram max 5 popups
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
          setLiveScans(prev => prev.filter(s => s.id !== newScan.id));
        }, 8000);
      } catch(e) {}
    };

    return () => evtSource.close();
  }, [tenantInfo?.tenant?.id]);

  const dismissNotif = (id) => {
    setDismissedNotifs(prev => new Set(prev).add(id));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-600 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">{t('loadingControlPanel')}</p>
      </div>
    );
  }

  if (error || !tenantInfo?.tenant) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('accessError')}</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{error || 'Nu am putut încărca datele tenantului.'}</p>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 rounded-full transition-colors"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  const { tenant, site } = tenantInfo;
  
  // Utilizăm culoarea temei dacă este definită, altfel folosim blue-600 standard
  const themeColor = tenant.theme_color || '#2563EB';
  const qrUrl = site ? `https://scan.pontaj.app/s/${site.id}` : window.location.origin;

  const isColorDark = (hex) => {
    if (!hex || typeof hex !== 'string') return true;
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    const r = parseInt(full.substring(0, 2), 16) || 0;
    const g = parseInt(full.substring(2, 4), 16) || 0;
    const b = parseInt(full.substring(4, 6), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 < 130;
  };

  const getNavStyle = (isActive) => {
    if (!isActive) return {};
    if (isDarkMode) {
      return {
        backgroundColor: isColorDark(themeColor) ? 'rgba(255, 255, 255, 0.12)' : `${themeColor}35`,
        color: '#ffffff'
      };
    }
    return {
      backgroundColor: `${themeColor}15`,
      color: themeColor
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 transform transition-all duration-300 ease-in-out md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 transition-all duration-300 relative ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          {sidebarCollapsed ? (
            /* Collapsed State: Logo 100% centrat, fără nicio tăiere */
            <div className="flex items-center justify-center w-full relative">
              {tenant.logo_url ? (
                <div 
                  onClick={toggleSidebarCollapsed}
                  className="h-10 w-10 shrink-0 bg-slate-800 dark:bg-transparent rounded-lg flex items-center justify-center p-1 shadow-sm border border-slate-700/50 cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" 
                  title={`${tenant.name} — Apasă pentru a extinde meniul`}
                >
                  <img src={tenant.logo_url} alt={tenant.name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                </div>
              ) : (
                <div 
                  onClick={toggleSidebarCollapsed}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-xs cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all shadow-sm"
                  style={{ backgroundColor: themeColor }}
                  title={`${tenant.name} — Apasă pentru a extinde meniul`}
                >
                  {tenant.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              {/* Buton discret plutitor pe marginea sidebar-ului */}
              <button 
                onClick={toggleSidebarCollapsed}
                className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all z-50 cursor-pointer hover:scale-110"
                title="Extinde meniul"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          ) : (
            /* Expanded State: Logo complet + Nume stânga, Butoane acțiuni dreapta */
            <>
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                {tenant.logo_url ? (
                  <div className="h-10 w-10 shrink-0 bg-slate-800 dark:bg-transparent rounded-lg flex items-center justify-center p-1 shadow-sm border border-slate-700/50" title={tenant.name}>
                    <img src={tenant.logo_url} alt={tenant.name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                  </div>
                ) : (
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-xs shadow-sm"
                    style={{ backgroundColor: themeColor }}
                    title={tenant.name}
                  >
                    {tenant.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-slate-800 dark:text-white truncate" title={tenant.name}>{tenant.name}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={toggleSidebarCollapsed}
                  className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none cursor-pointer"
                  title="Micșorează meniul"
                >
                  <PanelLeftClose size={18} />
                </button>
                <button className="md:hidden text-slate-400 hover:text-slate-600 dark:text-slate-300 p-1 cursor-pointer" onClick={() => setSidebarOpen(false)}>
                  <X size={20} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${sidebarCollapsed ? 'md:px-2 px-4' : 'px-4'} py-6 space-y-2 overflow-y-auto overflow-x-hidden`}>
          <Link 
            to="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            title={t('dashboard')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
              ${location.pathname === '/admin/dashboard' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
            style={getNavStyle(location.pathname === '/admin/dashboard')}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </div>
            <span className={`${sidebarCollapsed ? 'md:hidden' : ''} truncate`}>{t('dashboard')}</span>
          </Link>
          
          <Link 
            to="/admin/timesheets"
            onClick={() => setSidebarOpen(false)}
            title={t('timesheets')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
              ${location.pathname === '/admin/timesheets' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
            style={getNavStyle(location.pathname === '/admin/timesheets')}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <span className={`${sidebarCollapsed ? 'md:hidden' : ''} truncate`}>{t('timesheets')}</span>
          </Link>

          <Link 
            to="/admin/logs"
            onClick={() => setSidebarOpen(false)}
            title={t('activityLogs')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
              ${location.pathname === '/admin/logs' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
            style={getNavStyle(location.pathname === '/admin/logs')}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Activity size={18} />
            </div>
            <span className={`${sidebarCollapsed ? 'md:hidden' : ''} truncate`}>{t('activityLogs')}</span>
          </Link>
          
          <Link 
            to="/admin/employees"
            onClick={() => setSidebarOpen(false)}
            title={t('employees')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
              ${location.pathname.startsWith('/admin/employees') ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
            style={getNavStyle(location.pathname.startsWith('/admin/employees'))}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <span className={`${sidebarCollapsed ? 'md:hidden' : ''} truncate`}>{t('employees')}</span>
          </Link>

          <Link 
            to="/admin/locations"
            onClick={() => setSidebarOpen(false)}
            title={t('locations')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
              ${location.pathname === '/admin/locations' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
            style={getNavStyle(location.pathname === '/admin/locations')}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <span className={`${sidebarCollapsed ? 'md:hidden' : ''} truncate`}>{t('locations')}</span>
          </Link>

          <Link 
            to="/admin/qr"
            onClick={() => setSidebarOpen(false)}
            title={t('kiosks')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
              ${location.pathname === '/admin/qr' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
            style={getNavStyle(location.pathname === '/admin/qr')}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <QrCode size={18} />
            </div>
            <span className={`${sidebarCollapsed ? 'md:hidden' : ''} truncate`}>{t('kiosks')}</span>
          </Link>

          {tenant.modules?.shifts && (
            <div className="space-y-1">
              <button
                type="button"
                title={t('shifts')}
                onClick={() => {
                  if (sidebarCollapsed) {
                    navigate('/admin/shifts');
                    setSidebarOpen(false);
                  } else {
                    if (!location.pathname.startsWith('/admin/shifts')) {
                      navigate('/admin/shifts');
                    }
                    setShiftsExpanded(!shiftsExpanded);
                  }
                }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4 justify-between' : 'justify-between px-4'} py-3 rounded-full transition-all font-medium text-sm text-left
                  ${location.pathname.startsWith('/admin/shifts') ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
                style={location.pathname.startsWith('/admin/shifts') ? getNavStyle(true) : {}}
              >
                <div className={`flex items-center ${sidebarCollapsed ? 'md:justify-center gap-3' : 'gap-3'}`}>
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <CalendarClock size={18} />
                  </div>
                  <span className={`${sidebarCollapsed ? 'md:hidden' : ''} truncate`}>{t('shifts')}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`${sidebarCollapsed ? 'md:hidden' : ''} transition-transform duration-200 ${shiftsExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {shiftsExpanded && !sidebarCollapsed && (
                <div className="pl-4 pr-1 py-1 space-y-1">
                  <Link 
                    to="/admin/shifts/planner"
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full transition-colors text-xs font-semibold
                      ${(location.pathname === '/admin/shifts' || location.pathname === '/admin/shifts/planner') ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'}`}
                    style={getNavStyle(location.pathname === '/admin/shifts' || location.pathname === '/admin/shifts/planner')}
                  >
                    <CalendarClock size={14} />
                    <span>{t('dailyPlanner')}</span>
                  </Link>

                  <Link 
                    to="/admin/shifts/table"
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full transition-colors text-xs font-semibold
                      ${location.pathname === '/admin/shifts/table' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white'}`}
                    style={getNavStyle(location.pathname === '/admin/shifts/table')}
                  >
                    <Table size={14} />
                    <span>{t('shiftsTable')}</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {tenant.modules?.leaves && (
            <Link 
              to="/admin/leaves"
              onClick={() => setSidebarOpen(false)}
              title={t('leaveRequests')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/leaves' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/leaves')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <CalendarDays size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('leaveRequests')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.export_saga && (
            <Link 
              to="/admin/export"
              onClick={() => setSidebarOpen(false)}
              title={t('sagaExport')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/export' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/export')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('sagaExport')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.geofence && (
            <Link 
              to="/admin/geofence"
              onClick={() => setSidebarOpen(false)}
              title={t('geofence')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/geofence' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/geofence')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Map size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('geofence')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}
          
          {tenant.modules?.offline && (
            <Link 
              to="/admin/offline"
              onClick={() => setSidebarOpen(false)}
              title={t('offlineMode')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/offline' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/offline')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Globe size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('offlineMode')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.billing && (
            <Link 
              to="/admin/billing"
              onClick={() => setSidebarOpen(false)}
              title={t('billing')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/billing' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/billing')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <CreditCard size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('billing')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.revisal && (
            <Link 
              to="/admin/revisal"
              onClick={() => setSidebarOpen(false)}
              title={t('revisal')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/revisal' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/revisal')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <BookOpenCheck size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('revisal')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.erp && (
            <Link 
              to="/admin/erp"
              onClick={() => setSidebarOpen(false)}
              title={t('erp')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/erp' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/erp')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Calculator size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('erp')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.face_recognition && (
            <Link 
              to="/admin/face"
              onClick={() => setSidebarOpen(false)}
              title={t('faceRecognition')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/face' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/face')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <ScanFace size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('faceRecognition')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.whatsapp && (
            <Link 
              to="/admin/whatsapp"
              onClick={() => setSidebarOpen(false)}
              title={t('whatsappAlerts')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/whatsapp' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/whatsapp')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <MessageSquare size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('whatsappAlerts')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          {tenant.modules?.assets && (
            <Link 
              to="/admin/assets"
              onClick={() => setSidebarOpen(false)}
              title={t('assets')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm
                ${location.pathname === '/admin/assets' ? 'font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white'}`}
              style={getNavStyle(location.pathname === '/admin/assets')}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Wrench size={18} />
              </div>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('assets')}</span>
              <span className={`${sidebarCollapsed ? 'md:hidden' : ''} text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-sm tracking-wide shrink-0`} style={{ backgroundColor: themeColor }}>PRO</span>
            </Link>
          )}

          <button 
            type="button"
            onClick={() => { setSidebarOpen(false); setSettingsModalOpen(true); }}
            title={t('companySettings')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'md:justify-center md:px-0 gap-3 px-4' : 'gap-3 px-4'} py-3 rounded-full transition-all font-medium text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-800 dark:hover:text-white cursor-pointer`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Settings size={18} />
            </div>
            <span className={`${sidebarCollapsed ? 'md:hidden' : ''} flex-1 text-left truncate`}>{t('companySettings')}</span>
          </button>
        </nav>

        {/* Sidebar Footer Toggle Controls */}
        <div className="border-t border-slate-100 dark:border-slate-700/50 hidden md:block">
          {sidebarCollapsed ? (
            <div className="p-2 flex flex-col items-center">
              <button
                onClick={toggleSidebarCollapsed}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none cursor-pointer"
                title={t('expandMenu')}
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          ) : (
            <div className="p-3">
              <button
                onClick={toggleSidebarCollapsed}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-white transition-colors"
                title={t('collapseMenu')}
              >
                <span className="flex items-center gap-2">
                  <PanelLeftClose size={16} />
                  <span>{t('collapseMenu')}</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Desktop Header Bar with Language Selector */}
        <header className="hidden md:flex h-16 bg-white dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700/80 items-center justify-between px-6 shrink-0 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 dark:text-white text-base tracking-tight">{tenant.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle countryCode={tenant?.country_code} />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <button 
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
              title={t('companySettings')}
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
              title={t('themeToggle')}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none"
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0 md:hidden z-10 transition-colors">
          <div className="flex items-center gap-2">
            <button className="p-2 -ml-2 text-slate-500 dark:text-slate-400" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle countryCode={tenant?.country_code} variant="compact" />
            <button 
              onClick={() => setSettingsModalOpen(true)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
              title={t('companySettings')}
            >
              <Settings size={18} />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
              title={t('themeToggle')}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none"
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 transition-colors">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            
            <Route path="dashboard" element={
              <DashboardCharts tenant={tenant} themeColor={themeColor} />
            } />
            
            <Route path="timesheets" element={
              <div className="w-full">
                <TimesheetReport tenant={tenant} themeColor={themeColor} />
              </div>
            } />

            <Route path="logs" element={
              <div className="w-full">
                <TenantLogsModule tenant={tenant} themeColor={themeColor} />
              </div>
            } />

            <Route path="employees" element={
              <div className="w-full">
                <div className="mb-6 flex gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap pb-0.5">
                  <Link 
                    to="/admin/employees"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:text-slate-300'}`}
                  >
                    {t('employeesTab')}
                  </Link>
                  <Link 
                    to="/admin/employees/roles"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees/roles' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:text-slate-300'}`}
                  >
                    {t('rolesTab')}
                  </Link>
                </div>
                <EmployeesList tenant={tenant} themeColor={themeColor} />
              </div>
            } />

            <Route path="employees/roles" element={
              <div className="w-full">
                <div className="mb-6 flex gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap pb-0.5">
                  <Link 
                    to="/admin/employees"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:text-slate-300'}`}
                  >
                    {t('employeesTab')}
                  </Link>
                  <Link 
                    to="/admin/employees/roles"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees/roles' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:text-slate-300'}`}
                  >
                    {t('rolesTab')}
                  </Link>
                </div>
                <RolesList tenant={tenant} themeColor={themeColor} />
              </div>
            } />

            <Route path="employees/:id" element={
              <EmployeeProfile tenant={tenant} themeColor={themeColor} />
            } />

            <Route path="locations" element={
              <LocationsList tenant={tenant} themeColor={themeColor} />
            } />

            <Route path="qr" element={
              <div className="w-full">
                <QrSelector tenant={tenant} themeColor={themeColor} />
              </div>
            } />
            
            <Route path="leaves" element={
              tenant.modules?.leaves ? (
                <div className="w-full">
                  <LeavesModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Zile Libere (CO/CM)" description="Gestionează concediile de odihnă și medicale ale angajaților direct din platformă." themeColor={themeColor} />
              )
            } />

            <Route path="export" element={
              tenant.modules?.export_saga ? (
                <div className="w-full">
                  <SagaModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Export Conta (SAGA)" description="Generează automat fișierele de import pentru programul de contabilitate SAGA C." themeColor={themeColor} />
              )
            } />

            <Route path="geofence" element={
              tenant.modules?.geofence ? (
                <div className="w-full">
                  <GeofenceModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Hartă Geofence" description="Trasează limitele perimetrului de pontaj direct pe hartă cu precizie maximă." themeColor={themeColor} />
              )
            } />

            <Route path="offline" element={
              tenant.modules?.offline ? (
                <div className="w-full">
                  <OfflineModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Mod Offline (Reziliență)" description="Permite tabletei să rețină scanările chiar și atunci când pică conexiunea la internet." themeColor={themeColor} />
              )
            } />

            <Route path="billing" element={
              tenant.modules?.billing ? (
                <div className="w-full">
                  <BillingModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Abonament & Facturi" description="Descarcă facturile și gestionează abonamentul firmei." themeColor={themeColor} />
              )
            } />

            <Route path="revisal" element={
              tenant.modules?.revisal ? (
                <div className="w-full">
                  <RevisalModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Integrare REVISAL" description="Generează automat fișierul XML compatibil cu portalul Inspecției Muncii (Revisal)." themeColor={themeColor} />
              )
            } />

            <Route path="erp" element={
              tenant.modules?.erp ? (
                <div className="w-full">
                  <ErpModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Modul ERP & Contracte Comerciale" description="Alocă centre de cost per proiect și înregistrează contractele clienților." themeColor={themeColor} />
              )
            } />

            <Route path="shifts/*" element={
              tenant.modules?.shifts ? (
                <div className="w-full">
                  <ShiftsModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Planificator de Ture" description="Asignează angajații pe schimburi (tura de zi/noapte). Primește alerte dacă o persoană programată nu s-a pontat la timp." themeColor={themeColor} />
              )
            } />

            <Route path="face" element={
              tenant.modules?.face_recognition ? (
                <div className="w-full">
                  <FaceRecognitionModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Recunoaștere Facială" description="Folosește AI pentru a scana fața angajatului la pontaj și elimină complet frauda ('pontatul pentru colegi')." themeColor={themeColor} />
              )
            } />

            <Route path="whatsapp" element={
              tenant.modules?.whatsapp ? (
                <div className="w-full">
                  <WhatsappModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Alerte WhatsApp & SMS" description="Fii notificat instant pe telefon dacă un angajat întârzie sau părăsește locația mai repede." themeColor={themeColor} />
              )
            } />

            <Route path="assets" element={
              tenant.modules?.assets ? (
                <div className="w-full">
                  <AssetsModule tenant={tenant} themeColor={themeColor} />
                </div>
              ) : (
                <UpsellLock title="Gestiune Echipamente & Chei" description="Asociază uneltele și cheile de la mașini cu angajatul curent scanând simplu un cod QR." themeColor={themeColor} />
              )
            } />

          </Routes>
        </main>
      </div>

      {/* Notificari Popup Live Activitate (Pontaj / Autentificare / Deconectare) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full sm:w-[360px]">
        {liveScans.map((scan) => {
          const emp = scan.employee || {};
          const isEntry = scan.type === 'IN' || scan.type === 'LOGIN';
          const isExit = scan.type === 'OUT' || scan.type === 'LOGOUT';
          
          let actionLabel = t('scanRecorded');
          let actionColor = 'text-slate-600 dark:text-slate-300';
          let badgeBg = 'bg-slate-600';
          if (scan.type === 'IN') {
            actionLabel = t('clockInRecorded');
            actionColor = 'text-emerald-600 dark:text-emerald-400';
            badgeBg = 'bg-emerald-500';
          } else if (scan.type === 'OUT') {
            actionLabel = t('clockOutRecorded');
            actionColor = 'text-amber-600 dark:text-amber-400';
            badgeBg = 'bg-amber-500';
          } else if (scan.type === 'LOGIN') {
            actionLabel = t('userLoggedInApp');
            actionColor = 'text-blue-600 dark:text-blue-400';
            badgeBg = 'bg-blue-500';
          } else if (scan.type === 'LOGOUT') {
            actionLabel = t('userLoggedOutApp');
            actionColor = 'text-slate-500 dark:text-slate-400';
            badgeBg = 'bg-slate-500';
          }

          const avatarSrc = getAvatarUrl(emp.avatar_path, emp.first_name, emp.last_name);
          const locale = language === 'nl' ? 'nl-BE' : language === 'fr' ? 'fr-BE' : language === 'en' ? 'en-US' : 'ro-RO';
          const timeStr = new Date(scan.timestamp || Date.now()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div 
              key={scan.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 pointer-events-auto flex items-center gap-3.5 animate-in slide-in-from-top-4 fade-in duration-200 transition-all hover:scale-[1.01]"
            >
              {/* Avatar cu badge de acțiune */}
              <div className="relative shrink-0">
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    alt="" 
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm shadow-xs"
                  style={avatarSrc ? { display: 'none' } : {}}
                >
                  {emp.first_name?.[0] || '?'}{emp.last_name?.[0] || ''}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900 ${badgeBg}`}>
                  {isEntry ? <LogIn size={10} /> : <LogOut size={10} />}
                </span>
              </div>

              {/* Informații Angajat & Rol & Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {emp.first_name || 'Angajat'} {emp.last_name || ''}
                  </h4>
                  <button 
                    onClick={() => setLiveScans(prev => prev.filter(s => s.id !== scan.id))} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-1 transition-colors"
                    title={t('close')}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <Briefcase size={12} className="shrink-0 text-slate-400" />
                  <span className="truncate font-medium">{emp.job_title || t('noRole')}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className={`font-bold flex items-center gap-1 ${actionColor}`}>
                    {actionLabel}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock size={10} />
                    {timeStr}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notificari Popup */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {pendingNotifs && pendingNotifs.filter(n => !dismissedNotifs.has(n.id)).map(notif => (
          <div key={notif.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 max-w-sm w-[350px] pointer-events-auto flex gap-3 animate-in slide-in-from-right-8 fade-in">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                  {notif.leave_type === 'SHIFT_CHANGE' ? t('shiftChangeRequest') : t('leaveRequestNotif')}
                </h4>
                <button onClick={() => dismissNotif(notif.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                <span className="font-bold">{notif.first_name} {notif.last_name}</span>: {notif.reason || t('noReasonSpecified')}
              </p>
              <button 
                onClick={() => { dismissNotif(notif.id); navigate('/admin/leaves'); }}
                className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg w-full transition-colors"
              >
                {t('viewRequest')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <TenantSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        tenant={tenant}
        onUpdateTenant={(updated) => {
          setTenantInfo(prev => ({ ...prev, ...updated }));
        }}
      />

    </div>
  );
}
