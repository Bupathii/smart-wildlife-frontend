import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

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
import ConflictReports from './pages/ConflictReports';
import Animals from './pages/Animals';
import RiskZones from './pages/RiskZones';
import Alerts from './pages/Alerts';
import CameraTraps from './pages/CameraTraps';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';

function RolePage({
  pageKey,
  children,
}) {
  return (
    <RoleRoute pageKey={pageKey}>
      {children}
    </RoleRoute>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Protected */}

        <Route element={<ProtectedRoute />}>
          <Route
            element={<DashboardLayout />}
          >
            <Route
              path="/dashboard"
              element={
                <RolePage pageKey="dashboard">
                  <Dashboard />
                </RolePage>
              }
            />

            <Route
              path="/rangers"
              element={
                <RolePage pageKey="rangers">
                  <Rangers />
                </RolePage>
              }
            />

            <Route
              path="/patrols"
              element={
                <RolePage pageKey="patrols">
                  <Patrols />
                </RolePage>
              }
            />

            <Route
              path="/patrol-routes"
              element={
                <RolePage pageKey="patrol-routes">
                  <PatrolRoutes />
                </RolePage>
              }
            />

            <Route
              path="/incidents"
              element={
                <RolePage pageKey="incidents">
                  <Incidents />
                </RolePage>
              }
            />

            <Route
              path="/conflicts"
              element={
                <RolePage pageKey="conflicts">
                  <ConflictReports />
                </RolePage>
              }
            />

            <Route
              path="/animals"
              element={
                <RolePage pageKey="animals">
                  <Animals />
                </RolePage>
              }
            />

            <Route
              path="/risk-zones"
              element={
                <RolePage pageKey="risk-zones">
                  <RiskZones />
                </RolePage>
              }
            />

            <Route
              path="/alerts"
              element={
                <RolePage pageKey="alerts">
                  <Alerts />
                </RolePage>
              }
            />

            <Route
              path="/camera-traps"
              element={
                <RolePage pageKey="camera-traps">
                  <CameraTraps />
                </RolePage>
              }
            />

            <Route
              path="/reports"
              element={
                <RolePage pageKey="reports">
                  <Reports />
                </RolePage>
              }
            />

            <Route
              path="/users"
              element={
                <RolePage pageKey="users">
                  <Users />
                </RolePage>
              }
            />

            <Route
              path="/settings"
              element={
                <RolePage pageKey="settings">
                  <Settings />
                </RolePage>
              }
            />
          </Route>
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;