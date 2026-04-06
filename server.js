const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Security middleware
// Note: The frontend page uses CDN scripts (jspdf/html2canvas), so CSP must allow them.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
        }
    }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// No rate limiting for offline personal use
// Rate limiting disabled for better performance on local system

// Serve static files (including working-motel.html)
app.use(express.static(__dirname));

// Database initialization
const db = new sqlite3.Database('./motel.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // App state key/value store (keeps frontend JSON in SQLite for online sharing)
    db.run(`CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating app_state table:', err.message);
    });

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        permissions TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table created successfully');
            // Create default admin user after users table is created
            createDefaultAdmin();
            // Ensure default app_state exists
            ensureDefaultAppState();
        }
    });

    // Guests table
    db.run(`CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        id_passport TEXT,
        room_id TEXT NOT NULL,
        days_staying INTEGER NOT NULL,
        amount_paid REAL NOT NULL,
        checkin_date DATE NOT NULL,
        checkout_date DATE,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating guests table:', err.message);
        } else {
            console.log('Guests table created successfully');
        }
    });

    // Expense categories table
    db.run(`CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL,
        name_ku TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating expense_categories table:', err.message);
        } else {
            console.log('Expense categories table created successfully');
            // Create default categories after table is created
            createDefaultCategories();
        }
    });

    // Expenses table
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category_id INTEGER NOT NULL,
        expense_date DATE NOT NULL,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES expense_categories (id),
        FOREIGN KEY (created_by) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating expenses table:', err.message);
        } else {
            console.log('Expenses table created successfully');
        }
    });
}

function ensureDefaultAppState() {
    const defaults = {
        motel_guests: [],
        motel_expenses: [],
        motel_categories: [
            { id: 1, name: 'Food & Beverages' },
            { id: 2, name: 'Maintenance' },
            { id: 3, name: 'Utilities' },
            { id: 4, name: 'Supplies' },
            { id: 5, name: 'Other' }
        ],
        motel_settings: {
            language: 'en',
            currency: 'USD',
            dateFormat: 'YYYY-MM-DD',
            theme: 'default',
            motelName: 'Motel System',
            rooms: [
                { number: '101', capacity: 2 },
                { number: '102', capacity: 2 },
                { number: '103', capacity: 4 },
                { number: '201', capacity: 2 },
                { number: '202', capacity: 6 }
            ]
        }
    };

    const keys = Object.keys(defaults);
    keys.forEach((key) => {
        db.run(
            `INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)`,
            [key, JSON.stringify(defaults[key])]
        );
    });
}

function getStateKey(key) {
    const allowed = new Set(['motel_guests', 'motel_expenses', 'motel_categories', 'motel_settings']);
    if (!allowed.has(key)) return null;
    return key;
}

function readState(key) {
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM app_state WHERE key = ?', [key], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            try {
                resolve(JSON.parse(row.value));
            } catch {
                resolve(null);
            }
        });
    });
}

function writeState(key, value) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
            [key, JSON.stringify(value)],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

// Create default admin user
function createDefaultAdmin() {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const adminPermissions = JSON.stringify({
        viewReports: true,
        addGuests: true,
        editGuests: true,
        deleteGuests: true,
        manageExpenses: true,
        manageCategories: true,
        manageUsers: true,
        exportData: true
    });

    db.run(`INSERT OR IGNORE INTO users (username, password, full_name, role, permissions) 
            VALUES (?, ?, ?, ?, ?)`, 
            ['admin', hashedPassword, 'System Administrator', 'admin', adminPermissions],
            function(err) {
                if (err) {
                    console.error('Error creating admin user:', err.message);
                } else if (this.changes > 0) {
                    console.log('Default admin user created successfully');
                }
            });
}

// Create default expense categories
function createDefaultCategories() {
    const categories = [
        { en: 'Electricity', ar: 'الكهرباء', ku: 'کارەبا' },
        { en: 'Cleaning', ar: 'التنظيف', ku: 'پاککردنەوە' },
        { en: 'Maintenance', ar: 'الصيانة', ku: 'چاککردنەوە' },
        { en: 'Food & Beverages', ar: 'الطعام والمشروبات', ku: 'خواردن و خواردنەوە' },
        { en: 'Utilities', ar: 'المرافق', ku: 'خزمەتگوزاریەکان' },
        { en: 'Marketing', ar: 'التسويق', ku: 'بازرگانی' },
        { en: 'Other', ar: 'أخرى', ku: 'هیتر' }
    ];

    categories.forEach(category => {
        db.run(`INSERT OR IGNORE INTO expense_categories (name_en, name_ar, name_ku) 
                VALUES (?, ?, ?)`, 
                [category.en, category.ar, category.ku]);
    });
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Permission check middleware
function checkPermission(permission) {
    return (req, res, next) => {
        if (req.user.role === 'admin') {
            return next(); // Admins have all permissions
        }

        const userPermissions = JSON.parse(req.user.permissions || '{}');
        if (userPermissions[permission]) {
            return next();
        }

        return res.status(403).json({ error: 'Insufficient permissions' });
    };
}

// API Routes

// Frontend-compatible permissions
function mapDbPermissionsToFrontend(permissionsJson, role) {
    if (role === 'admin') return ['view', 'add', 'edit', 'delete', 'export', 'settings', 'backup'];
    let perms = {};
    try { perms = JSON.parse(permissionsJson || '{}'); } catch { perms = {}; }
    // Map existing permission flags to the simple UI permissions
    const out = new Set(['view']);
    if (perms.addGuests) out.add('add');
    if (perms.editGuests) out.add('edit');
    if (perms.deleteGuests) out.add('delete');
    if (perms.exportData) out.add('export');
    if (perms.manageUsers) out.add('settings');
    if (perms.manageUsers) out.add('backup');
    return Array.from(out);
}

// Health check for hosting platforms
app.get('/health', (req, res) => {
    res.status(200).json({ ok: true, service: 'motel-management' });
});

// Authentication routes
app.post('/api/login', [
    body('username').notEmpty().trim().escape(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                permissions: user.permissions 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
                permissions: mapDbPermissionsToFrontend(user.permissions, user.role)
            }
        });
    });
});

// Get initial data for the UI (guests/expenses/categories/settings)
app.get('/api/bootstrap', authenticateToken, async (req, res) => {
    try {
        const [guests, expenses, categories, settings] = await Promise.all([
            readState('motel_guests'),
            readState('motel_expenses'),
            readState('motel_categories'),
            readState('motel_settings')
        ]);

        res.json({ guests: guests || [], expenses: expenses || [], categories: categories || [], settings: settings || {} });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Save updated state (frontend will push after edits)
app.put('/api/state/:key', authenticateToken, async (req, res) => {
    const key = getStateKey(req.params.key);
    if (!key) return res.status(400).json({ error: 'Invalid key' });

    // Minimal permission gating
    if (key === 'motel_settings' && req.user.role !== 'admin') return res.status(403).json({ error: 'Insufficient permissions' });
    if (key === 'motel_categories' && req.user.role !== 'admin') return res.status(403).json({ error: 'Insufficient permissions' });

    try {
        await writeState(key, req.body);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Get current user info
app.get('/api/user', authenticateToken, (req, res) => {
    db.get('SELECT id, username, full_name, role, permissions FROM users WHERE id = ?', 
           [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            ...user,
            permissions: JSON.parse(user.permissions || '{}')
        });
    });
});

// Guest management routes
app.get('/api/guests', authenticateToken, checkPermission('viewReports'), (req, res) => {
    const { startDate, endDate, roomId, guestName, page = 1, limit = 50 } = req.query;
    
    let query = `SELECT g.*, u.full_name as created_by_name 
                 FROM guests g 
                 LEFT JOIN users u ON g.created_by = u.id 
                 WHERE 1=1`;
    let params = [];

    if (startDate && endDate) {
        query += ` AND g.checkin_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    if (roomId) {
        query += ` AND g.room_id LIKE ?`;
        params.push(`%${roomId}%`);
    }

    if (guestName) {
        query += ` AND g.full_name LIKE ?`;
        params.push(`%${guestName}%`);
    }

    query += ` ORDER BY g.checkin_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    db.all(query, params, (err, guests) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM guests g WHERE 1=1`;
        let countParams = [];

        if (startDate && endDate) {
            countQuery += ` AND g.checkin_date BETWEEN ? AND ?`;
            countParams.push(startDate, endDate);
        }

        if (roomId) {
            countQuery += ` AND g.room_id LIKE ?`;
            countParams.push(`%${roomId}%`);
        }

        if (guestName) {
            countQuery += ` AND g.full_name LIKE ?`;
            countParams.push(`%${guestName}%`);
        }

        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                guests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / parseInt(limit))
                }
            });
        });
    });
});

