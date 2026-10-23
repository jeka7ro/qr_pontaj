import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Ignorăm rutele interne de administrare pentru a nu polua statisticile de marketing cu acțiunile adminilor
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/tenant')) {
      return;
    }

    const fullPath = location.pathname + (location.search || '') + (location.hash || '');
    trackPageView(fullPath);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
