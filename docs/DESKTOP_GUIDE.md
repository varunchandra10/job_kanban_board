# 💻 Job Tracker Desktop Guide

This guide covers features, options, and data management for the native Windows Desktop version of **Job Tracker**.

---

## 1. Installation

1. Download the Windows installer:
   👉 **[Download Job-Tracker-Setup.exe](../installer/Job-Tracker-Setup.exe?raw=true)** *(or from [GitHub Releases](https://github.com/varunchandra10/job_kanban_board/releases))*.
2. Run `Job-Tracker-Setup.exe` and follow the setup wizard.
3. Open **Job Tracker** from your Desktop or Start Menu.

---

## 2. Privacy & Offline Local Storage

The desktop app runs in **100% Offline / Local Privacy Mode**:

```plaintext
User Data Directory: %APPDATA%\JobTracker\
├── tracker.db          # SQLite database storing your job records & learning logs
├── documents\          # Local storage for your uploaded resumes & cover letters
└── backups\            # Automatic local snapshots
```

- **Zero Cloud Requirement**: You don't need Google Drive or external database servers to use the desktop version. All job data, notes, and uploaded files are saved locally on your computer.
- **Data Portability**: You can easily back up your data anytime by copying the `%APPDATA%\JobTracker` folder or using the **"Download Full Database as ZIP"** button in the app.

---

## 3. Native Desktop Features

- **System Tray**:
  - Closing the application window minimizes it to the Windows System Tray (near your system clock).
  - Left-click the tray icon to restore the window.
  - Right-click the tray icon for quick actions (*Show Window*, *Open Data Folder*, *Quit*).
- **Application Menu**:
  - `File` → `Open Data Folder`: Opens `%APPDATA%\JobTracker\` in Windows File Explorer.
  - `View` → `Toggle Developer Tools`: Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd> or <kbd>F12</kbd> to inspect frontend console logs.
  - `Help` → `Check for Updates`: Checks GitHub releases for cryptographically signed updates using Minisign.

---

## 4. Building from Source (Developers)

If you are a developer and want to compile your own desktop executable:

1. **Prerequisites**: Node.js (v20+), Rust & Cargo, and Visual Studio C++ Build Tools.
2. **Build command**:
   ```bash
   npm run build:desktop
   ```
3. The newly generated installer will be output to:
   ```text
   installer/Job-Tracker-Setup.exe
   ```
