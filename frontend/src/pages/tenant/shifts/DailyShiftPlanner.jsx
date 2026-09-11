import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Check, ChevronLeft, ChevronRight, Search, 
  Filter, FileSpreadsheet, Edit3, Trash2, Sun, Moon, Eye, EyeOff, 
  Users, CheckSquare, Square, X, AlertCircle, ArrowUpDown, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DailyShiftPlanner({ tenant, themeColor, onCalendarViewRequest }) {
  // 1. Data selectată (format YYYY-MM-DD local)
  const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [dateMode, setDateMode] = useState('single'); // 'single' | 'multiple'
  const [selectedDates, setSelectedDates] = useState([getTodayStr()]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [dailyShifts, setDailyShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // 2. Selectie multipla
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  // 3. Formular alocare in masa (Bulk Bar)
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('17:30');
  const [bulkShiftType, setBulkShiftType] = useState('DAY');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // 4. Modal editare individuala angajat
  const [individualModalOpen, setIndividualModalOpen] = useState(false);
  const [individualEmp, setIndividualEmp] = useState(null);
  const [individualShift, setIndividualShift] = useState(null);
  const [indStartTime, setIndStartTime] = useState('09:00');
  const [indEndTime, setIndEndTime] = useState('17:30');
  const [indShiftType, setIndShiftType] = useState('DAY');
  const [indNotes, setIndNotes] = useState('');
  const [indSubmitting, setIndSubmitting] = useState(false);

  // 5. Cautare, Filtre, Sortare & Paginare conform regulilor din design/SKILL.md
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // ALL, SCHEDULED, OFF
  const [sortField, setSortField] = useState('name'); // 'name', 'role', 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Preseturi rapide de ore pentru HORECA & business
  const SHIFT_PRESETS = [
    { label: '08:00 - 16:00 (8h)', start: '08:00', end: '16:00', type: 'DAY' },
    { label: '09:00 - 17:30 (8.5h)', start: '09:00', end: '17:30', type: 'DAY' },
    { label: '10:00 - 22:00 (12h)', start: '10:00', end: '22:00', type: 'DAY' },
    { label: '14:00 - 22:30 (Tura 2)', start: '14:00', end: '22:30', type: 'DAY' },
    { label: '20:00 - 04:00 (Noapte)', start: '20:00', end: '04:00', type: 'NIGHT' }
  ];

  // Afisare notificare temporara (Toast auto-dismiss)
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preluare date angajati si ture pentru ziua selectata
  const fetchDayData = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const [empRes, shiftsRes] = await Promise.all([
        fetch(`${baseUrl}/api/tenants/${tenant.id}/employees`),
        fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts?start_date=${selectedDate}&end_date=${selectedDate}`)
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setDailyShifts(shiftsData);
      }
    } catch (err) {
      console.error('Eroare incarcare date planificator:', err);
      showToast('Eroare la încărcarea datelor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayData();
    setSelectedEmpIds([]); // Resetam selectia la schimbarea datei
  }, [selectedDate, tenant.id]);

  // Navigare data
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayStr());
  };

  // Formatare eticheta data selectata in limba romana
  const formatSelectedDateHuman = () => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    const dayName = d.toLocaleDateString('ro-RO', { weekday: 'long' });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString('ro-RO', { month: 'long' });
    const year = d.getFullYear();
    return `${capitalizedDay}, ${dayNumber} ${monthName} ${year}`;
  };

  // Extragere roluri unice pentru filtru
  const availableRoles = useMemo(() => {
    const roles = new Set();
    employees.forEach(emp => {
      if (emp.job_title && emp.job_title.trim() !== '') {
        roles.add(emp.job_title.trim());
      }
    });
    return Array.from(roles).sort();
  }, [employees]);

  // Mapare employee_id -> shift pentru data selectata
  const shiftMap = useMemo(() => {
    const map = new Map();
    dailyShifts.forEach(shift => {
      map.set(shift.employee_id, shift);
    });
    return map;
  }, [dailyShifts]);

  // Filtrare si sortare angajati
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
      const cnp = (emp.cnp || '').toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || cnp.includes(searchQuery.toLowerCase());
      
      const matchesRole = selectedRole === 'ALL' || (emp.job_title || '').trim() === selectedRole;

      const hasShift = shiftMap.has(emp.id);
      let matchesStatus = true;
      if (selectedStatusFilter === 'SCHEDULED') matchesStatus = hasShift;
      if (selectedStatusFilter === 'OFF') matchesStatus = !hasShift;

      return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
        comparison = nameA.localeCompare(nameB, 'ro');
      } else if (sortField === 'role') {
        const roleA = (a.job_title || '').toLowerCase();
        const roleB = (b.job_title || '').toLowerCase();
        comparison = roleA.localeCompare(roleB, 'ro');
      } else if (sortField === 'status') {
        const shiftA = shiftMap.get(a.id);
        const shiftB = shiftMap.get(b.id);
        const valA = shiftA ? shiftA.start_time : '99:99';
        const valB = shiftB ? shiftB.start_time : '99:99';
        comparison = valA.localeCompare(valB);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [employees, searchQuery, selectedRole, selectedStatusFilter, sortField, sortDirection, shiftMap]);

  // Paginare
  const totalRecords = filteredEmployees.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

  // Statistici rapide acoperire zi
  const scheduledCount = employees.filter(emp => shiftMap.has(emp.id)).length;
  const offCount = Math.max(0, employees.length - scheduledCount);

  // Gestionare selectie multipla
  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredEmployees.map(e => e.id));
    }
  };

  const handleToggleSelectEmployee = (empId) => {
    setSelectedEmpIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Aplicare preset in formularul de Bulk
  const applyPresetToBulk = (preset) => {
    setBulkStartTime(preset.start);
    setBulkEndTime(preset.end);
    setBulkShiftType(preset.type);
  };

  // Salvare in masa (Bulk Assign)
  // Helper navigare calendar lunar
  const prevCalendarMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextCalendarMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Zilele lunii curente pentru calendarul interactiv
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Lun=0...Dum=6
    const totalDays = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr: dayStr });
    }
    return days;
  }, [calendarMonth]);

  const toggleSelectDate = (dateStr) => {
    setSelectedDates(prev => 
      prev.includes(dateStr)
        ? (prev.length > 1 ? prev.filter(d => d !== dateStr) : prev)
        : [...prev, dateStr].sort()
    );
  };

  // Preseturi rapide de selecție date
  const selectCurrentWeekDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today.setDate(diff));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    setSelectedDates(dates);
  };

  const selectWorkDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today.setDate(diff));
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    setSelectedDates(dates);
  };

  const selectWeekendDays = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(today.setDate(diff));
    const dates = [];
    for (let i = 5; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    setSelectedDates(dates);
  };

  // Salvare in masa (Bulk Assign)
  const handleBulkAssign = async () => {
    if (selectedEmpIds.length === 0) return;
    if (!bulkStartTime || !bulkEndTime) {
      showToast('Selectează ora de început și sfârșit!', 'error');
      return;
    }

    if (dateMode === 'multiple' && selectedDates.length === 0) {
      showToast('Selectează cel puțin o zi din calendar!', 'error');
      return;
    }

    setBulkSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const payload = {
        employee_ids: selectedEmpIds,
        start_time: bulkStartTime,
        end_time: bulkEndTime,
        shift_type: bulkShiftType,
        notes: bulkNotes || null
      };

      if (dateMode === 'multiple') {
        payload.dates = selectedDates;
      } else {
        payload.date = selectedDate;
      }

      const response = await fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Eroare la alocarea turelor în masă');
      }

      const totalCreated = dateMode === 'multiple' ? selectedEmpIds.length * selectedDates.length : selectedEmpIds.length;
      showToast(`✓ Tura (${bulkStartTime} - ${bulkEndTime}) a fost aplicată cu succes (${totalCreated} ture create)!`);
      setSelectedEmpIds([]);
      await fetchDayData();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Stergere in masa (Marcheaza ca Zi Libera)
  const handleBulkDelete = async () => {
    if (selectedEmpIds.length === 0) return;

    setBulkSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const payload = {
        employee_ids: selectedEmpIds
      };

      if (dateMode === 'multiple') {
        payload.dates = selectedDates;
      } else {
        payload.date = selectedDate;
      }

      const response = await fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Eroare la eliberarea turelor');
      }

      showToast(`✓ Angajații selectați au fost marcați ca liberi.`);
      setSelectedEmpIds([]);
      await fetchDayData();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Deschidere modal editare individuala
  const openIndividualEdit = (employee) => {
    const shift = shiftMap.get(employee.id);
    setIndividualEmp(employee);
    setIndividualShift(shift || null);
    if (shift) {
      setIndStartTime(shift.start_time?.substring(0, 5) || '09:00');
      setIndEndTime(shift.end_time?.substring(0, 5) || '17:30');
      setIndShiftType(shift.shift_type || 'DAY');
      setIndNotes(shift.notes || '');
    } else {
      setIndStartTime('09:00');
      setIndEndTime('17:30');
      setIndShiftType('DAY');
      setIndNotes('');
    }
    setIndividualModalOpen(true);
  };

  // Salvare tura individuala
  const handleSaveIndividualShift = async (e) => {
    e.preventDefault();
    if (!individualEmp) return;
    if (!indStartTime || !indEndTime) {
      showToast('Orele de start și sfârșit sunt obligatorii', 'error');
      return;
    }

    setIndSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const payload = {
        employee_id: individualEmp.id,
        date: selectedDate,
        start_time: indStartTime,
        end_time: indEndTime,
        shift_type: indShiftType,
        notes: indNotes || null
      };

      const url = individualShift 
        ? `${baseUrl}/api/tenants/${tenant.id}/shifts/${individualShift.id}`
        : `${baseUrl}/api/tenants/${tenant.id}/shifts`;

      const response = await fetch(url, {
        method: individualShift ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Eroare la salvarea turei');
      }

      showToast(`✓ Tura pentru ${individualEmp.first_name} ${individualEmp.last_name} a fost actualizată (${indStartTime} - ${indEndTime})!`);
      setIndividualModalOpen(false);
      await fetchDayData();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setIndSubmitting(false);
    }
  };

  // Stergere tura individuala (marcare ca liber)
  const handleDeleteIndividualShift = async () => {
    if (!individualShift) return;

    setIndSubmitting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const response = await fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts/${individualShift.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Eroare la ștergerea turei');
      }

      showToast(`✓ Tura a fost ștearsă. Angajatul este marcat ca liber.`);
      setIndividualModalOpen(false);
      await fetchDayData();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setIndSubmitting(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const exportRows = filteredEmployees.map((emp, index) => {
      const shift = shiftMap.get(emp.id);
      return {
        'Nr. Crt.': index + 1,
        'Nume & Prenume': `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        'CNP': emp.cnp || '',
        'Funcție / Rol': emp.job_title || 'Fără funcție',
        'Data': selectedDate,
        'Program de Lucru': shift ? `${shift.start_time.substring(0, 5)} - ${shift.end_time.substring(0, 5)}` : 'Liber / Neplanificat',
        'Tip Tură': shift ? (shift.shift_type === 'DAY' ? 'Zi' : 'Noapte') : '-',
        'Vizualizat de Angajat': shift ? (shift.seen_at ? 'Da' : 'Nu') : '-',
        'Observații': shift?.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planificator Ture');
    XLSX.writeFile(workbook, `Planificator_Ture_${selectedDate}.xlsx`);
    showToast('Fișierul Excel a fost descărcat cu succes!');
  };

  // Toggle sortare
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Toast Notificare */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3 rounded-full text-sm font-bold shadow-xl flex items-center gap-2.5 text-white ${
            toastMessage.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}>
            {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* 1. Selectorul de Dată: Mod O Singură Zi vs Mod Zile Multiple (Calendar) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
        {/* Antet Card Dată cu Switcher Mod */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="text-primary-600 dark:text-primary-400" size={20} />
            <span className="font-black text-slate-800 dark:text-white text-base">
              {dateMode === 'single' ? 'Planificare pe O Singură Zi' : 'Planificare pe Zile Multiple (Calendar)'}
            </span>
          </div>

          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => setDateMode('single')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                dateMode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              O Singură Zi
            </button>
            <button
              type="button"
              onClick={() => setDateMode('multiple')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                dateMode === 'multiple'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Zile Multiple (Calendar)
            </button>
          </div>
        </div>

        {/* Mod 1: O Singură Zi */}
        {dateMode === 'single' ? (
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="inline-flex items-center bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 p-1 shadow-inner">
                <button 
                  onClick={handlePrevDay} 
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                  title="Ziua precedentă"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={handleSetToday}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                    selectedDate === getTodayStr() 
                      ? 'bg-primary-600 text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Azi
                </button>
                <button 
                  onClick={handleNextDay} 
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                  title="Ziua următoare"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-xs cursor-pointer"
                />
              </div>

              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 pl-1">
                <span>{formatSelectedDateHuman()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-start lg:justify-end flex-wrap">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Users size={14} className="text-slate-400" />
                <span>Total: <strong className="text-slate-900 dark:text-white">{employees.length}</strong></span>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Clock size={14} className="text-emerald-600" />
                <span>Planificați: <strong>{scheduledCount}</strong></span>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Liberi: <strong>{offCount}</strong></span>
              </div>
            </div>
          </div>
        ) : (
          /* Mod 2: Zile Multiple - Calendar Interactiv */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevCalendarMonth}
                  className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-black text-slate-800 dark:text-white text-base min-w-[170px] text-center">
                  {calendarMonth.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={nextCalendarMonth}
                  className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectCurrentWeekDays}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Toată Săptămâna
                </button>
                <button
                  type="button"
                  onClick={selectWorkDays}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Luni - Vineri
                </button>
                <button
                  type="button"
                  onClick={selectWeekendDays}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Weekend
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDates([])}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 transition-colors"
                >
                  Deselectează Tot
                </button>
              </div>
            </div>

            {/* Grila Calendarului Interactiv Lunar */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 p-2">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] uppercase tracking-wider text-slate-400 py-1 border-b border-slate-200 dark:border-slate-700 mb-1">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mie</div>
                <div>Joi</div>
                <div>Vin</div>
                <div className="text-amber-600">Sâm</div>
                <div className="text-amber-600">Dum</div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
                  }

                  const isSelected = selectedDates.includes(item.dateStr);
                  const isToday = item.dateStr === getTodayStr();

                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => toggleSelectDate(item.dateStr)}
                      className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-xs scale-[0.98]'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                      style={isSelected ? { backgroundColor: themeColor } : {}}
                    >
                      <span>{item.dayNumber}</span>
                      {isToday && (
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`}>
                          Azi
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sumar zile selectate */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span className="font-bold">
                {selectedDates.length} {selectedDates.length === 1 ? 'zi selectată' : 'zile selectate'}:
              </span>
              <span className="font-medium text-slate-500 truncate max-w-lg">
                {selectedDates.slice(0, 8).map(d => new Date(d + 'T00:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })).join(', ')}
                {selectedDates.length > 8 ? ` + încă ${selectedDates.length - 8}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Panoul de Alocare în Masă (Apare când sunt angajați selectați) */}
      {selectedEmpIds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-2 border-primary-500/40 dark:border-primary-500/30 p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-4">
            {/* Header panou bulk */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-sm">
                  {selectedEmpIds.length}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Alocare Program Comun pentru {selectedEmpIds.length} {selectedEmpIds.length === 1 ? 'angajat' : 'angajați'}
                    {dateMode === 'multiple' && ` pe ${selectedDates.length} ${selectedDates.length === 1 ? 'zi' : 'zile'}`}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Alege orele dorite și apasă pe validare pentru a salva tura pentru toți cei selectați.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmpIds([])}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Deselectează toți
              </button>
            </div>

            {/* Presets rapide HORECA */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Preseturi Rapide Program:
              </span>
              <div className="flex flex-wrap gap-2">
                {SHIFT_PRESETS.map((preset, idx) => {
                  const isCurrent = bulkStartTime === preset.start && bulkEndTime === preset.end && bulkShiftType === preset.type;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPresetToBulk(preset)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        isCurrent
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controale ore & Validare */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
              {/* Ora Inceput */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Ora Început
                </label>
                <input
                  type="time"
                  value={bulkStartTime}
                  onChange={(e) => setBulkStartTime(e.target.value)}
                  className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-xs"
                />
              </div>

              {/* Ora Sfarsit */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Ora Sfârșit
                </label>
                <input
                  type="time"
                  value={bulkEndTime}
                  onChange={(e) => setBulkEndTime(e.target.value)}
                  className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-xs"
                />
              </div>

              {/* Tip Tura (Zi / Noapte) */}
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tip Tură
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 h-10">
                  <button
                    type="button"
                    onClick={() => setBulkShiftType('DAY')}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-full text-xs font-bold transition-all ${
                      bulkShiftType === 'DAY'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Tură de Zi"
                  >
                    <Sun size={14} /> Zi
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkShiftType('NIGHT')}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-full text-xs font-bold transition-all ${
                      bulkShiftType === 'NIGHT'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Tură de Noapte"
                  >
                    <Moon size={14} /> Noapte
                  </button>
                </div>
              </div>

              {/* Butoane Actiune */}
              <div className="md:col-span-4 flex items-center gap-2">
                <button
                  type="button"
                  disabled={bulkSubmitting}
                  onClick={handleBulkAssign}
                  className="flex-1 h-10 px-5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  <Check size={16} />
                  {bulkSubmitting 
                    ? 'Se aplică...' 
                    : dateMode === 'multiple'
                      ? `Validează (${selectedEmpIds.length} angajați × ${selectedDates.length} zile)`
                      : `Validează (${selectedEmpIds.length})`}
                </button>

                <button
                  type="button"
                  disabled={bulkSubmitting}
                  onClick={handleBulkDelete}
                  className="h-10 px-4 rounded-full bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-300 dark:hover:text-red-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Marchează angajații selectați ca liberi"
                >
                  Liber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Toolbar Tabel: Cautare cu contor, Filtru Rol, Filtru Status & Export Excel */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Căutare cu contor interior conform regulii din design/SKILL.md */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Caută după nume sau CNP..."
              className="w-full pl-10 pr-24 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none transition-all shadow-xs"
            />
            {/* Contor rezultate interior — apare doar când se tastează */}
            {searchQuery.trim() !== '' && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none transition-opacity duration-200">
                {filteredEmployees.length} din {employees.length}
              </span>
            )}
          </div>

          {/* Filtru Funcție / Rol */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 pr-8 h-10 text-sm font-medium rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-xs cursor-pointer appearance-none"
            >
              <option value="ALL">Toate Rolurile ({availableRoles.length})</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filtru Status Planificare */}
          <div className="relative">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 pr-8 h-10 text-sm font-medium rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-xs cursor-pointer appearance-none"
            >
              <option value="ALL">Toți Angajații ({employees.length})</option>
              <option value="SCHEDULED">Planificați ({scheduledCount})</option>
              <option value="OFF">Liberi / Neplanificați ({offCount})</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Buton Export Excel (verde conform Design System) */}
        <button
          onClick={handleExportExcel}
          className="h-10 px-5 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <FileSpreadsheet size={16} />
          Export Excel
        </button>
      </div>

      {/* 4. Tabelul Principal al Angajaților */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="text-sm font-bold animate-pulse">Se încarcă lista angajaților pentru data selectată...</div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Users size={36} className="mx-auto mb-3 text-slate-400 opacity-60" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Niciun angajat găsit conform filtrelor aplicate.</p>
            <p className="text-xs mt-1 text-slate-400">Încearcă să resetezi căutarea sau filtrele.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="p-1 hover:text-primary-600 transition-colors text-slate-400 flex items-center justify-center"
                      title={selectedEmpIds.length === filteredEmployees.length ? 'Deselectează toți' : 'Selectează toți'}
                    >
                      {selectedEmpIds.length > 0 && selectedEmpIds.length === filteredEmployees.length ? (
                        <CheckSquare size={18} className="text-primary-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>

                  {/* Nr. Crt. */}
                  <th className="py-3 px-3 w-16 text-center">Nr. Crt.</th>

                  {/* Angajat */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Angajat</span>
                      <ArrowUpDown size={12} className={sortField === 'name' ? 'text-primary-600' : 'opacity-40'} />
                    </div>
                  </th>

                  {/* Funcție */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Funcție / Rol</span>
                      <ArrowUpDown size={12} className={sortField === 'role' ? 'text-primary-600' : 'opacity-40'} />
                    </div>
                  </th>

                  {/* Program în Ziua Selectată */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Program Lucru ({selectedDate})</span>
                      <ArrowUpDown size={12} className={sortField === 'status' ? 'text-primary-600' : 'opacity-40'} />
                    </div>
                  </th>

                  {/* Modificare Individuală */}
                  <th className="py-3 px-4 text-right">Ajustare Individuală</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {currentEmployees.map((emp, idx) => {
                  const shift = shiftMap.get(emp.id);
                  const isSelected = selectedEmpIds.includes(emp.id);
                  const rowNumber = startIndex + idx + 1;

                  return (
                    <tr 
                      key={emp.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${
                        isSelected ? 'bg-primary-50/20 dark:bg-primary-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectEmployee(emp.id)}
                          className="p-1 hover:text-primary-600 transition-colors text-slate-400 flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-primary-600" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>

                      {/* Nr. Crt. */}
                      <td className="py-3 px-3 text-center text-xs font-bold text-slate-400">
                        {rowNumber}
                      </td>

                      {/* Angajat: Avatar, Nume, CNP */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 shrink-0 overflow-hidden">
                            {emp.avatar_path ? (
                              <img 
                                src={emp.avatar_path.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}`} 
                                alt={`${emp.first_name} ${emp.last_name}`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {emp.first_name} {emp.last_name}
                            </div>
                            {emp.cnp && (
                              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                CNP: {emp.cnp}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Funcție / Rol */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {emp.job_title || 'Fără funcție'}
                        </span>
                      </td>

                      {/* Program în Ziua Selectată */}
                      <td className="py-3 px-4">
                        {shift ? (
                          <div 
                            onClick={() => openIndividualEdit(emp)}
                            className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-all shadow-2xs group/chip"
                            title="Click pentru a modifica orele"
                          >
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                            </span>

                            {/* Zi / Noapte */}
                            {shift.shift_type === 'DAY' ? (
                              <Sun size={13} className="text-amber-500" title="Tură de zi" />
                            ) : (
                              <Moon size={13} className="text-indigo-500" title="Tură de noapte" />
                            )}

                            {/* Indicator vizualizat */}
                            <div title={shift.seen_at ? "Vizualizat de angajat" : "Nevizualizat de angajat"}>
                              {shift.seen_at ? (
                                <Eye size={13} className="text-emerald-500" />
                              ) : (
                                <EyeOff size={13} className="text-slate-400" />
                              )}
                            </div>

                            {shift.notes && (
                              <span className="text-[10px] text-slate-400 italic max-w-[120px] truncate">
                                • {shift.notes}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">
                            Liber / Neplanificat
                          </span>
                        )}
                      </td>

                      {/* Acțiune: Buton Modifică Ore */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openIndividualEdit(emp)}
                          className="h-8 px-3.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-primary-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <Edit3 size={13} />
                          <span>Modifică Ore</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Footer Tabel: Paginare conform regulii stricte (rânduri/pagină NUMAI stânga jos) */}
        {!loading && filteredEmployees.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Stânga: Selectare număr rânduri pe pagină */}
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span>Rânduri pe pagină:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold focus:ring-1 focus:ring-primary-500 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="ml-2 font-medium text-slate-500">
                Se afișează {totalRecords === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalRecords)} din {totalRecords}
              </span>
            </div>

            {/* Dreapta: Navigare pagini */}
            <div className="flex items-center gap-1">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Pagina precedentă"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="px-3 py-1 font-bold text-slate-700 dark:text-white">
                {validPage} / {totalPages}
              </span>

              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Pagina următoare"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Modal Modificare Individuală a Orelor pentru un Angajat */}
      {individualModalOpen && individualEmp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-black text-slate-700 dark:text-slate-200 overflow-hidden shrink-0">
                  {individualEmp.avatar_path ? (
                    <img 
                      src={individualEmp.avatar_path.startsWith('http') ? individualEmp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${individualEmp.avatar_path}`} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    `${individualEmp.first_name?.[0] || ''}${individualEmp.last_name?.[0] || ''}`.toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {individualEmp.first_name} {individualEmp.last_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {individualEmp.job_title || 'Angajat'} • {formatSelectedDateHuman()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIndividualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formular Modal */}
            <form onSubmit={handleSaveIndividualShift} className="p-6 space-y-4">
              {/* Presets rapide in modal */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Preseturi Rapide:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SHIFT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIndStartTime(preset.start);
                        setIndEndTime(preset.end);
                        setIndShiftType(preset.type);
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {preset.start} - {preset.end}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ore Start / Stop */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Ora Început
                  </label>
                  <input
                    type="time"
                    required
                    value={indStartTime}
                    onChange={(e) => setIndStartTime(e.target.value)}
                    className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Ora Sfârșit
                  </label>
                  <input
                    type="time"
                    required
                    value={indEndTime}
                    onChange={(e) => setIndEndTime(e.target.value)}
                    className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* Tip Tură */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tipul Turei
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 h-10">
                  <button
                    type="button"
                    onClick={() => setIndShiftType('DAY')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all ${
                      indShiftType === 'DAY'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun size={14} /> Tură de Zi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndShiftType('NIGHT')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all ${
                      indShiftType === 'NIGHT'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon size={14} /> Tură de Noapte
                  </button>
                </div>
              </div>

              {/* Observații */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Observații (Opțional)
                </label>
                <input
                  type="text"
                  value={indNotes}
                  onChange={(e) => setIndNotes(e.target.value)}
                  placeholder="Ex: Sosire întârziată, eveniment special"
                  className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none shadow-xs"
                />
              </div>

              {/* Butoane Acțiune Modal */}
              <div className="pt-3 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={indSubmitting}
                  className="w-full h-10 px-5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  <Check size={16} />
                  {indSubmitting ? 'Se salvează...' : 'Salvează Orele'}
                </button>

                <div className="flex gap-2">
                  {individualShift && (
                    <button
                      type="button"
                      disabled={indSubmitting}
                      onClick={handleDeleteIndividualShift}
                      className="flex-1 h-10 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} />
                      Marchează ca Liber
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIndividualModalOpen(false)}
                    className="flex-1 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
