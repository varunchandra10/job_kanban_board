@echo off
title Job Tracker Desktop Launcher
cd /d "%~dp0"

echo [1/2] Checking local database engine...
node -e "const http=require('http');http.get('http://127.0.0.1:3000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1));" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Starting local database engine in background...
    start /min "Job Tracker Backend" cmd /c "cd /d \"%~dp0\\..\\board_website\\backend\" && set APP_MODE=desktop && node server.js"
    timeout /t 2 /nobreak >nul
) else (
    echo Local database engine is running.
)

echo [2/2] Launching Job Tracker Native Window...
if exist "src-tauri\target\release\app.exe" (
    start "" "src-tauri\target\release\app.exe"
) else if exist "src-tauri\target\release\bundle\nsis\Job Tracker_1.0.0_x64-setup.exe" (
    start "" "src-tauri\target\release\bundle\nsis\Job Tracker_1.0.0_x64-setup.exe"
) else (
    echo Building desktop app...
    pushd "%~dp0\.."
    call npm run build:tauri
    popd
    start "" "src-tauri\target\release\app.exe"
)
exit