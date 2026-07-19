import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ role }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // If the user does not have the required role, redirect to home or unauthorized
    // For simplicity, we redirect to login, but you might want an unauthorized page.
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;