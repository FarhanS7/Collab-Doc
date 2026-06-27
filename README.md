# CollabEditor: Real-Time Collaborative Workspace with AI Copilot

CollabEditor is a real-time collaborative text editor featuring conflict-free synchronization, presence tracking, role-based document access, and inline AI writing assistance. 

Designed with a premium glassmorphic dark-mode interface, the project is structured as a TypeScript monorepo that demonstrates clean backend architecture, scalable WebSockets, and advanced rich-text coordinate mapping.

---

## 🚀 Core Features

- **Conflict-Free Real-Time Collaboration:** Powered by **Y.js (YATA algorithm)** CRDTs, allowing multiple users to edit concurrently without write locks or server-side ordering bottlenecks.
- **AI writing assistance (Ghost Text UX):** Stream inline content predictions token-by-token directly inside the editor layout using **Server-Sent Events (SSE)**.
- **Active Peer Presence:** Real-time visibility of active editors in the document, sharing cursor coordinates and selections over socket channels.
- **Role-Based Access Controls (RBAC):** Restrict document access statically and dynamically using Owner, Editor, and Viewer permissions.
- **Docker-Ready Architecture:** Configured with Postgres and Redis database dependencies for local containerized development and tests.

---

## 🛠️ Tech Stack & System Design

### Architecture Diagram

```
                              Client (Next.js 14)
                   ┌──────────────┼──────────────┐
                   │ REST (HTTPS) │ WebSocket    │ SSE (HTTP)
                   ▼              ▼              ▼
               REST API      Socket.io        AI Proxy
               (Express)       Server       (Anthropic)
                   │              │              │
                   ▼              ▼              ▼
                Prisma          Redis        Anthropic
              (PostgreSQL)     (Pub/Sub)     Claude API
```

| Layer | Technologies | Key Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, Next.js 14 (App Router), TypeScript | Server components data-fetching, client state hydration |
| **Editor** | Tiptap (ProseMirror framework) | Headless rich-text editor engine |
| **CRDT** | Y.js (`y-prosemirror`) | Conflict-free convergence formats and state updates |
| **Backend** | Node.js, Express, Socket.io | Session gating, room channels, and proxy streams |
| **Database** | PostgreSQL 15, Prisma ORM | Relational metadata schemas and binary snapshot storage |
| **Cache/PubSub**| Redis 7 | Socket.io horizontal scaling and rate-limiting |
| **AI Stream** | Anthropic Claude API | Streamed text completion services |

---

## 🧠 Technical Highlights & Engineering Depth

### 1. Collaborative State Convergence (CRDTs over OT)
Instead of relying on a centralized operational transformation (OT) server, this project utilizes **Y.js CRDTs**. 
- Text is represented as a linked list of atomic insertions and deletions.
- Updates are encoded as compact binary buffers (`Uint8Array`) and exchanged between peers via Socket.io.
- The server maintains an in-memory `Y.Doc` cache. Document writes to PostgreSQL are debounced by **2 seconds** on idle states to prevent database write bottlenecks.

### 2. Collision-Free AI Ghost Suggestions
To prevent streaming AI suggestions from colliding with active peer edits:
- AI suggestions are rendered as **local-only ProseMirror decorations**, preventing them from syncing to Y.js channels.
- During text stream generation, coordinates are dynamically translated using ProseMirror mapping structures (`tr.mapping.map`). If a peer inserts or deletes text concurrently, the ghost decoration range adapts fluidly to prevent content shifts or overrides.
- Pressing `Tab` triggers a transaction merging the ghost text directly into the local Y.js document instance.

### 3. ephemerally Isolated Testing Suites
The testing harness is split into:
- **Unit Tests:** Pure TypeScript testing suites verifying requireAuth middleware, CRDT convergence, and SSE streaming decoders. Uses `jest.unstable_mockModule` and dynamic ESM module loaders.
- **Integration Tests:** Launches the server on a dynamic port (`0`) and executes endpoint requests against a test database instance. Table truncations are run in `afterEach` hooks using cascaded raw SQL queries.

---

## 📂 Project Structure

```
collabeditor/
├── apps/
│   ├── web/              # Next.js 14 Client App Router
│   │   ├── app/          # Dashboard, login pages, and doc routing
│   │   ├── components/   # Tiptap, Member Modal, and Presence UI
│   │   └── lib/          # AI SSE clients and auth proxies
│   └── server/           # Node.js Express Backend
│       ├── src/
│       │   ├── collab/   # Socket.io connection and room configurations
│       │   ├── routes/   # REST endpoint routers (docs, memberships, AI)
│       │   └── index.ts  # Express app configuration & startup check
│       └── prisma/       # Relational schemas and database migrations
├── packages/
│   └── types/            # Shared TypeScript type definitions
└── .github/workflows/     # GHA pipeline configurations
```

---

## 💻 Local Quickstart

### Prerequisites
- Node.js v20+
- pnpm v10+
- Docker & Docker Compose (optional, for local DB containers)

### 1. Configure Environments
Create a `.env` configuration file in the project root:
```env
# Database & Redis Settings
DATABASE_URL="postgresql://postgres:postgres_password@localhost:5440/collabeditor?schema=public"
REDIS_URL="redis://localhost:6379"

# NEXTAUTH Credentials (Frontend and Backend)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-base64-secret"

# Provider Auth (OAuth)
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Generative AI Key
ANTHROPIC_API_KEY="your_anthropic_api_key"

# Server Port
PORT=4000
NODE_ENV=development
```

### 2. Boot Local Services & Databases
```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Run Prisma schema migrations
pnpm --filter @collab/server exec prisma migrate dev

# Start frontend and backend in watch mode
pnpm dev
```
The client dashboard runs at `http://localhost:3000` and the API backend runs at `http://localhost:4000`.

---

## 🧪 Running Test Suites

Execute test suites inside the backend folder:
```bash
# Run unit tests
pnpm --filter @collab/server test

# Run integration tests (Requires active DB connection)
pnpm --filter @collab/server test:integration
```
