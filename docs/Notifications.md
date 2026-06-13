# Notifications Endpoints

These routes control pickup alerts and status messages dispatched to students.

**Group Code Location**: [src/routes/notifications.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/routes/notifications.js)
**Dependencies**: None

---

## 1. List Notifications
`GET /api/notifications`

Lists recent notifications.

### Access Rule
* **Authenticated (Any)**:
  * **Admins** retrieve the 100 most recent notifications globally.
  * **Students** retrieve all notifications directed to their account ID.

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "NOTIF_UUID",
      "studentId": "STUDENT_UUID",
      "title": "Parcel Ready for Pickup",
      "message": "Your parcel PKG-2026-89104 has been assigned to Locker A-12. Use OTP 381048 to collect it.",
      "type": "alert | system",
      "isRead": false,
      "createdAt": "2026-06-11T08:15:00.000Z"
    }
  ]
}
```

---

## 2. Get Unread Count
`GET /api/notifications/unread-count`

Fetches unread count (globally for admins; user-specific for students).

### Access Rule
* **Authenticated (Any)**

---

## 3. Mark Single Notification Read
`PATCH /api/notifications/:id/read`

Updates the `isRead` flag of a specific notification to `true`.

### Access Rule
* **Authenticated (Owner or Admin)**: Students cannot mark another student's notification as read.

---

## 4. Mark All Read
`PATCH /api/notifications/read-all`

Marks all notifications as read (globally for admins; user-specific for students).

### Access Rule
* **Authenticated (Any)**

---

## 5. Delete Notification
`DELETE /api/notifications/:id`

Deletes a notification record.

### Access Rule
* **Authenticated (Owner or Admin)**
