import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Ignorăm rutele operaționale (kiosk, scanare cod QR, admin, portal angajați) pentru a contoriza doar vizitatorii reali de pe landing page
    const p = location.pathname.toLowerCase();
    if (
      p.startsWith('/admin') ||
      p.startsWith('/tenant') ||
      p.startsWith('/kiosk') ||
      p.startsWith('/scan') ||
      p.startsWith('/employee') ||
      p.startsWith('/portal') ||
      p.startsWith('/login')
    ) {
      return;
    }

    const fullPath = location.pathname + (location.search || '') + (location.hash || '');
    trackPageView(fullPath);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
