@echo off
title Job Tracker Kanban Board
cd /d "%~dp0"

echo ========================================================
echo        Starting Job Tracker Full-Stack Dev...
echo ========================================================
echo.
echo Launching Backend on http://localhost:3000/
echo Launching Frontend on http://localhost:5173/
echo.

node start-dev.js
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        "C:\Program Files\nodejs\node.exe" start-dev.js
        set EXIT_CODE=%ERRORLEVEL%
    )
)

if %EXIT_CODE% equ 0 (
    exit
)

echo.
echo [ERROR] Server exited with code %EXIT_CODE%.
echo Please ensure Node.js is installed from https://nodejs.org
echo.
pause
exit /b %EXIT_CODE%
