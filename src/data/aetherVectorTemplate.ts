import { ProjectTemplate } from '../types/ide';

export const AETHER_VECTOR_TEMPLATE: ProjectTemplate = {
  id: 'aether-vector',
  title: 'AetherVector: Orbital Command Deck & Trajectory Planner',
  description: 'Living orbital simulation with real Keplerian mechanics, intelligent telemetry inspector, spacecraft trajectory planner, and switchable Phosphor Lab / Cinematic / Schematic modes.',
  icon: 'Orbit',
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
  <title>AetherVector // Orbital Simulation Command Deck</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
</head>
<body class="theme-phosphor">
  <div class="deck-overlay"></div>

  <!-- TOP TELEMETRY BAR -->
  <header class="command-header">
    <div class="system-brand">
      <div class="radar-ping"></div>
      <div class="brand-text">
        <span class="classification">ASTRO-SIM // CLASS-IV DECK</span>
        <h1>AETHERVECTOR <span class="version">v3.4-ORBITAL</span></h1>
      </div>
    </div>

    <!-- SOL STATUS PANEL -->
    <div class="sol-panel">
      <div class="sol-indicator"></div>
      <div class="sol-info">
        <div class="sol-title">SOL TELEMETRY</div>
        <div class="sol-metrics">
          <span>IRR: <strong>1361 W/m²</strong></span>
          <span class="sep">|</span>
          <span>WIND: <strong id="solar-wind-val">428 km/s</strong></span>
          <span class="sep">|</span>
          <span>CYCLE: <strong>#25 ACTIVE</strong></span>
        </div>
      </div>
    </div>

    <!-- DATE & JULIAN CLOCK -->
    <div class="sim-clock-panel">
      <div class="clock-label">SIMULATION EPOCH</div>
      <div class="clock-display" id="sim-time-display">2026-10-14 00:00:00 UTC</div>
      <div class="julian-date" id="sim-jd-display">JD 2461327.5000</div>
    </div>

    <!-- OPERATING MODE SELECTOR -->
    <div class="mode-selector">
      <button class="mode-btn active" data-mode="phosphor" title="Emerald CRT Phosphor Display">PHOSPHOR LAB</button>
      <button class="mode-btn" data-mode="cinematic" title="3D Realistic Shaded Celestial Sphere">CINEMATIC</button>
      <button class="mode-btn" data-mode="schematic" title="Crisp Engineering Vector Blueprint">SCHEMATIC</button>
    </div>
  </header>

  <!-- MAIN SIMULATION VIEWPORT -->
  <main class="viewport-container">
    <canvas id="orbital-canvas"></canvas>

    <!-- FLOATING CAMERA / TARGET BADGE -->
    <div class="target-badge" id="target-badge" style="display: none;">
      <span class="target-dot"></span>
      <span class="target-text">TARGET LOCK: <strong id="locked-target-name">EARTH</strong></span>
      <button id="btn-unlock-target" title="Release camera lock">×</button>
    </div>

    <!-- DISTANCE MEASURING BANNER -->
    <div class="distance-measurer-banner" id="measure-banner" style="display: none;">
      <span class="meas-icon">⤢</span>
      <span id="measure-readout">Click a second celestial body to calculate separation...</span>
      <button id="btn-cancel-measure">Cancel</button>
    </div>

    <!-- LEFT TELEMETRY INSPECTOR -->
    <aside class="panel inspector-panel" id="inspector-panel">
      <div class="panel-header">
        <span class="panel-tag">TEL-01</span>
        <h2>CELESTIAL INSPECTOR</h2>
        <button class="toggle-btn" id="btn-toggle-inspector">─</button>
      </div>

      <div class="panel-body" id="inspector-body">
        <div class="body-header">
          <div class="body-avatar" id="inspector-avatar"></div>
          <div class="body-identity">
            <h3 id="inspector-name">EARTH (TERRA)</h3>
            <span class="body-class" id="inspector-class">Terrestrial World // 3rd Planet</span>
          </div>
        </div>

        <div class="telemetry-grid">
          <div class="telemetry-cell">
            <span class="tel-label">SEMI-MAJOR AXIS</span>
            <span class="tel-value" id="tel-axis">1.000 AU <small>(149.6M km)</small></span>
          </div>
          <div class="telemetry-cell">
            <span class="tel-label">ECCENTRICITY (e)</span>
            <span class="tel-value" id="tel-ecc">0.0167</span>
          </div>
          <div class="telemetry-cell">
            <span class="tel-label">ORBITAL PERIOD</span>
            <span class="tel-value" id="tel-period">365.25 days</span>
          </div>
          <div class="telemetry-cell">
            <span class="tel-label">CURRENT VELOCITY</span>
            <span class="tel-value" id="tel-vel">29.78 km/s</span>
          </div>
          <div class="telemetry-cell">
            <span class="tel-label">DIST FROM SOL</span>
            <span class="tel-value" id="tel-dist">0.983 - 1.017 AU</span>
          </div>
          <div class="telemetry-cell">
            <span class="tel-label">AXIAL TILT</span>
            <span class="tel-value" id="tel-tilt">23.44°</span>
          </div>
          <div class="telemetry-cell">
            <span class="tel-label">MASS</span>
            <span class="tel-value" id="tel-mass">5.972 × 10²⁴ kg</span>
          </div>
          <div class="telemetry-cell">
            <span class="tel-label">MEAN RADIUS</span>
            <span class="tel-value" id="tel-radius">6,371 km</span>
          </div>
        </div>

        <!-- LIVE COORDINATES -->
        <div class="coords-box">
          <div class="coords-row">
            <span>HELIOCENTRIC X:</span>
            <span class="mono" id="coord-x">+0.984 AU</span>
          </div>
          <div class="coords-row">
            <span>HELIOCENTRIC Y:</span>
            <span class="mono" id="coord-y">+0.178 AU</span>
          </div>
          <div class="coords-row">
            <span>TRUE ANOMALY (ν):</span>
            <span class="mono" id="coord-nu">10.2°</span>
          </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="inspector-actions">
          <button class="cmd-btn" id="btn-lock-body">TARGET LOCK</button>
          <button class="cmd-btn" id="btn-center-body">CENTER VIEW</button>
          <button class="cmd-btn" id="btn-measure-from">MEASURE DISTANCE</button>
        </div>
      </div>
    </aside>

    <!-- RIGHT SPACECRAFT MISSION PLANNER -->
    <aside class="panel mission-panel" id="mission-panel">
      <div class="panel-header">
        <span class="panel-tag">TRAJ-02</span>
        <h2>MISSION PLANNER</h2>
        <button class="toggle-btn" id="btn-toggle-mission">─</button>
      </div>

      <div class="panel-body" id="mission-body">
        <div class="mission-intro">
          Patched-Conic Interplanetary Transfer Computer & Trajectory Injector
        </div>

        <div class="traj-form">
          <div class="input-row">
            <label>DEPARTURE BODY:</label>
            <select id="origin-select" class="deck-select">
              <option value="earth" selected>Earth (Origin)</option>
              <option value="mars">Mars</option>
              <option value="venus">Venus</option>
              <option value="mercury">Mercury</option>
            </select>
          </div>

          <div class="input-row">
            <label>DESTINATION BODY:</label>
            <select id="dest-select" class="deck-select">
              <option value="mars" selected>Mars (Red Planet)</option>
              <option value="jupiter">Jupiter</option>
              <option value="venus">Venus</option>
              <option value="saturn">Saturn</option>
              <option value="mercury">Mercury</option>
            </select>
          </div>
        </div>

        <!-- HOHMANN TRANSFER COMPUTATION -->
        <div class="transfer-metrics">
          <div class="transfer-row">
            <span>TRANSFER SEMI-MAJOR AXIS:</span>
            <strong id="traj-axis">1.262 AU</strong>
          </div>
          <div class="transfer-row">
            <span>DEPARTURE BURN (Δv₁):</span>
            <strong id="traj-dv1">+2.94 km/s</strong>
          </div>
          <div class="transfer-row">
            <span>INSERTION BURN (Δv₂):</span>
            <strong id="traj-dv2">+2.65 km/s</strong>
          </div>
          <div class="transfer-row highlight">
            <span>TOTAL MISSION Δv:</span>
            <strong id="traj-dv-total">5.59 km/s</strong>
          </div>
          <div class="transfer-row highlight">
            <span>EST. TRANSIT DURATION:</span>
            <strong id="traj-time">259.0 days</strong>
          </div>
        </div>

        <!-- FLIGHT STAGE TELEMETRY (WHEN ACTIVE) -->
        <div class="craft-hud" id="craft-hud" style="display: none;">
          <div class="craft-header">
            <span class="craft-icon">🚀</span>
            <div>
              <strong>AETHER-1 PROBE</strong>
              <div class="craft-status" id="craft-status-text">DEPARTURE INJECTION</div>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="craft-progress-fill" style="width: 0%"></div>
          </div>
          <div class="craft-stats">
            <div>VELOCITY: <strong id="craft-speed-text">32.4 km/s</strong></div>
            <div>DISTANCE: <strong id="craft-dist-text">0.12 AU</strong></div>
            <div>ETA: <strong id="craft-eta-text">245 days</strong></div>
          </div>
        </div>

        <div class="mission-actions">
          <button class="launch-btn" id="btn-launch-mission">LAUNCH AETHER-1 PROBE</button>
          <button class="abort-btn" id="btn-abort-mission" style="display: none;">ABORT MISSION</button>
        </div>
      </div>
    </aside>

    <!-- LIVE CONJUNCTION RADAR PILL -->
    <div class="conjunction-radar" id="conjunction-radar">
      <span class="radar-dot"></span>
      <span id="conjunction-text">CONJUNCTION SCAN: VENUS & MARS ALIGNMENT IN 42 DAYS</span>
    </div>
  </main>

  <!-- BOTTOM SIMULATION CONSOLE & CONTROL DECK -->
  <footer class="command-deck">
    <div class="deck-section time-controls">
      <div class="deck-label">TIME ENGINE</div>
      <div class="btn-group">
        <button class="console-btn" id="btn-step-back" title="Step -1 Day">◀ -1D</button>
        <button class="console-btn primary" id="btn-play-pause" title="Play or Pause Simulation">⏸ PAUSE</button>
        <button class="console-btn" id="btn-step-fwd" title="Step +1 Day">+1D ▶</button>
      </div>

      <div class="warp-selector">
        <span class="warp-label">WARP RATE:</span>
        <button class="warp-btn" data-warp="1">1s/s</button>
        <button class="warp-btn" data-warp="3600">1h/s</button>
        <button class="warp-btn active" data-warp="86400">1d/s</button>
        <button class="warp-btn" data-warp="604800">7d/s</button>
        <button class="warp-btn" data-warp="2592000">30d/s</button>
        <button class="warp-btn" data-warp="7776000">90d/s</button>
      </div>
    </div>

    <div class="deck-section view-controls">
      <div class="deck-label">NAVIGATION & CAMERA</div>
      <div class="btn-group">
        <button class="console-btn" id="btn-zoom-in" title="Zoom In">+</button>
        <button class="console-btn" id="btn-zoom-out" title="Zoom Out">−</button>
        <button class="console-btn" id="btn-reset-view" title="Reset View & Scale">RESET</button>
        <button class="console-btn" id="btn-center-sol" title="Focus Sun">SOL</button>
      </div>

      <div class="toggle-group">
        <label class="toggle-chip active" id="chip-trails">
          <input type="checkbox" id="toggle-trails" checked> Trails
        </label>
        <label class="toggle-chip active" id="chip-paths">
          <input type="checkbox" id="toggle-paths" checked> Orbits
        </label>
        <label class="toggle-chip active" id="chip-grid">
          <input type="checkbox" id="toggle-grid" checked> Grid
        </label>
        <label class="toggle-chip active" id="chip-labels">
          <input type="checkbox" id="toggle-labels" checked> Labels
        </label>
      </div>
    </div>

    <div class="deck-section deck-telemetry">
      <div class="deck-label">TELEMETRY LOG</div>
      <div class="deck-log-stream" id="log-stream">
        <div class="log-line">> AetherVector orbital kernel initialized.</div>
        <div class="log-line">> Keplerian solver calibrated to J2000 epoch.</div>
        <div class="log-line">> Patched-conic Hohmann transfer engine ready.</div>
      </div>
      <button class="export-snapshot-btn" id="btn-export-snapshot" title="Export Astronomical Snapshot">EXPORT SNAPSHOT</button>
    </div>
  </footer>

  <script src="app.js"></script>
</body>
</html>`
    },
    {
      id: '2',
      name: 'style.css',
      language: 'css',
      content: `/* ==========================================================================
   AETHERVECTOR // RETRO-FUTURISTIC PLANETARY COMMAND DECK STYLES
   ========================================================================== */

:root {
  --bg-space: #030712;
  --deck-surface: rgba(4, 15, 25, 0.88);
  --deck-border: rgba(0, 255, 136, 0.25);
  --primary-accent: #00ff88;
  --secondary-accent: #38bdf8;
  --amber-accent: #f59e0b;
  --danger-accent: #ef4444;
  --text-main: #e2e8f0;
  --text-muted: #64748b;
  --glow-color: rgba(0, 255, 136, 0.35);
  --font-hud: 'Chakra Petch', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* PHOSPHOR LAB THEME (DEFAULT) */
body.theme-phosphor {
  --bg-space: #020b08;
  --deck-surface: rgba(2, 20, 14, 0.92);
  --deck-border: rgba(0, 255, 136, 0.3);
  --primary-accent: #00ff88;
  --secondary-accent: #00e5ff;
  --text-main: #bbf7d0;
  --text-muted: #22c55e;
  --glow-color: rgba(0, 255, 136, 0.45);
}

/* CINEMATIC THEME */
body.theme-cinematic {
  --bg-space: #050814;
  --deck-surface: rgba(10, 16, 32, 0.85);
  --deck-border: rgba(56, 189, 248, 0.3);
  --primary-accent: #38bdf8;
  --secondary-accent: #f43f5e;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --glow-color: rgba(56, 189, 248, 0.35);
}

/* SCHEMATIC THEME */
body.theme-schematic {
  --bg-space: #070d18;
  --deck-surface: rgba(15, 23, 42, 0.95);
  --deck-border: rgba(148, 163, 184, 0.3);
  --primary-accent: #60a5fa;
  --secondary-accent: #a78bfa;
  --text-main: #cbd5e1;
  --text-muted: #64748b;
  --glow-color: rgba(96, 165, 250, 0.25);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}

body {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-space);
  color: var(--text-main);
  font-family: var(--font-hud);
  position: relative;
  display: flex;
  flex-direction: column;
}

/* CRT SCANLINE & VIGNETTE OVERLAY (PHOSPHOR LAB) */
body.theme-phosphor::after {
  content: " ";
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
              linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
  background-size: 100% 3px, 6px 100%;
  pointer-events: none;
  z-index: 99;
  opacity: 0.85;
}

/* TOP COMMAND HEADER */
.command-header {
  height: 56px;
  background: var(--deck-surface);
  border-bottom: 1px solid var(--deck-border);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 20;
  gap: 16px;
}

.system-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.radar-ping {
  width: 12px;
  height: 12px;
  background: var(--primary-accent);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--primary-accent);
  animation: pulse-ping 2s infinite ease-in-out;
}

