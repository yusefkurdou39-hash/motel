# Quick Setup Guide

## Prerequisites

1. **Install Node.js**
   - Go to https://nodejs.org/
   - Download the LTS version (recommended)
   - Run the installer and follow the instructions
   - This will also install npm (Node Package Manager)

## Installation

### Option 1: Using the batch files (Windows)
1. Double-click `install.bat` to install dependencies
2. Double-click `start.bat` to start the server

### Option 2: Using command line
1. Open Command Prompt or PowerShell
2. Navigate to the project folder:
   ```
   cd C:\Users\hp\Desktop\motel
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```

## First Time Access

1. Open your web browser
2. Go to: http://localhost:3000
3. Login with default admin credentials:
   - **Username**: admin
   - **Password**: admin123

## Important Security Steps

1. **Change the default admin password immediately**
2. **Update the JWT secret** in the `.env` file
3. **Create additional user accounts** as needed

## Features Overview

### 🏨 Guest Management
- Add guest information (name, ID/passport, room, days, payment)
- Track check-in and check-out dates
- Search and filter guests
- View guest history

### 💰 Expense Tracking
- Add expenses with categories
- Create custom expense categories
- Track expenses by date and category
- Calculate net income (earnings - expenses)

### 📊 Dashboard & Reports
- Real-time summary of guests and finances
- Filter data by date range
- Export reports as PDF
- Recent activity feed

### 👥 User Management (Admin)
- Create user accounts
- Assign roles and permissions
- Manage user access levels

### 🌐 Multilingual Support
- English, Arabic, and Kurdish languages
- RTL support for Arabic
- Easy language switching

## Troubleshooting

### Server won't start
- Make sure Node.js is installed
- Run `npm install` to install dependencies
- Check if port 3000 is available

### Can't login
- Use default credentials: admin/admin123
- Check browser console for errors
- Clear browser cache and cookies

### Database issues
- The SQLite database file (motel.db) will be created automatically
- If corrupted, delete motel.db and restart the server

## Support

- Check the main README.md for detailed documentation
- Review the troubleshooting section
- Ensure all dependencies are properly installed

## Development Mode

For development with auto-restart on file changes:
```
npm run dev
```

This requires nodemon, which is included in the dependencies.