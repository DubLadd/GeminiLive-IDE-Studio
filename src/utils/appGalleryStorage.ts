import { GalleryApp } from '../types/gallery';
import { db, doc, setDoc, deleteDoc, getDocs, collection, query, where, User } from '../lib/firebase';

const LOCAL_STORAGE_KEY = 'gemini_ide_app_gallery_v1';

// Starter gallery templates if storage is empty
export const DEFAULT_GALLERY_APPS: GalleryApp[] = [
  {
    id: 'starter-retro-snake',
    title: 'Retro Neon Snake Game',
    description: 'Cyberpunk style 60fps canvas arcade snake game with particle effects and high score storage.',
    category: 'game',
    tags: ['canvas', 'arcade', 'particles', 'zero-dependency'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Retro Neon Snake</title>
  <style>
    body {
      margin: 0;
      background: #0a0b10;
      color: #00ffcc;
      font-family: 'Courier New', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    h1 {
      margin: 5px 0;
      font-size: 24px;
      text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc;
    }
    #score-board {
      display: flex;
      gap: 20px;
      font-size: 14px;
      margin-bottom: 10px;
    }
    canvas {
      border: 2px solid #00ffcc;
      box-shadow: 0 0 25px rgba(0,255,204,0.3);
      border-radius: 8px;
      background: #050508;
    }
    .controls {
      margin-top: 12px;
      display: flex;
      gap: 8px;
    }
    button {
      background: #111424;
      border: 1px solid #00ffcc;
      color: #00ffcc;
      padding: 6px 14px;
      border-radius: 4px;
      font-family: inherit;
      cursor: pointer;
      font-weight: bold;
    }
    button:hover { background: #00ffcc; color: #0a0b10; }
  </style>
</head>
<body>
  <h1>// NEON SNAKE //</h1>
  <div id="score-board">
    <span>SCORE: <b id="score">0</b></span>
    <span>BEST: <b id="best">0</b></span>
  </div>
  <canvas id="game" width="380" height="380"></canvas>
  <div class="controls">
    <button onclick="startGame()">RESET GAME</button>
  </div>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const grid = 19;
    let count = 0;
    let score = 0;
    let best = localStorage.getItem('neon_snake_best') || 0;
    document.getElementById('best').textContent = best;

    let snake = { x: 190, y: 190, dx: grid, dy: 0, cells: [], maxCells: 4 };
    let apple = { x: 95, y: 95 };

    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function resetApple() {
      apple.x = getRandomInt(0, 20) * grid;
      apple.y = getRandomInt(0, 20) * grid;
    }

    function startGame() {
      score = 0;
      document.getElementById('score').textContent = score;
      snake.x = 190;
      snake.y = 190;
      snake.cells = [];
      snake.maxCells = 4;
      snake.dx = grid;
      snake.dy = 0;
      resetApple();
    }

    function loop() {
      requestAnimationFrame(loop);
      if (++count < 6) return;
      count = 0;

      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      snake.x += snake.dx;
      snake.y += snake.dy;

      if (snake.x < 0) snake.x = canvas.width - grid;
      else if (snake.x >= canvas.width) snake.x = 0;
      if (snake.y < 0) snake.y = canvas.height - grid;
      else if (snake.y >= canvas.height) snake.y = 0;

      snake.cells.unshift({x: snake.x, y: snake.y});
      if (snake.cells.length > snake.maxCells) snake.cells.pop();

      // Draw Apple
      ctx.fillStyle = '#ff007f';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff007f';
      ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);

      // Draw Snake
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffcc';
      snake.cells.forEach(function(cell, index) {
        ctx.fillStyle = index === 0 ? '#ffffff' : '#00ffcc';
        ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        if (cell.x === apple.x && cell.y === apple.y) {
          snake.maxCells++;
          score += 10;
          document.getElementById('score').textContent = score;
          if (score > best) {
            best = score;
            localStorage.setItem('neon_snake_best', best);
            document.getElementById('best').textContent = best;
          }
          resetApple();
        }

        for (let i = index + 1; i < snake.cells.length; i++) {
          if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
            startGame();
          }
        }
      });
      ctx.shadowBlur = 0;
    }

    document.addEventListener('keydown', function(e) {
      if (e.which === 37 && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
      else if (e.which === 38 && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
      else if (e.which === 39 && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
      else if (e.which === 40 && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
    });

    startGame();
    requestAnimationFrame(loop);
  </script>
</body>
</html>`
  },
  {
    id: 'starter-audio-synth',
    title: 'Web Audio Ambient Synth Matrix',
    description: 'Hardware-style polyphonic generative ambient synthesizer using Web Audio API and interactive harmonic sliders.',
    category: 'tool',
    tags: ['webaudio', 'ambient', 'sound-design', 'dsp'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ambient Drone Synth</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .rack {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h2 { margin: 0 0 16px 0; color: #58a6ff; font-size: 18px; }
    .slider-row { margin-bottom: 16px; }
    label { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #8b949e; }
    input[type=range] { width: 100%; accent-color: #58a6ff; }
    button {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      background: #238636;
      color: white;
      border: none;
      font-weight: bold;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    button:hover { background: #2ea043; }
    button.active { background: #da3633; }
  </style>
</head>
<body>
  <div class="rack">
    <h2>// HARMONIC DRONE ENGINE //</h2>
    <div class="slider-row">
      <label><span>Root Frequency</span><span id="freq-val">110 Hz (A2)</span></label>
      <input type="range" id="freq" min="55" max="440" value="110">
    </div>
    <div class="slider-row">
      <label><span>Filter Resonance (Q)</span><span id="q-val">6</span></label>
      <input type="range" id="q" min="1" max="20" value="6">
    </div>
    <div class="slider-row">
      <label><span>Shimmer Spread</span><span id="spread-val">12 cents</span></label>
      <input type="range" id="spread" min="1" max="50" value="12">
    </div>
    <button id="toggle-btn" onclick="toggleAudio()">START SYNTHESIS</button>
  </div>
  <script>
    let ctx = null;
    let osc1, osc2, filter, gain;
    let isPlaying = false;

    function toggleAudio() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (!isPlaying) {
        osc1 = ctx.createOscillator();
        osc2 = ctx.createOscillator();
        filter = ctx.createBiquadFilter();
        gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        filter.type = 'lowpass';
        
        const root = parseFloat(document.getElementById('freq').value);
        const spread = parseFloat(document.getElementById('spread').value);
        osc1.frequency.setValueAtTime(root, ctx.currentTime);
        osc2.frequency.setValueAtTime(root * 1.5 + (spread * 0.1), ctx.currentTime);

        filter.frequency.setValueAtTime(root * 3, ctx.currentTime);
        filter.Q.setValueAtTime(parseFloat(document.getElementById('q').value), ctx.currentTime);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 1.5);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        isPlaying = true;
        document.getElementById('toggle-btn').textContent = 'STOP SYNTHESIS';
        document.getElementById('toggle-btn').classList.add('active');
      } else {
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        setTimeout(() => {
          osc1.stop();
          osc2.stop();
          isPlaying = false;
          document.getElementById('toggle-btn').textContent = 'START SYNTHESIS';
          document.getElementById('toggle-btn').classList.remove('active');
        }, 400);
      }
    }

    document.getElementById('freq').addEventListener('input', (e) => {
      document.getElementById('freq-val').textContent = e.target.value + ' Hz';
      if (osc1) osc1.frequency.setTargetAtTime(parseFloat(e.target.value), ctx.currentTime, 0.05);
    });
  </script>
</body>
</html>`
  }
];

// Load local apps from localStorage
export function loadLocalApps(): GalleryApp[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_APPS));
      return DEFAULT_GALLERY_APPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GALLERY_APPS;
  } catch (e) {
    return DEFAULT_GALLERY_APPS;
  }
}

// Save or update an app in local storage
export function saveLocalApp(app: GalleryApp): GalleryApp[] {
  const current = loadLocalApps();
  const existingIdx = current.findIndex(a => a.id === app.id);
  let updated: GalleryApp[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...app, updatedAt: new Date().toISOString() };
  } else {
    updated = [app, ...current];
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Delete an app from local storage
export function deleteLocalApp(appId: string): GalleryApp[] {
  const current = loadLocalApps();
  const updated = current.filter(a => a.id !== appId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Save app to Firestore
export async function saveAppToFirestore(app: GalleryApp, user: User): Promise<void> {
  const appDocRef = doc(db, 'apps', app.id);
  const data = {
    userId: user.uid,
    title: app.title.slice(0, 180),
    description: app.description.slice(0, 950),
    category: app.category || 'prototype',
    tags: app.tags || [],
    htmlContent: app.htmlContent,
    createdAt: app.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(appDocRef, data);
}

// Load user's apps from Firestore
export async function loadFirestoreApps(userId: string): Promise<GalleryApp[]> {
  try {
    const q = query(collection(db, 'apps'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const result: GalleryApp[] = [];
    snap.forEach(d => {
      const data = d.data();
      result.push({
        id: d.id,
        userId: data.userId,
        title: data.title || 'Untitled App',
        description: data.description || '',
        category: data.category || 'prototype',
        tags: data.tags || [],
        htmlContent: data.htmlContent || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        isCloudSynced: true,
      });
    });
    return result;
  } catch (e) {
    console.error('Error loading Firestore apps:', e);
    return [];
  }
}

// Delete app from Firestore
export async function deleteAppFromFirestore(appId: string): Promise<void> {
  await deleteDoc(doc(db, 'apps', appId));
}

// Download app as single standalone .html file to user's phone or laptop storage
export function downloadAppAsHtml(title: string, htmlContent: string) {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'app';
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Inline multi-file project into a standalone single runnable HTML string
export function inlineProjectToHtml(
  files: Array<{ name: string; content: string; language?: string }>,
  title: string
): string {
  const htmlFile = files.find(f => f.name.endsWith('.html')) || files.find(f => f.language === 'html');
  const cssFiles = files.filter(f => f.name.endsWith('.css') || f.language === 'css');
  const jsFiles = files.filter(f => (f.name.endsWith('.js') || f.language === 'javascript') && !f.name.endsWith('.html'));

  if (!htmlFile) {
    // Generate basic HTML wrapper
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${cssFiles.map(c => c.content).join('\n\n')}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    ${jsFiles.map(j => j.content).join('\n\n')}
  </script>
</body>
</html>`;
  }

  let fullHtml = htmlFile.content;

  // Insert combined CSS into head
  if (cssFiles.length > 0) {
    const combinedCss = `<style>\n/* Inlined CSS */\n${cssFiles.map(c => c.content).join('\n\n')}\n</style>`;
    if (fullHtml.includes('</head>')) {
      fullHtml = fullHtml.replace('</head>', `${combinedCss}\n</head>`);
    } else {
      fullHtml = `${combinedCss}\n${fullHtml}`;
    }
  }

  // Insert combined JS before body end
  if (jsFiles.length > 0) {
    const combinedJs = `<script>\n/* Inlined JS */\n${jsFiles.map(j => j.content).join('\n\n')}\n</script>`;
    if (fullHtml.includes('</body>')) {
      fullHtml = fullHtml.replace('</body>', `${combinedJs}\n</body>`);
    } else {
      fullHtml = `${fullHtml}\n${combinedJs}`;
    }
  }

  return fullHtml;
}

// Export to Google Drive using Drive v3 API multipart upload
export async function exportToGoogleDrive(
  title: string,
  htmlContent: string,
  accessToken: string
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
  try {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: `${title}.html`,
      mimeType: 'text/html',
      description: 'Created with Brainstormer Pro X / Gemini Live IDE',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/html\r\n\r\n' +
      htmlContent +
      closeDelimiter;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: errText };
    }

    const data = await response.json();
    return { success: true, fileId: data.id, webViewLink: data.webViewLink };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
