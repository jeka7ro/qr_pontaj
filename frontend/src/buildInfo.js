/**
 * Informații Build & Versiune pentru Panoul SuperAdmin
 * Generate dinamic la build via Vite define
 */
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const fallbackDate = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

export const BUILD_INFO = (typeof __APP_BUILD_INFO__ !== 'undefined' && __APP_BUILD_INFO__) 
  ? __APP_BUILD_INFO__ 
  : {
      version: 'v1.0.201',
      buildNumber: '201',
      commitHash: '2b51210',
      buildDate: fallbackDate
    };
