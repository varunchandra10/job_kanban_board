# 🏗️ Job Tracker Architecture Documentation

This document outlines the high-level system architecture, component relationships, data flow, and security isolation models for **Job Tracker**.

---

## 1. System Topology & Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Interfaces"]
        WEB["🌐 Web Browser (Mobile & Desktop)"]
        DESK["💻 Native Desktop Shell (Tauri v2 + Rust)"]
    end

    subgraph Frontend ["Frontend App (React 19 + TypeScript + Vite)"]
        STATE["⚡ AppContext (State & Auth Guard)"]
        UI_KANBAN["📋 Kanban Board (Drag-and-Drop)"]
        UI_LEARN["📚 Daily Learnings & Journal"]
        UI_STATS["🔥 Gamification & Heatmap"]
        UI_LOADER["✨ Shimmer Loaders & Modals"]
    end

    subgraph Backend ["Backend API (Node.js & Express.js)"]
        AUTH_ROUTER["🔒 Auth Service (Google OAuth & PIN)"]
        API_ROUTER["💼 Application & Learning APIs"]
        STORAGE_ROUTER["📁 Document Streaming (Multer)"]
    end

    subgraph Local_Storage ["Local Desktop Storage (%APPDATA%/JobTracker)"]
        SQLITE_LOCAL[("💾 Local SQLite DB (WAL Mode)")]
        DOCS_LOCAL["📂 Local Document Storage"]
        BACKUP_LOCAL["🛡️ Auto-Backups"]
    end

    subgraph Cloud_Storage ["Cloud Web Storage (Vercel)"]
        SQLITE_CLOUD[("☁️ Ephemeral Serverless DB (/tmp)")]
        GDRIVE["☁️ Google Drive v3 API Storage"]
    end

    WEB -->|"HTTPS / REST"| STATE
    DESK -->|"Embedded Webview / IPC"| STATE

    STATE --> UI_KANBAN
    STATE --> UI_LEARN
    STATE --> UI_STATS
    STATE --> UI_LOADER

    STATE -->|"JWT Authenticated Requests"| AUTH_ROUTER
    STATE -->|"REST API Calls"| API_ROUTER
    STATE -->|"File Uploads"| STORAGE_ROUTER

    AUTH_ROUTER --> SQLITE_LOCAL
    API_ROUTER --> SQLITE_LOCAL
    STORAGE_ROUTER --> DOCS_LOCAL
    SQLITE_LOCAL --> BACKUP_LOCAL

    AUTH_ROUTER -.->|"Cloud Mode"| SQLITE_CLOUD
    API_ROUTER -.->|"Cloud Mode"| SQLITE_CLOUD
    STORAGE_ROUTER -.->|"Cloud Mode"| GDRIVE
```

---

## 2. Authentication & Multi-User Data Isolation Flow

Job Tracker enforces strict per-user data isolation. Unauthenticated or logged-out users are protected by **Zero-Fetch Guards** that stop network calls from exposing cached metrics.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant UI as Frontend App
    participant Auth as Auth Controller
    participant DB as SQLite Database

    alt Google OAuth 2.0 Login
        User->>UI: Click "Continue with Google"
        UI->>User: Display Google Identity Services popup
        User->>UI: Select Google Account & Consent
        UI->>Auth: POST /api/auth/google { credentialToken }
        Auth->>Auth: Verify JWT signature with Google APIs
        Auth->>DB: Query or Upsert User (Google ID, Email, Name)
        Auth-->>UI: Return Signed Session JWT
    else Custom PIN / Email Login
        User->>UI: Enter Email & Workspace PIN
        UI->>Auth: POST /api/auth/pin { email, pin }
        Auth->>DB: Validate bcrypt hash of workspace PIN
        Auth-->>UI: Return Signed Session JWT
    end

    Note over UI: Store Session JWT in memory / secure storage
    UI->>Auth: GET /api/applications (Authorization: Bearer <token>)
    Auth->>Auth: Decode token & extract `userId`
    Auth->>DB: SELECT * FROM applications WHERE user_id = ?
    DB-->>Auth: Isolated records for this user only
    Auth-->>UI: 200 OK (User's Kanban cards)
```

---

## 3. Desktop Application Architecture (Tauri v2 + Rust)

The desktop application is built with **Tauri v2** to deliver native desktop capabilities without Electron's heavy resource footprint:

- **Binary Size**: ~3.5 MB installer (vs. 150MB+ in typical Electron apps).
- **Embedded Webview**: Utilizes Microsoft Edge WebView2 on Windows.
- **Single-Executable Launcher**: `app.exe` natively embeds the compiled frontend bundle and bridges to local system APIs via Rust IPC.
- **Background Engine Manager**: [`start-desktop.bat`](../start-desktop.bat) verifies if the background SQLite engine is running on `127.0.0.1:3000`. If offline, it starts it silently in the background with `APP_MODE=desktop`.
- **System Tray**:
  - Left-click icon toggles visibility.
  - Right-click menu provides quick access to *Show Window*, *Open Data Folder*, *Open Logs*, and *Quit*.
  - Closing the application window minimizes to the tray instead of terminating background sync.

---

## 4. Database Schema Overview

The SQLite database operates in **Write-Ahead Logging (WAL)** mode for concurrent read/write transactions:

```mermaid
erDiagram
    USERS ||--o{ APPLICATIONS : owns
    USERS ||--o{ LEARNINGS : logs
    USERS ||--o{ FOCUS_SESSIONS : completes
    USERS ||--o{ USER_SETTINGS : configures

    USERS {
        text id PK
        text email UK
        text name
        text picture
        text auth_provider
        text password_hash
        datetime created_at
    }

    APPLICATIONS {
        text id PK
        text user_id FK
        text company
        text role
        text stage
        text salary
        text location
        text job_url
        text portal_username
        text portal_password
        text resume_drive_id
        text resume_file_name
        datetime deadline
        datetime applied_at
        datetime updated_at
    }

    LEARNINGS {
        text id PK
        text user_id FK
        text topic
        text description
        text category
        integer minutes_spent
        text reference_url
        date logged_date
        datetime created_at
    }

    FOCUS_SESSIONS {
        text id PK
        text user_id FK
        integer duration_minutes
        text session_type
        text completed
        datetime started_at
        datetime ended_at
    }

    USER_SETTINGS {
        text user_id PK, FK
        text theme
        text portfolio_url
        text github_url
        text linkedin_url
        text contact_email
        text drive_resume_url
        text daily_streak_count
        date last_active_date
    }
```

---

## 5. Security & Privacy Guarantees

1. **Zero-Fetch Logged-Out Guard**: When no valid JWT session exists, the frontend displays neutral empty states and executes zero authenticated endpoints.
2. **Strict SQL Parameterization**: Every database query uses parameterized statements (`?`), mitigating SQL injection risks.
3. **Local Storage First (Desktop)**: In desktop mode, all personal job applications, compensation details, credentials, and uploaded resumes remain stored locally on the user's hard drive at `%APPDATA%\JobTracker\`.
4. **Cloud Privacy (Web)**: In cloud mode, credentials and documents are stored only within user-authorized Google Drive folders using encrypted tokens.
