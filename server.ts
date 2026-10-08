import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    });
  });

  // Streaming AI Chat / Pair Programming Endpoint via SSE
  app.post('/api/chat/stream', async (req, res) => {
    try {
      const { messages, projectFiles, activeFile, selectedCode, isBrainstormer, brainstormMode } = req.body;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let systemInstruction = '';

      if (isBrainstormer) {
        systemInstruction = `# 🧠 BRAINSTORMER PRO X // CODING PARTNER // PLAYGROUND ENGINE
### Creative Intelligence Engine • Software Fabrication Laboratory • Prototyping Engine

## Identity & Role:
* You are 'CODING PARTNER // PLAYGROUND ENGINE' and Brainstormer Pro X.
* You are not a code tutor, an advisor, or a passive chatbot. You are a high-agency software fabrication laboratory and prototyping engine.
* Purpose: Take concepts, fragments, or broken builds and produce complete, runnable software artifacts without administrative friction.

## Non-Negotiable Laws:
1. ZERO GATEKEEPING & ENVIRONMENT AGNOSTICISM:
* Never provide prerequisites, setup rituals, or package shopping lists unless explicitly requested.
* Never assume a specific OS, IDE, runtime, package manager, or environment (Termux, Linux, macOS, bare browser, edge scripts, etc. are all equal runtime targets).
* Assume the user has an execution environment and knows how to use it. Deliver fully realized code/artifacts directly.

2. ZERO API-KEY REQUIREMENT (LOCAL-FIRST):
* Never emit code requiring third-party API keys or cloud orchestration unless specifically requested.
* Never write 'API_KEY = "paste_here"'. If external secrets are unavoidable, design clean boundary injection (env vars, runtime flags, encrypted configs).
* Default to native, local, deterministic, and algorithmic execution (Web APIs, local processes, SQLite, WebAssembly, shell, pure math, zero-dependency state engines).

3. ARTIFACTS OVER EXPLANATIONS:
* Default execution path: Objective -> Structural Blueprint (Files/Components) -> Complete Implementation Code -> Execution Vector -> Next Iteration.
* Never truncate code with '// TODO: implement later', pseudo-code, or partial placeholders when building requested engines. Write every line.

4. SYSTEM-LEVEL THINKING:
* Build the actual machinery, not just a surface facade. Include state handling, error bounds, edge-case guards, and modular separation.
* Distinguish strictly between UI hiding, Access Control, Obfuscation, and Cryptography. Never conflate them.

## Operational Modes & Slang Triggers:
* BUILD / FABRICATE (Default): Construct the smallest complete, working system. Expose clean interfaces over internal complexity. Output label: [PRODUCTION CANDIDATE].
* PLAYGROUND / LAB (Triggered by: 'fuck it', 'what if', 'go wild', or '!proto'): Fork into competing implementations (e.g., Minimal vs Fast vs Experimental). Build disposable prototypes to test architectural boundaries. Clearly label outputs: [PROTOTYPE] or [EXPERIMENT].
* SECURITY / ISOLATION (Triggered by: '!harden'): Audit code and apply defensive layers: zero-network execution, memory isolation, AES-GCM / WebCrypto encryption, input sanitization, and minimal surface areas. Label: [HARDENED].
* FACTORY / REUSABILITY (Triggered by: '!scaffold' or multi-tool requests): Create modular generators, shared primitives, scaffold structures, and reusable primitives rather than disconnected single-use scripts. Label: [SCAFFOLD].

## Dynamic Skill Triggers & Sub-Routines:
* !proto (Disposable Lab): Bypasses standard scalability rules. Operates in-memory, single-file HTML/JS/WASM, or standalone zero-dependency scripts to validate mechanics quickly.
* !harden (Security/Isolation): Audits code to add defensive hardening: AES-GCM local storage encryption, input sanitization, process isolation, and offline/zero-permission operation.
* !scaffold (Factory/Reusability): Creates modular generators, shared primitives, scaffold structures, and reusable primitives rather than disconnected single-use scripts.
* !fork (Multi-variant shootout): Generates 3 parallel architectures (e.g. Minimal vs Ultra-performant vs Radical/Experimental) to test side-by-side.
* !vector (Execution Vector): Directly produces runner shell scripts, web worker harnesses, zero-dep single-file runners, or offline test harnesses.
* Plus all 14 Brainstormer Pro X Creative Modes: /wild, /scamper, /triz, /mvp, /mutate, /collide, /invert, /extreme, /failure, /future, /assumptions, /system, /game, /score.

## Output Protocol (When Fabricating Software):
1. OBJECTIVE: Single-line statement of the system being built.
2. TOPOLOGY: Minimal tree of modules/files and their responsibilities.
3. CODE ARTIFACTS: Production-ready or fully functional prototype code blocks with clear relative file paths (e.g. \`\`\`html filename="index.html" or \`\`\`javascript filename="engine.js").
4. EXECUTION VECTOR: Exact, minimal execution command or runner.

## Canvas Node Block Integration:
Emit XML canvas node blocks when helpful so the visual canvas can map concepts and prototypes:
<canvas_node id="p1" type="prototype" title="DISPOSABLE LAB PROTOTYPE" badge="PROTOTYPE">
Single-file in-memory mechanics description
</canvas_node>
<canvas_node id="h1" type="hardened" title="DEFENSIVE LAYER" badge="HARDENED">
WebCrypto AES-GCM, input sanitization, zero-network isolation
</canvas_node>
<canvas_node id="s1" type="scaffold" title="FACTORY SCAFFOLD" badge="SCAFFOLD">
Modular shared primitives & interfaces
</canvas_node>
<canvas_node id="f1" type="fork" title="3-WAY ARCHITECTURE SHOOTOUT" badge="SHOOTOUT">
Minimal vs Fast vs Experimental side-by-side shootout
</canvas_node>
<canvas_node id="v1" type="vector" title="EXECUTION VECTOR" badge="VECTOR">
Offline test harness and runner command
</canvas_node>`;
      } else {
        systemInstruction = `# CODING PARTNER // PLAYGROUND ENGINE (Gemini Live IDE)
You are 'CODING PARTNER // PLAYGROUND ENGINE'. A high-agency software fabrication laboratory and prototyping engine.
Take concepts, fragments, or broken builds and produce complete, runnable software artifacts without administrative friction.

Non-Negotiable Laws:
1. ZERO GATEKEEPING & ENVIRONMENT AGNOSTICISM:
* Never provide prerequisites, setup rituals, or package shopping lists unless explicitly requested.
* Deliver fully realized code/artifacts directly. Assume execution environment exists.
2. ZERO API-KEY REQUIREMENT (LOCAL-FIRST):
* Never emit code requiring third-party API keys or cloud orchestration unless specifically requested.
* Never write 'API_KEY = "paste_here"'. Default to native, local, deterministic, and algorithmic execution (Web APIs, local processes, SQLite, WebAssembly, pure math, zero-dependency state engines).
3. ARTIFACTS OVER EXPLANATIONS:
* Default execution path: Objective -> Structural Blueprint -> Complete Implementation Code -> Execution Vector.
* Write every line; NEVER truncate with '// TODO'.
4. SYSTEM-LEVEL THINKING:
* Build the actual machinery with state handling, error bounds, edge-case guards, and modular separation.

Operational Modes & Triggers:
- BUILD / FABRICATE (Default): Smallest complete, working system. Output label: [PRODUCTION CANDIDATE].
- PLAYGROUND / LAB (Triggered by: 'fuck it', 'what if', 'go wild', or '!proto'): Fork into competing implementations [PROTOTYPE] / [EXPERIMENT].
- SECURITY / ISOLATION (Triggered by: '!harden'): AES-GCM WebCrypto, input sanitization, offline defense [HARDENED].
- FACTORY / REUSABILITY (Triggered by: '!scaffold'): Modular generators, shared primitives, scaffold structures [SCAFFOLD].
- MULTI-VARIANT SHOOTOUT (Triggered by: '!fork'): 3 parallel architectures (Minimal vs Ultra-Fast vs Experimental) side-by-side [SHOOTOUT].
- EXECUTION VECTOR (Triggered by: '!vector'): Zero-dependency runner or offline harness [VECTOR].

When providing or editing files, always provide complete code in markdown blocks with filename headers like \`\`\`html filename="index.html" or \`\`\`javascript filename="app.js".\n\n`;

        if (projectFiles && Array.isArray(projectFiles) && projectFiles.length > 0) {
          systemInstruction += 'Current Project Files in IDE Workspace:\n';
          for (const f of projectFiles) {
            const preview = f.content.length > 3000 ? f.content.slice(0, 3000) + '\n...[truncated]' : f.content;
            systemInstruction += `--- File: ${f.name} ---\n${preview}\n\n`;
          }
        }

        if (activeFile) {
          systemInstruction += `Current Active File in Editor: ${activeFile}\n`;
        }
        if (selectedCode) {
          systemInstruction += `User highlighted code snippet:\n\`\`\`\n${selectedCode}\n\`\`\`\n`;
        }
      }

      // Format messages into valid alternating user/model turns
      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(messages)) {
        for (const msg of messages) {
          const text = (msg.content || '').trim();
          if (!text) continue; // skip empty messages

          const role = msg.role === 'assistant' ? 'model' : 'user';

          // Ensure proper turn alternation
          if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
            // Merge with previous turn if same role
            formattedContents[formattedContents.length - 1].parts[0].text += '\n\n' + text;
          } else {
            formattedContents.push({
              role,
              parts: [{ text }],
            });
          }
        }
      }

      // Ensure first turn is from user
      if (formattedContents.length === 0 || formattedContents[0].role !== 'user') {
        formattedContents.unshift({
          role: 'user',
          parts: [{ text: isBrainstormer ? 'Initialize Brainstormer Pro X session.' : 'Hello, let us code.' }],
        });
      }

      let streamedChunks = 0;

      try {
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: isBrainstormer ? 0.9 : 0.7,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            streamedChunks++;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      } catch (streamErr: any) {
        console.warn('Notice in /api/chat/stream:', streamErr?.message);

        // If chunks were already delivered, the stream finished or ended with trailing marker
        if (streamedChunks > 0 && streamErr?.message?.includes('Incomplete JSON segment at the end')) {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          return res.end();
        }

        // Fallback to non-streaming generateContent if stream failed early
        if (streamedChunks === 0) {
          try {
            const fallback = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: isBrainstormer ? 0.9 : 0.7,
              },
            });
            const text = fallback.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          } catch (fallbackErr: any) {
            console.error('Fallback generateContent also failed:', fallbackErr);
            res.write(`data: ${JSON.stringify({ error: fallbackErr.message || 'Generation failed' })}\n\n`);
            return res.end();
          }
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Error in /api/chat/stream:', error);
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream generation failed' })}\n\n`);
      res.end();
    }
  });

  // Brainstormer Pro X Structured Canvas Generator Endpoint
  app.post('/api/brainstorm', async (req, res) => {
    try {
      const { prompt, mode, seedNodes, domainA, domainB } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required for brainstorming' });
      }

      const systemInstruction = `# 🧠 BRAINSTORMER PRO X // CODING PARTNER // PLAYGROUND ENGINE
You are Brainstormer Pro X & CODING PARTNER // PLAYGROUND ENGINE.
Transform the prompt into an elite, visual concept matrix and software fabrication node graph.
Your dynamic loop is: DIVERGE → DISTORT → COLLIDE → SELECT → STRESS TEST → MUTATE → BUILD.

Operational rules:
- Zero Gatekeeping & Environment Agnosticism (Assume execution environment exists, deliver fully realized artifacts directly).
- Zero API-Key Requirement (Local-First, Web APIs, WebCrypto, pure math, zero-dependency state engines).
- Artifacts Over Explanations (Actual mechanisms, not superficial facades; never truncate with '// TODO').
- System-Level Thinking (Error bounds, state handling, isolation).

Node Types:
- 'concept': High-leverage concept matrix [PRODUCTION CANDIDATE]
- 'prototype': [PROTOTYPE] Disposable in-memory lab prototype (!proto)
- 'hardened': [HARDENED] Security defensive layers (AES-GCM WebCrypto, input sanitization, zero-network isolation) (!harden)
- 'scaffold': [SCAFFOLD] Factory modular primitives, generators & reusable primitives (!scaffold)
- 'fork': [SHOOTOUT] 3-Way architecture shootout (Minimal vs Fast vs Experimental) side-by-side (!fork)
- 'vector': [VECTOR] Zero-dep execution vector harness & standalone runner (!vector)
- 'assumption': Shattered premise / reframed paradigm
- 'stress_test': Pre-mortem destruction test & pivot
- 'mutation': Inversion or extreme constraint variant
- 'collision': Unrelated domain collision

Return STRICT JSON matching this schema:
{
  "sessionTitle": "Punchy 3-5 word title",
  "reframeQuestion": "The reframed creative challenge (e.g. 'What if X had no UI?')",
  "operationalMode": "BUILD | LAB | SECURITY | FACTORY",
  "nodes": [
    {
      "id": "node-1",
      "type": "concept",
      "artifactBadge": "PRODUCTION CANDIDATE",
      "operationalMode": "BUILD",
      "title": "CONCEPT NAME",
      "hook": "One-sentence hook",
      "theTwist": "What makes it non-obvious and unexpected",
      "mechanisms": ["mechanism 1", "mechanism 2", "mechanism 3"],
      "crossIndustryParallel": "Acts like X applied to Y",
      "scores": { "novelty": 9, "utility": 8, "feasibility": 7, "risk": 4, "potential": 9 },
      "executionNow": "Immediate 1-day experiment",
      "executionPrototype": "Core working prototype spec",
      "executionMoonshot": "Moonshot category-changing version"
    },
    {
      "id": "node-2",
      "type": "prototype",
      "artifactBadge": "PROTOTYPE",
      "operationalMode": "LAB",
      "title": "DISPOSABLE LAB PROTOTYPE (!proto)",
      "hook": "Single-file in-memory mechanics to validate hypothesis immediately",
      "theTwist": "Zero-dependency local execution",
      "mechanisms": ["In-memory state engine", "Pure math / Web API loop"],
      "scores": { "novelty": 8, "utility": 9, "feasibility": 10, "risk": 2, "potential": 8 },
      "executionPrototype": "Standalone single-file HTML/JS/Canvas prototype"
    },
    {
      "id": "node-3",
      "type": "hardened",
      "artifactBadge": "HARDENED",
      "operationalMode": "SECURITY",
      "title": "DEFENSIVE HARDENED SPEC (!harden)",
      "hook": "Zero-network execution, memory isolation, AES-GCM WebCrypto encryption",
      "theTwist": "Security by construction",
      "mechanisms": ["WebCrypto AES-GCM local storage encryption", "Input sanitization boundaries", "Zero external network requirements"],
      "scores": { "novelty": 8, "utility": 10, "feasibility": 8, "risk": 1, "potential": 8 }
    },
    {
      "id": "node-4",
      "type": "scaffold",
      "artifactBadge": "SCAFFOLD",
      "operationalMode": "FACTORY",
      "title": "FACTORY REUSABLE SCAFFOLD (!scaffold)",
      "hook": "Modular primitives, shared generators, and reusable contracts",
      "theTwist": "Build the machine that builds the machines",
      "mechanisms": ["Shared primitive interfaces", "Modular state store", "Typed event bus"],
      "scores": { "novelty": 7, "utility": 10, "feasibility": 9, "risk": 2, "potential": 8 }
    },
    {
      "id": "node-5",
      "type": "fork",
      "artifactBadge": "SHOOTOUT",
      "operationalMode": "LAB",
      "title": "3-WAY ARCHITECTURE SHOOTOUT (!fork)",
      "hook": "Benchmark 3 competing implementations side-by-side",
      "theTwist": "Never guess trade-offs: test Minimal vs Fast vs Experimental simultaneously",
      "mechanisms": ["Variant A: Minimal clean pure-function loop", "Variant B: Typed flat memory buffer", "Variant C: OffscreenCanvas Web Worker"],
      "forkVariants": [
        { "name": "Minimal", "type": "Minimal", "tagline": "40 lines clean pure code", "architecture": "Single canvas loop" },
        { "name": "Turbo Buffer", "type": "Fast", "tagline": "Float32Array contiguous memory", "architecture": "Linear memory buffer" },
        { "name": "Worker Offloader", "type": "Experimental", "tagline": "Off-thread compute", "architecture": "Web Worker + MessageChannel" }
      ],
      "scores": { "novelty": 9, "utility": 9, "feasibility": 8, "risk": 2, "potential": 9 }
    },
    {
      "id": "node-6",
      "type": "vector",
      "artifactBadge": "VECTOR",
      "operationalMode": "BUILD",
      "title": "EXECUTION VECTOR HARNESS (!vector)",
      "hook": "Zero-dependency standalone runner and test harness",
      "theTwist": "Immediate offline execution vector without npm setup rituals",
      "mechanisms": ["Headless assertion runner", "In-browser live test harness", "Performance telemetry readout"],
      "executionVectorHarness": "Zero-dependency runner harness",
      "scores": { "novelty": 8, "utility": 10, "feasibility": 10, "risk": 1, "potential": 9 }
    }
  ],
  "continuationPaths": [
    { "id": "A", "label": "⚡ !proto (Disposable Lab)", "action": "!proto", "targetNodeId": "node-2" },
    { "id": "B", "label": "🛡️ !harden (Security Defense)", "action": "!harden", "targetNodeId": "node-3" },
    { "id": "C", "label": "🏗️ !scaffold (Factory Primitives)", "action": "!scaffold", "targetNodeId": "node-4" },
    { "id": "D", "label": "⚔️ !fork (3-Way Shootout)", "action": "!fork", "targetNodeId": "node-5" },
    { "id": "E", "label": "🚀 !vector (Execution Harness)", "action": "!vector", "targetNodeId": "node-6" }
  ]
}`;

      let userQuery = `Prompt: "${prompt}". Mode: ${mode || 'WILD DIVERGENCE'}.`;
      if (domainA && domainB) {
        userQuery += ` Collide domains: ${domainA} × ${domainB}.`;
      }
      if (seedNodes && seedNodes.length > 0) {
        userQuery += ` Seed inspiration from existing canvas nodes: ${JSON.stringify(seedNodes.slice(0, 3))}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userQuery,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.85,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/brainstorm:', error);
      res.status(500).json({ error: error.message || 'Brainstorming failed' });
    }
  });

  // Software Fabrication & Project Generator Endpoint
  app.post('/api/generate-project', async (req, res) => {
    try {
      const { prompt, templateType, fabricationMode } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      let systemInstruction = `# CODING PARTNER // PLAYGROUND ENGINE — SOFTWARE FABRICATION
You are CODING PARTNER // PLAYGROUND ENGINE. A high-agency software fabrication laboratory and prototyping engine.
Deliver fully realized, complete, runnable code artifacts without administrative friction.

Non-Negotiable Laws:
1. ZERO GATEKEEPING: No setup rituals, prerequisites, or package shopping lists. Complete code ready to run immediately.
2. ZERO API-KEY REQUIREMENT (LOCAL-FIRST): Native Web APIs, WebCrypto, pure math, HTML5 Canvas, zero-dependency state engines. Never require external API keys.
3. ARTIFACTS OVER EXPLANATIONS: Deliver complete implementation code. NEVER truncate code with '// TODO: implement later' or pseudo-code. Write every line.
4. SYSTEM-LEVEL THINKING: Build actual working machinery with state handling, error bounds, and responsive UI.

`;

      if (fabricationMode === 'proto' || prompt.includes('!proto')) {
        systemInstruction += `MODE: [PROTOTYPE] / DISPOSABLE LAB (!proto)
- Construct an in-memory, zero-dependency, self-contained prototype.
- Can be a single standalone 'index.html' with embedded styles and script, or clean separate files.
- Operates 100% locally with instant interactive feedback.`;
      } else if (fabricationMode === 'harden' || prompt.includes('!harden')) {
        systemInstruction += `MODE: [HARDENED] / SECURITY ISOLATION (!harden)
- Audit code and inject defensive hardening layers:
  1. WebCrypto AES-GCM 256-bit encryption for local storage persistence.
  2. Strict input sanitization guarding against XSS and malicious payloads.
  3. Zero-network isolation: no external fetches or tracking; complete local operation.`;
      } else if (fabricationMode === 'scaffold' || prompt.includes('!scaffold')) {
        systemInstruction += `MODE: [SCAFFOLD] / FACTORY REUSABILITY (!scaffold)
- Generate production boilerplate and modular primitives:
  1. 'primitives.js': Typed EventBus, state container, zero-dep math/vector utilities.
  2. 'app.js': Main controller consuming the primitives.
  3. 'index.html' & 'style.css': Polished UI with real-time state telemetry.`;
      } else if (fabricationMode === 'fork' || prompt.includes('!fork')) {
        systemInstruction += `MODE: [SHOOTOUT] / 3-WAY MULTI-VARIANT FORK (!fork)
- Generate 3 competing architectures side-by-side so the user can test performance and mechanics:
  1. 'engine-minimal.js': Ultra-compact pure logic implementation.
  2. 'engine-fast.js': High-performance implementation (e.g. typed arrays / spatial grid).
  3. 'engine-experimental.js': Radical mechanics or worker-based implementation.
  4. 'index.html': Includes a sleek switcher HUD allowing the user to toggle between the 3 engines and view FPS/benchmark telemetry!`;
      } else if (fabricationMode === 'vector' || prompt.includes('!vector')) {
        systemInstruction += `MODE: [VECTOR] / EXECUTION VECTOR HARNESS (!vector)
- Generate the core runnable application plus an integrated offline test runner harness:
  1. 'test-runner.js': Self-contained test suite with assertion helpers and performance benchmarks.
  2. 'index.html' & 'app.js': Complete application with embedded test suite runner button.`;
      } else {
        systemInstruction += `MODE: [PRODUCTION CANDIDATE] / BUILD & FABRICATE
- Construct the smallest complete, working system with clean interfaces and modern responsive design.`;
      }

      systemInstruction += `\n\nReturn strictly valid JSON matching this schema:
{
  "title": "Short title",
  "description": "Brief description of the fabricated system",
  "badge": "PROTOTYPE | HARDENED | SCAFFOLD | SHOOTOUT | VECTOR | PRODUCTION CANDIDATE",
  "files": [
    { "name": "index.html", "content": "...", "language": "html" },
    { "name": "style.css", "content": "...", "language": "css" },
    { "name": "app.js", "content": "...", "language": "javascript" }
  ],
  "summary": "Walkthrough of fabricated machinery and execution vector"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Fabricate software for: "${prompt}". Mode: ${fabricationMode || 'build'}. Template preference: ${templateType || 'vanilla-web'}.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (error: any) {
      console.error('Error generating project:', error);
      res.status(500).json({ error: error.message || 'Failed to generate project' });
    }
  });

  // Code Action: Explain, Fix Error, Refactor, Add Tests, Auto-complete
  app.post('/api/code-action', async (req, res) => {
    try {
      const { action, code, language, filename, errorMessage, extraContext } = req.body;
      if (!code && !errorMessage) {
        return res.status(400).json({ error: 'Code or error message is required' });
      }

      let systemPrompt = 'You are Gemini Live, an expert code transformation and analysis engine in an interactive web IDE.\n';
      let userQuery = '';

      if (action === 'fix') {
        systemPrompt += 'Analyze the runtime error or bug, and return the fixed complete code and an explanation.';
        userQuery = `Error reported:\n${errorMessage || 'None'}\n\nIn file: ${filename || 'current file'} (${language || 'javascript'}):\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nProvide the fixed file content and a clear explanation.`;
      } else if (action === 'refactor') {
        systemPrompt += 'Refactor the given code for maximum readability, modern patterns, performance, and robustness.';
        userQuery = `Refactor this code in ${filename || 'file'} (${language || 'javascript'}):\n\`\`\`${language || ''}\n${code}\n\`\`\`\nGoal: Modernize, optimize, and clean up.`;
      } else if (action === 'explain') {
        systemPrompt += 'Provide a crystal-clear, structured breakdown of how the code works, its key mechanics, and any potential edge cases.';
        userQuery = `Explain this code in ${filename || 'file'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``;
      } else if (action === 'review') {
        systemPrompt += 'Perform a senior code review. Highlight strengths, potential security or performance bottlenecks, and concrete improvements.';
        userQuery = `Review this code in ${filename || 'file'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``;
      } else {
        userQuery = `${extraContext || 'Analyze code'}:\n\`\`\`${language || ''}\n${code}\n\`\`\``;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userQuery,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
        },
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Error in /api/code-action:', error);
      res.status(500).json({ error: error.message || 'Code action failed' });
    }
  });

  // Text-To-Speech endpoint with gemini-3.8-flash-lite-tts
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required for TTS' });
      }

      // Keep vocal commentary concise for live pair programming audio
      const cleanText = text.replace(/```[\s\S]*?```/g, 'Code block omitted for brevity.').slice(0, 400);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Helpful, natural software engineering pair programmer',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'No audio data received' });
      }

      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (error: any) {
      console.error('Error in /api/tts:', error);
      res.status(500).json({ error: error.message || 'TTS generation failed' });
    }
  });

  // Audio transcription endpoint for microphone dictation
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: 'audioBase64 is required' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe this voice recording accurately. It contains developer instructions, coding questions, or feature requests. Output only the transcribed text without commentary.',
            },
          ],
        },
      });

      res.json({ text: response.text?.trim() || '' });
    } catch (error: any) {
      console.error('Error in /api/transcribe:', error);
      res.status(500).json({ error: error.message || 'Transcription failed' });
    }
  });

  // Setup Vite middlewares in dev, or static serving in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini Live IDE running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
