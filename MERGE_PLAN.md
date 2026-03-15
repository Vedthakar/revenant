# Revenant Hackathon — Branch Integration Plan

**Goal:** Merge `seeron`, `vedd`, and `best-ui-itw` into `main` as fast and safely as possible.  
**Strategy:** Fastest stable path — create an integration branch, merge branches in order, then squash-merge to `main`.

---

## 0. Critical Context: Divergent Histories

> ⚠️ **Important:** `main` and the three development branches have **no shared git history**.
> `main` was bootstrapped separately as a minimal Node.js Tavus script project.
> The dev branches evolved from a separate Next.js/FastAPI full-stack application root.
>
> Any merge of a dev branch into `main` **must use `--allow-unrelated-histories`**.
> The Node.js scripts from `main` (`src/tavus.js`, `src/converse.js`) already have equivalents
> under `tools/tavus/` in the dev branches (committed in `seeron`) — no functionality is lost.

---

## 1. Branch Summary

### `main` (base target)
| Field | Detail |
|---|---|
| HEAD | `293cbbc` |
| Commit message | `feat: set up Tavus conversational video integration with Gemini LLM` |
| Key files | `src/tavus.js`, `src/converse.js`, `package.json` (Node-only) |
| Tech | Node.js, dotenv — no frontend framework, no backend |

### `seeron`
| Field | Detail |
|---|---|
| Commits ahead of main | 8 |
| Commits behind main | 2 |
| Key new files | `src/app/api/railtracks/route.ts`, `tools/tavus/tavus.js`, `tools/tavus/converse.js` |
| Key modified files | `package.json` (added `@ai-sdk/anthropic`, `ai`, `dotenv`) |
| What it does | Adds a Claude 3.5 Sonnet streaming API endpoint (`/api/railtracks`) for Tavus video replica conversations; migrates Tavus scripts to `tools/tavus/` |
| Risk | **LOW** — purely additive; no conflicts with vedd on shared code |

### `vedd`
| Field | Detail |
|---|---|
| Commits ahead of main | 7 |
| Commits behind main | 2 |
| Key new files | `src/app/integrations/page.tsx`, `src/app/signup/page.tsx`, `src/app/team/page.tsx`, `src/app/dashboard/page.tsx`, `backend/app/routers/webhooks.py`, `backend/app/services/unified.py`, `backend/alembic/versions/20260314_0002_*.py`, `docker-compose.yml` |
| Key modified files | `backend/app/config.py` (nango→unified), `backend/app/models.py` (TeamMember model), `backend/app/routers/integrations.py` (nango→unified), `backend/requirements.txt` (full list), `src/types/symbiote.ts` (unified_connection_id), `package.json` (added recharts) |
| What it does | Slack integration (sync, invites, webhooks); migrates 3rd-party integration layer from Nango to Unified.to; adds TeamMember DB model; new auth/team/dashboard pages |
| Risk | **MEDIUM** — backend changes touch multiple shared files; Nango→Unified migration creates type/API incompatibility with `best-ui-itw` |

### `best-ui-itw`
| Field | Detail |
|---|---|
| Commits ahead of main | 8 |
| Commits behind main | 2 |
| Key new files | `src/components/revenent-homepage.tsx` ⚠️ (typo: "revenent" should be "revenant"), `src/components/hero-section.tsx`, `src/components/landing-navbar.tsx`, `src/components/feature-grid.tsx`, `src/components/about-section.tsx`, `src/components/pricing-section.tsx`, `src/components/bento/*.tsx`, `src/components/glitch-marquee.tsx`, `src/components/workflow-diagram.tsx`, `.agent/skills/ui-ux-pro-max/` |
| Key modified files | `src/app/page.tsx` (replaced with component-based design), `src/app/globals.css`, `src/app/layout.tsx`, `src/components/Navbar.tsx`, `src/components/IntegrationCard.tsx`, `src/app/integrations/page.tsx`, `src/app/signup/page.tsx`, `package.json` (added `@nangohq/frontend`, `clsx`, `geist`, `next-themes`, `tailwind-merge`) |
| What it does | Complete UI overhaul — premium landing page with bento grid, hero, pricing, and workflow diagram; polished component library |
| Risk | **MEDIUM-HIGH** — `page.tsx` completely replaced; `integrations/page.tsx` still uses Nango while `vedd` migrated to Unified.to; `backend/venv/` is committed to git (should be cleaned) |

