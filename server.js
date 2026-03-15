import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static(resolve(__dirname, 'public')));

// ── Config ───────────────────────────────────────────────────────────────────
const TAVUS_API_KEY    = process.env.TAVUS_API_KEY;
const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID;
const TAVUS_BASE_URL   = 'https://tavusapi.com/v2';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': TAVUS_API_KEY,
};

// ── Helper ───────────────────────────────────────────────────────────────────
function checkEnv(res) {
  if (!TAVUS_API_KEY || TAVUS_API_KEY === 'your_tavus_api_key_here') {
    res.status(500).json({ error: 'Missing TAVUS_API_KEY in .env' });
    return false;
  }
  if (!TAVUS_REPLICA_ID || TAVUS_REPLICA_ID === 'your_replica_id_here') {
    res.status(500).json({ error: 'Missing TAVUS_REPLICA_ID in .env' });
    return false;
  }
  return true;
}

// ── POST /api/generate-video ──────────────────────────────────────────────────
app.post('/api/generate-video', upload.single('script'), async (req, res) => {
  if (!checkEnv(res)) return;

  let script = req.body.script;
  if (!script && req.file) {
    script = req.file.buffer.toString('utf-8').trim();
  }
  if (!script) {
    return res.status(400).json({ error: 'No script provided.' });
  }

  const videoName = req.body.videoName || 'Lecture Video';

  try {
    const createRes = await fetch(`${TAVUS_BASE_URL}/videos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ replica_id: TAVUS_REPLICA_ID, script, video_name: videoName }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return res.status(createRes.status).json({ error: `Tavus API error: ${errText}` });
    }

    const data = await createRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/video-status/:id ─────────────────────────────────────────────────
app.get('/api/video-status/:id', async (req, res) => {
  if (!checkEnv(res)) return;

  try {
    const statusRes = await fetch(`${TAVUS_BASE_URL}/videos/${req.params.id}`, {
      headers: { 'x-api-key': TAVUS_API_KEY },
    });

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      return res.status(statusRes.status).json({ error: `Tavus API error: ${errText}` });
    }

    res.json(await statusRes.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/start-conversation ──────────────────────────────────────────────
app.post('/api/start-conversation', upload.single('script'), async (req, res) => {
  if (!checkEnv(res)) return;

  let script = req.body.script;
  if (!script && req.file) {
    script = req.file.buffer.toString('utf-8').trim();
  }
  if (!script) {
    return res.status(400).json({ error: 'No script provided.' });
  }

  try {
    // 1. Create persona
    const personaRes = await fetch(`${TAVUS_BASE_URL}/personas`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        persona_name: 'Revenant Lecture Tutor',
        system_prompt: `You are a knowledgeable, friendly lecture tutor. Use the following lecture script as your core knowledge base. Answer questions about the material, explain concepts in depth, and engage the student in a natural conversation. Be concise but thorough.\n\nLECTURE SCRIPT:\n${script}`,
        default_replica_id: TAVUS_REPLICA_ID,
        layers: { llm: { model: 'tavus-gemini-2.5-flash' } },
      }),
    });

    if (!personaRes.ok) {
      const errText = await personaRes.text();
      return res.status(personaRes.status).json({ error: `Persona creation failed: ${errText}` });
    }

    const persona = await personaRes.json();

    // 2. Create conversation
    const convRes = await fetch(`${TAVUS_BASE_URL}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        replica_id: TAVUS_REPLICA_ID,
        persona_id: persona.persona_id,
        conversation_name: 'Lecture Tutoring Session',
        conversational_context: 'The student wants to discuss the lecture material and ask questions.',
        properties: { max_call_duration: 3600, enable_recording: true },
      }),
    });

    if (!convRes.ok) {
      const errText = await convRes.text();
      return res.status(convRes.status).json({ error: `Conversation creation failed: ${errText}` });
    }

    const conv = await convRes.json();
    res.json({ persona_id: persona.persona_id, ...conv });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀  Revenant server running at http://localhost:${PORT}\n`);
});
