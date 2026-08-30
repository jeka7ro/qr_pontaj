import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight, Loader2, QrCode, User, Phone, Mail, MapPinned, Briefcase, Hash, Calendar, FileText, Send, CheckCircle2, XCircle, Clock3, Edit3, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Pentru navigare prin saptamani
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [activeTab, setActiveTab] = useState('schedule');
  const [dynamicTs, setDynamicTs] = useState(Math.floor(Date.now() / 10000) * 10);
  const [avatarError, setAvatarError] = useState(false);

  // Concedii
  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'CO', start_date: '', end_date: '', reason: '' });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(null);

  // Detaliu tură
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftChangeReason, setShiftChangeReason] = useState('');
  const [shiftChangeSubmitting, setShiftChangeSubmitting] = useState(false);
  const [shiftChangeSuccess, setShiftChangeSuccess] = useState(null);

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
    setEmployee(JSON.parse(empData));
    fetchShifts(token, currentDate, false);

    // Refresh pe focus/revenire in aplicatie
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchShifts(token, currentDate, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentDate, navigate]);

  const fetchShifts = async (token, date, isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // Calculăm start și end pentru săptămâna curentă selectată
      const curr = new Date(date);
      const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); 
      const start = new Date(curr.setDate(first));
      const end = new Date(curr.setDate(start.getDate() + 6));

      const startStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`;

      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/employee/shifts?start_date=${startStr}&end_date=${endStr}&_t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }
        throw new Error('Eroare la preluarea turelor');
      }

      const data = await res.json();
      setShifts(data);
    } catch (err) {
      if (!isBackground) setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
    navigate('/');
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(curr.setDate(first + i));
      days.push(next);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getShiftForDate = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return shifts.find(s => {
      if (!s.date) return false;
      const shiftDate = new Date(s.date);
      const sDateStr = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth()+1).padStart(2,'0')}-${String(shiftDate.getDate()).padStart(2,'0')}`;
      return sDateStr === dateStr;
    });
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    
    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('ro-RO', options)} - ${end.toLocaleDateString('ro-RO', { ...options, year: 'numeric' })}`;
  };

  if (!employee) return null;

  const tc = employee.tenant_culoare || '#2563eb'; // blue-600 as default

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-800"
      style={{
        '--tc': tc,
        '--tc-50': `${tc}1A`,
        '--tc-100': `${tc}33`,
        '--tc-shadow': `${tc}4D`
      }}
    >
      {/* Header Mobil */}
      <div className="text-white px-4 py-6 rounded-b-3xl shadow-lg relative overflow-hidden bg-[var(--tc)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative flex justify-between items-start mb-6">
          {/* Stanga: Logo Tenant + Nume Angajat */}
          <div className="flex flex-col gap-3">
            {employee.tenant_logo ? (
              <img 
                src={( employee.tenant_logo?.startsWith('http') ? employee.tenant_logo : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employee.tenant_logo}` )} 
                alt="Logo" 
                className="h-10 max-w-[120px] object-contain object-left drop-shadow-md"
              />
            ) : (
              <div className="h-10 text-xl font-black flex items-center">Companie</div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{employee.first_name} {employee.last_name}</h1>
              <p className="text-white/80 text-sm font-medium">{employee.job_title}</p>
            </div>
          </div>
          
          {/* Dreapta: Avatar + Logout */}
          <div className="flex flex-col items-end gap-2">
            {employee.avatar_path && !avatarError ? (
              <img 
                src={( employee.avatar_path?.startsWith('http') ? employee.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employee.avatar_path}` )} 
                alt="Avatar" 
                className="w-14 h-14 rounded-full border-2 border-white/30 object-cover shadow-lg"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 shadow-lg">
                <span className="font-bold text-lg">{employee.first_name?.[0] || '?'}{employee.last_name?.[0] || ''}</span>
              </div>
            )}
            <button onClick={handleLogout} className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors mt-1 bg-white/10 px-2 py-1 rounded-lg">
              <LogOut size={12} />
              <span>Ieșire</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20">
          <button onClick={prevWeek} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <span className="block text-xs text-white/80 font-medium mb-0.5 uppercase tracking-wider">Săptămâna curentă</span>
            <span className="font-bold text-sm">{formatWeekRange()}</span>
          </div>
          <button onClick={nextWeek} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-md mx-auto space-y-4 pb-32">
        {activeTab === 'schedule' ? (
          <>
            <div className="flex items-center gap-2 mb-2 px-1">
              <CalendarDays size={18} className="text-[var(--tc)]" />
              <h2 className="font-bold text-slate-700">Programul meu</h2>
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
            ) : (
              <div className="space-y-3">
                {weekDays.map((day, idx) => {
                  const shift = getShiftForDate(day);
                  const isToday = new Date().toDateString() === day.toDateString();
                  
                  const dayName = day.toLocaleDateString('ro-RO', { weekday: 'long' });
                  const dayNum = day.getDate();
                  const monthName = day.toLocaleDateString('ro-RO', { month: 'short' });

                  return (
                    <div key={idx} 
                      className={`bg-white rounded-2xl p-4 shadow-sm border relative ${isToday ? 'border-[var(--tc)] shadow-[0_4px_20px_var(--tc-50)]' : 'border-slate-100'} ${shift ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
                      onClick={async () => {
                        if (!shift) return;
                        setSelectedShift({ ...shift, dayName, dayNum, monthName });
                        // Marchează ca văzută dacă nu e deja
                        if (!shift.seen_at) {
                          try {
                            const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
                            await fetch(`${baseUrl}/api/employee/shifts/${shift.id}/seen`, {
                              method: 'PUT',
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('employee_token')}` }
                            });
                            // Actualizăm local
                            setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, seen_at: new Date().toISOString() } : s));
                          } catch(e) { /* silent */ }
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center min-w-[50px]">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-[var(--tc)]' : 'text-slate-400'}`}>
                            {dayName.slice(0, 3)}
                          </span>
                          <span className={`text-2xl font-bold ${isToday ? 'text-[var(--tc)]' : 'text-slate-700'}`}>
                            {dayNum}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{monthName}</span>
                        </div>
                        
                        <div className="flex-1 border-l border-slate-100 pl-4 py-1">
                          {shift ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-[var(--tc)]" />
                                <span className="font-bold text-slate-700">
                                  {shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase ml-auto">
                                  {shift.shift_type === 'NIGHT' ? 'NOAPTE' : 'ZI'}
                                </span>
                                {!shift.seen_at && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black text-white animate-pulse" style={{ backgroundColor: tc }}>NOU</span>
                                )}
                              </div>
                              {shift.notes && (
                                <div className="flex items-start gap-2 text-sm text-slate-500">
                                  <MapPin size={14} className="mt-0.5 shrink-0" />
                                  <span className="leading-snug">{shift.notes}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full flex items-center py-2">
                              <span className="text-sm font-medium text-slate-400 italic">Liber (fără tură)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                        {l.leave_type === 'CO' ? '🏖️ Concediu (CO)' : l.leave_type === 'CM' ? '🏥 Medical (CM)' : '📋 Absență'}
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

      {/* Bottom Navigation Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 border-t border-transparent px-6 py-3 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.15)] text-white"
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
          <div 
            className={`p-2 rounded-full -mt-3 mb-1 border-2 border-white/20 ${activeTab === 'qr' ? 'bg-white shadow-[0_4px_15px_rgba(255,255,255,0.3)]' : 'bg-white/10 text-white/80'}`}
            style={activeTab === 'qr' ? { color: 'var(--tc)' } : {}}
          >
            <QrCode size={28} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider -mt-1">Ecuson</span>
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
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'leaves' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
        >
          <FileText size={24} className={activeTab === 'leaves' ? 'drop-shadow-md' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Concedii</span>
        </button>
      </div>

      {/* Modal Detaliu Tură */}
      {selectedShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center" onClick={() => { setSelectedShift(null); setShiftChangeReason(''); setShiftChangeSuccess(null); }}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 space-y-5 animate-slide-up" onClick={e => e.stopPropagation()}>
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
              <textarea 
                rows="2" 
                value={shiftChangeReason} 
                onChange={e => setShiftChangeReason(e.target.value)} 
                placeholder="Descrie ce modificare dorești (ex: schimb tură cu colegul, interval diferit...)"
                className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-700 outline-none resize-none"
              />
              {shiftChangeSuccess && <p className="text-xs text-green-600 font-bold">{shiftChangeSuccess}</p>}
              <button
                disabled={shiftChangeSubmitting || !shiftChangeReason.trim()}
                onClick={async () => {
                  setShiftChangeSubmitting(true);
                  try {
                    const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
                    const res = await fetch(`${baseUrl}/api/employee/shift-change-request`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('employee_token')}` },
                      body: JSON.stringify({ shift_id: selectedShift.id, reason: shiftChangeReason })
                    });
                    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
                    setShiftChangeSuccess('Cerere trimisă cu succes! Administratorul va fi notificat.');
                    setShiftChangeReason('');
                  } catch(e) { setError(e.message); }
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
