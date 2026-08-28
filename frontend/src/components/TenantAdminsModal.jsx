import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Info, Mail, Lock, Plus } from 'lucide-react';

export default function TenantAdminsModal({ isOpen, onClose, tenant }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resettingAdminId, setResettingAdminId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen && tenant?.id) {
      fetchAdmins();
    }
  }, [isOpen, tenant]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/admins`);
      if (!res.ok) throw new Error('Eroare la preluarea adminilor locali.');
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdmin.email, password: newAdmin.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'A apărut o eroare.');
      
      // Reset form and add new admin to list
      setAdmins([...admins, data]);
      setShowAddForm(false);
      setNewAdmin({ email: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (adminId) => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }

    setIsResetting(true);
    setError(null);
    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/admins/${adminId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'A apărut o eroare la resetarea parolei.');
      
      setResettingAdminId(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Mimicking the Figma design */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.nume} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ backgroundColor: tenant.culoare || '#f8fafc' }}
              >
                {tenant.nume.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{tenant.nume}</h2>
              <p className="text-sm text-slate-500 font-medium leading-tight">Admini locali</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} /> ADMINI CONFIGURAȚI
            </h3>
            {!showAddForm && (
              <button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-sm transition-all"
              >
                <UserPlus size={16} /> Adaugă Admin
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          {/* Add Admin Sub-form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="mb-6 bg-white p-5 rounded-2xl border border-primary-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4">Adaugă Administrator Nou</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Adresă Email *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email" 
                      value={newAdmin.email}
                      onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                      required
                      className="w-full pl-10 pr-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm"
                      placeholder="admin@companie.ro"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Parolă de acces *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="password" 
                      value={newAdmin.password}
                      onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                      required
                      className="w-full pl-10 pr-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-primary-500 bg-white outline-none transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowAddForm(false); setError(null); }}
                    className="px-4 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-colors"
                  >
                    Anulează
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    <Plus size={14} /> Salvează
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List or Empty State */}
          {loading ? (
            <div className="text-center py-10 text-slate-400 font-medium">Se încarcă...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users size={28} className="text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Niciun admin local</h3>
              <p className="text-sm text-slate-500 mb-8">Adaugă primul administrator pentru această companie.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {admins.map(admin => (
                <div key={admin.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {admin.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{admin.email}</div>
                        <div className="text-xs text-slate-400">Adăugat pe {new Date(admin.created_at).toLocaleDateString('ro-RO')}</div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setResettingAdminId(admin.id);
                          setNewPassword('');
                          setConfirmPassword('');
                          setError(null);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 hover:bg-orange-50 hover:text-orange-600 text-slate-500 transition-colors"
                        title="Resetează parola"
                      >
                        <Lock size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Reset Password Form */}
                  {resettingAdminId === admin.id && (
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Noua parolă..."
                          className="flex-1 h-8 px-3 text-sm rounded-md border border-slate-200 focus:outline-none focus:border-orange-300"
                        />
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Confirmă parola..."
                          className="flex-1 h-8 px-3 text-sm rounded-md border border-slate-200 focus:outline-none focus:border-orange-300"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setResettingAdminId(null);
                            setError(null);
                          }}
                          className="px-3 h-8 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-2xl"
                        >
                          Anulează
                        </button>
                        <button 
                          onClick={() => handleResetPassword(admin.id)}
                          disabled={!newPassword || !confirmPassword || isResetting}
                          className="px-3 h-8 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-md disabled:opacity-50"
                        >
                          {isResetting ? 'Se salvează...' : 'Salvează'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-2xl flex gap-3 mt-4">
            <div className="text-blue-500 mt-0.5 shrink-0">
              <Info size={16} />
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>Notă:</strong> Adminii locali pot gestiona <strong>doar</strong> datele companiei lor (platforma-centrala.pontaj.app). Nu au acces la alte companii și nu pot vedea acest panou SaaS.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
