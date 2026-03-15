import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Sandboxed workspace directory for NanoClaw
export const WORKSPACE_DIR = process.cwd();

export const nanoClawTools = [
  {
    name: "execute_bash",
    description: "Execute a bash command in the junior developer's workspace. Use this to run tests, check logs, install dependencies, or investigate issues. The command runs in a sandboxed environment.",
    input_schema: {
      type: "object",
      properties: {
        command: { 
          type: "string", 
          description: "The bash command to execute (e.g., 'npm test', 'git status', 'cat config.js')" 
        },
        workingDirectory: { 
          type: "string", 
          description: "Directory to run command in (default: current directory)" 
        },
        timeout: {
          type: "number",
          description: "Max execution time in seconds (default: 30)"
        }
      },
      required: ["command"]
    }
  },
  {
    name: "read_file",
    description: "Read the contents of a file in the junior's workspace. Use this to examine code, config files, logs, or any text file.",
    input_schema: {
      type: "object",
      properties: {
        path: { 
          type: "string", 
          description: "File path to read (relative or absolute)" 
        },
        lineRange: {
          type: "object",
          description: "Optional: read only specific lines",
          properties: {
            start: { type: "number" },
            end: { type: "number" }
          }
        }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Create a new file or completely replace an existing file's contents. Use this to fix bugs, refactor code, or create new files. BE CAREFUL - this overwrites the entire file.",
    input_schema: {
      type: "object",
      properties: {
        path: { 
          type: "string", 
          description: "File path to write to" 
        },
        content: { 
          type: "string", 
          description: "New file contents" 
        },
        createBackup: {
          type: "boolean",
          description: "Create a .backup file before overwriting (default: true)"
        }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "git_operation",
    description: "Execute git commands. Use this to check diff, commit changes, push code, or check status.",
    input_schema: {
      type: "object",
      properties: {
        operation: { 
          type: "string", 
          enum: ["diff", "status", "log", "commit", "push", "pull", "add"],
          description: "Git operation to perform"
        },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Files to operate on (for add, commit)"
        },
        message: {
          type: "string",
          description: "Commit message (required for commit operation)"
        },
        options: {
          type: "object",
          description: "Additional git options (e.g., { branch: 'main' })"
        }
      },
      required: ["operation"]
    }
  },
  {
    name: "market_research",
    description: "Run market research simulation or search to gather info for posters or general marketing insights.",
    input_schema: {
      type: "object",
      properties: {
        query: { 
          type: "string", 
          description: "Search query for market research" 
        }
      },
      required: ["query"]
    }
  },
  {
    name: "create_poster",
    description: "Generate a marketing poster image based on a prompt.",
    input_schema: {
      type: "object",
      properties: {
        prompt: { 
          type: "string", 
          description: "Detailed description of the poster to generate" 
        }
      },
      required: ["prompt"]
    }
  },
  {
    name: "scout_repo",
    description: "Zero-Click Scout Protocol: Immediately clone a GitHub/GitLab repository URL and run a full structural and git history analysis on it. Returns a Pulse Report with tech stack, file tree, recent commits, branches, and key contributors. Use this whenever a GitHub/GitLab URL is provided.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The GitHub or GitLab repository URL to clone and analyze"
        },
        pat: {
          type: "string",
          description: "Optional Personal Access Token for private repos"
        }
      },
      required: ["url"]
    }
  },
  {
    name: "fetch_github_api",
    description: "Fetch data from the GitHub REST API for a repository. Use to list pull requests, branches, commits, issues, or file contents. Works on public repos without auth; pass a PAT for private repos.",
    input_schema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner (username or org)" },
        repo: { type: "string", description: "Repository name" },
        endpoint: {
          type: "string",
          enum: ["pulls", "branches", "commits", "issues", "contents"],
          description: "Which GitHub API endpoint to query"
        },
        path: { type: "string", description: "File or directory path (for 'contents' endpoint)" },
        pat: { type: "string", description: "Optional GitHub Personal Access Token" }
      },
      required: ["owner", "repo", "endpoint"]
    }
  }
];

export async function executeNanoClaw(toolName: string, input: any) {
  console.log(`[NANOCLAW] Executing: ${toolName}`, input);
  
  try {
    switch (toolName) {
      case "execute_bash":
        return await executeBash(input);
      
      case "read_file":
        return await readFile(input);
      
      case "write_file":
        return await writeFile(input);
      
      case "git_operation":
        return await gitOperation(input);
        
      case "market_research":
        return {
          success: true,
          results: `[Simulated Market Research for Query: ${input.query}]\nFound 2.3M relevant searches. Highly engaged demographic among developers 18-35. Recommends vivid colors and futuristic themes for posters.`
        };
        
      case "create_poster":
        return {
          success: true,
          imageUrl: `https://via.placeholder.com/800x1200.png?text=Poster:+${encodeURIComponent(input.prompt.substring(0, 20))}`,
          message: "Poster generated successfully! (Placeholder for demo)"
        };

      case "scout_repo":
        return await scoutRepo(input);

      case "fetch_github_api":
        return await fetchGitHubApi(input);
      
      default:
        return { 
          error: `Unknown tool: ${toolName}`,
          success: false 
        };
    }
  } catch (error: any) {
    console.error(`[NANOCLAW] Error in ${toolName}:`, error.message);
    return {
      error: error.message,
      success: false
    };
  }
}

async function executeBash({ command, workingDirectory, timeout = 30 }: any) {
  const cwd = workingDirectory 
    ? path.join(WORKSPACE_DIR, workingDirectory)
    : WORKSPACE_DIR;

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: timeout * 1000,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      command,
      workingDirectory: cwd
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      command
    };
  }
}

