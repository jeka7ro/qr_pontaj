import React, { useState, useEffect, useMemo } from 'react';
import { getApiUrl, getAuthHeaders } from '../../utils/apiUrl';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Settings, 
  Mail, 
  Send, 
  Eye, 
  Trash2, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Globe, 
  Phone, 
  UserPlus, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Inbox,
  CheckSquare,
  Square,
  Upload,
  ShieldCheck,
  Tag,
  X
} from 'lucide-react';
import HarveySearchModal, { 
  FlagRO, 
  FlagBE, 
  FlagFR, 
  FlagDE, 
  FlagNL, 
  FlagIT, 
  FlagES, 
  FlagGB, 
  FlagAT, 
  COUNTRY_NAMES 
} from './HarveySearchModal';
import HarveyReviewEmailModal from './HarveyReviewEmailModal';
import HarveySettingsModal from './HarveySettingsModal';
import HarveyAddLeadModal from './HarveyAddLeadModal';
import HarveyImportModal from './HarveyImportModal';
import HarveyAnafLookupModal from './HarveyAnafLookupModal';

const renderCountryFlag = (c) => {
  const code = (c || 'RO').toUpperCase();
  if (code === 'RO') return <FlagRO />;
  if (code === 'BE') return <FlagBE />;
  if (code === 'FR') return <FlagFR />;
  if (code === 'DE') return <FlagDE />;
  if (code === 'NL') return <FlagNL />;
  if (code === 'IT') return <FlagIT />;
  if (code === 'ES') return <FlagES />;
  if (code === 'GB') return <FlagGB />;
  if (code === 'AT') return <FlagAT />;
  return <Globe size={12} className="text-slate-400" />;
};

