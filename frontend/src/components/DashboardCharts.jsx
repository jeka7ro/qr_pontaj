import React, { useState, useEffect } from 'react';
import { Users, Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

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

  const [drillLevel, setDrillLevel] = useState('root');
  const [drillParentName, setDrillParentName] = useState('');
  const [activeDonutData, setActiveDonutData] = useState([]);

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
    const interval = setInterval(fetchLive, 30000);
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
            weeklyData: data.weeklyData || []
          }));
          setActiveDonutData(data.donutDataRoot.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.name === 'Prezenți' ? '#3b82f6' : '#f59e0b' } })));
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching stats', err);
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [tenant.id]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500 font-medium">Se încarcă datele...</div>;
  }

  const getDonutOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: '#1e293b',
        textStyle: { color: '#fff', fontWeight: 'bold' },
        borderWidth: 0,
        borderRadius: 8,
        padding: [10, 15]
      },
      series: [
        {
          name: 'Status',
          type: 'pie',
          radius: ['55%', '85%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{c}',
            fontSize: 13,
            fontWeight: 'bold',
            color: '#475569'
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: true
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: activeDonutData
        }
      ]
    };
  };

  const getBarOption = () => {
    const xData = stats.weeklyData.map(d => d.name);
    const yData = stats.weeklyData.map(d => d.value);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#1e293b',
        textStyle: { color: '#fff', fontWeight: 'bold' },
        borderWidth: 0,
        borderRadius: 8
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: xData,
          axisTick: { alignWithLabel: true, show: false },
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#64748b', fontWeight: 'bold' }
        }
      ],
      yAxis: [
        {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
          axisLabel: { color: '#94a3b8' }
        }
      ],
      series: [
        {
          name: 'Intrări',
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#fbbf24' },
                { offset: 1, color: '#d97706' }
              ]
            }
          },
          data: yData,
          animationDuration: 1500,
          animationEasing: 'cubicOut'
        }
      ]
    };
  };

  const onChartClick = (e) => {
    if (drillLevel === 'root' && stats.donutDataDetails[e.name]) {
      setDrillLevel('details');
      setDrillParentName(e.name);
      const details = stats.donutDataDetails[e.name];
      // Format details for ECharts
      const formatted = details.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: d.color }
      }));
      setActiveDonutData(formatted);
    }
  };

  const onBackClick = () => {
    if (drillLevel === 'details') {
      setDrillLevel('root');
      setActiveDonutData(stats.donutDataRoot.map(d => ({ name: d.name, value: d.value, itemStyle: { color: d.name === 'Prezenți' ? '#3b82f6' : '#f59e0b' } })));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-50 text-slate-400">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Angajați</div>
            <div className="text-3xl font-black text-slate-800">{stats.totalEmployees}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-50 text-green-500">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Prezenți Acum</div>
            <div className="text-3xl font-black text-slate-800">{stats.presentNow}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50 text-blue-500">
            <LogIn size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Intrări Astăzi</div>
            <div className="text-3xl font-black text-slate-800">{stats.todayCheckins}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZoomCharts Style Donut (ECharts) */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 lg:col-span-1 flex flex-col relative">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Status Prezență</h3>
          
          {drillLevel === 'details' && (
            <button 
              onClick={onBackClick}
              className="absolute top-8 right-8 text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors z-10 flex items-center gap-1"
            >
              ⬅ ÎNAPOI
            </button>
          )}

          <div className="flex-1 min-h-[350px] relative">
            <ReactECharts 
              option={getDonutOption()} 
              style={{ height: '100%', width: '100%' }}
              onEvents={{ click: onChartClick }}
              opts={{ renderer: 'svg' }}
            />
            
            {/* Centered HTML overlay for Donut text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="rounded-full flex flex-col items-center justify-center shadow-inner"
                style={{ width: '130px', height: '130px', backgroundColor: '#1e293b' }}
              >
                {drillLevel === 'root' ? (
                  <div className="text-center">
                    <div className="text-4xl font-black text-white leading-none">{stats.totalEmployees}</div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">ANGAJAȚI</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">FILTRU</div>
                    <div className="text-sm font-black text-white px-2 leading-tight uppercase">{drillParentName}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ECharts Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Evoluție Intrări (Ultimele 7 zile)</h3>
          <div className="flex-1 min-h-[350px]">
            <ReactECharts 
              option={getBarOption()} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      </div>

      {/* Live Shifts Table (Simplified for brevity) */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Situație Live Angajați (Tura Curentă)
          </h3>
          <p className="text-sm text-slate-500 mt-1">Cine este prezent acum, cine a plecat și orele aferente.</p>
        </div>
        
        <div>
          {liveLoading ? (
            <div className="p-8 text-center text-slate-500">Se încarcă datele live...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Angajat</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timp Lucrat (azi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {emp.avatar_path ? (
                              <img src={emp.avatar_path.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}`} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</div>
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
                        <td className="px-6 py-4 font-medium text-slate-700">{durationStr}</td>
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
          )}
        </div>
      </div>
    </div>
  );
}
