# Job Tracker - Modern Career Hub & Kanban Application System

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Vercel%20%7C%20Tauri-orange.svg)]()

A high-performance, privacy-focused **Job Application Tracker and Career Management Hub** engineered with an interactive Kanban pipeline, daily learning logs, focus streak gamification, activity heatmaps, Google Drive cloud document storage, and authenticated multi-user isolation.

---

## Table of Contents

- [Features](#features)
  - [Interactive Kanban Pipeline](#1-interactive-kanban-pipeline)
  - [Daily Learnings & Gamification](#2-daily-learnings--gamification)
  - [Activity & Momentum Heatmaps](#3-activity--momentum-heatmaps)
  - [Profile & Portfolio Quick Links](#4-profile--portfolio-quick-links)
  - [Authentication & Multi-User Data Isolation](#5-authentication--multi-user-data-isolation)
  - [Google Drive Cloud Storage & Backups](#6-google-drive-cloud-storage--backups)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the App](#running-the-app)
- [Google OAuth Setup](#google-oauth-setup)
- [Google Drive Storage Configuration](#google-drive-storage-configuration)
- [Deployment](#deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Desktop App (Tauri Roadmap)](#desktop-app-tauri-roadmap)
- [License](#license)

---

## Features

### 1. Interactive Kanban Pipeline
* **Multi-Stage Board**: Organize job applications across `Applied`, `Interviewing`, `Offer`, `Rejected`, and `Bookmarked`.
* **Drag-and-Drop & Quick Moves**: Seamlessly reorder and transition applications across hiring stages.
* **Detailed Job Cards**: Track company name, job role, compensation (salary + currency), location (country/city), deadline, application date, and portal credentials.
* **Document Attachment**: Associate tailored resume versions and cover letter PDFs/Word documents with each specific role.
* **Search & Filters**: Instant keyboard-driven search (`/` or `Ctrl + K`) filtering by company, role, tags, or hiring status.

### 2. Daily Learnings & Gamification
* **Learning Log Journal**: Record daily technical concepts, aptitude prep, study durations, notes, and reference URLs.
* **Focus Streak Engine**:
  * Increments when you consistently apply to roles and log study sessions.
  * Automatic streak freeze protection during study-only days.
* **XP & Tier Progression**: Earn experience points (XP) based on study minutes and streak milestones to unlock tiers (Novice, Apprentice, Scholar, Practitioner, Expert, Master, Grandmaster).

### 3. Activity & Momentum Heatmaps
* **Dual-Axis Momentum Matrix**: Visual calendar heatmap segregating **Job Applications** from **Daily Learnings**.
* **Monthly Navigation**: Step through past months to visualize consistency over time.
* **Interactive Tooltips**: Hover over any calendar square to inspect exact applications submitted or study logs completed.

### 4. Profile & Portfolio Quick Links
* **1-Click Portfolio Links**: Quick access to your personal Portfolio website, GitHub, LinkedIn, contact email, and Google Drive resume link with instant clipboard copy buttons.
* **Conversion Funnel Analytics**: Real-time response rate metrics, interview ratios, and offer distribution percentages.

### 5. Authentication & Multi-User Data Isolation
* **Render-Style Modal UI**: Minimalist, sleek authentication modal.
* **Two Authentication Options**:
  1. **Google OAuth**: Official Google Identity Services integration with popup account chooser.
  2. **Custom Email**: Passwordless/PIN access mapping to personal isolated workspaces.
* **Zero-Fetch Protection When Logged Out**:
  * Unauthenticated / logged-out sessions display zero private data (`0 jobs`, `0 streak`, empty heatmap, no personal links).
  * Automated client-side fetch guards block background requests until authenticated.
* **Strict SQL Isolation**: All database operations query strictly `WHERE user_id = ?` preventing cross-user data leakage.

### 6. Google Drive Cloud Storage & Backups
* **Direct Google Drive Integration**: Upload resumes, cover letters, and transcripts directly to your Google Drive folder via a Google Service Account.
* **Live Blinking Status Dot**: Header indicator reflecting real-time Drive connection status.
* **Automated Daily Backups**: Local database automatically snapshots to `backups/tracker-YYYY-MM-DD.db.bak` on server startup.
* **Export Options**: 1-click **Download as CSV** and **Download Full Database (.db) as ZIP**.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (v20+ / v22+), Express.js (v5) |
| **Database** | SQLite via native `node:sqlite` (`DatabaseSync` with Write-Ahead Logging `WAL`) |
| **Authentication** | JWT (`jsonwebtoken`), Google OAuth 2.0 / Google Identity Services (GIS) |
| **Cloud Services** | Google Cloud APIs (`googleapis`, Google Drive v3 API) |
| **Frontend** | Vanilla HTML5, Modern CSS (Design Tokens, Dark/Light mode), Vanilla JavaScript |
| **Deployment** | Vercel Serverless (`@vercel/node`) / Desktop App via Tauri |

---

## Project Structure

```plaintext
kanban_board/
├── api/
│   └── index.js                 # Vercel serverless entry point
├── backend/
│   ├── src/
│   │   ├── config/              # Central configuration & env loader
│   │   ├── controllers/         # Application, learning, auth, storage controllers
│   │   ├── database/            # SQLite connection, schema migrations, seeds
│   │   ├── middleware/          # JWT auth guard, rate limiters, file uploads
│   │   ├── routes/              # Express API route endpoints
│   │   └── services/            # JWT signing, Google Drive storage services
│   └── server.js                # Backend application bootstrap
├── frontend/
│   ├── app.js                   # Kanban board interactive engine
│   ├── auth.js                  # Centralized authentication & zero-fetch guard
│   ├── index.html               # Main Kanban application board
│   ├── learnings.html           # Daily learnings journal & streak dashboard
│   ├── learnings.js             # Learnings & gamification engine
│   ├── logos.json               # Curated company logo SVGs
│   ├── profile.html             # Profile hub, heatmaps & stats analytics
│   ├── style.css                # Global design system & theme tokens
│   └── vendor/                  # Localized vendor assets
├── .env.example                 # Environment variables template
├── package.json                 # Project dependencies & start scripts
├── server.js                    # Local development server entrypoint
├── start.bat                    # 1-Click Windows startup launcher
├── tracker.db                   # Primary local SQLite database
└── vercel.json                  # Vercel deployment routing rules
```

---

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v20.0.0 or higher
* npm (bundled with Node.js)
* Google Chrome, Brave, or any modern web browser

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/varunchandra10/job_kanban_board.git
   cd job_kanban_board
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./google-service-account.json
```

### Running the App
* **Via npm**:
  ```bash
  npm start
  ```
* **Via 1-Click Windows Script**:
  Double-click `start.bat`.

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Google OAuth Setup

1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Select or create your project.
3. Configure the **OAuth Consent Screen**:
   * User Type: **External**
   * Scopes: `email`, `profile`, `openid` (non-sensitive).
   * Test Users: Add your Google email.
4. Create Credentials &rarr; **OAuth client ID**:
   * Application type: **Web application**
   * Authorized JavaScript origins:
     * `http://localhost:3000`
     * `https://your-app.vercel.app` (when deploying)
   * Authorized redirect URIs:
     * `http://localhost:3000`
     * `http://localhost:3000/api/auth/google/callback`
5. Copy the generated **Client ID** and add it to `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   ```

---

## Google Drive Storage Configuration

1. In Google Cloud Console, enable the **Google Drive API**.
2. Go to **Credentials** &rarr; **Create Credentials** &rarr; **Service Account**.
3. Create a JSON key for the Service Account and save it as `google-service-account.json` in the project root.
4. In Google Drive:
   * Create a dedicated folder (e.g., `Job Tracker Resumes`).
   * Share the folder with the Service Account email (give **Editor** permissions).
   * Copy the folder ID from the URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`).
   * Set `GOOGLE_DRIVE_FOLDER_ID=<FOLDER_ID>` in your `.env`.

---

## Deployment

### Vercel Deployment
1. Install the Vercel CLI or connect via the Vercel dashboard:
   ```bash
   npm install -g vercel
   vercel
   ```
2. Configure Environment Variables in the Vercel Project Settings:
   * `JWT_SECRET`
   * `GOOGLE_CLIENT_ID`
   * `GOOGLE_CLIENT_SECRET`
   * `GOOGLE_DRIVE_FOLDER_ID`
   * `GOOGLE_SERVICE_ACCOUNT_KEY` (paste the raw JSON content of your service account key)
3. Deploy:
   ```bash
   vercel --prod
   ```

### Desktop App (Tauri Roadmap)
The application’s lightweight vanilla frontend and SQLite backend make it ideal for packaging into an ultra-fast desktop binary with [Tauri](https://tauri.app/):
* Binary size: ~15MB (compared to ~150MB+ for Electron).
* Runs locally with the embedded SQLite database in OS-level user data directories (`%APPDATA%` on Windows, `~/Library/Application Support` on macOS).

---

## License

This project is licensed under the [MIT License](LICENSE).
