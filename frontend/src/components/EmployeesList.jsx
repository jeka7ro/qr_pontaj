import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Search, Edit2, Trash2, Loader2, ScanLine, Plus, Check, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { extractTextFromImageOrPdf, cropFaceFromIdCard } from '../lib/pdfOcr';
import { parseIdCardText } from '../lib/idParser';

export default function EmployeesList({ tenant, themeColor }) {
  const [employees, setEmployees] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewJobInput, setShowNewJobInput] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', cnp: '', id_card_series: '', birth_date: '', address: '', job_title: '', pin_code: '', location_id: '',
    contract_start_date: '', contract_notes: '', salary: '', existing_avatar: '', existing_id_card: ''
  });
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [idCardBlob, setIdCardBlob] = useState(null);
  
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const filteredEmployees = employees.filter(emp => {
    const s = search.toLowerCase();
    return (emp.first_name?.toLowerCase().includes(s) || emp.last_name?.toLowerCase().includes(s) || emp.cnp?.includes(s));
  });
  
  const total = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [total, rowsPerPage]);

  const currentRows = filteredEmployees.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  useEffect(() => {
    fetchEmployees();
    fetchJobTitles();
    fetchLocations();
  }, [tenant.id]);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/locations`);
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobTitles = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/job-titles`);
      if (res.ok) {
        setJobTitles(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError(null);
    try {
      // 1. OCR Extract
      const { text, imageBlob } = await extractTextFromImageOrPdf(file, (stage) => console.log(stage));
      
      setIdCardBlob(imageBlob);

      // 2. Parse text with Regex
      const parsedData = parseIdCardText(text);
      
      // Update form
      setFormData(prev => {
        const newCnp = parsedData.cnp || prev.cnp;
        let autoPin = prev.pin_code;
        if (newCnp && newCnp.length >= 4) {
          autoPin = newCnp.slice(-4);
        }
        return {
          ...prev,
          first_name: parsedData.first_name || prev.first_name,
          last_name: parsedData.last_name || prev.last_name,
          cnp: newCnp,
          id_card_series: parsedData.id_card_series || prev.id_card_series,
          birth_date: parsedData.birth_date || prev.birth_date,
          pin_code: autoPin
        };
      });

      // In a real app we'd also crop face and upload the blob to S3 here.
      try {
        const faceBlob = await cropFaceFromIdCard(imageBlob);
        setAvatarBlob(faceBlob);
        setAvatarUrl(URL.createObjectURL(faceBlob));
      } catch (e) {
        console.error('Face crop failed:', e);
      }

    } catch (err) {
      console.error(err);
      setOcrError('Eroare la citirea buletinului. Completează manual.');
    } finally {
      setOcrLoading(false);
      e.target.value = ''; // reset file input
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => formPayload.append(key, formData[key]));
      if (avatarBlob) {
        formPayload.append('avatar', avatarBlob, 'avatar.jpg');
      }
      if (idCardBlob) {
        formPayload.append('id_card', idCardBlob, 'id_card.jpg');
      }

      const url = editingId 
        ? `http://localhost:5001/api/tenants/${tenant.id}/employees/${editingId}`
        : `http://localhost:5001/api/tenants/${tenant.id}/employees`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        body: formPayload
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingId(null);
        setFormData({
          first_name: '', last_name: '', cnp: '', id_card_series: '', birth_date: '', address: '', job_title: '', pin_code: '', location_id: '',
          contract_start_date: '', work_schedule: '', contract_notes: '', salary: ''
        });
        setAvatarBlob(null);
        setAvatarUrl(null);
        setIdCardBlob(null);
        setSaveError(null);
        fetchEmployees();
      } else {
        const error = await res.json();
        setSaveError(error.error || 'Eroare la salvare. Verificați datele.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/employees/${employeeToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployeeToDelete(null);
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Echipa Angajați</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestionează personalul care are acces să scaneze la această locație.</p>
        </div>
        {!showAddModal && (
          <button 
            onClick={() => { setShowAddModal(true); setSaveError(null); setOcrError(null); }}
            className="px-5 h-10 rounded-full text-white font-bold shadow-sm transition-all flex items-center gap-2"
            style={{ backgroundColor: themeColor }}
          >
            <UserPlus size={18} /> Adaugă Angajat
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Se încarcă angajații...</div>
      ) : (
        <>
          {/* SEARCH BAR */}
          <div className="mb-4">
            <div style={{ position: 'relative' }} className="w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input
                className="w-full h-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium"
                style={{ paddingLeft: 36, paddingRight: search ? 80 : 16, borderRadius: 9999 }}
                placeholder="Caută angajat..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: themeColor, color: 'white', borderRadius: 9999, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {total} rez.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th style={{ width: 50, textAlign: 'center' }} className="py-3 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Nr.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Angajat</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Funcție</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">PIN / Acces</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                        <Users className="text-slate-300 dark:text-slate-500" size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Nu s-au găsit înregistrări.</h3>
                      {!search && (
                        <button onClick={() => { setShowAddModal(true); setSaveError(null); setOcrError(null); }} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
                          Adaugă primul angajat
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  currentRows.map((emp, index) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                        {(safePage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {emp.avatar_path ? (
                            <img src={`http://localhost:5001${emp.avatar_path}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                              {emp.first_name?.[0] || '?'}{emp.last_name?.[0] || ''}
                            </div>
                          )}
                          <div>
                            <Link to={`/tenant/employees/${emp.id}`} className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">{emp.first_name} {emp.last_name}</Link>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">CNP: {emp.cnp || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-bold">{emp.job_title || '-'}</div>
                        {emp.location_id && (
                          <div className="flex items-center text-xs text-slate-500 mt-1">
                            <MapPin size={12} className="mr-1 text-slate-400" />
                            {locations.find(l => l.id === emp.location_id)?.name || 'Punct lucru necunoscut'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 font-mono">
                          {emp.pin_code || 'Fără PIN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-1">
                        <button 
                          onClick={() => {
                            setFormData({
                              first_name: emp.first_name, last_name: emp.last_name, cnp: emp.cnp, id_card_series: emp.id_card_series || '',
                              birth_date: emp.birth_date ? emp.birth_date.split('T')[0] : '', address: emp.address || '',
                              job_title: emp.job_title || '', pin_code: emp.pin_code || '', location_id: emp.location_id || '',
                              contract_start_date: emp.contract_start_date ? emp.contract_start_date.split('T')[0] : '',
                              contract_notes: emp.contract_notes || '', salary: emp.salary || '',
                              existing_avatar: emp.avatar_path, existing_id_card: emp.id_card_path
                            });
                            setAvatarUrl(emp.avatar_path ? `http://localhost:5001${emp.avatar_path}` : null);
                            setIdCardBlob(null);
                            setEditingId(emp.id);
                            setSaveError(null);
                            setOcrError(null);
                            setShowAddModal(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setEmployeeToDelete(emp)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* FOOTER PAGINARE */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
              <div className="flex items-center gap-4">
                <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400 font-bold">
                  Afișează&nbsp;
                  <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full px-2 py-0.5 outline-none dark:text-white">
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={9999}>Toți</option>
                  </select>
                </span>
                <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400">Total înregistrări: <strong className="text-slate-800 dark:text-white">{total}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400 font-bold mr-2">Pagina {safePage} din {totalPages || 1}</span>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={16} /></button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center border border-transparent dark:border-slate-700">
            <div className="w-16 h-16 mx-auto bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Șterge Angajat</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Ești sigur că vrei să ștergi angajatul <strong>{employeeToDelete.first_name} {employeeToDelete.last_name}</strong>? Această acțiune este ireversibilă.</p>
            <div className="flex gap-3">
              <button onClick={() => setEmployeeToDelete(null)} className="flex-1 h-11 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors">Anulează</button>
              <button onClick={handleDelete} className="flex-1 h-11 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-colors">Șterge</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-transparent dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Adaugă Angajat Nou</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-tight">Profil pontaj și date identificare</p>
              </div>
              <button onClick={() => {
                setShowAddModal(false);
                setEditingId(null);
                setFormData({
                  first_name: '', last_name: '', cnp: '', id_card_series: '', birth_date: '', address: '', job_title: '', pin_code: '', location_id: '',
                  contract_start_date: '', contract_notes: '', salary: '', existing_avatar: '', existing_id_card: ''
                });
                setAvatarBlob(null);
                setAvatarUrl(null);
                setIdCardBlob(null);
              }} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/30">
              {saveError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-6 rounded-r-xl">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-bold">{saveError}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* OCR Box */}
              <div className="mb-6 p-5 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center relative hover:border-primary-300 dark:hover:border-primary-500 transition-colors">
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileUpload}
                  disabled={ocrLoading}
                />
                <div className="pointer-events-none">
                  {ocrLoading ? (
                    <div className="flex flex-col items-center text-primary-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-sm font-bold">Se analizează buletinul...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                      <ScanLine className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Apasă aici pentru a scana un Buletin (C.I.)</span>
                      <span className="text-xs mt-1">Poți face poză sau încărca din galerie. Completăm datele automat!</span>
                    </div>
                  )}
                </div>
                

              </div>

              {ocrError && <div className="mb-4 text-sm text-red-600 font-bold text-center bg-red-50 p-2 rounded">{ocrError}</div>}
              
              {avatarUrl && (
                <div className="mb-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 shadow-sm relative">
                    <img src={avatarUrl} alt="Avatar extras" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium mt-2 bg-slate-100 px-2 py-1 rounded-full">Poză extrasă automat</span>
                </div>
              )}

              {/* Form */}
              <form id="add-employee-form" onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">Nume *</label>
                  <input type="text" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full px-4 h-10 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">Prenume *</label>
                  <input type="text" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full px-4 h-10 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">CNP *</label>
                  <input type="text" required value={formData.cnp} onChange={e => {
                    const newCnp = e.target.value;
                    let autoPin = formData.pin_code;
                    if (newCnp.length >= 4 && (!formData.pin_code || formData.pin_code === formData.cnp.slice(-4))) {
                      autoPin = newCnp.slice(-4);
                    }
                    setFormData({...formData, cnp: newCnp, pin_code: autoPin});
                  }} className="w-full px-4 h-10 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">Serie și Număr C.I.</label>
                  <input type="text" value={formData.id_card_series} onChange={e => setFormData({...formData, id_card_series: e.target.value})} className="w-full px-4 h-10 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">Meserie (Funcția din Firmă)</label>
                  {!showNewJobInput ? (
                    <div className="flex gap-2">
                      <select 
                        value={formData.job_title} 
                        onChange={e => setFormData({...formData, job_title: e.target.value})} 
                        className="flex-1 px-4 h-10 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm"
                      >
                        <option value="">-- Alege o meserie --</option>
                        {jobTitles.map(job => (
                          <option key={job.id} value={job.name}>{job.name}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setShowNewJobInput(true)} 
                        className="h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Plus size={16} /> Nou
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newJobName} 
                        onChange={e => setNewJobName(e.target.value)} 
                        className="flex-1 px-4 h-10 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" 
                        placeholder="Nume meserie nouă..." 
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={async () => {
                          if (!newJobName.trim()) return;
                          try {
                            const res = await fetch(`http://localhost:5001/api/tenants/${tenant.id}/job-titles`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: newJobName.trim() })
                            });
                            if (res.ok) {
                              const newJob = await res.json();
                              setJobTitles([...jobTitles, newJob]);
                              setFormData({...formData, job_title: newJob.name});
                              setNewJobName('');
                              setShowNewJobInput(false);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setShowNewJobInput(false); setNewJobName(''); }} 
                        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm border border-slate-200 dark:border-slate-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 ml-1">PIN Acces (Din CNP)</label>
                  <input type="text" maxLength="4" value={formData.pin_code} onChange={e => setFormData({...formData, pin_code: e.target.value})} className="w-full px-4 h-10 text-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm" />
                </div>

                <div className="col-span-2 -mt-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">Acest PIN (parolă scurtă) este extras din ultimele 4 cifre ale CNP-ului. Angajatul îl va folosi exclusiv pentru a scana codul QR pe tabletă la intrare/ieșire.</p>
                </div>

                {/* Location Dropdown */}
                <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-700 mt-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Punct de Lucru</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                      value={formData.location_id}
                      onChange={e => setFormData({...formData, location_id: e.target.value})}
                    >
                      <option value="">-- Fără punct de lucru fix --</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name} {loc.address ? `(${loc.address})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Contract / HR Data */}
                <div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Date Contractuale</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Data Angajării</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                        value={formData.contract_start_date}
                        onChange={e => setFormData({...formData, contract_start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Salariu</label>
                      <input
                        type="text"
                        placeholder="Ex: 4000 RON"
                        className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                        value={formData.salary}
                        onChange={e => setFormData({...formData, salary: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Notițe Contract</label>
                      <textarea
                        rows="2"
                        placeholder="Detalii adiționale..."
                        className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 resize-none"
                        value={formData.contract_notes}
                        onChange={e => setFormData({...formData, contract_notes: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={() => {
                setShowAddModal(false);
                setAvatarBlob(null);
                setAvatarUrl(null);
              }} className="px-4 h-10 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Anulează
              </button>
              <button type="submit" form="add-employee-form" className="px-6 h-10 rounded-full text-white font-bold shadow-sm transition-colors" style={{ backgroundColor: themeColor }}>
                Salvează Angajatul
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
