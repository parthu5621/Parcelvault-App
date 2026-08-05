@echo off
title ParcelVault App Launcher

echo.
echo  ============================================
echo   ParcelVault App - Quick Launcher
echo  ============================================
echo.

REM Step 1: Start backend
echo [1/3] Starting Backend Server (port 3001)...
start "ParcelVault Backend" cmd /k "cd /d "%~dp0backend" && npm start"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

REM Step 2: Configure ADB port forwarding for Android device
echo [2/3] Connecting Android ADB port forwarding...
adb reverse tcp:3001 tcp:3001 > nul 2>&1

REM Step 3: Start frontend
echo [3/3] Starting Frontend Web App (port 5173)...
start "ParcelVault Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo  ============================================
echo   Both servers are starting!
echo.
echo   Web App:  http://localhost:5173
echo   Backend:  http://localhost:3001/api/health
echo.
echo   Admin Login:
echo     Email:    parcelvault21@gmail.com
echo     Password: (your admin password)
echo.
echo   Default Admin (backup):
echo     Email:    admin@university.edu
echo     Password: admin123
echo  ============================================
echo.

REM Open browser after a short delay
timeout /t 4 /nobreak > nul
start "" "http://localhost:5173"

pause
