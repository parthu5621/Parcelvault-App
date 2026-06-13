# ParcelVault Backend API

A Node.js + Express REST API powering the ParcelVault smart locker system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | SQLite (via `better-sqlite3`) |
| Auth | JWT + bcryptjs |
| Dev server | nodemon |

## Folder Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── database.js     # SQLite connection + schema
│   │   └── seed.js         # Seed test data
│   ├── middleware/
│   │   └── auth.js         # JWT auth + role guards
│   ├── routes/
│   │   ├── auth.js         # Login / Register / Me
│   │   ├── parcels.js      # Parcel CRUD + assign/collect
│   │   ├── lockers.js      # Locker listing + stats
│   │   ├── students.js     # Student management
│   │   ├── notifications.js# Notification CRUD
│   │   └── dashboard.js    # Admin & student stats
│   └── server.js           # Express app entry point
├── .env                    # Environment variables
├── .gitignore
└── package.json
```

## Setup & Run

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Seed the database
```bash
npm run seed
```

### 3. Start dev server (with auto-reload)
```bash
npm run dev
```

### 4. Start production server
```bash
npm start
```

The API runs on **http://localhost:3001**

---

## API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login (student or admin) |
| POST | `/api/auth/register` | Public | Register new user |
| GET | `/api/auth/me` | JWT | Get current user |

### Parcels
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/parcels` | JWT | List parcels (admin=all, student=own) |
| GET | `/api/parcels/:id` | JWT | Get parcel by ID |
| POST | `/api/parcels` | Admin | Log new incoming parcel |
| PATCH | `/api/parcels/:id/assign-locker` | Admin | Assign locker + generate OTP |
| PATCH | `/api/parcels/:id/collect` | JWT | Collect parcel with OTP |
| PATCH | `/api/parcels/:id/release` | Admin | Release locker (mark expired) |
| DELETE | `/api/parcels/:id` | Admin | Delete parcel |

### Lockers
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/lockers` | JWT | List all lockers |
| GET | `/api/lockers/available` | JWT | List free lockers (filter by `?size=`) |
| GET | `/api/lockers/:id` | JWT | Get locker by ID |
| GET | `/api/lockers/stats/summary` | Admin | Occupancy stats by section/size |

### Students
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/students` | Admin | List all students |
| GET | `/api/students/search?q=` | Admin | Search students |
| GET | `/api/students/:id` | JWT | Get student profile |
| GET | `/api/students/:id/parcels` | JWT | Get student's parcel history |
| DELETE | `/api/students/:id` | Admin | Remove student |

### Notifications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | JWT | List notifications |
| GET | `/api/notifications/unread-count` | JWT | Count unread |
| PATCH | `/api/notifications/:id/read` | JWT | Mark one as read |
| PATCH | `/api/notifications/read-all` | JWT | Mark all as read |
| DELETE | `/api/notifications/:id` | JWT | Delete notification |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/stats` | Admin | System overview stats |
| GET | `/api/dashboard/student-stats` | JWT | Personal summary |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | admin123 |
| Student | alex@university.edu | 123456 |
| Student | priya@university.edu | 123456 |
| Student | ravi@university.edu | 123456 |
