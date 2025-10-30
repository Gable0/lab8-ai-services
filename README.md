# lab8-ai-service · Gable Krich

Fall 2025 · COMP 305  
Netlify Deployment: gable0comp305lab8.netlify.app

---

## Quick Start

1. **Install tooling**
   ```bash
   npm install
   npx playwright install chromium
   ```
2. **Prep the proxy** (first run only)
   ```bash
   cd server
   cp .env.example .env  # add OPENAI_API_KEY=... here
   npm install
   cd ..
   ```
3. **Launch both servers**
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5500`, pick **Eliza** or **ChatGPT**, and chat.

---

## Architecture Overview

- **Model (`src/js/model.js`)** – owns chat data, persists to `localStorage`, emits `"change"` events after each CRUD action.
- **View (`src/js/view.js`)** – renders the UI, dispatches DOM events (send/edit/delete/import/export), exposes `modeChange`.
- **Controller (`src/js/controller.js`)** – syncs model↔view, handles timers/abort controllers, and delegates replies to the AI service.
- **AI Service (`src/js/aiService.js`)** – single interface providing `getElizaReply()` and `getChatGPTReply()` so the controller stays provider-agnostic.
- **Eliza patterns (`src/js/eliza.js`)** – keyword matcher used for offline fallback.

**Trade-offs**
- Clear MVC separation makes swapping implementations easy but increases file count and event wiring.
- Client-side persistence is cheap and instant, yet requires defensive parsing on import.
- Keeping ChatGPT calls behind the proxy avoids leaking API keys but adds a second process to run locally.

---

## AI Research Recap

Exploration lives under `r-n-d/`:
- [`r-n-d/openai-chatGPT/chat-demo.js`](r-n-d/openai-chatGPT/chat-demo.js) – sample against `gpt-4o-mini`.
- [`r-n-d/anthropic-claude/chat-demo.js`](r-n-d/anthropic-claude/chat-demo.js) – equivalent Claude Haiku call.
- [`r-n-d/llm-eval.md`](r-n-d/llm-eval.md) – write-up comparing costs, activation steps, limits, and suitability.

**Decision:** OpenAI powered the final build because I already funded credits; the architecture keeps swapping trivial if Anthropic becomes preferable.

---

## Security & Configuration

- `.env` files are ignored by Git. The proxy (`server/index.js`) reads `OPENAI_API_KEY` via `dotenv` and never exposes it to the browser.
- `window.CHAT_GPT_ENDPOINT` (set in `src/index.html`) points the UI to the proxy; change it if you deploy elsewhere.
- Automated tests mock `/api/chatgpt`, so no real API calls fire during CI runs.
- Restart `npm run dev` whenever you rotate keys; quota exhaustion returns 429s that surface in the UI as “ChatGPT is unavailable right now.”

---

## Testing with Playwright

Two end-to-end specs live in `tests/chat.spec.js`:
1. **Eliza flow** – confirms a user message yields a non-empty bot reply.
2. **ChatGPT flow** – intercepts `/api/chatgpt` and returns a mocked response to keep tests deterministic.

Run them with:
```bash
npm test
# or interactive runner
npm run test:ui
```
Playwright spins up a static server for `src/`, and reports are ignored via `.gitignore` (`playwright-report/`, `test-results/`).

---

## Privacy & Cost Notes

- ChatGPT Plus does not include API credits; the pay-as-you-go key in `server/.env` is funded manually.
- When the account hits rate or spend limits, the proxy catches the error, logs it server-side, and the UI shows a friendly fallback.
- No conversational data is persisted beyond localStorage unless the user explicitly exports JSON.

---

## Feature Guide

- **Mode selector** – dropdown toggles between Eliza (offline) and ChatGPT (cloud). Switching cancels all timers and pending fetches.
- **Message actions** – send, edit, delete, clear, import/export all route through the model so persistence stays consistent.
- **Placeholder handling** – ChatGPT mode shows “ChatGPT is thinking…” while awaiting the proxy and replaces it with either the LLM reply or an error.

---

## Commit & Workflow Practices

- Work landed in focused commits with descriptive messages (check Git history). Typical flow: implement feature → run Playwright/ manual smoke tests → commit.

---

## Work Log (abridged)

1. Bootstrapped MVC UI from Lab 7.
2. Added mode dropdown + view events.
3. Introduced `AIService` abstraction and rewired the controller.
4. Built Express proxy for OpenAI with `.env` support and strict CORS.
5. Added Playwright smoke tests (Eliza + mocked ChatGPT) and headless server config.
6. Documented setup, AI provider research, security, and testing in this README.
