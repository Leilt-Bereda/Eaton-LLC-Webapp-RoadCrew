# Database Connection Guide

This document explains how the Eaton LLC backend connects to its database and the key concepts involved.

---

## Table of Contents

1. [Key Concepts](#key-concepts)
2. [Architecture Overview](#architecture-overview)
3. [What is Django?](#what-is-django)
4. [What is PostgreSQL?](#what-is-postgresql)
5. [What is Supabase?](#what-is-supabase)
6. [What Does "Connecting to a Database" Mean?](#what-does-connecting-to-a-database-mean)
7. [Connection Setup Steps](#connection-setup-steps)
8. [Troubleshooting](#troubleshooting)

---

## Key Concepts

| Term | Definition |
|------|------------|
| **Django** | A Python web framework that runs the backend server and handles API requests |
| **PostgreSQL** | A database system that stores all application data (users, jobs, drivers, etc.) |
| **Supabase** | A cloud service that hosts our PostgreSQL database |
| **API Endpoint** | A URL that the mobile app calls to get or send data |
| **Connection String** | The address and credentials needed to connect to the database |

---

## Architecture Overview

```
┌─────────────────────┐
│  Mobile App         │
│  (React Native)     │
└─────────┬───────────┘
          │ HTTP Requests (GET, POST, etc.)
          ▼
┌─────────────────────┐
│  Django Backend     │
│  (Python server)    │
│  localhost:8000     │
└─────────┬───────────┘
          │ SQL Queries
          ▼
┌─────────────────────┐
│  PostgreSQL DB      │
│  (hosted on         │
│   Supabase)         │
└─────────────────────┘
```

**How data flows:**
1. Mobile app makes a request: "Give me all jobs"
2. Django receives the request at `/api/jobs/`
3. Django queries the database: `SELECT * FROM jobs`
4. Database returns the data
5. Django sends JSON response back to the app

---

## What is Django?

Django is a **Python web framework** - it's the code that powers our backend server.

**What Django does:**
- **Handles API requests** - When the mobile app asks for data, Django processes the request
- **Implements business logic** - Rules like "only admins can delete users"
- **Communicates with the database** - Translates Python code into SQL queries
- **Returns responses** - Sends data back to the app in JSON format

**Key files:**
- `views.py` - Contains the logic for each API endpoint
- `models.py` - Defines the database tables (User, Job, Driver, etc.)
- `urls.py` - Maps URLs to their corresponding views
- `settings.py` - Configuration including database connection

**Starting Django:**
```powershell
cd backend
venv\Scripts\Activate
python manage.py runserver
```

---

## What is PostgreSQL?

PostgreSQL is a **relational database** - think of it as a collection of spreadsheets (tables) that store all your application data.

**Example tables in our database:**
| Table | What it stores |
|-------|----------------|
| `auth_user` | User accounts (username, password, email) |
| `myapp_job` | Job assignments |
| `myapp_driver` | Driver information |
| `myapp_truck` | Truck details |
| `myapp_address` | Pickup/delivery addresses |

**How data is organized:**
```
Database: postgres
├── Table: auth_user
│   ├── id: 1, username: "admin", email: "admin@eaton.com"
│   └── id: 2, username: "driver1", email: "driver@eaton.com"
├── Table: myapp_job
│   ├── id: 1, status: "pending", driver_id: 2
│   └── id: 2, status: "completed", driver_id: 2
└── Table: myapp_driver
    └── id: 2, name: "John Smith", license: "ABC123"
```

---

## What is Supabase?

Supabase is a **cloud hosting service** for PostgreSQL databases.

**What Supabase provides:**
1. **Database hosting** - Your PostgreSQL database lives on their servers
2. **Web dashboard** - A visual interface to view and edit data (like pgAdmin, but built-in)
3. **Connection URLs** - Addresses so your apps can connect to the database
4. **Always online** - Your database is accessible 24/7 from anywhere

**Supabase vs pgAdmin:**
| | Supabase | pgAdmin |
|---|----------|---------|
| **Purpose** | Hosts the database | Views/manages databases |
| **Stores data?** | Yes | No (just connects) |
| **Analogy** | The TV itself | A remote control |

**Accessing Supabase:**
1. Go to [supabase.com](https://supabase.com)
2. Log in with team credentials
3. Select the Eaton Trucking project
4. Use **Table Editor** to view/edit data manually

---

## What Does "Connecting to a Database" Mean?

For Django to read/write data, it needs to establish a connection to the database. This requires:

1. **Finding the server** - Using a hostname (like `aws-1-us-east-2.pooler.supabase.com`)
2. **Authenticating** - Providing username and password
3. **Specifying the database** - Which database to use (e.g., `postgres`)

**The connection string format:**
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Our connection string:**
```
postgresql://postgres.vuxnldizppdpaizixthf:Eatonuser25!25@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

**Broken down:**
| Part | Value | Meaning |
|------|-------|---------|
| Username | `postgres.vuxnldizppdpaizixthf` | Database user (includes project ID for pooler) |
| Password | `Eatonuser25!25` | Authentication password |
| Host | `aws-1-us-east-2.pooler.supabase.com` | Server address (connection pooler) |
| Port | `6543` | Network port for pooler connections |
| Database | `postgres` | Database name |

---

## Connection Setup Steps

### Prerequisites
- Python 3.11 or 3.12 installed
- Access to Supabase dashboard

### Step 1: Set Up Virtual Environment

```powershell
cd backend
py -3.12 -m venv venv
venv\Scripts\Activate
```

### Step 2: Install Dependencies

```powershell
pip install Django djangorestframework djangorestframework-simplejwt python-dotenv dj-database-url django-cors-headers psycopg2-binary
```

### Step 3: Configure Environment Variables

Create `.env` file in the project root (`Eaton-LLC-Webapp-/.env`):

```
POSTGRES_DB=postgres
POSTGRES_USER=postgres.vuxnldizppdpaizixthf
POSTGRES_PASSWORD="Eatonuser25!25"
POSTGRES_HOST=aws-1-us-east-2.pooler.supabase.com
POSTGRES_PORT=6543

DATABASE_URL=postgresql://postgres.vuxnldizppdpaizixthf:Eatonuser25!25@aws-1-us-east-2.pooler.supabase.com:6543/postgres
```

### Step 4: Test the Connection

```powershell
python manage.py check
```

Expected output:
```
System check identified no issues (0 silenced).
```

### Step 5: Run Migrations

```powershell
python manage.py migrate
```

Expected output:
```
No migrations to apply.
```

### Step 6: Start the Server

```powershell
python manage.py runserver
```

The API will be available at `http://localhost:8000`

---

## Troubleshooting

### "could not translate host name" Error

**Cause:** DNS cannot resolve the database hostname, often due to IPv6 issues.

**Solution:** Use the connection pooler instead of direct connection:
- Direct: `db.vuxnldizppdpaizixthf.supabase.co` (may have IPv6 issues)
- Pooler: `aws-1-us-east-2.pooler.supabase.com` (better IPv4 support)

### "password authentication failed" Error

**Cause:** Incorrect password in `.env` file.

**Solution:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Reset the database password
3. Update `.env` with the new password

### "No module named 'django'" Error

**Cause:** Virtual environment not activated.

**Solution:**
```powershell
venv\Scripts\Activate
pip install -r requirements.txt
```

### CheckConstraint Error

**Cause:** Django version incompatibility.

**Solution:** In `models.py`, change `check=` to `condition=` for CheckConstraint:
```python
# Old (Django 4.x)
models.CheckConstraint(check=models.Q(...), name='...')

# New (Django 5.x+)
models.CheckConstraint(condition=models.Q(...), name='...')
```

### ArrayField Error

**Cause:** Missing PostgreSQL extension in Django settings.

**Solution:** Add `'django.contrib.postgres'` to `INSTALLED_APPS` in `settings.py`.

---

## Quick Reference

**Start the backend:**
```powershell
cd backend
venv\Scripts\Activate
python manage.py runserver
```

**Test database connection:**
```powershell
python manage.py check
python manage.py migrate
```

**View database in Supabase:**
1. Go to supabase.com → Dashboard
2. Select project → Table Editor

**API base URL:** `http://localhost:8000/api/`
