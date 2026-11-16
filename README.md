# 💼 Job Tracker — Modern Career OS & Kanban System

[![Node.js >=20](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%205.x-blue.svg)](https://www.typescriptlang.org/)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2%20(Rust)-24c8db.svg)](https://tauri.app/)
[![SQLite WAL](https://img.shields.io/badge/Database-SQLite%203%20WAL%20%7C%20Turso-003B57.svg)](https://sqlite.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-36%2F36%20Passing%20(100%25)-success.svg)](board_website/backend/tests/run_all_tests.js)
[![Bundle Size](https://img.shields.io/badge/Bundle-318%20kB%20(-66%25)-blueviolet.svg)](board_website/frontend/dist)
[![Platform](https://img.shields.io/badge/Platform-Windows%20Desktop%20%7C%20Web%20Browser-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A high-performance, privacy-focused **Job Application Tracker & Career Management Hub** engineered with an interactive Kanban pipeline, 12-topic DSA interview prep suite, daily learning logs, focus Pomodoro timer, streak gamification, dual storage engine (Local Database & 1-Click Google Drive), bank-grade AES-256-GCM encryption, and native Windows desktop support.

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
[![Architecture Guide](https://img.shields.io/badge/Docs-Architecture_Guide-6F42C1?style=flat-square&logo=gitbook&logoColor=white)](docs/ARCHITECTURE.md)

</div>

---

## ⚡ Quick Start: Choose Your Windows Setup

### Option A: 1-Click Installer (Recommended)
1. Download [**`Job-Tracker-Setup.exe`**](install_apps/Job-Tracker-Setup.exe).
2. Double-click `Job-Tracker-Setup.exe` to install.
3. Automatically sets up Desktop and Start Menu shortcuts, registers custom protocol handlers (`jobtracker://`), and launches instantly.

### Option B: Standalone Portable App
1. Download [**`JobTracker.exe`**](install_apps/JobTracker.exe) or download [**`Job-Tracker-Windows.zip`**](install_apps/Job-Tracker-Windows.zip).
2. Extract and run `JobTracker.exe` directly from any folder or USB drive — zero installation required!

> **Note on Windows SmartScreen**: If Windows displays *"Windows protected your PC"*, click **More info** &rarr; **Run anyway**. *(Standard notification for newly built independent software without an enterprise code-signing certificate).*

---

## 🌟 Key Highlights & Engineering Features

### 📋 Interactive Kanban Pipeline
- **5-Stage Hiring Workflow**: Organize applications across `Applied`, `Interviewing`, `Offer`, `Rejected`, and `Wishlist`.
- **Atomic Transactional Drag & Drop**: Moves trigger server-side dual-column position re-indexing within an `IMMEDIATE` transaction, eliminating card order desynchronization.
- **Detailed Tracking**: Track company, job title, salary range, work location, deadlines, recruiter contacts, and portal login notes.
- **Tailored Resumes**: Attach resumes and cover letters per role with centralized Google Drive collision checks.

### 🧠 DSA & Technical Interview Preparation Roadmap
- **12 Comprehensive Topic Tracks**: Arrays, Two Pointers, Sliding Window, Trees, Graphs, Dynamic Programming, and more.
- **Spaced Repetition & Progress**: Tracks confidence levels, revision intervals, and completed problem counts with instant SQLite synchronization.

### 📚 Daily Learnings & Focus Gamification
- **Study Journal**: Record daily technical concepts, code snippets, and reference URLs.
- **Low-Latency Pomodoro Timer**: 25m work / 5m break sprints. State ticks in volatile memory with zero synchronous disk thrashing.
- **Activity Heatmap**: GitHub-style activity heatmaps visualizing daily application and study consistency.

### 💾 Dual Storage Engine: Local Storage vs 1-Click Google Drive
- **100% Privacy by Default**: Run completely offline with local SQLite storage.
- **Custom Secondary Drive Support**: Save resumes and documents to any drive or folder (e.g. `D:\CareerDocs` or `E:\`).
- **1-Click Google Drive Cloud Sync**: Seamlessly mirror documents to your personal Google Drive for cloud backup and multi-device access.

### 🛡️ Defense-in-Depth Cryptography & Security
- **Timing-Safe Auth**: Native `crypto.scryptSync` password hashing and HMAC-SHA256 JWT tokens verified via `crypto.timingSafeEqual`.
- **Dual-Layer At-Rest Encryption**: Client portal credentials in the database are encrypted with AES-256-GCM (`enc:v1:<iv>:<tag>:<ciphertext>`) using a decoupled key (`.portal_key`). In the browser, credentials in `localStorage` are encrypted using the Web Crypto API (PBKDF2 + AES-256-GCM).
- **100% Parameterized SQL**: Zero dynamic SQL concatenation across SQLite and Turso.
- **Jailed Path Traversal Defenses**: Strictly validates document file paths to prevent LFI attacks.

### 🔄 Multi-Tenant Offline Sync Engine
- **Account-Scoped Queue**: Mutations queue under `job_tracker_mutation_queue_<uid>` preventing cross-tenant bleed on shared PCs.
- **Optimistic ID Translation**: Client-generated temporary IDs (`temp-app-*`) are mapped to server auto-increments upon sync replay (`job_tracker_id_map`).
- **Concurrency Guard**: Replay stampedes during network flapping are blocked via mutex locking.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies | Key Optimizations |
| :--- | :--- | :--- |
| **Desktop Shell** | [Tauri v2](https://tauri.app/) (Rust 2024, WebView2) | Sub-millisecond IPC, 1-Click installer generator, offline local SQLite |
| **Frontend SPA** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) (Strict), [Vite 6](https://vitejs.dev/) | Route code-splitting (initial bundle **318 kB**, public routes **~31 kB**), 4 domain contexts (`Auth`, `Apps`, `Learnings`, `UI`) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) | Clean dark/light themes, accessible modal overlays with scroll locking |
| **Backend API** | Node.js >=20, Express 5 | RFC 7807 error envelopes, strict CORS, HSTS, `X-Request-ID` correlation |
| **Database** | SQLite 3 (WAL mode) / [Turso Edge LibSQL](https://turso.tech/) | `busy_timeout=5000ms`, `synchronous=NORMAL`, 64 MB memory cache |
| **Quality & Tests** | Node.js Test Harness (36 automated suites) | 100% passing unit & regression tests across auth, DB, storage, and bundle budgets |

---

## 🚀 Developer Quick Start

### 1. Prerequisites
- **Node.js >= 20.x** & **npm**
- **Rust & Cargo** (only required if building the desktop `.exe` from source)

### 2. Installation
```bash
git clone https://github.com/varunchandra10/job_kanban_board.git
cd kanban_board
npm --prefix board_website/frontend install
npm --prefix board_website/backend install
```

### 3. Running in Development
```bash
# Start backend server (port 5000)
cd board_website/backend
npm start

# In a separate terminal, start frontend dev server (port 5173)
cd board_website/frontend
npm run dev
```

### 4. Running the Automated Test Suite
```bash
node board_website/backend/tests/run_all_tests.js
```
*Executes all 36 unit and regression test suites with 100% pass verification.*

### 5. Compiling Desktop Executables (`install_apps/`)
To rebuild the frontend, embed it into the Tauri release binary, and package the installer into `install_apps/`:
```bash
npm run build:desktop
```
This single command automatically updates:
- `install_apps/Job-Tracker-Setup.exe`
- `install_apps/JobTracker.exe`
- `install_apps/Job-Tracker-Windows.zip`

---

## 📖 Documentation Index

- **[Architecture & Security Guide](docs/ARCHITECTURE.md)**: System topology, context breakdown, database pragmas, and cryptographic models.
- **[Installation Manual](docs/INSTALLATION.md)**: Setup guides for Windows desktop, local dev servers, and cloud deployments.
- **[Desktop User Guide](docs/DESKTOP_GUIDE.md)**: Windows shortcuts, offline mode, custom folder paths, and Google Drive mirroring.
- **[Full-Stack SDE Assessment Report](brain/fullstack_sde_hardening_assessment_report.md)**: Production readiness audit and performance benchmarks.
- **[Changelog](CHANGELOG.md)**: Complete version history and release notes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
