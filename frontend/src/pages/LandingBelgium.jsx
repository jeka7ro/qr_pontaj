import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ChevronRight, 
  X, 
  Lock, 
  FileText, 
  CreditCard,
  CheckCircle2,
  Building2,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  ShoppingBag,
  HardHat,
  Laptop,
  Calendar,
  ChevronDown,
  Globe,
  Award,
  Check,
  Smartphone,
  Tablet,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Users,
  Zap,
  Coffee,
  CheckCheck,
  Star,
  Receipt,
  Download,
  PhoneCall,
  SlidersHorizontal,
  Plane,
  Eye,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
  Search,
  Activity,
  FileCheck,
  BadgeAlert,
  HelpCircle,
  Layers,
  CheckCircle,
  Warehouse,
  Briefcase,
  Filter,
  Printer
} from 'lucide-react';
import SelfServiceSubscribeModal from '../components/SelfServiceSubscribeModal';

// Vector Flags
const FlagBE = () => (
  <svg viewBox="0 0 640 480" className="w-5 h-3.5 rounded-[3px] shadow-xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#000" d="M0 0h213.3v480H0z" />
      <path fill="#FFD90C" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#EF3340" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

const FlagFR = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#002654" d="M0 0h213.3v480H0z" />
      <path fill="#ECEFF4" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#CE1126" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

const FlagNL = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#AE1C28" d="M0 0h640v160H0z" />
      <path fill="#FFF" d="M0 160h640v160H0z" />
      <path fill="#21468B" d="M0 320h640v160H0z" />
    </g>
  </svg>
);

const FlagEN = () => (
  <svg viewBox="0 0 640 480" className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path fill="#FFF" d="m75 0 245 180L565 0h75v60L435 240l205 180v60h-75L320 300 75 480H0v-60l205-180L0 60V0h75z" />
    <path fill="#C8102E" d="m424 288 216 156v36h-48L376 312zm-208-96L0 36V0h48l216 156zm176-36 248-180v24L416 156zM224 324 0 456v-24l224-132z" />
    <path fill="#FFF" d="M256 0h128v480H256zM0 176h640v128H0z" />
    <path fill="#C8102E" d="M280 0h80v480h-80zM0 200h640v80H0z" />
  </svg>
);

const BancontactBadge = () => (
  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
    <span className="font-extrabold text-xs tracking-tighter text-[#002F6C]">Ban</span>
    <span className="font-extrabold text-xs tracking-tighter text-[#FFB612]">contact</span>
  </div>
);

