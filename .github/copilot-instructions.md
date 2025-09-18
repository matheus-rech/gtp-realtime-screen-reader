# Copilot Instructions for gtp-realtime-screen-reader

## Repository Overview

This repository contains a **production-ready realtime multimodal assistant** powered by OpenAI's GPT-Realtime API. It's a full-stack TypeScript monorepo delivering low-latency voice + vision interaction with continuous visual perception through smart frame sampling.

**Key Technologies:** Next.js 14, Express, WebSocket, TypeScript, Tailwind CSS, Vitest, ESLint  
**Runtime Requirements:** Node.js ≥18 (currently tested with v20.19.5)  
**Repository Size:** Medium-sized monorepo (~100 files, TypeScript-focused)  
**Architecture:** Frontend-backend split with WebSocket communication for real-time features

## Build & Validation Instructions

### Initial Setup (ALWAYS REQUIRED)

```bash
# 1. Install dependencies - ALWAYS run this first
npm install

# 2. Environment setup - Create these files for full functionality:
# apps/backend/.env
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379  # optional
FRAME_RATE_LIMIT=2
MAX_SESSIONS=100

# apps/frontend/.env.local  
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### Build Process

**⚠️ KNOWN ISSUE:** Frontend build currently fails due to missing type definitions. This is expected behavior until type files are properly configured.

```bash
# Test the build (will show warnings/errors)
npm run build

# Expected failure: Frontend build fails on missing @/types/realtime imports
# Backend builds successfully
```

### Testing (Recommended Validation)

```bash
# Run all tests - RELIABLE validation method
npm run test

# Individual workspace tests
npm run test --workspace backend    # Backend tests (3 files, all pass)
npm run test --workspace frontend   # Frontend tests (frame utilities)
```

### Linting

```bash
# Lint all workspaces
npm run lint

# Expected: TypeScript version warnings (can be ignored)
# Both frontend and backend should pass with no errors
```

### Development Servers

```bash
# Start both servers (run in separate terminals)
npm run dev:backend   # Express server on :8080
npm run dev:frontend  # Next.js dev server on :3000

# Backend starts immediately
# Frontend requires manual browser navigation to localhost:3000
```

### Common Issues & Workarounds

1. **TypeScript Version Warnings:** ESLint shows warnings about TypeScript 5.9.2 vs supported <5.4.0. These can be safely ignored.

2. **Frontend Build Failures:** Missing type definitions cause build failures. This is a known issue with the current codebase state.

3. **Next.js Config Warning:** `experimental.serverActions` deprecation warning in next.config.mjs - this is non-breaking.

4. **Dependency Installation Time:** Initial `npm install` takes ~15-30 seconds due to image processing dependencies (sharp, etc.).

## Project Layout

### Monorepo Structure
```
apps/
├── backend/          # Express API server
│   ├── src/
│   │   ├── app.ts           # Express app configuration
│   │   ├── index.ts         # Main server entry point
│   │   ├── services/        # Core business logic
│   │   │   ├── ContextManager.ts     # Chat context & token management
│   │   │   ├── VisualProcessingService.ts  # Frame analysis
│   │   │   └── VisualContextCache.ts # Visual memory caching
│   │   ├── routes/          # HTTP endpoints (/health, /api/session)
│   │   ├── middleware/      # Express middleware
│   │   ├── queues/          # DualQueue for audio/visual data
│   │   └── utils/           # Environment config, logging
│   ├── vitest.config.ts     # Test configuration
│   └── .eslintrc.cjs        # Linting rules
└── frontend/         # Next.js 14 application
    ├── app/                 # Next.js app router
    ├── components/          # React components
    │   ├── AssistantApp.tsx # Main application component
    │   ├── VideoPreview.tsx # Camera/screen preview
    │   └── TranscriptDisplay.tsx # Chat transcript
    ├── lib/                 # Client-side utilities
    │   ├── hooks/           # React hooks (useRealtimeSession)
    │   ├── audio/           # Audio processing utilities
    │   └── config.ts        # Frontend configuration
    ├── types/               # TypeScript type definitions
    ├── tests/               # Vitest test files
    └── tailwind.config.ts   # Styling configuration
```

### Key Configuration Files
- **Root:** `package.json` (workspace config), `tsconfig.base.json`
- **Backend:** `apps/backend/tsconfig.json`, `apps/backend/.eslintrc.cjs`  
- **Frontend:** `apps/frontend/next.config.mjs`, `apps/frontend/tailwind.config.ts`
- **Testing:** `apps/*/vitest.config.ts` in each workspace
- **Environment:** `.env` files (not tracked in git)

### Validation Pipeline
**No GitHub Actions/CI configured** - validation is manual using npm scripts.

Manual validation steps:
1. `npm run lint` - Code quality check
2. `npm run test` - Unit test validation  
3. `npm run build` - Build validation (currently failing for frontend)
4. Manual testing via `npm run dev:*` commands

### Architecture & Dependencies

**Backend Dependencies:**
- Express.js with security middleware (helmet, cors, rate limiting)
- WebSocket server for real-time communication
- Sharp for image processing
- Redis client (optional) for session management
- OpenAI Agents SDK for realtime API integration

**Frontend Dependencies:**  
- Next.js 14 with app router
- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Headless UI for accessible components

**Critical Integration Points:**
- WebSocket connection on `/visual` path
- Backend serves on port 8080, frontend on 3000
- Environment variables required for OpenAI API integration
- Browser permissions needed for microphone/camera access

### Key Source Files

**Backend Entry Point:** `apps/backend/src/index.ts`
- WebSocket server setup with visual processing pipeline
- Context management for chat history
- Frame processing service integration

**Frontend Main Component:** `apps/frontend/components/AssistantApp.tsx`  
- Primary UI component with real-time session management
- Video preview and transcript display
- Mode selector for screen/camera capture

**Core Services:**
- `ContextManager.ts` - Sliding window context compression (128k token limit)
- `VisualProcessingService.ts` - Frame analysis with change detection
- `VisualContextCache.ts` - Visual memory with TTL-based expiration

### Root Directory Contents
```
.gitignore          # Standard Node.js exclusions
README.md           # Setup and usage documentation  
package.json        # Workspace configuration
package-lock.json   # Locked dependency versions
tsconfig.base.json  # Shared TypeScript configuration
apps/               # Application workspaces
```

## Agent Instructions

**Trust these instructions** - the repository has been thoroughly analyzed. Only search for additional information if:
1. These instructions contain errors or outdated information
2. You need details about specific implementation logic not covered here
3. You're implementing new features requiring understanding of existing patterns

**For efficient development:**
1. Always run `npm install` before any other commands
2. Use `npm run test` for reliable validation rather than build
3. Expect frontend build failures - focus on backend changes or type definition fixes
4. Test real-time features by running both dev servers simultaneously
5. Check environment variable requirements before debugging runtime issues