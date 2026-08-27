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
  Moon
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ProfileModal from '../../components/ProfileModal';
import CreateTenantModal from '../../components/CreateTenantModal';
import TenantAdminsModal from '../../components/TenantAdminsModal';

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

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const navItems = [
    { name: 'Tenanți', path: '/admin/dashboard', icon: Building2 },
    { name: 'Utilizatori Admin', path: '/admin/users', icon: Users },
    { name: 'Setări Platformă', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col z-10`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          {sidebarOpen && <span className="font-bold text-lg text-slate-800 dark:text-white">SaaS Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-full transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Link to="/admin/login" onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2.5 rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Deconectare</span>}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 transition-colors">
          <div></div>
          
          <div className="flex items-center gap-4 md:gap-6 ml-auto">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
              title="Comută tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 p-1.5 rounded-full md:rounded-full md:pr-4 transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
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
                  className="w-10 h-10 rounded-full border-2 border-slate-200 object-cover bg-white" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-slate-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {(currentUser.nume?.[0] || '')}{(currentUser.prenume?.[0] || '')}
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<TenantsList />} />
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
      const res = await fetch('http://localhost:5001/api/tenants');
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
      render: (row) => (
        <a 
          href={`${window.location.origin}/s/${row.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
          title="Deschide aplicația de scanare QR pentru acest tenant"
        >
          {row.nume}
        </a>
      )
    },
    { key: 'tip_modul', label: 'Modul' },
    { 
      key: 'branding', 
      label: 'Branding',
      sortable: false,
      render: (row) => (
        <div className="flex items-center">
          {row.logo_url ? (
            <div 
              className="w-8 h-8 rounded-full border border-slate-200 mr-3 shadow-sm overflow-hidden flex items-center justify-center shrink-0"
              style={{ backgroundColor: row.culoare || '#ffffff' }}
            >
              <img 
                src={row.logo_url} 
                alt={row.nume} 
                className="w-full h-full object-contain p-1" 
              />
            </div>
          ) : (
            <div 
              className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold mr-3 shadow-sm"
              style={{ backgroundColor: row.culoare || '#f8fafc', color: '#fff' }}
            >
              {row.nume.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'mod_qr', 
      label: 'Mod QR',
      render: (row) => (
        <span className="flex items-center text-slate-700 font-medium">
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
      key: 'actions',
      label: 'Acțiuni',
      sortable: false,
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 hover:text-slate-700 text-slate-500 transition-colors"
            onClick={() => setSelectedTenantForAdmins(row)}
            title="Gestionează Admini"
          >
            <Users size={16} strokeWidth={2} />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-primary-50 hover:text-primary-600 text-slate-500 transition-colors"
            onClick={() => {
              setSelectedTenantForEdit(row);
              setIsModalOpen(true);
            }}
            title="Editează"
          >
            <Pencil size={16} strokeWidth={2} />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors"
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
            className="flex items-center px-5 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all"
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
