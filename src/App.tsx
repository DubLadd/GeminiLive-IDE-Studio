/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProjectFile, ProjectTemplate } from './types/ide';
import { GalleryApp } from './types/gallery';
import { STARTER_TEMPLATES } from './data/templates';
import { TopBar } from './components/Navbar/TopBar';
import { FileTree } from './components/Sidebar/FileTree';
import { CodeEditor } from './components/Editor/CodeEditor';
import { GeminiCopilot } from './components/Copilot/GeminiCopilot';
import { LivePreview } from './components/Preview/LivePreview';
import { IntegratedTerminal } from './components/Terminal/IntegratedTerminal';
import { BrainstormerCanvas } from './components/Brainstormer/BrainstormerCanvas';
import { GenerateProjectModal } from './components/Modals/GenerateProjectModal';
import { TemplatesModal } from './components/Modals/TemplatesModal';
import { AppGalleryModal } from './components/Modals/AppGalleryModal';
import { GeminiAppRail, GeminiNavMode } from './components/Navigation/GeminiAppRail';
import { GeminiAgentCanvas } from './components/Agent/GeminiAgentCanvas';
import { GitHubHub } from './components/GitHub/GitHubHub';
import { formatCode } from './utils/codeFormatter';
import { inlineProjectToHtml, downloadAppAsHtml } from './utils/appGalleryStorage';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  db,
  setDoc,
  doc
} from './lib/firebase';
import { X, Plus, Sparkles, Wand2, Terminal, Upload, Download, Brain, LayoutGrid, FileUp, Cloud, Github } from 'lucide-react';

