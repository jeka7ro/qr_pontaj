import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  X,
  CreditCard,
  ScanLine,
  FileSpreadsheet,
  Check,
  Search,
  ArrowRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Phone,
  Sun,
  CloudSun,
  MapPin,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Tv,
  Monitor,
  Tablet,
  Smartphone,
  Laptop,
  Layers,
  FileText,
  Building2,
  Users,
  LogIn,
  LogOut,
  UserCheck,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { trackEvent } from '../utils/analytics';
import { apiUrl } from '../utils/apiUrl';

export default function LandingRomania() {
  const navigate = useNavigate();

  // State Modale și Formular Demo / Abonament
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('demo'); // 'demo' | 'subscribe'
  const [selectedPlan, setSelectedPlan] = useState({
    id: 'standard',
    name: 'Standard (1 – 50 salariați)',
    price: '5.00 €',
    defaultSeats: 15
  });

  const openPlanModal = (planId = 'standard', mode = 'demo') => {
    setModalMode(mode);
    let planData = {
      id: 'standard',
      name: 'Standard (1 – 50 salariați)',
      price: '5.00 €',
      defaultSeats: 15
    };
    if (planId === 'pro') {
      planData = {
        id: 'pro',
        name: 'Echipe Mari (51+ salariați)',
        price: '4.00 €',
        defaultSeats: 65
      };
    } else if (planId === 'enterprise') {
      planData = {
        id: 'enterprise',
        name: 'Corporate (150+ salariați)',
        price: 'Negociabil',
        defaultSeats: 160
      };
    }
    setSelectedPlan(planData);
    setSubForm(prev => ({
      ...prev,
      employeesCount: String(planData.defaultSeats)
    }));
    setIsSubscribeModalOpen(true);
    setSubSubmitted(false);
    trackEvent('open_demo_modal', { planId, mode });
  };

  const [subForm, setSubForm] = useState({
    contactName: '',
    email: '',
    password: '',
    companyName: '',
    phone: '',
    anafPhone: '',
    cui: '',
    address: '',
    city: '',
    county: '',
    regCom: '',
    employeesCount: '15',
    notes: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPassword, setShowSuccessPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };
  const [cuiLoading, setCuiLoading] = useState(false);
  const [cuiError, setCuiError] = useState(null);
  const [companyVerified, setCompanyVerified] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [subSubmitted, setSubSubmitted] = useState(false);
  const [assignedTempPassword, setAssignedTempPassword] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [acceptDpa, setAcceptDpa] = useState(true);
  const [createdSubdomain, setCreatedSubdomain] = useState('');
  const [legalModalType, setLegalModalType] = useState(null); // 'terms' | 'privacy' | 'dpa'

  // Ceas Digital Live și Dată
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeFormatted = currentTime.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateFormatted = currentTime.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Vreme și Locație Vizitator
  const [weatherInfo, setWeatherInfo] = useState({
    city: 'București',
    temp: '21°C',
    condition: 'Însorit'
  });

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      let detectedCity = 'București';
      let lat = 44.4323;
      let lon = 26.1063;

      if (tz.includes('Cluj')) { detectedCity = 'Cluj-Napoca'; lat = 46.77; lon = 23.60; }
      else if (tz.includes('Timisoara')) { detectedCity = 'Timișoara'; lat = 45.75; lon = 21.22; }
      else if (tz.includes('Iasi')) { detectedCity = 'Iași'; lat = 47.16; lon = 27.58; }
      else if (tz.includes('Brasov')) { detectedCity = 'Brașov'; lat = 45.65; lon = 25.60; }
      else if (tz.includes('Constanta')) { detectedCity = 'Constanța'; lat = 44.18; lon = 28.63; }
      else if (tz.includes('Craiova')) { detectedCity = 'Craiova'; lat = 44.33; lon = 23.79; }

      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
        .then(res => res.json())
        .then(data => {
          if (data && data.current) {
            const temp = Math.round(data.current.temperature_2m);
            setWeatherInfo({
              city: detectedCity,
              temp: `${temp}°C`,
              condition: temp > 18 ? 'Plăcut' : 'Răcoros'
            });
          }
        })
        .catch(() => {});
    } catch (e) {}
  }, []);

  // Simulator Kiosk Interactiv
  const [simMode, setSimMode] = useState('intrare'); // 'intrare' | 'iesire'
  const [simScanning, setSimScanning] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simCountdown, setSimCountdown] = useState(15);
  const [simEmpIndex, setSimEmpIndex] = useState(0);

  const simEmployees = [
    { name: 'Elena Rusu', role: 'Manager Sală', id: 'RO-1102', img: '/media/emp-elena.jpg' },
    { name: 'Andrei Popescu', role: 'Bucătar Șef', id: 'RO-4011', img: '/media/emp-andrei.jpg' },
    { name: 'Ioan Mihai', role: 'Barman', id: 'RO-1378', img: '/media/emp-ioan.jpg' },
    { name: 'Maria Ionescu', role: 'Ospătar Principal', id: 'RO-1456', img: '/media/emp-maria.jpg' }
  ];

  useEffect(() => {
    const iv = setInterval(() => {
      setSimCountdown(prev => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleSimulateScan = () => {
    if (simScanning) return;
    setSimScanning(true);
    setSimResult(null);
    setTimeout(() => {
      setSimResult(simEmployees[simEmpIndex]);
      setSimScanning(false);
      setSimEmpIndex(prev => (prev + 1) % simEmployees.length);
    }, 1200);
  };

  const handleResetSim = () => {
    setSimResult(null);
    setSimScanning(false);
  };

  // Tabloul de Bord - Switcher Tab-uri Reale
  const [activeDashboardTab, setActiveDashboardTab] = useState('presences');
  const dashboardTabs = [
    { id: 'presences', label: 'Prezențe Live & Foto', img: '/ro_dash_presences.png' },
    { id: 'reports', label: 'Condică ITM & SAGA', img: '/ro_dash_reports.png' },
    { id: 'overview', label: 'Panou General', img: '/ro_dash_overview.png' }
  ];

  // Video Player State
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsVideoMuted(videoRef.current.muted);
  };


  const cuiDebounceTimer = useRef(null);
  const [isPersonalAccount, setIsPersonalAccount] = useState(false);

  // Căutare CUI ANAF cu Debounce de 350ms
  const handleCuiChange = (e) => {
    const val = e.target.value;
    setSubForm(prev => ({ ...prev, cui: val }));
    const digitsOnly = val.replace(/[^0-9]/g, '');

    if (cuiDebounceTimer.current) {
      clearTimeout(cuiDebounceTimer.current);
    }

    if (!digitsOnly) {
      setCompanyVerified(null);
      setCuiError(null);
      setCuiLoading(false);
      return;
    }

    if (digitsOnly.length < 6) {
      setCompanyVerified(null);
      setCuiError(null);
      setCuiLoading(false);
      return;
    }

    setCuiLoading(true);
    setCuiError(null);

    cuiDebounceTimer.current = setTimeout(() => {
      handleAutoCuiSearch(digitsOnly);
    }, 350);
  };

  const handleAutoCuiSearch = async (cuiDigits) => {
    setCuiLoading(true);
    setCuiError(null);
    try {
      const res = await fetch(apiUrl(`/api/company/lookup?cui=${cuiDigits}`));
      const data = await res.json();
      if (data.success && data.found && data.company) {
        setSubForm(prev => ({ 
          ...prev, 
          companyName: data.company.name || prev.companyName,
          address: data.company.address || prev.address,
          city: data.company.city || prev.city,
          county: data.company.county || prev.county,
          regCom: data.company.regCom || prev.regCom,
          anafPhone: data.company.phone || '',
          phone: prev.phone || ''
        }));
        setCompanyVerified(data.company);
        setCuiError(null);
        trackEvent('cui_search', { cui: cuiDigits, company: data.company.name });
      } else {
        setCompanyVerified(null);
        setCuiError(`Codul fiscal "${cuiDigits}" nu a fost găsit în ANAF. Verifică cifrele sau completează manual.`);
      }
    } catch (e) {
      console.warn('ANAF search warning:', e);
      setCompanyVerified(null);
      setCuiError('Serviciul ANAF întâmpină o mică întârziere. Poți completa datele manual.');
    } finally {
      setCuiLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingForm(true);

    try {
      const res = await fetch(apiUrl('/api/auth/demo-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: subForm.contactName,
          email: subForm.email,
          password: subForm.password,
          companyName: isPersonalAccount
            ? (subForm.companyName || subForm.contactName || 'Cont Personal')
            : (companyVerified?.name || subForm.companyName),
          phone: subForm.phone,
          anafPhone: subForm.anafPhone || companyVerified?.phone || '',
          cui: isPersonalAccount ? '' : subForm.cui,
          address: subForm.address || companyVerified?.address || '',
          city: subForm.city || companyVerified?.city || '',
          county: subForm.county || companyVerified?.county || '',
          employeesCount: subForm.employeesCount,
          planName: selectedPlan.name,
          planPrice: selectedPlan.price.replace(/[^0-9.]/g, ''),
          mode: modalMode,
          termsAccepted: acceptTerms,
          dpaAccepted: acceptDpa
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Nu suprascriem sesiunea SuperAdmin pe domeniul principal!
        const existingUserStr = localStorage.getItem('user');
        let isExistingSuper = false;
        try {
          const eu = JSON.parse(existingUserStr);
          isExistingSuper = eu && (eu.role === 'SUPERADMIN' || eu.role === 'Super Admin');
        } catch {}

        if (!isExistingSuper && data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data.tempPassword) {
          setAssignedTempPassword(data.tempPassword);
        }
        if (data.subdomain) {
          setCreatedSubdomain(data.subdomain);
        }
        trackEvent('demo_submitted', {
          plan: selectedPlan.name,
          cui: subForm.cui,
          company: subForm.companyName || companyVerified?.name
        });
      }
    } catch (err) {
      console.warn('Eroare apel demo-request API:', err);
    } finally {
      setIsSubmittingForm(false);
      setSubSubmitted(true);
    }
  };

  useEffect(() => {
    document.title = 'Pontaj.app — Pontaj QR Dinamic pe Orice Ecran';
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden w-full">
      {/* 1. Header de Navigație Simplificat */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs overflow-hidden w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <QrCode size={18} strokeWidth={2.4} />
            </div>
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
              Pontaj<span className="text-blue-600">.app</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600">
            <a href="#video" className="px-3.5 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Prezentare Video
            </a>
            <a href="#simulator" className="px-3.5 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Simulator Kiosk
            </a>
            <a href="#dashboard" className="px-3.5 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Panou Live &amp; SAGA
            </a>
            <a href="#tarife" className="px-3.5 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Tarife
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:0757777712"
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              <Phone size={13} className="text-blue-600" />
              <span>0757 77 77 12</span>
            </a>
            <Link
              to="/admin/login"
              className="hidden sm:flex text-xs font-bold text-slate-600 hover:text-slate-900 px-3 h-9 rounded-full hover:bg-slate-100 transition-colors items-center whitespace-nowrap shrink-0"
            >
              Autentificare
            </Link>
            <button
              type="button"
              onClick={() => openPlanModal('standard', 'demo')}
              className="px-3.5 sm:px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Activează Demo (15 Zile)</span>
              <span className="sm:hidden">Cont Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO PRINCIPAL: IMPACT VIZUAL + BENEFICII CLARE */}
      <section id="hero" className="pt-6 sm:pt-10 pb-12 sm:pb-16 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200 overflow-hidden w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Stânga: Text + CTAs + Beneficii rapide */}
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-blue-600 whitespace-nowrap shrink-0">
                <ShieldCheck size={14} className="text-blue-600" />
                <span>100% Conform Art. 119 Codul Muncii</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Pontaj cu <span className="text-blue-600">QR Dinamic</span>.<br />Intrare și ieșire sub 1 secundă.
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                Pui o tabletă sau un ecran pe perete. Salariații scanează codul QR cu telefonul — codul se schimbă la 15 secunde, deci <strong>nu poate fi trimis colegilor</strong>. Condica ITM și exportul SAGA se fac automat.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => openPlanModal('standard', 'demo')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Sparkles size={16} />
                  <span>Testează Gratuit 15 Zile</span>
                </button>

                <a
                  href="#tarife"
                  className="w-full sm:w-auto px-5 py-3.5 border border-slate-300 hover:border-blue-600 hover:text-blue-600 text-slate-700 text-sm font-bold rounded-full bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  <CreditCard size={16} className="text-blue-600" />
                  <span>Vezi Grila de Tarife</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-semibold text-slate-600 pt-2">
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>Fără card bancar</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>Gata în 5 minute</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>Export 1-Click SAGA</span>
                </div>
              </div>
            </div>

            {/* Dreapta: Fotografie Scanare Kiosk Centrată pe Mobile */}
            <div className="lg:col-span-6 flex justify-center w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-950 aspect-[4/3] w-full max-w-lg lg:max-w-none group mx-auto">
                <img
                  src="/media/hero-scan.jpg"
                  alt="Angajată scanează codul QR dinamic de pe tabletă"
                  className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
                />

                {/* Badge Plutitor Dreapta Sus */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-slate-900/90 text-white backdrop-blur-md rounded-2xl border border-white/20 px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="text-left">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-blue-300 font-bold whitespace-nowrap shrink-0">QR Dinamic</p>
                    <p className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap shrink-0">Se schimbă la 15s</p>
                  </div>
                </div>

                {/* Card Plutitor Stânga Jos: Elena Rusu Intrare Validată */}
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2 sm:p-3 flex items-center gap-2.5 sm:gap-3 max-w-[220px] sm:max-w-[270px]">
                  <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 sm:ring-3 ring-emerald-500 shrink-0">
                    <img
                      src="/media/emp-elena.jpg"
                      alt="Poză profil Elena Rusu"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-wide whitespace-nowrap shrink-0">Intrare Înregistrată</p>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Bine ai venit, Elena!</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 whitespace-nowrap shrink-0">08:00:15 • Kiosk Intrare</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SECȚIUNE VIDEO PREZENTARE — DARK LUXURY (#video) */}
      <section id="video" className="py-20 bg-[#0b1220] text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-3 border border-blue-500/20 whitespace-nowrap shrink-0">
              <Play size={13} className="text-blue-400" />
              <span>Video Prezentare Oficial</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-3">
              Vezi pontajul real în 8 secunde
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Salariatul intră, scanează codul QR dinamic de pe tabletă cu telefonul și ecranul confirmă instant pontajul cu poza lui.
            </p>
          </div>

          {/* Player Video 16:9 Mare */}
          <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/40 ring-1 ring-white/10 bg-slate-900 max-w-5xl mx-auto group">
            <video
              ref={videoRef}
              src="/media/qrtime-demo.mp4"
              poster="/media/qrtime-demo-poster.jpg"
              className="w-full h-full object-cover bg-black cursor-pointer"
              playsInline
              loop
              muted={isVideoMuted}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onClick={toggleVideoPlay}
            />

            {/* Buton Mare Play dacă e pe pauză */}
            {!isVideoPlaying && (
              <div
                onClick={toggleVideoPlay}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/30 to-transparent cursor-pointer group"
              >
                <button
                  type="button"
                  aria-label="Pornește video"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-2xl shadow-blue-500/50 group-hover:scale-105 transition-transform cursor-pointer"
                >
                  <Play size={36} className="text-white translate-x-1" fill="white" />
                </button>
                <div className="absolute bottom-6 left-6 text-left pointer-events-none">
                  <span className="block text-xs uppercase tracking-widest text-blue-300 font-bold whitespace-nowrap shrink-0">
                    Pontaj.app • Prezentare
                  </span>
                  <span className="block text-lg sm:text-xl font-black text-white whitespace-nowrap shrink-0">
                    Intrare în tură cu scanare QR
                  </span>
                </div>
              </div>
            )}

            {/* Controale discrete când rulează */}
            {isVideoPlaying && (
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-lg">
                  <button
                    type="button"
                    onClick={toggleVideoPlay}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
                    title="Pauză"
                  >
                    <Pause size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={toggleVideoMute}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
                    title={isVideoMuted ? "Activează Sunet" : "Oprește Sunet"}
                  >
                    {isVideoMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <span className="text-[11px] text-white/90 font-medium ml-1">
                    {isVideoMuted ? "Sunet oprit" : "Sunet activ"}
                  </span>
                </div>

                <div className="pointer-events-auto bg-black/75 backdrop-blur-md p-1.5 rounded-full border border-white/15 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current?.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
                    title="Ecran Complet"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cele 2 Carduri Mari: Scanare la Intrare & Scanare la Ieșire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-5xl mx-auto">
            {/* Card Intrare */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] group border border-white/10 shadow-xl">
              <img
                src="/media/kiosk-welcome.jpg"
                alt="Scanare la intrare"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shrink-0 shadow-md">
                  <LogIn size={13} />
                  <span>SCANARE LA INTRARE</span>
                </span>
              </div>
              <div className="absolute bottom-0 p-6 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Începe tura</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-md">
                  Un ecran la intrare. Salariatul scanează cu telefonul, iar ora exactă de începere se salvează instantaneu în condica ITM.
                </p>
              </div>
            </div>

            {/* Card Ieșire */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] group border border-white/10 shadow-xl">
              <img
                src="/media/exit-scan.jpg"
                alt="Scanare la ieșire"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shrink-0 shadow-md">
                  <LogOut size={13} />
                  <span>SCANARE LA IEȘIRE</span>
                </span>
              </div>
              <div className="absolute bottom-0 p-6 text-left">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">Termină tura</h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-md">
                  Un ecran la ieșire. La final de program scanează din nou și orele lucrate se calculează automat, pregătite pentru SAGA.
                </p>
              </div>
            </div>
          </div>

          {/* Banner Anti-fraudă */}
          <div className="mt-8 flex items-center justify-center gap-3 text-slate-300 text-xs sm:text-sm bg-white/5 rounded-2xl px-6 py-3.5 ring-1 ring-white/10 max-w-3xl mx-auto text-center">
            <ShieldCheck size={20} className="text-blue-400 shrink-0" />
            <span>
              <strong className="text-white">QR dinamic anti-fraudă:</strong> codul se schimbă la fiecare 15 secunde — o captură de ecran trimisă pe WhatsApp nu funcționează.
            </span>
          </div>

        </div>
      </section>

      {/* 4. SECȚIUNE SIMULATOR LIVE INTERACTIV (#simulator) */}
      <section id="simulator" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-blue-600 mb-3 whitespace-nowrap shrink-0">
            <RotateCcw size={13} className="text-blue-600" />
            <span>Demonstrație Live Interactivă</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Testează Kiosk-ul Live Chiar Acum
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mb-8">
            Apasă „Simulează Scanare” pentru a vedea exact ce apare pe ecranul tabletei când un salariat scanează.
          </p>

          {/* Rama Tabletei Kiosk */}
          <div className="max-w-md mx-auto bg-slate-900 rounded-3xl p-3 shadow-2xl border-2 border-slate-800 text-left">
            {/* Bara de sus a tabletei */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <QrCode size={16} />
                </div>
                <span className="text-white font-bold text-xs">Pontaj.app Kiosk</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>

            {/* Ecranul Kiosk-ului */}
            <div className="bg-white rounded-2xl overflow-hidden p-4 text-center">
              {/* Selector Intrare / Ieșire */}
              <div className="flex bg-slate-100 p-1 rounded-full mb-4 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setSimMode('intrare'); handleResetSim(); }}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    simMode === 'intrare'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn size={13} />
                  <span>INTRARE</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSimMode('iesire'); handleResetSim(); }}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    simMode === 'iesire'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogOut size={13} />
                  <span>IEȘIRE</span>
                </button>
              </div>

              {!simResult ? (
                <div>
                  {/* Ceas digital live */}
                  <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-1">
                    <Clock size={13} />
                    <span>ORA LIVE</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mb-4">
                    {timeFormatted}
                  </div>

                  {/* QR Code cu animație laser */}
                  <div className="relative w-44 h-44 mx-auto mb-4 p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                    <QRCodeSVG
                      value={`https://qr.pontaj.app/scan?kiosk=demo&mode=${simMode}&t=${simCountdown}`}
                      size={144}
                      level="M"
                      includeMargin={false}
                    />

                    {/* Laser Scanner Sweep Animation */}
                    {simScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                        <div className="w-36 h-36 border-2 border-emerald-500 rounded-xl animate-pulse" />
                        <div className="absolute left-2 right-2 h-0.5 bg-emerald-500 shadow-md shadow-emerald-500/50 animate-bounce" />
                      </div>
                    )}
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-[11px] text-slate-500">Reîmprospătare QR</span>
                    <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                        style={{ width: `${(simCountdown / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-blue-600">{simCountdown}s</span>
                  </div>

                  {/* Buton Simulează Scanare */}
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    disabled={simScanning}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {simScanning ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Se scanează codul...</span>
                      </>
                    ) : (
                      <>
                        <span>Simulează Scanare</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Card Confirmare Scanare Reușită */
                <div className="py-2">
                  <div className="relative w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden ring-4 ring-emerald-500 shadow-xl">
                    <img
                      src={simResult.img}
                      alt={simResult.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    {simMode === 'intrare' ? 'Bine ai venit,' : 'La revedere,'} {simResult.name}!
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {simResult.role} • ID: {simResult.id}
                  </p>

                  <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                    simMode === 'intrare'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <UserCheck size={14} />
                    <span>{simMode === 'intrare' ? 'Intrare' : 'Ieșire'} înregistrată la {timeFormatted}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSim}
                    className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw size={13} />
                    <span>Scanare Nouă (Alt Angajat)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Salariați de Test */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Salariați de test:</span>
            {simEmployees.map((emp, idx) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => {
                  setSimEmpIndex(idx);
                  setSimResult(emp);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 rounded-full text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <img src={emp.img} alt={emp.name} className="w-4 h-4 rounded-full object-cover" />
                <span>{emp.name}</span>
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* 5. SECȚIUNE DEDICATĂ: PANOU ADMIN & RAPOARTE SAGA (#dashboard) */}
      <section id="dashboard" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-3 border border-blue-200 whitespace-nowrap shrink-0">
              <FileSpreadsheet size={14} className="text-blue-600" />
              <span>Panou de Control &amp; Analitică în Timp Real</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tablou de Bord &amp; Evidență Live per Punct de Lucru
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
              Urmărești prezențele cu poză la scanare și generezi rapoartele oficiale pentru ITM și fișierul XML pentru SAGA.
            </p>
          </div>

          <div className="space-y-4">
            {/* Switcher Tab-uri Reale */}
            <div className="max-w-md mx-auto bg-slate-100 p-1 rounded-full border border-slate-200 flex gap-1">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDashboardTab(tab.id)}
                  className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    activeDashboardTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Fereastră Browser Mare, Centrată și Elegantă */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="px-3 py-0.5 rounded-full bg-white text-[11px] font-semibold text-slate-500 border border-slate-200">
                  app.pontaj.app/admin/timesheets
                </div>
                <div className="w-8" />
              </div>

              <div className="p-2 sm:p-4 bg-slate-50">
                <img
                  src={dashboardTabs.find(t => t.id === activeDashboardTab)?.img || '/ro_dash_presences.png'}
                  alt="Panou de pontaj"
                  className="w-full h-auto rounded-xl shadow-xs border border-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECȚIUNE: 3 AVANTAJE RAPIDE — ZERO TEXT INUTIL */}
      <section id="ecrane" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Orice Ecran */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Tv size={20} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                Deschizi pe Orice Ecran
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tabletă iPad, Android, Smart TV pe perete sau laptop vechi. Fără să cumperi aparate speciale.
              </p>
            </div>

            {/* Card 2: QR Dinamic & Poză */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <RefreshCw size={20} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                Cod QR Dinamic la 5s & Poză
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Codul se schimbă continuu. Nu poate fi trimis pe WhatsApp, iar la scanare apare poza angajatului.
              </p>
            </div>

            {/* Card 3: ITM & SAGA */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">
                Condică ITM & Export SAGA
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calcul automat pentru ore de noapte și weekend. Fișier XML gata de import în modulul de salarii.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECȚIUNE TARIF & CONVERSIE DIRECTĂ (#tarife) */}
      <section id="tarife" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-3 border border-blue-200 whitespace-nowrap shrink-0">
              <CreditCard size={14} className="text-blue-600" />
              <span>Grilă Tarifară Clară &amp; Transparentă</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Tarife Simple, Adaptate la Mărimea Echipei Tale
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Fără contracte blocate, fără costuri ascunse și fără aparate scumpe de pontaj. Plătești doar pentru salariații activi, cu reduceri automate de volum pe măsură ce firma crește.
            </p>
          </div>

          {/* Grilă 2 Nivele Simple de Preț */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8 items-stretch">
            
            {/* Tier 1: 1 - 50 angajați */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition-all p-7 sm:p-8 flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Standard</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                    1 – 50 salariați
                  </span>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-slate-400 line-through decoration-rose-500/70 decoration-2 whitespace-nowrap shrink-0">
                      6.00 €
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight whitespace-nowrap shrink-0">5.00 €</span>
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">/ angajat / lună</span>
                  </div>
                  <div className="mt-2.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                    <span>Minim 50 € / lună / firmă</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Include până la 10 angajați în tariful minim de 50 €/lună.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-5 mb-6">
                  <p className="text-xs font-bold text-slate-800 mb-3">Ce include abonamentul:</p>
                  <ul className="space-y-3 text-xs text-slate-600 font-medium">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Terminale Kiosk nelimitate pe tablete / TV / PC</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Cod QR dinamic anti-fraudă la fiecare 15 secunde</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Condică ITM automată conform Art. 119 Codul Muncii</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Export 1-Click în SAGA Salarii și Excel</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Calcul automat ore de noapte și weekend</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => openPlanModal('standard', 'demo')}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
                >
                  <Sparkles size={14} />
                  <span>Testează Gratuit 15 Zile</span>
                </button>
              </div>
            </div>

            {/* Tier 2: 51+ angajați (Cel Mai Popular) */}
            <div className="bg-gradient-to-b from-white to-blue-50/40 rounded-2xl border-2 border-blue-600 shadow-xl relative p-7 sm:p-8 flex flex-col justify-between md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 shadow-sm">
                Cel Mai Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Echipe În Creștere</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                    51+ salariați
                  </span>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-blue-300 line-through decoration-rose-500/70 decoration-2 whitespace-nowrap shrink-0">
                      5.00 €
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight whitespace-nowrap shrink-0">4.00 €</span>
                    <span className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">/ angajat / lună</span>
                  </div>
                  <div className="mt-2.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                    <span>Economisești 20% din tarif</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Se aplică automat pentru toți salariații odată ce depășești 50 de angajați.
                  </p>
                </div>

                <div className="border-t border-blue-100 pt-5 mb-6">
                  <p className="text-xs font-bold text-slate-800 mb-3">Tot din pachetul Standard, plus:</p>
                  <ul className="space-y-3 text-xs text-slate-700 font-medium">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Terminale Kiosk nelimitate pe puncte de lucru / secții</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Coduri QR dinamice + geolocație GPS opțională</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Condică ITM și export automat SAGA Salarii</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Asistență prioritară la configurare și import inițial</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Calcul avansat ture și schimburi de noapte</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Onboarding dedicat & asistență tehnică prioritară</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => openPlanModal('pro', 'demo')}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles size={14} />
                  <span>Testează Gratuit 15 Zile</span>
                </button>
              </div>
            </div>

          </div>

          {/* Banner Corporate 150+ salariați */}
          <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5 border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-white">Echipă de peste 150 de angajați sau locații multiple?</span>
                  <span className="text-[11px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                    Tarif preferențial negociabil
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Beneficiezi de tarif preferențial negociabil, SLA garantat, server dedicat la cerere și asistență tehnică prioritară.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openPlanModal('enterprise', 'subscribe')}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 shadow-md cursor-pointer hover:scale-105"
            >
              Cere Ofertă Personalizată
            </button>
          </div>

          {/* Banner Recapitulativ Garanții & Condiții */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  15 Zile de Test Complet Gratuit pe Datele Reale ale Firmei
                </div>
                <div className="text-[11px] text-slate-500">
                  Fără card bancar solicitat la înregistrare &bull; Fără contracte pe perioadă minimă &bull; Anulezi oricând la un simplu click
                </div>
              </div>
            </div>
            <a
              href="tel:0757777712"
              className="px-4 py-2 border border-slate-200 hover:border-blue-600 hover:text-blue-600 rounded-full text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Phone size={13} className="text-blue-600" />
              <span>Întrebări? 0757 77 77 12</span>
            </a>
          </div>

          {/* Mențiune Clarificare Hardware / Suport */}
          <div className="max-w-4xl mx-auto p-4 bg-slate-100/90 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left text-xs text-slate-600 leading-relaxed shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Tablet size={16} />
            </div>
            <div>
              <strong className="text-slate-900 font-bold">Important privind echipamentele:</strong> Tableta și/sau suportul digital nu sunt oferite de către noi și sunt exclusiv în responsabilitatea clientului. Pontaj.app este un serviciu 100% digital (software în cloud) care rulează direct din browser pe orice tabletă, telefon sau Smart TV pe care îl dețineți deja în firmă.
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer Curat */}
      <footer className="py-10 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              QR
            </div>
            <span className="font-bold text-white text-sm">Pontaj.app</span>
            <span>• Pontaj Electronic QR pe Orice Ecran</span>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <Link to="/contabil" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors whitespace-nowrap shrink-0">
              Portal Contabili (SAGA)
            </Link>
            <a href="tel:0757777712" className="hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <Phone size={13} className="text-blue-400" />
              <span>0757 77 77 12</span>
            </a>
            <Link to="/login" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Autentificare Admin
            </Link>
          </div>
        </div>
      </footer>

      {/* MODAL SOLICITARE DEMO 15 ZILE / ABONAMENT CU CĂUTARE AUTOMATĂ CUI ANAF */}
      {isSubscribeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {modalMode === 'demo' ? 'Activează Cont Demo Gratuit' : 'Abonament Pontaj.app'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">15 zile test gratuit complet &bull; Fără card bancar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubscribeModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {!subSubmitted ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Badge Pachet Selectat */}
                  <div className="p-3 bg-blue-50/90 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                        <CheckCircle2 size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-wider">Pachet Selectat:</span>
                        <strong className="text-blue-950 font-black text-xs truncate block">{selectedPlan.name}</strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-blue-700 whitespace-nowrap">{selectedPlan.price}</span>
                      <span className="text-[10px] text-slate-500 block whitespace-nowrap">
                        {selectedPlan.id === 'enterprise' ? 'ofertă dedicată' : '/ angajat / lună'}
                      </span>
                    </div>
                  </div>

                  {/* Selector Tip Cont: Firmă (cu CUI) vs Persoană Fizică */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPersonalAccount(false);
                        setCuiError(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-full transition-all text-center whitespace-nowrap shrink-0 cursor-pointer ${
                        !isPersonalAccount 
                          ? 'bg-white text-blue-700 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Persoană Juridică (CUI)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPersonalAccount(true);
                        setCompanyVerified(null);
                        setCuiError(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-full transition-all text-center whitespace-nowrap shrink-0 cursor-pointer ${
                        isPersonalAccount 
                          ? 'bg-white text-blue-700 shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Persoană Fizică / Echipă
                    </button>
                  </div>

                  {/* CUI ANAF Input (Doar dacă nu e persoană fizică) */}
                  {!isPersonalAccount ? (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                        <span>Cod Fiscal (CUI / CIF) *</span>
                        {cuiLoading && (
                          <span className="text-[10.5px] text-blue-600 font-bold flex items-center gap-1 whitespace-nowrap shrink-0">
                            <RefreshCw size={11} className="animate-spin" /> Verificare ANAF...
                          </span>
                        )}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          required={!isPersonalAccount}
                          value={subForm.cui}
                          onChange={handleCuiChange}
                          onBlur={() => {
                            const digitsOnly = (subForm.cui || '').replace(/\D/g, '');
                            if (digitsOnly.length >= 6 && digitsOnly.length <= 10 && !companyVerified) {
                              handleAutoCuiSearch(digitsOnly);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const digitsOnly = (subForm.cui || '').replace(/\D/g, '');
                              if (digitsOnly.length >= 6) {
                                handleAutoCuiSearch(digitsOnly);
                              }
                            }
                          }}
                          placeholder="Ex: 42322117 sau RO42322117..."
                          className="w-full pl-4 pr-24 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs font-semibold"
                        />
                        <button
                          type="button"
                          disabled={cuiLoading}
                          onClick={() => {
                            const digitsOnly = (subForm.cui || '').replace(/\D/g, '');
                            if (digitsOnly.length >= 6) {
                              handleAutoCuiSearch(digitsOnly);
                            } else {
                              setCuiError('Introdu minim 6 cifre pentru căutare CUI.');
                            }
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                        >
                          {cuiLoading ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />}
                          <span>Caută</span>
                        </button>
                      </div>

                      {/* Notificare CUI Eronat / Negăsit în ANAF */}
                      {cuiError && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2 animate-fade-in shadow-2xs">
                          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{cuiError}</span>
                        </div>
                      )}

                      {/* Badge Verde Confirmare ANAF */}
                      {companyVerified && (
                        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex items-center justify-between gap-2 animate-fade-in shadow-2xs">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-950 truncate">
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            <span className="truncate">Date completate automat din ANAF</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap shrink-0 border border-emerald-200">
                            {companyVerified.isVatPayer ? 'Plătitor TVA' : 'Neplătitor TVA'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-snug">
                      <strong className="block font-bold mb-0.5">Mod Persoană Fizică / Echipă activat</strong>
                      Nu este necesar CUI. Poți testa platforma pentru echipa ta sau activitatea ta independentă.
                    </div>
                  )}

                  {/* Nume Companie / Echipă — ÎNTOTDEAUNA VIZIBIL ȘI COMPLETAT AUTOMAT */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                      <span>{isPersonalAccount ? 'Numele Tău sau al Echipei *' : 'Nume Companie *'}</span>
                      {companyVerified && (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <Check size={11} /> extras din ANAF
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      value={subForm.companyName}
                      onChange={(e) => setSubForm(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder={isPersonalAccount ? "Ex: Echipa Andrei sau Nume Prenume..." : "Numele firmei..."}
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>

                  {/* Sediu Social / Adresă Firmă — ÎNTOTDEAUNA VIZIBIL ȘI COMPLETAT AUTOMAT */}
                  {!isPersonalAccount && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                        <span>Sediu Social / Adresă Firmă</span>
                        {companyVerified?.address && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <Check size={11} /> extras din ANAF
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={subForm.address}
                          onChange={(e) => setSubForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Adresă sediu social..."
                          className="w-full pl-9 pr-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs text-slate-800 bg-white"
                        />
                        <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Număr Estimativ Salariați */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                      <span>{isPersonalAccount ? 'Număr Persoane în Echipă *' : 'Număr Salariați în Firmă *'}</span>
                      <span className="text-[11px] text-blue-600 font-semibold lowercase">pentru pontaj</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        required
                        value={subForm.employeesCount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubForm(prev => ({ ...prev, employeesCount: val }));
                          const count = parseInt(val, 10);
                          if (!isNaN(count)) {
                            if (count >= 150) {
                              setSelectedPlan({ id: 'enterprise', name: 'Corporate (150+ salariați)', price: 'Negociabil', defaultSeats: 160 });
                            } else if (count > 50) {
                              setSelectedPlan({ id: 'pro', name: 'Echipe Mari (51+ salariați)', price: '4.00 €', defaultSeats: 65 });
                            } else {
                              setSelectedPlan({ id: 'standard', name: 'Standard (1 – 50 salariați)', price: '5.00 €', defaultSeats: 15 });
                            }
                          }
                        }}
                        placeholder="Ex: 15, 30, 60..."
                        className="w-full pl-9 pr-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs font-black text-slate-900"
                      />
                      <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Nume Contact & Telefon — Vertical pe Mobil, Grid pe Desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block whitespace-nowrap">
                        Nume Contact *
                      </label>
                      <input
                        type="text"
                        required
                        value={subForm.contactName}
                        onChange={(e) => setSubForm(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Numele dvs...."
                        className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block whitespace-nowrap">
                        Telefon Mobil *
                      </label>
                      <input
                        type="tel"
                        required
                        value={subForm.phone}
                        onChange={(e) => setSubForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="07xxxxxxxx..."
                        className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Email Oficial (Username de conectare) */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                      <span>Email Conectare *</span>
                      <span className="text-[10px] text-blue-600 font-semibold lowercase">pentru login în panou</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={subForm.email}
                      onChange={(e) => setSubForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="adresa.ta@email.ro..."
                      className="w-full px-4 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs"
                    />
                  </div>

                  {/* Parola aleasă de utilizator */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                      <span>Alege Parola de Acces *</span>
                      <span className="text-[10px] text-slate-400 font-semibold">minim 6 caractere</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={subForm.password}
                        onChange={(e) => setSubForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Alege parola ta sigură..."
                        className="w-full pl-9 pr-10 h-10 text-sm rounded-full border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs"
                      />
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showPassword ? "Ascunde parola" : "Afișează parola"}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Acord Legal Compact & Conformitate GDPR Art. 28 */}
                  <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 text-left shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                        <span>Conformitate Legală &bull; GDPR Art. 28</span>
                      </div>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border border-emerald-200">
                        Pistă Audit
                      </span>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                      <input
                        type="checkbox"
                        required
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked);
                          setAcceptDpa(e.target.checked);
                        }}
                        className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0 cursor-pointer"
                      />
                      <span className="leading-snug text-xs">
                        Sunt de acord cu{' '}
                        <button type="button" onClick={() => setLegalModalType('terms')} className="text-blue-600 underline font-semibold cursor-pointer">
                          Termenii de Utilizare
                        </button>
                        ,{' '}
                        <button type="button" onClick={() => setLegalModalType('privacy')} className="text-blue-600 underline font-semibold cursor-pointer">
                          Politica de Confidențialitate
                        </button>{' '}
                        și acordul{' '}
                        <button type="button" onClick={() => setLegalModalType('dpa')} className="text-blue-600 underline font-bold cursor-pointer">
                          DPA (GDPR Art. 28)
                        </button>
                        .
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 mt-2 disabled:opacity-50"
                  >
                    {isSubmittingForm ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Se configurează contul demo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Activează Contul Demo (15 Zile Gratuit)</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center leading-tight">
                    * Fără card bancar. Aplicație cloud compatibilă cu orice tabletă, ecran Smart TV sau telefon mobil.
                  </p>
                </form>
              ) : (
                <div className="text-center py-5 space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Contul Demo a Fost Activat!</h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                      Instanța pentru <strong className="text-slate-800">{subForm.companyName}</strong> ({subForm.employeesCount} salariați) este gata. Ai acces complet 15 zile gratuit.
                    </p>
                  </div>
                  
                  {/* Card Date Oficiale Conectare */}
                  <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs text-slate-800 max-w-sm mx-auto text-left space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/80">
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">
                        Datele tale de acces
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0">
                        15 Zile Gratuit
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Username / Email */}
                      <div className="flex items-center justify-between gap-2 bg-white/95 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <div className="min-w-0">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Username (Email Conectare)</span>
                          <span className="font-bold text-slate-900 truncate block">{subForm.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(subForm.email, 'email')}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Copiază email"
                        >
                          {copiedField === 'email' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Parolă */}
                      <div className="flex items-center justify-between gap-2 bg-white/95 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <div className="min-w-0">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">Parolă de acces</span>
                          <span className="font-bold text-blue-700 tracking-wide text-sm block">
                            {showSuccessPassword ? (subForm.password || assignedTempPassword) : '••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowSuccessPassword(!showSuccessPassword)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-lg transition-colors cursor-pointer"
                            title={showSuccessPassword ? "Ascunde parola" : "Afișează parola"}
                          >
                            {showSuccessPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(subForm.password || assignedTempPassword, 'pass')}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Copiază parola"
                          >
                            {copiedField === 'pass' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Link Panou Dedicat */}
                      {createdSubdomain && (
                        <div className="flex items-center justify-between gap-2 bg-white/95 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                          <div className="min-w-0">
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Link Panou Companie</span>
                            <a 
                              href={`https://${createdSubdomain}.qr.pontaj.app/admin`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="font-bold text-blue-600 hover:underline block truncate text-xs"
                            >
                              https://{createdSubdomain}.qr.pontaj.app/admin
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`https://${createdSubdomain}.qr.pontaj.app/admin`, 'link')}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Copiază link"
                          >
                            {copiedField === 'link' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-emerald-800 pt-1.5 border-t border-emerald-200/80 leading-snug">
                      Ți-am trimis automat aceste date de conectare pe emailul <strong className="text-emerald-950">{subForm.email}</strong>. Verifică și folderul Spam/Promoții dacă nu apare în Inbox în 1 minut.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubscribeModalOpen(false);
                        if (createdSubdomain) {
                          window.location.href = `https://${createdSubdomain}.qr.pontaj.app/admin/dashboard`;
                        } else {
                          navigate('/admin/dashboard');
                        }
                      }}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Sparkles size={15} />
                      <span>Intră Direct în Panoul de Control &rarr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubscribeModalOpen(false);
                        navigate(`/admin/login?email=${encodeURIComponent(subForm.email)}`);
                      }}
                      className="w-full h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all flex items-center justify-center cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>Pagina de Autentificare</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INFORMAȚII LEGALE / DPA / TERMENI / CONFIDENȚIALITATE */}
      {legalModalType && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in text-left select-none"
          onClick={() => setLegalModalType(null)}
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {legalModalType === 'dpa' && 'Acord de Prelucrare a Datelor (DPA - Art. 28 GDPR)'}
                    {legalModalType === 'terms' && 'Termeni și Condiții de Utilizare SaaS (Pontaj.app)'}
                    {legalModalType === 'privacy' && 'Politica de Confidențialitate & Protecția Datelor'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {legalModalType === 'dpa' && 'Regulamentul (UE) 2016/679 • Relația Operator - Persoană Împuternicită'}
                    {legalModalType === 'terms' && 'Condiții aplicabile perioadei de probă de 15 zile și abonamentului'}
                    {legalModalType === 'privacy' && 'Transparență totală privind securitatea și confidențialitatea datelor'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Corp Modal Scrollabil */}
            <div className="p-6 overflow-y-auto text-xs text-slate-600 space-y-4 leading-relaxed">
              {legalModalType === 'dpa' && (
                <>
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs text-blue-900">
                      <Lock size={14} className="text-blue-600 shrink-0" />
                      <span>Calitatea Părților & Valoare de Precontract Electronic</span>
                    </div>
                    <p className="text-[11.5px] text-blue-900/90 leading-relaxed">
                      Prezentul Acord (DPA) este încheiat în mod valabil prin mijloace electronice la crearea contului, conform <strong>Art. 28 alin. (9) din GDPR</strong> și <strong>Legii 365/2002</strong>. Compania înregistrată are calitatea de <strong>Operator de Date</strong>, iar Pontaj.app are calitatea de <strong>Persoană Împuternicită</strong>.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      1. Obiectul și scopul prelucrării
                    </h4>
                    <p>
                      Persoana Împuternicită prelucrează datele cu caracter personal ale salariaților Operatorului exclusiv în scopul furnizării serviciului software SaaS de pontaj digital QR dinamic, monitorizare conform Art. 119 din Codul Muncii, generare a condicii de prezență și export în formatele SAGA Salarii / Excel.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      2. Categoriile de date și garanția „Zero Biometrie Invazivă”
                    </h4>
                    <p>
                      Datele prelucrate includ: nume, prenume, identificator salariat, ore intrare/ieșire, pauze, fotografii de confirmare la terminalul Kiosk (cu rol strict de audit vizual antifraudă, fără extragere de vectori biometrici faciali conform Art. 9 GDPR) și geolocație GPS (opțională, exclusiv la scanare mobilă).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      3. Securitate, criptare și localizare exclusivă în UE
                    </h4>
                    <p>
                      Toate datele sunt transmise criptat (TLS 1.3 / HTTPS), parolele sunt stocate ireversibil prin bcrypt, iar bazele de date sunt găzduite exclusiv pe servere din spațiul Uniunii Europene (UE/SEE), cu backup zilnic criptat și izolare strictă multi-tenant pe fiecare companie.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      4. Asistență privind drepturile salariaților (Art. 15-22 GDPR)
                    </h4>
                    <p>
                      Persoana Împuternicită pune la dispoziția Operatorului instrumentele tehnice necesare pentru a răspunde cererilor salariaților privind accesul, rectificarea sau ștergerea datelor din condica de pontaj.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      5. Ștergerea datelor la încetarea perioadei de probă / utilizare
                    </h4>
                    <p>
                      În cazul în care contul demonstrativ de 15 zile nu este convertit într-un abonament comercial activ, datele introduse de către Operator sunt șterse definitiv și ireversibil din sistemele active în termen de maximum 30 de zile.
                    </p>
                  </div>
                </>
              )}

              {legalModalType === 'terms' && (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      1. Perioada de probă gratuită (15 Zile)
                    </h4>
                    <p>
                      Accesul demonstrativ la platforma Pontaj.app este oferit gratuit timp de 15 zile calendaristice de la înregistrare. Nu se solicită date de card bancar la creare, iar contul nu generează costuri automate sau obligații contractuale de prelungire forțată.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      2. Disponibilitate și natură 100% Cloud
                    </h4>
                    <p>
                      Pontaj.app funcționează ca un serviciu web SaaS direct în browser. Tabletele, telefoanele sau ecranele Smart TV utilizate la sediile companiei sunt în responsabilitatea tehnică a clientului.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      3. Drepturi de proprietate intelectuală
                    </h4>
                    <p>
                      Codul sursă, algoritmii de generare QR dinamic, designul și mărcile Pontaj.app sunt proprietatea exclusivă a furnizorului. Clientul deține toate drepturile asupra datelor companiei și a înregistrărilor de pontaj generate.
                    </p>
                  </div>
                </>
              )}

              {legalModalType === 'privacy' && (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      1. Datele colectate despre reprezentantul companiei
                    </h4>
                    <p>
                      Colectăm numele de contact, numărul de telefon, adresa de email și datele fiscale oficiale (CUI ANAF) exclusiv în scopul creării instanței de lucru, comunicării tehnice și emiterii facturilor fiscale.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      2. Fără vânzare sau partajare de date
                    </h4>
                    <p>
                      Datele dvs. nu sunt înstrăinate, vândute sau utilizate în scopuri de marketing terț. Comunicațiile tranzacționale de email sunt securizate prin protocoale europene Brevo.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                      3. Date de contact responsabil GDPR
                    </h4>
                    <p>
                      Pentru orice întrebare privind protecția datelor, ne puteți contacta direct la <strong>contact@pontaj.app</strong> sau telefonic la <strong>0757 77 77 12</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap shrink-0">
                Pistă electronică de audit &bull; Pontaj.app
              </span>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                Am Înțeles și Închid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
