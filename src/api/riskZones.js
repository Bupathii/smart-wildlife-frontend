import apiClient from './client';

export async function getRiskZones() {
  const { data } = await apiClient.get('/risk-zones');
  return data;
}

export async function createRiskZone(payload) {
  const { data } = await apiClient.post('/risk-zones', payload);
  return data;
}

export async function updateRiskZone(zoneId, payload) {
  const { data } = await apiClient.put(`/risk-zones/${encodeURIComponent(zoneId)}`, payload);
  return data;
}

export async function deleteRiskZone(zoneId) {
  const { data } = await apiClient.delete(`/risk-zones/${encodeURIComponent(zoneId)}`);
  return data;
}