export default function App() {
  const initialTemplate = STARTER_TEMPLATES[0];

  const [projectName, setProjectName] = useState(initialTemplate.title);
  const [files, setFiles] = useState<ProjectFile[]>(initialTemplate.files);
  const [activeFileId, setActiveFileId] = useState<string>(initialTemplate.files[0].id);
  const [openTabIds, setOpenTabIds] = useState<string[]>(
    initialTemplate.files.map(f => f.id)
  );

  // Layout panels & view mode
  const [viewMode, setViewMode] = useState<'agent' | 'ide' | 'canvas' | 'split' | 'brainstorm' | 'terminal'>('agent');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [showCopilot, setShowCopilot] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [isGitHubHubOpen, setIsGitHubHubOpen] = useState(false);

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);

  // Modals & Triggers
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [externalCopilotPrompt, setExternalCopilotPrompt] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Concept node seeding for Brainstormer
  const [seedConceptForBrainstormer, setSeedConceptForBrainstormer] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Firebase Auth Observer & profile sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await setDoc(
            doc(db, 'users', currentUser.uid),
            {
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err: any) {
          console.warn('User profile sync notice:', err.message);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      showToast(`Welcome, ${res.user.displayName || res.user.email}! Firestore connected.`);
    } catch (err: any) {
      showToast(`Sign in error: ${err.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('Signed out of Firebase.');
    } catch (err: any) {
      showToast(`Sign out error: ${err.message}`);
    }
  };

  // Format code in the active file using lightweight regex/state-machine formatter
  const handleFormatActiveFile = () => {
    if (!activeFile) return;
    const formatted = formatCode(activeFile.content, activeFile.language);
    handleUpdateContent(formatted);
    showToast(`Formatted ${activeFile.name}`);
  };

  // Switch or open file in tabs
  const handleSelectFile = (fileId: string) => {
    setActiveFileId(fileId);
    if (!openTabIds.includes(fileId)) {
      setOpenTabIds(prev => [...prev, fileId]);
    }
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabIds.filter(id => id !== tabId);
    setOpenTabIds(nextTabs);
    if (activeFileId === tabId && nextTabs.length > 0) {
      setActiveFileId(nextTabs[nextTabs.length - 1]);
    }
  };

  // Update file content
  const handleUpdateContent = (newContent: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );
  };

  // Create new file
  const handleAddFile = (name: string, language?: ProjectFile['language'], content?: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const resolvedLang: ProjectFile['language'] = language || (
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
        : 'javascript'
    );

    const initialContent = content !== undefined
      ? content
      : resolvedLang === 'html'
      ? '<!DOCTYPE html>\n<html>\n<head>\n  <title>New File</title>\n</head>\n<body>\n</body>\n</html>'
      : resolvedLang === 'css'
      ? '/* Stylesheet */\n'
      : resolvedLang === 'python'
      ? '#!/usr/bin/env python3\n'
      : resolvedLang === 'json'
      ? '{\n  \n}\n'
      : '// JavaScript code\n';

    const newFile: ProjectFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      content: initialContent,
      language: resolvedLang,
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setOpenTabIds(prev => [...prev, newFile.id]);
    showToast(`Created ${name}`);
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    const updated = files.filter(f => f.id !== fileId);
    setFiles(updated);
    setOpenTabIds(prev => prev.filter(id => id !== fileId));
    if (activeFileId === fileId && updated.length > 0) {
      setActiveFileId(updated[0].id);
    }
    showToast('File deleted');
  };

  // Rename file
  const handleRenameFile = (fileId: string, newName: string) => {
    const ext = newName.split('.').pop()?.toLowerCase();
    const language: ProjectFile['language'] =
      ext === 'html'
        ? 'html'
        : ext === 'css'
        ? 'css'
        : ext === 'json'
        ? 'json'
        : ext === 'md'
        ? 'markdown'
        : 'javascript';

    setFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, name: newName, language } : f
      )
    );
    showToast(`Renamed to ${newName}`);
  };

  // Upsert file (used by terminal, nano, git clone, wget, etc.)
  const handleUpsertFile = (name: string, content: string) => {
    let target = files.find(f => f.name.toLowerCase() === name.toLowerCase());

    if (target) {
      setFiles(prev =>
        prev.map(f => (f.id === target!.id ? { ...f, content } : f))
      );
      showToast(`Updated ${name}`);
    } else {
      const ext = name.split('.').pop()?.toLowerCase();
      const language: ProjectFile['language'] =
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

      const created: ProjectFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        content,
        language,
      };
      setFiles(prev => [...prev, created]);
      setActiveFileId(created.id);
      setOpenTabIds(prev => (prev.includes(created.id) ? prev : [...prev, created.id]));
      showToast(`Created ${name}`);
    }
  };

  // Apply proposed changes from Copilot
  const handleApplyFileChanges = (fileName: string, newContent: string) => {
    let target = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());

    if (target) {
      setFiles(prev =>
        prev.map(f => (f.id === target!.id ? { ...f, content: newContent } : f))
      );
      setActiveFileId(target.id);
      if (!openTabIds.includes(target.id)) {
        setOpenTabIds(prev => [...prev, target.id]);
      }
    } else {
      // Create new file
      const ext = fileName.split('.').pop()?.toLowerCase();
      const language: ProjectFile['language'] =
        ext === 'html'
          ? 'html'
          : ext === 'css'
          ? 'css'
          : ext === 'json'
          ? 'json'
          : 'javascript';

      const created: ProjectFile = {
        id: `file-${Date.now()}`,
        name: fileName,
        content: newContent,
        language,
      };
      setFiles(prev => [...prev, created]);
      setActiveFileId(created.id);
      setOpenTabIds(prev => [...prev, created.id]);
    }

    showToast(`Updated ${fileName}`);
  };

  // Fix error triggered from preview console
  const handleFixErrorWithAI = (errorMessage: string) => {
    setShowCopilot(true);
    setExternalCopilotPrompt(
      `Fix this runtime error reported in console:\n"${errorMessage}"\n\nPlease examine our project files and provide the corrected code.`
    );
  };

  // Ask Copilot about highlighted code
  const handleAskCopilot = (selectedCode: string) => {
    setShowCopilot(true);
    setExternalCopilotPrompt(
      `Please explain and review this selected code from ${activeFile.name}:\n\`\`\`${activeFile.language}\n${selectedCode}\n\`\`\``
    );
  };

  // Load a starter template
  const handleSelectTemplate = (template: ProjectTemplate) => {
    setProjectName(template.title);
    setFiles(template.files);
    setActiveFileId(template.files[0].id);
    setOpenTabIds(template.files.map(f => f.id));
    showToast(`Loaded ${template.title}`);
  };

  // Load an AI generated project
  const handleProjectGenerated = (title: string, newFiles: ProjectFile[]) => {
    setProjectName(title);
    setFiles(newFiles);
    setActiveFileId(newFiles[0].id);
    setOpenTabIds(newFiles.map(f => f.id));
    showToast(`Generated: ${title}`);
  };

  // Upload .html or code file from mobile phone or laptop storage
  const handleUploadFile = async (file: File) => {
    try {
      const content = await file.text();
      const name = file.name;
      const ext = name.split('.').pop()?.toLowerCase() || '';

      const language: ProjectFile['language'] =
        ext === 'html' || ext === 'htm'
          ? 'html'
          : ext === 'css'
          ? 'css'
          : ext === 'json'
          ? 'json'
          : ext === 'md'
          ? 'markdown'
          : 'javascript';

      // Check if file already exists
      const existing = files.find(f => f.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        setFiles(prev => prev.map(f => (f.id === existing.id ? { ...f, content } : f)));
        setActiveFileId(existing.id);
        if (!openTabIds.includes(existing.id)) setOpenTabIds(prev => [...prev, existing.id]);
      } else {
        const newFile: ProjectFile = {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          content,
          language,
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
        setOpenTabIds(prev => [...prev, newFile.id]);
      }

      // If uploading full HTML, update project name
      if (ext === 'html' || ext === 'htm') {
        const cleanProjectTitle = name.replace(/\.(html|htm)$/i, '');
        setProjectName(cleanProjectTitle);
      }

      showToast(`Uploaded "${name}" from storage!`);
    } catch (err: any) {
      showToast(`Upload error: ${err.message}`);
    }
  };

  // Download individual file to phone or laptop storage
  const handleDownloadFile = (file: ProjectFile) => {
    const mimeType =
      file.language === 'html'
        ? 'text/html;charset=utf-8'
        : file.language === 'css'
        ? 'text/css;charset=utf-8'
        : file.language === 'json'
        ? 'application/json;charset=utf-8'
        : 'text/javascript;charset=utf-8';

    const blob = new Blob([file.content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${file.name} to storage!`);
  };

  // Download entire project as standalone single runnable .html file
  const handleDownloadStandaloneHtml = () => {
    const bundledHtml = inlineProjectToHtml(files, projectName);
    downloadAppAsHtml(projectName, bundledHtml);
    showToast(`Downloaded ${projectName}.html to phone/laptop storage!`);
  };

  // Brainstorm on specific file: transfer into Brainstormer Pro X
  const handleBrainstormOnFile = (file: ProjectFile) => {
    setSeedConceptForBrainstormer({
      title: file.name,
      content: file.content,
    });
    setViewMode('canvas');
    showToast(`Seeded "${file.name}" into Brainstormer Lab!`);
  };

  // Load app from App Gallery into IDE
  const handleLoadAppToIde = (app: GalleryApp) => {
    if (app.sourceFiles && app.sourceFiles.length > 0) {
      const loadedFiles: ProjectFile[] = app.sourceFiles.map((sf, idx) => ({
        id: `gal-file-${idx}-${Date.now()}`,
        name: sf.name,
        content: sf.content,
        language: (sf.language as any) || (sf.name.endsWith('.css') ? 'css' : sf.name.endsWith('.html') ? 'html' : 'javascript'),
      }));
      setProjectName(app.title);
      setFiles(loadedFiles);
      setActiveFileId(loadedFiles[0].id);
      setOpenTabIds(loadedFiles.map(f => f.id));
    } else {
      // Single HTML file
      const singleHtmlFile: ProjectFile = {
        id: `gal-html-${Date.now()}`,
        name: 'index.html',
        content: app.htmlContent,
        language: 'html',
      };
      setProjectName(app.title);
      setFiles([singleHtmlFile]);
      setActiveFileId(singleHtmlFile.id);
      setOpenTabIds([singleHtmlFile.id]);
    }
    setViewMode('ide');
    showToast(`Loaded "${app.title}" from App Gallery!`);
  };

  // Load app from App Gallery directly into Brainstormer
  const handleLoadAppToBrainstormer = (app: GalleryApp) => {
    setSeedConceptForBrainstormer({
      title: app.title,
      content: app.htmlContent,
    });
    setViewMode('canvas');
    showToast(`Seeded "${app.title}" into Brainstormer Pro X!`);
  };

  // Export project as downloaded JSON bundle
  const handleExportProject = () => {
    const projectBundle = {
      title: projectName,
      exportedAt: new Date().toISOString(),
      files: files.map(f => ({ name: f.name, content: f.content, language: f.language })),
    };

    const blob = new Blob([JSON.stringify(projectBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-project.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported project bundle');
  };

  // Build prototype in IDE directly from Brainstormer Pro X Concept Node
  const handleBuildProjectFromConcept = async (prompt: string, title: string, fabricationMode?: string) => {
    const modeBadge = (fabricationMode || 'build').toUpperCase();
    showToast(`[${modeBadge}] Fabricating runnable artifacts: ${title}...`);
    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, fabricationMode: fabricationMode || 'build' }),
      });
      const data = await response.json();
      if (data.files && Array.isArray(data.files)) {
        const generatedFiles: ProjectFile[] = data.files.map((f: any, idx: number) => ({
          id: `gen-${idx}-${Date.now()}`,
          name: f.name || `file-${idx}.js`,
          content: f.content || '',
          language: f.language || (f.name?.endsWith('.css') ? 'css' : f.name?.endsWith('.html') ? 'html' : 'javascript'),
        }));
        setProjectName(title);
        setFiles(generatedFiles);
        setActiveFileId(generatedFiles[0].id);
        setOpenTabIds(generatedFiles.map(f => f.id));
        if (viewMode === 'canvas') setViewMode('ide');
        showToast(`[${data.badge || 'PROTOTYPE'}] Deployed & executing: ${title}!`);
      }
    } catch (err: any) {
      showToast(`Build error: ${err.message}`);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showToast('Sandbox refreshed & state saved');
      }
      if (e.shiftKey && e.altKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        handleFormatActiveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);

  return (
    <div className="flex h-screen w-screen bg-[#0d1117] text-slate-200 overflow-hidden font-sans">
      {/* Left Gemini App Rail */}
      <GeminiAppRail
        currentMode={viewMode === 'canvas' ? 'brainstorm' : (viewMode as GeminiNavMode)}
        onSelectMode={mode => setViewMode(mode)}
        onOpenGitHub={() => setIsGitHubHubOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onUploadHtml={() => setIsGalleryOpen(true)}
        onDownloadHtml={handleDownloadStandaloneHtml}
        isCollapsed={railCollapsed}
        onToggleCollapse={() => setRailCollapsed(p => !p)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <TopBar
          projectName={projectName}
          onRenameProject={setProjectName}
          onRunPreview={() => showToast('Preview sandbox refreshed')}
          onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
          onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onExportProject={handleExportProject}
          onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
          onUploadHtmlClick={() => setIsGalleryOpen(true)}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          showCopilot={showCopilot}
          setShowCopilot={setShowCopilot}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          showEditor={showEditor}
          setShowEditor={setShowEditor}
          showTerminal={showTerminal}
          setShowTerminal={setShowTerminal}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenGitHub={() => setIsGitHubHubOpen(true)}
        />

        {/* Main Workspace: Mode Conditional Rendering */}
        {viewMode === 'agent' ? (
          /* Gemini Agent OS + Live Canvas Sandbox (Split Mode) */
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Gemini Agent Assistant / Autonomous Orchestrator (50%) */}
            <div className="w-1/2 h-full border-r border-[#30363d] overflow-hidden flex flex-col">
              <GeminiAgentCanvas
                files={files}
                activeFile={activeFile}
                projectName={projectName}
                onApplyFileChanges={handleApplyFileChanges}
                onRunTerminalCommand={cmd => {
                  setShowTerminal(true);
                  showToast(`Executed in terminal: ${cmd}`);
                }}
                onSwitchView={mode => setViewMode(mode)}
                onOpenGitHub={() => setIsGitHubHubOpen(true)}
                onOpenGallery={() => setIsGalleryOpen(true)}
                onRunPreview={() => showToast('Preview sandbox refreshed')}
                externalPrompt={externalCopilotPrompt}
                onClearExternalPrompt={() => setExternalCopilotPrompt('')}
              />
            </div>

            {/* Right: Live Canvas Preview (HTML, TypeScript, JavaScript Live Sandbox) */}
            <div className="w-1/2 h-full flex flex-col overflow-hidden bg-[#0d1117]">
              <LivePreview
                files={files}
                onFixErrorWithAI={handleFixErrorWithAI}
              />
            </div>
          </div>
        ) : viewMode === 'canvas' || viewMode === 'brainstorm' ? (
          /* Brainstormer Pro X Canvas & Concept Matrix */
          <div className="flex-1 flex overflow-hidden relative">
            <BrainstormerCanvas
              onBuildProjectFromConcept={handleBuildProjectFromConcept}
              onSendToCopilotChat={prompt => {
                setExternalCopilotPrompt(prompt);
                setViewMode('agent');
              }}
              externalSeedConcept={seedConceptForBrainstormer}
            />
          </div>
        ) : viewMode === 'terminal' ? (
          /* Full Screen Linux Terminal Shell */
          <div className="flex-1 flex overflow-hidden relative bg-[#090d16]">
            <IntegratedTerminal
              files={files}
              projectName={projectName}
              isOpen={true}
              onToggle={() => setViewMode('split')}
              onAskCopilot={handleAskCopilot}
              onTriggerPreviewReload={() => showToast('Preview sandbox refreshed')}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onUpdateContent={handleUpdateContent}
              onUpsertFile={handleUpsertFile}
              onSelectFile={handleSelectFile}
            />
          </div>
        ) : viewMode === 'split' ? (
          /* Live IDE Split Mode: Editor (Left) + Live Preview (Right) */
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Code Editor (50%) */}
              <div className="w-1/2 h-full flex flex-col bg-[#0d1117] overflow-hidden border-r border-[#30363d]">
                {/* Tabs Bar with Format Code Button */}
                <div className="flex items-center justify-between bg-[#161b22] border-b border-[#30363d] select-none px-1 text-xs min-h-[36px]">
                  <div className="flex items-center overflow-x-auto no-scrollbar max-w-[80%]">
                    {openTabIds.map(tabId => {
                      const tabFile = files.find(f => f.id === tabId);
                      if (!tabFile) return null;
                      const isActive = tabId === activeFileId;

                      return (
                        <div
                          key={tabId}
                          onClick={() => handleSelectFile(tabId)}
                          className={`flex items-center gap-2 px-3 py-2 border-r border-[#21262d] cursor-pointer transition-colors whitespace-nowrap text-xs ${
                            isActive
                              ? 'bg-[#0d1117] text-white border-t-2 border-t-sky-400 font-medium'
                              : 'text-slate-400 hover:bg-[#161b22] hover:text-slate-200'
                          }`}
                        >
                          <span className="font-mono text-[11px]">{tabFile.name}</span>
                          <button
                            onClick={e => handleCloseTab(tabId, e)}
                            className="p-0.5 rounded hover:bg-[#30363d] text-slate-500 hover:text-slate-300 transition-colors"
                            title="Close tab"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Format Code & Quick File Action Buttons */}
                  <div className="flex items-center gap-1.5 px-2">
                    <button
                      onClick={handleDownloadStandaloneHtml}
                      className="flex items-center gap-1 px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-emerald-300 rounded text-[11px] transition-colors"
                      title="Save & Download standalone HTML to storage"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span className="hidden md:inline">Save HTML</span>
                    </button>

                    <button
                      onClick={handleFormatActiveFile}
                      className="flex items-center gap-1 px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-sky-300 hover:text-white rounded text-[11px] font-medium transition-colors border border-sky-500/20"
                      title="Format Active Code (Alt+Shift+F)"
                    >
                      <Wand2 className="w-3 h-3 text-sky-400" />
                      <span className="hidden md:inline">Format</span>
                    </button>
                  </div>
                </div>

                {/* Code Editor Body */}
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    file={activeFile}
                    onChange={handleUpdateContent}
                    onAskCopilot={handleAskCopilot}
                  />
                </div>
              </div>

              {/* Right: Live Preview (50%) with HTML/TS/JS support */}
              <div className="w-1/2 h-full bg-[#0d1117] flex flex-col">
                <LivePreview
                  files={files}
                  onFixErrorWithAI={handleFixErrorWithAI}
                />
              </div>
            </div>

            {/* Collapsible Bottom Integrated Terminal */}
            <IntegratedTerminal
              files={files}
              projectName={projectName}
              isOpen={showTerminal}
              onToggle={() => setShowTerminal(prev => !prev)}
              onAskCopilot={handleAskCopilot}
              onTriggerPreviewReload={() => showToast('Preview sandbox refreshed')}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onUpdateContent={handleUpdateContent}
              onUpsertFile={handleUpsertFile}
              onSelectFile={handleSelectFile}
            />
          </div>
        ) : (
          /* IDE Full Multi-Pane Mode */
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left File Tree Sidebar */}
            {showSidebar && (
              <FileTree
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
                onExportProject={handleExportProject}
                onUploadFile={handleUploadFile}
                onDownloadFile={handleDownloadFile}
                onBrainstormOnFile={handleBrainstormOnFile}
                onOpenGallery={() => setIsGalleryOpen(true)}
                onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
              />
            )}

            {/* Central Code Editor */}
            {showEditor && activeFile ? (
              <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden min-w-[320px]">
                {/* Tab bar with Format Button */}
                <div className="flex items-center justify-between bg-[#161b22] border-b border-[#30363d] select-none px-1 text-xs min-h-[36px]">
                  <div className="flex items-center overflow-x-auto no-scrollbar max-w-[70%]">
                    {openTabIds.map(tabId => {
                      const tabFile = files.find(f => f.id === tabId);
                      if (!tabFile) return null;
                      const isActive = tabId === activeFileId;

                      return (
                        <div
                          key={tabId}
                          onClick={() => handleSelectFile(tabId)}
                          className={`flex items-center gap-2 px-3 py-2 border-r border-[#21262d] cursor-pointer transition-colors whitespace-nowrap text-xs ${
                            isActive
                              ? 'bg-[#0d1117] text-white border-t-2 border-t-sky-400 font-medium'
                              : 'text-slate-400 hover:bg-[#161b22] hover:text-slate-200'
                          }`}
                        >
                          <span className="font-mono text-[11px]">{tabFile.name}</span>
                          <button
                            onClick={e => handleCloseTab(tabId, e)}
                            className="p-0.5 rounded hover:bg-[#30363d] text-slate-500 hover:text-slate-300 transition-colors"
                            title="Close tab"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tab Bar Utilities */}
                  <div className="flex items-center gap-1.5 px-2">
                    <button
                      onClick={() => handleBrainstormOnFile(activeFile)}
                      className="flex items-center gap-1 px-2 py-1 bg-purple-900/30 hover:bg-purple-800/40 text-purple-300 border border-purple-500/20 rounded text-[11px] transition-colors"
                      title="Send active file to Brainstormer Pro X"
                    >
                      <Brain className="w-3 h-3 text-purple-400" />
                      <span className="hidden sm:inline">Brainstorm File</span>
                    </button>

                    <button
                      onClick={handleDownloadStandaloneHtml}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded text-[11px] transition-colors"
                      title="Download runnable .html file to storage"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline">Save HTML</span>
                    </button>

                    <button
                      onClick={handleFormatActiveFile}
                      className="flex items-center gap-1 px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-sky-300 hover:text-white rounded text-[11px] font-medium transition-colors border border-sky-500/20"
                      title="Format Code (Alt+Shift+F)"
                    >
                      <Wand2 className="w-3 h-3 text-sky-400" />
                      <span className="hidden sm:inline">Format Code</span>
                    </button>
                  </div>
                </div>

                {/* Monaco/Code Editor */}
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    file={activeFile}
                    onChange={handleUpdateContent}
                    onAskCopilot={handleAskCopilot}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[#0d1117]">
                <p>No file selected</p>
              </div>
            )}

            {/* Gemini Copilot Panel */}
            {showCopilot && (
              <div className="w-80 h-full border-l border-[#30363d] bg-[#0d1117] flex flex-col">
                <GeminiCopilot
                  files={files}
                  activeFile={activeFile}
                  onApplyFileChanges={handleApplyFileChanges}
                  externalPrompt={externalCopilotPrompt}
                  onClearExternalPrompt={() => setExternalCopilotPrompt('')}
                />
              </div>
            )}

            {/* Live Preview Panel */}
            {showPreview && (
              <div className="w-[420px] lg:w-[480px] h-full border-l border-[#30363d] bg-[#0d1117] flex flex-col">
                <LivePreview
                  files={files}
                  onFixErrorWithAI={handleFixErrorWithAI}
                />
              </div>
            )}

            {/* Integrated Terminal (in IDE mode) */}
            <IntegratedTerminal
              files={files}
              projectName={projectName}
              isOpen={showTerminal}
              onToggle={() => setShowTerminal(prev => !prev)}
              onAskCopilot={handleAskCopilot}
              onTriggerPreviewReload={() => showToast('Preview sandbox refreshed')}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onUpdateContent={handleUpdateContent}
              onUpsertFile={handleUpsertFile}
              onSelectFile={handleSelectFile}
            />
          </div>
        )}

        {/* Bottom IDE Status Bar */}
        <div className="h-6 bg-[#161b22] border-t border-[#30363d] px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTerminal(prev => !prev)}
              className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
                showTerminal ? 'bg-[#21262d] text-sky-400 font-medium' : 'hover:text-slate-200 hover:bg-[#21262d]'
              }`}
              title="Toggle Terminal Shell (Ctrl+`)"
            >
              <Terminal className="w-3 h-3" />
              <span>Terminal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>

            <button
              onClick={() => setIsGitHubHubOpen(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-300 hover:bg-[#21262d] transition-colors"
              title="GitHub Hub"
            >
              <Cloud className="w-3 h-3 text-sky-400" />
              <span>GitHub</span>
            </button>

            <button
              onClick={() => setIsGalleryOpen(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-sky-300 hover:bg-[#21262d] transition-colors"
              title="Open App Gallery & OS Storage"
            >
              <LayoutGrid className="w-3 h-3 text-sky-400" />
              <span>App Gallery</span>
            </button>

            <div className="flex items-center gap-1 text-slate-500">
              <span>git:(</span>
              <span className="text-slate-300">main</span>
              <span>)</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>HTML • TypeScript • JavaScript Live Sandbox</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeFile && (
              <button
                onClick={handleFormatActiveFile}
                className="hover:text-slate-200 transition-colors hidden sm:block"
                title="Format Active File"
              >
                Format: {activeFile.language}
              </button>
            )}
            <span>UTF-8</span>
            <span>2 spaces</span>
          </div>
        </div>
      </div>

      {/* GitHub Integration Hub Modal */}
      <GitHubHub
        isOpen={isGitHubHubOpen}
        onClose={() => setIsGitHubHubOpen(false)}
        files={files}
        projectName={projectName}
        onImportFiles={(imported, newName) => {
          setFiles(imported);
          if (newName) setProjectName(newName);
          setActiveFileId(imported[0].id);
          setOpenTabIds(imported.map(f => f.id));
          setViewMode('split');
          showToast(`Cloned ${imported.length} files into workspace!`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-5 z-50 bg-[#161b22] border border-sky-500/50 text-white px-3.5 py-2 rounded-lg shadow-xl flex items-center gap-2 text-xs animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* App Gallery Modal */}
      <AppGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        currentFiles={files}
        currentProjectName={projectName}
        onLoadAppToIde={handleLoadAppToIde}
        onLoadAppToBrainstormer={handleLoadAppToBrainstormer}
        user={user}
        onUploadHtmlFile={handleUploadFile}
      />

      {/* AI Generate Project Modal */}
      <GenerateProjectModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onProjectGenerated={handleProjectGenerated}
      />

      {/* Starter Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
