@echo off
echo ========================================
echo Motel Management System - Starting Server
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please run install.bat first.
    pause
    exit /b 1
)

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo ERROR: Dependencies not installed!
    echo Please run install.bat first.
    pause
    exit /b 1
)

echo.
echo Starting the Motel Management System...
echo.
echo The application will be available at: http://localhost:3000
echo.
echo Default admin credentials:
echo Username: admin
echo Password: admin123
echo.
echo Press Ctrl+C to stop the server
echo.

npm start