# TeamTracker - Performance Management System

A modern web application for tracking trainer performance with role-based access control, built with Vite, React, and Turso (SQLite).

## Features

### For Trainers
- **Task Logging**: Log daily tasks from a predefined list or custom tasks
- **KPI Tracking**: Real-time performance status (Underperforming/Normal/Overperforming)
- **Personal Dashboard**: View today's hours and recent activity
- **Private Data**: Only see your own tasks and performance

### For Admins
- **Team Overview**: See performance distribution across all trainers
- **User Management**: Add new trainers and reset passwords
- **Real-time Updates**: Data refreshes every 5 seconds
- **Performance Charts**: Visual representation of team KPIs

## Tech Stack

- **Frontend**: Vite + React
- **Database**: Turso (SQLite)
- **Styling**: Custom CSS with dark theme
- **Icons**: Lucide React
- **Routing**: React Router

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- A Turso database account ([turso.tech](https://turso.tech))

### 1. Create a Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to Turso
turso auth login

# Create a new database
turso db create teamtracker

# Get your database URL
turso db show teamtracker

# Create an auth token
turso db tokens create teamtracker
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in your Turso credentials:

```bash
VITE_TURSO_DATABASE_URL=libsql://your-database-url.turso.io
VITE_TURSO_AUTH_TOKEN=your_auth_token_here
```

### 3. Initialize the Database

```bash
# Create tables using Turso CLI
turso db shell teamtracker < db/schema.sql

# Seed initial data (admin + 12 trainers)
npm run db:seed
```

### 4. Install Dependencies and Run

```bash
# Install npm packages
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Default Credentials

All users have the same default password: **Welcome@JS2026**

### Admin Account
- **Username**: ADMIN_SONIA
- **Password**: Welcome@JS2026

### Trainer Accounts
Use their JS ID as username (e.g., JS18114, JS19328, etc.)

## User List

### Admin
- Sonia Dhiman (ADMIN_SONIA)

### Trainers
1. Mukul Batish (JS18114)
2. Kanwal Kishore (JS19328)
3. Prerna Chhibber (JS19222)
4. Shubham Arya (JS11090)
5. Nitin Kumar (JS18022)
6. Divya Srivastva (JS18679)
7. Anchal Chauhan (JS13945)
8. Gurpreet Kaur (JS19562)
9. Mahesh Pal (JS16945)
10. Manish Tanwar (JS18511)
11. Sarita Kumari (JS20921)
12. Yogyata Pendkalkar (JS20797)

## Task Types

Trainers can log the following task types:
- Shift Briefing
- Refresher Session
- Aligned in NHT Batch
- Call Audit
- Call Taking
- Dip Checks
- Creating PPT
- Updation in PPT
- Interviews
- Team Meeting
- Meeting - Other
- Aligned in Webinar
- Session in NHT Batch
- Online Training Session
- Online Induction Training
- Aligned in 72 Hours
- Branch Visit
- Others (requires custom task name)

## KPI Calculation

Performance is calculated based on daily hours:

- **< 7 hours**: 🔴 Underperforming
- **7 - 7.5 hours**: 🟡 Normal
- **> 7.5 hours**: 🟢 Overperforming

## Security Features

- Password hashing with bcrypt
- Role-based route protection
- Trainers cannot access admin pages via URL manipulation
- Session persistence with localStorage
- Data isolation (trainers see only their own data)

## Mobile Support

The application is fully responsive:
- Hamburger menu for sidebar on mobile
- Horizontal scrolling tables
- Touch-friendly button sizes (min 44px)
- Optimized layouts for small screens

## Deployment

To build for production:

```bash
npm run build
```

The built files will be in the `dist` folder. Deploy to any static hosting service (Vercel, Netlify, etc.).

**Important**: Make sure to set your environment variables in your hosting platform's dashboard.

## License

Private use only.
