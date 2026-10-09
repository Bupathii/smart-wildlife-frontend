import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

/* ─── apiClient mock (same pattern as conflicts.api.test.js) ───────── */

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get:   vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock(
  '../src/api/client',
  () => ({ default: apiClientMock })
);

import {
  getIncidentReports,
  updateIncidentStatus,
} from '../src/api/incidents';

/* ─── shared test data ─────────────────────────────────────────────── */

function makeReport(overrides = {}) {
  return {
    _id: '64b64c1f1c2d3e4f5a6b7c8f',
    incidentType: 'POACHING',
    description: 'Trap found near river',
    severity: 'HIGH',
    incidentStatus: 'SUBMITTED',
    location: { source: 'GPS', latitude: 7.8731, longitude: 80.7718 },
    evidence: [],
    ranger: { name: 'Ranger A', email: 'a@park.lk' },
    createdAt: '2026-10-09T18:00:00.000Z',
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════
   getIncidentReports
   ═══════════════════════════════════════════════════════════ */

describe(
  'incidents API — getIncidentReports',
  () => {
    beforeEach(() => {
      apiClientMock.get.mockReset();
    });

    test(
      'calls GET /incidents with no extra params by default',
      async () => {
        apiClientMock.get.mockResolvedValue({
          data: { reports: [], total: 0, page: 1, pages: 1 },
        });

        await getIncidentReports();

        const [url, config] = apiClientMock.get.mock.calls[0];

        expect(url).toBe('/incidents');
        // Default page=1 and limit=10 should be in params
        expect(config.params.page).toBe(1);
        expect(config.params.limit).toBe(10);
      }
    );

    test(
      'forwards incidentType filter when provided',
      async () => {
        apiClientMock.get.mockResolvedValue({
          data: { reports: [], total: 0, page: 1, pages: 1 },
        });

        await getIncidentReports({ incidentType: 'POACHING' });

        const [, config] = apiClientMock.get.mock.calls[0];
        expect(config.params.incidentType).toBe('POACHING');
      }
    );

    test(
      'forwards incidentStatus filter when provided',
      async () => {
        apiClientMock.get.mockResolvedValue({
          data: { reports: [], total: 0, page: 1, pages: 1 },
        });

        await getIncidentReports({ incidentStatus: 'UNDER_REVIEW' });

        const [, config] = apiClientMock.get.mock.calls[0];
        expect(config.params.incidentStatus).toBe('UNDER_REVIEW');
      }
    );

    test(
      'forwards severity filter when provided',
      async () => {
        apiClientMock.get.mockResolvedValue({
          data: { reports: [], total: 0, page: 1, pages: 1 },
        });

        await getIncidentReports({ severity: 'HIGH' });

        const [, config] = apiClientMock.get.mock.calls[0];
        expect(config.params.severity).toBe('HIGH');
      }
    );

    test(
      'omits empty string filters from params',
      async () => {
        apiClientMock.get.mockResolvedValue({
          data: { reports: [], total: 0, page: 1, pages: 1 },
        });

        await getIncidentReports({
          incidentType: '',
          incidentStatus: '',
          severity: '',
        });

        const [, config] = apiClientMock.get.mock.calls[0];
        expect(config.params.incidentType).toBeUndefined();
        expect(config.params.incidentStatus).toBeUndefined();
        expect(config.params.severity).toBeUndefined();
      }
    );

    test(
      'forwards custom page and limit',
      async () => {
        apiClientMock.get.mockResolvedValue({
          data: { reports: [], total: 0, page: 3, pages: 10 },
        });

        await getIncidentReports({ page: 3, limit: 5 });

        const [, config] = apiClientMock.get.mock.calls[0];
        expect(config.params.page).toBe(3);
        expect(config.params.limit).toBe(5);
      }
    );

    test(
      'returns the full data object from the response',
      async () => {
        const reports = [makeReport(), makeReport({ _id: '64b64c1f1c2d3e4f5a6b7c90' })];
        apiClientMock.get.mockResolvedValue({
          data: { reports, total: 2, page: 1, pages: 1 },
        });

        const result = await getIncidentReports();

        expect(result.reports).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.pages).toBe(1);
      }
    );

    test(
      'propagates axios error when request fails',
      async () => {
        apiClientMock.get.mockRejectedValue(new Error('Network Error'));

        await expect(getIncidentReports()).rejects.toThrow('Network Error');
      }
    );
  }
);

/* ═══════════════════════════════════════════════════════════
   updateIncidentStatus
   ═══════════════════════════════════════════════════════════ */

describe(
  'incidents API — updateIncidentStatus',
  () => {
    beforeEach(() => {
      apiClientMock.patch.mockReset();
    });

    test(
      'calls PATCH /incidents/:id/status with the new status',
      async () => {
        const updated = makeReport({ incidentStatus: 'UNDER_REVIEW' });
        apiClientMock.patch.mockResolvedValue({
          data: { success: true, report: updated },
        });

        const result = await updateIncidentStatus(
          '64b64c1f1c2d3e4f5a6b7c8f',
          'UNDER_REVIEW'
        );

        const [url, body] = apiClientMock.patch.mock.calls[0];

        expect(url).toBe('/incidents/64b64c1f1c2d3e4f5a6b7c8f/status');
        expect(body).toEqual({ incidentStatus: 'UNDER_REVIEW' });
        expect(result.success).toBe(true);
        expect(result.report.incidentStatus).toBe('UNDER_REVIEW');
      }
    );

    test(
      'sends SUBMITTED status correctly',
      async () => {
        apiClientMock.patch.mockResolvedValue({
          data: { success: true, report: makeReport({ incidentStatus: 'SUBMITTED' }) },
        });

        await updateIncidentStatus('64b64c1f1c2d3e4f5a6b7c8f', 'SUBMITTED');

        const [, body] = apiClientMock.patch.mock.calls[0];
        expect(body.incidentStatus).toBe('SUBMITTED');
      }
    );

    test(
      'sends RESOLVED status correctly',
      async () => {
        apiClientMock.patch.mockResolvedValue({
          data: { success: true, report: makeReport({ incidentStatus: 'RESOLVED' }) },
        });

        await updateIncidentStatus('64b64c1f1c2d3e4f5a6b7c8f', 'RESOLVED');

        const [, body] = apiClientMock.patch.mock.calls[0];
        expect(body.incidentStatus).toBe('RESOLVED');
      }
    );

    test(
      'returns the updated report from the response',
      async () => {
        const updated = makeReport({ incidentStatus: 'RESOLVED' });
        apiClientMock.patch.mockResolvedValue({
          data: { success: true, report: updated },
        });

        const result = await updateIncidentStatus(
          updated._id,
          'RESOLVED'
        );

        expect(result.report._id).toBe(updated._id);
        expect(result.report.incidentStatus).toBe('RESOLVED');
      }
    );

    test(
      'propagates 400 error from server (invalid status)',
      async () => {
        const err = Object.assign(new Error('Bad Request'), {
          response: { status: 400, data: { message: 'Invalid status' } },
        });
        apiClientMock.patch.mockRejectedValue(err);

        await expect(
          updateIncidentStatus('64b64c1f1c2d3e4f5a6b7c8f', 'BAD_VALUE')
        ).rejects.toThrow('Bad Request');
      }
    );

    test(
      'propagates 403 error when user lacks permission',
      async () => {
        const err = Object.assign(new Error('Forbidden'), {
          response: { status: 403 },
        });
        apiClientMock.patch.mockRejectedValue(err);

        await expect(
          updateIncidentStatus('64b64c1f1c2d3e4f5a6b7c8f', 'RESOLVED')
        ).rejects.toThrow('Forbidden');
      }
    );

    test(
      'propagates 404 error when report is not found',
      async () => {
        const err = Object.assign(new Error('Not Found'), {
          response: { status: 404 },
        });
        apiClientMock.patch.mockRejectedValue(err);

        await expect(
          updateIncidentStatus('nonexistent-id', 'RESOLVED')
        ).rejects.toThrow('Not Found');
      }
    );

    test(
      'propagates network error',
      async () => {
        apiClientMock.patch.mockRejectedValue(new Error('Network Error'));

        await expect(
          updateIncidentStatus('64b64c1f1c2d3e4f5a6b7c8f', 'UNDER_REVIEW')
        ).rejects.toThrow('Network Error');
      }
    );
  }
);
