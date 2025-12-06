@echo off
echo ========================================
echo Pushing Delivery Project to GitHub
echo ========================================
echo.

REM Initialize git if not already initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    echo.
)

REM Add all files
echo Adding all files...
git add .
echo.

REM Commit changes
echo Committing changes...
git commit -m "Complete delivery platform with vendor, mobile, rider, and admin apps"
echo.

REM Set main branch
echo Setting main branch...
git branch -M main
echo.

REM Add remote origin
echo Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/muluken16/Delivery1.git
echo.

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin main --force
echo.

echo ========================================
echo Done! Check https://github.com/muluken16/Delivery1
echo ========================================
pause
