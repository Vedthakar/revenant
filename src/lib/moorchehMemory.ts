/**
 * Moorcheh AI — Deep Memory Integration
 * Three-namespace founder memory with Ebbinghaus forgetting curve.
 */
import axios from 'axios';

const MOORCHEH_ENDPOINT = process.env.MOORCHEH_ENDPOINT || 'https://api.moorcheh.ai/v1';
const MOORCHEH_API_KEY = process.env.MOORCHEH_API_KEY || '';

// ─── Core request helper ────────────────────────────────────────────────────
async function moorchehRequest(path: string, method: 'get' | 'post' | 'put' | 'delete', body?: any) {
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

// ─── Founder Namespaces (cognitive model) ───────────────────────────────────
export const FOUNDER_NAMESPACES = {
  semantic:   'founder-semantic',    // Architecture decisions, tech choices, conventions
  episodic:   'founder-episodic',    // Stories, near-misses, pivotal moments
  procedural: 'founder-procedural',  // Decision frameworks, heuristics, playbooks
} as const;

// Legacy collections (kept for backward compat with existing data)
const LEGACY_NAMESPACE = 'revenent_v1';
const LEGACY_COLLECTIONS = {
  codeContext:   `${LEGACY_NAMESPACE}:code_context`,
  interactions:  `${LEGACY_NAMESPACE}:interactions`,
  repoInsights:  `${LEGACY_NAMESPACE}:repo_insights`,
  userPrefs:     `${LEGACY_NAMESPACE}:user_prefs`,
  errorLog:      `${LEGACY_NAMESPACE}:errors`,
};

// ─── Ebbinghaus Forgetting Curve ────────────────────────────────────────────
const BASE_STRENGTH = 1.0;
const DEFAULT_STABILITY = 14; // days before strength halves without reinforcement

export interface MemoryMetadata {
  memory_strength: number;
  reinforcement_count: number;
  last_reinforced_at: string;
  created_at: string;
  stability: number; // days — grows with each reinforcement
  source_type?: string;
  source_ref?: string; // e.g. "slack:C04ABC123/1234567890" or "pr:owner/repo#42"
  [key: string]: any;
}

function computeDecayedStrength(meta: Partial<MemoryMetadata>): number {
  const strength = meta.memory_strength ?? BASE_STRENGTH;
  const stability = meta.stability ?? DEFAULT_STABILITY;
  const lastReinforced = meta.last_reinforced_at || meta.created_at || new Date().toISOString();
  const daysSince = (Date.now() - new Date(lastReinforced).getTime()) / (1000 * 60 * 60 * 24);
  // Ebbinghaus: S(t) = S_0 * e^(-t / stability)
  return strength * Math.exp(-daysSince / stability);
}

function buildInitialMetadata(overrides: Partial<MemoryMetadata> = {}): MemoryMetadata {
  const now = new Date().toISOString();
  return {
    memory_strength: BASE_STRENGTH,
    reinforcement_count: 0,
    last_reinforced_at: now,
    created_at: now,
    stability: DEFAULT_STABILITY,
    project: 'revenent',
    ...overrides,
  };
}

// ─── Raw Retrieval (returns full objects for reranking) ─────────────────────
export interface MemoryResult {
  id: string;
  content: string;
  score: number;       // semantic similarity from Moorcheh
  metadata: Partial<MemoryMetadata>;
  decayed_strength: number;
  effective_score: number; // score * decayed_strength
}

async function retrieveRaw(query: string, collection: string, topK = 8): Promise<MemoryResult[]> {
  try {
    const res = await moorchehRequest('/memories/search', 'post', {
      query,
      collection_id: collection,
      top_k: topK,
    });
    const memories: any[] = res.results || res.memories || [];
    return memories.map((m: any) => {
      const meta = m.metadata || {};
      const decayed = computeDecayedStrength(meta);
      const similarity = m.score ?? m.similarity ?? 1.0;
      return {
        id: m.id || m.memory_id || '',
        content: m.content || m.text || JSON.stringify(m),
        score: similarity,
        metadata: meta,
        decayed_strength: decayed,
        effective_score: similarity * decayed,
      };
    });
  } catch (err: any) {
    console.warn(`[MOORCHEH] retrieveRaw failed for ${collection}:`, err.message);
    return [];
  }
}

// ─── Reinforcement ──────────────────────────────────────────────────────────
async function reinforceMemory(memoryId: string): Promise<void> {
  if (!memoryId) return;
  try {
    // Try to update the memory's metadata to bump strength
    await moorchehRequest(`/memories/${memoryId}`, 'put', {
      metadata: {
        last_reinforced_at: new Date().toISOString(),
        // Moorcheh should merge metadata; we signal reinforcement
        _reinforce: true,
      },
    });
  } catch {
    // Non-critical — reinforcement is best-effort
  }
}

// ─── Public API: retrieve with formatting ───────────────────────────────────
export async function retrieve(query: string, collection: string = FOUNDER_NAMESPACES.semantic, topK = 5): Promise<string> {
  const results = await retrieveRaw(query, collection, topK);
  if (results.length === 0) return '';
  // Sort by effective score (decayed strength * similarity)
  results.sort((a, b) => b.effective_score - a.effective_score);
  return results
    .slice(0, topK)
    .map((m, i) => `[${i + 1}] ${m.content}`)
    .join('\n');
}

// ─── Store with strength metadata ───────────────────────────────────────────
export async function store(
  content: string,
  metadata: Record<string, any> = {},
  collection: string = FOUNDER_NAMESPACES.semantic,
): Promise<string | null> {
  try {
    const res = await moorchehRequest('/memories', 'post', {
      content,
      collection_id: collection,
      metadata: buildInitialMetadata(metadata),
    });
    console.log('[MOORCHEH] Stored memory:', res.memory_id || 'ok');
    return res.memory_id || null;
  } catch (err: any) {
    console.warn('[MOORCHEH] store failed:', err.message);
    return null;
  }
}

// ─── Three-Namespace Founder Context Builder ────────────────────────────────
export interface FounderContextResult {
  formatted: string;
  sources: { id: string; content: string; namespace: string; source_ref?: string }[];
  reinforcedIds: string[];
}

export async function buildFounderContext(userQuery: string, topKPerNamespace = 4): Promise<FounderContextResult> {
  const [semanticResults, episodicResults, proceduralResults] = await Promise.all([
    retrieveRaw(userQuery, FOUNDER_NAMESPACES.semantic, topKPerNamespace),
    retrieveRaw(userQuery, FOUNDER_NAMESPACES.episodic, topKPerNamespace),
    retrieveRaw(userQuery, FOUNDER_NAMESPACES.procedural, topKPerNamespace),
  ]);

  // Merge all results and sort by effective score
  const allResults = [
    ...semanticResults.map(r => ({ ...r, namespace: 'semantic' })),
    ...episodicResults.map(r => ({ ...r, namespace: 'episodic' })),
    ...proceduralResults.map(r => ({ ...r, namespace: 'procedural' })),
  ].sort((a, b) => b.effective_score - a.effective_score);

  // Build formatted context sections
  const sections: string[] = [];

  const semFormatted = semanticResults
    .sort((a, b) => b.effective_score - a.effective_score)
    .slice(0, 3)
    .map((m, i) => `  [${i + 1}] ${m.content}`)
    .join('\n');
  if (semFormatted) sections.push(`## Semantic Memory (Architecture & Decisions)\n${semFormatted}`);

  const epiFormatted = episodicResults
    .sort((a, b) => b.effective_score - a.effective_score)
    .slice(0, 3)
    .map((m, i) => `  [${i + 1}] ${m.content}`)
    .join('\n');
  if (epiFormatted) sections.push(`## Episodic Memory (Stories & Moments)\n${epiFormatted}`);

  const procFormatted = proceduralResults
    .sort((a, b) => b.effective_score - a.effective_score)
    .slice(0, 3)
    .map((m, i) => `  [${i + 1}] ${m.content}`)
    .join('\n');
  if (procFormatted) sections.push(`## Procedural Memory (Frameworks & Playbooks)\n${procFormatted}`);

  const formatted = sections.length > 0
    ? sections.join('\n\n')
    : 'No founder memories available yet.';

  // Collect sources for cited-sources bar
  const sources = allResults.slice(0, 8).map(r => ({
    id: r.id,
    content: r.content.slice(0, 120),
    namespace: r.namespace,
    source_ref: r.metadata.source_ref,
  }));

  // Reinforce top retrieved memories (fire-and-forget)
  const reinforcedIds = allResults.slice(0, 5).map(r => r.id).filter(Boolean);
  reinforcedIds.forEach(id => reinforceMemory(id));

  return { formatted, sources, reinforcedIds };
}

// ─── Legacy buildRichContext (backward compat for /api/openai proxy) ────────
export async function buildRichContext(userQuery: string): Promise<string> {
  // Try founder namespaces first
  const founder = await buildFounderContext(userQuery);
  if (founder.formatted !== 'No founder memories available yet.') {
    return founder.formatted;
  }
  // Fall back to legacy collections
  const [codeCtx, interactionCtx, repoCtx, prefCtx] = await Promise.allSettled([
    retrieve(userQuery, LEGACY_COLLECTIONS.codeContext, 3),
    retrieve(userQuery, LEGACY_COLLECTIONS.interactions, 2),
    retrieve(userQuery, LEGACY_COLLECTIONS.repoInsights, 2),
    retrieve('user preferences', LEGACY_COLLECTIONS.userPrefs, 2),
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

// ─── Convenience wrappers ───────────────────────────────────────────────────
export async function storeInteraction(userMessage: string, assistantResponse: string, tags: string[] = []) {
  await store(
    `User asked: "${userMessage}"\nRevenant responded: "${assistantResponse}"`,
    { type: 'interaction', tags },
    FOUNDER_NAMESPACES.episodic,
  );
}

export async function ingestCode(filePath: string, content: string, repoUrl?: string) {
  await store(
    `File: ${filePath}\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``,
    { type: 'code_file', filePath, repoUrl },
    FOUNDER_NAMESPACES.semantic,
  );
}

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

  await store(content, { type: 'repo_pulse', repoUrl }, FOUNDER_NAMESPACES.semantic);
}

export async function storeError(error: string, context: string) {
  await store(`Error: ${error}\nContext: ${context}`, { type: 'error' }, LEGACY_COLLECTIONS.errorLog);
}

export async function storeUserPref(preference: string) {
  await store(preference, { type: 'user_preference' }, LEGACY_COLLECTIONS.userPrefs);
}

export async function getUserPrefs(): Promise<string> {
  return retrieve('user preferences coding style', LEGACY_COLLECTIONS.userPrefs, 10);
}

// ─── Memory Health API (for dashboard D3 graph) ─────────────────────────────
export interface MemoryNode {
  id: string;
  content: string;
  namespace: string;
  memory_strength: number;
  decayed_strength: number;
  reinforcement_count: number;
  last_reinforced_at: string;
  created_at: string;
}

export async function getMemoryHealth(): Promise<MemoryNode[]> {
  const nodes: MemoryNode[] = [];
  for (const [label, collection] of Object.entries(FOUNDER_NAMESPACES)) {
    try {
      // Retrieve a broad set to show the health map
      const res = await moorchehRequest('/memories/search', 'post', {
        query: '*',
        collection_id: collection,
        top_k: 30,
      });
      const memories: any[] = res.results || res.memories || [];
      for (const m of memories) {
        const meta = m.metadata || {};
        nodes.push({
          id: m.id || m.memory_id || `${label}-${Math.random()}`,
          content: (m.content || m.text || '').slice(0, 200),
          namespace: label,
          memory_strength: meta.memory_strength ?? BASE_STRENGTH,
          decayed_strength: computeDecayedStrength(meta),
          reinforcement_count: meta.reinforcement_count ?? 0,
          last_reinforced_at: meta.last_reinforced_at || meta.created_at || '',
          created_at: meta.created_at || '',
        });
      }
    } catch {
      // skip namespace if unreachable
    }
  }
  return nodes;
}

// ─── Singleton export (backward compat) ─────────────────────────────────────
export const memory = {
  retrieve: (q: string) => retrieve(q),
  storeInteraction,
  ingestCode,
  ingestRepoPulse,
  buildRichContext,
  buildFounderContext,
  storeError,
  storeUserPref,
  getUserPrefs,
  getMemoryHealth,
};
