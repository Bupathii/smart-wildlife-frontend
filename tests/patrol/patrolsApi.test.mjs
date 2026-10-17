/*
 * Every patrol API call (src/api/patrols.js) goes to the right address with
 * the right data, and server errors are turned into readable messages.
 * The Axios client is replaced by tests/patrol/fakeApiClient.mjs.
 */
import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { calls, resetFakeClient, respondWith } from './fakeApiClient.mjs';
import * as api from '../../src/api/patrols.js';

beforeEach(() => resetFakeClient());

const lastCall = () => calls.at(-1);

test('the monitoring dashboard is read from /patrols/monitoring', async () => {
  respondWith(() => ({ data: { summary: { activePatrols: 4 } } }));

  const dashboard = await api.getMonitoringDashboard();

  assert.deepEqual(dashboard, { summary: { activePatrols: 4 } });
  assert.deepEqual(lastCall(), { method: 'get', url: '/patrols/monitoring', args: [] });
});

test('patrol filters are sent as query parameters, without empty values (AF1)', async () => {
  respondWith(() => ({ data: { count: 1, patrols: [] } }));

  await api.getPatrols({ rangerId: 'RN-005', routeId: '', status: 'DELAYED', from: null, to: undefined });
  await api.getPatrols();

  assert.deepEqual(calls[0], {
    method: 'get',
    url: '/patrols',
    args: [{ params: { rangerId: 'RN-005', status: 'DELAYED' } }],
  });
  assert.deepEqual(calls[1].args, [{ params: {} }]);
});

test('history, details and the park map use their own addresses', async () => {
  await api.getCompletedPatrols();
  await api.getPatrolDetails('PT-005');
  await api.getParkMap('PK-YALA');
  await api.getPatrolDetails('PT/../x');

  assert.deepEqual(
    calls.map(({ method, url }) => `${method} ${url}`),
    [
      'get /patrols/completed',
      'get /patrols/PT-005',
      'get /parks/PK-YALA/zones',
      'get /patrols/PT%2F..%2Fx',
    ],
    'ids are URL-encoded'
  );
});

test('an evaluation is saved with PUT on the patrol (AF4)', async () => {
  respondWith(() => ({ data: { updated: false, evaluation: { rating: 4 } } }));
  const evaluation = { rating: 4, notes: 'Good', evaluatedBy: 'PM-001' };

  const result = await api.savePatrolEvaluation('PT-006', evaluation);

  assert.equal(result.evaluation.rating, 4);
  assert.deepEqual(lastCall(), { method: 'put', url: '/patrols/PT-006/evaluation', args: [evaluation] });
});

test('rangers and the Retry button use the ranger endpoints (EX1)', async () => {
  respondWith(({ url }) =>
    url === '/rangers' ? { data: { rangers: [{ rangerId: 'RN-001' }] } } : { data: { trackingStatus: 'OFFLINE' } }
  );

  const rangers = await api.getRangers();
  const retried = await api.retryRangerLocation('RN-003');

  assert.deepEqual(rangers, [{ rangerId: 'RN-001' }], 'the list is unwrapped');
  assert.equal(retried.trackingStatus, 'OFFLINE');
  assert.equal(lastCall().url, '/rangers/RN-003/location');
});

test('routes are listed, created, edited and deleted under the park', async () => {
  respondWith(({ method }) => (method === 'get' ? { data: { routes: [{ routeId: 'RT-001' }] } } : { data: { routeId: 'RT-005' } }));
  const route = { name: 'Loop', description: '', waypoints: [] };

  const routes = await api.getRoutes('PK-YALA');
  const created = await api.createRoute('PK-YALA', route);
  await api.updateRoute('PK-YALA', 'RT-005', route);
  const deleted = await api.deleteRoute('PK-YALA', 'RT-005');

  assert.deepEqual(routes, [{ routeId: 'RT-001' }]);
  assert.equal(created.routeId, 'RT-005');
  assert.equal(deleted, undefined);
  assert.deepEqual(
    calls.map(({ method, url }) => `${method} ${url}`),
    [
      'get /parks/PK-YALA/routes',
      'post /parks/PK-YALA/routes',
      'put /parks/PK-YALA/routes/RT-005',
      'delete /parks/PK-YALA/routes/RT-005',
    ]
  );
  assert.deepEqual(calls[1].args, [route]);
});

test('patrols are planned, changed and cancelled', async () => {
  respondWith(() => ({ data: { patrolId: 'PT-009', status: 'PLANNED' } }));
  const plan = { routeId: 'RT-004', rangerIds: ['RN-007'], startTime: 's', endTime: 'e' };

  const created = await api.createPatrol(plan);
  await api.updatePatrol('PT-009', plan);
  await api.cancelPatrol('PT-009');

  assert.equal(created.patrolId, 'PT-009');
  assert.deepEqual(
    calls.map(({ method, url, args }) => [method, url, args[0]]),
    [
      ['post', '/patrols', plan],
      ['put', '/patrols/PT-009', plan],
      ['post', '/patrols/PT-009/cancel', undefined],
    ]
  );
});

test('a failed request is passed on to the screen', async () => {
  const failure = new Error('Network Error');
  respondWith(() => {
    throw failure;
  });

  await assert.rejects(() => api.getMonitoringDashboard(), failure);
});

test('server errors become a message plus field errors (EX4, EX5)', () => {
  const validation = {
    response: {
      data: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Evaluation is not valid',
          fields: { notes: 'Notes are required when the rating is 2 or lower' },
        },
      },
    },
  };
  const otherModule = { response: { data: { message: 'Not authenticated' } } };
  const noAnswer = new Error('Network Error');

  assert.deepEqual(api.readApiError(validation), {
    message: 'Evaluation is not valid',
    fields: { notes: 'Notes are required when the rating is 2 or lower' },
  });
  assert.deepEqual(api.readApiError({ response: { data: { error: { message: 'Patrol PT-999 was not found' } } } }), {
    message: 'Patrol PT-999 was not found',
    fields: {},
  });
  assert.deepEqual(api.readApiError(otherModule), { message: 'Not authenticated', fields: {} });
  assert.deepEqual(api.readApiError(noAnswer), {
    message: 'Unable to reach the server. Please try again.',
    fields: {},
  });
  assert.deepEqual(api.readApiError(undefined).fields, {});
});
