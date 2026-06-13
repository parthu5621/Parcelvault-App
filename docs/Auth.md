# Authentication Endpoints

These routes handle credentials, user signup, session verification, and token generation.

**Group Code Location**: [src/routes/auth.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/routes/auth.js)
**Dependencies**: `jsonwebtoken`, `bcryptjs`, `crypto` (standard library)

---

## 1. User Login
`POST /api/auth/login`

Authenticates an admin or student.

### Access Rule
* **Public** (no authentication required)

### Request Parameters
* **Headers**:
  * `Content-Type: application/json`
* **Body** (JSON):
  * `email` (string, required): User email address.
  * `password` (string, required): User password.

### Response Schema

#### Success (200 OK)
```json
{
  "success": true,
  "role": "admin | student",
  "token": "JWT_TOKEN_STRING",
  "user": {
    "id": "UUID_STRING",
    "name": "John Doe",
    "email": "john@example.com",
    "studentId": "2026101", // only if role is student
    "phone": "+1234567890"  // only if role is student
  }
}
```

#### Errors
* **400 Bad Request**: Missing email or password.
  ```json
  { "success": false, "error": "Email and password are required" }
  ```
* **401 Unauthorized**: Invalid credentials.
  ```json
  { "success": false, "error": "Invalid email or password" }
  ```

---

## 2. Register Account
`POST /api/auth/register`

Creates a new admin or student account.

### Access Rule
* **Public** (no authentication required)

### Request Parameters
* **Headers**:
  * `Content-Type: application/json`
* **Body** (JSON):
  * `name` (string, required): Full name.
  * `email` (string, required): Valid email address format.
  * `password` (string, required): Password (min 6 characters, must include both letters and numbers).
  * `role` (string, optional): `'student'` or `'admin'`. Defaults to `'student'`.
  * `phone` (string, conditional): Required if role is `'student'`. Valid format (10-20 digits).
  * `studentId` (string, conditional): Required if role is `'student'`. Unique identifier.

### Response Schema

#### Success (210 Created)
```json
{
  "success": true,
  "role": "student | admin",
  "token": "JWT_TOKEN_STRING",
  "user": {
    "id": "UUID_STRING",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "studentId": "2026102",
    "phone": "+19876543210"
  }
}
```

#### Errors
* **400 Bad Request**: Input validation failures (format, complexity, or missing fields).
  ```json
  { "success": false, "error": "Please enter a valid phone number (min 10 digits)" }
  ```
* **409 Conflict**: Resource already registered.
  ```json
  { "success": false, "error": "Email already registered" }
  ```

---

## 3. Session Verification
`GET /api/auth/me`

Validates user session token and returns decoded payload.

### Access Rule
* **Authenticated (Any)**: Requires a valid bearer JWT token.

### Request Parameters
* **Headers**:
  * `Authorization: Bearer <token>`

### Response Schema

#### Success (200 OK)
```json
{
  "success": true,
  "user": {
    "id": "UUID_STRING",
    "role": "student",
    "email": "jane@example.com",
    "name": "Jane Smith",
    "iat": 1779999999,
    "exp": 1780000000
  }
}
```

#### Errors
* **401 Unauthorized**: No token or expired/malformed token.
  ```json
  { "success": false, "error": "Invalid token" }
  ```
