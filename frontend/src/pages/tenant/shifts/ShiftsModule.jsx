import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, ChevronLeft, ChevronRight, Trash2, Info, MapPin, Copy } from 'lucide-react';
import CreateShiftModal from '../../../components/CreateShiftModal';
import ConfirmModal from '../../../components/ConfirmModal';

export default function ShiftsModule({ tenant, themeColor }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState(null);
  const [duplicateShiftData, setDuplicateShiftData] = useState(null);
  const [shiftToDelete, setShiftToDelete] = useState(null);

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentWeek);
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const startY = weekDays[0].getFullYear();
      const startM = String(weekDays[0].getMonth() + 1).padStart(2, '0');
      const startD = String(weekDays[0].getDate()).padStart(2, '0');
      const startStr = `${startY}-${startM}-${startD}`;

      const endY = weekDays[6].getFullYear();
      const endM = String(weekDays[6].getMonth() + 1).padStart(2, '0');
      const endD = String(weekDays[6].getDate()).padStart(2, '0');
      const endStr = `${endY}-${endM}-${endD}`;

      const [empRes, shiftsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/employees`),
        fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/shifts?start_date=${startStr}&end_date=${endStr}`)
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (shiftsRes.ok) setShifts(await shiftsRes.json());
    } catch (err) {
      console.error('Eroare încărcare ture:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWeek, tenant.id]);

  const formatWeek = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  const nextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const confirmDeleteShift = async () => {
    if (!shiftToDelete) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenant.id}/shifts/${shiftToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setShifts(shifts.filter(s => s.id !== shiftToDelete));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewShift = (date = null, initialData = null) => {
    setSelectedDateForModal(date);
    setDuplicateShiftData(initialData);
    setIsModalOpen(true);
  };

  // Mock Data for Empty State
  const isEmpty = !loading && employees.length === 0;
  const displayEmployees = isEmpty ? [
    { id: 'm1', first_name: 'Andrei', last_name: 'Popescu', job_title: 'Șef Echipă' },
    { id: 'm2', first_name: 'Maria', last_name: 'Ionescu', job_title: 'Operator' },
    { id: 'm3', first_name: 'Cristian', last_name: 'Vasile', job_title: 'Șofer' }
  ] : employees.filter(emp => shifts.some(s => s.employee_id === emp.id));

  const displayShifts = isEmpty ? [
    { id: 's1', employee_id: 'm1', date: weekDays[0].toISOString(), shift_type: 'DAY', start_time: '08:00', end_time: '16:00', notes: 'Proiect Rezidențial' },
    { id: 's2', employee_id: 'm2', date: weekDays[0].toISOString(), shift_type: 'DAY', start_time: '08:00', end_time: '16:00', notes: 'Depozit Central' },
    { id: 's3', employee_id: 'm3', date: weekDays[1].toISOString(), shift_type: 'NIGHT', start_time: '20:00', end_time: '04:00', notes: 'Livrări' },
  ] : shifts;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-primary-500" size={24} />
            Planificator de Ture
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Gestionează schimburile angajaților și evită suprapunerile.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 p-1 shadow-inner">
            <button onClick={prevWeek} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300">
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 text-sm font-bold text-slate-700 dark:text-white min-w-[170px] text-center">
              {formatWeek()}
            </span>
            <button onClick={nextWeek} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300">
              <ChevronRight size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => openNewShift()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={18} /> Tură Nouă
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {loading && !isEmpty && (
           <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-lg font-bold text-slate-600 dark:text-slate-300 animate-pulse">Se încarcă planificatorul...</div>
           </div>
        )}

        {isEmpty && !loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[3px] z-10 flex items-center justify-center flex-col">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 text-center max-w-md mx-4 transform transition-all">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Planificatorul este Gol</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Nu există angajați în acest departament. Acesta este un exemplu de afișare. Adaugă angajați din Modulul HR pentru a începe planificarea.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-0">
              <div className="p-4 font-black text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider flex items-center border-r border-slate-200 dark:border-slate-700">
                Angajat
              </div>
              {weekDays.map((day, i) => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <div key={i} className={`p-4 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${isToday ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}`}>
                    <div className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {day.toLocaleDateString('ro-RO', { weekday: 'short' })}
                    </div>
                    <div className={`text-xl font-black mt-1 ${isToday ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-white'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Body Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {displayEmployees.length === 0 && !isEmpty && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-sm font-medium">Niciun angajat nu are ture programate pentru această săptămână.</p>
                  <p className="text-xs mt-1">Apasă pe butonul "+ Tură Nouă" pentru a începe planificarea.</p>
                </div>
              )}
              {displayEmployees.map(emp => (
                <div key={emp.id} className="grid grid-cols-[200px_repeat(7,1fr)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group/row">
                  {/* Employee Cell */}
                  <div className="p-4 flex items-center gap-3 border-r border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 group-hover/row:bg-transparent transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-300 shrink-0 shadow-sm overflow-hidden">
                      {emp.avatar_path ? (
                        <img src={( emp.avatar_path?.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}` )} alt={emp.first_name + ' ' + emp.last_name} className="w-full h-full object-cover" />
                      ) : (
                        (emp.first_name + ' ' + emp.last_name).substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-black text-slate-800 dark:text-white truncate">{emp.first_name} {emp.last_name}</div>
                      <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-wide mt-0.5">{emp.job_title || 'Fără funcție'}</div>
                    </div>
                  </div>
                  
                  {/* Days Cells */}
                  {weekDays.map((day, i) => {
                    const yyyy = day.getFullYear();
                    const mm = String(day.getMonth() + 1).padStart(2, '0');
                    const dd = String(day.getDate()).padStart(2, '0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    
                    const dayShifts = displayShifts.filter(s => {
                      if (!s.date) return false;
                      const shiftDate = new Date(s.date);
                      const sDateStr = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth()+1).padStart(2,'0')}-${String(shiftDate.getDate()).padStart(2,'0')}`;
                      return s.employee_id === emp.id && sDateStr === dateStr;
                    });
                  const isToday = new Date().toDateString() === day.toDateString();
                    
                    return (
                      <div 
                        key={i} 
                        className={`p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0 min-h-[100px] relative group cursor-pointer transition-colors ${isToday ? 'bg-primary-50/10 dark:bg-primary-900/10' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                        onClick={() => !isEmpty && openNewShift(day)}
                      >
                        {dayShifts.map(shift => (
                          <div 
                            key={shift.id} 
                            onClick={(e) => {
                              if(isEmpty) return;
                              e.stopPropagation();
                            }}
                            className={`p-2.5 rounded-lg mb-2 text-xs relative group/shift border shadow-sm transition-all hover:shadow-md
                              bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
                            `}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {shift.start_time.substring(0,5)} - {shift.end_time.substring(0,5)}
                              </span>
                              {!isEmpty && (
                                <div className="flex gap-1 opacity-0 group-hover/shift:opacity-100 transition-all ml-1">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); openNewShift(null, shift); }}
                                    className="text-slate-400 hover:text-primary-500 rounded p-0.5 transition-all"
                                    title="Duplică tura"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setShiftToDelete(shift.id); }}
                                    className="text-slate-400 hover:text-red-500 rounded p-0.5 transition-all"
                                    title="Șterge tura"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                              
                              <div className="ml-auto group-hover/shift:opacity-0 transition-opacity flex items-center">
                                {shift.shift_type === 'DAY' ? (
                                  <div className="text-yellow-500 dark:text-yellow-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                                  </div>
                                ) : (
                                  <div className="text-slate-900 dark:text-slate-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {shift.notes && (
                              <div className="flex items-start gap-1 mt-2 text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-tight">
                                <MapPin size={10} className="shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{shift.notes}</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 mt-1.5 text-[9px] font-bold uppercase tracking-wider ${shift.seen_at ? 'text-green-500' : 'text-slate-400'}`}>
                              {shift.seen_at ? (
                                <><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Văzut</>
                              ) : (
                                <><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> Nevăzut</>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Hover Add Button */}
                        {!isEmpty && dayShifts.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-primary-500 hover:border-primary-500 transition-colors">
                              <Plus size={16} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && !isEmpty && (
        <CreateShiftModal
          tenantId={tenant.id}
          employees={employees}
          selectedDate={selectedDateForModal}
          themeColor={themeColor}
          initialData={duplicateShiftData}
          onClose={() => {
            setIsModalOpen(false);
            setDuplicateShiftData(null);
          }}
          onShiftCreated={() => {
            setIsModalOpen(false);
            setDuplicateShiftData(null);
            fetchData();
          }}
        />
      )}

      <ConfirmModal 
        isOpen={!!shiftToDelete}
        onClose={() => setShiftToDelete(null)}
        onConfirm={confirmDeleteShift}
        title="Ștergere Tură"
        message="Sigur doriți să ștergeți această tură? Acțiunea este ireversibilă."
      />
    </div>
  );
}
