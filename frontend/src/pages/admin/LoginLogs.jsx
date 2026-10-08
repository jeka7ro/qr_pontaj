import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Building2, 
  User, 
  Shield, 
  Clock, 
  Globe, 
  Laptop, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Users,
  Activity,
  Calendar,
  PlusCircle,
  LogOut,
  LogIn,
  Coffee,
  Trash2,
  AlertCircle,
  FileText,
  Check,
  X,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function LoginLogs() {
  // Tab activ: 'timesheets' | 'scan_logs' | 'audits' | 'login_logs'
  const [activeTab, setActiveTab] = useState('timesheets');
  
  // Stări date
  const [timesheets, setTimesheets] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Date context (tenanți, angajați, locații)
  const [tenantsContext, setTenantsContext] = useState({
    tenants: [],
    employees: [],
    locations: []
  });

  // Filtre generale
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Paginare
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Statistici agregate
  const [stats, setStats] = useState({
    total_punches: 0,
    today_punches: 0,
    manual_punches: 0,
    failed_attempts: 0,
    total_logins: 0
  });

  // Modal intervenție manuală de urgență
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    tenant_id: '',
    employee_id: '',
    action_type: 'IN',
    site_id: '',
    timestamp: '',
    reason_preset: 'Problemă tehnică Kiosk / QR',
    reason_custom: ''
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  // Modal confirmare acțiune rapidă / ștergere
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'CHECKOUT' | 'DELETE'
    timesheetId: null,
    employeeName: '',
    reason: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Încărcare date de context (pentru dropdown-uri și selecție rapidă)
  const fetchContext = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/tenants-context`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTenantsContext(data);
      }
    } catch (err) {
      console.warn('Eroare la încărcarea contextului tenanților:', err.message);
    }
  };

  // Preluare date pentru tab-ul activ
  const fetchData = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString()
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedTenant !== 'all') params.append('tenant_id', selectedTenant);

      if (activeTab === 'timesheets') {
        if (selectedActionType !== 'all') params.append('action_type', selectedActionType);
        const res = await fetch(`${getApiUrl()}/api/admin/timesheets?${params.toString()}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Eroare la preluarea pontajelor');
        const data = await res.json();
        setTimesheets(data.timesheets || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            total_punches: data.stats.total_punches,
            today_punches: data.stats.today_punches,
            manual_punches: data.stats.manual_punches
          }));
        }
      } else if (activeTab === 'scan_logs') {
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (selectedActionType !== 'all') params.append('action_type', selectedActionType);
        const res = await fetch(`${getApiUrl()}/api/admin/scan-logs?${params.toString()}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Eroare la preluarea jurnalului de scanare');
        const data = await res.json();
        setScanLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            failed_attempts: data.stats.today_failed || data.stats.total_failed || 0
          }));
        }
      } else if (activeTab === 'audits') {
        const res = await fetch(`${getApiUrl()}/api/admin/audits?${params.toString()}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Eroare la preluarea registrului de audit');
        const data = await res.json();
        setAudits(data.audits || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
      } else if (activeTab === 'login_logs') {
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        const res = await fetch(`${getApiUrl()}/api/admin/login-logs?${params.toString()}`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Eroare la preluarea jurnalului de autentificări');
        const data = await res.json();
        setLoginLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            total_logins: data.stats.today_total || data.stats.total_all || 0
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching admin logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [activeTab, selectedTenant, selectedActionType, selectedStatus, limit]);

  // Deschidere modal intervenție manuală cu valori pre-completate
  const handleOpenManualModal = (presetTenantId = null, presetEmployeeId = null, presetAction = 'IN') => {
    const targetTenant = presetTenantId || (selectedTenant !== 'all' ? selectedTenant : (tenantsContext.tenants[0]?.id || ''));
    
    // Obține data și ora curentă formatată ISO local (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentLocalTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    setManualForm({
      tenant_id: String(targetTenant),
      employee_id: presetEmployeeId ? String(presetEmployeeId) : '',
      action_type: presetAction,
      site_id: '',
      timestamp: currentLocalTime,
      reason_preset: 'Problemă tehnică Kiosk / QR',
      reason_custom: ''
    });
    setIsManualModalOpen(true);
  };

  // Salvare pontaj de urgență
  const handleSubmitManualPunch = async (e) => {
    e.preventDefault();
    setSubmittingManual(true);
    setError(null);
    try {
      const finalReason = manualForm.reason_preset === 'Alt motiv'
        ? manualForm.reason_custom.trim()
        : (manualForm.reason_custom.trim() 
            ? `${manualForm.reason_preset} - ${manualForm.reason_custom.trim()}` 
            : manualForm.reason_preset);

      if (!manualForm.tenant_id || !manualForm.employee_id) {
        throw new Error('Selectați compania și angajatul.');
      }
      if (!finalReason) {
        throw new Error('Specificați motivul intervenției de urgență.');
      }

      const res = await fetch(`${getApiUrl()}/api/admin/manual-punch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tenant_id: parseInt(manualForm.tenant_id, 10),
          employee_id: parseInt(manualForm.employee_id, 10),
          action_type: manualForm.action_type,
          site_id: manualForm.site_id ? parseInt(manualForm.site_id, 10) : null,
          timestamp: manualForm.timestamp ? new Date(manualForm.timestamp).toISOString() : new Date().toISOString(),
          reason: finalReason
        })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Eroare la salvarea pontajului manual.');
      }

      setSuccessMessage('Pontajul manual de urgență a fost înregistrat cu succes.');
      setIsManualModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Trimitere ieșire rapidă sau ștergere
  const handleConfirmActionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    setError(null);
    try {
      const reason = confirmModal.reason.trim();
      if (!reason) {
        throw new Error('Motivul intervenției este obligatoriu pentru audit.');
      }

      if (confirmModal.type === 'CHECKOUT') {
        const res = await fetch(`${getApiUrl()}/api/admin/quick-checkout`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            timesheet_id: confirmModal.timesheetId,
            reason
          })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Eroare la închiderea turei');
        setSuccessMessage('Ieșirea din tură a fost înregistrată cu succes.');
      } else if (confirmModal.type === 'DELETE') {
        const res = await fetch(`${getApiUrl()}/api/admin/timesheets/${confirmModal.timesheetId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ reason })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Eroare la ștergerea pontajului');
        setSuccessMessage('Înregistrarea de pontaj a fost ștearsă din sistem.');
      }

      setConfirmModal({ isOpen: false, type: null, timesheetId: null, employeeName: '', reason: '' });
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Formatare timestamp lizibil
  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Angajați filtrați pentru compania selectată în formular
  const availableEmployees = tenantsContext.employees.filter(
    emp => String(emp.tenant_id) === String(manualForm.tenant_id)
  );

  // Locații filtrate pentru compania selectată în formular
  const availableLocations = tenantsContext.locations.filter(
    loc => String(loc.tenant_id) === String(manualForm.tenant_id)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Antet Pagina */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jurnal & Intervenții Tenanți</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              SuperAdmin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitorizare live pentru toți clienții (Unda, Roll Master, Sushi Han), incidente de scanare și modul de pontaj manual de urgență.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchData(page)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold transition-all shadow-xs"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizează</span>
          </button>

          <button
            onClick={() => handleOpenManualModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Intervenție Manuală / Pontaj de Urgență</span>
          </button>
        </div>
      </div>

      {/* Mesaj de succes */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mesaj de eroare */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Selector Rapid Chiriași (Tenanți) */}
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={14} /> Filtrează după Chiriaș
          </span>
          {selectedTenant !== 'all' && (
            <button
              onClick={() => setSelectedTenant('all')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700"
            >
              Arată toți chiriașii
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedTenant('all')}
            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
              selectedTenant === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-white dark:text-slate-900'
                : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
            }`}
          >
            <span>Toți Chiriașii</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60">
              {tenantsContext.tenants.length}
            </span>
          </button>

          {tenantsContext.tenants.map(t => {
            const isSelected = String(selectedTenant) === String(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTenant(String(t.id))}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750 hover:bg-slate-100'
                }`}
              >
                {t.logo_url && (
                  <img
                    src={t.logo_url.startsWith('http') ? t.logo_url : `${getApiUrl()}${t.logo_url}`}
                    alt={t.name}
                    className="w-4 h-4 rounded-full object-contain bg-white shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <span>{t.name}</span>
                <span className="text-[10px] opacity-75 uppercase">#{t.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Carduri Statistici */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pontaje Astăzi</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.today_punches}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Înregistrări în cursul zilei</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Intervenții Manuale</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.manual_punches}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pontaje corectate manual de admin</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Incidente Scanare</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.failed_attempts}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">PIN greșit / cod expirat / erori</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Istoric</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.total_punches}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pontaje stocate în platformă</div>
        </div>
      </div>

      {/* Tab-uri Navigare Secțiuni */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('timesheets')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'timesheets'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock size={16} />
          <span>Jurnal Pontaje & Ore</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {activeTab === 'timesheets' ? total : ''}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scan_logs')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'scan_logs'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle size={16} />
          <span>Evenimente & Tentative Scanare Kiosk</span>
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'audits'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={16} />
          <span>Registru Audit & Intervenții Manuale</span>
        </button>

        <button
          onClick={() => setActiveTab('login_logs')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'login_logs'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Shield size={16} />
          <span>Autentificări & Securitate</span>
        </button>
      </div>

      {/* Bară de Căutare și Filtrare */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchData(1); }} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după nume angajat, cod, locație sau motiv..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          {activeTab === 'timesheets' && (
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">Toate Acțiunile</option>
              <option value="IN">Intrare (IN)</option>
              <option value="OUT">Ieșire (OUT)</option>
              <option value="BREAK_START">Pauză (Start)</option>
              <option value="BREAK_END">Pauză (Sfârșit)</option>
            </select>
          )}

          {activeTab === 'scan_logs' && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">Toate Statusurile</option>
              <option value="SUCCESS">Succes</option>
              <option value="FAILED">Eșuate (PIN incorect)</option>
              <option value="REJECTED">Respinse (QR expirat / Cooldown)</option>
              <option value="MANUAL">Intervenție Manuală</option>
            </select>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            Filtrează
          </button>
        </form>
      </div>

      {/* Conținut Tabelar conform tab-ului activ */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RotateCcw size={32} className="animate-spin text-primary-500 mb-3" />
            <span className="text-xs font-semibold">Se încarcă înregistrările...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: PONTAJE REALE */}
            {activeTab === 'timesheets' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Data & Ora</th>
                      <th className="py-3 px-4">Chiriaș</th>
                      <th className="py-3 px-4">Angajat</th>
                      <th className="py-3 px-4">Locație</th>
                      <th className="py-3 px-4">Tip Pontaj</th>
                      <th className="py-3 px-4">Metodă</th>
                      <th className="py-3 px-4">Observații / Motiv</th>
                      <th className="py-3 px-4 text-right">Acțiuni Intervenție</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                    {timesheets.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          Nicio înregistrare de pontaj găsită conform filtrelor selectate.
                        </td>
                      </tr>
                    ) : (
                      timesheets.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatTimestamp(row.created_at)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-650">
                              <Building2 size={12} />
                              {row.tenant_name || `Tenant #${row.tenant_id}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {row.avatar_path ? (
                                <img src={row.avatar_path} alt="" className="w-7 h-7 rounded-full object-cover border" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-200">
                                  {row.employee_name?.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{row.employee_name}</div>
                                <div className="text-[10px] text-slate-400">Cod: {row.employee_code || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {row.location_name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {row.action_type === 'IN' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <LogIn size={12} /> INTRARE
                              </span>
                            )}
                            {row.action_type === 'OUT' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-650">
                                <LogOut size={12} /> IEȘIRE
                              </span>
                            )}
                            {row.action_type === 'BREAK_START' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Coffee size={12} /> ÎNCEPUT PAUZĂ
                              </span>
                            )}
                            {row.action_type === 'BREAK_END' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                SFÂRȘIT PAUZĂ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {row.is_manual ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <ShieldAlert size={11} /> Manual
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 dark:bg-slate-900/60 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                                QR Scan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={row.notes || ''}>
                            {row.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {row.action_type === 'IN' && (
                                <button
                                  onClick={() => setConfirmModal({
                                    isOpen: true,
                                    type: 'CHECKOUT',
                                    timesheetId: row.id,
                                    employeeName: row.employee_name,
                                    reason: 'Închidere tură de urgență de către SuperAdmin'
                                  })}
                                  title="Înregistrează Ieșire Rapidă"
                                  className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1"
                                >
                                  <LogOut size={11} /> Ieșire
                                </button>
                              )}

                              <button
                                onClick={() => setConfirmModal({
                                  isOpen: true,
                                  type: 'DELETE',
                                  timesheetId: row.id,
                                  employeeName: row.employee_name,
                                  reason: 'Pontaj duplicat / eronat'
                                })}
                                title="Șterge pontaj cu motiv de audit"
                                className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: INCIDENTE SCANARE KIOSK */}
            {activeTab === 'scan_logs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Data & Ora</th>
                      <th className="py-3 px-4">Chiriaș</th>
                      <th className="py-3 px-4">Angajat / Cod</th>
                      <th className="py-3 px-4">Acțiune</th>
                      <th className="py-3 px-4">Status Eveniment</th>
                      <th className="py-3 px-4">Motiv Eșec / Detalii</th>
                      <th className="py-3 px-4">IP / Kiosk</th>
                      <th className="py-3 px-4 text-right">Intervenție</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                    {scanLogs.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          Niciun eveniment de scanare înregistrat conform filtrelor curente.
                        </td>
                      </tr>
                    ) : (
                      scanLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatTimestamp(log.created_at)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {log.tenant_name || `Tenant #${log.tenant_id}`}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white">{log.employee_name || 'Necunoscut'}</div>
                            <div className="text-[10px] text-slate-400">Cod: {log.employee_code || '-'}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold">
                            {log.action_type || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {log.status === 'SUCCESS' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                                <CheckCircle2 size={12} /> Succes
                              </span>
                            )}
                            {log.status === 'FAILED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200">
                                <XCircle size={12} /> Eșuat
                              </span>
                            )}
                            {log.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                                <AlertTriangle size={12} /> Respins
                              </span>
                            )}
                            {log.status === 'MANUAL' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
                                Manual
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-sm">
                            <div className="font-medium text-[11px]">{log.failure_reason || 'Scanare efectuată cu succes.'}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                            <div>IP: {log.ip_address || '-'}</div>
                            {log.kiosk_id && <div className="text-[10px] text-slate-400">Kiosk #{log.kiosk_id}</div>}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenManualModal(log.tenant_id, log.employee_id, log.action_type || 'IN')}
                              className="px-3 py-1 rounded-full bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold text-[11px] border border-primary-200 transition-all inline-flex items-center gap-1"
                            >
                              <span>Pontează Manual</span>
                              <ArrowRight size={11} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: REGISTRU AUDIT */}
            {activeTab === 'audits' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Data & Ora</th>
                      <th className="py-3 px-4">Chiriaș</th>
                      <th className="py-3 px-4">Angajat Vizat</th>
                      <th className="py-3 px-4">Operator Modificare</th>
                      <th className="py-3 px-4">Tip Intervenție</th>
                      <th className="py-3 px-4">Motiv Înregistrat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                    {audits.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          Nicio intervenție manuală consemnată în registrul de audit conform filtrelor.
                        </td>
                      </tr>
                    ) : (
                      audits.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatTimestamp(row.created_at)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                            {row.tenant_name || `Tenant #${row.tenant_id}`}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                            {row.employee_name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {row.modified_by_email}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-purple-600 dark:text-purple-400">
                            {row.action_name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {row.reason}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: AUTENTIFICĂRI & SECURITATE */}
            {activeTab === 'login_logs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Data & Ora</th>
                      <th className="py-3 px-4">Utilizator</th>
                      <th className="py-3 px-4">Chiriaș</th>
                      <th className="py-3 px-4">Rol / Tip</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">IP & Detalii</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                    {loginLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          Nicio autentificare găsită.
                        </td>
                      </tr>
                    ) : (
                      loginLogs.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatTimestamp(row.created_at)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white">{row.user_name || row.email}</div>
                            <div className="text-[10px] text-slate-400">{row.email}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {row.tenant_name || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                            {row.role || row.login_type || 'User'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {row.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} /> Reușit
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle size={11} /> Eșuat
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                            {row.ip_address} {row.failure_reason ? `(${row.failure_reason})` : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginare */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Afișare înregistrări (Pagina {page} din {totalPages || 1}, Total: {total})
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchData(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  Anterior
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-300 px-2">
                  {page} / {totalPages || 1}
                </span>
                <button
                  onClick={() => fetchData(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  Următor
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL INTERVENȚIE MANUALĂ / PONTAJ DE URGENȚĂ */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-750 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Intervenție Manuală de Urgență
                  </h3>
                  <p className="text-xs text-slate-500">
                    Înregistrează un pontaj direct pentru un angajat cu audit imutabil.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitManualPunch} className="p-6 space-y-4">
              {/* Selectare Chiriaș */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Companie / Chiriaș <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualForm.tenant_id}
                  onChange={(e) => setManualForm({ ...manualForm, tenant_id: e.target.value, employee_id: '', site_id: '' })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Alegeți compania...</option>
                  {tenantsContext.tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Subdomeniu: {t.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selectare Angajat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Angajat <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualForm.employee_id}
                  onChange={(e) => setManualForm({ ...manualForm, employee_id: e.target.value })}
                  required
                  disabled={!manualForm.tenant_id}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <option value="">
                    {manualForm.tenant_id ? 'Alegeți angajatul...' : 'Selectați mai întâi compania...'}
                  </option>
                  {availableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.last_name} {emp.first_name} {emp.employee_code ? `(${emp.employee_code})` : ''} - {emp.job_title || 'Angajat'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tip Pontaj & Punct de lucru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tip Pontaj <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={manualForm.action_type}
                    onChange={(e) => setManualForm({ ...manualForm, action_type: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="IN">Intrare în Tură (IN)</option>
                    <option value="OUT">Ieșire din Tură (OUT)</option>
                    <option value="BREAK_START">Început Pauză (BREAK_START)</option>
                    <option value="BREAK_END">Sfârșit Pauză (BREAK_END)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Punct de Lucru
                  </label>
                  <select
                    value={manualForm.site_id}
                    onChange={(e) => setManualForm({ ...manualForm, site_id: e.target.value })}
                    disabled={!manualForm.tenant_id}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <option value="">Locație implicită a companiei</option>
                    {availableLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data și Ora exactă */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Data și Ora Pontajului <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={manualForm.timestamp}
                  onChange={(e) => setManualForm({ ...manualForm, timestamp: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Motivul intervenției manuale */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Motiv Intervenție (Obligatoriu pentru Audit) <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualForm.reason_preset}
                  onChange={(e) => setManualForm({ ...manualForm, reason_preset: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 mb-2"
                >
                  <option value="Problemă tehnică Kiosk / QR">Problemă tehnică Kiosk / QR</option>
                  <option value="Solicitare telefonică angajat / apel client">Solicitare telefonică angajat / apel client</option>
                  <option value="Lipsă conexiune internet la punctul de lucru">Lipsă conexiune internet la punctul de lucru</option>
                  <option value="Corecție uitare pontaj la intrare/ieșire">Corecție uitare pontaj la intrare/ieșire</option>
                  <option value="Alt motiv">Alt motiv (specifică mai jos)</option>
                </select>

                <textarea
                  value={manualForm.reason_custom}
                  onChange={(e) => setManualForm({ ...manualForm, reason_custom: e.target.value })}
                  placeholder="Detalii suplimentare referitoare la intervenție (opțional sau obligatoriu pentru 'Alt motiv')..."
                  rows="2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 placeholder-slate-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50"
                >
                  Anulează
                </button>

                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                >
                  {submittingManual ? 'Se salvează...' : 'Înregistrează Pontaj de Urgență'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMARE ACȚIUNE RAPIDĂ (IEȘIRE SAU ȘTERGERE) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                confirmModal.type === 'DELETE' 
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400' 
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}>
                {confirmModal.type === 'DELETE' ? <Trash2 size={20} /> : <LogOut size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {confirmModal.type === 'DELETE' ? 'Confirmă Ștergerea Pontajului' : 'Confirmă Ieșirea Rapidă din Tură'}
                </h3>
                <p className="text-xs text-slate-500">
                  Angajat: <strong className="text-slate-700 dark:text-slate-300">{confirmModal.employeeName}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Motiv Intervenție (Obligatoriu pentru Audit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={confirmModal.reason}
                  onChange={(e) => setConfirmModal({ ...confirmModal, reason: e.target.value })}
                  required
                  placeholder="Ex: Tura s-a încheiat la ora 18:00 sau pontaj eronat..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, type: null, timesheetId: null, employeeName: '', reason: '' })}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Anulează
                </button>

                <button
                  type="submit"
                  disabled={submittingAction}
                  className={`px-5 py-2 rounded-full text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 ${
                    confirmModal.type === 'DELETE'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {submittingAction ? 'Se procesează...' : (confirmModal.type === 'DELETE' ? 'Șterge Pontaj' : 'Confirmă Ieșirea')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
