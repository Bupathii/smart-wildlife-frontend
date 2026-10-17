/*
 * Form rules and data helpers for the patrol screens. They live here, not
 * inside the components, so the screens only draw the UI (SOLID-S) and the
 * rules can be unit tested without a browser.
 */

import {
  NOTES_MAX_LENGTH,
  NOTES_REQUIRED_AT_OR_BELOW,
  OPEN_PATROL_STATUSES,
  PATROL_DEFAULT_DURATION_HOURS,
  ROUTE_MIN_WAYPOINTS,
  toDateTimeInput,
} from '../config/patrolUi.js';

const HOUR_MS = 3_600_000;

/**
 * Evaluation form (AF4): the same rules the server applies, so mistakes
 * show immediately.
 * @param {number} rating 0 when no star is chosen
 * @param {string} notes
 * @returns {{ rating?: string, notes?: string }} field → message; empty when valid
 */
export function validateEvaluation(rating, notes) {
  const errors = {};
  if (!rating) errors.rating = 'Rating is required';
  if (notes.length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer`;
  } else if (rating && rating <= NOTES_REQUIRED_AT_OR_BELOW && notes.trim() === '') {
    errors.notes = `Notes are required when the rating is ${NOTES_REQUIRED_AT_OR_BELOW} or lower`;
  }
  return errors;
}

/**
 * Route form: a name and at least two waypoints.
 * @param {{ name: string, waypoints: object[] }} draft
 * @returns {{ name?: string, waypoints?: string }} field → message; empty when valid
 */
export function validateRouteDraft(draft) {
  const errors = {};
  if (draft.name.trim() === '') errors.name = 'Route name is required';
  if (draft.waypoints.length < ROUTE_MIN_WAYPOINTS) {
    errors.waypoints = `A route needs at least ${ROUTE_MIN_WAYPOINTS} waypoints`;
  }
  return errors;
}

/**
 * A blank route form, or a copy of an existing route ready to edit.
 * Waypoints of a route a patrol is using are locked.
 * @param {object|null} route
 */
export function routeToDraft(route) {
  return {
    routeId: route?.routeId ?? null,
    name: route?.name ?? '',
    description: route?.description ?? '',
    waypoints: (route?.waypoints ?? []).map(({ latitude, longitude }) => ({ latitude, longitude })),
    locked: Boolean(route?.hasActivePatrol),
  };
}

/**
 * A blank patrol plan starting in 30 minutes for the default duration, or
 * a copy of a planned patrol ready to edit.
 * @param {object|null} patrol
 * @param {Date} [now]
 */
export function planToDraft(patrol, now = new Date()) {
  const start = patrol ? new Date(patrol.startTime) : new Date(now.getTime() + HOUR_MS / 2);
  const end = patrol
    ? new Date(patrol.endTime)
    : new Date(start.getTime() + PATROL_DEFAULT_DURATION_HOURS * HOUR_MS);

  return {
    patrolId: patrol?.patrolId ?? null,
    routeId: patrol?.route.routeId ?? '',
    rangerIds: patrol?.rangers.map((ranger) => ranger.rangerId) ?? [],
    startTime: toDateTimeInput(start),
    endTime: toDateTimeInput(end),
  };
}

/**
 * Which patrol (planned or in the field) each ranger is already on, so the
 * plan form can grey them out. The patrol being edited is ignored.
 * @param {object[]} patrols
 * @param {string|null} ownPatrolId
 * @returns {Object<string, string>} rangerId → patrolId
 */
export function findBusyRangers(patrols, ownPatrolId) {
  const busy = {};
  patrols
    .filter((patrol) => OPEN_PATROL_STATUSES.includes(patrol.status))
    .filter((patrol) => patrol.patrolId !== ownPatrolId)
    .forEach((patrol) => {
      patrol.rangers.forEach((ranger) => {
        busy[ranger.rangerId] = patrol.patrolId;
      });
    });
  return busy;
}
