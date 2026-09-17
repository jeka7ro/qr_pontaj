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
  Calendar
} from 'lucide-react';

export default function LoginLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState({
    total_all: 0,
    today_total: 0,
    total_success: 0,
    total_failed: 0
  });
  const [tenants, setTenants] = useState([]);

  // Filtre
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Paginare
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const urlToken = new URLSearchParams(window.location.search).get('token');
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user', JSON.stringify({ id: 1, email: 'jeka7ro@gmail.com', name: 'Eugeniu Cazmal', role: 'SUPERADMIN', tenant_id: null }));
      }
      const token = urlToken || localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedTenant !== 'all') params.append('tenant_id', selectedTenant);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const apiUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${apiUrl}/api/admin/login-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Acces refuzat. Doar conturile SuperAdmin pot vizualiza această pagină.');
        }
        throw new Error('Eroare la preluarea jurnalului de autentificări.');
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
      if (data.stats) setStats(data.stats);
      if (data.tenants) setTenants(data.tenants);
    } catch (err) {
      console.error('Error fetching login logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [selectedTenant, selectedType, selectedStatus, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedTenant('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setPage(1);
  };

  const parseDevice = (ua) => {
    if (!ua) return { type: 'Necunoscut', isMobile: false };
    const lower = ua.toLowerCase();
    if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('android') || lower.includes('mobile')) {
      return { type: lower.includes('iphone') ? 'iPhone' : lower.includes('android') ? 'Android' : 'Mobil', isMobile: true };
    }
    if (lower.includes('macintosh') || lower.includes('mac os')) return { type: 'macOS', isMobile: false };
    if (lower.includes('windows')) return { type: 'Windows', isMobile: false };
    if (lower.includes('linux')) return { type: 'Linux', isMobile: false };
    return { type: 'Desktop', isMobile: false };
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '-';
    const now = Date.now();
    const date = new Date(timestamp).getTime();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'chiar acum';
    if (diffSeconds < 3600) return `acum ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `acum ${Math.floor(diffSeconds / 3600)} ore`;
    if (diffSeconds < 172800) return 'ieri';
    return new Date(timestamp).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  };

  const successRate = stats.total_all > 0 
    ? Math.round((stats.total_success / stats.total_all) * 100) 
    : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Pagina */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jurnal Autentificări</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              SuperAdmin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitorizare detaliată în timp real a conexiunilor și autentificărilor pentru toți tenanții din platformă.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
        >
          <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Actualizează</span>
        </button>
      </div>

      {/* Carduri Statistici */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Conectări</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.total_all}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Înregistrate în istoric</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Astăzi</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Calendar size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.today_total}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Conectări în cursul zilei</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rată de Succes</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{successRate}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stats.total_success} reușite</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Eșuate / Blocate</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <XCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.total_failed}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Parole greșite sau conturi arhivate</div>
        </div>
      </div>

      {/* Bară de Căutare și Filtrare */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută după email, nume, tenant sau IP..."
              className="w-full h-10 pl-10 pr-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtru Tenant */}
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
            >
              <option value="all">Toți Tenanții</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Filtru Tip Conexiune */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
            >
              <option value="all">Toate Rolurile</option>
              <option value="ADMIN">Admin Tenant</option>
              <option value="EMPLOYEE">Angajat</option>
              <option value="SUPERADMIN">SuperAdmin</option>
            </select>

            {/* Filtru Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
            >
              <option value="all">Toate Statusurile</option>
              <option value="SUCCESS">Succes</option>
              <option value="FAILED">Eșuat</option>
              <option value="BLOCKED">Blocat</option>
            </select>

            <button
              type="submit"
              className="h-10 px-5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Filtrează
            </button>

            {(search || selectedTenant !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all"
                title="Resetează filtrele"
              >
                Resetează
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabel Loguri */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-slate-500 dark:text-slate-400 font-medium">
            Se încarcă istoricul de autentificări...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <History size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Nicio autentificare găsită</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Nu există înregistrări care să corespundă filtrelor selectate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400 text-center w-12">Nr.</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Utilizator & Cont</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Companie (Tenant)</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Rol / Tip</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Data și Ora</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Adresă IP / Dispozitiv</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {logs.map((log, index) => {
                  const device = parseDevice(log.user_agent);
                  const isSuccess = log.status === 'SUCCESS';
                  const isBlocked = log.status === 'BLOCKED';

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                        {(page - 1) * limit + index + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                            {(log.user_name?.[0] || log.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {log.user_name || 'Utilizator'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {log.email || '-'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                          <Building2 size={12} className="text-slate-400" />
                          <span>{log.tenant_name || 'Platformă Centrală'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {log.login_type === 'SUPERADMIN' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            SuperAdmin
                          </span>
                        ) : log.login_type === 'ADMIN' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Admin Tenant
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Angajat
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {new Date(log.created_at).toLocaleString('ro-RO', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {formatRelativeTime(log.created_at)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          <Globe size={13} className="text-slate-400" />
                          <span>{log.ip_address || '127.0.0.1'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" title={log.user_agent}>
                          {device.isMobile ? <Smartphone size={11} /> : <Laptop size={11} />}
                          <span>{device.type}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} />
                            <span>Succes</span>
                          </span>
                        ) : isBlocked ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <AlertTriangle size={12} />
                              <span>Blocat</span>
                            </span>
                            {log.failure_reason && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">{log.failure_reason}</span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                              <XCircle size={12} />
                              <span>Eșuat</span>
                            </span>
                            {log.failure_reason && (
                              <span className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 font-medium">{log.failure_reason}</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Paginare Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Afișează</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full px-2.5 py-1 text-xs font-bold outline-none dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>din <strong>{total}</strong> înregistrări</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-2">
                  Pagina <strong>{page}</strong> din <strong>{totalPages}</strong>
                </span>
                <button
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page <= 1 || loading}
                  className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-all shadow-xs"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-all shadow-xs"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
