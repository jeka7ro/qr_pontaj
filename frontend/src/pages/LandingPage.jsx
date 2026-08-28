import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Clock, MapPin, ShieldCheck, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600">
            <QrCode size={32} strokeWidth={2.5} />
            <span className="text-2xl font-black tracking-tight text-slate-900">QR Pontaj</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/login" 
              className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Autentificare
            </Link>
            <Link 
              to="/admin/login" 
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-full shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
            >
              Contul meu <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 sm:pt-40 sm:pb-24 lg:pb-32 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
            Viitorul pontajului este <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-400">Digital și Simplu.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed">
            Renunță la foile de prezență prăfuite. QR Pontaj îți permite să îți pontezi angajații rapid, cu un simplu scan pe tabletă, monitorizând locația și timpul în timp real.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/admin/login" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-bold rounded-full shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Intră în Panoul de Control
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Clock size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Timp Real</h3>
            <p className="text-slate-600 leading-relaxed">
              Vezi exact când ajung și când pleacă angajații tăi, totul sincronizat instant în panoul tău de administrator.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <MapPin size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Securitate GPS</h3>
            <p className="text-slate-600 leading-relaxed">
              Te asiguri că scanarea are loc doar la locația stabilită. Fiecare pontare este verificată prin coordonate GPS.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Protecție Anti-Fraudă</h3>
            <p className="text-slate-600 leading-relaxed">
              Codurile QR dinamice se reîmprospătează constant. Angajații nu pot face poze la cod pentru a se ponta de acasă.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} QR Pontaj. Toate drepturile rezervate.</p>
      </footer>
    </div>
  );
}
