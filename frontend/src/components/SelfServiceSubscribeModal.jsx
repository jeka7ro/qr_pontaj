import React, { useState } from 'react';
import { X, Check, CreditCard, ShieldCheck, Users, Building, Mail, User, Sparkles, ArrowRight } from 'lucide-react';

export default function SelfServiceSubscribeModal({ isOpen, onClose, initialTenant = null }) {
  const [seats, setSeats] = useState(15);
  const [companyName, setCompanyName] = useState(initialTenant?.name || '');
  const [subdomain, setSubdomain] = useState(initialTenant?.subdomain || '');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [countryCode, setCountryCode] = useState(initialTenant?.country_code || 'BE');
  const [vatNumber, setVatNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (initialTenant) {
      if (initialTenant.name) setCompanyName(initialTenant.name);
      if (initialTenant.subdomain) setSubdomain(initialTenant.subdomain);
      if (initialTenant.country_code) setCountryCode(initialTenant.country_code);
    }
  }, [initialTenant]);

  if (!isOpen) return null;

  const pricePerSeat = 9.90;
  const totalEur = parseFloat((seats * pricePerSeat).toFixed(2));
  const tvaEur = parseFloat((totalEur * 0.21).toFixed(2));
  const totalWithTvaEur = parseFloat((totalEur + tvaEur).toFixed(2));

  const handleCompanyNameChange = (val) => {
    setCompanyName(val);
    if (!subdomain || subdomain === companyName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25));
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Vă rugăm să introduceți denumirea companiei.');
      return;
    }
    if (!adminEmail.trim()) {
      setError('Vă rugăm să introduceți adresa de email a administratorului.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          subdomain: (subdomain.trim() || companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')),
          adminEmail: adminEmail.trim(),
          adminName: adminName.trim() || companyName.trim(),
          vatNumber: vatNumber.trim(),
          billingAddress: billingAddress.trim(),
          seats: Math.max(1, parseInt(seats, 10)),
          countryCode: countryCode || 'BE',
          successUrl: `${window.location.origin}/admin/login?subscribed=true`,
          cancelUrl: `${window.location.origin}/`
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la crearea sesiunii Stripe Checkout');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Nu s-a putut obține adresa de plată Stripe.');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Configurator Abonament Recurent
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              TimeQR — Comandă Online & Plată Securizată
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corp Formular */}
        <form onSubmit={handleCheckout} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {/* Calculator Locuri (Seats) */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-primary-600" />
                  Număr de angajați contractați:
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Poți mări oricând numărul pe parcurs cu calcul prorata automat
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={seats}
                  onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-3 py-1.5 text-center text-base font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <span className="text-xs font-bold text-slate-500">locuri</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1"
              max="150"
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value, 10))}
              className="w-full accent-primary-600 cursor-pointer"
            />

            {/* Sume calculate */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between text-xs gap-3">
              <span className="text-slate-600 dark:text-slate-400">
                Tarif: <strong className="text-slate-900 dark:text-white">€{pricePerSeat.toFixed(2)}</strong> / angajat / lună
              </span>
              <div className="text-right">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  €{totalEur.toFixed(2)} <span className="text-xs font-semibold text-slate-500">/ lună</span>
                </span>
                <span className="block text-[11px] text-slate-400">
                  {countryCode === 'RO'
                    ? `(cu TVA 21%: €${totalWithTvaEur.toFixed(2)})`
                    : `(TVA 0% • Taxare Inversă B2B)`}
                </span>
              </div>
            </div>
          </div>

          {/* Date Companie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Nume Companie *
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500">
                <Building size={16} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="ex: Brasserie Bruxelles SPRL"
                  value={companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  className="w-full text-sm bg-transparent dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Țară de Înregistrare
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary-500"
              >
                <option value="BE">Belgia (BE) — Europe/Brussels (EUR)</option>
                <option value="FR">Franța (FR) — Europe/Paris (EUR)</option>
                <option value="NL">Olanda (NL) — Europe/Amsterdam (EUR)</option>
                <option value="DE">Germania (DE) — Europe/Berlin (EUR)</option>
                <option value="LU">Luxemburg (LU) — Europe/Luxembourg (EUR)</option>
                <option value="RO">România (RO) — Europe/Bucharest (EUR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Email Administrator (pentru facturi Stripe) *
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500">
                <Mail size={16} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="admin@companie.be"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-sm bg-transparent dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Nume Administrator
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500">
                <User size={16} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="ex: Jean Dupont"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full text-sm bg-transparent dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cod TVA & Adresa Facturare Sediu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Cod TVA / VAT ID {countryCode !== 'RO' && '* (B2B)'}
                </label>
                {countryCode !== 'RO' && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    Reverse Charge 0%
                  </span>
                )}
              </div>
              <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500">
                <ShieldCheck size={16} className="text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder={countryCode === 'BE' ? 'BE 0123.456.789' : 'Cod Fiscal / TVA'}
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value.toUpperCase())}
                  className="w-full text-sm font-semibold bg-transparent dark:text-white outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {countryCode !== 'RO' 
                  ? 'Firmele din UE înregistrate în VIES beneficiază de 0% TVA (Taxare inversă).' 
                  : 'Pentru România se aplică cota standard de 21% TVA.'}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Adresă Sediu Social / Facturare
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary-500">
                <input
                  type="text"
                  placeholder="ex: Rue de la Loi 16, 1000 Bruxelles"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full text-sm bg-transparent dark:text-white outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Adresa fiscală a sediului ce va fi inclusă pe factură.
              </span>
            </div>
          </div>

          {/* Subdomeniu alocat */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
              Adresă Portal Dedicat Kiosk
            </label>
            <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="w-full text-sm font-semibold bg-transparent dark:text-white outline-none"
                placeholder="subdomeniu"
              />
              <span className="text-xs font-bold text-slate-400 shrink-0 select-none">.pontaj.app</span>
            </div>
          </div>

          {/* Avantaje incluse */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              Ce include abonamentul Stripe:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-emerald-800 dark:text-emerald-400">
              <span>• Conformitate completă normele 2027</span>
              <span>• Calcul prorata automat la adăugare angajați</span>
              <span>• Portal client Stripe pentru facturi fiscale</span>
              <span>• Backup automat al bazei de date de 2x/zi</span>
            </div>
          </div>

          {/* Buton Plata */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm rounded-full shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Plătește Securizat cu Stripe (€{totalEur.toFixed(2)}/lună)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Plată securizată prin Stripe Inc. Poți anula sau modifica abonamentul în orice moment.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
