# 🏗️ Job Tracker Architecture Documentation

This document outlines the high-level system architecture, component relationships, data flow, low-latency engineering, and security isolation models for **Job Tracker**.

---

## 1. System Topology & Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Interfaces"]
        WEB["🌐 Web Browser (Mobile & Desktop)"]
        DESK["💻 Native Desktop Shell (Tauri v2 + Rust)"]
    end

    subgraph Frontend ["Frontend App (React 19 + TypeScript Strict + Vite)"]
        subgraph Context_Layer ["4 Decomposed Domain Contexts"]
            AUTH_CTX["🔑 AuthContext (Session, JWT)"]
            APP_CTX["📋 ApplicationsContext (CRUD, Drag-and-Drop)"]
            LEARN_CTX["📚 LearningsContext (Journal, DSA Tracks)"]
            UI_CTX["🎨 UIContext (Modals, Toasts, Filters)"]
        end
        SYNC["🔄 Offline Mutation Queue (Account Scoped, Mutex Locked)"]
        CRYPTO_CLIENT["🛡️ Web Crypto API (PBKDF2 + AES-256-GCM)"]
    end

    subgraph Backend ["Backend API (Node.js & Express 5)"]
        MW_PIPE["🛡️ Middleware (HSTS, Strict CORS, X-Request-ID, RFC 7807)"]
        AUTH_SVC["🔒 Auth Service (scryptSync, timingSafeEqual)"]
        API_ROUTER["💼 Controllers (Applications, Learnings, DSA, Documents)"]
        CRYPTO_SVC["🔐 AES-256-GCM Svc (Decoupled .portal_key)"]
        STORAGE_SVC["📂 Storage Service (Jailed SafePath Resolution)"]
    end

    subgraph Persistence ["Persistence Layer"]
        SQLITE_LOCAL[("💾 SQLite 3 WAL Mode (busy_timeout=5s, Cache=64MB)")]
        TURSO_CLOUD[("☁️ Turso Edge LibSQL (Multi-Region Replica)")]
        GDRIVE["☁️ Google Drive v3 API (1-Click OAuth)"]
        FS_LOCAL["📁 Safe Local Filesystem Storage"]
    end

    WEB -->|"HTTPS / REST"| Context_Layer
    DESK -->|"Tauri Core IPC"| Context_Layer
    Context_Layer --> SYNC
    Context_Layer --> CRYPTO_CLIENT
    SYNC -->|"Authorized HTTP Calls"| MW_PIPE
    MW_PIPE --> AUTH_SVC
    AUTH_SVC --> API_ROUTER
    API_ROUTER --> CRYPTO_SVC
    API_ROUTER --> STORAGE_SVC

    API_ROUTER -->|"Local Mode"| SQLITE_LOCAL
    API_ROUTER -.->|"Cloud Edge Mode"| TURSO_CLOUD
    STORAGE_SVC -->|"Local Storage"| FS_LOCAL
    STORAGE_SVC -.->|"Cloud Storage"| GDRIVE
```

---

## 2. Authentication & Cryptographic Integrity Flow

Job Tracker enforces timing-safe, zero-knowledge authentication and multi-layered credential encryption:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant UI as Frontend App
    participant Auth as Auth Controller
    participant Crypto as Crypto Service
    participant DB as SQLite / Turso

    alt Google OAuth 2.0 Login
        User->>UI: Click "Continue with Google"
        UI->>User: Display Google Identity Services popup
        User->>UI: Select Google Account & Consent
        UI->>Auth: POST /api/auth/google { credentialToken }
        Auth->>Auth: Verify JWT signature with Google APIs
        Auth->>DB: Query or Upsert User (Google ID, Email, Name)
        Auth-->>UI: Return Signed Session JWT
    else Email & Password Login
        User->>UI: Enter Email & Password
        UI->>Auth: POST /api/auth/login { email, password }
        Auth->>Auth: Derive scrypt hash (N=16384, r=8, p=1)
        Auth->>Auth: crypto.timingSafeEqual(computed, storedHash)
        Auth-->>UI: Return Signed Session JWT
    end

    Note over UI: Store Session JWT in memory & account-scoped storage
    User->>UI: Save Application with Portal Password
    UI->>UI: Web Crypto API encrypts password in localStorage
    UI->>Auth: POST /api/applications (Authorization: Bearer <token>)
    Auth->>Crypto: encryptPortalPassword(plainPassword)
    Note over Crypto: Encrypt via AES-256-GCM using persistent .portal_key
    Crypto-->>Auth: enc:v1:iv:tag:ciphertext
    Auth->>DB: INSERT INTO applications (user_id, portal_password, ...)
    DB-->>Auth: Stored encrypted at rest
    Auth-->>UI: 201 Created
```

