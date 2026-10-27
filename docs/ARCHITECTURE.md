# 🏗️ Job Tracker Architecture Documentation

This document outlines the high-level system architecture, component relationships, data flow, and security isolation models for **Job Tracker**.

---

## 1. System Topology & Architecture Diagram

```mermaid
graph TD
    subgraph Client_Layer ["Client Interfaces"]
        WEB["🌐 Modern Web Browser\n(Desktop & Mobile / iOS Safari / Chrome)"]
        DESK["💻 Native Desktop Shell (Tauri v2 + Rust)\n- System Tray & Custom Menus\n- Local Data Launcher\n- Auto-Updater (Minisign)"]
    end

    subgraph Frontend_App ["Frontend Application (React 19 + TypeScript + Vite)"]
        UI_KANBAN["📋 Kanban Pipeline\n- 5 Status Stages\n- Drag & Drop Cards\n- Responsive Modal"]
        UI_LEARN["📚 Daily Learnings\n- Rich Journal Notes\n- Tag & Date Filters\n- Search Bar"]
        UI_STATS["🔥 Gamification & Heatmap\n- Focus Pomodoro Timer\n- XP & Tier Progression\n- Activity Heatmaps"]
        UI_LOADER["✨ UX Polish\n- Shimmer Skeletons\n- Mobile Responsive Grids\n- Cross-Device Auto-Sync"]
        STATE["⚡ AppContext\n- Central State Management\n- Zero-Fetch Auth Guards\n- Optimistic UI Updates"]
    end

    subgraph Backend_Engine ["Backend Engine (Node.js & Express.js)"]
        AUTH_ROUTER["🔒 Auth Service\n- Google OAuth 2.0 (GIS)\n- Custom PIN Workspaces\n- JWT Token Signer"]
        APP_ROUTER["💼 Applications API\n- CRUD Operations\n- Stage Transitions\n- Metrics & Analytics"]
        LEARN_ROUTER["📝 Learnings API\n- Daily Logs & XP\n- Streak Tracking\n- Focus Sessions"]
        STORAGE_ROUTER["📁 Document Manager\n- Multer Streaming Uploads\n- MIME & Size Validation"]
    end

    subgraph Storage_Layer ["Dual Storage & Persistence Layer"]
        subgraph Desktop_Mode ["Desktop / Local Offline Mode"]
            SQLITE_LOCAL["💾 Local SQLite (WAL Mode)\nPath: %APPDATA%/JobTracker/tracker.db\nZero-Cloud Privacy"]
            DOCS_LOCAL["📂 Local File Storage\nPath: %APPDATA%/JobTracker/documents\nLocal PDF/Word resumes"]
            BACKUP_LOCAL["🛡️ Auto-Snapshots\nPath: %APPDATA%/JobTracker/backups"]
        end

        subgraph Cloud_Mode ["Web / Cloud Deployment (Vercel)"]
            SQLITE_CLOUD["☁️ Ephemeral Serverless DB\nPath: /tmp/tracker.db"]
            GDRIVE["☁️ Google Drive v3 API\nService Account Storage\nResumes & Documents"]
        end
    end

    WEB -->|"HTTPS / REST API"| Frontend_App
    DESK -->|"Embedded Webview / IPC"| Frontend_App

    Frontend_App -->|"JWT Authenticated Requests"| Backend_Engine
    STATE --> UI_KANBAN
    STATE --> UI_LEARN
    STATE --> UI_STATS
    STATE --> UI_LOADER

    Backend_Engine -->|"APP_MODE = desktop"| Desktop_Mode
    Backend_Engine -->|"VERCEL = 1"| Cloud_Mode
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
- **Background Engine Manager**: [`start-desktop.bat`](file:///c:/Users/kvcsu_ht23nk8/OneDrive/Desktop/Job_stuff/kanban_board/start-desktop.bat) verifies if the background SQLite engine is running on `127.0.0.1:3000`. If offline, it starts it silently in the background with `APP_MODE=desktop`.
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
