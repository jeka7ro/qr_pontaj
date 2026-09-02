import React, { useState, useEffect } from 'react';
import { Users, Clock, LogIn, LogOut, MapPin, UserMinus, X, AlertTriangle } from 'lucide-react';
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

  const [closeShiftModal, setCloseShiftModal] = useState({ isOpen: false, rowData: null, date: '', time: '17:00' });

  const [drillLevel, setDrillLevel] = useState('root');
  const [drillParentName, setDrillParentName] = useState('');
  const [activeDonutData, setActiveDonutData] = useState([]);

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

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseShift = async () => {
    if (!closeShiftModal.rowData || !closeShiftModal.time) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const dateToClose = closeShiftModal.date;      
      
      const localDateTime = new Date(`${dateToClose}T${closeShiftModal.time}:00`);

      const res = await fetch(`${apiUrl}/api/tenants/${tenant.id}/employees/${closeShiftModal.rowData.id}/close-shift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          timestamp: localDateTime.toISOString()
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Eroare la închiderea turei');
      }

      setCloseShiftModal({ isOpen: false, rowData: null, date: '', time: '17:00' });
      fetchLive(); // reload live data
    } catch (err) {
      alert(err.message);
    }
  };

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
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prezență</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timp Lucrat (azi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveShifts.length > 0 ? liveShifts.map((emp) => (
              <LiveShiftRow 
                key={emp.id} 
                emp={emp} 
                isPresent={emp.current_status === 'IN'} 
                isOut={emp.current_status === 'OUT'} 
                hasHistory={true} 
                onOpenCloseShift={(e) => {
                  const presenceDateStr = e.first_in_today || e.absolute_last_scan;
                  const initialDate = presenceDateStr ? new Date(presenceDateStr).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
                  setCloseShiftModal({ isOpen: true, rowData: e, date: initialDate, time: '17:00' });
                }}
              />
            )) : (
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

      {closeShiftModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Închide Tura Manual</h3>
              <button onClick={() => setCloseShiftModal({ isOpen: false, rowData: null, date: '', time: '17:00' })} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data ieșirii</label>
                  <input
                    type="date"
                    value={closeShiftModal.date}
                    onChange={(e) => setCloseShiftModal({ ...closeShiftModal, date: e.target.value })}
                    className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ora ieșirii</label>
                  <input
                    type="time"
                    value={closeShiftModal.time}
                    onChange={(e) => setCloseShiftModal({ ...closeShiftModal, time: e.target.value })}
                    className="w-full px-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setCloseShiftModal({ isOpen: false, rowData: null, date: '', time: '17:00' })}
                  className="flex-1 px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleCloseShift}
                  className="flex-1 px-5 h-10 rounded-full text-white text-sm font-bold shadow-sm transition-all"
                  style={{ backgroundColor: themeColor }}
                >
                  Salvează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveShiftRow({ emp, isPresent, isOut, hasHistory, onOpenCloseShift }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (isPresent) {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isPresent]);

  let durationNode = <span className="text-slate-400">-</span>;
  let punctualityNode = null;
  let scheduleNode = <span className="text-slate-400">-</span>;

  if (emp.scheduled_start_time && emp.scheduled_end_time) {
    scheduleNode = (
      <div className="text-sm font-medium text-slate-800 leading-tight">
        {emp.scheduled_start_time.substring(0,5)} - {emp.scheduled_end_time.substring(0,5)}
      </div>
    );
  }

  const presenceDateStr = emp.first_in_today || emp.absolute_last_scan;
  const presenceDate = presenceDateStr ? new Date(presenceDateStr) : null;
  const isToday = presenceDate ? (presenceDate.getDate() === now.getDate() && presenceDate.getMonth() === now.getMonth() && presenceDate.getFullYear() === now.getFullYear()) : false;
  
  const isMissingOut = isPresent && !isToday;

  if (hasHistory && emp.first_in_today && !isMissingOut) {
    const inTime = new Date(emp.first_in_today);
    const endTime = isOut && emp.last_scan_time ? new Date(emp.last_scan_time) : now;
    const diffMs = endTime - inTime;
    
    if (diffMs > 0) {
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      if (isPresent) {
        const showColon = now.getSeconds() % 2 === 0;
        const blinkClass = `transition-opacity duration-200 ${showColon ? 'opacity-100' : 'opacity-0'}`;
        const colonClass = `mx-[1px] ${blinkClass}`;
        
        durationNode = (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="flex items-center">
              <span className="w-[18px] text-center">{diffHrs.toString().padStart(2, '0')}</span>
              <span className={colonClass}>:</span>
              <span className="w-[18px] text-center">{diffMins.toString().padStart(2, '0')}</span>
              <span className={colonClass}>:</span>
              <span className="w-[18px] text-center">{diffSecs.toString().padStart(2, '0')}</span>
            </div>
          </div>
        );
      } else {
        durationNode = (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>{diffHrs}h {diffMins}m</span>
          </div>
        );
      }
    }

    if (emp.scheduled_start_time) {
      const [hours, minutes] = emp.scheduled_start_time.split(':').map(Number);
      const scheduledDate = new Date(inTime);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const lateMs = inTime.getTime() - scheduledDate.getTime();
      if (lateMs <= 60000) { // 1 min grace
        punctualityNode = <div className="text-emerald-600 font-medium text-sm flex items-center gap-1 mt-1"><Clock className="text-emerald-500" size={16} /> LA TIMP</div>;
      } else {
        const lateHrs = Math.floor(lateMs / 3600000);
        const lateMins = Math.floor((lateMs % 3600000) / 60000);
        let lateStr = '';
        if (lateHrs > 0) lateStr += `${lateHrs}h `;
        lateStr += `${lateMins}m`;
        
        punctualityNode = <div className="text-red-600 font-medium text-sm flex items-center gap-1 mt-1"><Clock className="text-red-500" size={16} /> ÎNTÂRZIAT {lateStr}</div>;
      }
    }
  }

  let lastSeenNode = <span className="text-slate-400">-</span>;
  if (presenceDate) {
    if (isToday) {
      lastSeenNode = <span className="text-slate-700 font-medium text-sm">Azi, {presenceDate.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}</span>;
    } else {
      lastSeenNode = <span className="text-slate-500 text-sm">{presenceDate.toLocaleDateString('ro-RO')} {presenceDate.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}</span>;
    }
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
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
                              <div className="font-medium text-slate-900 text-sm leading-tight">{emp.first_name} {emp.last_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isMissingOut ? (
                            <button
                              onClick={() => onOpenCloseShift(emp)}
                              className="flex items-center gap-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-xs font-medium hover:underline transition-colors"
                              title="Apasă pentru a închide tura manual"
                            >
                              <AlertTriangle size={12} />
                              Închide manual
                            </button>
                          ) : isPresent ? (
                            <div className="text-emerald-600 font-medium text-sm flex items-center gap-1.5">
                              <LogIn className="text-emerald-500" size={16} />
                              ÎN TURĂ
                            </div>
                          ) : isOut ? (
                            <div className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
                              <LogOut className="text-slate-400" size={16} />
                              PLECAT
                            </div>
                          ) : (
                            <div className="text-slate-400 font-medium text-sm flex items-center gap-1.5">
                              <UserMinus className="text-slate-300" size={16} />
                              ABSENT
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">{lastSeenNode}</td>
                        <td className="px-6 py-4">
                          {scheduleNode}
                          {punctualityNode}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{durationNode}</td>
                      </tr>
  );
}
