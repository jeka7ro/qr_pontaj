import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

let commitCount = '201';
let commitHash = '';
try {
  commitCount = execSync('git rev-list --count HEAD').toString().trim();
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const formattedDate = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

export default defineConfig({
  define: {
    __APP_BUILD_INFO__: JSON.stringify({
      version: `v1.0.${commitCount}`,
      buildNumber: commitCount,
      commitHash: commitHash,
      buildDate: formattedDate,
      timestamp: now.toISOString()
    })
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'company-lookup-middleware',
      configureServer(server) {
        server.middlewares.use('/api/company/lookup', async (req, res) => {
          try {
            const url = new URL(req.url, 'http://localhost');
            const rawCui = url.searchParams.get('cui') || url.searchParams.get('query') || '';
            const cleanCui = rawCui.replace(/[^0-9]/g, '');

            if (!cleanCui) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'CUI invalid' }));
            }

            const today = new Date().toISOString().split('T')[0];
            const anafRes = await fetch('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([{ cui: parseInt(cleanCui, 10), data: today }])
            });

            if (!anafRes.ok) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Eroare ANAF' }));
            }

            const data = await anafRes.json();
            const item = data.found && data.found.length > 0 ? data.found[0] : null;

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');

            if (!item || !item.date_generale) {
              return res.end(JSON.stringify({ success: false, found: false }));
            }

            const gen = item.date_generale;
            const adr = item.adresa_sediu_social || {};
            return res.end(JSON.stringify({
              success: true,
              found: true,
              company: {
                cui: gen.cui,
                name: gen.denumire,
                regCom: gen.nrRegCom || '',
                address: gen.adresa || '',
                city: adr.sdenumire_Localitate || '',
                county: adr.sdenumire_Judet || ''
              }
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
      }
    }
  ],
  server: {
    port: 5188,
    host: true, // Listen on all local IPs
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
})
