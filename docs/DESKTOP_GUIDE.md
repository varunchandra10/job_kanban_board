# 💻 Job Tracker Desktop Guide

This guide explains how to install, test, run, and package the native Windows Desktop version of **Job Tracker**.

---

## 1. Quick Launch Options

| Method | Target | Description |
| :--- | :--- | :--- |
| **🚀 1-Click Launcher (Recommended)** | [`start-desktop.bat`](file:///c:/Users/kvcsu_ht23nk8/OneDrive/Desktop/Job_stuff/kanban_board/start-desktop.bat) | Auto-checks if local SQLite backend is running on `port 3000`. If not, boots it silently and opens `app.exe`. |
| **📦 Windows Installer (.exe)** | [`Job Tracker_0.2.0_x64-setup.exe`](file:///c:/Users/kvcsu_ht23nk8/OneDrive/Desktop/Job_stuff/kanban_board/desktop_app/src-tauri/target/release/bundle/nsis/Job%20Tracker_0.2.0_x64-setup.exe) | Official NSIS Windows setup wizard. Installs to `%LOCALAPPDATA%\Programs\Job Tracker`, creates Start Menu & Desktop shortcuts. |
| **⚡ Standalone Portable (.exe)** | [`app.exe`](file:///c:/Users/kvcsu_ht23nk8/OneDrive/Desktop/Job_stuff/kanban_board/desktop_app/src-tauri/target/release/app.exe) | Single-binary native release. Run directly without installation. |

---

## 2. Installing via the Windows Setup Wizard

1. Navigate to:
   ```text
   kanban_board\desktop_app\src-tauri\target\release\bundle\nsis\
   ```
2. Double-click `Job Tracker_0.2.0_x64-setup.exe`.
3. If Windows SmartScreen displays a warning (*"Windows protected your PC"*):
   - Click **More info**.
   - Click **Run anyway** *(standard for locally-compiled binaries without an expensive EV code signing certificate)*.
4. Follow the setup wizard prompts.
5. Once complete, you can launch **Job Tracker** from your Windows Start Menu or Desktop icon.

---

## 3. How the Desktop Engine Works

The desktop app runs in **Offline / Local Privacy Mode** (`APP_MODE=desktop`):

```plaintext
User Data Root: %APPDATA%\JobTracker\
├── tracker.db          # Primary SQLite database (WAL Mode)
├── documents\          # Local resume attachments & cover letters
└── backups\            # Daily database snapshots
```

- **Zero Cloud Requirement**: You don't need Google Drive or external database servers to use the desktop version. All job data, notes, and uploaded files are saved locally.
- **Port 3000 Engine**: When [`start-desktop.bat`](file:///c:/Users/kvcsu_ht23nk8/OneDrive/Desktop/Job_stuff/kanban_board/start-desktop.bat) runs, it checks whether the backend engine is running on `http://127.0.0.1:3000`. If offline, it starts `node server.js` silently in the background with `APP_MODE=desktop`.

---

## 4. Native Desktop Features

- **System Tray**:
  - Closing the application window minimizes it to the Windows System Tray (near your system clock).
  - Left-click the tray icon to restore the window.
  - Right-click the tray icon for quick actions (*Show Window*, *Open Data Folder*, *Open Log Folder*, *Quit*).
- **Application Menu**:
  - `File` → `Open Data Folder`: Opens `%APPDATA%\JobTracker\` in Windows Explorer.
  - `File` → `Open Log Folder`: Opens `%LOCALAPPDATA%\com.jobtracker.desktop\logs\`.
  - `View` → `Toggle Developer Tools`: Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd> or <kbd>F12</kbd> to inspect frontend console logs.
  - `Help` → `Check for Updates`: Checks GitHub releases for cryptographically signed updates using Minisign.

---

## 5. Development & Rebuilding the App

If you make modifications to the frontend or backend and want to compile a fresh `.exe`:

1. **Rebuild Frontend Bundle**:
   ```bash
   cd board_website/frontend
   npm run build
   ```
   *(The `postbuild.js` hook automatically syncs the output bundle into `desktop_app/src-tauri/dist`).*

2. **Rebuild Desktop Installer (.exe)**:
   ```bash
   npm run build:tauri
   ```
   *(Alternatively run `node desktop_app/scripts/desktop-check.js build --release`).*
