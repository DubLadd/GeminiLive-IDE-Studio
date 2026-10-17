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
  FileCode,
  ShieldAlert,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GitHubHubProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  projectName: string;
  onImportFiles: (files: ProjectFile[], newProjectName?: string) => void;
  initialTab?: 'repos' | 'create' | 'push' | 'clone_url';
}

export const GitHubHub: React.FC<GitHubHubProps> = ({
  isOpen,
  onClose,
  files,
  projectName,
  onImportFiles,
  initialTab = 'push',
}) => {
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'repos' | 'create' | 'push' | 'clone_url'>(initialTab);
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
  const [manualRepoInput, setManualRepoInput] = useState<string>('');
  const [useManualRepo, setUseManualRepo] = useState<boolean>(false);
  const [targetBranch, setTargetBranch] = useState<string>('main');
  const [commitMessage, setCommitMessage] = useState(
    `feat: update ${files.length} project files via Gemini Live IDE`
  );
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatusStep, setPushStatusStep] = useState<string>('');
  const [pushResult, setPushResult] = useState<{ success: boolean; url?: string; sha?: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

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

  // Sync tab with initialTab when opened
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

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
      setAuthError(
        err.message || 'Invalid GitHub token. Please verify permissions (repo scope required).'
      );
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
    if (!token.trim()) {
      setAuthError('Please enter a valid GitHub token with repo scope to create a repository.');
      return;
    }
    if (!newRepoName.trim()) return;
    setIsCreatingRepo(true);
    setCreateSuccessMsg(null);
    try {
      const created = await createGitHubRepository(token, newRepoName, newRepoDesc, isPrivateRepo);
      const [owner, name] = created.full_name.split('/');
      await pushProjectToGitHub(token, owner, name, files, `Initial commit from Gemini Live IDE`);

      setCreateSuccessMsg(`Created and pushed files to https://github.com/${created.full_name}!`);
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
    setPushError(null);
    setPushResult(null);

    const activeToken = token.trim();
    if (!activeToken) {
      setPushError(
        'A GitHub Personal Access Token (PAT) with "repo" scope is required to commit to GitHub API.'
      );
      return;
    }

    const targetRepoFull = useManualRepo || !user
      ? manualRepoInput.trim().replace('https://github.com/', '').replace('.git', '')
      : selectedRepoForPush;

    if (!targetRepoFull || !targetRepoFull.includes('/')) {
      setPushError('Please specify the target repository in "owner/repository" format (e.g. "username/my-project").');
      return;
    }

    const [owner, repoName] = targetRepoFull.split('/');
    if (!owner || !repoName) {
      setPushError('Invalid repository format. Please use "owner/repository".');
      return;
    }

    setIsPushing(true);
    setPushStatusStep('Uploading Git blobs and building tree...');

    try {
      // Save token if valid
      if (!getStoredGitHubToken()) {
        setStoredGitHubToken(activeToken);
      }

      setPushStatusStep(`Creating commit and updating branch '${targetBranch}'...`);
      const result = await pushProjectToGitHub(
        activeToken,
        owner,
        repoName,
        files,
        commitMessage,
        targetBranch
      );

      setPushResult({ success: true, url: result.commitUrl, sha: result.sha });
      confetti({ particleCount: 45, spread: 65 });
    } catch (err: any) {
      console.error('Push error:', err);
      setPushResult({ success: false });
      setPushError(
        err.message || 'Failed to push commit. Please verify repository permissions and branch name.'
      );
    } finally {
      setIsPushing(false);
      setPushStatusStep('');
    }
  };

  if (!isOpen) return null;

  const filteredRepos = repos.filter(
    r =>
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#24292f] to-[#1f242c] border border-slate-700 flex items-center justify-center shadow-md">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  GitHub Integration & Push Hub
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                  GitHub REST API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Push workspace files to your repositories, clone repos, or create new GitHub projects.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / PAT Status Bar */}
        <div className="bg-[#10151e] border-b border-[#21262d] px-6 py-2.5 flex items-center justify-between text-xs">
          {user ? (
            <div className="flex items-center gap-2.5">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-6 h-6 rounded-full border border-slate-700"
              />
              <span className="font-semibold text-white">{user.name || user.login}</span>
              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-0.5 text-[11px]"
              >
                @{user.login} <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[11px]">{repos.length} repos available</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Not logged in with token. You can connect a token below or enter one directly when pushing.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={() => loadRepos(token)}
                  disabled={isLoadingRepos}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingRepos ? 'animate-spin text-sky-400' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleDisconnect}
                  className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 ml-2"
                >
                  <LogOut className="w-3 h-3" />
                  Disconnect
                </button>
              </>
            ) : (
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=Gemini%20Live%20IDE"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
              >
                Generate Token on GitHub <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#30363d] px-6 bg-[#121720] text-xs font-medium">
          <button
            onClick={() => setActiveTab('push')}
            className={`py-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'push'
                ? 'border-sky-500 text-sky-400 font-semibold bg-sky-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-sky-400" />
            <span>Push to GitHub ({files.length} files)</span>
          </button>
          <button
            onClick={() => setActiveTab('repos')}
            className={`py-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'repos'
                ? 'border-sky-500 text-sky-400 font-semibold bg-sky-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-emerald-400" />
            <span>My Repositories {repos.length > 0 && `(${repos.length})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-sky-500 text-sky-400 font-semibold bg-sky-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Create New Repo</span>
          </button>
          <button
            onClick={() => setActiveTab('clone_url')}
            className={`py-2.5 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'clone_url'
                ? 'border-sky-500 text-sky-400 font-semibold bg-sky-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="w-4 h-4 text-amber-400" />
            <span>Clone from URL</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: PUSH TO GITHUB */}
          {activeTab === 'push' && (
            <form onSubmit={handlePushCommit} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#21262d]">
                <div>
                  <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-sky-400" />
                    Push Workspace State to GitHub Repository
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Commits all <strong className="text-slate-200">{files.length} active files</strong> directly into your chosen repository via the GitHub Git Data API.
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  Git Blobs + Trees API
                </span>
              </div>

              {/* GitHub Token Input (if not authenticated) */}
              {!user && (
                <div className="p-3 bg-[#161b24] border border-[#2d3748] rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>GitHub Personal Access Token (PAT)</span>
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Gemini%20Live%20IDE"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                    >
                      Get token with <strong>repo</strong> scope <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="flex-1 bg-[#0d1117] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => verifyToken(token)}
                      disabled={isLoadingUser || !token.trim()}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {isLoadingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Verify
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Your token is stored only in your local browser storage for API requests and never exposed.
                  </p>
                </div>
              )}

              {/* Repository Selector */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <label className="font-medium text-slate-300">Target Repository</label>
                    {user && (
                      <button
                        type="button"
                        onClick={() => setUseManualRepo(!useManualRepo)}
                        className="text-[11px] text-sky-400 hover:underline"
                      >
                        {useManualRepo ? 'Choose from my repos' : 'Enter repository manually'}
                      </button>
                    )}
                  </div>

                  {user && !useManualRepo ? (
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
                  ) : (
                    <input
                      type="text"
                      value={manualRepoInput}
                      onChange={e => setManualRepoInput(e.target.value)}
                      placeholder="e.g. username/my-repo-name or https://github.com/username/my-repo-name"
                      className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none font-mono"
                    />
                  )}
                </div>

                {/* Branch & Commit Message */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Branch
                    </label>
                    <div className="relative flex items-center">
                      <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={targetBranch}
                        onChange={e => setTargetBranch(e.target.value)}
                        placeholder="main"
                        required
                        className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Commit Message
                    </label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={e => setCommitMessage(e.target.value)}
                      placeholder="Update workspace files via Gemini Live IDE"
                      required
                      className="w-full bg-[#161b22] border border-[#30363d] focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Files included pill list */}
                <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 font-medium">
                    <span>Files included in commit ({files.length}):</span>
                    <span className="text-[10px] text-slate-500 font-mono">All files up to date</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {files.map(f => (
                      <span
                        key={f.id}
                        className="px-2 py-0.5 rounded bg-[#21262d] text-slate-300 text-[11px] font-mono flex items-center gap-1 border border-[#30363d]"
                      >
                        <FileCode className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>{f.name}</span>
                        <span className="text-slate-500 text-[10px]">
                          ({f.content.split('\n').length}L)
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Push Status Notice */}
              {isPushing && (
                <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-lg text-xs text-sky-300 flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                  <span>{pushStatusStep || 'Connecting to GitHub API...'}</span>
                </div>
              )}

              {/* Push Result Success Banner */}
              {pushResult && pushResult.success && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800/70 rounded-lg text-xs text-emerald-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold block text-white">
                        Successfully pushed commit to GitHub!
                      </span>
                      {pushResult.sha && (
                        <span className="font-mono text-[10px] text-emerald-400">
                          Commit SHA: {pushResult.sha.slice(0, 7)}
                        </span>
                      )}
                    </div>
                  </div>
                  {pushResult.url && (
                    <a
                      href={pushResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <span>View Commit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Push Error Banner */}
              {pushError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/70 rounded-lg text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-rose-200">Push Failed</span>
                    <p className="mt-0.5 text-rose-300 leading-relaxed">{pushError}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPushing}
                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-600/20"
              >
                {isPushing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing & Pushing to GitHub...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Commit & Push to GitHub</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: MY REPOSITORIES */}
          {activeTab === 'repos' && (
            <div className="space-y-4">
              {!user ? (
                <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 text-center space-y-3">
                  <Key className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="font-semibold text-white text-sm">Connect GitHub Token to Browse Repos</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    To list your public and private repositories, connect a Personal Access Token with repo scope.
                  </p>
                  <div className="max-w-md mx-auto flex gap-2 pt-2">
                    <input
                      type="password"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                    />
                    <button
                      onClick={() => verifyToken(token)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ) : (
                <>
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

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedRepoForPush(repo.full_name);
                                  setActiveTab('push');
                                }}
                                className="px-2 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded text-[11px] font-medium transition-colors"
                                title="Push current workspace files to this repository"
                              >
                                Push
                              </button>
                              <button
                                onClick={() => {
                                  const [owner, rname] = repo.full_name.split('/');
                                  handleCloneRepo(owner, rname);
                                }}
                                disabled={isCloning}
                                className="px-2.5 py-1 bg-[#21262d] hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <DownloadCloud className="w-3.5 h-3.5" />
                                Clone
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: CREATE NEW REPOSITORY */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRepo} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Create New GitHub Repository
                </h3>
                <p className="text-xs text-slate-400">
                  Creates a repository on your GitHub account and immediately commits the current {files.length} workspace files.
                </p>
              </div>

              {!user && (
                <div className="p-3 bg-[#161b24] border border-[#2d3748] rounded-lg space-y-2">
                  <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Personal Access Token (PAT) with repo scope</span>
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              )}

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

              {authError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
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

          {/* TAB 4: CLONE BY URL */}
          {activeTab === 'clone_url' && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-sky-400" />
                  Clone Repository by URL or Path
                </h3>
                <p className="text-xs text-slate-400">
                  Import files from any GitHub repository into this workspace.
                </p>
              </div>

              {!user && (
                <div className="p-3 bg-[#161b24] border border-[#2d3748] rounded-lg space-y-2">
                  <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Personal Access Token (optional for public repos, required for private)</span>
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              )}

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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>GitHub Git Data API • Commits current workspace snapshot</span>
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