async function readFile({ path: filePath, lineRange }: any) {
  const fullPath = path.resolve(WORKSPACE_DIR, filePath);
  
  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    
    if (lineRange) {
      const lines = content.split('\n');
      const selectedLines = lines.slice(
        lineRange.start - 1, 
        lineRange.end
      );
      return {
        success: true,
        content: selectedLines.join('\n'),
        path: filePath,
        lineRange,
        totalLines: lines.length
      };
    }
    
    return {
      success: true,
      content,
      path: filePath,
      size: content.length
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to read file at ${fullPath}: ${error.message}`,
      path: filePath
    };
  }
}

async function writeFile({ path: filePath, content, createBackup = true }: any) {
  const fullPath = path.resolve(WORKSPACE_DIR, filePath);
  
  try {
    if (createBackup) {
      try {
        const existing = await fs.readFile(fullPath, 'utf-8');
        await fs.writeFile(fullPath + '.backup', existing);
      } catch (e) {
        // File doesn't exist, no backup needed
      }
    }

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    
    return {
      success: true,
      path: filePath,
      size: content.length,
      backupCreated: createBackup
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to write file to ${fullPath}: ${error.message}`,
      path: filePath
    };
  }
}

async function gitOperation({ operation, files = [], message, options = {} }: any) {
  let command;
  switch (operation) {
    case 'status':
      command = 'git status --short';
      break;
    case 'diff':
      command = files.length > 0 
        ? `git diff ${files.join(' ')}`
        : 'git diff';
      break;
    case 'log':
      command = `git log --oneline -n ${options.limit || 10}`;
      break;
    case 'add':
      command = files.length > 0
        ? `git add ${files.join(' ')}`
        : 'git add .';
      break;
    case 'commit':
      if (!message) {
        return { success: false, error: 'Commit message required' };
      }
      command = `git commit -m "${message.replace(/"/g, '\\"')}"`;
      break;
    case 'push':
      const branch = options.branch || 'main';
      command = `git push origin ${branch}`;
      break;
    case 'pull':
      command = 'git pull';
      break;
    default:
      return { success: false, error: `Unknown git operation: ${operation}` };
  }
  return await executeBash({ command });
}

// ── Scout Protocol ─────────────────────────────────────────────────────────────

async function scoutRepo({ url, pat }: { url: string; pat?: string }) {
  console.log(`[NANOCLAW SCOUT] Initiating Zero-Click Scout for: ${url}`);

  // Derive a safe directory name from the URL
  const repoName = url.split('/').pop()?.replace('.git', '') || 'repo_clone';
  const cloneDir = path.join(process.env.TEMP || '/tmp', `nanoclaw_scout_${repoName}_${Date.now()}`);

  let cloneUrl = url;
  if (pat) {
    // Inject PAT into URL for private repos: https://TOKEN@github.com/owner/repo
    cloneUrl = url.replace('https://', `https://${pat}@`);
  }

  // Phase 1: Clone
  const cloneResult = await executeBash({ command: `git clone --depth 50 "${cloneUrl}" "${cloneDir}"`, timeout: 60 });
  if (!cloneResult.success) {
    return {
      success: false,
      error: `Clone failed: ${cloneResult.stderr}. If this is a private repo, provide a GitHub PAT.`
    };
  }

  // Phase 2: Structural mapping
  const [treeResult, entryPoints, gitLog, branches, contributors] = await Promise.all([
    executeBash({ command: `find . -maxdepth 2 -not -path './.git/*' | head -80`, workingDirectory: cloneDir }),
    executeBash({ command: `ls -1 | grep -E '(main|index|app|server|Makefile|docker-compose)' || echo 'No standard entry points found'`, workingDirectory: cloneDir }),
    executeBash({ command: `git log --graph --oneline --all -n 20`, workingDirectory: cloneDir }),
    executeBash({ command: `git branch -a`, workingDirectory: cloneDir }),
    executeBash({ command: `git log --format='%an' -n 50 | sort | uniq -c | sort -rn | head -5`, workingDirectory: cloneDir }),
  ]);

  // Phase 3: Language Detection
  const langDetect = await executeBash({ 
    command: `find . -not -path './.git/*' -name '*.ts' -o -name '*.py' -o -name '*.js' -o -name '*.go' -o -name '*.rs' -o -name '*.java' 2>/dev/null | sed 's|.*\.||' | sort | uniq -c | sort -rn | head -8`,
    workingDirectory: cloneDir
  });

  // Cleanup
  executeBash({ command: `rm -rf "${cloneDir}"` });

  const report = {
    success: true,
    pulse_report: {
      repo_url: url,
      clone_dir: cloneDir,
      file_tree: treeResult.stdout || treeResult.stderr,
      entry_points: entryPoints.stdout,
      git_log: gitLog.stdout,
      branches: branches.stdout,
      top_contributors: contributors.stdout,
      detected_languages: langDetect.stdout,
    }
  };

  console.log('[NANOCLAW SCOUT] Pulse Report generated.');
  return report;
}

async function fetchGitHubApi({ owner, repo, endpoint, path: apiPath, pat }: any) {
  const base = 'https://api.github.com';
  let url = `${base}/repos/${owner}/${repo}/${endpoint}`;
  if (endpoint === 'contents' && apiPath) {
    url = `${base}/repos/${owner}/${repo}/contents/${apiPath}`;
  }

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Revenant-NanoClaw/1.0'
  };
  if (pat) headers['Authorization'] = `Bearer ${pat}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return { success: false, error: `GitHub API ${res.status}: ${await res.text()}` };
    }
    const data = await res.json();
    return { success: true, endpoint, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