export default function HarveySdrView({ onConvertToTenant }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalLeads: 0, pendingReview: 0, sentToday: 0, converted: 0 });
  const [toastMessage, setToastMessage] = useState(null);

  // Multi-selectie lead-uri
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filtre și căutare
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Paginare
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modale
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAnafModalOpen, setIsAnafModalOpen] = useState(false);
  const [selectedLeadForReview, setSelectedLeadForReview] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLeadsAndStats = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const baseUrl = getApiUrl();
      const authHeaders = getAuthHeaders();
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/harvey/leads`, { headers: authHeaders }),
        fetch(`${baseUrl}/api/admin/harvey/stats`, { headers: authHeaders })
      ]);

      const leadsData = await leadsRes.json();
      const statsData = await statsRes.json();

      if (leadsData.success) {
        setLeads(leadsData.leads || []);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      setError('Eroare la preluarea datelor Harvey.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndStats();
  }, []);

  // Numărătoare și listă dinamică a tuturor țărilor existente în baza de date
  const countryCounts = useMemo(() => {
    const counts = {};
    for (const l of leads) {
      const c = (l.country || 'RO').toUpperCase();
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [leads]);

  const existingCountries = useMemo(() => {
    return Object.keys(countryCounts).sort();
  }, [countryCounts]);

  // Lista orașelor disponibile pe baza țării selectate
  const availableCities = useMemo(() => {
    const list = leads
      .filter((l) => countryFilter === 'all' || (l.country || 'RO').toUpperCase() === countryFilter.toUpperCase())
      .map((l) => l.city)
      .filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [leads, countryFilter]);

  // Numărătoare și listă dinamică a domeniilor / industriilor căutate
  const industryCounts = useMemo(() => {
    const counts = {};
    for (const l of leads) {
      const leadCountry = (l.country || 'RO').toUpperCase();
      const matchesCountry = countryFilter === 'all' || leadCountry === countryFilter.toUpperCase();
      const leadCity = (l.city || '').toLowerCase();
      const matchesCity = cityFilter === 'all' || leadCity.includes(cityFilter.toLowerCase());

      if (matchesCountry && matchesCity) {
        const ind = (l.industry && l.industry.trim()) || 'Alte Domenii';
        counts[ind] = (counts[ind] || 0) + 1;
      }
    }
    return counts;
  }, [leads, countryFilter, cityFilter]);

  const availableIndustries = useMemo(() => {
    return Object.keys(industryCounts).sort((a, b) => (industryCounts[b] || 0) - (industryCounts[a] || 0));
  }, [industryCounts]);

  // Stiluri vizuale clare per domeniu (fără culori robotizate, estetică SaaS)
  const getIndustryBadgeStyle = (industry) => {
    const ind = (industry || '').toLowerCase();
    if (ind.includes('restauran') || ind.includes('bar') || ind.includes('cafene') || ind.includes('pizzeri') || ind.includes('fast food')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800'
      };
    }
    if (ind.includes('conta') || ind.includes('saga') || ind.includes('audit') || ind.includes('expert')) {
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/60',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800'
      };
    }
    if (ind.includes('hotel') || ind.includes('pensiun') || ind.includes('cazare') || ind.includes('horeca') || ind.includes('resort')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800'
      };
    }
    if (ind.includes('curat') || ind.includes('cleaning')) {
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/60',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800'
      };
    }
    if (ind.includes('clinic') || ind.includes('medic') || ind.includes('stomatolog') || ind.includes('farmac')) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800'
      };
    }
    if (ind.includes('construc') || ind.includes('instal') || ind.includes('santier') || ind.includes('electric')) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800'
      };
    }
    if (ind.includes('salon') || ind.includes('frizer') || ind.includes('barber') || ind.includes('beauty')) {
      return {
        bg: 'bg-pink-50 dark:bg-pink-950/60',
        text: 'text-pink-700 dark:text-pink-300',
        border: 'border-pink-200 dark:border-pink-800'
      };
    }
    return {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700'
    };
  };

  // Filtrare lead-uri
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? lead.status === 'pending_review'
          : statusFilter === 'sent'
          ? lead.status === 'sent'
          : statusFilter === 'converted'
          ? lead.status === 'converted'
          : true;

      const leadCountry = (lead.country || 'RO').toUpperCase();
      const matchesCountry = countryFilter === 'all' || leadCountry === countryFilter.toUpperCase();

      const leadCity = (lead.city || '').toLowerCase();
      const matchesCity = cityFilter === 'all' || leadCity.includes(cityFilter.toLowerCase());

      const leadIndustry = (lead.industry && lead.industry.trim()) || 'Alte Domenii';
      const matchesIndustry = industryFilter === 'all' || leadIndustry === industryFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (lead.company_name && lead.company_name.toLowerCase().includes(q)) ||
        (lead.city && lead.city.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q)) ||
        (lead.industry && lead.industry.toLowerCase().includes(q));

      return matchesStatus && matchesCountry && matchesCity && matchesIndustry && matchesSearch;
    });
  }, [leads, statusFilter, countryFilter, cityFilter, industryFilter, searchQuery]);

  // Paginare date
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Funcții de selecție multiplă
  const toggleSelectLead = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllPaginatedSelected = useMemo(() => {
    if (paginatedLeads.length === 0) return false;
    return paginatedLeads.every((lead) => selectedLeadIds.includes(lead.id));
  }, [paginatedLeads, selectedLeadIds]);

  const toggleSelectAllPaginated = () => {
    if (isAllPaginatedSelected) {
      const paginatedIds = paginatedLeads.map((l) => l.id);
      setSelectedLeadIds((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    } else {
      const paginatedIds = paginatedLeads.map((l) => l.id);
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  // Acțiuni în lot (Bulk Actions)
  const handleBulkSend = async () => {
    if (selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/bulk-send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leadIds: selectedLeadIds })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Trimiterea în lot a eșuat.');
      }
      showToast(data.message);
      setSelectedLeadIds([]);
      fetchLeadsAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/bulk-delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leadIds: selectedLeadIds })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ștergerea în lot a eșuat.');
      }
      showToast(data.message, 'info');
      setSelectedLeadIds([]);
      fetchLeadsAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkGeneratePitch = async () => {
    if (selectedLeadIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/bulk-generate-pitch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ leadIds: selectedLeadIds })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Regenerarea în lot a eșuat.');
      }
      showToast(data.message);
      fetchLeadsAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDeleteLead = async (leadId) => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${leadId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
        showToast('Lead-ul a fost șters din listă.', 'info');
      }
    } catch (err) {
      showToast('Eroare la ștergerea lead-ului.', 'error');
    }
  };

  const handleSendDirect = async (lead) => {
    if (!lead.email) {
      setSelectedLeadForReview(lead);
      showToast('Adăugați o adresă de email validă înainte de trimitere.', 'error');
      return;
    }

    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/admin/harvey/leads/${lead.id}/send`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Trimiterea a eșuat.');
      }
      showToast(`Email trimis către ${lead.company_name}!`);
      fetchLeadsAndStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConvertClick = (lead) => {
    if (onConvertToTenant) {
      onConvertToTenant(lead);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-xl text-sm font-semibold transition-all ${
          toastMessage.type === 'error' ? 'bg-red-600' : toastMessage.type === 'info' ? 'bg-slate-800' : 'bg-emerald-600'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
          <span className="whitespace-nowrap shrink-0">{toastMessage.message}</span>
        </div>
      )}

      {/* Header Executiv Minimal: Titlu + Metrici compacte pe un singur rând */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Prospectare Clienți
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 whitespace-nowrap shrink-0">
              {stats.totalLeads} companii
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identificare automată companii B2B, pitch personalizat și generare lead-uri
          </p>
        </div>

        {/* Metrici compacte interactive (filtrare la 1-click) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl border text-center shrink-0 cursor-pointer transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}
            title="Filtrează companiile în așteptare"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0">În Așteptare</div>
            <div className="text-sm font-black text-amber-600 whitespace-nowrap shrink-0">{stats.pendingReview}</div>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('sent'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl border text-center shrink-0 cursor-pointer transition-all ${
              statusFilter === 'sent'
                ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300'
            }`}
            title="Filtrează companiile cărora li s-a trimis email"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0">Trimise Azi</div>
            <div className="text-sm font-black text-slate-800 dark:text-white whitespace-nowrap shrink-0">
              {stats.sentToday} <span className="text-[10px] font-normal text-slate-400">/ 25</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('converted'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl border text-center shrink-0 cursor-pointer transition-all ${
              statusFilter === 'converted'
                ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
            title="Filtrează companiile convertite în tenanți activi"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap shrink-0">Convertite</div>
            <div className="text-sm font-black text-emerald-600 whitespace-nowrap shrink-0">{stats.converted}</div>
          </button>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {selectedLeadIds.length} selectate
            </span>
            {selectedLeadIds.length < filteredLeads.length && (
              <button
                type="button"
                onClick={() => setSelectedLeadIds(filteredLeads.map((l) => l.id))}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                Selectează toate cele {filteredLeads.length} din această filtrare
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBulkSend}
              disabled={bulkActionLoading}
              className="px-3.5 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send size={12} />
              <span>Trimite ({selectedLeadIds.length})</span>
            </button>

            <button
              onClick={handleBulkGeneratePitch}
              disabled={bulkActionLoading}
              className="px-3.5 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer border border-slate-700"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>Regenerează AI</span>
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="px-3.5 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Trash2 size={12} />
              <span>Șterge</span>
            </button>

            <button
              onClick={() => setSelectedLeadIds([])}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-full hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Deselectează
            </button>
          </div>
        </div>
      )}

      {/* Bară Unificată de Căutare, Filtre și Acțiuni — UN SINGUR RÂND */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5">
        {/* Rândul 1: Totul pe un singur rând uniform, înălțime identică h-9, fără iconițe în butoane */}
        <div className="flex items-center gap-2 flex-wrap xl:flex-nowrap">
          {/* Căutare text */}
          <div className="relative flex-1 min-w-[170px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Caută companie, oraș, email..."
              className="w-full pl-8 pr-3 h-9 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Droplist Țară */}
          <select
            value={countryFilter}
            onChange={(e) => { setCountryFilter(e.target.value); setCityFilter('all'); setCurrentPage(1); }}
            className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer shrink-0"
          >
            <option value="all">Toate Țările ({leads.length})</option>
            {existingCountries.map((c) => (
              <option key={c} value={c}>
                {COUNTRY_NAMES[c] || c} ({countryCounts[c]})
              </option>
            ))}
          </select>

          {/* Droplist Oraș (dacă sunt disponibile orașe) */}
          {availableCities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[130px] truncate shrink-0"
            >
              <option value="all">Toate Orașele</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}

          {/* Droplist Căutări / Nișe (droplist unic și curat) */}
          <select
            value={industryFilter}
            onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[170px] truncate shrink-0"
          >
            <option value="all">Toate Căutările ({leads.length})</option>
            {availableIndustries.map((ind) => (
              <option key={ind} value={ind}>
                {ind} ({industryCounts[ind] || 0})
              </option>
            ))}
          </select>

          {/* Delimitator vertical */}
          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

          {/* Butoane Acțiuni — DOAR TEXT, FĂRĂ ICONIȚE, ÎNĂLȚIME IDENTICĂ h-9 */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Caută companii
          </button>

          <button
            onClick={() => setIsAddLeadModalOpen(true)}
            className="h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Manual
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Import CSV
          </button>

          <button
            onClick={() => setIsAnafModalOpen(true)}
            className="h-9 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            ANAF (CUI)
          </button>

          {/* Utilitare Setări și Refresh */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer ml-auto sm:ml-0"
            title="Setări Harvey"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={() => fetchLeadsAndStats(false)}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Reîmprospătează"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>

        {/* Bară sumară filtre active cu buton de reset */}
        {(industryFilter !== 'all' || cityFilter !== 'all' || countryFilter !== 'all' || searchQuery || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400">Filtre active:</span>
            {industryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                Nișă: {industryFilter}
                <button type="button" onClick={() => setIndustryFilter('all')} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {cityFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                Oraș: {cityFilter}
                <button type="button" onClick={() => setCityFilter('all')} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {countryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                Țară: {COUNTRY_NAMES[countryFilter] || countryFilter}
                <button type="button" onClick={() => setCountryFilter('all')} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                Căutare: "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-500 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setIndustryFilter('all');
                setCityFilter('all');
                setCountryFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer whitespace-nowrap shrink-0 ml-auto"
            >
              Resetează toate filtrele
            </button>
          </div>
        )}

        {/* Rândul 2: Status Tabs curate — culori neutre profesionale, fără culori de circ */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-3 h-8 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Toate ({leads.length})
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
              className={`px-3 h-8 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              În Așteptare ({leads.filter((l) => l.status === 'pending_review').length})
            </button>
            <button
              onClick={() => { setStatusFilter('sent'); setCurrentPage(1); }}
              className={`px-3 h-8 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'sent'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Trimise ({leads.filter((l) => l.status === 'sent').length})
            </button>
            <button
              onClick={() => { setStatusFilter('converted'); setCurrentPage(1); }}
              className={`px-3 h-8 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'converted'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Convertite ({leads.filter((l) => l.status === 'converted').length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium hidden md:block whitespace-nowrap shrink-0">
            Afișate {filteredLeads.length} din {leads.length} companii
          </div>
        </div>
      </div>

      {/* Tabel Lead-uri */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-primary-600" />
            <span className="text-sm font-medium">Se încarcă prospectele Harvey...</span>
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Inbox size={32} className="text-slate-400" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nu a fost găsit niciun prospect</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Folosește butonul «Caută Companii Noi (Multi-Select)» pentru a scana automat firme reale din restaurante, curățenie, hoteluri sau construcții.
            </p>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="mt-2 px-5 h-9 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Pornește Căutarea</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllPaginated}
                      className="p-1 text-slate-400 hover:text-primary-600 cursor-pointer shrink-0"
                      title="Selectează toate pe pagină"
                    >
                      {isAllPaginatedSelected ? (
                        <CheckSquare size={16} className="text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-4">Companie & Locație</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Unghi Personalizat AI</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {paginatedLeads.map((lead, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group ${
                        isSelected ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectLead(lead.id)}
                          className="p-1 text-slate-400 hover:text-primary-600 cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-primary-600 dark:text-primary-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Nr. Crt */}
                      <td className="py-3 px-3 text-center text-xs font-medium text-slate-400">
                        {globalIdx}
                      </td>

                      {/* Companie */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-white">{lead.company_name}</span>
                            {lead.website && (
                              <a
                                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-primary-600 transition-colors shrink-0"
                                title="Deschide website"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                              {lead.country && lead.country !== 'RO' ? `${lead.country} • ` : ''}{lead.city || 'România'}
                            </span>
                            {lead.industry && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIndustryFilter(lead.industry);
                                  setCurrentPage(1);
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all hover:scale-105 cursor-pointer whitespace-nowrap shrink-0 ${getIndustryBadgeStyle(lead.industry).bg} ${getIndustryBadgeStyle(lead.industry).text} ${getIndustryBadgeStyle(lead.industry).border}`}
                                title={`Filtrează rapid doar companiile din: ${lead.industry}`}
                              >
                                <Tag size={10} />
                                <span>{lead.industry}</span>
                              </button>
                            )}
                            {lead.cui && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0">
                                CUI: {lead.cui}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col text-xs">
                          {lead.email ? (
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                              {lead.email}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap shrink-0">
                              Email negăsit
                            </span>
                          )}
                          {lead.phone && (
                            <span className="text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone size={10} />
                              <span>{lead.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AI Hook */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2" title={lead.ai_hook || lead.draft_subject}>
                          {lead.ai_hook || lead.draft_subject || 'Pregătit pentru analiză Claude'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {lead.status === 'sent' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 whitespace-nowrap shrink-0">
                              Email Trimis
                            </span>
                            {lead.email_sent_at && (
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0" title={new Date(lead.email_sent_at).toLocaleString('ro-RO')}>
                                {new Date(lead.email_sent_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : lead.status === 'converted' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 whitespace-nowrap shrink-0">
                              Convertit
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap shrink-0">
                              Tenant Activ
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 whitespace-nowrap shrink-0">
                            În Așteptare
                          </span>
                        )}
                      </td>

                      {/* Acțiuni */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Revizuiește / Editează Email */}
                          <button
                            onClick={() => setSelectedLeadForReview(lead)}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-primary-50 hover:text-primary-600 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Revizuiește email (Human-in-the-Loop)"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Trimite Direct dacă e în așteptare */}
                          {lead.status === 'pending_review' && (
                            <button
                              onClick={() => handleSendDirect(lead)}
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                              title="Aprobă și trimite acum"
                            >
                              <Send size={13} />
                            </button>
                          )}

                          {/* Transformă în Tenant */}
                          <button
                            onClick={() => handleConvertClick(lead)}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-blue-50 hover:text-blue-600 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Creează Tenant din acest Lead"
                          >
                            <UserPlus size={14} />
                          </button>

                          {/* Șterge */}
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Șterge"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginator */}
        {!loading && filteredLeads.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Se afișează <span className="font-bold text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)}</span> din <span className="font-bold text-slate-700 dark:text-slate-200">{totalItems}</span>
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>Rânduri:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold px-2 text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale */}
      <HarveySearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearchComplete={(newLeads, message, searchedCountry, searchedCities, searchedNiches) => {
          if (searchedCountry) {
            setCountryFilter(searchedCountry);
          }
          if (searchedCities && searchedCities.length > 0) {
            setCityFilter(searchedCities[0]);
          } else {
            setCityFilter('all');
          }
          if (searchedNiches && searchedNiches.length > 0) {
            setIndustryFilter(searchedNiches[0]);
          } else {
            setIndustryFilter('all');
          }
          setStatusFilter('all');
          setSearchQuery('');
          setCurrentPage(1);
          if (newLeads && newLeads.length > 0) {
            setLeads((prev) => {
              const existingIds = new Set(prev.map((l) => l.id));
              const additions = newLeads.filter((l) => !existingIds.has(l.id));
              return [...additions, ...prev];
            });
          }
          fetchLeadsAndStats(true);
          showToast(message || `Au fost adăugate ${newLeads?.length || 0} companii în listă!`);
        }}
      />

      <HarveyAddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onLeadAdded={() => {
          fetchLeadsAndStats();
          showToast('Lead-ul a fost adăugat cu succes!');
        }}
      />

      <HarveyImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(res) => {
          fetchLeadsAndStats();
          showToast(`Au fost importate cu succes ${res.imported} lead-uri noi!`);
        }}
      />

      <HarveyAnafLookupModal
        isOpen={isAnafModalOpen}
        onClose={() => setIsAnafModalOpen(false)}
        onImportCompleted={() => {
          fetchLeadsAndStats();
          showToast('Companiile verificate oficial ANAF au fost adăugate în Harvey SDR!');
        }}
      />

      <HarveySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaved={() => showToast('Setările Harvey au fost salvate!')}
      />

      {selectedLeadForReview && (
        <HarveyReviewEmailModal
          isOpen={!!selectedLeadForReview}
          onClose={() => setSelectedLeadForReview(null)}
          lead={selectedLeadForReview}
          onUpdated={(updated) => {
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setSelectedLeadForReview(updated);
          }}
          onSent={(sentLead) => {
            setLeads((prev) => prev.map((l) => (l.id === sentLead.id ? sentLead : l)));
            setSelectedLeadForReview(null);
            fetchLeadsAndStats();
          }}
        />
      )}
    </div>
  );
}
