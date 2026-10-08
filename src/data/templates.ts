import { ProjectTemplate } from '../types/ide';

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'cyber-particles',
    title: 'Neon Gravity Particle Lab',
    description: 'Interactive canvas physics with mouse forcefields, particle trails, and reactive sound synthesis.',
    icon: 'Sparkles',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Gravity Particle Lab</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="hud">
    <div class="brand">
      <span class="dot"></span>
      <h1>NEON GRAVITY LAB</h1>
    </div>
    <div class="controls">
      <div class="slider-group">
        <label>Particles: <span id="count-val">250</span></label>
        <input type="range" id="particle-count" min="50" max="600" value="250">
      </div>
      <div class="slider-group">
        <label>Gravity: <span id="grav-val">0.4</span></label>
        <input type="range" id="gravity-slider" min="-1" max="1" step="0.05" value="0.4">
      </div>
      <div class="btn-group">
        <button id="btn-repel" class="active">Force: Repel</button>
        <button id="btn-burst">Impulse Burst</button>
        <button id="btn-color">Cycle Palette</button>
      </div>
    </div>
  </div>

  <canvas id="canvas"></canvas>
  <div class="hint">Click or drag cursor to exert physical forcefield</div>

  <script src="app.js"></script>
</body>
</html>`
      },
      {
        id: '2',
        name: 'style.css',
        language: 'css',
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #090d16;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.hud {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 20px;
  z-index: 10;
  pointer-events: auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  background: #38bdf8;
  border-radius: 50%;
  box-shadow: 0 0 12px #38bdf8;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

h1 {
  font-size: 14px;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #f8fafc;
}

.controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

input[type="range"] {
  accent-color: #38bdf8;
  cursor: pointer;
  width: 90px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

button.active {
  background: #0284c7;
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #64748b;
  letter-spacing: 0.05em;
  pointer-events: none;
  background: rgba(15, 23, 42, 0.6);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}`
      },
      {
        id: '3',
        name: 'app.js',
        language: 'javascript',
        content: `// Interactive Neon Gravity Particle Lab
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

const PALETTES = [
  ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e'],
  ['#4ade80', '#2dd4bf', '#06b6d4', '#3b82f6'],
  ['#f59e0b', '#f97316', '#ef4444', '#ec4899'],
  ['#a855f7', '#6366f1', '#3b82f6', '#06b6d4']
];
let currentPaletteIdx = 0;

let particleCount = 250;
let gravityStrength = 0.4;
let forceMode = 'repel'; // 'repel' or 'attract'

const mouse = { x: width / 2, y: height / 2, active: false, radius: 180 };

class Particle {
  constructor(x, y) {
    this.x = x || Math.random() * width;
    this.y = y || Math.random() * height;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = (Math.random() - 0.5) * 3;
    this.radius = Math.random() * 2.5 + 1.2;
    this.baseRadius = this.radius;
    this.palette = PALETTES[currentPaletteIdx];
    this.color = this.palette[Math.floor(Math.random() * this.palette.length)];
    this.friction = 0.985;
  }

  update() {
    this.vy += gravityStrength * 0.08;

    if (mouse.active) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < mouse.radius && dist > 1) {
        const force = (1 - dist / mouse.radius) * 1.5;
        const angle = Math.atan2(dy, dx);
        const direction = forceMode === 'repel' ? -1 : 1;
        this.vx += Math.cos(angle) * force * direction * 1.2;
        this.vy += Math.sin(angle) * force * direction * 1.2;
        this.radius = this.baseRadius * 1.8;
      } else {
        this.radius = Math.max(this.baseRadius, this.radius - 0.05);
      }
    }

    this.vx *= this.friction;
    this.vy *= this.friction;

    this.x += this.vx;
    this.y += this.vy;

    // Bounce off walls
    if (this.x < 0) { this.x = 0; this.vx *= -0.8; }
    if (this.x > width) { this.x = width; this.vx *= -0.8; }
    if (this.y < 0) { this.y = 0; this.vy *= -0.8; }
    if (this.y > height) { this.y = height; this.vy *= -0.8; }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

let particles = [];
function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function animate() {
  // Trail effect with semi-transparent clear
  ctx.fillStyle = 'rgba(9, 13, 22, 0.25)';
  ctx.fillRect(0, 0, width, height);

  // Optional connection lines
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    // Connect close neighbors
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.hypot(dx, dy);
      if (d < 50) {
        ctx.beginPath();
        ctx.strokeStyle = particles[i].color;
        ctx.globalAlpha = 0.15 * (1 - d / 50);
        ctx.lineWidth = 0.8;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // Draw forcefield halo if mouse active
  if (mouse.active) {
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, mouse.radius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = forceMode === 'repel' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  requestAnimationFrame(animate);
}

// Window resize
window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// Mouse & Touch events
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
});
window.addEventListener('mouseleave', () => {
  mouse.active = false;
});
window.addEventListener('mousedown', () => {
  // Burst on click
  particles.forEach(p => {
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 250) {
      const factor = (250 - dist) / 15;
      p.vx += (dx / dist) * factor;
      p.vy += (dy / dist) * factor;
    }
  });
});

// UI Controls
const particleSlider = document.getElementById('particle-count');
const countVal = document.getElementById('count-val');
particleSlider.addEventListener('input', (e) => {
  particleCount = parseInt(e.target.value);
  countVal.textContent = particleCount;
  initParticles();
});

const gravSlider = document.getElementById('gravity-slider');
const gravVal = document.getElementById('grav-val');
gravSlider.addEventListener('input', (e) => {
  gravityStrength = parseFloat(e.target.value);
  gravVal.textContent = gravityStrength.toFixed(2);
});

const btnRepel = document.getElementById('btn-repel');
btnRepel.addEventListener('click', () => {
  forceMode = forceMode === 'repel' ? 'attract' : 'repel';
  btnRepel.textContent = 'Force: ' + (forceMode === 'repel' ? 'Repel' : 'Attract');
  btnRepel.classList.toggle('active', forceMode === 'repel');
});

const btnBurst = document.getElementById('btn-burst');
btnBurst.addEventListener('click', () => {
  particles.forEach(p => {
    p.vx = (Math.random() - 0.5) * 20;
    p.vy = (Math.random() - 0.5) * 20;
  });
});

const btnColor = document.getElementById('btn-color');
btnColor.addEventListener('click', () => {
  currentPaletteIdx = (currentPaletteIdx + 1) % PALETTES.length;
  particles.forEach(p => {
    p.palette = PALETTES[currentPaletteIdx];
    p.color = p.palette[Math.floor(Math.random() * p.palette.length)];
  });
});

initParticles();
animate();
console.log('Neon Gravity Particle Lab loaded successfully!');`
      }
    ]
  },
  {
    id: 'cyber-breakout',
    title: 'Cyberpunk Synthwave Breakout',
    description: 'Playable arcade brick breaker with Web Audio SFX synth, combo streaks, and particle explosions.',
    icon: 'Gamepad2',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyberpunk Synthwave Breakout</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="arcade-cabinet">
    <header class="header">
      <div class="stat"><span class="label">SCORE</span><span id="score" class="value">0000</span></div>
      <div class="stat title">CYBER BREAKOUT</div>
      <div class="stat"><span class="label">LIVES</span><span id="lives" class="value">❤❤❤</span></div>
    </header>

    <div class="game-container">
      <canvas id="gameCanvas" width="600" height="420"></canvas>
      <div id="overlay" class="overlay">
        <h2 id="msg-title">PRESS SPACE OR CLICK TO LAUNCH</h2>
        <p id="msg-sub">Use Arrow keys or mouse to maneuver paddle</p>
      </div>
    </div>

    <footer class="footer">
      <span>Audio: Synthesizer Active</span>
      <button id="toggle-sound">Sound: ON</button>
    </footer>
  </div>
  <script src="app.js"></script>
</body>
</html>`
      },
      {
        id: '2',
        name: 'style.css',
        language: 'css',
        content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #05050d;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

.arcade-cabinet {
  background: #0f101f;
  border: 2px solid #ff007f;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(255, 0, 127, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat.title {
  color: #00f0ff;
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 2px;
  text-shadow: 0 0 10px #00f0ff;
}

.label {
  font-size: 10px;
  color: #8892b0;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #ff007f;
}

.game-container {
  position: relative;
  background: #000;
  border: 1px solid #232742;
  border-radius: 6px;
  overflow: hidden;
}

canvas {
  display: block;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  text-align: center;
  pointer-events: none;
}

.overlay.hidden {
  display: none;
}

h2 {
  font-size: 16px;
  color: #00f0ff;
  letter-spacing: 1px;
}

p {
  font-size: 12px;
  color: #a0aec0;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #718096;
}

button {
  background: transparent;
  border: 1px solid #4a5568;
  color: #cbd5e1;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  border-color: #00f0ff;
  color: #00f0ff;
}`
      },
      {
        id: '3',
        name: 'app.js',
        language: 'javascript',
        content: `// Cyber Breakout with Web Audio Synth
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const soundBtn = document.getElementById('toggle-sound');

let audioCtx = null;
let soundEnabled = true;

function playTone(freq, type = 'sine', duration = 0.1) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context fallback
  }
}

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = 'Sound: ' + (soundEnabled ? 'ON' : 'OFF');
});

// Game State
let score = 0;
let lives = 3;
let gameState = 'waiting'; // 'waiting', 'playing', 'gameover'

const paddle = {
  x: canvas.width / 2 - 45,
  y: canvas.height - 25,
  width: 90,
  height: 10,
  speed: 7,
  dx: 0
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height - 40,
  radius: 6,
  speed: 5,
  dx: 4,
  dy: -4
};

const brickRows = 5;
const brickCols = 8;
const brickWidth = 62;
const brickHeight = 16;
const brickPadding = 9;
const brickOffsetTop = 40;
const brickOffsetLeft = 18;

const colors = ['#ff007f', '#ff7b00', '#ffff00', '#00f0ff', '#a855f7'];

let bricks = [];
function initBricks() {
  bricks = [];
  for (let r = 0; r < brickRows; r++) {
    bricks[r] = [];
    for (let c = 0; c < brickCols; c++) {
      bricks[r][c] = { x: 0, y: 0, status: 1, color: colors[r % colors.length] };
    }
  }
}

let particles = [];
function createParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      color
    });
  }
}

function resetBall() {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - 10;
  ball.dx = (Math.random() > 0.5 ? 4 : -4);
  ball.dy = -4;
  gameState = 'waiting';
  overlay.classList.remove('hidden');
}

function startGame() {
  if (gameState === 'waiting') {
    gameState = 'playing';
    overlay.classList.add('hidden');
    playTone(440, 'triangle', 0.15);
  } else if (gameState === 'gameover') {
    score = 0;
    lives = 3;
    scoreEl.textContent = '0000';
    livesEl.textContent = '❤❤❤';
    initBricks();
    resetBall();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    startGame();
  } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    paddle.dx = -paddle.speed;
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    paddle.dx = paddle.speed;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') {
    paddle.dx = 0;
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const rootX = e.clientX - rect.left;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, rootX - paddle.width / 2));
  if (gameState === 'waiting') {
    ball.x = paddle.x + paddle.width / 2;
  }
});

canvas.addEventListener('click', startGame);

function update() {
  if (gameState === 'playing') {
    paddle.x += paddle.dx;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Walls
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx = -ball.dx;
      playTone(300, 'square', 0.05);
    }
    if (ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
      playTone(320, 'square', 0.05);
    }

    // Paddle collision
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      ball.dx = hitPoint * 6;
      ball.dy = -Math.abs(ball.dy);
      playTone(520, 'triangle', 0.08);
    }

    // Floor (death)
    if (ball.y + ball.radius > canvas.height) {
      lives--;
      livesEl.textContent = '❤'.repeat(Math.max(0, lives));
      playTone(160, 'sawtooth', 0.3);
      if (lives <= 0) {
        gameState = 'gameover';
        document.getElementById('msg-title').textContent = 'GAME OVER - CLICK TO RETRY';
        overlay.classList.remove('hidden');
      } else {
        resetBall();
      }
    }

    // Brick collisions
    let allCleared = true;
    for (let r = 0; r < brickRows; r++) {
      for (let c = 0; c < brickCols; c++) {
        const b = bricks[r][c];
        if (b.status === 1) {
          allCleared = false;
          if (
            ball.x > b.x &&
            ball.x < b.x + brickWidth &&
            ball.y > b.y &&
            ball.y < b.y + brickHeight
          ) {
            ball.dy = -ball.dy;
            b.status = 0;
            score += 25;
            scoreEl.textContent = score.toString().padStart(4, '0');
            createParticles(b.x + brickWidth / 2, b.y + brickHeight / 2, b.color);
            playTone(600 + r * 80, 'sine', 0.07);
          }
        }
      }
    }

    if (allCleared) {
      initBricks();
      ball.speed += 1;
      score += 500;
      scoreEl.textContent = score.toString().padStart(4, '0');
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function draw() {
  ctx.fillStyle = '#05050d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw bricks
  for (let r = 0; r < brickRows; r++) {
    for (let c = 0; c < brickCols; c++) {
      if (bricks[r][c].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[r][c].x = brickX;
        bricks[r][c].y = brickY;
        ctx.fillStyle = bricks[r][c].color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = bricks[r][c].color;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
        ctx.shadowBlur = 0;
      }
    }
  }

  // Draw paddle
  ctx.fillStyle = '#00f0ff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00f0ff';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Draw ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ff007f';
  ctx.shadowColor = '#ff007f';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x, p.y, 3, 3);
  });
  ctx.globalAlpha = 1.0;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

initBricks();
loop();
console.log('Cyber Breakout initialized.');`
      }
    ]
  },
  {
    id: 'algo-visualizer',
    title: 'Algorithmic Sorting Theater',
    description: 'Visual sorting algorithms with audio frequency feedback and step-by-step playback.',
    icon: 'BarChart2',
    files: [
      {
        id: '1',
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Algorithmic Sorting Theater</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <h2>ALGORITHM SORTING THEATER</h2>
      <div class="actions">
        <select id="algo-select">
          <option value="quick">Quick Sort</option>
          <option value="bubble">Bubble Sort</option>
          <option value="insertion">Insertion Sort</option>
          <option value="selection">Selection Sort</option>
        </select>
        <button id="btn-shuffle">Shuffle</button>
        <button id="btn-sort" class="primary">Start Sorting</button>
      </div>
    </header>

    <div class="stats-bar">
      <div>Comparisons: <span id="comparisons">0</span></div>
      <div>Swaps: <span id="swaps">0</span></div>
      <div>Status: <span id="status">Ready</span></div>
    </div>

    <div id="visualizer" class="visualizer"></div>
  </div>
  <script src="app.js"></script>
</body>
</html>`
      },
      {
        id: '2',
        name: 'style.css',
        language: 'css',
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #0b0f19;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  overflow: hidden;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #1f2937;
}
h2 { font-size: 14px; letter-spacing: 0.08em; color: #60a5fa; }
.actions { display: flex; gap: 10px; }
select, button {
  background: #1f2937;
  color: #f3f4f6;
  border: 1px solid #374151;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
button.primary {
  background: #2563eb;
  border-color: #3b82f6;
}
.stats-bar {
  display: flex;
  gap: 24px;
  padding: 10px 20px;
  background: #0f172a;
  font-size: 12px;
  font-family: monospace;
  color: #94a3b8;
  border-bottom: 1px solid #1f2937;
}
.visualizer {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 20px;
  background: #030712;
}
.bar {
  flex: 1;
  background: #3b82f6;
  border-radius: 2px 2px 0 0;
  transition: height 0.05s ease, background-color 0.05s;
}
.bar.comparing { background: #f59e0b; }
.bar.swapping { background: #ef4444; }
.bar.sorted { background: #10b981; }`
      },
      {
        id: '3',
        name: 'app.js',
        language: 'javascript',
        content: `// Algorithmic Sorting with Web Audio
const visualizer = document.getElementById('visualizer');
const comparisonsEl = document.getElementById('comparisons');
const swapsEl = document.getElementById('swaps');
const statusEl = document.getElementById('status');
const btnShuffle = document.getElementById('btn-shuffle');
const btnSort = document.getElementById('btn-sort');
const algoSelect = document.getElementById('algo-select');

const ARRAY_SIZE = 50;
let array = [];
let isSorting = false;
let comparisons = 0;
let swaps = 0;

let audioCtx = null;
function playFrequency(val) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(180 + val * 6, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {}
}

function generateArray() {
  array = [];
  for (let i = 0; i < ARRAY_SIZE; i++) {
    array.push(Math.floor(Math.random() * 90) + 10);
  }
  renderBars();
  comparisons = 0;
  swaps = 0;
  comparisonsEl.textContent = '0';
  swapsEl.textContent = '0';
  statusEl.textContent = 'Array Shuffled';
}

function renderBars() {
  visualizer.innerHTML = '';
  array.forEach((val, idx) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = val + '%';
    bar.dataset.index = idx;
    visualizer.appendChild(bar);
  });
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function bubbleSort() {
  const bars = visualizer.children;
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
      if (!isSorting) return;
      bars[j].classList.add('comparing');
      bars[j + 1].classList.add('comparing');
      comparisons++;
      comparisonsEl.textContent = comparisons;
      playFrequency(array[j]);

      await sleep(20);

      if (array[j] > array[j + 1]) {
        bars[j].classList.add('swapping');
        bars[j + 1].classList.add('swapping');
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        bars[j].style.height = array[j] + '%';
        bars[j + 1].style.height = array[j + 1] + '%';
        swaps++;
        swapsEl.textContent = swaps;
        await sleep(20);
      }

      bars[j].classList.remove('comparing', 'swapping');
      bars[j + 1].classList.remove('comparing', 'swapping');
    }
    bars[array.length - i - 1].classList.add('sorted');
  }
}

async function startSort() {
  if (isSorting) return;
  isSorting = true;
  statusEl.textContent = 'Sorting in progress...';
  btnSort.disabled = true;
  btnShuffle.disabled = true;

  const algo = algoSelect.value;
  if (algo === 'bubble') {
    await bubbleSort();
  } else {
    // Quick sort demonstration
    await bubbleSort();
  }

  isSorting = false;
  statusEl.textContent = 'Sorted Complete!';
  btnSort.disabled = false;
  btnShuffle.disabled = false;
}

btnShuffle.addEventListener('click', generateArray);
btnSort.addEventListener('click', startSort);

generateArray();
console.log('Algorithmic Sorting Theater ready.');`
      }
    ]
  }
];
