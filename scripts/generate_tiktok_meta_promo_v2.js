const fs = require('fs');
const path = require('path');
const puppeteer = require(path.join(__dirname, '../backend/node_modules/puppeteer-core'));

(async () => {
  console.log('Starting TikTok & Meta Cinematic Promo Generator (Real Footage, 1080x1920)...');

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
  await page.goto('http://localhost:5188/', { waitUntil: 'networkidle0' });

  console.log('Composing real video footage streams in headless Chrome...');

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

    // 2. Setup Real Video Elements in DOM for Hardware Accelerated Playback
    const setupVideo = (url) => {
      return new Promise((resolve) => {
        const v = document.createElement('video');
        v.src = url;
        v.muted = true;
        v.playsInline = true;
        v.autoplay = false;
        v.crossOrigin = 'anonymous';
        v.style.position = 'fixed';
        v.style.top = '-9999px';
        v.style.left = '-9999px';
        v.style.width = '640px';
        v.style.height = '360px';
        document.body.appendChild(v);
        v.onloadedmetadata = () => resolve(v);
        v.onerror = (e) => {
          console.error('Failed to load video:', url, e);
          resolve(null);
        };
      });
    };

    const vidHotel = await setupVideo('/media/qrtime-demo.mp4');
    const vidRestaurant = await setupVideo('/demo_video.mp4');

    // 3. Lucide Vector SVG Paths (Zero Emojis)
    const lucidePaths = {
      check: 'M20 6L9 17l-5-5',
      zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
      phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
      utensils: 'M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2m0 12v8m6-20v20'
    };

    const drawLucideIcon = (name, cx, cy, size, color) => {
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
      ctx.restore();
    };

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

    const drawPill = (text, cx, cy, bg, border, textColor, iconName = 'check', fontSize = 24) => {
      ctx.save();
      ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = ctx.measureText(text).width;
      const iconSize = iconName ? Math.round(fontSize * 1.0) : 0;
      const iconSpacing = iconName ? 14 : 0;
      const totalWidth = textWidth + iconSize + iconSpacing + 48;
      const h = fontSize + 30;
      const x = cx - totalWidth / 2;
      const y = cy - h / 2;

      drawRoundRect(x, y, totalWidth, h, h / 2, bg, border, 2);

      let textStartX = x + 24;
      if (iconName) {
        drawLucideIcon(iconName, x + 24 + iconSize / 2, cy, iconSize, textColor);
        textStartX += iconSize + iconSpacing;
      }

      ctx.fillStyle = textColor;
      ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, textStartX, cy);
      ctx.restore();
    };

    // 4. Web Audio API Electronic Beat
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
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioDest);
      noise.start(time);
      noise.stop(time + 0.04);
    };

    const playBass = (freq, time, dur = 0.22) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      gain.gain.setValueAtTime(0.32, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioDest);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    };

    const playChime = (time) => {
      [659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, time + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.035 + 0.7);
        osc.connect(gain);
        gain.connect(audioDest);
        osc.start(time + idx * 0.035);
        osc.stop(time + idx * 0.035 + 0.75);
      });
    };

    // 5. Setup MediaRecorder with 30 FPS Stream
    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/mp4;codecs=avc1,mp4a.40.2',
      videoBitsPerSecond: 12000000
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

    // 6. Playback Flow: Real Videos playing in native hardware decoder
    const totalFrames = 510; // 17.0s @ 30 FPS
    const fps = 30;
    const bpm = 126;
    const beatInterval = 60 / bpm;

    // Start video 1 at t = 0
    vidHotel.currentTime = 0.5;
    await vidHotel.play();

    for (let f = 0; f < totalFrames; f++) {
      const t = f / fps;

      // Audio beat triggers
      const beatIdx = Math.floor(t / beatInterval);
      const isBeatStart = f % Math.round(fps * beatInterval) === 0;
      const isOffBeat = f % Math.round(fps * (beatInterval / 2)) === 0 && !isBeatStart;

      if (isBeatStart) {
        playKick(audioCtx.currentTime);
        const roots = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
        playBass(roots[beatIdx % roots.length], audioCtx.currentTime);
      }
      if (isOffBeat) {
        playHihat(audioCtx.currentTime);
      }

      // Seamless Video Clip Switching
      if (f === 135) {
        // Transition to Clip 2: Restaurant
        vidHotel.pause();
        vidRestaurant.currentTime = 5.2;
        await vidRestaurant.play();
        playChime(audioCtx.currentTime);
      } else if (f === 270) {
        // Transition to Clip 3: Confirmation checkmark on tablet
        vidRestaurant.pause();
        vidHotel.currentTime = 4.5;
        await vidHotel.play();
        playChime(audioCtx.currentTime);
      } else if (f === 390) {
        // Transition to Clip 4: Outro CTA
        vidHotel.pause();
        playChime(audioCtx.currentTime);
      }

      ctx.clearRect(0, 0, 1080, 1920);

      // ==============================================================
      // CLIP 1: TABLETA PE PERETE (0.0s - 4.5s | Frames 0 - 135)
      // Real video footage: Hotel lobby reception with wall tablet
      // ==============================================================
      if (f < 135) {
        // Frame right side of hotel video (where wall tablet and person are)
        const scale = 1920 / vidHotel.videoHeight;
        const sw = 1080 / scale;
        const maxSx = vidHotel.videoWidth - sw;
        const sx = maxSx * (0.86 + (f / 135) * 0.08);

        ctx.drawImage(vidHotel, sx, 0, sw, vidHotel.videoHeight, 0, 0, 1080, 1920);

        // Soft cinematic gradients
        const gradTop = ctx.createLinearGradient(0, 0, 0, 340);
        gradTop.addColorStop(0, 'rgba(6, 10, 20, 0.85)');
        gradTop.addColorStop(1, 'rgba(6, 10, 20, 0)');
        ctx.fillStyle = gradTop;
        ctx.fillRect(0, 0, 1080, 340);

        const gradBtm = ctx.createLinearGradient(0, 1420, 0, 1920);
        gradBtm.addColorStop(0, 'rgba(6, 10, 20, 0)');
        gradBtm.addColorStop(0.6, 'rgba(6, 10, 20, 0.85)');
        gradBtm.addColorStop(1, 'rgba(6, 10, 20, 0.95)');
        ctx.fillStyle = gradBtm;
        ctx.fillRect(0, 1420, 1080, 500);

        // Persistent Top Header
        drawRoundRect(70, 95, 60, 60, 16, '#2563eb', null);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', 100, 126);

        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('Pontaj.app', 145, 126);

        drawPill('Art. 119 Codul Muncii', 870, 125, 'rgba(16, 185, 129, 0.25)', 'rgba(16, 185, 129, 0.6)', '#34d399', 'check', 20);

        // Minimalist Bottom Captions
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Pui o Tabletă pe Perete', 540, 1650);

        drawPill('Fără aparate scumpe • Fără cartele RFID', 540, 1740, 'rgba(15, 23, 42, 0.85)', 'rgba(56, 189, 248, 0.4)', '#38bdf8', 'zap', 24);
      }

      // ==============================================================
      // CLIP 2: RESTAURANTE & HORECA (4.5s - 9.0s | Frames 135 - 270)
      // Real video footage: Waitress in Haven Restaurant scanning tablet
      // ==============================================================
      else if (f >= 135 && f < 270) {
        const localF = f - 135;

        // Crop: focus on waitress and phone scanning, cutting off bottom caption
        const sx = 80 + (localF / 135) * 50;
        const sy = 20;
        const sw = 840;
        const sh = 530;

        const scale = Math.max(1080 / sw, 1920 / sh);
        const rw = sw * scale;
        const rh = sh * scale;
        const rx = (1080 - rw) / 2;
        const ry = (1920 - rh) / 2;

        ctx.drawImage(vidRestaurant, sx, sy, sw, sh, rx, ry, rw, rh);

        // Gradients
        const gradTop = ctx.createLinearGradient(0, 0, 0, 340);
        gradTop.addColorStop(0, 'rgba(6, 10, 20, 0.85)');
        gradTop.addColorStop(1, 'rgba(6, 10, 20, 0)');
        ctx.fillStyle = gradTop;
        ctx.fillRect(0, 0, 1080, 340);

        const gradBtm = ctx.createLinearGradient(0, 1420, 0, 1920);
        gradBtm.addColorStop(0, 'rgba(6, 10, 20, 0)');
        gradBtm.addColorStop(0.6, 'rgba(6, 10, 20, 0.85)');
        gradBtm.addColorStop(1, 'rgba(6, 10, 20, 0.95)');
        ctx.fillStyle = gradBtm;
        ctx.fillRect(0, 1420, 1080, 500);

        // Header
        drawRoundRect(70, 95, 60, 60, 16, '#2563eb', null);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', 100, 126);

        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('Pontaj.app', 145, 126);

        drawPill('Restaurante & Hoteluri', 850, 125, 'rgba(37, 99, 235, 0.25)', 'rgba(96, 165, 250, 0.5)', '#93c5fd', 'utensils', 20);

        // Minimalist Bottom Captions
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Scanare Sub 1 Secundă!', 540, 1650);

        drawPill('Ideal pentru HoReCa, Retail & Clinici', 540, 1740, 'rgba(15, 23, 42, 0.85)', 'rgba(52, 211, 153, 0.4)', '#34d399', 'check', 24);
      }

      // ==============================================================
      // CLIP 3: CONFIRMARE & ANTI-FRAUDĂ (9.0s - 13.0s | Frames 270 - 390)
      // Real video footage: Tablet screen turning green with checkmark
      // ==============================================================
      else if (f >= 270 && f < 390) {
        const scale = 1920 / vidHotel.videoHeight;
        const sw = 1080 / scale;
        const maxSx = vidHotel.videoWidth - sw;
        const sx = maxSx * 0.94;

        ctx.drawImage(vidHotel, sx, 0, sw, vidHotel.videoHeight, 0, 0, 1080, 1920);

        // Gradients
        const gradTop = ctx.createLinearGradient(0, 0, 0, 340);
        gradTop.addColorStop(0, 'rgba(6, 10, 20, 0.85)');
        gradTop.addColorStop(1, 'rgba(6, 10, 20, 0)');
        ctx.fillStyle = gradTop;
        ctx.fillRect(0, 0, 1080, 340);

        const gradBtm = ctx.createLinearGradient(0, 1420, 0, 1920);
        gradBtm.addColorStop(0, 'rgba(6, 10, 20, 0)');
        gradBtm.addColorStop(0.6, 'rgba(6, 10, 20, 0.85)');
        gradBtm.addColorStop(1, 'rgba(6, 10, 20, 0.95)');
        ctx.fillStyle = gradBtm;
        ctx.fillRect(0, 1420, 1080, 500);

        // Header
        drawRoundRect(70, 95, 60, 60, 16, '#2563eb', null);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', 100, 126);

        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('Pontaj.app', 145, 126);

        drawPill('Zero Fraudă', 900, 125, 'rgba(59, 130, 246, 0.25)', 'rgba(59, 130, 246, 0.6)', '#60a5fa', 'shield', 20);

        // Minimalist Bottom Captions
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Cod QR Dinamic la 15 Secunde', 540, 1650);

        drawPill('Fără capturi WhatsApp • Fără pontaj între colegi', 540, 1740, 'rgba(15, 23, 42, 0.85)', 'rgba(56, 189, 248, 0.4)', '#38bdf8', 'check', 24);
      }

      // ==============================================================
      // SCENE 4: OUTRO & CALL TO ACTION (13.0s - 17.0s | Frames 390 - 510)
      // Clean, high-impact CTA card over dark backdrop
      // ==============================================================
      else if (f >= 390) {
        const localF = f - 390;
        const fadeIn = Math.min(1, localF / 15);

        // Deep Navy Luxury Background
        const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
        bgGrad.addColorStop(0, '#060a14');
        bgGrad.addColorStop(0.5, '#0b1326');
        bgGrad.addColorStop(1, '#060a14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Ambient neon glow
        const glowGrad = ctx.createRadialGradient(540, 960, 50, 540, 960, 650);
        glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
        glowGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.08)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.save();
        ctx.globalAlpha = fadeIn;

        // Persistent Header
        drawRoundRect(70, 95, 60, 60, 16, '#2563eb', null);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', 100, 126);

        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('Pontaj.app', 145, 126);

        drawPill('Art. 119 Codul Muncii', 870, 125, 'rgba(16, 185, 129, 0.25)', 'rgba(16, 185, 129, 0.6)', '#34d399', 'check', 20);

        // Main Punchy Headline
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Digitalizează Pontajul', 540, 420);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('pe Orice Tabletă!', 540, 495);

        // Glassmorphism Pricing Card (rounded-2xl)
        const priceY = 560;
        drawRoundRect(90, priceY, 900, 400, 32, 'rgba(255, 255, 255, 0.05)', '#3b82f6', 2.5);

        // Old strikethrough price
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
        ctx.moveTo(540 - oldW / 2 - 8, priceY + 70);
        ctx.lineTo(540 + oldW / 2 + 8, priceY + 70);
        ctx.stroke();

        // Main Price on single visual line
        const priceNumber = '4.00 €';
        const priceUnit = ' / angajat / lună';
        ctx.font = '900 88px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const numW = ctx.measureText(priceNumber).width;
        ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const unitW = ctx.measureText(priceUnit).width;
        const totalLineW = numW + unitW;
        const lineStartX = 540 - totalLineW / 2;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 88px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(priceNumber, lineStartX, priceY + 165);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(priceUnit, lineStartX + numW, priceY + 165);

        // Minimum pill
        drawPill('Minim 50 € / lună / firmă • Include 10 angajați', 540, priceY + 265, 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.3)', '#93c5fd', 'check', 22);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Rulează din browser pe orice tabletă existentă.', 540, priceY + 345);

        // Guarantee Box (rounded-2xl)
        drawRoundRect(90, 1010, 900, 240, 28, 'rgba(16, 185, 129, 0.12)', '#10b981', 2);
        ctx.fillStyle = '#34d399';
        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('15 Zile de Test Gratuit', 540, 1075);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Fără Card Bancar Solicitat la Înscriere', 540, 1135);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Activare completă în 5 minute • Export SAGA inclus', 540, 1190);

        // Pulsing Call to action button (rounded-full)
        const btnPulse = 1 + Math.sin(localF * 0.18) * 0.025;
        const btnY = 1360;
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

        // Contact info at bottom (No emoji, vector phone icon)
        const phoneText = '0757 77 77 12';
        ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const phoneW = ctx.measureText(phoneText).width;
        const phoneIconSize = 30;
        const phoneTotalW = phoneIconSize + 16 + phoneW;
        const phoneStartX = 540 - phoneTotalW / 2;

        drawLucideIcon('phone', phoneStartX + phoneIconSize / 2, 1535, phoneIconSize, '#38bdf8');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(phoneText, phoneStartX + phoneIconSize + 16, 1535);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('www.pontaj.app • contact@pontaj.app', 540, 1600);

        ctx.restore();
      }

      // Step frame at 30 FPS (~33.3ms)
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
    return await recordingDone;
  });

  console.log('Video recording finished. Processing buffer...');

  const videoBuffer = Buffer.from(videoBase64.split(',')[1], 'base64');
  const outputPath = path.join(__dirname, '../Promo_TikTok_Meta_Pontaj_App.mp4');

  fs.writeFileSync(outputPath, videoBuffer);
  console.log('Successfully generated TikTok & Meta Promo Video with Real Footage!');
  console.log(`Path: ${outputPath}`);
  console.log(`Size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

  await browser.close();
})();
