# CloudHive — Distributed File Management System

Powered by Apache Hadoop HDFS. Full-stack file management platform: **React + Vite** frontend, **Node.js/Express** API, **PostgreSQL + Prisma** metadata, **HDFS** distributed storage via **WebHDFS**.

See `CloudHive.md` for the full architecture and module plan.

## Current Status

- ✅ Module 1 — Infrastructure: `docker-compose.yml` (1 NameNode + 3 DataNodes + PostgreSQL)
- ✅ Module 2 — Authentication: register / login / logout / me, JWT + bcrypt, `protect` & `requireRole` middleware
- ✅ Module 3 — Metadata schema: `server/prisma/schema.prisma` (users, files)
- ✅ Module 7 (initial) — `server/src/services/hdfsService.js` (WebHDFS write/read/delete/list)
- ⬜ Modules 4–6 — Upload / download / file management endpoints
- ⬜ Module 8 — React frontend
- ⬜ Module 9 — Admin dashboard

## Setup

### 1. Infrastructure (Docker)

```bash
cp .env.example .env        # Windows: Copy-Item .env.example .env
docker compose up -d
```

- NameNode Web UI / WebHDFS: http://localhost:9870
- PostgreSQL: `localhost:5432` (cloudhive/cloudhive)

### 2. Backend

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev                 # http://localhost:5000
```

### 3. API endpoints (implemented)

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account (name, email, password ≥ 8) |
| POST | `/api/auth/login` | Returns JWT |
| POST | `/api/auth/logout` | Stateless logout |
| GET | `/api/auth/me` | Current user (Bearer token required) |

Use header `Authorization: Bearer <token>` for protected routes.

## Project Structure

```text
CloudHive/
├── docker-compose.yml       # HDFS cluster + PostgreSQL
├── hadoop.env               # Hadoop container configuration
├── .env.example             # Environment template
└── server/                  # Node.js + Express API
    ├── prisma/schema.prisma
    └── src/
        ├── server.js
        ├── routes/          # authRoutes.js
        ├── controllers/     # authController.js
        ├── middleware/      # authMiddleware.js, errorMiddleware.js
        └── services/        # hdfsService.js (WebHDFS layer)
```
