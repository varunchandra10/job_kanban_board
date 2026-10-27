# 🚀 Job Tracker Installation & Setup Guide

Welcome to the **Job Tracker** installation manual. Choose your preferred installation target below:

---

## ⚡ Quick Navigation

| Method | Target Platform | Difficulty | Guide Link |
| :--- | :--- | :--- | :--- |
| **💻 Windows Desktop App** | Windows 10 / 11 | Beginner (1-Click) | [Jump to Desktop Setup](#1-windows-desktop-app-installation) |
| **🌐 Local Web Server** | Windows / macOS / Linux | Intermediate | [Jump to Web Setup](#2-local-web-application-setup) |
| **☁️ Cloud Deployment** | Vercel Serverless | Advanced | [Jump to Vercel Deploy](#3-cloud-deployment-vercel) |
| **🛠️ Compile from Source** | Developers (Rust + Node) | Advanced | [Jump to Source Build](#4-building-the-desktop-app-from-source) |

---

## 1. Windows Desktop App Installation

The desktop edition is a lightweight, privacy-focused native app powered by **Tauri v2** with an embedded local SQLite database.

### Option A: Official Windows Setup Wizard (`.exe`) — *Recommended*
1. Locate the setup executable:
   ```text
   desktop_app/src-tauri/target/release/bundle/nsis/Job Tracker_0.2.0_x64-setup.exe
   ```
2. Double-click the `.exe` file.
3. **If Windows SmartScreen appears** (*"Windows protected your PC"*):
   - Click **More info**.
   - Click **Run anyway** *(standard for self-compiled binaries without third-party EV digital certificates)*.
4. Follow the setup wizard:
   - Select your installation folder (defaults to `%LOCALAPPDATA%\Programs\Job Tracker`).
   - Check the boxes to create a **Desktop Shortcut** and **Start Menu entry**.
   - Click **Finish**.

### Option B: Standalone Portable Binary (`app.exe`)
- Path: `desktop_app/src-tauri/target/release/app.exe`
- Run directly without installation.

### Option C: 1-Click Auto Launcher (`start-desktop.bat`)
- Double-click [`start-desktop.bat`](../start-desktop.bat) in the project root.
- Automatically verifies if the background SQLite backend is running on `port 3000`. If offline, it starts it silently in the background (`APP_MODE=desktop`) and opens the native application window.

> 💾 **Local Data Storage**: All applications, notes, analytics, and resume uploads are stored locally in `%APPDATA%\JobTracker\tracker.db`. Zero cloud accounts or external databases required.

---

## 2. Local Web Application Setup

Run the full-stack web application locally in your browser.

### Prerequisites
- [Node.js](https://nodejs.org/) v20.0.0 or higher
- npm (bundled with Node.js)

### Step-by-Step Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/varunchandra10/job_kanban_board.git
   cd job_kanban_board
   ```

2. **Install all dependencies**:
   ```bash
   # Install root orchestration dependencies
   npm install

   # Install frontend & backend packages
   cd board_website/frontend && npm install
   cd ../backend && npm install
   cd ../..
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
   *Key variables:*
   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
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

Deploy Job Tracker to Vercel with zero server maintenance.

1. **Install Vercel CLI & Login**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Link & Configure Project**:
   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   - `JWT_SECRET`: Random secure string.
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
   *(The `postbuild.js` script automatically syncs the output bundle into `desktop_app/src-tauri/dist`).*

2. **Compile the Tauri Binary & NSIS Installer**:
   ```bash
   npm run build:desktop
   ```
   *(Alternatively run `cargo tauri build` from `desktop_app`).*

3. **Output Files**:
   - **Setup Installer**: `desktop_app/src-tauri/target/release/bundle/nsis/Job Tracker_0.2.0_x64-setup.exe`
   - **Portable Binary**: `desktop_app/src-tauri/target/release/app.exe`

---

## ❓ Frequently Asked Questions & Troubleshooting

### Q: Windows SmartScreen blocked the installer?
> **Answer**: This is normal for newly built or self-compiled software without a $500/year corporate code signing certificate. Click **More info** &rarr; **Run anyway**.

### Q: Port 3000 is already in use?
> **Answer**: You can change the port in `.env` by setting `PORT=3001` or any available port number.

### Q: Where can I back up my local data?
> **Answer**: In desktop mode, your complete database and uploaded files live in:
> ```text
> %APPDATA%\JobTracker\tracker.db
> %APPDATA%\JobTracker\documents\
> ```
> Simply back up that directory or use the **"Download Full Database (.db) as ZIP"** button inside the app.
