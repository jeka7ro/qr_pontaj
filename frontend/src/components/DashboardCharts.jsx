import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, LogIn, LogOut, MapPin, UserMinus, X, AlertTriangle, Search, ChevronLeft, ChevronRight, QrCode, Sun, Moon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import ReactECharts from 'echarts-for-react';


const fuzzyMatch = (str, pattern, threshold = 2) => {
  if (!pattern) return true;
  str = str.toLowerCase();
  pattern = pattern.toLowerCase();
  
  if (str.includes(pattern)) return true;
  
  // Basic Levenshtein distance (up to threshold)
  const a = str;
  const b = pattern;
  if (a.length === 0) return b.length <= threshold;
  if (b.length === 0) return a.length <= threshold;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  
  // Also check if any substring matches with threshold
  // To simulate "search" we check if pattern is close to any part of str
  // Simpler: if the distance is within threshold, or if pattern characters appear in order
  let dist = matrix[b.length][a.length];
  if (dist <= threshold) return true;
  
  // Let's check for contiguous sub-matches allowing errors
  for (let i = 0; i <= a.length - b.length; i++) {
    let err = 0;
    for (let j = 0; j < b.length; j++) {
      if (a[i+j] !== b[j]) err++;
    }
    if (err <= threshold) return true;
  }
  
  return false;
};

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

  const [shiftModal, setShiftModal] = useState({ isOpen: false, type: 'CLOSE', rowData: null, date: '', time: '17:00' });
  const [closeAllModal, setCloseAllModal] = useState({ isOpen: false, date: '', time: '' });
  const [closingAllLoading, setClosingAllLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [drillLevel, setDrillLevel] = useState('root');
  const [drillParentName, setDrillParentName] = useState('');
  const [activeDonutData, setActiveDonutData] = useState([]);
  const [chartViewMode, setChartViewMode] = useState('ALL'); // 'ALL' | 'ATTENDANCE' | 'HOURS'

  // Live Table Filters, Sorting & Pagination for 50+ employees
  const [liveSearch, setLiveSearch] = useState('');
  const [liveFilter, setLiveFilter] = useState('ALL'); // 'ALL' | 'IN' | 'OUT' | 'ABSENT'
  const [livePage, setLivePage] = useState(1);
  const [liveRowsPerPage, setLiveRowsPerPage] = useState(15);
  const [liveSortField, setLiveSortField] = useState('default'); // 'default' | 'name' | 'presence' | 'schedule' | 'duration'
  const [liveSortDirection, setLiveSortDirection] = useState('asc'); // 'asc' | 'desc'

  const handleLiveSort = (field) => {
    if (liveSortField === field) {
      setLiveSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLiveSortField(field);
      setLiveSortDirection(field === 'presence' || field === 'duration' ? 'desc' : 'asc');
    }
    setLivePage(1);
  };

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

  const handleSaveShift = async () => {
    if (!shiftModal.rowData || !shiftModal.time) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const dateVal = shiftModal.date;      
      const localDateTime = new Date(`${dateVal}T${shiftModal.time}:00`);

      const endpoint = shiftModal.type === 'START'
        ? `${apiUrl}/api/tenants/${tenant.id}/employees/${shiftModal.rowData.id}/start-shift`
        : `${apiUrl}/api/tenants/${tenant.id}/employees/${shiftModal.rowData.id}/close-shift`;

      const res = await fetch(endpoint, {
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
        throw new Error(errorData.error || `Eroare la ${shiftModal.type === 'START' ? 'pornirea' : 'închiderea'} turei`);
      }

      setShiftModal({ isOpen: false, type: 'CLOSE', rowData: null, date: '', time: '17:00' });
      fetchLive(); // reload live data
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenStartShift = (emp) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const initialTime = emp.scheduled_start_time ? emp.scheduled_start_time.substring(0, 5) : `${currentHours}:${currentMinutes}`;
    setShiftModal({
      isOpen: true,
      type: 'START',
      rowData: emp,
      date: todayStr,
      time: initialTime
    });
  };

  const handleOpenCloseShift = (emp) => {
    const presenceDateStr = emp.last_in_time || emp.absolute_last_scan;
    const initialDate = presenceDateStr ? new Date(presenceDateStr).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const initialTime = emp.scheduled_end_time ? emp.scheduled_end_time.substring(0, 5) : `${currentHours}:${currentMinutes}`;
    setShiftModal({
      isOpen: true,
      type: 'CLOSE',
      rowData: emp,
      date: initialDate,
      time: initialTime
    });
  };

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

  const handleOpenCloseAllModal = (e) => {
    if (e) e.preventDefault();
    const presentCount = liveShifts.filter(emp => emp.current_status === 'IN').length;
    if (presentCount === 0) {
      showToast('Nu există niciun angajat prezent în tura curentă.', 'info');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-CA');
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    setCloseAllModal({
      isOpen: true,
      date: todayStr,
      time: `${currentHours}:${currentMinutes}`
    });
  };

  const handleConfirmCloseAll = async () => {
    if (!closeAllModal.date || !closeAllModal.time) return;
    setClosingAllLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      const localDateTime = new Date(`${closeAllModal.date}T${closeAllModal.time}:00`);

      const res = await fetch(`${apiUrl}/api/tenant/dashboard/close-all-shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          timestamp: localDateTime.toISOString(),
          date: closeAllModal.date,
          time: closeAllModal.time
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Eroare la închiderea colectivă a turelor');
      }

      setCloseAllModal({ isOpen: false, date: '', time: '' });
      showToast(data.message || 'Turele au fost închise cu succes pentru toți angajații prezenți.');
      fetchLive();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setClosingAllLoading(false);
    }
  };

  useEffect(() => {
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
          radius: ['56%', '90%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: {
            show: true,
            position: 'inside',
            formatter: (params) => {
              if (!params.value || params.value === 0) return '';
              return `{val|${params.value}}`;
            },
            rich: {
              val: {
                fontSize: 17,
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: 22
              }
            },
            align: 'center',
            verticalAlign: 'middle',
            textShadowColor: 'rgba(0, 0, 0, 0.5)',
            textShadowBlur: 4
          },
          labelLine: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: '900',
              color: '#ffffff'
            },
            itemStyle: {
              shadowBlur: 12,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.35)'
            }
          },
          data: activeDonutData
        }
      ]
    };
  };

  const getBarOption = () => {
    const list = stats.weeklyData || [];
    const xCategories = list.map(d => `${d.name}\n${d.formattedDate || ''}`);

    const presentData = list.map(d => d.present ?? d.value ?? 0);
    const absentData = list.map(d => d.absent ?? 0);
    const hoursData = list.map(d => d.hours ?? 0);

    let series = [];
    let yAxis = [];
    let legendData = [];

    if (chartViewMode === 'ALL') {
      legendData = ['Prezenți', 'Absenți', 'Ore Lucrate'];
      yAxis = [
        {
          type: 'value',
          position: 'left',
          alignTicks: true,
          name: 'Persoane',
          nameTextStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
          axisLabel: { color: '#94a3b8', fontWeight: 'bold', formatter: '{value}' },
          minInterval: 1
        },
        {
          type: 'value',
          position: 'right',
          alignTicks: true,
          name: 'Ore (h)',
          nameTextStyle: { color: '#d97706', fontSize: 11, fontWeight: 'bold' },
          splitLine: { show: false },
          axisLabel: { 
            color: '#d97706', 
            fontWeight: 'bold',
            formatter: '{value}h'
          }
        }
      ];

      series = [
        {
          name: 'Prezenți',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 30,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#059669' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 5,
            color: '#059669',
            fontWeight: 'bold',
            fontSize: 12,
            formatter: (p) => (p.value > 0 ? `${p.value}` : '')
          },
          data: presentData
        },
        {
          name: 'Absenți',
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 30,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#f43f5e' },
                { offset: 1, color: '#e11d48' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 5,
            color: '#e11d48',
            fontWeight: 'bold',
            fontSize: 12,
            formatter: (p) => (p.value > 0 ? `${p.value}` : '')
          },
          data: absentData
        },
        {
          name: 'Ore Lucrate',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#f59e0b',
            borderWidth: 2,
            borderColor: '#ffffff'
          },
          lineStyle: {
            width: 3,
            color: '#f59e0b',
            shadowColor: 'rgba(245, 158, 11, 0.35)',
            shadowBlur: 8
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.20)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.0)' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 8,
            formatter: (p) => {
              if (!p.value || p.value <= 0) return '';
              return `{badge|${p.value}h}`;
            },
            rich: {
              badge: {
                backgroundColor: 'rgba(254, 243, 199, 0.95)',
                borderColor: '#f59e0b',
                borderWidth: 1,
                borderRadius: 6,
                padding: [2, 6],
                color: '#b45309',
                fontWeight: 'bold',
                fontSize: 11
              }
            }
          },
          data: hoursData
        }
      ];
    } else if (chartViewMode === 'ATTENDANCE') {
      legendData = ['Prezenți', 'Absenți'];
      yAxis = [
        {
          type: 'value',
          name: 'Persoane',
          nameTextStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
          axisLabel: { color: '#94a3b8', fontWeight: 'bold' },
          minInterval: 1
        }
      ];
      series = [
        {
          name: 'Prezenți',
          type: 'bar',
          barMaxWidth: 38,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#059669' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 6,
            color: '#059669',
            fontWeight: 'bold',
            fontSize: 12,
            formatter: (p) => (p.value > 0 ? `${p.value}` : '')
          },
          data: presentData
        },
        {
          name: 'Absenți',
          type: 'bar',
          barMaxWidth: 38,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#f43f5e' },
                { offset: 1, color: '#e11d48' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 6,
            color: '#e11d48',
            fontWeight: 'bold',
            fontSize: 12,
            formatter: (p) => (p.value > 0 ? `${p.value}` : '')
          },
          data: absentData
        }
      ];
    } else {
      // chartViewMode === 'HOURS'
      legendData = ['Ore Lucrate'];
      yAxis = [
        {
          type: 'value',
          name: 'Ore Lucrate (h)',
          nameTextStyle: { color: '#d97706', fontSize: 11, fontWeight: 'bold' },
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
          axisLabel: { color: '#d97706', fontWeight: 'bold', formatter: '{value}h' }
        }
      ];
      series = [
        {
          name: 'Ore Lucrate',
          type: 'bar',
          barMaxWidth: 44,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#fbbf24' },
                { offset: 1, color: '#d97706' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            distance: 6,
            color: '#d97706',
            fontWeight: 'bold',
            fontSize: 13,
            formatter: (p) => (p.value > 0 ? `${p.value}h` : '')
          },
          data: hoursData
        }
      ];
    }

    return {
      legend: {
        data: legendData,
        top: 0,
        left: 'center',
        itemGap: 16,
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 8,
        textStyle: {
          color: '#64748b',
          fontWeight: '600',
          fontSize: 11
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 12,
        padding: [10, 14],
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (params) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const day = list[idx];
          if (!day) return '';

          const present = day.present ?? day.value ?? 0;
          const absent = day.absent ?? 0;
          const hours = day.hours ?? 0;
          const total = present + absent;
          const rate = total > 0 ? Math.round((present / total) * 100) : 0;

          return `
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px; color: #f8fafc; border-bottom: 1px solid #334155; padding-bottom: 4px;">
              ${day.name} (${day.formattedDate || day.date})
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin: 3px 0;">
              <span style="color: #34d399; font-weight: 600;">● Prezenți:</span>
              <strong style="color: #ffffff;">${present} pers.</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin: 3px 0;">
              <span style="color: #fb7185; font-weight: 600;">● Absenți:</span>
              <strong style="color: #ffffff;">${absent} pers.</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin: 3px 0;">
              <span style="color: #fbbf24; font-weight: 600;">● Ore lucrate:</span>
              <strong style="color: #ffffff;">${hours} ore</strong>
            </div>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #334155; font-size: 11px; color: #94a3b8; text-align: right;">
              Rată prezență: <strong style="color: #38bdf8;">${rate}%</strong>
            </div>
          `;
        }
      },
      grid: {
        left: '2%',
        right: chartViewMode === 'ALL' ? '4%' : '2%',
        bottom: '2%',
        top: 30,
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: xCategories,
          axisTick: { alignWithLabel: true, show: false },
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { 
            color: '#64748b', 
            fontWeight: 'bold',
            interval: 0,
            lineHeight: 14,
            fontSize: 11
          }
        }
      ],
      yAxis: yAxis,
      series: series
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
    <div className="w-full">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-50 text-slate-400">
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Angajați</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.totalEmployees}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-50 text-green-500">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Prezenți Acum</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.presentNow}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-50 text-blue-500">
            <LogIn size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Intrări Astăzi</div>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{stats.todayCheckins}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ZoomCharts Style Donut (ECharts) - Slim Modern Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-1 flex flex-col justify-between relative">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Status Prezență</h3>
            {drillLevel === 'details' && (
              <button 
                onClick={onBackClick}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors z-10 flex items-center gap-1"
              >
                ⬅ Înapoi
              </button>
            )}
          </div>

          <div className="h-[210px] w-full relative">
            <ReactECharts 
              option={getDonutOption()} 
              style={{ height: '100%', width: '100%' }}
              onEvents={{ click: onChartClick }}
              opts={{ renderer: 'svg' }}
            />
            
            {/* Centered HTML overlay for Donut text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="rounded-full flex flex-col items-center justify-center shadow-inner border border-slate-700/50"
                style={{ width: '84px', height: '84px', backgroundColor: '#1e293b' }}
              >
                {drillLevel === 'root' ? (
                  <div className="text-center">
                    <div className="text-2xl font-black text-white leading-none">{stats.totalEmployees}</div>
                    <div className="text-[8px] font-bold text-slate-400 tracking-wider mt-0.5">ANGAJAȚI</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-[8px] font-bold text-slate-400 mb-0.5">FILTRU</div>
                    <div className="text-[11px] font-black text-white px-1 leading-tight uppercase truncate max-w-[70px]">{drillParentName}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Legendă cu valori explicite sub grafic */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            {activeDonutData.map((item, idx) => {
              const total = activeDonutData.reduce((sum, d) => sum + (d.value || 0), 0);
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const dotColor = item.itemStyle?.color || (item.name === 'Prezenți' ? '#3b82f6' : '#f59e0b');
              return (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }}></span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{item.name}:</span>
                  <strong className="text-[11px] font-black text-slate-900 dark:text-white">{item.value}</strong>
                  <span className="text-[10px] text-slate-400 font-bold">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ECharts Multi-Metric Chart (Slim Modern Card) */}
        {(() => {
          const todayItem = (stats.weeklyData && stats.weeklyData.length > 0)
            ? stats.weeklyData[stats.weeklyData.length - 1]
            : { name: 'Azi', present: 0, absent: 0, hours: 0 };
          const weeklyTotalHours = (stats.weeklyData || []).reduce((acc, curr) => acc + (curr.hours || 0), 0);

          return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                    Evoluție Săptămânală
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Total ore săptămână: <strong className="text-slate-700 dark:text-slate-200">{Math.round(weeklyTotalHours * 10) / 10}h</strong>
                  </p>
                </div>
                
                {/* Selector mod vizualizare */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 self-start sm:self-auto shadow-inner">
                  <button
                    type="button"
                    onClick={() => setChartViewMode('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${chartViewMode === 'ALL' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-white shadow-sm font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Complet
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('ATTENDANCE')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${chartViewMode === 'ATTENDANCE' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-white shadow-sm font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Prezență
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartViewMode('HOURS')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${chartViewMode === 'HOURS' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-white shadow-sm font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Ore
                  </button>
                </div>
              </div>

              {/* Quick KPI pill badges for Today */}
              <div className="flex flex-wrap items-center gap-2 my-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-400">Azi ({todayItem.name}):</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {todayItem.present || 0} Prezenți
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  {todayItem.absent || 0} Absenți
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {todayItem.hours || 0}h Lucrate
                </span>
              </div>

              <div className="h-[210px] w-full">
                <ReactECharts 
                  option={getBarOption()} 
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Live Shifts Table with Quick Filter Tabs & Search for 50+ employees */}
      {(() => {
        const inCount = liveShifts.filter(e => e.current_status === 'IN').length;
        const outCount = liveShifts.filter(e => e.current_status === 'OUT' && (e.last_scan_time || e.last_in_time)).length;
        const absentCount = liveShifts.filter(e => e.current_status === 'OUT' && !e.last_scan_time && !e.last_in_time).length;

        const filteredLiveShifts = liveShifts.filter(e => {
          if (liveFilter === 'IN' && e.current_status !== 'IN') return false;
          if (liveFilter === 'OUT' && (e.current_status !== 'OUT' || (!e.last_scan_time && !e.last_in_time))) return false;
          if (liveFilter === 'ABSENT' && (e.current_status !== 'OUT' || e.last_scan_time || e.last_in_time)) return false;

          if (liveSearch.trim()) {
            const q = liveSearch.toLowerCase();
            const fullName = `${e.first_name || ''} ${e.last_name || ''}`.toLowerCase();
            const job = (e.job_title || '').toLowerCase();
            const code = (e.employee_code || '').toLowerCase();
            if (!fullName.includes(q) && !job.includes(q) && !code.includes(q) && !fuzzyMatch(fullName, q, 2)) return false;
          }
          return true;
        });

        const sortedLiveShifts = [...filteredLiveShifts].sort((a, b) => {
          let comp = 0;
          if (liveSortField === 'name') {
            const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
            const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
            comp = nameA.localeCompare(nameB, 'ro');
          } else if (liveSortField === 'presence') {
            const timeA = new Date(a.last_in_time || a.absolute_last_scan || 0).getTime();
            const timeB = new Date(b.last_in_time || b.absolute_last_scan || 0).getTime();
            comp = timeA - timeB;
          } else if (liveSortField === 'schedule') {
            const schA = a.scheduled_start_time || '99:99:99';
            const schB = b.scheduled_start_time || '99:99:99';
            comp = schA.localeCompare(schB);
          } else if (liveSortField === 'duration') {
            const nowMs = Date.now();
            const getDur = (e) => {
              if (e.current_status === 'IN' && e.last_in_time) {
                return Math.max(0, nowMs - new Date(e.last_in_time).getTime());
              }
              if (e.current_status === 'OUT' && e.last_in_time && (e.last_scan_time || e.last_out_time)) {
                return Math.max(0, new Date(e.last_scan_time || e.last_out_time).getTime() - new Date(e.last_in_time).getTime());
              }
              return 0;
            };
            comp = getDur(a) - getDur(b);
          } else {
            // Default: Present (IN) first, then alphabetical by name
            const statusRankA = a.current_status === 'IN' ? 1 : 2;
            const statusRankB = b.current_status === 'IN' ? 1 : 2;
            if (statusRankA !== statusRankB) {
              comp = statusRankA - statusRankB;
            } else {
              const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
              const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
              comp = nameA.localeCompare(nameB, 'ro');
            }
          }
          return liveSortDirection === 'asc' ? comp : -comp;
        });

        const totalLivePages = Math.max(1, Math.ceil(sortedLiveShifts.length / liveRowsPerPage));
        const safePage = Math.min(livePage, totalLivePages);
        const pagedRows = liveRowsPerPage === 9999 
          ? sortedLiveShifts 
          : sortedLiveShifts.slice((safePage - 1) * liveRowsPerPage, safePage * liveRowsPerPage);

        return (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Situație Live Angajați (Tura Curentă)
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  <strong className="text-emerald-600 dark:text-emerald-400">{inCount} prezenți acum</strong> din {liveShifts.length} angajați.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                {/* Live Search */}
                <div className="relative w-full sm:w-auto">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <input
                    type="text"
                    placeholder="Caută după nume, cod, funcție..."
                    value={liveSearch}
                    onChange={(e) => { setLiveSearch(e.target.value); setLivePage(1); }}
                    className={`pl-9 ${liveSearch ? 'pr-24' : 'pr-4'} h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64 transition-all`}
                  />
                  {liveSearch && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                      <div 
                        className="text-white rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-xs"
                        style={{ backgroundColor: themeColor || '#2563eb' }}
                      >
                        {filteredLiveShifts.length} / {liveShifts.length}
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLiveSearch(''); }} 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Șterge căutarea"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex overflow-x-auto max-w-full pb-1 sm:pb-0 bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold shrink-0">
                  <button
                    onClick={() => { setLiveFilter('ALL'); setLivePage(1); }}
                    className={`px-3 py-1 rounded-full shrink-0 whitespace-nowrap transition-all ${liveFilter === 'ALL' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                  >
                    Toți ({liveShifts.length})
                  </button>
                  <button
                    onClick={() => { setLiveFilter('IN'); setLivePage(1); }}
                    className={`px-3 py-1 rounded-full shrink-0 whitespace-nowrap transition-all flex items-center gap-1.5 ${liveFilter === 'IN' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    style={liveFilter === 'IN' ? { color: themeColor } : {}}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Prezenți ({inCount})
                  </button>
                  <button
                    onClick={() => { setLiveFilter('OUT'); setLivePage(1); }}
                    className={`px-3 py-1 rounded-full shrink-0 whitespace-nowrap transition-all ${liveFilter === 'OUT' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                  >
                    Plecați ({outCount})
                  </button>
                  <button
                    onClick={() => { setLiveFilter('ABSENT'); setLivePage(1); }}
                    className={`px-3 py-1 rounded-full shrink-0 whitespace-nowrap transition-all ${liveFilter === 'ABSENT' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-amber-600'}`}
                  >
                    Absenți ({absentCount})
                  </button>
                </div>

                {/* Buton Închidere Tură pentru Toți (Aliniat spre dreapta ultimul) */}
                <button
                  type="button"
                  onClick={handleOpenCloseAllModal}
                  disabled={inCount === 0 || closingAllLoading}
                  className={`h-9 px-4 rounded-full font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap shrink-0 shadow-xs cursor-pointer select-none ${
                    inCount > 0 
                      ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-rose-200 dark:shadow-none hover:shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                  title={inCount > 0 ? `Închide manual tura pentru toți cei ${inCount} angajați prezenți` : 'Niciun angajat prezent în tură'}
                >
                  <LogOut size={14} className="shrink-0" />
                  <span>Închide Tura la Toți</span>
                  {inCount > 0 && (
                    <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px] font-black">
                      {inCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            <div>
              {liveLoading ? (
                <div className="p-8 text-center text-slate-500 font-medium">Se încarcă datele live...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 select-none">
                        <th 
                          onClick={() => handleLiveSort('default')}
                          className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-center w-10 whitespace-nowrap cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors"
                          title="Sortează implicit (Prezenți întâi)"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className={liveSortField === 'default' ? 'text-primary-600 dark:text-primary-400 font-black' : 'text-slate-400 dark:text-slate-500'}>#</span>
                            {liveSortField === 'default' && (
                              liveSortDirection === 'asc' ? <ArrowUp size={11} className="text-primary-600 dark:text-primary-400 shrink-0" /> : <ArrowDown size={11} className="text-primary-600 dark:text-primary-400 shrink-0" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleLiveSort('name')}
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors group"
                          title="Sortează alfabetic după nume"
                        >
                          <div className={`flex items-center gap-1.5 ${liveSortField === 'name' ? 'text-primary-600 dark:text-primary-400 font-black' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                            <span>Angajat</span>
                            {liveSortField === 'name' ? (
                              liveSortDirection === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />
                            ) : (
                              <ArrowUpDown size={11} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleLiveSort('presence')}
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap min-w-[130px] cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors group"
                          title="Sortează după data și ora pontajului"
                        >
                          <div className={`flex items-center gap-1.5 ${liveSortField === 'presence' ? 'text-primary-600 dark:text-primary-400 font-black' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                            <span>Prezență</span>
                            {liveSortField === 'presence' ? (
                              liveSortDirection === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />
                            ) : (
                              <ArrowUpDown size={11} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleLiveSort('schedule')}
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap min-w-[140px] cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors group"
                          title="Sortează după ora programată"
                        >
                          <div className={`flex items-center gap-1.5 ${liveSortField === 'schedule' ? 'text-primary-600 dark:text-primary-400 font-black' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                            <span>Program</span>
                            {liveSortField === 'schedule' ? (
                              liveSortDirection === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />
                            ) : (
                              <ArrowUpDown size={11} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleLiveSort('duration')}
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap min-w-[125px] cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors group"
                          title="Sortează după timpul lucrat"
                        >
                          <div className={`flex items-center gap-1.5 ${liveSortField === 'duration' ? 'text-primary-600 dark:text-primary-400 font-black' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                            <span>Timp Lucrat / Tură</span>
                            {liveSortField === 'duration' ? (
                              liveSortDirection === 'asc' ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />
                            ) : (
                              <ArrowUpDown size={11} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Acțiuni Manuale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {pagedRows.length > 0 ? pagedRows.map((emp, idx) => (
                        <LiveShiftRow 
                          key={emp.id} 
                          indexNumber={(safePage - 1) * (liveRowsPerPage === 9999 ? 0 : liveRowsPerPage) + idx + 1}
                          emp={emp} 
                          isPresent={emp.current_status === 'IN'} 
                          isOut={emp.current_status === 'OUT'} 
                          hasHistory={true} 
                          onOpenStartShift={() => handleOpenStartShift(emp)}
                          onOpenCloseShift={() => handleOpenCloseShift(emp)}
                          themeColor={themeColor}
                        />
                      )) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                            Nu există angajați conform filtrului selectat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredLiveShifts.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-2">
                  <span>Afișează</span>
                  <select
                    value={liveRowsPerPage}
                    onChange={(e) => { setLiveRowsPerPage(Number(e.target.value)); setLivePage(1); }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none font-bold text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    <option value={10}>10 rânduri</option>
                    <option value={15}>15 rânduri</option>
                    <option value={25}>25 rânduri</option>
                    <option value={50}>50 rânduri</option>
                    <option value={9999}>Toți</option>
                  </select>
                  <span>din <strong>{filteredLiveShifts.length}</strong> angajați</span>
                </div>

                {totalLivePages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold mr-1">Pagina {safePage} din {totalLivePages}</span>
                    <button
                      onClick={() => setLivePage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 shadow-sm transition-colors"
                      title="Pagina anterioară"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setLivePage(p => Math.min(totalLivePages, p + 1))}
                      disabled={safePage >= totalLivePages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 shadow-sm transition-colors"
                      title="Pagina următoare"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {shiftModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${shiftModal.type === 'START' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>
                  {shiftModal.type === 'START' ? <LogIn size={18} /> : <LogOut size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">
                    {shiftModal.type === 'START' ? 'Pornește Tura Manual' : 'Închide Tura Manual'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {shiftModal.rowData?.avatar_path ? (
                      <img 
                        src={shiftModal.rowData.avatar_path.startsWith('http') ? shiftModal.rowData.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${shiftModal.rowData.avatar_path}`} 
                        alt="avatar" 
                        className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0" 
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-200 font-bold shrink-0">
                        {shiftModal.rowData?.first_name?.[0]}{shiftModal.rowData?.last_name?.[0]}
                      </div>
                    )}
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold truncate">
                      {shiftModal.rowData?.first_name} {shiftModal.rowData?.last_name}
                    </span>
                    {shiftModal.rowData?.employee_code && (
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/60 leading-none">
                        #{shiftModal.rowData.employee_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShiftModal({ isOpen: false, type: 'CLOSE', rowData: null, date: '', time: '17:00' })} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {shiftModal.type === 'START' ? 'Data Intrării' : 'Data Ieșirii'}
                  </label>
                  <input
                    type="date"
                    value={shiftModal.date}
                    onChange={(e) => setShiftModal({ ...shiftModal, date: e.target.value })}
                    className="w-full px-3 h-10 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {shiftModal.type === 'START' ? 'Ora Intrării' : 'Ora Ieșirii'}
                  </label>
                  <input
                    type="time"
                    value={shiftModal.time}
                    onChange={(e) => setShiftModal({ ...shiftModal, time: e.target.value })}
                    className="w-full px-3 h-10 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
                {shiftModal.type === 'START' 
                  ? 'Angajatul va fi marcat ca INTRARE (Prezent) la ora specificată, util în caz de defecțiune scanner sau lipsă telefon.'
                  : 'Angajatul va fi marcat ca IEȘIRE (Plecat) și se va închide intervalul de lucru.'}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShiftModal({ isOpen: false, type: 'CLOSE', rowData: null, date: '', time: '17:00' })}
                  className="flex-1 px-4 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleSaveShift}
                  className={`flex-1 px-4 h-10 rounded-full text-white text-sm font-bold shadow-sm transition-all ${shiftModal.type === 'START' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {shiftModal.type === 'START' ? 'Pornește Tură' : 'Închide Tură'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Închidere Tură Colectivă (Toți Angajații Prezenți) */}
      {closeAllModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50/40 dark:bg-rose-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 shadow-sm shrink-0">
                  <LogOut size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                    Închidere Tură pentru Toți
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                    {liveShifts.filter(emp => emp.current_status === 'IN').length} angajați prezenți în tura curentă
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCloseAllModal({ isOpen: false, date: '', time: '' })} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Această acțiune va ponta <strong>IEȘIREA (OUT)</strong> manuală pentru toți angajații aflați în prezent la lucru.
                </div>
              </div>

              {/* Lista angajaților afectați */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Angajați Afectați ({liveShifts.filter(emp => emp.current_status === 'IN').length})
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  {liveShifts.filter(emp => emp.current_status === 'IN').map(emp => (
                    <span key={emp.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {emp.first_name} {emp.last_name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dată și Oră */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Data Ieșirii
                  </label>
                  <input
                    type="date"
                    value={closeAllModal.date}
                    onChange={(e) => setCloseAllModal({ ...closeAllModal, date: e.target.value })}
                    className="w-full px-3 h-10 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Ora Ieșirii
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const h = now.getHours().toString().padStart(2, '0');
                        const m = now.getMinutes().toString().padStart(2, '0');
                        setCloseAllModal(prev => ({ ...prev, time: `${h}:${m}` }));
                      }}
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Ora Acum
                    </button>
                  </div>
                  <input
                    type="time"
                    value={closeAllModal.time}
                    onChange={(e) => setCloseAllModal({ ...closeAllModal, time: e.target.value })}
                    className="w-full px-3 h-10 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCloseAllModal({ isOpen: false, date: '', time: '' })}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseAll}
                disabled={closingAllLoading}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {closingAllLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Se închid turele...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    <span>Confirmă Închiderea ({liveShifts.filter(emp => emp.current_status === 'IN').length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-emerald-900 text-white border-emerald-800'
          }`}>
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveShiftRow({ indexNumber, emp, isPresent, isOut, hasHistory, onOpenStartShift, onOpenCloseShift, themeColor }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (isPresent) {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isPresent]);

  let diffHrs = 0;
  let diffMins = 0;
  let diffMs = 0;
  let hasWorked = false;
  let punctualityNode = null;
  let scheduleNode = <span className="text-slate-400">-</span>;

  if (emp.scheduled_start_time && emp.scheduled_end_time) {
    scheduleNode = (
      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight whitespace-nowrap">
        {emp.scheduled_start_time.substring(0,5)} - {emp.scheduled_end_time.substring(0,5)}
      </div>
    );
  }

  const presenceDateStr = emp.last_in_time || emp.absolute_last_scan;
  const presenceDate = presenceDateStr ? new Date(presenceDateStr) : null;
  const isToday = presenceDate ? (presenceDate.getDate() === now.getDate() && presenceDate.getMonth() === now.getMonth() && presenceDate.getFullYear() === now.getFullYear()) : false;
  
  const isMissingOut = isPresent && !isToday;

  if (hasHistory && emp.last_in_time && !isMissingOut) {
    const inTime = new Date(emp.last_in_time);
    
    if (isPresent) {
      diffMs = now - inTime;
      if (diffMs > 0) {
        diffHrs = Math.floor(diffMs / 3600000);
        diffMins = Math.floor((diffMs % 3600000) / 60000);
        hasWorked = true;
      }
    } else if (isOut && isToday) {
      const outTimeStr = emp.last_scan_time || emp.last_out_time;
      if (outTimeStr) {
        const endTime = new Date(outTimeStr);
        diffMs = endTime - inTime;
        if (diffMs > 0) {
          diffHrs = Math.floor(diffMs / 3600000);
          diffMins = Math.floor((diffMs % 3600000) / 60000);
          hasWorked = true;
        }
      }
    }

    if (emp.scheduled_start_time) {
      const [hours, minutes] = emp.scheduled_start_time.split(':').map(Number);
      const scheduledDate = new Date(inTime);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const lateMs = inTime.getTime() - scheduledDate.getTime();
      if (lateMs <= 60000) { // 1 min grace
        punctualityNode = (
          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-0.5 leading-tight whitespace-nowrap">
            <Clock size={11} className="shrink-0" />
            <span className="whitespace-nowrap">LA TIMP</span>
          </div>
        );
      } else {
        const lateHrs = Math.floor(lateMs / 3600000);
        const lateMins = Math.floor((lateMs % 3600000) / 60000);
        let lateStr = '';
        if (lateHrs > 0) lateStr += `${lateHrs}h `;
        lateStr += `${lateMins}m`;
        
        punctualityNode = (
          <div className="text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center gap-1 mt-0.5 leading-tight whitespace-nowrap">
            <Clock size={11} className="shrink-0" />
            <span className="whitespace-nowrap">ÎNTÂRZIAT {lateStr}</span>
          </div>
        );
      }
    }
  }

  let lastSeenNode = <span className="text-slate-400 text-xs">-</span>;
  const siteDisplayName = emp.site_name;

  if (presenceDate) {
    const scanModeIndicator = emp.current_is_manual ? (
      <span className="inline-flex items-center justify-center cursor-help shrink-0" title="Manual">
        <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-200/80 dark:ring-amber-900/60 shadow-2xs" />
      </span>
    ) : (
      <span className="inline-flex items-center justify-center cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 shrink-0" title="Scanat QR">
        <QrCode size={12} className="shrink-0" />
      </span>
    );

    if (isToday) {
      lastSeenNode = (
        <div className="leading-tight whitespace-nowrap">
          <div className="text-slate-800 dark:text-slate-200 font-bold text-xs whitespace-nowrap">
            Azi, {presenceDate.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}
          </div>
          {siteDisplayName && (
            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 max-w-[130px] flex items-center gap-1.5" title={`${siteDisplayName} (${emp.current_is_manual ? 'Manual' : 'Scanat QR'})`}>
              {scanModeIndicator}
              <span className="truncate">{siteDisplayName}</span>
            </div>
          )}
        </div>
      );
    } else {
      lastSeenNode = (
        <div className="leading-tight whitespace-nowrap">
          <div className="text-slate-600 dark:text-slate-300 font-medium text-xs whitespace-nowrap">
            {presenceDate.toLocaleDateString('ro-RO')} {presenceDate.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}
          </div>
          {siteDisplayName && (
            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 max-w-[130px] flex items-center gap-1.5" title={`${siteDisplayName} (${emp.current_is_manual ? 'Manual' : 'Scanat QR'})`}>
              {scanModeIndicator}
              <span className="truncate">{siteDisplayName}</span>
            </div>
          )}
        </div>
      );
    }
  }

  const timerBadge = isMissingOut ? (
    <button
      onClick={() => onOpenCloseShift(emp)}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60 hover:bg-orange-100 transition-colors whitespace-nowrap shrink-0"
      title="Apasă pentru a închide tura manual"
    >
      <AlertTriangle size={10} className="shrink-0" />
      <span className="whitespace-nowrap">Închide manual</span>
    </button>
  ) : isPresent ? (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 whitespace-nowrap shrink-0 shadow-2xs"
      title={`În tură (pontat azi la ${presenceDate ? presenceDate.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'}) : ''})`}
    >
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 animate-live-blink" />
      </span>
      <span className="whitespace-nowrap">{diffHrs}h {String(diffMins).padStart(2, '0')}m</span>
    </span>
  ) : isOut && hasWorked ? (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0"
      title={`Tură finalizată (total: ${diffHrs}h ${String(diffMins).padStart(2, '0')}m)`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
      <span className="whitespace-nowrap">{diffHrs}h {String(diffMins).padStart(2, '0')}m</span>
    </span>
  ) : (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 whitespace-nowrap shrink-0"
      title="Fără pontaj înregistrat azi"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
      <span className="whitespace-nowrap">0h 00m</span>
    </span>
  );

  const isNightShift = (() => {
    const typeStr = (emp.scheduled_shift_type || emp.shift_type || '').toUpperCase();
    if (typeStr.includes('NOAPTE') || typeStr.includes('NIGHT') || typeStr.includes('SEARA')) return true;
    if (typeStr.includes('ZI') || typeStr.includes('DAY') || typeStr.includes('DIMINEATA') || typeStr.includes('NORMAL') || typeStr.includes('INTERMEDIAR')) return false;

    if (emp.scheduled_start_time) {
      const startHour = parseInt(emp.scheduled_start_time.split(':')[0], 10);
      const endHour = emp.scheduled_end_time ? parseInt(emp.scheduled_end_time.split(':')[0], 10) : null;
      if (startHour >= 18 || startHour < 6 || (endHour !== null && endHour < startHour)) return true;
      return false;
    }

    if (emp.last_in_time) {
      const hour = new Date(emp.last_in_time).getHours();
      if (hour >= 18 || hour < 6) return true;
    }

    return false;
  })();

  const shiftTypeNode = isNightShift ? (
    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-tight whitespace-nowrap">
      <Moon size={11} className="shrink-0 text-indigo-500" />
      <span className="whitespace-nowrap">Tură de noapte</span>
    </div>
  ) : (
    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 mt-0.5 leading-tight whitespace-nowrap">
      <Sun size={11} className="shrink-0 text-amber-500" />
      <span className="whitespace-nowrap">Tură de zi</span>
    </div>
  );

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
      <td className="px-3 py-1.5 text-center text-xs font-bold text-slate-400 dark:text-slate-500 select-none whitespace-nowrap">
        {indexNumber}
      </td>
      <td className="px-4 py-1.5 whitespace-nowrap">
        <Link 
          to={`/admin/employees/${emp.id}${window.location.search || ''}`}
          className="group flex items-center gap-2.5 hover:opacity-95 transition-all cursor-pointer"
          title={`Deschide fișa angajatului: ${emp.first_name} ${emp.last_name}`}
        >
          <div className="relative shrink-0">
            {emp.avatar_path ? (
              <img 
                src={emp.avatar_path.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}`} 
                alt="avatar" 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-primary-500 transition-colors shadow-2xs" 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[11px] text-slate-600 dark:text-slate-200 font-bold group-hover:ring-2 group-hover:ring-primary-500 transition-all shrink-0">
                {emp.first_name?.[0]}{emp.last_name?.[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:underline transition-colors truncate max-w-[180px]">
              {emp.first_name} {emp.last_name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {emp.employee_code && (
                <span className="inline-flex items-center px-1 py-0.2 rounded text-[10px] font-black bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 leading-none shrink-0">
                  #{emp.employee_code}
                </span>
              )}
              {emp.job_title && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px]" title={emp.job_title}>
                  {emp.job_title}
                </span>
              )}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-4 py-1.5 whitespace-nowrap">{lastSeenNode}</td>
      <td className="px-4 py-1.5 whitespace-nowrap">
        {scheduleNode}
        {punctualityNode}
      </td>
      <td className="px-4 py-1.5 whitespace-nowrap">
        <div className="leading-tight whitespace-nowrap">
          <div>{timerBadge}</div>
          {shiftTypeNode}
        </div>
      </td>
      <td className="px-4 py-1.5 text-right whitespace-nowrap">
        {isPresent ? (
          <button
            onClick={() => onOpenCloseShift(emp)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 transition-colors shadow-2xs whitespace-nowrap"
            title="Închide tura manual (ieșire)"
          >
            <LogOut size={12} className="shrink-0" />
            <span className="whitespace-nowrap">Închide Tură</span>
          </button>
        ) : (
          <button
            onClick={() => onOpenStartShift(emp)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
            style={{ color: themeColor, backgroundColor: themeColor + '1A', borderColor: themeColor + '40' }}
            title="Pornește tura manual (intrare)"
          >
            <LogIn size={12} className="shrink-0" />
            <span className="whitespace-nowrap">Pornește Tură</span>
          </button>
        )}
      </td>
    </tr>
  );
}