---

## 3. Atomic Transactional Drag-and-Drop Reordering

When a card is moved across or within Kanban stages, an atomic SQL transaction shifts positions in both source and destination columns:

```mermaid
sequenceDiagram
    autonumber
    actor User as User Drag Action
    participant UI as KanbanColumn Component
    participant Ctx as ApplicationsContext
    participant API as /api/applications/:id/move
    participant DB as SQLite Engine

    User->>UI: Drops card before Card K in Stage "Interviewing"
    UI->>Ctx: moveApplication(id, stage, beforeId)
    Note over Ctx: Optimistic Update: Instant UI state reorder
    Ctx->>API: POST /api/applications/:id/move { stage, before }
    API->>DB: BEGIN IMMEDIATE TRANSACTION
    Note over DB: Target Column: UPDATE applications SET position = position + 1 WHERE stage = ? AND position >= targetPos
    Note over DB: Source Column: UPDATE applications SET position = position - 1 WHERE stage = ? AND position > sourcePos
    Note over DB: Target Card: UPDATE applications SET stage = ?, position = ? WHERE id = ?
    DB-->>API: COMMIT
    API-->>Ctx: 200 OK { success: true }
```

---

## 4. Frontend State Architecture & Decomposition

The frontend eliminates monolithic God-Context re-renders by partitioning state into 4 domain providers:

1. **`AuthContext.tsx`:** Manages identity, JWT token storage, login/logout, and account preferences.
2. **`ApplicationsContext.tsx`:** Manages application cards, Kanban stages, atomic moves, bookmarks, and optimistic mutations.
3. **`LearningsContext.tsx`:** Manages daily technical study logs, DSA 12-topic roadmaps, flashcard intervals, and category filters.
4. **`UIContext.tsx`:** Controls active modal visibility, themes (light/dark), toast alerts, and search queries.

A backward-compatible umbrella provider (`AppContext.tsx`) re-exports `useApp()`, delegating seamlessly to each sub-context without breaking legacy consumers.

---

## 5. Low-Latency Performance Optimizations

### 5.1 Route-Level Code Splitting & Vendor Chunking
- All page views (`ApplicationsPage`, `LearningsPage`, `DsaPracticePage`, `CareerProfile`, `PublicPortfolioPage`) are lazy-loaded via `React.lazy()` with `<Suspense>` boundaries.
- Minified initial load bundle slashed from **929 kB down to 318 kB (-66%)**.
- Public recruiter portfolio (`/u/:slug`) loads in a lightweight **~31 kB** standalone chunk.

### 5.2 SQLite WAL Engine Tuning
The database in [backend/db.js](../board_website/backend/src/database/db.js) operates under tuned high-throughput pragmas:
- `journal_mode = WAL`: Concurrent non-blocking reads and writes.
- `busy_timeout = 5000`: 5-second automatic wait eliminates `SQLITE_BUSY` errors during disk contention.
- `synchronous = NORMAL`: Minimizes disk fsync overhead while guaranteeing ACID durability in WAL mode.
- `cache_size = -64000`: 64 MB in-memory page cache for hot query rows and B-tree index traversal.

### 5.3 Client Algorithmic Efficiency
- **Calendar Hash Map:** Replaced $O(\text{Days} \times N)$ linear scan filters inside the month render loop with an $O(N)$ single-pass hash bucket mapping.
- **Pomodoro Disk Thrashing:** Removed 2 Hz synchronous `localStorage.setItem` calls during active ticking, keeping timer increments in volatile memory and persisting exclusively on state transitions.

---

## 6. Security Guarantees & Defense-in-Depth

| Vulnerability Vector | Defense Mechanism | Implementation File |
| :--- | :--- | :--- |
| **Timing Attacks** | `crypto.timingSafeEqual` on password hashes and JWT signatures | `passwordService.js`, `jwtService.js` |
| **SQL Injection** | 100% parameterized query bindings (`better-sqlite3` and `@libsql/client`) | `db.js`, all controllers |
| **IDOR / Tenant Bleed** | Mandatory `user_id = ?` scoping on all reads, updates, and deletes | All controllers |
| **Path Traversal / LFI** | `resolveSafePath()` normalizes paths and enforces root jail confinement | `storageService.js` |
| **Credential Harvesting** | AES-256-GCM in DB (`.portal_key`) + Web Crypto API in `localStorage` | `cryptoService.js`, `security.ts` |
| **Process Injection** | Host OS application launching (`rundll32`, `open`) barred in cloud deployments | `documentsController.js` |
| **XSS & Sniffing** | Strict CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` | `app.js` |