// Add new guest
app.post('/api/guests', authenticateToken, checkPermission('addGuests'), [
    body('full_name').notEmpty().trim().escape(),
    body('room_id').notEmpty().trim().escape(),
    body('days_staying').isInt({ min: 1 }),
    body('amount_paid').isFloat({ min: 0 }),
    body('checkin_date').isISO8601()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, id_passport, room_id, days_staying, amount_paid, checkin_date, notes } = req.body;
    
    // Calculate checkout date
    const checkinDate = new Date(checkin_date);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + parseInt(days_staying));

    db.run(`INSERT INTO guests (full_name, id_passport, room_id, days_staying, amount_paid, 
                               checkin_date, checkout_date, notes, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, id_passport, room_id, days_staying, amount_paid, 
             checkin_date, checkoutDate.toISOString().split('T')[0], notes, req.user.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ id: this.lastID, message: 'Guest added successfully' });
            });
});

// Update guest
app.put('/api/guests/:id', authenticateToken, checkPermission('editGuests'), [
    body('full_name').notEmpty().trim().escape(),
    body('room_id').notEmpty().trim().escape(),
    body('days_staying').isInt({ min: 1 }),
    body('amount_paid').isFloat({ min: 0 }),
    body('checkin_date').isISO8601()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { full_name, id_passport, room_id, days_staying, amount_paid, checkin_date, notes } = req.body;
    
    // Calculate checkout date
    const checkinDate = new Date(checkin_date);
    const checkoutDate = new Date(checkinDate);
    checkoutDate.setDate(checkoutDate.getDate() + parseInt(days_staying));

    db.run(`UPDATE guests SET full_name = ?, id_passport = ?, room_id = ?, days_staying = ?, 
                             amount_paid = ?, checkin_date = ?, checkout_date = ?, notes = ?, 
                             updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
            [full_name, id_passport, room_id, days_staying, amount_paid, 
             checkin_date, checkoutDate.toISOString().split('T')[0], notes, id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Guest not found' });
                }
                res.json({ message: 'Guest updated successfully' });
            });
});

