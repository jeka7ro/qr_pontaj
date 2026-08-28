import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Briefcase, Calendar, Clock, Banknote, Shield, History, Activity, Image as ImageIcon, Camera, FileText, Upload, Trash2, Download, Loader2, X, ArrowRight, Eye } from 'lucide-react';

const EmployeeProfile = ({ tenant, themeColor }) => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [activeTab, setActiveTab] = useState('details');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const [evalPunctuality, setEvalPunctuality] = useState(10);
  const [evalAttendance, setEvalAttendance] = useState(10);
  const [evalAttitude, setEvalAttitude] = useState(10);
  const [evalPerformance, setEvalPerformance] = useState(10);
  const [evalReliability, setEvalReliability] = useState(10);
  const [savingEval, setSavingEval] = useState(false);
  const [notification, setNotification] = useState(null);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev > 0 ? prev - 1 : prev));
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev < documents.length - 1 ? prev + 1 : prev));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, documents]);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const [empRes, histRes, docRes] = await Promise.all([
        fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/employees/${id}`),
        fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/employees/${id}/history`),
        fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/employees/${id}/documents`)
      ]);
      
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployee(empData);
        setEvalPunctuality(empData.eval_punctuality ?? 10);
        setEvalAttendance(empData.eval_attendance ?? 10);
        setEvalAttitude(empData.eval_attitude ?? 10);
        setEvalPerformance(empData.eval_performance ?? 10);
        setEvalReliability(empData.eval_reliability ?? 10);
      }
      if (histRes.ok) setHistory(await histRes.json());
      if (docRes.ok) setDocuments(await docRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/employees/${id}/avatar`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setEmployee(prev => ({ ...prev, avatar_path: data.avatar_path }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('file_name', file.name);

    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/employees/${id}/documents`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newDoc = await res.json();
        setDocuments(prev => [newDoc, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      setSavingEval(true);
      const formData = new FormData();
      formData.append('first_name', employee.first_name);
      formData.append('last_name', employee.last_name);
      formData.append('pin_code', employee.pin_code);
      if (employee.cnp) formData.append('cnp', employee.cnp);
      if (employee.id_card_series) formData.append('id_card_series', employee.id_card_series);
      if (employee.birth_date) formData.append('birth_date', employee.birth_date);
      if (employee.address) formData.append('address', employee.address);
      if (employee.job_title) formData.append('job_title', employee.job_title);
      if (employee.location_id) formData.append('location_id', employee.location_id);
      if (employee.contract_start_date) formData.append('contract_start_date', employee.contract_start_date);
      if (employee.work_schedule) formData.append('work_schedule', employee.work_schedule);
      if (employee.contract_notes) formData.append('contract_notes', employee.contract_notes);
      if (employee.salary) formData.append('salary', employee.salary);
      
      if (employee.avatar_path) formData.append('existing_avatar', employee.avatar_path);
      if (employee.id_card_path) formData.append('existing_id_card', employee.id_card_path);
      
      formData.append('eval_punctuality', evalPunctuality);
      formData.append('eval_attendance', evalAttendance);
      formData.append('eval_attitude', evalAttitude);
      formData.append('eval_performance', evalPerformance);
      formData.append('eval_reliability', evalReliability);

      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/employees/${id}`, {
        method: 'PUT',
        body: formData
      });
      
      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        setNotification({ type: 'success', text: 'Notele au fost salvate cu succes!' });
        setTimeout(() => setNotification(null), 5000);
        fetchEmployeeData();
      } else {
        setNotification({ type: 'error', text: `Eroare server: ${resData.error || res.statusText}` });
        setTimeout(() => setNotification(null), 8000);
      }
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', text: 'Eroare conexiune: ' + err.message });
      setTimeout(() => setNotification(null), 8000);
    } finally {
      setSavingEval(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest document?')) return;
    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/employees/${id}/documents/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!employee) {
    return <div className="p-8 text-center text-slate-500 font-medium">Angajatul nu a fost găsit.</div>;
  }

  const avatarSrc = employee.avatar_path ? `${window.location.protocol}//${window.location.hostname}:5001${employee.avatar_path}` : 'https://ui-avatars.com/api/?name=' + employee.first_name + '+' + employee.last_name + '&background=random';
  const idCardSrc = employee.id_card_path ? `${window.location.protocol}//${window.location.hostname}:5001${employee.id_card_path}` : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/employees" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Profil Angajat
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Dosar digital și istoric contract</p>
        </div>
      </div>
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border font-bold flex items-center justify-between ${notification.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded"><X size={16} /></button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab('details')}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Detalii & Pontaj
        </button>
        <button 
          onClick={() => setActiveTab('evaluation')}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'evaluation' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Evaluare Performanță
        </button>
        <button 
          onClick={() => setActiveTab('documents')}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'documents' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Dosar Documente
          <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">{documents.length}</span>
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coloana Stânga: Date Personale & Buletin */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 mb-4 group cursor-pointer">
                {uploadingAvatar && (
                  <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                
                {/* Hover overlay for changing avatar */}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </label>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{employee.first_name} {employee.last_name}</h2>
              <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-bold bg-primary-50 text-primary-600">
                <Briefcase size={12} className="mr-1" /> {employee.job_title || 'Fără funcție'}
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium flex items-center"><Shield size={16} className="mr-2" /> CNP</span>
                <span className="font-bold text-slate-800">{employee.cnp || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium flex items-center"><User size={16} className="mr-2" /> Serie/Nr ID</span>
                <span className="font-bold text-slate-800">{employee.id_card_series || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium flex items-center"><Calendar size={16} className="mr-2" /> Data Nașterii</span>
                <span className="font-bold text-slate-800">{employee.birth_date ? new Date(employee.birth_date).toLocaleDateString('ro-RO') : '-'}</span>
              </div>
            </div>
          </div>        </div>

        {/* Coloana Dreapta: Contract, Statistici & Istoric */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Statistici Quick (Mockup pt viitor) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
              <div className="text-slate-400 mb-1"><Activity size={18} /></div>
              <div className="text-2xl font-black text-slate-800">142h</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Ore luna curentă</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
              <div className="text-slate-400 mb-1"><Calendar size={18} /></div>
              <div className="text-2xl font-black text-slate-800">18</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Zile pontate</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
              <div className="text-blue-400 mb-1"><Shield size={18} /></div>
              <div className="text-2xl font-black text-slate-800">10</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Zile concediu ramase</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
              <div className="text-red-400 mb-1"><User size={18} /></div>
              <div className="text-2xl font-black text-slate-800">0</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Absențe nemotivate</div>
            </div>
          </div>

          {/* Date Contact */}
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
              <MapPin size={18} className="mr-2 text-primary-500" /> 
              Date de Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Telefon</span>
                <span className="text-base font-bold text-slate-800">
                  {employee.phone || 'Nespecificat'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</span>
                <span className="text-base font-bold text-slate-800">
                  {employee.email || 'Nespecificat'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Adresă (din C.I.)</span>
                <span className="text-base font-bold text-slate-800 break-words">
                  {employee.address || 'Nespecificat'}
                </span>
              </div>
            </div>
          </div>



          {/* Date Contractuale */}
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
              <Briefcase size={18} className="mr-2 text-primary-500" /> 
              Date Contractuale
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data Angajării</span>
                <span className="text-base font-bold text-slate-800">
                  {employee.contract_start_date ? new Date(employee.contract_start_date).toLocaleDateString('ro-RO') : 'Nespecificat'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Salariu</span>
                <div className="flex items-center">
                  <Banknote size={16} className="text-slate-400 mr-2" />
                  <span className="text-base font-bold text-green-600">{employee.salary || 'Nespecificat'}</span>
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Punct de Lucru</span>
                <div className="flex items-center">
                  <MapPin size={16} className="text-slate-400 mr-2" />
                  <span className="text-base font-bold text-slate-800">{employee.location_name || 'Nespecificat'}</span>
                </div>
              </div>
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notițe Contractuale</span>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {employee.contract_notes || 'Nu există notițe adiționale.'}
                </p>
              </div>
            </div>
          </div>


          {/* Timeline / Istoric */}
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center">
              <History size={18} className="mr-2 text-primary-500" /> 
              Istoric Angajat
            </h3>
            
            <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
              {history.length > 0 ? history.map((item, idx) => (
                <div key={item.id} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white bg-primary-500 shadow-sm"></div>
                  
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {item.change_type}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(item.created_at).toLocaleString('ro-RO')}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 inline-block">
                    {item.old_value && item.new_value ? (
                      <span>Schimbat din <span className="font-bold line-through text-slate-400">{item.old_value}</span> în <span className="font-bold text-slate-800">{item.new_value}</span></span>
                    ) : (
                      <span className="font-bold">{item.new_value || item.old_value || 'Actualizare înregistrată.'}</span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-sm font-bold text-slate-400">Nu există istoric înregistrat.</div>
              )}
            </div>
          </div>

        </div>
        </div>
      ) : activeTab === 'evaluation' ? (
        <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <Activity size={18} className="mr-2 text-primary-500" /> 
              Evaluare Performanță
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2 hidden sm:block">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nota Medie</span>
                <span className="text-xl font-black text-primary-600">
                  {((parseInt(evalPunctuality) + parseInt(evalAttendance) + parseInt(evalAttitude) + parseInt(evalPerformance) + parseInt(evalReliability)) / 5).toFixed(1)}
                </span>
              </div>
              <button 
                onClick={handleSaveEvaluation}
                disabled={savingEval}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center"
              >
                {savingEval ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Salvează Notele
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Punctualitate (Întârzie?)', value: evalPunctuality, setter: setEvalPunctuality },
              { label: 'Prezență (Pleacă devreme?)', value: evalAttendance, setter: setEvalAttendance },
              { label: 'Atitudine (Politicos?)', value: evalAttitude, setter: setEvalAttitude },
              { label: 'Performanță (Calitate muncă)', value: evalPerformance, setter: setEvalPerformance },
              { label: 'Seriozitate (De încredere?)', value: evalReliability, setter: setEvalReliability },
            ].map((crit, idx) => (
              <div key={idx} className="flex flex-col gap-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-bold text-slate-700">{crit.label}</label>
                  <span className="text-sm font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 min-w-[2.5rem] text-center">{crit.value}</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="10" 
                  value={crit.value} 
                  onChange={(e) => crit.setter(parseInt(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  <span>1 (Slab)</span>
                  <span>10 (Excelent)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 md:p-10 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <FileText size={22} className="mr-2 text-primary-500" /> 
                Dosar Documente ({documents.length})
              </h3>
              <p className="text-sm text-slate-500 mt-1">Gestionează contractele, actele adiționale și adeverințele.</p>
            </div>
            <div>
              <label className="cursor-pointer inline-flex items-center px-4 py-2 text-sm font-bold bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors">
                {uploadingDoc ? <Loader2 size={18} className="animate-spin mr-2" /> : <Upload size={18} className="mr-2" />}
                {uploadingDoc ? 'Se încarcă...' : 'Adaugă Document nou'}
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleDocumentUpload} disabled={uploadingDoc} />
              </label>
            </div>
          </div>

          {/* Vizualizare Buletin Atașat (CNP) */}
          <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><ImageIcon size={18} className="mr-2 text-primary-500" /> Document Identitate (CNP)</h3>
            {idCardSrc ? (
              <a href={idCardSrc} target="_blank" rel="noreferrer" className="block w-64 overflow-hidden rounded-lg border border-slate-200 hover:border-primary-400 transition-colors">
                <img src={idCardSrc} alt="ID Card" className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 max-w-sm">
                <ImageIcon size={24} className="mx-auto text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nu există atașament</span>
                <span className="text-xs text-slate-400 block mt-1">Încarcă cartea de identitate din meniul de editare angajat.</span>
              </div>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><FileText size={18} className="mr-2 text-primary-500" /> Alte documente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents.length > 0 ? documents.map((doc, index) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md transition-all group cursor-pointer" onClick={() => setLightboxIndex(index)}>
                <div className="flex items-center overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mr-4">
                    <FileText size={20} />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-slate-800 truncate">{doc.file_name}</div>
                    <div className="text-xs font-medium text-slate-400 mt-0.5">
                      {new Date(doc.uploaded_at).toLocaleDateString('ro-RO')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setLightboxIndex(index)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center p-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                <FileText size={32} className="mx-auto text-slate-300 mb-3" />
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider block">Nu există documente</span>
                <span className="text-sm text-slate-400 mt-2 block">Încarcă un contract de muncă sau alte acte pentru acest angajat.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && documents[lightboxIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 md:p-8">
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          {/* Săgeată Stânga */}
          {lightboxIndex > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          {/* Săgeată Dreapta */}
          {lightboxIndex < documents.length - 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <ArrowRight size={24} />
            </button>
          )}

          {/* Conținut Document */}
          <div className="w-full h-full max-w-5xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">{lightboxIndex + 1} / {documents.length}</span>
                <h3 className="font-bold text-slate-800 truncate max-w-xs md:max-w-md">{documents[lightboxIndex].file_name}</h3>
              </div>
              <a href={`${window.location.protocol}//${window.location.hostname}:5001${documents[lightboxIndex].file_path}`} target="_blank" rel="noreferrer" className="flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                <Download size={16} className="mr-2" /> Descarcă originalul
              </a>
            </div>
            <div className="flex-1 bg-slate-200 overflow-hidden flex justify-center items-center p-4">
               {documents[lightboxIndex].file_path.toLowerCase().endsWith('.pdf') ? (
                 <object data={`${window.location.protocol}//${window.location.hostname}:5001${documents[lightboxIndex].file_path}`} type="application/pdf" className="w-full h-full rounded-lg shadow-sm bg-white">
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full bg-white rounded-lg">
                      <FileText size={48} className="text-slate-300 mb-4" />
                      <p className="text-lg font-medium mb-4">Browserul (sau telefonul tău) nu suportă previzualizarea directă a PDF-urilor.</p>
                      <a href={`${window.location.protocol}//${window.location.hostname}:5001${documents[lightboxIndex].file_path}`} className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold shadow-sm">
                        Descarcă PDF-ul pentru a-l vizualiza
                      </a>
                    </div>
                 </object>
               ) : (
                 <img src={`${window.location.protocol}//${window.location.hostname}:5001${documents[lightboxIndex].file_path}`} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeProfile;
