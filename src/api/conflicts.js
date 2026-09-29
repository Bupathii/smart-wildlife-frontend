import apiClient from './client';

/*
 * =====================================================
 * GET ALL CONFLICT REPORTS
 *
 * GET /api/conflicts
 * =====================================================
 */
export async function getConflictReports({
  page = 1,
  limit = 10,
  status = '',
  conflictType = '',
  urgency = '',
  duplicate = '',
} = {}) {
  const params = {
    page,
    limit,
  };

  if (status) {
    params.status = status;
  }

  if (conflictType) {
    params.conflictType =
      conflictType;
  }

  if (urgency) {
    params.urgency = urgency;
  }

  if (duplicate !== '') {
    params.duplicate =
      duplicate;
  }

  const { data } =
    await apiClient.get(
      '/conflicts',
      {
        params,
      }
    );

  return data;
}

/*
 * =====================================================
 * GET SINGLE CONFLICT REPORT
 *
 * GET /api/conflicts/:id
 * =====================================================
 */
export async function getConflictReportById(
  reportId
) {
  const { data } =
    await apiClient.get(
      `/conflicts/${reportId}`
    );

  return data;
}

/*
 * =====================================================
 * UPDATE CONFLICT RESPONSE
 *
 * PATCH /api/conflicts/:id/response
 *
 * Backend permission:
 * RANGER / COMMUNITY_LIAISON_OFFICER
 * =====================================================
 */
export async function updateConflictResponse(
  reportId,
  payload
) {
  const { data } =
    await apiClient.patch(
      `/conflicts/${reportId}/response`,
      payload
    );

  return data;
}