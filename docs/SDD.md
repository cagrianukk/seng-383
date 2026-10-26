# Software Design Document (SDD)

**Team name:** TriCore  
**Version:** ☒ First version (Week 6) ☐ Final (Week 10)  
**Last updated:** 2026-10-18

---

## 1. Architecture Overview

The system is a three-tier web application: a React single-page frontend, a layered Node.js + Express REST API, and a SQLite database. The backend is split into routes, services and repositories; authentication (JWT), role checks and the child-link check run as middleware so that access rules are enforced in the API, not in the frontend. All AI calls go through one backend module that can switch between the real provider and a mock.

```mermaid
flowchart LR
    User --> Frontend["Frontend (React + Vite)"]
    Frontend -->|REST + JWT| Backend["Backend / API (Express)"]
    Backend --> DB[(SQLite)]
    Backend --> Files[("Uploaded files")]
    Backend --> AI["AI module"]
    AI --> LLM["LLM API (real mode)"]
    AI --> Mock["Mock (tests / CI)"]
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js + Express, JWT authentication |
| Database | SQLite |
| Testing | Jest + Supertest (API), Vitest (frontend), Playwright (end-to-end) |
| CI | GitHub Actions |

---

## 2. Module Design

| Module | Main components | Implements requirements |
|---|---|---|
| M1 – Login and roles | `authRoutes`, `authService`, `authMiddleware`, `requireRole`; `LoginPage`, `ProtectedRoute` | FR-M1-01 … FR-M1-05 |
| M2 – Linking specialists | `linkRoutes`, `linkService`, `requireChildAccess` middleware; `LinkedSpecialistsPage`, `ChildListPage` | FR-M2-01 … FR-M2-06 |
| M3 – Weekly schedule | `eventRoutes`, `eventService`; `WeeklyView`, `EventForm` | FR-M3-01 … FR-M3-04 |
| M4 – Tasks | `taskRoutes`, `taskService`; `TaskList`, `TaskForm`, `ChildTasksPage` | FR-M4-01 … FR-M4-05 |
| M5 – Specialist entries | `entryRoutes`, `entryService`; `EntryForm`, `EntryList` | FR-M5-01 … FR-M5-05 |
| M6 – Documents | `documentRoutes`, `documentService`, upload middleware (multer); `DocumentsPage` | FR-M6-01 … FR-M6-05 |
| M7 – Weekly statistics | `statsRoutes`, `statsService`; `StatsPanel` | FR-M7-01 … FR-M7-03 |
| M8 – Role-based AI summary | `summaryRoutes`, `summaryService`, `aiClient` (real + mock), prompt templates for parent and specialist; `AiSummaryCard` | FR-M8-01 … FR-M8-08 |

---

## 3. Data Model

```mermaid
erDiagram
    USER ||--o{ CHILD : "parent of"
    USER ||--o| CHILD : "is child account of"
    CHILD ||--o{ SPECIALIST_LINK : has
    USER ||--o{ SPECIALIST_LINK : "linked as specialist"
    CHILD ||--o{ EVENT : has
    CHILD ||--o{ TASK : has
    CHILD ||--o{ ENTRY : has
    CHILD ||--o{ DOCUMENT : has
    CHILD ||--o{ AI_SUMMARY : has
    AI_SUMMARY ||--o{ SUMMARY_SOURCE : "based on"
    USER {
        int id
        string name
        string email
        string password_hash
        string role
    }
    CHILD {
        int id
        string name
        int parent_id
        int user_id
    }
    SPECIALIST_LINK {
        int id
        int child_id
        int specialist_id
        string specialist_type
    }
    EVENT {
        int id
        int child_id
        string title
        datetime starts_at
        int created_by
    }
    TASK {
        int id
        int child_id
        string title
        string description
        string area
        date due_date
        string status
        int assigned_by
    }
    ENTRY {
        int id
        int child_id
        int specialist_id
        date entry_date
        string text
        boolean edited
    }
    DOCUMENT {
        int id
        int child_id
        string file_name
        string file_type
        int uploaded_by
        datetime uploaded_at
    }
    AI_SUMMARY {
        int id
        int child_id
        int requested_by
        string reader_role
        date week_start
        string text
        string feedback
    }
    SUMMARY_SOURCE {
        int summary_id
        string record_type
        int record_id
    }
```

---

## 4. API / Interfaces

All endpoints except login require a JWT. `:childId` endpoints return 403 for a specialist who is not linked to the child and for a child who is not that child.

| Method | Endpoint | Description | Module |
|---|---|---|---|
| POST | `/api/auth/login` | Log in with email and password, returns JWT and role | M1 |
| GET | `/api/auth/me` | Current user and role | M1 |
| GET | `/api/children` | Children visible to the current user | M2 |
| GET | `/api/children/:childId/specialists` | List linked specialists | M2 |
| POST | `/api/children/:childId/specialists` | Link a specialist by email and type (parent) | M2 |
| DELETE | `/api/children/:childId/specialists/:specialistId` | Unlink a specialist (parent) | M2 |
| GET | `/api/children/:childId/events?week=` | Events of a week | M3 |
| POST | `/api/children/:childId/events` | Add an event | M3 |
| GET | `/api/children/:childId/tasks` | List tasks (child: own tasks only) | M4 |
| POST | `/api/children/:childId/tasks` | Assign a task (parent, specialist) | M4 |
| PATCH | `/api/children/:childId/tasks/:taskId/done` | Mark a task as done (child) | M4 |
| GET | `/api/children/:childId/entries` | List entries (not for child) | M5 |
| POST | `/api/children/:childId/entries` | Add an entry (specialist) | M5 |
| PUT | `/api/children/:childId/entries/:entryId` | Edit an entry; sets "edited" | M5 |
| GET | `/api/children/:childId/documents` | List documents (not for child) | M6 |
| POST | `/api/children/:childId/documents` | Upload a PDF or image | M6 |
| GET | `/api/children/:childId/documents/:documentId/download` | Download a document | M6 |
| GET | `/api/children/:childId/stats?week=` | Completion rate in total and by area | M7 |
| POST | `/api/children/:childId/summaries` | Generate the weekly AI summary for the current role | M8 |
| POST | `/api/summaries/:summaryId/feedback` | Mark a summary as helpful or incorrect | M8 |

---

## 5. Critical Flows

### Flow 1: Parent links and unlinks a specialist

```mermaid
sequenceDiagram
    actor Parent
    actor Specialist
    Parent->>Frontend: enter specialist email and type
    Frontend->>Backend: POST /children/:id/specialists
    Backend->>Database: find specialist by email
    Database-->>Backend: specialist or none
    Backend->>Database: insert SPECIALIST_LINK
    Backend-->>Frontend: 201 (or 404 for unregistered email)
    Frontend-->>Parent: specialist listed
    Parent->>Frontend: unlink and confirm
    Frontend->>Backend: DELETE /children/:id/specialists/:sid
    Backend->>Database: delete SPECIALIST_LINK
    Specialist->>Backend: GET /children/:id/tasks
    Backend-->>Specialist: 403 (no link)
```

### Flow 2: Task assignment and completion

```mermaid
sequenceDiagram
    actor Specialist
    actor Child
    Specialist->>Frontend: fill task form
    Frontend->>Backend: POST /children/:id/tasks
    Backend->>Database: check link, insert TASK (open)
    Backend-->>Frontend: 201
    Child->>Frontend: mark task as done
    Frontend->>Backend: PATCH /children/:id/tasks/:tid/done
    Backend->>Database: check own task, set status done
    Backend-->>Frontend: 200
    Specialist->>Frontend: open task list
    Frontend->>Backend: GET /children/:id/tasks
    Backend-->>Frontend: tasks with status done
```

### Flow 3: Role-based AI summary

```mermaid
sequenceDiagram
    actor Parent
    Parent->>Frontend: request weekly summary
    Frontend->>Backend: POST /children/:id/summaries
    Backend->>Database: load records the role may see
    Database-->>Backend: entries, tasks, events
    Backend->>AI module: prompt for role + records
    AI module-->>Backend: summary text (real or mock)
    Backend->>Database: save AI_SUMMARY + SUMMARY_SOURCE
    Backend-->>Frontend: summary with source record ids
    Frontend-->>Parent: card labelled "AI-generated" with source links
```

---

## 6. User Interface

| Screen | Image | Module |
|---|---|---|
| Login | `docs/img/login.png` (to be added) | M1 |
| Parent – weekly dashboard (schedule, tasks, statistics, AI summary) | `docs/img/parent-dashboard.png` (to be added) | M3, M4, M7, M8 |
| Parent – linked specialists | `docs/img/parent-specialists.png` (to be added) | M2 |
| Parent – documents | `docs/img/parent-documents.png` (to be added) | M6 |
| Specialist – child profile and new entry | `docs/img/specialist-entry.png` (to be added) | M2, M5, M8 |
| Specialist – assigning and tracking tasks | `docs/img/specialist-tasks.png` (to be added) | M4 |
| Child – my tasks | `docs/img/child-tasks.png` (to be added) | M1, M3, M4 |

---

## 7. Change Log

| Date | Change | By |
|---|---|---|
| 2026-10-18 | First version | TriCore |
