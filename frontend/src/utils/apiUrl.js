export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) {
      // Pe producție (ex: qr.pontaj.app, pontaj.app etc.) dacă VITE_API_URL lipsește sau a fost compilat greșit cu localhost
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return 'https://qrpontaj.up.railway.app';
      }
    }
  }
  return envUrl || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'https://qrpontaj.up.railway.app');
};

export const getAuthHeaders = (extraHeaders = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {}
  return headers;
};
