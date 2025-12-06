@echo off
echo ========================================
echo Fixing Rider App - SDK 53
echo ========================================
echo.

echo Step 1: Cleaning old files...
if exist node_modules rmdir /s /q node_modules
if exist .expo rmdir /s /q .expo
if exist package-lock.json del package-lock.json

echo.
echo Step 2: Installing dependencies (SDK 53)...
call npm install

echo.
echo Step 3: Starting app...
echo.
echo ========================================
echo Rider App Ready!
echo Scan QR code with Expo Go app
echo ========================================
echo.

call npm start
