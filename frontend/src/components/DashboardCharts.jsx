import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { Users, Clock, LogIn } from 'lucide-react';

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
    // In a production app, we would fetch these stats from the backend.
    // For now, we simulate fetching aggregated data to demonstrate the ZoomCharts styling.
    setTimeout(() => {
      const rootData = [
        { name: 'Prezenți', value: 18, fillId: 'url(#colorPresent)', id: 'present' },
        { name: 'Absenți/Plecați', value: 24, fillId: 'url(#colorAbsent)', id: 'absent' }
      ];
      
      setStats({
        totalEmployees: 42,
        presentNow: 18,
        todayCheckins: 24,
        donutDataRoot: rootData,
        donutDataDetails: {
          'present': [
            { name: 'Bucătărie', value: 10, fillId: 'url(#colorKitchen)' },
            { name: 'Servire', value: 5, fillId: 'url(#colorService)' },
            { name: 'Curățenie', value: 3, fillId: 'url(#colorClean)' }
          ],
          'absent': [
            { name: 'Tura 2', value: 15, fillId: 'url(#colorShift2)' },
            { name: 'Concediu', value: 6, fillId: 'url(#colorVacation)' },
            { name: 'Medical', value: 3, fillId: 'url(#colorMedical)' }
          ]
        },
        weeklyData: [
          { name: 'Lu', Intrări: 32 },
          { name: 'Ma', Intrări: 35 },
          { name: 'Mi', Intrări: 40 },
          { name: 'Jo', Intrări: 38 },
          { name: 'Vi', Intrări: 42 },
          { name: 'Sâ', Intrări: 15 },
          { name: 'Du', Intrări: 12 }
        ]
      });
      setActiveDonutData(rootData);
      setLoading(false);
    }, 600);
  }, [tenant.id, themeColor]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500 font-medium">Se încarcă datele...</div>;
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
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700">
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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-300">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Angajați</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalEmployees}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-500">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Prezenți Acum</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.presentNow}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-500">
            <LogIn size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Intrări Astăzi</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.todayCheckins}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZoomCharts Style Donut */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Status Prezență</h3>
          <div className="flex-1 min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.present.start}/><stop offset="100%" stopColor={colors.present.end}/></linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.absent.start}/><stop offset="100%" stopColor={colors.absent.end}/></linearGradient>
                  <linearGradient id="colorKitchen" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.kitchen.start}/><stop offset="100%" stopColor={colors.kitchen.end}/></linearGradient>
                  <linearGradient id="colorService" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.service.start}/><stop offset="100%" stopColor={colors.service.end}/></linearGradient>
                  <linearGradient id="colorClean" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.clean.start}/><stop offset="100%" stopColor={colors.clean.end}/></linearGradient>
                  <linearGradient id="colorShift2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.shift2.start}/><stop offset="100%" stopColor={colors.shift2.end}/></linearGradient>
                  <linearGradient id="colorVacation" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.vacation.start}/><stop offset="100%" stopColor={colors.vacation.end}/></linearGradient>
                  <linearGradient id="colorMedical" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={colors.medical.start}/><stop offset="100%" stopColor={colors.medical.end}/></linearGradient>
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
                style={{ width: '150px', height: '150px', backgroundColor: '#1e293b' }} // Navy dark center
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
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Evoluție Intrări (Ultimele 7 zile)</h3>
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

      </div>
    </div>
  );
}
