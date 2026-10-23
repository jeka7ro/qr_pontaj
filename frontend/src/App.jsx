import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import TenantDashboard from './pages/tenant/Dashboard';
import KioskDisplay from './pages/kiosk/KioskDisplay';
import ScanScreen from './pages/scan/ScanScreen';
import LandingPage from './pages/LandingPage';
import LandingBelgium from './pages/LandingBelgium';
import LandingRomania from './pages/LandingRomania';
import EmployeeLogin from './pages/employee/EmployeeLogin';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import ResetPassword from './pages/admin/ResetPassword';
import GdprConsentBanner from './components/GdprConsentBanner';
import AccountantPortal from './pages/accountant/AccountantPortal';
import AnalyticsTracker from './components/AnalyticsTracker';
import { LanguageProvider } from './utils/i18n.jsx';

const getIsSubdomain = () => {
  const hostname = window.location.hostname;
  // Regex for IPv4
  const isIp = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(hostname);
  
  // If it's just 'localhost', an IP address, the main domains, or a Railway domain, it's the root domain.
  if (
    hostname === 'localhost' || 
    isIp || 
    hostname === 'qrpontaj.ro' || 
    hostname === 'www.qrpontaj.ro' ||
    hostname === 'qrtime.ro' ||
    hostname === 'www.qrtime.ro' ||
    hostname === 'pontaj.app' ||
    hostname === 'www.pontaj.app' ||
    hostname === 'scan.pontaj.app' || 
    hostname === 'qr.pontaj.app' ||
    hostname === 'qrtime.be' ||
    hostname === 'www.qrtime.be' ||
    hostname === 'time.be' ||
    hostname === 'www.time.be' ||
    hostname.endsWith('.up.railway.app') ||
    hostname.endsWith('.netlify.app') ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.onrender.com')
  ) {
    return false;
  }
  return true;
};

const isBelgiumHost = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return (
    hostname === 'time.be' ||
    hostname === 'www.time.be' ||
    hostname === 'qrtime.be' || 
    hostname === 'www.qrtime.be' || 
    window.location.search.includes('be=true') ||
    window.location.search.includes('country=BE')
  );
};

// Componentă care rutează `/admin/*` în funcție de domeniu și rol
const AdminRouter = () => {
  const isSubdomain = getIsSubdomain();
  let user = null;
  try {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }
  const isSuper = user && (user.role === 'SUPERADMIN' || user.role === 'Super Admin');

  // Pe subdomenii (unda.qr.pontaj.app, sushihan.qr.pontaj.app etc.) SAU dacă utilizatorul logat este Tenant Admin, afișăm panoul tenantului
  if (isSubdomain || (user && !isSuper)) {
    return <TenantDashboard />;
  }
  
  // Doar SuperAdmin vede panoul centralizat de administrare a platformei
  return <AdminDashboard />;
};

function App() {
  const isSubdomain = getIsSubdomain();

  return (
    <LanguageProvider>
      <Router>
        <AnalyticsTracker />
        <Routes>
          {/* Rută dedicată Kiosk Full Screen (Tablete) */}
          <Route path="/kiosk/:tenantId/:kioskId" element={<KioskDisplay />} />
          
          {/* Rută universală pentru scanare (funcționează și pe IP local) */}
          <Route path="/scan" element={<ScanScreen />} />

          {/* Rută resetare parolă cont administrator */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Portal angajați - disponibil doar pe subdomeniu */}
          {isSubdomain && (
            <>
              <Route path="/login" element={<EmployeeLogin />} />
              <Route path="/" element={<EmployeeLogin />} />
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            </>
          )}

          {/* Rute Parteneri Contabili (Pilonul 1) */}
          <Route path="/contabil" element={<AccountantPortal />} />
          <Route path="/portal-contabil" element={<AccountantPortal />} />
          <Route path="/parteneri-contabili" element={<AccountantPortal />} />

          {/* Rută dedicată Belgia (QRtime.be / time.be) */}
          <Route path="/be" element={<LandingBelgium />} />

          {/* Rută dedicată România (qrpontaj.ro / /ro) */}
          <Route path="/ro" element={<LandingRomania />} />

          {/* Dacă suntem pe domeniul root, arătăm Landing Page pe /, iar /login duce la Admin Login */}
          {!isSubdomain && (
            <>
              <Route path="/" element={isBelgiumHost() ? <LandingBelgium /> : <LandingRomania />} />
              <Route path="/login" element={<AdminLogin />} />
            </>
          )}

          {/* Login pentru Admini (SuperAdmin pe root, TenantAdmin pe subdomeniu) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Panoul de control - Adaptabil în funcție de domeniu */}
          <Route path="/admin/*" element={<AdminRouter />} />

          {/* Rută directă pentru panoul Tenant al companiei */}
          <Route path="/tenant/*" element={<TenantDashboard />} />

          {/* Redirect fallback */}
          <Route path="*" element={<Navigate to={isSubdomain ? "/login" : "/admin/login"} replace />} />
        </Routes>
        <GdprConsentBanner />
      </Router>
    </LanguageProvider>
  );
}

export default App;
