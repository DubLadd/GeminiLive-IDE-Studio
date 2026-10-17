/**
 * GitHub API Integration Service
 * Handles Personal Access Token authentication, repository listings,
 * cloning repos into workspace files, creating new repositories, and pushing commits.
 */

import { ProjectFile } from '../types/ide';

const GITHUB_TOKEN_STORAGE_KEY = 'gemini_ide_github_pat';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  bio?: string;
  public_repos: number;
  total_private_repos?: number;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  default_branch: string;
  updated_at: string;
  stargazers_count: number;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubFileEntry {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url: string | null;
}

// Token Storage Helpers
export function getStoredGitHubToken(): string | null {
  try {
    return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredGitHubToken(token: string): void {
  try {
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token.trim());
  } catch (err) {
    console.warn('Failed to store GitHub token in localStorage', err);
  }
}

export function clearStoredGitHubToken(): void {
  try {
    localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to remove GitHub token', err);
  }
}

// Base Fetch helper with headers
async function githubFetch(endpoint: string, token: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `GitHub API Error (${response.status}): ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response;
}

// Validate Token & Fetch User Profile
export async function validateGitHubToken(token: string): Promise<GitHubUser> {
  const res = await githubFetch('/user', token);
  return await res.json();
}

// Fetch User's Repositories (Sorted by last updated)
export async function getUserRepositories(token: string, perPage = 30): Promise<GitHubRepo[]> {
  const res = await githubFetch(`/user/repos?sort=updated&per_page=${perPage}&affiliation=owner,collaborator`, token);
  return await res.json();
}

// Search public/private repositories
export async function searchRepositories(token: string, query: string): Promise<GitHubRepo[]> {
  const encoded = encodeURIComponent(query);
  const res = await githubFetch(`/search/repositories?q=${encoded}&sort=updated&per_page=15`, token);
  const data = await res.json();
  return data.items || [];
}

// Determine file language from extension
function getLanguageFromFilename(filename: string): ProjectFile['language'] {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'py':
      return 'python';
    case 'md':
      return 'markdown';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'plaintext';
  }
}

// Fetch recursive files tree of a repository
export async function fetchRepoTreeFiles(
  token: string,
  owner: string,
  repo: string,
  branch = 'main'
): Promise<ProjectFile[]> {
  let treeSha = branch;
  try {
    const branchRes = await githubFetch(`/repos/${owner}/${repo}/branches/${branch}`, token);
    const branchData = await branchRes.json();
    treeSha = branchData.commit.sha;
  } catch {
    // fallback to default repo info
    const repoRes = await githubFetch(`/repos/${owner}/${repo}`, token);
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || 'main';
    const branchRes = await githubFetch(`/repos/${owner}/${repo}/branches/${defaultBranch}`, token);
    const branchData = await branchRes.json();
    treeSha = branchData.commit.sha;
  }

  // Get recursive tree
  const treeRes = await githubFetch(`/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, token);
  const treeData = await treeRes.json();

  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new Error('No files found in repository tree.');
  }

  // Filter for readable text files (limit size to max 25 files, each < 500KB to prevent browser lockup)
  const codeExtensions = ['.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.py', '.txt', '.sh', '.sql', '.yaml', '.yml'];
  const relevantNodes = treeData.tree
    .filter((node: any) => node.type === 'blob')
    .filter((node: any) => codeExtensions.some(ext => node.path.toLowerCase().endsWith(ext)))
    .slice(0, 30);

  const importedFiles: ProjectFile[] = [];

  for (const node of relevantNodes) {
    try {
      const blobRes = await githubFetch(`/repos/${owner}/${repo}/git/blobs/${node.sha}`, token);
      const blobData = await blobRes.json();

      let content = '';
      if (blobData.encoding === 'base64') {
        content = decodeURIComponent(
          escape(window.atob(blobData.content.replace(/\s/g, '')))
        );
      } else {
        content = blobData.content;
      }

      importedFiles.push({
        id: `gh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: node.path,
        content,
        language: getLanguageFromFilename(node.path),
      });
    } catch (err) {
      console.warn(`Could not fetch file content for ${node.path}`, err);
    }
  }

  // If no code files were found, synthesize a README
  if (importedFiles.length === 0) {
    importedFiles.push({
      id: `gh-readme-${Date.now()}`,
      name: 'README.md',
      content: `# ${repo}\nCloned from https://github.com/${owner}/${repo}\n\nRepository imported into Gemini Live IDE.`,
      language: 'markdown',
    });
  }

  return importedFiles;
}

