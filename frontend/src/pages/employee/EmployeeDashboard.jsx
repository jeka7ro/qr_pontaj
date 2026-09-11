import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight, Loader2, QrCode, User, Phone, Mail, MapPinned, Briefcase, Hash, Calendar, FileText, Send, CheckCircle2, XCircle, Clock3, Edit3, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { updatePageFavicon } from '../../utils/favicon';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Pentru navigare prin luni
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('emp_schedule_view') || 'calendar');
  const [dynamicTs, setDynamicTs] = useState(Math.floor(Date.now() / 10000) * 10);
  const [avatarError, setAvatarError] = useState(false);

  // Concedii & Notificări
  const [leaves, setLeaves] = useState([]);
  const [workedDays, setWorkedDays] = useState([]); // Zile pontate prin QR (YYYY-MM-DD)
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'CO', start_date: '', end_date: '', reason: '' });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(null);
  
  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_leaves') || '[]');
    } catch(e) {
      return [];
    }
  });

  const dismissNotif = (id) => {
    const updated = [...dismissedNotifs, id];
    setDismissedNotifs(updated);
    try {
      localStorage.setItem('dismissed_leaves', JSON.stringify(updated));
    } catch(e) {}
  };

  const fetchLeaves = async (token) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/employee/leaves?_t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch(e) { /* silent */ }
  };

  const unreadLeaves = leaves.filter(l => (l.status === 'APPROVED' || l.status === 'REJECTED') && !dismissedNotifs.includes(l.id));

  // Cerere permisiune notificări browser
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Notificare nativă de browser când există cereri aprobate/respinse
  useEffect(() => {
    if (unreadLeaves.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = unreadLeaves[0];
        new Notification(notif.status === 'APPROVED' ? 'Tură Modificată (Aprobată)' : 'Cerere Respinsă', {
          body: notif.leave_type === 'SHIFT_CHANGE' 
            ? `Tura ta a fost mutată pe data de ${new Date(notif.end_date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}.`
            : 'Verifică noul tău program în aplicație.'
        });
      } catch(e) {}
    }
  }, [unreadLeaves]);

  // Detaliu tură
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftChangeReason, setShiftChangeReason] = useState('');
  const [shiftChangeSubmitting, setShiftChangeSubmitting] = useState(false);
  const [shiftChangeSuccess, setShiftChangeSuccess] = useState(null);
  const [shiftChangeError, setShiftChangeError] = useState(null);
  const [shiftChangeDate, setShiftChangeDate] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDynamicTs(Math.floor(Date.now() / 10000) * 10);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('employee_token');
    const empData = localStorage.getItem('employee_data');
    if (!token || !empData) {
      navigate('/');
      return;
    }
    const parsed = JSON.parse(empData);
    setEmployee(parsed);
    if (parsed?.tenant_favicon || parsed?.tenant_logo) {
      updatePageFavicon(parsed.tenant_favicon || parsed.tenant_logo, `${parsed.tenant_nume || 'Portal Angajat'}`);
    }
    fetchShifts(token, currentDate, false);
    fetchLeaves(token);

    // Refresh pe focus/revenire in aplicatie
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchShifts(token, currentDate, true);
        fetchLeaves(token);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentDate, navigate]);

  const fetchShifts = async (token, date, isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const curr = new Date(date);
      const start = new Date(curr.getFullYear(), curr.getMonth(), 1);
      const firstDayOfWeek = start.getDay() === 0 ? 6 : start.getDay() - 1;
      start.setDate(start.getDate() - firstDayOfWeek);
      
      const end = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
      const lastDayOfWeek = end.getDay() === 0 ? 6 : end.getDay() - 1;
      end.setDate(end.getDate() + (6 - lastDayOfWeek));
      
      const startStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`;

      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const [res, workedRes] = await Promise.all([
        fetch(`${baseUrl}/api/employee/shifts?start_date=${startStr}&end_date=${endStr}&_t=${Date.now()}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        }),
        fetch(`${baseUrl}/api/employee/worked-days?start_date=${startStr}&end_date=${endStr}&_t=${Date.now()}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        }).catch(() => null)
      ]);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }
        throw new Error('Eroare la preluarea turelor');
      }

      const data = await res.json();
      setShifts(data);

      if (workedRes && workedRes.ok) {
        const wData = await workedRes.json();
        setWorkedDays(wData);
      }
    } catch (err) {
      if (!isBackground) setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('employee_token');
      if (token) {
        const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
        await fetch(`${baseUrl}/api/employee/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {}
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
    navigate('/');
  };

  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getCalendarDays = () => {
    const curr = new Date(currentDate);
    const start = new Date(curr.getFullYear(), curr.getMonth(), 1);
    const firstDayOfWeek = start.getDay() === 0 ? 6 : start.getDay() - 1;
    start.setDate(start.getDate() - firstDayOfWeek);
    
    const end = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
    const lastDayOfWeek = end.getDay() === 0 ? 6 : end.getDay() - 1;
    end.setDate(end.getDate() + (6 - lastDayOfWeek));
    
    const days = [];
    let current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  const getShiftForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return shifts.find(s => {
      if (!s.date) return false;
      // API returnează date ca string "2026-08-31" sau "2026-08-31T00:00:00.000Z"
      const sDateStr = typeof s.date === 'string' ? s.date.slice(0, 10) : (() => {
        const d = new Date(s.date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      })();
      return sDateStr === dateStr;
    });
  };

  const formatPeriodRange = () => {
    const curr = new Date(currentDate);
    return curr.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  if (!employee) return null;

  const tc = employee.tenant_culoare || '#2563eb'; // blue-600 as default

  return (
    <div 
      className="flex flex-col h-[100dvh] bg-slate-50 text-slate-800 overflow-hidden"
      style={{
        '--tc': tc,
        '--tc-50': `${tc}1A`,
        '--tc-100': `${tc}33`,
        '--tc-shadow': `${tc}4D`
      }}
    >
      <div className="flex-1 overflow-y-auto relative w-full pb-6">
        {/* Header Mobil */}
        <div className="text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-lg relative overflow-hidden bg-[var(--tc)] flex-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        {/* Logout sus-dreapta */}
        <button onClick={handleLogout} className="absolute top-4 right-4 z-10 text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors bg-white/10 px-2.5 py-1.5 rounded-xl">
          <LogOut size={12} />
          <span>Ieșire</span>
        </button>

        {/* Logo sus-stânga */}
        <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-0.5">
          {employee.tenant_logo ? (
            <img 
              src={( employee.tenant_logo?.startsWith('http') ? employee.tenant_logo : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employee.tenant_logo}` )} 
              alt="Logo" 
              className="h-8 max-w-[100px] object-contain drop-shadow-md"
            />
          ) : (
            <div className="h-8 text-base font-black flex items-center text-white">{employee.tenant_nume || 'Companie'}</div>
          )}
          {employee.tenant_logo && employee.tenant_nume && (
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">{employee.tenant_nume}</span>
          )}
        </div>

        {/* Layout centrat: Poză → Nume */}
        <div className="relative flex flex-col items-center gap-3 mt-4">
          {employee.avatar_path && !avatarError ? (
            <img 
              src={( employee.avatar_path?.startsWith('http') ? employee.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employee.avatar_path}` )} 
              alt="Avatar" 
              className="w-20 h-20 rounded-2xl border-3 border-white/30 object-cover shadow-xl"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center border-3 border-white/30 shadow-xl">
              <span className="font-black text-2xl">{employee.first_name?.[0] || '?'}{employee.last_name?.[0] || ''}</span>
            </div>
          )}

          {/* Nume + funcție */}
          <div className="text-center">
            <h1 className="font-black text-lg leading-tight">{employee.first_name} {employee.last_name}</h1>
            <p className="text-white/70 text-sm font-medium mt-0.5">{employee.job_title}</p>
          </div>
        </div>
        
        {activeTab === 'schedule' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 mt-4">
            <button onClick={prevPeriod} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <span className="block text-xs text-white/80 font-medium mb-0.5 uppercase tracking-wider">LUNA CURENTĂ</span>
              <span className="font-bold text-sm">{formatPeriodRange()}</span>
            </div>
            <button onClick={nextPeriod} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-md mx-auto space-y-4 pb-32">
        {/* Notificări Status Cereri (In-App) */}
        {leaves.filter(l => (l.status === 'APPROVED' || l.status === 'REJECTED') && !dismissedNotifs.includes(l.id)).map(l => (
          <div 
            key={l.id} 
            className={`p-4 rounded-2xl shadow-lg border relative flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              l.status === 'APPROVED' 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100' 
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${l.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200' : 'bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-200'}`}>
                {l.status === 'APPROVED' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                    {l.leave_type === 'SHIFT_CHANGE' ? 'Modificare Tură' : 'Cerere Concediu'}
                  </span>
                  <span className={`text-[11px] font-black uppercase ${l.status === 'APPROVED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {l.status === 'APPROVED' ? 'Aprobată' : 'Respinsă'}
                  </span>
                </div>
                <p className="text-xs font-bold mt-1 leading-snug">
                  {l.status === 'APPROVED'
                    ? (l.leave_type === 'SHIFT_CHANGE' 
                        ? `Tura ta a fost mutată pe data de ${new Date(l.end_date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}.`
                        : `Cererea din perioada ${new Date(l.start_date).toLocaleDateString('ro-RO')} a fost aprobată.`)
                    : 'Cererea ta a fost respinsă de către administrator.'}
                </p>
                {l.reason && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">{l.reason}</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => dismissNotif(l.id)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
              title="Închide notificarea"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {activeTab === 'schedule' ? (
          <>
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-[var(--tc)]" />
                <h2 className="font-bold text-slate-700 dark:text-white">Programul meu</h2>
              </div>
              
              <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-full border border-slate-200/50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('calendar');
                    localStorage.setItem('emp_schedule_view', 'calendar');
                  }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'calendar'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Calendar size={12} />
                  CALENDAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    localStorage.setItem('emp_schedule_view', 'list');
                  }}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Clock size={12} />
                  LISTĂ
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p className="text-sm">Se încarcă orarul...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm">
                {error}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2.5">
                {(() => {
                  const monthDaysWithItems = calendarDays
                    .filter(day => day.getMonth() === currentDate.getMonth())
                    .filter(day => {
                      const shift = getShiftForDate(day);
                      const dayStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                      return !!shift || workedDays.includes(dayStr);
                    });

                  if (monthDaysWithItems.length === 0) {
                    return (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400 border border-slate-100 dark:border-slate-800">
                        <CalendarDays size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-sm">Nu există ture sau pontaje programate în această lună.</p>
                      </div>
                    );
                  }

                  return monthDaysWithItems.map((day, idx) => {
                    const dayStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                    const shift = getShiftForDate(day);
                    const isWorkedQR = workedDays.includes(dayStr);
                    const isToday = new Date().toDateString() === day.toDateString();
                    const dayName = day.toLocaleDateString('ro-RO', { weekday: 'long' });
                    const dayNum = day.getDate();
                    const monthName = day.toLocaleDateString('ro-RO', { month: 'short' });

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (shift) {
                            setSelectedShift({ ...shift, dayName, dayNum, monthName, isWorkedQR });
                          } else if (isWorkedQR) {
                            setSelectedShift({
                              id: 'qr-' + dayStr,
                              dayName,
                              dayNum,
                              monthName,
                              start_time: 'Confirmat',
                              end_time: 'QR',
                              shift_type: 'DAY',
                              notes: 'Zi lucrată confirmată prin scanare QR.',
                              isWorkedQR: true
                            });
                          }
                        }}
                        className={`bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                          isToday 
                            ? 'border-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500' 
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 leading-none">{dayName.slice(0, 3)}</span>
                            <span className="text-base font-black text-emerald-950 dark:text-emerald-100 leading-tight">{dayNum}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-800 dark:text-white capitalize">{dayName}</span>
                              {isToday && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">Azi</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {shift ? `${shift.start_time?.slice(0, 5)} - ${shift.end_time?.slice(0, 5)}` : 'Pontat prin QR'}
                              {shift?.shift_type === 'NIGHT' && ' (Noapte)'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {isWorkedQR ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={12} /> Pontat QR
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Programat
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-7 mb-2 text-center">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((day, idx) => {
                    const dayStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const shift = getShiftForDate(day);
                    const isWorkedQR = workedDays.includes(dayStr);
                    const hasShiftOrWorked = !!shift || isWorkedQR;
                    const isToday = new Date().toDateString() === day.toDateString();
                    
                    return (
                      <div 
                        key={idx}
                        onClick={async () => {
                          if (!shift && !isWorkedQR) return;
                          const dayName = day.toLocaleDateString('ro-RO', { weekday: 'long' });
                          const dayNum = day.getDate();
                          const monthName = day.toLocaleDateString('ro-RO', { month: 'short' });
                          if (shift) {
                            setSelectedShift({ ...shift, dayName, dayNum, monthName, isWorkedQR });
                            if (!shift.seen_at) {
                              try {
                                const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
                                await fetch(`${baseUrl}/api/employee/shifts/${shift.id}/seen`, {
                                  method: 'PUT',
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('employee_token')}` }
                                });
                                setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, seen_at: new Date().toISOString() } : s));
                              } catch(e) {}
                            }
                          } else if (isWorkedQR) {
                            setSelectedShift({
                              id: 'qr-' + dayStr,
                              dayName,
                              dayNum,
                              monthName,
                              start_time: 'Confirmat',
                              end_time: 'QR',
                              shift_type: 'DAY',
                              notes: 'Zi lucrată confirmată prin scanare QR la locație.',
                              isWorkedQR: true
                            });
                          }
                        }}
                        className={`
                          aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all
                          ${!isCurrentMonth ? 'opacity-30' : ''}
                          ${hasShiftOrWorked 
                            ? 'bg-[#dcfce7] dark:bg-emerald-950/60 border border-[#86efac] dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100 font-bold shadow-sm' 
                            : (isWeekend ? 'bg-orange-50/50 dark:bg-orange-900/10 text-slate-500 dark:text-slate-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300')}
                          ${isToday ? 'ring-2 ring-emerald-600 ring-offset-1 font-black' : ''}
                          ${hasShiftOrWorked ? 'cursor-pointer hover:bg-[#bbf7d0] dark:hover:bg-emerald-900/80 active:scale-95' : ''}
                        `}
                      >
                        <span className={`text-sm ${hasShiftOrWorked ? 'font-black' : 'font-bold'} ${isToday ? 'text-emerald-700 dark:text-emerald-300 underline' : ''}`}>
                          {day.getDate()}
                        </span>
                        
                        {/* Bulină indicator pentru pontaj QR */}
                        {isWorkedQR && (
                          <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" title="Pontat prin QR"></div>
                        )}
                        
                        {/* Bulină pulsing pentru tură nouă nevizualizată */}
                        {shift && !shift.seen_at && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-600 rounded-full animate-pulse" title="Nou"></div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legendă culori sub calendar */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-[#dcfce7] border border-[#86efac]"></span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Zile cu Tură / Pontaj QR</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></span>
                    <span>Liber</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'qr' ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-white p-5 rounded-3xl shadow-xl border border-slate-100 mb-6 flex flex-col items-center w-full max-w-[340px]">
              <div className="p-3 rounded-2xl border mb-6 bg-[var(--tc-50)] border-[var(--tc-100)]">
                <QRCodeSVG 
                  value={`QRP-EMP-${employee.tenant_id}-${employee.id}`}
                  size={260}
                  level="H"
                  includeMargin={true}
                  fgColor={tc}
                  imageSettings={
                    employee.tenant_logo
                      ? {
                          src: ( employee.tenant_logo?.startsWith('http') ? employee.tenant_logo : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employee.tenant_logo}` ),
                          height: 48,
                          width: 48,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>
              <h2 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight">Ecuson Digital</h2>
              <p className="text-sm text-slate-500 text-center mt-2 max-w-[200px] leading-relaxed">
                Apropie acest cod de scanerul locației pentru a te ponta.
              </p>
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          <div className="flex flex-col items-center gap-6">
            {/* Poza Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden w-full max-w-[320px]">
              {employee.avatar_path && !avatarError ? (
                <img 
                  src={( employee.avatar_path?.startsWith('http') ? employee.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employee.avatar_path}` )} 
                  alt="Poza Profil" 
                  className="w-full aspect-[3/4] object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-slate-100 flex items-center justify-center">
                  <User size={80} className="text-slate-300" />
                </div>
              )}
              <div className="p-4 text-center">
                <h2 className="font-black text-lg text-slate-800">{employee.first_name} {employee.last_name}</h2>
                <p className="text-sm text-slate-500 font-medium">{employee.job_title || 'Angajat'}</p>
              </div>
            </div>

            {/* Date Profil */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 w-full max-w-[320px] divide-y divide-slate-100">
              {employee.employee_code && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Hash size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Cod Angajat</p>
                    <p className="text-sm font-bold text-slate-700">{employee.employee_code}</p>
                  </div>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Telefon</p>
                    <p className="text-sm font-bold text-slate-700">{employee.phone}</p>
                  </div>
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Email</p>
                    <p className="text-sm font-bold text-slate-700">{employee.email}</p>
                  </div>
                </div>
              )}
              {employee.cnp && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">CNP</p>
                    <p className="text-sm font-bold text-slate-700">{employee.cnp}</p>
                  </div>
                </div>
              )}
              {employee.address && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPinned size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Adresă</p>
                    <p className="text-sm font-bold text-slate-700">{employee.address}</p>
                  </div>
                </div>
              )}
              {employee.birth_date && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Data Nașterii</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(employee.birth_date).toLocaleDateString('ro-RO')}</p>
                  </div>
                </div>
              )}
              {employee.contract_start_date && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Briefcase size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Angajat din</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(employee.contract_start_date).toLocaleDateString('ro-RO')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'leaves' ? (
          <div className="space-y-6">
            {/* Formular cerere */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
              <h3 className="font-black text-base text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} /> Cerere Nouă</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Tip Cerere</label>
                  <div className="flex gap-2">
                    {[{v:'CO',l:'Concediu (CO)'},{v:'CM',l:'Medical (CM)'},{v:'ABSENT',l:'Absență'}].map(t => (
                      <button
                        key={t.v}
                        type="button"
                        onClick={() => setLeaveForm({...leaveForm, leave_type: t.v})}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          leaveForm.leave_type === t.v 
                            ? 'text-white border-transparent shadow-md' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                        style={leaveForm.leave_type === t.v ? { backgroundColor: tc } : {}}
                      >
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">De la</label>
                    <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Până la</label>
                    <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-700 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Motiv</label>
                  <textarea rows="2" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Scrie motivul cererii..." className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-700 outline-none resize-none" />
                </div>
                {leaveSuccess && <p className="text-xs text-green-600 font-bold">{leaveSuccess}</p>}
                <button
                  disabled={leaveSubmitting || !leaveForm.start_date}
                  onClick={async () => {
                    setLeaveSubmitting(true);
                    setLeaveSuccess(null);
                    try {
                      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
                      const res = await fetch(`${baseUrl}/api/employee/leaves`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('employee_token')}` },
                        body: JSON.stringify(leaveForm)
                      });
                      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
                      setLeaveSuccess('Cerere trimisă cu succes!');
                      setLeaveForm({ leave_type: 'CO', start_date: '', end_date: '', reason: '' });
                      // Refresh lista
                      const lRes = await fetch(`${baseUrl}/api/employee/leaves`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('employee_token')}` } });
                      if (lRes.ok) setLeaves(await lRes.json());
                    } catch(e) { setError(e.message); }
                    setLeaveSubmitting(false);
                  }}
                  className="w-full py-3 rounded-full text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                  style={{ backgroundColor: tc }}
                >
                  <Send size={16} />
                  {leaveSubmitting ? 'Se trimite...' : 'Trimite Cererea'}
                </button>
              </div>
            </div>

            {/* Lista cereri existente */}
            <div className="space-y-3">
              <h3 className="font-black text-sm text-slate-500 uppercase tracking-wider px-1">Cererile Mele</h3>
              {leaves.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100">Nu ai cereri de concediu.</div>
              ) : (
                leaves.map(l => (
                  <div key={l.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-700">
                        {l.leave_type === 'CO' ? 'Concediu (CO)' : l.leave_type === 'CM' ? 'Medical (CM)' : l.leave_type === 'SHIFT_CHANGE' ? 'Modificare Tură' : 'Absență'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        l.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        l.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {l.status === 'APPROVED' ? <><CheckCircle2 size={10} /> Aprobat</> :
                         l.status === 'REJECTED' ? <><XCircle size={10} /> Respins</> :
                         <><Clock3 size={10} /> În așteptare</>}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(l.start_date).toLocaleDateString('ro-RO')} {l.end_date && l.end_date !== l.start_date ? `— ${new Date(l.end_date).toLocaleDateString('ro-RO')}` : ''}
                    </p>
                    {l.reason && <p className="text-xs text-slate-400 mt-1 italic">{l.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div 
        className="flex-none border-t border-transparent px-6 py-3 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.15)] text-white"
        style={{ backgroundColor: 'var(--tc)' }}
      >
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'schedule' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
        >
          <CalendarDays size={24} className={activeTab === 'schedule' ? 'drop-shadow-md' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Program</span>
        </button>
        <button 
          onClick={() => setActiveTab('qr')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'qr' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
        >
          <QrCode size={24} className={activeTab === 'qr' ? 'drop-shadow-md' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ecuson</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
        >
          <User size={24} className={activeTab === 'profile' ? 'drop-shadow-md' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Profil</span>
        </button>
        <button 
          onClick={async () => {
            setActiveTab('leaves');
            try {
              const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
              const res = await fetch(`${baseUrl}/api/employee/leaves`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('employee_token')}` } });
              if (res.ok) setLeaves(await res.json());
            } catch(e) { /* silent */ }
          }}
          className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'leaves' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
        >
          {leaves.some(l => (l.status === 'APPROVED' || l.status === 'REJECTED') && !dismissedNotifs.includes(l.id)) && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
          <FileText size={24} className={activeTab === 'leaves' ? 'drop-shadow-md' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Concedii</span>
        </button>
      </div>

      {/* Modal Notificare Urgentă Modificare Program / Cerere */}
      {unreadLeaves.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
              unreadLeaves[0].status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
            }`}>
              {unreadLeaves[0].status === 'APPROVED' ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
            </div>
            
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {unreadLeaves[0].leave_type === 'SHIFT_CHANGE' ? 'Modificare Tură' : 'Cerere Concediu'}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                {unreadLeaves[0].status === 'APPROVED' ? 'Cererea ta a fost Aprobată!' : 'Cererea ta a fost Respinsă'}
              </h3>
              
              {unreadLeaves[0].status === 'APPROVED' && unreadLeaves[0].leave_type === 'SHIFT_CHANGE' && unreadLeaves[0].end_date ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs text-left space-y-1">
                  <p className="font-medium text-slate-600 dark:text-slate-400">Noua ta tură a fost mutată pe:</p>
                  <p className="text-base font-black text-emerald-700 dark:text-emerald-300 capitalize">
                    📅 {new Date(unreadLeaves[0].end_date).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unreadLeaves[0].status === 'APPROVED' ? 'Modificările au fost aplicate cu succes în orar.' : 'Administratorul a respins solicitarea ta.'}
                </p>
              )}

              {unreadLeaves[0].reason && (
                <p className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  "{unreadLeaves[0].reason}"
                </p>
              )}
            </div>

            <button
              onClick={() => {
                dismissNotif(unreadLeaves[0].id);
              }}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: tc }}
            >
              Am înțeles, mulțumesc!
            </button>
          </div>
        </div>
      )}

      {/* Modal Detaliu Tură */}
      {selectedShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center" onClick={() => { setSelectedShift(null); setShiftChangeReason(''); setShiftChangeSuccess(null); }}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 space-y-5 animate-slide-up max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-800">Detalii Tură</h3>
              <button onClick={() => { setSelectedShift(null); setShiftChangeReason(''); setShiftChangeSuccess(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Info Tură */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar size={18} style={{ color: tc }} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Data</p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedShift.dayName} {selectedShift.dayNum} {selectedShift.monthName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Clock size={18} style={{ color: tc }} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Program</p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedShift.start_time?.slice(0,5)} - {selectedShift.end_time?.slice(0,5)}
                    <span className="ml-2 text-xs text-slate-500">({selectedShift.shift_type === 'NIGHT' ? 'Noapte' : 'Zi'})</span>
                  </p>
                </div>
              </div>
              {selectedShift.location_name && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <MapPin size={18} style={{ color: tc }} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Locație</p>
                    <p className="text-sm font-bold text-slate-700">{selectedShift.location_name}</p>
                  </div>
                </div>
              )}
              {selectedShift.notes && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <FileText size={18} style={{ color: tc }} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Note</p>
                    <p className="text-sm font-bold text-slate-700">{selectedShift.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Solicită Modificare */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-600 flex items-center gap-2"><Edit3 size={14} /> Solicită Modificare</h4>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 ml-1">Dată dorită (opțional)</label>
                <input 
                  type="date"
                  value={shiftChangeDate}
                  onChange={e => setShiftChangeDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-700 outline-none"
                />
              </div>

              <textarea 
                rows="2" 
                value={shiftChangeReason} 
                onChange={e => setShiftChangeReason(e.target.value)} 
                placeholder="Descrie ce modificare dorești (ex: schimb tură cu colegul, interval diferit...)"
                className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-700 outline-none resize-none"
              />
              {shiftChangeSuccess && <p className="text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded-xl">✅ {shiftChangeSuccess}</p>}
              {shiftChangeError && <p className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded-xl">❌ {shiftChangeError}</p>}
              <button
                disabled={shiftChangeSubmitting || (!shiftChangeReason.trim() && !shiftChangeDate)}
                onClick={async () => {
                  setShiftChangeSubmitting(true);
                  setShiftChangeError(null);
                  setShiftChangeSuccess(null);
                  try {
                    const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
                    const res = await fetch(`${baseUrl}/api/employee/shift-change-request`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('employee_token')}` },
                      body: JSON.stringify({ shift_id: selectedShift.id, reason: shiftChangeReason || 'Modificare solicitată', new_date: shiftChangeDate })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Eroare necunoscută');
                    setShiftChangeSuccess('Cerere trimisă cu succes! Administratorul va fi notificat.');
                    setShiftChangeReason('');
                    setShiftChangeDate('');
                  } catch(e) { setShiftChangeError(e.message); }
                  setShiftChangeSubmitting(false);
                }}
                className="w-full py-3 rounded-full text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                style={{ backgroundColor: tc }}
              >
                <Send size={16} />
                {shiftChangeSubmitting ? 'Se trimite...' : 'Trimite Solicitarea'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
