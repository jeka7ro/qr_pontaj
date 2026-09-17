import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Info, 
  MapPin, 
  Copy, 
  Edit2, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  Search,
  X,
  ExternalLink,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';
import CreateShiftModal from '../../../components/CreateShiftModal';
import ConfirmModal from '../../../components/ConfirmModal';
import DailyShiftPlanner from './DailyShiftPlanner';
import ShiftsTable from './ShiftsTable';
import EmployeeProfile from '../../../components/EmployeeProfile';

export default function ShiftsModule({ tenant, themeColor }) {
  const location = useLocation();

  // Determinare sub-pagină activă pe baza rutei din sidebar
  let viewMode = 'planner';
  if (location.pathname.includes('/calendar')) {
    viewMode = 'calendar';
  } else if (location.pathname.includes('/table')) {
    viewMode = 'table';
  }

  // Modul de vizualizare în calendar: 'day' | 'week' | 'month'
  const [calendarPeriod, setCalendarPeriod] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const [duplicateShiftData, setDuplicateShiftData] = useState(null);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [shiftChanges, setShiftChanges] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChangeRequestForModal, setPendingChangeRequestForModal] = useState(null);
  const [selectedEmployeeForProfile, setSelectedEmployeeForProfile] = useState(null);

  // Modal Detaliu Tură (Apple Cloud / card de tură la click)
  const [selectedShiftDetail, setSelectedShiftDetail] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  // Helper calcul ore tură
  const calculateShiftHours = (start, end) => {
    if (!start || !end) return 8;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let sMin = sh * 60 + (sm || 0);
    let eMin = eh * 60 + (em || 0);
    if (eMin <= sMin) eMin += 24 * 60; // trece peste miezul nopții
    return Math.round(((eMin - sMin) / 60) * 10) / 10;
  };

  // Calcul următoarea sărbătoare legală în România (ca în exemplul din imagine)
  const nextHoliday = useMemo(() => {
    const ROMANIAN_HOLIDAYS = [
      { name: 'Anul Nou', month: 0, day: 1 },
      { name: 'Anul Nou', month: 0, day: 2 },
      { name: 'Boboteaza', month: 0, day: 6 },
      { name: 'Sf. Ioan Botezătorul', month: 0, day: 7 },
      { name: 'Unirea Principatelor', month: 0, day: 24 },
      { name: 'Ziua Muncii', month: 4, day: 1 },
      { name: 'Ziua Copilului', month: 5, day: 1 },
      { name: 'Adormirea Maicii Domnului', month: 7, day: 15 },
      { name: 'Sfântul Andrei', month: 10, day: 30 },
      { name: 'Ziua Națională', month: 11, day: 1 },
      { name: 'Crăciunul', month: 11, day: 25 },
      { name: 'A doua zi de Crăciun', month: 11, day: 26 },
    ];

    const now = new Date();
    const year = now.getFullYear();
    let candidates = [];
    [year, year + 1].forEach(y => {
      ROMANIAN_HOLIDAYS.forEach(h => {
        const d = new Date(y, h.month, h.day);
        if (d >= now) {
          candidates.push({ ...h, date: d });
        }
      });
    });

    candidates.sort((a, b) => a.date - b.date);
    const next = candidates[0];
    if (!next) return null;

    const dayStr = String(next.day).padStart(2, '0');
    const monthNames = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'];
    return {
      name: next.name,
      formattedDate: `${dayStr} ${monthNames[next.month]}`,
      fullLabel: `${next.name} (${dayStr} ${monthNames[next.month]})`
    };
  }, []);

  // Helper început de săptămână (Luni)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };

  // Zilele afișate în grilă în funcție de modul 'day', 'week' sau 'month'
  const gridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Modul Zi: afișează ziua selectată
    if (calendarPeriod === 'day') {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      return [{
        date: new Date(currentDate),
        dateStr: `${yyyy}-${mm}-${dd}`,
        isCurrentMonth: true,
        isToday: new Date().toDateString() === currentDate.toDateString(),
        dayNumber: currentDate.getDate()
      }];
    }

    // Modul Săptămână: 7 zile (Luni - Duminică)
    if (calendarPeriod === 'week') {
      const startOfWeek = getStartOfWeek(currentDate);
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return {
          date: d,
          dateStr: `${yyyy}-${mm}-${dd}`,
          isCurrentMonth: true,
          isToday: new Date().toDateString() === d.toDateString(),
          dayNumber: d.getDate()
        };
      });
    }

    // Modul Lună: grilă completă de 35 sau 42 de celule
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Indexul primei zile a lunii în sistem Luni = 0 .. Duminică = 6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

    const days = [];

    // Zile din luna anterioară pentru a completa prima săptămână
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({
        date: d,
        dateStr: `${yyyy}-${mm}-${dd}`,
        isCurrentMonth: false,
        isToday: new Date().toDateString() === d.toDateString(),
        dayNumber: d.getDate()
      });
    }

    // Zilele lunii curente
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({
        date: d,
        dateStr: `${yyyy}-${mm}-${dd}`,
        isCurrentMonth: true,
        isToday: new Date().toDateString() === d.toDateString(),
        dayNumber: i
      });
    }

    // Zile din luna următoare pentru a completa ultima săptămână
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({
        date: d,
        dateStr: `${yyyy}-${mm}-${dd}`,
        isCurrentMonth: false,
        isToday: new Date().toDateString() === d.toDateString(),
        dayNumber: i
      });
    }

    return days;
  }, [currentDate, calendarPeriod]);

  // Cheia lunii curente pentru a menține datele în cache la comutarea între Zi, Săptămână și Lună
  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

  // Încărcare date din backend: acoperă luna completă cu marjă de siguranță
  const fetchData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const startOffset = (firstDay.getDay() + 6) % 7;
      const fetchStart = new Date(year, month, 1 - startOffset - 7);
      const lastDay = new Date(year, month + 1, 0);
      const endOffset = 6 - ((lastDay.getDay() + 6) % 7);
      const fetchEnd = new Date(year, month + 1, endOffset + 7);

      const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const startStr = toYMD(fetchStart);
      const endStr = toYMD(fetchEnd);

      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const [empRes, shiftsRes, leavesRes, timesheetsRes] = await Promise.all([
        fetch(`${baseUrl}/api/tenants/${tenant.id}/employees`),
        fetch(`${baseUrl}/api/tenants/${tenant.id}/shifts?start_date=${startStr}&end_date=${endStr}`),
        fetch(`${baseUrl}/api/tenants/${tenant.id}/leaves`),
        fetch(`${baseUrl}/api/tenants/${tenant.id}/timesheets`)
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (shiftsRes.ok) setShifts(await shiftsRes.json());
      if (timesheetsRes && timesheetsRes.ok) setTimesheets(await timesheetsRes.json());
      if (leavesRes.ok) {
        const leaves = await leavesRes.json();
        setShiftChanges(leaves.filter(l => l.leave_type === 'SHIFT_CHANGE' && l.status === 'PENDING'));
      }
    } catch (err) {
      console.error('Eroare încărcare date calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [monthKey, tenant.id]);

  // Navigare perioadă
  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (calendarPeriod === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (calendarPeriod === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (calendarPeriod === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (calendarPeriod === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatPeriodLabel = () => {
    if (calendarPeriod === 'day') {
      const dayName = currentDate.toLocaleDateString('ro-RO', { weekday: 'short' });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const dayNum = currentDate.getDate();
      const monthName = currentDate.toLocaleDateString('ro-RO', { month: 'short' });
      const year = currentDate.getFullYear();
      return `${capitalizedDay}, ${dayNum} ${monthName} ${year}`;
    }
    if (calendarPeriod === 'week') {
      const start = getStartOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    const label = currentDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const confirmDeleteShift = async () => {
    if (!shiftToDelete) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/shifts/${shiftToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setShifts(prev => prev.filter(s => s.id !== shiftToDelete));
        // Dacă e deschis modalul de detaliu, actualizăm și acolo
        if (selectedShiftDetail) {
          setSelectedShiftDetail(prev => {
            if (!prev) return null;
            const updatedItems = prev.group.items.filter(it => it.shift.id !== shiftToDelete);
            return {
              ...prev,
              group: {
                ...prev.group,
                items: updatedItems
              }
            };
          });
        }
        setShiftToDelete(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewShift = (date = null, initialData = null, isEdit = false, pendingChange = null) => {
    setSelectedDateForModal(date);
    setDuplicateShiftData(initialData);
    setIsEditMode(isEdit);
    setPendingChangeRequestForModal(pendingChange);
    setIsModalOpen(true);
  };

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach(emp => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const getAvatarSrc = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
    return `${baseUrl.replace(/\/$/, '')}/${avatarPath.replace(/^\//, '')}`;
  };

  // Mapare pontaje reale pentru a afișa prezența exactă (IN / OUT / Programat)
  const timesheetMap = useMemo(() => {
    const map = new Map();
    timesheets.forEach(ts => {
      if (!ts.employee_id || !ts.timestamp) return;
      const d = new Date(ts.timestamp);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${ts.employee_id}_${yyyy}-${mm}-${dd}`;
      if (!map.has(key) || ts.action_type === 'IN') {
        map.set(key, ts);
      }
    });
    return map;
  }, [timesheets]);

  // Funcție de randare a statusului de prezență clar și intuitiv
  const renderAttendanceBadge = (empId, shiftDate, seenAt) => {
    let sDateStr = '';
    if (shiftDate) {
      const d = new Date(shiftDate);
      sDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    const punch = sDateStr ? timesheetMap.get(`${empId}_${sDateStr}`) : null;

    if (punch && punch.action_type === 'IN') {
      const punchTime = new Date(punch.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
      return (
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5" title={`Pontat la intrare la ora ${punchTime}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Prezent ({punchTime})
        </span>
      );
    }

    if (punch && punch.action_type === 'OUT') {
      const punchTime = new Date(punch.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
      return (
        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1" title={`Pontat la ieșire la ora ${punchTime}`}>
          Tură încheiată ({punchTime})
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Programat
        </span>

        {seenAt ? (
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1" title="Angajatul a văzut și confirmat programul">
            <Eye size={10} /> Confirmat
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1" title="Program transmis, neconfirmat încă în aplicație">
            <EyeOff size={10} /> Neconfirmat
          </span>
        )}
      </div>
    );
  };

  // Mapare ture pe zile și intervale
  const calendarDataByDay = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return gridDays.map(dayItem => {
      // Filtrăm turele ce aparțin acestei zile
      const dayShifts = shifts.filter(s => {
        if (!s.date) return false;
        const sDate = new Date(s.date);
        const sStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
        return sStr === dayItem.dateStr;
      });

      // Grupăm turele strict după interval orar (start_time - end_time) pentru a unifica toți angajații
      const groupsMap = new Map();

      dayShifts.forEach(shift => {
        const emp = employeeMap.get(shift.employee_id) || {
          id: shift.employee_id,
          first_name: shift.employee_name ? shift.employee_name.split(' ')[0] : 'Angajat',
          last_name: shift.employee_name ? shift.employee_name.split(' ').slice(1).join(' ') : '',
          job_title: shift.job_title || '',
          avatar_path: shift.avatar_path || null
        };

        const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
        const jobTitle = (emp.job_title || '').toLowerCase();
        const matchesQuery = !query || fullName.includes(query) || jobTitle.includes(query);

        if (!matchesQuery) return;

        const startTime = (shift.start_time || '00:00').substring(0, 5);
        const endTime = (shift.end_time || '00:00').substring(0, 5);

        // Determinare automată: ore de zi (06:00 - 18:59) vs ore de noapte (19:00 - 05:59)
        const startH = parseInt(startTime.split(':')[0], 10);
        const isNight = startH >= 19 || startH < 6;
        const normalizedShiftType = isNight ? 'NIGHT' : 'DAY';

        // Unificare pe interval orar: toți angajații cu aceleași ore apar în aceeași tură unică
        const groupKey = `${startTime}-${endTime}`;

        if (!groupsMap.has(groupKey)) {
          const durationHours = calculateShiftHours(startTime, endTime);
          groupsMap.set(groupKey, {
            key: groupKey,
            startTime,
            endTime,
            shiftType: normalizedShiftType,
            durationHours,
            notes: shift.notes || '',
            items: []
          });
        }

        const pendingChange = shiftChanges.find(
          l => l.employee_id === shift.employee_id && 
          new Date(l.start_date).toDateString() === new Date(shift.date).toDateString()
        );

        groupsMap.get(groupKey).items.push({
          shift,
          emp,
          pendingChange
        });
      });

      const groups = Array.from(groupsMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
      const scheduledCount = new Set(dayShifts.map(s => s.employee_id)).size;
      const totalHours = Math.round(groups.reduce((sum, g) => sum + (g.durationHours * g.items.length), 0) * 10) / 10;

      return {
        ...dayItem,
        groups,
        dayShiftsCount: dayShifts.length,
        scheduledCount,
        totalHours
      };
    });
  }, [gridDays, shifts, employeeMap, shiftChanges, searchQuery]);

  // Lista orelor pentru vizualizarea săptămânală pe ore (ca în Imaginea 1)
  const weekHours = useMemo(() => {
    return [
      '08:00', '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00', 
      '18:00', '19:00', '20:00', '21:00'
    ];
  }, []);

  // Funcție Avatar Stack fidelă 100% cu Imaginea 2 și ShiftsTable
  const renderAvatarStack = (items, size = 'normal') => {
    const totalEmployees = items.length;
    const previewEmployees = items.slice(0, 3);
    const remainingCount = totalEmployees - previewEmployees.length;

    const isSmall = size === 'small';
    const avatarClass = isSmall ? 'w-7 h-7' : 'w-8 h-8';
    const badgeClass = isSmall ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
    const textClass = isSmall ? 'text-[11px]' : 'text-xs';

    return (
      <div className="flex items-center gap-1.5 overflow-hidden py-0.5">
        <div className="flex -space-x-2 shrink-0">
          {previewEmployees.map(({ emp, shift }) => {
            const avatarSrc = getAvatarSrc(emp.avatar_path);
            const initials = ((emp.first_name?.[0] || '') + (emp.last_name?.[0] || '')).toUpperCase() || 'AN';

            return (
              <div
                key={shift.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEmployeeForProfile(emp.id);
                }}
                className={`${avatarClass} rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-black text-slate-700 dark:text-slate-200 shadow-2xs transition-transform hover:scale-125 hover:z-20 cursor-pointer`}
                title={`${emp.first_name} ${emp.last_name} (${emp.job_title || 'Angajat'}) - Apasă pentru profil`}
              >
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            );
          })}

          {/* Badge circular +N exact ca în Imaginea 2 */}
          {remainingCount > 0 && (
            <div 
              className={`${badgeClass} rounded-full border-2 border-white dark:border-slate-800 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold shrink-0 flex items-center justify-center shadow-2xs`}
              title={`Încă ${remainingCount} angajați alocați în această tură`}
            >
              +{remainingCount}
            </div>
          )}
        </div>

        {/* Textul de număr angajați exact ca în Imaginea 2: 5 Angajați */}
        <span className={`${textClass} font-bold text-slate-700 dark:text-slate-300 truncate ml-1`}>
          {totalEmployees} {totalEmployees === 1 ? 'Angajat' : 'Angajați'}
        </span>
      </div>
    );
  };

  // Statistici globale perioadă afișată
  const totalUniqueScheduled = useMemo(() => {
    return new Set(shifts.map(s => s.employee_id)).size;
  }, [shifts]);

  // Navigare către alte sub-pagini
  if (viewMode === 'table') {
    return (
      <div className="w-full">
        <ShiftsTable tenant={tenant} themeColor={themeColor} />
      </div>
    );
  }

  if (viewMode === 'planner') {
    return (
      <div className="w-full">
        <DailyShiftPlanner tenant={tenant} themeColor={themeColor} />
      </div>
    );
  }

  // Zilele săptămânii pentru header coloane
  const weekDayHeaders = ['LUN', 'MAR', 'MIE', 'JOI', 'VIN', 'SÂM', 'DUM'];

  return (
    <div className={`space-y-5 w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto' : ''}`}>
      {/* Header Principal Calendar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white dark:bg-slate-900 p-4 sm:px-6 sm:py-3.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-primary-600 dark:text-primary-400" size={22} />
            {calendarPeriod === 'month' ? formatPeriodLabel() : 'Calendar Ture'}
          </h2>
        </div>
        
        {/* Controale Calendar - toate pe același rând */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full xl:w-auto justify-end">
          {/* Căutare rapidă angajat */}
          <div className="relative w-36 sm:w-44 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Caută angajat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Buton Ecran Complet (Fullscreen) */}
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs shrink-0"
            title={isFullscreen ? "Ieși din ecran complet" : "Ecran complet"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Toggle Nivel Calendar: Zi / Săptămână / Lună */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner shrink-0">
            <button
              onClick={() => setCalendarPeriod('day')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                calendarPeriod === 'day'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Zi
            </button>
            <button
              onClick={() => setCalendarPeriod('week')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                calendarPeriod === 'week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Săptămână
            </button>
            <button
              onClick={() => setCalendarPeriod('month')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                calendarPeriod === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Lună
            </button>
          </div>

          {/* Navigator Dată */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 p-1 shadow-inner shrink-0">
            <button
              onClick={goToToday}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                new Date().toDateString() === currentDate.toDateString()
                  ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
              title="Mergi la data curentă (Azi)"
            >
              Azi
            </button>
            <button 
              onClick={prevPeriod} 
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
              title="Perioada anterioară"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-white min-w-[125px] text-center select-none truncate">
              {formatPeriodLabel()}
            </span>
            <button 
              onClick={nextPeriod} 
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
              title="Perioada următoare"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          {/* Buton Tură Nouă - pe același rând */}
          <button 
            onClick={() => openNewShift()}
            className="flex items-center justify-center gap-1.5 h-9 px-4 text-white rounded-full font-bold text-xs hover:opacity-90 transition-all shadow-sm hover:shadow-md shrink-0 whitespace-nowrap"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={16} /> Tură Nouă
          </button>
        </div>
      </div>

      {/* Bară Informații Rapide */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold">
            <Clock size={14} className="text-primary-600 dark:text-primary-400" />
            <span>Total ture: <strong className="text-slate-900 dark:text-white">{shifts.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Angajați programați: <strong className="text-slate-900 dark:text-white">{totalUniqueScheduled}</strong> din {employees.length}</span>
          </div>
          {searchQuery && (
            <div className="text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-950/50 px-2.5 py-0.5 rounded-full border border-primary-200 dark:border-primary-800">
              Filtru: "{searchQuery}"
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><Sun size={12} className="text-amber-500" /> Zi</span>
          <span className="flex items-center gap-1"><Moon size={12} className="text-indigo-400" /> Noapte</span>
          <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> Click pe tură pentru card detaliat</span>
        </div>
      </div>

      {/* VIZUALIZARE ZI / SĂPTĂMÂNĂ / LUNĂ */}
      {calendarPeriod === 'day' ? (
        <div className="space-y-4">
          {loading && (
            <div className="bg-white/70 dark:bg-slate-900/70 p-4 rounded-xl text-center text-xs font-bold text-slate-500 animate-pulse">
              Se actualizează turele...
            </div>
          )}

          {/* Header Zi cu Titlu Mare, Statistici și Acțiune Rapidă */}
          <div 
            className="rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ backgroundColor: themeColor }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black capitalize">
                  {currentDate.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {new Date().toDateString() === currentDate.toDateString() && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-slate-900 shadow-2xs">
                    Azi
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                Vizualizare la nivel de zi a schimburilor și a personalului programat
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-xl text-center border border-white/20">
                <div className="text-xs font-black text-white">{calendarDataByDay[0]?.groups.length || 0}</div>
                <div className="text-[10px] uppercase font-bold text-white/75">Ture</div>
              </div>
              <div className="bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-xl text-center border border-white/20">
                <div className="text-xs font-black text-white">{calendarDataByDay[0]?.scheduledCount || 0}</div>
                <div className="text-[10px] uppercase font-bold text-white/75">Angajați</div>
              </div>
              <div className="bg-white/15 backdrop-blur-xs px-3 py-1.5 rounded-xl text-center border border-white/20">
                <div className="text-xs font-black text-white">{calendarDataByDay[0]?.totalHours || 0}h</div>
                <div className="text-[10px] uppercase font-bold text-white/75">Total ore</div>
              </div>
              <button
                onClick={() => openNewShift(currentDate)}
                className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-white/90 transition-all shadow-sm flex items-center gap-1.5 ml-1"
              >
                <Plus size={15} /> Adaugă tură
              </button>
            </div>
          </div>

          {/* Acoperire Orară pe parcursul zilei (Timeline de prezență) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-primary-500" />
                Acoperire Personal pe Ore (06:00 - 23:00)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Număr de angajați simultan la muncă
              </span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-18 gap-1.5">
              {Array.from({ length: 18 }).map((_, i) => {
                const hour = i + 6;
                const hourStr = `${String(hour).padStart(2, '0')}:00`;
                const dayGroups = calendarDataByDay[0]?.groups || [];

                let count = 0;
                dayGroups.forEach(g => {
                  const [sh] = g.startTime.split(':').map(Number);
                  const [eh] = g.endTime.split(':').map(Number);
                  let inShift = false;
                  if (eh > sh) {
                    inShift = hour >= sh && hour < eh;
                  } else {
                    inShift = hour >= sh || hour < eh;
                  }
                  if (inShift) count += g.items.length;
                });

                const isCovered = count > 0;

                return (
                  <div 
                    key={hourStr}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isCovered
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                        : 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800/60'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {hourStr}
                    </span>
                    <span className={`text-sm font-black mt-0.5 ${
                      isCovered ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400 dark:text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista Turelor Zilei */}
          {calendarDataByDay[0]?.groups && calendarDataByDay[0].groups.length > 0 ? (
            <div className="space-y-4">
              {calendarDataByDay[0].groups.map((group) => {
                const totalEmployees = group.items.length;

                return (
                  <div 
                    key={group.key}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                  >
                    {/* Header Tură */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                          {group.shiftType === 'DAY' ? (
                            <Sun size={20} className="text-amber-500" />
                          ) : (
                            <Moon size={20} className="text-indigo-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                              {group.startTime} - {group.endTime}
                            </span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                              {group.durationHours}h
                            </span>
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                              {totalEmployees} {totalEmployees === 1 ? 'Angajat' : 'Angajați'}
                            </span>
                          </div>

                          {group.notes && (
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                              <MapPin size={12} className="text-slate-400" />
                              <span>{group.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => setSelectedShiftDetail({ day: calendarDataByDay[0], group, allGroups: calendarDataByDay[0].groups })}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-1.5"
                        >
                          <Eye size={14} /> Detalii complete
                        </button>
                        <button
                          onClick={() => openNewShift(currentDate, {
                            start_time: group.startTime,
                            end_time: group.endTime,
                            shift_type: group.shiftType,
                            notes: group.notes
                          })}
                          className="px-3.5 py-1.5 text-xs font-bold text-white rounded-full flex items-center gap-1.5 transition-all shadow-2xs hover:opacity-90"
                          style={{ backgroundColor: themeColor }}
                        >
                          <Plus size={14} /> Adaugă angajat
                        </button>
                      </div>
                    </div>

                    {/* Grilă de angajați alocați în această tură */}
                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {group.items.map(({ shift, emp, pendingChange }) => {
                          const avatarSrc = getAvatarSrc(emp.avatar_path);
                          const initials = ((emp.first_name?.[0] || '') + (emp.last_name?.[0] || '')).toUpperCase() || 'AN';

                          return (
                            <div
                              key={shift.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-white dark:hover:bg-slate-800 transition-all group/item"
                            >
                              <div 
                                onClick={() => setSelectedEmployeeForProfile(emp.id)}
                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group/empLink hover:opacity-90 transition-all select-none"
                                title={`Apasă pentru profilul lui ${emp.first_name} ${emp.last_name}`}
                              >
                                <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-200 shadow-2xs group-hover/empLink:ring-2 group-hover/empLink:ring-primary-500/50 group-hover/empLink:scale-105 transition-all">
                                  {avatarSrc ? (
                                    <img 
                                      src={avatarSrc} 
                                      alt="" 
                                      className="w-full h-full object-cover" 
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                  ) : (
                                    <span>{initials}</span>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover/empLink:text-primary-600 dark:group-hover/empLink:text-primary-400 group-hover/empLink:underline underline-offset-2 transition-colors truncate">
                                    {emp.first_name} {emp.last_name}
                                  </div>
                                  <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                                    {emp.job_title || 'Angajat'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {renderAttendanceBadge(emp.id, shift.date, shift.seen_at)}

                                <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openNewShift(null, shift, true, pendingChange)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                    title="Editează"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => setShiftToDelete(shift.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                    title="Șterge"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Stare Când Nu Sunt Ture în Această Zi */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Calendar size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nicio tură programată pentru această zi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Ziua este marcată ca liberă. Poți adăuga o tură nouă folosind butonul de mai jos.
              </p>
              <button
                onClick={() => openNewShift(currentDate)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-full font-bold text-xs shadow-sm hover:opacity-90 transition-all"
                style={{ backgroundColor: themeColor }}
              >
                <Plus size={15} /> Programează tură
              </button>
            </div>
          )}
        </div>
      ) : calendarPeriod === 'week' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-20 flex items-center justify-center">
              <div className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse flex items-center gap-2">
                <Clock size={18} className="animate-spin" /> Se încarcă turele...
              </div>
            </div>
          )}

          {/* Header Zilele Săptămânii cu Statistici și Fundal Culoare Tenant */}
          <div 
            className="grid grid-cols-[64px_repeat(7,1fr)] text-white sticky top-0 z-10 shadow-xs border-b border-white/20"
            style={{ backgroundColor: themeColor }}
          >
            {/* Colț stânga sus (Oră) */}
            <div className="py-3 px-2 text-center text-[10px] font-black uppercase text-white/80 border-r border-white/20 flex items-center justify-center">
              Oră
            </div>

            {/* Coloanele celor 7 zile */}
            {gridDays.map((dayItem, idx) => {
              const dayShifts = calendarDataByDay.find(d => d.dateStr === dayItem.dateStr) || dayItem;
              const dayName = weekDayHeaders[idx];

              return (
                <div 
                  key={dayItem.dateStr}
                  onClick={() => {
                    setCurrentDate(dayItem.date);
                    setCalendarPeriod('day');
                  }}
                  className={`py-3 px-2 text-center border-r border-white/20 last:border-r-0 transition-colors cursor-pointer hover:bg-black/15 ${
                    dayItem.isToday ? 'bg-black/20' : ''
                  }`}
                  title={`Apasă pentru vizualizare la nivel de zi pentru ${dayName}`}
                >
                  <div className="text-[11px] font-black uppercase tracking-wider text-white/85">
                    {dayName}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="text-base font-black text-white">
                      {dayItem.dayNumber}
                    </span>
                    {dayItem.isToday && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white text-slate-900 shadow-2xs">
                        Azi
                      </span>
                    )}
                  </div>
                  {/* Totaluri per zi */}
                  <div className="text-[10px] font-bold text-white/90 mt-0.5 truncate">
                    {dayShifts.scheduledCount > 0 ? (
                      <span>{dayShifts.scheduledCount} Angajați • {dayShifts.totalHours}h</span>
                    ) : (
                      <span className="text-white/60 font-medium">Liber</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linii Orare (08:00, 09:00, 10:00, ... 21:00) */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {weekHours.map((hourStr) => {
              const hourNum = parseInt(hourStr.split(':')[0], 10);

              return (
                <div key={hourStr} className="grid grid-cols-[64px_repeat(7,1fr)] min-h-[72px]">
                  {/* Celula de oră din stânga */}
                  <div className="p-2 text-center text-xs font-black text-slate-400 dark:text-slate-500 border-r border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30 flex items-start justify-center pt-2.5 select-none">
                    {hourStr}
                  </div>

                  {/* Celulele fiecărei zile pentru această oră */}
                  {gridDays.map((dayItem, dayIdx) => {
                    const dayShifts = calendarDataByDay.find(d => d.dateStr === dayItem.dateStr) || dayItem;
                    // Găsim turele care încep în acest interval orar (de ex. 10:00-10:59)
                    const matchingGroups = dayShifts.groups.filter(g => {
                      const gHour = parseInt(g.startTime.split(':')[0], 10);
                      return gHour === hourNum;
                    });

                    const borderRight = dayIdx !== 6 ? 'border-r border-slate-100 dark:border-slate-800/70' : '';

                    return (
                      <div 
                        key={`${dayItem.dateStr}_${hourStr}`}
                        className={`p-1.5 flex flex-col justify-start gap-1.5 transition-colors group/slot relative ${borderRight} ${
                          dayItem.isToday ? 'bg-primary-50/10 dark:bg-primary-950/10' : ''
                        } hover:bg-slate-50/60 dark:hover:bg-slate-800/20`}
                      >
                        {matchingGroups.length > 0 ? (
                          matchingGroups.map((group) => {
                            const totalEmployees = group.items.length;

                            return (
                              <div
                                key={group.key}
                                onClick={() => setSelectedShiftDetail({ day: dayShifts, group, allGroups: dayShifts.groups })}
                                className="w-full rounded-xl p-2.5 border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all cursor-pointer group/card relative text-left"
                                title={`Tură: ${group.startTime} - ${group.endTime} (${totalEmployees} persoane)\nClick pentru detalii complete`}
                              >
                                {/* Header Card: Interval orar + Durată */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {group.shiftType === 'DAY' ? (
                                      <Sun size={12} className="text-amber-500 shrink-0" />
                                    ) : (
                                      <Moon size={12} className="text-indigo-400 shrink-0" />
                                    )}
                                    <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                                      {group.startTime} - {group.endTime}
                                    </span>
                                  </div>

                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md shrink-0">
                                    {group.durationHours}h
                                  </span>
                                </div>

                                {/* Avatar Stack (Imaginea 2: max 3 poze + badge rotund + text "X Angajați") */}
                                {renderAvatarStack(group.items, 'normal')}

                                {/* Locație / Notă dacă există */}
                                {group.notes && (
                                  <div className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate pt-1 border-t border-slate-100 dark:border-slate-750">
                                    <MapPin size={11} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{group.notes}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          /* Buton adăugare rapidă la hover pe interval gol */
                          <div 
                            onClick={() => openNewShift(dayShifts.date, { 
                              start_time: hourStr, 
                              end_time: `${String(Math.min(hourNum + 8, 23)).padStart(2, '0')}:00` 
                            })}
                            className="w-full h-full min-h-[44px] rounded-lg border border-transparent hover:border-dashed hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 flex items-center justify-center cursor-pointer transition-all group/empty"
                            title={`Adaugă tură pe ${dayItem.dayNumber} la ora ${hourStr}`}
                          >
                            <Plus size={14} className="text-slate-300 dark:text-slate-600 group-hover/empty:text-primary-600 opacity-0 group-hover/empty:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIZUALIZARE LUNARĂ (Grilă completă de 35 / 42 celule) */
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs z-20 flex items-center justify-center">
              <div className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse flex items-center gap-2">
                <Clock size={18} className="animate-spin" /> Se încarcă turele...
              </div>
            </div>
          )}

          {/* Header Zilele Săptămânii cu Fundal Culoare Tenant */}
          <div 
            className="grid grid-cols-7 text-center text-white shadow-xs border-b border-white/20"
            style={{ backgroundColor: themeColor }}
          >
            {weekDayHeaders.map((dayName, idx) => (
              <div 
                key={dayName} 
                className="py-3 text-xs font-black uppercase tracking-wider text-white border-r border-white/20 last:border-r-0"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Grila Celulelor de Zile ale Lunii */}
          <div className="grid grid-cols-7 divide-y divide-slate-100 dark:divide-slate-800/70">
            {calendarDataByDay.map((dayItem, index) => {
              const hasShifts = dayItem.groups.length > 0;
              const borderRight = (index + 1) % 7 !== 0 ? 'border-r border-slate-100 dark:border-slate-800/70' : '';

              return (
                <div
                  key={dayItem.dateStr}
                  className={`min-h-[120px] sm:min-h-[135px] p-2 flex flex-col justify-between transition-colors group/cell relative ${borderRight} ${
                    !dayItem.isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-45' : 'bg-white dark:bg-slate-900'
                  } ${dayItem.isToday ? 'bg-primary-50/20 dark:bg-primary-950/20 ring-1 ring-inset ring-primary-500/30' : ''} hover:bg-slate-50/80 dark:hover:bg-slate-800/30`}
                >
                  {/* Antet Celulă: Număr Zi + Indicator Azi + Buton Adăugare Rapidă */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(dayItem.date);
                          setCalendarPeriod('day');
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform ${
                          dayItem.isToday
                            ? 'text-white shadow-2xs font-black'
                            : dayItem.isCurrentMonth
                              ? 'text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                              : 'text-slate-400 dark:text-slate-500'
                        }`}
                        style={dayItem.isToday ? { backgroundColor: themeColor } : {}}
                        title={`Deschide vizualizarea la nivel de zi pentru ${dayItem.dayNumber}`}
                      >
                        {dayItem.dayNumber}
                      </button>
                      {dayItem.isToday && (
                        <span className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-tight">
                          Azi
                        </span>
                      )}
                    </div>

                    {/* Buton adăugare tură la hover */}
                    <button
                      onClick={() => openNewShift(dayItem.date)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-primary-600 dark:hover:bg-primary-500 transition-colors opacity-0 group-hover/cell:opacity-100"
                      title={`Adaugă tură pe ${dayItem.dayNumber}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Conținut Ture: Carduri cu Avatar Stack exact ca în Imaginea 2 */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-start">
                    {dayItem.groups.slice(0, 2).map((group) => {
                      const totalEmployees = group.items.length;

                      return (
                        <div
                          key={group.key}
                          onClick={() => setSelectedShiftDetail({ day: dayItem, group, allGroups: dayItem.groups })}
                          className="rounded-xl p-2 border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-white dark:hover:bg-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer group/shift"
                          title={`Tură: ${group.startTime} - ${group.endTime} (${totalEmployees} persoane)\nClick pentru detalii complete`}
                        >
                          {/* Rând 1: Interval orar și iconiță */}
                          <div className="flex items-center justify-between gap-1 leading-none mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                              {group.shiftType === 'DAY' ? (
                                <Sun size={11} className="text-amber-500 shrink-0" />
                              ) : (
                                <Moon size={11} className="text-indigo-400 shrink-0" />
                              )}
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap">
                                {group.startTime} - {group.endTime}
                              </span>
                            </div>

                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-1 py-0.2 rounded border border-slate-200/80 dark:border-slate-600 shrink-0">
                              {group.durationHours}h
                            </span>
                          </div>

                          {/* Rând 2: Avatar Stack fidel Imaginea 2 */}
                          {renderAvatarStack(group.items, 'small')}
                        </div>
                      );
                    })}

                    {/* Indicator dacă există mai mult de 2 ture în această zi */}
                    {dayItem.groups.length > 2 && (
                      <button
                        onClick={() => setSelectedShiftDetail({ day: dayItem, group: dayItem.groups[0], allGroups: dayItem.groups })}
                        className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline text-left block truncate pt-0.5"
                      >
                        +{dayItem.groups.length - 2} alte ture
                      </button>
                    )}
                  </div>

                  {/* Indicator discret la subsol dacă nu există ture */}
                  {!hasShifts && (
                    <div className="text-[10px] text-slate-300 dark:text-slate-600 font-medium py-1">
                      Liber
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DETALIU TURĂ (Card de Tură la click cu toate pozele, numele și acțiunile) */}
      {selectedShiftDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => { setSelectedShiftDetail(null); setModalSearch(''); }}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  <Calendar size={14} />
                  <span>
                    {selectedShiftDetail.day.date.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 text-lg font-black text-slate-900 dark:text-white">
                    {selectedShiftDetail.group.shiftType === 'DAY' ? (
                      <Sun size={18} className="text-amber-500 shrink-0" />
                    ) : (
                      <Moon size={18} className="text-indigo-400 shrink-0" />
                    )}
                    <span>{selectedShiftDetail.group.startTime} - {selectedShiftDetail.group.endTime}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200/80 dark:border-slate-700">
                    <Users size={12} className="text-primary-500" />
                    <span>{selectedShiftDetail.group.items.length} angajați alocați</span>
                  </span>

                  {selectedShiftDetail.group.notes && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-xs">
                      <MapPin size={11} /> {selectedShiftDetail.group.notes}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openNewShift(selectedShiftDetail.day.date, {
                    start_time: selectedShiftDetail.group.startTime,
                    end_time: selectedShiftDetail.group.endTime,
                    shift_type: selectedShiftDetail.group.shiftType,
                    notes: selectedShiftDetail.group.notes
                  })}
                  className="px-3 py-1.5 text-xs font-bold text-white rounded-full flex items-center gap-1 transition-all shadow-2xs hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  <Plus size={14} /> Adaugă angajat
                </button>
                <button 
                  onClick={() => { setSelectedShiftDetail(null); setModalSearch(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tab-uri dacă există mai multe ture în această zi */}
            {selectedShiftDetail.allGroups && selectedShiftDetail.allGroups.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto px-5 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40" style={{ scrollbarWidth: 'thin' }}>
                <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Ture în această zi:</span>
                {selectedShiftDetail.allGroups.map((grp) => {
                  const isCurrent = grp.key === selectedShiftDetail.group.key;
                  return (
                    <button
                      key={grp.key}
                      onClick={() => { setSelectedShiftDetail(prev => ({ ...prev, group: grp })); setModalSearch(''); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                        isCurrent
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:bg-white/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {grp.shiftType === 'DAY' ? <Sun size={12} className="text-amber-500" /> : <Moon size={12} className="text-indigo-400" />}
                      <span>{grp.startTime} - {grp.endTime}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 py-0.2 rounded font-black">{grp.items.length}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Căutare rapidă în interiorul turei */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Caută în lista acestei ture..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Lista completă de angajați alocați în această tură */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800" style={{ scrollbarWidth: 'thin' }}>
              {selectedShiftDetail.group.items
                .filter(({ emp }) => {
                  if (!modalSearch.trim()) return true;
                  const q = modalSearch.toLowerCase();
                  const name = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                  const role = (emp.job_title || '').toLowerCase();
                  return name.includes(q) || role.includes(q);
                })
                .map(({ shift, emp, pendingChange }) => {
                  const avatarSrc = getAvatarSrc(emp.avatar_path);
                  const initials = ((emp.first_name?.[0] || '') + (emp.last_name?.[0] || '')).toUpperCase() || 'AN';

                  return (
                    <div
                      key={shift.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-850/60 px-2 rounded-xl transition-colors group/empRow"
                    >
                      {/* Avatar + Nume + Funcție - Clickable to open Profile */}
                      <div 
                        onClick={() => setSelectedEmployeeForProfile(emp.id)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group/empLink hover:opacity-90 transition-all select-none"
                        title={`Apasă pentru profilul lui ${emp.first_name} ${emp.last_name}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300 shadow-2xs group-hover/empLink:ring-2 group-hover/empLink:ring-primary-500/50 group-hover/empLink:scale-105 transition-all">
                          {avatarSrc ? (
                            <img 
                              src={avatarSrc} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-900 dark:text-white group-hover/empLink:text-primary-600 dark:group-hover/empLink:text-primary-400 group-hover/empLink:underline underline-offset-2 transition-colors truncate">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 truncate">
                            {emp.job_title || 'Fără funcție'}
                          </div>
                        </div>
                      </div>

                      {/* Status + Butoane Acțiuni */}
                      <div className="flex items-center gap-2 shrink-0">
                        {pendingChange && (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Info size={11} /> Cerere schimb
                          </span>
                        )}

                        {renderAttendanceBadge(emp.id, shift.date, shift.seen_at)}

                        <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2 ml-1">
                          <button
                            onClick={() => openNewShift(null, shift, true, pendingChange)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Editează tura acestui angajat"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setShiftToDelete(shift.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Șterge acest angajat din tură"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-between items-center text-xs text-slate-500">
              <span>Afișează {selectedShiftDetail.group.items.length} angajați alocați în acest interval</span>
              <button
                onClick={() => { setSelectedShiftDetail(null); setModalSearch(''); }}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Creare / Editare Tură */}
      {isModalOpen && (
        <CreateShiftModal
          tenantId={tenant.id}
          employees={employees}
          selectedDate={selectedDateForModal}
          initialData={duplicateShiftData}
          isEdit={isEditMode}
          pendingChangeRequest={pendingChangeRequestForModal}
          themeColor={themeColor}
          onClose={() => setIsModalOpen(false)}
          onShiftCreated={() => {
            setIsModalOpen(false);
            setDuplicateShiftData(null);
            fetchData();
          }}
        />
      )}

      {/* Modal Confirmare Ștergere */}
      <ConfirmModal 
        isOpen={!!shiftToDelete}
        onClose={() => setShiftToDelete(null)}
        onConfirm={confirmDeleteShift}
        title="Ștergere Tură"
        message="Sigur doriți să ștergeți această tură? Acțiunea este ireversibilă."
      />

      {/* MODAL PROFIL ANGAJAT LA CLICK PE NUME / AVATAR */}
      {selectedEmployeeForProfile && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-in fade-in duration-150"
          onClick={() => setSelectedEmployeeForProfile(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1" style={{ scrollbarWidth: 'thin' }}>
              <EmployeeProfile 
                tenant={tenant} 
                themeColor={themeColor} 
                employeeId={selectedEmployeeForProfile} 
                onClose={() => setSelectedEmployeeForProfile(null)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
