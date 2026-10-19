import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Download, 
  Users, 
  FileSpreadsheet, 
  Plus, 
  Copy, 
  Check, 
  Coins, 
  Clock, 
  Search, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AccountantPortal() {
  const [partner, setPartner] = useState(() => {
    const saved = localStorage.getItem('accountant_partner');
    return saved ? JSON.parse(saved) : null;
  });

  // Date formular înregistrare
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCui, setRegCui] = useState('');
  const [regCity, setRegCity] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);

  // Date clienți
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalClients: 0, totalEmployees: 0, totalCommissionEur: 0 });
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal adăugare firmă
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clientCui, setClientCui] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [lookingUpAnaf, setLookingUpAnaf] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');

  useEffect(() => {
    if (partner?.id) {
      fetchClients(partner.id);
    }
  }, [partner?.id]);

  const fetchClients = async (partnerId) => {
    setLoadingClients(true);
    try {
      const res = await fetch(`${baseUrl}/api/accountants/${partnerId}/clients`);
      const data = await res.json();
      if (data.success) {
        setClients(data.clients || []);
        setStats(data.stats || { totalClients: 0, totalEmployees: 0, totalCommissionEur: 0 });
      }
    } catch (err) {
      console.error('Eroare fetch clienți:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail) return;
    setLoadingReg(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${baseUrl}/api/accountants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          cui: regCui,
          city: regCity
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la înregistrare');
      }

      setPartner(data.partner);
      localStorage.setItem('accountant_partner', JSON.stringify(data.partner));
      fetchClients(data.partner.id);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingReg(false);
    }
  };

  const handleCuiLookup = async () => {
    const clean = clientCui.replace(/[^0-9]/g, '');
    if (!clean) return;
    setLookingUpAnaf(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${baseUrl}/api/company/lookup?cui=${clean}`);
      const data = await res.json();
      if (data.success && data.company) {
        setClientName(data.company.name || '');
        if (data.company.phone) setClientPhone(data.company.phone);
      }
    } catch (err) {
      console.warn('Eroare lookup ANAF:', err);
    } finally {
      setLookingUpAnaf(false);
    }
  };

  const handleAddClientSubmit = async (e) => {
    e.preventDefault();
    if (!clientName && !clientCui) return;
    setSavingClient(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${baseUrl}/api/accountants/${partner.id}/link-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cui: clientCui,
          name: clientName,
          email: clientEmail,
          phone: clientPhone
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Eroare la asociere');
      }

      setIsAddModalOpen(false);
      setClientCui('');
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      fetchClients(partner.id);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingClient(false);
    }
  };

  const handleDownloadSaga = (tenantId, type = 'summary') => {
    const filename = type === 'summary' 
      ? `saga_centralizator_${selectedMonth}_${selectedYear}.csv`
      : `saga_evenimente_${selectedMonth}_${selectedYear}.csv`;
    const url = `${baseUrl}/api/tenants/${tenantId}/saga/export?month=${selectedMonth}&year=${selectedYear}&type=${type}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const copyReferralLink = () => {
    if (!partner?.referral_code) return;
    const link = `${window.location.origin}/?ref=${partner.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Dacă nu este conectat un partener, afișăm Landing & Formular de Înrolare
  if (!partner) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <Sparkles size={14} />
              Program Oficial Parteneri Contabili & Experți CECCAR
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Scapă definitiv de condicile pe hârtie ale clienților tăi
            </h1>
            <p className="max-w-2xl mx-auto text-base text-slate-600 dark:text-slate-300">
              Clienții tăi își pontează salariații în 1 secundă pe tabletă sau smartphone conform Art. 119 ITM, iar tu descarci exportul complet gata structurat pentru <strong>SAGA Salarii</strong> la 1-Click.
            </p>
          </div>

          {/* 3 Beneficii Cheie */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Export 1-Click în SAGA C</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Descarci pontajul brut și centralizatorul lunar cu ore de noapte, weekend și suplimentare deja calculate automat.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">100% Conformitate Art. 119</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Fără amenzi ITM pentru clienții tăi: evidența orelor de intrare/ieșire se ține la minut cu validare de locație.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Coins size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">20% Comision Recurent</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Primești lunar 20% din valoarea abonamentului pentru fiecare client activ pe care îl conectezi la platformă.
              </p>
            </div>
          </div>

          {/* Formular Înscriere */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md p-6 sm:p-8 max-w-xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Activează Contul Tău Gratuit de Contabil
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Fără card bancar, fără costuri de activare. Acces instant la panoul de descărcare SAGA.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Nume Cabinet / Nume Expert Contabil *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ex: Expert Conta Audit SRL sau Ioana Popescu"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Email Profesional *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contact@cabinet-conta.ro"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Telefon Mobil
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="07xxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    CUI Cabinet / Firmă (opțional)
                  </label>
                  <input
                    type="text"
                    value={regCui}
                    onChange={(e) => setRegCui(e.target.value)}
                    placeholder="Ex: 12345678"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Oraș
                  </label>
                  <input
                    type="text"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    placeholder="Ex: București, Cluj, etc."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingReg}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loadingReg ? 'Se activează contul...' : 'Activează Contul Gratuit & Deschide Portalul'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // Dashboard-ul activ al Partenerului Contabil
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Partener */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {partner.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap shrink-0">
                Partener Oficial SAGA
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Portal Contabilitate &bull; Cod Partener: <strong className="text-slate-700 dark:text-slate-200">{partner.referral_code}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Link Copiat!' : 'Copiază Link Invitație'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>Asociază Firmă Client</span>
            </button>
          </div>
        </div>

        {/* Metrici Rapide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Firme Conectate</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalClients}</div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Users size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Salariați Pontați</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalEmployees}</div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Coins size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Comision Estimativ / Lună</div>
              <div className="text-2xl font-black text-emerald-600">{stats.totalCommissionEur.toFixed(2)} €</div>
            </div>
          </div>
        </div>

        {/* Panou Filtrare Lună și Listă Firme */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-500" size={18} />
                Export SAGA Salarii per Client
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Alege luna de pontaj și descarcă centralizatorul sau fișierul de import pentru softul de salarii.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="1">01 - Ianuarie</option>
                <option value="2">02 - Februarie</option>
                <option value="3">03 - Martie</option>
                <option value="4">04 - Aprilie</option>
                <option value="5">05 - Mai</option>
                <option value="6">06 - Iunie</option>
                <option value="7">07 - Iulie</option>
                <option value="8">08 - August</option>
                <option value="9">09 - Septembrie</option>
                <option value="10">10 - Octombrie</option>
                <option value="11">11 - Noiembrie</option>
                <option value="12">12 - Decembrie</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-9 px-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                {[0, 1].map(offset => {
                  const y = new Date().getFullYear() - offset;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Tabel Clienți */}
          {clients.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Building2 className="mx-auto text-slate-300 dark:text-slate-600" size={40} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nu ai nicio firmă client asociată încă
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Apasă butonul de mai sus pentru a adăuga o firmă client sau trimite-le linkul tău unic de recomandare.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Companie</th>
                    <th className="py-3 px-3">CUI</th>
                    <th className="py-3 px-3">Salariați</th>
                    <th className="py-3 px-3">Comision Tău (20%)</th>
                    <th className="py-3 px-3 text-right">Descărcare SAGA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <strong className="font-bold text-slate-900 dark:text-white block text-sm">{client.name}</strong>
                        <span className="text-[11px] text-slate-400">{client.subdomain}.qr.pontaj.app</span>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-600 dark:text-slate-300">
                        {client.cui || 'Fără CUI'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                          {client.employee_count} angajați
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-emerald-600">
                        {client.commission_eur.toFixed(2)} € / lună
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadSaga(client.id, 'events')}
                            title="Exportă pontaj electronic detaliat (ceas de pontaj)"
                            className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Download size={13} />
                            <span>Evenimente SAGA</span>
                          </button>

                          <button
                            onClick={() => handleDownloadSaga(client.id, 'summary')}
                            title="Exportă centralizator lunar salarii cu ore noapte/weekend/suplimentare"
                            className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <FileSpreadsheet size={13} />
                            <span>Centralizator SAGA</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ghid de Import SAGA C */}
        <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed space-y-2">
          <div className="font-bold flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
            <AlertCircle size={16} />
            Cum se importă în SAGA C:
          </div>
          <p>
            1. <strong>Pentru Pontaj Electronic:</strong> Deschideți SAGA C &rarr; meniul <em>Diverse</em> &rarr; <em>Import date din fișiere</em> (sau <em>Import pontaj din aparate</em>) și alegeți fișierul descărcat.
          </p>
          <p>
            2. <strong>Pentru Centralizator Lunar:</strong> Orele normale, de noapte (conform Art. 125 Codul Muncii), orele de weekend și orele suplimentare sunt deja calculate matematic conform normei de lucru a fiecărui salariat și pot fi trecute direct în modulul <em>State de salarii</em>.
          </p>
        </div>

      </div>

      {/* Modal Adaugă Firmă Client */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Asociază Firmă Client
            </h3>
            <p className="text-xs text-slate-500">
              Introdu CUI-ul clientului pentru auto-completare din registrul ANAF.
            </p>

            <form onSubmit={handleAddClientSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">CUI Firmă</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientCui}
                    onChange={(e) => setClientCui(e.target.value)}
                    placeholder="Ex: 42322117"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCuiLookup}
                    disabled={lookingUpAnaf}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {lookingUpAnaf ? 'Caută...' : 'Auto ANAF'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Denumire Firmă *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Bistro Central SRL"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Administrator / Manager</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="manager@bistrocentral.ro"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingClient ? 'Se asociază...' : 'Salvează și Conectează'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
