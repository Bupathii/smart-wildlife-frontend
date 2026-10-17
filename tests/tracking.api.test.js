import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../src/api/client', () => ({ default: apiClientMock }));

import {
  getTrackingAlerts,
  updateTrackingAlert,
} from '../src/api/tracking';

describe('tracking alert API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads alert records from the tracking endpoint', async () => {
    const alerts = [{ alertId: 'ALT001', priority: 'HIGH', status: 'ACTIVE' }];
    apiClientMock.get.mockResolvedValue({ data: { alerts } });

    await expect(getTrackingAlerts()).resolves.toEqual(alerts);
    expect(apiClientMock.get).toHaveBeenCalledWith('/tracking/alerts');
  });

  test('returns an empty list when the server response has no alerts', async () => {
    apiClientMock.get.mockResolvedValue({ data: {} });

    await expect(getTrackingAlerts()).resolves.toEqual([]);
  });

  test.each([
    ['acknowledge', 'post', '/tracking/alerts/ALT001/acknowledge', undefined],
    [
      'response',
      'put',
      '/tracking/alerts/ALT001/response',
      {
        responseType: 'INVESTIGATE',
        notes: 'Response initiated by dashboard ranger.',
      },
    ],
    [
      'resolve',
      'put',
      '/tracking/alerts/ALT001/resolve',
      { notes: 'Resolved through dashboard action.' },
    ],
    [
      'escalate',
      'put',
      '/tracking/alerts/ALT001/escalate',
      { notes: 'Escalated from dashboard.' },
    ],
  ])('sends the %s alert action', async (action, method, url, body) => {
    await updateTrackingAlert('ALT001', action);

    if (body === undefined) {
      expect(apiClientMock[method]).toHaveBeenCalledWith(url);
    } else {
      expect(apiClientMock[method]).toHaveBeenCalledWith(url, body);
    }
  });

  test('does not call the API for an unknown action', async () => {
    await updateTrackingAlert('ALT001', 'unknown');

    expect(apiClientMock.get).not.toHaveBeenCalled();
    expect(apiClientMock.post).not.toHaveBeenCalled();
    expect(apiClientMock.put).not.toHaveBeenCalled();
  });
});
