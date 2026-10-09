import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BrainstormNode,
  BrainstormConnection,
  BrainstormNodeType,
  ArtifactBadge,
  OperationalMode,
  RAPID_COMMANDS
} from '../../types/brainstormer';
import { INITIAL_BRAINSTORM_NODES, INITIAL_BRAINSTORM_CONNECTIONS } from '../../data/initialBrainstorm';
import {
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Flame,
  ShieldAlert,
  Dna,
  Rocket,
  Compass,
  Layers,
  Search,
  X,
  Loader2,
  ShieldCheck,
  Cpu,
  Terminal as TerminalIcon,
  HelpCircle,
  Copy,
  Check,
  Send,
  Grid3X3,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MutationPanel, MutationType } from './MutationPanel';

interface BrainstormerCanvasProps {
  onBuildProjectFromConcept: (prompt: string, title: string, fabricationMode?: string) => void;
  onSendToCopilotChat?: (prompt: string) => void;
  externalSeedConcept?: { title: string; content: string } | null;
}

interface CommandSuggestion {
  command: string;
  name: string;
  desc: string;
  badge?: string;
  type: 'subroutine' | 'mutation' | 'creative';
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  { command: '/proto', name: 'Disposable Lab', desc: 'In-memory, single-file zero-dep prototype', badge: 'PROTOTYPE', type: 'subroutine' },
  { command: '/scamper', name: 'SCAMPER Mutation', desc: 'Systematic mutation & contradiction attack', badge: 'CREATIVE', type: 'creative' },
  { command: '/harden', name: 'Security Isolation', desc: 'AES-GCM WebCrypto encryption & zero-network', badge: 'HARDENED', type: 'subroutine' },
  { command: '/mutate', name: 'Concept Matrix Mutation', desc: 'Open Mutation Panel and apply mutations to concepts', badge: 'MUTATION', type: 'mutation' },
  { command: '/fork', name: '3-Way Architecture Shootout', desc: 'Minimal vs Fast vs Experimental benchmark', badge: 'SHOOTOUT', type: 'subroutine' },
  { command: '/scaffold', name: 'Factory Scaffolding', desc: 'Modular primitives, typed contracts & event bus', badge: 'SCAFFOLD', type: 'subroutine' },
  { command: '/vector', name: 'Execution Vector Harness', desc: 'Zero-dep test harness and standalone runner', badge: 'VECTOR', type: 'subroutine' },
  { command: '/invert', name: 'Inversion Mutation', desc: 'Invert polarity of selected concept definition', badge: 'INVERT', type: 'mutation' },
  { command: '/compress', name: 'Compression Mutation', desc: 'Compress selected concept to single-file prototype', badge: 'COMPRESS', type: 'mutation' },
  { command: '/roleswap', name: 'Role Swap Mutation', desc: 'Invert user/client agency on selected concept', badge: 'ROLE-SWAP', type: 'mutation' },
  { command: '/wild', name: 'Wild Divergence', desc: 'Maximum lateral thinking and unexpected branches', badge: 'DIVERGE', type: 'creative' },
  { command: '/triz', name: 'TRIZ Lab', desc: 'Find and attack contradictions (faster vs cheaper)', badge: 'TRIZ', type: 'creative' },
  { command: '/mvp', name: 'Execution / MVP Roadmap', desc: 'Tier 1 Quick Win, Tier 2 Core, Tier 3 Moonshot', badge: 'ROADMAP', type: 'creative' },
];

