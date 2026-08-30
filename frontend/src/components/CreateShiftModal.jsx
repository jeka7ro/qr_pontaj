import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, User } from 'lucide-react';

export default function CreateShiftModal({ onClose, onShiftCreated, tenantId, employees, selectedDate, themeColor, initialData }) {
  const [formData, setFormData] = useState({
    employee_id: initialData?.employee_id || '',
    date: selectedDate ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0] : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    start_time: initialData?.start_time?.substring(0, 5) || '09:00',
    end_time: initialData?.end_time?.substring(0, 5) || '17:00',
    shift_type: initialData?.shift_type || 'DAY',
    notes: initialData?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Custom dropdown states
  const [searchEmp, setSearchEmp] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}/api/tenants/${tenantId}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Eroare la salvarea turei');
      }

      onShiftCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock size={20} style={{ color: themeColor }} />
            {initialData ? 'Duplică Tura' : 'Adaugă Tură Nouă'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-slate-400" />
                Angajat
              </label>
              <div className="relative">
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm cursor-pointer flex justify-between items-center dark:text-white transition-colors"
                  style={{ borderColor: isDropdownOpen ? themeColor : undefined, outline: isDropdownOpen ? `2px solid ${themeColor}40` : 'none' }}
                >
                  <span className={formData.employee_id ? "text-slate-800 dark:text-white" : "text-slate-400"}>
                    {formData.employee_id 
                      ? employees.find(e => e.id == formData.employee_id)?.first_name + ' ' + employees.find(e => e.id == formData.employee_id)?.last_name 
                      : '-- Selectează Angajat --'}
                  </span>
                  <span className="text-slate-400 text-[10px]">▼</span>
                </div>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Caută angajat..." 
                          value={searchEmp}
                          onChange={(e) => setSearchEmp(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none dark:text-white"
                          style={{ focusRing: themeColor }}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {employees.filter(emp => (emp.first_name + ' ' + emp.last_name).toLowerCase().includes(searchEmp.toLowerCase())).map(emp => (
                          <div 
                            key={emp.id} 
                            onClick={() => {
                              setFormData({ ...formData, employee_id: emp.id });
                              setIsDropdownOpen(false);
                              setSearchEmp('');
                            }}
                            className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${formData.employee_id == emp.id ? 'bg-slate-50 dark:bg-slate-700/50 font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                              {emp.avatar_path ? (
                                <img src={( emp.avatar_path?.startsWith('http') ? emp.avatar_path : `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${emp.avatar_path}` )} className="w-full h-full object-cover" />
                              ) : (
                                (emp.first_name + ' ' + emp.last_name).substring(0, 2).toUpperCase()
                              )}
                            </div>
                            {emp.first_name} {emp.last_name}
                          </div>
                        ))}
                        {employees.filter(emp => (emp.first_name + ' ' + emp.last_name).toLowerCase().includes(searchEmp.toLowerCase())).length === 0 && (
                          <div className="px-3 py-4 text-center text-sm text-slate-400">Niciun angajat găsit</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-slate-400" />
                Data Turei
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-2 focus:outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ora Început</label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-2 focus:outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ora Sfârșit</label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-2 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipul Turei</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, shift_type: 'DAY' })}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium border transition-colors ${formData.shift_type === 'DAY' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  Zi
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, shift_type: 'NIGHT' })}
                  className={`flex-1 py-2 px-3 rounded-full text-sm font-medium border transition-colors ${formData.shift_type === 'NIGHT' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  Noapte
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Observații (Opțional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Tura de weekend"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-2 focus:outline-none dark:text-white"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 h-10 px-5 text-sm flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-sm transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                {loading ? 'Se salvează...' : 'Salvează Tura'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
