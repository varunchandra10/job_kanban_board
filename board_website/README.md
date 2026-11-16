# Job Tracker Kanban Board — Full-Stack Web Workspace

A high-performance job application and career tracking web application built with a React 19 + TypeScript (strict null-safety) frontend and a modular Node.js/Express SQLite (WAL mode) / Turso Edge backend.

---

## 📁 Directory Structure

```
board_website/
├── backend/                       # Express REST API Server
│   ├── backups/                   # Automatic daily database backups
│   ├── documents/                 # Uploaded resumes & cover letters (local storage)
│   ├── tests/                     # 36 automated unit & regression test suites
│   │   ├── run_all_tests.js       # Master automated test harness runner
│   │   ├── test_applications_move_reordering.js
│   │   ├── test_crypto_scrypt_timing_safe.js
│   │   ├── test_database_sqlite_wal.js
│   │   ├── test_route_code_splitting_and_bundle_optimization.js
│   │   └── ...
│   ├── src/
│   │   ├── app.js                 # Express app configuration & middleware pipeline
│   │   ├── config/                # Environment and path resolution
│   │   ├── controllers/           # Applications, auth, documents, learnings, DSA
│   │   ├── database/              # SQLite/LibSQL database engine & migrations
│   │   ├── middleware/            # Auth guard, RFC 7807 error handler, rate limits
│   │   ├── routes/                # REST API routes (/api/*)
│   │   └── services/              # Storage (Local & Drive), JWT, scrypt, AES-256-GCM
│   ├── package.json               # Backend dependencies & scripts
│   ├── server.js                  # HTTP server entrypoint
│   └── .env                       # Backend environment configuration
│
├── frontend/                      # Modern React 19 + Vite SPA
│   ├── public/                    # Static icons, manifest, favicon
│   ├── src/
│   │   ├── components/            # Applications board, calendar, learnings, DSA, profile
│   │   ├── context/               # 4 Domain State Providers
│   │   │   ├── AuthContext.tsx    # Identity, JWT, login/logout
│   │   │   ├── ApplicationsContext.tsx # Job applications, Kanban drag-and-drop
│   │   │   ├── LearningsContext.tsx    # Technical concepts, DSA tracks
│   │   │   ├── UIContext.tsx      # Active modals, search, themes, toasts
│   │   │   └── AppContext.tsx     # Backward-compatible master provider umbrella
│   │   ├── hooks/                 # Custom React hooks (useResumeDuplicateCheck, etc.)
│   │   ├── services/              # API client communicating with /api
│   │   ├── types/                 # TypeScript domain types
│   │   ├── utils/                 # dateUtils, offlineSync, constants, security
│   │   ├── App.tsx                # Route-level code-splitting (React.lazy)
│   │   └── main.tsx               # Application root
│   ├── postbuild.js               # Route fallbacks & sync to desktop_app/src-tauri/dist
│   ├── package.json               # Frontend dependencies & scripts
│   ├── tsconfig.app.json          # TypeScript strict mode configuration
│   └── vite.config.ts             # Vite build & chunk isolation config
│
├── package.json                   # Workspace root scripts
├── start-dev.js                   # Dual-process runner (starts frontend + backend)
└── start.bat                      # Windows one-click dev launcher
```

---

## ⚡ Seamless Frontend & Backend Integration

The frontend and backend communicate seamlessly in both development and production:

1. **Development Mode (Vite Dev Server)**:
   - Frontend runs on `http://localhost:5173`.
   - `frontend/vite.config.ts` transparently proxies all `/api/*`, `/health`, and `/shutdown` requests to `http://localhost:5000` (or `3000`).
   - Express server enables strict CORS whitelisting with credentials support.
   - Correlation IDs (`X-Request-ID`) are minted and propagated across all requests and logs.

2. **Production / Integrated Mode**:
   - Running `npm run build` generates optimized, code-split chunks in `frontend/dist/`.
   - Main bundle is under **320 kB**; lazy-loaded routes (DSA, Career Profile, Public Portfolio) load on-demand.
   - `postbuild.js` synchronizes the build directly into `desktop_app/src-tauri/dist` for native desktop packaging.
   - Express backend statically serves `frontend/dist/` with HTTP caching and automated SPA fallbacks for all client-side routes.

---

## 🚀 Quick Start

### Option 1: Unified Development (Recommended)

Run both Backend and Frontend in parallel:
```bash
npm run dev
```
Or double-click **`start.bat`** on Windows.

### Option 2: Run Separately

In **Terminal 1** (Backend):
```bash
cd backend
npm start
```

In **Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
```

### Option 3: Run Full Regression Test Suite
```bash
node backend/tests/run_all_tests.js
```
Runs all 36 test suites covering authentication, SQLite WAL mode, dual-column drag-and-drop moves, bundle budgets, and strict TypeScript compilation.

---

## 📦 Scripts Reference

| Command | Location | Description |
|---|---|---|
| `npm run dev` | `board_website` root | Starts both Backend and Frontend in parallel |
| `npm run build` | `board_website` root | Installs dependencies, builds frontend, and runs postbuild sync |
| `npm run dev:frontend` | `board_website` root | Starts Vite frontend dev server only |
| `npm run dev:backend` | `board_website` root | Starts Node.js backend server only |
| `npm run test` | `board_website/backend` | Executes the 36 automated unit & regression suites |
