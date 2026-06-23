import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Role-Based Access Control (RBAC) component
 * Protects routes based on authentication status and user role
 */
export const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useSelector((s) => s.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { token, user } = useSelector((s) => s.auth);
  
  if (token && user) {
    return <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />;
  }
  
  return children;
};
