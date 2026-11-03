# Secure File Manager

A full-stack web application for securely storing digital documents behind a **multi-level, sequential approval workflow**. Files are uploaded by regular users and cannot be accessed until they are approved in order by **Level 1 → Level 2 → Manager**.

Built as a production-style portfolio project with a Node.js/Express + MySQL REST API and a React (Vite) front end.

---

## Why this project

Most file-sharing tools let anyone with a link open a file. This one models the real-world approval chain used by banks, government offices, and enterprises: a document is only "live" once it has passed every required reviewer, and no reviewer can skip ahead of the one before them.

The core rule: **a Level 2 approver cannot act until Level 1 has approved, and a Manager cannot act until Level 2 has approved.** The rule is enforced on the server, not just hidden in the UI.

---

## Features

- **JWT authentication** — register, login, and protected routes.
- **Role-based access control (RBAC)** — five roles: `user`, `level1`, `level2`, `manager`, `admin`.
- **Multi-level approval workflow** — sequential, gated approval with per-stage status (`pending_l1`, `pending_l2`, `pending_manager`, `approved`, `rejected`).
- **Secure uploads** — file type and size validation, random server-side filenames, original name preserved in the database.
- **Role-aware dashboards** — uploaders see their own files; approvers see the queue for their stage; admins manage users.
- **Full audit trail** — every upload, approval, and rejection is recorded with the actor, level, timestamp, and optional comment.
- **Transactional approvals** — row-level locking (`SELECT ... FOR UPDATE`) prevents two approvers from acting on the same file at once.
- **Admin user management** — promote or change a user's role from the UI.
- **Responsive UI** — clean, mobile-friendly interface built with React and Tailwind CSS.

---

## The approval workflow

```
   [ user uploads a file ]
              |
              v
      pending_l1  ──(Level 1 approves)──>  pending_l2
              |                                  |
        (rejected)                     (Level 2 approves)
              |                                  |
              v                                  v
          rejected                        pending_manager
                                                 |
                                        (Manager approves)
                                                 |
                                                 v
                                             approved  ──> downloadable
```

- A newly uploaded file always starts at `pending_l1`.
- Only the role that owns the current stage may approve or reject it.
- Any rejection at any stage moves the file to `rejected` and ends the flow.
- Once `approved`, the uploader can download the file.

---

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Frontend   | React 18, Vite, React Router, Tailwind CSS, Axios |
| Backend    | Node.js, Express, JWT (jsonwebtoken), bcryptjs, Multer |
| Database   | SQLite via `sql.js` (default, zero setup) or MySQL via `mysql2` |
| Tooling    | Docker Compose (optional MySQL), nodemon |

---

## Project structure

