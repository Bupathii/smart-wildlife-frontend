import { Navigate } from 'react-router-dom';
import { canAccessPage, getCurrentUser } from '../config/roleAccess';

function RoleRoute({ pageKey, children }) {
  const user = getCurrentUser();

  if (!canAccessPage(user?.role, pageKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleRoute;
