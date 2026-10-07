# Frontend — Smart Wildlife Conservation Web Dashboard

React + Vite web app for the office-side roles: Admin, Park Manager, Ranger Supervisor, Researcher, Community Liaison Officer. Rangers and Community Members use the [mobile app](../../mobile/smart-wildlife-mobile) instead — see role split below.

## Setup

```bash
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL if needed
npm run dev            # http://localhost:5173
```

Requires the [backend](../../backend/smart-wildlife-backend) running (default `http://localhost:5000/api`).

## Stack

- React 19 + React Router 6
- Axios (API client in `src/api/client.js`)
- Tailwind CSS
- Recharts (charts) — used in `ConflictAnalytics`
- Leaflet / React-Leaflet (maps)
- Auth/session stored in `localStorage` (`token`, `user`) — see `src/components/ProtectedRoute.jsx`

## Roles & access control

Role → allowed page keys is defined centrally in `src/config/roleAccess.js` (`ROLE_PAGES`), and must stay in sync with the backend's `src/constants/roles.js`.

| Role | Access |
|---|---|
| `ADMIN` | Everything, including `/conflicts/archived` and `/users` |
| `PARK_MANAGER` | Everything except archive/users |
| `RANGER_SUPERVISOR` | Dashboard, rangers, patrols, patrol-routes, incidents, conflicts, alerts, reports |
| `RESEARCHER` | Dashboard, incidents, conflicts, animals, camera-traps, reports |
| `COMMUNITY_LIAISON_OFFICER` | Dashboard, conflicts, alerts |
| `RANGER`, `COMMUNITY_MEMBER` | Mobile-only — `isMobileOnlyRole()` returns true, no web pages |

Route-level gating is done per-page via `<RoleRoute pageKey="...">` wrapping each route in `App.jsx`; `ProtectedRoute` handles the "must be logged in" check first.

## Structure

```
src/
  api/          # client.js (Axios instance + token header), conflicts.js (conflict-report calls)
  components/   # GlassField, GlassButton (login form), ProtectedRoute, RoleRoute, PlaceholderPage
  config/       # roleAccess.js — role → page-key matrix
  layouts/      # AuthLayout (glass login shell), DashboardLayout (sidebar nav, filtered by role)
  pages/        # Route-level pages (see status below)
  App.jsx       # All routes, grouped: public / protected+role-gated / default redirects
```

## Page status

Fully implemented:
- `Login`, `ForgotPassword`, `ResetPassword` — real auth flow against `/api/auth`
- `Dashboard` — summary cards (currently static placeholders, no live data wired yet)
- `ConflictReports`, `ConflictReportDetails`, `ArchivedConflictReports`, `ConflictAnalytics`, `Reports` — the conflict-report module, backed end-to-end by the API
- `Patrols` — **Monitor and Evaluate Ranger Patrol Activities** (Park Manager). `Patrols.jsx` holds the heading, tabs and nested routes: `/patrols` → `PatrolMonitoring` (dashboard, 30 s auto-refresh), `/patrols/filter` → `PatrolFilter`, `/patrols/completed` → `PatrolHistory`, `/patrols/:patrolId` → `PatrolDetails` (with `EvaluationForm`). Shared pieces: `components/PatrolMap.jsx` (Leaflet), `PatrolTable.jsx`, `PatrolWidgets.jsx` (badges, cards, loading / empty / error states), `api/patrols.js`, `hooks/usePatrolData.js` (loading + polling), `config/patrolUi.js` (labels, colours, formatters). Needs sample data: run `npm run seed:patrols` in the backend.
- `PatrolPlanning` (`/patrols/plan`, the "Plan Patrols" tab) — the Park Manager assigns rangers to a route for a time slot, and edits or cancels patrols that have not started. Rangers marked "Mobile app" are tracked by their phone once they start the patrol.
- `PatrolRoutes` — create, edit and delete patrol routes by clicking waypoints on the map (`components/RouteEditorMap.jsx`). Park Manager and Admin can change routes; Ranger Supervisor can only view. Routes used by patrols cannot be deleted, and their waypoints are locked while a patrol is active.

Not yet implemented (render via `PlaceholderPage`, no backing API):
- `Rangers`, `Incidents`, `Animals`, `RiskZones`, `Alerts`, `CameraTraps`, `Users`, `Settings`

When implementing one of these, the backend route/controller/model for it doesn't exist yet either — check the [backend README](../../backend/smart-wildlife-backend/README.md) status section first.
