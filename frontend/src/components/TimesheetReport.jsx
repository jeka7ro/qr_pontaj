import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogIn, LogOut, Eye, X, AlertTriangle, Users, Calendar, TrendingUp, CheckCircle2, PieChart, BarChart3, Award } from 'lucide-react';
import * as XLSX from 'xlsx';
import ReactECharts from 'echarts-for-react';
import DataTable from './DataTable';

export default function TimesheetReport({ tenant, themeColor, employeeId = null }) {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all'); // all, in, out
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('all');
  const [viewMode, setViewMode] = useState('summary'); // 'summary' (Total per Angajat) | 'detailed' (Detaliat pe Zile)
  
  const [closeShiftModal, setCloseShiftModal] = useState({ isOpen: false, rowData: null, date: '', time: '17:00' });

  // Utility function for formatting dates in local timezone to avoid UTC offset issues
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date range filters (default to current month)
  const today = new Date();
  const firstDay = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastDay = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [periodFilter, setPeriodFilter] = useState('this_month');

  const handlePeriodChange = (e) => {
    const val = e.target.value;
    setPeriodFilter(val);
    
    const now = new Date();
    let start, end;
    
    switch (val) {
      case 'today':
        start = end = formatDate(new Date());
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = formatDate(yesterday);
        break;
      case 'this_week':
        const day = now.getDay() || 7; // 1-7 (Monday-Sunday)
        const monday = new Date(now);
        monday.setDate(monday.getDate() - day + 1);
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        start = formatDate(monday);
        end = formatDate(sunday);
        break;
      case 'this_month':
        start = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
        end = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        break;
      case 'last_month':
        start = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        end = formatDate(new Date(now.getFullYear(), now.getMonth(), 0));
        break;
      case 'this_year':
        start = formatDate(new Date(now.getFullYear(), 0, 1));
        end = formatDate(new Date(now.getFullYear(), 11, 31));
        break;
      case 'last_year':
        start = formatDate(new Date(now.getFullYear() - 1, 0, 1));
        end = formatDate(new Date(now.getFullYear() - 1, 11, 31));
        break;
      default:
        return; // custom - don't change dates automatically
    }
    setStartDate(start);
    setEndDate(end);
  };

  const handleDateManualChange = (setter) => (e) => {
    setter(e.target.value);
    setPeriodFilter('custom');
  };

  useEffect(() => {
    fetchLocations();
  }, [tenant.id]);

  useEffect(() => {
    fetchTimesheets();
  }, [tenant.id, startDate, endDate, locationId]);

  const handleCloseShift = async () => {
    if (!closeShiftModal.rowData || !closeShiftModal.time) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}`;
      
      // Fix timezone shifting issue
      const localDateTime = new Date(`${closeShiftModal.date}T${closeShiftModal.time}:00`);
      
      const res = await fetch(`${apiUrl}/api/tenants/${tenant.id}/employees/${closeShiftModal.rowData.employee_id}/close-shift`, {
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
      fetchTimesheets();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/locations`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (locationId) params.append('locationId', locationId);

      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/timesheets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTimesheets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter(ts => {
      if (employeeId && String(ts.employee_id) !== String(employeeId)) return false;
      if (locationId !== 'all' && String(ts.location_id) !== String(locationId)) return false;
      if (actionFilter === 'in' && ts.action_type !== 'IN') return false;
      if (actionFilter === 'out' && ts.action_type !== 'OUT') return false;
      return true;
    });
  }, [timesheets, locationId, actionFilter, employeeId]);

  const groupedTimesheets = useMemo(() => {
    // 1. Group strictly by employee_id first to pair IN and OUT chronologically
    const empGroups = {};
    filteredTimesheets.forEach(t => {
      if (!empGroups[t.employee_id]) {
        empGroups[t.employee_id] = {
          employee_id: t.employee_id,
          first_name: t.first_name,
          last_name: t.last_name,
          employee_code: t.employee_code,
          avatar_path: t.avatar_path,
          job_title: t.job_title,
          raw_logs: []
        };
      }
      empGroups[t.employee_id].raw_logs.push(t);
    });

    // 2. Pair scans into intervals for each employee
    const allIntervals = [];
    Object.values(empGroups).forEach(emp => {
      emp.raw_logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      let lastIn = null;
      for (const log of emp.raw_logs) {
        if (log.action_type === 'IN') {
          if (lastIn) {
            // Missing out for previous IN
            allIntervals.push({
              employee: emp,
              in_log: lastIn,
              out_log: null
            });
          }
          lastIn = log;
        } else if (log.action_type === 'OUT') {
          if (lastIn) {
            // Paired
            allIntervals.push({
              employee: emp,
              in_log: lastIn,
              out_log: log
            });
            lastIn = null;
          } else {
            // Missing in
            allIntervals.push({
              employee: emp,
              in_log: null,
              out_log: log
            });
          }
        }
      }
      if (lastIn) {
        allIntervals.push({
          employee: emp,
          in_log: lastIn,
          out_log: null
        });
      }
    });

    // 3. Group intervals by Date (using the IN date, or OUT date if IN is missing)
    const dateGroups = {};
    allIntervals.forEach(interval => {
      const refLog = interval.in_log || interval.out_log;
      const date = new Date(refLog.timestamp).toLocaleDateString('en-CA');
      const key = `${interval.employee.employee_id}_${date}`;
      
      if (!dateGroups[key]) {
        dateGroups[key] = {
          id: key,
          employee_id: interval.employee.employee_id,
          first_name: interval.employee.first_name,
          last_name: interval.employee.last_name,
          employee_code: interval.employee.employee_code,
          avatar_path: interval.employee.avatar_path,
          job_title: interval.employee.job_title,
          date: date,
          intervals: [],
          ongoing_ms: 0,
          missing_out: false
        };
      }
      
      const inTime = interval.in_log ? new Date(interval.in_log.timestamp) : null;
      const outTime = interval.out_log ? new Date(interval.out_log.timestamp) : null;
      
      dateGroups[key].intervals.push({ 
        in: inTime, 
        out: outTime, 
        raw_in: interval.in_log, 
        raw_out: interval.out_log 
      });
    });

    // 4. Calculate totals for each date group
    return Object.values(dateGroups).map(group => {
      let totalMs = 0;
      
      group.intervals.forEach(inv => {
        if (inv.in && inv.out) {
          totalMs += (inv.out - inv.in);
        } else if (inv.in && !inv.out) {
          const isToday = new Date().toLocaleDateString('en-CA') === group.date;
          if (isToday) {
            group.ongoing_ms += (new Date() - inv.in);
          } else {
            group.missing_out = true;
          }
        }
      });
      
      const formatDuration = (ms) => {
        const h = Math.floor(ms / (1000 * 60 * 60));
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${h}h ${m}m`;
      };
      if (group.ongoing_ms > 0) {
        group.total_time_str = `${formatDuration(totalMs + group.ongoing_ms)}`;
        group.is_ongoing = true;
      } else {
        group.total_time_str = totalMs > 0 ? formatDuration(totalMs) : '-';
      }
      group.total_time_ms = totalMs + (group.ongoing_ms || 0);
      
      // Calculate first_in and last_out for Rapoarte Pontaje main page
      const validIns = group.intervals.map(i => i.raw_in).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const validOuts = group.intervals.map(i => i.raw_out).filter(Boolean).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      group.first_in = validIns.length > 0 ? validIns[0] : null;
      group.last_out = validOuts.length > 0 ? validOuts[0] : null;

      return group;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTimesheets]);

  // Agregare centralizatoare: TOTAL pe fiecare angajat pentru perioada selectată
  const employeeSummaryTotals = useMemo(() => {
    const map = {};

    groupedTimesheets.forEach(group => {
      const empId = group.employee_id;
      if (!map[empId]) {
        map[empId] = {
          id: `emp_${empId}`,
          employee_id: empId,
          first_name: group.first_name || '',
          last_name: group.last_name || '',
          name: `${group.first_name || ''} ${group.last_name || ''}`.trim(),
          employee_code: group.employee_code || '-',
          avatar_path: group.avatar_path || null,
          job_title: group.job_title || '-',
          days_set: new Set(),
          total_sessions: 0,
          total_time_ms: 0,
          has_ongoing: false,
          missing_out_count: 0
        };
      }

      const emp = map[empId];
      if (group.date) {
        emp.days_set.add(group.date);
      }
      if (group.intervals) {
        emp.total_sessions += group.intervals.length;
      }
      if (group.is_ongoing) {
        emp.has_ongoing = true;
      }
      if (group.missing_out) {
        emp.missing_out_count += 1;
      }
      emp.total_time_ms += (group.total_time_ms || 0);
    });

    const formatDuration = (ms) => {
      if (!ms || ms <= 0) return '0h 0m';
      const h = Math.floor(ms / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    };

    return Object.values(map).map(emp => {
      const daysCount = emp.days_set.size;
      const totalHoursDecimal = Number((emp.total_time_ms / (1000 * 60 * 60)).toFixed(2));
      const avgDailyMs = daysCount > 0 ? Math.round(emp.total_time_ms / daysCount) : 0;

      return {
        ...emp,
        days_worked: daysCount,
        total_time_str: emp.total_time_ms > 0 ? formatDuration(emp.total_time_ms) : '0h 0m',
        total_hours_decimal: totalHoursDecimal,
        avg_daily_ms: avgDailyMs,
        avg_daily_str: avgDailyMs > 0 ? formatDuration(avgDailyMs) : '-'
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  }, [groupedTimesheets]);

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return dStr;
  };

  const formatDurationHelper = (ms) => {
    if (!ms || ms <= 0) return '0h 0m';
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  const analyticsSummary = useMemo(() => {
    const totalMs = employeeSummaryTotals.reduce((sum, e) => sum + e.total_time_ms, 0);
    const totalHours = Math.floor(totalMs / 3600000);
    const totalMins = Math.floor((totalMs % 3600000) / 60000);
    const totalHoursDecimal = Number((totalMs / 3600000).toFixed(1));

    const totalDaysWorked = employeeSummaryTotals.reduce((sum, e) => sum + e.days_worked, 0);
    const totalSessions = employeeSummaryTotals.reduce((sum, e) => sum + e.total_sessions, 0);

    const activeEmployeesCount = employeeSummaryTotals.length;
    const avgPerEmployeeMs = activeEmployeesCount > 0 ? Math.round(totalMs / activeEmployeesCount) : 0;
    const avgPerEmployeeStr = formatDurationHelper(avgPerEmployeeMs);

    const avgDailyMs = totalDaysWorked > 0 ? Math.round(totalMs / totalDaysWorked) : 0;
    const avgDailyStr = formatDurationHelper(avgDailyMs);

    return {
      totalMs,
      totalHours,
      totalMins,
      totalHoursDecimal,
      totalDaysWorked,
      totalSessions,
      activeEmployeesCount,
      avgPerEmployeeStr,
      avgDailyStr
    };
  }, [employeeSummaryTotals]);

  const topEmployees = useMemo(() => {
    return [...employeeSummaryTotals]
      .sort((a, b) => b.total_time_ms - a.total_time_ms)
      .slice(0, 5);
  }, [employeeSummaryTotals]);

  const getDonutRoleOption = () => {
    const map = {};
    employeeSummaryTotals.forEach(emp => {
      const role = emp.job_title || 'Nespecificat';
      map[role] = (map[role] || 0) + emp.total_time_ms;
    });

    const palette = [
      '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
      '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', 
      '#f97316', '#84cc16', '#a855f7'
    ];

    const data = Object.entries(map).map(([name, ms], i) => ({
      name,
      value: Number((ms / 3600000).toFixed(1)),
      ms,
      itemStyle: { color: palette[i % palette.length] }
    })).sort((a, b) => b.value - a.value);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const h = Math.floor(params.data.ms / 3600000);
          const m = Math.floor((params.data.ms % 3600000) / 60000);
          return `
            <div style="font-weight:bold;margin-bottom:4px;">${params.name}</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${params.color};"></span>
              <span>${h}h ${m}m (${params.percent}%)</span>
            </div>
          `;
        },
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#334155',
        textStyle: { color: '#ffffff', fontSize: 12 }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        left: '58%',
        right: '2%',
        top: 'middle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 6,
        textStyle: {
          color: '#64748b',
          fontSize: 10.5,
          fontWeight: 600
        },
        formatter: (name) => {
          const item = data.find(d => d.name === name);
          const truncName = name.length > 12 ? name.substring(0, 10) + '..' : name;
          return `${truncName} (${item ? item.value : 0}h)`;
        }
      },
      series: [
        {
          name: 'Distribuție Funcții',
          type: 'pie',
          radius: ['48%', '70%'],
          center: ['30%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#ffffff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            scale: true,
            scaleSize: 5,
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  };

  const getDailyTrendOption = () => {
    const dailyMap = {};
    groupedTimesheets.forEach(g => {
      if (g.date) {
        dailyMap[g.date] = (dailyMap[g.date] || 0) + (g.total_time_ms || 0);
      }
    });

    const sortedDates = Object.keys(dailyMap).sort();
    const xLabels = sortedDates.map(d => {
      const parts = d.split('-');
      return parts.length === 3 ? `${parts[2]}.${parts[1]}` : d;
    });
    const hoursValues = sortedDates.map(d => Number((dailyMap[d] / 3600000).toFixed(1)));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const item = params[0];
          if (!item) return '';
          const dateStr = sortedDates[item.dataIndex];
          const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('ro-RO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : item.name;
          return `
            <div style="font-weight:bold;margin-bottom:4px;">${formattedDate}</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#10b981;"></span>
              <span>Total Ore: <strong>${item.value}h</strong></span>
            </div>
          `;
        },
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#334155',
        textStyle: { color: '#ffffff', fontSize: 12 }
      },
      grid: {
        left: '2%',
        right: '3%',
        bottom: '8%',
        top: '14%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { 
          color: '#64748b', 
          fontSize: 10.5, 
          fontWeight: 600,
          rotate: xLabels.length > 10 ? 35 : 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Ore',
        nameTextStyle: { color: '#94a3b8', fontSize: 11, fontWeight: 600 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      series: [
        {
          name: 'Ore Lucrate',
          type: 'bar',
          barMaxWidth: 28,
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
            show: xLabels.length <= 14,
            position: 'top',
            color: '#059669',
            fontWeight: 'bold',
            fontSize: 10,
            formatter: (p) => p.value > 0 ? `${p.value}h` : ''
          },
          data: hoursValues
        },
        {
          name: 'Trend Ore',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#f59e0b', borderWidth: 2, borderColor: '#fff' },
          lineStyle: { width: 2.5, color: '#f59e0b' },
          data: hoursValues
        }
      ]
    };
  };

  const getFilteredEmployeeSummaries = (search) => {
    if (!search) return employeeSummaryTotals;
    const q = search.toLowerCase();
    return employeeSummaryTotals.filter(emp =>
      emp.name.toLowerCase().includes(q) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(q)) ||
      (emp.job_title && emp.job_title.toLowerCase().includes(q))
    );
  };

  // 1. Export Excel Centralizator (Total per Angajat)
  const handleExportSummary = ({ search } = {}) => {
    const list = getFilteredEmployeeSummaries(search);
    const periodText = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;

    const summaryRows = list.map((emp, idx) => ({
      "Nr. Crt.": idx + 1,
      "Angajat": emp.name,
      "Cod Angajat": emp.employee_code || '-',
      "Funcție": emp.job_title || '-',
      "Perioadă": periodText,
      "Zile Lucrate": emp.days_worked,
      "Total Sesiuni": emp.total_sessions,
      "Total Ore": emp.total_time_str,
      "Total Ore (Zecimal)": emp.total_hours_decimal,
      "Medie Ore / Zi": emp.avg_daily_str
    }));

    if (summaryRows.length > 0) {
      const grandTotalDays = list.reduce((sum, e) => sum + e.days_worked, 0);
      const grandTotalSessions = list.reduce((sum, e) => sum + e.total_sessions, 0);
      const grandTotalMs = list.reduce((sum, e) => sum + e.total_time_ms, 0);
      const grandTotalHoursDecimal = Number((grandTotalMs / (1000 * 60 * 60)).toFixed(2));

      summaryRows.push({
        "Nr. Crt.": "TOTAL",
        "Angajat": `${list.length} angajați`,
        "Cod Angajat": "-",
        "Funcție": "-",
        "Perioadă": periodText,
        "Zile Lucrate": grandTotalDays,
        "Total Sesiuni": grandTotalSessions,
        "Total Ore": formatDurationHelper(grandTotalMs),
        "Total Ore (Zecimal)": grandTotalHoursDecimal,
        "Medie Ore / Zi": "-"
      });
    }

    const ws = XLSX.utils.json_to_sheet(summaryRows);
    ws['!cols'] = [
      { wch: 8 },  // Nr. Crt.
      { wch: 28 }, // Angajat
      { wch: 14 }, // Cod Angajat
      { wch: 22 }, // Funcție
      { wch: 25 }, // Perioadă
      { wch: 14 }, // Zile Lucrate
      { wch: 14 }, // Total Sesiuni
      { wch: 16 }, // Total Ore
      { wch: 20 }, // Total Ore (Zecimal)
      { wch: 16 }  // Medie Ore / Zi
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Total Angajați");
    const fileName = `Pontaj_Total_Angajati_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 2. Export Excel Detaliat (pe Zile)
  const handleExportDetailed = ({ search } = {}) => {
    let rowsToExport = groupedTimesheets;
    if (search) {
      const q = search.toLowerCase();
      rowsToExport = groupedTimesheets.filter(r => 
        (r.first_name && r.first_name.toLowerCase().includes(q)) ||
        (r.last_name && r.last_name.toLowerCase().includes(q)) ||
        (r.employee_code && r.employee_code.toLowerCase().includes(q))
      );
    }

    const detailedRows = rowsToExport.map((row, idx) => ({
      "Nr. Crt.": idx + 1,
      "Angajat": `${row.first_name || ''} ${row.last_name || ''} (${row.employee_code || '-'})`.trim(),
      "Data": new Date(row.date).toLocaleDateString('ro-RO'),
      "Prima Intrare": row.first_in ? new Date(row.first_in.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
      "Ultima Ieșire": row.last_out ? new Date(row.last_out.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
      "Sesiuni": row.intervals ? row.intervals.length.toString() : '0',
      "Total Ore": row.total_time_str
    }));

    const ws = XLSX.utils.json_to_sheet(detailedRows);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detaliat pe Zile");
    const fileName = `Pontaj_Detaliat_Zile_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // 3. Export Excel Complet (Ambele Foi)
  const handleExportBoth = ({ search } = {}) => {
    const list = getFilteredEmployeeSummaries(search);
    const periodText = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;

    const summaryRows = list.map((emp, idx) => ({
      "Nr. Crt.": idx + 1,
      "Angajat": emp.name,
      "Cod Angajat": emp.employee_code || '-',
      "Funcție": emp.job_title || '-',
      "Perioadă": periodText,
      "Zile Lucrate": emp.days_worked,
      "Total Sesiuni": emp.total_sessions,
      "Total Ore": emp.total_time_str,
      "Total Ore (Zecimal)": emp.total_hours_decimal,
      "Medie Ore / Zi": emp.avg_daily_str
    }));

    if (summaryRows.length > 0) {
      const grandTotalDays = list.reduce((sum, e) => sum + e.days_worked, 0);
      const grandTotalSessions = list.reduce((sum, e) => sum + e.total_sessions, 0);
      const grandTotalMs = list.reduce((sum, e) => sum + e.total_time_ms, 0);
      const grandTotalHoursDecimal = Number((grandTotalMs / (1000 * 60 * 60)).toFixed(2));

      summaryRows.push({
        "Nr. Crt.": "TOTAL",
        "Angajat": `${list.length} angajați`,
        "Cod Angajat": "-",
        "Funcție": "-",
        "Perioadă": periodText,
        "Zile Lucrate": grandTotalDays,
        "Total Sesiuni": grandTotalSessions,
        "Total Ore": formatDurationHelper(grandTotalMs),
        "Total Ore (Zecimal)": grandTotalHoursDecimal,
        "Medie Ore / Zi": "-"
      });
    }

    let detailedData = groupedTimesheets;
    if (search) {
      const q = search.toLowerCase();
      detailedData = groupedTimesheets.filter(r => 
        (r.first_name && r.first_name.toLowerCase().includes(q)) ||
        (r.last_name && r.last_name.toLowerCase().includes(q)) ||
        (r.employee_code && r.employee_code.toLowerCase().includes(q))
      );
    }

    const detailedRows = detailedData.map((row, idx) => ({
      "Nr. Crt.": idx + 1,
      "Angajat": `${row.first_name || ''} ${row.last_name || ''} (${row.employee_code || '-'})`.trim(),
      "Data": new Date(row.date).toLocaleDateString('ro-RO'),
      "Prima Intrare": row.first_in ? new Date(row.first_in.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
      "Ultima Ieșire": row.last_out ? new Date(row.last_out.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
      "Sesiuni": row.intervals ? row.intervals.length.toString() : '0',
      "Total Ore": row.total_time_str
    }));

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 8 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 25 },
      { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 16 }
    ];

    const wsDetailed = XLSX.utils.json_to_sheet(detailedRows);
    wsDetailed['!cols'] = [
      { wch: 8 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsSummary, "Total Angajați");
    XLSX.utils.book_append_sheet(wb, wsDetailed, "Detaliat pe Zile");

    const fileName = `Pontaj_Complet_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportOptions = useMemo(() => {
    if (employeeId) return null;
    return [
      {
        id: 'summary',
        label: 'Centralizator (Total per Angajat)',
        description: '1 rând per angajat cu total ore și zile lucrate',
        onClick: handleExportSummary
      },
      {
        id: 'detailed',
        label: 'Detaliat (pe Zile & Sesiuni)',
        description: 'Fiecare zi de lucru pe rând separat',
        onClick: handleExportDetailed
      },
      {
        id: 'both',
        label: 'Complet (Ambele Foi în Excel)',
        description: 'Foaia 1: Total Angajați | Foaia 2: Detaliat pe Zile',
        onClick: handleExportBoth
      }
    ];
  }, [employeeSummaryTotals, groupedTimesheets, startDate, endDate, employeeId]);

  const summaryColumns = useMemo(() => [
    {
      key: 'name',
      label: 'Angajat',
      exportRender: (row) => `${row.first_name || ''} ${row.last_name || ''} (${row.employee_code || '-'})`.trim(),
      render: (row) => (
        <Link 
          to={`/admin/employees/${row.employee_id}?tab=details`} 
          className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 -m-1 rounded-lg transition-colors cursor-pointer group min-w-[170px]"
        >
          {row.avatar_path ? (
            <img 
              src={row.avatar_path.startsWith('http') ? row.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${row.avatar_path}`} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-primary-300 transition-colors shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors shrink-0">
              {(row.first_name?.[0] || '')}{(row.last_name?.[0] || '')}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
              {row.first_name} {row.last_name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Cod: {row.employee_code || '-'}
            </div>
          </div>
        </Link>
      ),
      sortable: true
    },
    {
      key: 'job_title',
      label: 'Funcție',
      exportRender: (row) => row.job_title || '-',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[120px] inline-block">
          {row.job_title || '-'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'days_worked',
      label: 'Zile Lucrate',
      exportRender: (row) => row.days_worked.toString(),
      render: (row) => (
        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg w-fit text-xs font-bold">
          <Calendar size={13} />
          <span>{row.days_worked} {row.days_worked === 1 ? 'zi' : 'zile'}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'total_sessions',
      label: 'Total Sesiuni',
      exportRender: (row) => row.total_sessions.toString(),
      render: (row) => (
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md w-fit text-xs font-bold">
          <span>{row.total_sessions}</span>
          <span className="text-[10px] uppercase">{row.total_sessions === 1 ? 'sesiune' : 'sesiuni'}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'total_time_ms',
      label: 'Total Ore',
      exportRender: (row) => row.total_time_str,
      render: (row) => (
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {row.total_time_str}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({row.total_hours_decimal}h)
            </span>
          </div>
          {row.has_ongoing && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Activ acum
            </span>
          )}
        </div>
      ),
      sortable: true
    },
    {
      key: 'avg_daily_ms',
      label: 'Medie Ore/Zi',
      exportRender: (row) => row.avg_daily_str,
      render: (row) => (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {row.avg_daily_str}
        </span>
      ),
      sortable: true
    }
  ], []);

  const tableData = useMemo(() => {
    if (!employeeId) {
      return viewMode === 'summary' ? employeeSummaryTotals : groupedTimesheets;
    }

    const rows = [];
    groupedTimesheets.forEach(group => {
      const isToday = new Date().toLocaleDateString('en-CA') === group.date;
      group.intervals.forEach((interval, index) => {
        let ms = 0;
        let ongoing_ms = 0;
        if (interval.in && interval.out) {
          ms = interval.out - interval.in;
        } else if (interval.in && !interval.out) {
          if (isToday) {
            ongoing_ms = new Date() - interval.in;
          }
        }
        
        const totalMs = ms + ongoing_ms;
        const formatDuration = (valMs) => {
          const h = Math.floor(valMs / (1000 * 60 * 60));
          const mm = Math.floor((valMs % (1000 * 60 * 60)) / (1000 * 60));
          return `${h}h ${mm}m`;
        };

        rows.push({
          id: `${group.id}_${index}`,
          employee_id: group.employee_id,
          first_name: group.first_name,
          last_name: group.last_name,
          job_title: group.job_title,
          date: group.date,
          in: interval.in,
          out: interval.out,
          total_time_ms: totalMs,
          total_time_str: totalMs > 0 ? formatDuration(totalMs) : '-',
          is_ongoing: ongoing_ms > 0,
          missing_out: !interval.out && !isToday,
          is_manual: interval.raw_out?.is_manual
        });
      });
    });
    return rows.sort((a, b) => {
       const dateDiff = new Date(b.date) - new Date(a.date);
       if (dateDiff !== 0) return dateDiff;
       return (b.in || 0) - (a.in || 0);
    });
  }, [groupedTimesheets, employeeId, viewMode, employeeSummaryTotals]);;

  const baseColumns = [
    {
      key: 'first_name',
      label: 'Angajat',
      exportRender: (row) => `${row.first_name} ${row.last_name} (${row.employee_code || '-'})`,
      render: (row) => (
        <Link to={`/admin/employees/${row.employee_id}?tab=details`} className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 -m-1 rounded-lg transition-colors cursor-pointer group min-w-[170px]">
          {row.avatar_path ? (
            <img src={( row.avatar_path?.startsWith('http') ? row.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${row.avatar_path}` )} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:border-primary-300 transition-colors shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors shrink-0">
              {row.first_name[0]}{row.last_name[0]}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{row.first_name} {row.last_name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Cod: {row.employee_code || '-'}</div>
          </div>
        </Link>
      ),
      sortable: true
    },
    {
      key: 'date',
      label: 'Data',
      exportRender: (row) => new Date(row.date).toLocaleDateString('ro-RO'),
      render: (row) => (
        <span className="text-sm font-bold text-slate-800 dark:text-white dark:text-white">
          {new Date(row.date).toLocaleDateString('ro-RO')}
        </span>
      ),
      sortable: true
    },
    {
      key: 'first_in',
      label: 'Prima Intrare',
      exportRender: (row) => row.first_in ? new Date(row.first_in.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
      render: (row) => row.first_in ? (
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg w-fit">
          <LogIn size={14} />
          {new Date(row.first_in.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
        </div>
      ) : <span className="text-slate-400">-</span>
    },
    {
      key: 'last_out',
      label: 'Ultima Ieșire',
      exportRender: (row) => row.last_out ? new Date(row.last_out.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
      render: (row) => row.last_out ? (
        <div className="flex flex-col gap-1">
          <div className={`flex items-center gap-1.5 font-bold text-sm px-2.5 py-1 rounded-lg w-fit ${row.last_out.is_manual ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'}`}>
            {row.last_out.is_manual ? (
              <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-current flex items-center justify-center text-[9px] font-black">M</span>
            ) : (
              <LogOut size={14} />
            )}
            {new Date(row.last_out.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ) : <span className="text-slate-400">-</span>
    },
    {
      key: 'sessions_count',
      label: 'Sesiuni',
      exportRender: (row) => row.intervals ? row.intervals.length.toString() : '0',
      render: (row) => (
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md w-fit text-xs font-bold">
          <span>{row.intervals ? row.intervals.length : 0}</span>
          <span className="text-[10px] uppercase">{row.intervals?.length === 1 ? 'sesiune' : 'sesiuni'}</span>
        </div>
      )
    },
    {
      key: 'total_time_str',
      label: 'Total Ore',
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300">
            {row.total_time_str}
          </span>
          {row.is_ongoing && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold whitespace-nowrap shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></div>
              <span className="whitespace-nowrap">ÎN TURĂ</span>
            </span>
          )}
          {row.missing_out && (
            <button
              onClick={() => setCloseShiftModal({ isOpen: true, rowData: row, date: row.date, time: '17:00' })}
              className="flex items-center gap-1 mt-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-xs font-medium hover:underline transition-colors"
              title="Apasă pentru a închide tura manual"
            >
              <AlertTriangle size={12} />
              Închide manual
            </button>
          )}
        </div>
      )
    }
  ];
  
  const columns = useMemo(() => {
    if (employeeId) {
      return [
        {
          key: 'nume',
          label: 'Nume Angajat',
          hidden: true,
          exportRender: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim()
        },
        {
          key: 'functie',
          label: 'Funcția',
          hidden: true,
          exportRender: (row) => row.job_title || '-'
        },
        {
          key: 'date',
          label: 'Data',
          exportRender: (row) => new Date(row.date).toLocaleDateString('ro-RO'),
          render: (row) => (
            <span className="text-sm font-medium text-slate-800 dark:text-white">
              {new Date(row.date).toLocaleDateString('ro-RO')}
            </span>
          )
        },
        {
          key: 'in',
          label: 'Intrare',
          exportRender: (row) => row.in ? new Date(row.in).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
          render: (row) => row.in ? (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-sm bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg w-fit">
              <LogIn size={14} />
              {new Date(row.in).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </div>
          ) : <span className="text-slate-400">-</span>
        },
        {
          key: 'out',
          label: 'Ieșire',
          exportRender: (row) => row.out ? new Date(row.out).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '-',
          render: (row) => row.out ? (
            <div className={`flex items-center gap-1.5 font-medium text-sm px-2.5 py-1 rounded-lg w-fit ${row.is_manual ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'}`}>
              {row.is_manual ? (
                <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-current flex items-center justify-center text-[9px] font-black">M</span>
              ) : (
                <LogOut size={14} />
              )}
              {new Date(row.out).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
            </div>
          ) : <span className="text-slate-400">-</span>
        },
        {
          key: 'total_time_str',
          label: 'Durată',
          aggregate: (rows) => {
            const sumMs = rows.reduce((sum, row) => sum + (row.total_time_ms || 0), 0);
            if (sumMs === 0) return '-';
            const h = Math.floor(sumMs / (1000 * 60 * 60));
            const mm = Math.floor((sumMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${h}h ${mm}m`;
          },
          render: (row) => (
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {row.total_time_str}
              </span>
              {row.is_ongoing && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold whitespace-nowrap shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                  <span className="whitespace-nowrap">ÎN TURĂ</span>
                </span>
              )}
              {row.missing_out && (
                <button
                  onClick={() => setCloseShiftModal({ isOpen: true, rowData: row, date: row.date, time: '17:00' })}
                  className="flex items-center gap-1 mt-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 text-xs font-medium hover:underline transition-colors"
                  title="Apasă pentru a închide tura manual"
                >
                  <AlertTriangle size={12} />
                  Închide manual
                </button>
              )}
            </div>
          )
        }
      ];
    } else if (viewMode === 'summary') {
      return summaryColumns;
    } else {
      return baseColumns;
    }
  }, [employeeId, viewMode, summaryColumns, baseColumns]);

  const tableFilters = (
    <div className="flex flex-col xl:flex-row xl:flex-nowrap items-stretch xl:items-center gap-2 sm:gap-2.5 w-full xl:w-auto xl:overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
      <select 
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer w-full xl:w-auto shrink-0"
      >
        <option value="all">Toate acțiunile</option>
        <option value="in">Doar Intrări (IN)</option>
        <option value="out">Doar Ieșiri (OUT)</option>
      </select>

      <select 
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer w-full xl:w-auto truncate shrink-0 max-w-[170px]"
      >
        <option value="all">Toate locațiile</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>

      <select 
        value={periodFilter}
        onChange={handlePeriodChange}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer w-full xl:w-auto shrink-0"
      >
        <option value="today">Azi</option>
        <option value="yesterday">Ieri</option>
        <option value="this_week">Săptămâna curentă</option>
        <option value="this_month">Luna curentă</option>
        <option value="last_month">Luna trecută</option>
        <option value="this_year">Anul curent</option>
        <option value="last_year">Anul trecut</option>
        <option value="custom">Personalizat...</option>
      </select>
      
      <div className="flex items-center justify-between xl:justify-start gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 h-10 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 transition-all w-full xl:w-auto shrink-0">
        <input 
          type="date" 
          value={startDate}
          onChange={handleDateManualChange(setStartDate)}
          className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full xl:w-auto text-center xl:text-left"
          title="Data Început"
        />
        <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
        <input 
          type="date" 
          value={endDate}
          onChange={handleDateManualChange(setEndDate)}
          className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-transparent outline-none cursor-pointer w-full xl:w-auto text-center xl:text-left"
          title="Data Sfârșit"
        />
      </div>
    </div>
  );

  return (
    <div className={`w-full flex flex-col h-full ${!employeeId ? 'space-y-6' : 'space-y-4'}`}>
      {!employeeId && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rapoarte Pontaje</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {viewMode === 'summary' 
                ? `Centralizator totalizat pe fiecare angajat (${employeeSummaryTotals.length} angajați)`
                : `Jurnal detaliat pe fiecare zi de activitate (${groupedTimesheets.length} înregistrări)`}
            </p>
          </div>

          {/* Acțiuni Antet: Toggle Vizualizare */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Vizualizare: Total pe Angajat vs Detaliat pe Zile */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'summary'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>Total per Angajat</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  {employeeSummaryTotals.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'detailed'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar size={14} />
                <span>Detaliat pe Zile</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  {groupedTimesheets.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panou Grafice & KPI Rapoarte */}
      {!employeeId && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 4 Carduri KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Ore */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Ore Lucrate</div>
                <div className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {analyticsSummary.totalHours}h {analyticsSummary.totalMins}m
                </div>
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {analyticsSummary.totalHoursDecimal} ore în perioadă
                </div>
              </div>
            </div>

            {/* Card 2: Angajați Activi */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Angajați Activi</div>
                <div className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {analyticsSummary.activeEmployeesCount} persoane
                </div>
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {analyticsSummary.totalDaysWorked} zile lucrate pontate
                </div>
              </div>
            </div>

            {/* Card 3: Medie / Angajat */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <TrendingUp size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Medie / Angajat</div>
                <div className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {analyticsSummary.avgPerEmployeeStr}
                </div>
                <div className="text-xs font-medium text-violet-600 dark:text-violet-400">
                  Medie zi: {analyticsSummary.avgDailyStr}
                </div>
              </div>
            </div>

            {/* Card 4: Sesiuni Pontaj */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sesiuni</div>
                <div className="text-xl font-black text-slate-900 dark:text-white truncate">
                  {analyticsSummary.totalSessions} pontări
                </div>
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">
                  {locations.find(l => String(l.id) === String(locationId))?.name || 'Toate locațiile'}
                </div>
              </div>
            </div>
          </div>

          {/* Grilă Grafice: Donut (Pie) + Trend Zilnic + Top Performeri */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Grafic 1: Distribuție Funcții (Donut/Pie) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Ore pe Funcții / Roluri</h3>
                  <p className="text-xs text-slate-400">Ponderea orelor lucrate per departament</p>
                </div>
                <PieChart size={18} className="text-slate-400" />
              </div>

              <div className="h-[230px] w-full relative">
                {employeeSummaryTotals.length > 0 ? (
                  <>
                    <ReactECharts 
                      option={getDonutRoleOption()} 
                      style={{ height: '100%', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                    {/* Text Suprapus Centrat pe Donut */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: '60%' }}>
                      <div className="text-center">
                        <div className="text-base font-black text-slate-800 dark:text-white leading-none">
                          {analyticsSummary.totalHours}h
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                          TOTAL
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    Nu există date în perioada selectată
                  </div>
                )}
              </div>
            </div>

            {/* Grafic 2: Evoluție Zilnică a Orelor (Bar + Trend Line) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Evoluție Zilnică Ore</h3>
                  <p className="text-xs text-slate-400">Volumul de ore lucrate pe fiecare zi din perioadă</p>
                </div>
                <BarChart3 size={18} className="text-slate-400" />
              </div>

              <div className="h-[230px] w-full">
                {groupedTimesheets.length > 0 ? (
                  <ReactECharts 
                    option={getDailyTrendOption()} 
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    Nu există date în perioada selectată
                  </div>
                )}
              </div>
            </div>

            {/* Grafic 3: Top 5 Angajați după Ore Lucrate */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Top 5 Ore Lucrate</h3>
                  <p className="text-xs text-slate-400">Cei mai activi angajați</p>
                </div>
                <Award size={18} className="text-amber-500" />
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto max-h-[230px]" style={{ scrollbarWidth: 'none' }}>
                {topEmployees.map((emp, idx) => {
                  const maxHours = topEmployees[0]?.total_hours_decimal || 1;
                  const pct = Math.min(100, Math.max(15, Math.round((emp.total_hours_decimal / maxHours) * 100)));
                  const badgeClasses = [
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300',
                    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-300',
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300',
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                  ];

                  const avatarSrc = emp.avatar_path 
                    ? (emp.avatar_path.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}`)
                    : null;

                  return (
                    <Link 
                      key={emp.employee_id} 
                      to={`/admin/employees/${emp.employee_id}?tab=details`}
                      className="block p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border shrink-0 ${badgeClasses[idx] || badgeClasses[4]}`}>
                            {idx + 1}
                          </span>

                          {/* Foto Profil Angajat */}
                          {avatarSrc ? (
                            <img 
                              src={avatarSrc}
                              alt={emp.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 group-hover:border-primary-400 transition-colors"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                              {(emp.first_name?.[0] || '')}{(emp.last_name?.[0] || '')}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                              {emp.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {emp.job_title}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {emp.total_time_str}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        <DataTable 
          columns={columns} 
          data={tableData} 
          rowKey={!employeeId && viewMode === 'summary' ? 'id' : 'id'}
          searchPlaceholder={employeeId ? "Caută după dată..." : (viewMode === 'summary' ? "Caută după nume, cod sau funcție..." : "Caută după nume sau cod...")}
          filters={tableFilters}
          emptyMessage="Nu există pontaje înregistrate."
          expandable={!employeeId}
          exportOptions={exportOptions}
          expandedRowRender={(row) => {
            if (viewMode === 'summary') {
              const empDays = groupedTimesheets.filter(g => String(g.employee_id) === String(row.employee_id));
              return (
                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white break-words">
                      Zile lucrate în perioada selectată: <span className="text-primary-600 dark:text-primary-400">{row.first_name} {row.last_name}</span>
                    </h4>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {empDays.length} {empDays.length === 1 ? 'zi' : 'zile'} | Total: {row.total_time_str}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                          <th className="px-4 py-2.5">Data</th>
                          <th className="px-4 py-2.5">Prima Intrare</th>
                          <th className="px-4 py-2.5">Ultima Ieșire</th>
                          <th className="px-4 py-2.5">Sesiuni</th>
                          <th className="px-4 py-2.5 text-right">Total Ore Zi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {empDays.map((day, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                              {new Date(day.date).toLocaleDateString('ro-RO', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {day.first_in ? (
                                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md w-fit">
                                  <LogIn size={12} />
                                  {new Date(day.first_in.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              ) : <span className="text-slate-400">-</span>}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {day.last_out ? (
                                <div className={`flex items-center gap-1.5 font-bold text-xs px-2 py-0.5 rounded-md w-fit ${day.last_out.is_manual ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'}`}>
                                  {day.last_out.is_manual ? (
                                    <span className="w-3 h-3 rounded-full border-[1.5px] border-current flex items-center justify-center text-[8px] font-black">M</span>
                                  ) : (
                                    <LogOut size={12} />
                                  )}
                                  {new Date(day.last_out.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              ) : <span className="text-slate-400">-</span>}
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                              {day.intervals?.length || 0} {day.intervals?.length === 1 ? 'sesiune' : 'sesiuni'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {day.total_time_str}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
            return (
              <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-3 break-words">
                  Istoric detaliat pentru {row.first_name} {row.last_name} ({row.date})
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[340px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Intrare</th>
                        <th className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Ieșire</th>
                        <th className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Durată</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {row.intervals && row.intervals.map((inv, idx) => {
                        let ms = 0;
                        if (inv.in && inv.out) ms = inv.out - inv.in;
                        else if (inv.in) ms = new Date() - inv.in;
                        
                        const h = Math.floor(ms / (1000 * 60 * 60));
                        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {inv.in ? new Date(inv.in).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'}) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {inv.out ? (
                                <div className={`flex items-center gap-1.5 font-bold text-sm px-2 py-0.5 rounded-md w-fit ${inv.raw_out?.is_manual ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {inv.raw_out?.is_manual && (
                                    <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-current flex items-center justify-center text-[9px] font-black">M</span>
                                  )}
                                  {new Date(inv.out).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 text-right">
                              {ms > 0 ? `${h}h ${m}m` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }}
        />
      </div>

      {closeShiftModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
