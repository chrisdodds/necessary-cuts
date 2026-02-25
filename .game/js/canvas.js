const canvas = document.getElementById('ambient-canvas');
const canvasCtx = canvas.getContext('2d');
let particles = [];
let ambientMode = 'lake';

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================================
// GRADIENT LOOKUP
// ============================================
const sceneGradients = {
  lake: [
    { stop: 0, color: [13, 17, 23] },
    { stop: 0.5, color: [15, 26, 36] },
    { stop: 1, color: [10, 21, 32] }
  ],
  bedroom: [
    { stop: 0, color: [18, 18, 28] },
    { stop: 0.5, color: [14, 14, 22] },
    { stop: 1, color: [10, 10, 16] }
  ],
  morning: [
    { stop: 0, color: [32, 28, 20] },
    { stop: 0.4, color: [24, 20, 16] },
    { stop: 1, color: [12, 12, 14] }
  ]
};

// ============================================
// CANVAS TRANSITION STATE
// ============================================
let canvasTransition = {
  active: false,
  fromMode: null,
  toMode: null,
  progress: 0,
  duration: 0,
  startTime: 0
};

function startCanvasTransition(toMode, duration) {
  canvasTransition = {
    active: true,
    fromMode: ambientMode,
    toMode: toMode,
    progress: 0,
    duration: duration,
    startTime: performance.now()
  };
}

// ============================================
// COLOR INTERPOLATION
// ============================================
function lerpColor(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ];
}

function rgbToHex(c) {
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

function sampleGradientAt(stops, position) {
  if (position <= stops[0].stop) return stops[0].color;
  if (position >= stops[stops.length - 1].stop) return stops[stops.length - 1].color;
  for (let i = 0; i < stops.length - 1; i++) {
    if (position >= stops[i].stop && position <= stops[i + 1].stop) {
      const t = (position - stops[i].stop) / (stops[i + 1].stop - stops[i].stop);
      return lerpColor(stops[i].color, stops[i + 1].color, t);
    }
  }
  return stops[stops.length - 1].color;
}

function drawInterpolatedGradient(fromMode, toMode, t) {
  const fromStops = sceneGradients[fromMode];
  const toStops = sceneGradients[toMode];
  // Sample at 5 evenly spaced points
  const samplePoints = [0, 0.25, 0.5, 0.75, 1];
  const grd = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
  for (const pos of samplePoints) {
    const fromColor = sampleGradientAt(fromStops, pos);
    const toColor = sampleGradientAt(toStops, pos);
    const blended = lerpColor(fromColor, toColor, t);
    grd.addColorStop(pos, rgbToHex(blended));
  }
  canvasCtx.fillStyle = grd;
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGradient(mode) {
  const stops = sceneGradients[mode];
  const grd = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
  for (const s of stops) {
    grd.addColorStop(s.stop, rgbToHex(s.color));
  }
  canvasCtx.fillStyle = grd;
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
}

// ============================================
// SCENE OVERLAYS
// ============================================
function drawSceneOverlay(mode, alpha) {
  if (alpha <= 0) return;

  if (mode === 'lake') {
    // Moon with glow
    const mx = canvas.width * 0.55, my = canvas.height * 0.15;
    const glow = canvasCtx.createRadialGradient(mx, my, 18, mx, my, 120);
    glow.addColorStop(0, `rgba(212, 208, 200, ${0.3 * alpha})`);
    glow.addColorStop(0.3, `rgba(190, 200, 215, ${0.08 * alpha})`);
    glow.addColorStop(1, 'rgba(180, 190, 210, 0)');
    canvasCtx.fillStyle = glow;
    canvasCtx.fillRect(mx - 120, my - 120, 240, 240);
    canvasCtx.beginPath();
    canvasCtx.arc(mx, my, 18, 0, Math.PI * 2);
    canvasCtx.fillStyle = `rgba(212, 208, 200, ${0.4 * alpha})`;
    canvasCtx.fill();

  } else if (mode === 'bedroom') {
    // Moonlight shaft from upper right
    const sx = canvas.width * 0.8, sy = 0;
    const shaft = canvasCtx.createRadialGradient(sx, sy, 0, sx, sy, canvas.height * 0.7);
    shaft.addColorStop(0, `rgba(160, 170, 200, ${0.18 * alpha})`);
    shaft.addColorStop(0.5, `rgba(140, 150, 180, ${0.07 * alpha})`);
    shaft.addColorStop(1, 'rgba(140, 150, 180, 0)');
    canvasCtx.fillStyle = shaft;
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  } else if (mode === 'morning') {
    // Warm horizon glow
    const hx = canvas.width * 0.5, hy = canvas.height * 0.15;
    const horizon = canvasCtx.createRadialGradient(hx, hy, 0, hx, hy, canvas.width * 0.5);
    horizon.addColorStop(0, `rgba(200, 160, 100, ${0.2 * alpha})`);
    horizon.addColorStop(0.4, `rgba(180, 140, 90, ${0.08 * alpha})`);
    horizon.addColorStop(1, 'rgba(180, 140, 90, 0)');
    canvasCtx.fillStyle = horizon;
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ============================================
// PARTICLES
// ============================================
function createParticles(mode) {
  particles = [];
  if (mode === 'lake') {
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.6 + Math.random() * canvas.height * 0.4,
        size: 1 + Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.3,
        pulse: Math.random() * Math.PI * 2,
        color: `rgba(170, 190, 210, `
      });
    }
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: canvas.width * 0.4 + Math.random() * canvas.width * 0.2,
        y: canvas.height * 0.65 + Math.random() * canvas.height * 0.15,
        size: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: 0,
        opacity: 0.1 + Math.random() * 0.15,
        pulse: Math.random() * Math.PI * 2,
        color: `rgba(212, 208, 200, `
      });
    }
  } else if (mode === 'bedroom') {
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 1 + Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: -0.05 - Math.random() * 0.1,
        opacity: 0.1 + Math.random() * 0.3,
        pulse: Math.random() * Math.PI * 2,
        color: `rgba(200, 196, 188, `
      });
    }
  } else if (mode === 'morning') {
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.6,
        size: 1.5 + Math.random() * 3,
        speedX: 0.2 + Math.random() * 0.3,
        speedY: 0.05 + Math.random() * 0.1,
        opacity: 0.1 + Math.random() * 0.25,
        pulse: Math.random() * Math.PI * 2,
        color: `rgba(200, 180, 140, `
      });
    }
  }
}

