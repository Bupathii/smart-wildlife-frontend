/*
 * Display constants and formatters for the patrol monitoring screens.
 * Labels and thresholds are defined once here, never inside components.
 */

export const DEFAULT_PARK_ID = 'PK-YALA';

/** Used as the evaluator only when no signed-in user is available. */
export const DEMO_MANAGER_ID = 'PM-001';

export const REFRESH_INTERVAL_MS = 30_000;
export const COVERAGE_THRESHOLD_PERCENT = 40;
export const GOOD_COVERAGE_PERCENT = 70;
export const NOTES_MAX_LENGTH = 500;
export const NOTES_REQUIRED_AT_OR_BELOW = 2;
export const MAX_RATING = 5;

/** Status labels match the PatrolStatus enum exactly. */
export const PATROL_STATUS = {
  PLANNED: { label: 'Planned', badge: 'bg-slate-100 text-slate-700' },
  ACTIVE: { label: 'Active', badge: 'bg-emerald-100 text-emerald-800' },
  DELAYED: { label: 'Delayed', badge: 'bg-red-100 text-red-700' },
  ON_HOLD: { label: 'On Hold', badge: 'bg-amber-100 text-amber-800' },
  COMPLETED: { label: 'Completed', badge: 'bg-sky-100 text-sky-800' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-slate-200 text-slate-600' },
};

export const MAP_COLORS = {
  good: '#059669',
  medium: '#d97706',
  low: '#dc2626',
  route: '#0f766e',
  track: '#2563eb',
  online: '#059669',
  offline: '#6b7280',
};

/** Colour for a coverage percentage (map zones, bars, chart slices). */
export function coverageColor(percentage) {
  if (percentage < COVERAGE_THRESHOLD_PERCENT) return MAP_COLORS.low;
  if (percentage < GOOD_COVERAGE_PERCENT) return MAP_COLORS.medium;
  return MAP_COLORS.good;
}

/** "14:05" */
export function formatTime(value) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** "18 May 2026, 14:05" */
export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** 165 → "2h 45m" */
export function formatDuration(minutes) {
  if (minutes == null) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

/** "Thilina Perera, Kamal Fernando" */
export function rangerNames(patrol) {
  return patrol.rangers.map((ranger) => ranger.name).join(', ') || '—';
}

/** Local start / end of a yyyy-mm-dd day as ISO strings for the API. */
export function dayBoundary(dateText, endOfDay = false) {
  if (!dateText) return '';
  const time = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
  return new Date(`${dateText}${time}`).toISOString();
}

/* ----------------------------- Patrol routes ----------------------------- */

export const ROUTE_MIN_WAYPOINTS = 2;
export const ROUTE_NAME_MAX_LENGTH = 80;
export const ROUTE_DESCRIPTION_MAX_LENGTH = 300;

/** Roles that may create, edit and delete patrol routes. */
export const ROUTE_MANAGER_ROLES = ['PARK_MANAGER', 'ADMIN'];

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

/** Distance between two points in km (Haversine), for the live length preview. */
function distanceKm(from, to) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Length of a path of waypoints in km, to two decimals. */
export function pathLengthKm(points) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceKm(points[index - 1], points[index]);
  }
  return Math.round(total * 100) / 100;
}