```
secure-file-manager/
├── backend/
│   ├── config/db.js               # MySQL connection pool
│   ├── controllers/               # auth, file, approval, user logic
│   ├── middleware/                # JWT auth + RBAC guard, Multer upload
│   ├── routes/                    # Express routers
│   ├── utils/roles.js             # roles + workflow state machine (single source of truth)
│   ├── db/schema.sql              # database schema
│   ├── db/seed.js                 # demo users for every role
│   ├── server.js                  # app entry point
│   └── .env.example
├── frontend/
│   ├── src/components/            # Navbar, StatusBadge
│   ├── src/context/               # AuthContext (JWT + user session)
│   ├── src/pages/                 # Login, Register, Dashboard, Upload, Approvals, Users
│   ├── src/api.js                 # Axios instance with auth interceptor
│   └── vite.config.js
├── docker-compose.yml             # one-command MySQL for local dev
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Run it (no database setup needed)

Two terminals, from the project folder.

**Terminal 1 - backend**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - frontend**

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

That is the whole setup. By default the app stores everything in a local SQLite file at `backend/data/app.db`, and the tables plus demo accounts are created automatically on first start. There is no MySQL server to install, no cloud account, and no `.env` file to write.

### Using MySQL instead (recommended for production)

Set `DB_CLIENT=mysql` and the connection details in `backend/.env`, then run `npm run seed` once.

```bash
cd backend
cp .env.example .env      # then edit .env
```

```ini
DB_CLIENT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=secure_file_manager
DB_SSL=false
```

For a cloud host (Aiven, Railway, TiDB, PlanetScale) use the host, port and user from the provider console and set `DB_SSL=true` - managed MySQL refuses plain connections.

To run MySQL locally without installing anything else, the included `docker-compose.yml` starts one:

```bash
docker compose up -d db
```

### Switching database modes

| `DB_CLIENT` | Storage | Setup needed |
| ----------- | ------- | ------------ |
| `sqlite` (default) | `backend/data/app.db` | none |
| `mysql` | MySQL server (local or cloud) | `.env` + `npm run seed` |

The application code is identical in both modes - `config/db.js` selects the driver and exposes the same interface to the controllers.

## Demo accounts

After running `npm run seed`:

| Email                  | Password      | Role      |
| ---------------------- | ------------- | --------- |
| user@example.com       | User@123      | user      |
| level1@example.com     | Level1@123    | level1    |
| level2@example.com     | Level2@123    | level2    |
| manager@example.com    | Manager@123   | manager   |
| admin@example.com      | Admin@123     | admin     |

**Try the flow:** log in as `user`, upload a file, then log in as `level1` and approve it, then `level2`, then `manager`. Only after the manager approves does the file become downloadable.

---

## API reference

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint         | Access | Description |
| ------ | ---------------- | ------ | ----------- |
| POST   | `/auth/register` | Public | Register a new regular user |
| POST   | `/auth/login`    | Public | Log in and receive a JWT |
| GET    | `/auth/me`       | Auth   | Current user profile |

### Files

| Method | Endpoint                | Access | Description |
| ------ | ----------------------- | ------ | ----------- |
| POST   | `/files`                | Auth   | Upload a file (multipart, field `file`); enters the chain at Level 1 |
| GET    | `/files`                | Auth   | List files (users see their own; approvers/managers/admins see all) |
| GET    | `/files/:id/download`   | Auth   | Download a file (users only when approved) |

### Approvals

| Method | Endpoint                       | Access    | Description |
| ------ | ------------------------------ | --------- | ----------- |
| GET    | `/approvals/pending`           | Approvers | Files waiting at the caller's stage |
| POST   | `/approvals/:fileId/approve`   | Approvers | Approve at the current stage (gated) |
| POST   | `/approvals/:fileId/reject`    | Approvers | Reject the file |
| GET    | `/approvals/:fileId/history`   | Auth      | Full audit trail for a file |

### Users

| Method | Endpoint             | Access | Description |
| ------ | -------------------- | ------ | ----------- |
| GET    | `/users`             | Admin  | List all users |
| PATCH  | `/users/:id/role`    | Admin  | Change a user's role |

---

## Security notes

- Passwords are hashed with bcrypt; plain passwords are never stored.
- JWTs are verified on every protected route and carry the user's role.
- The approval gate is enforced server-side using the file's stored status, so it cannot be bypassed by tampering with the UI.
- Uploaded files are stored under random names; the original filename lives only in the database.
- File type and size are validated on upload.

For production you would additionally add rate limiting, virus scanning, and object storage (e.g. S3) instead of local disk.

---

## Possible next steps

- Email notifications on approval/rejection.
- Version history and comments per file.
- Configurable approval chains per document type.
- File preview and full-text search.
- Deploy: API on Render/Railway, MySQL on PlanetScale/Aiven, frontend on Vercel/Netlify.

---

## Troubleshooting

- **`ER_ACCESS_DENIED_ERROR`** - wrong `DB_USER` / `DB_PASSWORD` in `backend/.env`.
- **`ECONNREFUSED`** - MySQL is not running, or the host/port is wrong.
- **SSL / handshake errors on a cloud host** - set `DB_SSL=true`.
- **`Cannot add or update a child row`** - run `npm run seed` again; the tables may be missing.
- **Port 5000 already in use** - change `PORT` in `backend/.env`.
- **Login works but file list is empty** - expected for a `user` role; upload a file first, then approve it through all three stages.

## License

Released under the MIT License. See `LICENSE`.
