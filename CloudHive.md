# CloudHive — Distributed File Management System

**Powered by Apache Hadoop HDFS**

CloudHive is a full-stack, enterprise-grade distributed file management platform designed for students and developers who want to understand and demonstrate real-world cloud storage architecture.

Users can upload, download, organize, search, and manage files through a modern web interface, while storage is handled by **Hadoop HDFS**. Files are distributed as blocks across multiple DataNodes with replication and fault tolerance.

Unlike a conventional file manager that stores files on a single server or local folder, CloudHive separates the **client, API services, metadata persistence, and distributed storage layers**, reflecting the architecture used by large-scale storage platforms.

The project also includes an **Admin Dashboard** for monitoring cluster health, DataNode status, storage utilization, and replication metrics.

---

## 🎯 Objectives

1. Build a secure, production-quality web-based file management application.
2. Use Hadoop HDFS as the primary storage backend instead of a local filesystem.
3. Demonstrate distributed-systems concepts such as block replication, fault tolerance, and scalability.
4. Maintain a clean separation between Client, API, Metadata, and Storage layers.
5. Containerize the complete infrastructure using Docker for portability and repeatability.
6. Provide an admin panel for cluster and storage monitoring.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js + Vite | Component-based web interface |
| UI Styling | TailwindCSS + shadcn/ui | Consistent and modern UI |
| Backend | Node.js + Express.js | REST API and file streaming |
| Authentication | JWT + bcrypt | Authentication and password security |
| Metadata Database | PostgreSQL + Prisma ORM | Relational file and user metadata |
| HDFS Client | WebHDFS REST API | Communicates with Hadoop NameNode |
| Distributed Storage | Apache Hadoop HDFS | Distributed storage, replication and fault tolerance |
| Containerization | Docker + Docker Compose | Local multi-node HDFS cluster |
| File Handling | Node.js Streams + Multer | Efficient upload/download pipeline |
| API Testing | Postman / Thunder Client | Endpoint testing |

### Why WebHDFS?

CloudHive uses **WebHDFS** instead of a native Java HDFS client. WebHDFS exposes Hadoop operations through HTTP REST APIs, allowing the Node.js backend to communicate with HDFS without requiring native Hadoop client binaries or Java integration.

### Why Express.js?

Express.js provides a lightweight REST API architecture with easier setup and debugging. It keeps the project focused on the distributed-storage concepts while remaining suitable for a full-stack academic/demo application.

---

# 🏗️ System Architecture

CloudHive follows a layered architecture:

```text
┌─────────────────────────────┐
│        React + Vite         │
│       Web Application       │
└──────────────┬──────────────┘
               │ REST API
               ▼
┌─────────────────────────────┐
│      Node.js + Express      │
│       Backend Services      │
└──────────┬─────────┬────────┘
           │         │
           │         ▼
           │   ┌───────────────┐
           │   │  PostgreSQL   │
           │   │  + Prisma     │
           │   │   Metadata    │
           │   └───────────────┘
           │
           ▼ WebHDFS
┌─────────────────────────────┐
│        Hadoop HDFS          │
│          NameNode           │
└──────────────┬──────────────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
   DataNode  DataNode  DataNode
       │       │        │
       └───────┴────────┘
        Replicated Blocks
```

---

# 📦 Sequential Modules

The modules are ordered according to development dependency, so each module builds on the previous one.

## Module 1 — Infrastructure & Environment Setup

**Goal:** Establish the complete infrastructure before application development.

### Tasks

- Docker Compose configuration
- Hadoop NameNode setup
- Three DataNodes
- HDFS health verification
- WebHDFS endpoint testing
- PostgreSQL container setup
- Environment variables and port mapping
- Project scaffolding

### Deliverable

A running HDFS cluster accessible through the Hadoop NameNode interface and a connected PostgreSQL instance.

---

## Module 2 — User Authentication

**Goal:** Secure the application before allowing file operations.

### Features

- User registration
- Name, email and password handling
- Password hashing with bcrypt
- User login
- JWT access tokens
- Authentication middleware
- Logout/token removal
- Prisma `users` table

### API Endpoints

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Deliverable

A working authentication system with protected file-management routes.

---

## Module 3 — Metadata Management

**Goal:** Store file information independently from HDFS.