// ============================================
// DRAW LOOP
// ============================================
function drawAmbient() {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Update transition progress
  if (canvasTransition.active) {
    const elapsed = performance.now() - canvasTransition.startTime;
    canvasTransition.progress = Math.min(elapsed / canvasTransition.duration, 1);
    if (canvasTransition.progress >= 1) {
      canvasTransition.active = false;
      ambientMode = canvasTransition.toMode;
    }
  }

  // Draw gradient (interpolated during transition, static otherwise)
  if (canvasTransition.active) {
    const t = canvasTransition.progress;
    // Ease in-out
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    drawInterpolatedGradient(canvasTransition.fromMode, canvasTransition.toMode, eased);
    // Crossfade overlays
    drawSceneOverlay(canvasTransition.fromMode, 1 - eased);
    drawSceneOverlay(canvasTransition.toMode, eased);
  } else {
    drawGradient(ambientMode);
    drawSceneOverlay(ambientMode, 1);
  }

  // Draw particles
  for (const p of particles) {
    p.x += p.speedX;
    p.y += p.speedY;
    p.pulse += 0.02;

    const osc = Math.sin(p.pulse) * 0.5 + 0.5;
    const alpha = p.opacity * osc;

    canvasCtx.beginPath();
    canvasCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    canvasCtx.fillStyle = p.color + alpha + ')';
    canvasCtx.fill();

    // Wrap around
    if (p.x < -10) p.x = canvas.width + 10;
    if (p.x > canvas.width + 10) p.x = -10;
    if (p.y < -10) p.y = canvas.height + 10;
    if (p.y > canvas.height + 10) p.y = -10;
  }

  requestAnimationFrame(drawAmbient);
}

createParticles('lake');
drawAmbient();
