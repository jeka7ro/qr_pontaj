import React, { useState } from 'react';
import { getApiUrl } from '../utils/apiUrl';
import { 
  X, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Users, 
  Building, 
  Mail, 
  User, 
  Sparkles, 
  ArrowRight,
  Globe,
  MapPin,
  Lock,
  FileCheck
} from 'lucide-react';

const MODAL_I18N = {
  fr: {
    badge: "time.be • Formule Professionnelle",
    title: "Commande en Ligne & Paiement Sécurisé",
    seatsTitle: "Nombre d'employés sous contrat",
    seatsSub: "Ajustable à tout moment avec calcul prorata automatique",
    seatsUnit: "salariés",
    rateLabel: "Tarif :",
    ratePerSeat: "9,90 € HTVA / employé / mois",
    perMonth: "/ mois",
    vatNoteBe: "TVA 21% belge incluse sur facture",
    vatNoteEu: "TVA 0% • Taxe inversée B2B intracommunautaire",
    companyLabel: "Nom de l'entreprise (SRL / BV) *",
    companyPlaceholder: "ex: Brasserie Grand-Place SRL",
    countryLabel: "Pays d'enregistrement *",
    emailLabel: "Email administrateur (facturation) *",
    emailPlaceholder: "direction@entreprise.be",
    adminNameLabel: "Nom du signataire / gérant",
    adminNamePlaceholder: "ex: Jean-Luc Dupont",
    vatLabel: "Numéro de TVA intracommunautaire",
    vatPlaceholder: "ex: BE 0123.456.789",
    addressLabel: "Adresse du siège social / Facturation",
    addressPlaceholder: "ex: Rue de la Loi 16, 1000 Bruxelles",
    subdomainLabel: "Adresse dédiée de votre borne",
    subdomainPlaceholder: "nom-entreprise",
    subdomainDomain: ".time.be",
    benefitsTitle: "Inclus dans votre abonnement :",
    benefit1: "Pointage illimité sur tablettes et smartphones",
    benefit2: "Exports conformes SD Worx, Liantis, Securex",
    benefit3: "Conforme droit social belge & CJUE C-55/18",
    benefit4: "Facturation mensuelle sans engagement",
    btnSubmit: "Payer en toute sécurité via Stripe",
    securityNote: "Paiement sécurisé crypté SSL 256-bit par Stripe Inc. Annulation possible en 1 clic.",
    errCompany: "Veuillez renseigner le nom de l'entreprise.",
    errEmail: "Veuillez renseigner un email valide.",
    errStripe: "Erreur lors de la création de la session Stripe.",
  },
  nl: {
    badge: "time.be • Professionele Formule",
    title: "Online Bestellen & Veilige Betaling",
    seatsTitle: "Aantal gecontracteerde werknemers",
    seatsSub: "Op elk moment aanpasbaar met automatische prorata-berekening",
    seatsUnit: "medewerkers",
    rateLabel: "Tarief :",
    ratePerSeat: "€9.90 excl. btw / werknemer / maand",
    perMonth: "/ maand",
    vatNoteBe: "Belgische 21% btw inbegrepen op factuur",
    vatNoteEu: "0% btw • Intracommunautaire btw-verlegging B2B",
    companyLabel: "Bedrijfsnaam (BV / SRL) *",
    companyPlaceholder: "ex: Brasserie Grand-Place BV",
    countryLabel: "Land van registratie *",
    emailLabel: "E-mailadres beheerder (facturatie) *",
    emailPlaceholder: "directie@onderneming.be",
    adminNameLabel: "Naam zaakvoerder / beheerder",
    adminNamePlaceholder: "ex: Jan Van de Velde",
    vatLabel: "Ondernemingsnummer / Btw-nummer",
    vatPlaceholder: "ex: BE 0123.456.789",
    addressLabel: "Maatschappelijke zetel / Factuuradres",
    addressPlaceholder: "ex: Wetstraat 16, 1000 Brussel",
    subdomainLabel: "Toegewezen adres voor uw kiosk",
    subdomainPlaceholder: "uw-onderneming",
    subdomainDomain: ".time.be",
    benefitsTitle: "Inbegrepen in uw abonnement :",
    benefit1: "Onbeperkt inklokken op tablets en smartphones",
    benefit2: "Exports conform SD Worx, Liantis, Securex",
    benefit3: "Conform Belgisch arbeidsrecht & HvJ-EU",
    benefit4: "Maandelijkse facturatie zonder verplichting",
    btnSubmit: "Veilig betalen via Stripe",
    securityNote: "256-bit SSL-versleutelde betaling via Stripe Inc. Maandelijks opzegbaar.",
    errCompany: "Gelieve de bedrijfsnaam in te vullen.",
    errEmail: "Gelieve een geldig e-mailadres in te vullen.",
    errStripe: "Fout bij aanmaken Stripe-sessie.",
  },
  en: {
    badge: "time.be • Enterprise Plan",
    title: "Online Order & Secure Checkout",
    seatsTitle: "Contracted team members",
    seatsSub: "Scale up or down anytime with prorated billing",
    seatsUnit: "seats",
    rateLabel: "Rate :",
    ratePerSeat: "€9.90 excl. VAT / employee / month",
    perMonth: "/ mo",
    vatNoteBe: "Belgian 21% VAT included on invoice",
    vatNoteEu: "0% VAT • EU B2B Reverse Charge",
    companyLabel: "Company Name (BV / SRL) *",
    companyPlaceholder: "e.g. Grand-Place Hospitality BV",
    countryLabel: "Country of registration *",
    emailLabel: "Billing administrator email *",
    emailPlaceholder: "billing@company.be",
    adminNameLabel: "Administrator / Manager name",
    adminNamePlaceholder: "e.g. Jean Dupont",
    vatLabel: "EU VAT Number",
    vatPlaceholder: "e.g. BE 0123.456.789",
    addressLabel: "Registered address / Invoicing",
    addressPlaceholder: "e.g. Rue de la Loi 16, 1000 Brussels",
    subdomainLabel: "Dedicated kiosk portal link",
    subdomainPlaceholder: "my-company",
    subdomainDomain: ".time.be",
    benefitsTitle: "Included in your subscription :",
    benefit1: "Unlimited clocking on iPads, tablets & phones",
    benefit2: "1-click exports for SD Worx, Liantis, Securex",
    benefit3: "SPF Employment & CJUE C-55/18 compliant",
    benefit4: "Flexible monthly billing, cancel anytime",
    btnSubmit: "Proceed to Secure Stripe Checkout",
    securityNote: "256-bit SSL encrypted checkout powered by Stripe Inc. Cancel anytime in 1 click.",
    errCompany: "Please enter your company name.",
    errEmail: "Please enter a valid email address.",
    errStripe: "Error creating Stripe Checkout session.",
  },
  ro: {
    badge: "QR Pontaj • Abonament Lunar",
    title: "Comandă Online & Plată Securizată Stripe",
    seatsTitle: "Număr de angajați contractați",
    seatsSub: "Pachetul minim inițial este de 10 angajați (50.00 € / lună). Ulterior, poți adăuga oricâți dorești (chiar și câte 1)",
    seatsUnit: "angajați",
    rateLabel: "Tarif :",
    ratePerSeat: "5.00 € / angajat / lună (Minim 50 €)",
    perMonth: "/ lună",
    vatNoteBe: "TVA 21% inclus pe factură",
    vatNoteEu: "Factură fiscală B2B • Plată securizată Stripe",
    companyLabel: "Nume Companie (SRL / SA) *",
    companyPlaceholder: "ex: TRADE INVEST NETWORK S.R.L.",
    countryLabel: "Țară de Înregistrare *",
    emailLabel: "Email Administrator (Facturare) *",
    emailPlaceholder: "admin@companie.ro",
    adminNameLabel: "Nume Administrator / Semnatar",
    adminNamePlaceholder: "ex: Eugeniu Cazmal",
    vatLabel: "Cod Fiscal / CUI (cu sau fără RO)",
    vatPlaceholder: "ex: RO 42322117",
    addressLabel: "Adresă Sediu Social / Facturare",
    addressPlaceholder: "ex: București, Str...",
    subdomainLabel: "Adresă Portal Kiosk Dedicat",
    subdomainPlaceholder: "subdomeniu",
    subdomainDomain: ".qr.pontaj.app",
    benefitsTitle: "Ce include abonamentul :",
    benefit1: "Pontaj nelimitat pe tablete kiosk și telefoane",
    benefit2: "Export direct în format compatibil SAGA",
    benefit3: "Conformitate Codul Muncii (Art. 119) & GDPR (Art. 28)",
    benefit4: "Facturare lunară flexibilă, fără angajament contractual",
    btnSubmit: "Plătește Securizat cu Stripe",
    securityNote: "Plată securizată prin Stripe Inc. cu criptare SSL 256-bit. Poți anula sau modifica abonamentul în orice moment.",
    errCompany: "Vă rugăm să introduceți denumirea companiei.",
    errEmail: "Vă rugăm să introduceți o adresă de email validă.",
    errStripe: "Eroare la crearea sesiunii Stripe Checkout.",
  }
};