@keyframes pulse-ping {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}

.brand-text h1 {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--primary-accent);
  text-shadow: 0 0 8px var(--glow-color);
  line-height: 1;
}

.classification {
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text-muted);
  display: block;
  font-family: var(--font-mono);
}

.version {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 400;
}

/* SOL PANEL */
.sol-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--deck-border);
  border-radius: 6px;
  padding: 4px 12px;
}

.sol-indicator {
  width: 8px;
  height: 8px;
  background: #fbbf24;
  border-radius: 50%;
  box-shadow: 0 0 8px #f59e0b;
}

.sol-title {
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.sol-metrics {
  font-size: 11px;
  font-family: var(--font-mono);
  display: flex;
  gap: 6px;
}

.sol-metrics strong {
  color: var(--primary-accent);
}

.sol-metrics .sep {
  color: var(--deck-border);
}

/* SIMULATION CLOCK */
.sim-clock-panel {
  text-align: center;
}

.clock-label {
  font-size: 8px;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.clock-display {
  font-size: 13px;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.5px;
}

.julian-date {
  font-size: 9px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* MODE SELECTOR */
.mode-selector {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--deck-border);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.mode-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  color: var(--text-main);
}

.mode-btn.active {
  background: var(--primary-accent);
  color: #021a10;
  box-shadow: 0 0 10px var(--glow-color);
}

/* MAIN VIEWPORT */
.viewport-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at center, rgba(16, 36, 30, 0.4) 0%, rgba(2, 8, 6, 0.95) 100%);
}