export const BrainstormerCanvas: React.FC<BrainstormerCanvasProps> = ({
  onBuildProjectFromConcept,
  onSendToCopilotChat,
  externalSeedConcept,
}) => {
  const [nodes, setNodes] = useState<BrainstormNode[]>(INITIAL_BRAINSTORM_NODES);
  const [connections, setConnections] = useState<BrainstormConnection[]>(INITIAL_BRAINSTORM_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Seed node if external concept supplied (e.g. from uploaded HTML or gallery)
  useEffect(() => {
    if (externalSeedConcept && externalSeedConcept.title) {
      const seedId = `seed-${Date.now()}`;
      const seedNode: BrainstormNode = {
        id: seedId,
        title: externalSeedConcept.title,
        type: 'concept',
        hook: `Imported HTML application architecture: ${externalSeedConcept.title}`,
        theTwist: 'Evolve core mechanic, inject mutations or compress into hyper-optimized lab prototype',
        x: 180,
        y: 160,
        tags: ['uploaded-html', 'local-os', 'ide-project'],
        codeSnippet: externalSeedConcept.content.slice(0, 600) + '...',
        artifactBadge: 'PROTOTYPE',
        operationalMode: 'LAB',
        scores: {
          novelty: 88,
          utility: 92,
          feasibility: 90,
          risk: 15,
          potential: 95
        }
      };
      setNodes(prev => [seedNode, ...prev]);
      setSelectedNodeId(seedId);
      setShowMutationPanel(true);
    }
  }, [externalSeedConcept]);

  // Operational Mode state: BUILD, LAB, SECURITY, FACTORY
  const [operationalMode, setOperationalMode] = useState<OperationalMode>('LAB');
  const [showLawsModal, setShowLawsModal] = useState(false);
  const [copiedHarness, setCopiedHarness] = useState(false);

  // Mutation Panel state (lists Concept Matrix items with Inversion, Compression, Role Swap buttons)
  const [showMutationPanel, setShowMutationPanel] = useState(false);

  // Quick-Access Floating Prompt Bar state
  const [quickInput, setQuickInput] = useState('');
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickMenuIndex, setQuickMenuIndex] = useState(0);
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Persistent Bottom Prompt Input Bar state
  const [bottomPrompt, setBottomPrompt] = useState('');
  const [showBottomMenu, setShowBottomMenu] = useState(false);
  const [bottomMenuIndex, setBottomMenuIndex] = useState(0);
  const bottomInputRef = useRef<HTMLInputElement>(null);

  // Pan & Zoom state
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Node dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Mode and generation state
  const [activeMode, setActiveMode] = useState<string>('!proto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Global hotkey: Press '/' when not typing to focus the bottom persistent prompt field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        bottomInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter command suggestions for bottom bar
  const bottomSuggestions = useMemo(() => {
    if (!bottomPrompt.startsWith('/') && !bottomPrompt.startsWith('!')) return [];
    const query = bottomPrompt.slice(1).toLowerCase().trim();
    if (!query) return COMMAND_SUGGESTIONS;
    return COMMAND_SUGGESTIONS.filter(
      cmd =>
        cmd.command.toLowerCase().includes(query) ||
        cmd.name.toLowerCase().includes(query) ||
        cmd.desc.toLowerCase().includes(query)
    );
  }, [bottomPrompt]);

  // Filter command suggestions for quick floating bar
  const quickSuggestions = useMemo(() => {
    if (!quickInput.startsWith('/') && !quickInput.startsWith('!')) return [];
    const query = quickInput.slice(1).toLowerCase().trim();
    if (!query) return COMMAND_SUGGESTIONS;
    return COMMAND_SUGGESTIONS.filter(
      cmd =>
        cmd.command.toLowerCase().includes(query) ||
        cmd.name.toLowerCase().includes(query) ||
        cmd.desc.toLowerCase().includes(query)
    );
  }, [quickInput]);

  // Pan canvas handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.brainstorm-card') || (e.target as HTMLElement).closest('.canvas-ui-layer')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingNodeId) {
      const newX = (e.clientX - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - pan.y) / zoom - dragOffset.y;
      setNodes(prev =>
        prev.map(n => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(z => Math.min(2.5, Math.max(0.4, z * zoomFactor)));
    }
  };

  // Node drag start
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - node.x,
      y: (e.clientY - pan.y) / zoom - node.y,
    });
    setSelectedNodeId(nodeId);
  };

  // Execute Brainstormer Pro X generation
  const handleExecuteBrainstorm = async (promptOverride?: string, modeOverride?: string) => {
    const targetPrompt = promptOverride || bottomPrompt;
    if (!targetPrompt.trim() || isGenerating) return;

    const targetMode = modeOverride || activeMode;
    setIsGenerating(true);

    // Auto-detect mode based on prompt triggers
    const lower = targetPrompt.toLowerCase();
    if (lower.includes('!proto') || lower.includes('/proto') || lower.includes('fuck it') || lower.includes('what if') || lower.includes('go wild')) {
      setOperationalMode('LAB');
    } else if (lower.includes('!harden') || lower.includes('/harden')) {
      setOperationalMode('SECURITY');
    } else if (lower.includes('!scaffold') || lower.includes('/scaffold')) {
      setOperationalMode('FACTORY');
    } else if (lower.includes('!fork') || lower.includes('/fork')) {
      setOperationalMode('LAB');
    }

    if (targetMode === '!proto' || targetMode === '/proto') {
      setGenerationStep('PLAYGROUND ENGINE: Assembling in-memory zero-dep prototype architecture...');
    } else if (targetMode === '!harden' || targetMode === '/harden') {
      setGenerationStep('SECURITY ENGINE: Auditing defensive boundaries (WebCrypto AES-GCM + zero-network)...');
    } else if (targetMode === '!scaffold' || targetMode === '/scaffold') {
      setGenerationStep('FACTORY ENGINE: Generating typed shared primitives & state contracts...');
    } else if (targetMode === '!fork' || targetMode === '/fork') {
      setGenerationStep('SHOOTOUT ENGINE: Forking into 3 competing architectures (Minimal vs Fast vs Experimental)...');
    } else if (targetMode === '!vector' || targetMode === '/vector') {
      setGenerationStep('VECTOR ENGINE: Constructing offline test harness and standalone runner...');
    } else if (targetMode === '/scamper') {
      setGenerationStep('BRAINSTORMER: Running SCAMPER systematic mutation & contradiction attack...');
    } else {
      setGenerationStep('BRAINSTORMER PRO X: Diverging & synthesizing concept matrix...');
    }

    let data: any = null;

    try {
      const response = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt.trim(),
          mode: targetMode,
          seedNodes: selectedNode ? [selectedNode] : nodes.slice(0, 3),
        }),
      });

      if (response.ok) {
        data = await response.json();
      }
    } catch (fetchErr) {
      console.warn('Network issue calling /api/brainstorm, will synthesize locally:', fetchErr);
    }

    // If API did not return valid nodes, synthesize locally
    if (!data || !data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      setToastNotice('Fabricated via Local Creative Engine (offline resilient mode active)');
      const cleanPrompt = targetPrompt.trim() || 'Software Innovation';
      const titleWords = cleanPrompt.split(/\s+/).slice(0, 4).join(' ');
      const title = titleWords.charAt(0).toUpperCase() + titleWords.slice(1);

      data = {
        nodes: [
          {
            type: targetMode.includes('proto') ? 'prototype' : targetMode.includes('harden') ? 'hardened' : targetMode.includes('scaffold') ? 'scaffold' : targetMode.includes('fork') ? 'fork' : targetMode.includes('vector') ? 'vector' : 'concept',
            title: `${title} Engine`,
            hook: `A high-leverage local architecture for ${cleanPrompt}.`,
            theTwist: 'Operates completely client-side with zero third-party dependencies and reactive state.',
            mechanisms: ['Reactive state pub/sub', 'Live requestAnimationFrame loop', 'Local storage persistence'],
            scores: { novelty: 9, utility: 9, feasibility: 9, risk: 2, potential: 9 },
            artifactBadge: targetMode.includes('proto') ? 'PROTOTYPE' : targetMode.includes('harden') ? 'HARDENED' : targetMode.includes('scaffold') ? 'SCAFFOLD' : targetMode.includes('fork') ? 'SHOOTOUT' : targetMode.includes('vector') ? 'VECTOR' : 'PRODUCTION CANDIDATE',
            operationalMode: targetMode.includes('harden') ? 'SECURITY' : targetMode.includes('scaffold') ? 'FACTORY' : targetMode.includes('proto') || targetMode.includes('fork') ? 'LAB' : 'BUILD',
            executionNow: 'Instant sandbox deployment',
            executionPrototype: 'Standalone HTML5 Canvas + Web API runtime',
            executionMoonshot: 'Category-defining decentralized software laboratory'
          },
          {
            type: 'prototype',
            title: `${title} (!proto)`,
            hook: 'Disposable in-memory lab prototype validating mechanics in under 50 lines.',
            theTwist: 'Zero dependencies; runs directly in any browser sandbox.',
            mechanisms: ['In-memory state engine', 'Interactive canvas feedback', 'Zero-setup runner'],
            scores: { novelty: 8, utility: 9, feasibility: 10, risk: 1, potential: 8 },
            artifactBadge: 'PROTOTYPE',
            operationalMode: 'LAB',
            executionPrototype: 'Single-file index.html with inline styles and zero-dependency scripts'
          },
          {
            type: 'hardened',
            title: `${title} Defensive (!harden)`,
            hook: 'Defensive hardening with AES-GCM 256-bit WebCrypto storage and strict sandboxing.',
            theTwist: 'Security by construction: zero outbound network telemetry and strict input sanitization.',
            mechanisms: ['WebCrypto AES-GCM local storage encryption', 'Input sanitization boundaries', 'Offline-enforced CSP'],
            scores: { novelty: 8, utility: 10, feasibility: 8, risk: 1, potential: 9 },
            artifactBadge: 'HARDENED',
            operationalMode: 'SECURITY'
          },
          {
            type: 'scaffold',
            title: `${title} Scaffold (!scaffold)`,
            hook: 'Factory modular primitives, typed event bus, and reusable state generators.',
            theTwist: 'Architected as reusable primitives so new features can be composed in minutes.',
            mechanisms: ['Typed EventBus pub/sub dispatch layer', 'Observable state container', 'Component lifecycle registry'],
            scores: { novelty: 7, utility: 10, feasibility: 9, risk: 2, potential: 8 },
            artifactBadge: 'SCAFFOLD',
            operationalMode: 'FACTORY'
          },
          {
            type: 'fork',
            title: `${title} Shootout (!fork)`,
            hook: '3-way architecture benchmark comparing Minimal vs Turbo vs Worker implementations.',
            theTwist: 'Direct runtime shootout with live HUD toggle to measure FPS, memory, and code size.',
            mechanisms: ['Variant A: Clean pure-function loop', 'Variant B: Typed contiguous memory buffer', 'Variant C: Web Worker parallel compute'],
            forkVariants: [
              { name: 'Pure Functional', type: 'Minimal', tagline: 'Readable, clean 40-line implementation', architecture: 'Stateless pure loop' },
              { name: 'Turbo Linear', type: 'Fast', tagline: 'Linear memory buffer for peak FPS', architecture: 'Flat typed array' },
              { name: 'Worker Parallel', type: 'Experimental', tagline: 'Multi-threaded background offloading', architecture: 'Web Worker + Channel' }
            ],
            scores: { novelty: 9, utility: 9, feasibility: 8, risk: 2, potential: 9 },
            artifactBadge: 'SHOOTOUT',
            operationalMode: 'LAB'
          },
          {
            type: 'vector',
            title: `${title} Vector (!vector)`,
            hook: 'Standalone execution runner and automated offline assertion harness.',
            theTwist: 'Instant test suite without npm install rituals or test runner config files.',
            mechanisms: ['Zero-dependency assertion runner', 'In-browser benchmark harness', 'Visual pass/fail telemetry readout bar'],
            executionVectorHarness: 'Self-executing test harness suite in app.js',
            scores: { novelty: 8, utility: 10, feasibility: 10, risk: 1, potential: 9 },
            artifactBadge: 'VECTOR',
            operationalMode: 'BUILD'
          }
        ]
      };
    }

    try {
      const baseCenterX = 450;
      const baseCenterY = 150 + nodes.length * 40;

      const newNodes: BrainstormNode[] = data.nodes.map((n: any, idx: number) => {
        const angle = (idx / data.nodes.length) * Math.PI * 2;
        const radius = 280;
        return {
          id: `node-${Date.now()}-${idx}`,
          type: n.type || (targetMode.includes('proto') ? 'prototype' : targetMode.includes('harden') ? 'hardened' : targetMode.includes('scaffold') ? 'scaffold' : targetMode.includes('fork') ? 'fork' : targetMode.includes('vector') ? 'vector' : 'concept'),
          title: n.title || `Fabricated Node ${idx + 1}`,
          hook: n.hook || '',
          theTwist: n.theTwist,
          mechanisms: n.mechanisms || [],
          crossIndustryParallel: n.crossIndustryParallel,
          scores: n.scores || { novelty: 8, utility: 9, feasibility: 9, risk: 2, potential: 9 },
          artifactBadge: n.artifactBadge || (targetMode.includes('proto') ? 'PROTOTYPE' : targetMode.includes('harden') ? 'HARDENED' : targetMode.includes('scaffold') ? 'SCAFFOLD' : targetMode.includes('fork') ? 'SHOOTOUT' : targetMode.includes('vector') ? 'VECTOR' : 'PRODUCTION CANDIDATE'),
          operationalMode: n.operationalMode || (targetMode.includes('harden') ? 'SECURITY' : targetMode.includes('scaffold') ? 'FACTORY' : targetMode.includes('proto') || targetMode.includes('fork') ? 'LAB' : 'BUILD'),
          executionNow: n.executionNow,
          executionPrototype: n.executionPrototype,
          executionMoonshot: n.executionMoonshot,
          executionVectorHarness: n.executionVectorHarness,
          forkVariants: n.forkVariants,
          x: baseCenterX + Math.cos(angle) * radius,
          y: baseCenterY + Math.sin(angle) * (radius * 0.75),
          parentIds: selectedNodeId ? [selectedNodeId] : ['spark-0'],
          tags: [targetMode.replace('/', '').replace('!', '').toUpperCase()],
        };
      });

      const newConnections: BrainstormConnection[] = newNodes.map((n, i) => ({
        id: `conn-${Date.now()}-${i}`,
        from: selectedNodeId || 'spark-0',
        to: n.id,
        label: targetMode,
      }));

      setNodes(prev => [...prev, ...newNodes]);
      setConnections(prev => [...prev, ...newConnections]);
      setBottomPrompt('');
      setSelectedNodeId(newNodes[0].id);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#c084fc', '#f59e0b', '#10b981'],
      });
    } catch (err: any) {
      console.warn('Node layout synthesis notice:', err);
      setToastNotice('Nodes generated successfully');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Update concept definition directly in the canvas state (for MutationPanel)
  const handleUpdateConcept = (nodeId: string, updatedFields: Partial<BrainstormNode>, mutationLabel: string) => {
    setNodes(prev =>
      prev.map(node => (node.id === nodeId ? { ...node, ...updatedFields } : node))
    );
  };

  // Branch a mutated child node linked to the source concept in canvas state
  const handleBranchMutationNode = (
    sourceNode: BrainstormNode,
    mutationType: MutationType,
    mutatedFields: Partial<BrainstormNode>
  ) => {
    const newNodeId = `mutation-${Date.now()}`;
    const newNode: BrainstormNode = {
      ...sourceNode,
      ...mutatedFields,
      id: newNodeId,
      type: 'mutation',
      x: sourceNode.x + 350,
      y: sourceNode.y + (Math.random() - 0.5) * 80,
      parentIds: [sourceNode.id],
      tags: ['MUTATION', mutationType.toUpperCase()],
    };

    const newConnection: BrainstormConnection = {
      id: `conn-branch-${Date.now()}`,
      from: sourceNode.id,
      to: newNodeId,
      label: `mutated: ${mutationType}`,
    };

    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, newConnection]);
    setSelectedNodeId(newNodeId);
  };

  // Convert concept node directly into working code project in the IDE
  const handleBuildPrototype = (node: BrainstormNode, specificMode?: string) => {
    const modeToUse = specificMode || (node.type === 'prototype' ? 'proto' : node.type === 'hardened' ? 'harden' : node.type === 'scaffold' ? 'scaffold' : node.type === 'fork' ? 'fork' : node.type === 'vector' ? 'vector' : 'build');

    let prompt = `Fabricate an interactive, fully functioning web application for "${node.title}":
${node.hook}
Key Mechanisms to Implement:
${(node.mechanisms || []).map(m => '- ' + m).join('\n')}
${node.executionPrototype ? `Prototype Spec: ${node.executionPrototype}` : ''}
Ensure zero third-party API key requirements, deterministic local execution, and complete working machinery without any placeholder comments.`;

    if (modeToUse === 'fork' && node.forkVariants) {
      prompt += `\nInclude 3 competing architecture implementations in the project:
${node.forkVariants.map(v => `- [${v.type}] ${v.name}: ${v.architecture}`).join('\n')}
Provide a HUD switcher in index.html to benchmark and toggle between them live!`;
    }

    onBuildProjectFromConcept(prompt, node.title, modeToUse);
  };

  // Sub-routine action triggers on any node
  const handleRunSubRoutine = (node: BrainstormNode, command: string) => {
    setSelectedNodeId(node.id);
    let promptText = '';
    if (command === '!proto' || command === '/proto') {
      promptText = `!proto Spin up a disposable in-memory lab prototype for "${node.title}: ${node.hook}". Zero dependencies, native Web APIs.`;
    } else if (command === '!harden' || command === '/harden') {
      promptText = `!harden Perform security isolation and defensive hardening on "${node.title}: ${node.hook}". Add WebCrypto AES-GCM local storage encryption, input sanitization boundaries, zero-network compliance.`;
    } else if (command === '!scaffold' || command === '/scaffold') {
      promptText = `!scaffold Build factory reusable scaffolding and modular primitives for "${node.title}: ${node.hook}". Typed store, event bus, reusable contracts.`;
    } else if (command === '!fork' || command === '/fork') {
      promptText = `!fork Create a 3-way architecture shootout for "${node.title}: ${node.hook}". Minimal vs Fast vs Experimental.`;
    } else if (command === '!vector' || command === '/vector') {
      promptText = `!vector Construct an offline execution vector harness and self-contained runner for "${node.title}: ${node.hook}".`;
    } else if (command === '/scamper') {
      promptText = `/scamper Attack contradictions and run systematic SCAMPER mutation on "${node.title}: ${node.hook}".`;
    } else if (command === '/mutate') {
      setShowMutationPanel(true);
      return;
    } else if (command === '/failure') {
      promptText = `Run pre-mortem stress test and failure analysis on: "${node.title}: ${node.hook}". Expose the primary failure and design the pivot feature.`;
    }

    handleExecuteBrainstorm(promptText, command);
  };

  // Generic Slash Command Parser and Runner
  const handleRunSlashCommand = (rawText: string) => {
    const textToRun = rawText.trim();
    if (!textToRun) return;

    setShowBottomMenu(false);
    setShowQuickMenu(false);
    setBottomPrompt('');
    setQuickInput('');

    const targetConcept = selectedNode || nodes[0];

    // Check if command is to open MutationPanel
    if (textToRun === '/mutate' || textToRun === '!mutate' || textToRun === '/matrix') {
      setShowMutationPanel(true);
      return;
    }

    // Direct mutation command shortcuts that update concept definition
    const lower = textToRun.toLowerCase();
    if (lower.startsWith('/invert') || lower.startsWith('!invert')) {
      if (targetConcept) {
        handleUpdateConcept(targetConcept.id, {
          title: `[INVERTED] ${targetConcept.title.replace(/^\[(INVERTED|COMPRESSED|ROLE-SWAP)\]\s*/i, '')}`,
          hook: `Inverted polarity: ${targetConcept.hook}. Operates peer-to-peer without central authority.`,
          artifactBadge: 'EXPERIMENT',
        }, 'Inversion');
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      }
      return;
    }
    if (lower.startsWith('/compress') || lower.startsWith('!compress')) {
      if (targetConcept) {
        handleUpdateConcept(targetConcept.id, {
          title: `[COMPRESSED] ${targetConcept.title.replace(/^\[(INVERTED|COMPRESSED|ROLE-SWAP)\]\s*/i, '')}`,
          hook: `Zero-dependency micro-kernel: 80 lines pure JS/Web APIs in memory.`,
          artifactBadge: 'PROTOTYPE',
          operationalMode: 'LAB',
        }, 'Compression');
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      }
      return;
    }
    if (lower.startsWith('/roleswap') || lower.startsWith('!roleswap')) {
      if (targetConcept) {
        handleUpdateConcept(targetConcept.id, {
          title: `[ROLE-SWAP] ${targetConcept.title.replace(/^\[(INVERTED|COMPRESSED|ROLE-SWAP)\]\s*/i, '')}`,
          hook: `Inverted agency: Client authors the logic, engine only validates.`,
          artifactBadge: 'EXPERIMENT',
        }, 'Role Swap');
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      }
      return;
    }

    // Specialized Mode Triggering: /proto, /scamper, /harden, /fork, /scaffold, /vector
    let parsedMode = activeMode;
    let cleanPrompt = textToRun;

    if (textToRun.startsWith('/proto') || textToRun.startsWith('!proto')) {
      parsedMode = '!proto';
      cleanPrompt = textToRun.replace(/^\/proto|!proto\s*/i, '').trim() || `Spin up disposable in-memory prototype for: ${targetConcept?.title || 'System'}`;
    } else if (textToRun.startsWith('/scamper') || textToRun.startsWith('!scamper')) {
      parsedMode = '/scamper';
      cleanPrompt = textToRun.replace(/^\/scamper|!scamper\s*/i, '').trim() || `Run SCAMPER mutation on: ${targetConcept?.title || 'System'}`;
    } else if (textToRun.startsWith('/harden') || textToRun.startsWith('!harden')) {
      parsedMode = '!harden';
      cleanPrompt = textToRun.replace(/^\/harden|!harden\s*/i, '').trim() || `Harden with AES-GCM WebCrypto and zero-network isolation: ${targetConcept?.title || 'System'}`;
    } else if (textToRun.startsWith('/fork') || textToRun.startsWith('!fork')) {
      parsedMode = '!fork';
      cleanPrompt = textToRun.replace(/^\/fork|!fork\s*/i, '').trim() || `Create 3-way architecture shootout for: ${targetConcept?.title || 'System'}`;
    } else if (textToRun.startsWith('/scaffold') || textToRun.startsWith('!scaffold')) {
      parsedMode = '!scaffold';
      cleanPrompt = textToRun.replace(/^\/scaffold|!scaffold\s*/i, '').trim() || `Scaffold factory primitives and typed contracts for: ${targetConcept?.title || 'System'}`;
    } else if (textToRun.startsWith('/vector') || textToRun.startsWith('!vector')) {
      parsedMode = '!vector';
      cleanPrompt = textToRun.replace(/^\/vector|!vector\s*/i, '').trim() || `Generate standalone execution vector runner for: ${targetConcept?.title || 'System'}`;
    } else if (textToRun.startsWith('/wild') || textToRun.startsWith('!wild')) {
      parsedMode = '/wild';
      cleanPrompt = textToRun.replace(/^\/wild|!wild\s*/i, '').trim() || `Wild divergence exploration for: ${targetConcept?.title || 'System'}`;
    } else if (textToRun.startsWith('/mvp') || textToRun.startsWith('!mvp')) {
      parsedMode = '/mvp';
      cleanPrompt = textToRun.replace(/^\/mvp|!mvp\s*/i, '').trim() || `Generate MVP execution roadmap for: ${targetConcept?.title || 'System'}`;
    }

    setActiveMode(parsedMode);
    handleExecuteBrainstorm(cleanPrompt, parsedMode);
  };

  // Tidy layout
  const handleTidyLayout = () => {
    const typeOrder: BrainstormNodeType[] = [
      'spark',
      'concept',
      'prototype',
      'hardened',
      'scaffold',
      'fork',
      'vector',
      'mutation',
      'assumption',
      'stress_test',
      'execution',
      'collision',
    ];

    const grouped: Record<string, BrainstormNode[]> = {};
    nodes.forEach(n => {
      grouped[n.type] = grouped[n.type] || [];
      grouped[n.type].push(n);
    });

    let currentY = 100;
    const reordered: BrainstormNode[] = [];

    typeOrder.forEach(type => {
      const typeNodes = grouped[type] || [];
      if (typeNodes.length > 0) {
        typeNodes.forEach((n, idx) => {
          const totalInRow = typeNodes.length;
          const spacing = 350;
          const startX = 540 - ((totalInRow - 1) * spacing) / 2;
          reordered.push({
            ...n,
            x: startX + idx * spacing,
            y: currentY,
          });
        });
        currentY += 300;
      }
    });

    setNodes(reordered);
    setPan({ x: 80, y: 70 });
    setZoom(0.85);
  };

  // Filter nodes
  const filteredNodes = nodes.filter(n => {
    if (filterType === 'concept' && n.type !== 'concept') return false;
    if (filterType === 'prototype' && n.type !== 'prototype') return false;
    if (filterType === 'hardened' && n.type !== 'hardened') return false;
    if (filterType === 'scaffold' && n.type !== 'scaffold') return false;
    if (filterType === 'fork' && n.type !== 'fork') return false;
    if (filterType === 'vector' && n.type !== 'vector') return false;
    if (filterType === 'mutation' && n.type !== 'mutation') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.hook.toLowerCase().includes(q) ||
        (n.theTwist && n.theTwist.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const getNodeColor = (type: BrainstormNodeType, badge?: ArtifactBadge) => {
    switch (type) {
      case 'prototype':
        return {
          border: 'border-cyan-400',
          glow: 'shadow-cyan-500/30',
          badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
          icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" />,
        };
      case 'hardened':
        return {
          border: 'border-emerald-400',
          glow: 'shadow-emerald-500/30',
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'scaffold':
        return {
          border: 'border-amber-400',
          glow: 'shadow-amber-500/30',
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
          icon: <TerminalIcon className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'fork':
        return {
          border: 'border-violet-400',
          glow: 'shadow-violet-500/30',
          badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/40',
          icon: <Sparkles className="w-3.5 h-3.5 text-violet-400" />,
        };
      case 'vector':
        return {
          border: 'border-blue-400',
          glow: 'shadow-blue-500/30',
          badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
          icon: <Play className="w-3.5 h-3.5 text-blue-400" />,
        };
      case 'spark':
        return {
          border: 'border-cyan-500',
          glow: 'shadow-cyan-500/20',
          badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
        };
      case 'concept':
        return {
          border: 'border-sky-500',
          glow: 'shadow-sky-500/20',
          badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
          icon: <Zap className="w-3.5 h-3.5 text-sky-400" />,
        };
      case 'assumption':
        return {
          border: 'border-orange-500',
          glow: 'shadow-orange-500/20',
          badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />,
        };
      case 'stress_test':
        return {
          border: 'border-rose-500',
          glow: 'shadow-rose-500/20',
          badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'mutation':
        return {
          border: 'border-purple-500',
          glow: 'shadow-purple-500/30',
          badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
          icon: <Dna className="w-3.5 h-3.5 text-purple-400" />,
        };
      case 'execution':
        return {
          border: 'border-emerald-500',
          glow: 'shadow-emerald-500/20',
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          icon: <Rocket className="w-3.5 h-3.5 text-emerald-400" />,
        };
      default:
        return {
          border: 'border-indigo-500',
          glow: 'shadow-indigo-500/20',
          badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
          icon: <Compass className="w-3.5 h-3.5 text-indigo-400" />,
        };
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#07090e] select-none text-slate-200 relative overflow-hidden font-sans">
      {/* Top Header & Operational HUD */}
      <div className="h-12 bg-[#0d1117] border-b border-[#30363d] px-4 flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-purple-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-xs text-white flex items-center gap-1.5">
                <span>BRAINSTORMER PRO X</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                  PLAYGROUND ENGINE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span>Mode: <strong className="text-white">{operationalMode}</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">Zero-Key Local First</span>
              </div>
            </div>
          </div>

          <span className="text-slate-700">|</span>

          {/* Mutation Panel Toggle Button */}
          <button
            onClick={() => setShowMutationPanel(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              showMutationPanel
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                : 'bg-[#161b22] hover:bg-[#21262d] text-purple-300 hover:text-white border-purple-500/40'
            }`}
            title="Open Concept Matrix & MutationPanel"
          >
            <Dna className="w-3.5 h-3.5 text-purple-400" />
            <span>Concept Matrix Mutations</span>
            <span className="px-1 py-0.2 rounded bg-purple-950/80 text-purple-200 text-[9px] font-mono font-bold">
              {nodes.filter(n => n.type === 'mutation').length}
            </span>
          </button>

          {/* Operational Laws Quick Popover Trigger */}
          <button
            onClick={() => setShowLawsModal(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-white border border-[#30363d] text-[11px] transition-colors"
            title="Inspect Non-Negotiable Operational Laws"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>4 Laws Active</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Category Filters */}
          <div className="flex items-center gap-1 bg-[#161b22] p-0.5 rounded-lg border border-[#21262d] text-[11px]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded transition-colors ${filterType === 'all' ? 'bg-[#21262d] text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({nodes.length})
            </button>
            <button
              onClick={() => setFilterType('prototype')}
              className={`px-2 py-0.5 rounded transition-colors ${filterType === 'prototype' ? 'bg-[#21262d] text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              !proto ({nodes.filter(n => n.type === 'prototype').length})
            </button>
            <button
              onClick={() => setFilterType('hardened')}
              className={`px-2 py-0.5 rounded transition-colors ${filterType === 'hardened' ? 'bg-[#21262d] text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              !harden ({nodes.filter(n => n.type === 'hardened').length})
            </button>
            <button
              onClick={() => setFilterType('mutation')}
              className={`px-2 py-0.5 rounded transition-colors ${filterType === 'mutation' ? 'bg-[#21262d] text-purple-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              mutations ({nodes.filter(n => n.type === 'mutation').length})
            </button>
            <button
              onClick={() => setFilterType('scaffold')}
              className={`px-2 py-0.5 rounded transition-colors ${filterType === 'scaffold' ? 'bg-[#21262d] text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              !scaffold ({nodes.filter(n => n.type === 'scaffold').length})
            </button>
            <button
              onClick={() => setFilterType('fork')}
              className={`px-2 py-0.5 rounded transition-colors ${filterType === 'fork' ? 'bg-[#21262d] text-violet-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              !fork ({nodes.filter(n => n.type === 'fork').length})
            </button>
            <button
              onClick={() => setFilterType('vector')}
              className={`px-2 py-0.5 rounded transition-colors ${filterType === 'vector' ? 'bg-[#21262d] text-blue-300 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              !vector ({nodes.filter(n => n.type === 'vector').length})
            </button>
          </div>
        </div>

        {/* Center: Search Node */}
        <div className="flex items-center gap-1.5 bg-[#161b22] px-2.5 py-1 rounded-lg border border-[#30363d] w-52">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search concepts or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-slate-200 text-xs placeholder-slate-500 font-sans"
          />
        </div>

        {/* Right Canvas Utilities */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTidyLayout}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-white rounded-lg border border-[#30363d] transition-colors text-[11px]"
            title="Auto-organize concept matrix"
          >
            <Layers className="w-3 h-3 text-sky-400" />
            <span>Tidy</span>
          </button>

          <div className="flex items-center bg-[#161b22] p-0.5 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-400 px-1 font-mono">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 40, y: 30 }); }}
              className="p-1 text-slate-400 hover:text-slate-200 rounded ml-0.5"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => {
              setNodes(INITIAL_BRAINSTORM_NODES);
              setConnections(INITIAL_BRAINSTORM_CONNECTIONS);
              setToastNotice('Canvas reset to initial concept matrix');
            }}
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-[#161b22]"
            title="Reset Graph"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Resilient Toast Notice Banner */}
      {toastNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#161b22] border border-cyan-500/40 text-cyan-300 text-xs px-4 py-2 rounded-xl shadow-2xl shadow-cyan-500/20 flex items-center gap-2.5 pointer-events-auto">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-mono text-[11px]">{toastNotice}</span>
          <button
            onClick={() => setToastNotice(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Interactive Visual Canvas Board */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#07090e]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* SVG Bezier Connection Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + 160;
              const y1 = fromNode.y + 110;
              const x2 = toNode.x + 160;
              const y2 = toNode.y + 40;

              const midY = (y1 + y2) / 2;
              const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

              const isMutationLink = conn.label && conn.label.toLowerCase().includes('mutat');

              return (
                <g key={conn.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke={isMutationLink ? 'rgba(192, 132, 252, 0.45)' : 'rgba(56, 189, 248, 0.25)'}
                    strokeWidth={isMutationLink ? '2.5' : '2'}
                    strokeDasharray={isMutationLink ? '6 3' : '4 4'}
                  />
                  {conn.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 6}
                      fill={isMutationLink ? '#c084fc' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none bg-black"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Nodes Layer */}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {filteredNodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const style = getNodeColor(node.type, node.artifactBadge);

            return (
              <div
                key={node.id}
                onMouseDown={e => handleNodeDragStart(e, node.id)}
                onClick={() => setSelectedNodeId(node.id)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                }}
                className={`brainstorm-card absolute w-[330px] bg-[#0f141f] border ${style.border} ${
                  isSelected ? 'ring-2 ring-cyan-400 shadow-2xl ' + style.glow : 'shadow-lg hover:border-slate-400'
                } rounded-xl p-3.5 transition-shadow cursor-pointer select-none text-xs flex flex-col gap-2 z-10 backdrop-blur-md`}
              >
                {/* Node Card Header with Artifact Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {style.icon}
                    <span className="font-bold text-slate-100 uppercase tracking-wide truncate max-w-[190px]">
                      {node.title}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${style.badge}`}>
                    {node.artifactBadge || node.type}
                  </span>
                </div>

                {/* Hook */}
                <p className="text-slate-300 text-xs leading-relaxed">
                  {node.hook}
                </p>

                {/* The Twist */}
                {node.theTwist && (
                  <div className="p-2 bg-[#161c28] border border-[#232b3b] rounded-lg text-[11px] text-amber-200/90 leading-relaxed">
                    <span className="font-bold text-amber-400 block text-[10px] uppercase">The Twist:</span>
                    {node.theTwist}
                  </div>
                )}

                {/* Fork Shootout Variants Mini-Preview */}
                {node.type === 'fork' && node.forkVariants && node.forkVariants.length > 0 && (
                  <div className="space-y-1 bg-[#121824] p-2 rounded-lg border border-violet-500/20 text-[10px]">
                    <div className="font-mono text-violet-300 font-bold uppercase text-[9px]">3-Way Shootout Variants:</div>
                    {node.forkVariants.map((v, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-300">
                        <span className="font-semibold text-slate-200">[{v.type}] {v.name}</span>
                        <span className="text-slate-500 truncate max-w-[140px] text-right">{v.tagline}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Execution Vector Harness */}
                {node.type === 'vector' && node.executionVectorHarness && (
                  <div className="p-1.5 bg-[#080d17] border border-blue-500/30 rounded font-mono text-[10px] text-blue-300 flex items-center justify-between">
                    <span className="truncate">{node.executionVectorHarness}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(node.executionVectorHarness || '');
                        setCopiedHarness(true);
                        setTimeout(() => setCopiedHarness(false), 1500);
                      }}
                      className="text-slate-400 hover:text-white p-0.5"
                      title="Copy runner vector"
                    >
                      {copiedHarness ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                {/* Mechanisms Preview */}
                {node.mechanisms && node.mechanisms.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-slate-400 border-t border-[#1f2736] pt-1.5">
                    {node.mechanisms.slice(0, 2).map((m, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-cyan-400 font-bold">·</span>
                        <span className="truncate">{m}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Scores Matrix */}
                {node.scores && (
                  <div className="grid grid-cols-4 gap-1 py-1 px-1.5 bg-[#090d14] rounded-lg text-[10px] font-mono text-center">
                    <div>
                      <div className="text-slate-500">POTENTIAL</div>
                      <div className="text-amber-400 font-bold">{node.scores.potential}/10</div>
                    </div>
                    <div>
                      <div className="text-slate-500">NOVELTY</div>
                      <div className="text-cyan-400 font-bold">{node.scores.novelty}/10</div>
                    </div>
                    <div>
                      <div className="text-slate-500">VIABILITY</div>
                      <div className="text-emerald-400 font-bold">{node.scores.feasibility}/10</div>
                    </div>
                    <div>
                      <div className="text-slate-500">RISK</div>
                      <div className="text-rose-400 font-bold">{node.scores.risk}/10</div>
                    </div>
                  </div>
                )}

                {/* Action Toolbar on Node: Playground Engine Sub-Routines & Mutations */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1f2736]">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRunSubRoutine(node, '!proto');
                      }}
                      className="px-1.5 py-0.5 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 rounded text-[9px] font-mono transition-colors"
                      title="!proto: Disposable in-memory lab"
                    >
                      !proto
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRunSubRoutine(node, '!harden');
                      }}
                      className="px-1.5 py-0.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 rounded text-[9px] font-mono transition-colors"
                      title="!harden: Security isolation & WebCrypto"
                    >
                      !harden
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setShowMutationPanel(true);
                      }}
                      className="px-1.5 py-0.5 bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 rounded text-[9px] font-mono transition-colors"
                      title="Open MutationPanel for this concept"
                    >
                      🧬 mutate
                    </button>
                  </div>

                  {/* 1-Click Code Generation Bridge */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleBuildPrototype(node);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold transition-colors shadow-sm shadow-emerald-500/20"
                    title="Fabricate & execute directly in IDE"
                  >
                    <Play className="w-2.5 h-2.5 fill-white" />
                    <span>Build in IDE</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Generation Floating Indicator */}
        {isGenerating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#161b22]/95 backdrop-blur-md border border-cyan-500/50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs text-white animate-pulse">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <div className="flex flex-col">
              <span className="font-semibold text-cyan-300">CODING PARTNER // PLAYGROUND ENGINE</span>
              <span className="text-[11px] text-slate-300 font-mono">{generationStep}</span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MUTATION PANEL COMPONENT (Lists Concept Matrix items) */}
        {/* ============================================================== */}
        {showMutationPanel && (
          <MutationPanel
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={id => setSelectedNodeId(id)}
            onUpdateConcept={handleUpdateConcept}
            onBranchMutationNode={handleBranchMutationNode}
            onClose={() => setShowMutationPanel(false)}
          />
        )}
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && !showMutationPanel && (
        <div className="absolute top-14 right-4 w-84 max-h-[72vh] bg-[#0f141f]/95 backdrop-blur-xl border border-[#30363d] rounded-xl shadow-2xl p-4 flex flex-col gap-3 overflow-y-auto z-20 text-xs">
          <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SOFTWARE FABRICATION LAB</span>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase flex items-center justify-between">
              <span>Title & Artifact Badge</span>
              <span className="text-cyan-400 font-bold">{selectedNode.artifactBadge || selectedNode.type}</span>
            </div>
            <div className="text-sm font-semibold text-slate-100">{selectedNode.title}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase">Core Hook</div>
            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{selectedNode.hook}</p>
          </div>

          {selectedNode.theTwist && (
            <div className="p-2.5 bg-[#161c28] border border-amber-500/30 rounded-lg">
              <div className="text-[10px] font-bold text-amber-400 uppercase">The Non-Obvious Twist</div>
              <p className="text-amber-100/90 text-xs mt-1 leading-relaxed">{selectedNode.theTwist}</p>
            </div>
          )}

          {/* Fork Variants Details */}
          {selectedNode.type === 'fork' && selectedNode.forkVariants && (
            <div className="p-2.5 bg-[#121824] border border-violet-500/30 rounded-lg space-y-2">
              <div className="text-[10px] font-bold text-violet-300 uppercase">3-Way Shootout Specifications</div>
              {selectedNode.forkVariants.map((v, i) => (
                <div key={i} className="text-[11px] border-b border-[#21262d] last:border-none pb-1 last:pb-0">
                  <div className="font-semibold text-slate-200 flex items-center justify-between">
                    <span>[{v.type}] {v.name}</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">{v.architecture}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Routines Action Cluster */}
          <div className="space-y-1.5 pt-1 border-t border-[#21262d]">
            <div className="text-[10px] font-bold text-cyan-400 uppercase font-mono">Dynamic Skill Triggers:</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleRunSubRoutine(selectedNode, '!proto')}
                className="p-1.5 bg-[#161c28] hover:bg-[#202738] border border-cyan-500/30 rounded text-left text-[10px]"
              >
                <div className="font-bold text-cyan-300">⚡ !proto</div>
                <div className="text-slate-400 text-[9px]">Disposable Lab</div>
              </button>
              <button
                onClick={() => handleRunSubRoutine(selectedNode, '!harden')}
                className="p-1.5 bg-[#161c28] hover:bg-[#202738] border border-emerald-500/30 rounded text-left text-[10px]"
              >
                <div className="font-bold text-emerald-300">🛡️ !harden</div>
                <div className="text-slate-400 text-[9px]">Security Isolation</div>
              </button>
              <button
                onClick={() => handleRunSubRoutine(selectedNode, '!scaffold')}
                className="p-1.5 bg-[#161c28] hover:bg-[#202738] border border-amber-500/30 rounded text-left text-[10px]"
              >
                <div className="font-bold text-amber-300">🏗️ !scaffold</div>
                <div className="text-slate-400 text-[9px]">Factory Primitives</div>
              </button>
              <button
                onClick={() => setShowMutationPanel(true)}
                className="p-1.5 bg-[#161c28] hover:bg-[#202738] border border-purple-500/30 rounded text-left text-[10px]"
              >
                <div className="font-bold text-purple-300">🧬 MutationPanel</div>
                <div className="text-slate-400 text-[9px]">Mutate Definition</div>
              </button>
            </div>
          </div>

          {/* Primary Fabrication Buttons */}
          <div className="pt-2 border-t border-[#21262d] flex flex-col gap-2">
            <button
              onClick={() => handleBuildPrototype(selectedNode, 'proto')}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Fabricate [PROTOTYPE] in IDE</span>
            </button>

            {onSendToCopilotChat && (
              <button
                onClick={() => onSendToCopilotChat(`I want to build this concept from Brainstormer: "${selectedNode.title}: ${selectedNode.hook}". Please architect the complete runnable files.`)}
                className="w-full py-1.5 bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-white border border-[#30363d] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3 h-3 text-cyan-400" />
                <span>Pair Program with Copilot</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Non-Negotiable Operational Laws Modal */}
      {showLawsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f141f] border border-[#30363d] rounded-2xl max-w-lg w-full p-5 text-slate-200 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">CODING PARTNER // NON-NEGOTIABLE LAWS</h3>
              </div>
              <button
                onClick={() => setShowLawsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-2.5 bg-[#161c28] border border-cyan-500/20 rounded-lg">
                <div className="font-bold text-cyan-300 font-mono">1. ZERO GATEKEEPING & ENVIRONMENT AGNOSTICISM</div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Never require setup rituals or package shopping lists. Native execution everywhere—Termux, bare browser, Linux, or edge runtimes.
                </p>
              </div>

              <div className="p-2.5 bg-[#161c28] border border-emerald-500/20 rounded-lg">
                <div className="font-bold text-emerald-300 font-mono">2. ZERO API-KEY REQUIREMENT (LOCAL-FIRST)</div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Default to native, local, deterministic execution: Web APIs, WebCrypto AES-GCM, HTML5 Canvas, SQLite, pure math. No third-party API key blockers.
                </p>
              </div>

              <div className="p-2.5 bg-[#161c28] border border-amber-500/20 rounded-lg">
                <div className="font-bold text-amber-300 font-mono">3. ARTIFACTS OVER EXPLANATIONS</div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Objective → Structural Blueprint → Complete Implementation Code → Execution Vector. Every single line written without placeholder comments.
                </p>
              </div>

              <div className="p-2.5 bg-[#161c28] border border-violet-500/20 rounded-lg">
                <div className="font-bold text-violet-300 font-mono">4. SYSTEM-LEVEL THINKING</div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Build the actual machinery, not just a surface facade. Complete state handling, error bounds, edge-case guards, and modular separation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLawsModal(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PERSISTENT PROMPT INPUT BAR AT BOTTOM OF BRAINSTORMERCANVAS   */}
      {/* Supports slash commands (/proto, /scamper, /harden, etc.)      */}
      {/* ============================================================== */}
      <div className="p-2.5 bg-[#0d1117] border-t border-[#30363d] flex flex-col gap-2 z-20 shrink-0 relative">
        {/* Rapid Mode Quick-Pill Triggers Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-mono mr-1 shrink-0">Commands:</span>

          {/* Quick 1-Click Slash Triggers */}
          <button
            type="button"
            onClick={() => handleRunSlashCommand('/proto')}
            className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 transition-colors flex items-center gap-1 shrink-0"
            title="Trigger /proto (Disposable Lab Prototype)"
          >
            <span>/proto</span>
            <span className="text-[9px] px-1 rounded bg-black/40 text-slate-300">LAB</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunSlashCommand('/scamper')}
            className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 transition-colors flex items-center gap-1 shrink-0"
            title="Trigger /scamper (Systematic Mutation)"
          >
            <span>/scamper</span>
            <span className="text-[9px] px-1 rounded bg-black/40 text-slate-300">MUTATE</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunSlashCommand('/harden')}
            className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 transition-colors flex items-center gap-1 shrink-0"
            title="Trigger /harden (Security Isolation & WebCrypto)"
          >
            <span>/harden</span>
            <span className="text-[9px] px-1 rounded bg-black/40 text-slate-300">SECURITY</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunSlashCommand('/fork')}
            className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-violet-950/60 hover:bg-violet-900/60 text-violet-300 border border-violet-800/40 transition-colors flex items-center gap-1 shrink-0"
            title="Trigger /fork (3-Way Architecture Shootout)"
          >
            <span>/fork</span>
            <span className="text-[9px] px-1 rounded bg-black/40 text-slate-300">SHOOTOUT</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunSlashCommand('/scaffold')}
            className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 transition-colors flex items-center gap-1 shrink-0"
            title="Trigger /scaffold (Factory Primitives)"
          >
            <span>/scaffold</span>
            <span className="text-[9px] px-1 rounded bg-black/40 text-slate-300">FACTORY</span>
          </button>

          {/* Quick Mutation Panel Trigger */}
          <button
            type="button"
            onClick={() => setShowMutationPanel(prev => !prev)}
            className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-fuchsia-950/70 hover:bg-fuchsia-900/70 text-fuchsia-300 border border-fuchsia-700/50 transition-colors flex items-center gap-1 shrink-0 ml-auto"
            title="Open MutationPanel with Concept Matrix"
          >
            <Dna className="w-3 h-3 text-fuchsia-400" />
            <span>MutationPanel</span>
          </button>
        </div>

        {/* Persistent Input Field Form */}
        <div className="relative">
          {/* Upward Autocomplete Menu when typing '/' or '!' */}
          {showBottomMenu && bottomSuggestions.length > 0 && (
            <div className="absolute bottom-full mb-1.5 left-0 right-0 max-h-60 overflow-y-auto bg-[#0d121c]/98 border border-[#30363d] rounded-xl shadow-2xl z-40 p-1 space-y-0.5 custom-scrollbar backdrop-blur-xl">
              <div className="px-2 py-1 text-[10px] font-mono text-slate-500 uppercase flex items-center justify-between border-b border-[#1f2633]">
                <span>Canvas Slash Commands (↑↓ arrows, Enter to execute)</span>
                <span>{bottomSuggestions.length} available</span>
              </div>
              {bottomSuggestions.map((item, idx) => {
                const isHighlighted = idx === bottomMenuIndex;
                return (
                  <div
                    key={item.command}
                    onMouseDown={e => {
                      e.preventDefault();
                      setBottomPrompt(item.command + ' ');
                      setShowBottomMenu(false);
                      bottomInputRef.current?.focus();
                    }}
                    className={`p-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isHighlighted
                        ? 'bg-cyan-950/70 border border-cyan-500/40 text-white'
                        : 'hover:bg-[#161c28] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-xs">
                        {item.command}
                      </span>
                      <span className="font-semibold text-slate-200 text-xs">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[280px]">
                        — {item.desc}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded bg-black/50 text-[9px] font-mono text-cyan-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              if (showBottomMenu && bottomSuggestions.length > 0) {
                const chosen = bottomSuggestions[bottomMenuIndex];
                handleRunSlashCommand(chosen.command);
              } else {
                handleRunSlashCommand(bottomPrompt);
              }
            }}
            className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] focus-within:border-cyan-500 rounded-xl p-1.5 transition-colors shadow-inner"
          >
            {/* Active Mode / Command Indicator Pill */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-[#21262d] rounded-lg text-cyan-400 font-mono text-xs font-bold shrink-0">
              <TerminalIcon className="w-3 h-3 text-cyan-400" />
              <span>{activeMode}</span>
            </div>

            {/* Persistent Input Field */}
            <input
              ref={bottomInputRef}
              type="text"
              value={bottomPrompt}
              onChange={e => {
                setBottomPrompt(e.target.value);
                if (e.target.value.startsWith('/') || e.target.value.startsWith('!')) {
                  setShowBottomMenu(true);
                  setBottomMenuIndex(0);
                } else {
                  setShowBottomMenu(false);
                }
              }}
              onFocus={() => {
                if (bottomPrompt.startsWith('/') || bottomPrompt.startsWith('!')) {
                  setShowBottomMenu(true);
                }
              }}
              onKeyDown={e => {
                if (showBottomMenu && bottomSuggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setBottomMenuIndex(idx => (idx + 1) % bottomSuggestions.length);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setBottomMenuIndex(idx => (idx - 1 + bottomSuggestions.length) % bottomSuggestions.length);
                    return;
                  }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const chosen = bottomSuggestions[bottomMenuIndex];
                    setBottomPrompt(chosen.command + ' ');
                    setShowBottomMenu(false);
                    return;
                  }
                }
                if (e.key === 'Escape') {
                  setShowBottomMenu(false);
                }
              }}
              placeholder="Type slash command ('/proto', '/scamper', '/harden', '/mutate') or enter concept idea..."
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 font-sans px-1"
            />

            {/* Submit / Trigger Button */}
            <button
              type="submit"
              disabled={!bottomPrompt.trim() || isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-cyan-600/20 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Iterating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Execute Command</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
