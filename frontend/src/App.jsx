import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import TenantDashboard from './pages/tenant/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute pentru Super Admin și Tenant Admin */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        {/* Rute pentru Tenant Admin */}
        <Route path="/tenant/*" element={<TenantDashboard />} />
        
        {/* Placeholder pentru ecranul de pontaj angajați */}
        <Route path="/scan" element={<div className="p-8 text-center text-2xl font-bold">Ecran Angajat (în lucru)</div>} />

        {/* Redirect default la login deocamdată */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
