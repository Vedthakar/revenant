import { NextResponse } from 'next/server';
import { store, FOUNDER_NAMESPACES } from '@/lib/moorchehMemory';

// Demo seed data for the three founder memory namespaces.
// POST /api/seed — loads rich founder memories for demo.

const SEMANTIC_MEMORIES = [
  {
    content: "We chose a microservices architecture over a monolith for Revenant. The core insight was that the memory system, the avatar rendering pipeline, and the integration layer all have wildly different scaling profiles. Memory retrieval needs to be sub-200ms and horizontally scalable. The avatar pipeline is GPU-bound and bursty. Integrations are I/O-bound and need independent retry logic. A monolith would have forced us to scale everything together, which would have been 3x the cost.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:001-microservices', tags: ['architecture', 'microservices', 'scaling'] },
  },
  {
    content: "We use Moorcheh AI for vector memory instead of Pinecone or Weaviate. The decision came down to three factors: (1) Moorcheh's metadata-first approach lets us store memory_strength and reinforcement_count natively, which is critical for the forgetting curve. (2) Their search API returns similarity scores we can multiply with decay, giving us cognitive-model-aware reranking. (3) Cost — at our scale, Moorcheh is 40% cheaper than Pinecone.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:003-vector-store', tags: ['moorcheh', 'vector-db', 'memory'] },
  },
  {
    content: "The three-namespace memory model (semantic, episodic, procedural) maps directly to cognitive science. Semantic memory stores facts and architecture decisions — the 'what'. Episodic memory stores stories and moments — the 'when and why it mattered'. Procedural memory stores frameworks and playbooks — the 'how to think about it'. Querying all three in parallel and reranking by decayed strength gives the avatar a response that feels like talking to someone who actually lived through the decisions.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:004-memory-namespaces', tags: ['memory-model', 'cognitive', 'namespaces'] },
  },
  {
    content: "FastAPI was chosen for the backend over Express/NestJS because the evaluation pipeline (habit scoring, batch processing, Claude API calls) is heavily async and Python's ecosystem for ML/AI ops is unmatched. The Next.js frontend handles the UI and acts as a BFF (backend-for-frontend) with API routes that proxy to FastAPI. This split means the frontend team can ship independently.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:002-backend-stack', tags: ['fastapi', 'python', 'backend'] },
  },
  {
    content: "We use Tavus for the video avatar because their API supports custom LLM endpoints. This means we route all avatar conversations through our Railtracks proxy, which enriches every message with Moorcheh founder memory before sending it to Claude. The avatar doesn't just talk — it remembers. Tavus also handles lip-sync and TTS natively, which saved us from integrating ElevenLabs separately.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:005-avatar-pipeline', tags: ['tavus', 'avatar', 'railtracks'] },
  },
  {
    content: "The Redis buffer (15-action batches per user) exists because calling Claude for every single Slack message or Git commit would be insanely expensive and noisy. Instead, we buffer 15 actions, then send the batch to Claude for habit evaluation. This gives Claude enough context to identify patterns rather than reacting to individual events. The batch size of 15 was chosen empirically — fewer than 10 events and Claude struggles to find patterns; more than 20 and latency becomes noticeable.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:006-redis-buffer', tags: ['redis', 'buffer', 'evaluation'] },
  },
  {
    content: "Unified.to handles all third-party integrations (Slack, GitHub, Jira, Gmail) through a single API. We chose it over building individual OAuth flows because we needed to ship 4+ integrations in a weekend. The tradeoff is less control over webhook payloads, but the time savings were massive. Webhooks from Unified flow into our FastAPI backend, get buffered in Redis, and eventually feed the habit evaluation pipeline.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:007-unified-integrations', tags: ['unified', 'integrations', 'oauth'] },
  },
  {
    content: "The Ebbinghaus forgetting curve is implemented as: strength(t) = base_strength × e^(-days/stability). Each time a memory is retrieved and used in a response, its stability increases (it becomes harder to forget). This means frequently-accessed architectural decisions stay strong, while stale memories naturally fade. The dashboard's Memory Health Map visualizes this decay in real-time.",
    metadata: { source_type: 'architecture_decision', source_ref: 'adr:008-forgetting-curve', tags: ['ebbinghaus', 'memory', 'decay'] },
  },
];

