import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Rangers from './pages/Rangers';
import Patrols from './pages/Patrols';
import PatrolRoutes from './pages/PatrolRoutes';
import Incidents from './pages/Incidents';
import Animals from './pages/Animals';
import RiskZones from './pages/RiskZones';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/rangers"
              element={
                <RoleRoute pageKey="rangers">
                  <Rangers />
                </RoleRoute>
              }
            />
            <Route
              path="/patrols"
              element={
                <RoleRoute pageKey="patrols">
                  <Patrols />
                </RoleRoute>
              }
            />
            <Route
              path="/patrol-routes"
              element={
                <RoleRoute pageKey="patrol-routes">
                  <PatrolRoutes />
                </RoleRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <RoleRoute pageKey="incidents">
                  <Incidents />
                </RoleRoute>
              }
            />
            <Route
              path="/animals"
              element={
                <RoleRoute pageKey="animals">
                  <Animals />
                </RoleRoute>
              }
            />
            <Route
              path="/risk-zones"
              element={
                <RoleRoute pageKey="risk-zones">
                  <RiskZones />
                </RoleRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <RoleRoute pageKey="alerts">
                  <Alerts />
                </RoleRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleRoute pageKey="reports">
                  <Reports />
                </RoleRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
