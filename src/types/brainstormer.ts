export type BrainstormNodeType =
  | 'spark'
  | 'concept'
  | 'assumption'
  | 'stress_test'
  | 'mutation'
  | 'execution'
  | 'collision'
  | 'prototype'
  | 'hardened'
  | 'scaffold'
  | 'fork'
  | 'vector';

export type ArtifactBadge =
  | 'PROTOTYPE'
  | 'EXPERIMENT'
  | 'PRODUCTION CANDIDATE'
  | 'HARDENED'
  | 'SCAFFOLD'
  | 'SHOOTOUT'
  | 'VECTOR';

export type OperationalMode =
  | 'BUILD'
  | 'LAB'
  | 'SECURITY'
  | 'FACTORY';

export interface BrainstormNodeScores {
  novelty: number;
  utility: number;
  feasibility: number;
  risk: number;
  potential: number;
}

export interface ForkVariant {
  name: string;
  type: 'Minimal' | 'Fast' | 'Experimental';
  tagline: string;
  architecture: string;
}

export interface BrainstormNode {
  id: string;
  type: BrainstormNodeType;
  title: string;
  hook: string;
  theTwist?: string;
  mechanisms?: string[];
  crossIndustryParallel?: string;
  scores?: BrainstormNodeScores;
  artifactBadge?: ArtifactBadge;
  operationalMode?: OperationalMode;
  executionNow?: string;
  executionPrototype?: string;
  executionMoonshot?: string;
  executionVectorHarness?: string;
  forkVariants?: ForkVariant[];
  codeSnippet?: string;
  filesProposed?: string[];
  x: number;
  y: number;
  parentIds?: string[];
  tags?: string[];
}

export interface BrainstormConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface BrainstormSession {
  title: string;
  reframeQuestion?: string;
  nodes: BrainstormNode[];
  connections: BrainstormConnection[];
}

export interface RapidCommand {
  command: string;
  name: string;
  description: string;
  badge?: ArtifactBadge;
  category: 'playground' | 'creative' | 'stress';
}

export const RAPID_COMMANDS: RapidCommand[] = [
  // Coding Partner // Playground Engine Sub-Routines
  {
    command: '!proto',
    name: 'Disposable Lab',
    description: 'In-memory, single-file zero-dependency prototype to validate mechanics instantly',
    badge: 'PROTOTYPE',
    category: 'playground',
  },
  {
    command: '!harden',
    name: 'Security Isolation',
    description: 'Defensive AES-GCM local storage encryption, input sanitization, zero-network isolation',
    badge: 'HARDENED',
    category: 'playground',
  },
  {
    command: '!scaffold',
    name: 'Factory Scaffold',
    description: 'Modular generators, typed shared primitives, state stores & reusable contracts',
    badge: 'SCAFFOLD',
    category: 'playground',
  },
  {
    command: '!fork',
    name: '3-Way Shootout',
    description: 'Fork into 3 competing architectures (Minimal vs Fast vs Experimental) side-by-side',
    badge: 'SHOOTOUT',
    category: 'playground',
  },
  {
    command: '!vector',
    name: 'Execution Vector',
    description: 'Zero-dep single-file runner, Web Worker harness, or offline test harness',
    badge: 'VECTOR',
    category: 'playground',
  },

  // Brainstormer Pro X Creative Catalysts
  { command: '/wild', name: 'Wild Divergence', description: 'Maximum unexpected possibilities', category: 'creative' },
  { command: '/scamper', name: 'SCAMPER', description: 'Systematic mutation & contradiction', category: 'creative' },
  { command: '/triz', name: 'TRIZ Lab', description: 'Attack contradictions', category: 'creative' },
  { command: '/mutate', name: 'Idea Mutation', description: 'Invert, compress, expand', category: 'creative' },
  { command: '/collide', name: 'Concept Collider', description: 'Combine unrelated domains', category: 'creative' },
  { command: '/invert', name: 'Inversion', description: 'Do the exact opposite', category: 'creative' },
  { command: '/extreme', name: 'Extreme Constraint', description: 'Hostile constraint injection', category: 'stress' },
  { command: '/failure', name: 'Failure First', description: 'Pre-mortem destruction test', category: 'stress' },
  { command: '/future', name: 'Future Echo', description: 'Imagine in 2035', category: 'creative' },
  { command: '/assumptions', name: 'Assumption Breaker', description: 'Expose hidden premises', category: 'creative' },
  { command: '/system', name: 'System Architect', description: 'Input, decision, output loops', category: 'creative' },
  { command: '/game', name: 'Game Design Lens', description: 'Progression, agency, unlocks', category: 'creative' },
  { command: '/score', name: 'Score Matrix', description: 'Rank novelty & leverage', category: 'creative' },
  { command: '/mvp', name: 'Execution / MVP', description: 'Now, Next, Moonshot roadmap', category: 'creative' },
];
