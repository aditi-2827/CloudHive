# CloudHive

**A distributed file management system powered by Apache Hadoop HDFS.**

CloudHive is a full-stack project that stores uploaded files in a real multi-node Hadoop cluster instead of a single local disk. Metadata lives in PostgreSQL, the API is built with Node.js/Express, and file data is written to HDFS through the WebHDFS REST API. Files are split into blocks, replicated across DataNodes, and remain available even if a node fails.

The project is designed as a learning-friendly, production-shaped reference for distributed storage: client, API, metadata, and storage layers are kept separate, and the entire infrastructure runs locally with Docker Compose.

> Full architecture and module plan: [`CloudHive.md`](./CloudHive.md)

---

## Table of Contents

- [Features](#features)
- [Project Status](#project-status)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## Features

### Implemented

- **HDFS cluster in Docker** — 1 NameNode + 3 DataNodes + PostgreSQL, wired with Docker Compose.
- **Authentication** — register, login, logout, and "current user" endpoints.
- **Secure password storage** — bcrypt hashing with 12 salt rounds.
- **JWT sessions** — signed tokens with configurable expiry; `protect` and `requireRole` middleware.
- **Metadata schema** — Prisma models for `User` and `File`.
- **WebHDFS storage layer** — write, read, delete, and list operations against HDFS.
- **Consistent error handling** — centralized `404` and error middleware.

### Planned

- File upload and download endpoints with streaming and Multer.
- File management API (list, rename, move, delete, search).
- React + Vite frontend with TailwindCSS and shadcn/ui.
- Admin dashboard for cluster health, DataNode status, storage usage, and replication metrics.

---

## Project Status

| Module | Description | Status |
|:---:|---|:---:|
| 1 | Infrastructure & environment setup | ✅ Done |
| 2 | User authentication (JWT + bcrypt) | ✅ Done |
| 3 | Metadata schema (PostgreSQL + Prisma) | ✅ Done |
| 4 | File upload | ⬜ Planned |
| 5 | File download / streaming | ⬜ Planned |
| 6 | File management (list, rename, delete, search) | ⬜ Planned |
| 7 | HDFS / WebHDFS service layer | 🟡 Initial |
| 8 | React frontend | ⬜ Planned |
| 9 | Admin dashboard | ⬜ Planned |

---

## Architecture

```text
+--------------------------------------------------+
|              React + Vite Web App                |   (planned)
+-------------------------+------------------------+
                          | REST / JSON
                          v
+--------------------------------------------------+
|              Node.js + Express API               |
|   auth · files · admin · WebHDFS client          |
+-------------+----------------------+-------------+
              |                      |
              | Prisma               | WebHDFS (HTTP)
              v                      v
+-------------------------+  +----------------------+
|   PostgreSQL (metadata) |  |  Hadoop NameNode     |
|   users · files         |  |  /cloudhive          |
+-------------------------+  +----------+-----------+
                                        |
                            +-----------+-----------+
                            |           |           |
                        DataNode    DataNode    DataNode
                            \           |           /
                             +--- replicated blocks --+
```

**Request flow (upload, planned):** client → Express API → `hdfsService.js` → WebHDFS → NameNode → DataNodes. The API records file metadata and an HDFS path in PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (planned) | React, Vite, TailwindCSS, shadcn/ui |
| Backend | Node.js, Express 4 |
| Authentication | JSON Web Tokens, bcrypt |
| Metadata | PostgreSQL 16, Prisma ORM 6 |
| Distributed storage | Apache Hadoop HDFS 3.2.1 |
| HDFS client | WebHDFS REST API |
| File handling (planned) | Node.js streams, Multer |
| Infrastructure | Docker, Docker Compose |
| API testing | Postman / Thunder Client / cURL |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose v2
- [Node.js](https://nodejs.org/) 18 or newer (includes npm)
- Git
- At least ~4 GB of free RAM for the Hadoop containers

Verify your tooling:

```bash
docker --version
docker compose version
node --version
npm --version
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/aditi-2827/CloudHive.git
cd CloudHive
```

### 2. Create the environment file

```bash
cp .env.example .env          # macOS / Linux
```

```powershell
Copy-Item .env.example .env   # Windows PowerShell
```

Adjust `JWT_SECRET` and database credentials as needed before deploying anywhere beyond local development.

### 3. Start the infrastructure

```bash
docker compose up -d
```

This starts:

| Service | URL / Port |
|---|---|
| Hadoop NameNode UI & WebHDFS | http://localhost:9870 |
| PostgreSQL | `localhost:5433` (default from `.env.example`) |
| DataNodes ×3 | Internal HDFS cluster network |

Check that the containers are healthy:

```bash
docker compose ps
```

Open http://localhost:9870 and confirm all three DataNodes appear under **Datanodes**. If the NameNode UI loads but no DataNodes are listed yet, wait a few seconds and refresh.

### 4. Set up the backend

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```

The API starts at **http://localhost:5000**. Confirm it is running:

```bash
curl http://localhost:5000/api/health
# {"status":"ok","service":"cloudhive-api","timestamp":"..."}
```

> **Note:** `DATABASE_URL` in `.env` must match the host port published for PostgreSQL. With the default `.env.example`, `POSTGRES_PORT=5433` maps to container port `5432`, so `DATABASE_URL` should use `localhost:5433` unless you change the port mapping.

---

## Configuration

Environment variables live in the root `.env` file (loaded by the server via `dotenv`):

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `cloudhive` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `cloudhive` | PostgreSQL password |
| `POSTGRES_DB` | `cloudhive` | PostgreSQL database name |
| `POSTGRES_PORT` | `5433` | Host port mapped to PostgreSQL |
| `NAMENODE_PORT` | `9870` | Host port for NameNode UI and WebHDFS |
| `PORT` | `5000` | Express API port |
| `NODE_ENV` | `development` | Runtime environment |
| `DATABASE_URL` | `postgresql://cloudhive:cloudhive@localhost:5432/cloudhive?schema=public` | Prisma connection string |
| `JWT_SECRET` | `change_me_in_production` | Token signing secret — **replace this** |
| `JWT_EXPIRES_IN` | `7d` | JWT lifetime |
| `NAMENODE_HOST` | `localhost` | NameNode host used by WebHDFS |
| `WEBHDFS_PORT` | `9870` | WebHDFS port |
| `HDFS_BASE_PATH` | `/cloudhive` | Root HDFS directory for application files |

> Never commit `.env` or production secrets. `.env` is ignored by Git; commit only `.env.example`.

---

## API Reference

Base URL: `http://localhost:5000`

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | — | Create an account (`name`, `email`, `password` ≥ 8 chars) |
| `POST` | `/api/auth/login` | — | Exchange credentials for a JWT |
| `POST` | `/api/auth/logout` | — | Stateless logout — discard the token client-side |
| `GET` | `/api/auth/me` | Bearer | Return the authenticated user |

Protected routes expect:

```http
Authorization: Bearer <token>
```

#### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"supersecret"}'
```

```json
{
  "user": {
    "id": "...",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "USER",
    "createdAt": "..."
  },
  "token": "<jwt>"
}
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"supersecret"}'
```

#### Current user

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

#### Error responses

| Status | Meaning |
|---|---|
| `400` | Missing or invalid fields |
| `401` | Invalid credentials or absent/expired token |
| `403` | Authenticated but not allowed (role check) |
| `409` | Email already registered |

Errors are returned as `{ "error": "message" }`.

---

## Project Structure

```text
CloudHive/
├── docker-compose.yml       # HDFS cluster + PostgreSQL
├── hadoop.env               # Hadoop container configuration
├── .env.example             # Environment template
├── CloudHive.md             # Architecture and module plan
├── README.md
└── server/                  # Node.js + Express API
    ├── package.json
    ├── prisma/
    │   ├── schema.prisma    # User and File models
    │   └── migrations/
    └── src/
        ├── server.js        # App bootstrap and route mounting
        ├── routes/          # authRoutes.js
        ├── controllers/     # authController.js
        ├── middleware/      # authMiddleware.js, errorMiddleware.js
        └── services/        # hdfsService.js (WebHDFS layer)
```

### Useful scripts

Run from `server/`:

| Command | Description |
|---|---|
| `npm run dev` | Start the API with file watching |
| `npm start` | Start the API |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply development migrations |
| `npm run prisma:studio` | Open Prisma Studio |

---

## Troubleshooting

**Port already in use** — change `PORT`, `POSTGRES_PORT`, or `NAMENODE_PORT` in `.env`, then restart (`docker compose up -d` and `npm run dev`).

**Prisma cannot reach the database** — make sure the Postgres container is running (`docker compose ps`) and that the port in `DATABASE_URL` matches `POSTGRES_PORT`.

**NameNode UI shows zero DataNodes** — wait 10–30 seconds; DataNodes register after the NameNode is ready. Check logs with `docker compose logs datanode1`.

**WebHDFS connection refused** — confirm the NameNode is healthy at http://localhost:9870 and that `NAMENODE_HOST` / `WEBHDFS_PORT` match your setup.

**JWT errors after pulling changes** — ensure `JWT_SECRET` is set in `.env`; tokens signed with an old secret are rejected.

**Clean slate** — stop containers and remove volumes (this deletes stored data):

```bash
docker compose down -v
```

---

## Roadmap

1. HDFS upload/download endpoints with streaming.
2. File listing, search, rename, move, and delete backed by metadata + HDFS.
3. React frontend: authentication screens, file explorer, upload progress.
4. Admin dashboard: cluster health, DataNode status, capacity, replication factor.
5. Hardening: request validation, rate limiting, tests, CI.

---

## Contributing

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```
2. Make your changes and commit with a clear message.
3. Push to your fork and open a pull request against `main`.
4. Describe what changed and how you tested it.

Please keep the existing code style, do not commit `.env` files or secrets, and keep changes scoped to the relevant module.

---

## Acknowledgements

CloudHive is built on the shoulders of [Apache Hadoop](https://hadoop.apache.org/), [Express](https://expressjs.com/), [Prisma](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/), and [Docker](https://www.docker.com/).
