# seng-383 – Child Development Platform

Team **TriCore** – SENG 383 Software Project III, Fall 2026.

A web-based decision support platform where parents, specialists and children share one weekly schedule, task list and record of observations. A role-based AI summary supports, but never replaces, human decisions.

- Requirements: [docs/SRS.md](docs/SRS.md)
- Design: [docs/SDD.md](docs/SDD.md)
- Project management plan: [docs/PMP.md](docs/PMP.md)
- Jira board: https://tricore-seng383.atlassian.net/jira/software/projects/TRI/boards/3

## Repository Structure

```
seng-383/
├── backend/            Node.js + Express REST API, SQLite, JWT   (port 3001)
├── frontend/           React + Vite single-page app               (port 5173)
├── docs/               SRS, SDD, PMP, screenshots (docs/img/)
└── .github/workflows/  CI (GitHub Actions)
```

## Prerequisites

- Node.js 22 (see `.nvmrc`)
- npm 10

**Windows:** the backend uses `better-sqlite3`, a native module. `npm install` downloads a prebuilt binary for Node 22; if none matches your Node version or CPU, it compiles from source and fails unless these are installed:

- Python 3 (https://www.python.org/downloads/, tick "Add python.exe to PATH")
- Visual Studio Build Tools with the **Desktop development with C++** workload (https://visualstudio.microsoft.com/visual-cpp-build-tools/)

Check `node -v` first: on Node 22 the prebuilt binary is normally used and the build tools are not needed.

## Running Locally

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

The API runs at http://localhost:3001.

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Requests to `/api` are proxied to the backend.

### Demo Accounts (synthetic seed data)

| Role | Email | Password |
|---|---|---|
| Parent | parent@example.com | Parent123! |
| Specialist | specialist@example.com | Specialist123! |
| Child | child@example.com | Child123! |

## Tests

| Folder | Command | Tools |
|---|---|---|
| `backend/` | `npm test` | Jest + Supertest |
| `frontend/` | `npm test` | Vitest |

CI runs these on every pull request and on every push to `main`. The AI module always runs in mock mode in tests and CI (`AI_MODE=mock`).

## Workflow

1. Pick a task on the Jira board and move it to **In Progress**.
2. Create a branch named after the Jira key: `TRI-17-backend-login`.
3. Start every commit message with the key: `TRI-17 Add login endpoint`.
4. Open a pull request to `main`; a teammate reviews it and CI must be green.
5. After the merge, move the task to **Done**.
