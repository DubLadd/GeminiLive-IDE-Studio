import React, { useState } from 'react';
import {
  BrainstormNode,
  ArtifactBadge,
} from '../../types/brainstormer';
import {
  Dna,
  Shuffle,
  Minimize2,
  ArrowLeftRight,
  Trash2,
  Maximize2,
  Sparkles,
  Check,
  X,
  Target,
  Zap,
  RotateCcw,
  GitBranch,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type MutationType = 'inversion' | 'compression' | 'role_swap' | 'removal' | 'expansion';

interface MutationPanelProps {
  nodes: BrainstormNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onUpdateConcept: (nodeId: string, updatedFields: Partial<BrainstormNode>, mutationLabel: string) => void;
  onBranchMutationNode?: (sourceNode: BrainstormNode, mutationType: MutationType, mutatedFields: Partial<BrainstormNode>) => void;
  onClose: () => void;
}

export const MutationPanel: React.FC<MutationPanelProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onUpdateConcept,
  onBranchMutationNode,
  onClose,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'concepts' | 'prototypes' | 'mutations'>('all');
  const [lastMutatedId, setLastMutatedId] = useState<string | null>(null);
  const [lastMutationType, setLastMutationType] = useState<string | null>(null);

  // Filter Concept Matrix items (concepts, prototypes, mutations, etc.)
  const matrixItems = nodes.filter(n => {
    if (badgeFilter === 'concepts') {
      if (n.type !== 'concept' && n.type !== 'spark') return false;
    } else if (badgeFilter === 'prototypes') {
      if (n.type !== 'prototype' && n.type !== 'hardened' && n.type !== 'scaffold') return false;
    } else if (badgeFilter === 'mutations') {
      if (n.type !== 'mutation') return false;
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.hook.toLowerCase().includes(q) ||
        (n.theTwist && n.theTwist.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Apply Inversion mutation to concept definition
  const handleApplyInversion = (concept: BrainstormNode) => {
    const cleanTitle = concept.title.replace(/^\[(INVERTED|COMPRESSED|ROLE-SWAP|HEADLESS|EXPANDED)\]\s*/i, '');
    const invertedTitle = `[INVERTED] ${cleanTitle}`;
    
    // Invert hook polarity
    const invertedHook = concept.hook.startsWith('Inverted Polarity:')
      ? concept.hook.replace('Inverted Polarity: ', 'Re-Inverted: ')
      : `Inverted Polarity: Do the opposite of "${concept.hook}". Eliminates centralized control and executes peer-to-peer.`;

    const invertedTwist = `Polar Opposite: What was centralized is now completely ephemeral and client-driven.`;

    const updatedFields: Partial<BrainstormNode> = {
      title: invertedTitle,
      hook: invertedHook,
      theTwist: invertedTwist,
      artifactBadge: 'EXPERIMENT',
      scores: {
        novelty: Math.min(10, (concept.scores?.novelty || 7) + 2),
        utility: concept.scores?.utility || 8,
        feasibility: Math.max(5, (concept.scores?.feasibility || 8) - 1),
        risk: Math.min(8, (concept.scores?.risk || 2) + 2),
        potential: Math.min(10, (concept.scores?.potential || 8) + 1),
      },
      tags: Array.from(new Set([...(concept.tags || []), 'INVERTED', 'MUTATION'])),
    };

    onUpdateConcept(concept.id, updatedFields, 'Inversion');
    triggerSuccessAnimation(concept.id, 'Inversion');
  };

  // Apply Compression mutation to concept definition
  const handleApplyCompression = (concept: BrainstormNode) => {
    const cleanTitle = concept.title.replace(/^\[(INVERTED|COMPRESSED|ROLE-SWAP|HEADLESS|EXPANDED)\]\s*/i, '');
    const compressedTitle = `[COMPRESSED] ${cleanTitle}`;

    const compressedHook = `Zero-dependency micro-kernel: Stripped to single-file, 100 lines pure JS/Web APIs with in-memory state.`;
    const compressedTwist = `Extreme compression: Zero build step, zero npm dependencies, zero cloud API keys.`;

    const updatedFields: Partial<BrainstormNode> = {
      title: compressedTitle,
      hook: compressedHook,
      theTwist: compressedTwist,
      type: 'prototype',
      artifactBadge: 'PROTOTYPE',
      operationalMode: 'LAB',
      mechanisms: [
        'Single-file zero-dependency runner',
        'In-memory state engine with Web APIs',
        'Deterministic local-first event loop',
      ],
      scores: {
        novelty: concept.scores?.novelty || 8,
        utility: Math.min(10, (concept.scores?.utility || 8) + 2),
        feasibility: 10,
        risk: 1,
        potential: concept.scores?.potential || 8,
      },
      tags: Array.from(new Set([...(concept.tags || []), 'COMPRESSED', 'PROTOTYPE'])),
    };

    onUpdateConcept(concept.id, updatedFields, 'Compression');
    triggerSuccessAnimation(concept.id, 'Compression');
  };

  // Apply Role Swap mutation to concept definition
  const handleApplyRoleSwap = (concept: BrainstormNode) => {
    const cleanTitle = concept.title.replace(/^\[(INVERTED|COMPRESSED|ROLE-SWAP|HEADLESS|EXPANDED)\]\s*/i, '');
    const roleSwapTitle = `[ROLE-SWAP] ${cleanTitle}`;

    const roleSwapHook = `Inverted Agency: The consumer becomes the runtime author; client generates rules and the engine simply verifies.`;
    const roleSwapTwist = `Agency reversal: What the system previously dictated is now authored by the user in reactive code.`;

    const updatedFields: Partial<BrainstormNode> = {
      title: roleSwapTitle,
      hook: roleSwapHook,
      theTwist: roleSwapTwist,
      artifactBadge: 'EXPERIMENT',
      scores: {
        novelty: Math.min(10, (concept.scores?.novelty || 7) + 2),
        utility: concept.scores?.utility || 8,
        feasibility: concept.scores?.feasibility || 8,
        risk: concept.scores?.risk || 3,
        potential: Math.min(10, (concept.scores?.potential || 8) + 1),
      },
      tags: Array.from(new Set([...(concept.tags || []), 'ROLE-SWAP', 'MUTATION'])),
    };

    onUpdateConcept(concept.id, updatedFields, 'Role Swap');
    triggerSuccessAnimation(concept.id, 'Role Swap');
  };

  // Branch as new node instead of updating in-place
  const handleBranchAsNewNode = (concept: BrainstormNode, type: MutationType) => {
    if (!onBranchMutationNode) return;
    if (type === 'inversion') {
      onBranchMutationNode(concept, 'inversion', {
        title: `[INVERTED] ${concept.title}`,
        hook: `Inverted polarity of ${concept.title}: Operates peer-to-peer without central state.`,
        theTwist: 'Polar opposite mechanism.',
        artifactBadge: 'EXPERIMENT',
      });
    } else if (type === 'compression') {
      onBranchMutationNode(concept, 'compression', {
        title: `[COMPRESSED] ${concept.title}`,
        hook: `Single-file zero-dependency micro-kernel of ${concept.title}.`,
        theTwist: 'Reduced by 90% in size and footprint.',
        artifactBadge: 'PROTOTYPE',
      });
    } else if (type === 'role_swap') {
      onBranchMutationNode(concept, 'role_swap', {
        title: `[ROLE-SWAP] ${concept.title}`,
        hook: `Inverted agency: Client authors logic for ${concept.title}.`,
        theTwist: 'Role reversed between client and platform.',
        artifactBadge: 'EXPERIMENT',
      });
    }
    triggerSuccessAnimation(concept.id, `Branched ${type}`);
  };

  const triggerSuccessAnimation = (conceptId: string, label: string) => {
    setLastMutatedId(conceptId);
    setLastMutationType(label);
    setTimeout(() => {
      setLastMutatedId(null);
      setLastMutationType(null);
    }, 2000);

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#c084fc', '#38bdf8', '#10b981'],
    });
  };

  return (
    <div className="absolute top-12 right-4 bottom-20 w-[480px] max-w-[94vw] bg-[#0c1017]/96 backdrop-blur-2xl border border-[#30363d] rounded-2xl shadow-2xl flex flex-col z-30 overflow-hidden text-xs text-slate-200 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="px-4 py-3 bg-[#161b22]/95 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-950/70 border border-purple-500/40 rounded-lg text-purple-400">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">MUTATION PANEL</h2>
              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-mono font-bold">
                CONCEPT MATRIX ({nodes.length})
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Mutate concepts directly in canvas state: Inversion • Compression • Role Swap
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

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#111722] border-b border-[#21262d] flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 bg-[#161f2e] px-2.5 py-1.5 rounded-lg border border-[#2a364a]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Search concepts in matrix..."
            className="w-full bg-transparent border-none outline-none text-slate-200 text-xs placeholder-slate-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#161f2e] p-0.5 rounded-lg border border-[#2a364a] text-[10px]">
          <button
            onClick={() => setBadgeFilter('all')}
            className={`px-2 py-1 rounded transition-colors ${badgeFilter === 'all' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setBadgeFilter('concepts')}
            className={`px-2 py-1 rounded transition-colors ${badgeFilter === 'concepts' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Concepts
          </button>
          <button
            onClick={() => setBadgeFilter('prototypes')}
            className={`px-2 py-1 rounded transition-colors ${badgeFilter === 'prototypes' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Prototypes
          </button>
          <button
            onClick={() => setBadgeFilter('mutations')}
            className={`px-2 py-1 rounded transition-colors ${badgeFilter === 'mutations' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Mutations
          </button>
        </div>
      </div>

      {/* Concept Matrix Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {matrixItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No concepts match current filter.
          </div>
        ) : (
          matrixItems.map(concept => {
            const isSelected = selectedNodeId === concept.id;
            const isJustMutated = lastMutatedId === concept.id;

            return (
              <div
                key={concept.id}
                onClick={() => onSelectNode(concept.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                  isSelected
                    ? 'bg-[#151c2b] border-cyan-500/80 ring-1 ring-cyan-500/40 shadow-lg'
                    : 'bg-[#111622] hover:bg-[#141b29] border-[#222a3a]'
                } ${isJustMutated ? 'ring-2 ring-purple-400 bg-purple-950/30' : ''}`}
              >
                {/* Concept Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-white text-xs truncate max-w-[260px]">
                        {concept.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-mono text-cyan-300 uppercase">
                        {concept.artifactBadge || concept.type}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {concept.hook}
                    </p>

                    {concept.theTwist && (
                      <div className="mt-1 text-[10px] text-amber-300/90 bg-[#161c28] p-1.5 rounded border border-[#232b3b]">
                        <span className="font-bold text-amber-400">Twist: </span>
                        {concept.theTwist}
                      </div>
                    )}
                  </div>

                  {/* Scores Badge */}
                  {concept.scores && (
                    <div className="text-right shrink-0 font-mono text-[10px]">
                      <div className="text-cyan-400 font-bold">★ {concept.scores.potential}/10</div>
                      <div className="text-slate-500 text-[9px]">Potential</div>
                    </div>
                  )}
                </div>

                {/* Feedback badge when mutation just applied */}
                {isJustMutated && (
                  <div className="flex items-center gap-1 text-[10px] text-purple-300 font-mono font-bold animate-pulse">
                    <Check className="w-3 h-3 text-purple-400" />
                    <span>Canvas state updated with {lastMutationType}!</span>
                  </div>
                )}

                {/* Interactive Mutation Action Buttons for THIS Concept */}
                <div className="pt-2 border-t border-[#1e2636] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="uppercase font-semibold">Apply Mutation to Definition:</span>
                    <span className="text-slate-500">Updates canvas node</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {/* 1. Inversion Button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleApplyInversion(concept);
                      }}
                      className="px-2 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-600/40 hover:border-amber-500 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                      title="Inversion: Flip foundational polarity to its exact opposite"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Inversion</span>
                    </button>

                    {/* 2. Compression Button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleApplyCompression(concept);
                      }}
                      className="px-2 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-600/40 hover:border-cyan-500 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                      title="Compression: Strip to zero-dep single-file micro footprint"
                    >
                      <Minimize2 className="w-3 h-3" />
                      <span>Compression</span>
                    </button>

                    {/* 3. Role Swap Button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleApplyRoleSwap(concept);
                      }}
                      className="px-2 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-600/40 hover:border-purple-500 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                      title="Role Swap: Invert user/system agency"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Role Swap</span>
                    </button>
                  </div>

                  {/* Branch as child node option */}
                  {onBranchMutationNode && (
                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                      <span>Branch new connected node:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleBranchAsNewNode(concept, 'inversion');
                          }}
                          className="px-1.5 py-0.5 hover:text-amber-300 hover:bg-amber-950/30 rounded"
                        >
                          + Invert
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleBranchAsNewNode(concept, 'compression');
                          }}
                          className="px-1.5 py-0.5 hover:text-cyan-300 hover:bg-cyan-950/30 rounded"
                        >
                          + Compress
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleBranchAsNewNode(concept, 'role_swap');
                          }}
                          className="px-1.5 py-0.5 hover:text-purple-300 hover:bg-purple-950/30 rounded"
                        >
                          + RoleSwap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-[#090d14] border-t border-[#21262d] flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time canvas mutation engine</span>
        </div>
        <span>Click buttons to mutate concept definition in place</span>
      </div>
    </div>
  );
};
