# 💻 Job Tracker Desktop Guide

This guide covers features, options, and data management for the native Windows Desktop version of **Job Tracker**.

---

## 1. Installation & Editions

Choose between the recommended installer or zero-install portable edition:

<p align="left">
  <a href="https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/Job-Tracker-Setup.exe">
    <img src="https://img.shields.io/badge/🚀_DOWNLOAD_INSTALLER-Job--Tracker--Setup.exe-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download Job-Tracker-Setup.exe" height="42" />
  </a>
  &nbsp;
  <a href="https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/JobTracker.exe">
    <img src="https://img.shields.io/badge/⚡_DOWNLOAD_PORTABLE-JobTracker.exe-2EA44F?style=for-the-badge&logo=windows&logoColor=white" alt="Download JobTracker.exe" height="42" />
  </a>
</p>

- **Installer (`Job-Tracker-Setup.exe`)**: 1-click installer that sets up Desktop and Start Menu shortcuts, protocol associations, and clean uninstaller support.
- **Portable App (`JobTracker.exe`)**: Standalone executable. Run directly from any folder or USB drive with zero installation.
- **ZIP Bundle (`Job-Tracker-Windows.zip`)**: Contains both executable options, uninstaller, and documentation.

---

## 2. Privacy & Offline Local Storage

The desktop app runs in **100% Offline / Local Privacy Mode**:

```plaintext
User Data Directory: %APPDATA%\JobTracker\
├── tracker.db          # SQLite database storing your job records & learning logs
├── documents\          # Default documents directory for resumes & cover letters
└── backups\            # Automatic local snapshots
```

- **Default Storage Engine**: On the desktop app, storage defaults to **`LOCAL_STORAGE`** (saved directly to your local PC hard drive).
- **User-Defined Storage Path (Secondary Drives)**:
  - By default, documents are stored in `%APPDATA%\JobTracker\documents\`.
  - To protect your system `C:` drive from clutter or reinstall risks, you can **customize the documents storage location to any drive or folder** (e.g. `D:\JobTracker\Documents` or `E:\CareerFiles`).
  - Open any application modal, scroll to **Documents**, and click **"Change / Browse"** to set your preferred storage directory.
- **Zero Cloud Requirement**: You don't need Google Drive or external database servers to use the desktop version. All job data, notes, and uploaded files are saved locally on your computer.
- **Data Portability**: You can easily back up your data anytime by copying your documents folder or using the **"Download DB as ZIP"** button in your profile.

---

## 3. Real-Time Cloud Sync & 1-Click Mirroring

If you log in with your email account (via email/password or Google OAuth), the desktop app automatically connects to the cloud backend:
- Any job application or study note added on the web or your mobile phone synchronizes to your desktop app in real time.
- You can switch between **`LOCAL_STORAGE`** and **`G_DRIVE`** anytime via the toggle in your Profile card (protected by a confirmation modal).

### 🔄 1-Click Two-Way Document Mirroring & Sync:
- **Mirror Local to Drive**: Upload all your locally stored resumes and cover letters to your Google Drive folder in a single click.
- **Mirror Drive to Local**: Download all documents from Google Drive to your local documents folder for offline viewing.
- **Accessing Mirror & Sync**: Open your Profile or click the Drive icon to access the **Mirror & Sync** tab, or check *"Sync existing documents"* whenever you switch storage engines.

---

## 4. Native Desktop Features

- **System Tray**:
  - Closing the application window minimizes it to the Windows System Tray (near your system clock).
  - Left-click the tray icon to restore the window.
  - Right-click the tray icon for quick actions (*Show Window*, *Open Data Folder*, *Quit*).
- **Application Menu**:
  - `File` → `Open Data Folder`: Opens `%APPDATA%\JobTracker\` in Windows File Explorer.
  - `View` → `Toggle Developer Tools`: Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>I</kbd> or <kbd>F12</kbd> to inspect frontend console logs.
- **Deep-Link Authentication**:
  - Automatically registers `jobtracker://` in Windows so browser Google Logins automatically refocus the desktop app.

---

## 5. Building from Source (Developers)

To compile your own desktop executable:

1. **Prerequisites**: Node.js (v20+), Rust & Cargo, and Visual Studio C++ Build Tools.
2. **Build commands**:
   ```bash
   cd board_website/frontend && npm run build
   cd ../../desktop_app/src-tauri && cargo build --release
   cd ../installer_src && cargo build --release
   ```
3. The newly generated standalone installer is located at:
   ```text
   install_apps/Job-Tracker-Setup.exe
   ```
