# College Management System

A college management system built with:
- Frontend: React (Vite)
- Backend: C++ (Object-Oriented Design) with SQLite and Crow (REST API)

## Project Structure

- `frontend/` - React application
- `backend/` - C++ backend

## Getting Started

### Backend

#### Prerequisites
- C++17 compiler (g++ or clang++)
- SQLite3 development libraries
- SQLiteCpp (header-only library)

#### Building the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Compile the source code:
   ```bash
   g++ -std=c++17 -Isrc/includes src/main.cpp src/Person.cpp src/Student.cpp src/Faculty.cpp src/Accountant.cpp src/Course.cpp src/Database.cpp -lsqlite3 -o main
   ```

   Note: If SQLiteCpp is not in your system's include path, you may need to add its include directory with `-I/path/to/SQLiteCpp/include`.

3. Run the executable:
   ```bash
   ./main
   ```

   This will initialize the database (creates `college.db` in the current directory) and create the necessary tables.

### Frontend

#### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

#### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`.

## Features

### Backend (C++)
- Object-oriented design with inheritance and polymorphism
- Encapsulation with private data and public accessors/mutators
- Operator overloading for GPA comparison in Student class
- SQLite database integration via SQLiteCpp
- Schema includes tables for persons, students, faculty, accountants, courses, prerequisites, and enrollments

### Frontend (React)
- Role-based routing (Student, Faculty, Admin, Accountant)
- Mock login functionality (stores user role in localStorage)
- Responsive layout with Bootstrap
- Placeholder dashboards for each role

## Next Steps

1. Implement Crow REST API endpoints for authentication and student management.
2. Connect the frontend to the backend APIs using Axios.
3. Implement additional modules: course management, enrollment, timetable, attendance, exams, and fee management.
4. Add real data persistence by connecting the frontend to the backend API.

## License

This project is for educational purposes.
