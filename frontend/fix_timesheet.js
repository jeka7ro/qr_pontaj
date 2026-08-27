const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import DataTable from './DataTable';

export default function TimesheetReport({ tenant, themeColor }) {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all'); // all, in, out
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('all');
  
  // Date range filters (default to current month)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  useEffect(() => {
    fetchLocations();
  }, [tenant.id]);

  useEffect(() => {
    fetchTimesheets();
  }, [tenant.id, startDate, endDate, locationId]);

  const fetchLocations = async () => {
    try {
      const res = await fetch(\`http://localhost:5001/api/tenants/\${tenant.id}/locations\`);
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

      const res = await fetch(\`http://localhost:5001/api/tenants/\${tenant.id}/timesheets?\${params.toString()}\`);
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
            <img src={\`http://localhost:5001\${row.avatar_path}\`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
              {row.first_name[0]}{row.last_name[0]}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-slate-800">{row.first_name} {row.last_name}</div>
            <div className="text-xs text-slate-500">{row.job_title || 'Angajat'}</div>
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
        <div>
          <span className="text-sm font-medium text-slate-700 mr-2">
            {new Date(row.timestamp).toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          <span className="text-sm font-mono font-bold text-slate-800">
            {new Date(row.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      key: 'location_name',
      label: 'Locație scanare',
      render: (row) => (
        <span className="text-sm font-medium text-slate-600">
          {row.location_name || '- Fără locație fixă -'}
        </span>
      )
    }
  ];

  const tableFilters = (
    <div className="flex flex-wrap items-center gap-3">
      <select 
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
      >
        <option value="all">Toate acțiunile</option>
        <option value="in">Doar Intrări (IN)</option>
        <option value="out">Doar Ieșiri (OUT)</option>
      </select>

      <select 
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="px-3 h-10 rounded-full border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer max-w-[200px] truncate"
      >
        <option value="all">Toate locațiile</option>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>
      
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 h-10 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 transition-all">
        <input 
          type="date" 
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
          title="Data Început"
        />
        <span className="text-slate-300 font-bold">-</span>
        <input 
          type="date" 
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
          title="Data Sfârșit"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapoarte Pontaje</h1>
          <p className="text-slate-500 mt-1">Istoric intrări și ieșiri pentru toți angajații tăi.</p>
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
`;

fs.writeFileSync('src/components/TimesheetReport.jsx', content, 'utf8');
console.log('Fixed TimesheetReport.jsx');
