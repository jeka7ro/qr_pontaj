// Frontend Analytics Tracker: trimite în paralel către sistemul intern și Google Analytics (gtag)

// Generare / recuperare Session ID (stocat în sessionStorage)
const getSessionId = () => {
  try {
    let sid = sessionStorage.getItem('qrp_sid');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      sessionStorage.setItem('qrp_sid', sid);
    }
    return sid;
  } catch (e) {
    return 's_' + Math.random().toString(36).substring(2, 12);
  }
};

// Generare / recuperare Persistent Visitor ID (stocat în localStorage)
const getVisitorId = () => {
  try {
    let vid = localStorage.getItem('qrp_vid');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('qrp_vid', vid);
    }
    return vid;
  } catch (e) {
    return 'v_' + Math.random().toString(36).substring(2, 12);
  }
};

// Detectare dispozitiv
const getDeviceType = () => {
  const ua = navigator.userAgent || '';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Extragere parametri UTM din URL
const getUtmParams = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null
    };
  } catch (e) {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
};

/**
 * Trimite eveniment către sistemul intern de analiză
 */
export const trackEvent = (eventType, metadata = {}) => {
  try {
    const sessionId = getSessionId();
    const visitorId = getVisitorId();
    const utm = getUtmParams();
    const deviceType = getDeviceType();

    const payload = {
      session_id: sessionId,
      visitor_id: visitorId,
      event_type: eventType,
      page_path: window.location.pathname + window.location.hash,
      page_title: document.title,
      referrer: document.referrer || null,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      device_type: deviceType,
      screen_res: `${window.innerWidth}x${window.innerHeight}`,
      metadata
    };

    // 1. Trimitere internă (silent beacon sau fetch rapid)
    const apiEndpoint = '/api/analytics/track';
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(apiEndpoint, blob);
    } else {
      fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }

    // 2. Trimitere în paralel către Google Analytics dacă gtag este activ
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventType, {
        page_path: payload.page_path,
        page_title: payload.page_title,
        ...metadata
      });
    }
  } catch (err) {
    // Fail silent - nu afectăm experiența utilizatorului
  }
};

/**
 * Urmărire vizualizare pagină
 */
export const trackPageView = (path) => {
  const currentPath = path || (window.location.pathname + window.location.hash);
  trackEvent('page_view', { path: currentPath });

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: currentPath,
      page_title: document.title
    });
  }
};
