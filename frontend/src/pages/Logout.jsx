import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

function Logout() {
  const { logout } = useAuth();
  logout();
  return <Navigate to="/login" replace />;
}

export default Logout;
