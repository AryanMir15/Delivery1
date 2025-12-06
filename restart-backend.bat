@echo off
echo ========================================
echo   Restarting Backend Server
echo ========================================
echo.

echo Step 1: Killing port 4000...
node kill-port.js
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Starting backend server...
echo.
echo ========================================
echo   Backend Server Starting...
echo   Wait for: "Server running on port 4000"
echo ========================================
echo.

npm run dev
