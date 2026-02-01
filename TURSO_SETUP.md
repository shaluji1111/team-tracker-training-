# Turso Database Setup Guide

This guide will help you set up your Turso database for the TeamTracker application.

## Step 1: Install Turso CLI

### On Windows (PowerShell)
```powershell
irm https://get.tur.so/install.ps1 | iex
```

### On macOS/Linux
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

## Step 2: Create and Configure Database

```bash
# Login to Turso
turso auth login

# Create a new database named 'teamtracker'
turso db create teamtracker

# Get your database URL (copy this!)
turso db show teamtracker

# Create an authentication token (copy this too!)
turso db tokens create teamtracker
```

## Step 3: Initialize Database Schema

```bash
# Navigate to your project directory
cd "C:\Users\sahil\Desktop\New folder\teamtracker"

# Create the tables using the schema file
turso db shell teamtracker < db/schema.sql
```

## Step 4: Configure Environment Variables

Edit the `.env` file in your project root and add your credentials:

```
VITE_TURSO_DATABASE_URL=libsql://teamtracker-[your-name].turso.io
VITE_TURSO_AUTH_TOKEN=eyJhbGc... (your token here)
```

## Step 5: Seed Initial Data

```bash
# This will create the admin account and all 12 trainers
npm run db:seed
```

## Step 6: Start the Application

```bash
npm run dev
```

Visit `http://localhost:5173` and login with:
- **Admin**: ADMIN_SONIA / Welcome@JS2026
- **Trainer**: JS18114 (or any other JS ID) / Welcome@JS2026

## Troubleshooting

### Error: "Failed to connect to database"
- Check that your `VITE_TURSO_DATABASE_URL` is correct
- Ensure your auth token is valid

### Error: "Table already exists"
- The schema has already been applied, you can skip this step

### Cannot run seed script
- Make sure you're in the project directory
- Verify that the `.env` file contains your Turso credentials
