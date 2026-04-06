@echo off
title Motel Management System - Offline Mode
cls

echo ========================================
echo    MOTEL MANAGEMENT SYSTEM - OFFLINE
echo ========================================
echo.
echo Starting your personal motel management system...
echo This will run completely offline on your PC.
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js first.
    pause
    exit /b 1
)

REM Start the server
echo Starting server...
node server.js

REM If server stops, show message
echo.
echo Server stopped. Press any key to exit.
pause >nul