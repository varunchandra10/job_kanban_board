# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-10-28

### 🌟 Dual Storage Engine, Single Standalone Installer & Authentication Parity

#### Added
- **Dual Storage Engine (`LOCAL_STORAGE` & `G_DRIVE`)**:
  - Added user profile storage pill toggle switch with interactive confirmation guard modal (`StorageSwitchModal`).
  - Intelligent environment defaults: Desktop `.exe` defaults to `LOCAL_STORAGE` (local database / PC disk); Web application defaults to `G_DRIVE` (1-Click Google Drive).
  - Mobile-responsive flow supporting native iOS Safari and Android Chrome *Files / Downloads* storage.
- **Standalone Single Windows Installer**:
  - Replaced legacy `.msi` and multi-file builds with a single unified installer [`Job-Tracker-Setup.exe`](install_apps/Job-Tracker-Setup.exe).
  - Embedded Windows PE resource metadata (Product Name: *Job Tracker*, Company: *Job Tracker*, Version: *1.0.0.0*, Copyright: *Copyright © 2026 Job Tracker*, and high-res application icon).
- **Database-Backed OAuth Desktop Flow**:
  - Implemented `pending_desktop_auth` database persistence for Google OAuth handoffs across serverless cloud lambdas.
  - Added Windows protocol handler (`jobtracker://`) in the installer for auto-focusing the desktop app post-login.
- **Prominent Installation Buttons**:
  - Replaced small markdown links in README and docs with high-visibility, 1-click Windows installer badges and action buttons.

#### Fixed
- **Form Input Wipe Bug**:
  - Resolved issue where uploading a resume or cover letter wiped out entered company, role, or documents on window focus / file picker closing via strict `prevOpenRef` transition guards.
- **Dynamic Profile Identity**:
  - Removed hardcoded "Varun Chandra" / "VC" default fallbacks. The profile dynamically inherits the logged-in user's name and generates custom avatar initials.
- **Streamlined 1-Click Google Drive Setup**:
  - Completely stripped out obsolete Google Service Account emails (`job-tracker-storage@...`) and manual folder ID inputs in favor of pure 1-click direct Google OAuth.

---

## [0.2.0] - 2026-10-24

### 🚀 Desktop Application Release (Tauri v2 + Rust)

This release delivers the first official native desktop application for Job Tracker, powered by **Tauri v2**, **Rust**, and an embedded **Node.js + SQLite** local engine.

#### Added
- **Native Toolchain & Auto-Detection**:
  - Implemented `scripts/desktop-env.js` to automatically detect Visual Studio C++ Build Tools and Windows SDK via `vswhere.exe`, injecting MSVC `link.exe` into the build environment.
  - Added cross-platform developer scripts: `npm run desktop:dev` and `npm run build:tauri`.
- **Security & Capabilities**:
  - Configured strict Content Security Policy (`CSP`), enabled `freezePrototype`, and removed all dangerous remote execution permissions.
  - Declarative capability-based permissions model configured in `src-tauri/capabilities/default.json`.
- **Front-end MPA Build Pipeline**:
  - Added Vite `8.x` bundler (`vite.config.mjs`) with multi-page entrypoints (`index.html`, `board.html`, `learnings.html`, `profile.html`) targeting `src-tauri/dist`.
  - Added automatic minification and asset hashing for offline desktop distribution.
- **Native IPC Commands**:
  - `export_csv`: Native OS file-save dialog for seamless CSV export.
  - `save_file_from_bytes`: Dialog-driven file saver for database backups.
  - `get_app_data_path` & `open_data_folder`: Resolves and launches Windows File Explorer at the per-user data directory.
  - `open_log_folder` & `get_log_dir`: Quick access to diagnostic logs.
  - `toggle_devtools`: Toggles embedded Chromium/WebView2 developer tools.
  - `check_for_updates`: Checks GitHub Releases for new updates with release notes.
  - `show_fatal_error`: Displays native modal dialog on unrecoverable errors.
- **Per-User Local Storage**:
  - Relocated desktop databases (`tracker.db`), documents (`uploads/`), and snapshots (`backups/`) to `%APPDATA%\JobTracker\`.
  - Seeded clean template database (`backend/src/database/tracker.template.db`) for fresh user installations.
- **System Tray & Window Menus**:
  - Persistent system tray icon with left-click toggle (show/hide) and right-click menu (**Show Window**, **Hide to Tray**, **Open Data Folder**, **Open Log Folder**, **Quit**).
  - Native window application menu with accelerators (`CmdOrCtrl+Q`, `CmdOrCtrl+R`, `CmdOrCtrl+Shift+I`).
  - Close-to-tray window management: closing the main window minimizes to tray without terminating active background processes.
- **Auto-Updater with Cryptographic Signing**:
  - Integrated `tauri-plugin-updater` checking `https://github.com/varunchandra10/job_kanban_board/releases/latest/download/latest.json`.
  - Configured Minisign key generation and automated artifact signing producing `.sig` verification files.
  - In-app "Check for Updates" UI button in Profile view and `Help → Check for Updates...` menu.
- **Diagnostics & Rotating File Logs**:
  - Enabled `tauri-plugin-log` with 5-generation file rotation capped at `2 MB` stored in `%LOCALAPPDATA%\com.jobtracker.desktop\logs\jobtracker.log`.
  - Global `Ctrl+Shift+I` and `F12` shortcuts for instant DevTools inspection.
  - Emergency dialog crash handler in `main.rs` displaying diagnostic error details if application startup fails.
- **Installer Bundles**:
  - NSIS lightweight setup installer (~3.4 MB) configured for per-user installation (`installMode: currentUser`).
  - Windows MSI enterprise installer (~4.9 MB).

---

## [0.1.0] - 2026-10-05

### Initial Web Release

- **Kanban Pipeline**: Multi-stage hiring board (`Applied`, `Interviewing`, `Offer`, `Rejected`, `Bookmarked`) with drag-and-drop.
- **Daily Learnings**: Study log tracking, subject tags, notes, and duration counters.
- **Focus Streak Engine**: Automated streak calculation with streak freeze protection and XP progression tiers.
- **Activity Matrix**: Dual-axis monthly calendar heatmaps for applications and study logs.
- **Cloud Storage**: Google Drive API integration via Service Account for resume and document cloud archiving.
- **Authentication**: Google Identity Services OAuth 2.0 and custom PIN email authentication with SQL multi-tenant isolation.