export default function SelfServiceSubscribeModal({ isOpen, onClose, initialTenant = null, lang = null }) {
  const isRo = !initialTenant?.country_code || initialTenant?.country_code === 'RO';
  const resolvedLang = lang || (isRo ? 'ro' : (initialTenant?.country_code === 'NL' ? 'nl' : 'fr'));
  const m = MODAL_I18N[resolvedLang] || MODAL_I18N.ro;

  const [seats, setSeats] = useState(Math.max(10, initialTenant?.subscription_seats || 10));
  const [companyName, setCompanyName] = useState(initialTenant?.name || '');
  const [subdomain, setSubdomain] = useState(initialTenant?.subdomain || '');
  const [adminEmail, setAdminEmail] = useState(initialTenant?.contact_email || '');
  const [adminName, setAdminName] = useState(initialTenant?.contact_name || '');
  const [countryCode, setCountryCode] = useState(initialTenant?.country_code || (isRo ? 'RO' : 'BE'));
  const [vatNumber, setVatNumber] = useState(initialTenant?.vat_number || '');
  const [billingAddress, setBillingAddress] = useState(initialTenant?.billing_address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (initialTenant) {
      if (initialTenant.name) setCompanyName(initialTenant.name);
      if (initialTenant.subdomain) setSubdomain(initialTenant.subdomain);
      if (initialTenant.country_code) setCountryCode(initialTenant.country_code);
      if (initialTenant.contact_email) setAdminEmail(initialTenant.contact_email);
      if (initialTenant.contact_name) setAdminName(initialTenant.contact_name);
      if (initialTenant.vat_number) setVatNumber(initialTenant.vat_number);
      if (initialTenant.billing_address) setBillingAddress(initialTenant.billing_address);
      if (initialTenant.subscription_seats) setSeats(Math.max(10, initialTenant.subscription_seats));
    }
  }, [initialTenant]);

  if (!isOpen) return null;

  const pricePerSeat = countryCode === 'BE' ? 9.90 : (initialTenant?.price_per_employee ? parseFloat(initialTenant.price_per_employee) : 5.00);
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
      setError(m.errCompany);
      return;
    }
    if (!adminEmail.trim()) {
      setError(m.errEmail);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: initialTenant?.id,
          companyName: companyName.trim(),
          subdomain: (subdomain.trim() || companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')),
          adminEmail: adminEmail.trim(),
          adminName: adminName.trim() || companyName.trim(),
          vatNumber: vatNumber.trim(),
          billingAddress: billingAddress.trim(),
          seats: Math.max(10, parseInt(seats, 10) || 10),
          countryCode: countryCode || 'RO',
          successUrl: `${window.location.origin}/admin/billing?subscribed=true`,
          cancelUrl: `${window.location.origin}/admin/billing`
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || m.errStripe);
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Unable to redirect to Stripe.');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-left">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
              <Sparkles size={12} />
              <span>{m.badge}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight">
              {m.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white hover:bg-slate-200 border border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCheckout} className="p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3.5 text-xs font-semibold text-red-700 bg-red-50 rounded-2xl border border-red-200">
              {error}
            </div>
          )}

          {/* Calculator Seats Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users size={17} className="text-blue-600" />
                  <span>{m.seatsTitle}</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {m.seatsSub}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-300 shadow-2xs">
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={seats}
                  onChange={(e) => setSeats(Math.max(10, parseInt(e.target.value, 10) || 10))}
                  className="w-12 text-center text-sm font-black text-slate-900 outline-none"
                />
                <span className="text-xs font-bold text-slate-500">{m.seatsUnit}</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="10"
              max="100"
              value={seats}
              onChange={(e) => setSeats(Math.max(10, parseInt(e.target.value, 10) || 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />

            {/* Price Preview Row */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-600 font-medium">
                {m.rateLabel} <strong className="text-slate-900 font-bold">{m.ratePerSeat}</strong>
              </span>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900">
                  €{totalEur.toFixed(2)} <span className="text-xs font-semibold text-slate-500">{m.perMonth}</span>
                </span>
                <span className="block text-[11px] text-emerald-700 font-semibold">
                  {countryCode === 'BE' ? m.vatNoteBe : m.vatNoteEu}
                </span>
              </div>
            </div>
          </div>

          {/* Symmetrical, Pixel-Perfect Input Rows */}
          {/* Row 1: Company Name & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1.5 truncate">
                {m.companyLabel}
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-2xl border border-slate-300 bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
                <Building size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder={m.companyPlaceholder}
                  value={companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1.5 truncate">
                {m.countryLabel}
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-2xl border border-slate-300 bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
                <Globe size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 bg-transparent outline-none cursor-pointer"
                >
                  <option value="RO">România (RO)</option>
                  <option value="BE">Belgique / België (BE)</option>
                  <option value="FR">France (FR)</option>
                  <option value="NL">Nederland (NL)</option>
                  <option value="LU">Luxembourg (LU)</option>
                  <option value="DE">Deutschland (DE)</option>
                  <option value="IT">Italia (IT)</option>
                  <option value="ES">España (ES)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Billing Email & Admin Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1.5 truncate">
                {m.emailLabel}
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-2xl border border-slate-300 bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
                <Mail size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder={m.emailPlaceholder}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1.5 truncate">
                {m.adminNameLabel}
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-2xl border border-slate-300 bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
                <User size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder={m.adminNamePlaceholder}
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 3: VAT ID & Billing Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="h-5 flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 truncate">
                  {m.vatLabel}
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  B2B
                </span>
              </div>
              <div className="flex items-center h-11 px-3.5 rounded-2xl border border-slate-300 bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
                <ShieldCheck size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder={m.vatPlaceholder}
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value.toUpperCase())}
                  className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1.5 truncate">
                {m.addressLabel}
              </label>
              <div className="flex items-center h-11 px-3.5 rounded-2xl border border-slate-300 bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
                <MapPin size={16} className="text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder={m.addressPlaceholder}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full text-sm font-medium text-slate-900 placeholder-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Subdomain Input */}
          <div>
            <label className="h-5 flex items-center text-xs font-semibold text-slate-700 mb-1.5 truncate">
              {m.subdomainLabel}
            </label>
            <div className="flex items-center h-11 px-3.5 rounded-2xl border border-slate-300 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent placeholder-slate-400"
                placeholder={m.subdomainPlaceholder}
              />
              <span className="text-xs font-bold text-slate-500 shrink-0 select-none bg-slate-200 px-2 py-0.5 rounded-full ml-2">
                {countryCode === 'BE' ? '.time.be' : '.qr.pontaj.app'}
              </span>
            </div>
          </div>

          {/* Unified Benefits Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-800">
              <ShieldCheck size={16} className="text-blue-600" />
              <span>{m.benefitsTitle}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-600 shrink-0" />
                {m.benefit1}
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-600 shrink-0" />
                {m.benefit2}
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-600 shrink-0" />
                {m.benefit3}
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={13} className="text-emerald-600 shrink-0" />
                {m.benefit4}
              </span>
            </div>
          </div>

          {/* Single-Line, Pill-Shaped Rounded Button (rounded-full) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  <span className="whitespace-nowrap">{m.btnSubmit} (€{totalEur.toFixed(2)}/mois)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2 font-medium">
              {m.securityNote}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
