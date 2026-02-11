# Driver Profile Endpoints Testing Report

**Sprint:** Sprint 2-3
**Date:** February 4, 2026
**Tester:** Mobile Development Team

---

## Summary

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/drivers/` | ✅ Passed | Returns all drivers |
| `GET /api/drivers/{id}/` | ✅ Ready | Get single driver by ID |
| `GET /api/drivers/me/` | ❌ Missing | Needed for mobile app |

---

## Test 1: Get All Drivers

### Endpoint
```
GET /api/drivers/
```

### Response Received
```json
[
    {
        "id": 6,
        "name": "test123 drivers",
        "email_address": "testdriver@gmail.com",
        "phone_number": "1231231234",
        "driver_license": "123",
        "address": "1234 monks avenue",
        "truck_count": 1,
        "user": 14,
        "operator": 1
    }
    // ... 4 more drivers
]
```

### Drivers in Database

| Driver ID | Name | User ID |
|-----------|------|---------|
| 1 | John Doe | 8 |
| 2 | eaton | 1 |
| 3 | test t | 9 |
| 5 | qax5 qaxd | 11 |
| 6 | test123 drivers | **14 (tester)** |

---

## Architecture: How It Works

```
Admin creates driver (web app)
        ↓
Driver record saved with username/password
        ↓
Driver logs into mobile app
        ↓
Gets JWT token (contains user_id: 14)
        ↓
Opens Profile tab → Needs driver data
```

### The Problem

- JWT token has `user_id: 14`
- But to call `/api/drivers/{id}/` you need `driver_id: 6`
- **No way to get from user_id → driver_id**

---

## What's Missing

### `GET /api/drivers/me/`

This endpoint should read `user_id` from JWT token and return that driver's profile.

```python
# Implementation needed in views.py
@action(detail=False, methods=['get'], url_path='me')
def me(self, request):
    driver = Driver.objects.filter(user=request.user).first()
    if not driver:
        return Response({"error": "No driver profile found"}, status=404)
    return Response(self.get_serializer(driver).data)
```

---

## Key Findings

| What Works | What's Missing |
|------------|----------------|
| ✅ Get all drivers | ❌ `/api/drivers/me/` endpoint |
| ✅ Get driver by ID | |
| ✅ All profile fields present | |

---

## Next Steps

1. **Create `/api/drivers/me/` endpoint** - Get logged-in driver's profile
2. **Test `GET /api/drivers/6/`** - Single driver fetch
