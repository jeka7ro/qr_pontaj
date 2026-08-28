import React, { useState, useEffect, useMemo } from 'react';
import { TabletSmartphone, Plus, Edit2, Trash2, MapPin, Search, ChevronLeft, ChevronRight, X, AlertCircle, ExternalLink, Lock, Unlock, Monitor, Smartphone } from 'lucide-react';

export default function QrSelector({ tenant, themeColor }) {
  const [kiosks, setKiosks] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Table State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form State
  const [formData, setFormData] = useState({ name: '', location_id: '', kiosk_pin: '', kiosk_show_photo: true, kiosk_orientation: 'horizontal' });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tenant.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = `${window.location.protocol}//${window.location.hostname}:5001`;

      const [kRes, lRes] = await Promise.all([
        fetch(`${apiUrl}/api/tenants/${tenant.id}/kiosks`),
        fetch(`${apiUrl}/api/tenants/${tenant.id}/locations`)
      ]);

      if (!kRes.ok || !lRes.ok) throw new Error('Nu am putut încărca datele.');

      setKiosks(await kRes.json());
      setLocations(await lRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredKiosks = useMemo(() => {
    return kiosks.filter(k =>
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      (k.location_name && k.location_name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [kiosks, search]);

  const total = filteredKiosks.length;
  const totalPages = rowsPerPage === 9999 ? 1 : Math.ceil(total / rowsPerPage);
  const currentData = rowsPerPage === 9999 ? filteredKiosks : filteredKiosks.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Reset page if search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.location_id) {
      setFormError('Numele și Locația sunt obligatorii.');
      return;
    }

    try {
      const url = editingId
        ? `${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/kiosks/${editingId}`
        : `${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/kiosks`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'A apărut o eroare.');
      }

      await fetchData();
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ name: '', location_id: '', kiosk_pin: '', kiosk_show_photo: true, kiosk_orientation: 'horizontal' });
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest Kiosk?')) return;
    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:5001/api/tenants/${tenant.id}/kiosks/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Nu s-a putut șterge Kiosk-ul.');
      await fetchData();
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openKiosk = (kioskId) => {
    const url = `/kiosk/${tenant.id}/${kioskId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <TabletSmartphone className="text-primary-500" size={24} /> Tablete Kiosk
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Gestionează tabletele (Kiosk-urile) și setările lor de securitate.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => { setShowAddForm(true); setFormData({ name: '', location_id: '', kiosk_pin: '', kiosk_show_photo: true, kiosk_orientation: 'horizontal', kiosk_timer_color: '', kiosk_timer_bg_color: '', kiosk_title: 'Pontaj Digital', kiosk_subtitle: 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.', kiosk_bg_color: '', kiosk_logo_bg: '', kiosk_show_logo_bg: true, kiosk_show_timer_bg: true, kiosk_logo_size: 1, kiosk_logo_position: 'top-left' }); }}
            className="flex items-center gap-2 px-6 h-12 rounded-full text-white font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: themeColor }}
          >
            <Plus size={20} />
            Adaugă Kiosk
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold text-red-800">Eroare</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Formular Adăugare/Editare */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editingId ? 'Editare Kiosk' : 'Kiosk Nou'}</h2>
            <button
              onClick={() => { setShowAddForm(false); setEditingId(null); setFormError(null); }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            {formError && <div className="mb-4 text-sm text-red-600 font-bold bg-red-50 p-3 rounded-lg border border-red-100">{formError}</div>}

            {locations.length === 0 ? (
              <div className="text-center p-6 bg-orange-50 border border-orange-200 rounded-xl">
                <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <h3 className="font-bold text-orange-800 mb-1">Nu există Puncte de Lucru</h3>
                <p className="text-sm text-orange-700">Pentru a crea un Kiosk, trebuie mai întâi să definești cel puțin un Punct de Lucru din meniul din stânga.</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nume Kiosk *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tableta Intrare Principală"
                    className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Punct de Lucru Alocat *</label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none"
                    value={formData.location_id}
                    onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                  >
                    <option value="">-- Selectează Punctul de Lucru --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} {loc.address ? `(${loc.address})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Titlu Kiosk</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                      value={formData.kiosk_title || 'Pontaj Digital'}
                      onChange={e => setFormData({ ...formData, kiosk_title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Subtitlu Kiosk</label>
                    <textarea
                      rows="2"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 text-sm"
                      value={formData.kiosk_subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.'}
                      onChange={e => setFormData({ ...formData, kiosk_subtitle: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">PIN Securitate Kiosk (4 cifre)</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Ex: 1234 (lăsați gol pt acces liber)"
                      className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                      value={formData.kiosk_pin || ''}
                      onChange={e => setFormData({ ...formData, kiosk_pin: e.target.value.replace(/[^0-9]/g, '') })}
                    />
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.kiosk_show_photo}
                        onChange={e => setFormData({ ...formData, kiosk_show_photo: e.target.checked })}
                      />
                      <div
                        className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${!formData.kiosk_show_photo ? 'bg-slate-200' : ''}`}
                        style={formData.kiosk_show_photo ? { backgroundColor: themeColor } : {}}
                      ></div>
                      <span className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-300">Afișează pozele pe Kiosk</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Orientare Afișaj Kiosk</label>
                    <select
                      className="w-full px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none"
                      value={formData.kiosk_orientation}
                      onChange={e => setFormData({ ...formData, kiosk_orientation: e.target.value })}
                    >
                      <option value="horizontal">Orizontal (Peisaj)</option>
                      <option value="vertical">Vertical (Portret)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Culoare Timer</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.kiosk_timer_color || '#3b82f6'}
                        onChange={e => setFormData({ ...formData, kiosk_timer_color: e.target.value })}
                        className="w-12 h-12 p-1 rounded-lg border border-slate-200 bg-white cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, kiosk_timer_color: '' })}
                        className="text-xs text-slate-500 hover:text-red-500"
                      >Reset</button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Culoare Fundal Ceas</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.kiosk_show_timer_bg !== false}
                          onChange={e => setFormData({ ...formData, kiosk_show_timer_bg: e.target.checked })}
                        />
                        <div
                          className={`w-9 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${formData.kiosk_show_timer_bg === false ? 'bg-slate-200 dark:bg-slate-600' : ''}`}
                          style={formData.kiosk_show_timer_bg !== false ? { backgroundColor: themeColor } : {}}
                        ></div>
                      </label>
                    </div>
                    {formData.kiosk_show_timer_bg !== false && (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.kiosk_timer_bg_color || '#000000'}
                          onChange={e => setFormData({ ...formData, kiosk_timer_bg_color: e.target.value })}
                          className="w-12 h-12 p-1 rounded-lg border border-slate-200 bg-white cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, kiosk_timer_bg_color: '' })}
                          className="text-xs text-slate-500 hover:text-red-500"
                        >Reset</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Culoare Fundal Ecran</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.kiosk_bg_color || '#020617'}
                        onChange={e => setFormData({ ...formData, kiosk_bg_color: e.target.value })}
                        className="w-12 h-12 p-1 rounded-lg border border-slate-200 bg-white cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, kiosk_bg_color: '' })}
                        className="text-xs text-slate-500 hover:text-red-500"
                      >Reset</button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Culoare Fundal Logo</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.kiosk_show_logo_bg !== false}
                          onChange={e => setFormData({ ...formData, kiosk_show_logo_bg: e.target.checked })}
                        />
                        <div
                          className={`w-9 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${formData.kiosk_show_logo_bg === false ? 'bg-slate-200 dark:bg-slate-600' : ''}`}
                          style={formData.kiosk_show_logo_bg !== false ? { backgroundColor: themeColor } : {}}
                        ></div>
                      </label>
                    </div>
                    {formData.kiosk_show_logo_bg !== false && (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.kiosk_logo_bg || '#0f172a'}
                          onChange={e => setFormData({ ...formData, kiosk_logo_bg: e.target.value })}
                          className="w-12 h-12 p-1 rounded-lg border border-slate-200 bg-white cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, kiosk_logo_bg: '' })}
                          className="text-xs text-slate-500 hover:text-red-500"
                        >Reset</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mărime Logo ({formData.kiosk_logo_size || 1})</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={formData.kiosk_logo_size || 1}
                        onChange={e => setFormData({ ...formData, kiosk_logo_size: parseInt(e.target.value) })}
                        className="w-full accent-primary-600 cursor-pointer"
                        style={{ accentColor: themeColor }}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Poziție Logo (X / Y)</label>
                    <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                          <span>Stânga</span>
                          <span>Orizontal: {formData.kiosk_logo_x ?? 5}%</span>
                          <span>Dreapta</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={formData.kiosk_logo_x ?? 5}
                          onChange={e => setFormData({ ...formData, kiosk_logo_x: parseInt(e.target.value) })}
                          className="w-full cursor-pointer"
                          style={{ accentColor: themeColor }}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                          <span>Sus</span>
                          <span>Vertical: {formData.kiosk_logo_y ?? 5}%</span>
                          <span>Jos</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={formData.kiosk_logo_y ?? 5}
                          onChange={e => setFormData({ ...formData, kiosk_logo_y: parseInt(e.target.value) })}
                          className="w-full cursor-pointer"
                          style={{ accentColor: themeColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setEditingId(null); setFormError(null); }}
                    className="px-6 py-3 rounded-full font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full font-bold text-white shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
                    style={{ backgroundColor: themeColor }}
                  >
                    {editingId ? 'Salvează Modificările' : 'Adaugă Kiosk'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tabel Kiosk-uri */}
      {!showAddForm && (
        <>
          {/* SEARCH BAR */}
          <div className="mb-4">
            <div style={{ position: 'relative' }} className="w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input
                className="w-full h-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium"
                style={{ paddingLeft: 36, paddingRight: search ? 80 : 16, borderRadius: 9999 }}
                placeholder="Caută..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'var(--primary-600, #dc2626)', color: 'white', borderRadius: 9999, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {filteredKiosks.length} / {total}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
              <div className="font-bold text-slate-700 dark:text-white">Total: {total} înregistrări</div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                    <th style={{ width: 50, textAlign: 'center' }} className="py-3 font-bold text-xs tracking-wider text-slate-500 dark:text-slate-400">Nr.</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Kiosk</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Locație Alocată</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Setări</th>
                    <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {currentData.length > 0 ? (
                    currentData.map((kiosk, index) => (
                      <tr key={kiosk.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="text-center text-slate-500 dark:text-slate-400 text-[13px]">
                          {(page - 1) * rowsPerPage + index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <TabletSmartphone size={16} className="text-primary-500" />
                            {kiosk.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                          {kiosk.location_name ? (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} className="opacity-70" /> {kiosk.location_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Locație ștearsă</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-3">
                            {kiosk.kiosk_pin ? (
                              <Lock size={16} className="text-amber-500" title="PIN Activ" />
                            ) : (
                              <Unlock size={16} className="text-green-500" title="Fără PIN" />
                            )}
                            {kiosk.kiosk_orientation === 'vertical' ? (
                              <Smartphone size={16} className="text-slate-500 dark:text-slate-400" title="Portret" />
                            ) : (
                              <Monitor size={16} className="text-slate-500 dark:text-slate-400" title="Peisaj" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {deleteConfirmId === kiosk.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-bold text-red-600">Sigur?</span>
                              <button onClick={() => handleDelete(kiosk.id)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full hover:bg-red-700 transition-colors">Da</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full hover:bg-slate-300 transition-colors">Nu</button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openKiosk(kiosk.id)}
                                className="p-2 text-slate-500 bg-white border border-slate-200 shadow-sm hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 rounded-full transition-all"
                                title="Deschide Ecran Kiosk"
                              >
                                <ExternalLink size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(kiosk.id);
                                  setFormData({
                                    name: kiosk.name,
                                    location_id: kiosk.location_id,
                                    kiosk_pin: kiosk.kiosk_pin || '',
                                    kiosk_show_photo: kiosk.kiosk_show_photo,
                                    kiosk_orientation: kiosk.kiosk_orientation || 'horizontal',
                                    kiosk_timer_color: kiosk.kiosk_timer_color || '',
                                    kiosk_timer_bg_color: kiosk.kiosk_timer_bg_color || '',
                                    kiosk_title: kiosk.kiosk_title || 'Pontaj Digital',
                                    kiosk_subtitle: kiosk.kiosk_subtitle || 'Deschide camera telefonului și scanează codul QR pentru a înregistra ora de venire sau plecare.',
                                    kiosk_bg_color: kiosk.kiosk_bg_color || '',
                                    kiosk_logo_bg: kiosk.kiosk_logo_bg || '',
                                    kiosk_show_logo_bg: kiosk.kiosk_show_logo_bg !== false,
                                    kiosk_show_timer_bg: kiosk.kiosk_show_timer_bg !== false,
                                    kiosk_logo_size: kiosk.kiosk_logo_size || 1,
                                    kiosk_logo_position: kiosk.kiosk_logo_position || 'top-left',
                                    kiosk_logo_x: kiosk.kiosk_logo_x ?? 5,
                                    kiosk_logo_y: kiosk.kiosk_logo_y ?? 5
                                  });
                                  setShowAddForm(true);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-2 text-slate-500 bg-white border border-slate-200 shadow-sm hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 rounded-full transition-all"
                                title="Editează"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(kiosk.id)}
                                className="p-2 text-slate-500 bg-white border border-slate-200 shadow-sm hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-full transition-all"
                                title="Șterge"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                        <TabletSmartphone className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="font-medium">Nu am găsit niciun Kiosk.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER PAGINARE */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
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
                <span className="whitespace-nowrap text-[13px] text-slate-500 dark:text-slate-400 font-bold mr-2">Pagina {page} din {totalPages || 1}</span>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} /></button>
                <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
