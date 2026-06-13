# Parcels Endpoints

These routes facilitate parcel logging, locker assignment, OTP code retrieval, student pick-up verification, and cancellation.

**Group Code Location**: [src/routes/parcels.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/routes/parcels.js)
**Dependencies**: `crypto` (for generating UUIDs)

---

## 1. List Parcels
`GET /api/parcels`

Retrieves logged parcels.

### Access Rule
* **Authenticated (Owner or Admin)**:
  * **Admins** receive a full array of all system parcels.
  * **Students** receive only their own parcels.

### Request Parameters
* **Headers**:
  * `Authorization: Bearer <token>`

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "UUID_STRING",
      "trackingId": "PKG-2026-89104",
      "studentId": "STUDENT_UUID",
      "studentName": "Bob Johnson",
      "description": "Amazon brown box",
      "deliveryService": "UPS",
      "lockerId": "LOCKER_UUID",
      "lockerLabel": "A-12",
      "otp": "381048",
      "status": "ready",
      "arrivedAt": "2026-06-11T08:00:00.000Z",
      "assignedAt": "2026-06-11T08:15:00.000Z",
      "collectedAt": null,
      "expiresAt": "2026-06-16T08:15:00.000Z"
    }
  ]
}
```

---

## 2. Get Parcel Details
`GET /api/parcels/:id`

Retrieves a single parcel by ID.

### Access Rule
* **Authenticated (Owner or Admin)**: Students cannot fetch details for another student's parcel.

### Request Parameters
* **Path Parameters**:
  * `id` (string, required): Parcel UUID.

### Response Schema
#### Success (200 OK)
* Returns the matching parcel object in the `data` field (same schema as above).

#### Errors
* **403 Forbidden**: Token belongs to a student but the parcel is assigned to a different student ID.
* **404 Not Found**: Parcel record not found.

---

## 3. Create (Log) Parcel
`POST /api/parcels`

Registers a new incoming parcel (status initialized as `'pending'`).

### Access Rule
* **Admin Only**

### Request Parameters
* **Body** (JSON):
  * `studentId` (string, required): UUID of the student recipient.
  * `description` (string, required): Brief label/description (e.g. "Bubble mailer").
  * `deliveryService` (string, required): Carrier name (e.g. "FedEx").
  * `trackingId` (string, optional): Tracking number. Auto-generated if not provided.

### Response Schema
#### Success (210 Created)
* Returns the initialized parcel object with `"status": "pending"`.

---

## 4. Assign Locker
`PATCH /api/parcels/:id/assign-locker`

Assigns an empty locker to a pending parcel, sets status to `'ready'`, generates a 6-digit OTP code, and triggers an automated notification.

### Access Rule
* **Admin Only**

### Request Parameters
* **Path Parameters**:
  * `id` (string, required): Parcel UUID.
* **Body** (JSON):
  * `lockerId` (string, required): UUID of the target locker.

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "otp": "481029",
  "data": {
    "id": "PARCEL_UUID",
    "status": "ready",
    "lockerId": "LOCKER_UUID",
    "lockerLabel": "B-04",
    "otp": "481029",
    "assignedAt": "ISO_TIMESTAMP",
    "expiresAt": "ISO_TIMESTAMP"
  }
}
```

#### Errors
* **409 Conflict**: Locker is already occupied by another parcel.

---

## 5. Collect Parcel
`PATCH /api/parcels/:id/collect`

Validates student-provided OTP code, releases the associated locker, and marks the parcel status as `'collected'`.

### Access Rule
* **Authenticated (Owner or Admin)**

### Request Parameters
* **Body** (JSON):
  * `otp` (string, required): The 6-digit OTP code.

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "PARCEL_UUID",
    "status": "collected",
    "collectedAt": "ISO_TIMESTAMP"
  }
}
```

#### Errors
* **400 Bad Request**: Missing OTP or OTP does not match the parcel's stored value.

---

## 6. Release (Expire) Parcel
`PATCH /api/parcels/:id/release`

Marks a parcel as `'expired'`, clears its OTP, and frees the occupied locker.

### Access Rule
* **Admin Only**

---

## 7. Delete Parcel
`DELETE /api/parcels/:id`

Permanently deletes a parcel record. Automatically resets locker state to unoccupied if the deleted parcel was currently assigned to it.

### Access Rule
* **Admin Only**
