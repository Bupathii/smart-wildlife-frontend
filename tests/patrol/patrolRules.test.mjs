/*
 * Form rules and helpers behind the Evaluation form, the Patrol Routes page
 * and the Plan Patrols page (src/utils/patrolRules.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  findBusyRangers,
  planToDraft,
  routeToDraft,
  validateEvaluation,
  validateRouteDraft,
} from '../../src/utils/patrolRules.js';

/* ------------------------------ Evaluation (AF4) ------------------------- */

test('an evaluation with a rating and notes is valid', () => {
  assert.deepEqual(validateEvaluation(4, 'Thorough patrol.'), {});
  assert.deepEqual(validateEvaluation(5, ''), {}, 'notes are optional above 2 stars');
  assert.deepEqual(validateEvaluation(3, ''), {});
});

test('a rating is required (EX5)', () => {
  assert.deepEqual(validateEvaluation(0, 'Some notes'), { rating: 'Rating is required' });
  assert.deepEqual(validateEvaluation(undefined, ''), { rating: 'Rating is required' });
});

test('a rating of 2 or lower needs notes; spaces do not count', () => {
  const needed = { notes: 'Notes are required when the rating is 2 or lower' };

  assert.deepEqual(validateEvaluation(2, ''), needed);
  assert.deepEqual(validateEvaluation(1, '   '), needed);
  assert.deepEqual(validateEvaluation(2, 'Left the route early.'), {});
});

test('notes may be 500 characters but not 501', () => {
  assert.deepEqual(validateEvaluation(4, 'a'.repeat(500)), {});
  assert.deepEqual(validateEvaluation(4, 'a'.repeat(501)), {
    notes: 'Notes must be 500 characters or fewer',
  });
  assert.deepEqual(validateEvaluation(0, 'a'.repeat(501)), {
    rating: 'Rating is required',
    notes: 'Notes must be 500 characters or fewer',
  });
});

/* ----------------------------- Patrol routes ----------------------------- */

const point = (latitude, longitude) => ({ latitude, longitude });

test('a route needs a name and at least two waypoints', () => {
  assert.deepEqual(validateRouteDraft({ name: 'Loop', waypoints: [point(6.4, 81.4), point(6.41, 81.42)] }), {});
  assert.deepEqual(validateRouteDraft({ name: '  ', waypoints: [point(6.4, 81.4)] }), {
    name: 'Route name is required',
    waypoints: 'A route needs at least 2 waypoints',
  });
  assert.deepEqual(validateRouteDraft({ name: 'Loop', waypoints: [] }), {
    waypoints: 'A route needs at least 2 waypoints',
  });
});

test('a new route starts as an empty, unlocked form', () => {
  assert.deepEqual(routeToDraft(null), {
    routeId: null,
    name: '',
    description: '',
    waypoints: [],
    locked: false,
  });
});

test('editing a route copies only what the form needs and locks it while in use', () => {
  const route = {
    routeId: 'RT-001',
    name: 'Block 1 North Circuit',
    description: 'Northern loop',
    waypoints: [{ latitude: 6.41, longitude: 81.395, timestamp: null, source: 'MANUAL' }],
    hasActivePatrol: true,
    patrolCount: 3,
  };

  const draft = routeToDraft(route);

  assert.deepEqual(draft, {
    routeId: 'RT-001',
    name: 'Block 1 North Circuit',
    description: 'Northern loop',
    waypoints: [{ latitude: 6.41, longitude: 81.395 }],
    locked: true,
  });
  draft.waypoints.push(point(1, 1));
  assert.equal(route.waypoints.length, 1, 'the original route is not changed');
  assert.equal(routeToDraft({ ...route, hasActivePatrol: false }).locked, false);
});

/* ---------------------------- Patrol planning ---------------------------- */

test('a new plan starts in 30 minutes and lasts the default 4 hours', () => {
  const now = new Date(2026, 4, 18, 9, 0);

  assert.deepEqual(planToDraft(null, now), {
    patrolId: null,
    routeId: '',
    rangerIds: [],
    startTime: '2026-05-18T09:30',
    endTime: '2026-05-18T13:30',
  });
  assert.match(planToDraft(null).startTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'uses the clock by default');
});

test('editing a planned patrol fills the form from it', () => {
  const patrol = {
    patrolId: 'PT-009',
    route: { routeId: 'RT-004' },
    rangers: [{ rangerId: 'RN-007' }, { rangerId: 'RN-008' }],
    startTime: new Date(2026, 4, 18, 10, 0).toISOString(),
    endTime: new Date(2026, 4, 18, 15, 15).toISOString(),
  };

  assert.deepEqual(planToDraft(patrol), {
    patrolId: 'PT-009',
    routeId: 'RT-004',
    rangerIds: ['RN-007', 'RN-008'],
    startTime: '2026-05-18T10:00',
    endTime: '2026-05-18T15:15',
  });
});

test('rangers on a planned or active patrol are busy; finished patrols free them', () => {
  const patrol = (patrolId, status, rangerIds) => ({
    patrolId,
    status,
    rangers: rangerIds.map((rangerId) => ({ rangerId })),
  });
  const patrols = [
    patrol('PT-001', 'ACTIVE', ['RN-001']),
    patrol('PT-004', 'DELAYED', ['RN-005']),
    patrol('PT-002', 'ON_HOLD', ['RN-002', 'RN-006']),
    patrol('PT-009', 'PLANNED', ['RN-007']),
    patrol('PT-005', 'COMPLETED', ['RN-004']),
    patrol('PT-010', 'CANCELLED', ['RN-008']),
  ];

  assert.deepEqual(findBusyRangers(patrols, null), {
    'RN-001': 'PT-001',
    'RN-005': 'PT-004',
    'RN-002': 'PT-002',
    'RN-006': 'PT-002',
    'RN-007': 'PT-009',
  });
  assert.equal(
    findBusyRangers(patrols, 'PT-009')['RN-007'],
    undefined,
    'the patrol being edited does not block its own rangers'
  );
  assert.deepEqual(findBusyRangers([], null), {});
});
