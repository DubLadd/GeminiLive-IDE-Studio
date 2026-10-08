import React, { useState, useEffect } from 'react';
import { ProjectFile } from '../../types/ide';
import {
  getStoredGitHubToken,
  setStoredGitHubToken,
  clearStoredGitHubToken,
  validateGitHubToken,
  getUserRepositories,
  fetchRepoTreeFiles,
  createGitHubRepository,
  pushProjectToGitHub,
  GitHubUser,
  GitHubRepo
} from '../../services/githubService';
import {
  Github,
  Key,
  FolderGit2,
  GitBranch,
  UploadCloud,
  DownloadCloud,
  Plus,
  Search,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  X,
  Lock,
  Globe,
  Sparkles,
  GitCommit,
  RefreshCw,
  LogOut,
  FileCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GitHubHubProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  projectName: string;
  onImportFiles: (files: ProjectFile[], newProjectName?: string) => void;
}

export const GitHubHub: React.FC<GitHubHubProps> = ({
  isOpen,
  onClose,
  files,
  projectName,
  onImportFiles,
}) => {
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'repos' | 'create' | 'push' | 'clone_url'>('repos');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Create Repo State
  const [newRepoName, setNewRepoName] = useState(projectName.toLowerCase().replace(/\s+/g, '-'));
  const [newRepoDesc, setNewRepoDesc] = useState('Created with Gemini Live IDE');
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

  // Push Commit State
  const [selectedRepoForPush, setSelectedRepoForPush] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState(`Update from Gemini Live IDE: ${new Date().toLocaleDateString()}`);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; url?: string } | null>(null);

  // Clone URL State
  const [customRepoUrl, setCustomRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // Load stored token on mount
  useEffect(() => {
    const savedToken = getStoredGitHubToken();
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    }
  }, []);

  const verifyToken = async (tok: string) => {
    if (!tok.trim()) return;
    setIsLoadingUser(true);
    setAuthError(null);
    try {
      const userData = await validateGitHubToken(tok);
      setUser(userData);
      setStoredGitHubToken(tok);
      loadRepos(tok);
    } catch (err: any) {
      setUser(null);
      setAuthError(err.message || 'Invalid GitHub token. Please verify permissions (repo scope required).');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadRepos = async (tok: string) => {
    setIsLoadingRepos(true);
    try {
      const repoList = await getUserRepositories(tok);
      setRepos(repoList);
      if (repoList.length > 0 && !selectedRepoForPush) {
        setSelectedRepoForPush(repoList[0].full_name);
      }
    } catch (err: any) {
      console.warn('Failed to fetch repositories', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleDisconnect = () => {
    clearStoredGitHubToken();
    setToken('');
    setUser(null);
    setRepos([]);
    setAuthError(null);
  };

  const handleCloneRepo = async (owner: string, repoName: string) => {
    if (!token) return;
    setIsCloning(true);
    setCloneError(null);
    try {
      const imported = await fetchRepoTreeFiles(token, owner, repoName);
      onImportFiles(imported, repoName);
      confetti({ particleCount: 40, spread: 60 });
      onClose();
    } catch (err: any) {
      setCloneError(err.message || 'Failed to clone repository files.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleCloneFromUrl = async () => {
    if (!customRepoUrl.trim()) return;
    let url = customRepoUrl.trim();
    // Support formats: https://github.com/owner/repo or owner/repo
    url = url.replace('https://github.com/', '').replace('.git', '');
    const parts = url.split('/');
    if (parts.length < 2) {
      setCloneError('Please enter a valid format: "owner/repo" or "https://github.com/owner/repo"');
      return;
    }
    const [owner, repoName] = parts;
    await handleCloneRepo(owner, repoName);
  };

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newRepoName.trim()) return;
    setIsCreatingRepo(true);
    setCreateSuccessMsg(null);
    try {
      const created = await createGitHubRepository(token, newRepoName, newRepoDesc, isPrivateRepo);
      // Immediately push files to the new repo
      const [owner, name] = created.full_name.split('/');
      await pushProjectToGitHub(token, owner, name, files, `Initial commit from Gemini Live IDE`);

      setCreateSuccessMsg(`Created and committed files to https://github.com/${created.full_name}!`);
      confetti({ particleCount: 50, spread: 70 });
      loadRepos(token);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create repository.');
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const handlePushCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedRepoForPush) return;
    setIsPushing(true);
    setPushResult(null);
    try {
      const [owner, repoName] = selectedRepoForPush.split('/');
      const result = await pushProjectToGitHub(token, owner, repoName, files, commitMessage);
      setPushResult({ success: true, url: result.commitUrl });
      confetti({ particleCount: 45, spread: 65 });
    } catch (err: any) {
      setPushResult({ success: false });
      setAuthError(err.message || 'Failed to push commit to repository.');
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  const filteredRepos = repos.filter(r =>
    r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#24292f] to-[#1f242c] border border-slate-700 flex items-center justify-center shadow-md">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">GitHub Integration Hub</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                  Octokit / REST API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clone repositories, commit workspace code, create new repos, or work seamlessly with GitHub.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Authentication State Card */}
          {!user ? (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <Key className="w-4 h-4 text-amber-400" />
                    Connect your GitHub Personal Access Token (PAT)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Generate a token in your GitHub Settings (<code className="text-sky-400 bg-sky-950/40 px-1 py-0.5 rounded">github.com/settings/tokens</code>) with the <strong className="text-slate-200">repo</strong> scope enabled so you can read, clone, and push to your repositories.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none font-mono"
                  />
                </div>
                <button
                  onClick={() => verifyToken(token)}
                  disabled={isLoadingUser || !token.trim()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20"
                >
                  {isLoadingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Connect Token
                </button>
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-12 h-12 rounded-full border border-slate-700 shadow"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{user.name || user.login}</span>
                    <a
                      href={user.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      @{user.login}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{user.public_repos} public repos</span>
                    {user.total_private_repos !== undefined && (
                      <span>• {user.total_private_repos} private repos</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadRepos(token)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors text-xs flex items-center gap-1.5"
                  title="Refresh Repositories"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin text-sky-400' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {/* Connected Tabs */}
          {user && (
            <div>
              {/* Navigation Tabs */}
              <div className="flex border-b border-[#30363d] mb-4 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('repos')}
                  className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'repos'
                      ? 'border-sky-500 text-sky-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4" />
                  My Repositories ({repos.length})
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'create'
                      ? 'border-sky-500 text-sky-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Create New Repo
                </button>
                <button
                  onClick={() => setActiveTab('push')}
                  className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'push'
                      ? 'border-sky-500 text-sky-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Commit & Push ({files.length} files)
                </button>
                <button
                  onClick={() => setActiveTab('clone_url')}
                  className={`pb-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === 'clone_url'
                      ? 'border-sky-500 text-sky-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DownloadCloud className="w-4 h-4" />
                  Clone by URL
                </button>
              </div>

              {/* Tab 1: My Repositories */}
              {activeTab === 'repos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={e => setSearchFilter(e.target.value)}
                        placeholder="Search your repositories..."
                        className="w-full bg-[#0d1117] border border-[#30363d] focus:border-sky-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  {isCloning && (
                    <div className="bg-sky-950/40 border border-sky-800 p-3 rounded-xl flex items-center gap-3 text-xs text-sky-300">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                      <span>Cloning repository tree and fetching project files into workspace...</span>
                    </div>
                  )}

                  {cloneError && (
                    <div className="bg-rose-950/40 border border-rose-800 p-3 rounded-xl flex items-center gap-3 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cloneError}</span>
                    </div>
                  )}

                  {isLoadingRepos ? (
                    <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                      <span>Loading your GitHub repositories...</span>
                    </div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs bg-[#0d1117] border border-[#21262d] rounded-xl">
                      No repositories found matching "{searchFilter}".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {filteredRepos.map(repo => (
                        <div
                          key={repo.id}
                          className="bg-[#0d1117] border border-[#21262d] hover:border-slate-600 rounded-xl p-3.5 flex flex-col justify-between transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-white text-xs hover:text-sky-400 flex items-center gap-1.5 truncate"
                              >
                                {repo.name}
                                <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                              </a>
                              <div className="flex items-center gap-1 shrink-0">
                                {repo.private ? (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800">
                                    <Lock className="w-2.5 h-2.5" /> Private
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                                    <Globe className="w-2.5 h-2.5" /> Public
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 min-h-[2rem]">
                              {repo.description || 'No description provided.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#21262d] mt-2 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                              {repo.language && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                {repo.default_branch}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                const [owner, rname] = repo.full_name.split('/');
                                handleCloneRepo(owner, rname);
                              }}
                              disabled={isCloning}
                              className="px-2.5 py-1 bg-[#21262d] hover:bg-sky-600 hover:text-white text-slate-200 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <DownloadCloud className="w-3.5 h-3.5" />
                              Clone to IDE
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Create New Repo */}
              {activeTab === 'create' && (
                <form onSubmit={handleCreateRepo} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Create New GitHub Repository
                    </h3>
                    <p className="text-xs text-slate-400">
                      Creates a repository in your GitHub account and automatically commits the current workspace files ({files.map(f => f.name).join(', ')}).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Repository Name
                      </label>
                      <input
                        type="text"
                        value={newRepoName}
                        onChange={e => setNewRepoName(e.target.value)}
                        placeholder="my-gemini-canvas-app"
                        required
                        className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        value={newRepoDesc}
                        onChange={e => setNewRepoDesc(e.target.value)}
                        placeholder="Live IDE project with TypeScript and Canvas"
                        className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrivateRepo}
                          onChange={e => setIsPrivateRepo(e.target.checked)}
                          className="rounded border-[#30363d] text-sky-600 focus:ring-0 bg-[#161b22]"
                        />
                        <span>Private repository (only you can see this)</span>
                      </label>
                    </div>
                  </div>

                  {createSuccessMsg && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{createSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCreatingRepo || !newRepoName.trim()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    {isCreatingRepo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Create Repository & Push Workspace Files
                  </button>
                </form>
              )}

              {/* Tab 3: Commit & Push to Existing Repo */}
              {activeTab === 'push' && (
                <form onSubmit={handlePushCommit} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <GitCommit className="w-4 h-4 text-sky-400" />
                      Commit & Push Project Files
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pushes a Git commit containing all {files.length} project files directly to your chosen repository.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Target Repository
                      </label>
                      <select
                        value={selectedRepoForPush}
                        onChange={e => setSelectedRepoForPush(e.target.value)}
                        className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                      >
                        {repos.map(r => (
                          <option key={r.id} value={r.full_name}>
                            {r.full_name} ({r.private ? 'Private' : 'Public'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Commit Message
                      </label>
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={e => setCommitMessage(e.target.value)}
                        placeholder="Feature: enhance live ide components and TypeScript compiler"
                        required
                        className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none font-mono"
                      />
                    </div>

                    <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3 text-xs space-y-1.5">
                      <div className="text-slate-400 font-medium">Files included in this commit:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {files.map(f => (
                          <span key={f.id} className="px-2 py-0.5 rounded bg-[#21262d] text-slate-300 text-[11px] font-mono flex items-center gap-1">
                            <FileCode className="w-3 h-3 text-sky-400" />
                            {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {pushResult && pushResult.success && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Commit successfully pushed to GitHub!</span>
                      </div>
                      {pushResult.url && (
                        <a
                          href={pushResult.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          View Commit <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPushing || !selectedRepoForPush}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sky-600/20"
                  >
                    {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Push Commit to GitHub
                  </button>
                </form>
              )}

              {/* Tab 4: Clone by URL */}
              {activeTab === 'clone_url' && (
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <DownloadCloud className="w-4 h-4 text-sky-400" />
                      Clone Repository by URL or Path
                    </h3>
                    <p className="text-xs text-slate-400">
                      Import any repository from GitHub into this Gemini Live IDE workspace.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        GitHub Repository URL or "owner/repo"
                      </label>
                      <input
                        type="text"
                        value={customRepoUrl}
                        onChange={e => setCustomRepoUrl(e.target.value)}
                        placeholder="https://github.com/torvalds/linux or facebook/react"
                        className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {cloneError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{cloneError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleCloneFromUrl}
                    disabled={isCloning || !customRepoUrl.trim()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                    Clone & Import Repository
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>REST API v3 Ready • Token stored safely in local browser storage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