const EPISODIC_MEMORIES = [
  {
    content: "The Great Microservices Debate of Sprint 3. Half the team wanted to keep the monolith — 'it works, don't fix it.' I stayed up until 2 AM building a load test that showed the monolith falling over at 50 concurrent avatar sessions because the memory retrieval was blocking the video pipeline. Showed it at standup the next morning. The room went quiet. We split into services that week. Sometimes the best argument is a demo that breaks.",
    metadata: { source_type: 'story', source_ref: 'slack:C04SPRINT3/1709234567', tags: ['microservices', 'debate', 'load-test'] },
  },
  {
    content: "We almost shipped a version where the avatar had no memory at all. The Tavus integration was working — the avatar could talk, respond, look great — but it was using Gemini as a generic chatbot. A junior dev asked it 'why did we choose microservices?' and it gave a textbook answer about scalability. That was the moment I realized: the avatar without memory is just a chatbot with a face. That's when the Railtracks proxy was born — intercept every message, enrich with founder memory, then respond.",
    metadata: { source_type: 'story', source_ref: 'slack:C04GENERAL/1709345678', tags: ['avatar', 'memory', 'railtracks', 'near-miss'] },
  },
  {
    content: "The Moorcheh API went down for 4 hours on demo day eve. We had no fallback. The avatar was lobotomized — answering questions with no context, no memory, no personality. That's when we added the graceful degradation: if Moorcheh is unreachable, the avatar acknowledges it doesn't have full context but can still reason from its system prompt. We also added the health check to the dashboard after that incident.",
    metadata: { source_type: 'incident', source_ref: 'incident:INC-042', tags: ['moorcheh', 'outage', 'degradation'] },
  },
  {
    content: "The first time the forgetting curve actually worked in production was magical. A junior asked about our database choice three times over two weeks. Each time, the memory about PostgreSQL got reinforced and its stability increased. Then they asked about an old logging decision that nobody had queried in months — and the avatar said 'I have a fading memory about this... let me see what I can recall.' That gradual fade felt genuinely human.",
    metadata: { source_type: 'story', source_ref: 'pr:akashngb/revenent#34', tags: ['forgetting-curve', 'reinforcement', 'production'] },
  },
  {
    content: "During the hackathon we had a critical moment at 11 PM — the Tavus iframe wasn't loading because we forgot to add 'microphone' and 'camera' to the iframe allow list. The avatar appeared as a black rectangle. Took us 45 minutes to figure out it was a browser permissions issue, not an API issue. Lesson: always check the simplest thing first. Now we have a troubleshooting checklist in the README.",
    metadata: { source_type: 'story', source_ref: 'commit:abc123', tags: ['tavus', 'iframe', 'debugging'] },
  },
  {
    content: "The pivot from 'AI code assistant' to 'preserved founder mind' happened over a single lunch conversation. We realized that code assistants are commoditized — GitHub Copilot, Cursor, everyone has one. But nobody was preserving the institutional knowledge that lives in a founder's head: why decisions were made, what was debated, what almost went wrong. The avatar isn't competing with Copilot. It's competing with the founder leaving the company.",
    metadata: { source_type: 'story', source_ref: 'slack:C04FOUNDERS/1709456789', tags: ['pivot', 'vision', 'institutional-knowledge'] },
  },
];

