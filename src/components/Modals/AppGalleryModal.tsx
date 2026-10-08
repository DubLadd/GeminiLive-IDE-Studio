import React, { useState, useEffect, useRef } from 'react';
import { GalleryApp } from '../../types/gallery';
import {
  loadLocalApps,
  saveLocalApp,
  deleteLocalApp,
  saveAppToFirestore,
  loadFirestoreApps,
  deleteAppFromFirestore,
  downloadAppAsHtml,
  exportToGoogleDrive,
  inlineProjectToHtml
} from '../../utils/appGalleryStorage';
import { auth, googleProvider, signInWithPopup, signOut, User } from '../../lib/firebase';
import {
  LayoutGrid,
  Download,
  Upload,
  Play,
  Brain,
  Trash2,
  Cloud,
  Check,
  Search,
  Plus,
  X,
  ExternalLink,
  Smartphone,
  Laptop,
  FolderOpen,
  Share2,
  Tag,
  Sparkles,
  LogIn,
  LogOut,
  FolderSync
} from 'lucide-react';
import { ProjectFile } from '../../types/ide';

interface AppGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFiles: ProjectFile[];
  currentProjectName: string;
  onLoadAppToIde: (app: GalleryApp) => void;
  onLoadAppToBrainstormer: (app: GalleryApp) => void;
  user: User | null;
  onUploadHtmlFile: (file: File) => void;
}

