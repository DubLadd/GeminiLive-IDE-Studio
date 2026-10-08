import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  Terminal as TerminalIcon,
  ChevronDown,
  Maximize2,
  Minimize2,
  Trash2,
  Play,
  X,
  Sparkles,
  Layers,
  Folder,
  FileCode,
  TerminalSquare,
  CheckCircle2,
  ArrowRight,
  Code
} from 'lucide-react';
import { NanoEditor } from './NanoEditor';
import {
  modeToPermissions,
  executePythonCode,
  executeNodeCode,
} from '../../utils/terminalExecutors';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system';
  text: string;
  promptPrefix?: string;
  timestamp?: string;
}

export interface IntegratedTerminalProps {
  files: ProjectFile[];
  projectName: string;
  isOpen: boolean;
  onToggle: () => void;
  onAskCopilot?: (query: string) => void;
  onTriggerPreviewReload?: () => void;
  onAddFile?: (name: string, language?: ProjectFile['language'], content?: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
  onUpdateContent?: (fileId: string, content: string) => void;
  onUpsertFile?: (name: string, content: string) => void;
  onSelectFile?: (fileId: string) => void;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  files,
  projectName,
  isOpen,
  onToggle,
  onAskCopilot,
  onTriggerPreviewReload,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onUpdateContent,
  onUpsertFile,
  onSelectFile,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'build' | 'output'>('terminal');
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'success' | 'error'>('success');
  const [lastBuildTime, setLastBuildTime] = useState('0.42s');

  // Linux Virtual Environment State
  const [currentDir, setCurrentDir] = useState<string>('~/project');
  const [virtualDirs, setVirtualDirs] = useState<Set<string>>(new Set(['src', 'components', 'styles', 'scripts', 'public']));
  const [filePermissions, setFilePermissions] = useState<Record<string, number>>({
    'index.html': 0o644,
    'style.css': 0o644,
    'app.js': 0o755,
    'package.json': 0o644,
    'README.md': 0o644,
  });
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    SHELL: '/bin/bash',
    USER: 'developer',
    LOGNAME: 'developer',
    HOME: '/home/developer',
    TERM: 'xterm-256color',
    PATH: '/usr/local/bin:/usr/bin:/bin:~/.npm-global/bin',
    NODE_VERSION: 'v22.14.0',
    PYTHON_VERSION: '3.12.2',
    EDITOR: 'nano',
  });

  // Interactive Sub-Shells
  const [replMode, setReplMode] = useState<'bash' | 'python' | 'node'>('bash');
  const [pythonContext, setPythonContext] = useState<Record<string, any>>({});

  // Nano Interactive Mode
  const [nanoState, setNanoState] = useState<{
    isOpen: boolean;
    fileName: string;
    initialContent: string;
  }>({
    isOpen: false,
    fileName: '',
    initialContent: '',
  });

  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'info',
      text: 'Linux sandbox-cloud 6.6.0-x86_64 GNU/Linux (Ubuntu 24.04 LTS)',
    },
    {
      id: 'init-2',
      type: 'info',
      text: 'Gemini Live IDE Extended Linux Terminal Shell (Bash 5.2 / Node.js 22.14 / Python 3.12)',
    },
    {
      id: 'init-3',
      type: 'output',
      text: 'Type "help" for a list of Linux commands (cd, pwd, nano, git clone, curl, wget, python3, npm i, mkdir, rm, rn, chmod, cat).',
    },
  ]);

  const [buildLogs, setBuildLogs] = useState<string[]>([
    '[vite] vite v8.3.0 building for production...',
    'transforming (14) modules...',
    '✓ 14 modules transformed.',
    'dist/index.html                   1.48 kB │ gzip: 0.65 kB',
    'dist/assets/style.css             3.84 kB │ gzip: 1.12 kB',
    'dist/assets/app.js               19.20 kB │ gzip: 5.50 kB',
    '✓ built in 420ms',
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !nanoState.isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [lines, isOpen, activeTab, nanoState.isOpen, replMode]);

  // Compute full virtual Linux path
  const getFullUnixPath = (dir: string): string => {
    if (dir === '~') return '/home/developer';
    if (dir === '~/project') return '/home/developer/project';
    if (dir.startsWith('~/project/')) return '/home/developer/project/' + dir.replace('~/project/', '');
    if (dir === '/') return '/';
    return '/home/developer/project';
  };

  const getPromptPrefix = () => {
    if (replMode === 'python') return '>>> ';
    if (replMode === 'node') return '> ';
    return `developer@sandbox:${currentDir}$ `;
  };

  // Helper to upsert file in IDE workspace
  const handleUpsertWorkspaceFile = (fileName: string, content: string) => {
    if (onUpsertFile) {
      onUpsertFile(fileName, content);
    } else {
      const existing = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
      if (existing && onUpdateContent) {
        onUpdateContent(existing.id, content);
      } else if (onAddFile) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const lang: ProjectFile['language'] =
          ext === 'html'
            ? 'html'
            : ext === 'css'
            ? 'css'
            : ext === 'json'
            ? 'json'
            : ext === 'py'
            ? 'python'
            : ext === 'sh'
            ? 'shell'
            : ext === 'md'
            ? 'markdown'
            : 'javascript';
        onAddFile(fileName, lang, content);
      }
    }
  };

  const runBuildCommand = () => {
    setIsBuilding(true);
    setBuildStatus('building');
    setActiveTab('build');

    const start = performance.now();
    const newLogs: string[] = [
      `[${new Date().toLocaleTimeString()}] npm run build`,
      `> ${projectName.toLowerCase().replace(/\s+/g, '-')}@1.0.0 build`,
      `> vite build`,
      'Compiling workspace files...',
    ];

    files.forEach(f => {
      newLogs.push(`  ✓ ${f.name} (${(f.content.length / 1024).toFixed(2)} kB)`);
    });

    setTimeout(() => {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2) + 's';
      newLogs.push('Optimizing bundle assets with esbuild...');
      newLogs.push('dist/index.html                   1.48 kB');
      newLogs.push(`dist/assets/bundle.js            ${(files.reduce((a, b) => a + b.content.length, 0) / 1024).toFixed(1)} kB`);
      newLogs.push(`✓ Built successfully in ${elapsed}`);

      setBuildLogs(newLogs);
      setIsBuilding(false);
      setBuildStatus('success');
      setLastBuildTime(elapsed);

      setLines(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'success',
          text: `✓ Build completed successfully in ${elapsed} (All ${files.length} files bundled).`,
        },
      ]);
    }, 600);
  };

  // Execute Command Line Handler
  const executeCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to command history
    setHistory(prev => [...prev, trimmed]);
    setHistoryIdx(-1);

    const promptText = getPromptPrefix();
    const userLine: TerminalLine = {
      id: Math.random().toString(),
      type: 'input',
      text: trimmed,
      promptPrefix: promptText,
    };

    // Sub-REPL Modes
    if (replMode === 'python') {
      if (trimmed === 'exit()' || trimmed === 'quit()' || trimmed === 'exit' || trimmed === 'quit') {
        setReplMode('bash');
        setLines(prev => [
          ...prev,
          userLine,
          {
            id: Math.random().toString(),
            type: 'info',
            text: 'Exited Python 3 REPL. Returned to bash.',
          },
        ]);
        setInputVal('');
        return;
      }

      const res = executePythonCode(trimmed, pythonContext);
      setPythonContext(res.updatedVars);

      const outLines: TerminalLine[] = [];
      if (res.outputs.length > 0) {
        outLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: res.outputs.join('\n'),
        });
      }
      if (res.error) {
        outLines.push({
          id: Math.random().toString(),
          type: 'error',
          text: res.error,
        });
      }

      setLines(prev => [...prev, userLine, ...outLines]);
      setInputVal('');
      return;
    }

    if (replMode === 'node') {
      if (trimmed === '.exit' || trimmed === 'exit' || trimmed === 'exit()') {
        setReplMode('bash');
        setLines(prev => [
          ...prev,
          userLine,
          {
            id: Math.random().toString(),
            type: 'info',
            text: 'Exited Node.js REPL. Returned to bash.',
          },
        ]);
        setInputVal('');
        return;
      }

      const res = executeNodeCode(trimmed);
      const outLines: TerminalLine[] = [];
      if (res.outputs.length > 0) {
        outLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: res.outputs.join('\n'),
        });
      }
      if (res.error) {
        outLines.push({
          id: Math.random().toString(),
          type: 'error',
          text: `Uncaught ${res.error}`,
        });
      }

      setLines(prev => [...prev, userLine, ...outLines]);
      setInputVal('');
      return;
    }

    // Standard Bash Execution
    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const outputLines: TerminalLine[] = [];

    switch (command) {
      // 1. PWD (Print Working Directory)
      case 'pwd':
        outputLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: getFullUnixPath(currentDir),
        });
        break;

      // 2. CD (Change Directory)
      case 'cd': {
        const target = args[0];
        if (!target || target === '~' || target === '~/project') {
          setCurrentDir('~/project');
        } else if (target === '/') {
          setCurrentDir('/');
        } else if (target === '..') {
          if (currentDir.startsWith('~/project/')) {
            setCurrentDir('~/project');
          } else if (currentDir === '~/project') {
            setCurrentDir('~');
          } else if (currentDir === '~') {
            setCurrentDir('/');
          }
        } else if (target === '.' || target === './') {
          // Stay in current dir
        } else {
          // Check if target directory exists in virtualDirs or project files prefix
          const cleanTarget = target.replace(/^\.\//, '').replace(/\/$/, '');
          const exists =
            virtualDirs.has(cleanTarget) ||
            files.some(f => f.name.toLowerCase().startsWith(cleanTarget.toLowerCase() + '/'));

          if (exists) {
            setCurrentDir(
              currentDir === '/'
                ? `/${cleanTarget}`
                : `${currentDir}/${cleanTarget}`
            );
          } else {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `bash: cd: ${target}: No such file or directory`,
            });
          }
        }
        break;
      }

      // 3. MKDIR (Make Directory)
      case 'mkdir': {
        if (!args[0]) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'mkdir: missing operand\nTry \'mkdir --help\' for more information.',
          });
        } else {
          const isRecursive = args[0] === '-p';
          const dirName = isRecursive ? args[1] : args[0];
          if (!dirName) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: 'mkdir: missing operand after -p',
            });
          } else {
            const clean = dirName.replace(/\/$/, '');
            setVirtualDirs(prev => new Set([...prev, clean]));
            outputLines.push({
              id: Math.random().toString(),
              type: 'success',
              text: `mkdir: created directory '${clean}'`,
            });
          }
        }
        break;
      }

      // 4. RMDIR (Remove Empty Directory)
      case 'rmdir': {
        const targetDir = args[0];
        if (!targetDir) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'rmdir: missing operand',
          });
        } else {
          const clean = targetDir.replace(/\/$/, '');
          const hasFiles = files.some(f => f.name.startsWith(clean + '/'));
          if (hasFiles) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `rmdir: failed to remove '${clean}': Directory not empty (use 'rm -rf ${clean}')`,
            });
          } else if (virtualDirs.has(clean)) {
            setVirtualDirs(prev => {
              const updated = new Set(prev);
              updated.delete(clean);
              return updated;
            });
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: `removed directory '${clean}'`,
            });
          } else {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `rmdir: failed to remove '${clean}': No such file or directory`,
            });
          }
        }
        break;
      }

      // 5. RM (Remove File or Directory)
      case 'rm': {
        if (!args[0]) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'rm: missing operand\nUsage: rm <filename> or rm -rf <directory>',
          });
          break;
        }

        const isRecursive = args.includes('-r') || args.includes('-rf') || args.includes('-f');
        const target = args.find(a => !a.startsWith('-')) || '';

        if (!target) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'rm: missing file or directory name',
          });
          break;
        }

        // Check if file exists
        const fileMatch = files.find(f => f.name.toLowerCase() === target.toLowerCase());
        if (fileMatch) {
          if (onDeleteFile) {
            onDeleteFile(fileMatch.id);
          }
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `removed '${fileMatch.name}'`,
          });
          break;
        }

        // Check if directory
        if (virtualDirs.has(target)) {
          if (!isRecursive) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `rm: cannot remove '${target}': Is a directory (use -r to remove)`,
            });
          } else {
            // Remove dir and any files inside
            setVirtualDirs(prev => {
              const next = new Set(prev);
              next.delete(target);
              return next;
            });
            files.forEach(f => {
              if (f.name.startsWith(target + '/')) {
                onDeleteFile?.(f.id);
              }
            });
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: `removed directory '${target}' and its contents`,
            });
          }
          break;
        }

        outputLines.push({
          id: Math.random().toString(),
          type: 'error',
          text: `rm: cannot remove '${target}': No such file or directory`,
        });
        break;
      }

      // 6. RN, RENAME, MV (Rename or Move)
      case 'rn':
      case 'rename':
      case 'mv': {
        const oldName = args[0];
        const newName = args[1];

        if (!oldName || !newName) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: `Usage: ${command} <old_name> <new_name>`,
          });
          break;
        }

        const targetFile = files.find(f => f.name.toLowerCase() === oldName.toLowerCase());
        if (targetFile) {
          if (onRenameFile) {
            onRenameFile(targetFile.id, newName);
          }
          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: `renamed '${targetFile.name}' -> '${newName}'`,
          });
        } else if (virtualDirs.has(oldName)) {
          setVirtualDirs(prev => {
            const next = new Set(prev);
            next.delete(oldName);
            next.add(newName);
            return next;
          });
          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: `renamed directory '${oldName}' -> '${newName}'`,
          });
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: `${command}: cannot stat '${oldName}': No such file or directory`,
          });
        }
        break;
      }

      // 7. NANO (In-Terminal GNU Nano Text Editor)
      case 'nano': {
        const targetFilename = args[0] || 'scratch.txt';
        const existing = files.find(f => f.name.toLowerCase() === targetFilename.toLowerCase());
        const initialContent = existing
          ? existing.content
          : targetFilename.endsWith('.html')
          ? '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  <h1>Created with GNU nano</h1>\n</body>\n</html>'
          : targetFilename.endsWith('.py')
          ? '#!/usr/bin/env python3\nprint("Hello from Python 3!")\n'
          : targetFilename.endsWith('.js')
          ? '// JavaScript module\nconsole.log("Ready");\n'
          : '';

        setNanoState({
          isOpen: true,
          fileName: targetFilename,
          initialContent,
        });

        outputLines.push({
          id: Math.random().toString(),
          type: 'info',
          text: `[ Opening GNU nano 7.2 for file '${targetFilename}' ]`,
        });
        break;
      }

      // 8. CHMOD (Change File Permissions)
      case 'chmod': {
        const modeArg = args[0];
        const target = args[1];

        if (!modeArg || !target) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'Usage: chmod <mode> <file>\nExample: chmod 755 run.sh or chmod +x script.js',
          });
          break;
        }

        const fileExists = files.some(f => f.name.toLowerCase() === target.toLowerCase()) || virtualDirs.has(target);
        if (!fileExists) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: `chmod: cannot access '${target}': No such file or directory`,
          });
          break;
        }

        let newMode = 0o644;
        if (/^[0-7]{3,4}$/.test(modeArg)) {
          newMode = parseInt(modeArg, 8);
        } else if (modeArg === '+x') {
          newMode = (filePermissions[target] || 0o644) | 0o111;
        } else if (modeArg === '-x') {
          newMode = (filePermissions[target] || 0o644) & ~0o111;
        } else if (modeArg === '+w') {
          newMode = (filePermissions[target] || 0o644) | 0o222;
        } else if (modeArg === '-w') {
          newMode = (filePermissions[target] || 0o644) & ~0o222;
        }

        setFilePermissions(prev => ({
          ...prev,
          [target]: newMode,
        }));

        outputLines.push({
          id: Math.random().toString(),
          type: 'success',
          text: `mode of '${target}' changed to 0${newMode.toString(8)} (${modeToPermissions(newMode)})`,
        });
        break;
      }

      // 9. GIT CLONE (Clone Git Repositories)
      case 'git': {
        const sub = args[0];
        if (sub === 'clone') {
          const repoUrl = args[1];
          if (!repoUrl) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: 'fatal: You must specify a repository to clone.\nUsage: git clone <repository_url>',
            });
            break;
          }

          // Extract repo name
          const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'cloned-repo';
          outputLines.push({
            id: Math.random().toString(),
            type: 'info',
            text: `Cloning into '${repoName}'...
remote: Enumerating objects: 48, done.
remote: Counting objects: 100% (48/48), done.
remote: Compressing objects: 100% (32/32), done.
remote: Total 48 (delta 16), reused 48 (delta 16), pack-reused 0
Receiving objects: 100% (48/48), 64.20 KiB | 2.85 MiB/s, done.
Resolving deltas: 100% (16/16), done.`,
          });

          // Add cloned files into workspace
          handleUpsertWorkspaceFile(
            `${repoName}/README.md`,
            `# ${repoName}\n\nCloned via Gemini Live IDE Linux Terminal from \`${repoUrl}\`\n\n## Getting Started\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
          );
          handleUpsertWorkspaceFile(
            `${repoName}/index.html`,
            `<!DOCTYPE html>\n<html>\n<head>\n  <title>${repoName}</title>\n</head>\n<body style="font-family: sans-serif; padding: 2rem;">\n  <h1>${repoName}</h1>\n  <p>Cloned from ${repoUrl}</p>\n</body>\n</html>`
          );
          handleUpsertWorkspaceFile(
            `${repoName}/main.js`,
            `console.log("Initialized repository ${repoName}");\n`
          );

          setVirtualDirs(prev => new Set([...prev, repoName]));

          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: `✓ Successfully cloned '${repoName}' into workspace. Files added to project.`,
          });
        } else if (sub === 'status') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges tracked in IDE workspace:\n` +
              files.map(f => `\tmodified:   ${f.name}`).join('\n') +
              `\n\nno untracked files. (use "git commit" to record)`,
          });
        } else if (sub === 'log') {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `commit e4f820c (HEAD -> main)\nAuthor: developer <developer@sandbox.local>\nDate:   ${new Date().toDateString()}\n\n    feat: integrate extended linux terminal engine & nano\n\ncommit 9b2d10a\nDate:   Initial commit`,
          });
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `git ${sub || ''}: executed in virtual repository.`,
          });
        }
        break;
      }

      // 10. CURL & WGET (HTTP Client & Downloaders)
      case 'curl': {
        const urlArg = args.find(a => a.startsWith('http://') || a.startsWith('https://'));
        const isHeadersOnly = args.includes('-I') || args.includes('-i');
        const saveToFileIdx = args.indexOf('-o');
        const saveFilename = saveToFileIdx !== -1 ? args[saveToFileIdx + 1] : null;
        const saveRemoteName = args.includes('-O');

        if (!urlArg) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'curl: try \'curl --help\' for more information\nUsage: curl [options] <url>',
          });
          break;
        }

        outputLines.push({
          id: Math.random().toString(),
          type: 'info',
          text: `[curl] Connecting to ${urlArg}...`,
        });

        try {
          const res = await fetch(urlArg, { method: isHeadersOnly ? 'HEAD' : 'GET' });
          if (isHeadersOnly) {
            const headerLines = [`HTTP/1.1 ${res.status} ${res.statusText}`];
            res.headers.forEach((val, key) => {
              headerLines.push(`${key}: ${val}`);
            });
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: headerLines.join('\n'),
            });
          } else {
            const body = await res.text();
            if (saveFilename || saveRemoteName) {
              const targetName = saveFilename || urlArg.split('/').pop()?.split('?')[0] || 'downloaded_file.txt';
              handleUpsertWorkspaceFile(targetName, body);
              outputLines.push({
                id: Math.random().toString(),
                type: 'success',
                text: `✓ Saved ${body.length} bytes to '${targetName}' in workspace.`,
              });
            } else {
              // Pretty print if JSON
              try {
                const parsed = JSON.parse(body);
                outputLines.push({
                  id: Math.random().toString(),
                  type: 'output',
                  text: JSON.stringify(parsed, null, 2).slice(0, 3000),
                });
              } catch {
                outputLines.push({
                  id: Math.random().toString(),
                  type: 'output',
                  text: body.slice(0, 3000) + (body.length > 3000 ? '\n... [output truncated]' : ''),
                });
              }
            }
          }
        } catch (fetchErr: any) {
          // Fallback simulation for CORS-restricted endpoints
          const simulatedHeaders = [
            `HTTP/2 200 OK`,
            `date: ${new Date().toUTCString()}`,
            `content-type: application/json; charset=utf-8`,
            `server: cloudflare`,
            `content-length: 412`,
            `access-control-allow-origin: *`,
          ];
          if (isHeadersOnly) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: simulatedHeaders.join('\n'),
            });
          } else {
            const targetName = saveFilename || (saveRemoteName ? urlArg.split('/').pop()?.split('?')[0] || 'response.json' : null);
            const mockData = `{\n  "status": "success",\n  "url": "${urlArg}",\n  "timestamp": "${new Date().toISOString()}",\n  "message": "Fetched payload from simulated edge gateway"\n}`;
            if (targetName) {
              handleUpsertWorkspaceFile(targetName, mockData);
              outputLines.push({
                id: Math.random().toString(),
                type: 'success',
                text: `✓ Downloaded and saved '${targetName}' to workspace (${mockData.length} bytes).`,
              });
            } else {
              outputLines.push({
                id: Math.random().toString(),
                type: 'output',
                text: mockData,
              });
            }
          }
        }
        break;
      }

      case 'wget': {
        const urlArg = args.find(a => a.startsWith('http://') || a.startsWith('https://'));
        if (!urlArg) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'wget: missing URL\nUsage: wget <url>',
          });
          break;
        }

        const fileName = urlArg.split('/').pop()?.split('?')[0] || 'downloaded.html';
        const simulatedLog = `--${new Date().toISOString().replace('T', ' ').slice(0, 19)}--  ${urlArg}
Resolving host... connected.
HTTP request sent, awaiting response... 200 OK
Length: 2048 (2.0K) [text/html]
Saving to: '${fileName}'

${fileName}         100%[===================>]   2.00K  --.-KB/s    in 0.002s

${new Date().toISOString().replace('T', ' ').slice(0, 19)} (1.02 MB/s) - '${fileName}' saved [2048/2048]`;

        handleUpsertWorkspaceFile(
          fileName,
          `<!-- Downloaded via wget from ${urlArg} -->\n<!DOCTYPE html>\n<html>\n<head><title>${fileName}</title></head>\n<body>\n  <h2>Downloaded asset: ${fileName}</h2>\n</body>\n</html>`
        );

        outputLines.push({
          id: Math.random().toString(),
          type: 'success',
          text: simulatedLog,
        });
        break;
      }

      // 11. PYTHON3 & PYTHON (Interactive REPL & Script Execution)
      case 'python3':
      case 'python': {
        const scriptFile = args[0];
        if (!scriptFile) {
          // Enter interactive Python REPL
          setReplMode('python');
          outputLines.push({
            id: Math.random().toString(),
            type: 'info',
            text: `Python 3.12.2 (main, Feb 24 2026, 14:28:10) [Clang 17.0.6] on linux
Type "help", "copyright", "credits" or "license" for more information.
Use exit() or quit() to return to bash.`,
          });
        } else {
          // Execute python file
          const file = files.find(f => f.name.toLowerCase() === scriptFile.toLowerCase());
          if (!file) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `python3: can't open file '${scriptFile}': [Errno 2] No such file or directory`,
            });
          } else {
            const res = executePythonCode(file.content);
            if (res.outputs.length > 0) {
              outputLines.push({
                id: Math.random().toString(),
                type: 'output',
                text: res.outputs.join('\n'),
              });
            }
            if (res.error) {
              outputLines.push({
                id: Math.random().toString(),
                type: 'error',
                text: res.error,
              });
            }
          }
        }
        break;
      }

      // 12. NODE & NODEJS (Interactive REPL & Script Execution)
      case 'node':
      case 'nodejs': {
        const scriptFile = args[0];
        if (!scriptFile) {
          // Enter interactive Node REPL
          setReplMode('node');
          outputLines.push({
            id: Math.random().toString(),
            type: 'info',
            text: `Welcome to Node.js v22.14.0.
Type ".exit" or "exit" to return to bash.`,
          });
        } else {
          // Execute js file
          const file = files.find(f => f.name.toLowerCase() === scriptFile.toLowerCase());
          if (!file) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `node: Cannot find module '${scriptFile}'`,
            });
          } else {
            const res = executeNodeCode(file.content);
            if (res.outputs.length > 0) {
              outputLines.push({
                id: Math.random().toString(),
                type: 'output',
                text: res.outputs.join('\n'),
              });
            }
            if (res.error) {
              outputLines.push({
                id: Math.random().toString(),
                type: 'error',
                text: `Uncaught ${res.error}`,
              });
            }
          }
        }
        break;
      }

      // 13. NPM (Install Packages & Run Scripts)
      case 'npm': {
        const npmAction = args[0];
        if (npmAction === 'i' || npmAction === 'install') {
          const packages = args.slice(1).filter(p => !p.startsWith('-'));
          const targetPkgs = packages.length > 0 ? packages : ['dependencies'];

          // Add to package.json in workspace
          const pkgJson = files.find(f => f.name === 'package.json');
          let parsedPkg: any = {
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            dependencies: {},
          };

          if (pkgJson) {
            try {
              parsedPkg = JSON.parse(pkgJson.content);
            } catch {
              // fallback
            }
          }

          if (!parsedPkg.dependencies) parsedPkg.dependencies = {};
          targetPkgs.forEach(pkg => {
            parsedPkg.dependencies[pkg] = '^1.0.0';
          });

          handleUpsertWorkspaceFile('package.json', JSON.stringify(parsedPkg, null, 2));

          outputLines.push({
            id: Math.random().toString(),
            type: 'success',
            text: targetPkgs
              .map(p => `+ ${p}@1.0.0`)
              .join('\n') +
              `\nadded ${targetPkgs.length} package${targetPkgs.length > 1 ? 's' : ''}, and audited ${files.length + 24} packages in 1.18s\nfound 0 vulnerabilities (updated package.json)`,
          });
        } else if (npmAction === 'run') {
          const script = args[1];
          if (script === 'build') {
            runBuildCommand();
            return;
          } else if (script === 'dev') {
            onTriggerPreviewReload?.();
            outputLines.push({
              id: Math.random().toString(),
              type: 'success',
              text: `[vite] Dev server refreshed. Live sandbox reload dispatched.`,
            });
          } else if (script === 'test') {
            outputLines.push({
              id: Math.random().toString(),
              type: 'info',
              text: `> test\n> Running automated test suite for "${projectName}"...\n  ✓ HTML Structure Validation passed\n  ✓ CSS Syntax & Rules parsed cleanly\n  ✓ JavaScript Entry Point verified\nAll test suites passed (3/3).`,
            });
          } else if (script === 'lint') {
            outputLines.push({
              id: Math.random().toString(),
              type: 'success',
              text: `✓ No ESLint or TypeScript warnings found across ${files.length} files.`,
            });
          } else {
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: `Unknown script: "${script}". Try "npm run build" or "npm run dev".`,
            });
          }
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: `npm ${npmAction || ''}: command acknowledged. Try "npm install <pkg>" or "npm run build".`,
          });
        }
        break;
      }

      // 14. CAT (Concatenate & Print)
      case 'cat': {
        const hasLineNums = args.includes('-n');
        const filename = args.find(a => !a.startsWith('-'));

        if (!filename) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'cat: missing filename\nUsage: cat [-n] <filename>',
          });
        } else {
          const file = files.find(f => f.name.toLowerCase() === filename.toLowerCase());
          if (file) {
            if (hasLineNums) {
              const numbered = file.content
                .split('\n')
                .map((line, idx) => `     ${(idx + 1).toString().padStart(3, ' ')}  ${line}`)
                .join('\n');
              outputLines.push({
                id: Math.random().toString(),
                type: 'output',
                text: numbered,
              });
            } else {
              outputLines.push({
                id: Math.random().toString(),
                type: 'output',
                text: file.content,
              });
            }
          } else {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `cat: ${filename}: No such file or directory`,
            });
          }
        }
        break;
      }

      // 15. TOUCH (Create / Update File)
      case 'touch': {
        const filename = args[0];
        if (!filename) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'touch: missing file operand\nUsage: touch <filename>',
          });
        } else {
          const existing = files.find(f => f.name.toLowerCase() === filename.toLowerCase());
          if (!existing) {
            handleUpsertWorkspaceFile(filename, '');
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: `created empty file '${filename}'`,
            });
          }
        }
        break;
      }

      // 16. LS & DIR (List Directory Contents)
      case 'ls':
      case 'dir': {
        const isLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');

        if (isLong) {
          const rows: string[] = [];
          rows.push(`total ${files.length + virtualDirs.size + 2}`);

          if (showAll) {
            rows.push(`drwxr-xr-x 2 developer developer 4096 ${new Date().toDateString().slice(4, 10)} .`);
            rows.push(`drwxr-xr-x 4 developer developer 4096 ${new Date().toDateString().slice(4, 10)} ..`);
          }

          // Virtual Directories
          Array.from(virtualDirs).forEach(dir => {
            rows.push(`drwxr-xr-x 2 developer developer 4096 ${new Date().toDateString().slice(4, 10)} ${dir}/`);
          });

          // Files
          files.forEach(f => {
            const mode = filePermissions[f.name] || (f.name.endsWith('.js') || f.name.endsWith('.sh') ? 0o755 : 0o644);
            const perms = modeToPermissions(mode);
            const size = f.content.length.toString().padStart(6, ' ');
            rows.push(`${perms} 1 developer developer ${size} ${new Date().toDateString().slice(4, 10)} ${f.name}`);
          });

          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: rows.join('\n'),
          });
        } else {
          const dirEntries = Array.from(virtualDirs).map(d => `${d}/`);
          const fileEntries = files.map(f => f.name);
          const allEntries = [...dirEntries, ...fileEntries];
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: allEntries.join('    '),
          });
        }
        break;
      }

      // 17. GREP, HEAD, TAIL, WC, CP
      case 'grep': {
        const pattern = args[0];
        const filename = args[1];
        if (!pattern || !filename) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'error',
            text: 'Usage: grep <pattern> <filename>',
          });
        } else {
          const file = files.find(f => f.name.toLowerCase() === filename.toLowerCase());
          if (!file) {
            outputLines.push({
              id: Math.random().toString(),
              type: 'error',
              text: `grep: ${filename}: No such file or directory`,
            });
          } else {
            const matched = file.content
              .split('\n')
              .filter(line => line.toLowerCase().includes(pattern.toLowerCase()));
            outputLines.push({
              id: Math.random().toString(),
              type: 'output',
              text: matched.length > 0 ? matched.join('\n') : `(No occurrences of "${pattern}" found)`,
            });
          }
        }
        break;
      }

      case 'head': {
        const filename = args.find(a => !a.startsWith('-'));
        const file = files.find(f => f.name.toLowerCase() === filename?.toLowerCase());
        if (file) {
          const top10 = file.content.split('\n').slice(0, 10).join('\n');
          outputLines.push({ id: Math.random().toString(), type: 'output', text: top10 });
        } else {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: `head: cannot open '${filename}'` });
        }
        break;
      }

      case 'tail': {
        const filename = args.find(a => !a.startsWith('-'));
        const file = files.find(f => f.name.toLowerCase() === filename?.toLowerCase());
        if (file) {
          const linesArr = file.content.split('\n');
          const bottom10 = linesArr.slice(Math.max(0, linesArr.length - 10)).join('\n');
          outputLines.push({ id: Math.random().toString(), type: 'output', text: bottom10 });
        } else {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: `tail: cannot open '${filename}'` });
        }
        break;
      }

      case 'wc': {
        const filename = args[0];
        const file = files.find(f => f.name.toLowerCase() === filename?.toLowerCase());
        if (file) {
          const lineCount = file.content.split('\n').length;
          const wordCount = file.content.trim().split(/\s+/).filter(Boolean).length;
          const byteCount = file.content.length;
          outputLines.push({
            id: Math.random().toString(),
            type: 'output',
            text: ` ${lineCount.toString().padStart(4)}  ${wordCount.toString().padStart(4)}  ${byteCount.toString().padStart(5)} ${file.name}`,
          });
        } else {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: `wc: ${filename}: No such file` });
        }
        break;
      }

      case 'cp': {
        const src = args[0];
        const dest = args[1];
        if (!src || !dest) {
          outputLines.push({ id: Math.random().toString(), type: 'error', text: 'Usage: cp <source> <destination>' });
        } else {
          const srcFile = files.find(f => f.name.toLowerCase() === src.toLowerCase());
          if (srcFile) {
            handleUpsertWorkspaceFile(dest, srcFile.content);
            outputLines.push({ id: Math.random().toString(), type: 'output', text: `copied '${src}' -> '${dest}'` });
          } else {
            outputLines.push({ id: Math.random().toString(), type: 'error', text: `cp: cannot stat '${src}': No such file` });
          }
        }
        break;
      }

      // 18. SYSTEM UTILITIES (whoami, uname, uptime, date, echo, env, export, clear)
      case 'whoami':
        outputLines.push({ id: Math.random().toString(), type: 'output', text: envVars.USER });
        break;

      case 'uname':
        outputLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: 'Linux sandbox-cloud 6.6.0-x86_64 #1 SMP PREEMPT GNU/Linux',
        });
        break;

      case 'uptime':
        outputLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: ` 19:22:40 up 4:18,  1 user,  load average: 0.08, 0.04, 0.01`,
        });
        break;

      case 'date':
        outputLines.push({ id: Math.random().toString(), type: 'output', text: new Date().toString() });
        break;

      case 'echo':
        outputLines.push({ id: Math.random().toString(), type: 'output', text: args.join(' ') });
        break;

      case 'env':
      case 'printenv':
        outputLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: Object.entries(envVars)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n'),
        });
        break;

      case 'export': {
        const expr = args.join(' ');
        const [k, v] = expr.split('=');
        if (k && v) {
          setEnvVars(prev => ({ ...prev, [k.trim()]: v.trim() }));
          outputLines.push({ id: Math.random().toString(), type: 'output', text: `set ${k.trim()}=${v.trim()}` });
        }
        break;
      }

      case 'history':
        outputLines.push({
          id: Math.random().toString(),
          type: 'output',
          text: history.map((h, i) => ` ${(i + 1).toString().padStart(4)}  ${h}`).join('\n'),
        });
        break;

      case 'clear':
      case 'cls':
        setLines([]);
        setInputVal('');
        return;

      // 19. COPILOT & BRAINSTORMER COMMANDS
      case 'ai':
      case 'gemini': {
        const query = args.join(' ');
        if (!query) {
          outputLines.push({
            id: Math.random().toString(),
            type: 'info',
            text: 'Usage: ai <your coding question or task description>',
          });
        } else {
          outputLines.push({
            id: Math.random().toString(),
            type: 'info',
            text: `Dispatching request to Gemini Live Copilot: "${query}"`,
          });
          onAskCopilot?.(query);
        }
        break;
      }

      case '!proto':
      case 'proto':
        outputLines.push({
          id: Math.random().toString(),
          type: 'success',
          text: `[PLAYGROUND ENGINE // !proto] Disposable Lab Invoked:
  ✓ Mode: In-Memory / Zero-Dependency Prototype
  ✓ Runtime: Native Web APIs & Pure Algorithmic State
  ✓ Sending generation vector to Gemini Live Copilot...`,
        });
        onAskCopilot?.('!proto Spin up an in-memory zero-dependency prototype in one file.');
        break;

      case '!harden':
      case 'harden':
        outputLines.push({
          id: Math.random().toString(),
          type: 'success',
          text: `[SECURITY ENGINE // !harden] Defensive Hardening Audit:
  ✓ WebCrypto AES-GCM Local Storage Vault: Active
  ✓ Input Sanitization Boundaries: Active
  ✓ Memory Space: Scoped & Isolated`,
        });
        onAskCopilot?.('!harden Audit code and apply WebCrypto AES-GCM encryption and zero-network isolation.');
        break;

      case '!scaffold':
      case 'scaffold':
        outputLines.push({
          id: Math.random().toString(),
          type: 'success',
          text: `[FACTORY ENGINE // !scaffold] Modular Scaffolding:
  ✓ Primitives Generated: Typed EventBus, Reactive Store, Vector2D
  ✓ Software Machinery: Reusable Component Contracts`,
        });
        onAskCopilot?.('!scaffold Create factory modular scaffolding and typed store primitives.');
        break;

      // 20. HELP MANUAL
      case 'help':
      case 'man':
        outputLines.push({
          id: Math.random().toString(),
          type: 'info',
          text: `Extended Linux Shell Commands (GNU Coreutils Emulation):
  Navigation & Dirs:
    pwd                      - Print current working directory
    cd <path>                - Change directory (cd .., cd ~, cd src, cd /)
    mkdir [-p] <dir>         - Create virtual directory
    rmdir <dir>              - Remove empty directory
    ls [-la]                 - List files & folders with Unix permissions & sizes

  File Manipulation:
    nano <filename>          - Open interactive GNU nano 7.2 editor with shortcuts
    touch <filename>         - Create empty file or update timestamp
    cat [-n] <filename>      - Display file content (with line numbers)
    rm [-rf] <target>        - Remove file or directory from workspace
    rn / mv <old> <new>      - Rename or move file / directory
    cp <src> <dest>          - Copy file in workspace
    chmod <mode> <file>      - Change permissions (chmod 755 app.js, chmod +x script.sh)

  Runtime Environments:
    python3 / python [file]  - Launch interactive Python 3 REPL or run python script
    node / nodejs [file]     - Launch interactive Node.js REPL or run JS file
    npm i <pkg>              - Install package into package.json
    npm run build / dev      - Build production bundle or refresh live preview sandbox

  Networking & VCS:
    git clone <repo_url>     - Clone git repo with object transfer animation into files
    git status / log         - Check repository working tree and commit history
    curl [-I / -O / -o] <url>- Fetch HTTP URL, view headers or save payload
    wget <url>               - Download remote resource to workspace with progress bar

  Utilities & System:
    grep <pattern> <file>    - Search text in file
    head / tail <file>       - View first or last 10 lines of file
    wc <file>                - Count lines, words, and characters
    whoami, uname, uptime    - Display system identity and runtime uptime
    env, export <KEY>=<VAL>  - Inspect and configure environment variables
    clear, history           - Clear terminal or view past commands
    ai <query>               - Query Gemini Copilot directly from the terminal`,
        });
        break;

      default:
        outputLines.push({
          id: Math.random().toString(),
          type: 'error',
          text: `bash: ${command}: command not found. Type "help" for a list of available Linux commands.`,
        });
        break;
    }

    setLines(prev => [...prev, userLine, ...outputLines]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx] || '');
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      if (replMode !== 'bash') {
        setReplMode('bash');
        setLines(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'info',
            text: '^C\nKeyboardInterrupt: Exited REPL. Returned to bash.',
          },
        ]);
        setInputVal('');
      } else {
        setLines(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'output',
            text: `${getPromptPrefix()}${inputVal}^C`,
          },
        ]);
        setInputVal('');
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setLines([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`border-t border-[#30363d] bg-[#0d1117] flex flex-col transition-all duration-200 select-none z-30 ${
        isMaximized ? 'h-[440px]' : 'h-[250px]'
      }`}
    >
      {/* Terminal Titlebar & Tabs */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-300 mr-2">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">LINUX TERMINAL</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700">
              {replMode === 'python' ? 'Python 3.12' : replMode === 'node' ? 'Node v22' : 'bash 5.2'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded border border-[#21262d]">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors flex items-center gap-1 ${
                activeTab === 'terminal'
                  ? 'bg-[#21262d] text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TerminalSquare className="w-3 h-3 text-emerald-400" />
              <span>Shell</span>
              {nanoState.isOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                activeTab === 'build'
                  ? 'bg-[#21262d] text-sky-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Build</span>
              {buildStatus === 'success' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                activeTab === 'output'
                  ? 'bg-[#21262d] text-sky-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Diagnostics
            </button>
          </div>
        </div>

        {/* Right Terminal Action Controls */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={runBuildCommand}
            disabled={isBuilding}
            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] transition-colors disabled:opacity-50"
            title="Trigger production build"
          >
            <Play className="w-2.5 h-2.5 fill-emerald-300" />
            <span>{isBuilding ? 'Building...' : 'Run Build'}</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'terminal') setLines([]);
              else if (activeTab === 'build') setBuildLogs([]);
            }}
            className="p-1 hover:text-slate-200 hover:bg-[#21262d] rounded transition-colors"
            title="Clear terminal screen (Ctrl+L)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMaximized(prev => !prev)}
            className="p-1 hover:text-slate-200 hover:bg-[#21262d] rounded transition-colors"
            title={isMaximized ? 'Restore Size' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggle}
            className="p-1 hover:text-slate-200 hover:bg-[#21262d] rounded transition-colors"
            title="Collapse Terminal"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Terminal Shell or Nano Editor */}
      {activeTab === 'terminal' && (
        <div className="flex-1 flex flex-col bg-[#090d16] overflow-hidden relative">
          {/* If Nano Mode is active */}
          {nanoState.isOpen ? (
            <NanoEditor
              fileName={nanoState.fileName}
              initialContent={nanoState.initialContent}
              onSave={(savedName, savedContent) => {
                handleUpsertWorkspaceFile(savedName, savedContent);
                setLines(prev => [
                  ...prev,
                  {
                    id: Math.random().toString(),
                    type: 'success',
                    text: `[ GNU nano: File '${savedName}' written to workspace (${savedContent.length} bytes) ]`,
                  },
                ]);
              }}
              onExit={saved => {
                setNanoState({ isOpen: false, fileName: '', initialContent: '' });
                setLines(prev => [
                  ...prev,
                  {
                    id: Math.random().toString(),
                    type: 'info',
                    text: `[ Closed GNU nano editor for ${nanoState.fileName} ]`,
                  },
                ]);
              }}
            />
          ) : (
            /* Interactive Shell View */
            <div
              onClick={() => inputRef.current?.focus()}
              className="flex-1 flex flex-col p-2.5 overflow-hidden font-mono text-xs cursor-text select-text"
            >
              {/* Output History List */}
              <div className="flex-1 overflow-y-auto space-y-1 mb-1">
                {lines.map(line => (
                  <div key={line.id} className="leading-relaxed">
                    {line.type === 'input' ? (
                      <div className="flex items-center gap-1.5 text-slate-200 flex-wrap">
                        <span className="text-emerald-400 font-semibold select-none">
                          {line.promptPrefix || getPromptPrefix()}
                        </span>
                        <span className="text-slate-100">{line.text}</span>
                      </div>
                    ) : (
                      <div
                        className={`whitespace-pre-wrap break-all ${
                          line.type === 'error'
                            ? 'text-rose-400'
                            : line.type === 'success'
                            ? 'text-emerald-400'
                            : line.type === 'info'
                            ? 'text-sky-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {line.text}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Quick Linux Command Shortcut Chips */}
              <div className="flex items-center gap-1 py-1 overflow-x-auto no-scrollbar border-t border-[#1e293b] select-none text-[10px]">
                <span className="text-slate-500 uppercase tracking-wider text-[9px] mr-1 shrink-0">Quick:</span>
                {[
                  { label: 'ls -la', cmd: 'ls -la' },
                  { label: 'pwd', cmd: 'pwd' },
                  { label: 'nano index.html', cmd: 'nano index.html' },
                  { label: 'python3', cmd: 'python3' },
                  { label: 'node', cmd: 'node' },
                  { label: 'npm i lodash', cmd: 'npm i lodash' },
                  { label: 'git status', cmd: 'git status' },
                  { label: 'curl -I https://api.github.com', cmd: 'curl -I https://api.github.com' },
                  { label: 'chmod +x', cmd: 'chmod +x app.js' },
                  { label: 'clear', cmd: 'clear' },
                  { label: 'help', cmd: 'help' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setInputVal(item.cmd);
                      executeCommand(item.cmd);
                    }}
                    className="px-1.5 py-0.5 bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-emerald-300 rounded border border-[#30363d] transition-colors shrink-0"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Active Command Input Line */}
              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <span className="text-emerald-400 font-semibold shrink-0 select-none">
                  {getPromptPrefix()}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck="false"
                  className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-xs caret-emerald-400"
                  placeholder={replMode === 'python' ? 'print(2 + 2)' : replMode === 'node' ? 'console.log("hello")' : 'type command...'}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Build Logs */}
      {activeTab === 'build' && (
        <div className="flex-1 flex flex-col bg-[#090d16] p-3 overflow-y-auto font-mono text-xs select-text">
          <div className="flex items-center justify-between pb-2 border-b border-[#21262d] mb-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              {buildStatus === 'building' ? (
                <span className="text-amber-400 font-bold animate-pulse">BUILDING...</span>
              ) : (
                <span className="text-emerald-400 font-bold">SUCCESS (ready for distribution)</span>
              )}
            </div>
            <div className="text-slate-500">
              Build Duration: <span className="text-slate-300">{lastBuildTime}</span>
            </div>
          </div>

          <div className="space-y-1 text-slate-300">
            {buildLogs.map((log, i) => (
              <div
                key={i}
                className={`${
                  log.startsWith('✓') ? 'text-emerald-400' : log.includes('error') ? 'text-rose-400' : ''
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: System Status & Diagnostic Overview */}
      {activeTab === 'output' && (
        <div className="flex-1 bg-[#090d16] p-4 text-xs font-mono text-slate-300 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">OS Distribution</div>
              <div className="text-slate-100 font-semibold truncate mt-0.5">Ubuntu 24.04 (Linux 6.6)</div>
            </div>
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Current Directory</div>
              <div className="text-emerald-400 font-semibold truncate mt-0.5">{getFullUnixPath(currentDir)}</div>
            </div>
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Active Workspace Files</div>
              <div className="text-slate-100 font-semibold mt-0.5">{files.length} files</div>
            </div>
            <div className="p-2.5 bg-[#161b22] border border-[#21262d] rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Node / Python Runtimes</div>
              <div className="text-sky-400 font-semibold mt-0.5">v22.14 / 3.12.2 Active</div>
            </div>
          </div>

          <div className="text-slate-400 text-[11px] leading-relaxed space-y-1.5">
            <p>
              Simulated Linux Environment with real workspace synchronization.
              Files modified via <code className="text-emerald-400">nano</code>, <code className="text-emerald-400">touch</code>, <code className="text-emerald-400">rm</code>, <code className="text-emerald-400">rn</code>, <code className="text-emerald-400">git clone</code>, <code className="text-emerald-400">wget</code>, and <code className="text-emerald-400">npm install</code> directly sync with the IDE file tree and live preview.
            </p>
            <p>
              Tip: Press <code className="text-sky-300">Ctrl+C</code> in Python or Node REPL to return to bash shell prompt at any time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
