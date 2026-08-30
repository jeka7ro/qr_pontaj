import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight, Loader2, QrCode } from 'lucide-react';
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
    fetchShifts(token, currentDate);
  }, [currentDate, navigate]);

  const fetchShifts = async (token, date) => {
    setLoading(true);
    try {
      // Calculăm start și end pentru săptămâna curentă selectată
      const curr = new Date(date);
      const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); 
      const start = new Date(curr.setDate(first));
      const end = new Date(curr.setDate(start.getDate() + 6));

      const startStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`;

      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/employee/shifts?start_date=${startStr}&end_date=${endStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      setError(err.message);
    } finally {
      setLoading(false);
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
      const sDateStr = s.date.split('T')[0];
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header Mobil */}
      <div className="bg-primary-600 text-white px-4 py-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            {employee.avatar_path ? (
              <img src={`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${employee.avatar_path}`} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white/30 object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                <span className="font-bold text-lg">{employee.first_name[0]}{employee.last_name[0]}</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{employee.first_name} {employee.last_name}</h1>
              <p className="text-primary-100 text-sm font-medium">{employee.job_title}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20">
          <button onClick={prevWeek} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <span className="block text-xs text-primary-100 font-medium mb-0.5 uppercase tracking-wider">Săptămâna curentă</span>
            <span className="font-bold text-sm">{formatWeekRange()}</span>
          </div>
          <button onClick={nextWeek} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Continut */}
      <div className="p-4 max-w-md mx-auto space-y-4 pb-24">
        {activeTab === 'schedule' ? (
          <>
            <div className="flex items-center gap-2 mb-2 px-1">
              <CalendarDays size={18} className="text-primary-600" />
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
                    <div key={idx} className={`bg-white rounded-2xl p-4 shadow-sm border ${isToday ? 'border-primary-500 shadow-primary-500/10' : 'border-slate-100'}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center min-w-[50px]">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-primary-600' : 'text-slate-400'}`}>
                            {dayName.slice(0, 3)}
                          </span>
                          <span className={`text-2xl font-bold ${isToday ? 'text-primary-600' : 'text-slate-700'}`}>
                            {dayNum}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{monthName}</span>
                        </div>
                        
                        <div className="flex-1 border-l border-slate-100 pl-4 py-1">
                          {shift ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-primary-500" />
                                <span className="font-bold text-slate-700">
                                  {shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase ml-auto">
                                  {shift.shift_type === 'NIGHT' ? 'NOAPTE' : 'ZI'}
                                </span>
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
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-6 flex flex-col items-center">
              <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 mb-6">
                <QRCodeSVG 
                  value={JSON.stringify({ 
                    employee_id: employee.id, 
                    code: employee.employee_code,
                    t: employee.tenant_id,
                    ts: dynamicTs
                  })}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <h2 className="text-xl font-black text-slate-800 text-center uppercase tracking-tight">Ecuson Digital</h2>
              <p className="text-sm text-slate-500 text-center mt-2 max-w-[200px] leading-relaxed">
                Apropie acest cod de scanerul locației pentru a te ponta.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'schedule' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <CalendarDays size={24} className={activeTab === 'schedule' ? 'drop-shadow-sm' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Program</span>
        </button>
        <button 
          onClick={() => setActiveTab('qr')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'qr' ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-2 rounded-full -mt-6 mb-1 border-4 border-slate-50 ${activeTab === 'qr' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-200 text-slate-500'}`}>
            <QrCode size={28} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider -mt-1">Ecuson</span>
        </button>
      </div>
    </div>
  );
}
