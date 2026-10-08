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
  Activity
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ProfileModal from '../../components/ProfileModal';
import CreateTenantModal from '../../components/CreateTenantModal';
import TenantAdminsModal from '../../components/TenantAdminsModal';
import LoginLogs from './LoginLogs';
import BillingCalculator from './BillingCalculator';
import LanguageToggle from '../../components/LanguageToggle';
import { resolveFaviconUrl } from '../../utils/favicon';

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
    const syncSession = async () => {
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
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
    { name: 'Calcul Facturi', path: '/admin/billing', icon: Calculator },
    { name: 'Utilizatori Admin', path: '/admin/users', icon: Users },
    { name: 'Jurnal & Intervenții', path: '/admin/logs', icon: Activity },
    { name: 'Setări Platformă', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-64'} md:translate-x-0 md:static ${sidebarOpen ? 'md:w-64' : 'md:w-20'} md:shadow-none bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          {(sidebarOpen || window.innerWidth < 768) && <span className="font-bold text-lg text-slate-800 dark:text-white">SaaS Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-full transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
                {(sidebarOpen || window.innerWidth < 768) && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Link to="/admin/login" onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={20} />
            {(sidebarOpen || window.innerWidth < 768) && <span className="font-medium">Deconectare</span>}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 md:hidden">
              <Menu size={24} />
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
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<TenantsList />} />
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

function TenantsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTenantForAdmins, setSelectedTenantForAdmins] = useState(null);
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      label: 'Nume Locație',
      render: (row) => {
        let hostname = window.location.hostname;
        if (hostname.startsWith('admin.')) hostname = hostname.replace('admin.', '');
        if (hostname.startsWith('www.')) hostname = hostname.replace('www.', '');
        const port = window.location.port ? `:${window.location.port}` : '';
        const adminUrl = `${window.location.protocol}//${row.subdomain}.${hostname}${port}/admin/login`;
        
        return (
          <a 
            href={adminUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
            title="Deschide panoul de administrare pentru acest tenant"
          >
            {row.nume}
          </a>
        );
      }
    },
    { key: 'tip_modul', label: 'Modul' },
    { 
      key: 'branding', 
      label: 'Branding',
      sortable: false,
      render: (row) => {
        const resolvedFav = resolveFaviconUrl(row.favicon_url);
        return (
          <div className="flex items-center gap-2">
            {row.logo_url ? (
              <div 
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center shrink-0"
                style={{ backgroundColor: row.culoare || '#ffffff' }}
                title="Logo"
              >
                <img 
                  src={row.logo_url.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${row.logo_url}` : row.logo_url} 
                  alt={row.nume} 
                  className="w-full h-full object-contain p-1" 
                />
              </div>
            ) : (
              <div 
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-xs font-bold shadow-sm"
                style={{ backgroundColor: row.culoare || '#f8fafc', color: '#fff' }}
                title="Inițiale"
              >
                {row.nume.substring(0, 2).toUpperCase()}
              </div>
            )}

            {resolvedFav ? (
              <div 
                className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center shrink-0"
                title="Favicon activ"
              >
                <img 
                  src={resolvedFav} 
                  alt="Favicon" 
                  className="w-4 h-4 object-contain"
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
        <span className="flex items-center text-slate-700 dark:text-slate-300 font-medium">
          {row.mod_qr}
        </span>
      )
    },
    { 
      key: 'raza_gps', 
      label: 'Rază GPS',
      render: (row) => `${row.raza_gps}m`
    },
    {
      key: 'billing',
      label: 'Tarifare',
      render: (row) => (
        row.billing_per_employee ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
            {parseFloat(row.price_per_employee || 0).toFixed(2)} € / angajat ({row.active_employees_count || 0} activi)
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800">
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
        <div className="flex justify-end gap-2">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 hover:text-slate-700 dark:text-slate-300 text-slate-500 dark:text-slate-400 transition-colors"
            onClick={() => setSelectedTenantForAdmins(row)}
            title="Gestionează Admini"
          >
            <Users size={16} strokeWidth={2} />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-primary-50 hover:text-primary-600 text-slate-500 dark:text-slate-400 transition-colors"
            onClick={() => {
              setSelectedTenantForEdit(row);
              setIsModalOpen(true);
            }}
            title="Editează"
          >
            <Pencil size={16} strokeWidth={2} />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 text-slate-500 dark:text-slate-400 transition-colors"
            onClick={() => console.log('Delete', row.id)}
            title="Șterge"
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div>Se încarcă...</div>;
  if (error) return <div>Eroare: {error}</div>;

  return (
    <>
      <DataTable 
        title="Tenanți Activi"
        data={data}
        columns={columns}
        searchPlaceholder="Caută după nume sau modul..."
        headerActions={
          <button 
            onClick={() => {
              setSelectedTenantForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2.5 text-sm rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all"
          >
            Adaugă Tenant
          </button>
        }
      />

      {isModalOpen && (
        <CreateTenantModal 
          onClose={() => setIsModalOpen(false)} 
          onTenantCreated={fetchTenants}
          editTenant={selectedTenantForEdit}
        />
      )}

      <TenantAdminsModal
        isOpen={!!selectedTenantForAdmins}
        onClose={() => setSelectedTenantForAdmins(null)}
        tenant={selectedTenantForAdmins}
      />
    </>
  );
}
