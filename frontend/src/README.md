# Frontend - College Management System

This is the React frontend for the College Management System.

## Features
- Role-based authentication (Student, Faculty, Admin, Accountant)
- Protected routes based on user role
- Dashboard pages that fetch data from the backend API (with fallback to mock data for development)
- Bootstrap styling
- Axios for HTTP requests

## Getting Started
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. The application will be available at `http://localhost:5173`

## API Integration
The frontend communicates with a C++ backend running on `http://localhost:8080/api`.
If the backend is not available, the frontend will fall back to mock data to allow development to continue.

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
- In development, if the backend is not running, mock data is used.
- To use real data, ensure the backend server is running on `http://localhost:8080`.