// Trilingual content dictionary (100% translated for FR, NL, EN)
const CONTENT = {
  fr: {
    topTicker: "Homologué Belgique • Conforme SPF Emploi & CJUE C-55/18 • Audit Trail 2026-2027",
    navFeatures: "Fonctionnalités",
    navDashboard: "Tableau de Bord",
    navSectors: "Secteurs",
    navPricing: "Tarifs",
    navFaq: "FAQ",
    navLogin: "Connexion",
    navDemoBtn: "Demander une démo",
    navCta: "Essai gratuit 14 jours",
    
    // Hero
    heroEyebrow: "Pointeuse Digitale Officielle pour la Belgique",
    heroTitlePart1: "La pointeuse digitale intelligente par QR Code, ",
    heroTitleHighlight: "simple et 100% conforme",
    heroTitlePart2: " en Belgique.",
    heroSubtitle: "Transformez n'importe quelle tablette ou smartphone en borne de présence sécurisée. Vos collaborateurs pointent en 1 seconde à l'arrivée et au départ. Conforme aux normes du SPF Emploi, avec gestion des pauses et exports directs pour votre secrétariat social.",
    heroCtaPrimary: "Démarrer l'essai gratuit",
    heroTrust1: "Audit Trail Inaltérable 2026-2027",
    heroTrust2: "Support NISS & RGPD Europe",
    heroTrust3: "Zéro investissement matériel",
    heroFloatingStatus: "Arrivée 08:30",
    heroFloatingSubtitle: "Brasserie Grand-Place • NISS : 89.04.12-234.56",
    heroFloatingBadge: "Conforme SPF",

    // Secretariats
    secretariatsTitle: "Compatible avec 100% des secrétariats sociaux agréés en Belgique :",

    // Sectors
    sectorsBadge: "Déploiement Réel sur le Terrain",
    sectorsTitle: "Déployé dans tous les secteurs en Belgique",
    sectorsSub: "Découvrez comment nos clients à Bruxelles, Anvers, Liège et Gand optimisent leur temps de travail.",
    secHorecaTag: "HoReCa & Restauration (CP 302)",
    secHorecaName: "Restaurants & Brasseries (CP 302)",
    secHorecaDesc: "Gestion idéale des services coupés, extras, flexi-jobs et étudiants. Suivi précis des heures de nuit et du dimanche.",
    secHorecaFootLeft: "Bruxelles • Namur • Liège",
    secHorecaFootRight: "Services coupés inclus",

    secOfficeTag: "Bureaux, Agences & PME (CP 200)",
    secOfficeName: "Bureaux, Sièges & PME (CP 200)",
    secOfficeDesc: "Suivi transparent du télétravail hybride, des heures supplémentaires à récupérer et validation des congés.",
    secOfficeFootLeft: "Quartier Européen • Zaventem",
    secOfficeFootRight: "Télétravail & Heures Supp",

    secRetailTag: "Commerces, Boutiques & Retail",
    secRetailName: "Boutiques, Magasins & Retail",
    secRetailDesc: "Pointage à la caisse ou au comptoir, contrôle des ouvertures le samedi et suivi des équipes multi-magasins.",
    secRetailFootLeft: "Antwerpen • Gent • Bruxelles",
    secRetailFootRight: "Multi-magasins en direct",

    secAirportTag: "Aéroports, Santé & Grands Sites",
    secAirportName: "Aéroports, Santé & Grands Sites",
    secAirportDesc: "Rotation des équipes en 3x8, pointage rapide des flux importants sans file d'attente et registre infalsifiable.",
    secAirportFootLeft: "Brussels Airport • Charleroi • Liège",
    secAirportFootRight: "Équipes 24/7 en rotation",

    // Pro Dashboard & Reports Showcase
    dashPill: "Plateforme d'Administration & Analytique",
    dashHeaderTitle: "Tableaux de Bord & Rapports d'Entreprise en Direct",
    dashHeaderSub: "Explorez les flux opérationnels réels par secteur : pointeuses en direct, courbes d'affluence, heures supplémentaires et rapports prêts pour votre secrétariat social.",
    dashLiveStatus: "Système en direct",
    
    // Sector Tabs
    sectorHoreca: "Restaurants & HoReCa",
    sectorOffice: "Bureaux & Corporate",
    sectorRetail: "Boutiques & Retail",
    sectorLogistics: "Logistique & Entrepôts",
    sectorAirport: "Aéroports & Transport 24/7",

    // Dashboard Tabs
    tabOverview: "Vue d'Ensemble & Courbes",
    tabLive: "Présences Multi-Sites",
    tabAnalytics: "Heures & Heures Supp.",
    tabReports: "Centre de Rapports & Paie",

    // Overview Tab
    kpiPresent: "Effectif en poste",
    kpiBreak: "En pause légale",
    kpiOff: "Repos / Congés",
    kpiPunctuality: "Ponctualité globale",
    kpiTodayHours: "Heures prestées ce jour",
    kpiTargetHours: "Objectif planifié :",
    chartAffluenceTitle: "Courbe d'Affluence & Pic de Présence Horaire (24h)",
    chartAffluenceSub: "Volume de collaborateurs présents en temps réel et détection des pics opérationnels",
    peakBadge: "Pic d'affluence",
    chartDeptTitle: "Répartition par Département & Postes",
    chartDeptSub: "Ventilation des effectifs actifs par unité opérationnelle",
    liveTickerPrefix: "Dernier scan enregistré :",

    // Live Tab
    filterSearchPlaceholder: "Rechercher un collaborateur, matricule ou poste...",
    filterAll: "Tous les statuts",
    filterWorking: "Au poste",
    filterBreak: "En pause",
    filterOut: "Sortis / Clôturés",
    thEmployee: "Collaborateur",
    thRole: "Poste & Commission Paritaire",
    thLocation: "Site / Kiosk",
    thClockIn: "Pointage Entrée",
    thHours: "Heures du jour",
    thStatus: "Statut",
    thAction: "Action",
    stWorking: "Au poste",
    stBreak: "Pause repas",
    stOut: "Journée finie",
    btnInspect: "Inspecter",
    modalInspectTitle: "Fiche d'Inspection & Horodatage Certifié",
    modalInspectSub: "Preuve immuable de pointage conforme à l'arrêt CJUE C-55/18",

    // Analytics Tab
    analyticsHeader: "Volume d'heures prestées & Heures supplémentaires",
    analyticsWeek: "Semaine en cours (Lundi - Dimanche)",
    legendRegular: "Heures normales",
    legendOvertime: "Heures supp. 150% (CP 200/302/140)",
    belgianRegTitle: "Ventilation Réglementaire Belge & Majorations Légales",
    regNight: "Heures de nuit (20h - 06h)",
    regNightSub: "Majoration CCT automatique",
    regSunday: "Prestations dimanche & fériés",
    regSundaySub: "Majoration légale 100% / 200%",
    regStudent: "Quota étudiants (contingent 412h)",
    regStudentSub: "Décompte automatique ONSS",
    regRecup: "Banque de repos compensatoire",
    regRecupSub: "Heures supp. à récupérer",
    kpiNightSun: "Heures de nuit & dimanches",
    kpiNightSunVal: "48h comptabilisées",
    kpiRecup: "Heures supp. à récupérer",
    kpiRecupVal: "14,5h validées",
    kpiSaved: "Temps administratif économisé",
    kpiSavedVal: "~18h / mois pour les RH",
    days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],

    // Reports Tab
    reportsTitle: "Centre de Rapports & Clôture Secrétariats Sociaux",
    reportsSub: "Générez des rapports certifiés conformes au droit social belge pour SD Worx, Liantis, Securex, Acerta ou l'Inspection du travail.",
    repTypePayroll: "Clôture Paie Secrétariats Sociaux",
    repTypeOvertime: "Analyse Heures Supplémentaires & Nuit",
    repTypeAudit: "Piste d'Audit Immuable SPF Emploi (CJUE C-55/18)",
    btnExportPdf: "Générer Rapport PDF Certifié",
    btnExportExcel: "Exporter Tableau Excel (.xlsx)",
    btnSyncSec: "Synchronisation Secrétariat Social",
    thMatricule: "Matricule",
    thCP: "Commission",
    thRegHours: "Heures rég.",
    thOver150: "Supp. 150%",
    thDim200: "Dim. 200%",
    thTotalHours: "Total presté",
    thDimona: "Dimona",
    thSignature: "Signature SHA-256",
    reportSuccessToast: "Rapport exporté avec succès pour",
    btnViewSectorDemo: "Voir le tableau de bord en direct",

    // Pricing
    pricingBadge: "Tarification B2B Belgique",
    pricingTitle: "Tarification transparente, sans engagement",
    pricingSub: "9,90 € HTVA par employé actif par mois. Facture B2B avec TVA belge 21% ou autoliquidation intracommunautaire.",
    pricingPlanName: "Abonnement Tout Inclus",
    pricingNoCommit: "Sans engagement",
    pricingPerSeat: "HTVA / employé actif / mois",
    pricingFeats: [
      "Bornes Kiosks illimitées (sur iPad, Android ou iPhone)",
      "Génération automatique des badges QR pour chaque salarié",
      "Registre d'audit légal immuable (normes SPF 2026-2027)",
      "Gestion des pauses repas et alertes d'anomalies",
      "Exports illimités pour secrétariats sociaux (SD Worx, Liantis...)",
      "Support prioritaire bilingue Français / Néerlandais"
    ],
    calcLabel: "Nombre d'employés dans votre équipe :",
    calcSubtotal: "Sous-total HTVA",
    calcVat: "TVA belge (21%) :",
    calcTotal: "Total mensuel TVAC :",
    btnSubscribe: "Activer mon compte",
    securePayment: "Paiement sécurisé :",

    // FAQ
    faqTitle: "Questions fréquentes en Belgique",
    faqSub: "Toutes les réponses juridiques et pratiques pour votre entreprise en Belgique.",
    faqs: [
      {
        q: "L'enregistrement du temps de travail est-il obligatoire en Belgique ?",
        a: "Oui. Selon la jurisprudence de la Cour de Justice de l'UE (arrêt C-55/18) et les directives du SPF Emploi, chaque employeur doit obligatoirement disposer d'un système objectif, fiable et accessible permettant de mesurer le temps de travail journalier. L'Inspection sociale belge contrôle activement ce point."
      },
      {
        q: "Dois-je acheter un matériel ou une pointeuse physique coûteuse ?",
        a: "Absolument pas. time.be fonctionne sur n'importe quelle tablette iPad, Android ou smartphone. Zéro euro de matériel propriétaire, zéro frais d'installation. Vous économisez des centaines d'euros par an."
      },
      {
        q: "Comment exporter mes heures vers mon secrétariat social (SD Worx, Liantis...) ?",
        a: "À la fin du mois, vous téléchargez en 1 clic un export pré-formaté (Excel / CSV / XML) regroupant les heures prestées, heures de nuit, dimanches et pauses, prêt à être importé dans le logiciel de votre gestionnaire de paie."
      },
      {
        q: "Le système est-il conforme au RGPD et compatible NISS ?",
        a: "Parfaitement. Toutes les données sont hébergées au sein de l'Union Européenne selon les normes les plus strictes. Nous gérons le Numéro de Registre National (NISS / INSZ) sans collecter de données biométriques intrusives."
      }
    ],

    // Banner
    ctaBannerTitle: "Prêt à moderniser le pointage de vos équipes ?",
    ctaBannerSub: "Rejoignez les restaurants, commerces et entreprises en Belgique qui gagnent un temps précieux chaque mois.",

    // Footer & Modals
    footerText: "time.be est une solution d'enregistrement du temps de travail conforme au droit social belge et au Règlement (UE) 2016/679.",
    footerLegal: "Mentions Légales & RGPD Belgique",
    footerContact: "Support & Contact Belgique",
    modalDemoTitle: "Demander une Démo Personnalisée",
    modalDemoSub: "Un conseiller vous répond sous 24h ouvrées",
    modalSuccessTitle: "Demande bien reçue !",
    modalSuccessDesc: "Un conseiller commercial vous contactera rapidement par téléphone ou par e-mail pour organiser une démonstration adaptée à votre établissement.",
    btnClose: "Fermer"
  },

  nl: {
    topTicker: "Conform in België • Richtlijnen FOD Werkgelegenheid & HvJ-EU C-55/18 • Audit Trail 2026-2027",
    navFeatures: "Functies",
    navDashboard: "Dashboard",
    navSectors: "Sectoren",
    navPricing: "Tarieven",
    navFaq: "FAQ",
    navLogin: "Inloggen",
    navDemoBtn: "Vraag demo aan",
    navCta: "14 dagen gratis",

    // Hero
    heroEyebrow: "Officiële Digitale Prikklok voor België",
    heroTitlePart1: "De slimme digitale prikklok via QR-code, ",
    heroTitleHighlight: "eenvoudig en 100% wettelijk conform",
    heroTitlePart2: " in België.",
    heroSubtitle: "Verander elke tablet of smartphone in een veilige prikklok. Uw medewerkers scannen in 1 seconde bij aankomst en vertrek. Volledig conform de richtlijnen van de FOD Werkgelegenheid, inclusief pauzeregistratie en kant-en-klare export naar uw sociaal secretariaat.",
    heroCtaPrimary: "Start gratis proefperiode",
    heroTrust1: "Onwijzigbare Audit Trail 2026-2027",
    heroTrust2: "INSZ / Rijksregister & AVG Europa",
    heroTrust3: "Geen dure hardware-aankoop",
    heroFloatingStatus: "Ingeklokt 08:30",
    heroFloatingSubtitle: "Grand-Place Brasserie • INSZ : 89.04.12-234.56",
    heroFloatingBadge: "FOD Conform",

    // Secretariats
    secretariatsTitle: "Compatibel met alle erkende sociale secretariaten in België:",

    // Sectors
    sectorsBadge: "Praktijkervaring in België",
    sectorsTitle: "Geschikt voor elke sector in België",
    sectorsSub: "Ontdek hoe horeca, winkels, kantoren en luchthavendiensten in Antwerpen, Gent en Brussel tijd besparen.",
    secHorecaTag: "Horeca & Restaurants (PC 302)",
    secHorecaName: "Horeca & Brasseries (PC 302)",
    secHorecaDesc: "Eenvoudig beheer van flexi-jobbers, studenten, extra's en wisselende shifts. Nauwkeurige registratie van nacht- en zondaguren.",
    secHorecaFootLeft: "Brussel • Gent • Antwerpen",
    secHorecaFootRight: "Onderbroken shifts inclusief",

    secOfficeTag: "Kantoren, Diensten & KMO's (PC 200)",
    secOfficeName: "Kantoren, Diensten & KMO's (PC 200)",
    secOfficeDesc: "Duidelijke registratie van hybride thuiswerk, recuperatie van overuren en goedkeuring van vakanties.",
    secOfficeFootLeft: "Europese Wijk • Zaventem",
    secOfficeFootRight: "Thuiswerk & Overuren",

    secRetailTag: "Winkels, Boetieks & Retail",
    secRetailName: "Winkels, Boetieks & Retail",
    secRetailDesc: "Snel inklokken aan de kassa bij opening, zaterdagwerk en overzicht over meerdere winkelvestigingen.",
    secRetailFootLeft: "Antwerpen • Gent • Brussel",
    secRetailFootRight: "Realtime over meerdere winkels",

    secAirportTag: "Luchthavens, Zorg & Grote Sites",
    secAirportName: "Luchthavens, Zorg & Grote Sites",
    secAirportDesc: "Ploegenarbeid in 3x8, snelle verwerking van grote personeelsstromen en onvervalsbaar inspectieregister.",
    secAirportFootLeft: "Brussels Airport • Charleroi • Luik",
    secAirportFootRight: "24/7 ploegenarbeid",

    // Pro Dashboard & Reports Showcase
    dashPill: "Administratie & Analytics Platform",
    dashHeaderTitle: "Live Dashboards & Bedrijfsrapporten",
    dashHeaderSub: "Ontdek operationele stromen per sector: live prikklokken, bezettingsgrafieken, overuren en kant-en-klare rapporten voor uw sociaal secretariaat.",
    dashLiveStatus: "Live systeem",
    
    // Sector Tabs
    sectorHoreca: "Horeca & Restaurants",
    sectorOffice: "Kantoren & Corporate",
    sectorRetail: "Winkels & Retail",
    sectorLogistics: "Logistiek & Magazijnen",
    sectorAirport: "Luchthavens & 24/7 Vervoer",

    // Dashboard Tabs
    tabOverview: "Overzicht & Bezettingsgraad",
    tabLive: "Live Aanwezigheden",
    tabAnalytics: "Uren & Overuren",
    tabReports: "Rapporten & Verloning",

    // Overview Tab
    kpiPresent: "Actief aan het werk",
    kpiBreak: "In wettelijke pauze",
    kpiOff: "Rust / Verlof",
    kpiPunctuality: "Algemene stiptheid",
    kpiTodayHours: "Gepresteerde uren vandaag",
    kpiTargetHours: "Gepland doel:",
    chartAffluenceTitle: "Aanwezigheidscurve & Piekuren (24u)",
    chartAffluenceSub: "Realtime aantal aanwezige medewerkers en detectie van operationele pieken",
    peakBadge: "Piekbelasting",
    chartDeptTitle: "Verdeling per Afdeling & Functie",
    chartDeptSub: "Spreiding van actieve medewerkers per operationele eenheid",
    liveTickerPrefix: "Laatste scan geregistreerd :",

    // Live Tab
    filterSearchPlaceholder: "Zoek medewerker, stamboeknr. of functie...",
    filterAll: "Alle statussen",
    filterWorking: "Aan het werk",
    filterBreak: "In pauze",
    filterOut: "Uitgecheckt",
    thEmployee: "Medewerker",
    thRole: "Functie & Paritair Comité",
    thLocation: "Vestiging / Kiosk",
    thClockIn: "Inkloktijd",
    thHours: "Uren vandaag",
    thStatus: "Status",
    thAction: "Actie",
    stWorking: "Aan het werk",
    stBreak: "Lunchpauze",
    stOut: "Dag voltooid",
    btnInspect: "Bekijken",
    modalInspectTitle: "Inspectiefiche & Gecertificeerde Tijdsstempel",
    modalInspectSub: "Onweerlegbaar bewijs conform arrest HvJ-EU C-55/18",

    // Analytics Tab
    analyticsHeader: "Volume gepresteerde uren & Overuren",
    analyticsWeek: "Huidige week (Maandag - Zondag)",
    legendRegular: "Normale uren",
    legendOvertime: "Overuren 150% (PC 200/302/140)",
    belgianRegTitle: "Belgische Wettelijke Toeslagen & Verdeling",
    regNight: "Nachturen (20u - 06u)",
    regNightSub: "Automatische CAO-toeslag",
    regSunday: "Zondags- en feestdagprestaties",
    regSundaySub: "Wettelijke toeslag 100% / 200%",
    regStudent: "Studentencontingent (412 uur)",
    regStudentSub: "Automatische RSZ-monitoring",
    regRecup: "Inhaalrust & Recup-saldo",
    regRecupSub: "In te halen overuren",
    kpiNightSun: "Nacht- en zondaguren",
    kpiNightSunVal: "48u geregistreerd",
    kpiRecup: "In te halen overuren",
    kpiRecupVal: "14,5u goedgekeurd",
    kpiSaved: "Bespaarde administratieve tijd",
    kpiSavedVal: "~18u / maand voor HR",
    days: ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'],

    // Reports Tab
    reportsTitle: "Rapportencenter & Sociale Afsluiting",
    reportsSub: "Genereer met één klik gecertificeerde rapporten conform het Belgisch arbeidsrecht voor SD Worx, Liantis, Securex, Acerta of de Sociale Inspectie.",
    repTypePayroll: "Loonafsluiting Sociaal Secretariaat",
    repTypeOvertime: "Analyse Overuren & Nachttoeslagen",
    repTypeAudit: "Auditregister FOD Werkgelegenheid (HvJ-EU C-55/18)",
    btnExportPdf: "Gecertificeerd PDF-rapport genereren",
    btnExportExcel: "Excel-tabel exporteren (.xlsx)",
    btnSyncSec: "API-verzending Sociaal Secretariaat",
    thMatricule: "Stamboeknr.",
    thCP: "Paritair Comité",
    thRegHours: "Reguliere uren",
    thOver150: "Overuren 150%",
    thDim200: "Zondag 200%",
    thTotalHours: "Totaal gewerkt",
    thDimona: "Dimona",
    thSignature: "Handtekening SHA-256",
    reportSuccessToast: "Rapport succesvol gegenereerd en gedownload voor",
    btnViewSectorDemo: "Open het live dashboard",

    // Pricing
    pricingBadge: "B2B Tarieven België",
    pricingTitle: "Eerlijke en transparante tarieven",
    pricingSub: "9,90 € excl. btw per actieve werknemer per maand. Officiële B2B-factuur met 21% btw of btw-verlegd.",
    pricingPlanName: "All-In Abonnement",
    pricingNoCommit: "Zonder verplichting",
    pricingPerSeat: "excl. btw / actieve werknemer / maand",
    pricingFeats: [
      "Onbeperkt aantal Kiosk-schermen (iPad, Android, iPhone)",
      "Automatische QR-badge creatie voor elke werknemer",
      "Onvervalsbaar wettelijk auditregister (FOD-normen)",
      "Pauzeregistratie en realtime overwerk-meldingen",
      "Onbeperkte export naar sociale secretariaten (SD Worx, Liantis...)",
      "Tweetalige prioritaire ondersteuning Nederlands / Frans"
    ],
    calcLabel: "Aantal medewerkers in uw team :",
    calcSubtotal: "Subtotaal excl. btw",
    calcVat: "Belgische btw (21%) :",
    calcTotal: "Totaal maandelijks incl. btw :",
    btnSubscribe: "Account activeren",
    securePayment: "Veilige betaling :",

    // FAQ
    faqTitle: "Veelgestelde vragen in België",
    faqSub: "Alle juridische en praktische antwoorden voor uw onderneming in België.",
    faqs: [
      {
        q: "Is tijdsregistratie verplicht voor werkgevers in België ?",
        a: "Ja. Het Europees Hof van Justitie (arrest CCOO C-55/18) verplicht werkgevers een objectief, betrouwbaar en toegankelijk systeem op te zetten om de dagelijkse arbeidstijd te registreren. De Belgische Sociale Inspectie controleert hier actief op."
      },
      {
        q: "Moet ik speciale hardware of dure prikklokken kopen ?",
        a: "Nee, absoluut niet. time.be draait direct in de browser van elke iPad, Samsung Galaxy Tab of smartphone. U bespaart honderden euro’s op dure prikklok-hardware en onderhoud."
      },
      {
        q: "Hoe verloopt de export naar mijn sociaal secretariaat (SD Worx, Liantis...) ?",
        a: "Aan het einde van elke maand downloadt u met 1 klik een kant-en-klaar overzicht (Excel / CSV / XML) met alle gepresteerde uren, nachturen, zondagen en pauzes. U stuurt dit bestand direct door naar uw loonbeheerder."
      },
      {
        q: "Is het systeem AVG/GDPR-conform met ondersteuning van het INSZ ?",
        a: "Ja, 100%. De gegevens worden opgeslagen op beveiligde servers in de Europese Unie. Wij registreren het Belgische Rijksregisternummer (INSZ) zonder invasieve vingerafdrukken."
      }
    ],

    // Banner
    ctaBannerTitle: "Klaar om de tijdsregistratie van uw team te moderniseren?",
    ctaBannerSub: "Sluit u aan bij restaurants, winkels en bedrijven in België die elke maand kostbare tijd besparen.",

    // Footer & Modals
    footerText: "time.be is een Belgische oplossing voor tijdsregistratie conform het Belgische arbeidsrecht en de AVG (EU 2016/679).",
    footerLegal: "Juridische Kennisgeving & AVG België",
    footerContact: "Ondersteuning & Contact België",
    modalDemoTitle: "Vraag een Persoonlijke Demo aan",
    modalDemoSub: "Onze adviseur neemt binnen 24 uur contact met u op",
    modalSuccessTitle: "Bedankt voor uw aanvraag !",
    modalSuccessDesc: "Een van onze adviseurs neemt spoedig telefonisch of per e-mail contact met u op voor een demonstratie op maat van uw onderneming.",
    btnClose: "Sluiten"
  },

  en: {
    topTicker: "Certified in Belgium • Compliant with SPF/FOD Labour & CJEU C-55/18 • Audit Trail 2026-2027",
    navFeatures: "Features",
    navDashboard: "Dashboard",
    navSectors: "Sectors",
    navPricing: "Pricing",
    navFaq: "FAQ",
    navLogin: "Sign In",
    navDemoBtn: "Request Demo",
    navCta: "14-Day Free Trial",

    // Hero
    heroEyebrow: "Official QR Digital Time Clock for Belgium",
    heroTitlePart1: "The smart QR code workforce time clock, ",
    heroTitleHighlight: "simple & 100% compliant",
    heroTitlePart2: " in Belgium.",
    heroSubtitle: "Turn any tablet or phone into a secure attendance kiosk. Employees clock in within 1 second. Fully compliant with Belgian FOD/SPF regulations, automated break management, and direct payroll exports.",
    heroCtaPrimary: "Start Free Trial",
    heroTrust1: "Immutable Audit Trail 2026-2027",
    heroTrust2: "Belgian NISS/INSZ & GDPR Ready",
    heroTrust3: "Zero Hardware Costs",
    heroFloatingStatus: "Clocked in 08:30",
    heroFloatingSubtitle: "Grand-Place Brasserie • NISS : 89.04.12-234.56",
    heroFloatingBadge: "SPF/FOD Compliant",

    // Secretariats
    secretariatsTitle: "100% compatible with certified Belgian social secretariats:",

    // Sectors
    sectorsBadge: "Real-World Deployment",
    sectorsTitle: "Built for all business sectors in Belgium",
    sectorsSub: "From busy Grand-Place brasseries to Antwerp boutiques, corporate offices and Brussels Airport operations.",
    secHorecaTag: "Hospitality & Restaurants (CP 302)",
    secHorecaName: "Hospitality & Restaurants (CP 302)",
    secHorecaDesc: "Built for split shifts, flexi-jobs, student workers and kitchen teams. Automatically exports night and Sunday premiums.",
    secHorecaFootLeft: "Brussels • Ghent • Antwerp",
    secHorecaFootRight: "Split shifts included",

    secOfficeTag: "Offices & Corporate SMEs (CP 200)",
    secOfficeName: "Offices & Corporate SMEs (CP 200)",
    secOfficeDesc: "Track hybrid telework, billable hours and overtime recovery with straightforward manager approvals.",
    secOfficeFootLeft: "European Quarter • Zaventem",
    secOfficeFootRight: "Telework & Overtime",

    secRetailTag: "Retail Shops & Boutiques",
    secRetailName: "Retail Shops & Boutiques",
    secRetailDesc: "Frictionless checkout counter clock-in, transparent weekend work and multi-store management.",
    secRetailFootLeft: "Antwerp • Ghent • Brussels",
    secRetailFootRight: "Live multi-store sync",

    secAirportTag: "Airports, Logistics & 24/7 Sites",
    secAirportName: "Airports, Logistics & 24/7 Sites",
    secAirportDesc: "3-shift rotation management, high-volume badge processing with zero bottleneck and tamper-proof logs.",
    secAirportFootLeft: "Brussels Airport • Charleroi • Liège",
    secAirportFootRight: "24/7 continuous shifts",

    // Pro Dashboard & Reports Showcase
    dashPill: "Administration & Analytics Platform",
    dashHeaderTitle: "Real-Time Enterprise Dashboards & Reports",
    dashHeaderSub: "Explore operational workflows by industry: live digital time clocks, hourly attendance curves, overtime tracking, and payroll-ready reports for your social secretariat.",
    dashLiveStatus: "Live system",
    
    // Sector Tabs
    sectorHoreca: "Restaurants & HoReCa",
    sectorOffice: "Offices & Corporate",
    sectorRetail: "Shops & Retail",
    sectorLogistics: "Logistics & Warehouses",
    sectorAirport: "Airports & 24/7 Transport",

    // Dashboard Tabs
    tabOverview: "Overview & Hourly Flow",
    tabLive: "Live Attendance Grid",
    tabAnalytics: "Hours & Overtime",
    tabReports: "Reports & Payroll Export",

    // Overview Tab
    kpiPresent: "Currently on shift",
    kpiBreak: "On statutory break",
    kpiOff: "Day off / Leave",
    kpiPunctuality: "Overall punctuality",
    kpiTodayHours: "Hours logged today",
    kpiTargetHours: "Planned target:",
    chartAffluenceTitle: "Hourly Presence & Peak Flow Curve (24h)",
    chartAffluenceSub: "Real-time employee headcount volume and operational peak detection",
    peakBadge: "Peak Shift",
    chartDeptTitle: "Workforce Breakdown by Department",
    chartDeptSub: "Active staffing distribution across operational units",
    liveTickerPrefix: "Latest punch recorded :",

    // Live Tab
    filterSearchPlaceholder: "Search employee, badge ID or role...",
    filterAll: "All statuses",
    filterWorking: "On shift",
    filterBreak: "On break",
    filterOut: "Clocked out",
    thEmployee: "Employee",
    thRole: "Role & Joint Committee",
    thLocation: "Site / Kiosk",
    thClockIn: "Clock-in Time",
    thHours: "Hours today",
    thStatus: "Status",
    thAction: "Action",
    stWorking: "Working",
    stBreak: "Meal break",
    stOut: "Day completed",
    btnInspect: "Inspect",
    modalInspectTitle: "Inspection Sheet & Certified Timestamp",
    modalInspectSub: "Tamper-proof proof of attendance compliant with CJEU ruling C-55/18",

    // Analytics Tab
    analyticsHeader: "Total logged hours & Overtime distribution",
    analyticsWeek: "Current week (Monday - Sunday)",
    legendRegular: "Regular hours",
    legendOvertime: "Overtime 150% (JLC 200/302/140)",
    belgianRegTitle: "Belgian Statutory Premiums & Compliance",
    regNight: "Night shift premium (20:00 - 06:00)",
    regNightSub: "Automatic CBA premium",
    regSunday: "Sunday & holiday premium",
    regSundaySub: "Statutory premium 100% / 200%",
    regStudent: "Student quota tracker (412-hour contingent)",
    regStudentSub: "Automated ONSS/RSZ countdown",
    regRecup: "Compensatory rest bank (Recup)",
    regRecupSub: "Overtime recovery hours",
    kpiNightSun: "Night & Sunday hours",
    kpiNightSunVal: "48h logged",
    kpiRecup: "Overtime recovery pool",
    kpiRecupVal: "14.5h approved",
    kpiSaved: "Admin time saved",
    kpiSavedVal: "~18 hrs / mo for HR",
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

    // Reports Tab
    reportsTitle: "Executive Reports Center & Payroll Export",
    reportsSub: "Generate 1-click certified reports compliant with Belgian labor regulations for SD Worx, Liantis, Securex, Acerta, or Social Inspection audits.",
    repTypePayroll: "Payroll Closing for Social Secretariats",
    repTypeOvertime: "Overtime & Night Premium Analysis",
    repTypeAudit: "Immutable Audit Log FOD/SPF (CJEU C-55/18)",
    btnExportPdf: "Generate Certified PDF Report",
    btnExportExcel: "Export Excel Spreadsheet (.xlsx)",
    btnSyncSec: "Direct API Social Secretariat Sync",
    thMatricule: "Badge ID",
    thCP: "Joint Committee",
    thRegHours: "Regular hrs",
    thOver150: "Overtime 150%",
    thDim200: "Sunday 200%",
    thTotalHours: "Total logged",
    thDimona: "Dimona",
    thSignature: "SHA-256 Signature",
    reportSuccessToast: "Report successfully generated and downloaded for",
    btnViewSectorDemo: "Open live sector dashboard",

    // Pricing
    pricingBadge: "Belgian B2B Pricing",
    pricingTitle: "Clear, transparent pricing in EUR",
    pricingSub: "€9.90 excl. VAT per active employee per month. Official Belgian B2B VAT invoice (21% VAT or EU reverse charge).",
    pricingPlanName: "All-Inclusive Plan",
    pricingNoCommit: "No commitment",
    pricingPerSeat: "excl. VAT / active employee / mo",
    pricingFeats: [
      "Unlimited Kiosk clocks (on iPad, Android or iPhone)",
      "Automatic QR badge generation for each worker",
      "Immutable legal audit log (Belgian SPF 2026-2027 standards)",
      "Break management & real-time anomaly alerts",
      "Unlimited exports for social secretariats (SD Worx, Liantis...)",
      "Priority bilingual support (French / Dutch / English)"
    ],
    calcLabel: "Number of active team members:",
    calcSubtotal: "Subtotal excl. VAT",
    calcVat: "Belgian VAT (21%) :",
    calcTotal: "Total monthly incl. VAT :",
    btnSubscribe: "Activate Account",
    securePayment: "Secure payment:",

    // FAQ
    faqTitle: "Frequently Asked Questions in Belgium",
    faqSub: "All legal and practical answers for employers operating in Belgium.",
    faqs: [
      {
        q: "Is workforce time registration mandatory in Belgium?",
        a: "Yes. In accordance with European Court of Justice case law (CCOO ruling C-55/18) and Belgian SPF Employment guidelines, every employer must implement an objective, reliable, and accessible system to measure daily working time. Belgian Social Inspection rigorously enforces this."
      },
      {
        q: "Do I need to purchase expensive proprietary biometric clocks?",
        a: "No, absolutely not. time.be runs smoothly in the browser of any iPad, Android tablet, or smartphone. Zero proprietary hardware investment, zero setup fee. You save hundreds of euros in annual maintenance."
      },
      {
        q: "How does payroll export work for Belgian social secretariats (SD Worx, Liantis...)?",
        a: "At the end of each payroll cycle, download a pre-formatted export (Excel / CSV / XML) with 1 click, containing standard hours, night/Sunday overtime, and break deductions, ready for direct ingestion by your payroll officer."
      },
      {
        q: "Is the platform GDPR compliant and compatible with Belgian NISS/INSZ?",
        a: "100% compliant. All attendance data is stored within certified European Union data centers. We support the Belgian National Register Number (NISS / INSZ) without ever storing intrusive biometric facial or fingerprint data."
      }
    ],

    // Banner
    ctaBannerTitle: "Ready to modernize attendance for your Belgian workforce?",
    ctaBannerSub: "Join restaurants, retail shops, and corporate enterprises across Belgium saving hours every payroll cycle.",

    // Footer & Modals
    footerText: "time.be is a workforce time-tracking SaaS compliant with Belgian labor law and Regulation (EU) 2016/679 (GDPR).",
    footerLegal: "Legal Notice & Belgian GDPR",
    footerContact: "Belgian Support & Sales",
    modalDemoTitle: "Request a Personalized Demo",
    modalDemoSub: "A specialist will contact you within 24 business hours",
    modalSuccessTitle: "Request Received!",
    modalSuccessDesc: "Our specialist will reach out by phone or email shortly to schedule a tailored walkthrough of the platform.",
    btnClose: "Close"
  }
};