### File Metadata

| Attribute | Type | Description |
|---|---|---|
| file_id | UUID | Primary key |
| file_name | String | Original filename |
| owner_id | Foreign Key | User who uploaded the file |
| file_size | Integer | File size in bytes |
| mime_type | String | File MIME type |
| hdfs_path | String | Full HDFS storage path |
| folder_path | String | Virtual folder location |
| uploaded_at | Timestamp | Upload date and time |
| download_count | Integer | Number of downloads |
| is_deleted | Boolean | Soft-delete status |

### Deliverable

- Prisma schema
- Database migrations
- Metadata CRUD service

---

## Module 4 — File Upload

**Goal:** Receive files from the frontend and store them in HDFS.

### Upload Flow

```text
1. Frontend selects file
        ↓
2. Multer receives multipart/form-data
        ↓
3. Validate file size and MIME type
        ↓
4. Generate HDFS path
        ↓
5. Stream file to HDFS using WebHDFS
        ↓
6. Store metadata in PostgreSQL
        ↓
7. Return file ID and upload status
```

### HDFS Path Format

```text
/user/{user_id}/{folder}/{uuid}_{filename}
```

### Endpoint

```text
POST /api/files/upload
```

---

## Module 5 — File Download & Preview

**Goal:** Retrieve files from HDFS securely.

### Features

- Download files by ID
- Stream files from HDFS
- Correct MIME-type headers
- Browser preview when supported
- Download-count tracking
- Owner/shared-user access control

### Endpoint

```text
GET /api/files/:id/download
```

---

## Module 6 — File & Folder Management

**Goal:** Provide complete file organization and management.

| Operation | Endpoint | Description |
|---|---|---|
| List files | `GET /api/files` | List user's files with filters |
| File information | `GET /api/files/:id` | Retrieve metadata |
| Rename | `PATCH /api/files/:id/rename` | Rename file metadata |
| Move | `PATCH /api/files/:id/move` | Change virtual folder |
| Delete | `DELETE /api/files/:id` | Soft delete + HDFS deletion |
| Create folder | `POST /api/folders` | Create virtual folder |
| List folders | `GET /api/folders` | Return folder tree |
| Search | `GET /api/files/search?q=` | Search files |

### Virtual Folder Design

Folders exist as metadata through `folder_path` values. HDFS stores the actual file data, while the application provides the user-facing folder structure.

---

## Module 7 — HDFS Storage Service

**Goal:** Keep all HDFS communication inside a dedicated service layer.

### Core Functions

```text
writeFile(path, stream)
readFile(path)
deleteFile(path)
checkNodeStatus()
getStorageReport()
verifyReplication(path)
```

The backend should communicate with HDFS through a single service such as:

```text
hdfsService.js
```

This creates a clean boundary between application logic and distributed storage operations.

---

## Module 8 — Frontend Core UI

**Goal:** Build the user-facing React application.

### Main Components

- Login / Register
- Dashboard / File Explorer
- Drag-and-drop Upload Zone
- Upload progress indicator
- File Cards
- Folder navigation
- Breadcrumb navigation
- Search bar
- Context menu
- Rename
- Move
- Delete
- Download

### Deliverable

A fully functional React frontend connected to the backend REST API.

---

## Module 9 — Admin Dashboard

**Goal:** Provide visibility into the health of the distributed storage system.

### Dashboard Metrics

| Metric | Data Source |
|---|---|
| Cluster health | HDFS NameNode API |
| Active DataNodes | HDFS node status |
| Failed/Unavailable nodes | HDFS monitoring |
| Total storage | HDFS storage report |
| Used storage | HDFS storage report |
| Free storage | HDFS storage report |
| Replication factor | HDFS file/block information |
| Total users | PostgreSQL |
| Total files | PostgreSQL |
| Upload activity | PostgreSQL / application history |

### Deliverable

A protected Admin Dashboard displaying cluster and application metrics.

---

## Module 10 — Testing & Documentation

**Goal:** Validate the system and prepare final documentation.

### Testing Areas

- REST API endpoint testing
- Authentication and authorization
- Upload/download pipeline
- Large-file streaming
- HDFS fault-tolerance testing
- DataNode failure testing
- Token expiry
- Unauthorized-access testing
- Database operations
- Replication verification

