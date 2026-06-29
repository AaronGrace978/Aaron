# AGENTS.md

## Cursor Cloud specific instructions

This repo contains four independent components:

| Dir | Stack | Run (dev) | Lint/Test | Notes |
|-----|-------|-----------|-----------|-------|
| `server/` | Express + OpenAI (Node, ESM) | `npm run dev` (port 3000) | none defined | Shared voice backend for both Expo apps. |
| `org-agent/` | FastAPI + Ollama (Python) | `uvicorn apps.api.main:app --port 8000` | `pytest` | Agent loop Plan→Act→Reflect; `/chat` needs Ollama. |
| `offlinequest-app/` | Expo / React Native | `npm start` (Metro) | `npx tsc --noEmit` | Mobile; nature mission + mood flow. |
| `marvin-app/` | Expo / React Native | `npm start` (Metro) | `npx tsc --noEmit` | Mobile; voice assistant. |

The update script already runs the per-session dependency refresh (npm install for the
three Node dirs; Python venv + `pip install` for `org-agent`). The notes below are the
non-obvious things that are NOT handled automatically.

### Secrets / runtime config
- `server/` and `marvin-app/` voice features need a real `OPENAI_API_KEY` (the committed
  `server/.env` has a placeholder `sk-REPLACE_ME`). Without a valid key the server still
  boots and `GET /` works; the voice routes reach OpenAI and return a 401 until a key is set.
- The Expo apps read `EXPO_PUBLIC_SERVER_URL` (committed default is a LAN IP placeholder).
  Offline Quest's touch mood/quest flow works fully offline; only the voice calls hit the
  server, so a "Failed to fetch" toast is expected when the server URL is unreachable.

### org-agent / Ollama (important gotchas)
- `org-agent` is committed with no `.env`; `core/adapters/llm_ollama.py` falls back to
  `OLLAMA_URL=http://localhost:11434` and `LLM_MODEL=mistral:7b-instruct`.
- Ollama is a system dependency (installed into the VM image, not the update script). Start
  it with `ollama serve` (no systemd in this VM, so run it yourself / in tmux).
- The Ollama 0.30.x runner SEGFAULTS on this VM's CPU backend when loading a model. Use the
  pinned older build: `curl -fsSL https://ollama.com/install.sh | OLLAMA_VERSION=0.5.7 sh`.
- `mistral:7b-instruct` (the default) is ~4GB and slow on CPU. For quick local validation
  pull a small model and point the API at it, e.g.
  `ollama pull llama3.2:1b` then run uvicorn with `LLM_MODEL=llama3.2:1b`.
- `pytest`: `test_planner.py::test_plan_outputs_structure` fails as committed — it
  monkeypatches `adapters.llm_ollama.chat` but `core/planner.py` already bound `chat` via
  `from ... import chat`, so the patch misses and the test tries to reach a real Ollama.
  This is a pre-existing test bug, not an environment problem. The other tests pass.
- The SQLite default is `sqlite:///./data/agent.db`; ensure `org-agent/data/` exists
  (`mkdir -p org-agent/data`) before running the API/tests, since SQLAlchemy won't create
  the directory.

### Expo apps (no device/emulator in the cloud VM)
- These are mobile-first apps; there is no simulator here. `npm start` runs Metro and you
  can confirm bundling via `curl "http://localhost:<port>/index.bundle?platform=ios&dev=true"`
  (also `platform=android`).
- To GUI-test in the browser you must add web support deps (not in `package.json`):
  `npx expo install react-dom react-native-web @expo/metro-runtime expo-asset`, then
  `npx expo start --web`.
- Web-only caveat for `offlinequest-app`: `App.tsx` uses `SafeAreaView` from
  `react-native-safe-area-context`. On native the insets come from the native module, but on
  web you must wrap the root in `<SafeAreaProvider>` (e.g. a temporary entry wrapper) or it
  throws "No safe area value available" and renders blank. `marvin-app` does not use
  SafeAreaView and renders on web without this shim.

### Git note
- `server/node_modules/` is committed/tracked (the other dirs gitignore `node_modules/`).
  `npm install` in `server/` is idempotent against the lockfile and produces no diff.
