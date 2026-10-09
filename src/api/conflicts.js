import apiClient from './client';

/*
 * =====================================================
 * ACTIVE CONFLICT REPORTS
 * =====================================================
 */

export async function getConflictReports({
  page = 1,
  limit = 10,
  status = '',
  conflictType = '',
  urgency = '',
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
    params.urgency =
      urgency;
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
 * ONE ACTIVE CONFLICT REPORT
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
 * RESPONSE UPDATE
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
 * ADMIN - ARCHIVE
 * =====================================================
 */

export async function archiveConflictReport(
  reportId,
  reason
) {
  const { data } =
    await apiClient.patch(
      `/conflicts/${reportId}/archive`,
      {
        reason,
      }
    );

  return data;
}

/*
 * =====================================================
 * ADMIN - ARCHIVED REPORTS
 * =====================================================
 */

export async function getArchivedConflictReports({
  page = 1,
  limit = 10,
  status = '',
  conflictType = '',
  urgency = '',
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
    params.urgency =
      urgency;
  }

  const { data } =
    await apiClient.get(
      '/conflicts/admin/archived',
      {
        params,
      }
    );

  return data;
}

/*
 * =====================================================
 * ADMIN - ACTIVE OR ARCHIVED REPORT
 * =====================================================
 */

export async function getAdminConflictReportById(
  reportId
) {
  const { data } =
    await apiClient.get(
      `/conflicts/admin/${reportId}`
    );

  return data;
}

/*
 * =====================================================
 * ADMIN - RESTORE
 * =====================================================
 */

export async function restoreConflictReport(
  reportId
) {
  const { data } =
    await apiClient.patch(
      `/conflicts/${reportId}/restore`
    );

  return data;
}

/*
 * =====================================================
 * ADMIN - PERMANENT DELETE
 * =====================================================
 */

export async function permanentlyDeleteConflictReport(
  reportId
) {
  const { data } =
    await apiClient.delete(
      `/conflicts/${reportId}/permanent`
    );

  return data;
}

/*
 * =====================================================
 * ANALYTICS
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
    reports: allReports,

    totalReports:
      firstResponse.pagination
        ?.totalReports ??
      allReports.length,

    truncated:
      totalPages >
      MAX_PAGES,
  };
}