@echo off
title Internship Tracker
cd /d "%~dp0"

echo ========================================================
echo           Starting Internship Tracker Board...
echo ========================================================
echo.
echo Server running at http://localhost:3000/
echo Opening your browser...
echo.

start http://localhost:3000/

:: Run Node.js server
node server.js
set EXIT_CODE=%ERRORLEVEL%

:: If default node command failed, try standard Program Files path
if %EXIT_CODE% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        "C:\Program Files\nodejs\node.exe" server.js
        set EXIT_CODE=%ERRORLEVEL%
    )
)

:: If server exited normally (code 0 / clean shutdown), close terminal immediately
if %EXIT_CODE% equ 0 (
    exit
)

:: Only pause if there was an actual error launching Node
echo.
echo [ERROR] Server exited with code %EXIT_CODE%.
echo Please ensure Node.js is installed from https://nodejs.org
echo.
pause
exit /b %EXIT_CODE%
