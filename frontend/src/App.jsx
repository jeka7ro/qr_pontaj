import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import TenantDashboard from './pages/tenant/Dashboard';
import KioskDisplay from './pages/kiosk/KioskDisplay';
import ScanScreen from './pages/scan/ScanScreen';

const getIsSubdomain = () => {
  const hostname = window.location.hostname;
  // Regex for IPv4
  const isIp = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(hostname);
  
  // If it's just 'localhost', an IP address, or the main domains, it's the root domain.
  if (hostname === 'localhost' || isIp || hostname === 'qrpontaj.ro' || hostname === 'scan.pontaj.app') {
    return false;
  }
  return true;
};

// Componentă care rutează `/admin/*` în funcție de domeniu sau rol
const AdminRouter = () => {
  const isSubdomain = getIsSubdomain();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (isSubdomain || (user && user.role !== 'SUPERADMIN')) {
    return <TenantDashboard />;
  }
  return <AdminDashboard />;
};

function App() {
  const isSubdomain = getIsSubdomain();

  return (
    <Router>
      <Routes>
        {/* Rută dedicată Kiosk Full Screen (Tablete) */}
        <Route path="/kiosk/:tenantId/:kioskId" element={<KioskDisplay />} />
        
        {/* Rută universală pentru scanare (funcționează și pe IP local) */}
        <Route path="/scan" element={<ScanScreen />} />

        {/* Ecran de pontaj angajați - disponibil doar pe subdomeniu pe /login sau / */}
        {isSubdomain && (
          <>
            <Route path="/login" element={<ScanScreen />} />
            <Route path="/" element={<ScanScreen />} />
          </>
        )}

        {/* Dacă suntem pe domeniul root, /login duce la Admin Login */}
        {!isSubdomain && (
          <>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
          </>
        )}

        {/* Login pentru Admini (SuperAdmin pe root, TenantAdmin pe subdomeniu) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Panoul de control - Adaptabil în funcție de domeniu */}
        <Route path="/admin/*" element={<AdminRouter />} />

        {/* Redirect fallback */}
        <Route path="*" element={<Navigate to={isSubdomain ? "/login" : "/admin/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
