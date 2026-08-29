# Frontend - College Management System

This is the React frontend for the College Management System.

## Features
- Role-based authentication (Student, Faculty, Admin, Accountant)
- Protected routes based on user role
- Dashboard pages that fetch live data from the backend API via React Query (TanStack Query), with loading skeletons and error/retry states
- Data fetching via React Query with caching, loading and error states
- Bootstrap styling
- Axios for HTTP requests

## Getting Started
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. The application will be available at `http://localhost:5173`

## API Integration
The frontend communicates with a C++ backend running on `http://localhost:8080/api`.
If the backend is unavailable, dashboards show a real error state with a Retry button — they do NOT fall back to mock data.

## Project Structure
- `src/components/layout/Navbar.jsx` - Role-based navigation bar
- `src/components/PrivateRoute.jsx` - Route protection based on user role
- `src/pages/Login.jsx` - Login page (calls `/api/login`)
- `src/pages/student/Dashboard.jsx` - Student dashboard (fetches student data)
- `src/pages/faculty/Dashboard.jsx` - Faculty dashboard (fetches faculty data)
- `src/pages/AdminDashboard.jsx` - Admin dashboard (placeholder)
- `src/pages/AccountantDashboard.jsx` - Accountant dashboard (placeholder)
- `src/context/AuthContext.jsx` - Authentication context (user, login, logout)
- `src/services/api.js` - Axios instance configured for the API

## Notes
- The login form accepts any credentials; the backend should validate them.
- In development, if the backend is not running, dashboards show an error state with a Retry action instead of mock data.
- To use real data, ensure the backend server is running on `http://localhost:8080`.