### Tools

- Postman / Thunder Client
- Docker
- HDFS monitoring
- Automated/application-level tests

### Deliverables

- Test results
- API documentation
- README/setup guide
- Final project report
- Presentation material

---

# 🔄 File Upload Data Flow

```text
User
 │
 ▼
React Upload Interface
 │
 ▼
Express API
 │
 ├── Authentication
 │
 ├── File Validation
 │
 └── Multer / Node.js Stream
          │
          ▼
       WebHDFS
          │
          ▼
       NameNode
          │
     ┌────┼────┐
     ▼    ▼    ▼
   DN-1  DN-2  DN-3
     │    │    │
     └────┼────┘
       Replicated
        Blocks

Meanwhile:

Express API
     │
     ▼
PostgreSQL
     │
     ▼
File Metadata
```

---

# 🐳 Docker-Based HDFS Cluster

CloudHive uses Docker Compose to simulate a multi-node Hadoop environment on a single development machine.

The planned cluster contains:

```text
NameNode
   │
   ├── DataNode 1
   ├── DataNode 2
   └── DataNode 3
```

This allows the project to demonstrate distributed storage and replication without requiring multiple physical computers.

---

# 🗓️ Development Timeline

| Phase | Modules | Estimated Time |
|---|---|---|
| Phase 1 — Setup | Module 1 | Week 1 |
| Phase 2 — Authentication | Modules 2–3 | Week 1–2 |
| Phase 3 — Core Features | Modules 4–6 | Week 2–3 |
| Phase 4 — HDFS Integration | Module 7 | Week 3 |
| Phase 5 — Frontend | Module 8 | Week 3–4 |
| Phase 6 — Admin Dashboard | Module 9 | Week 4–5 |
| Phase 7 — Testing & Documentation | Module 10 | Week 5–6 |

---

# 🚀 Future Enhancements

| Enhancement | Priority |
|---|---|
| File sharing with public/private permissions | High |
| File versioning | High |
| Recycle Bin | High |
| In-browser PDF/image/video preview | Medium |
| AES-256 encryption at rest | Medium |
| File deduplication using content hashing | Medium |
| Activity logging | Low |
| Email notifications | Low |
| Electron desktop sync client | Low |
| React Native mobile application | Low |
| Migration from Express.js to NestJS | Low |

---

# ⭐ Why CloudHive?

CloudHive combines **full-stack web development** with **distributed systems engineering**.

| Typical Student File Manager | CloudHive |
|---|---|
| Local `/uploads` folder | React → Express → PostgreSQL + HDFS |
| Single storage location | Distributed DataNodes |
| Single point of failure | Replicated HDFS blocks |
| Basic file metadata | Relational metadata layer |
| No cluster monitoring | Admin dashboard |
| Manual infrastructure | Docker-based cluster |
| Local filesystem | Hadoop distributed filesystem |

The project demonstrates how a modern file-management application can be built on top of a distributed storage system rather than relying on a single machine or folder.

---

# 📌 Project Status

> 🚧 **Under Development**

CloudHive is being developed incrementally, following the module sequence described above.

The initial focus is on establishing the Docker-based Hadoop cluster, connecting PostgreSQL, implementing authentication, and building the core HDFS file-management pipeline.

---

# 📁 Planned High-Level Structure

```text
CloudHive/
│
├── client/                 # React + Vite frontend
│
├── server/                 # Node.js + Express backend
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   │   └── hdfsService.js
│   └── ...
│
├── prisma/                 # Database schema and migrations
│
├── docker-compose.yml      # HDFS + PostgreSQL infrastructure
│
├── .env.example            # Environment configuration template
│
└── README.md
```

---

# 📚 Core Concepts Demonstrated

- Distributed file systems
- Hadoop HDFS
- NameNode and DataNodes
- Block storage
- Block replication
- Fault tolerance
- Distributed storage
- REST APIs
- WebHDFS
- Authentication and authorization
- JWT
- Password hashing
- PostgreSQL relational metadata
- Prisma ORM
- File streaming
- Docker containerization
- Multi-node cluster simulation
- System monitoring
- Full-stack web development

---

## License

This project is intended as an academic and learning-focused distributed systems project.