#orbital-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* TARGET LOCK BADGE */
.target-badge {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--deck-surface);
  border: 1px solid var(--primary-accent);
  padding: 6px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  box-shadow: 0 0 14px var(--glow-color);
  z-index: 15;
}

.target-dot {
  width: 6px;
  height: 6px;
  background: var(--primary-accent);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--primary-accent);
  animation: pulse-ping 1s infinite;
}

.target-badge strong {
  color: var(--primary-accent);
  letter-spacing: 1px;
}

#btn-unlock-target {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
}

#btn-unlock-target:hover {
  color: var(--danger-accent);
}

/* DISTANCE MEASURER BANNER */
.distance-measurer-banner {
  position: absolute;
  top: 14px;
  right: 320px;
  background: rgba(30, 58, 138, 0.85);
  border: 1px solid var(--secondary-accent);
  padding: 6px 14px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #e0f2fe;
  z-index: 15;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}

#btn-cancel-measure {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  cursor: pointer;
}

/* PANELS (LEFT & RIGHT) */
.panel {
  position: absolute;
  top: 16px;
  bottom: 16px;
  width: 280px;
  background: var(--deck-surface);
  border: 1px solid var(--deck-border);
  backdrop-filter: blur(14px);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.inspector-panel {
  left: 16px;
}

.mission-panel {
  right: 16px;
}

.panel.collapsed-left {
  transform: translateX(-260px);
}

.panel.collapsed-right {
  transform: translateX(260px);
}

.panel-header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--deck-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.25);
}

.panel-tag {
  font-size: 8px;
  font-family: var(--font-mono);
  color: var(--primary-accent);
  border: 1px solid var(--primary-accent);
  padding: 1px 4px;
  border-radius: 3px;
}

.panel-header h2 {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-main);
  flex: 1;
  margin-left: 8px;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
}

.panel-body {
  padding: 14px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* BODY HEADER */
.body-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--deck-border);
}

.body-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #38bdf8, #0369a1);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.body-identity h3 {
  font-size: 14px;
  color: var(--primary-accent);
  letter-spacing: 0.5px;
}

.body-class {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

/* TELEMETRY GRID */
.telemetry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.telemetry-cell {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 8px;
  border-radius: 4px;
}

.tel-label {
  font-size: 8px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  display: block;
}

.tel-value {
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-main);
}

.tel-value small {
  font-size: 9px;
  color: var(--text-muted);
  display: block;
}

/* COORDS BOX */
.coords-box {
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--deck-border);
  padding: 8px 10px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coords-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-family: var(--font-mono);
}

.coords-row span:first-child {
  color: var(--text-muted);
}

.mono {
  color: var(--primary-accent);
  font-weight: 700;
}

/* ACTION BUTTONS */
.inspector-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.cmd-btn {
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--primary-accent);
  color: var(--primary-accent);
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.cmd-btn:hover {
  background: var(--primary-accent);
  color: #021a10;
  box-shadow: 0 0 12px var(--glow-color);
}

/* MISSION PLANNER */
.mission-intro {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  line-height: 1.4;
}

.traj-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-row label {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
}

.deck-select {
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--deck-border);
  color: var(--text-main);
  font-family: var(--font-hud);
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 4px;
  outline: none;
}

.transfer-metrics {
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid var(--deck-border);
  padding: 8px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.transfer-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-family: var(--font-mono);
}

.transfer-row span {
  color: var(--text-muted);
}

.transfer-row strong {
  color: var(--text-main);
}

.transfer-row.highlight strong {
  color: var(--primary-accent);
}

/* CRAFT HUD */
.craft-hud {
  background: rgba(2, 44, 34, 0.6);
  border: 1px solid var(--primary-accent);
  padding: 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.craft-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.craft-status {
  font-size: 9px;
  color: var(--primary-accent);
  font-family: var(--font-mono);
  letter-spacing: 1px;
}

.progress-bar-container {
  height: 6px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid var(--deck-border);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #00ff88);
  box-shadow: 0 0 8px #00ff88;
  transition: width 0.3s ease;
}

.craft-stats {
  font-size: 9px;
  font-family: var(--font-mono);
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
}

.craft-stats strong {
  color: var(--text-main);
}

.launch-btn {
  background: linear-gradient(135deg, #059669, #10b981);
  border: 1px solid #34d399;
  color: #fff;
  font-family: var(--font-hud);
  font-size: 12px;
  font-weight: 700;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 1px;
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.4);
  width: 100%;
  transition: all 0.2s ease;
}

.launch-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.abort-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid var(--danger-accent);
  color: var(--danger-accent);
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 1px;
  width: 100%;
}

/* CONJUNCTION RADAR PILL */
.conjunction-radar {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 10px;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  pointer-events: none;
  z-index: 10;
}

.radar-dot {
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse-ping 1.5s infinite;
}

/* BOTTOM COMMAND DECK */
.command-deck {
  height: 84px;
  background: var(--deck-surface);
  border-top: 1px solid var(--deck-border);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  z-index: 20;
}

.deck-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.deck-label {
  font-size: 9px;
  font-family: var(--font-mono);
  letter-spacing: 1.5px;
  color: var(--text-muted);
}

.btn-group {
  display: flex;
  gap: 4px;
}

.console-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--deck-border);
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.console-btn:hover {
  background: var(--deck-border);
  color: #fff;
}

.console-btn.primary {
  background: rgba(0, 255, 136, 0.15);
  border-color: var(--primary-accent);
  color: var(--primary-accent);
  font-weight: 700;
}

.warp-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.warp-label {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.warp-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
}

.warp-btn:hover {
  color: var(--text-main);
}

.warp-btn.active {
  background: var(--primary-accent);
  color: #021a10;
  font-weight: 700;
  box-shadow: 0 0 6px var(--glow-color);
}

.toggle-group {
  display: flex;
  gap: 6px;
}

.toggle-chip {
  font-size: 10px;
  font-family: var(--font-mono);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--deck-border);
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.toggle-chip input {
  cursor: pointer;
}

.deck-telemetry {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.deck-log-stream {
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.log-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--primary-accent);
}

.export-snapshot-btn {
  align-self: flex-end;
  background: transparent;
  border: 1px solid var(--deck-border);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  margin-top: 2px;
}

.export-snapshot-btn:hover {
  color: var(--primary-accent);
  border-color: var(--primary-accent);
}
`
    },
    {
      id: '3',
      name: 'app.js',
      language: 'javascript',
      content: `/**
 * AETHERVECTOR // LIVING ORBITAL SIMULATION & SPACECRAFT COMMAND DECK
 * Complete Real-Time Keplerian Mechanics, Patched-Conic Mission Planner,
 * and Multi-Theme Rendering Engine.
 */

