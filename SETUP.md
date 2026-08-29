# College Management System — Setup & Run

## Prerequisites

- C++17 compiler (g++ / MinGW)
- SQLite3 development libraries (libsqlite3)
- Node.js 16+
- npm

## Backend

Build (run from the `backend` directory):

```
g++ -std=c++17 -I"src" "src\server_main.cpp" -lws2_32 -L"C:\msys64\ucrt64\bin" -lsqlite3 -o "build\bin\server.exe"
```

Run from `backend\build\bin` so the server finds `schema.sql` and `college.db`:

```
cd build\bin
server.exe
```

The API listens on `http://localhost:8080`.

> Demo data (students, faculty, courses, assignments, activity) auto-seeds on first run.
> To reset the database, delete `backend\build\bin\college.db` and start the server again.

## Database / Schema

- The schema lives in `backend/src/schema.sql` (also copied to `backend/build/bin`).
- At runtime the server reads `schema.sql` from its working directory and stores data in `college.db` in that same directory.
- Tables: `Person`, `Student`, `Faculty`, `Accountant`, `Course`, `Enrollment`, `Exam`, `Attendance`, `Fee`, `Timetable`, `Assignment`, `ActivityLog`, `Users`.
- The server runs self-healing `ALTER TABLE` statements on startup, so older databases automatically gain any newly added columns.

## Frontend

```
cd frontend
npm install
npm run dev
```

The Vite dev server runs on port 5173 and proxies `/api` to `localhost:8080`.

Login credentials:

| Role       | Email                    | Password    |
|------------|--------------------------|-------------|
| Admin      | admin@college.edu        | password123 |
| Faculty    | faculty@college.edu      | password123 |
| Student    | student@college.edu      | password123 |
| Accountant | accountant@college.edu   | password123 |

## API overview

Dashboard endpoints:

- `GET /api/me?userId=`
- `GET /api/faculty/dashboard?id=`
- `GET /api/student/dashboard?id=`
- `GET /api/account/dashboard`

## Notes

Data is fully live from SQLite; no mock fallback remains in the dashboards.
