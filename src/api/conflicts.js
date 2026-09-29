import apiClient from './client';

/*
 * =====================================================
 * GET CONFLICT REPORTS
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
 * GET ONE REPORT
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
 * UPDATE RESPONSE
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

/*
 * =====================================================
 * LOAD REPORTS FOR ANALYTICS
 *
 * Loads multiple pages from the
 * existing conflict endpoint.
 *
 * No new analytics backend endpoint
 * is assumed.
 * =====================================================
 */
export async function getConflictAnalyticsReports() {
  const LIMIT = 50;
  const MAX_PAGES = 20;

  const firstResponse =
    await getConflictReports({
      page: 1,
      limit: LIMIT,
    });

  const allReports = [
    ...(firstResponse.reports ||
      []),
  ];

  const totalPages =
    firstResponse.pagination
      ?.totalPages || 1;

  const pagesToLoad =
    Math.min(
      totalPages,
      MAX_PAGES
    );

  for (
    let page = 2;
    page <= pagesToLoad;
    page++
  ) {
    const response =
      await getConflictReports({
        page,
        limit: LIMIT,
      });

    allReports.push(
      ...(response.reports ||
        [])
    );
  }

  return {
    reports:
      allReports,

    totalReports:
      firstResponse.pagination
        ?.totalReports ??
      allReports.length,

    truncated:
      totalPages >
      MAX_PAGES,
  };
}