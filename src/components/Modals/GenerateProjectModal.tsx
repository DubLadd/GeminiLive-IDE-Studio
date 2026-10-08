import React, { useState } from 'react';
import { ProjectFile } from '../../types/ide';
import { Sparkles, Loader2, X, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GenerateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectGenerated: (projectTitle: string, files: ProjectFile[]) => void;
}

export const GenerateProjectModal: React.FC<GenerateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleIdeas = [
    'Interactive 3D wireframe solar system simulation with planetary orbits',
    'Kanban task management board with drag-and-drop and local storage',
    'Retro 8-bit space shooter game with audio synthesizer SFX',
    'Music drum machine and step sequencer with tempo slider',
    'Real-time markdown documentation viewer with table of contents',
  ];

  const handleGenerate = async (targetPrompt: string) => {
    if (!targetPrompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate project: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.files || !Array.isArray(data.files)) {
        throw new Error('Invalid project structure received from Gemini');
      }

      const generatedFiles: ProjectFile[] = data.files.map((f: any, idx: number) => ({
        id: `gen-${idx}-${Date.now()}`,
        name: f.name || `file-${idx}.js`,
        content: f.content || '',
        language: f.language || (f.name?.endsWith('.css') ? 'css' : f.name?.endsWith('.html') ? 'html' : 'javascript'),
      }));

      onProjectGenerated(data.title || 'Generated Project', generatedFiles);
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Project generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] bg-[#0d1117]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/20 rounded-lg text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Generate Project with Gemini</h3>
              <p className="text-xs text-slate-400">Describe what you want to build and Gemini will construct the full multi-file app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-[#21262d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Project Specification / Prompt
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Build an interactive physics simulation with bouncy balls and gravity controls..."
              rows={3}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 resize-none font-sans"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Or pick an inspiration:</span>
            </div>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {sampleIdeas.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="text-left text-xs px-2.5 py-1.5 bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] rounded text-slate-300 hover:text-white transition-colors"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#30363d] bg-[#0d1117]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded hover:bg-[#21262d]"
          >
            Cancel
          </button>
          <button
            onClick={() => handleGenerate(prompt)}
            disabled={!prompt.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-sky-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Architecting Project...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate & Open</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
