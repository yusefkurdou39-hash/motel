@echo off
echo ========================================
echo Motel Management System - Starting Server
echo ========================================
echo.

set NODE_PATH="C:\Program Files\nodejs\node.exe"
set NPM_PATH="C:\Program Files\nodejs\npm.cmd"

echo Checking Node.js installation...
%NODE_PATH% --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found at expected location!
    echo Please check your Node.js installation.
    pause
    exit /b 1
)

echo Node.js found and working!
echo.

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    %NPM_PATH% install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo Starting the Motel Management System...
echo.
echo ========================================
echo  MOTEL MANAGEMENT SYSTEM IS STARTING
echo ========================================
echo.
echo The application will be available at:
echo http://localhost:3000
echo.
echo Default admin credentials:
echo Username: admin
echo Password: admin123
echo.
echo IMPORTANT: Change the default password after first login!
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

%NODE_PATH% server.js