@echo off
chcp 65001 >nul
echo.
echo 🚀 Quick Git Push
echo =================
echo.

:: Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git not found. Please install Git first.
    pause
    exit /b 1
)

:: Check if we're in a Git repository
if not exist ".git" (
    echo ❌ Not a Git repository. Run push-to-github.bat first.
    pause
    exit /b 1
)

:: Add all files
echo 📁 Adding files...
git add .

:: Auto-generate commit message with timestamp
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set today=%%a
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set now=%%a
set commit_msg="Update: %today% %now% - Inventory system changes"

:: Commit and push
echo 💾 Committing with message: %commit_msg%
git commit -m %commit_msg%

echo 🚀 Pushing to GitHub...
git push

echo ✅ Done!
pause
