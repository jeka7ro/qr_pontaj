import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, MapPin, Briefcase, Calendar, Clock, Banknote, Shield, History, Activity, Image as ImageIcon } from 'lucide-react';

const EmployeeProfile = ({ tenant, themeColor }) => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const [empRes, histRes] = await Promise.all([
        fetch(`http://localhost:5001/api/tenants/${tenant.id}/employees/${id}`),
        fetch(`http://localhost:5001/api/tenants/${tenant.id}/employees/${id}/history`)
      ]);
      
      if (empRes.ok) setEmployee(await empRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!employee) {
    return <div className="p-8 text-center text-slate-500 font-medium">Angajatul nu a fost găsit.</div>;
  }

  const avatarSrc = employee.avatar_path ? `http://localhost:5001${employee.avatar_path}` : 'https://ui-avatars.com/api/?name=' + employee.first_name + '+' + employee.last_name + '&background=random';
  const idCardSrc = employee.id_card_path ? `http://localhost:5001${employee.id_card_path}` : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/tenant/employees" className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Profil Angajat
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Dosar digital și istoric contract</p>
        </div>
      </div>

      {/* Grid Asimetric */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coloana Stânga: Date Personale & Buletin */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 relative mb-4">
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
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
          </div>

          {/* Vizualizare Buletin Atașat */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><ImageIcon size={18} className="mr-2 text-primary-500" /> Document Identitate</h3>
            {idCardSrc ? (
              <a href={idCardSrc} target="_blank" rel="noreferrer" className="block w-full overflow-hidden rounded-xl border border-slate-200 hover:border-primary-400 transition-colors">
                <img src={idCardSrc} alt="ID Card" className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity" />
              </a>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <ImageIcon size={24} className="mx-auto text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nu există atașament</span>
              </div>
            )}
          </div>
        </div>

        {/* Coloana Dreapta: Contract, Statistici & Istoric */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Statistici Quick (Mockup pt viitor) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="text-slate-400 mb-1"><Activity size={18} /></div>
              <div className="text-2xl font-black text-slate-800">142h</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Ore luna curentă</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="text-slate-400 mb-1"><Calendar size={18} /></div>
              <div className="text-2xl font-black text-slate-800">18</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Zile pontate</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="text-blue-400 mb-1"><Shield size={18} /></div>
              <div className="text-2xl font-black text-slate-800">10</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Zile concediu ramase</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="text-red-400 mb-1"><User size={18} /></div>
              <div className="text-2xl font-black text-slate-800">0</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Absențe nemotivate</div>
            </div>
          </div>

          {/* Date Contractuale */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
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
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notițe Contractuale</span>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {employee.contract_notes || 'Nu există notițe adiționale.'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline / Istoric */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
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
                  <div className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 inline-block">
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
    </div>
  );
};

export default EmployeeProfile;
