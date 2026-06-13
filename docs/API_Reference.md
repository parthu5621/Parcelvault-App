# ParcelVault API Reference

Welcome to the API Reference documentation for the ParcelVault App Node.js backend. This document provides a comprehensive guide to all available endpoints, their access requirements, request parameters, response models, and associated codebase structures.

## Base URL
The backend API is served at a base path (configured via environment variables, defaulting locally to `http://localhost:3001`):
```
http://localhost:3001
```

## Security & Authentication
Most endpoints in the ParcelVault API require a JSON Web Token (JWT) provided in the HTTP request headers:
```http
Authorization: Bearer <your_jwt_token_here>
```

Tokens contain user claims:
- `id`: Unique user UUID.
- `role`: Roles are either `admin` or `student`.
- `email`: User email address.
- `name`: User display name.

### Role Categories
- **Public**: Anyone can call these routes (e.g. registration/login, health check).
- **Authenticated (Any)**: Any valid student or admin token.
- **Admin Only**: Requires a token where `role` is `admin`.
- **Owner or Admin**: Students can access only records belonging to their own user `id`, while admins can access all records.

---

## Route Groups

Click on any group link below to view detailed route definitions:

1. **[Authentication](Auth.md)**
   - Sign in and register student/admin accounts.
2. **[Parcels](Parcels.md)**
   - Manage incoming and pickup states of physical packages.
3. **[Lockers](Lockers.md)**
   - Check status, sizes, sections, and allocation stats.
4. **[Notifications](Notifications.md)**
   - Fetch, update status, and manage student pick-up alerts.
5. **[Students](Students.md)**
   - Admin routes for managing, searching, and deleting student entities.
6. **[Dashboard](Dashboard.md)**
   - Summary statistics and charts endpoints for both admin and student views.

---

## Technical Details

- **Database**: SQLite3 accessed via `better-sqlite3`.
- **Primary Codebase Entrypoint**: [src/server.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/server.js)
- **Shared Middleware**: [src/middleware/auth.js](file:///c:/Users/91799/Downloads/ParcelVault%20App/backend/src/middleware/auth.js)
- **Route Index File**: [docs/endpoints.json](endpoints.json)
