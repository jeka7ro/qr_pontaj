import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Users,
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Share2,
  Filter,
  RefreshCw,
  CheckCircle2,
  Search,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  Clock,
  Layers
} from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';

export default function TrafficAnalyticsView() {
  const [period, setPeriod] = useState('today'); // 'today' | '24h' | '7d' | '30d'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    liveNow: 0,
    todayVisitors: 0,
    todayPageviews: 0,
    yesterdayVisitors: 0,
    sources: [],
    devices: [],
    topPages: [],
    funnel: {
      totalVisitors: 0,
      viewedPricing: 0,
      openedDemo: 0,
      cuiSearched: 0,
      demosSubmitted: 0
    },
    chartDaily: [],
    recentEvents: []
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/analytics/overview?period=${period}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.warn('Eroare preluare date analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    // Auto-refresh la fiecare 20 secunde pentru date live
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Formatare procent diferență
  const diffPercent = data.yesterdayVisitors > 0 
    ? Math.round(((data.todayVisitors - data.yesterdayVisitors) / data.yesterdayVisitors) * 100)
    : (data.todayVisitors > 0 ? 100 : 0);

  // Helper culori surse
  const getSourceBadge = (source) => {
    const s = (source || 'direct').toLowerCase();
    if (s.includes('tiktok')) {
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900', label: 'TikTok Ads' };
    }
    if (s.includes('meta') || s.includes('facebook') || s.includes('instagram')) {
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900', label: 'Meta Ads' };
    }
    if (s.includes('google')) {
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900', label: 'Google Search' };
    }
    if (s.includes('email') || s.includes('brevo')) {
      return { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900', label: 'Email Campanie' };
    }
    return { bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', label: 'Trafic Direct' };
  };

  // Helper iconiță dispozitiv
  const renderDeviceIcon = (dev) => {
    const d = (dev || '').toLowerCase();
    if (d === 'mobile') return <Smartphone size={15} className="text-blue-500" />;
    if (d === 'tablet') return <Tablet size={15} className="text-emerald-500" />;
    return <Monitor size={15} className="text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header cu Butoane de Filtru și Badge Live */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Trafic &amp; Vizitatori Live
            </h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-700 dark:text-emerald-300 text-xs font-bold whitespace-nowrap shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{data.liveNow} activi acum</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitorizare în timp real din baza de date internă (fără ad-blockere) + sincronizare Google Analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          {/* Selector Perioadă */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700/60 rounded-full text-xs font-bold">
            {[
              { id: 'today', label: 'Astăzi' },
              { id: '24h', label: '24 Ore' },
              { id: '7d', label: '7 Zile' },
              { id: '30d', label: '30 Zile' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  period === p.id 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Buton Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            title="Reîmprospătează datele"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4 Carduri KPI Principale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vizitatori Unici */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Vizitatori Unici (Azi)
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.todayVisitors}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
              diffPercent >= 0 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            }`}>
              {diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`} vs ieri
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {data.yesterdayVisitors} vizitatori înregistrați ieri
          </span>
        </div>

        {/* Afișări de Pagină */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Afișări Totale (Azi)
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Eye size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.todayPageviews}
            </span>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0">
              vizualizări
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Media de {data.todayVisitors > 0 ? (data.todayPageviews / data.todayVisitors).toFixed(1) : '1'} pagini / vizită
          </span>
        </div>

        {/* Formulare Deschise */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Interes Demo &amp; Tarife
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.funnel?.openedDemo || 0}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              modale deschise
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {data.funnel?.cuiSearched || 0} căutări de firme prin ANAF
          </span>
        </div>

        {/* Lead-uri Convertite */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Lead-uri Înregistrate
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {data.funnel?.demosSubmitted || 0}
            </span>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap shrink-0">
              conturi demo
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Rată conversie:{' '}
            <strong className="text-emerald-600">
              {data.todayVisitors > 0 ? ((data.funnel?.demosSubmitted / data.todayVisitors) * 100).toFixed(1) : 0}%
            </strong>
          </span>
        </div>
      </div>

      {/* Pâlnia de Conversie (Funnel) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers size={16} className="text-blue-600" />
          Pâlnia de Conversie a Vizitatorilor ({period === 'today' ? 'Astăzi' : period})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-bold block">1. Vizită pe Site</span>
            <strong className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
              {data.funnel?.totalVisitors || 0}
            </strong>
            <span className="text-[11px] text-slate-500 mt-0.5 block">100% din trafic</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-bold block">2. Click pe Tarife / Demo</span>
            <strong className="text-2xl font-black text-blue-600 dark:text-blue-400 block mt-1">
              {data.funnel?.openedDemo || 0}
            </strong>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {data.funnel?.totalVisitors > 0 
                ? `${Math.round(((data.funnel?.openedDemo || 0) / data.funnel.totalVisitors) * 100)}% rată de clic`
                : '0%'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-bold block">3. CUI Introdus (ANAF)</span>
            <strong className="text-2xl font-black text-amber-600 dark:text-amber-400 block mt-1">
              {data.funnel?.cuiSearched || 0}
            </strong>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {data.funnel?.openedDemo > 0 
                ? `${Math.round(((data.funnel?.cuiSearched || 0) / data.funnel.openedDemo) * 100)}% dintre deschideri`
                : '0%'}
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block">4. Cont Demo Creat</span>
            <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-300 block mt-1">
              {data.funnel?.demosSubmitted || 0}
            </strong>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 block font-bold">
              Finalizare completă
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Surse de Trafic & Dispozitive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Surse de Reclame / Campanii */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Share2 size={16} className="text-blue-600" />
              Surse de Trafic (TikTok, Meta, Google, Direct)
            </span>
            <span className="text-xs text-slate-400 font-normal">după număr de vizitatori</span>
          </h3>

          {data.sources && data.sources.length > 0 ? (
            <div className="space-y-3">
              {data.sources.map((s, idx) => {
                const badge = getSourceBadge(s.source);
                const total = data.todayVisitors || 1;
                const pct = Math.min(100, Math.round((parseInt(s.visitors, 10) / total) * 100));

                return (
                  <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        sursă: <strong className="text-slate-800 dark:text-slate-200">{s.source}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                        {s.visitors} <span className="text-xs font-normal text-slate-400">vizitatori</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nu există încă surse de trafic înregistrate în perioada selectată.
            </div>
          )}
        </div>

        {/* Dispozitive Folosite */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Smartphone size={16} className="text-blue-600" />
            Dispozitive
          </h3>

          {data.devices && data.devices.length > 0 ? (
            <div className="space-y-3">
              {data.devices.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      {renderDeviceIcon(d.device)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {d.device === 'mobile' ? 'Telefon Mobil' : d.device === 'desktop' ? 'Calculator / Laptop' : 'Tabletă'}
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                    {d.visitors}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Date despre dispozitive indisponibile momentan.
            </div>
          )}

          {/* Notă Google Analytics Integrat */}
          <div className="mt-5 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-center justify-between">
            <div>
              <strong className="block font-bold">Google Analytics (G-EZ3PHK4D9B)</strong>
              <span>Sincronizat în paralel în tag-ul site-ului.</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-bold rounded-full text-[10px] whitespace-nowrap shrink-0">
              ACTIV
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Vizitatori în Timp Real */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Jurnal Vizite în Timp Real (Ultimele Evenimente)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Actualizare automată la 20s
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap shrink-0">Oră</th>
                <th className="py-3 px-4 whitespace-nowrap shrink-0">Pagină</th>
                <th className="py-3 px-4 whitespace-nowrap shrink-0">Sursă Reclamă</th>
                <th className="py-3 px-4 whitespace-nowrap shrink-0">Dispozitiv</th>
                <th className="py-3 px-4 whitespace-nowrap shrink-0">Locație</th>
                <th className="py-3 px-4 whitespace-nowrap shrink-0">Acțiune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentEvents && data.recentEvents.length > 0 ? (
                data.recentEvents.map((ev) => {
                  const badge = getSourceBadge(ev.utm_source);
                  const timeStr = ev.created_at ? new Date(ev.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                        {timeStr}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                        {ev.page_path || '/'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap shrink-0 ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0 capitalize">
                        <span className="flex items-center gap-1.5">
                          {renderDeviceIcon(ev.device_type)}
                          <span>{ev.device_type || 'Mobil'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap shrink-0">
                        {ev.country || 'România'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${
                          ev.event_type === 'demo_submitted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : ev.event_type === 'open_demo_modal'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : ev.event_type === 'cui_search'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {ev.event_type === 'demo_submitted' ? 'Lead Înregistrat' :
                           ev.event_type === 'open_demo_modal' ? 'Deschidere Demo' :
                           ev.event_type === 'cui_search' ? 'Căutare ANAF' : 'Afișare Pagină'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Încă nu sunt vizitatori înregistrați. Intră pe <strong className="text-slate-600 dark:text-slate-200">qr.pontaj.app</strong> de pe telefon pentru a testa!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
