import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Users, Clock, LogIn, Eye, LogOut, MapPin } from 'lucide-react';

export default function DashboardCharts({ tenant, themeColor }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentNow: 0,
    todayCheckins: 0,
    donutDataRoot: [],
    donutDataDetails: {},
    weeklyData: []
  });
  const [loading, setLoading] = useState(true);

  const [liveShifts, setLiveShifts] = useState([]);
  const [liveLoading, setLiveLoading] = useState(true);

  
  // Drill-down states
  const [activeDonutData, setActiveDonutData] = useState([]);
  const [drillLevel, setDrillLevel] = useState('root'); // 'root' or 'details'
  const [drillParentName, setDrillParentName] = useState('');
  
  // Custom colors for gradients based on theme
  const colors = {
    present: { start: '#60a5fa', end: '#2563eb' }, // Blue gradient
    absent: { start: '#fbbf24', end: '#d97706' },  // Orange/Amber gradient
    kitchen: { start: '#a78bfa', end: '#7c3aed' }, // Purple
    service: { start: '#34d399', end: '#059669' }, // Emerald
    clean: { start: '#f472b6', end: '#db2777' },   // Pink
    shift2: { start: '#94a3b8', end: '#475569' },  // Slate
    vacation: { start: '#38bdf8', end: '#0284c7' },// Light blue
    medical: { start: '#f87171', end: '#dc2626' }  // Red
  };

  
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenant/dashboard/live`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLiveShifts(data);
        }
      } catch (err) {
        console.error('Error fetching live shifts', err);
      } finally {
        setLiveLoading(false);
      }
    };
    fetchLive();
    
    const interval = setInterval(fetchLive, 30000); // refresh la 30 secunde
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenant/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(prev => ({
            ...prev,
            totalEmployees: data.totalEmployees,
            presentNow: data.presentNow,
            todayCheckins: data.todayCheckins,
            donutDataRoot: data.donutDataRoot,
            donutDataDetails: data.donutDataDetails || {},
            siteColors: data.siteColors || [],
            weeklyData: data.weeklyData || []
          }));
          setActiveDonutData(data.donutDataRoot);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching stats', err);
        setLoading(false);
      }
    };
    fetchStats();
    
    const interval = setInterval(fetchStats, 30000); // refresh la 30 secunde
    return () => clearInterval(interval);
  }, [tenant.id]);


  if (loading) {
    return <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">Se încarcă datele...</div>;
  }

  // ZoomCharts Style Interactive Center Text
  const renderCustomizedLabel = ({ cx, cy }) => {
    if (drillLevel === 'root') {
      return (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="pointer-events-none">
          <tspan x={cx} y={cy - 10} fontSize="36" fontWeight="900" fill="#1e293b">{stats.totalEmployees}</tspan>
          <tspan x={cx} y={cy + 20} fontSize="12" fontWeight="600" fill="#64748b" letterSpacing="1">ANGAJAȚI</tspan>
        </text>
      );
    }
    
    // Drill down level - show back button
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" 
        className="cursor-pointer hover:opacity-70 transition-opacity"
        onClick={() => {
          setDrillLevel('root');
          setActiveDonutData(stats.donutDataRoot);
        }}
      >
        <tspan x={cx} y={cy - 10} fontSize="14" fontWeight="bold" fill="#64748b">⬅ ÎNAPOI</tspan>
        <tspan x={cx} y={cy + 15} fontSize="16" fontWeight="900" fill={themeColor}>{drillParentName}</tspan>
      </text>
    );
  };

  const handlePieClick = (data, index, event) => {
    // Recharts onClick passes the slice object. The original data is in data.payload
    const payload = data.payload || data;
    if (drillLevel === 'root' && payload && stats.donutDataDetails[payload.id]) {
      setDrillLevel('details');
      setDrillParentName(payload.name);
      setActiveDonutData(stats.donutDataDetails[payload.id]);
    }
  };

  // Custom Tooltip for ZoomCharts style
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-lg shadow-2xl border border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase mb-1">{label || payload[0].name}</p>
          <p className="text-xl font-bold">
            {payload[0].value} <span className="text-slate-400 text-sm font-normal">persoane</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-300">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Angajați</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white dark:text-white">{stats.totalEmployees}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-500">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Prezenți Acum</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white dark:text-white">{stats.presentNow}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-500">
            <LogIn size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Intrări Astăzi</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white dark:text-white">{stats.todayCheckins}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZoomCharts Style Donut */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 dark:border-slate-700 lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white dark:text-white mb-6">Status Prezență</h3>
          <div className="flex-1 min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.present.start}/><stop offset="100%" stopColor={colors.present.end}/></linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.absent.start}/><stop offset="100%" stopColor={colors.absent.end}/></linearGradient>
                  {stats.siteColors?.map((sc) => {
                    const cleanId = sc.id.replace('url(#', '').replace(')', '');
                    return (
                      <linearGradient key={cleanId} id={cleanId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={sc.color} />
                        <stop offset="100%" stopColor={sc.color} stopOpacity={0.7} />
                      </linearGradient>
                    );
                  })}
                </defs>
                
                <Pie
                  data={activeDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                  animationEasing="ease-out"
                  onClick={handlePieClick}
                  cursor={drillLevel === 'root' ? 'pointer' : 'default'}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 120 + 20; // push label out
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="#475569" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="11" fontWeight="600">
                        {name} ({value})
                      </text>
                    );
                  }}
                >
                  {activeDonutData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fillId} 
                      className="transition-all duration-300 hover:opacity-90"
                      style={{ outline: 'none' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Centered HTML overlay for Donut text - ZoomCharts KPI Card Style */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="rounded-full flex flex-col items-center justify-center shadow-inner"
                style={{ width: '150px', height: '150px', backgroundColor: '#1e293b' }} // Navy dark center circle
              >
                {drillLevel === 'root' ? (
                  <div className="text-center">
                    <div className="text-4xl font-black text-white leading-none">{stats.totalEmployees}</div>
                    <div className="text-xs font-bold text-slate-400 tracking-widest mt-1">ANGAJAȚI</div>
                  </div>
                ) : (
                  <div 
                    className="text-center cursor-pointer pointer-events-auto hover:scale-105 transition-transform"
                    onClick={() => {
                      setDrillLevel('root');
                      setActiveDonutData(stats.donutDataRoot);
                    }}
                  >
                    <div className="text-sm font-bold text-slate-400 mb-1">⬅ ÎNAPOI</div>
                    <div className="text-lg font-black text-white px-2 leading-tight">{drillParentName}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ZoomCharts Style Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 dark:border-slate-700 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white dark:text-white mb-6">Evoluție Intrări (Ultimele 7 zile)</h3>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#cbd5e1' }} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar 
                  dataKey="Intrări" 
                  fill="url(#barGradient)" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


      {/* Live Shifts Table */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Situație Live Angajați (Tura Curentă)
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cine este prezent acum, cine a plecat și orele aferente.</p>
        </div>
        
        <div>
          {liveLoading ? (
            <div className="p-8 text-center text-slate-500">Se încarcă datele live...</div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Angajat</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timp Lucrat (azi)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {liveShifts.length > 0 ? liveShifts.map((emp) => {
                      const isPresent = emp.current_status === 'IN';
                      const isOut = emp.current_status === 'OUT';
                      const hasHistory = isPresent || isOut;
                      
                      let durationStr = '-';
                      if (hasHistory && emp.first_in_today) {
                        const inTime = new Date(emp.first_in_today);
                        const endTime = isOut && emp.last_scan_time ? new Date(emp.last_scan_time) : new Date();
                        
                        const diffMs = endTime - inTime;
                        const diffHrs = Math.floor(diffMs / 3600000);
                        const diffMins = Math.floor((diffMs % 3600000) / 60000);
                        
                        durationStr = `${diffHrs}h ${diffMins}m`;
                      }
                      
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {emp.avatar_path ? (
                                <img src={emp.avatar_path.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}`} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                  {emp.first_name?.[0]}{emp.last_name?.[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{emp.first_name} {emp.last_name}</div>
                                {hasHistory && emp.first_in_today && (
                                  <div className="text-xs text-slate-500">De la: {new Date(emp.first_in_today).toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isPresent ? (
                              <div className="flex flex-col items-start gap-1.5">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                  ÎN TURĂ
                                </div>
                                {emp.site_name && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase border border-slate-200">
                                    <MapPin size={10} />
                                    <span className="truncate max-w-[120px]">{emp.site_name}</span>
                                  </div>
                                )}
                              </div>
                            ) : isOut ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                                <LogOut size={12} />
                                PLECAT
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
                                ABSENT
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {durationStr}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-slate-500">Nu există date pentru ziua de azi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                {liveShifts.length > 0 ? liveShifts.map((emp) => {
                  const isPresent = emp.current_status === 'IN';
                  const isOut = emp.current_status === 'OUT';
                  const hasHistory = isPresent || isOut;
                  
                  let durationStr = '-';
                  if (hasHistory && emp.first_in_today) {
                    const inTime = new Date(emp.first_in_today);
                    const endTime = isOut && emp.last_scan_time ? new Date(emp.last_scan_time) : new Date();
                    
                    const diffMs = endTime - inTime;
                    const diffHrs = Math.floor(diffMs / 3600000);
                    const diffMins = Math.floor((diffMs % 3600000) / 60000);
                    
                    durationStr = `${diffHrs}h ${diffMins}m`;
                  }
                  
                  return (
                    <div key={emp.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {emp.avatar_path ? (
                            <img src={emp.avatar_path.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}`} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                              {emp.first_name?.[0]}{emp.last_name?.[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{emp.first_name} {emp.last_name}</div>
                            {hasHistory && emp.first_in_today && (
                              <div className="text-xs text-slate-500">De la: {new Date(emp.first_in_today).toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Timp lucrat</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{durationStr}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPresent ? (
                          <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                              ÎN TURĂ
                            </div>
                            {emp.site_name && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase border border-slate-200">
                                <MapPin size={10} />
                                <span className="truncate max-w-[120px]">{emp.site_name}</span>
                              </div>
                            )}
                          </div>
                        ) : isOut ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            <LogOut size={12} />
                            PLECAT
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
                            ABSENT
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-8 text-center text-slate-500">Nu există date pentru ziua de azi.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      </div>
    </div>
  );
}
