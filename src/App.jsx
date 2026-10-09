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
import ConflictReportDetails from './pages/ConflictReportDetails';
import ArchivedConflictReports from './pages/ArchivedConflictReports';

import Animals from './pages/Animals';
import RiskZones from './pages/RiskZones';
import Alerts from './pages/Alerts';
import CameraTraps from './pages/CameraTraps';

import Reports from './pages/Reports';
import ConflictAnalytics from './pages/ConflictAnalytics';

import Users from './pages/Users';
import Settings from './pages/Settings';

function RolePage({
  pageKey,
  children,
}) {
  return (
    <RoleRoute
      pageKey={
        pageKey
      }
    >
      {children}
    </RoleRoute>
  );
}

function App() {
  return (
    <Router>
      <Routes>

        {/* =========================
            PUBLIC
        ========================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />

        <Route
          path="/reset-password/:token"
          element={
            <ResetPassword />
          }
        />

        {/* =========================
            PROTECTED
        ========================== */}

        <Route
          element={
            <ProtectedRoute />
          }
        >
          <Route
            element={
              <DashboardLayout />
            }
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
              path="/patrols/*"
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

            {/* =====================
                CONFLICT REPORTS
            ====================== */}

            <Route
              path="/conflicts"
              element={
                <RolePage pageKey="conflicts">
                  <ConflictReports />
                </RolePage>
              }
            />

            {/*
             * Keep archived route
             * separate and ADMIN only.
             */}
            <Route
              path="/conflicts/archived"
              element={
                <RolePage pageKey="conflict-archive">
                  <ArchivedConflictReports />
                </RolePage>
              }
            />

            <Route
              path="/conflicts/:id"
              element={
                <RolePage pageKey="conflicts">
                  <ConflictReportDetails />
                </RolePage>
              }
            />

            {/* =====================
                OTHER MODULES
            ====================== */}

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

            {/* =====================
                REPORTS
            ====================== */}

            <Route
              path="/reports"
              element={
                <RolePage pageKey="reports">
                  <Reports />
                </RolePage>
              }
            />

            <Route
              path="/reports/conflicts"
              element={
                <RolePage pageKey="reports">
                  <ConflictAnalytics />
                </RolePage>
              }
            />

            {/* =====================
                ADMIN
            ====================== */}

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

        {/* DEFAULT */}

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