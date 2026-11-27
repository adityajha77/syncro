# Syncro - Connected Workspace

Syncro is a production-ready monorepo for a modern connected workspace application.

## 🚀 Architecture & Tech Stack

- **Monorepo Management**: Workspaces layout with `/apps/frontend` and `/apps/backend` (npm & pnpm workspace compatible).
- **Backend (`apps/backend`)**:
  - Node.js + Express
  - TypeScript (Strict Mode)
  - Prisma ORM with PostgreSQL
  - Real-time WebSockets (`ws` protocol with room & event broadcast engine)
  - Structured modular router (`/api/v1/health`, `/api/v1/tasks`, `/api/v1/activities`)
- **Frontend (`apps/frontend`)**:
  - React 19 + TypeScript
  - Vite build tool
  - Tailwind CSS with modern dark UI styling
  - Lucide Icons
  - Real-time WebSocket hook (`useRealtime`)
  - Modular component architecture (`Timeline.tsx`, `HealthDashboard.tsx`, `DailySummary.tsx`)
- **Database (`Prisma`)**:
  - Models: `User`, `Project`, `Task`, `Event`, `ActivityRecord`
  - Enums: `Role`, `TaskStatus`, `TaskPriority`, `ActivityType`

---

## 📁 Repository Structure

```text
syncro/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   └── schema.prisma        # Database schema (PostgreSQL)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts        # Prisma client singleton
│   │   │   │   └── websocket.ts     # WebSocket server manager & event broadcaster
│   │   │   ├── routes/
│   │   │   │   ├── activities.routes.ts # /api/v1/activities
│   │   │   │   ├── health.routes.ts     # /api/v1/health
│   │   │   │   ├── tasks.routes.ts      # /api/v1/tasks
│   │   │   │   └── index.ts
│   │   │   ├── app.ts               # Express configuration & middleware
│   │   │   └── server.ts            # Entrypoint attaching HTTP & WS
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── DailySummary.tsx    # Daily Work Summary & checklist
│       │   │   ├── HealthDashboard.tsx # Workspace Telemetry & Health Dashboard
│       │   │   ├── Navbar.tsx          # Real-time connectivity banner
│       │   │   └── Timeline.tsx        # Unified Activity Timeline
│       │   ├── hooks/
│       │   │   └── useRealtime.ts      # WebSocket auto-reconnect hook
│       │   ├── pages/
│       │   │   └── WorkspacePage.tsx   # Integrated Connected Workspace
│       │   ├── services/
│       │   │   └── api.ts              # Typed API client
│       │   ├── types/
│       │   │   └── index.ts            # Shared domain types
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── .env.example
│       ├── index.html
│       ├── package.json
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── vite.config.ts
├── .env.example
├── .gitignore
├── package.json                     # Monorepo root package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
Run from the root directory:
```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` files if not already present:
```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

### 3. Start PostgreSQL & sync the schema
Postgres runs in Docker (Docker Desktop must be running):
```bash
docker compose up -d     # starts syncro-postgres on localhost:5432
npm run db:push          # creates/updates tables from prisma/schema.prisma
npm run db:studio        # optional: browse data in Prisma Studio
```
The backend now requires a real database. The old in-memory fallback stores were removed.

### 4. Run Development Servers
Start both backend and frontend concurrently with a single command:
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Gateway**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **WebSocket Gateway**: `ws://localhost:5000/ws`

---

### 5. Live demo (optional)
Set `DEMO_LOGIN=true` in `apps/backend/.env` and a **Try the live demo** button appears on the home and sign-in pages. It signs you into a ready-made workspace (4 teammates, a full board, a week of timesheets, live timers, meetings). The demo accounts have no password, so the button is the only way in. Rebuild the demo data any time with `npm run db:seed-demo` (it also refreshes itself every 6 hours).

## 🧩 Core Concepts

| Concept | Where | Notes |
| :--- | :--- | :--- |
| **Auth** | `routes/auth.routes.ts`, `lib/auth.ts` | Email + password (bcrypt), JWT bearer tokens (7d). Signup creates a personal workspace. |
| **Workspaces & roles** | `routes/workspaces.routes.ts`, `middleware/auth.ts` | Every resource is scoped to `/workspaces/:id`. Roles: OWNER > ADMIN > MEMBER > VIEWER (viewers are read-only). |
| **Activity Ledger** | `services/activity.service.ts` | Every mutation appends an `ActivityRecord` and pushes `ACTIVITY_RECORDED` live. Timeline, telemetry and (later) standup rollups read from it. |
| **Realtime gateway** | `lib/websocket.ts` | `ws://host/ws?token=JWT`, then `JOIN_WORKSPACE`. Per-workspace rooms, presence (online / typing / viewing), heartbeat cleanup. |
| **Telemetry** | `routes/telemetry.routes.ts` | Health score, completion rate, overdue count, 24h throughput, DB latency, online members. |
| **Kanban board** | `routes/tasks.routes.ts`, `components/KanbanTaskBoard.tsx` | To Do → In Progress → Review → Done with drag & drop (mouse, touch, keyboard). `POST /tasks/:id/move` re-numbers the column so order is identical for everyone, live. WIP warning when too much is in flight. |
| **Cards** | `components/TaskDrawer.tsx` | Checklists with progress, threaded comments, estimates vs tracked time, assignee / priority / due date / label, "start a call about this card". |
| **Live time tracking** | `routes/time.routes.ts` | One running timer per user, visible to the whole team as it ticks. Starting a timer on a To Do card moves it to In Progress. Manual logging, per-day/per-person timesheets, CSV export. |
| **Team live + standups** | `GET /telemetry/team` | Who is working on what right now, hours today/this week, workload per person, and an auto-written daily standup (done / doing / blockers) from the last 24h. |
| **Meetings** | `routes/meetings.routes.ts` | One-click instant rooms (Jitsi, no account needed), real Google Meet links (via Google Calendar) and Zoom meetings. Live meetings show a Join bar for everyone. |

