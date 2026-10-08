import React, { useState } from 'react';
import { X, Users, Plus, ShieldCheck, ArrowRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function UpgradeSubscriptionModal({
  isOpen,
  onClose,
  tenant,
  currentSeats = 10,
  activeEmployees = 0,
  onSuccess
}) {
  const [seatsToAdd, setSeatsToAdd] = useState(10);
  const [customSeats, setCustomSeats] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentCount = parseInt(currentSeats, 10) || 10;
  const addition = customSeats ? (parseInt(customSeats, 10) || 0) : seatsToAdd;
  const targetSeats = currentCount + addition;
  const pricePerSeat = 9.90;
  const newMonthlyTotal = parseFloat((targetSeats * pricePerSeat).toFixed(2));
  const additionalMonthlyTotal = parseFloat((addition * pricePerSeat).toFixed(2));

  const handleSelectPreset = (amount) => {
    setCustomSeats('');
    setSeatsToAdd(amount);
  };

  const handleConfirmUpgrade = async () => {
    if (addition <= 0) {
      setError('Vă rugăm să alegeți un număr pozitiv de locuri pentru extindere.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/stripe/update-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant?.id,
          subscriptionId: tenant?.stripe_subscription_id,
          newSeats: targetSeats
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la actualizarea abonamentului Stripe');
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess(targetSeats);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Extindere Capacitate Abonament
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Adăugare Locuri Noi (Prorata Stripe)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corp Modal */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-4 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Abonament actualizat cu succes
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Capacitatea nouă este de {targetSeats} angajați.
              </p>
            </div>
          ) : (
            <>
              {/* Status curent */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Capacitate curentă contractată:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentCount} angajați</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>Angajați activi înregistrați:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeEmployees} angajați</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${activeEmployees >= currentCount ? 'bg-amber-500' : 'bg-primary-600'}`}
                    style={{ width: `${Math.min(100, (activeEmployees / (currentCount || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Selectie locuri noi */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Câte locuri doriți să adăugați?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map((amt) => {
                    const isSelected = !customSeats && seatsToAdd === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`h-11 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <Plus size={13} />
                        <span>{amt} locuri</span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative pt-1">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    placeholder="Sau introduceți alt număr..."
                    value={customSeats}
                    onChange={(e) => setCustomSeats(e.target.value)}
                    className="w-full h-10 px-4 text-xs font-semibold rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Rezumat financiar si Prorata Stripe */}
              <div className="p-4 bg-primary-50/60 dark:bg-primary-950/20 rounded-2xl border border-primary-100 dark:border-primary-900/50 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Capacitate nouă totală:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{targetSeats} angajați</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Nou tarif lunar de bază (€9.90 / angajat):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{newMonthlyTotal.toFixed(2)} € / lună</span>
                </div>
                <div className="pt-2 border-t border-primary-200/60 dark:border-primary-900/40 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Stripe debitează automat pe cardul salvat valoarea calculată proporțional (prorata) pentru cele {addition} locuri noi, doar pentru zilele rămase din luna în curs.
                </div>
              </div>

              {/* Butoane Actiune */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Anulează
                </button>
                <button
                  type="button"
                  disabled={loading || addition <= 0}
                  onClick={handleConfirmUpgrade}
                  className="flex-1 h-11 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck size={16} />
                  <span>{loading ? 'Se procesează...' : `Confirmă (+${addition} locuri)`}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
