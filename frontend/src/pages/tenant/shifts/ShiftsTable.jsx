import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Check, Search, Filter, FileSpreadsheet, Edit3, Trash2, 
  Sun, Moon, Eye, EyeOff, Users, CheckSquare, Square, X, AlertCircle, 
  ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ConfirmModal from '../../../components/ConfirmModal';

export default function ShiftsTable({ tenant, themeColor }) {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Filtre
  const [periodType, setPeriodType] = useState('THIS_MONTH'); // TODAY, THIS_WEEK, THIS_MONTH, CUSTOM
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getStartOfMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const getEndOfMonthStr = () => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  const [customStartDate, setCustomStartDate] = useState(getStartOfMonthStr());
  const [customEndDate, setCustomEndDate] = useState(getEndOfMonthStr());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Selectie multipla
  const [selectedShiftIds, setSelectedShiftIds] = useState([]);

  // Modal editare individuala tură
  const [editingShift, setEditingShift] = useState(null);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('17:30');
  const [editShiftType, setEditShiftType] = useState('DAY');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal modificare in masa (Bulk Edit)
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('17:30');
  const [bulkShiftType, setBulkShiftType] = useState('DAY');
  const [bulkNotes, setBulkNotes] = useState('');
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // Modal confirmare stergere
  const [shiftToDelete, setShiftToDelete] = useState(null); // single ID or 'BULK'
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Sortare & Paginare
  const [sortField, setSortField] = useState('date'); // date, name, role, hours
  const [sortDirection, setSortDirection] = useState('desc'); // asc, desc
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculare interval de date pe baza perioadei selectate
  const getDateRange = () => {
    const today = new Date();
    if (periodType === 'TODAY') {
      const str = getTodayStr();
      return { start: str, end: str };
    }
    if (periodType === 'THIS_WEEK') {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d.setDate(diff));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const sY = mon.getFullYear();
      const sM = String(mon.getMonth() + 1).padStart(2, '0');
      const sD = String(mon.getDate()).padStart(2, '0');
      const eY = sun.getFullYear();
      const eM = String(sun.getMonth() + 1).padStart(2, '0');
      const eD = String(sun.getDate()).padStart(2, '0');
      return { start: `${sY}-${sM}-${sD}`, end: `${eY}-${eM}-${eD}` };
    }
    if (periodType === 'THIS_MONTH') {
      return { start: getStartOfMonthStr(), end: getEndOfMonthStr() };
    }
    return { start: customStartDate, end: customEndDate };
  };

  const fetchShiftsAndEmployees = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const { start, end } = getDateRange();

      const [empRes, shiftsRes] = await Promise.all([
        fetch(`${baseUrl}/api/tenants/${tenant.id}/employees`),
        fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts?start_date=${start}&end_date=${end}`)
      ]);

      if (empRes.ok) {
        setEmployees(await empRes.json());
      }
      if (shiftsRes.ok) {
        setShifts(await shiftsRes.json());
      }
    } catch (err) {
      console.error('Eroare incarcare ture:', err);
      showToast('Eroare la încărcarea turelor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftsAndEmployees();
    setSelectedShiftIds([]);
    setCurrentPage(1);
  }, [periodType, customStartDate, customEndDate, tenant.id]);

  // Harta angajați id -> emp
  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  // Roluri disponibile
  const availableRoles = useMemo(() => {
    const roles = new Set();
    employees.forEach(e => {
      if (e.job_title && e.job_title.trim() !== '') {
        roles.add(e.job_title.trim());
      }
    });
    return Array.from(roles).sort();
  }, [employees]);

  // Filtrare & Sortare Ture
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const emp = employeeMap.get(s.employee_id) || {};
      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
      const cnp = (emp.cnp || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = fullName.includes(query) || cnp.includes(query) || (s.notes || '').toLowerCase().includes(query);
      const matchesEmp = selectedEmployeeId === 'ALL' || String(s.employee_id) === String(selectedEmployeeId);
      const matchesRole = selectedRole === 'ALL' || (emp.job_title || '').trim() === selectedRole;

      return matchesSearch && matchesEmp && matchesRole;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'name') {
        const empA = employeeMap.get(a.employee_id);
        const empB = employeeMap.get(b.employee_id);
        const nameA = `${empA?.first_name || ''} ${empA?.last_name || ''}`.toLowerCase();
        const nameB = `${empB?.first_name || ''} ${empB?.last_name || ''}`.toLowerCase();
        comparison = nameA.localeCompare(nameB, 'ro');
      } else if (sortField === 'role') {
        const empA = employeeMap.get(a.employee_id);
        const empB = employeeMap.get(b.employee_id);
        comparison = (empA?.job_title || '').localeCompare(empB?.job_title || '', 'ro');
      } else if (sortField === 'hours') {
        comparison = (a.start_time || '').localeCompare(b.start_time || '');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [shifts, employeeMap, searchQuery, selectedEmployeeId, selectedRole, sortField, sortDirection]);

  // Paginare
  const totalRecords = filteredShifts.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * rowsPerPage;
  const currentShifts = filteredShifts.slice(startIndex, startIndex + rowsPerPage);

  // Gestionare selectie multipla
  const handleToggleSelectAll = () => {
    if (selectedShiftIds.length === filteredShifts.length && filteredShifts.length > 0) {
      setSelectedShiftIds([]);
    } else {
      setSelectedShiftIds(filteredShifts.map(s => s.id));
    }
  };

  const handleToggleShift = (shiftId) => {
    setSelectedShiftIds(prev => 
      prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]
    );
  };

  // Sortare coloană
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Deschidere modal editare individuala
  const openEditModal = (shift) => {
    setEditingShift(shift);
    setEditStartTime(shift.start_time?.substring(0, 5) || '09:00');
    setEditEndTime(shift.end_time?.substring(0, 5) || '17:30');
    setEditShiftType(shift.shift_type || 'DAY');
    setEditNotes(shift.notes || '');
  };

  // Salvare editare individuala
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingShift) return;
    setIsSavingEdit(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const response = await fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts/${editingShift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: editingShift.employee_id,
          date: editingShift.date,
          start_time: editStartTime,
          end_time: editEndTime,
          shift_type: editShiftType,
          notes: editNotes || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Eroare la salvarea turei');
      }

      showToast('✓ Tura a fost actualizată cu succes!');
      setEditingShift(null);
      await fetchShiftsAndEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Salvare modificare in masa (Bulk Update)
  const handleSaveBulkUpdate = async (e) => {
    e.preventDefault();
    if (selectedShiftIds.length === 0) return;
    setIsSavingBulk(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const response = await fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_ids: selectedShiftIds,
          start_time: bulkStartTime,
          end_time: bulkEndTime,
          shift_type: bulkShiftType,
          notes: bulkNotes || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Eroare la actualizarea turelor în masă');
      }

      showToast(`✓ ${selectedShiftIds.length} ture au fost actualizate la noul program (${bulkStartTime} - ${bulkEndTime})!`);
      setBulkEditModalOpen(false);
      setSelectedShiftIds([]);
      await fetchShiftsAndEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Executare stergere (individual sau bulk)
  const executeDelete = async () => {
    const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');

    try {
      if (shiftToDelete === 'BULK') {
        const response = await fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shift_ids: selectedShiftIds })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Eroare la ștergerea turelor');
        }

        showToast(`✓ ${selectedShiftIds.length} ture au fost șterse cu succes.`);
        setSelectedShiftIds([]);
      } else {
        const response = await fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts/${shiftToDelete}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Eroare la ștergerea turei');
        }

        showToast('✓ Tura a fost ștearsă cu succes.');
      }

      await fetchShiftsAndEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setShiftToDelete(null);
      setConfirmModalOpen(false);
    }
  };

  // Export Excel conform Design System
  const handleExportExcel = () => {
    const exportRows = filteredShifts.map((s, idx) => {
      const emp = employeeMap.get(s.employee_id) || {};
      const d = new Date(s.date);
      const dateFormatted = d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });

      return {
        'Nr. Crt.': idx + 1,
        'Data Turei': dateFormatted,
        'Angajat': `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        'CNP': emp.cnp || '',
        'Funcție / Rol': emp.job_title || 'Fără funcție',
        'Interval Orar': `${s.start_time?.substring(0, 5)} - ${s.end_time?.substring(0, 5)}`,
        'Tip Tură': s.shift_type === 'DAY' ? 'Zi' : 'Noapte',
        'Vizualizat de Angajat': s.seen_at ? 'Da' : 'Nu',
        'Observații': s.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tabel Ture');
    XLSX.writeFile(workbook, `Tabel_Ture_${getTodayStr()}.xlsx`);
    showToast('Fișierul Excel a fost descărcat cu succes!');
  };

  const formatDateCell = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('ro-RO', { weekday: 'short' });
    const formatted = d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${dayName}, ${formatted}`;
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

      {/* 1. Header Card cu Filtre de Perioadă */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-primary-600 dark:text-primary-400" size={24} />
              Tabel Ture Planificate
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Vizualizează, editează sau șterge individual și în masă turele din sistem.
            </p>
          </div>

          {/* Comutator Perioadă */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => setPeriodType('TODAY')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodType === 'TODAY'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Azi
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('THIS_WEEK')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodType === 'THIS_WEEK'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Săptămâna aceasta
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('THIS_MONTH')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodType === 'THIS_MONTH'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Luna aceasta
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('CUSTOM')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  periodType === 'CUSTOM'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Interval Personalizat
              </button>
            </div>

            {periodType === 'CUSTOM' && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 h-9 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <span className="text-slate-400 text-xs font-bold">până la</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 h-9 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Panou Acțiuni Multiple (Apare când sunt bifate ture) */}
      {selectedShiftIds.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-2 border-primary-500/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-sm">
              {selectedShiftIds.length}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedShiftIds.length} {selectedShiftIds.length === 1 ? 'tură selectată' : 'ture selectate'}
              </div>
              <div className="text-xs text-slate-500">
                Poți modifica orele în masă sau șterge turele selectate dintr-un singur click.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setBulkEditModalOpen(true)}
              className="flex-1 sm:flex-initial h-10 px-5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              <Clock size={15} />
              Modifică Ore în Masă
            </button>

            <button
              type="button"
              onClick={() => {
                setShiftToDelete('BULK');
                setConfirmModalOpen(true);
              }}
              className="flex-1 sm:flex-initial h-10 px-4 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 size={15} />
              Șterge ({selectedShiftIds.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedShiftIds([])}
              className="h-10 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* 3. Toolbar Tabel: Căutare cu contor, Filtru Angajat, Filtru Rol, Buton Export Excel */}
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
                {filteredShifts.length} din {shifts.length}
              </span>
            )}
          </div>

          {/* Filtru Angajat */}
          <div className="relative">
            <select
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 pr-8 h-10 text-sm font-medium rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-xs cursor-pointer appearance-none"
            >
              <option value="ALL">Toți Angajații ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filtru Rol */}
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
        </div>

        {/* Buton Export Excel (verde) */}
        <button
          onClick={handleExportExcel}
          className="h-10 px-5 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <FileSpreadsheet size={16} />
          Export Excel
        </button>
      </div>

      {/* 4. Tabelul Principal de Ture */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="text-sm font-bold animate-pulse">Se încarcă turele...</div>
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Clock size={36} className="mx-auto mb-3 text-slate-400 opacity-60" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Nu există ture înregistrate pentru filtrele selectate.</p>
            <p className="text-xs mt-1 text-slate-400">Schimbă perioada sau resetează căutarea.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {/* Select All */}
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="p-1 hover:text-primary-600 transition-colors text-slate-400 flex items-center justify-center"
                      title={selectedShiftIds.length === filteredShifts.length ? 'Deselectează toate' : 'Selectează toate'}
                    >
                      {selectedShiftIds.length > 0 && selectedShiftIds.length === filteredShifts.length ? (
                        <CheckSquare size={18} className="text-primary-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>

                  <th className="py-3 px-3 w-16 text-center">Nr. Crt.</th>

                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Data Turei</span>
                      <ArrowUpDown size={12} className={sortField === 'date' ? 'text-primary-600' : 'opacity-40'} />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Angajat</span>
                      <ArrowUpDown size={12} className={sortField === 'name' ? 'text-primary-600' : 'opacity-40'} />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Funcție / Rol</span>
                      <ArrowUpDown size={12} className={sortField === 'role' ? 'text-primary-600' : 'opacity-40'} />
                    </div>
                  </th>

                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('hours')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Interval Orar</span>
                      <ArrowUpDown size={12} className={sortField === 'hours' ? 'text-primary-600' : 'opacity-40'} />
                    </div>
                  </th>

                  <th className="py-3 px-4 text-center">Tip Tură</th>
                  <th className="py-3 px-4 text-center">Stare</th>
                  <th className="py-3 px-4">Observații</th>
                  <th className="py-3 px-4 text-right">Acțiuni</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {currentShifts.map((shift, idx) => {
                  const emp = employeeMap.get(shift.employee_id) || {};
                  const isSelected = selectedShiftIds.includes(shift.id);
                  const rowNumber = startIndex + idx + 1;

                  return (
                    <tr 
                      key={shift.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${
                        isSelected ? 'bg-primary-50/20 dark:bg-primary-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleShift(shift.id)}
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

                      {/* Data Turei */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatDateCell(shift.date)}
                        </span>
                      </td>

                      {/* Angajat: Avatar, Nume, CNP */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 shrink-0 overflow-hidden">
                            {emp.avatar_path ? (
                              <img 
                                src={emp.avatar_path.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}`} 
                                alt="" 
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
                              <div className="text-[11px] font-medium text-slate-400 font-mono mt-0.5">
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

                      {/* Interval Orar */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-white">
                          <Clock size={12} className="text-slate-400" />
                          <span>{shift.start_time?.substring(0, 5)} - {shift.end_time?.substring(0, 5)}</span>
                        </div>
                      </td>

                      {/* Tip Tură */}
                      <td className="py-3 px-4 text-center">
                        {shift.shift_type === 'DAY' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                            <Sun size={14} /> Zi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            <Moon size={14} /> Noapte
                          </span>
                        )}
                      </td>

                      {/* Stare Vizualizare */}
                      <td className="py-3 px-4 text-center">
                        <span 
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            shift.seen_at ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                          title={shift.seen_at ? `Vizualizat de angajat la ${new Date(shift.seen_at).toLocaleDateString('ro-RO')}` : 'Nevizualizat'}
                        >
                          {shift.seen_at ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span>{shift.seen_at ? 'Văzut' : 'Nevăzut'}</span>
                        </span>
                      </td>

                      {/* Observații */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] block" title={shift.notes}>
                          {shift.notes || '-'}
                        </span>
                      </td>

                      {/* Acțiuni */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(shift)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 transition-colors"
                            title="Editează tura"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShiftToDelete(shift.id);
                              setConfirmModalOpen(true);
                            }}
                            className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors"
                            title="Șterge tura"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Footer Paginare conform Design System (stânga jos obligatoriu) */}
        {!loading && filteredShifts.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Stânga: Selector număr rânduri */}
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

            {/* Dreapta: Paginare */}
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

      {/* 6. Modal Editare Individuală */}
      {editingShift && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={18} style={{ color: themeColor }} />
                Editează Tura ({formatDateCell(editingShift.date)})
              </h3>
              <button 
                onClick={() => setEditingShift(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Ora Început
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Ora Sfârșit
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tip Tură
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 h-10">
                  <button
                    type="button"
                    onClick={() => setEditShiftType('DAY')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all ${
                      editShiftType === 'DAY' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun size={14} /> Tură de Zi
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditShiftType('NIGHT')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all ${
                      editShiftType === 'NIGHT' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon size={14} /> Tură de Noapte
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Observații (Opțional)
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingShift(null)}
                  className="flex-1 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 h-10 px-5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  <Check size={16} />
                  {isSavingEdit ? 'Se salvează...' : 'Salvează'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal Modificare Ore în Masă (Bulk Edit) */}
      {bulkEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={18} style={{ color: themeColor }} />
                Modificare Ore pentru {selectedShiftIds.length} Ture
              </h3>
              <button 
                onClick={() => setBulkEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBulkUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Noua Oră Început
                  </label>
                  <input
                    type="time"
                    required
                    value={bulkStartTime}
                    onChange={(e) => setBulkStartTime(e.target.value)}
                    className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Noua Oră Sfârșit
                  </label>
                  <input
                    type="time"
                    required
                    value={bulkEndTime}
                    onChange={(e) => setBulkEndTime(e.target.value)}
                    className="w-full px-4 h-10 text-sm font-bold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tip Tură
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 h-10">
                  <button
                    type="button"
                    onClick={() => setBulkShiftType('DAY')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all ${
                      bulkShiftType === 'DAY' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun size={14} /> Tură de Zi
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkShiftType('NIGHT')}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-all ${
                      bulkShiftType === 'NIGHT' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon size={14} /> Tură de Noapte
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Observații Noi (Opțional)
                </label>
                <input
                  type="text"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder="Se aplică tuturor turelor selectate"
                  className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBulkEditModalOpen(false)}
                  className="flex-1 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSavingBulk}
                  className="flex-1 h-10 px-5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  <Check size={16} />
                  {isSavingBulk ? 'Se aplică...' : `Aplică la ${selectedShiftIds.length} Ture`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal Confirmare Ștergere */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setShiftToDelete(null);
        }}
        onConfirm={executeDelete}
        title={shiftToDelete === 'BULK' ? `Ștergere ${selectedShiftIds.length} Ture` : 'Ștergere Tură'}
        message={
          shiftToDelete === 'BULK'
            ? `Ești sigur că vrei să ștergi toate cele ${selectedShiftIds.length} ture selectate? Această acțiune este ireversibilă.`
            : 'Ești sigur că vrei să ștergi această tură? Această acțiune este ireversibilă.'
        }
        confirmText={shiftToDelete === 'BULK' ? `Șterge ${selectedShiftIds.length} Ture` : 'Șterge Tura'}
        isDanger={true}
      />
    </div>
  );
}