// Delete guest
app.delete('/api/guests/:id', authenticateToken, checkPermission('deleteGuests'), (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM guests WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Guest not found' });
        }
        res.json({ message: 'Guest deleted successfully' });
    });
});

// Dashboard summary
app.get('/api/dashboard/summary', authenticateToken, checkPermission('viewReports'), (req, res) => {
    const { startDate, endDate, roomId } = req.query;
    
    let guestQuery = `SELECT COUNT(*) as total_guests, SUM(amount_paid) as total_earnings 
                      FROM guests WHERE 1=1`;
    let expenseQuery = `SELECT SUM(amount) as total_expenses FROM expenses WHERE 1=1`;
    let params = [];

    if (startDate && endDate) {
        guestQuery += ` AND checkin_date BETWEEN ? AND ?`;
        expenseQuery += ` AND expense_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    if (roomId) {
        guestQuery += ` AND room_id LIKE ?`;
        params.push(`%${roomId}%`);
    }

    db.get(guestQuery, params, (err, guestSummary) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        db.get(expenseQuery, startDate && endDate ? [startDate, endDate] : [], (err, expenseSummary) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const totalEarnings = guestSummary.total_earnings || 0;
            const totalExpenses = expenseSummary.total_expenses || 0;
            const netIncome = totalEarnings - totalExpenses;

            res.json({
                totalGuests: guestSummary.total_guests || 0,
                totalEarnings,
                totalExpenses,
                netIncome
            });
        });
    });
});

// Expense categories routes
app.get('/api/expense-categories', authenticateToken, (req, res) => {
    db.all('SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY name_en', (err, categories) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(categories);
    });
});

// Add expense category
app.post('/api/expense-categories', authenticateToken, checkPermission('manageCategories'), [
    body('name_en').notEmpty().trim().escape(),
    body('name_ar').notEmpty().trim().escape(),
    body('name_ku').notEmpty().trim().escape()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name_en, name_ar, name_ku, description } = req.body;

    db.run(`INSERT INTO expense_categories (name_en, name_ar, name_ku, description) 
            VALUES (?, ?, ?, ?)`,
            [name_en, name_ar, name_ku, description],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ id: this.lastID, message: 'Category added successfully' });
            });
});

// Update expense category
app.put('/api/expense-categories/:id', authenticateToken, checkPermission('manageCategories'), [
    body('name_en').notEmpty().trim().escape(),
    body('name_ar').notEmpty().trim().escape(),
    body('name_ku').notEmpty().trim().escape()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name_en, name_ar, name_ku, description } = req.body;

    db.run(`UPDATE expense_categories SET name_en = ?, name_ar = ?, name_ku = ?, description = ? 
            WHERE id = ?`,
            [name_en, name_ar, name_ku, description, id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Category not found' });
                }
                res.json({ message: 'Category updated successfully' });
            });
});

// Delete expense category
app.delete('/api/expense-categories/:id', authenticateToken, checkPermission('manageCategories'), (req, res) => {
    const { id } = req.params;

    // Check if category is being used
    db.get('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.count > 0) {
            // Soft delete - mark as inactive
            db.run('UPDATE expense_categories SET is_active = 0 WHERE id = ?', [id], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Category deactivated successfully' });
            });
        } else {
            // Hard delete
            db.run('DELETE FROM expense_categories WHERE id = ?', [id], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Category deleted successfully' });
            });
        }
    });
});

// Expenses routes
app.get('/api/expenses', authenticateToken, checkPermission('viewReports'), (req, res) => {
    const { startDate, endDate, categoryId, page = 1, limit = 50 } = req.query;
    
    let query = `SELECT e.*, ec.name_en as category_name_en, ec.name_ar as category_name_ar, 
                        ec.name_ku as category_name_ku, u.full_name as created_by_name
                 FROM expenses e 
                 LEFT JOIN expense_categories ec ON e.category_id = ec.id
                 LEFT JOIN users u ON e.created_by = u.id 
                 WHERE 1=1`;
    let params = [];

    if (startDate && endDate) {
        query += ` AND e.expense_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
    }

    if (categoryId) {
        query += ` AND e.category_id = ?`;
        params.push(categoryId);
    }

    query += ` ORDER BY e.expense_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    db.all(query, params, (err, expenses) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM expenses e WHERE 1=1`;
        let countParams = [];

        if (startDate && endDate) {
            countQuery += ` AND e.expense_date BETWEEN ? AND ?`;
            countParams.push(startDate, endDate);
        }

        if (categoryId) {
            countQuery += ` AND e.category_id = ?`;
            countParams.push(categoryId);
        }

        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                expenses,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / parseInt(limit))
                }
            });
        });
    });
});