// ==========================================
// 1. ASTRONOMICAL CONSTANTS & CELESTIAL DATA
// ==========================================
const AU_KM = 149597870.7; // 1 AU in km
const G_SOL = 1.32712440018e11; // Standard gravitational parameter of Sun (km^3/s^2)

const CELESTIAL_BODIES = [
  {
    id: 'sun',
    name: 'SOL',
    subname: 'The Sun',
    classification: 'Yellow Dwarf (G2V Star)',
    color: '#fbbf24',
    secondaryColor: '#f59e0b',
    radiusKm: 696340,
    renderRadius: 18,
    mass: '1.989 × 10³⁰ kg',
    semiMajorAxisAU: 0,
    eccentricity: 0,
    orbitalPeriodDays: 0,
    inclinationDeg: 0,
    axialTilt: 7.25,
    meanVelocityKmS: 0,
    phase: 0
  },
  {
    id: 'mercury',
    name: 'MERCURY',
    subname: 'Hermes',
    classification: 'Terrestrial // Inner World',
    color: '#94a3b8',
    secondaryColor: '#64748b',
    radiusKm: 2439.7,
    renderRadius: 4,
    mass: '3.301 × 10²³ kg',
    semiMajorAxisAU: 0.3871,
    eccentricity: 0.2056,
    orbitalPeriodDays: 87.969,
    inclinationDeg: 7.0,
    axialTilt: 0.034,
    meanVelocityKmS: 47.36,
    phase: 0.25
  },
  {
    id: 'venus',
    name: 'VENUS',
    subname: 'Aphrodite',
    classification: 'Terrestrial // Dense Atmosphere',
    color: '#fde047',
    secondaryColor: '#ca8a04',
    radiusKm: 6051.8,
    renderRadius: 6.5,
    mass: '4.867 × 10²⁴ kg',
    semiMajorAxisAU: 0.7233,
    eccentricity: 0.0068,
    orbitalPeriodDays: 224.701,
    inclinationDeg: 3.39,
    axialTilt: 177.36,
    meanVelocityKmS: 35.02,
    phase: 1.15
  },
  {
    id: 'earth',
    name: 'EARTH',
    subname: 'Terra',
    classification: 'Terrestrial // Biosphere Prime',
    color: '#38bdf8',
    secondaryColor: '#0284c7',
    radiusKm: 6371.0,
    renderRadius: 7,
    mass: '5.972 × 10²⁴ kg',
    semiMajorAxisAU: 1.0000,
    eccentricity: 0.0167,
    orbitalPeriodDays: 365.256,
    inclinationDeg: 0.0,
    axialTilt: 23.44,
    meanVelocityKmS: 29.78,
    phase: 2.30
  },
  {
    id: 'mars',
    name: 'MARS',
    subname: 'Ares',
    classification: 'Terrestrial // Red Planet',
    color: '#f97316',
    secondaryColor: '#c2410c',
    radiusKm: 3389.5,
    renderRadius: 5.5,
    mass: '6.417 × 10²³ kg',
    semiMajorAxisAU: 1.5237,
    eccentricity: 0.0934,
    orbitalPeriodDays: 686.980,
    inclinationDeg: 1.85,
    axialTilt: 25.19,
    meanVelocityKmS: 24.07,
    phase: 3.85
  },
  {
    id: 'jupiter',
    name: 'JUPITER',
    subname: 'Zeus',
    classification: 'Gas Giant // Jovian King',
    color: '#fbbf24',
    secondaryColor: '#b45309',
    radiusKm: 69911.0,
    renderRadius: 13,
    mass: '1.898 × 10²⁷ kg',
    semiMajorAxisAU: 5.2044,
    eccentricity: 0.0485,
    orbitalPeriodDays: 4332.59,
    inclinationDeg: 1.30,
    axialTilt: 3.13,
    meanVelocityKmS: 13.07,
    phase: 0.8
  },
  {
    id: 'saturn',
    name: 'SATURN',
    subname: 'Cronus',
    classification: 'Gas Giant // Ring System',
    color: '#e2e8f0',
    secondaryColor: '#ca8a04',
    radiusKm: 58232.0,
    renderRadius: 11,
    mass: '5.683 × 10²⁶ kg',
    semiMajorAxisAU: 9.5826,
    eccentricity: 0.0555,
    orbitalPeriodDays: 10759.22,
    inclinationDeg: 2.49,
    axialTilt: 26.73,
    meanVelocityKmS: 9.69,
    hasRings: true,
    phase: 4.2
  },
  {
    id: 'uranus',
    name: 'URANUS',
    subname: 'Ouranos',
    classification: 'Ice Giant // Aquamarine',
    color: '#67e8f9',
    secondaryColor: '#0891b2',
    radiusKm: 25362.0,
    renderRadius: 8.5,
    mass: '8.681 × 10²⁵ kg',
    semiMajorAxisAU: 19.2184,
    eccentricity: 0.0463,
    orbitalPeriodDays: 30685.4,
    inclinationDeg: 0.77,
    axialTilt: 97.77,
    meanVelocityKmS: 6.81,
    phase: 1.9
  },
  {
    id: 'neptune',
    name: 'NEPTUNE',
    subname: 'Poseidon',
    classification: 'Ice Giant // Deep Azure',
    color: '#3b82f6',
    secondaryColor: '#1d4ed8',
    radiusKm: 24622.0,
    renderRadius: 8.5,
    mass: '1.024 × 10²⁶ kg',
    semiMajorAxisAU: 30.0470,
    eccentricity: 0.0095,
    orbitalPeriodDays: 60189.0,
    inclinationDeg: 1.77,
    axialTilt: 28.32,
    meanVelocityKmS: 5.43,
    phase: 5.4
  }
];

// ==========================================
// 2. SIMULATION STATE ENGINE
// ==========================================
class OrbitalSimulation {
  constructor() {
    this.canvas = document.getElementById('orbital-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Simulation Time
    this.simTimeSec = 0; // Simulated seconds elapsed since epoch
    this.epochDate = new Date('2026-10-14T00:00:00Z');
    this.warpRate = 86400; // Default: 1 real second = 1 sim day (86,400s)
    this.isPlaying = true;
    this.lastFrameTime = performance.now();

    // Camera & Viewport
    this.camera = {
      x: 0,
      y: 0,
      zoom: 180, // pixels per AU
      targetBody: null,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    // Modes & Toggles
    this.mode = 'phosphor'; // 'phosphor' | 'cinematic' | 'schematic'
    this.showTrails = true;
    this.showPaths = true;
    this.showGrid = true;
    this.showLabels = true;

    // Interactive selections
    this.selectedBody = CELESTIAL_BODIES.find(b => b.id === 'earth');
    this.measuringFrom = null; // Measuring separation distance

    // Historical Trails cache
    this.trails = {};
    CELESTIAL_BODIES.forEach(b => {
      this.trails[b.id] = [];
    });

    // Spacecraft Mission State
    this.activeMission = null; // Aether-1 Spacecraft

    // Initial setup
    this.resizeCanvas();
    this.bindEvents();
    this.updateInspectorUI();
    this.recomputeTrajectory();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.viewWidth = rect.width;
    this.viewHeight = rect.height;
  }

  // Keplerian orbit position solver via Newton-Raphson
  solveKepler(meanAnomaly, eccentricity) {
    let E = meanAnomaly;
    for (let i = 0; i < 6; i++) {
      const delta = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
      E -= delta;
      if (Math.abs(delta) < 1e-6) break;
    }
    // True anomaly ν
    const sinNu = (Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E)) / (1 - eccentricity * Math.cos(E));
    const cosNu = (Math.cos(E) - eccentricity) / (1 - eccentricity * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);

    // Distance r (AU)
    const r = (this.selectedBody?.semiMajorAxisAU || 1) * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(nu));
    return { E, nu, r };
  }

