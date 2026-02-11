# API Endpoints Guide

This document provides a complete overview of all existing API endpoints, their purposes, and which ones are relevant for the Driver Partner Mobile App.

---

## Table of Contents

1. [All Existing Endpoints](#all-existing-endpoints)
2. [Endpoints Reusable for Mobile App](#endpoints-reusable-for-mobile-app)
3. [New Endpoints to Build](#new-endpoints-to-build)
4. [Testing Priority](#testing-priority)

---

## All Existing Endpoints

### Where Endpoints Are Defined

| File | Purpose |
|------|---------|
| `backend/myapp/urls.py` | URL routing - maps URLs to views |
| `backend/myapp/views.py` | Business logic - handles requests and returns responses |
| `backend/myapp/serializers.py` | Data transformation - converts models to/from JSON |
| `backend/myapp/models.py` | Database models - defines table structures |

---

### Authentication Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| POST | `/api/register/` | `views.py:109` | Create new user account |
| POST | `/api/login/` | `views.py:118` | Login and get JWT tokens |
| POST | `/api/token/refresh/` | `views.py:121` | Refresh expired access token |
| POST | `/api/token/verify/` | `urls.py:39` | Verify if token is valid |
| GET | `/api/protected/` | `views.py:125` | Test endpoint to verify auth works |

### Password Reset Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| POST | `/api/auth/password-reset/` | `views.py:353` | Request OTP code via email |
| POST | `/api/auth/password-reset/verify/` | `views.py:367` | Verify OTP code is valid |
| POST | `/api/auth/password-reset/confirm/` | `views.py:379` | Reset password with OTP code |

### Job Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/jobs/` | `views.py:39` | List all jobs (with filters: date, customer_id, q) |
| POST | `/api/jobs/` | `views.py:39` | Create new job |
| GET | `/api/jobs/{id}/` | `views.py:39` | Get single job details |
| PUT | `/api/jobs/{id}/` | `views.py:39` | Update job |
| DELETE | `/api/jobs/{id}/` | `views.py:39` | Delete job |

**Query Parameters:**
- `?date=YYYY-MM-DD` - Filter by job date
- `?customer_id=123` - Filter by customer
- `?q=searchterm` - Search job number or project name

### Job-Driver Assignment Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/job-driver-assignments/` | `views.py:62` | List all job-driver assignments |
| POST | `/api/job-driver-assignments/` | `views.py:62` | Assign driver to job |
| GET | `/api/job-driver-assignments/{id}/` | `views.py:62` | Get assignment details |
| PUT | `/api/job-driver-assignments/{id}/` | `views.py:62` | Update assignment |
| DELETE | `/api/job-driver-assignments/{id}/` | `views.py:62` | Remove assignment |

### Driver Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/drivers/` | `views.py:80` | List all drivers |
| POST | `/api/drivers/` | `views.py:80` | Create driver |
| GET | `/api/drivers/{id}/` | `views.py:80` | Get driver details |
| PUT | `/api/drivers/{id}/` | `views.py:80` | Update driver |
| DELETE | `/api/drivers/{id}/` | `views.py:80` | Delete driver |

### Truck Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/trucks/` | `views.py:84` | List all trucks |
| POST | `/api/trucks/` | `views.py:84` | Create truck |
| GET | `/api/trucks/{id}/` | `views.py:84` | Get truck details |
| PUT | `/api/trucks/{id}/` | `views.py:84` | Update truck |
| DELETE | `/api/trucks/{id}/` | `views.py:84` | Delete truck |
| GET | `/api/unassigned-trucks/` | `views.py:160` | Get trucks not assigned to any driver |

### Driver-Truck Assignment Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/driver-truck-assignments/` | `views.py:104` | List driver-truck assignments |
| POST | `/api/driver-truck-assignments/` | `views.py:104` | Create assignment |
| POST | `/api/assign-truck/` | `views.py:130` | Assign truck to driver (alternate) |

### Address Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/addresses/` | `views.py:35` | List all addresses |
| POST | `/api/addresses/` | `views.py:35` | Create address |
| GET | `/api/addresses/{id}/` | `views.py:35` | Get address details |
| PUT | `/api/addresses/{id}/` | `views.py:35` | Update address |
| DELETE | `/api/addresses/{id}/` | `views.py:35` | Delete address |

### Customer Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/customers/` | `views.py:70` | List all customers (with search: ?q=) |
| POST | `/api/customers/` | `views.py:70` | Create customer |
| GET | `/api/customers/{id}/` | `views.py:70` | Get customer details |
| PUT | `/api/customers/{id}/` | `views.py:70` | Update customer |
| DELETE | `/api/customers/{id}/` | `views.py:70` | Delete customer |

### User & Role Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/users/` | `views.py:92` | List all users |
| GET | `/api/users/{id}/` | `views.py:92` | Get user details |
| GET | `/api/roles/` | `views.py:88` | List all roles |
| GET | `/api/userroles/` | `views.py:96` | List user-role mappings |

### Pay Report Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/pay-reports/` | `views.py:211` | List pay reports (filters: driver_id, start, end) |
| POST | `/api/pay-reports/` | `views.py:211` | Create pay report |
| POST | `/api/pay-reports/generate/` | `views.py:241` | Auto-generate pay report for driver/week |
| GET | `/api/pay-report-lines/` | `views.py:323` | List pay report line items |

### Other Endpoints

| Method | Endpoint | Defined In | Description |
|--------|----------|------------|-------------|
| GET | `/api/operators/` | `views.py:114` | List operators |
| GET | `/api/comments/` | `views.py:100` | List comments |

---

## Endpoints Reusable for Mobile App

Based on the timeline and deliverables, these existing endpoints can be **directly reused** for the Driver Partner Mobile App:

### Priority 1: Authentication (Sprint 2)

| Endpoint | Mobile Use Case | Status |
|----------|-----------------|--------|
| `POST /api/login/` | Driver login | ✅ Ready to use |
| `POST /api/token/refresh/` | Refresh expired tokens | ✅ Ready to use |
| `POST /api/token/verify/` | Verify token validity | ✅ Ready to use |
| `POST /api/auth/password-reset/` | Request password reset OTP | ✅ Ready to use |
| `POST /api/auth/password-reset/verify/` | Verify OTP code | ✅ Ready to use |
| `POST /api/auth/password-reset/confirm/` | Set new password | ✅ Ready to use |

### Priority 2: Job Views (Sprint 3)

| Endpoint | Mobile Use Case | Status |
|----------|-----------------|--------|
| `GET /api/job-driver-assignments/` | "My Jobs" list | ⚠️ Needs driver filter |
| `GET /api/jobs/{id}/` | Job detail screen | ✅ Ready to use |
| `GET /api/jobs/?date=YYYY-MM-DD` | Daily schedule view | ✅ Ready to use |
| `GET /api/addresses/{id}/` | Job location details | ✅ Ready to use |
| `GET /api/customers/{id}/` | Customer info on job | ✅ Ready to use |

### Priority 3: Driver Profile (Sprint 2-3)

| Endpoint | Mobile Use Case | Status |
|----------|-----------------|--------|
| `GET /api/drivers/{id}/` | View driver profile | ✅ Ready to use |
| `GET /api/driver-truck-assignments/` | See assigned truck | ⚠️ Needs driver filter |

---

## New Endpoints to Build

Based on the timeline, these **new endpoints** need to be created:

### Sprint 3: Job Views Enhancement

```
GET /api/job-driver-assignments/my-jobs/
```
**Purpose:** Get jobs assigned to the currently logged-in driver only
**Why needed:** Current endpoint returns ALL assignments; mobile needs driver-specific filtering
**Request:** Header with JWT token
**Response:**
```json
[
  {
    "id": 1,
    "job": { "id": 5, "job_number": "JOB-001", "project": "Highway Project", ... },
    "driver_truck": { "driver": {...}, "truck": {...} },
    "assigned_at": "2025-02-01T08:00:00Z"
  }
]
```

---

### Sprint 4: Job Status Updates

```
PATCH /api/job-driver-assignments/{id}/status/
```
**Purpose:** Allow driver to update job status (arrived, in-progress, completed)
**Why needed:** Drivers need to update their progress from mobile
**Request:**
```json
{
  "status": "in_progress"
}
```
**Response:**
```json
{
  "id": 1,
  "status": "in_progress",
  "status_updated_at": "2025-02-01T10:30:00Z"
}
```

---

### Sprint 4: Report Issue

```
POST /api/issues/
```
**Purpose:** Allow drivers to report problems with jobs
**Why needed:** New functionality for mobile app
**Request:**
```json
{
  "job_id": 5,
  "issue_type": "delay",
  "description": "Traffic accident blocking route",
  "photo_url": "https://..."
}
```

---

### Sprint 4: Push Notifications

```
POST /api/devices/register/
```
**Purpose:** Register device for push notifications
**Why needed:** Store FCM/APNs tokens for each driver's device
**Request:**
```json
{
  "device_token": "fcm_token_here",
  "platform": "android"
}
```

```
GET /api/notifications/
```
**Purpose:** Get in-app notification history
**Request:** Header with JWT token
**Response:**
```json
[
  {
    "id": 1,
    "title": "New Job Assigned",
    "message": "You have been assigned to JOB-001",
    "read": false,
    "created_at": "2025-02-01T08:00:00Z"
  }
]
```

---

### Sprint 5: Driver Profile Update

```
PATCH /api/drivers/me/
```
**Purpose:** Allow driver to update their own profile
**Why needed:** Drivers may need to update contact info from mobile
**Request:**
```json
{
  "phone": "555-123-4567",
  "emergency_contact": "Jane Doe"
}
```

---

## Testing Priority

### Phase 1: Test Now (Sprint 1-2)
Test these endpoints first since authentication is foundational:

1. `POST /api/login/` - Can drivers log in?
2. `POST /api/token/refresh/` - Do tokens refresh correctly?
3. `POST /api/auth/password-reset/` - Does OTP email send?
4. `POST /api/auth/password-reset/verify/` - Can OTP be verified?
5. `POST /api/auth/password-reset/confirm/` - Does password reset work?

### Phase 2: Test Next (Sprint 3)
Test job-related endpoints:

6. `GET /api/job-driver-assignments/` - Returns assignments?
7. `GET /api/jobs/{id}/` - Returns job details?
8. `GET /api/drivers/{id}/` - Returns driver info?
9. `GET /api/addresses/{id}/` - Returns location info?

### Phase 3: Build & Test (Sprint 4-5)
Build new endpoints and test:

10. `GET /api/job-driver-assignments/my-jobs/` - (new)
11. `PATCH /api/job-driver-assignments/{id}/status/` - (new)
12. `POST /api/issues/` - (new)
13. `POST /api/devices/register/` - (new)

---

## Quick Reference: Mobile App Endpoints

| Screen | Endpoints Used |
|--------|----------------|
| **Login** | `POST /api/login/` |
| **Forgot Password** | `POST /api/auth/password-reset/`, `/verify/`, `/confirm/` |
| **My Jobs List** | `GET /api/job-driver-assignments/my-jobs/` (new) |
| **Job Detail** | `GET /api/jobs/{id}/`, `GET /api/addresses/{id}/` |
| **Update Job Status** | `PATCH /api/job-driver-assignments/{id}/status/` (new) |
| **Report Issue** | `POST /api/issues/` (new) |
| **Profile** | `GET /api/drivers/{id}/`, `PATCH /api/drivers/me/` (new) |
| **Notifications** | `GET /api/notifications/` (new) |

---

## Base URL

- **Local Development:** `http://localhost:8000/api/`
- **Production:** TBD (will be configured during deployment)

All endpoints require the `/api/` prefix.
