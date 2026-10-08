import React, { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, Clock, Search, ChevronLeft, ChevronRight, AlertCircle, ExternalLink, PlusCircle, ShieldCheck, ArrowRight, X } from 'lucide-react';
import SelfServiceSubscribeModal from '../../../components/SelfServiceSubscribeModal';
import UpgradeSubscriptionModal from '../../../components/UpgradeSubscriptionModal';

export default function BillingModule({ tenant, themeColor }) {
  const [invoices, setInvoices] = useState([]);
  const [plan, setPlan] = useState(null);
  const [stripeSub, setStripeSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Stripe Modal States
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [seatsToAdd, setSeatsToAdd] = useState(5);
  const [updatingSeats, setUpdatingSeats] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Pagination & Search State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchStripeStatus = async () => {
    try {
      const res = await fetch(`/api/stripe/subscription/${tenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setStripeSub(data);
      }
    } catch (err) {
      console.error('Eroare status Stripe:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planRes, invRes] = await Promise.all([
        fetch(`/api/tenants/${tenant.id}/billing/plan`),
        fetch(`/api/tenants/${tenant.id}/billing/invoices`)
      ]);
      if (planRes.ok) setPlan(await planRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
      await fetchStripeStatus();
    } catch (err) {
      console.error(err);
      setErrorMsg('A apărut o eroare la încărcarea datelor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenant.id]);

  const handleOpenStripePortal = async () => {
    try {
      setOpeningPortal(true);
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          returnUrl: window.location.href
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la deschiderea portalului');
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleUpgradeSeatsConfirm = async () => {
    if (!stripeSub?.stripe_subscription_id) return;
    try {
      setUpdatingSeats(true);
      const currentSeats = stripeSub.subscription_seats || 10;
      const targetSeats = currentSeats + parseInt(seatsToAdd, 10);

      const res = await fetch('/api/stripe/update-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          subscriptionId: stripeSub.stripe_subscription_id,
          newSeats: targetSeats
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la actualizarea locurilor');
      }

      setActionSuccess(`Abonamentul a fost extins cu succes la ${targetSeats} angajați.`);
      setShowUpgradeModal(false);
      await fetchData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingSeats(false);
    }
  };

  // Filtering & Pagination Logic
  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true;
    const s = search.toLowerCase();
    const invId = inv.id.toString().padStart(4, '0');
    return invId.includes(s) || inv.status?.toLowerCase().includes(s) || inv.amount?.toString().includes(s);
  });

  const total = filteredInvoices.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [total, rowsPerPage, page, safePage]);

  const currentRows = filteredInvoices.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="text-primary-600" size={24} />
            Abonament & Facturi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gestionează planul curent și descarcă facturile fiscale.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">{errorMsg}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 rounded-2xl flex items-start gap-3">
          <CheckCircle className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{actionSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Plan Summary Column */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative self-start">
          <div className="h-1.5 w-full bg-primary-600"></div>
          <div className="p-6">
            <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs mb-4 uppercase tracking-wider">Planul tău curent</h3>
            {loading ? (
              <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
            ) : plan ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{plan.plan_name}</div>
                  {plan.billing_type === 'per_employee' && (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Per Angajat
                    </span>
                  )}
                </div>

                {plan.billing_type === 'per_employee' ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{plan.price_per_employee.toFixed(2)} €</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ angajat / lună</span>
                    </div>

                    <div className="space-y-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Angajați activi:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{plan.active_employees}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span>• Cotă întreagă (≥ 15 zile):</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{plan.full_rate_count}</span>
                      </div>
                      {plan.half_rate_count > 0 && (
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span>• Cotă redusă (&lt; 15 zile, 50%):</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{plan.half_rate_count}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Cost estimat:</span>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{plan.estimated_eur.toFixed(2)} €</div>
                          {plan.is_romania ? (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">~{plan.estimated_ron ? plan.estimated_ron.toFixed(2) : '-'} RON + TVA (21%)</div>
                          ) : (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">B2B Reverse Charge (0% TVA)</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Data următoarei facturi:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(plan.renewal_date).toLocaleDateString('ro-RO')}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-2">
                        Factura se emite automat pe baza angajaților activi înregistrați.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-end gap-1 mb-6">
                      <span className="text-xl font-bold text-slate-800 dark:text-white">{plan.price}</span>
                      <span className="text-xs font-semibold text-slate-500 pb-1">{plan.currency} / lună</span>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Următoarea plată</span>
                        <span className="font-bold text-slate-900 dark:text-white">{new Date(plan.renewal_date).toLocaleDateString('ro-RO')}</span>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Plan nedisponibil.</p>
            )}

            {/* Secțiune Stripe Subscription & Portal */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              {stripeSub?.stripe_subscription_id ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Abonament Stripe</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      ACTIV
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500 dark:text-slate-400">Locuri contractate:</span>
                      <strong className="text-slate-900 dark:text-white">{stripeSub.subscription_seats} angajați</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Locuri ocupate:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{stripeSub.active_employees} din {stripeSub.subscription_seats}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stripeSub.active_employees >= stripeSub.subscription_seats ? 'bg-amber-500' : 'bg-primary-600'}`}
                        style={{ width: `${Math.min(100, (stripeSub.active_employees / (stripeSub.subscription_seats || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="w-full h-9 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle size={14} />
                      <span>Mărește Locuri (Prorata)</span>
                    </button>

                    <button
                      type="button"
                      disabled={openingPortal}
                      onClick={handleOpenStripePortal}
                      className="w-full h-9 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink size={14} />
                      <span>{openingPortal ? 'Se deschide...' : 'Portal Stripe (Card & Facturi)'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Activează plata recurentă cu cardul prin Stripe (€9.90 / angajat).
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSubscribeModal(true)}
                    className="w-full h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard size={16} />
                    <span>Activează Abonament Stripe</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Table Container */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          
          {/* Search Bar Top */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white mr-4 whitespace-nowrap">Istoric Facturi</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className="w-full h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all pl-10 pr-20 shadow-sm"
                placeholder="Caută facturi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                  {total} din {invoices.length}
                </div>
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 text-center">Nr.</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Factură</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scadență</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Valoare</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-24">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan="6" className="py-8 text-center text-slate-400 font-medium">Se încarcă facturile...</td></tr>
                ) : currentRows.length === 0 ? (
                  <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-900/50">Nu există facturi emise încă.</td></tr>
                ) : (
                  currentRows.map((invoice, index) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                        {(safePage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-sm">
                        INV-{invoice.id.toString().padStart(4, '0')}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {new Date(invoice.due_date).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white text-right">
                        {invoice.amount} RON
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          {invoice.status === 'PAID' ? (
                            <>
                              <CheckCircle size={14} className="text-slate-400" />
                              Achitată
                            </>
                          ) : (
                            <>
                              <Clock size={14} className="text-slate-400" />
                              Neplătită
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors inline-flex items-center justify-center">
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Paginare */}
          <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
            <div className="flex flex-wrap items-center justify-between sm:justify-start w-full sm:w-auto gap-3 sm:gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span style={{ whiteSpace: 'nowrap' }} className="flex items-center gap-2">
                Afișează
                <select 
                  value={rowsPerPage} 
                  onChange={e => setRowsPerPage(Number(e.target.value))} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary-500 transition-shadow rounded-full px-2 py-0.5"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={9999}>Toți</option>
                </select>
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>Total: <strong className="text-slate-700 dark:text-white">{total}</strong></span>
            </div>
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span style={{ whiteSpace: 'nowrap' }}>Pagina {page} din {totalPages || 1}</span>
              <button 
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                onClick={() => setPage(p => p - 1)} 
                disabled={page === 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                onClick={() => setPage(p => p + 1)} 
                disabled={page === totalPages}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Abonare Noua Stripe */}
      <SelfServiceSubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        initialTenant={tenant}
      />

      {/* Modal Marire Locuri Prorata Stripe */}
      <UpgradeSubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tenant={tenant}
        currentSeats={stripeSub?.subscription_seats || 10}
        activeEmployees={stripeSub?.active_employees || 0}
        onSuccess={async (newSeats) => {
          setActionSuccess(`Abonamentul a fost extins cu succes la ${newSeats} angajați.`);
          await fetchData();
          setTimeout(() => setActionSuccess(null), 4000);
        }}
      />
    </div>
  );
}
