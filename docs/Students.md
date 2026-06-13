# Students Endpoints

These routes allow managing student records, searching by keywords, and looking up user-specific parcel histories.

**Group Code Location**: [src/routes/students.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/routes/students.js)
**Dependencies**: None

---

## 1. List Students
`GET /api/students`

Retrieves a list of all registered student records sorted by name.

### Access Rule
* **Admin Only**

### Response Schema
#### Success (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "STUDENT_UUID",
      "name": "Alice Green",
      "email": "alice@example.com",
      "phone": "+15550199",
      "studentId": "SID88102",
      "createdAt": "2026-06-11T08:00:00.000Z"
    }
  ]
}
```

---

## 2. Search Students
`GET /api/students/search`

Filters student records based on search criteria.

### Access Rule
* **Admin Only**

### Request Parameters
* **Query Parameters**:
  * `q` (string, optional): String matching name, email, or student ID. Matches substrings. Limits results to 20.

---

## 3. Get Student Details
`GET /api/students/:id`

Retrieves a single student's registration details by ID.

### Access Rule
* **Authenticated (Owner or Admin)**: Students can only request their own profile.

---

## 4. Get Student Parcels
`GET /api/students/:id/parcels`

Fetches all historical and active parcels belonging to a specific student.

### Access Rule
* **Authenticated (Owner or Admin)**: Students can only request their own parcel list.

---

## 5. Remove Student Account
`DELETE /api/students/:id`

Removes the student record from the database and purges their notifications.

### Access Rule
* **Admin Only**
