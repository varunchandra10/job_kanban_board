# 🚀 Job Tracker Installation & Setup Guide

Welcome to the **Job Tracker** installation manual. Choose your preferred installation target below:

---

## ⚡ Quick Navigation

| Target | Who Is This For? | How to Install |
| :--- | :--- | :--- |
| **💻 Windows Desktop App** | Regular Users | [Download & Install .exe](#1-windows-desktop-app-installation) |
| **🌐 Local Web Server** | Developers / Self-Hosters | [Run Locally with Node.js](#2-local-web-application-setup) |
| **☁️ Cloud Deployment** | Cloud Hosting | [Deploy to Vercel](#3-cloud-deployment-vercel) |
| **🛠️ Compile from Source** | Developers / Contributors | [Build Tauri App from Source](#4-building-the-desktop-app-from-source) |

---

## 1. Windows Desktop App Installation

The desktop edition is a lightweight, privacy-focused native application for Windows 10 & 11 with an embedded local SQLite database and dual storage engine.

### Choose Your Edition

<p align="left">
  <a href="https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/Job-Tracker-Setup.exe">
    <img src="https://img.shields.io/badge/🚀_DOWNLOAD_INSTALLER-Job--Tracker--Setup.exe_(RECOMMENDED)-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download Job-Tracker-Setup.exe" height="42" />
  </a>
  &nbsp;
  <a href="https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/JobTracker.exe">
    <img src="https://img.shields.io/badge/⚡_DOWNLOAD_PORTABLE-JobTracker.exe_(ZERO_INSTALL)-2EA44F?style=for-the-badge&logo=windows&logoColor=white" alt="Download JobTracker.exe" height="42" />
  </a>
</p>

* **Option A: 1-Click Installer (`Job-Tracker-Setup.exe`)**:
  - Run the setup executable. Job Tracker installs immediately, adds Start Menu and Desktop shortcuts, and registers file/protocol associations.
* **Option B: Portable ZIP Package ([`Job-Tracker-Windows.zip`](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/install_apps/Job-Tracker-Windows.zip))**:
  - Extract the ZIP and run `JobTracker.exe` directly without installation.
  - Contains `Job-Tracker-Setup.exe`, `JobTracker.exe`, `README.txt`, and `Uninstall-Job-Tracker.bat`.

### Windows SmartScreen Note
If Windows SmartScreen displays *"Windows protected your PC"*:
1. Click **More info**.
2. Click **Run anyway** *(standard notification for newly compiled independent software without an enterprise certificate)*.

> 🔒 **Privacy Guarantee & Secondary Drive Storage**:
> All applications and database records are kept privately on your computer. You can also customize your document storage path to any secondary drive (e.g. `D:\JobTracker` or `E:\`) via the **"Change / Browse"** button in any application modal to protect against system drive issues. Seamless 1-Click Two-Way Sync to your personal Google Drive is also available whenever needed!

---

## 2. Local Web Application Setup

Run the full-stack web application locally in your browser.

### Prerequisites
- [Node.js](https://nodejs.org/) v20.0.0 or higher
- Git

### Step-by-Step Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/varunchandra10/job_kanban_board.git
   cd job_kanban_board
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd board_website/frontend && npm install
   cd ../backend && npm install
   cd ../..
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   * Frontend: `http://localhost:5173`
   * Backend API: `http://localhost:3000`

---

## 3. Cloud Deployment (Vercel)

The web edition is optimized for serverless edge deployment on Vercel:

1. Push your repository to GitHub.
2. Import the project in your Vercel Dashboard.
3. Configure the following Environment Variables:
   - `TURSO_DATABASE_URL`: Your Turso Database URL
   - `TURSO_AUTH_TOKEN`: Your Turso Auth Token
   - `JWT_SECRET`: Random 64-character secret
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
4. Deploy! Vercel automatically runs the frontend build and serves backend routes via serverless functions.

---

## 4. Building the Desktop App from Source

To compile your own standalone Windows desktop installer:

### Prerequisites
- [Rust & Cargo](https://rustup.rs/) (stable MSVC toolchain)
- Visual Studio C++ Build Tools
- Node.js (v20+)

### Build Commands
```bash
# 1. Build the frontend assets
cd board_website/frontend
npm run build

# 2. Compile the Tauri app
cd ../../desktop_app/src-tauri
cargo build --release

# 3. Build the standalone single-file installer
cd ../installer_src
cargo build --release
```

The output installer is generated at:
```text
install_apps/Job-Tracker-Setup.exe
```