### 🔌 Integrations (GitHub, Google Calendar + Meet, Zoom)
Each user connects their own accounts on **/profile**. Tokens are stored AES-256-GCM encrypted (`TOKEN_ENCRYPTION_KEY`).

| Provider | Create credentials | Callback / redirect URL |
| :--- | :--- | :--- |
| GitHub | github.com → Settings → Developer settings → **OAuth Apps** → New | `http://localhost:5000/api/v1/integrations/github/callback` |
| Google | console.cloud.google.com → enable **Google Calendar API** → OAuth consent screen (add yourself as a test user) → Credentials → **OAuth client ID (Web)** | `http://localhost:5000/api/v1/integrations/google/callback` |
| Zoom | marketplace.zoom.us → Develop → Build App → **General App** (user-managed OAuth). Scopes: `meeting:write:meeting`, `meeting:delete:meeting`, `user:read:user` | `http://localhost:5000/api/v1/integrations/zoom/callback` |

Put the IDs/secrets in `apps/backend/.env` (`GITHUB_*`, `GOOGLE_*`, `ZOOM_*` client id + secret) and restart the backend. Each integration is optional; instant meetings need no setup.
- **GitHub:** pick a repo per workspace; commits sync on demand and every 3 minutes in the background, authors are matched to members by GitHub login.
- **Google:** your events appear on the workspace calendar; team events can be mirrored into your Google Calendar; schedule Google Meet calls (optionally emailing invites to the team).
- **Zoom:** schedule Zoom meetings from the Meetings tab; cancelling in Syncro cancels them in Zoom.

### 🤝 Invites
Every workspace has an invite code (e.g. `K7QX-M2PA`) and link (`/join/K7QX-M2PA`). Members+ can share it; admins can regenerate it (old code stops working).

### API (all under `/api/v1`, Bearer token unless noted)
```
POST /auth/signup  POST /auth/login  (public)      GET /auth/me
GET|POST /workspaces                               GET|PATCH /workspaces/:id
GET|POST /workspaces/:id/members                   GET /workspaces/:id/activities?limit=&before=
GET|POST /workspaces/:id/tasks   PATCH|DELETE /workspaces/:id/tasks/:taskId
GET|POST /workspaces/:id/commits
GET|POST /workspaces/:id/events  DELETE /workspaces/:id/events/:eventId
GET /workspaces/:id/telemetry                      GET /health (public)
PATCH /auth/me   POST /auth/change-password
POST /workspaces/join {code}   POST /workspaces/:id/invite-code   DELETE /workspaces/:id/membership
POST /workspaces/:id/commits/sync
GET /integrations   GET /integrations/:provider/connect   GET /integrations/:provider/callback (public)
DELETE /integrations/:provider   GET /integrations/github/repos   GET /integrations/google/events
GET /workspaces/:id/tasks/:taskId                  POST /workspaces/:id/tasks/:taskId/move {status,index}
POST|PATCH|DELETE /workspaces/:id/tasks/:taskId/checklist[/:itemId]
POST|DELETE /workspaces/:id/tasks/:taskId/comments[/:commentId]
GET /workspaces/:id/time/active   POST /workspaces/:id/time/start|stop
GET|POST /workspaces/:id/time/entries   DELETE /workspaces/:id/time/entries/:entryId
GET /workspaces/:id/telemetry/team?dayStart&weekStart
GET|POST /workspaces/:id/meetings   DELETE /workspaces/:id/meetings/:meetingId
```

---

## 📦 Scripts Overview

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs backend (port 5000) and frontend (port 5173) concurrently |
| `npm run build` | Builds both backend and frontend for production |
| `npm run dev:backend` | Runs only the backend in watch mode |
| `npm run dev:frontend` | Runs only the frontend Vite dev server |
| `npm run db:push` | Syncs the Prisma schema to the database |
| `npm run db:secure` | Enables row-level security on all tables (run after `db:push` on Supabase) |
| `npm run db:migrate` | Runs Prisma database migrations |
| `npm run db:studio` | Launches Prisma Studio GUI |
| `npm run db:generate` | Generates Prisma client types |
