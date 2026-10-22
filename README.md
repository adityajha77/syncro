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

### 3. Database Migration & Prisma Setup
To push the schema or apply migrations with PostgreSQL:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio GUI
npm run db:studio
```

*Note: In development, the backend automatically provides graceful fallback stores so the API, UI, and WebSockets can be previewed immediately even if your local PostgreSQL server is temporarily offline.*

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

## 📦 Scripts Overview

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs backend (port 5000) and frontend (port 5173) concurrently |
| `npm run build` | Builds both backend and frontend for production |
| `npm run dev:backend` | Runs only the backend in watch mode |
| `npm run dev:frontend` | Runs only the frontend Vite dev server |
| `npm run db:migrate` | Runs Prisma database migrations |
| `npm run db:studio` | Launches Prisma Studio GUI |
| `npm run db:generate` | Generates Prisma client types |
