/**
 * Moorcheh AI — Deep Memory Integration
 * Uses semantic storage, retrieval, codebase ingestion, and interaction learning.
 */
import axios from 'axios';

const MOORCHEH_ENDPOINT = process.env.MOORCHEH_ENDPOINT || 'https://api.moorcheh.ai/v1';
const MOORCHEH_API_KEY = process.env.MOORCHEH_API_KEY || '';

// ─── Core request helper ────────────────────────────────────────────────────
async function moorchehRequest(path: string, method: 'get' | 'post' | 'delete', body?: any) {
  const res = await axios({
    method,
    url: `${MOORCHEH_ENDPOINT}${path}`,
    headers: {
      'Authorization': `Bearer ${MOORCHEH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    data: body,
    timeout: 8000,
  });
  return res.data;
}

// ─── Namespace / Collection IDs ─────────────────────────────────────────────
const NAMESPACE = 'revenent_v1';
const COLLECTIONS = {
  codeContext:    `${NAMESPACE}:code_context`,
  interactions:  `${NAMESPACE}:interactions`,
  repoInsights:  `${NAMESPACE}:repo_insights`,
  userPrefs:     `${NAMESPACE}:user_prefs`,
  errorLog:      `${NAMESPACE}:errors`,
};

// ─── 1. Semantic Retrieval ──────────────────────────────────────────────────
/**
 * Semantically retrieve the most relevant memories for a query.
 * Used by Anna before every response to inject live context.
 */
export async function retrieve(query: string, collection = COLLECTIONS.codeContext, topK = 5): Promise<string> {
  try {
    const res = await moorchehRequest('/memories/search', 'post', {
      query,
      collection_id: collection,
      top_k: topK,
    });
    const memories: any[] = res.results || res.memories || [];
    if (memories.length === 0) return '';
    return memories
      .map((m: any, i: number) => `[${i + 1}] ${m.content || m.text || JSON.stringify(m)}`)
      .join('\n');
  } catch (err: any) {
    console.warn('[MOORCHEH] retrieve failed:', err.message);
    return '';
  }
}

// ─── 2. Store Memory ────────────────────────────────────────────────────────
/**
 * Store any piece of information into Moorcheh for future retrieval.
 */
export async function store(content: string, metadata: Record<string, any> = {}, collection = COLLECTIONS.codeContext): Promise<string | null> {
  try {
    const res = await moorchehRequest('/memories', 'post', {
      content,
      collection_id: collection,
      metadata: {
        timestamp: new Date().toISOString(),
        project: 'revenent',
        ...metadata,
      },
    });
    console.log('[MOORCHEH] Stored memory:', res.memory_id || 'ok');
    return res.memory_id || null;
  } catch (err: any) {
    console.warn('[MOORCHEH] store failed:', err.message);
    return null;
  }
}

// ─── 3. Store Interaction (Q&A Learning) ────────────────────────────────────
/**
 * Store a user ↔ Anna interaction for continuous learning.
 */
export async function storeInteraction(userMessage: string, annaResponse: string, tags: string[] = []) {
  await store(
    `User asked: "${userMessage}"\nAnna responded: "${annaResponse}"`,
    { type: 'interaction', tags },
    COLLECTIONS.interactions
  );
}

// ─── 4. Ingest Codebase ─────────────────────────────────────────────────────
/**
 * Ingest file content into Moorcheh so Anna can answer questions about it.
 */
export async function ingestCode(filePath: string, content: string, repoUrl?: string) {
  await store(
    `File: ${filePath}\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``,
    { type: 'code_file', filePath, repoUrl },
    COLLECTIONS.codeContext
  );
}

// ─── 5. Ingest GitHub Repo Pulse Report ─────────────────────────────────────
/**
 * Store a repo's Pulse Report (tree, commits, PRs) for persistent context.
 */
export async function ingestRepoPulse(repoUrl: string, pulseData: {
  fileTree?: string;
  branches?: string;
  commits?: string;
  prs?: string;
  contributors?: string;
  languages?: string;
}) {
  const content = [
    `Repository: ${repoUrl}`,
    pulseData.fileTree ? `File Tree:\n${pulseData.fileTree}` : '',
    pulseData.branches ? `Branches: ${pulseData.branches}` : '',
    pulseData.commits ? `Recent Commits:\n${pulseData.commits}` : '',
    pulseData.prs ? `Pull Requests:\n${pulseData.prs}` : '',
    pulseData.contributors ? `Top Contributors: ${pulseData.contributors}` : '',
    pulseData.languages ? `Languages: ${pulseData.languages}` : '',
  ].filter(Boolean).join('\n\n');

  await store(content, { type: 'repo_pulse', repoUrl }, COLLECTIONS.repoInsights);
  console.log('[MOORCHEH] Repo pulse ingested for:', repoUrl);
}

// ─── 6. Store Error Context ──────────────────────────────────────────────────
/**
 * Log an error event so Anna can reason about recurring issues.
 */
export async function storeError(error: string, context: string) {
  await store(`Error: ${error}\nContext: ${context}`, { type: 'error' }, COLLECTIONS.errorLog);
}

// ─── 7. User Preference Store ────────────────────────────────────────────────
/**
 * Store user preferences/personalization so Anna adapts over time.
 */
export async function storeUserPref(preference: string) {
  await store(preference, { type: 'user_preference' }, COLLECTIONS.userPrefs);
}

/**
 * Retrieve all user preferences to personalize Anna's behavior.
 */
export async function getUserPrefs(): Promise<string> {
  return retrieve('user preferences coding style', COLLECTIONS.userPrefs, 10);
}

// ─── 8. Rich Context Builder ─────────────────────────────────────────────────
/**
 * Build a full context string for Anna's system prompt by querying
 * multiple Moorcheh collections in parallel.
 */
export async function buildRichContext(userQuery: string): Promise<string> {
  const [codeCtx, interactionCtx, repoCtx, prefCtx] = await Promise.allSettled([
    retrieve(userQuery, COLLECTIONS.codeContext, 3),
    retrieve(userQuery, COLLECTIONS.interactions, 2),
    retrieve(userQuery, COLLECTIONS.repoInsights, 2),
    retrieve('user preferences', COLLECTIONS.userPrefs, 2),
  ]);

  const sections: string[] = [];

  const codeVal = codeCtx.status === 'fulfilled' ? codeCtx.value : '';
  const intVal  = interactionCtx.status === 'fulfilled' ? interactionCtx.value : '';
  const repoVal = repoCtx.status === 'fulfilled' ? repoCtx.value : '';
  const prefVal = prefCtx.status === 'fulfilled' ? prefCtx.value : '';

  if (codeVal)  sections.push(`## Code Context\n${codeVal}`);
  if (intVal)   sections.push(`## Past Interactions\n${intVal}`);
  if (repoVal)  sections.push(`## Known Repositories\n${repoVal}`);
  if (prefVal)  sections.push(`## User Preferences\n${prefVal}`);

  return sections.length > 0 ? sections.join('\n\n') : 'No prior context available.';
}

// ─── Singleton export (backward compat) ─────────────────────────────────────
export const memory = {
  retrieve: (q: string) => retrieve(q),
  storeInteraction,
  ingestCode,
  ingestRepoPulse,
  buildRichContext,
  storeError,
  storeUserPref,
  getUserPrefs,
};
