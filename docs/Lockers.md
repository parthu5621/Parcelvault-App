# Lockers Endpoints

These routes display locker configuration, check vacant lockers by size, retrieve specific locker records, and supply summary utilization analytics.

**Group Code Location**: [src/routes/lockers.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/routes/lockers.js)
**Dependencies**: None

---

## 1. List Lockers
`GET /api/lockers`

Fetches all lockers ordered by section and label.

### Access Rule
* **Authenticated (Any)**

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "LOCKER_UUID",
      "label": "A-01",
      "section": "A",
      "size": "small | medium | large",
      "isOccupied": false,
      "currentParcelId": null
    }
  ]
}
```

---

## 2. Get Available Lockers
`GET /api/lockers/available`

Fetches unoccupied lockers, optionally filtered by size.

### Access Rule
* **Authenticated (Any)**

### Request Parameters
* **Query Parameters**:
  * `size` (string, optional): Filter by locker size (`'small'`, `'medium'`, or `'large'`).

---

## 3. Get Locker Details
`GET /api/lockers/:id`

Retrieves a single locker by ID.

### Access Rule
* **Authenticated (Any)**

---

## 4. Locker Statistics Summary
`GET /api/lockers/stats/summary`

Returns locker usage statistics (occupied counts, total counts, rates) grouped by section and size.

### Access Rule
* **Admin Only**

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": {
    "total": 30,
    "occupied": 12,
    "available": 18,
    "occupancyRate": 40,
    "bySection": [
      {
        "section": "A",
        "total": 15,
        "occupied": 7,
        "available": 8
      }
    ],
    "bySize": [
      {
        "size": "medium",
        "total": 10,
        "occupied": 4
      }
    ]
  }
}
```
