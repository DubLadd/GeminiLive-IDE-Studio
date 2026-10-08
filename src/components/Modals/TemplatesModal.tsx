import React from 'react';
import { STARTER_TEMPLATES } from '../../data/templates';
import { ProjectTemplate } from '../../types/ide';
import { X, Sparkles, Gamepad2, BarChart2, FolderCode } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-pink-400" />;
      case 'BarChart2':
        return <BarChart2 className="w-5 h-5 text-amber-400" />;
      default:
        return <FolderCode className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] bg-[#0d1117]">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Choose Project Template</h3>
            <p className="text-xs text-slate-400">Load a battle-tested interactive starter project into your IDE</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-[#21262d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {STARTER_TEMPLATES.map(tpl => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl);
                onClose();
              }}
              className="group p-4 bg-[#0d1117] hover:bg-[#21262d] border border-[#21262d] hover:border-sky-500/50 rounded-lg cursor-pointer transition-all flex items-start gap-3.5"
            >
              <div className="p-2.5 bg-[#161b22] group-hover:bg-[#30363d] rounded-lg transition-colors">
                {renderIcon(tpl.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-200 text-sm group-hover:text-sky-300 transition-colors">
                    {tpl.title}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {tpl.files.length} files
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
