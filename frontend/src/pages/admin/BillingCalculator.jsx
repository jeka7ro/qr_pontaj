import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calculator, 
  Users, 
  RotateCw, 
  Copy, 
  Check, 
  Eye, 
  X, 
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Download,
  Calendar,
  Globe
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import * as XLSX from 'xlsx';

export default function BillingCalculator() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [exchangeRate, setExchangeRate] = useState('');
  const [bnrDateInfo, setBnrDateInfo] = useState(null);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal Borderou State
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilter, setModalFilter] = useState('ALL'); // ALL, HALF, FULL
  const [modalPage, setModalPage] = useState(1);
  const [modalRowsPerPage, setModalRowsPerPage] = useState(10);

  // Modal Editare Tarif State
  const [editingTariffTenant, setEditingTariffTenant] = useState(null);
  const [newTariffValue, setNewTariffValue] = useState('');
  const [savingTariff, setSavingTariff] = useState(false);

  // Modal Dezactivare/Ștergere Tarifare State
  const [deletingTariffTenant, setDeletingTariffTenant] = useState(null);
  const [deletingTariff, setDeletingTariff] = useState(false);

  // Modal Adăugare Client în Facturare State
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [selectedTenantToAdd, setSelectedTenantToAdd] = useState('');
  const [newTenantTariff, setNewTenantTariff] = useState('3.50');
  const [addingTenant, setAddingTenant] = useState(false);

  const months = [
    { value: 1, name: 'Ianuarie' },
    { value: 2, name: 'Februarie' },
    { value: 3, name: 'Martie' },
    { value: 4, name: 'Aprilie' },
    { value: 5, name: 'Mai' },
    { value: 6, name: 'Iunie' },
    { value: 7, name: 'Iulie' },
    { value: 8, name: 'August' },
    { value: 9, name: 'Septembrie' },
    { value: 10, name: 'Octombrie' },
    { value: 11, name: 'Noiembrie' },
    { value: 12, name: 'Decembrie' }
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    const isCurrent = (selectedYear === now.getFullYear() && newMonth === (now.getMonth() + 1));
    if (isCurrent) {
      setSelectedDate(todayStr);
    } else {
      const days = new Date(selectedYear, newMonth, 0).getDate();
      setSelectedDate(`${selectedYear}-${String(newMonth).padStart(2, '0')}-${String(days).padStart(2, '0')}`);
    }
  };

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    const isCurrent = (newYear === now.getFullYear() && selectedMonth === (now.getMonth() + 1));
    if (isCurrent) {
      setSelectedDate(todayStr);
    } else {
      const days = new Date(newYear, selectedMonth, 0).getDate();
      setSelectedDate(`${newYear}-${String(selectedMonth).padStart(2, '0')}-${String(days).padStart(2, '0')}`);
    }
  };

  const fetchBnrRate = useCallback(async (dateToFetch, forceRefresh = false) => {
    try {
      setFetchingRate(true);
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/billing/deviz/bnr-rate?date=${dateToFetch}&refresh=${forceRefresh ? 'true' : 'false'}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rate) {
          setExchangeRate(data.rate.toString());
          setBnrDateInfo(data);
          return data.rate;
        }
      }
    } catch (err) {
      console.error('Eroare preluare curs BNR:', err);
    } finally {
      setFetchingRate(false);
    }
    return null;
  }, []);

  const fetchBillingSummary = useCallback(async (rateOverride = null) => {
    try {
      setLoading(true);
      setError(null);
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const currentRate = rateOverride !== null ? rateOverride : (parseFloat(exchangeRate) || 0);
      const rateQuery = currentRate > 0 ? `&exchange_rate=${currentRate}` : '';
      const res = await fetch(`${baseUrl}/api/tenants/billing-summary?month=${selectedMonth}&year=${selectedYear}&date=${selectedDate}${rateQuery}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la preluarea calculelor de facturare');
      }
      const data = await res.json();
      setBillingData(data);
      if (data.exchange_rate && !exchangeRate) {
        setExchangeRate(data.exchange_rate.toString());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedDate, exchangeRate]);

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      const rate = await fetchBnrRate(selectedDate);
      if (isMounted) {
        fetchBillingSummary(rate);
      }
    };
    initData();
    return () => { isMounted = false; };
  }, [selectedDate, selectedMonth, selectedYear]);

  const handleRefreshAll = async () => {
    const rate = await fetchBnrRate(selectedDate, true);
    await fetchBillingSummary(rate);
    showToast(`Curs BNR sincronizat pentru ${selectedDate}: ${rate} RON`);
  };

  // Deschidere modal borderou
  const openBorderouModal = (tenant) => {
    setSelectedTenantDetails(tenant);
    setModalSearch('');
    setModalFilter('ALL');
    setModalPage(1);
    setModalRowsPerPage(10);
  };

  // Salvare tarif nou
  const handleSaveTariff = async () => {
    if (!editingTariffTenant) return;
    try {
      setSavingTariff(true);
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/tenants/${editingTariffTenant.tenant_id}/billing-tariff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_per_employee: parseFloat(newTariffValue) || 0 })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la actualizarea tarifului');
      }
      showToast(`Tariful pentru ${editingTariffTenant.name} a fost setat la ${parseFloat(newTariffValue).toFixed(2)} € / angajat.`);
      setEditingTariffTenant(null);
      await fetchBillingSummary();
    } catch (err) {
      showToast(err.message);
    } finally {
      setSavingTariff(false);
    }
  };

  // Dezactivare tarifare per angajat
  const handleDisableBilling = async () => {
    if (!deletingTariffTenant) return;
    try {
      setDeletingTariff(true);
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/tenants/${deletingTariffTenant.tenant_id}/billing-tariff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_per_employee: false })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la dezactivarea tarifării');
      }
      showToast(`Tarifarea per angajat a fost dezactivată pentru ${deletingTariffTenant.name}.`);
      setDeletingTariffTenant(null);
      await fetchBillingSummary();
    } catch (err) {
      showToast(err.message);
    } finally {
      setDeletingTariff(false);
    }
  };

  // Deschidere modal adăugare client în facturare
  const handleOpenAddModal = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/tenants`);
      if (res.ok) {
        const data = await res.json();
        const billedIds = new Set((billingData?.tenants || []).map(t => t.tenant_id));
        const available = data.filter(t => !billedIds.has(t.id));
        setAvailableTenants(available);
        if (available.length > 0) {
          setSelectedTenantToAdd(available[0].id);
        }
      }
      setIsAddTenantModalOpen(true);
      setNewTenantTariff('3.50');
    } catch (err) {
      console.error(err);
    }
  };

  // Adăugare client în facturare
  const handleAddTenantToBilling = async () => {
    if (!selectedTenantToAdd) return;
    try {
      setAddingTenant(true);
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const res = await fetch(`${baseUrl}/api/tenants/${selectedTenantToAdd}/billing-tariff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_per_employee: true,
          price_per_employee: parseFloat(newTenantTariff) || 3.50
        })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Eroare la adăugarea clientului');
      }
      showToast('Clientul a fost adăugat cu succes în modulul de facturare.');
      setIsAddTenantModalOpen(false);
      await fetchBillingSummary();
    } catch (err) {
      showToast(err.message);
    } finally {
      setAddingTenant(false);
    }
  };

  const copyInvoiceText = (tenant) => {
    const monthName = months.find(m => m.value === selectedMonth)?.name || selectedMonth;
    const isRo = tenant.is_romania !== false && (tenant.country_code === 'RO' || !tenant.country_code);
    
    let text = `Abonament servicii GetApp Smart QR - ${monthName} ${selectedYear}\n` +
      `Client: ${tenant.name} [${tenant.country_code || 'RO'}]\n` +
      `Angajați activi: ${tenant.active_employees} (din care ${tenant.full_rate_count} la 100% și ${tenant.half_rate_count} la 50%)\n` +
      `Tarif contractual: ${tenant.price_per_employee.toFixed(2)} EUR / angajat\n`;

    if (isRo && tenant.total_ron) {
      text += `Valoare fără TVA: ${tenant.total_eur.toFixed(2)} EUR (${tenant.total_ron.toFixed(2)} RON la curs oficial BNR ${billingData?.exchange_rate || exchangeRate})\n` +
        `TVA 21%: ${(tenant.total_eur * 0.21).toFixed(2)} EUR (${(tenant.total_ron * 0.21).toFixed(2)} RON)\n` +
        `Total de plată: ${(tenant.total_eur * 1.21).toFixed(2)} EUR (${(tenant.total_ron * 1.21).toFixed(2)} RON)`;
    } else {
      text += `Valoare fără TVA: ${tenant.total_eur.toFixed(2)} EUR\n` +
        `TVA (21%): ${(tenant.total_eur * 0.21).toFixed(2)} EUR\n` +
        `Total de plată: ${(tenant.total_eur * 1.21).toFixed(2)} EUR`;
    }

    navigator.clipboard.writeText(text);
    showToast(`Datele de factură pentru ${tenant.name} au fost copiate.`);
  };

  const handleDownloadDevizJson = async (tenant) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
      const rate = parseFloat(exchangeRate) || 0;
      const rateQuery = rate > 0 ? `&exchange_rate=${rate}` : '';
      const res = await fetch(`${baseUrl}/api/billing/deviz?tenant_id=${tenant.tenant_id}&month=${selectedMonth}&year=${selectedYear}&date=${selectedDate}${rateQuery}&tva_percent=21`);
      if (!res.ok) throw new Error('Eroare la preluarea devizului');
      const data = await res.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deviz_factura_${tenant.subdomain || 'client'}_${selectedMonth}_${selectedYear}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Devizul JSON pentru ${tenant.name} a fost descărcat.`);
    } catch (err) {
      showToast(err.message);
    }
  };

  const copySummaryReport = () => {
    if (!billingData || !billingData.tenants) return;
    const monthName = months.find(m => m.value === selectedMonth)?.name || selectedMonth;
    let report = `RAPORT FACTURARE GETAPP SMART QR - ${monthName.toUpperCase()} ${selectedYear}\n`;
    report += `Data calcul: ${selectedDate} | Curs BNR oficial (RO): ${billingData.exchange_rate} RON / EUR\n`;
    report += `------------------------------------------------------------\n`;
    
    billingData.tenants.forEach((t, idx) => {
      const isRo = t.is_romania !== false && (t.country_code === 'RO' || !t.country_code);
      const ronSuffix = (isRo && t.total_ron) ? ` (${t.total_ron.toFixed(2)} RON)` : '';
      report += `${idx + 1}. [${t.country_code || 'RO'}] ${t.name}: ${t.active_employees} angajați x ${t.price_per_employee.toFixed(2)} € = ${t.total_eur.toFixed(2)} EUR${ronSuffix}\n`;
    });
    
    report += `------------------------------------------------------------\n`;
    report += `TOTAL GENERAL: ${billingData.grand_total_eur.toFixed(2)} EUR + TVA\n`;
    if (billingData.grand_total_ron_ro || billingData.grand_total_ron) {
      report += `TOTAL FACTURAT RO: ${(billingData.grand_total_ron_ro || billingData.grand_total_ron).toFixed(2)} RON + TVA (curs BNR: ${billingData.exchange_rate})\n`;
    }

    navigator.clipboard.writeText(report);
    showToast('Raportul sumar a fost copiat în clipboard.');
  };

  const handleExportExcel = () => {
    if (!billingData || !billingData.tenants || billingData.tenants.length === 0) return;
    const monthName = months.find(m => m.value === selectedMonth)?.name || selectedMonth;
    
    const rows = billingData.tenants.map((t, idx) => {
      const isRo = t.is_romania !== false && (t.country_code === 'RO' || !t.country_code);
      return {
        'Nr.': idx + 1,
        'Țară': t.country_code === 'BE' ? 'Belgia' : 'România',
        'Companie / Tenant': t.name,
        'Subdomeniu': t.subdomain,
        'Angajați Activi': t.active_employees,
        'Cotă Întreagă (≥ 15 zile)': t.full_rate_count,
        'Cotă Redusă (< 15 zile)': t.half_rate_count,
        'Tarif / Angajat (EUR)': t.price_per_employee,
        'Total EUR (fără TVA)': t.total_eur,
        'TVA 21% (EUR)': parseFloat((t.total_eur * 0.21).toFixed(2)),
        'Total cu TVA (EUR)': parseFloat((t.total_eur * 1.21).toFixed(2)),
        'Total RON (fără TVA)': isRo ? t.total_ron : '-',
        'Total cu TVA (RON)': isRo ? parseFloat((t.total_ron * 1.21).toFixed(2)) : '-',
        'Curs BNR': isRo ? (billingData.exchange_rate || exchangeRate) : '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calcul Facturare');
    XLSX.writeFile(workbook, `Facturare_SmartQR_${monthName}_${selectedYear}.xlsx`);
    showToast('Fișierul Excel a fost descărcat.');
  };

  // Angajați procesați pentru modal
  const modalAllEmployees = useMemo(() => {
    if (!selectedTenantDetails) return [];
    return [
      ...selectedTenantDetails.half_rate_employees,
      ...selectedTenantDetails.full_rate_employees
    ];
  }, [selectedTenantDetails]);

  const filteredModalEmployees = useMemo(() => {
    return modalAllEmployees.filter(emp => {
      if (modalFilter === 'HALF' && emp.rate_percent !== 50) return false;
      if (modalFilter === 'FULL' && emp.rate_percent !== 100) return false;
      if (modalSearch) {
        const s = modalSearch.toLowerCase();
        return (
          emp.name.toLowerCase().includes(s) ||
          emp.job_title.toLowerCase().includes(s) ||
          (emp.note && emp.note.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [modalAllEmployees, modalFilter, modalSearch]);

  const modalTotal = filteredModalEmployees.length;
  const modalEffectiveRows = modalRowsPerPage === 9999 ? (modalTotal || 1) : modalRowsPerPage;
  const modalTotalPages = Math.max(1, Math.ceil(modalTotal / modalEffectiveRows));
  const modalPaginatedEmployees = useMemo(() => {
    if (modalRowsPerPage === 9999) return filteredModalEmployees;
    const start = (modalPage - 1) * modalRowsPerPage;
    return filteredModalEmployees.slice(start, start + modalRowsPerPage);
  }, [filteredModalEmployees, modalPage, modalRowsPerPage]);

  // Coloane optimizate pentru a elimina complet scroll-ul orizontal
  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Companie / Tenant',
      render: (row) => {
        const logoSrc = row.logo_url 
          ? (row.logo_url.startsWith('/uploads') || row.logo_url.startsWith('/logos')
              ? `${import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001')}${row.logo_url}`
              : row.logo_url)
          : null;

        return (
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <div 
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center shrink-0"
                style={{ backgroundColor: row.theme_color || '#ffffff' }}
                title={row.name}
              >
                <img 
                  src={logoSrc} 
                  alt={row.name} 
                  className="w-full h-full object-contain p-1" 
                  onError={(e) => {
                    if (row.favicon_url && e.currentTarget.src !== row.favicon_url) {
                      e.currentTarget.src = row.favicon_url;
                    } else {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.innerText = row.name.substring(0, 2).toUpperCase();
                        e.currentTarget.parentElement.classList.add('text-xs', 'font-bold', 'text-white');
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div 
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                style={{ backgroundColor: row.theme_color || '#2563EB' }}
              >
                {row.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{row.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${row.country_code === 'BE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'}`}>
                  {row.country_code === 'BE' ? 'Belgia • EUR' : 'România • RON'}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {row.subdomain}.pontaj.app
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'active_employees',
      label: 'Angajați Activi',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">
            {row.active_employees} angajați
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {row.full_rate_count} la 100% • {row.half_rate_count} la 50%
          </div>
        </div>
      )
    },
    {
      key: 'price_per_employee',
      label: 'Tarif / Angajat',
      render: (row) => (
        <span className="font-bold text-slate-900 dark:text-white">
          {row.price_per_employee.toFixed(2)} €
        </span>
      )
    },
    {
      key: 'total_eur',
      label: 'Total Facturat',
      render: (row) => {
        const isRo = row.is_romania !== false && (row.country_code === 'RO' || !row.country_code);
        return (
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              {row.total_eur.toFixed(2)} €
              {isRo && row.total_ron !== null && (
                <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs ml-1.5">
                  ({row.total_ron.toFixed(2)} RON)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {isRo && row.total_ron !== null ? (
                <span>+TVA: {(row.total_eur * 1.21).toFixed(2)} € ({(row.total_ron * 1.21).toFixed(2)} RON)</span>
              ) : (
                <span>+TVA (21%): {(row.total_eur * 1.21).toFixed(2)} €</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acțiuni',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditingTariffTenant(row);
              setNewTariffValue(row.price_per_employee.toString());
            }}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
            title="Modifică tarif contractual"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => openBorderouModal(row)}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
            title="Vezi borderoul nominal al angajaților"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => copyInvoiceText(row)}
            className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors flex items-center justify-center cursor-pointer"
            title="Copiază datele pentru facturare"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => setDeletingTariffTenant(row)}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center cursor-pointer"
            title="Dezactivează tarifarea per angajat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ], [selectedMonth, selectedYear]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Toast Notification (Regula 13) */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <Check size={16} className="text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header Container conform Design System */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="text-primary-600" size={24} />
            Calcul Facturare (Tarifare per Angajat)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Calcul automat al sumelor de facturat pe baza angajaților activi și a regulii de 15 zile din contract.
          </p>
        </div>

        {/* Toolbar controale */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
            className="px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm font-medium cursor-pointer"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
            className="px-4 h-10 text-sm rounded-full border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-white outline-none transition-all shadow-sm font-medium cursor-pointer"
          >
            {[2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Selector Dată Curs BNR în funcție de zi */}
          <div className="flex items-center h-10 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary-500" title="Data pentru care se preia cursul oficial BNR (exclusiv pentru clienții din România)">
            <Calendar size={14} className="text-slate-400 mr-2 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1.5 whitespace-nowrap">Dată BNR:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold bg-transparent dark:text-white outline-none cursor-pointer"
            />
          </div>

          {/* Curs BNR Oficial (pentru România) */}
          <div className="flex items-center h-10 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-primary-500" title="Curs valutar oficial BNR aplicabil exclusiv companiilor din România">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 whitespace-nowrap">Curs BNR (RO):</span>
            <input
              type="number"
              step="0.0001"
              min="1"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              onBlur={() => fetchBillingSummary()}
              className="w-20 text-sm font-semibold bg-transparent dark:text-white outline-none"
              placeholder="5.xxxx"
            />
            <span className="text-xs font-bold text-slate-400 ml-1 select-none">RON</span>
          </div>

          <button
            onClick={handleRefreshAll}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-primary-50 hover:text-primary-600 text-slate-500 dark:text-slate-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            title="Reîncarcă cursul BNR oficial din ziua selectată și recalculează"
          >
            <RotateCw size={16} className={(loading || fetchingRate) ? 'animate-spin' : ''} />
          </button>

          {billingData && billingData.tenants?.length > 0 && (
            <button
              onClick={copySummaryReport}
              className="px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Copy size={16} />
              Copiază Sumar
            </button>
          )}
        </div>
      </div>

      {bnrDateInfo && (
        <div className="px-4 py-2.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold">Curs BNR Oficial ({bnrDateInfo.bnr_date || selectedDate}):</span>
            <span className="font-semibold">{bnrDateInfo.rate} RON / EUR</span>
            {bnrDateInfo.bnr_date !== selectedDate && (
              <span className="text-blue-600 dark:text-blue-400 text-[11px]">(cel mai recent curs comunicat valabil pentru weekend / sărbători legale)</span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
            Se aplică exclusiv clienților din România • Belgia / UE se facturează direct în EUR
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPI Cards (Regula 5 - rounded-2xl, shadow-sm, border) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Clienți Facturați</span>
            <Building2 size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {billingData ? billingData.tenants_count : '0'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">cu tarifare per angajat activată</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Angajați Activi</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {billingData ? (
              billingData.tenants?.reduce((acc, t) => acc + t.active_employees, 0) || 0
            ) : '0'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">contorizați în luna selectată</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Facturat (EUR)</span>
            <span className="text-[11px] text-slate-400 font-semibold">Toate țările</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {billingData ? `${billingData.grand_total_eur.toFixed(2)} €` : '0.00 €'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            cu TVA: {billingData ? `${(billingData.grand_total_eur * 1.21).toFixed(2)} €` : '0.00 €'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Total Facturat RO (RON)</span>
            <span className="text-[11px] text-slate-400 font-semibold">@ {exchangeRate || 'BNR'}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {billingData ? `${(billingData.grand_total_ron_ro || billingData.grand_total_ron || 0).toFixed(2)} RON` : '0.00 RON'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            exclusiv clienți România (fără Belgia/UE)
          </p>
        </div>
      </div>

      {/* Tabel Centralizat folosind componenta standard DataTable (Fără Scroll Orizontal) */}
      <DataTable
        title="Situație Centralizată Facturare"
        data={billingData?.tenants || []}
        columns={columns}
        searchPlaceholder="Caută după companie sau subdomeniu..."
        rowKey="tenant_id"
        onExport={handleExportExcel}
        headerActions={
          <button
            onClick={handleOpenAddModal}
            className="px-5 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            title="Adaugă un client în modulul de tarifare per angajat"
          >
            <Plus size={16} />
            Adaugă Client
          </button>
        }
        expandable={true}
        expandedRowRender={(row) => (
          <div className="p-5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                Borderou rapid {row.name} ({row.active_employees} angajați activi în {months.find(m => m.value === selectedMonth)?.name} {selectedYear})
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span>Cotă întreagă (≥ 15 zile): <strong className="text-slate-900 dark:text-white">{row.full_rate_count}</strong> ({row.price_per_employee.toFixed(2)} €)</span>
                <span>Cotă redusă (&lt; 15 zile, 50%): <strong className="text-slate-900 dark:text-white">{row.half_rate_count}</strong> ({(row.price_per_employee * 0.5).toFixed(2)} €)</span>
              </div>
            </div>

            {row.half_rate_employees?.length > 0 && (
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px]">
                  Angajați cu tarif redus 50% (&lt; 15 zile de activitate în lună):
                </span>
                <div className="divide-y divide-amber-200/50 dark:divide-amber-900/30">
                  {row.half_rate_employees.map(emp => (
                    <div key={emp.id} className="py-1.5 flex justify-between items-center text-slate-800 dark:text-slate-200">
                      <div>
                        <strong>{emp.name}</strong> <span className="text-slate-500 dark:text-slate-400">({emp.job_title})</span>
                        <span className="ml-2 text-amber-700 dark:text-amber-400 font-medium">— {emp.days_active} zile ({emp.note})</span>
                      </div>
                      <span className="font-bold">{emp.amount_eur.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Restul de {row.full_rate_count} angajați au activat din prima zi a lunii{row.full_rate_employees?.[0]?.days_active ? ` (${row.full_rate_employees[0].days_active} zile ${row.full_rate_employees[0].note?.startsWith('Luna în curs') ? 'până azi' : 'în lună'})` : ''} și se facturează la cotă întreagă.
              </span>
              <button
                onClick={() => openBorderouModal(row)}
                className="px-4 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Eye size={14} />
                Deschide Borderou Nominal Complet
              </button>
            </div>
          </div>
        )}
      />

      {/* Modal Borderou Nominal Angajați Fără Scroll (Regula 9 - Modal) */}
      {selectedTenantDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Borderou Angajați — {selectedTenantDetails.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Luna: {months.find(m => m.value === selectedMonth)?.name} {selectedYear} • {selectedTenantDetails.active_employees} angajați activi
                </p>
              </div>
              <button
                onClick={() => setSelectedTenantDetails(null)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corp Modal cu Filtre & Search */}
            <div className="p-6 space-y-4">
              {/* Carduri rezumat compacte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Cotă întreagă (≥ 15 zile)</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTenantDetails.full_rate_count} angajați × {selectedTenantDetails.price_per_employee.toFixed(2)} € = {(selectedTenantDetails.full_rate_count * selectedTenantDetails.price_per_employee).toFixed(2)} €
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Cotă redusă (&lt; 15 zile, 50%)</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTenantDetails.half_rate_count} angajați × {(selectedTenantDetails.price_per_employee * 0.5).toFixed(2)} € = {(selectedTenantDetails.half_rate_count * selectedTenantDetails.price_per_employee * 0.5).toFixed(2)} €
                  </div>
                </div>
              </div>

              {/* Toolbar Filtrare & Căutare */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setModalFilter('ALL'); setModalPage(1); }}
                    className={`px-3.5 h-8 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                      modalFilter === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Toți ({modalAllEmployees.length})
                  </button>
                  <button
                    onClick={() => { setModalFilter('HALF'); setModalPage(1); }}
                    className={`px-3.5 h-8 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                      modalFilter === 'HALF'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Cotă redusă 50% ({selectedTenantDetails.half_rate_count})
                  </button>
                  <button
                    onClick={() => { setModalFilter('FULL'); setModalPage(1); }}
                    className={`px-3.5 h-8 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                      modalFilter === 'FULL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Cotă întreagă 100% ({selectedTenantDetails.full_rate_count})
                  </button>
                </div>

                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Caută angajat..."
                    value={modalSearch}
                    onChange={(e) => { setModalSearch(e.target.value); setModalPage(1); }}
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Tabel Pagina Curentă (Fără Scroll) */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-white dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 w-12 text-center">Nr.</th>
                      <th className="px-4 py-2.5">Nume Angajat</th>
                      <th className="px-4 py-2.5">Funcție</th>
                      <th className="px-4 py-2.5 text-center">Zile Active în Lună</th>
                      <th className="px-4 py-2.5 text-center">Cotă</th>
                      <th className="px-4 py-2.5 text-right">Sumă (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {modalPaginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-xs text-slate-400">
                          Niciun angajat găsit conform filtrelor selectate.
                        </td>
                      </tr>
                    ) : (
                      modalPaginatedEmployees.map((emp, i) => (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-2 text-slate-400 font-mono text-xs text-center">
                            {(modalPage - 1) * (modalRowsPerPage === 9999 ? modalTotal : modalRowsPerPage) + i + 1}
                          </td>
                          <td className="px-4 py-2 font-semibold text-slate-900 dark:text-white">
                            {emp.name}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400 text-xs">
                            {emp.job_title}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="font-semibold text-slate-800 dark:text-white text-xs">
                              {emp.days_active} zile
                            </span>
                            {emp.note && (
                              <div className="text-[11px] text-slate-400 font-normal">
                                {emp.note}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {emp.rate_percent}%
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                            {emp.amount_eur.toFixed(2)} €
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bara de paginare a tabelului */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <span>Rânduri:</span>
                  <select
                    value={modalRowsPerPage}
                    onChange={(e) => { setModalRowsPerPage(parseInt(e.target.value, 10)); setModalPage(1); }}
                    className="px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none font-medium cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={9999}>Toți</option>
                  </select>
                  <span>
                    Se afișează {modalTotal > 0 ? (modalPage - 1) * (modalRowsPerPage === 9999 ? modalTotal : modalRowsPerPage) + 1 : 0}–{Math.min(modalPage * (modalRowsPerPage === 9999 ? modalTotal : modalRowsPerPage), modalTotal)} din {modalTotal}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span>Pagina {modalPage} din {modalTotalPages}</span>
                  <button
                    onClick={() => setModalPage(p => Math.max(1, p - 1))}
                    disabled={modalPage <= 1}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setModalPage(p => Math.min(modalTotalPages, p + 1))}
                    disabled={modalPage >= modalTotalPages}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Total de facturat: {selectedTenantDetails.total_eur.toFixed(2)} EUR ({selectedTenantDetails.total_ron.toFixed(2)} RON) + TVA
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedTenantDetails(null)}
                  className="px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors cursor-pointer"
                >
                  Închide
                </button>
                <button
                  onClick={() => handleDownloadDevizJson(selectedTenantDetails)}
                  className="px-5 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  title="Descarcă devizul complet în format JSON gata pentru aplicația de facturi"
                >
                  <Download size={16} />
                  Deviz JSON SPV
                </button>
                <button
                  onClick={() => copyInvoiceText(selectedTenantDetails)}
                  className="px-5 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Copy size={16} />
                  Copiază Detalii Factură
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modificare Tarif */}
      {editingTariffTenant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Modificare Tarif Contractual
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Client: {editingTariffTenant.name}
                </p>
              </div>
              <button
                onClick={() => setEditingTariffTenant(null)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Preț per Angajat Activ (€ / lună) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTariffValue}
                    onChange={(e) => setNewTariffValue(e.target.value)}
                    className="w-full pl-4 pr-12 h-10 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                    autoFocus
                  />
                  <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400 select-none">EUR</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-white">Regulă aplicată automat (contract):</div>
                <div className="text-slate-600 dark:text-slate-400">
                  • Cota întreagă (≥ 15 zile): <strong>{(parseFloat(newTariffValue) || 0).toFixed(2)} €</strong> / angajat
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  • Cota redusă (&lt; 15 zile, 50%): <strong>{((parseFloat(newTariffValue) || 0) * 0.5).toFixed(2)} €</strong> / angajat
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2.5 bg-white dark:bg-slate-900">
              <button
                onClick={() => setEditingTariffTenant(null)}
                className="px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors cursor-pointer"
              >
                Anulează
              </button>
              <button
                onClick={handleSaveTariff}
                disabled={savingTariff}
                className="px-5 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check size={16} />
                {savingTariff ? 'Se salvează...' : 'Salvează Tarif'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dezactivare / Ștergere Tarifare */}
      {deletingTariffTenant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Dezactivează Tarifare per Angajat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Client: {deletingTariffTenant.name}
                </p>
              </div>
              <button
                onClick={() => setDeletingTariffTenant(null)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Ești sigur că vrei să elimini clientul <strong>{deletingTariffTenant.name}</strong> din modulul de tarifare per angajat?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Datele angajaților și pontajele nu vor fi afectate. Acest client nu va mai fi inclus în calculul automat de facturare.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2.5 bg-white dark:bg-slate-900">
              <button
                onClick={() => setDeletingTariffTenant(null)}
                className="px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors cursor-pointer"
              >
                Anulează
              </button>
              <button
                onClick={handleDisableBilling}
                disabled={deletingTariff}
                className="px-5 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deletingTariff ? 'Se procesează...' : 'Dezactivează'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adăugare Client în Tarifare per Angajat */}
      {isAddTenantModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Adaugă Client în Tarifare per Angajat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selectează un client și setează tariful per angajat
                </p>
              </div>
              <button
                onClick={() => setIsAddTenantModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {availableTenants.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                  Toți clienții existenți au deja tarifarea per angajat activată.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Selectează Client / Tenant *
                    </label>
                    <select
                      value={selectedTenantToAdd}
                      onChange={(e) => setSelectedTenantToAdd(e.target.value)}
                      className="w-full px-4 h-10 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 shadow-sm cursor-pointer"
                    >
                      {availableTenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subdomain}.pontaj.app)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Tarif per Angajat Activ (€ / lună) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTenantTariff}
                        onChange={(e) => setNewTenantTariff(e.target.value)}
                        className="w-full pl-4 pr-12 h-10 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                      />
                      <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400 select-none">EUR</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2.5 bg-white dark:bg-slate-900">
              <button
                onClick={() => setIsAddTenantModalOpen(false)}
                className="px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors cursor-pointer"
              >
                Anulează
              </button>
              {availableTenants.length > 0 && (
                <button
                  onClick={handleAddTenantToBilling}
                  disabled={addingTenant}
                  className="px-5 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus size={16} />
                  {addingTenant ? 'Se adaugă...' : 'Activează Tarifare'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
