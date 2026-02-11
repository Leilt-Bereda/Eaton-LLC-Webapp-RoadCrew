# Authentication Endpoints Testing Report

**Sprint:** Sprint 2 - Project Setup & Authentication
**Date:** February 4, 2026

---

## Summary

| Endpoint | Status |
|----------|--------|
| `POST /api/login/` | ✅ Passed |
| `POST /api/token/refresh/` | ✅ Passed |
| `POST /api/token/verify/` | ✅ Passed |
| `POST /api/auth/password-reset/` | ⚠️ Blocked (needs SMTP2GO) |
| `POST /api/auth/password-reset/verify/` | ⚠️ Blocked |
| `POST /api/auth/password-reset/confirm/` | ⚠️ Blocked |

---

## Key Concepts

### JWT Token Settings (from `backend/backend_project/settings.py` → Line 170)

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),     # Expires after 1 day
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Expires after 7 days
    'ROTATE_REFRESH_TOKENS': True,                   # New refresh token on each refresh
    'BLACKLIST_AFTER_ROTATION': True,                # Old refresh token can't be reused
    'ALGORITHM': 'HS256',
}
```

| Setting | Value | What It Means |
|---------|-------|---------------|
| Access Token Lifetime | **1 day** | Driver must refresh token daily |
| Refresh Token Lifetime | **7 days** | Driver must re-login after 7 days of inactivity |
| Rotate Refresh Tokens | **True** | Each refresh gives a new refresh token too |
| Blacklist After Rotation | **True** | Old refresh tokens are invalidated |

### SMTP2GO

An email delivery service used to send password reset OTP codes. Currently not configured - needs credentials in `.env`.

---

## Test Results

### 1. Login - `POST /api/login/`
**Request:**
```json
{ "username": "tester", "password": "test123" }
```
**Response (200 OK):**
```json
{
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{ "detail": "No active account found with the given credentials" }
```

**Edge cases tested:**
- Wrong password → ✅ 401 error
- Non-existent user → ✅ 401 error

---

### 2. Token Refresh - `POST /api/token/refresh/`
**Request:**
```json
{ "refresh": "<refresh_token_from_login>" }
```
**Response (200 OK):**
```json
{
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{ "detail": "Token is invalid or expired", "code": "token_not_valid" }
```

---

### 3. Token Verify - `POST /api/token/verify/`
**Request:**
```json
{ "token": "<access_token>" }
```
**Response (200 OK):**
```json
{}
```
Empty body with 200 status means the token is valid.

**Error Response (401):**
```json
{ "detail": "Token is invalid or expired", "code": "token_not_valid" }
```

**Edge cases tested:**
- Invalid token → ✅ 401 error
- Empty token → ✅ 400 error

---

### 4. Password Reset - `POST /api/auth/password-reset/`
**Request:**
```json
{ "email": "testdriver@gmail.com" }
```
**Expected Response (200 OK):**
```json
{ "message": "OTP sent to your email" }
```
**Actual Response:** ⚠️ Blocked - SMTP2GO credentials not configured
```json
{ "error": "Failed to send email. Please try again later." }
```

Needs these in `.env`:
```
SMTP_USERNAME=<smtp2go_username>
SMTP_PASSWORD=<smtp2go_password>
```

---

## What's Missing

| Item | Status |
|------|--------|
| SMTP2GO credentials | Needed to test password reset flow |
| Password reset verify/confirm | Blocked until email works |

---

## Test Credentials

```
Username: tester
Password: test123
Driver Name: test123 drivers
```
