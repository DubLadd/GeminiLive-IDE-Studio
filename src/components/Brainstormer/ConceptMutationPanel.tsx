import React, { useState } from 'react';
import {
  BrainstormNode,
  BrainstormNodeType,
  ArtifactBadge,
} from '../../types/brainstormer';
import {
  Dna,
  Shuffle,
  Minimize2,
  Maximize2,
  ArrowLeftRight,
  Trash,
  Clock,
  Gamepad2,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Loader2,
  Grid3X3,
  X,
  Target,
  Repeat,
  Flame,
  ArrowRight
} from 'lucide-react';

export interface MutationDefinition {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  rule: string;
  badge: string;
  color: string;
  hoverBg: string;
  borderColor: string;
  icon: React.ReactNode;
}

export const MUTATION_DEFINITIONS: MutationDefinition[] = [
  {
    id: 'inversion',
    name: 'Inversion',
    category: 'Structural',
    tagline: 'Do the exact opposite',
    description: 'Inverts the core mechanism or premise (e.g. server becomes client, inputs become outputs).',
    rule: 'Flip the foundational premise to its polar opposite. If the system collects data, make it purge data.',
    badge: 'MUTATION // INVERT',
    color: 'text-amber-400',
    hoverBg: 'hover:bg-amber-950/40',
    borderColor: 'border-amber-500/30',
    icon: <Shuffle className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'compression',
    name: 'Compression',
    category: 'Architecture',
    tagline: 'Reduce to smallest viable form',
    description: 'Strips all non-essential weight down to single-file, zero-dependency, micro-footprint.',
    rule: 'Reduce size, complexity, and dependencies by 90%. What if the entire system was 100 lines of pure JS?',
    badge: 'MUTATION // COMPRESS',
    color: 'text-cyan-400',
    hoverBg: 'hover:bg-cyan-950/40',
    borderColor: 'border-cyan-500/30',
    icon: <Minimize2 className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: 'role_swap',
    name: 'Role Swap',
    category: 'Agency',
    tagline: 'Change who controls the system',
    description: 'Swaps user, algorithm, client, and observer roles. The consumer becomes the runtime.',
    rule: 'Transfer primary agency. If humans curate, let deterministic algorithms curate and humans execute.',
    badge: 'MUTATION // ROLE-SWAP',
    color: 'text-purple-400',
    hoverBg: 'hover:bg-purple-950/40',
    borderColor: 'border-purple-500/30',
    icon: <ArrowLeftRight className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'removal',
    name: 'Removal',
    category: 'Constraint',
    tagline: 'Delete the defining feature',
    description: 'Remove what seems indispensable (UI, central database, authentication, network).',
    rule: 'Eliminate the #1 assumption. What if there is no UI? What if there is no central server?',
    badge: 'MUTATION // REMOVE',
    color: 'text-rose-400',
    hoverBg: 'hover:bg-rose-950/40',
    borderColor: 'border-rose-500/30',
    icon: <Trash className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'expansion',
    name: 'Expansion',
    category: 'Scale',
    tagline: 'Dramatically enlarge scale',
    description: 'Scale the idea from a local utility into a category-defining planetary system or protocol.',
    rule: 'Multiply the scope by 1000x. Turn a tool into a runtime platform or autonomous ecosystem.',
    badge: 'MUTATION // EXPAND',
    color: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-950/40',
    borderColor: 'border-emerald-500/30',
    icon: <Maximize2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'time_shift',
    name: 'Time Shift',
    category: 'Temporal',
    tagline: 'Shift by a decade (1995 or 2035)',
    description: 'Reframe with past retro constraints (VT100 terminal) or future post-AI ambient computing.',
    rule: 'Imagine this architecture in 2035 with ambient WASM compute, or in 1995 with pure telnet sockets.',
    badge: 'MUTATION // TIME-SHIFT',
    color: 'text-indigo-400',
    hoverBg: 'hover:bg-indigo-950/40',
    borderColor: 'border-indigo-500/30',
    icon: <Clock className="w-4 h-4 text-indigo-400" />,
  },
  {
    id: 'genre_shift',
    name: 'Genre Shift',
    category: 'Metaphor',
    tagline: 'Turn into a game, OS, or ritual',
    description: 'Re-encode technical problem into a roguelike game mechanic, operating system, or financial market.',
    rule: 'Translate all state and interactions into a game mechanic with inventory, loot tables, and boss battles.',
    badge: 'MUTATION // GENRE-SHIFT',
    color: 'text-fuchsia-400',
    hoverBg: 'hover:bg-fuchsia-950/40',
    borderColor: 'border-fuchsia-500/30',
    icon: <Gamepad2 className="w-4 h-4 text-fuchsia-400" />,
  },
  {
    id: 'constraint',
    name: 'Constraint Mutation',
    category: 'Hostile',
    tagline: 'Inject severe limitations',
    description: 'Force innovation through harsh boundaries: 10-second timer, 0KB storage, air-gapped offline.',
    rule: 'Inject an extreme hostile constraint: must run offline in zero-latency memory without API keys.',
    badge: 'MUTATION // CONSTRAINT',
    color: 'text-orange-400',
    hoverBg: 'hover:bg-orange-950/40',
    borderColor: 'border-orange-500/30',
    icon: <SlidersHorizontal className="w-4 h-4 text-orange-400" />,
  },
  {
    id: 'recursive',
    name: 'Recursive Self-Mutation',
    category: 'Cybernetic',
    tagline: 'System operates on itself',
    description: 'Make the system inspect, mutate, compile, or evaluate its own code and output.',
    rule: 'Close the loop: the output of the system is the input to the compiler, making it self-evolving.',
    badge: 'MUTATION // RECURSIVE',
    color: 'text-sky-400',
    hoverBg: 'hover:bg-sky-950/40',
    borderColor: 'border-sky-500/30',
    icon: <Repeat className="w-4 h-4 text-sky-400" />,
  },
  {
    id: 'collision',
    name: 'Domain Fusion',
    category: 'Collision',
    tagline: 'Fuse with unrelated domain',
    description: 'Collide current concept with biology, modular synthesizers, air traffic control, or cryptography.',
    rule: 'Borrow primitives from modular synthesizers (patch cords, VCOs, LFOs) and apply to state management.',
    badge: 'MUTATION // COLLISION',
    color: 'text-yellow-400',
    hoverBg: 'hover:bg-yellow-950/40',
    borderColor: 'border-yellow-500/30',
    icon: <Flame className="w-4 h-4 text-yellow-400" />,
  },
];