---

## 2. Conflict Hotspots

| File | Branches in Conflict | Severity | Resolution |
|---|---|---|---|
| `src/app/page.tsx` | seeron/vedd (inline-styled) vs best-ui-itw (component-based) | 🔴 HIGH | **Use best-ui-itw version** — it is the intended final UI |
| `src/types/symbiote.ts` | best-ui-itw uses `NangoSessionResponse` + `nango_connection_id`; vedd uses `AuthUrlResponse` + `unified_connection_id` | 🔴 HIGH | **Use vedd version** — Nango is replaced by Unified.to |
| `src/app/integrations/page.tsx` | best-ui-itw uses Nango session API; vedd uses Unified.to auth-url API | 🔴 HIGH | **Use vedd version** — then merge in any styling from best-ui-itw |
| `src/components/IntegrationCard.tsx` | vedd adds slack icon; best-ui-itw removes it | 🟡 MEDIUM | **Use vedd version** (keep slack icon) |
| `src/components/Navbar.tsx` | Both modified from common ancestor | 🟡 MEDIUM | Diff carefully; both likely compatible |
| `src/app/signup/page.tsx` | Minor differences | 🟢 LOW | Both versions nearly identical; use vedd's |
| `package.json` | All three branches modified deps | 🔴 HIGH | Manual merge — union of all deps (see §3) |
| `backend/app/config.py` | seeron has minimal config; vedd has comprehensive config with Unified.to | 🔴 HIGH | **Use vedd version** — it is a superset |
| `backend/requirements.txt` | seeron has 7 deps; vedd has 15 deps | 🟡 MEDIUM | **Use vedd version** — it is a superset |

---

## 3. Recommended Merge Order

**Fastest stable path:**

```
[integration/hackathon-final]
         ↑
  1. seeron (low risk, foundation)
         ↑
  2. vedd (medium risk, backend + pages)
         ↑
  3. best-ui-itw (UI overhaul, manual conflict resolution)
         ↑
  4. main (--allow-unrelated-histories, squash)
```

Rationale:
- `seeron` first: smallest delta, establishes the railtracks endpoint and tavus tools — no conflicts with vedd
- `vedd` second: Unified.to backend is the canonical integration layer; resolving this before the UI branch avoids double-fixing the same type conflicts
- `best-ui-itw` last: brings in the best landing page/UI but requires manual resolution of Nango→Unified references
- `main` final: merge dev history into main using `--allow-unrelated-histories`; dev branch content wins everywhere

---

## 4. Pre-Merge Actions Per Branch

### Before starting: create the integration branch

```bash
git checkout origin/seeron -b integration/hackathon-final
git push -u origin integration/hackathon-final
```

> Start from `seeron` rather than `main` because the dev branches share history — this avoids the unrelated-histories issue until the very last merge step.

---

### Step 1 — Merge `seeron` (baseline)

`seeron` **is** the integration branch starting point, so no merge action needed.

✅ Verify:
- `src/app/api/railtracks/route.ts` exists
- `tools/tavus/tavus.js` and `tools/tavus/converse.js` exist
- `package.json` has `@ai-sdk/anthropic` and `ai`

---

### Step 2 — Merge `vedd`

```bash
git checkout integration/hackathon-final
git merge origin/vedd
```

**Expected auto-conflicts:**
- `backend/app/config.py` — **Accept vedd's version** (comprehensive config with Unified.to)
- `backend/app/routers/chat.py` — **Accept vedd's version** (uses `settings`, not `os.getenv`)
- `backend/requirements.txt` — **Accept vedd's version** (15-package full list)
- `package.json` — **Manual merge** (union of seeron + vedd deps; keep both `@ai-sdk/anthropic`+`ai` from seeron and `recharts` from vedd; use `"build": "next build"` without `--webpack` flag from seeron)

After resolving:
```bash
git add .
git commit -m "merge: vedd (Unified.to integration, Slack, TeamMember)"
```

---

