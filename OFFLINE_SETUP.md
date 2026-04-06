# 🏨 Motel Management System - OFFLINE MODE

## 📱 **Your Personal Offline Motel Management System**

This system runs completely offline on your PC - no internet required!

---

## 🚀 **Quick Start**

### **Option 1: Double-click to start**
- Double-click `start-offline.bat`
- Wait for "Server running" message
- Open browser and go to: `http://localhost:3000`

### **Option 2: Manual start**
1. Open Command Prompt in this folder
2. Run: `node server.js`
3. Open browser: `http://localhost:3000`

---

## 🔑 **Login Credentials**
- **Username**: `admin`
- **Password**: `admin123`

---

## 💾 **Your Data**

### **Database Location**
- File: `motel.db` (in this folder)
- Type: SQLite database
- **IMPORTANT**: This file contains ALL your data!

### **Backup Your Data**
1. **Simple Backup**: Copy the `motel.db` file to a safe location
2. **Full Backup**: Copy the entire `motel` folder

### **Restore Data**
1. Replace `motel.db` with your backup file
2. Restart the application

---

## 🔒 **Offline Features**

✅ **Completely Offline** - No internet required  
✅ **Local Database** - All data stored on your PC  
✅ **System Fonts** - Uses Windows built-in fonts  
✅ **Emoji Icons** - No external icon dependencies  
✅ **Fast Performance** - Everything runs locally  

---

## 📊 **What You Can Do**

- ✅ **Manage Guests** - Add, edit, view guest information
- ✅ **Track Expenses** - Record and categorize expenses  
- ✅ **View Dashboard** - Real-time summaries and reports
- ✅ **Generate Reports** - Export data and reports
- ✅ **Multi-language** - English, Arabic, Kurdish support
- ✅ **User Management** - Create additional users (admin only)

---

## 🛠️ **Troubleshooting**

### **Server won't start**
- Make sure Node.js is installed
- Check if port 3000 is available
- Run as Administrator if needed

### **Can't access the website**
- Make sure server is running (check console)
- Use exactly: `http://localhost:3000`
- Try: `http://127.0.0.1:3000`

### **Lost data**
- Check if `motel.db` file exists
- Restore from backup if available
- Restart the application

---

## 📁 **File Structure**

```
motel/
├── server.js              # Main server file
├── motel.db              # Your database (BACKUP THIS!)
├── start-offline.bat     # Easy startup script
├── public/               # Web interface files
│   ├── index.html       # Main page
│   ├── css/             # Styles
│   └── js/              # Application logic
└── node_modules/        # Dependencies
```

---

## 🔄 **Updates**

To update the system:
1. **Backup your `motel.db` file first!**
2. Replace all files except `motel.db`
3. Restart the application

---

## 💡 **Tips**

- **Always backup** your `motel.db` file regularly
- **Keep the folder** in a safe location
- **Don't delete** `node_modules` folder
- **Use the batch file** for easy starting
- **Bookmark** `http://localhost:3000` in your browser

---

**Your motel management system is now completely offline and ready to use!** 🎉