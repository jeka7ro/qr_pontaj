import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  RotateCcw, 
  LogIn, 
  LogOut, 
  Coffee, 
  ShieldAlert, 
  ArrowRight, 
  X, 
  AlertCircle,
  MapPin,
  Smartphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../../utils/i18n.jsx';
import { getLogsLabels, REASON_PRESETS } from './logsLabels.js';

export default function TenantLogsModule({ tenant, themeColor = '#2563EB' }) {
  const { t, language } = useLanguage();
  const { L, locale, translateReason } = getLogsLabels(language);

  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Filtre
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [selectedHourPreset, setSelectedHourPreset] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [search, setSearch] = useState('');

  // Date și încărcare
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Paginare
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Statistici
  const [stats, setStats] = useState({
    total_events: 0,
    in_count: 0,
    out_count: 0,
    incident_count: 0,
    manual_count: 0
  });

  // Liste angajați și locații
  const [meta, setMeta] = useState({ employees: [], locations: [] });

  // Modal intervenție manuală
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    employee_id: '',
    action_type: 'IN',
    site_id: '',
    timestamp: '',
    reason_preset: 'Problemă scanare cod QR / tabletă',
    reason_custom: ''
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Încărcare liste angajați și locații
  const fetchMeta = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/tenant/dashboard/employees-and-locations`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMeta(data);
      }
    } catch (e) {
      console.warn('Error fetching meta:', e.message);
    }
  };

  // Preluare loguri conform filtrelor
  const fetchLogs = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString()
      });

      if (selectedDate) params.append('date', selectedDate);
      if (selectedEmployee !== 'all') params.append('employee_id', selectedEmployee);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedActionType !== 'all') params.append('action_type', selectedActionType);
      if (search.trim()) params.append('search', search.trim());

      // Interval orar
      if (selectedHourPreset === 'morning') {
        params.append('hour_from', '6');
        params.append('hour_to', '14');
      } else if (selectedHourPreset === 'afternoon') {
        params.append('hour_from', '14');
        params.append('hour_to', '22');
      } else if (selectedHourPreset === 'night') {
        params.append('hour_from', '22');
        params.append('hour_to', '23');
      }

      const res = await fetch(`${getApiUrl()}/api/tenant/dashboard/logs?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error(L.errLoad);
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching tenant logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [selectedDate, selectedHourPreset, selectedEmployee, selectedStatus, selectedActionType, limit]);

  // Deschide modalul de intervenție manuală
  const handleOpenManualModal = (presetEmpId = '', presetAction = 'IN', presetTimestamp = null) => {
    let initialTime;
    if (presetTimestamp) {
      const d = new Date(presetTimestamp);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      initialTime = `${y}-${m}-${day}T${h}:${min}`;
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const h = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      initialTime = `${y}-${m}-${day}T${h}:${min}`;
    }

    setManualForm({
      employee_id: presetEmpId ? String(presetEmpId) : (meta.employees[0]?.id ? String(meta.employees[0].id) : ''),
      action_type: presetAction,
      site_id: meta.locations[0]?.id ? String(meta.locations[0].id) : '',
      timestamp: initialTime,
      reason_preset: 'Problemă scanare cod QR / tabletă',
      reason_custom: ''
    });
    setIsManualModalOpen(true);
  };

  // Trimitere pontaj manual
  const handleSubmitManual = async (e) => {
    e.preventDefault();
    setSubmittingManual(true);
    setError(null);
    try {
      const finalReason = manualForm.reason_preset === 'Alt motiv'
        ? manualForm.reason_custom.trim()
        : (manualForm.reason_custom.trim()
            ? `${manualForm.reason_preset} - ${manualForm.reason_custom.trim()}`
            : manualForm.reason_preset);

      if (!manualForm.employee_id) throw new Error(L.errChooseEmp);
      if (!finalReason) throw new Error(L.errReason);

      const res = await fetch(`${getApiUrl()}/api/tenant/dashboard/manual-punch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employee_id: parseInt(manualForm.employee_id, 10),
          action_type: manualForm.action_type,
          site_id: manualForm.site_id ? parseInt(manualForm.site_id, 10) : null,
          timestamp: manualForm.timestamp ? new Date(manualForm.timestamp).toISOString() : new Date().toISOString(),
          reason: finalReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || L.errManual);

      setSuccessMessage(L.okManual);
      setIsManualModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchLogs(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Formatare timestamp lizibil
  const formatTime = (ts) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header modul */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {L.title}
            </h1>
            <span 
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: themeColor }}
            >
              {L.liveFeed}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {L.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{L.refresh}</span>
          </button>

          <button
            onClick={() => handleOpenManualModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            style={{ backgroundColor: themeColor }}
          >
            <PlusCircle size={15} />
            <span>{L.manualBtn}</span>
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

      {/* Carduri Statistici pentru ziua selectată */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{L.totalEvents}</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{stats.total_events}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{formatDateLabel(selectedDate)}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{L.inLabel}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <LogIn size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1.5">{stats.in_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{L.inSub}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{L.outLabel}</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              <LogOut size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{stats.out_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{L.outSub}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{L.errLabel}</span>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 mt-1.5">{stats.incident_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{L.errSub}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{L.manualLabel}</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1.5">{stats.manual_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{L.manualSub}</div>
        </div>
      </div>

      {/* Bară de Filtrare Precisă: Dată + Interval Orar + Angajat + Tip */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-750 pb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {L.filterTitle}
            </span>
          </div>

          {/* Comenzi rapide pe zi */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedDate(getTodayDateStr())}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                selectedDate === getTodayDateStr()
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {L.today}
            </button>
            <button
              onClick={() => {
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                const yStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
                setSelectedDate(yStr);
              }}
              className="px-3 py-1 rounded-full text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            >
              {L.yesterday}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Data exactă */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {L.selectDay}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Interval Orar */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {L.timeRange}
            </label>
            <select
              value={selectedHourPreset}
              onChange={(e) => setSelectedHourPreset(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{L.allDay}</option>
              <option value="morning">{L.morning}</option>
              <option value="afternoon">{L.afternoon}</option>
              <option value="night">{L.night}</option>
            </select>
          </div>

          {/* Angajat */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {L.employee}
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{L.allEmployees}</option>
              {meta.employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.last_name} {emp.first_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {L.eventStatus}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{L.allStatuses}</option>
              <option value="SUCCESS">{L.sSuccess}</option>
              <option value="FAILED">{L.sFailed}</option>
              <option value="REJECTED">{L.sRejected}</option>
              <option value="MANUAL">{L.sManual}</option>
            </select>
          </div>

          {/* Căutare liberă */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              {L.searchText}
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchLogs(1); }}
                placeholder={L.searchPh}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Evenimente & Scanări cu Timestamp detaliat */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RotateCcw size={32} className="animate-spin text-primary-500 mb-3" />
            <span className="text-xs font-semibold">{L.loading}</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">{L.thTime}</th>
                    <th className="py-3 px-4">{L.employee}</th>
                    <th className="py-3 px-4">{L.thType}</th>
                    <th className="py-3 px-4">{L.eventStatus}</th>
                    <th className="py-3 px-4">{L.thSite}</th>
                    <th className="py-3 px-4">{L.thDetails}</th>
                    <th className="py-3 px-4">{L.thDevice}</th>
                    <th className="py-3 px-4 text-right">{L.thAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        {L.empty}
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const isSuccess = log.status === 'SUCCESS';
                      const isFailed = log.status === 'FAILED' || log.status === 'REJECTED';
                      const isManual = log.status === 'MANUAL';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors">
                          {/* Ora exactă */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white text-xs">
                              <Clock size={13} className="text-slate-400" />
                              <span>{formatTime(log.created_at)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(log.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                            </div>
                          </td>

                          {/* Angajat */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {log.employee_name || L.unknownEmp}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {L.code}: {log.employee_code || '-'}
                            </div>
                          </td>

                          {/* Tip Pontaj */}
                          <td className="py-3 px-4 whitespace-nowrap font-bold">
                            {log.action_type === 'IN' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white border border-emerald-600">
                                <LogIn size={11} /> {L.typeIn}
                              </span>
                            )}
                            {log.action_type === 'OUT' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-600 text-white border border-red-600">
                                <LogOut size={11} /> {L.typeOut}
                              </span>
                            )}
                            {log.action_type === 'BREAK_START' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                                <Coffee size={11} /> {L.typeBreak}
                              </span>
                            )}
                            {log.action_type === 'BREAK_END' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                {L.typeResume}
                              </span>
                            )}
                            {log.action_type === 'LOGIN' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-600 text-white border border-blue-600">
                                {L.typeLogin}
                              </span>
                            )}
                            {log.action_type === 'STATUS_CHECK' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-50 text-slate-600 border border-slate-200">
                                {L.typeStatusCheck}
                              </span>
                            )}
                            {!['IN', 'OUT', 'BREAK_START', 'BREAK_END', 'LOGIN', 'STATUS_CHECK'].includes(log.action_type) && (
                              <span className="text-slate-500 font-medium">
                                {log.action_type || '-'}
                              </span>
                            )}
                          </td>

                          {/* Status Eveniment */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isSuccess && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} /> {L.stSuccess}
                              </span>
                            )}
                            {log.status === 'FAILED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle size={11} /> {L.stFailed}
                              </span>
                            )}
                            {log.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle size={11} /> {L.stRejected}
                              </span>
                            )}
                            {isManual && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <ShieldAlert size={11} /> {L.stManual}
                              </span>
                            )}
                          </td>

                          {/* Locație / Kiosk */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1 font-semibold">
                              <MapPin size={12} className="text-slate-400" />
                              <span>{log.location_name || L.defaultLocation}</span>
                            </div>
                            {log.kiosk_id && (
                              <div className="text-[10px] text-slate-400">
                                Kiosk #{log.kiosk_id}
                              </div>
                            )}
                          </td>

                          {/* Detalii / Motiv */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs min-w-[200px]">
                            <div className={`text-[11px] ${isFailed ? 'font-bold text-red-600 dark:text-red-400' : ''}`}>
                              {translateReason(log.failure_reason) || (isSuccess ? (log.action_type === 'LOGIN' ? L.detailLoginOk : L.detailScanOk) : '-')}
                            </div>
                          </td>

                          {/* IP / Dispozitiv */}
                          <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-500">
                            <div>IP: {log.ip_address || '-'}</div>
                          </td>

                          {/* Acțiune Intervenție */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isFailed && (
                              <button
                                onClick={() => handleOpenManualModal(log.employee_id, log.action_type || 'IN', log.created_at)}
                                className="px-2.5 py-1 rounded-full bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-bold text-[11px] border border-primary-200 inline-flex items-center gap-1"
                              >
                                <span>{L.punchManual}</span>
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginare */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                {L.paginationText(page, totalPages || 1, total)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  {L.prev}
                </button>
                <span className="font-bold text-slate-700 dark:text-slate-300 px-2">
                  {page} / {totalPages || 1}
                </span>
                <button
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  {L.next}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL INTERVENȚIE MANUALĂ DE URGENȚĂ */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-750 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {L.modalTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {L.modalSub}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="p-6 space-y-4">
              {/* Selectare Angajat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {L.employee} <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualForm.employee_id}
                  onChange={(e) => setManualForm({ ...manualForm, employee_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{L.chooseEmp}</option>
                  {meta.employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.last_name} {emp.first_name} {emp.employee_code ? `(${emp.employee_code})` : ''} - {emp.job_title || L.defaultJob}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tip Pontaj & Punct de lucru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {L.thType} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={manualForm.action_type}
                    onChange={(e) => setManualForm({ ...manualForm, action_type: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="IN">{L.optIn}</option>
                    <option value="OUT">{L.optOut}</option>
                    <option value="BREAK_START">{L.optBreakStart}</option>
                    <option value="BREAK_END">{L.optBreakEnd}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {L.workSite}
                  </label>
                  <select
                    value={manualForm.site_id}
                    onChange={(e) => setManualForm({ ...manualForm, site_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{L.defaultSite}</option>
                    {meta.locations.map(loc => (
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
                  {L.dateTimeLbl} <span className="text-red-500">*</span>
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
                  {L.reasonLbl} <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualForm.reason_preset}
                  onChange={(e) => setManualForm({ ...manualForm, reason_preset: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 mb-2"
                >
                  {REASON_PRESETS.map(p => (
                    <option key={p.key} value={p.value}>{L[p.key]}</option>
                  ))}
                </select>

                <textarea
                  value={manualForm.reason_custom}
                  onChange={(e) => setManualForm({ ...manualForm, reason_custom: e.target.value })}
                  placeholder={L.detailsPh}
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
                  {L.cancel}
                </button>

                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2.5 rounded-full text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  {submittingManual ? L.saving : L.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
