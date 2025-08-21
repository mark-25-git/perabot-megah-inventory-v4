@echo off
cd /d "%~dp0"

:: Ask for commit message
set /p msg=Enter commit message: 

:: Run Git commands
git add .
git commit -m "%msg%"
git pull origin main
git push origin main

echo.
echo ✅ Push completed to GitHub: perabot-megah-inventory-v4
pause
