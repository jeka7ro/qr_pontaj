import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import DataTable from './DataTable';

export default function TimesheetReport({ tenant, themeColor }) {
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
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/locations`);
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

      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/timesheets?${params.toString()}`);
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

  const filteredTimesheets = timesheets.filter(t => {
    if (actionFilter === 'all') return true;
    return t.action_type.toLowerCase() === actionFilter;
  });

  const columns = [
    {
      key: 'first_name', // We use first_name as the sort key
      label: 'Angajat',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar_path ? (
            <img src={`http://localhost:5001${row.avatar_path}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
              {row.first_name[0]}{row.last_name[0]}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">{row.first_name} {row.last_name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">CNP: {row.cnp || '-'}</div>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      key: 'action_type',
      label: 'Acțiune',
      render: (row) => row.action_type === 'IN' ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
          🟢 INTRARE
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
          🔴 IEȘIRE
        </span>
      )
    },
    {
      key: 'timestamp',
      label: 'Data și Ora',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-mono font-bold text-slate-800 dark:text-white">
            {new Date(row.scanned_at).toLocaleDateString('ro-RO')}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {new Date(row.scanned_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      key: 'location_name',
      label: 'Locație scanare',
      render: (row) => (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {row.location_name || '- Fără locație fixă -'}
        </span>
      )
    }
  ];

  const tableFilters = (
    <div className="flex flex-nowrap items-center gap-3 w-full overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
      <select 
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
      >
        <option value="all">Toate acțiunile</option>
        <option value="in">Doar Intrări (IN)</option>
        <option value="out">Doar Ieșiri (OUT)</option>
      </select>

      <select 
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer max-w-[200px] truncate"
      >
        <option value="all">Toate locațiile</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>

      <select 
        value={periodFilter}
        onChange={handlePeriodChange}
        className="px-3 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
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
      
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 h-10 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 transition-all">
        <input 
          type="date" 
          value={startDate}
          onChange={handleDateManualChange(setStartDate)}
          className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          title="Data Început"
        />
        <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
        <input 
          type="date" 
          value={endDate}
          onChange={handleDateManualChange(setEndDate)}
          className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
          title="Data Sfârșit"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rapoarte Pontaje</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Istoric intrări și ieșiri pentru toți angajații tăi.</p>
        </div>
      </div>

      <div className="flex-1">
        <DataTable 
          data={filteredTimesheets}
          columns={columns}
          searchPlaceholder="Caută după nume sau locație..."
          filters={tableFilters}
        />
      </div>
    </div>
  );
}