// Add expense
app.post('/api/expenses', authenticateToken, checkPermission('manageExpenses'), [
    body('amount').isFloat({ min: 0 }),
    body('category_id').isInt({ min: 1 }),
    body('expense_date').isISO8601()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { amount, category_id, expense_date, notes } = req.body;

    db.run(`INSERT INTO expenses (amount, category_id, expense_date, notes, created_by) 
            VALUES (?, ?, ?, ?, ?)`,
            [amount, category_id, expense_date, notes, req.user.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ id: this.lastID, message: 'Expense added successfully' });
            });
});

// Update expense
app.put('/api/expenses/:id', authenticateToken, checkPermission('manageExpenses'), [
    body('amount').isFloat({ min: 0 }),
    body('category_id').isInt({ min: 1 }),
    body('expense_date').isISO8601()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { amount, category_id, expense_date, notes } = req.body;

    db.run(`UPDATE expenses SET amount = ?, category_id = ?, expense_date = ?, notes = ?, 
                               updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
            [amount, category_id, expense_date, notes, id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Expense not found' });
                }
                res.json({ message: 'Expense updated successfully' });
            });
});

// Delete expense
app.delete('/api/expenses/:id', authenticateToken, checkPermission('manageExpenses'), (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully' });
    });
});

// User management routes (admin only)
app.get('/api/users', authenticateToken, checkPermission('manageUsers'), (req, res) => {
    db.all('SELECT id, username, full_name, role, permissions, is_active, created_at FROM users ORDER BY created_at DESC', 
           (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        const usersWithParsedPermissions = users.map(user => ({
            ...user,
            permissions: JSON.parse(user.permissions || '{}')
        }));
        
        res.json(usersWithParsedPermissions);
    });
});

// Add user
app.post('/api/users', authenticateToken, checkPermission('manageUsers'), [
    body('username').notEmpty().trim().escape(),
    body('password').isLength({ min: 6 }),
    body('full_name').notEmpty().trim().escape(),
    body('role').isIn(['admin', 'user'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, full_name, role, permissions } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const permissionsJson = JSON.stringify(permissions || {});

    db.run(`INSERT INTO users (username, password, full_name, role, permissions) 
            VALUES (?, ?, ?, ?, ?)`,
            [username, hashedPassword, full_name, role, permissionsJson],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ id: this.lastID, message: 'User created successfully' });
            });
});

// Update user
app.put('/api/users/:id', authenticateToken, checkPermission('manageUsers'), [
    body('username').notEmpty().trim().escape(),
    body('full_name').notEmpty().trim().escape(),
    body('role').isIn(['admin', 'user'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { username, password, full_name, role, permissions, is_active } = req.body;
    const permissionsJson = JSON.stringify(permissions || {});

    let query = `UPDATE users SET username = ?, full_name = ?, role = ?, permissions = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP`;
    let params = [username, full_name, role, permissionsJson, is_active ? 1 : 0];

    if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        query += `, password = ?`;
        params.push(hashedPassword);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

// Delete user
app.delete('/api/users/:id', authenticateToken, checkPermission('manageUsers'), (req, res) => {
    const { id } = req.params;

    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Export PDF route (placeholder - will implement with puppeteer)
app.post('/api/export/pdf', authenticateToken, checkPermission('exportData'), (req, res) => {
    // This will be implemented with puppeteer for PDF generation
    res.json({ message: 'PDF export functionality will be implemented' });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'working-motel.html'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Offline mode - no network interfaces needed

// Start server (listen on all interfaces for hosting)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏨 Motel Management System`);
    console.log(`📱 Access your application at: http://localhost:${PORT}`);
    console.log(`💾 Database: ${path.resolve('./motel.db')}`);
    console.log(`📁 Files: ${__dirname}`);
    console.log(`🌐 Ready for online hosting`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});