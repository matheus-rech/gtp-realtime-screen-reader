# Realtime Multimodal Assistant

This repository implements a full-stack realtime voice and vision assistant powered by OpenAI's GPT Realtime API. It captures the user's microphone, screen, and/or camera streams and continuously injects visual context into a low-latency conversation with the model.

## Features

- **Realtime voice conversation** via OpenAI's Realtime API with ephemeral key exchange
- **Continuous visual context** sampling at adaptive frame rates with smart caching
- **Dual-queue pipeline** synchronises audio transcripts and visual updates for coherent responses
- **WebSocket visual relay** broadcasts processed frame summaries to connected clients
- **Secure backend** with Express, Redis session cache (optional), rate limiting, and security headers
- **Responsive frontend** built with Next.js 14, Tailwind CSS, and the `@openai/agents` SDK
- **Comprehensive testing** covering visual processing, context management, and server endpoints

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Provide environment variables in both apps as needed:

- `OPENAI_API_KEY` – server-side API key for generating ephemeral realtime tokens
- `REDIS_URL` – optional Redis connection for session caching
- `NEXT_PUBLIC_BACKEND_URL` – frontend base URL for the backend (defaults to `http://localhost:4000`)

3. Run the backend and frontend together:

```bash
npm run dev
```

The backend listens on `http://localhost:4000` by default. The Next.js frontend runs on `http://localhost:3000` and requests ephemeral keys plus visual analysis from the backend.

## Testing

```bash
npm test
```

Vitest runs backend unit/integration tests and frontend unit tests. Sharp is required for frame processing tests.

## Deployment

See `deployment.yaml` for reference configuration with horizontal scaling targets for the frontend, backend, and Redis services.
