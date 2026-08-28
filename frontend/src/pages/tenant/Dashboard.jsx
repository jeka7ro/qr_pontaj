import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Link, Navigate } from 'react-router-dom';
import { QrCode, Users, LogOut, Menu, X, Info, MapPin, Sun, Moon, CreditCard, CalendarDays, FileSpreadsheet, Globe, Map, BookOpenCheck, Calculator, CalendarClock, ScanFace, MessageSquare, Wrench } from 'lucide-react';
import EmployeesList from '../../components/EmployeesList';
import TimesheetReport from '../../components/TimesheetReport';
import DashboardCharts from '../../components/DashboardCharts';
import EmployeeProfile from '../../components/EmployeeProfile';
import LocationsList from '../../components/LocationsList';
import UpsellLock from '../../components/UpsellLock';
import QrSelector from './QrSelector';
import RolesList from './RolesList';
import { QRCodeSVG } from 'qrcode.react';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    const fetchInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Nu ești autentificat');

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInfo();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Se încarcă panoul de control...</p>
      </div>
    );
  }

  if (error || !tenantInfo?.tenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Eroare de acces</h2>
          <p className="text-slate-600 mb-6">{error || 'Nu am putut încărca datele tenantului.'}</p>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 rounded-full transition-colors"
          >
            Înapoi la Login
          </button>
        </div>
      </div>
    );
  }

  const { tenant, site } = tenantInfo;
  
  // Utilizăm culoarea temei dacă este definită, altfel folosim blue-600 standard
  const themeColor = tenant.theme_color || '#2563EB';
  const qrUrl = site ? `https://scan.pontaj.app/s/${site.id}` : window.location.origin;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {tenant.logo_url ? (
              <div className="h-10 w-10 shrink-0 bg-slate-800 dark:bg-transparent rounded-lg flex items-center justify-center p-1 shadow-sm border border-slate-700/50">
                <img src={tenant.logo_url} alt={tenant.name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
              </div>
            ) : (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: themeColor }}
              >
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-slate-800 dark:text-white truncate" title={tenant.name}>{tenant.name}</span>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none hidden md:block"
            title="Comută tema"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="md:hidden text-slate-400 hover:text-slate-600" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link 
            to="/admin/dashboard"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/dashboard' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/dashboard' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            </div>
            Dashboard & Rapoarte
          </Link>
          
          <Link 
            to="/admin/timesheets"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/timesheets' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/timesheets' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            Rapoarte Pontaje
          </Link>
          
          <Link 
            to="/admin/employees"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname.startsWith('/admin/employees') ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname.startsWith('/admin/employees') ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <Users size={18} /> Modul HR (Angajați)
          </Link>

          <Link 
            to="/admin/locations"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/locations' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/locations' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <MapPin size={18} /> Puncte de Lucru
          </Link>

          <Link 
            to="/admin/qr"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/qr' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/qr' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <QrCode size={18} /> Afișaj Cod QR
          </Link>

          <Link 
            to="/admin/leaves"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/leaves' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/leaves' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <CalendarDays size={18} /> Zile Libere (CO/CM)
          </Link>

          <Link 
            to="/admin/export"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/export' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/export' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <FileSpreadsheet size={18} /> Export Conta (SAGA)
          </Link>

          <Link 
            to="/admin/geofence"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/geofence' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/geofence' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <Map size={18} /> Hartă Geofence
          </Link>
          
          <Link 
            to="/admin/offline"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/offline' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/offline' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <Globe size={18} /> Mod Offline
          </Link>

          <Link 
            to="/admin/billing"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/billing' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/billing' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <CreditCard size={18} /> Abonament & Facturi
          </Link>

          <Link 
            to="/admin/revisal"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/revisal' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/revisal' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <BookOpenCheck size={18} /> Integrare REVISAL
          </Link>

          <Link 
            to="/admin/erp"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/erp' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/erp' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <Calculator size={18} /> Gestiune & ERP
          </Link>

          <Link 
            to="/admin/shifts"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/shifts' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/shifts' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <CalendarClock size={18} /> Planificator Ture
          </Link>

          <Link 
            to="/admin/face"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/face' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/face' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <ScanFace size={18} /> Recunoaștere Facială
          </Link>

          <Link 
            to="/admin/whatsapp"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/whatsapp' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/whatsapp' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <MessageSquare size={18} /> Alerte WhatsApp
          </Link>

          <Link 
            to="/admin/assets"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm
              ${location.pathname === '/admin/assets' ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            style={location.pathname === '/admin/assets' ? { backgroundColor: `${themeColor}15`, color: themeColor } : {}}
          >
            <Wrench size={18} /> Gestiune Echipamente
          </Link>
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm font-bold"
          >
            <LogOut size={16} /> Deconectare
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0 md:hidden z-10 transition-colors">
          <div className="flex items-center gap-3">
            <button className="p-2 -ml-2 text-slate-500 dark:text-slate-400" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-800 dark:text-white">{tenant.name}</span>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900 transition-colors">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            
            <Route path="dashboard" element={
              <DashboardCharts tenant={tenant} themeColor={themeColor} />
            } />
            
            <Route path="timesheets" element={
              <div className="max-w-5xl mx-auto">
                <TimesheetReport tenant={tenant} themeColor={themeColor} />
              </div>
            } />

            <Route path="employees" element={
              <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex gap-4 border-b border-slate-200 dark:border-slate-700">
                  <Link 
                    to="/admin/employees"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Angajați
                  </Link>
                  <Link 
                    to="/admin/employees/roles"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees/roles' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Roluri (Funcții)
                  </Link>
                </div>
                <EmployeesList tenant={tenant} themeColor={themeColor} />
              </div>
            } />

            <Route path="employees/roles" element={
              <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex gap-4 border-b border-slate-200 dark:border-slate-700">
                  <Link 
                    to="/admin/employees"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Angajați
                  </Link>
                  <Link 
                    to="/admin/employees/roles"
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${location.pathname === '/admin/employees/roles' ? 'text-slate-800 dark:text-white border-slate-800 dark:border-white' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Roluri (Funcții)
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
              <div className="max-w-4xl mx-auto">
                <QrSelector tenant={tenant} themeColor={themeColor} />
              </div>
            } />
            
            <Route path="leaves" element={
              tenant.modules?.leaves ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Modulul Zile Libere este în dezvoltare.</div>
              ) : (
                <UpsellLock title="Zile Libere (CO/CM)" description="Gestionează concediile de odihnă și medicale ale angajaților direct din platformă." themeColor={themeColor} />
              )
            } />

            <Route path="export" element={
              tenant.modules?.export_saga ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Modulul Export SAGA este în dezvoltare.</div>
              ) : (
                <UpsellLock title="Export Conta (SAGA)" description="Generează automat fișierele de import pentru programul de contabilitate SAGA C." themeColor={themeColor} />
              )
            } />

            <Route path="geofence" element={
              tenant.modules?.geofence ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Modulul Hartă Geofence este în dezvoltare.</div>
              ) : (
                <UpsellLock title="Hartă Geofence" description="Trasează limitele perimetrului de pontaj direct pe hartă cu precizie maximă." themeColor={themeColor} />
              )
            } />

            <Route path="offline" element={
              tenant.modules?.offline ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Modulul Offline este în dezvoltare.</div>
              ) : (
                <UpsellLock title="Mod Offline (Reziliență)" description="Permite tabletei să rețină scanările chiar și atunci când pică conexiunea la internet." themeColor={themeColor} />
              )
            } />

            <Route path="billing" element={
              tenant.modules?.billing ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Modulul Facturare este în dezvoltare.</div>
              ) : (
                <UpsellLock title="Abonament & Facturi" description="Gestionează abonamentul firmei și descarcă facturile direct de aici." themeColor={themeColor} />
              )
            } />

            <Route path="revisal" element={
              tenant.modules?.revisal ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Integrare REVISAL în dezvoltare.</div>
              ) : (
                <UpsellLock title="Integrare API REVISAL" description="Sincronizează automat contractele de muncă și absențele cu baza de date a Inspecției Muncii." themeColor={themeColor} />
              )
            } />

            <Route path="erp" element={
              tenant.modules?.erp ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Modul ERP în dezvoltare.</div>
              ) : (
                <UpsellLock title="Modul ERP & Contracte" description="Asociază pontajul cu centre de cost, emite rapoarte de profitabilitate și atașează contracte comerciale pe fiecare punct de lucru." themeColor={themeColor} />
              )
            } />

            <Route path="shifts" element={
              tenant.modules?.shifts ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Planificator Ture în dezvoltare.</div>
              ) : (
                <UpsellLock title="Planificator de Ture" description="Asignează angajații pe schimburi (tura de zi/noapte). Primește alerte dacă o persoană programată nu s-a pontat la timp." themeColor={themeColor} />
              )
            } />

            <Route path="face" element={
              tenant.modules?.face_recognition ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Recunoaștere Facială în dezvoltare.</div>
              ) : (
                <UpsellLock title="Recunoaștere Facială (Biometrie AI)" description="Securitate supremă: la momentul scanării QR, tableta realizează o poză și validează fața angajatului folosind Inteligența Artificială." themeColor={themeColor} />
              )
            } />

            <Route path="whatsapp" element={
              tenant.modules?.whatsapp ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Alerte WhatsApp în dezvoltare.</div>
              ) : (
                <UpsellLock title="Notificări WhatsApp" description="Primește instant pe telefonul mobil (SMS sau WhatsApp) rapoartele de sfârșit de zi sau alertele privind orele suplimentare." themeColor={themeColor} />
              )
            } />

            <Route path="assets" element={
              tenant.modules?.assets ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">Gestiune Echipamente în dezvoltare.</div>
              ) : (
                <UpsellLock title="Gestiune Echipamente" description="Nu doar angajații se pontează. Urmărește cine a preluat tableta, bormașina sau mașina de serviciu și calculează costul de uzură." themeColor={themeColor} />
              )
            } />

          </Routes>
        </main>
      </div>
    </div>
  );
}
