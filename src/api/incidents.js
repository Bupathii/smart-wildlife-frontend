import apiClient from './client';

/*
 * =====================================================
 * INCIDENT REPORTS — supervisory view
 * =====================================================
 */

/**
 * Fetch all incident reports (ADMIN / PARK_MANAGER / RANGER_SUPERVISOR / RESEARCHER).
 *
 * @param {{ page?: number, limit?: number, incidentType?: string,
 *           incidentStatus?: string, severity?: string }} options
 */
export async function getIncidentReports({
  page = 1,
  limit = 10,
  incidentType = '',
  incidentStatus = '',
  severity = '',
} = {}) {
  const params = { page, limit };

  if (incidentType)    params.incidentType    = incidentType;
  if (incidentStatus)  params.incidentStatus  = incidentStatus;
  if (severity)        params.severity        = severity;

  const { data } = await apiClient.get('/incidents', { params });
  return data;
}
