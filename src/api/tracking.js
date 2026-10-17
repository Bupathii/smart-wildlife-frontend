import apiClient from './client';

export async function getTrackingAlerts() {
  const { data } = await apiClient.get('/tracking/alerts');
  return Array.isArray(data?.alerts) ? data.alerts : [];
}

export async function updateTrackingAlert(alertId, action) {
  if (action === 'acknowledge') {
    await apiClient.post(`/tracking/alerts/${alertId}/acknowledge`);
    return;
  }

  if (action === 'response') {
    await apiClient.put(`/tracking/alerts/${alertId}/response`, {
      responseType: 'INVESTIGATE',
      notes: 'Response initiated by dashboard ranger.',
    });
    return;
  }

  if (action === 'resolve') {
    await apiClient.put(`/tracking/alerts/${alertId}/resolve`, {
      notes: 'Resolved through dashboard action.',
    });
    return;
  }

  if (action === 'escalate') {
    await apiClient.put(`/tracking/alerts/${alertId}/escalate`, {
      notes: 'Escalated from dashboard.',
    });
  }
}
