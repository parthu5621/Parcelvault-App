# Dashboard Endpoints

These routes supply summary aggregations for chart visualisations and metrics cards.

**Group Code Location**: [src/routes/dashboard.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/routes/dashboard.js)
**Dependencies**: None

---

## 1. Get Admin Overview Stats
`GET /api/dashboard/stats`

Assembles parcel status numbers, locker occupancy percentages, registration metrics, and recent activity logs for admin landing views.

### Access Rule
* **Admin Only**

### Request Parameters
* **Headers**:
  * `Authorization: Bearer <token>`

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": {
    "parcels": {
      "total": 120,
      "pending": 4,
      "ready": 18,
      "collectedToday": 8,
      "expired": 2
    },
    "lockers": {
      "total": 30,
      "occupied": 18,
      "available": 12,
      "occupancyRate": 60
    },
    "students": {
      "total": 85
    },
    "recentActivity": [
      {
        "date": "2026-06-11",
        "count": 12
      }
    ],
    "statusBreakdown": [
      {
        "status": "ready",
        "count": 18
      }
    ]
  }
}
```

---

## 2. Get Student Personal Stats
`GET /api/dashboard/student-stats`

Generates counts of parcels categorized by status, unread alert count, and lists up to the 5 most recent parcels for the logged-in student.

### Access Rule
* **Authenticated (Student)**

### Request Parameters
* **Headers**:
  * `Authorization: Bearer <token>`

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": {
    "total": 5,
    "pending": 0,
    "ready": 1,
    "collected": 4,
    "unreadNotifications": 2,
    "recentParcels": [
      {
        "id": "PARCEL_UUID",
        "trackingId": "PKG-2026-38491",
        "description": "Textbook parcel",
        "status": "ready",
        "arrivedAt": "2026-06-11T09:00:00.000Z",
        "lockerLabel": "A-04"
      }
    ]
  }
}
```
