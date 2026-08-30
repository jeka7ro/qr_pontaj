import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogIn, LogOut, Eye } from 'lucide-react';
import DataTable from './DataTable';

export default function TimesheetReport({ tenant, themeColor, employeeId = null }) {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all'); // all, in, out
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('all');
  
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
    const groups = {};
    
    filteredTimesheets.forEach(t => {
      // 1. Determine local date (YYYY-MM-DD)
      const date = new Date(t.timestamp).toLocaleDateString('en-CA'); 
      
      const key = `${t.employee_id}_${date}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          employee_id: t.employee_id,
          first_name: t.first_name,
          last_name: t.last_name,
          employee_code: t.employee_code,
          avatar_path: t.avatar_path,
          date: date,
          raw_logs: []
        };
      }
      groups[key].raw_logs.push(t);
    });

    // Post-process groups to calculate hours and first/last
    return Object.values(groups).map(group => {
      group.raw_logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      group.first_in = group.raw_logs.find(l => l.action_type === 'IN');
      group.last_out = [...group.raw_logs].reverse().find(l => l.action_type === 'OUT');
      
      let totalMs = 0;
      let lastIn = null;
      for (const log of group.raw_logs) {
        if (log.action_type === 'IN') {
          lastIn = new Date(log.timestamp);
        } else if (log.action_type === 'OUT' && lastIn) {
          totalMs += (new Date(log.timestamp) - lastIn);
          lastIn = null;
        }
      }
      
      const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      group.total_time_str = totalMs > 0 ? `${totalHours}h ${totalMinutes}m` : '-';
      
      return group;
    });
  }, [filteredTimesheets]);

  const baseColumns = [
    {
      key: 'first_name',
      label: 'Angajat',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar_path ? (
            <img src={`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${row.avatar_path}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
              {row.first_name[0]}{row.last_name[0]}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white dark:text-white">{row.first_name} {row.last_name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium">Cod: {row.employee_code || '-'}</div>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'date',
      label: 'Data',
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
      render: (row) => row.last_out ? (
        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg w-fit">
          <LogOut size={14} />
          {new Date(row.last_out.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
        </div>
      ) : <span className="text-slate-400">-</span>
    },
    {
      key: 'total_time_str',
      label: 'Total Ore',
      render: (row) => (
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 dark:text-slate-300">
          {row.total_time_str}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acțiuni',
      render: (row) => (
        <Link 
          to={`/admin/employees/${row.employee_id}`}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          title="Vezi Profil Complet"
        >
          <Eye size={16} />
        </Link>
      )
    }
  ];
  
  const columns = employeeId ? baseColumns.filter(c => c.key !== 'first_name' && c.key !== 'actions') : baseColumns;

  const tableFilters = (
    <div className="flex flex-nowrap items-center gap-3 w-full overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
      <select 
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
      >
        <option value="all">Toate acțiunile</option>
        <option value="in">Doar Intrări (IN)</option>
        <option value="out">Doar Ieșiri (OUT)</option>
      </select>

      <select 
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer max-w-[200px] truncate"
      >
        <option value="all">Toate locațiile</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>

      <select 
        value={periodFilter}
        onChange={handlePeriodChange}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
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
      
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:border-slate-700 rounded-full px-4 h-10 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 transition-all">
        <input 
          type="date" 
          value={startDate}
          onChange={handleDateManualChange(setStartDate)}
          className="text-sm font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          title="Data Început"
        />
        <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
        <input 
          type="date" 
          value={endDate}
          onChange={handleDateManualChange(setEndDate)}
          className="text-sm font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          title="Data Sfârșit"
        />
      </div>
    </div>
  );

  return (
    <div className={`max-w-6xl mx-auto flex flex-col h-full ${!employeeId ? 'space-y-6' : 'space-y-4'}`}>
      {!employeeId && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-white">Rapoarte Pontaje</h1>
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-1">Istoric intrări și ieșiri pentru toți angajații tăi.</p>
          </div>
        </div>
      )}

      <div className="flex-1">
        <DataTable 
          data={groupedTimesheets}
          columns={columns}
          searchPlaceholder="Caută după nume sau locație..."
          filters={tableFilters}
        />
      </div>
    </div>
  );
}