// Create a new Repository for the user
export async function createGitHubRepository(
  token: string,
  name: string,
  description: string,
  isPrivate: boolean
): Promise<GitHubRepo> {
  const res = await githubFetch('/user/repos', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.trim().replace(/\s+/g, '-'),
      description: description.trim(),
      private: isPrivate,
      auto_init: true,
    }),
  });

  return await res.json();
}

/**
 * Commit & Push Project Files to a GitHub Repository via GitHub REST / Git Data API.
 * Supports existing repositories, branch updates, and brand-new empty repositories.
 */
export async function pushProjectToGitHub(
  token: string,
  owner: string,
  repo: string,
  files: ProjectFile[],
  commitMessage: string,
  branch = 'main'
): Promise<{ success: boolean; commitUrl?: string; sha?: string }> {
  if (!token || !token.trim()) {
    throw new Error('A valid GitHub Personal Access Token (PAT) with "repo" scope is required.');
  }
  if (!owner || !repo) {
    throw new Error('Target repository owner and name must be specified (e.g. "username/repository").');
  }
  if (!files || files.length === 0) {
    throw new Error('No files found in workspace to commit.');
  }

  // Clean owner and repo names
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  let branchRef = (branch || 'main').trim();
  let latestCommitSha = '';
  let isNewBranchOrEmpty = false;

  // Step 1: Try to locate latest commit SHA for the branch
  try {
    const refRes = await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/ref/heads/${branchRef}`, token);
    const refData = await refRes.json();
    latestCommitSha = refData.object.sha;
  } catch (refErr: any) {
    // If heads/${branchRef} does not exist, check repo default branch
    try {
      const repoRes = await githubFetch(`/repos/${cleanOwner}/${cleanRepo}`, token);
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || 'main';
      const refRes = await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/ref/heads/${defaultBranch}`, token);
      const refData = await refRes.json();
      latestCommitSha = refData.object.sha;
      branchRef = defaultBranch;
    } catch {
      // Repository might be brand new with zero commits
      isNewBranchOrEmpty = true;
    }
  }

  // Step 2: Get base tree if existing commit exists
  let baseTreeSha: string | undefined = undefined;
  if (latestCommitSha) {
    try {
      const commitRes = await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/commits/${latestCommitSha}`, token);
      const commitData = await commitRes.json();
      baseTreeSha = commitData.tree.sha;
    } catch (commitErr) {
      console.warn('Could not retrieve base tree sha:', commitErr);
    }
  }

  // Step 3: Create Git Blobs for all project files
  const treeItems = [];

  for (const file of files) {
    const blobRes = await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/blobs`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: file.content,
        encoding: 'utf-8',
      }),
    });
    const blobData = await blobRes.json();

    treeItems.push({
      path: file.name,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  // Step 4: Create new Git Tree
  const treePayload: any = { tree: treeItems };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const newTreeRes = await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/trees`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(treePayload),
  });
  const newTreeData = await newTreeRes.json();

  // Step 5: Create new Git Commit
  const message =
    commitMessage.trim() ||
    `Update ${files.length} workspace files via Gemini Live IDE [${new Date().toISOString()}]`;

  const commitPayload: any = {
    message,
    tree: newTreeData.sha,
    parents: latestCommitSha ? [latestCommitSha] : [],
  };

  const newCommitRes = await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/commits`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commitPayload),
  });
  const newCommitData = await newCommitRes.json();

  // Step 6: Update branch ref or create it if missing
  if (latestCommitSha && !isNewBranchOrEmpty) {
    await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/refs/heads/${branchRef}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false,
      }),
    });
  } else {
    // Create new ref
    await githubFetch(`/repos/${cleanOwner}/${cleanRepo}/git/refs`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: `refs/heads/${branchRef}`,
        sha: newCommitData.sha,
      }),
    });
  }

  return {
    success: true,
    sha: newCommitData.sha,
    commitUrl: `https://github.com/${cleanOwner}/${cleanRepo}/commit/${newCommitData.sha}`,
  };
}
