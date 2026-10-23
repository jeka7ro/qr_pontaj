const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '../backend/node_modules/puppeteer-core'));

(async () => {
  console.log('Starting TikTok & Meta Promo Video Generator (1080x1920 Vertical, 9:16)...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1080,1920',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });

  // Dev server provides all static media assets
  await page.goto('http://localhost:5188/', { waitUntil: 'networkidle0' });

  console.log('Injecting high-performance rendering engine with Lucide vector paths...');

  const videoBase64 = await page.evaluate(async () => {
    // 1. Create Canvas 1080x1920
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '999999';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // 2. Preload Media Assets
    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn('Failed loading image:', url);
          resolve(null);
        };
        img.src = url;
      });
    };

    const imgHero = await loadImage('/media/hero-scan.jpg');
    const imgElena = await loadImage('/media/emp-elena.jpg');

    // 3. Lucide SVG Paths Engine (Zero Emojis, Pure SVG Vector Standard)
    const lucidePaths = {
      check: 'M20 6L9 17l-5-5',
      cross: 'M18 6L6 18M6 6l12 12',
      zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
      star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
      sparkles: 'M12 3v3m0 12v3M3 12h3m12 0h3m-2.6-6.4l-2.1 2.1m-8.6 8.6l-2.1 2.1m0-12.8l2.1 2.1m8.6 8.6l2.1 2.1'
    };

    const drawLucideIcon = (name, cx, cy, size, color, fill = false) => {
      const svgPath = lucidePaths[name] || lucidePaths.check;
      ctx.save();
      ctx.translate(cx - size / 2, cy - size / 2);
      ctx.scale(size / 24, size / 24);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const p = new Path2D(svgPath);
      ctx.stroke(p);
      if (fill) {
        ctx.fillStyle = color;
        ctx.fill(p);
      }
      ctx.restore();
    };

    // Helper: Rounded Rectangle
    const drawRoundRect = (x, y, w, h, r, fill, stroke, strokeWidth = 1) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    };

    // Helper: Pill Badge (Always single-line, rounded-full)
    const drawPill = (text, cx, cy, bg, border, textColor, iconName = 'check') => {
      ctx.save();
      ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textWidth = ctx.measureText(text).width;
      const iconSize = iconName ? 24 : 0;
      const iconSpacing = iconName ? 14 : 0;
      const totalWidth = textWidth + iconSize + iconSpacing + 48;
      const h = 54;
      const x = cx - totalWidth / 2;
      const y = cy - h / 2;

      // rounded-full radius = h / 2 = 27
      drawRoundRect(x, y, totalWidth, h, 27, bg, border, 2);

      let textStartX = x + 24;
      if (iconName) {
        drawLucideIcon(iconName, x + 24 + iconSize / 2, cy, iconSize, textColor);
        textStartX += iconSize + iconSpacing;
      }

      ctx.fillStyle = textColor;
      ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, textStartX, cy);
      ctx.restore();
    };

    // Helper: Draw High-Fidelity Simulated Dynamic QR Code
    const drawQR = (cx, cy, size, seed = 1) => {
      const grid = 23;
      const cellSize = size / grid;
      const x0 = cx - size / 2;
      const y0 = cy - size / 2;

      ctx.save();
      drawRoundRect(x0 - 20, y0 - 20, size + 40, size + 40, 28, '#ffffff', 'rgba(255, 255, 255, 0.4)', 2);

      ctx.fillStyle = '#0f172a';

      // Corner squares
      const drawCorner = (rx, ry) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x0 + rx * cellSize, y0 + ry * cellSize, 7 * cellSize, 7 * cellSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x0 + (rx + 1) * cellSize, y0 + (ry + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x0 + (rx + 2) * cellSize, y0 + (ry + 2) * cellSize, 3 * cellSize, 3 * cellSize);
      };
      drawCorner(0, 0);
      drawCorner(grid - 7, 0);
      drawCorner(0, grid - 7);

      // Data matrix with dynamic seed
      for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
          if ((r < 7 && c < 7) || (r < 7 && c >= grid - 7) || (r >= grid - 7 && c < 7)) continue;
          const val = Math.sin(r * 19.34 + c * 83.17 + seed * 57.81) * 43758.5453;
          if (Math.abs(val - Math.floor(val)) > 0.52) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(x0 + c * cellSize, y0 + r * cellSize, cellSize - 0.5, cellSize - 0.5);
          }
        }
      }

      // Center logo chip
      const chipSize = cellSize * 5;
      const chipX = cx - chipSize / 2;
      const chipY = cy - chipSize / 2;
      drawRoundRect(chipX, chipY, chipSize, chipSize, 12, '#2563eb', '#ffffff', 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR', cx, cy);

      ctx.restore();
    };

    // 4. Web Audio API Beat & Sound Effects Engine
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    await audioCtx.resume();
    const audioDest = audioCtx.createMediaStreamDestination();

    const playKick = (time) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(145, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.11);
      gain.gain.setValueAtTime(0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
      osc.connect(gain);
      gain.connect(audioDest);
      osc.start(time);
      osc.stop(time + 0.14);
    };

    const playHihat = (time) => {
      const bufferSize = audioCtx.sampleRate * 0.035;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioDest);
      noise.start(time);
      noise.stop(time + 0.04);
    };

    const playBass = (freq, time, dur = 0.2) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      gain.gain.setValueAtTime(0.32, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioDest);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    };

    const playSwooshChime = (time) => {
      [587.33, 739.99, 880.0, 1174.66].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, time + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.04 + 0.7);
        osc.connect(gain);
        gain.connect(audioDest);
        osc.start(time + idx * 0.04);
        osc.stop(time + idx * 0.04 + 0.75);
      });
    };

    // 5. Combined Audio + Video Recorder
    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/mp4;codecs=avc1,mp4a.40.2',
      videoBitsPerSecond: 10000000
    });

    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    const recordingDone = new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      };
    });

    recorder.start();

    // 6. Animation Timeline (540 Frames @ 30 FPS = 18.0 seconds)
    const totalFrames = 540;
    const fps = 30;
    const bpm = 126;
    const beatInterval = 60 / bpm; // ~0.476s

    for (let f = 0; f < totalFrames; f++) {
      const t = f / fps;

      // Audio beat triggers
      const beatIdx = Math.floor(t / beatInterval);
      const isBeatStart = f % Math.round(fps * beatInterval) === 0;
      const isOffBeat = f % Math.round(fps * (beatInterval / 2)) === 0 && !isBeatStart;

      if (isBeatStart) {
        playKick(audioCtx.currentTime);
        const chordRoots = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
        playBass(chordRoots[beatIdx % chordRoots.length], audioCtx.currentTime);
      }
      if (isOffBeat) {
        playHihat(audioCtx.currentTime);
      }

      // Transition chimes
      if (f === 110) playSwooshChime(audioCtx.currentTime);
      if (f === 220) playSwooshChime(audioCtx.currentTime);
      if (f === 330) playSwooshChime(audioCtx.currentTime);
      if (f === 440) playSwooshChime(audioCtx.currentTime);

      // Deep Navy Luxury Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, '#060a14');
      bgGrad.addColorStop(0.5, '#0b1326');
      bgGrad.addColorStop(1, '#060a14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Ambient Neon Glow Orbs
      const orbX = 540 + Math.sin(t * 1.8) * 160;
      const orbY = 960 + Math.cos(t * 1.3) * 220;
      const glowGrad = ctx.createRadialGradient(orbX, orbY, 60, orbX, orbY, 680);
      glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.24)');
      glowGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.08)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Persistent Header
      ctx.save();
      // App Icon Box
      drawRoundRect(70, 95, 60, 60, 16, '#2563eb', null);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR', 100, 126);

      // App Title
      ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText('Pontaj.app', 145, 126);

      // Top Right Compliance Pill
      drawPill('Art. 119 Codul Muncii', 870, 125, 'rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.4)', '#34d399', 'check');
      ctx.restore();

      // ==========================================
      // SCENE 1: The Hook (0.0s - 3.6s | Frames 0 - 110)
      // ==========================================
      if (f < 110) {
        const fadeIn = Math.min(1, f / 14);
        const fadeOut = f > 94 ? Math.max(0, (110 - f) / 16) : 1;
        const opacity = fadeIn * fadeOut;

        ctx.save();
        ctx.globalAlpha = opacity;

        drawPill('PROBLEMA PONTĂRII CLASICE', 540, 310, 'rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.4)', '#f87171', 'cross');

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Încă mai folosești', 540, 420);
        ctx.fillStyle = '#f87171';
        ctx.fillText('condică pe hârtie', 540, 498);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('sau cartele vechi?', 540, 576);

        // Problem Cards
        const cardY = 660;

        // Card 1: Hârtie
        drawRoundRect(90, cardY, 900, 175, 28, 'rgba(255, 255, 255, 0.04)', 'rgba(239, 68, 68, 0.35)', 2);
        drawLucideIcon('cross', 140, cardY + 58, 24, '#f87171');
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f87171';
        ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Condică fizică & dosare ITM', 175, cardY + 68);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 25px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Semnături uitate, calcule manuale greșite și risc de amenzi.', 130, cardY + 120);

        // Card 2: Cartele RFID
        drawRoundRect(90, cardY + 210, 900, 175, 28, 'rgba(255, 255, 255, 0.04)', 'rgba(239, 68, 68, 0.35)', 2);
        drawLucideIcon('cross', 140, cardY + 268, 24, '#f87171');
        ctx.fillStyle = '#f87171';
        ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Cartele pierdute & pontaj între colegi', 175, cardY + 278);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 25px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Aparate scumpe de mii de euro, cartele uitate sau pasate.', 130, cardY + 330);

        // Solution Teaser Card
        if (f > 40) {
          const teaserAlpha = Math.min(1, (f - 40) / 18) * fadeOut;
          ctx.save();
          ctx.globalAlpha = teaserAlpha;
          drawRoundRect(90, 1180, 900, 300, 36, 'rgba(37, 99, 235, 0.2)', '#3b82f6', 3);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#60a5fa';
          ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('SOLUȚIA MODERNĂ 2026', 540, 1250);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('Treci la Pontajul QR', 540, 1330);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('pe Orice Ecran!', 540, 1400);
          ctx.restore();
        }

        ctx.restore();
      }

      // ==========================================
      // SCENE 2: Cum Funcționează (3.6s - 7.3s | Frames 110 - 220)
      // ==========================================
      if (f >= 110 && f < 220) {
        const localF = f - 110;
        const fadeIn = Math.min(1, localF / 14);
        const fadeOut = localF > 94 ? Math.max(0, (110 - localF) / 16) : 1;
        const opacity = fadeIn * fadeOut;

        ctx.save();
        ctx.globalAlpha = opacity;

        drawPill('CUM FUNCȚIONEAZĂ', 540, 280, 'rgba(37, 99, 235, 0.15)', 'rgba(37, 99, 235, 0.4)', '#60a5fa', 'zap');

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Pui o Tabletă pe Perete', 540, 375);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Scanare Sub 1 Secundă!', 540, 440);

        // Visual: Hero Scan Image in curved frame
        const imgW = 900;
        const imgH = 680;
        const imgX = 90;
        const imgY = 505;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgW, imgH, 36);
        ctx.clip();
        if (imgHero) {
          ctx.drawImage(imgHero, imgX, imgY, imgW, imgH);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(imgX, imgY, imgW, imgH);
        }

        // Overlay vignette
        const imgOverlay = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
        imgOverlay.addColorStop(0, 'rgba(0,0,0,0.15)');
        imgOverlay.addColorStop(0.7, 'rgba(0,0,0,0.3)');
        imgOverlay.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = imgOverlay;
        ctx.fillRect(imgX, imgY, imgW, imgH);

        // Animated laser scan bar
        const scanY = imgY + 80 + ((localF * 9) % (imgH - 160));
        const laserGrad = ctx.createLinearGradient(imgX, scanY, imgX + imgW, scanY);
        laserGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        laserGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.9)');
        laserGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = laserGrad;
        ctx.fillRect(imgX, scanY - 3, imgW, 6);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fillRect(imgX, scanY - 25, imgW, 50);
        ctx.restore();

        // Border around image
        drawRoundRect(imgX, imgY, imgW, imgH, 36, null, 'rgba(255, 255, 255, 0.25)', 3);

        // Check-in confirmation card pop-up
        if (localF >= 32) {
          const cardAnim = Math.min(1, (localF - 32) / 14);
          const popY = 1240 - cardAnim * 35;

          ctx.save();
          drawRoundRect(110, popY, 860, 205, 32, 'rgba(255, 255, 255, 0.96)', '#10b981', 4);

          // Avatar
          if (imgElena) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(205, popY + 102, 60, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(imgElena, 145, popY + 42, 120, 120);
            ctx.restore();
          }

          // Text content
          drawLucideIcon('check', 300, popY + 62, 22, '#059669');
          ctx.textAlign = 'left';
          ctx.fillStyle = '#059669';
          ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('INTRARE ÎNREGISTRATĂ', 320, popY + 70);

          ctx.fillStyle = '#0f172a';
          ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('Bine ai venit, Elena Rusu!', 290, popY + 115);

          ctx.fillStyle = '#64748b';
          ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText('08:00:15 • Kiosk Recepție • Foto salvată', 290, popY + 158);
          ctx.restore();
        }

        // Bottom takeaway pill
        drawPill('Fără aglomerație la intrare • 100% automat', 540, 1510, 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.2)', '#e2e8f0', 'check');

        ctx.restore();
      }

      // ==========================================
      // SCENE 3: Anti-Fraudă la 15s (7.3s - 11.0s | Frames 220 - 330)
      // ==========================================
      if (f >= 220 && f < 330) {
        const localF = f - 220;
        const fadeIn = Math.min(1, localF / 14);
        const fadeOut = localF > 94 ? Math.max(0, (110 - localF) / 16) : 1;
        const opacity = fadeIn * fadeOut;

        ctx.save();
        ctx.globalAlpha = opacity;

        drawPill('SECURITATE TOTALĂ', 540, 280, 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.4)', '#60a5fa', 'shield');

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Cod QR Dinamic', 540, 375);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Se Schimbă la 15 Secunde!', 540, 440);

        // Dynamic QR code container
        const qrSize = 390;
        const qrX = 540;
        const qrY = 740;

        // Circular countdown ring
        const timerProgress = (localF % 45) / 45;
        const remainingSeconds = Math.max(1, Math.ceil((1 - timerProgress) * 15));

        ctx.save();
        ctx.beginPath();
        ctx.arc(qrX, qrY, qrSize / 2 + 50, -Math.PI / 2, -Math.PI / 2 + (1 - timerProgress) * Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Draw Live Dynamic QR Code
        const qrSeed = Math.floor(localF / 45) + 1;
        drawQR(qrX, qrY, qrSize, qrSeed);

        // Timer badge below QR
        drawPill(`Expiră în ${remainingSeconds}s • Se reînnoiește automat`, qrX, qrY + qrSize / 2 + 82, 'rgba(56, 189, 248, 0.15)', '#38bdf8', '#38bdf8', 'clock');

        // 3 Anti-fraud pillars
        const gy = 1130;
        const items = [
          'Capturile de ecran pe WhatsApp NU funcționează',
          'Zero pontaj de la distanță sau pentru colegi',
          'Foto-verificare opțională la fiecare pontare'
        ];

        items.forEach((txt, idx) => {
          const iy = gy + idx * 110;
          drawRoundRect(100, iy, 880, 90, 24, 'rgba(255, 255, 255, 0.05)', 'rgba(56, 189, 248, 0.25)', 2);
          drawLucideIcon('check', 145, iy + 45, 24, '#38bdf8');
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 25px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText(txt, 185, iy + 45);
        });

        ctx.restore();
      }

      // ==========================================
      // SCENE 4: Conformitate ITM & SAGA (11.0s - 14.6s | Frames 330 - 440)
      // ==========================================
      if (f >= 330 && f < 440) {
        const localF = f - 330;
        const fadeIn = Math.min(1, localF / 14);
        const fadeOut = localF > 94 ? Math.max(0, (110 - localF) / 16) : 1;
        const opacity = fadeIn * fadeOut;

        ctx.save();
        ctx.globalAlpha = opacity;

        drawPill('LEGAL & CONTABILITATE', 540, 280, 'rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.4)', '#34d399', 'check');

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Condică ITM Automată', 540, 375);
        ctx.fillStyle = '#34d399';
        ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('& Export 1-Click în SAGA', 540, 440);

        // Dashboard Mockup Card
        const dashY = 520;
        drawRoundRect(90, dashY, 900, 680, 32, 'rgba(255, 255, 255, 0.98)', '#cbd5e1', 3);

        // Header of dashboard mockup
        drawRoundRect(90, dashY, 900, 85, 32, '#f8fafc', null);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Pontaj Live • Punct de Lucru Central', 140, dashY + 52);

        // Table Rows
        const rows = [
          { name: 'Andrei Popescu', role: 'Bucătar Șef', in: '07:45:12', time: '6h 30m', state: 'Prezent' },
          { name: 'Elena Rusu', role: 'Șef de Sală', in: '08:00:15', time: '6h 15m', state: 'Prezent' },
          { name: 'Marius Dumitrescu', role: 'Barman', in: '08:30:19', time: '5h 45m', state: 'Prezent' }
        ];

        rows.forEach((r, idx) => {
          const ry = dashY + 105 + idx * 135;
          ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          ctx.fillRect(92, ry, 896, 125);

          // Avatar circle
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(160, ry + 60, 35, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(r.name[0], 160, ry + 60);

          // Name & role
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#0f172a';
          ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(r.name, 220, ry + 50);
          ctx.fillStyle = '#64748b';
          ctx.font = '400 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(r.role + ' • Intrare: ' + r.in, 220, ry + 85);

          // Status badge
          drawRoundRect(740, ry + 35, 180, 46, 23, '#dcfce7', '#86efac', 1.5);
          ctx.fillStyle = '#15803d';
          ctx.font = '700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('● ' + r.state, 830, ry + 58);
        });

        // Glowing SAGA Export button
        const sagaBtnY = dashY + 540;
        const pulse = 1 + Math.sin(localF * 0.16) * 0.02;
        ctx.save();
        ctx.translate(540, sagaBtnY + 45);
        ctx.scale(pulse, pulse);
        drawRoundRect(-380, -45, 760, 90, 45, '#16a34a', '#86efac', 3);
        drawLucideIcon('check', -300, 0, 26, '#ffffff');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Exportă Raport Oficial SAGA (XML)', -265, 0);
        ctx.restore();

        // Legal compliance note below
        drawRoundRect(90, 1250, 900, 180, 28, 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)', 2);
        drawLucideIcon('check', 140, 1300, 26, '#34d399');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#34d399';
        ctx.font = '700 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('100% Conform Art. 119 Codul Muncii', 180, 1300);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Evidență certă a sosirii și plecării, fără biometrie invazivă (GDPR).', 130, 1360);

        ctx.restore();
      }

      // ==========================================
      // SCENE 5: Oferta & Call To Action (14.6s - 18.0s | Frames 440 - 540)
      // ==========================================
      if (f >= 440) {
        const localF = f - 440;
        const fadeIn = Math.min(1, localF / 14);
        ctx.save();
        ctx.globalAlpha = fadeIn;

        drawPill('OFERTĂ SPECIALĂ DE LANSARE', 540, 270, 'rgba(37, 99, 235, 0.2)', 'rgba(37, 99, 235, 0.5)', '#60a5fa', 'star');

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Digitalizează Pontajul', 540, 360);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('pe Tableta pe Care o Ai!', 540, 425);

        // Pricing Card
        const priceY = 490;
        drawRoundRect(90, priceY, 900, 420, 36, 'rgba(255, 255, 255, 0.05)', '#3b82f6', 3);

        // Top line: Strikethrough old price
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const oldText = 'Preț vechi: 6.00 € / angajat';
        const oldW = ctx.measureText(oldText).width;
        ctx.fillText(oldText, 540, priceY + 70);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(540 - oldW / 2 - 10, priceY + 70);
        ctx.lineTo(540 + oldW / 2 + 10, priceY + 70);
        ctx.stroke();

        // Main Price Line (Carefully measured and perfectly aligned on one single visual block)
        const priceNumber = '4.00 €';
        const priceUnit = ' / angajat / lună';
        ctx.font = '900 90px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const numW = ctx.measureText(priceNumber).width;
        ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const unitW = ctx.measureText(priceUnit).width;
        const totalLineW = numW + unitW;
        const lineStartX = 540 - totalLineW / 2;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 90px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(priceNumber, lineStartX, priceY + 165);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(priceUnit, lineStartX + numW, priceY + 165);

        // Minimum commitment pill
        drawPill('Minim 50 € / lună / firmă • Include 10 angajați', 540, priceY + 265, 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.3)', '#93c5fd', 'check');

        ctx.textAlign = 'center';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Rulează din browser pe orice tabletă, Smart TV sau PC existent.', 540, priceY + 355);

        // Guarantee Box
        drawRoundRect(90, 950, 900, 260, 32, 'rgba(16, 185, 129, 0.1)', '#10b981', 2);
        ctx.fillStyle = '#34d399';
        ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('15 Zile de Test Gratuit', 540, 1020);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Fără Card Bancar Solicitat la Înscriere', 540, 1080);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Fără contracte blocate • Activezi totul în 5 minute', 540, 1140);

        // Pulsing CTA Button
        const btnPulse = 1 + Math.sin(localF * 0.18) * 0.025;
        const btnY = 1320;
        ctx.save();
        ctx.translate(540, btnY);
        ctx.scale(btnPulse, btnPulse);
        drawRoundRect(-440, -55, 880, 110, 55, '#2563eb', '#60a5fa', 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TESTEAZĂ GRATUIT PE PONTAJ.APP', 0, 0);
        ctx.restore();

        // Contact info at bottom (Perfect centered alignment with phone icon)
        const phoneText = '0757 77 77 12';
        ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const phoneW = ctx.measureText(phoneText).width;
        const phoneIconSize = 30;
        const phoneTotalW = phoneIconSize + 16 + phoneW;
        const phoneStartX = 540 - phoneTotalW / 2;

        drawLucideIcon('phone', phoneStartX + phoneIconSize / 2, 1495, phoneIconSize, '#38bdf8');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(phoneText, phoneStartX + phoneIconSize + 16, 1495);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('www.pontaj.app • contact@pontaj.app', 540, 1560);

        ctx.restore();
      }

      // Step frame at 30 FPS
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
    return await recordingDone;
  });

  console.log('Video recording finished. Processing buffer...');

  const videoBuffer = Buffer.from(videoBase64.split(',')[1], 'base64');
  const outputPath = path.join(__dirname, '../Promo_TikTok_Meta_Pontaj_App.mp4');

  fs.writeFileSync(outputPath, videoBuffer);
  console.log('Successfully generated TikTok & Meta Promo Video!');
  console.log(`Path: ${outputPath}`);
  console.log(`Size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

  await browser.close();
})();
