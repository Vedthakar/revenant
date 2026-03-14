import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const TAVUS_API_KEY    = process.env.TAVUS_API_KEY;
const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID;
const TAVUS_BASE_URL   = 'https://tavusapi.com/v2';

if (!TAVUS_API_KEY || TAVUS_API_KEY === 'your_tavus_api_key_here') {
  console.error('❌  Missing TAVUS_API_KEY — add it to your .env file.');
  process.exit(1);
}
if (!TAVUS_REPLICA_ID || TAVUS_REPLICA_ID === 'your_replica_id_here') {
  console.error('❌  Missing TAVUS_REPLICA_ID — add it to your .env file.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': TAVUS_API_KEY,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadScript(filePath) {
  const absPath = resolve(__dirname, '..', filePath);
  const text = readFileSync(absPath, 'utf-8').trim();
  console.log(`📄  Loaded context script (${text.length} chars) from ${absPath}`);
  return text;
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open'
            : process.platform === 'win32' ? 'start'
            : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

// ── Step 1: Create a Persona ────────────────────────────────────────────────

async function createPersona(contextScript) {
  const url = `${TAVUS_BASE_URL}/personas`;

  const body = {
    persona_name: 'Revenent Lecture Tutor',
    system_prompt: `You are a knowledgeable, friendly lecture tutor. Use the following lecture script as your core knowledge base. Answer questions about the material, explain concepts in depth, and engage the student in a natural conversation. Be concise but thorough.

LECTURE SCRIPT:
${contextScript}`,
    default_replica_id: TAVUS_REPLICA_ID,
    layers: {
      llm: {
        model: 'tavus-gemini-2.5-flash',
      },
    },
  };

  console.log('\n🧠  Creating persona with Gemini LLM...');

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create persona (${res.status}): ${errText}`);
  }

  const data = await res.json();
  console.log('✅  Persona created:', data.persona_id);
  return data;
}

// ── Step 2: Create a Conversation ───────────────────────────────────────────

async function createConversation(personaId) {
  const url = `${TAVUS_BASE_URL}/conversations`;

  const body = {
    replica_id: TAVUS_REPLICA_ID,
    persona_id: personaId,
    conversation_name: 'Lecture Tutoring Session',
    conversational_context: 'The student wants to discuss the lecture material and ask questions.',
    properties: {
      max_call_duration: 3600,
      enable_recording: true,
    },
  };

  console.log('\n📞  Starting conversation...');

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create conversation (${res.status}): ${errText}`);
  }

  const data = await res.json();
  console.log('✅  Conversation created:', data.conversation_id);
  return data;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const scriptPath = process.argv[2] || 'scripts/sample_script.txt';
  const contextScript = loadScript(scriptPath);

  // 1. Create persona with Gemini brain + lecture context
  const persona = await createPersona(contextScript);

  // 2. Start a conversation
  const conversation = await createConversation(persona.persona_id);

  const conversationUrl = conversation.conversation_url;

  console.log('\n' + '═'.repeat(60));
  console.log('🎬  Your conversation is ready!');
  console.log(`    URL: ${conversationUrl}`);
  console.log('═'.repeat(60) + '\n');

  // 3. Open in browser
  if (conversationUrl) {
    console.log('🌐  Opening in your browser...');
    openUrl(conversationUrl);
  } else {
    console.log('⚠️  No conversation_url returned. Check the Tavus dashboard.');
  }
}

main().catch((err) => {
  console.error('\n💥  Error:', err.message);
  process.exit(1);
});
