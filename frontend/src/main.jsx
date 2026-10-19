import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

try { 
  sessionStorage.removeItem('qrp_reload');
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    const u = new URL(window.location.href);
    if (u.searchParams.has('_v')) {
      u.searchParams.delete('_v');
      const cleanUrl = u.pathname + (u.search ? u.search : '') + (u.hash || '');
      window.history.replaceState(null, '', cleanUrl);
    }
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
