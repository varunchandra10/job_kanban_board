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

The desktop edition is a lightweight, privacy-focused native application for Windows 10 & 11 with an embedded local SQLite database.

### Step 1: Download Your Preferred Package
Choose one of the following packages:
* **Option A — Recommended MSI Installer (.msi)**:
  👉 **[Download Job-Tracker-Setup.msi](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/installer/Job-Tracker-Setup.msi)** *(Native Windows installer — avoids temporary extraction errors)*.
* **Option B — Portable Edition (.exe)**:
  👉 **[Download Job-Tracker-Portable.exe](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/installer/Job-Tracker-Portable.exe)** *(No setup wizard required — double-click to launch directly)*.
* **Option C — Standard Setup (.exe)**:
  👉 **[Download Job-Tracker-Setup.exe](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/installer/Job-Tracker-Setup.exe)**.

### Step 2: Run the Application
1. Double-click the downloaded file (`.msi` or `.exe`).
2. **If Windows SmartScreen appears** (*"Windows protected your PC"*):
   - Click **More info**.
   - Click **Run anyway** *(standard for independent software without a corporate code-signing certificate)*.
3. **If you encounter "NSIS Error: Error writing temporary file"**:
   - Run the **[.msi installer](https://github.com/varunchandra10/job_kanban_board/raw/refs/heads/main/installer/Job-Tracker-Setup.msi)** instead.
   - Or move the file to your local `Downloads` folder (outside OneDrive) and right-click &rarr; **Run as administrator**.

### Step 3: Launch & Use
Launch **Job Tracker** anytime from your Windows Start Menu or Desktop icon!

> 🔒 **Privacy Guarantee**: All your applications, compensation data, notes, and uploaded resumes are stored privately on your computer in a local SQLite database (`%APPDATA%\JobTracker\tracker.db`). Zero cloud accounts or external databases required.

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

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Launch the Application**:
   ```bash
   npm start
   ```
   Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## 3. Cloud Deployment (Vercel)

Deploy Job Tracker to Vercel with zero server maintenance:

1. **Install Vercel CLI & Login**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Link & Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   - `JWT_SECRET`: Random secure string for authentication.
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
   - `GOOGLE_DRIVE_FOLDER_ID`: Dedicated Google Drive folder ID for document uploads.
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Paste the full raw JSON content of your Google Service Account key.

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 4. Building the Desktop App from Source

To compile your own customized desktop installer `.exe`:

### Prerequisites
1. **Node.js**: v20.0.0+
2. **Rust & Cargo**: v1.78.0+ via [rustup.rs](https://rustup.rs/)
3. **C++ Build Tools (Windows)**:
   - Microsoft Visual Studio 2022 C++ Build Tools with the **"Desktop development with C++"** workload.

### Build Steps
1. **Build the Frontend Bundle**:
   ```bash
   cd board_website/frontend
   npm run build
   cd ../..
   ```

2. **Compile the Tauri Binary & NSIS Installer**:
   ```bash
   npm run build:desktop
   ```

3. The compiled installer will be saved to:
   ```text
   installer/Job-Tracker-Setup.exe
   ```

---

## ❓ Frequently Asked Questions

### Q: Windows SmartScreen blocked the installer?
> **Answer**: This is normal for open-source software that does not purchase a $500/year corporate code signing certificate. Simply click **More info** &rarr; **Run anyway**.

### Q: Where is my data saved in desktop mode?
> **Answer**: All data is stored locally in your Windows user profile:
> ```text
> %APPDATA%\JobTracker\tracker.db
> %APPDATA%\JobTracker\documents\
> ```
> To back up your data, you can copy this folder or use the in-app **"Download Database as ZIP"** feature.