// SECTORS_DATA: Rich multi-industry operational models for Belgian workforce management
const SECTORS_DATA = {
  horeca: {
    id: 'horeca',
    iconName: 'UtensilsCrossed',
    themeColor: 'amber',
    names: {
      fr: 'Restaurants & HoReCa',
      nl: 'Horeca & Restaurants',
      en: 'Restaurants & HoReCa'
    },
    tenants: {
      fr: 'Brasserie Grand-Place SRL • Bruxelles (CP 302)',
      nl: 'Brasserie Grote Markt BV • Brussel (PC 302)',
      en: 'Grand-Place Hospitality SRL • Brussels (JLC 302)'
    },
    sites: {
      fr: '3 sites en direct • Bruxelles Grand-Place',
      nl: '3 vestigingen live • Brussel Grote Markt',
      en: '3 sites live • Brussels Grand-Place'
    },
    kpis: {
      present: '42 / 45',
      presentPct: '93.3%',
      breakCount: 2,
      offCount: 1,
      punctuality: '99.4%',
      todayHours: '318h',
      targetHours: '342h'
    },
    hourlyCurve: [
      { hour: '07h', count: 3, label: '07:00 (Mise en place)' },
      { hour: '09h', count: 8, label: '09:00 (Livraisons)' },
      { hour: '11h', count: 20, label: '11:00 (Service midi)' },
      { hour: '12h', count: 42, label: '12:00 (Coup de feu midi)' },
      { hour: '13h', count: 44, label: '13:00 (Plein rush)', peak: true },
      { hour: '14h', count: 32, label: '14:00 (Fin service midi)' },
      { hour: '16h', count: 12, label: '16:00 (Coupure / Repos)' },
      { hour: '18h', count: 28, label: '18:00 (Service soir)' },
      { hour: '20h', count: 45, label: '20:00 (Plein rush soir)', peak: true },
      { hour: '22h', count: 36, label: '22:00 (Clôture cuisine)' },
      { hour: '23h', count: 14, label: '23:00 (Fermeture)' }
    ],
    departments: [
      { name: { fr: 'Salle & Service', nl: 'Zaal & Bediening', en: 'Dining & Service' }, pct: 38, count: 17, color: 'bg-blue-600', fill: '#2563eb' },
      { name: { fr: 'Cuisine & Plonge', nl: 'Keuken & Afwas', en: 'Kitchen & Prep' }, pct: 34, count: 15, color: 'bg-amber-500', fill: '#f59e0b' },
      { name: { fr: 'Terrasse & Bar', nl: 'Terras & Bar', en: 'Terrace & Bar' }, pct: 16, count: 7, color: 'bg-emerald-500', fill: '#10b981' },
      { name: { fr: 'Accueil & Réservations', nl: 'Onthaal & Boekingen', en: 'Reception & Host' }, pct: 12, count: 6, color: 'bg-purple-500', fill: '#a855f7' }
    ],
    weeklyHours: [
      { day: { fr: 'Lun', nl: 'Ma', en: 'Mon' }, reg: 180, over: 15, hReg: '70%', hOver: '10%' },
      { day: { fr: 'Mar', nl: 'Di', en: 'Tue' }, reg: 190, over: 20, hReg: '75%', hOver: '12%' },
      { day: { fr: 'Mer', nl: 'Wo', en: 'Wed' }, reg: 175, over: 10, hReg: '68%', hOver: '8%' },
      { day: { fr: 'Jeu', nl: 'Do', en: 'Thu' }, reg: 195, over: 25, hReg: '78%', hOver: '14%' },
      { day: { fr: 'Ven', nl: 'Vr', en: 'Fri' }, reg: 210, over: 35, hReg: '82%', hOver: '18%' },
      { day: { fr: 'Sam', nl: 'Za', en: 'Sat' }, reg: 225, over: 40, hReg: '86%', hOver: '20%' },
      { day: { fr: 'Dim', nl: 'Zo', en: 'Sun' }, reg: 190, over: 30, hReg: '75%', hOver: '16%' }
    ],
    regMetrics: {
      nightVal: '48h',
      sundayVal: '32h',
      studentVal: '380h / 412h',
      recupVal: '14,5h'
    },
    employees: [
      { id: 1, name: 'Thomas Van de Velde', initials: 'TV', role: { fr: 'Chef de rang (CP 302)', nl: 'Chef de rang (PC 302)', en: 'Head Waiter (JLC 302)' }, badgeId: '#BE-1082', location: 'Bruxelles Grand-Place', kiosk: 'Kiosk iPad #1', time: '08:14:22', hours: '5h 46m / 7h 36m', progressPercent: 76, status: 'working' },
      { id: 2, name: 'Sophie De Smet', initials: 'SS', role: { fr: 'Responsable Salle (CP 302)', nl: 'Zaalverantwoordelijke (PC 302)', en: 'Floor Manager (JLC 302)' }, badgeId: '#BE-1045', location: 'Bruxelles Grand-Place', kiosk: 'Kiosk iPad #1', time: '08:30:15', hours: '5h 30m / 7h 36m', progressPercent: 72, status: 'working' },
      { id: 3, name: 'Marc Vandamme', initials: 'MV', role: { fr: 'Second Cuisine (CP 302)', nl: 'Sous-chef Keuken (PC 302)', en: 'Sous Chef (JLC 302)' }, badgeId: '#BE-1033', location: 'Cuisine Principale', kiosk: 'Kiosk Cuisine', time: '07:45:00', hours: 'Pause 24m / 30m', progressPercent: 80, status: 'break' },
      { id: 4, name: 'Camille Dubois', initials: 'CD', role: { fr: 'Étudiante Flexi-job', nl: 'Student Flexi-job', en: 'Student Flexi-job' }, badgeId: '#BE-2091', location: 'Service Terrasse', kiosk: 'Kiosk iPad #2', time: '11:00:08', hours: '3h 00m (412h rest.)', progressPercent: 60, status: 'working' },
      { id: 5, name: 'Bram Peeters', initials: 'BP', role: { fr: 'Barman & Cave', nl: 'Barman & Kelder', en: 'Bartender & Cellar' }, badgeId: '#BE-0914', location: 'Dépôt & Cave', kiosk: 'Kiosk Cave', time: '06:00:10', hours: '8h 30m (+1h supp.)', progressPercent: 100, status: 'out' }
    ],
    reports: {
      payroll: [
        { matricule: 'BE-1082', name: 'Thomas Van de Velde', cp: 'CP 302', regHours: '164.0 h', over150: '8.5 h', dim200: '12.0 h', total: '184.5 h', dimona: 'OK', sha: 'c4f2...89a1' },
        { matricule: 'BE-1045', name: 'Sophie De Smet', cp: 'CP 302', regHours: '160.0 h', over150: '4.0 h', dim200: '8.0 h', total: '172.0 h', dimona: 'OK', sha: 'e1d0...33c9' },
        { matricule: 'BE-1033', name: 'Marc Vandamme', cp: 'CP 302', regHours: '168.0 h', over150: '12.0 h', dim200: '16.0 h', total: '196.0 h', dimona: 'OK', sha: '7b88...09f2' },
        { matricule: 'BE-2091', name: 'Camille Dubois', cp: 'Flexi-Job', regHours: '48.0 h', over150: '0.0 h', dim200: '6.0 h', total: '54.0 h', dimona: 'OK', sha: '992a...dd14' },
        { matricule: 'BE-0914', name: 'Bram Peeters', cp: 'CP 302', regHours: '155.0 h', over150: '6.0 h', dim200: '10.0 h', total: '171.0 h', dimona: 'OK', sha: '3c11...fa48' }
      ],
      overtime: [
        { matricule: 'BE-1082', name: 'Thomas Van de Velde', cp: 'CP 302', regHours: '164.0 h', nightHours: '18.0 h', over150: '8.5 h', dim200: '12.0 h', recupBank: '6.0 h', status: 'Validé' },
        { matricule: 'BE-1045', name: 'Sophie De Smet', cp: 'CP 302', regHours: '160.0 h', nightHours: '14.0 h', over150: '4.0 h', dim200: '8.0 h', recupBank: '4.0 h', status: 'Validé' },
        { matricule: 'BE-1033', name: 'Marc Vandamme', cp: 'CP 302', regHours: '168.0 h', nightHours: '22.0 h', over150: '12.0 h', dim200: '16.0 h', recupBank: '8.5 h', status: 'À récupérer' },
        { matricule: 'BE-2091', name: 'Camille Dubois', cp: 'Flexi-Job', regHours: '48.0 h', nightHours: '6.0 h', over150: '0.0 h', dim200: '6.0 h', recupBank: '0.0 h', status: 'Exonéré' },
        { matricule: 'BE-0914', name: 'Bram Peeters', cp: 'CP 302', regHours: '155.0 h', nightHours: '12.0 h', over150: '6.0 h', dim200: '10.0 h', recupBank: '3.0 h', status: 'Validé' }
      ],
      audit: [
        { id: '#89421', timestamp: '2026-10-09 08:14:22', employee: 'Thomas Van de Velde', event: 'Scan Entrée QR Dynamique', kiosk: 'Kiosk iPad #1 (Grand-Place)', ip: '195.154.42.10', hash: '7f8a9bc41d2e87c0', status: 'SHA-256 OK' },
        { id: '#89422', timestamp: '2026-10-09 12:15:00', employee: 'Marc Vandamme', event: 'Début Pause Déjeuner (30m)', kiosk: 'Kiosk Cuisine Principale', ip: '195.154.42.12', hash: '3d1e4af90b821c45', status: 'CCT Conforme' },
        { id: '#89423', timestamp: '2026-10-09 14:30:00', employee: 'Bram Peeters', event: 'Scan Sortie (+1h supp. validée)', kiosk: 'Kiosk Cave & Dépôt', ip: '195.154.42.14', hash: '8a92bb71ce0094e1', status: 'Signé Manager' },
        { id: '#89424', timestamp: '2026-10-09 15:00:10', employee: 'Sophie De Smet', event: 'Vérification Registre Quotidien', kiosk: 'Portail Manager Web', ip: '81.240.112.5', hash: '12ef44ba8901cd77', status: 'Audit Trail' },
        { id: '#89425', timestamp: '2026-10-09 16:30:00', employee: 'Camille Dubois', event: 'Scan Entrée Shift Terrasse', kiosk: 'Kiosk iPad #2 (Terrasse)', ip: '195.154.42.11', hash: '990aa43d12ff8701', status: 'Dimona Validée' }
      ]
    }
  },

  office: {
    id: 'office',
    iconName: 'Laptop',
    themeColor: 'blue',
    names: {
      fr: 'Bureaux & Corporate',
      nl: 'Kantoren & Corporate',
      en: 'Offices & Corporate'
    },
    tenants: {
      fr: 'FinTech Solutions SA • Av. Louise, Bruxelles (CP 200)',
      nl: 'FinTech Solutions NV • Louizalaan, Brussel (PC 200)',
      en: 'FinTech Solutions SA • Louise Ave, Brussels (JLC 200)'
    },
    sites: {
      fr: '2 sites • Bruxelles Siège & Anvers',
      nl: '2 vestigingen • Brussel Hoofdzetel & Antwerpen',
      en: '2 sites • Brussels HQ & Antwerp'
    },
    kpis: {
      present: '82 / 88',
      presentPct: '93.2%',
      breakCount: 4,
      offCount: 2,
      punctuality: '99.1%',
      todayHours: '624h',
      targetHours: '668h'
    },
    hourlyCurve: [
      { hour: '07h', count: 4, label: '07:00' },
      { hour: '08h', count: 28, label: '08:00 (Arrivées matin)' },
      { hour: '09h', count: 80, label: '09:00 (Pleine équipe)', peak: true },
      { hour: '11h', count: 82, label: '11:00 (Pic présence)', peak: true },
      { hour: '12h', count: 45, label: '12:00 (Pause midi)' },
      { hour: '13h', count: 60, label: '13:00 (Reprise)' },
      { hour: '15h', count: 82, label: '15:00 (Pic après-midi)', peak: true },
      { hour: '17h', count: 68, label: '17:00 (Départs)' },
      { hour: '18h', count: 30, label: '18:00' },
      { hour: '19h', count: 8, label: '19:00' },
      { hour: '20h', count: 2, label: '20:00' }
    ],
    departments: [
      { name: { fr: 'R&D & Ingénierie', nl: 'R&D & Engineering', en: 'R&D & Engineering' }, pct: 40, count: 35, color: 'bg-blue-600', fill: '#2563eb' },
      { name: { fr: 'Commercial & Ventes', nl: 'Commercieel & Verkoop', en: 'Commercial & Sales' }, pct: 25, count: 22, color: 'bg-cyan-500', fill: '#06b6d4' },
      { name: { fr: 'RH & Finance', nl: 'HR & Finance', en: 'HR & Finance' }, pct: 20, count: 18, color: 'bg-indigo-500', fill: '#6366f1' },
      { name: { fr: 'Support Client & Ops', nl: 'Klantenservice & Ops', en: 'Support & Ops' }, pct: 15, count: 13, color: 'bg-emerald-500', fill: '#10b981' }
    ],
    weeklyHours: [
      { day: { fr: 'Lun', nl: 'Ma', en: 'Mon' }, reg: 640, over: 12, hReg: '88%', hOver: '4%' },
      { day: { fr: 'Mar', nl: 'Di', en: 'Tue' }, reg: 650, over: 15, hReg: '90%', hOver: '5%' },
      { day: { fr: 'Mer', nl: 'Wo', en: 'Wed' }, reg: 630, over: 10, hReg: '86%', hOver: '3%' },
      { day: { fr: 'Jeu', nl: 'Do', en: 'Thu' }, reg: 655, over: 18, hReg: '91%', hOver: '6%' },
      { day: { fr: 'Ven', nl: 'Vr', en: 'Fri' }, reg: 610, over: 8, hReg: '84%', hOver: '2%' },
      { day: { fr: 'Sam', nl: 'Za', en: 'Sat' }, reg: 0, over: 0, hReg: '0%', hOver: '0%' },
      { day: { fr: 'Dim', nl: 'Zo', en: 'Sun' }, reg: 0, over: 0, hReg: '0%', hOver: '0%' }
    ],
    regMetrics: {
      nightVal: '0h',
      sundayVal: '0h',
      studentVal: '120h / 412h',
      recupVal: '28,0h'
    },
    employees: [
      { id: 1, name: 'Alexandre Lambert', initials: 'AL', role: { fr: 'Lead Architect (CP 200)', nl: 'Lead Architect (PC 200)', en: 'Lead Architect (JLC 200)' }, badgeId: '#BE-3041', location: 'Bruxelles Siège RDC', kiosk: 'Borne Hall Accueil', time: '08:42:10', hours: '6h 15m / 7h 36m', progressPercent: 82, status: 'working' },
      { id: 2, name: 'Élodie Martin', initials: 'EM', role: { fr: 'HR Manager (CP 200)', nl: 'HR Manager (PC 200)', en: 'HR Manager (JLC 200)' }, badgeId: '#BE-3022', location: 'Bruxelles Étage 4', kiosk: 'Borne RH & Direction', time: '08:15:30', hours: '6h 40m / 7h 36m', progressPercent: 88, status: 'working' },
      { id: 3, name: 'Maxime Lefèvre', initials: 'ML', role: { fr: 'Contrôleur Financier', nl: 'Financieel Controller', en: 'Financial Controller' }, badgeId: '#BE-3098', location: 'Bruxelles Étage 3', kiosk: 'Borne Finance', time: '09:05:00', hours: '5h 50m / 7h 36m', progressPercent: 77, status: 'working' },
      { id: 4, name: 'Sarah De Backer', initials: 'SB', role: { fr: 'Key Account Manager', nl: 'Key Account Manager', en: 'Key Account Manager' }, badgeId: '#BE-3110', location: 'Bruxelles Étage 2', kiosk: 'Borne Ventes', time: '08:50:22', hours: 'Pause 20m / 45m', progressPercent: 65, status: 'break' },
      { id: 5, name: 'Julien Claes', initials: 'JC', role: { fr: 'DevOps & Sécurité', nl: 'DevOps & Beveiliging', en: 'DevOps & Security' }, badgeId: '#BE-3005', location: 'Bruxelles Server Room', kiosk: 'Borne Tech', time: '07:30:11', hours: '8h 15m (+40m supp.)', progressPercent: 100, status: 'out' }
    ],
    reports: {
      payroll: [
        { matricule: 'BE-3041', name: 'Alexandre Lambert', cp: 'CP 200', regHours: '160.0 h', over150: '4.5 h', dim200: '0.0 h', total: '164.5 h', dimona: 'OK', sha: 'a8b1...55d2' },
        { matricule: 'BE-3022', name: 'Élodie Martin', cp: 'CP 200', regHours: '160.0 h', over150: '0.0 h', dim200: '0.0 h', total: '160.0 h', dimona: 'OK', sha: 'f93c...11a7' },
        { matricule: 'BE-3098', name: 'Maxime Lefèvre', cp: 'CP 200', regHours: '160.0 h', over150: '6.0 h', dim200: '0.0 h', total: '166.0 h', dimona: 'OK', sha: '22e4...88c3' },
        { matricule: 'BE-3110', name: 'Sarah De Backer', cp: 'CP 200', regHours: '152.0 h', over150: '2.0 h', dim200: '0.0 h', total: '154.0 h', dimona: 'OK', sha: '5c77...90b4' },
        { matricule: 'BE-3005', name: 'Julien Claes', cp: 'CP 200', regHours: '160.0 h', over150: '9.5 h', dim200: '0.0 h', total: '169.5 h', dimona: 'OK', sha: '4d12...e366' }
      ],
      overtime: [
        { matricule: 'BE-3041', name: 'Alexandre Lambert', cp: 'CP 200', regHours: '160.0 h', nightHours: '0.0 h', over150: '4.5 h', dim200: '0.0 h', recupBank: '4.5 h', status: 'Validé' },
        { matricule: 'BE-3022', name: 'Élodie Martin', cp: 'CP 200', regHours: '160.0 h', nightHours: '0.0 h', over150: '0.0 h', dim200: '0.0 h', recupBank: '0.0 h', status: 'Conforme' },
        { matricule: 'BE-3098', name: 'Maxime Lefèvre', cp: 'CP 200', regHours: '160.0 h', nightHours: '0.0 h', over150: '6.0 h', dim200: '0.0 h', recupBank: '6.0 h', status: 'À récupérer' },
        { matricule: 'BE-3110', name: 'Sarah De Backer', cp: 'CP 200', regHours: '152.0 h', nightHours: '0.0 h', over150: '2.0 h', dim200: '0.0 h', recupBank: '2.0 h', status: 'Validé' },
        { matricule: 'BE-3005', name: 'Julien Claes', cp: 'CP 200', regHours: '160.0 h', nightHours: '0.0 h', over150: '9.5 h', dim200: '0.0 h', recupBank: '9.5 h', status: 'Plafond CCT' }
      ],
      audit: [
        { id: '#90120', timestamp: '2026-10-09 08:15:30', employee: 'Élodie Martin', event: 'Badge Arrivée Borne Accueil', kiosk: 'Borne Hall RDC', ip: '194.78.110.1', hash: '55bc8120eef190a2', status: 'Horodaté' },
        { id: '#90121', timestamp: '2026-10-09 08:42:10', employee: 'Alexandre Lambert', event: 'Connexion Poste Télétravail', kiosk: 'App Web Sécurisée (IP VPN)', ip: '85.27.14.90', hash: '33e144a9bc0192df', status: 'VPN Certifié' },
        { id: '#90122', timestamp: '2026-10-09 12:45:00', employee: 'Sarah De Backer', event: 'Début Pause Déjeuner', kiosk: 'Borne Étage 2', ip: '194.78.110.4', hash: '88a100cd5521ef34', status: 'Pause CCT' },
        { id: '#90123', timestamp: '2026-10-09 16:30:11', employee: 'Julien Claes', event: 'Départ Enregistré (Astreinte)', kiosk: 'Borne Salle Serveurs', ip: '194.78.110.9', hash: '22dd99ff0188bb33', status: 'SHA-256 OK' },
        { id: '#90124', timestamp: '2026-10-09 17:15:00', employee: 'Maxime Lefèvre', event: 'Clôture Heures Journalières', kiosk: 'Borne Étage 3', ip: '194.78.110.5', hash: '77cc33aa992211bb', status: 'Audit Trail' }
      ]
    }
  },

  retail: {
    id: 'retail',
    iconName: 'ShoppingBag',
    themeColor: 'purple',
    names: {
      fr: 'Boutiques & Retail',
      nl: 'Winkels & Retail',
      en: 'Shops & Retail'
    },
    tenants: {
      fr: 'Mode & Design Benelux • Anvers, Gand & Bxl (CP 201/311)',
      nl: 'Mode & Design Benelux • Antwerpen, Gent & Bxl (PC 201/311)',
      en: 'Fashion & Retail Benelux • Antwerp, Ghent & Bxl (JLC 201/311)'
    },
    sites: {
      fr: '6 boutiques en réseau • Flandre & Bruxelles',
      nl: '6 winkels in netwerk • Vlaanderen & Brussel',
      en: '6 retail stores network • Flanders & Brussels'
    },
    kpis: {
      present: '54 / 58',
      presentPct: '93.1%',
      breakCount: 3,
      offCount: 1,
      punctuality: '98.9%',
      todayHours: '398h',
      targetHours: '420h'
    },
    hourlyCurve: [
      { hour: '08h', count: 6, label: '08:00 (Mise en rayon)' },
      { hour: '09h', count: 18, label: '09:00 (Briefing équipe)' },
      { hour: '10h', count: 48, label: '10:00 (Ouverture boutiques)' },
      { hour: '12h', count: 52, label: '12:00' },
      { hour: '14h', count: 54, label: '14:00 (Flux clients)' },
      { hour: '16h', count: 54, label: '16:00 (Pic shopping)', peak: true },
      { hour: '18h', count: 46, label: '18:00' },
      { hour: '19h', count: 24, label: '19:00 (Fermeture)' },
      { hour: '20h', count: 8, label: '20:00 (Clôture caisses)' }
    ],
    departments: [
      { name: { fr: 'Vente & Conseil', nl: 'Verkoop & Advies', en: 'Sales & Advisory' }, pct: 45, count: 26, color: 'bg-purple-600', fill: '#9333ea' },
      { name: { fr: 'Caisse & Encaissement', nl: 'Kassa & Afrekening', en: 'Cashier & POS' }, pct: 25, count: 14, color: 'bg-pink-500', fill: '#ec4899' },
      { name: { fr: 'Réassort & Stock', nl: 'Aanvulling & Stock', en: 'Stock & Inventory' }, pct: 18, count: 11, color: 'bg-blue-500', fill: '#3b82f6' },
      { name: { fr: 'Management Magasin', nl: 'Winkelbeheer', en: 'Store Management' }, pct: 12, count: 7, color: 'bg-amber-500', fill: '#f59e0b' }
    ],
    weeklyHours: [
      { day: { fr: 'Lun', nl: 'Ma', en: 'Mon' }, reg: 380, over: 8, hReg: '72%', hOver: '3%' },
      { day: { fr: 'Mar', nl: 'Di', en: 'Tue' }, reg: 390, over: 10, hReg: '74%', hOver: '4%' },
      { day: { fr: 'Mer', nl: 'Wo', en: 'Wed' }, reg: 410, over: 12, hReg: '78%', hOver: '5%' },
      { day: { fr: 'Jeu', nl: 'Do', en: 'Thu' }, reg: 400, over: 10, hReg: '76%', hOver: '4%' },
      { day: { fr: 'Ven', nl: 'Vr', en: 'Fri' }, reg: 430, over: 18, hReg: '82%', hOver: '7%' },
      { day: { fr: 'Sam', nl: 'Za', en: 'Sat' }, reg: 480, over: 32, hReg: '92%', hOver: '12%' },
      { day: { fr: 'Dim', nl: 'Zo', en: 'Sun' }, reg: 60, over: 15, hReg: '20%', hOver: '8%' }
    ],
    regMetrics: {
      nightVal: '12h',
      sundayVal: '44h',
      studentVal: '402h / 412h',
      recupVal: '18,5h'
    },
    employees: [
      { id: 1, name: 'Laura Vermeulen', initials: 'LV', role: { fr: 'Store Manager (CP 201)', nl: 'Store Manager (PC 201)', en: 'Store Manager (JLC 201)' }, badgeId: '#BE-4012', location: 'Boutique Meir Anvers', kiosk: 'Borne Caisse Principale', time: '08:45:00', hours: '6h 00m / 7h 36m', progressPercent: 79, status: 'working' },
      { id: 2, name: 'Lucas Denis', initials: 'LD', role: { fr: 'Conseiller Vente (CP 311)', nl: 'Verkoopadviseur (PC 311)', en: 'Sales Associate (JLC 311)' }, badgeId: '#BE-4055', location: 'Boutique Rue Neuve Bxl', kiosk: 'Borne Rayon Homme', time: '09:30:15', hours: '5h 15m / 7h 36m', progressPercent: 69, status: 'working' },
      { id: 3, name: 'Emma Wouters', initials: 'EW', role: { fr: 'Responsable Caisse', nl: 'Kassaverantwoordelijke', en: 'Head Cashier' }, badgeId: '#BE-4028', location: 'Boutique Veldstraat Gand', kiosk: 'Borne Caisse 1', time: '09:15:00', hours: 'Pause 30m / 45m', progressPercent: 60, status: 'break' },
      { id: 4, name: 'Kevin Merckx', initials: 'KM', role: { fr: 'Vendeur Étudiant (412h)', nl: 'Student Verkoper (412u)', en: 'Student Sales (412h)' }, badgeId: '#BE-4099', location: 'Boutique Meir Anvers', kiosk: 'Borne Caisse 2', time: '10:00:20', hours: '4h 30m (380h rest.)', progressPercent: 62, status: 'working' },
      { id: 5, name: 'Chloé Dupont', initials: 'CD', role: { fr: 'Gestionnaire Stock', nl: 'Voorraadbeheerder', en: 'Stock Manager' }, badgeId: '#BE-4003', location: 'Réserve Centrale Bxl', kiosk: 'Borne Stock Réserve', time: '07:45:00', hours: '8h 00m (+30m supp.)', progressPercent: 100, status: 'out' }
    ],
    reports: {
      payroll: [
        { matricule: 'BE-4012', name: 'Laura Vermeulen', cp: 'CP 201', regHours: '160.0 h', over150: '6.0 h', dim200: '0.0 h', total: '166.0 h', dimona: 'OK', sha: 'b118...39aa' },
        { matricule: 'BE-4055', name: 'Lucas Denis', cp: 'CP 311', regHours: '152.0 h', over150: '4.0 h', dim200: '0.0 h', total: '156.0 h', dimona: 'OK', sha: 'c23e...7701' },
        { matricule: 'BE-4028', name: 'Emma Wouters', cp: 'CP 201', regHours: '160.0 h', over150: '5.5 h', dim200: '0.0 h', total: '165.5 h', dimona: 'OK', sha: '990f...44bc' },
        { matricule: 'BE-4099', name: 'Kevin Merckx', cp: 'Étudiant', regHours: '64.0 h', over150: '0.0 h', dim200: '0.0 h', total: '64.0 h', dimona: 'OK', sha: '33aa...88cc' },
        { matricule: 'BE-4003', name: 'Chloé Dupont', cp: 'CP 201', regHours: '160.0 h', over150: '8.0 h', dim200: '0.0 h', total: '168.0 h', dimona: 'OK', sha: '11ff...22ee' }
      ],
      overtime: [
        { matricule: 'BE-4012', name: 'Laura Vermeulen', cp: 'CP 201', regHours: '160.0 h', nightHours: '4.0 h', over150: '6.0 h', dim200: '0.0 h', recupBank: '6.0 h', status: 'Validé' },
        { matricule: 'BE-4055', name: 'Lucas Denis', cp: 'CP 311', regHours: '152.0 h', nightHours: '0.0 h', over150: '4.0 h', dim200: '0.0 h', recupBank: '4.0 h', status: 'Validé' },
        { matricule: 'BE-4028', name: 'Emma Wouters', cp: 'CP 201', regHours: '160.0 h', nightHours: '2.0 h', over150: '5.5 h', dim200: '0.0 h', recupBank: '5.5 h', status: 'À récupérer' },
        { matricule: 'BE-4099', name: 'Kevin Merckx', cp: 'Étudiant', regHours: '64.0 h', nightHours: '0.0 h', over150: '0.0 h', dim200: '0.0 h', recupBank: '0.0 h', status: 'Conforme' },
        { matricule: 'BE-4003', name: 'Chloé Dupont', cp: 'CP 201', regHours: '160.0 h', nightHours: '6.0 h', over150: '8.0 h', dim200: '0.0 h', recupBank: '8.0 h', status: 'Validé' }
      ],
      audit: [
        { id: '#91401', timestamp: '2026-10-09 08:45:00', employee: 'Laura Vermeulen', event: 'Scan Entrée Ouverture Boutique', kiosk: 'Borne Caisse Meir Anvers', ip: '193.190.12.44', hash: '44a88b11cdee9021', status: 'Ouverture OK' },
        { id: '#91402', timestamp: '2026-10-09 09:30:15', employee: 'Lucas Denis', event: 'Scan Entrée Rayon Homme', kiosk: 'Borne Rue Neuve Bxl', ip: '193.190.14.88', hash: '9901aa44bb22dd55', status: 'SHA-256 OK' },
        { id: '#91403', timestamp: '2026-10-09 13:00:20', employee: 'Emma Wouters', event: 'Début Pause Repas 45 min', kiosk: 'Borne Caisse Gand', ip: '193.190.16.12', hash: '22ee11ff4400aa99', status: 'Pause CCT' },
        { id: '#91404', timestamp: '2026-10-09 16:00:00', employee: 'Kevin Merckx', event: 'Vérification Contingent Étudiant', kiosk: 'Portail Collaborateur', ip: '81.240.55.10', hash: '77bb22aa5544ee11', status: '380h Restantes' },
        { id: '#91405', timestamp: '2026-10-09 19:15:00', employee: 'Chloé Dupont', event: 'Clôture Stock & Départ', kiosk: 'Borne Réserve Centrale', ip: '193.190.14.90', hash: '55dd33cc1199aa77', status: 'Audit Trail' }
      ]
    }
  },

  logistics: {
    id: 'logistics',
    iconName: 'Warehouse',
    themeColor: 'emerald',
    names: {
      fr: 'Logistique & Entrepôts',
      nl: 'Logistiek & Magazijnen',
      en: 'Logistics & Warehouses'
    },
    tenants: {
      fr: 'LogiHub Fret & Quai SA • Charleroi & Gand (CP 140.03)',
      nl: 'LogiHub Vracht & Kaai NV • Charleroi & Gent (PC 140.03)',
      en: 'LogiHub Freight & Cargo SA • Charleroi & Ghent (JLC 140.03)'
    },
    sites: {
      fr: '2 hubs logistiques • 4 quais de réception',
      nl: '2 logistieke hubs • 4 laadkades',
      en: '2 logistics hubs • 4 cargo docks'
    },
    kpis: {
      present: '138 / 145',
      presentPct: '95.2%',
      breakCount: 6,
      offCount: 1,
      punctuality: '99.5%',
      todayHours: '1.080h',
      targetHours: '1.120h'
    },
    hourlyCurve: [
      { hour: '05h', count: 48, label: '05:00 (Poste Matin)' },
      { hour: '07h', count: 52, label: '07:00 (Pleine cadence)' },
      { hour: '11h', count: 50, label: '11:00' },
      { hour: '13h', count: 96, label: '13:00 (Relais 2 équipes)', peak: true },
      { hour: '14h', count: 55, label: '14:00 (Poste Après-midi)' },
      { hour: '17h', count: 55, label: '17:00' },
      { hour: '20h', count: 52, label: '20:00' },
      { hour: '21h', count: 85, label: '21:00 (Relais Nuit)', peak: true },
      { hour: '22h', count: 38, label: '22:00 (Poste Nuit)' },
      { hour: '01h', count: 38, label: '01:00' },
      { hour: '04h', count: 36, label: '04:00' }
    ],
    departments: [
      { name: { fr: 'Préparation Commandes', nl: 'Orderpicking', en: 'Order Picking' }, pct: 42, count: 58, color: 'bg-emerald-600', fill: '#059669' },
      { name: { fr: 'Caristes & Manutention', nl: 'Heftruck & Overslag', en: 'Forklift & Handling' }, pct: 28, count: 39, color: 'bg-teal-500', fill: '#14b8a6' },
      { name: { fr: 'Chauffeurs & Flotte', nl: 'Chauffeurs & Vloot', en: 'Fleet & Drivers' }, pct: 18, count: 25, color: 'bg-blue-600', fill: '#2563eb' },
      { name: { fr: 'Contrôle & Expédition', nl: 'Controle & Verzending', en: 'Shipping & QC' }, pct: 12, count: 16, color: 'bg-amber-500', fill: '#f59e0b' }
    ],
    weeklyHours: [
      { day: { fr: 'Lun', nl: 'Ma', en: 'Mon' }, reg: 1040, over: 45, hReg: '88%', hOver: '8%' },
      { day: { fr: 'Mar', nl: 'Di', en: 'Tue' }, reg: 1060, over: 50, hReg: '89%', hOver: '9%' },
      { day: { fr: 'Mer', nl: 'Wo', en: 'Wed' }, reg: 1050, over: 42, hReg: '88%', hOver: '7%' },
      { day: { fr: 'Jeu', nl: 'Do', en: 'Thu' }, reg: 1070, over: 55, hReg: '90%', hOver: '9%' },
      { day: { fr: 'Ven', nl: 'Vr', en: 'Fri' }, reg: 1090, over: 60, hReg: '91%', hOver: '10%' },
      { day: { fr: 'Sam', nl: 'Za', en: 'Sat' }, reg: 420, over: 30, hReg: '40%', hOver: '6%' },
      { day: { fr: 'Dim', nl: 'Zo', en: 'Sun' }, reg: 210, over: 25, hReg: '22%', hOver: '5%' }
    ],
    regMetrics: {
      nightVal: '164h',
      sundayVal: '58h',
      studentVal: '180h / 412h',
      recupVal: '42,0h'
    },
    employees: [
      { id: 1, name: 'Yassine Belkacem', initials: 'YB', role: { fr: 'Cariste CACES (CP 140)', nl: 'Heftruckchauffeur (PC 140)', en: 'Forklift Driver (JLC 140)' }, badgeId: '#BE-5011', location: 'Entrepôt Quai 4', kiosk: 'Borne Quai Nord', time: '05:50:12', hours: '6h 30m / 7h 36m', progressPercent: 85, status: 'working' },
      { id: 2, name: 'David Van Damme', initials: 'DV', role: { fr: 'Chef d\'Équipe Quai', nl: 'Ploegbaas Kaai', en: 'Dock Team Leader' }, badgeId: '#BE-5022', location: 'Entrepôt Quai 2', kiosk: 'Borne Quai Sud', time: '05:45:00', hours: '6h 35m / 7h 36m', progressPercent: 86, status: 'working' },
      { id: 3, name: 'Nicolas Moreau', initials: 'NM', role: { fr: 'Préparateur Commandes', nl: 'Orderpicker', en: 'Order Picker' }, badgeId: '#BE-5089', location: 'Zone Picking A', kiosk: 'Borne Picking #1', time: '06:00:20', hours: 'Pause 30m / 30m', progressPercent: 75, status: 'break' },
      { id: 4, name: 'Pieter De Vos', initials: 'PV', role: { fr: 'Chauffeur Poids Lourd CE', nl: 'Vrachtwagenchauffeur CE', en: 'Heavy Truck Driver CE' }, badgeId: '#BE-5004', location: 'Hub Flotte Gand', kiosk: 'Borne Dispatch', time: '05:30:10', hours: '7h 10m / 8h 00m', progressPercent: 89, status: 'working' },
      { id: 5, name: 'Olivier Bertrand', initials: 'OB', role: { fr: 'Agent Réception Fret', nl: 'Agent Vrachtontvangst', en: 'Cargo Inbound Agent' }, badgeId: '#BE-5033', location: 'Quai Réception Fret', kiosk: 'Borne Réception', time: '21:55:00', hours: '8h 00m (Équipe Nuit)', progressPercent: 100, status: 'out' }
    ],
    reports: {
      payroll: [
        { matricule: 'BE-5011', name: 'Yassine Belkacem', cp: 'CP 140.03', regHours: '168.0 h', over150: '14.0 h', dim200: '0.0 h', total: '182.0 h', dimona: 'OK', sha: '88c1...99ef' },
        { matricule: 'BE-5022', name: 'David Van Damme', cp: 'CP 140.03', regHours: '168.0 h', over150: '16.5 h', dim200: '0.0 h', total: '184.5 h', dimona: 'OK', sha: '44a0...12cd' },
        { matricule: 'BE-5089', name: 'Nicolas Moreau', cp: 'CP 140.03', regHours: '160.0 h', over150: '6.0 h', dim200: '0.0 h', total: '166.0 h', dimona: 'OK', sha: '99ea...331b' },
        { matricule: 'BE-5004', name: 'Pieter De Vos', cp: 'CP 140.03', regHours: '172.0 h', over150: '18.0 h', dim200: '0.0 h', total: '190.0 h', dimona: 'OK', sha: '11aa...77cc' },
        { matricule: 'BE-5033', name: 'Olivier Bertrand', cp: 'CP 140.03', regHours: '160.0 h', over150: '12.0 h', dim200: '8.0 h', total: '180.0 h', dimona: 'OK', sha: 'ff32...44dd' }
      ],
      overtime: [
        { matricule: 'BE-5011', name: 'Yassine Belkacem', cp: 'CP 140.03', regHours: '168.0 h', nightHours: '32.0 h', over150: '14.0 h', dim200: '0.0 h', recupBank: '14.0 h', status: 'Validé' },
        { matricule: 'BE-5022', name: 'David Van Damme', cp: 'CP 140.03', regHours: '168.0 h', nightHours: '36.0 h', over150: '16.5 h', dim200: '0.0 h', recupBank: '16.5 h', status: 'Validé' },
        { matricule: 'BE-5089', name: 'Nicolas Moreau', cp: 'CP 140.03', regHours: '160.0 h', nightHours: '0.0 h', over150: '6.0 h', dim200: '0.0 h', recupBank: '6.0 h', status: 'À récupérer' },
        { matricule: 'BE-5004', name: 'Pieter De Vos', cp: 'CP 140.03', regHours: '172.0 h', nightHours: '16.0 h', over150: '18.0 h', dim200: '0.0 h', recupBank: '18.0 h', status: 'Chrono OK' },
        { matricule: 'BE-5033', name: 'Olivier Bertrand', cp: 'CP 140.03', regHours: '160.0 h', nightHours: '80.0 h', over150: '12.0 h', dim200: '8.0 h', recupBank: '12.0 h', status: 'Prime Nuit' }
      ],
      audit: [
        { id: '#92801', timestamp: '2026-10-09 05:30:10', employee: 'Pieter De Vos', event: 'Scan Prise de Service Flotte', kiosk: 'Borne Dispatch Gand', ip: '194.154.88.2', hash: '11aa33bb77cc99ee', status: 'Dimona Flotte' },
        { id: '#92802', timestamp: '2026-10-09 05:50:12', employee: 'Yassine Belkacem', event: 'Badge Quai Nord Chariot', kiosk: 'Borne Quai Nord', ip: '194.154.88.5', hash: '55ff77aa22dd11bb', status: 'CACES Valide' },
        { id: '#92803', timestamp: '2026-10-09 13:00:00', employee: 'David Van Damme', event: 'Passation Relais Équipe Matin/Midi', kiosk: 'Borne Quai Sud', ip: '194.154.88.6', hash: '9922ee44aa1100bb', status: 'Relais 3x8' },
        { id: '#92804', timestamp: '2026-10-09 13:30:20', employee: 'Nicolas Moreau', event: 'Pause Réglementaire 30 min', kiosk: 'Borne Zone Picking', ip: '194.154.88.8', hash: '3344cc99aa22ff11', status: 'Pause CCT' },
        { id: '#92805', timestamp: '2026-10-09 21:55:00', employee: 'Olivier Bertrand', event: 'Prise de Poste Équipe Nuit', kiosk: 'Borne Réception Fret', ip: '194.154.88.10', hash: '88ee11aa55bb99cc', status: 'Shift Nuit' }
      ]
    }
  },

  airport: {
    id: 'airport',
    iconName: 'Plane',
    themeColor: 'sky',
    names: {
      fr: 'Aéroports & Transport 24/7',
      nl: 'Luchthavens & 24/7 Vervoer',
      en: 'Airports & 24/7 Transport'
    },
    tenants: {
      fr: 'Brussels Airport Ground Services • Zaventem (CP 315.02)',
      nl: 'Brussels Airport Ground Services • Zaventem (PC 315.02)',
      en: 'Brussels Airport Ground Services • Zaventem (JLC 315.02)'
    },
    sites: {
      fr: '2 terminaux • Zone Piste & Fret Brucargo',
      nl: '2 terminals • Baanzone & Brucargo Vracht',
      en: '2 terminals • Tarmac & Brucargo Freight'
    },
    kpis: {
      present: '208 / 220',
      presentPct: '94.5%',
      breakCount: 9,
      offCount: 3,
      punctuality: '99.7%',
      todayHours: '1.640h',
      targetHours: '1.720h'
    },
    hourlyCurve: [
      { hour: '04h', count: 65, label: '04:00 (Premier banc vols)' },
      { hour: '06h', count: 185, label: '06:00 (Pic départs matin)', peak: true },
      { hour: '09h', count: 160, label: '09:00' },
      { hour: '11h', count: 195, label: '11:00 (Pic hub)', peak: true },
      { hour: '14h', count: 170, label: '14:00' },
      { hour: '17h', count: 205, label: '17:00 (Pic vols soir)', peak: true },
      { hour: '20h', count: 180, label: '20:00' },
      { hour: '23h', count: 95, label: '23:00 (Fret de nuit)' },
      { hour: '02h', count: 60, label: '02:00 (Opérations 24/7)' }
    ],
    departments: [
      { name: { fr: 'Piste & Manutention Bagages', nl: 'Baanzone & Bagageafhandeling', en: 'Tarmac & Baggage Ops' }, pct: 46, count: 96, color: 'bg-sky-600', fill: '#0284c7' },
      { name: { fr: 'Enregistrement & Embarquement', nl: 'Inchecken & Boarding', en: 'Check-in & Boarding' }, pct: 26, count: 54, color: 'bg-indigo-500', fill: '#6366f1' },
      { name: { fr: 'Sécurité & Contrôle Accès', nl: 'Veiligheid & Toegangscontrole', en: 'Security & Access' }, pct: 16, count: 33, color: 'bg-blue-600', fill: '#2563eb' },
      { name: { fr: 'Coordination & Dispatch', nl: 'Coördinatie & Dispatch', en: 'Dispatch & Ops' }, pct: 12, count: 25, color: 'bg-amber-500', fill: '#f59e0b' }
    ],
    weeklyHours: [
      { day: { fr: 'Lun', nl: 'Ma', en: 'Mon' }, reg: 1580, over: 85, hReg: '89%', hOver: '10%' },
      { day: { fr: 'Mar', nl: 'Di', en: 'Tue' }, reg: 1600, over: 90, hReg: '90%', hOver: '10%' },
      { day: { fr: 'Mer', nl: 'Wo', en: 'Wed' }, reg: 1590, over: 80, hReg: '89%', hOver: '9%' },
      { day: { fr: 'Jeu', nl: 'Do', en: 'Thu' }, reg: 1620, over: 95, hReg: '91%', hOver: '11%' },
      { day: { fr: 'Ven', nl: 'Vr', en: 'Fri' }, reg: 1690, over: 115, hReg: '93%', hOver: '13%' },
      { day: { fr: 'Sam', nl: 'Za', en: 'Sat' }, reg: 1640, over: 110, hReg: '92%', hOver: '12%' },
      { day: { fr: 'Dim', nl: 'Zo', en: 'Sun' }, reg: 1660, over: 120, hReg: '93%', hOver: '14%' }
    ],
    regMetrics: {
      nightVal: '280h',
      sundayVal: '190h',
      studentVal: '210h / 412h',
      recupVal: '65,0h'
    },
    employees: [
      { id: 1, name: 'Philippe Janssens', initials: 'PJ', role: { fr: 'Superviseur Piste (CP 315)', nl: 'Supervisior Baanzone (PC 315)', en: 'Ramp Supervisor (JLC 315)' }, badgeId: '#BE-9001', location: 'Terminal 1 Gate B', kiosk: 'Kiosk Rampe Aérogare', time: '04:15:30', hours: '6h 45m / 8h 00m', progressPercent: 84, status: 'working' },
      { id: 2, name: 'Nathalie Peeters', initials: 'NP', role: { fr: 'Agent Enregistrement T1', nl: 'Incheckagent T1', en: 'Check-in Agent T1' }, badgeId: '#BE-9044', location: 'Hall Départs Zaventem', kiosk: 'Kiosk Comptoirs 1-12', time: '05:00:00', hours: '6h 00m / 7h 36m', progressPercent: 79, status: 'working' },
      { id: 3, name: 'Cedric Dubois', initials: 'CD', role: { fr: 'Opérateur Bagages & Tri', nl: 'Bagageoperator & Sortering', en: 'Baggage Sorter' }, badgeId: '#BE-9082', location: 'Zone Tri Bagages Bxl', kiosk: 'Kiosk Sous-sol B', time: '04:30:15', hours: 'Pause 30m / 30m', progressPercent: 70, status: 'break' },
      { id: 4, name: 'Amina El Fassi', initials: 'AF', role: { fr: 'Agent d\'Escale Trilingue', nl: 'Meertalig Grondsteward', en: 'Trilingual Gate Agent' }, badgeId: '#BE-9019', location: 'Portes Embarquement Pier A', kiosk: 'Kiosk Embarquement', time: '06:00:00', hours: '5h 00m / 7h 36m', progressPercent: 66, status: 'working' },
      { id: 5, name: 'Wim De Craene', initials: 'WC', role: { fr: 'Coordinateur Fret Aérien', nl: 'Luchtvrachtcoördinator', en: 'Air Cargo Coordinator' }, badgeId: '#BE-9012', location: 'Brucargo Zone Ouest', kiosk: 'Kiosk Fret Brucargo', time: '22:00:00', hours: '8h 00m (Shift Nuit Fret)', progressPercent: 100, status: 'out' }
    ],
    reports: {
      payroll: [
        { matricule: 'BE-9001', name: 'Philippe Janssens', cp: 'CP 315.02', regHours: '168.0 h', over150: '18.0 h', dim200: '16.0 h', total: '202.0 h', dimona: 'OK', sha: '77a1...88ff' },
        { matricule: 'BE-9044', name: 'Nathalie Peeters', cp: 'CP 315.02', regHours: '160.0 h', over150: '8.0 h', dim200: '12.0 h', total: '180.0 h', dimona: 'OK', sha: '99cc...22aa' },
        { matricule: 'BE-9082', name: 'Cedric Dubois', cp: 'CP 315.02', regHours: '168.0 h', over150: '15.0 h', dim200: '16.0 h', total: '199.0 h', dimona: 'OK', sha: '33dd...55bb' },
        { matricule: 'BE-9019', name: 'Amina El Fassi', cp: 'CP 315.02', regHours: '160.0 h', over150: '6.0 h', dim200: '8.0 h', total: '174.0 h', dimona: 'OK', sha: '11ee...66aa' },
        { matricule: 'BE-9012', name: 'Wim De Craene', cp: 'CP 315.02', regHours: '168.0 h', over150: '22.0 h', dim200: '24.0 h', total: '214.0 h', dimona: 'OK', sha: '22ff...99ee' }
      ],
      overtime: [
        { matricule: 'BE-9001', name: 'Philippe Janssens', cp: 'CP 315.02', regHours: '168.0 h', nightHours: '42.0 h', over150: '18.0 h', dim200: '16.0 h', recupBank: '18.0 h', status: 'Validé' },
        { matricule: 'BE-9044', name: 'Nathalie Peeters', cp: 'CP 315.02', regHours: '160.0 h', nightHours: '20.0 h', over150: '8.0 h', dim200: '12.0 h', recupBank: '8.0 h', status: 'Validé' },
        { matricule: 'BE-9082', name: 'Cedric Dubois', cp: 'CP 315.02', regHours: '168.0 h', nightHours: '48.0 h', over150: '15.0 h', dim200: '16.0 h', recupBank: '15.0 h', status: 'Prime 24/7' },
        { matricule: 'BE-9019', name: 'Amina El Fassi', cp: 'CP 315.02', regHours: '160.0 h', nightHours: '16.0 h', over150: '6.0 h', dim200: '8.0 h', recupBank: '6.0 h', status: 'Validé' },
        { matricule: 'BE-9012', name: 'Wim De Craene', cp: 'CP 315.02', regHours: '168.0 h', nightHours: '64.0 h', over150: '22.0 h', dim200: '24.0 h', recupBank: '22.0 h', status: 'Plafond CCT' }
      ],
      audit: [
        { id: '#94010', timestamp: '2026-10-09 04:15:30', employee: 'Philippe Janssens', event: 'Scan Badge Piste Aérodrome', kiosk: 'Borne Rampe Aérogare', ip: '194.7.12.1', hash: '77a1100bbcc22dd1', status: 'Zone Piste OK' },
        { id: '#94011', timestamp: '2026-10-09 05:00:00', employee: 'Nathalie Peeters', event: 'Ouverture Comptoir 1-12', kiosk: 'Borne Départs T1', ip: '194.7.12.14', hash: '99cc22aa44bb55ee', status: 'SHA-256 OK' },
        { id: '#94012', timestamp: '2026-10-09 11:30:15', employee: 'Amina El Fassi', event: 'Scan Embarquement Vol SN381', kiosk: 'Borne Pier A', ip: '194.7.14.88', hash: '11ee66aa88bb2200', status: 'Porte Ouverte' },
        { id: '#94013', timestamp: '2026-10-09 13:00:00', employee: 'Cedric Dubois', event: 'Pause Réglementaire 30 min', kiosk: 'Borne Sous-sol Tri B', ip: '194.7.16.22', hash: '33dd55bb8811ee44', status: 'Conformité CCT' },
        { id: '#94014', timestamp: '2026-10-09 22:00:00', employee: 'Wim De Craene', event: 'Scan Relais Nuit Brucargo', kiosk: 'Borne Brucargo Ouest', ip: '194.7.20.5', hash: '22ff99ee11aa44bb', status: 'Shift Nuit 24/7' }
      ]
    }
  }
};