  // Calculate coordinates and orbital speed for any celestial body at current simTime
  calculateBodyState(body) {
    if (body.id === 'sun') {
      return { x: 0, y: 0, r: 0, nu: 0, speedKmS: 0 };
    }

    const periodSec = body.orbitalPeriodDays * 86400;
    const meanMotion = (2 * Math.PI) / periodSec;
    const meanAnomaly = (meanMotion * this.simTimeSec + body.phase) % (2 * Math.PI);

    // Solve Kepler's equation for eccentric orbit
    let E = meanAnomaly;
    for (let i = 0; i < 6; i++) {
      const delta = (E - body.eccentricity * Math.sin(E) - meanAnomaly) / (1 - body.eccentricity * Math.cos(E));
      E -= delta;
      if (Math.abs(delta) < 1e-6) break;
    }

    const sinNu = (Math.sqrt(1 - body.eccentricity * body.eccentricity) * Math.sin(E)) / (1 - body.eccentricity * Math.cos(E));
    const cosNu = (Math.cos(E) - body.eccentricity) / (1 - body.eccentricity * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);

    // Radius from Sun in AU
    const a = body.semiMajorAxisAU;
    const e = body.eccentricity;
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu));

    const x = r * Math.cos(nu);
    const y = r * Math.sin(nu);

    // Vis-Viva equation for real instantaneous orbital speed:
    // v^2 = G*M_sun * (2/r_km - 1/a_km)
    const rKm = r * AU_KM;
    const aKm = a * AU_KM;
    const speedKmS = Math.sqrt(Math.max(0, G_SOL * (2 / rKm - 1 / aKm)));

    return { x, y, r, nu, speedKmS };
  }

  // World AU coords to canvas screen coords
  worldToScreen(xAU, yAU) {
    const cx = this.viewWidth / 2;
    const cy = this.viewHeight / 2;
    const screenX = cx + (xAU - this.camera.x) * this.camera.zoom;
    const screenY = cy + (yAU - this.camera.y) * this.camera.zoom;
    return { x: screenX, y: screenY };
  }

  // Canvas screen coords to World AU coords
  screenToWorld(screenX, screenY) {
    const cx = this.viewWidth / 2;
    const cy = this.viewHeight / 2;
    const xAU = this.camera.x + (screenX - cx) / this.camera.zoom;
    const yAU = this.camera.y + (screenY - cy) / this.camera.zoom;
    return { x: xAU, y: yAU };
  }

  // ==========================================
  // 3. SPACECRAFT PATChED-CONIC TRAJECTORY
  // ==========================================
  recomputeTrajectory() {
    const originId = document.getElementById('origin-select').value;
    const destId = document.getElementById('dest-select').value;

    const b1 = CELESTIAL_BODIES.find(b => b.id === originId) || CELESTIAL_BODIES[3];
    const b2 = CELESTIAL_BODIES.find(b => b.id === destId) || CELESTIAL_BODIES[4];

    const r1 = b1.semiMajorAxisAU;
    const r2 = b2.semiMajorAxisAU;

    // Hohmann transfer semi-major axis
    const aTransfer = (r1 + r2) / 2;

    // Standard velocities
    const r1Km = r1 * AU_KM;
    const r2Km = r2 * AU_KM;
    const aTransKm = aTransfer * AU_KM;

    // Departure delta-v
    const v1 = Math.sqrt(G_SOL / r1Km);
    const vTransfer1 = Math.sqrt(G_SOL * (2 / r1Km - 1 / aTransKm));
    const deltaV1 = Math.abs(vTransfer1 - v1);

    // Arrival delta-v
    const v2 = Math.sqrt(G_SOL / r2Km);
    const vTransfer2 = Math.sqrt(G_SOL * (2 / r2Km - 1 / aTransKm));
    const deltaV2 = Math.abs(v2 - vTransfer2);

    const totalDeltaV = deltaV1 + deltaV2;

    // Transfer time: half the orbital period of the transfer ellipse
    const transferPeriodSec = 2 * Math.PI * Math.sqrt(Math.pow(aTransKm, 3) / G_SOL);
    const transitDays = (transferPeriodSec / 2) / 86400;

    document.getElementById('traj-axis').innerText = aTransfer.toFixed(3) + ' AU';
    document.getElementById('traj-dv1').innerText = '+' + deltaV1.toFixed(2) + ' km/s';
    document.getElementById('traj-dv2').innerText = '+' + deltaV2.toFixed(2) + ' km/s';
    document.getElementById('traj-dv-total').innerText = totalDeltaV.toFixed(2) + ' km/s';
    document.getElementById('traj-time').innerText = transitDays.toFixed(1) + ' days';

    this.plannedTraj = { b1, b2, aTransfer, deltaV1, deltaV2, totalDeltaV, transitDays };
  }

  launchMission() {
    if (!this.plannedTraj) this.recomputeTrajectory();
    const { b1, b2, aTransfer, transitDays } = this.plannedTraj;

    const startState = this.calculateBodyState(b1);
    const originAngle = Math.atan2(startState.y, startState.x);

    this.activeMission = {
      name: 'AETHER-1',
      origin: b1,
      destination: b2,
      startSimTime: this.simTimeSec,
      totalDurationSec: transitDays * 86400,
      originAngle: originAngle,
      aTransfer: aTransfer,
      r1: b1.semiMajorAxisAU,
      r2: b2.semiMajorAxisAU,
      status: 'DEPARTURE INJECTION',
      path: []
    };

    document.getElementById('craft-hud').style.display = 'flex';
    document.getElementById('btn-launch-mission').style.display = 'none';
    document.getElementById('btn-abort-mission').style.display = 'block';

    this.logTelemetry(\`🚀 Spacecraft AETHER-1 departed \${b1.name} towards \${b2.name}. Trajectory injected.\`);
  }

  abortMission() {
    this.activeMission = null;
    document.getElementById('craft-hud').style.display = 'none';
    document.getElementById('btn-launch-mission').style.display = 'block';
    document.getElementById('btn-abort-mission').style.display = 'none';
    this.logTelemetry('⚠ Mission aborted. Spacecraft telemetry offline.');
  }

  // Compute spacecraft live position along transfer ellipse
  calculateCraftState() {
    if (!this.activeMission) return null;
    const mission = this.activeMission;
    const elapsed = this.simTimeSec - mission.startSimTime;
    const progress = Math.min(1, Math.max(0, elapsed / mission.totalDurationSec));

    // Progress along transfer ellipse from 0 to PI
    const theta = progress * Math.PI;
    const currentAngle = mission.originAngle + theta;

    // Radius from Sun on transfer ellipse: r = a(1-e^2)/(1 + e cos(theta))
    const e = Math.abs(mission.r2 - mission.r1) / (mission.r1 + mission.r2);
    const r = mission.aTransfer * (1 - e * e) / (1 + e * Math.cos(theta));

    const x = r * Math.cos(currentAngle);
    const y = r * Math.sin(currentAngle);

    // Velocity on transfer orbit
    const rKm = r * AU_KM;
    const aKm = mission.aTransfer * AU_KM;
    const speedKmS = Math.sqrt(Math.max(0, G_SOL * (2 / rKm - 1 / aKm)));

    // Destination target distance
    const destState = this.calculateBodyState(mission.destination);
    const dx = x - destState.x;
    const dy = y - destState.y;
    const distToDestAU = Math.sqrt(dx * dx + dy * dy);

    // Update status stages
    if (progress < 0.05) {
      mission.status = 'STAGE 1: TRANS-PLANETARY INJECTION BURN';
    } else if (progress < 0.92) {
      mission.status = 'STAGE 2: HELIOCENTRIC INTERPLANETARY CRUISE';
    } else if (progress < 1.0) {
      mission.status = 'STAGE 3: PLANETARY APPROACH & CAPTURE';
    } else {
      mission.status = 'STAGE 4: ORBITAL INSERTION ACHIEVED';
    }

    return { x, y, progress, speedKmS, distToDestAU, remainingDays: Math.max(0, (mission.totalDurationSec - elapsed) / 86400) };
  }

  // ==========================================
  // 4. RENDERING PIPELINE
  // ==========================================
  render() {
    const ctx = this.ctx;
    const width = this.viewWidth;
    const height = this.viewHeight;

    // Clear frame
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Target Lock if active
    if (this.camera.targetBody) {
      const targetState = this.camera.targetBody === 'craft' && this.activeMission
        ? this.calculateCraftState()
        : this.calculateBodyState(this.camera.targetBody);

      if (targetState) {
        this.camera.x += (targetState.x - this.camera.x) * 0.15;
        this.camera.y += (targetState.y - this.camera.y) * 0.15;
      }
    }

    // 1. Draw Starfield & Cosmic Grid
    this.renderBackground(ctx, width, height);

    // 2. Draw Concentric AU Radar Rings
    if (this.showGrid) {
      this.renderDistanceRadar(ctx);
    }

    // 3. Draw Planetary Orbital Paths (Ellipses)
    if (this.showPaths) {
      this.renderOrbitalPaths(ctx);
    }

    // 4. Draw Spacecraft Planned / Active Transfer Trajectory
    this.renderMissionTrajectory(ctx);

    // 5. Draw Dynamic Orbital Trails
    if (this.showTrails) {
      this.renderOrbitalTrails(ctx);
    }

    // 6. Draw Celestial Bodies (Sun, Planets, Moon)
    this.renderCelestialBodies(ctx);

    // 7. Draw Active Spacecraft Probe
    this.renderSpacecraft(ctx);

    // 8. Draw Distance Measuring Vector
    if (this.measuringFrom) {
      this.renderMeasurementVector(ctx);
    }
  }

  renderBackground(ctx, width, height) {
    if (this.mode === 'cinematic') {
      // Deep space subtle gradient with twinkling stars
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
      grad.addColorStop(0, '#0a1128');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Star dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 70; i++) {
        const sx = ((i * 197.3) % width);
        const sy = ((i * 311.7) % height);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }
    } else if (this.mode === 'phosphor') {
      // Emerald CRT radar background
      ctx.fillStyle = '#020e09';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Schematic Blueprint grid
      ctx.fillStyle = '#060d1a';
      ctx.fillRect(0, 0, width, height);
    }
  }

  renderDistanceRadar(ctx) {
    const sunScreen = this.worldToScreen(0, 0);
    const radarDistancesAU = [0.5, 1.0, 1.5, 2.5, 5.0, 10.0, 20.0, 30.0];

    ctx.save();
    radarDistancesAU.forEach(dist => {
      const radiusPx = dist * this.camera.zoom;
      if (radiusPx < 10 || radiusPx > Math.max(this.viewWidth, this.viewHeight) * 1.5) return;

      ctx.beginPath();
      ctx.arc(sunScreen.x, sunScreen.y, radiusPx, 0, Math.PI * 2);
      if (this.mode === 'phosphor') {
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
      } else if (this.mode === 'schematic') {
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      }
      ctx.stroke();

      // AU Label
      if (this.showLabels && radiusPx > 30) {
        ctx.fillStyle = this.mode === 'phosphor' ? 'rgba(0, 255, 136, 0.35)' : 'rgba(148, 163, 184, 0.4)';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(dist + ' AU', sunScreen.x + radiusPx + 4, sunScreen.y - 4);
      }
    });
    ctx.restore();
  }

  renderOrbitalPaths(ctx) {
    ctx.save();
    CELESTIAL_BODIES.forEach(body => {
      if (body.id === 'sun') return;

      const a = body.semiMajorAxisAU;
      const e = body.eccentricity;
      const b = a * Math.sqrt(1 - e * e); // Semi-minor axis
      const centerOffsetAU = a * e; // Focus offset from center

      const centerScreen = this.worldToScreen(-centerOffsetAU, 0);
      const radiusX = a * this.camera.zoom;
      const radiusY = b * this.camera.zoom;

      ctx.beginPath();
      ctx.ellipse(centerScreen.x, centerScreen.y, radiusX, radiusY, 0, 0, Math.PI * 2);

      if (this.mode === 'phosphor') {
        ctx.strokeStyle = body.id === this.selectedBody?.id ? 'rgba(0, 255, 136, 0.5)' : 'rgba(0, 255, 136, 0.15)';
        ctx.lineWidth = body.id === this.selectedBody?.id ? 1.5 : 0.8;
      } else if (this.mode === 'schematic') {
        ctx.strokeStyle = body.id === this.selectedBody?.id ? 'rgba(56, 189, 248, 0.6)' : 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = body.id === this.selectedBody?.id ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  renderMissionTrajectory(ctx) {
    if (!this.plannedTraj && !this.activeMission) return;

    ctx.save();
    const traj = this.plannedTraj;
    const b1 = traj.b1;
    const b2 = traj.b2;

    const r1 = b1.semiMajorAxisAU;
    const r2 = b2.semiMajorAxisAU;
    const aTransfer = (r1 + r2) / 2;
    const eTransfer = Math.abs(r2 - r1) / (r1 + r2);
    const bTransfer = aTransfer * Math.sqrt(1 - eTransfer * eTransfer);

    // Plot transfer arc
    const sunScreen = this.worldToScreen(0, 0);
    const startAngle = this.activeMission ? this.activeMission.originAngle : 0;

    ctx.beginPath();
    for (let th = 0; th <= Math.PI; th += 0.05) {
      const r = aTransfer * (1 - eTransfer * eTransfer) / (1 + eTransfer * Math.cos(th));
      const ang = startAngle + th;
      const pt = this.worldToScreen(r * Math.cos(ang), r * Math.sin(ang));
      if (th === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }

    ctx.strokeStyle = this.activeMission ? '#00ff88' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();

    ctx.restore();
  }

  renderOrbitalTrails(ctx) {
    ctx.save();
    CELESTIAL_BODIES.forEach(body => {
      if (body.id === 'sun') return;
      const trail = this.trails[body.id];
      if (!trail || trail.length < 2) return;

      ctx.beginPath();
      trail.forEach((pt, idx) => {
        const sc = this.worldToScreen(pt.x, pt.y);
        if (idx === 0) ctx.moveTo(sc.x, sc.y);
        else ctx.lineTo(sc.x, sc.y);
      });

      const trailAlpha = this.mode === 'phosphor' ? 0.35 : 0.25;
      ctx.strokeStyle = body.color;
      ctx.globalAlpha = trailAlpha;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
    ctx.restore();
  }

  renderCelestialBodies(ctx) {
    CELESTIAL_BODIES.forEach(body => {
      const state = this.calculateBodyState(body);
      const sc = this.worldToScreen(state.x, state.y);

      // Record trail point
      if (body.id !== 'sun' && this.isPlaying) {
        const trail = this.trails[body.id];
        trail.push({ x: state.x, y: state.y });
        if (trail.length > 40) trail.shift();
      }

      ctx.save();

      // 1. SOL Rendering with Corona
      if (body.id === 'sun') {
        const rad = Math.max(12, body.renderRadius);

        if (this.mode === 'cinematic') {
          // Solar Corona flare gradient
          const glow = ctx.createRadialGradient(sc.x, sc.y, rad * 0.5, sc.x, sc.y, rad * 2.8);
          glow.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
          glow.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
          glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad * 2.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fffbeb';
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.mode === 'phosphor') {
          // Retro phosphor bright glowing circle with reticle
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 14;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Crosshairs
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
          ctx.beginPath();
          ctx.moveTo(sc.x - rad - 6, sc.y); ctx.lineTo(sc.x + rad + 6, sc.y);
          ctx.moveTo(sc.x, sc.y - rad - 6); ctx.lineTo(sc.x, sc.y + rad + 6);
          ctx.stroke();
        } else {
          // Schematic crisp vector sun
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
        }
      } else {
        // 2. Planets Rendering
        const rad = Math.max(3, body.renderRadius);

        // Selection Target Ring
        if (body.id === this.selectedBody?.id) {
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad + 7, 0, Math.PI * 2);
          ctx.strokeStyle = this.mode === 'phosphor' ? '#00ff88' : '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Saturn Rings
        if (body.hasRings) {
          ctx.beginPath();
          ctx.ellipse(sc.x, sc.y, rad * 2.3, rad * 0.8, -Math.PI / 6, 0, Math.PI * 2);
          ctx.strokeStyle = this.mode === 'phosphor' ? 'rgba(0, 255, 136, 0.6)' : 'rgba(253, 224, 71, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        if (this.mode === 'cinematic') {
          // 3D Spherical Radial Lighting from Sun (0, 0)
          const angleToSun = Math.atan2(0 - state.y, 0 - state.x);
          const lightOffsetX = Math.cos(angleToSun) * (rad * 0.35);
          const lightOffsetY = Math.sin(angleToSun) * (rad * 0.35);

          const planetGrad = ctx.createRadialGradient(
            sc.x + lightOffsetX, sc.y + lightOffsetY, rad * 0.1,
            sc.x, sc.y, rad
          );
          planetGrad.addColorStop(0, '#ffffff');
          planetGrad.addColorStop(0.3, body.color);
          planetGrad.addColorStop(1, body.secondaryColor || '#000000');

          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = planetGrad;
          ctx.fill();

          // Atmospheric scattering glow
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad + 2, 0, Math.PI * 2);
          ctx.strokeStyle = body.color;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (this.mode === 'phosphor') {
          // Phosphor glowing dot
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Schematic crisp solid color dot
          ctx.beginPath();
          ctx.arc(sc.x, sc.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = body.color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
        }

        // Earth's Moon
        if (body.id === 'earth') {
          const moonAngle = (this.simTimeSec / (27.3 * 86400)) * (2 * Math.PI);
          const moonDistPx = 16;
          const moonScX = sc.x + Math.cos(moonAngle) * moonDistPx;
          const moonScY = sc.y + Math.sin(moonAngle) * moonDistPx;

          ctx.beginPath();
          ctx.arc(moonScX, moonScY, 2, 0, Math.PI * 2);
          ctx.fillStyle = this.mode === 'phosphor' ? '#00ff88' : '#cbd5e1';
          ctx.fill();
        }
      }

      // Planet Label
      if (this.showLabels) {
        ctx.fillStyle = this.mode === 'phosphor' ? '#00ff88' : '#e2e8f0';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(body.name, sc.x + body.renderRadius + 5, sc.y + 3);
      }

      ctx.restore();
    });
  }

  renderSpacecraft(ctx) {
    if (!this.activeMission) return;
    const craft = this.calculateCraftState();
    if (!craft) return;

    const sc = this.worldToScreen(craft.x, craft.y);

    ctx.save();
    // Craft Icon & Reticle
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Target crosshair
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sc.x - 9, sc.y); ctx.lineTo(sc.x + 9, sc.y);
    ctx.moveTo(sc.x, sc.y - 9); ctx.lineTo(sc.x, sc.y + 9);
    ctx.stroke();

    // Craft label
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px JetBrains Mono';
    ctx.fillText('AETHER-1', sc.x + 10, sc.y + 3);

    ctx.restore();

    // Update Live Mission HUD
    document.getElementById('craft-status-text').innerText = this.activeMission.status;
    document.getElementById('craft-progress-fill').style.width = (craft.progress * 100).toFixed(1) + '%';
    document.getElementById('craft-speed-text').innerText = craft.speedKmS.toFixed(1) + ' km/s';
    document.getElementById('craft-dist-text').innerText = craft.distToDestAU.toFixed(3) + ' AU';
    document.getElementById('craft-eta-text').innerText = craft.remainingDays.toFixed(1) + ' days';
  }

  renderMeasurementVector(ctx) {
    const b1State = this.calculateBodyState(this.measuringFrom);
    const mouseAU = this.screenToWorld(this.lastMouseX || this.viewWidth / 2, this.lastMouseY || this.viewHeight / 2);

    const pt1 = this.worldToScreen(b1State.x, b1State.y);
    const pt2 = this.worldToScreen(mouseAU.x, mouseAU.y);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // ==========================================
  // 5. USER INTERFACE & TELEMETRY SYNC
  // ==========================================
  updateInspectorUI() {
    const body = this.selectedBody;
    if (!body) return;

    const state = this.calculateBodyState(body);

    document.getElementById('inspector-name').innerText = body.name + ' (' + (body.subname || 'SOL') + ')';
    document.getElementById('inspector-class').innerText = body.classification;
    document.getElementById('inspector-avatar').style.background = body.color;

    document.getElementById('tel-axis').innerHTML = body.semiMajorAxisAU > 0
      ? \`\${body.semiMajorAxisAU.toFixed(3)} AU <small>(\${(body.semiMajorAxisAU * AU_KM / 1e6).toFixed(1)}M km)</small>\`
      : '0.000 AU (Origin)';
    document.getElementById('tel-ecc').innerText = body.eccentricity.toFixed(4);
    document.getElementById('tel-period').innerText = body.orbitalPeriodDays > 0 ? body.orbitalPeriodDays.toFixed(1) + ' days' : 'N/A';
    document.getElementById('tel-vel').innerText = state.speedKmS.toFixed(2) + ' km/s';
    document.getElementById('tel-dist').innerText = body.semiMajorAxisAU > 0
      ? \`\${(state.r).toFixed(3)} AU (\${(state.r * AU_KM / 1e6).toFixed(1)}M km)\`
      : '0.000 AU';
    document.getElementById('tel-tilt').innerText = body.axialTilt.toFixed(2) + '°';
    document.getElementById('tel-mass').innerText = body.mass;
    document.getElementById('tel-radius').innerText = body.radiusKm.toLocaleString() + ' km';

    document.getElementById('coord-x').innerText = (state.x >= 0 ? '+' : '') + state.x.toFixed(3) + ' AU';
    document.getElementById('coord-y').innerText = (state.y >= 0 ? '+' : '') + state.y.toFixed(3) + ' AU';
    document.getElementById('coord-nu').innerText = ((state.nu * 180 / Math.PI + 360) % 360).toFixed(1) + '°';
  }

  logTelemetry(msg) {
    const stream = document.getElementById('log-stream');
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerText = '> ' + msg;
    stream.appendChild(line);
    if (stream.children.length > 8) stream.removeChild(stream.firstChild);
    stream.scrollTop = stream.scrollHeight;
  }

  // ==========================================
  // 6. EVENT LISTENERS & NAVIGATION CONTROLS
  // ==========================================
  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Mouse Navigation (Pan & Zoom)
    this.canvas.addEventListener('mousedown', (e) => {
      this.camera.isDragging = true;
      this.camera.dragStartX = e.clientX;
      this.camera.dragStartY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.lastMouseX = e.clientX - rect.left;
      this.lastMouseY = e.clientY - rect.top;

      if (this.camera.isDragging) {
        const dx = e.clientX - this.camera.dragStartX;
        const dy = e.clientY - this.camera.dragStartY;
        this.camera.x -= dx / this.camera.zoom;
        this.camera.y -= dy / this.camera.zoom;
        this.camera.dragStartX = e.clientX;
        this.camera.dragStartY = e.clientY;

        // If user manually dragged, release target lock
        if (Math.hypot(dx, dy) > 8 && this.camera.targetBody) {
          this.camera.targetBody = null;
          document.getElementById('target-badge').style.display = 'none';
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.camera.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      this.camera.zoom = Math.min(1200, Math.max(15, this.camera.zoom * zoomFactor));
    }, { passive: false });

    // Click to select celestial body
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check distance to all bodies
      for (const body of CELESTIAL_BODIES) {
        const state = this.calculateBodyState(body);
        const sc = this.worldToScreen(state.x, state.y);
        const distPx = Math.hypot(clickX - sc.x, clickY - sc.y);

        if (distPx <= Math.max(body.renderRadius + 6, 14)) {
          if (this.measuringFrom && this.measuringFrom.id !== body.id) {
            // Complete measurement
            const b1 = this.measuringFrom;
            const b2 = body;
            const s1 = this.calculateBodyState(b1);
            const s2 = this.calculateBodyState(b2);
            const sepAU = Math.hypot(s1.x - s2.x, s1.y - s2.y);
            const sepKm = sepAU * AU_KM;

            this.logTelemetry(\`DIST: \${b1.name} to \${b2.name} separation = \${sepAU.toFixed(3)} AU (\${(sepKm / 1e6).toFixed(1)}M km)\`);
            document.getElementById('measure-banner').style.display = 'none';
            this.measuringFrom = null;
          } else {
            this.selectedBody = body;
            this.updateInspectorUI();
            this.logTelemetry(\`Telemetry lock acquired: \${body.name} (\${body.classification})\`);
          }
          return;
        }
      }
    });

    // Theme Mode Switcher
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const mode = e.currentTarget.dataset.mode;
        this.mode = mode;
        document.body.className = 'theme-' + mode;
        this.logTelemetry(\`Display mode changed to \${mode.toUpperCase()}.\`);
      });
    });

    // Time Engine Controls
    const playPauseBtn = document.getElementById('btn-play-pause');
    playPauseBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playPauseBtn.innerText = this.isPlaying ? '⏸ PAUSE' : '▶ RESUME';
      playPauseBtn.classList.toggle('primary', this.isPlaying);
      this.logTelemetry(this.isPlaying ? 'Simulation time engine running.' : 'Simulation time engine paused.');
    });

    document.getElementById('btn-step-fwd').addEventListener('click', () => {
      this.simTimeSec += 86400;
      this.updateSimulationClock();
      this.updateInspectorUI();
      this.logTelemetry('Stepped simulation +1.0 day forward.');
    });

    document.getElementById('btn-step-back').addEventListener('click', () => {
      this.simTimeSec -= 86400;
      this.updateSimulationClock();
      this.updateInspectorUI();
      this.logTelemetry('Stepped simulation -1.0 day backward.');
    });

    // Warp Rate Buttons
    document.querySelectorAll('.warp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.warp-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.warpRate = parseFloat(e.currentTarget.dataset.warp);
        this.logTelemetry(\`Warp rate set to \${e.currentTarget.innerText} (\${this.warpRate}s/s).\`);
      });
    });

    // Navigation & View Toggles
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      this.camera.zoom = Math.min(1200, this.camera.zoom * 1.3);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      this.camera.zoom = Math.max(15, this.camera.zoom * 0.7);
    });
    document.getElementById('btn-reset-view').addEventListener('click', () => {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.zoom = 180;
      this.camera.targetBody = null;
      document.getElementById('target-badge').style.display = 'none';
      this.logTelemetry('Camera reset to Solar System barycenter.');
    });
    document.getElementById('btn-center-sol').addEventListener('click', () => {
      this.camera.x = 0;
      this.camera.y = 0;
      this.camera.targetBody = CELESTIAL_BODIES[0];
      document.getElementById('locked-target-name').innerText = 'SOL';
      document.getElementById('target-badge').style.display = 'flex';
    });

    // Checkbox toggles
    document.getElementById('toggle-trails').addEventListener('change', (e) => {
      this.showTrails = e.target.checked;
    });
    document.getElementById('toggle-paths').addEventListener('change', (e) => {
      this.showPaths = e.target.checked;
    });
    document.getElementById('toggle-grid').addEventListener('change', (e) => {
      this.showGrid = e.target.checked;
    });
    document.getElementById('toggle-labels').addEventListener('change', (e) => {
      this.showLabels = e.target.checked;
    });

    // Target Lock
    document.getElementById('btn-lock-body').addEventListener('click', () => {
      if (this.selectedBody) {
        this.camera.targetBody = this.selectedBody;
        document.getElementById('locked-target-name').innerText = this.selectedBody.name;
        document.getElementById('target-badge').style.display = 'flex';
        this.logTelemetry(\`Tracking camera locked onto \${this.selectedBody.name}.\`);
      }
    });

    document.getElementById('btn-unlock-target').addEventListener('click', () => {
      this.camera.targetBody = null;
      document.getElementById('target-badge').style.display = 'none';
      this.logTelemetry('Camera tracking lock disengaged.');
    });

    document.getElementById('btn-center-body').addEventListener('click', () => {
      if (this.selectedBody) {
        const state = this.calculateBodyState(this.selectedBody);
        this.camera.x = state.x;
        this.camera.y = state.y;
      }
    });

    // Distance Measurement
    document.getElementById('btn-measure-from').addEventListener('click', () => {
      if (this.selectedBody) {
        this.measuringFrom = this.selectedBody;
        document.getElementById('measure-banner').style.display = 'flex';
        document.getElementById('measure-readout').innerText = \`Measuring from \${this.selectedBody.name}. Click target body...\`;
      }
    });

    document.getElementById('btn-cancel-measure').addEventListener('click', () => {
      this.measuringFrom = null;
      document.getElementById('measure-banner').style.display = 'none';
    });

    // Trajectory Selects
    document.getElementById('origin-select').addEventListener('change', () => this.recomputeTrajectory());
    document.getElementById('dest-select').addEventListener('change', () => this.recomputeTrajectory());

    // Mission Buttons
    document.getElementById('btn-launch-mission').addEventListener('click', () => this.launchMission());
    document.getElementById('btn-abort-mission').addEventListener('click', () => this.abortMission());

    // Export Snapshot
    document.getElementById('btn-export-snapshot').addEventListener('click', () => {
      const snapshot = {
        title: 'AetherVector Astronomical State Snapshot',
        timestampUTC: new Date(this.epochDate.getTime() + this.simTimeSec * 1000).toISOString(),
        julianDate: this.calculateJulianDate(),
        selectedBody: this.selectedBody?.name,
        telemetry: CELESTIAL_BODIES.map(b => ({
          body: b.name,
          ...this.calculateBodyState(b)
        })),
        activeMission: this.activeMission ? {
          name: this.activeMission.name,
          status: this.activeMission.status,
          ...this.calculateCraftState()
        } : null
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', \`aethervector_snapshot_\${Date.now()}.json\`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.logTelemetry('Astronomical snapshot exported successfully.');
    });
  }

  // ==========================================
  // 7. TIME ENGINE & JULIAN DATE
  // ==========================================
  calculateJulianDate() {
    const currentMs = this.epochDate.getTime() + this.simTimeSec * 1000;
    // JD for Unix timestamp: (ms / 86400000) + 2440587.5
    return (currentMs / 86400000) + 2440587.5;
  }

  updateSimulationClock() {
    const currentDate = new Date(this.epochDate.getTime() + this.simTimeSec * 1000);
    const dateStr = currentDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    document.getElementById('sim-time-display').innerText = dateStr;

    const jd = this.calculateJulianDate();
    document.getElementById('sim-jd-display').innerText = 'JD ' + jd.toFixed(4);
  }

  // ==========================================
  // 8. MAIN ANIMATION LOOP
  // ==========================================
  loop(timestamp) {
    const dtReal = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    if (this.isPlaying && dtReal > 0 && dtReal < 0.25) {
      this.simTimeSec += dtReal * this.warpRate;
      this.updateSimulationClock();
      this.updateInspectorUI();
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// Boot simulator when page is ready
window.addEventListener('DOMContentLoaded', () => {
  const sim = new OrbitalSimulation();
  requestAnimationFrame((t) => sim.loop(t));
  console.log('AetherVector Orbital Simulation initialized successfully.');
});
`
    }
  ]
};