### Step 3 — Merge `best-ui-itw`

```bash
git checkout integration/hackathon-final
git merge origin/best-ui-itw
```

**Expected auto-conflicts and resolutions:**

| File | Action |
|---|---|
| `src/app/page.tsx` | **Accept best-ui-itw version** — component-based landing page is the goal |
| `src/types/symbiote.ts` | **Accept vedd version (keep current)** — `unified_connection_id` and `AuthUrlResponse` are correct; discard `NangoSessionResponse` and `nango_connection_id` |
| `src/app/integrations/page.tsx` | **Accept vedd version (keep current)** — uses Unified.to; discard Nango session logic |
| `src/components/IntegrationCard.tsx` | **Accept vedd version (keep current)** — has Slack icon |
| `src/app/globals.css` | **Accept best-ui-itw version** — more complete styling |
| `src/app/layout.tsx` | **Accept best-ui-itw version** — uses Geist fonts and next-themes |
| `src/components/Navbar.tsx` | **Review carefully** — take best-ui-itw's styling but ensure Unified.to auth types still typecheck |
| `package.json` | **Manual merge** — union of all three branches (see below) |
| `backend/app/services/nango.py` | **Delete this file** — superseded by `unified.py` from vedd |
| `backend/venv/` | **Do not stage** — add to `.gitignore` if not already present (⚠️ see cleanup below) |
| `.agent/skills/` | **Accept or discard** — AI skill data files; safe to include |

**Unified `package.json` dependencies (manual merge result):**

```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^3.0.58",
    "@anthropic-ai/sdk": "^0.78.0",
    "@nangohq/frontend": "^0.67.3",
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.5.0",
    "ai": "^6.0.116",
    "axios": "^1.13.6",
    "clsx": "^2.1.1",
    "dotenv": "^16.4.7",
    "framer-motion": "^12.36.0",
    "geist": "^1.7.0",
    "lucide-react": "^0.577.0",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "openai": "^6.29.0",
    "prop-types": "^15.8.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^2.15.4",
    "tailwind-merge": "^3.5.0",
    "three": "^0.183.2"
  }
}
```

> ⚠️ **Unknown:** `@nangohq/frontend` is still in `best-ui-itw`'s package.json and used by the old integrations page (which will be replaced by vedd's version). Confirm with maintainer whether to remove it after the page swap.

**Clean up `backend/venv/` from git:**

```bash
# In integration/hackathon-final after merging best-ui-itw:
echo "backend/venv/" >> .gitignore
git rm -r --cached backend/venv/ 2>/dev/null || true
git add .gitignore
git commit -m "chore: untrack backend/venv from git"
```

After resolving all conflicts:
```bash
git add .
git commit -m "merge: best-ui-itw (UI overhaul, landing page redesign)"
```

---

### Step 4 — Merge integration branch into `main`

```bash
git checkout main
git pull origin main
git merge integration/hackathon-final --allow-unrelated-histories -m "feat: integrate seeron + vedd + best-ui-itw into main"
```

> This is the **only** place `--allow-unrelated-histories` is needed.  
> Conflicts here will be between main's `src/tavus.js`/`src/converse.js` and the dev branches.  
> **Accept integration branch versions for everything** — the dev branches supersede main's minimal scripts.  
> The Tavus scripts are preserved under `tools/tavus/` in the dev branches.

```bash
git push origin main
```

---

## 5. Environment & Config Alignment

Before the app can run after merge, confirm all `.env` variables are present:

### Frontend (Next.js)
```env
# No frontend env vars appear required at build time
# Runtime API calls go to http://localhost:8000 (backend)
```

### Backend (FastAPI — `backend/.env` or root `.env`)
```env
ANTHROPIC_API_KEY=...          # required for /api/chat
UNIFIED_API_KEY=...            # required for Unified.to integrations (replaces NANGO_SECRET_KEY)
UNIFIED_WORKSPACE_ID=...       # required
UNIFIED_WEBHOOK_SECRET=...     # required for webhook validation
TAVUS_API_KEY=...              # required for Tavus video
TAVUS_REPLICA_ID=rf4e9d9790f0 # default already set
DATABASE_URL=postgresql+asyncpg://symbiote:symbiote@localhost:5432/symbiote
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=change-me       # ⚠️ MUST be changed for production
```

