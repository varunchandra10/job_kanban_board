# Job Tracker Kanban Board — Modern Full-Stack App

A modern, high-performance job application and career tracking web application built with a React TypeScript frontend and a modular Node.js/Express SQLite backend.

---

## 📁 Directory Structure

```
board_website/
├── backend/                  # Express REST API Server
│   ├── backups/              # Automatic daily database backups
│   ├── documents/            # Uploaded resumes & cover letters (local storage)
│   ├── node_modules/         # Backend dependencies
│   ├── src/
│   │   ├── app.js            # Express app configuration & middleware pipeline
│   │   ├── config/           # Environment and path resolution
│   │   ├── controllers/      # Applications, auth, documents, learnings, etc.
│   │   ├── database/         # SQLite/LibSQL database engine & migrations
│   │   ├── middleware/       # Auth, error handling, rate limiting, multer
│   │   ├── routes/           # REST API routes (/api/*)
│   │   └── services/         # Storage (Local & Google Drive), JWT, password hashing
│   ├── package.json          # Backend dependencies & scripts
│   ├── server.js             # HTTP server entrypoint
│   └── .env                  # Backend environment configuration
│
├── frontend/                 # Modern React + Vite SPA
│   ├── node_modules/         # Frontend dependencies
│   ├── public/               # Public assets
│   ├── src/
│   │   ├── components/       # Applications board, calendar, learnings, profile, UI modals
│   │   ├── context/          # AppContext React state management
│   │   ├── services/         # API client communicating with /api
│   │   ├── types/            # TypeScript domain types
│   │   ├── utils/            # Constants, helpers, formatters
│   │   ├── App.tsx           # React Router routes
│   │   └── main.tsx          # React application root
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies & scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite build & /api proxy to localhost:3000
│
├── package.json              # Workspace root scripts (unified dev runner)
├── start-dev.js              # Dual-process runner (starts frontend + backend)
├── start.bat                 # Windows one-click dev launcher
└── .env                      # Workspace root environment configuration
```

---

## ⚡ Seamless Frontend & Backend Integration

The frontend and backend communicate seamlessly in both development and production:

1. **Development Mode (Vite Dev Server)**:
   - Frontend runs on `http://localhost:5173`.
   - `frontend/vite.config.ts` transparently proxies all `/api/*`, `/health`, and `/shutdown` requests to `http://localhost:3000`.
   - Express server enables CORS so direct calls from any port are also allowed.
   - Authentication defaults to `default_user` when running locally, providing instant zero-friction usage out-of-the-box.

2. **Production / Integrated Mode**:
   - Building the frontend (`npm run build`) generates static assets in `frontend/dist/`.
   - Express backend statically serves `frontend/dist/` with HTTP caching and automated SPA fallback to `index.html` for all client-side routes (`/board`, `/learnings`, `/profile`, `/applications`).

---

## 🚀 Quick Start

### Option 1: Unified Development (Recommended)

Run both Backend (port 3000) and Frontend (port 5173) simultaneously:

```bash
npm run dev
```

Or double-click **`start.bat`** on Windows.

### Option 2: Run Separately

In **Terminal 1** (Backend):
```bash
cd backend
npm run dev
```

In **Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
```

---

## 📦 Scripts Reference

| Command | Location | Description |
|---|---|---|
| `npm run dev` | `board_website` root | Starts both Backend and Frontend in parallel with colored logs |
| `npm run dev:frontend` | `board_website` root | Starts Vite frontend dev server only |
| `npm run dev:backend` | `board_website` root | Starts Express backend server with file watch |
| `npm run build` | `board_website` root | Compiles TypeScript and builds production frontend bundle |
| `npm start` | `board_website` root | Starts Express production server |
