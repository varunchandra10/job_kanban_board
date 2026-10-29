# 💼 Job Tracker – Modern Career Hub & Kanban System

[![Node.js >=20](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2%20(Rust)-24c8db.svg)](https://tauri.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20Desktop%20%7C%20Web%20Browser-orange.svg)]()

A high-performance, privacy-focused **Job Application Tracker & Career Management Hub** engineered with an interactive Kanban pipeline, daily learning logs, focus Pomodoro timer, streak gamification, activity heatmaps, dual storage engine (Local Database & 1-Click Google Drive), and native Windows desktop support.

---

<div align="center">

## 📥 Get Job Tracker for Windows

Choose the edition that best fits your workflow:

<br/>

<a href="https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/Job-Tracker-Setup.exe">
  <img src="https://img.shields.io/badge/🚀_DOWNLOAD_INSTALLER-Job--Tracker--Setup.exe_(RECOMMENDED)-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download Job-Tracker-Setup.exe" height="48" />
</a>
&nbsp;&nbsp;
<a href="https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/JobTracker.exe">
  <img src="https://img.shields.io/badge/⚡_DOWNLOAD_PORTABLE-JobTracker.exe_(ZERO_INSTALL)-2EA44F?style=for-the-badge&logo=windows&logoColor=white" alt="Download JobTracker.exe Portable" height="48" />
</a>

<br/><br/>

[![Download Full ZIP Bundle](https://img.shields.io/badge/Full_ZIP_Bundle-Job--Tracker--Windows.zip-8A2BE2?style=flat-square&logo=archive&logoColor=white)](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/Job-Tracker-Windows.zip)
[![GitHub Releases](https://img.shields.io/badge/Releases-Latest_Builds-0078D4?style=flat-square&logo=github&logoColor=white)](https://github.com/varunchandra10/job_kanban_board/releases)
[![Installation Guide](https://img.shields.io/badge/Docs-Installation_Guide-2EA44F?style=flat-square&logo=gitbook&logoColor=white)](docs/INSTALLATION.md)
[![Desktop Guide](https://img.shields.io/badge/Docs-Desktop_Guide-FFA500?style=flat-square&logo=gitbook&logoColor=white)](docs/DESKTOP_GUIDE.md)

</div>

---

## ⚡ Quick Start: Choose Your Windows Setup

### Option A: 1-Click Installer (Recommended)
1. Download [**`Job-Tracker-Setup.exe`**](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/Job-Tracker-Setup.exe).
2. Double-click `Job-Tracker-Setup.exe` to install.
3. Automatically sets up Desktop and Start Menu shortcuts, protocol handlers, and launches instantly.

### Option B: Standalone Portable App
1. Download [**`JobTracker.exe`**](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/JobTracker.exe) or download [**`Job-Tracker-Windows.zip`**](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/Job-Tracker-Windows.zip).
2. Extract and run `JobTracker.exe` directly from any folder or USB drive — zero installation required!

> **Note on Windows SmartScreen**: If Windows displays *"Windows protected your PC"*, click **More info** &rarr; **Run anyway**. *(Standard notification for newly built independent software without an enterprise code-signing certificate).*

---

## 🔄 Real-Time Multi-Device & Account Sync

* **100% Data Parity**: Whether you log in via the **Windows Desktop `.exe`** or the **Web Application (`kanban-board-job.vercel.app`)**, logging in with the same email gives you access to the exact same synchronized real-time data.
* **Instant Sync**: Applications added or moved on your phone or browser appear on the desktop app immediately, and vice-versa.

---

## 💾 Dual Storage Engine: Local Storage vs 1-Click Google Drive

Job Tracker includes an intelligent dual-engine document manager with an interactive confirmation guard:

| Feature | 💾 `LOCAL_STORAGE` | ☁️ `G_DRIVE` |
| :--- | :--- | :--- |
| **Best For** | Windows Desktop App & Offline Use | Multi-Device Web & Cloud Backup |
| **Default Setting** | **Default for Desktop `.exe`** | **Default for Web Browsers** |
| **Custom Path Support** | **Yes** (Save to any drive: `D:\`, `E:\`, custom folder) | Managed securely in user's Google Drive |
| **Google Account Required?** | **No** (0 credentials needed) | **Yes** (1-Click OAuth to your Drive) |
| **Where Files Are Stored** | Local Database & User-Defined Hard Drive Path | Your Personal 15 GB Google Drive |
| **Mobile Flow (iOS / Android)** | Saves to phone's *Files / Downloads* | Opens in Google Drive app / web |
| **Confirmation Guard** | Interactive modal confirms switch | Interactive modal confirms switch |

### 🛡️ User-Defined Storage Directory (Safe Across Drives)
By default, documents save locally to protect your privacy. To protect your Windows `C:` drive from clutter or system reinstall risks, you can **customize your storage directory to any drive or folder** (e.g., `D:\MyResumes` or `E:\JobTracker`):
- Click **"Change / Browse"** in the Documents section of any job application.
- Select or enter your preferred folder path on any drive.
- All subsequent resumes and cover letters are organized directly in your chosen location!

### 🔄 1-Click Two-Way Document Mirroring & Sync
Switching between Local Storage and Google Drive? Job Tracker keeps your files completely in sync:
- **Mirror Local &rarr; Google Drive**: Upload all your locally stored resumes and cover letters to your Google Drive folder in 1 click.
- **Mirror Google Drive &rarr; Local**: Download all your cloud-stored documents to your local PC hard drive for offline access.
- **Automatic Sync Prompt**: When switching storage engines via your Profile, simply check *"Sync existing documents"* to migrate your files automatically!

---

## ✨ Core Features

### 📋 Interactive Kanban Pipeline
- **5-Stage Hiring Workflow**: Organize applications across `Applied`, `Interviewing`, `Offer`, `Rejected`, and `Wishlist`.
- **Drag-and-Drop Cards**: Fluid transitions between hiring stages.
- **Detailed Tracking**: Record company, role, salary, location, deadlines, recruiter contacts, and portal login notes.
- **Resume & Document Attachments**: Keep your tailored resumes and cover letters organized per role.
- **Instant Search & Filters**: Search across company names, roles, and tags instantly.

### 📚 Daily Learnings & Focus Gamification
- **Study Log Journal**: Capture daily technical prep, aptitude notes, and reference links.
- **Focus Pomodoro Timer**: Built-in study timer with automated session tracking.
- **Streak & XP Progress**: Maintain daily momentum and level up from *Novice* to *Grandmaster*.
- **Momentum Activity Matrix**: GitHub-style activity heatmaps tracking daily applications and learning consistency.

### 👤 Dynamic User Profile & Career Hub
- **Personalized Header**: Dynamically pulls your registered account name and generates custom avatar initials.
- **Quick Links Manager**: One-click shortcuts to LeetCode, GitHub, LinkedIn, portfolios, and job boards.
- **CSV & Database Backup**: Export all applications to CSV or download full database snapshots as `.zip`.

---

## 🛠️ Tech Stack

- **Desktop Framework**: [Tauri v2](https://tauri.app/) (Rust + WebView2)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend**: Node.js, Express
- **Database**: SQLite / [Turso Edge LibSQL](https://turso.tech/) with schema migrator
- **Authentication**: JWT, bcrypt, Google OAuth 2.0 with database-persisted desktop sessions

---

## 📖 Documentation

- **[Installation & Setup Guide](docs/INSTALLATION.md)**: Detailed guide for Windows, local dev, and Vercel.
- **[Desktop Guide](docs/DESKTOP_GUIDE.md)**: Windows desktop shortcuts, system tray, and local storage.
- **[Architecture Guide](docs/ARCHITECTURE.md)**: Frontend/backend architecture and data flow.
- **[Changelog](CHANGELOG.md)**: Complete record of features, security, and bug fixes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
