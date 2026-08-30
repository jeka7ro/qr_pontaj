import React, { useState, useRef } from 'react';
import { X, Camera, Upload } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    nume: user?.nume || '',
    prenume: user?.prenume || '',
    email: user?.email || '',
    parola: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        ...user,
        nume: formData.nume,
        prenume: formData.prenume,
        email: formData.email,
        avatar: avatarPreview
      });
    }
    onClose();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 overflow-hidden mx-4 md:mx-0">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white dark:text-white">Editare Profil</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div 
              onClick={handleAvatarClick}
              className="relative w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 dark:bg-slate-700 transition-colors group overflow-hidden"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400 group-hover:text-slate-500 dark:text-slate-400">
                  <Camera size={24} className="mx-auto" />
                </div>
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={20} className="text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Modifică Avatar
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nume</label>
              <input 
                type="text" 
                name="nume"
                value={formData.nume}
                onChange={handleChange}
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Prenume</label>
              <input 
                type="text" 
                name="prenume"
                value={formData.prenume}
                onChange={handleChange}
                className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Adresă Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Parolă Nouă (Opțional)</label>
            <input 
              type="password" 
              name="parola"
              value={formData.parola}
              onChange={handleChange}
              placeholder="Lasă gol pentru a păstra parola actuală"
              className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none transition-all shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700/50">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2.5 text-sm rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors"
            >
              Anulează
            </button>
            <button 
              type="submit"
              className="px-4 py-2.5 text-sm rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all"
            >
              Salvează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
