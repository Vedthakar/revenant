import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const TAVUS_API_KEY  = process.env.TAVUS_API_KEY;
const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID;
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

if (!TAVUS_API_KEY || TAVUS_API_KEY === 'your_tavus_api_key_here') {
  console.error('❌  Missing TAVUS_API_KEY — add it to your .env file.');
  process.exit(1);
}
if (!TAVUS_REPLICA_ID || TAVUS_REPLICA_ID === 'your_replica_id_here') {
  console.error('❌  Missing TAVUS_REPLICA_ID — add it to your .env file.');
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Read the sample script from disk. */
function loadScript(filePath) {
  const absPath = resolve(__dirname, filePath);
  const text = readFileSync(absPath, 'utf-8').trim();
  console.log(`📄  Loaded script (${text.length} chars) from ${absPath}`);
  return text;
}

/** POST to Tavus to generate a video from a script. */
async function generateVideo(script, videoName = 'Sample Lecture') {
  const url = `${TAVUS_BASE_URL}/videos`;

  const body = {
    replica_id: TAVUS_REPLICA_ID,
    script,
    video_name: videoName,
  };

  console.log(`\n🚀  Requesting video generation...`);
  console.log(`    Replica:  ${TAVUS_REPLICA_ID}`);
  console.log(`    Name:     ${videoName}`);
  console.log(`    Script:   "${script.slice(0, 80)}…"\n`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TAVUS_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tavus API error ${res.status}: ${errText}`);
  }

  return res.json();
}

/** Poll GET /v2/videos/:id until status is "ready" or we time out. */
async function pollVideoStatus(videoId, { intervalMs = 10_000, maxAttempts = 60 } = {}) {
  const url = `${TAVUS_BASE_URL}/videos/${videoId}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      headers: { 'x-api-key': TAVUS_API_KEY },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tavus API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const status = data.status;

    console.log(`⏳  [${attempt}/${maxAttempts}] Video status: ${status}`);

    if (status === 'ready') {
      return data;
    }
    if (status === 'failed' || status === 'error') {
      throw new Error(`Video generation failed: ${JSON.stringify(data)}`);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Timed out waiting for video to be ready.');
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const scriptPath = process.argv[2] || 'scripts/sample_script.txt';
  const script = loadScript(scriptPath);

  // 1. Request video generation
  const createRes = await generateVideo(script);
  console.log('✅  Video creation response:', JSON.stringify(createRes, null, 2));

  const videoId = createRes.video_id;
  if (!videoId) {
    console.log('⚠️  No video_id in response — cannot poll status.');
    return;
  }

  // 2. Poll until ready
  console.log(`\n🔄  Polling for video ${videoId}...\n`);
  const finalVideo = await pollVideoStatus(videoId);

  console.log('\n🎬  Video is ready!');
  console.log(`    Download URL: ${finalVideo.download_url ?? finalVideo.hosted_url ?? '(check dashboard)'}`);
  console.log('    Full response:', JSON.stringify(finalVideo, null, 2));
}

main().catch((err) => {
  console.error('\n💥  Error:', err.message);
  process.exit(1);
});