export const AppGalleryModal: React.FC<AppGalleryModalProps> = ({
  isOpen,
  onClose,
  currentFiles,
  currentProjectName,
  onLoadAppToIde,
  onLoadAppToBrainstormer,
  user,
  onUploadHtmlFile,
}) => {
  const [apps, setApps] = useState<GalleryApp[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [saveTitle, setSaveTitle] = useState(currentProjectName);
  const [saveDesc, setSaveDesc] = useState('');
  const [saveCategory, setSaveCategory] = useState<GalleryApp['category']>('prototype');
  const [saveTags, setSaveTags] = useState('html5, web');
  const [activeTab, setActiveTab] = useState<'gallery' | 'save'>('gallery');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load apps on modal open & auth state
  useEffect(() => {
    if (!isOpen) return;
    refreshApps();
  }, [isOpen, user]);

  const refreshApps = async () => {
    const local = loadLocalApps();
    if (user) {
      try {
        const cloud = await loadFirestoreApps(user.uid);
        // Merge cloud & local by ID
        const mergedMap = new Map<string, GalleryApp>();
        local.forEach(a => mergedMap.set(a.id, a));
        cloud.forEach(a => mergedMap.set(a.id, { ...a, isCloudSynced: true }));
        setApps(Array.from(mergedMap.values()));
        return;
      } catch (e) {
        console.error('Failed loading cloud apps:', e);
      }
    }
    setApps(local);
  };

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  if (!isOpen) return null;

  // Filter apps
  const filteredApps = apps.filter(app => {
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleSaveCurrentApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    const fullHtml = inlineProjectToHtml(currentFiles, saveTitle.trim());
    const newApp: GalleryApp = {
      id: `app-${Date.now()}`,
      userId: user?.uid,
      title: saveTitle.trim(),
      description: saveDesc.trim() || 'Created in Gemini Live IDE',
      category: saveCategory,
      tags: saveTags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean),
      htmlContent: fullHtml,
      sourceFiles: currentFiles.map(f => ({ name: f.name, content: f.content, language: f.language })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCloudSynced: false,
    };

    saveLocalApp(newApp);

    if (user) {
      try {
        await saveAppToFirestore(newApp, user);
        newApp.isCloudSynced = true;
      } catch (err: any) {
        console.warn('Firestore sync note:', err.message);
      }
    }

    notify(`Saved "${newApp.title}" into App Gallery!`);
    setActiveTab('gallery');
    refreshApps();
  };

  const handleDeleteApp = async (app: GalleryApp, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${app.title}" from App Gallery?`)) return;

    deleteLocalApp(app.id);
    if (user) {
      try {
        await deleteAppFromFirestore(app.id);
      } catch (err) {
        // ignore
      }
    }
    notify(`Deleted "${app.title}"`);
    refreshApps();
  };

  const handleDownloadApp = (app: GalleryApp, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadAppAsHtml(app.title, app.htmlContent);
    notify(`Downloaded ${app.title}.html to storage!`);
  };

  const handleExportDrive = async (app: GalleryApp, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncingDrive(app.id);

    try {
      let token = driveAccessToken;
      if (!token) {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = (result as any).credential || (result as any)._tokenResponse;
        token = credential?.oauthAccessToken || credential?.accessToken;
        if (token) setDriveAccessToken(token);
      }

      if (!token) {
        notify('Google Drive authorization required.');
        setIsSyncingDrive(null);
        return;
      }

      const res = await exportToGoogleDrive(app.title, app.htmlContent, token);
      if (res.success) {
        notify(`Uploaded to Google Drive! File ID: ${res.fileId}`);
      } else {
        notify(`Google Drive sync: ${res.error || 'Failed'}`);
      }
    } catch (err: any) {
      notify(`Drive error: ${err.message}`);
    } finally {
      setIsSyncingDrive(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onUploadHtmlFile(file);
      notify(`Uploaded "${file.name}" into workspace!`);
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      notify(`Signed in as ${result.user.displayName || result.user.email}`);
      refreshApps();
    } catch (err: any) {
      notify(`Sign in failed: ${err.message}`);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOut(auth);
    notify('Signed out.');
    refreshApps();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-[#161b22] border border-[#30363d] w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">APP GALLERY & STORAGE</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/80 border border-sky-500/30 text-sky-300">
                  Phone & Laptop Storage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload .html apps from local storage, save prototypes locally & in Firestore, download anytime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Auth Status Pill */}
            {user ? (
              <div className="flex items-center gap-2 bg-[#21262d] px-2.5 py-1 rounded-lg border border-[#30363d] text-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <span className="text-slate-300 font-medium truncate max-w-28 text-[11px]">
                  {user.displayName || user.email}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Firestore Connected" />
                <button
                  onClick={handleGoogleSignOut}
                  className="p-1 hover:text-rose-400 text-slate-400 ml-1 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
                title="Sign in with Google to sync apps with Firebase Firestore and Google Drive"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign-In</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#21262d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMsg && (
          <div className="bg-sky-950/90 border-b border-sky-500/30 px-4 py-2 text-xs text-sky-200 flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Toolbar & Tabs */}
        <div className="px-5 py-3 border-b border-[#21262d] flex flex-wrap items-center justify-between gap-3 bg-[#161b22]">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-[#21262d] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Browse Gallery ({apps.length})</span>
            </button>
            <button
              onClick={() => {
                setSaveTitle(currentProjectName);
                setActiveTab('save');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'save'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current Project to Gallery</span>
            </button>
          </div>

          {/* Quick Actions: Upload HTML & Storage Info */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".html,.htm"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-sky-300 border border-sky-500/30 rounded-lg text-xs font-medium transition-all"
              title="Upload .html file directly from phone storage or laptop disk"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload .html from Phone/Laptop</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'gallery' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter & Search Bar */}
            <div className="px-5 py-2.5 bg-[#0d1117]/60 border-b border-[#21262d] flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(['all', 'prototype', 'game', 'tool', 'utility', 'experiment'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg capitalize font-medium text-[11px] transition-colors ${
                      selectedCategory === cat
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search gallery apps..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Apps Grid */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <LayoutGrid className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-300">No apps found matching your query</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Upload an .html file from your device, or click "Save Current Project to Gallery" to archive your work.
                  </p>
                </div>
              ) : (
                filteredApps.map(app => (
                  <div
                    key={app.id}
                    className="bg-[#0d1117] border border-[#30363d] hover:border-sky-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-sky-950/20"
                  >
                    {/* Top: Header & Badges */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#21262d] text-sky-300 border border-[#30363d]">
                            {app.category}
                          </span>
                          {app.isCloudSynced ? (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                              <Cloud className="w-2.5 h-2.5" />
                              <span>Firestore</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400">
                              <Laptop className="w-2.5 h-2.5" />
                              <span>Local OS</span>
                            </span>
                          )}
                        </div>

                        <button
                          onClick={e => handleDeleteApp(app, e)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete app"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm tracking-tight mb-1 group-hover:text-sky-300 transition-colors">
                        {app.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {app.description}
                      </p>

                      {/* Tag list */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {app.tags.slice(0, 4).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 bg-[#161b22] text-slate-400 rounded border border-[#21262d]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom: Action Grid */}
                    <div className="pt-3 border-t border-[#21262d] flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            onLoadAppToIde(app);
                            notify(`Opened "${app.title}" in Code IDE!`);
                            onClose();
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          title="Open code in editor and live preview"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Run / Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            onLoadAppToBrainstormer(app);
                            notify(`Transferred "${app.title}" to Brainstormer!`);
                            onClose();
                          }}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
                          title="Brainstorm and integrate new features on this app"
                        >
                          <Brain className="w-3 h-3 text-purple-300" />
                          <span>Brainstorm</span>
                        </button>
                      </div>

                      {/* Download & Cloud Drive Options */}
                      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 pt-1">
                        <button
                          onClick={e => handleDownloadApp(app, e)}
                          className="flex items-center gap-1 px-2 py-1 bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-white rounded border border-[#30363d] transition-colors"
                          title="Download standalone .html file to phone or laptop storage"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Download .html</span>
                        </button>

                        <button
                          onClick={e => handleExportDrive(app, e)}
                          disabled={isSyncingDrive === app.id}
                          className="flex items-center gap-1 px-2 py-1 bg-[#161b22] hover:bg-[#21262d] text-slate-300 hover:text-white rounded border border-[#30363d] transition-colors disabled:opacity-50"
                          title="Export to Google Drive"
                        >
                          <Share2 className="w-3 h-3 text-sky-400" />
                          <span>{isSyncingDrive === app.id ? 'Saving...' : 'Drive'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Save Current Project Tab */
          <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
            <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Save Current Project to App Gallery</h3>
                  <p className="text-xs text-slate-400">
                    Saves all code into a self-contained executable runnable HTML app in your local OS storage and Firestore cloud
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveCurrentApp} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">App Title</label>
                  <input
                    type="text"
                    required
                    value={saveTitle}
                    onChange={e => setSaveTitle(e.target.value)}
                    placeholder="e.g. My Next-Gen Web Tool"
                    className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-slate-100 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={saveCategory}
                    onChange={e => setSaveCategory(e.target.value as any)}
                    className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-slate-100 outline-none text-xs"
                  >
                    <option value="prototype">Prototype</option>
                    <option value="game">Game / Canvas</option>
                    <option value="tool">Tool / Utility</option>
                    <option value="utility">Utility Engine</option>
                    <option value="experiment">Experiment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={saveDesc}
                    onChange={e => setSaveDesc(e.target.value)}
                    placeholder="Describe what this app does, mechanics, or features..."
                    className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-slate-100 outline-none text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={saveTags}
                    onChange={e => setSaveTags(e.target.value)}
                    placeholder="e.g. react, tailwind, canvas, audio"
                    className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-slate-100 outline-none text-xs"
                  />
                </div>

                {/* Storage Targets Status */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="text-slate-200 font-medium">Local OS Storage</p>
                      <p className="text-[10px] text-slate-500">Instant offline access on this device</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Enabled
                  </span>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-slate-200 font-medium">Firebase Firestore Cloud</p>
                      <p className="text-[10px] text-slate-500">
                        {user ? 'Syncing to account ' + user.email : 'Sign in to sync across devices'}
                      </p>
                    </div>
                  </div>
                  {user ? (
                    <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      Sign In Now
                    </button>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('gallery')}
                    className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-all shadow-md flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save to App Gallery</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
