# Realtime Multimodal Assistant

This repository contains a production-ready reference implementation for a realtime voice + vision assistant powered by OpenAI's GPT-Realtime stack. The project delivers a full-stack TypeScript solution with a Next.js 14 frontend and an Express backend that orchestrate audio streaming, frame sampling, and secure ephemeral key generation.

## Features

- 🔊 **Low-latency voice conversation** using the OpenAI Realtime API via WebRTC
- 👁️ **Continuous visual perception** through smart frame sampling (1-2 FPS) with change detection and regional focus
- 🔐 **Secure ephemeral key minting** handled server-side with Redis-backed session accounting
- ♻️ **Dual-queue interruption management** clearing audio buffers and pausing visual capture instantly
- 🧠 **Context window maintenance** with sliding window compression and visual annotation history
- 🖥️ **Adaptive capture modes** for screen, camera, or hybrid feeds
- 📦 **Visual memory caching** to avoid redundant image analysis and support future retrieval

## Monorepo Structure

```
apps/
  backend/   # Express API, WebSocket visual relay, frame processing service
  frontend/  # Next.js 14 app with Tailwind UI, WebRTC client, realtime session hook
```

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Create `.env` files in both `apps/backend` and `apps/frontend` or export variables in your shell.

   ```bash
   # apps/backend/.env
   OPENAI_API_KEY=sk-...
   REDIS_URL=redis://localhost:6379 # optional
   FRAME_RATE_LIMIT=2
   MAX_SESSIONS=100
   ```

   ```bash
   # apps/frontend/.env.local
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
   ```

3. **Run development servers**

   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

4. **Open the UI**

   Visit `http://localhost:3000` and grant microphone + screen/camera permissions when prompted.

## Testing

- **Backend**: `npm run test --workspace backend`
- **Frontend**: `npm run test --workspace frontend`

Both suites rely on `vitest` with coverage-ready configs. The backend tests exercise frame processing, caching, and context management; the frontend tests validate frame diff utilities in a JSDOM environment.

## Deployment Notes

- Containerise the backend and frontend separately for scalability.
- Configure HTTPS termination so the browser can access the backend WebSocket via WSS.
- Provision Redis or another persistent cache for session tracking in production.
- Ensure `OPENAI_API_KEY` is stored in a secure secret manager (never expose to the client).

## License

MIT
