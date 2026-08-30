import React, { useState, useEffect } from 'react';
import { Map, MapPin, Save, Crosshair, AlertTriangle } from 'lucide-react';

export default function GeofenceModule({ tenant, themeColor }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({ latitude: '', longitude: '', radius: '100' });
  const [saving, setSaving] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/locations`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
        if (data.length > 0) {
          handleSelect(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [tenant.id]);

  const handleSelect = (loc) => {
    setSelectedLocation(loc);
    setFormData({
      latitude: loc.latitude || '',
      longitude: loc.longitude || '',
      radius: loc.radius || '100'
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/locations/${selectedLocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedLocation,
          latitude: formData.latitude,
          longitude: formData.longitude,
          radius: formData.radius
        })
      });
      if (res.ok) {
        fetchLocations();
      } else {
        alert('Eroare la salvare');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getBrowserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData({
          ...formData,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        });
      }, () => {
        alert("Nu am putut obține locația.");
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="text-slate-400" size={24} />
            Hartă Geofence
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Setați coordonatele GPS (Lat/Lng) și raza permisă pentru scanare la fiecare punct de lucru.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Se încarcă punctele de lucru...</div>
      ) : locations.length === 0 ? (
        <div className="p-12 text-center text-slate-500">Nu există niciun punct de lucru adăugat. Adăugați unul din "Puncte de Lucru".</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List of locations */}
          <div className="col-span-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-white">Puncte de Lucru</div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {locations.map(loc => (
                <div 
                  key={loc.id} 
                  onClick={() => handleSelect(loc)}
                  className={`p-4 cursor-pointer transition-colors flex items-center gap-3 ${selectedLocation?.id === loc.id ? 'bg-slate-50 dark:bg-slate-800/80 border-l-4' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'}`}
                  style={selectedLocation?.id === loc.id ? { borderColor: themeColor } : {}}
                >
                  <MapPin size={20} className={selectedLocation?.id === loc.id ? '' : 'text-slate-400'} style={selectedLocation?.id === loc.id ? { color: themeColor } : {}} />
                  <div className="truncate">
                    <div className={`font-bold text-sm ${selectedLocation?.id === loc.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{loc.name}</div>
                    <div className="text-xs text-slate-500 truncate">{loc.address || 'Fără adresă'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          {selectedLocation && (
            <div className="col-span-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                Configurare Geofence: <span style={{ color: themeColor }}>{selectedLocation.name}</span>
              </h3>

              {!formData.latitude && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm flex items-start gap-3">
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <p>Acest punct de lucru nu are coordonate GPS setate. Angajații se vor putea ponta de oriunde scanând codul QR.</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Latitudine</label>
                    <input 
                      type="text" 
                      value={formData.latitude}
                      onChange={e => setFormData({...formData, latitude: e.target.value})}
                      placeholder="Ex: 44.4268"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Longitudine</label>
                    <input 
                      type="text" 
                      value={formData.longitude}
                      onChange={e => setFormData({...formData, longitude: e.target.value})}
                      placeholder="Ex: 26.1025"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Raza permisă (metri)</label>
                  <input 
                    type="number" 
                    value={formData.radius}
                    onChange={e => setFormData({...formData, radius: e.target.value})}
                    placeholder="Ex: 100"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none dark:text-white"
                  />
                  <p className="text-xs text-slate-500 mt-2">Distanța maximă față de coordonate la care angajatul trebuie să se afle pentru a scana QR-ul cu succes.</p>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={getBrowserLocation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-sm transition-colors"
                  >
                    <Crosshair size={18} /> Preia Locația Curentă
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 h-10 px-5 text-sm flex items-center justify-center text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Save size={18} /> {saving ? 'Se salvează...' : 'Salvează Setările'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
