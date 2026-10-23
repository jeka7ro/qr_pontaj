const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '../backend/node_modules/puppeteer-core'));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5188/', { waitUntil: 'networkidle0' });
  await page.emulateMediaType('screen');

  await page.evaluate(() => {
    // 1. Remove all fixed banners, GDPR modal, cookie consent, aside widgets
    document.querySelectorAll('.fixed, [class*="fixed"], [class*="toast"], aside').forEach(el => {
      el.remove();
    });

    document.querySelectorAll('[role="dialog"]').forEach(m => m.remove());

    const header = document.querySelector('header');
    const hero = document.getElementById('hero');
    const video = document.getElementById('video');
    const simulator = document.getElementById('simulator');
    const dashboard = document.getElementById('dashboard');
    const ecrane = document.getElementById('ecrane');
    const tarife = document.getElementById('tarife');
    const footer = document.querySelector('footer');

    // Get real QR code SVG from simulator
    let qrSvgHtml = '';
    const simQrSvg = document.querySelector('#simulator svg[role="img"]');
    if (simQrSvg) {
      const svgClone = simQrSvg.cloneNode(true);
      svgClone.setAttribute('width', '100%');
      svgClone.setAttribute('height', '100%');
      qrSvgHtml = svgClone.outerHTML;
    }

    const presentationWrapper = document.createElement('div');
    presentationWrapper.id = 'presentation-deck';

    // ==========================================
    // SLIDE 1: Header + Hero
    // ==========================================
    const slide1 = document.createElement('div');
    slide1.className = 'deck-slide slide-light';
    slide1.id = 'deck-slide-1';
    if (header) {
      const headerClone = header.cloneNode(true);
      headerClone.style.position = 'relative';
      headerClone.style.top = 'auto';
      slide1.appendChild(headerClone);
    }
    if (hero) slide1.appendChild(hero.cloneNode(true));
    presentationWrapper.appendChild(slide1);

    // ==========================================
    // SLIDE 2: Video Prezentare cu Cod QR în loc de triunghi Play
    // ==========================================
    const slide2 = document.createElement('div');
    slide2.className = 'deck-slide slide-dark';
    slide2.id = 'deck-slide-2';

    if (video) {
      const videoClone = video.cloneNode(true);
      // Remove the 2 flow cards from below the video if present
      const flowGrid = videoClone.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      if (flowGrid) flowGrid.remove();

      // Find the play button overlay inside the video frame
      const playOverlay = videoClone.querySelector('.absolute.inset-0.flex.items-center.justify-center');
      if (playOverlay) {
        // REPLACE the play triangle button with a clean QR Code Card!
        playOverlay.innerHTML = `
          <div class="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/60 flex flex-col items-center text-center">
            <div class="w-28 h-28 p-1 bg-white rounded-xl shadow-inner flex items-center justify-center">
              ${qrSvgHtml}
            </div>
            <div class="text-xs font-black text-slate-900 uppercase tracking-wider mt-2.5 whitespace-nowrap shrink-0">
              Scanează cu telefonul
            </div>
            <div class="text-[11px] text-blue-600 font-bold mt-0.5 whitespace-nowrap shrink-0">
              pentru demonstrație video
            </div>
          </div>
          <div class="absolute bottom-5 left-6 text-left pointer-events-none">
            <span class="block text-xs uppercase tracking-widest text-blue-300 font-bold whitespace-nowrap shrink-0">
              Pontaj.app • Prezentare Video
            </span>
            <span class="block text-lg font-black text-white whitespace-nowrap shrink-0">
              Intrare în tură cu scanare QR
            </span>
          </div>
        `;
      }
      slide2.appendChild(videoClone);
    }
    presentationWrapper.appendChild(slide2);

    // ==========================================
    // SLIDE 3: Tablou de Bord Live & SAGA Salarii
    // ==========================================
    const slide3 = document.createElement('div');
    slide3.className = 'deck-slide slide-light';
    slide3.id = 'deck-slide-3';

    if (dashboard) {
      const dashClone = dashboard.cloneNode(true);
      dashClone.querySelectorAll('.fixed, [class*="fixed"], aside').forEach(el => el.remove());
      slide3.appendChild(dashClone);
    }

    presentationWrapper.appendChild(slide3);

    // ==========================================
    // SLIDE 4: Tarife, Corporate, Garanție 15 Zile, Echipamente & Contact
    // ==========================================
    const slide4 = document.createElement('div');
    slide4.className = 'deck-slide slide-light';
    slide4.id = 'deck-slide-4';

    if (tarife) {
      const tarifeClone = tarife.cloneNode(true);
      tarifeClone.querySelectorAll('.fixed, [class*="fixed"], aside').forEach(el => el.remove());
      if (footer) {
        const footerClone = footer.cloneNode(true);
        footerClone.className = 'pt-4 pb-2 bg-transparent text-slate-500 text-xs border-t border-slate-200 mt-4 flex items-center justify-between';
        const innerContainer = tarifeClone.querySelector('.max-w-7xl') || tarifeClone;
        innerContainer.appendChild(footerClone);
      }
      slide4.appendChild(tarifeClone);
    }
    presentationWrapper.appendChild(slide4);

    // Replace body content
    document.body.innerHTML = '';
    document.body.appendChild(presentationWrapper);

    // Style adjustments for slide scale and spacing
    const style = document.createElement('style');
    style.id = 'presentation-pdf-styles';
    style.innerHTML = `
      @page {
        size: 297mm 210mm; /* A4 Landscape */
        margin: 0;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .deck-slide {
        width: 297mm;
        height: 210mm;
        max-height: 210mm;
        overflow: hidden;
        position: relative;
        page-break-after: always;
        break-after: page;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
      }

      .slide-light {
        background: #ffffff !important;
      }
      .slide-dark {
        background: #0b1220 !important;
      }

      /* Slide 1 Hero */
      #deck-slide-1 {
        justify-content: flex-start;
      }
      #deck-slide-1 header {
        width: 100%;
        border-bottom: 1px solid #e2e8f0;
        padding-top: 8px;
        padding-bottom: 8px;
      }
      #deck-slide-1 #hero {
        width: 100%;
        flex: 1;
        padding-top: 16px !important;
        padding-bottom: 16px !important;
        border-bottom: none !important;
        display: flex;
        align-items: center;
      }

      /* Slide 2 Video cu Cod QR */
      #deck-slide-2 {
        justify-content: center;
      }
      #deck-slide-2 #video {
        width: 100%;
        padding-top: 10px !important;
        padding-bottom: 10px !important;
        border-bottom: none !important;
      }
      #deck-slide-2 .aspect-video {
        max-width: 820px !important;
        margin-left: auto;
        margin-right: auto;
      }
      #deck-slide-2 .mt-8 {
        margin-top: 18px !important;
      }

      /* Slide 3 Dashboard */
      #deck-slide-3 {
        justify-content: flex-start;
        padding-top: 18px;
        padding-bottom: 10px;
      }
      #deck-slide-3 #dashboard {
        width: 100%;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        border-bottom: none !important;
        background: transparent !important;
      }
      #deck-slide-3 .max-w-5xl {
        max-width: 1040px !important;
        transform: scale(0.88);
        transform-origin: top center;
      }
      #deck-slide-3 .mb-8 {
        margin-bottom: 4px !important;
      }
      #deck-slide-3 .space-y-4 > :not([hidden]) ~ :not([hidden]) {
        margin-top: 4px !important;
      }

      /* Slide 4 Tarife & Garanție & Contact */
      #deck-slide-4 {
        justify-content: flex-start;
        padding-top: 6px;
        padding-bottom: 0;
      }
      #deck-slide-4 #tarife {
        width: 100%;
        max-width: 1100px;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        border-bottom: none !important;
        background: transparent !important;
        transform: scale(0.77);
        transform-origin: top center;
      }
      #deck-slide-4 .mb-12 {
        margin-bottom: 10px !important;
      }
      #deck-slide-4 .mb-8 {
        margin-bottom: 8px !important;
      }
      #deck-slide-4 .p-7, #deck-slide-4 .sm\\:p-8 {
        padding: 12px 18px !important;
      }
      #deck-slide-4 .mb-5 {
        margin-bottom: 6px !important;
      }
      #deck-slide-4 .mb-6 {
        margin-bottom: 6px !important;
      }
      #deck-slide-4 .space-y-3 > :not([hidden]) ~ :not([hidden]) {
        margin-top: 3px !important;
      }
      #deck-slide-4 .border-t {
        padding-top: 6px !important;
      }
      #deck-slide-4 .py-3\\.5 {
        padding-top: 6px !important;
        padding-bottom: 6px !important;
      }
      #deck-slide-4 footer {
        width: 100%;
        padding: 6px 32px !important;
        border-top: 1px solid #e2e8f0;
        margin-top: -30px;
      }
    `;
    document.head.appendChild(style);
  });

  await new Promise(r => setTimeout(r, 1000));

  const pdfPath = path.join(__dirname, '../Prezentare_Comerciala_Pontaj_App.pdf');
  const pdfCopyPath = path.join(__dirname, '../Prezentare_Comerciala_QR_Pontaj.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log(`Saved PDF to ${pdfPath}`);

  fs.copyFileSync(pdfPath, pdfCopyPath);
  console.log(`Copied PDF to ${pdfCopyPath}`);

  const slides = await page.$$('.deck-slide');
  console.log(`Found ${slides.length} slides.`);
  for (let i = 0; i < slides.length; i++) {
    const slidePath = path.join(__dirname, `../pdf_page_${i + 1}.png`);
    await slides[i].screenshot({ path: slidePath });
    console.log(`Saved screenshot ${slidePath}`);
  }

  await browser.close();
})();