const PROCEDURAL_MEMORIES = [
  {
    content: "Decision Framework: Build vs Buy. When facing a build-vs-buy decision, evaluate three axes: (1) Is this a core differentiator? If yes, build it. Our memory system is core — we built it. OAuth flows are not — we bought Unified.to. (2) What's the time-to-value delta? If buying saves >2 weeks and the vendor isn't a single point of failure, buy. (3) Will we need to fork/customize heavily? If the answer is 'probably within 6 months', build from the start.",
    metadata: { source_type: 'framework', source_ref: 'doc:decision-frameworks', tags: ['build-vs-buy', 'framework', 'decision'] },
  },
  {
    content: "Debugging Playbook: When something fails in the avatar pipeline, check in this order: (1) Is the Tavus conversation active? Check the conversation_id status. (2) Is the Railtracks endpoint reachable? Hit /api/railtracks with a test POST. (3) Is Moorcheh returning results? Check the /api/moorcheh/store endpoint. (4) Is Claude responding? Check ANTHROPIC_API_KEY validity. (5) Is it a browser permissions issue? Check iframe allow attributes. 80% of avatar issues are in steps 1 or 5.",
    metadata: { source_type: 'playbook', source_ref: 'doc:debugging-playbook', tags: ['debugging', 'avatar', 'playbook'] },
  },
  {
    content: "Code Review Heuristic: 'Would a new hire understand this in 6 months?' If the answer is no, the code needs either a comment explaining the WHY (not the what), or it needs to be refactored. We don't comment obvious code. We comment surprising code — the business rule that seems wrong but isn't, the workaround for a vendor bug, the performance optimization that sacrifices readability.",
    metadata: { source_type: 'heuristic', source_ref: 'doc:code-review-guide', tags: ['code-review', 'heuristic', 'readability'] },
  },
  {
    content: "Scaling Playbook: When to split a service. A service should be split when: (1) Two teams need to deploy independently. (2) One part of the service has fundamentally different scaling needs (CPU vs I/O vs GPU). (3) A failure in one part shouldn't take down the other. Our memory service was split from the API gateway because a Moorcheh timeout shouldn't block the health check endpoint.",
    metadata: { source_type: 'playbook', source_ref: 'doc:scaling-playbook', tags: ['scaling', 'microservices', 'splitting'] },
  },
  {
    content: "Incident Response Framework: (1) Acknowledge — tell the team what you know, even if it's incomplete. (2) Isolate — can you route around the broken thing? (3) Fix — smallest change that restores service. (4) Post-mortem — within 48 hours, no blame, focus on 'what did the system not catch?' The Moorcheh outage on demo day eve taught us that step 2 (isolate) was missing from our avatar pipeline — we had no graceful degradation.",
    metadata: { source_type: 'framework', source_ref: 'doc:incident-response', tags: ['incident', 'framework', 'postmortem'] },
  },
  {
    content: "Integration Prioritization: When choosing which integrations to build first, rank by (signal richness × team adoption). Slack is #1 because it's both rich (conversations, decisions, reactions) and universally adopted. GitHub is #2 because code changes + PR reviews are the highest-fidelity signal for engineering decisions. Jira is #3 — structured but noisy. Gmail is #4 — unstructured and often low-signal for engineering.",
    metadata: { source_type: 'framework', source_ref: 'doc:integration-priority', tags: ['integrations', 'prioritization', 'framework'] },
  },
];

export async function POST() {
  const results = { semantic: 0, episodic: 0, procedural: 0, errors: [] as string[] };

  // Seed semantic memories
  for (const mem of SEMANTIC_MEMORIES) {
    const id = await store(mem.content, mem.metadata, FOUNDER_NAMESPACES.semantic);
    if (id) results.semantic++;
    else results.errors.push(`Failed to store semantic: ${mem.content.slice(0, 50)}...`);
  }

  // Seed episodic memories
  for (const mem of EPISODIC_MEMORIES) {
    const id = await store(mem.content, mem.metadata, FOUNDER_NAMESPACES.episodic);
    if (id) results.episodic++;
    else results.errors.push(`Failed to store episodic: ${mem.content.slice(0, 50)}...`);
  }

  // Seed procedural memories
  for (const mem of PROCEDURAL_MEMORIES) {
    const id = await store(mem.content, mem.metadata, FOUNDER_NAMESPACES.procedural);
    if (id) results.procedural++;
    else results.errors.push(`Failed to store procedural: ${mem.content.slice(0, 50)}...`);
  }

  console.log('[SEED] Demo data loaded:', results);
  return NextResponse.json({
    success: results.errors.length === 0,
    loaded: {
      semantic: results.semantic,
      episodic: results.episodic,
      procedural: results.procedural,
      total: results.semantic + results.episodic + results.procedural,
    },
    errors: results.errors,
  });
}
