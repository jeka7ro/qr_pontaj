/**
 * Utility for resolving and dynamically updating the page Favicon and document title
 */

export const DEFAULT_FAVICON = '/favicon.png';

export const resolveFaviconUrl = (url) => {
  if (!url || typeof url !== 'string') return DEFAULT_FAVICON;
  const trimmed = url.trim();
  if (
    !trimmed || 
    trimmed === DEFAULT_FAVICON || 
    trimmed === '/logo_default_tenant.png' || 
    trimmed === '/logo_getapp_smartqr.jpg'
  ) {
    return DEFAULT_FAVICON;
  }

  // Relative backend upload path
  if (trimmed.startsWith('/uploads')) {
    const backendUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.hostname + ':5001');
    return `${backendUrl}${trimmed}`;
  }

  // Direct data URI or standard image URL or existing favicon service
  if (
    trimmed.startsWith('data:') || 
    trimmed.match(/\.(ico|png|jpg|jpeg|svg|webp)($|\?)/i) ||
    trimmed.includes('google.com/s2/favicons') ||
    trimmed.includes('gstatic.com/faviconV2')
  ) {
    return trimmed;
  }

  // If the user entered a domain or website URL (e.g. 'https://unda.ro/en' or 'roll-master.ro')
  try {
    let hostname = trimmed;
    if (!hostname.startsWith('http://') && !hostname.startsWith('https://')) {
      hostname = 'https://' + hostname;
    }
    const parsed = new URL(hostname);
    const domain = parsed.hostname.replace(/^www\./, '');
    if (domain && domain.includes('.')) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
    return trimmed || DEFAULT_FAVICON;
  } catch {
    return trimmed || DEFAULT_FAVICON;
  }
};

export const updatePageFavicon = (rawUrl, newTitle = null) => {
  const resolved = resolveFaviconUrl(rawUrl) || DEFAULT_FAVICON;

  if (newTitle && typeof newTitle === 'string') {
    document.title = newTitle;
  }

  // Remove existing link icons to prevent conflicts
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.parentNode?.removeChild(link));

  // Create new icon link
  const link = document.createElement('link');
  link.type = 'image/png';
  link.rel = 'shortcut icon';
  link.href = resolved;
  document.head.appendChild(link);

  // Also set apple-touch-icon for mobile/tablets
  let appleLink = document.querySelector("link[rel='apple-touch-icon']");
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleLink);
  }
  appleLink.href = resolved;
};
