# Project Management Plan (PMP)

> The purpose of this PMP is to practice planning and tracking work in Jira. Keep it short: most of the content is a summary of what you set up in Jira.
> Keep this file at `docs/PMP.md`. Each section is one Jira epic (PMP-1 … PMP-6); mark the epic Done when the section is complete.
> Save screenshots in `docs/img/`.

| Section | Content | Required by |
|---|---|---|
| PMP-1 | Project, Jira setup, team and roles | Week 6 |
| PMP-2 | Work packages (epics) and sprint plan | Week 6 |
| PMP-3 | Progress review: mid-term (v0.1) | Mid-term evaluation (Week 8 / 9) |
| PMP-4 | Progress review: v0.2 | Week 10 |
| PMP-5 | Progress review: final (v1.0) | Final evaluation |
| PMP-6 | Retrospective | Final evaluation |

---

## PMP-1. Project and Team

### Project and Jira Setup

**Project in one sentence:** A web-based decision support platform where parents, specialists and children share one schedule, task list and record of observations, with a role-based AI summary that supports, but never replaces, human decisions.  
**Jira project key:** TRI  
**Jira board link:** https://tricore-seng383.atlassian.net/jira/software/projects/TRI/boards/3  

### Team and Roles

| Name | Jira / GitHub username | Role |
|---|---|---|
| Çağrı Anuk (contact person) | cagrianukk | Developer |
| Cem Çiftçi | cmcftc157 | Developer |
| Furkan Akyol | 2002Furkan | Developer |

The planned collaboration with SENG 440 test students was cancelled by the instructor; the three developers also do testing and quality work.

---

## PMP-2. Plan

### Work Packages (Epics)

| Epic | Jira key | Owner | Number of tasks (now) | Planned sprint(s) |
|---|---|---|---|---|
| PMP-1 – Project and team | TRI-1 | Çağrı Anuk | 1 | Sprint 1 |
| PMP-2 – Plan | TRI-2 | Çağrı Anuk | 1 | Sprint 1 |
| PMP-3 – Progress review: mid-term | TRI-3 | Çağrı Anuk | 0 | Sprint 2 |
| PMP-4 – Progress review: v0.2 | TRI-4 | Çağrı Anuk | 0 | Sprint 3 |
| PMP-5 – Progress review: final | TRI-5 | Çağrı Anuk | 0 | Sprint 4 |
| PMP-6 – Retrospective | TRI-6 | Çağrı Anuk | 0 | Sprint 4 |
| M1 – Login and roles | TRI-7 | Çağrı Anuk | 4 | Sprint 1–2 |
| M2 – Linking specialists | TRI-8 | Çağrı Anuk | 1 | Sprint 2 |
| M3 – Weekly schedule | TRI-9 | Cem Çiftçi | 1 | Sprint 2 |
| M4 – Tasks | TRI-10 | Cem Çiftçi | 0 | Sprint 2 |
| M5 – Specialist entries | TRI-11 | Furkan Akyol | 1 | Sprint 3 |
| M6 – Documents | TRI-12 | Cem Çiftçi | 0 | Sprint 3 |
| M7 – Weekly statistics | TRI-13 | Çağrı Anuk | 0 | Sprint 3 |
| M8 – Role-based AI summary | TRI-14 | Furkan Akyol | 0 | Sprint 3 |

The epic owner is responsible for the epic and reviews its pull requests; individual tasks are assigned to all three developers so that everyone works on both frontend and backend. Epic ownership follows the SRS review split (TRI-19, TRI-20, TRI-21). Task counts are taken from Jira at the end of Sprint 1; tasks for each sprint are created at sprint planning.

### Sprint Plan

| Sprint | Weeks | Sprint goal | Ends with |
|---|---|---|---|
| Sprint 1 | 4–6 (until 8 Nov) | Set up repository, Jira, CI and project skeleton; SRS and SDD first version; basic login path from frontend to database | Walking skeleton (v0.0), Week 6 |
| Sprint 2 | 7–8 | Implement M1–M4 with API access control; first end-to-end test in CI | Release v0.1, mid-term (Week 8) |
| Sprint 3 | 9–10 | Implement M5–M8 including AI mock mode; end-to-end tests for the 3 critical flows; SRS and SDD final | Release v0.2, Week 10 |
| Sprint 4 | 11–13 | Fix defects, end-to-end test for each of M1–M8, final report with demo video | Release v1.0, final (Week 13) |

---

## PMP-3. Progress Review: Mid-term (v0.1)

Status on 2026-11-15, the day before the mid-term evaluation (Monday 16 November, Week 8). Release `v0.1` is tagged on `main`.

**Jira board screenshot:** *(to be added: `docs/img/pmp3-board.png`)*  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| PMP-1 – Project and team | Jira project, team and roles | Done |
| PMP-2 – Plan | Epics and sprint plan | Done |
| M1 – Login and roles | Login, JWT, role-based navigation, `requireRole` (403), log out on expired token (TRI-25, TRI-35) | Done |
| M2 – Linking specialists | Link and unlink specialists, `requireChildAccess`, Flow 1 end-to-end test in CI (TRI-26, TRI-27) | Done |
| M3 – Weekly schedule | SRS review, events API and weekly view (TRI-20, TRI-28, TRI-29) | Done |
| M4 – Tasks | Demo data, tasks API, task form, child's tasks page (TRI-34, TRI-30, TRI-31, TRI-33) | Done for v0.1; the Flow 2 end-to-end test (TRI-36) moves to Sprint 3 |

**Changes to the plan (if any):**
- The `EVENT` and `TASK` tables and the demo data were moved forward into TRI-34 so that M3 and M4 could be built in parallel on the same schema.
- The Flow 2 end-to-end test (TRI-36) moves from Sprint 2 to Sprint 3. v0.1 needs one end-to-end test in CI, which Flow 1 covers; the end-to-end tests for all three critical flows are due with v0.2 (Week 10).
- The child's task page uses `/my-tasks`, since `/tasks` is the assignment page for parents and specialists.
- Most of M3 and M4 was merged in the last two days of the sprint. For Sprint 3 we open pull requests earlier and review them as they come in, so that work does not pile up before the deadline.

---

## PMP-4. Progress Review: v0.2

**Jira board screenshot:**  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| | | |
| | | |

**Changes to the plan (if any):**

---

## PMP-5. Progress Review: Final (v1.0)

**Jira board screenshot:**  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| | | |
| | | |

**Changes to the plan (if any):**

---

## PMP-6. Retrospective

- What worked well in using Jira:
- What we would do differently:
