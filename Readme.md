# Online Course Service — CSX4107 Final Exam (2026-01)

**Student:** Pawat Asavapotiphan  
**Student ID:** <your ID>  
**Exam date:** 20 October 2026

## Submission Links

| Item | Link |
|---|---|
| Backend repo (Next.js) | <https://github.com/.../next-backend> |
| Frontend repo (React/Vite) | <https://github.com/.../react-frontend> |
| Deployed backend | <https://xxxx-backend.vercel.app> |
| Deployed frontend | <https://xxxx-frontend.vercel.app> |
| Screen + camera recording | <recording link> |

## Test Accounts

Passwords are stored as bcrypt hashes in MongoDB.

| Role | Username | Email | Password |
|---|---|---|---|
| Teacher | teacher1 | teacher1@example.com | <TestUser!123> |
| Teacher | teacher2 | teacher2@example.com | <TestUser!123> |
| Teacher | teacher3 | teacher3@example.com | <TestUser!123> |
| Student | student1 | student1@example.com | <TestUser!123> |
| Student | student2 | student2@example.com | <TestUser!123> |
| Student | student3 | student3@example.com | <TestUser!123> |

## Tech Stack

- Backend: Next.js (API routes) with `src/proxy.js` for auth, MongoDB, JWT in an httpOnly cookie, bcrypt
- Frontend: React (Vite), HashRouter, UserContext for login state and API calls
- Hosting: Vercel (both apps), MongoDB Atlas

## Environment Variables

**Backend (`next-backend/.env.local` and Vercel)**