> **Unknowns requiring maintainer confirmation:**
> 1. Is `NANGO_SECRET_KEY` still needed anywhere after removing `nango.py`?
> 2. What is the production `UNIFIED_WORKSPACE_ID`?
> 3. 🐛 **Bug — spelling inconsistency in `MOORCHE_API_KEY`:** `seeron`'s `backend/app/config.py` uses `moorcheh_api_key` (with trailing `h`) while `vedd`'s uses `moorche_api_key`. Only one spelling will match the actual env var. After merging (using vedd's `config.py`), verify the correct spelling with the Moorcheh API docs and ensure the env var name in `.env` matches exactly.
> 4. Confirm whether `@nangohq/frontend` package should stay or be removed from `package.json`.

---

## 6. Dependency Update Notes

No dependency version upgrades are required — all branches use compatible versions of the same packages. The merge only needs to **union** the dependency lists.

Run after final merge:
```bash
npm install          # regenerates package-lock.json
pip install -r backend/requirements.txt   # in a fresh venv
```

---

## 7. Final Validation Checklist

Run these checks on `integration/hackathon-final` **before** merging to `main`:

### Build
- [ ] `npm install` — no peer dependency errors
- [ ] `npm run build` — Next.js build succeeds with zero TypeScript errors
- [ ] `npm run lint` — ESLint passes (or warnings are understood)
- [ ] `cd backend && pip install -r requirements.txt` — no conflicts
- [ ] `cd backend && python -m py_compile backend/app/main.py` — backend parses cleanly

### Run
- [ ] `npm run dev` — Next.js dev server starts on port 3000
- [ ] `cd backend && uvicorn app.main:app --reload` — FastAPI starts on port 8000
- [ ] `GET http://localhost:8000/health` — returns `{"status":"ok"}`

### Smoke tests (click through UI)
- [ ] Landing page loads at `http://localhost:3000` — shows hero section, feature grid, pricing
- [ ] Signup page at `/signup` — form renders and submits without console errors
- [ ] Login page at `/login` — form renders (if present in merged code)
- [ ] Integrations page at `/integrations` — shows integration cards for GitHub, Discord, Slack
- [ ] Dashboard at `/dashboard` — renders (may be empty if no data)
- [ ] Theme toggle works (dark/light)
- [ ] Navbar links navigate correctly

### API smoke tests
- [ ] `POST /api/auth/signup` — creates a user
- [ ] `POST /api/auth/login` — returns JWT token
- [ ] `POST /api/railtracks` (with Authorization header) — streams Claude response
- [ ] `POST /api/chat` (with Authorization header) — returns chat response

### Database
- [ ] `cd backend && alembic upgrade head` — all migrations apply cleanly on a fresh DB

---

## 8. Post-Merge Cleanup (after main is stable)

```bash
# Tag the stable release
git tag -a v1.0-hackathon -m "Hackathon final stable merge"
git push origin v1.0-hackathon

# Keep old branches for 1-2 weeks for reference, then delete:
# git push origin --delete seeron vedd best-ui-itw integration/hackathon-final
```

---

## 9. Quick-Reference Conflict Decision Table

When `git merge` stops with conflicts, use this table:

| Conflict file | Keep which side | Reason |
|---|---|---|
| `src/app/page.tsx` | `best-ui-itw` (incoming) | Better UI |
| `src/types/symbiote.ts` | `vedd` / integration (ours) | Unified.to types |
| `src/app/integrations/page.tsx` | `vedd` / integration (ours) | Unified.to API |
| `src/components/IntegrationCard.tsx` | `vedd` / integration (ours) | Has Slack |
| `backend/app/config.py` | `vedd` / integration (ours) | Complete config |
| `backend/requirements.txt` | `vedd` / integration (ours) | Full deps |
| `backend/app/services/nango.py` | Delete | Replaced by unified.py |
| `package.json` | Manual union | See §3 merged list |
| Everything else | `best-ui-itw` (incoming) | More complete UI |
| `main`'s `src/tavus.js` / `src/converse.js` | Integration (ours) | Superseded by tools/tavus/ |