export default function LandingBelgium() {
  const [lang, setLang] = useState('fr'); // 'fr', 'nl', 'en'
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [seats, setSeats] = useState(18);
  const [openFaq, setOpenFaq] = useState(0);

  // Pro Dashboard Interactive State
  const [activeSector, setActiveSector] = useState('horeca'); // 'horeca', 'office', 'retail', 'logistics', 'airport'
  const [dashTab, setDashTab] = useState('overview'); // 'overview', 'live', 'analytics', 'reports'
  const [dashFilter, setDashFilter] = useState('all'); // 'all', 'working', 'break', 'out'
  const [dashSearch, setDashSearch] = useState('');
  const [reportType, setReportType] = useState('payroll'); // 'payroll', 'overtime', 'audit'
  const [selectedSec, setSelectedSec] = useState('SD Worx');
  const [exportToast, setExportToast] = useState(null);
  const [inspectedEmp, setInspectedEmp] = useState(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    employees: '10-25'
  });

  const t = CONTENT[lang] || CONTENT.fr;

  // Sync document title
  useEffect(() => {
    if (lang === 'nl') {
      document.title = "time.be — Digitale Prikklok & Tijdsregistratie in België";
    } else if (lang === 'en') {
      document.title = "time.be — Smart Digital Time Tracking & Attendance in Belgium";
    } else {
      document.title = "time.be — Pointeuse Digitale Intelligente & Enregistrement du Temps en Belgique";
    }
  }, [lang]);

  // Seat Calculator Math
  const pricePerSeat = 9.90;
  const subtotal = (seats * pricePerSeat).toFixed(2);
  const vat = (subtotal * 0.21).toFixed(2);
  const totalWithVat = (parseFloat(subtotal) + parseFloat(vat)).toFixed(2);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const handleTriggerExport = () => {
    setShowExportSuccess(true);
    setTimeout(() => {
      setShowExportSuccess(false);
    }, 4500);
  };

  // Active sector data & employees
  const currentSector = SECTORS_DATA[activeSector] || SECTORS_DATA.horeca;
  const currentEmployees = currentSector.employees;

  const filteredEmployees = currentEmployees.filter((emp) => {
    if (dashFilter === 'working' && emp.status !== 'working') return false;
    if (dashFilter === 'break' && emp.status !== 'break') return false;
    if (dashFilter === 'out' && emp.status !== 'out') return false;
    if (dashSearch.trim()) {
      const q = dashSearch.toLowerCase();
      const roleStr = (emp.role[lang] || emp.role.fr || '').toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        roleStr.includes(q) ||
        emp.badgeId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const triggerExport = (format) => {
    setExportToast(`${t.reportSuccessToast} ${selectedSec} (${format})`);
    setTimeout(() => {
      setExportToast(null);
    }, 4500);
  };

  // Helper to compute SVG area chart for 24h presence flow
  const renderAreaPath = (curve) => {
    const width = 760;
    const height = 180;
    const paddingX = 40;
    const paddingY = 25;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;
    const maxVal = Math.max(...curve.map(c => c.count), 1);

    const points = curve.map((c, i) => {
      const x = paddingX + (i / (curve.length - 1)) * plotWidth;
      const y = height - paddingY - (c.count / maxVal) * plotHeight;
      return { x, y, count: c.count, hour: c.hour, label: c.label, peak: c.peak };
    });

    const d = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${d} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { points, d, areaD, width, height, maxVal, paddingY };
  };

  // Helper to compute Donut segments
  let cumulativeAngle = 0;
  const donutSegments = (currentSector.departments || []).map((dept) => {
    const strokeDasharray = `${(dept.pct / 100) * 326.72} 326.72`;
    const strokeDashoffset = -((cumulativeAngle / 100) * 326.72);
    cumulativeAngle += dept.pct;
    return { ...dept, strokeDasharray, strokeDashoffset };
  });

  const areaPlot = renderAreaPath(currentSector.hourlyCurve || []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Compliance Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlagBE />
            <span className="font-semibold text-slate-100">{t.topTicker}</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SaaS 100% Cloud Belge & UE</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Clean White Navbar with [QR Icon] time.be */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand: [QR Icon] time.be */}
          <Link to="/be" className="flex items-center gap-2.5 group cursor-pointer focus:outline-none">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <QrCode size={22} strokeWidth={2.4} />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                time
              </span>
              <span className="text-2xl font-black tracking-tight text-blue-600">
                .be
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#dashboard" className="hover:text-blue-600 transition-colors whitespace-nowrap">
              {t.navDashboard}
            </a>
            <a href="#sectors" className="hover:text-blue-600 transition-colors whitespace-nowrap">
              {t.navSectors}
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors whitespace-nowrap">
              {t.navPricing}
            </a>
            <a href="#faq" className="hover:text-blue-600 transition-colors whitespace-nowrap">
              {t.navFaq}
            </a>
          </nav>

          {/* Language Switcher & Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  lang === 'fr' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FlagFR />
                <span>FR</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('nl')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  lang === 'nl' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FlagNL />
                <span>NL</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  lang === 'en' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FlagEN />
                <span>EN</span>
              </button>
            </div>

            {/* Login Link */}
            <Link
              to="/admin/login"
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 rounded-full transition-colors hidden sm:block whitespace-nowrap"
            >
              {t.navLogin}
            </Link>

            {/* Single-line Primary Action Button */}
            <button
              type="button"
              onClick={() => setShowSubscribeModal(true)}
              className="px-5 sm:px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Sparkles size={16} />
              <span className="whitespace-nowrap">{t.navCta}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t.heroEyebrow}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
              {t.heroTitlePart1}
              <span className="text-blue-600">
                {t.heroTitleHighlight}
              </span>
              {t.heroTitlePart2}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed font-normal">
              {t.heroSubtitle}
            </p>

            {/* CTAs - STRICTLY SINGLE LINE BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-10">
              <button
                type="button"
                onClick={() => setShowSubscribeModal(true)}
                className="w-full sm:w-auto h-12 px-7 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
              >
                <span className="whitespace-nowrap">{t.heroCtaPrimary}</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="w-full sm:w-auto h-12 px-6 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm sm:text-base rounded-full shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Calendar size={17} className="text-amber-500" />
                <span className="whitespace-nowrap">{t.navDemoBtn}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">{t.heroTrust1}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">{t.heroTrust2}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">{t.heroTrust3}</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Real Photography of Belgian Check-in with Floating Live Card */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
              <img 
                src="/images/belgium_hero.jpg" 
                alt="Pointage en direct dans un restaurant en Belgique" 
                className="w-full h-[420px] sm:h-[460px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              
              {/* Floating Verified Check-in Card */}
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    SD
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>Sophie Dubois</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {t.heroFloatingStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {t.heroFloatingSubtitle}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCheck size={16} />
                  <span className="whitespace-nowrap">{t.heroFloatingBadge}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Belgian Social Secretariats Trust Bar */}
      <section className="bg-white border-y border-slate-200 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span className="text-sm font-bold text-slate-800">
              {t.secretariatsTitle}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-black">
            {['SD Worx', 'Partena Professional', 'Securex', 'Liantis', 'Acerta'].map((sec) => (
              <span 
                key={sec}
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 tracking-wide shadow-2xs hover:border-blue-400 transition-colors"
              >
                {sec}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Real-World Contexts & Environments Showcase */}
      <section id="sectors" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-3">
            <Building2 size={14} />
            <span>{t.sectorsBadge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {t.sectorsTitle}
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            {t.sectorsSub}
          </p>
        </div>

        {/* 4 Large Real-World Sector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Restaurants & HoReCa */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col">
            <img 
              src="/images/belgium_hero.jpg" 
              alt="HoReCa Belgique" 
              className="w-full h-56 object-cover"
            />
            <div className="p-7 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit mb-3 border border-amber-200">
                  <UtensilsCrossed size={14} />
                  <span>{t.secHorecaTag}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t.secHorecaName}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {t.secHorecaDesc}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{t.secHorecaFootLeft}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSector('horeca');
                    setDashTab('overview');
                    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{t.btnViewSectorDemo}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Bureaux & PME */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col">
            <img 
              src="/images/belgium_office.jpg" 
              alt="Bureaux Bruxelles" 
              className="w-full h-56 object-cover"
            />
            <div className="p-7 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full w-fit mb-3 border border-blue-200">
                  <Laptop size={14} />
                  <span>{t.secOfficeTag}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t.secOfficeName}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {t.secOfficeDesc}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{t.secOfficeFootLeft}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSector('office');
                    setDashTab('overview');
                    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{t.btnViewSectorDemo}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Boutiques & Retail */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col">
            <img 
              src="/images/belgium_retail.jpg" 
              alt="Retail Anvers" 
              className="w-full h-56 object-cover"
            />
            <div className="p-7 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full w-fit mb-3 border border-purple-200">
                  <ShoppingBag size={14} />
                  <span>{t.secRetailTag}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t.secRetailName}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {t.secRetailDesc}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{t.secRetailFootLeft}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSector('retail');
                    setDashTab('overview');
                    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{t.btnViewSectorDemo}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Aéroports, Santé & Grands Sites */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col">
            <img 
              src="/images/belgium_airport.jpg" 
              alt="Aéroport & Logistique Belgique" 
              className="w-full h-56 object-cover"
            />
            <div className="p-7 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit mb-3 border border-emerald-200">
                  <Plane size={14} />
                  <span>{t.secAirportTag}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t.secAirportName}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {t.secAirportDesc}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{t.secAirportFootLeft}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSector('airport');
                    setDashTab('overview');
                    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{t.btnViewSectorDemo}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ULTRA-PRO, HIGH-PERFORMANCE INTERACTIVE DASHBOARD SECTION */}
      <section id="dashboard" className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 border border-blue-200">
              <BarChart3 size={14} />
              <span>{t.dashPill}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              {t.dashHeaderTitle}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {t.dashHeaderSub}
            </p>
          </div>

          {/* Multi-Industry Operational Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
            {[
              { id: 'horeca', icon: UtensilsCrossed, label: t.sectorHoreca, count: '45 pers.' },
              { id: 'office', icon: Laptop, label: t.sectorOffice, count: '88 pers.' },
              { id: 'retail', icon: ShoppingBag, label: t.sectorRetail, count: '58 pers.' },
              { id: 'logistics', icon: Warehouse, label: t.sectorLogistics, count: '145 pers.' },
              { id: 'airport', icon: Plane, label: t.sectorAirport, count: '220 pers.' }
            ].map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSector === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setActiveSector(sec.id);
                    setDashFilter('all');
                  }}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-102 ring-2 ring-blue-600 ring-offset-2'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs hover:border-slate-400'
                  }`}
                >
                  <Icon size={15} />
                  <span>{sec.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {sec.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* High-Performance SaaS Application Window Frame */}
          <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden">
            {/* Top Browser Bar */}
            <div className="bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-semibold text-slate-500 bg-white px-4 py-1 rounded-full border border-slate-200 shadow-2xs hidden sm:inline-block">
                  https://app.time.be/dashboard/{activeSector}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 hidden md:inline">
                  {currentSector.tenants[lang] || currentSector.tenants.fr}
                </span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.dashLiveStatus}</span>
                </span>
              </div>
            </div>

            {/* Pro Interactive Navigation Tabs */}
            <div className="bg-slate-50 px-4 sm:px-6 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setDashTab('overview')}
                className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  dashTab === 'overview'
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity size={16} />
                <span>{t.tabOverview}</span>
              </button>

              <button
                type="button"
                onClick={() => setDashTab('live')}
                className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  dashTab === 'live'
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={16} />
                <span>{t.tabLive}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px]">
                  {currentSector.kpis.present.split('/')[0].trim()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDashTab('analytics')}
                className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  dashTab === 'analytics'
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 size={16} />
                <span>{t.tabAnalytics}</span>
              </button>

              <button
                type="button"
                onClick={() => setDashTab('reports')}
                className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  dashTab === 'reports'
                    ? 'border-blue-600 text-blue-600 bg-white shadow-2xs rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet size={16} />
                <span>{t.tabReports}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
                  eBlox
                </span>
              </button>
            </div>

            {/* Dashboard Content Container */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* TAB 1: EXECUTIVE OVERVIEW & HOURLY PRESENCE CURVES */}
              {dashTab === 'overview' && (
                <div className="space-y-6">
                  {/* 4 Metric KPI Cards for the active sector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
                      <div className="flex items-center justify-between text-blue-700 text-xs font-bold mb-2">
                        <span>{t.kpiPresent}</span>
                        <Users size={16} />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900">
                        {currentSector.kpis.present}
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{currentSector.kpis.presentPct} en activité continue</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
                      <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-2">
                        <span>{t.kpiBreak}</span>
                        <Coffee size={16} />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900">
                        {currentSector.kpis.breakCount}
                      </div>
                      <div className="text-xs text-amber-700 font-semibold mt-1">
                        Pauses en cours (conforme CCT)
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                      <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-2">
                        <span>{t.kpiPunctuality}</span>
                        <TrendingUp size={16} />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900">
                        {currentSector.kpis.punctuality}
                      </div>
                      <div className="text-xs text-emerald-600 font-semibold mt-1">
                        Zéro anomalie critique non régularisée
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-slate-600 text-xs font-bold mb-2">
                        <span>{t.kpiTodayHours}</span>
                        <Clock size={16} />
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900">
                        {currentSector.kpis.todayHours}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-1">
                        {t.kpiTargetHours} {currentSector.kpis.targetHours}
                      </div>
                    </div>
                  </div>

                  {/* 2 Interactive Graphical Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Graph 1: Courbe d'Affluence & Pic de Présence (24h) */}
                    <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{t.chartAffluenceTitle}</h4>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              Temps réel
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{t.chartAffluenceSub}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span>Collaborateurs présents</span>
                        </div>
                      </div>

                      {/* SVG Responsive Area Chart */}
                      <div className="relative w-full pt-2">
                        <svg viewBox="0 0 760 180" className="w-full h-44 overflow-visible">
                          <defs>
                            <linearGradient id="affluenceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Dashed Horizontal Guidelines */}
                          <line x1="30" y1="45" x2="730" y2="45" stroke="#e2e8f0" strokeDasharray="4 4" />
                          <line x1="30" y1="90" x2="730" y2="90" stroke="#e2e8f0" strokeDasharray="4 4" />
                          <line x1="30" y1="135" x2="730" y2="135" stroke="#e2e8f0" strokeDasharray="4 4" />
                          <line x1="30" y1="155" x2="730" y2="155" stroke="#cbd5e1" />

                          {/* Area Gradient Fill */}
                          <path d={areaPlot.areaD} fill="url(#affluenceGrad)" />

                          {/* Primary Smooth Curve Line */}
                          <path d={areaPlot.d} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

                          {/* Points & Peak Badges */}
                          {areaPlot.points.map((p, idx) => (
                            <g key={idx} className="group cursor-pointer">
                              {p.peak && (
                                <>
                                  <circle cx={p.x} cy={p.y} r="8" fill="#3b82f6" className="animate-ping opacity-40" />
                                  <rect
                                    x={p.x - 42}
                                    y={p.y - 28}
                                    width="84"
                                    height="20"
                                    rx="10"
                                    fill="#1e293b"
                                  />
                                  <text
                                    x={p.x}
                                    y={p.y - 14}
                                    textAnchor="middle"
                                    fill="#ffffff"
                                    fontSize="10"
                                    fontWeight="bold"
                                  >
                                    {p.count} pers.
                                  </text>
                                </>
                              )}
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={p.peak ? "5" : "3.5"}
                                fill={p.peak ? "#2563eb" : "#ffffff"}
                                stroke="#2563eb"
                                strokeWidth="2.5"
                                className="transition-all hover:scale-150"
                              />
                              <text
                                x={p.x}
                                y="172"
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize="10"
                                fontWeight="600"
                              >
                                {p.hour}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>

                      <div className="pt-3 border-t border-slate-200 mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Période active : 00:00 - 24:00</span>
                        <span className="font-semibold text-blue-600">
                          {currentSector.sites[lang] || currentSector.sites.fr}
                        </span>
                      </div>
                    </div>

                    {/* Graph 2: Répartition par Département & Postes */}
                    <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">{t.chartDeptTitle}</h4>
                        <p className="text-xs text-slate-500 mb-4">{t.chartDeptSub}</p>

                        <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
                          {/* SVG Donut Chart */}
                          <div className="relative w-32 h-32 shrink-0">
                            <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90">
                              <circle
                                cx="65"
                                cy="65"
                                r="52"
                                fill="transparent"
                                stroke="#f1f5f9"
                                strokeWidth="20"
                              />
                              {donutSegments.map((dept, idx) => (
                                <circle
                                  key={idx}
                                  cx="65"
                                  cy="65"
                                  r="52"
                                  fill="transparent"
                                  stroke={dept.fill}
                                  strokeWidth="20"
                                  strokeDasharray={dept.strokeDasharray}
                                  strokeDashoffset={dept.strokeDashoffset}
                                  className="transition-all hover:opacity-85"
                                />
                              ))}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                              <span className="text-xl font-black text-slate-900 leading-none">
                                {currentSector.kpis.present.split('/')[0].trim()}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                Présents
                              </span>
                            </div>
                          </div>

                          {/* Department Breakdown List */}
                          <div className="flex-1 w-full space-y-2.5">
                            {currentSector.departments.map((dept, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <span className="flex items-center gap-1.5 text-slate-700">
                                    <span className={`w-2 h-2 rounded-full ${dept.color}`} />
                                    <span className="truncate max-w-[120px]">{dept.name[lang] || dept.name.fr}</span>
                                  </span>
                                  <span className="text-slate-900 font-bold">{dept.pct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full ${dept.color} rounded-full`}
                                    style={{ width: `${dept.pct}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Total collaborateurs :</span>
                        <span className="font-bold text-slate-800">
                          {currentSector.kpis.present.split('/')[1]?.trim() || '45'} inscrits
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Live Scan Event Ticker */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      <span className="font-semibold text-slate-900">{t.liveTickerPrefix}</span>
                      <span className="text-slate-600">
                        {currentEmployees[0]?.name} a pointé au poste ({currentEmployees[0]?.kiosk} • {currentEmployees[0]?.time})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDashTab('live')}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap self-end sm:self-auto"
                    >
                      <span>Voir le flux complet ({currentEmployees.length})</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: LIVE ATTENDANCE TABLE */}
              {dashTab === 'live' && (
                <div className="space-y-6">
                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-80">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={dashSearch}
                          onChange={(e) => setDashSearch(e.target.value)}
                          placeholder={t.filterSearchPlaceholder}
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-full border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setDashFilter('all')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                          dashFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.filterAll} ({currentEmployees.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashFilter('working')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                          dashFilter === 'working'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.filterWorking}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashFilter('break')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                          dashFilter === 'break'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.filterBreak}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashFilter('out')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                          dashFilter === 'out'
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.filterOut}
                      </button>
                    </div>
                  </div>

                  {/* High-Density Attendance Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">{t.thEmployee}</th>
                            <th className="py-3 px-4">{t.thRole}</th>
                            <th className="py-3 px-4 hidden md:table-cell">{t.thLocation}</th>
                            <th className="py-3 px-4">{t.thClockIn}</th>
                            <th className="py-3 px-4">{t.thHours}</th>
                            <th className="py-3 px-4">{t.thStatus}</th>
                            <th className="py-3 px-4 text-right">{t.thAction}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-slate-100">
                                    {emp.initials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{emp.name}</div>
                                    <div className="text-[11px] text-slate-500 font-semibold">{emp.badgeId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-800">
                                  {emp.role[lang] || emp.role.fr}
                                </span>
                              </td>
                              <td className="py-3 px-4 hidden md:table-cell">
                                <div className="text-slate-700 font-medium">{emp.location}</div>
                                <div className="text-[11px] text-slate-400">{emp.kiosk}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-700 font-semibold">
                                {emp.time}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-800">{emp.hours}</div>
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div 
                                    className={`h-full rounded-full ${
                                      emp.progressPercent > 95 ? 'bg-amber-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${emp.progressPercent}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  emp.status === 'working'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : emp.status === 'break'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    emp.status === 'working' ? 'bg-emerald-500 animate-pulse' : emp.status === 'break' ? 'bg-amber-500' : 'bg-slate-400'
                                  }`} />
                                  <span>
                                    {emp.status === 'working' ? t.stWorking : emp.status === 'break' ? t.stBreak : t.stOut}
                                  </span>
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setInspectedEmp(emp)}
                                  className="px-3 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  {t.btnInspect}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ANALYTICS & OVERTIME CHART */}
              {dashTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Top Bar with Period & Metrics */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{t.analyticsHeader}</h4>
                      <p className="text-xs text-slate-500">{t.analyticsWeek}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-blue-600" />
                        <span className="text-slate-700">{t.legendRegular}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-amber-500" />
                        <span className="text-slate-700">{t.legendOvertime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stacked Interactive Bar Chart */}
                  <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                    <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
                      {currentSector.weeklyHours.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-[11px] font-extrabold text-slate-800">
                            {item.reg + item.over}h
                          </span>
                          <div className="w-full max-w-[48px] bg-slate-200 rounded-t-xl overflow-hidden h-36 flex flex-col justify-end">
                            <div 
                              className="w-full bg-amber-500 transition-all hover:opacity-90"
                              style={{ height: item.hOver }}
                              title={`${item.over}h overtime`}
                            />
                            <div 
                              className="w-full bg-gradient-to-t from-blue-700 to-blue-500 transition-all hover:opacity-90"
                              style={{ height: item.hReg }}
                              title={`${item.reg}h regular`}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {item.day[lang] || item.day.fr}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4 Statutory Regulation Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">{t.regNight}</div>
                      <div className="text-xl font-black text-slate-900">{currentSector.regMetrics.nightVal}</div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">{t.regNightSub}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">{t.regSunday}</div>
                      <div className="text-xl font-black text-slate-900">{currentSector.regMetrics.sundayVal}</div>
                      <div className="text-[11px] text-blue-600 font-semibold mt-1">{t.regSundaySub}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">{t.regStudent}</div>
                      <div className="text-xl font-black text-slate-900">{currentSector.regMetrics.studentVal}</div>
                      <div className="text-[11px] text-purple-600 font-semibold mt-1">{t.regStudentSub}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <div className="text-xs text-slate-500 font-semibold mb-1">{t.regRecup}</div>
                      <div className="text-xl font-black text-slate-900">{currentSector.regMetrics.recupVal}</div>
                      <div className="text-[11px] text-amber-600 font-semibold mt-1">{t.regRecupSub}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EXECUTIVE REPORTS & SOCIAL SECRETARIAT SUITE */}
              {dashTab === 'reports' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-0.5">{t.reportsTitle}</h4>
                      <p className="text-xs text-slate-500">{t.reportsSub}</p>
                    </div>

                    {/* Report Format Switcher */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setReportType('payroll')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                          reportType === 'payroll'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.repTypePayroll}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType('overtime')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                          reportType === 'overtime'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.repTypeOvertime}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType('audit')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                          reportType === 'audit'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {t.repTypeAudit}
                      </button>
                    </div>
                  </div>

                  {/* Secretariats Selector Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 mr-1">Secrétariat :</span>
                      {['SD Worx', 'Liantis', 'Partena Professional', 'Securex', 'Acerta'].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSelectedSec(sec)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedSec === sec
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerExport('PDF')}
                        className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
                      >
                        <Download size={13} />
                        <span>{t.btnExportPdf}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerExport('Excel')}
                        className="px-4 h-9 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-full border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all"
                      >
                        <FileSpreadsheet size={13} />
                        <span>{t.btnExportExcel}</span>
                      </button>
                    </div>
                  </div>

                  {exportToast && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                      <span>{exportToast}</span>
                    </div>
                  )}

                  {/* High-Density Report Sheet Preview */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      {reportType === 'payroll' && (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-3 px-4">{t.thMatricule}</th>
                              <th className="py-3 px-4">{t.thEmployee}</th>
                              <th className="py-3 px-4">{t.thCP}</th>
                              <th className="py-3 px-4">{t.thRegHours}</th>
                              <th className="py-3 px-4">{t.thOver150}</th>
                              <th className="py-3 px-4">{t.thDim200}</th>
                              <th className="py-3 px-4">{t.thTotalHours}</th>
                              <th className="py-3 px-4">{t.thDimona}</th>
                              <th className="py-3 px-4 text-right">{t.thSignature}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {currentSector.reports.payroll.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900">{row.matricule}</td>
                                <td className="py-3 px-4 font-sans font-semibold text-slate-900">{row.name}</td>
                                <td className="py-3 px-4 text-slate-600">{row.cp}</td>
                                <td className="py-3 px-4 text-slate-800">{row.regHours}</td>
                                <td className="py-3 px-4 text-amber-600 font-semibold">{row.over150}</td>
                                <td className="py-3 px-4 text-blue-600 font-semibold">{row.dim200}</td>
                                <td className="py-3 px-4 font-bold text-slate-900">{row.total}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {row.dimona}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right text-slate-400 text-[10px]">
                                  {row.sha}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {reportType === 'overtime' && (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-3 px-4">{t.thMatricule}</th>
                              <th className="py-3 px-4">{t.thEmployee}</th>
                              <th className="py-3 px-4">{t.thCP}</th>
                              <th className="py-3 px-4">Heures Normales</th>
                              <th className="py-3 px-4">Heures Nuit (Maj.)</th>
                              <th className="py-3 px-4">Supp. 150%</th>
                              <th className="py-3 px-4">Dimanche 200%</th>
                              <th className="py-3 px-4">Banque Récup.</th>
                              <th className="py-3 px-4 text-right">Statut RH</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {currentSector.reports.overtime.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900">{row.matricule}</td>
                                <td className="py-3 px-4 font-sans font-semibold text-slate-900">{row.name}</td>
                                <td className="py-3 px-4 text-slate-600">{row.cp}</td>
                                <td className="py-3 px-4 text-slate-800">{row.regHours}</td>
                                <td className="py-3 px-4 text-purple-600 font-semibold">{row.nightHours}</td>
                                <td className="py-3 px-4 text-amber-600 font-semibold">{row.over150}</td>
                                <td className="py-3 px-4 text-blue-600 font-semibold">{row.dim200}</td>
                                <td className="py-3 px-4 font-bold text-slate-900">{row.recupBank}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {reportType === 'audit' && (
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="py-3 px-4">ID Événement</th>
                              <th className="py-3 px-4">Horodatage Légal</th>
                              <th className="py-3 px-4">{t.thEmployee}</th>
                              <th className="py-3 px-4">Événement & Justificatif</th>
                              <th className="py-3 px-4">Borne Kiosk</th>
                              <th className="py-3 px-4">Adresse IP</th>
                              <th className="py-3 px-4 text-right">Signature SHA-256</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {currentSector.reports.audit.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-blue-600">{row.id}</td>
                                <td className="py-3 px-4 text-slate-700">{row.timestamp}</td>
                                <td className="py-3 px-4 font-sans font-semibold text-slate-900">{row.employee}</td>
                                <td className="py-3 px-4 font-sans text-slate-800">{row.event}</td>
                                <td className="py-3 px-4 text-slate-500">{row.kiosk}</td>
                                <td className="py-3 px-4 text-slate-400">{row.ip}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-emerald-400 border border-slate-800">
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-3">
            <CreditCard size={14} />
            <span>{t.pricingBadge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {t.pricingTitle}
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            {t.pricingSub}
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Benefits & Features */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  {t.pricingPlanName}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {t.pricingNoCommit}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-slate-900 tracking-tight">
                  9,90 €
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {t.pricingPerSeat}
                </span>
              </div>

              <div className="space-y-3 mb-8">
                {t.pricingFeats.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Check size={16} className="text-blue-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold">{t.securePayment}</span>
                <BancontactBadge />
                <span className="text-xs font-bold text-slate-700 px-2.5 py-1 rounded bg-slate-100 border border-slate-200">VISA</span>
                <span className="text-xs font-bold text-slate-700 px-2.5 py-1 rounded bg-slate-100 border border-slate-200">Mastercard</span>
              </div>
            </div>

            {/* Right: Interactive Seat Calculator */}
            <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center shadow-xs">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t.calcLabel}
              </label>
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSeats(Math.max(1, seats - 1))}
                  className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-bold text-lg flex items-center justify-center cursor-pointer transition-colors border border-slate-300 shadow-2xs active:scale-95"
                >
                  -
                </button>
                <div className="w-20 text-3xl font-black text-slate-900">
                  {seats}
                </div>
                <button
                  type="button"
                  onClick={() => setSeats(seats + 1)}
                  className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-800 font-bold text-lg flex items-center justify-center cursor-pointer transition-colors border border-slate-300 shadow-2xs active:scale-95"
                >
                  +
                </button>
              </div>

              <input
                type="range"
                min="1"
                max="100"
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer mb-6"
              />

              <div className="p-4 bg-white rounded-2xl border border-slate-200 mb-6 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>{t.calcSubtotal} ({seats} pers.) :</span>
                  <span className="font-bold text-slate-900">{subtotal} €</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{t.calcVat}</span>
                  <span className="text-slate-700">{vat} €</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                  <span>{t.calcTotal}</span>
                  <span className="text-lg text-emerald-700 font-extrabold">{totalWithVat} €</span>
                </div>
              </div>

              {/* Single Line Order Button */}
              <button
                type="button"
                onClick={() => setShowSubscribeModal(true)}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Sparkles size={16} />
                <span className="whitespace-nowrap">{t.btnSubscribe}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Belgian FAQ Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {t.faqTitle}
          </h2>
          <p className="text-slate-600 text-sm">
            {t.faqSub}
          </p>
        </div>

        <div className="space-y-4">
          {t.faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
          
  // Helper to compute SVG area chart for 24h presence flow
  const renderAreaPath = (curve) => {
    const width = 760;
    const height = 180;
    const paddingX = 40;
    const paddingY = 25;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;
    const maxVal = Math.max(...curve.map(c => c.count), 1);

    const points = curve.map((c, i) => {
      const x = paddingX + (i / (curve.length - 1)) * plotWidth;
      const y = height - paddingY - (c.count / maxVal) * plotHeight;
      return { x, y, count: c.count, hour: c.hour, label: c.label, peak: c.peak };
    });

    const d = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${d} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return { points, d, areaD, width, height, maxVal, paddingY };
  };

  // Helper to compute Donut segments
  let cumulativeAngle = 0;
  const donutSegments = (currentSector.departments || []).map((dept) => {
    const strokeDasharray = `${(dept.pct / 100) * 326.72} 326.72`;
    const strokeDashoffset = -((cumulativeAngle / 100) * 326.72);
    cumulativeAngle += dept.pct;
    return { ...dept, strokeDasharray, strokeDashoffset };
  });

  const areaPlot = renderAreaPath(currentSector.hourlyCurve || []);

  return (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left font-bold text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`}>
                    <ChevronDown size={16} />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center shadow-xl text-white">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {t.ctaBannerTitle}
          </h2>
          <p className="text-blue-100 text-sm sm:text-base mb-8 max-w-xl mx-auto">
            {t.ctaBannerSub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowSubscribeModal(true)}
              className="w-full sm:w-auto h-12 px-8 bg-white hover:bg-slate-100 text-blue-900 font-bold text-sm sm:text-base rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <span className="whitespace-nowrap">{t.heroCtaPrimary}</span>
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="w-full sm:w-auto h-12 px-7 bg-blue-800/80 hover:bg-blue-800 border border-white/20 text-white font-bold text-sm sm:text-base rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <span className="whitespace-nowrap">{t.navDemoBtn}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Clean Light Footer with [QR Icon] time.be */}
      <footer className="py-12 bg-white border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200">
            {/* Logo [QR Icon] time.be */}
            <Link to="/be" className="flex items-center gap-2.5 group cursor-pointer focus:outline-none">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
                <QrCode size={18} strokeWidth={2.4} />
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="font-extrabold text-slate-900 text-base">
                  time
                </span>
                <span className="font-extrabold text-blue-600 text-base">
                  .be
                </span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">België / Belgique</span>
            </Link>

            <div className="flex flex-wrap items-center gap-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowGdprModal(true)}
                className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.footerLegal}
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.footerContact}
              </button>
              <span className="text-slate-300">•</span>
              <Link to="/admin/login" className="text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                {t.navLogin}
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>{t.footerText}</p>
            <p>&copy; {new Date().getFullYear()} time.be. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modal Demande de Démo / Contact Commercial */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-left border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {t.modalDemoTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t.modalDemoSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            {contactSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  {t.modalSuccessTitle}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {t.modalSuccessDesc}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowContactModal(false);
                    setContactSubmitted(false);
                  }}
                  className="mt-4 px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t.btnClose}
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="h-5 flex items-center text-slate-700 font-semibold mb-1.5 truncate">
                      {lang === 'nl' ? 'Uw Naam & Voornaam *' : lang === 'en' ? 'Full Name *' : 'Nom & Prénom *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="ex: Jean Dupont"
                      className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="h-5 flex items-center text-slate-700 font-semibold mb-1.5 truncate">
                      {lang === 'nl' ? 'Bedrijfsnaam (BV / SRL) *' : lang === 'en' ? 'Company Name (BV / SRL) *' : 'Nom de l’Entreprise (SRL / BV) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="ex: Brasserie Grand-Place SRL"
                      className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="h-5 flex items-center text-slate-700 font-semibold mb-1.5 truncate">
                      {lang === 'nl' ? 'Telefoonnummer (+32) *' : lang === 'en' ? 'Phone (+32) *' : 'Téléphone (+32) *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+32 470 12 34 56"
                      className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="h-5 flex items-center text-slate-700 font-semibold mb-1.5 truncate">
                      {lang === 'nl' ? 'Professioneel E-mail *' : lang === 'en' ? 'Work Email *' : 'Email Professionnel *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="direction@entreprise.be"
                      className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="h-5 flex items-center text-slate-700 font-semibold mb-1.5 truncate">
                    {lang === 'nl' ? 'Aantal medewerkers' : lang === 'en' ? 'Number of employees' : 'Taille de l’équipe'}
                  </label>
                  <select
                    value={contactForm.employees}
                    onChange={(e) => setContactForm({ ...contactForm, employees: e.target.value })}
                    className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs cursor-pointer"
                  >
                    <option value="1-9">1 - 9 salariés</option>
                    <option value="10-25">10 - 25 salariés</option>
                    <option value="26-50">26 - 50 salariés</option>
                    <option value="51-100">51 - 100 salariés</option>
                    <option value="100+">Plus de 100 salariés</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    {t.navDemoBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Conformité Légale & RGPD Belgique */}
      {showGdprModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowGdprModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {lang === 'nl' ? 'Wettelijke Conformiteit & AVG (België)' : lang === 'en' ? 'Legal Compliance & GDPR (Belgium)' : 'Conformité Légale & RGPD (Belgique)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Arrêt CJUE C-55/18 • SPF / FOD Emploi • Règlement (UE) 2016/679
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGdprModal(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 font-medium">
                <strong>Base Légale Européenne :</strong> L'arrêt de la Cour de Justice de l'UE (14 mai 2019, C-55/18) impose aux employeurs un système objectif, fiable et accessible de mesure du temps de travail journalier.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  1. Rôle du système time.be
                </h4>
                <p>
                  L'employeur agit en qualité de <strong>Responsable du Traitement</strong>, et time.be agit en tant que <strong>Sous-traitant</strong> (Art. 28 RGPD). Les données d'horodatage sont conservées en Europe et ne sont jamais revendues ni partagées à des tiers.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  2. Données traitées & NISS / INSZ
                </h4>
                <p>
                  Nom, prénom, matricule interne ou Numéro de Registre National (NISS / INSZ), horodatage à la seconde (entrée, pause, sortie), localisation du point de travail. Aucune empreinte biométrique sensible n'est enregistrée.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  3. Audit Trail Immuable
                </h4>
                <p>
                  Toutes les interventions manuelles éventuelles sont journalisées avec motif obligatoire, garantissant une intégrité absolue pour les contrôles de l'Inspection sociale belge.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGdprModal(false)}
                className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {t.btnClose}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inscription Self-Service */}
      <SelfServiceSubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        initialTenant={{ country_code: 'BE' }}
        lang={lang}
      />

      {/* Inspection & Certified Timestamp Modal */}
      {inspectedEmp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setInspectedEmp(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck size={18} className="text-blue-600" />
                <span>{t.modalInspectTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedEmp(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 border border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {inspectedEmp.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{inspectedEmp.name}</div>
                  <div className="text-xs text-slate-500 font-semibold">
                    {inspectedEmp.role[lang] || inspectedEmp.role.fr} • {inspectedEmp.badgeId}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-slate-700">
                  <div><strong>Site :</strong> {inspectedEmp.location}</div>
                  <div><strong>Borne Kiosk :</strong> {inspectedEmp.kiosk}</div>
                  <div><strong>Horodatage In :</strong> {inspectedEmp.time} (Précision atomique NTP)</div>
                  <div><strong>Géolocalisation :</strong> 50.8467° N, 4.3524° E (Bruxelles)</div>
                  <div><strong>Empreinte SHA-256 :</strong> e9a174c8b2100df3...88c9</div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600 shrink-0" />
                <span>{t.modalInspectSub}</span>
              </div>

              <button
                type="button"
                onClick={() => setInspectedEmp(null)}
                className="w-full h-11 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-full shadow-md transition-all cursor-pointer"
              >
                {t.btnClose}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
