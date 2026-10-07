import apiClient from './client';

/*
 * API calls for "Monitor and Evaluate Ranger Patrol Activities".
 * Every screen goes through these functions, so URLs live in one place
 * (no duplicate code) and components never call axios directly.
 */

/** Removes empty filter values so they are not sent as blank parameters. */
function withoutBlanks(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null)
  );
}

/** Dashboard: active patrols, locations, progress, coverage, alerts. */
export async function getMonitoringDashboard() {
  const { data } = await apiClient.get('/patrols/monitoring');
  return data;
}

/** Filtered list of patrols (AF1). */
export async function getPatrols(filters = {}) {
  const { data } = await apiClient.get('/patrols', { params: withoutBlanks(filters) });
  return data;
}

/** Completed patrol history with statistics (AF2). */
export async function getCompletedPatrols() {
  const { data } = await apiClient.get('/patrols/completed');
  return data;
}

/** Everything about one patrol. */
export async function getPatrolDetails(patrolId) {
  const { data } = await apiClient.get(`/patrols/${encodeURIComponent(patrolId)}`);
  return data;
}

/** Records or updates the evaluation of a completed patrol (AF4). */
export async function savePatrolEvaluation(patrolId, evaluation) {
  const { data } = await apiClient.put(
    `/patrols/${encodeURIComponent(patrolId)}/evaluation`,
    evaluation
  );
  return data;
}

/** Zones and routes drawn on the map. */
export async function getParkMap(parkId) {
  const { data } = await apiClient.get(`/parks/${encodeURIComponent(parkId)}/zones`);
  return data;
}

/** Rangers for the filter dropdown. */
export async function getRangers() {
  const { data } = await apiClient.get('/rangers');
  return data.rangers;
}

/** Re-queries the GPS service for one ranger (Retry button). */
export async function retryRangerLocation(rangerId) {
  const { data } = await apiClient.get(`/rangers/${encodeURIComponent(rangerId)}/location`);
  return data;
}

/** The message and field errors the server sent, in one predictable shape. */
export function readApiError(error) {
  const serverError = error?.response?.data?.error;
  return {
    message:
      serverError?.message ||
      error?.response?.data?.message ||
      'Unable to reach the server. Please try again.',
    fields: serverError?.fields || {},
  };
}

/* ----------------------------- Patrol routes ----------------------------- */

/** Routes of a park, each with how many patrols use it. */
export async function getRoutes(parkId) {
  const { data } = await apiClient.get(`/parks/${encodeURIComponent(parkId)}/routes`);
  return data.routes;
}

/** Creates a route from { name, description, waypoints }. */
export async function createRoute(parkId, route) {
  const { data } = await apiClient.post(`/parks/${encodeURIComponent(parkId)}/routes`, route);
  return data;
}

/** Replaces the name, description and waypoints of a route. */
export async function updateRoute(parkId, routeId, route) {
  const { data } = await apiClient.put(
    `/parks/${encodeURIComponent(parkId)}/routes/${encodeURIComponent(routeId)}`,
    route
  );
  return data;
}

/** Deletes a route that no patrol uses. */
export async function deleteRoute(parkId, routeId) {
  await apiClient.delete(
    `/parks/${encodeURIComponent(parkId)}/routes/${encodeURIComponent(routeId)}`
  );
}
