# Motel Management System

A comprehensive multilingual guest and expense management system for motels and small hotels.

## Features

### 🏨 Guest Management
- Add, edit, and delete guest records
- Track guest information (name, ID/passport, room, stay duration, payment)
- Check-in and check-out management
- Search and filter guests by various criteria
- Room occupancy tracking

### 💰 Expense Tracking
- Add and categorize expenses
- Create custom expense categories
- Track expenses by date and category
- Calculate total expenses and net income

### 📊 Dashboard & Reports
- Real-time dashboard with key metrics
- Summary cards showing total guests, earnings, expenses, and net income
- Recent activity feed
- Date range filtering for reports
- Export reports as PDF

### 👥 User Management (Admin)
- Create and manage user accounts
- Role-based permissions (Admin/User)
- Assign specific permissions to users
- User activity tracking

### 🌐 Multilingual Support
- English, Arabic, and Kurdish languages
- RTL support for Arabic
- Easy language switching
- Localized date and currency formats

### 🎨 Modern UI/UX
- Neumorphic design system
- Responsive layout for all devices
- Dark/light theme support
- Intuitive navigation and interactions

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Puppeteer** - PDF generation

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with CSS variables
- **HTML5** - Semantic markup
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Clone or download the project**
   ```bash
   cd C:\Users\hp\Desktop\motel
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open your browser and go to: `http://localhost:3000`
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Default Settings
- **Default Language**: English
- **Default Currency**: USD
- **Database**: SQLite (motel.db)
- **Session Duration**: 24 hours

## Usage

### First Time Setup
1. Login with default admin credentials
2. Change the default password in Settings
3. Create additional user accounts if needed
4. Set up expense categories
5. Configure system preferences

### Adding Guests
1. Navigate to Guest Management
2. Click "Add New Guest"
3. Fill in guest information:
   - Full name
   - ID/Passport number (optional)
   - Room ID
   - Number of days staying
   - Amount paid
   - Check-in date
   - Notes (optional)

### Managing Expenses
1. Navigate to Expense Tracking
2. Create expense categories first (if needed)
3. Add expenses with:
   - Amount
   - Category
   - Date
   - Notes (optional)

### Generating Reports
1. Navigate to Reports
2. Select date range
3. Choose report type
4. Generate and export as PDF

### User Management (Admin Only)
1. Navigate to User Management
2. Create new users with specific permissions
3. Assign roles and permissions based on needs

## Permissions System

### Admin Role
- Full access to all features
- User management capabilities
- System settings access

### User Role
- View reports
- Add/edit guests
- Manage expenses
- Limited access based on assigned permissions

### Available Permissions
- `viewReports` - View dashboard and reports
- `addGuests` - Add new guests
- `editGuests` - Edit existing guests
- `deleteGuests` - Delete guests
- `manageExpenses` - Add/edit/delete expenses
- `manageCategories` - Manage expense categories
- `manageUsers` - User management (admin only)
- `exportData` - Export reports and data

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `GET /api/user` - Get current user info

### Guests
- `GET /api/guests` - Get guests list
- `POST /api/guests` - Create new guest
- `PUT /api/guests/:id` - Update guest
- `DELETE /api/guests/:id` - Delete guest

### Expenses
- `GET /api/expenses` - Get expenses list
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Categories
- `GET /api/expense-categories` - Get categories
- `POST /api/expense-categories` - Create category
- `PUT /api/expense-categories/:id` - Update category
- `DELETE /api/expense-categories/:id` - Delete category

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary

### Users (Admin only)
- `GET /api/users` - Get users list
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `password` - Hashed password
- `full_name` - User's full name
- `role` - User role (admin/user)
- `permissions` - JSON permissions object
- `is_active` - Account status
- `created_at` - Creation timestamp

### Guests Table
- `id` - Primary key
- `full_name` - Guest's full name
- `id_passport` - ID or passport number
- `room_id` - Room identifier
- `days_staying` - Number of days
- `amount_paid` - Payment amount
- `checkin_date` - Check-in date
- `checkout_date` - Check-out date
- `status` - Guest status
- `notes` - Additional notes
- `created_by` - User who created the record

### Expenses Table
- `id` - Primary key
- `amount` - Expense amount
- `category_id` - Foreign key to categories
- `expense_date` - Date of expense
- `notes` - Expense notes
- `created_by` - User who created the record

### Expense Categories Table
- `id` - Primary key
- `name_en` - English name
- `name_ar` - Arabic name
- `name_ku` - Kurdish name
- `description` - Category description
- `is_active` - Category status

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Built-in Express security
- **Rate Limiting**: API request rate limiting
- **Helmet.js**: Security headers

## Customization

### Adding New Languages
1. Add language configuration to `CONFIG.LANGUAGES` in `config.js`
2. Add translations to `TRANSLATIONS` object in `translations.js`
3. Update CSS for RTL support if needed

### Modifying Expense Categories
Default categories can be modified in the `server.js` file in the `createDefaultCategories()` function.

### Styling Customization
- Modify CSS variables in `variables.css`
- Update neumorphic styles in `neumorphism.css`
- Customize responsive breakpoints in `responsive.css`

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure SQLite database file has proper permissions
   - Check if the database file exists in the project root

2. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check if user credentials are correct
   - Clear browser localStorage if needed

3. **Permission Errors**
   - Ensure user has required permissions
   - Check user role and permission assignments

4. **Language Display Issues**
   - Verify font loading for Arabic/Kurdish text
   - Check RTL CSS styles are applied correctly

### Development Mode
Run with `npm run dev` to enable:
- Auto-restart on file changes
- Detailed error logging
- Debug mode features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Developed by**: Your Development Team