interface ConceptMutationPanelProps {
  nodes: BrainstormNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onTriggerMutation: (targetNode: BrainstormNode, mutation: MutationDefinition, customNote?: string) => Promise<void>;
  onClose: () => void;
  isMutating?: boolean;
}

export const ConceptMutationPanel: React.FC<ConceptMutationPanelProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onTriggerMutation,
  onClose,
  isMutating = false,
}) => {
  const [selectedMutationId, setSelectedMutationId] = useState<string>('inversion');
  const [customMutationNote, setCustomMutationNote] = useState('');
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'concepts' | 'mutations' | 'prototypes'>('all');
  const [sortBy, setSortBy] = useState<'novelty' | 'feasibility' | 'potential'>('novelty');

  // Filter only viable concept nodes for mutation target
  const viableConcepts = nodes.filter(n => n.type !== 'assumption' && n.type !== 'stress_test');
  const targetNode = nodes.find(n => n.id === selectedNodeId) || viableConcepts[0] || nodes[0];
  const activeMutation = MUTATION_DEFINITIONS.find(m => m.id === selectedMutationId) || MUTATION_DEFINITIONS[0];

  // Concept Matrix nodes sorted
  const matrixNodes = nodes.filter(n => {
    if (matrixFilter === 'concepts') return n.type === 'concept' || n.type === 'spark';
    if (matrixFilter === 'mutations') return n.type === 'mutation';
    if (matrixFilter === 'prototypes') return n.type === 'prototype' || n.type === 'hardened' || n.type === 'scaffold' || n.type === 'fork';
    return true;
  }).sort((a, b) => {
    const scoreA = a.scores ? a.scores[sortBy] : 5;
    const scoreB = b.scores ? b.scores[sortBy] : 5;
    return scoreB - scoreA;
  });

  // Calculate Matrix Stats
  const avgNovelty = nodes.length > 0
    ? (nodes.reduce((acc, n) => acc + (n.scores?.novelty || 7), 0) / nodes.length).toFixed(1)
    : '8.0';
  const avgFeasibility = nodes.length > 0
    ? (nodes.reduce((acc, n) => acc + (n.scores?.feasibility || 8), 0) / nodes.length).toFixed(1)
    : '8.5';
  const mutationCount = nodes.filter(n => n.type === 'mutation').length;

  const handleApplyMutation = async (mutationToRun?: MutationDefinition) => {
    if (!targetNode || isMutating) return;
    const mut = mutationToRun || activeMutation;
    await onTriggerMutation(targetNode, mut, customMutationNote.trim() || undefined);
    setCustomMutationNote('');
  };

  return (
    <div className="absolute top-12 left-4 bottom-24 w-[540px] max-w-[94vw] bg-[#0c1017]/95 backdrop-blur-2xl border border-[#30363d] rounded-2xl shadow-2xl flex flex-col z-30 overflow-hidden text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#161b22]/90 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-950/60 border border-purple-500/40 rounded-lg text-purple-400">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">CONCEPT MATRIX & MUTATION ENGINE</h2>
              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-mono font-bold">
                MODE 5
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Matrix Analysis • Systematic Distortion • Lateral Mutation
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#21262d] transition-colors"
          title="Close Mutation Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body - Split into Concept Matrix Visualization and Mutation Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* 1. Target Concept Selector */}
        <div className="bg-[#111722] border border-[#212b3b] rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-slate-400">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Concept for Mutation:</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {nodes.length} nodes on canvas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetNode?.id || ''}
              onChange={e => onSelectNode(e.target.value)}
              className="flex-1 bg-[#161f2e] border border-[#2a364a] text-white text-xs font-medium rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 transition-colors"
            >
              {viableConcepts.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.artifactBadge || c.type.toUpperCase()}] {c.title}
                </option>
              ))}
            </select>

            <span className="px-2 py-1 bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 rounded-lg text-[10px] font-mono font-bold shrink-0">
              {targetNode?.scores ? `${targetNode.scores.potential}/10 POTENTIAL` : 'READY'}
            </span>
          </div>

          {targetNode && (
            <div className="mt-2 text-[11px] text-slate-300 bg-[#0a0e14] p-2 rounded-lg border border-[#1b2330] leading-relaxed">
              <span className="text-slate-400 font-semibold">Core Premise: </span>
              {targetNode.hook}
              {targetNode.theTwist && (
                <div className="mt-1 text-amber-300/90 text-[10px]">
                  <span className="font-bold text-amber-400">Twist: </span> {targetNode.theTwist}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Concept Matrix Visualization Table */}
        <div className="bg-[#111722] border border-[#212b3b] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-slate-300">
              <Grid3X3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Current Concept Matrix ({matrixNodes.length})</span>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-500 font-mono">Filter:</span>
              <button
                onClick={() => setMatrixFilter('all')}
                className={`px-1.5 py-0.5 rounded transition-colors ${matrixFilter === 'all' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setMatrixFilter('concepts')}
                className={`px-1.5 py-0.5 rounded transition-colors ${matrixFilter === 'concepts' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Concepts
              </button>
              <button
                onClick={() => setMatrixFilter('mutations')}
                className={`px-1.5 py-0.5 rounded transition-colors ${matrixFilter === 'mutations' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Mutations
              </button>
              <button
                onClick={() => setMatrixFilter('prototypes')}
                className={`px-1.5 py-0.5 rounded transition-colors ${matrixFilter === 'prototypes' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Prototypes
              </button>
            </div>
          </div>

          {/* Matrix Stats Bar */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5 p-1.5 bg-[#090d14] rounded-lg text-center font-mono text-[10px]">
            <div>
              <div className="text-slate-500">AVG NOVELTY</div>
              <div className="text-cyan-400 font-bold">{avgNovelty}/10</div>
            </div>
            <div>
              <div className="text-slate-500">AVG VIABILITY</div>
              <div className="text-emerald-400 font-bold">{avgFeasibility}/10</div>
            </div>
            <div>
              <div className="text-slate-500">MUTATIONS</div>
              <div className="text-purple-400 font-bold">{mutationCount}</div>
            </div>
            <div>
              <div className="text-slate-500">ACTIVE BADGE</div>
              <div className="text-amber-400 font-bold truncate">{targetNode?.artifactBadge || 'READY'}</div>
            </div>
          </div>

          {/* Matrix Grid Cards / Rows */}
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {matrixNodes.map(node => {
              const isSelected = targetNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-[11px] ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                      : 'bg-[#151b27]/80 hover:bg-[#1a2333] border-[#20293a] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      node.type === 'mutation'
                        ? 'bg-purple-400'
                        : node.type === 'prototype'
                        ? 'bg-cyan-400'
                        : node.type === 'hardened'
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`} />
                    <span className="font-semibold truncate">{node.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
                      {node.artifactBadge || node.type}
                    </span>
                    {node.scores && (
                      <span className="text-cyan-400 font-bold">
                        ★ {node.scores.potential}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-purple-300 font-bold text-[9px] uppercase px-1 rounded bg-purple-900/60">
                        TARGET
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Interactive Mutation Actions Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Trigger Specific Mutation on Target:</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">10 Genetic Operators</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MUTATION_DEFINITIONS.map(mut => {
              const isChosen = selectedMutationId === mut.id;
              return (
                <div
                  key={mut.id}
                  onClick={() => setSelectedMutationId(mut.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isChosen
                      ? `bg-[#181f2f] ${mut.borderColor} ring-1 ring-cyan-500 shadow-md`
                      : `bg-[#111722] hover:bg-[#151c2b] border-[#222a3a]`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      {mut.icon}
                      <span className={`font-bold text-xs ${mut.color}`}>
                        {mut.name}
                      </span>
                    </div>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-400 font-mono">
                      {mut.category}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-tight">
                    {mut.tagline}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1e2636]">
                    <span className="text-[9px] text-slate-500 font-mono truncate max-w-[140px]">
                      {mut.badge}
                    </span>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={e => {
                        e.stopPropagation();
                        handleApplyMutation(mut);
                      }}
                      className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                      title={`Trigger ${mut.name} mutation now`}
                    >
                      <span>Mutate</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Custom Parameter / Note for Mutation */}
        <div className="bg-[#111722] border border-[#212b3b] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              Custom Mutation Direction (Optional):
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Active: {activeMutation.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customMutationNote}
              onChange={e => setCustomMutationNote(e.target.value)}
              placeholder={`E.g. Invert: What if all computing occurs client-side in WebCrypto workers?`}
              className="flex-1 bg-[#161f2e] border border-[#2a364a] text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-500 placeholder-slate-500 font-sans"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyMutation();
                }
              }}
            />

            <button
              onClick={() => handleApplyMutation()}
              disabled={isMutating || !targetNode}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 shrink-0 transition-all"
            >
              {isMutating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mutating...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Execute {activeMutation.name}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="px-4 py-2 bg-[#090d14] border-t border-[#21262d] flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Local deterministic mutation engine ready</span>
        </div>
        <span>Select concept → click mutation → instant canvas graph update</span>
      </div>
    </div>
  );
};
