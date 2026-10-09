import {
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  ImageIcon,
  Link2,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  archiveConflictReport,
  getConflictReports,
} from '../api/conflicts';

import {
  getCurrentUser,
} from '../config/roleAccess';

const STATUS_OPTIONS = [
  {
    value: '',
    label: 'All Statuses',
  },
  {
    value: 'SUBMITTED',
    label: 'Submitted',
  },
  {
    value: 'UNDER_REVIEW',
    label: 'Under Review',
  },
  {
    value: 'RESPONDING',
    label: 'Responding',
  },
  {
    value: 'RESOLVED',
    label: 'Resolved',
  },
];

const TYPE_OPTIONS = [
  {
    value: '',
    label: 'All Conflict Types',
  },
  {
    value: 'ELEPHANT_SIGHTING',
    label: 'Elephant Sighting',
  },
  {
    value: 'CROP_RAIDING',
    label: 'Crop Raiding',
  },
  {
    value: 'OTHER',
    label: 'Other Conflict',
  },
];

const URGENCY_OPTIONS = [
  {
    value: '',
    label: 'All Urgency Levels',
  },
  {
    value: 'LOW',
    label: 'Low',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
  },
  {
    value: 'HIGH',
    label: 'High',
  },
  {
    value: 'CRITICAL',
    label: 'Critical',
  },
];

function getConflictTypeLabel(
  type
) {
  switch (type) {
    case 'ELEPHANT_SIGHTING':
      return 'Elephant Sighting';

    case 'CROP_RAIDING':
      return 'Crop Raiding';

    case 'OTHER':
      return 'Other Conflict';

    default:
      return (
        type?.replaceAll(
          '_',
          ' '
        ) || 'Unknown'
      );
  }
}

function getLocationLabel(
  report
) {
  if (
    report?.location?.source ===
    'GPS'
  ) {
    const latitude =
      report.location.latitude;

    const longitude =
      report.location.longitude;

    if (
      latitude !== undefined &&
      longitude !== undefined
    ) {
      return `${Number(
        latitude
      ).toFixed(5)}, ${Number(
        longitude
      ).toFixed(5)}`;
    }

    return 'GPS Location';
  }

  return (
    report?.location
      ?.manualLocation ||
    'Location not available'
  );
}

function formatDate(
  date
) {
  if (!date) {
    return 'Not available';
  }

  return new Date(
    date
  ).toLocaleString();
}

export default function ConflictReports() {
  const navigate =
    useNavigate();

  const currentUser =
    getCurrentUser();

  const isAdmin =
    currentUser?.role ===
    'ADMIN';

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    totalReports,
    setTotalReports,
  ] = useState(0);

  const [
    status,
    setStatus,
  ] = useState('');

  const [
    conflictType,
    setConflictType,
  ] = useState('');

  const [
    urgency,
    setUrgency,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  /*
   * Archive Modal
   */
  const [
    archiveTarget,
    setArchiveTarget,
  ] = useState(null);

  const [
    archiveReason,
    setArchiveReason,
  ] = useState('');

  const [
    archiving,
    setArchiving,
  ] = useState(false);

  const [
    archiveError,
    setArchiveError,
  ] = useState('');

  const LIMIT = 10;

  async function loadReports() {
    try {
      setLoading(true);
      setError('');

      const result =
        await getConflictReports({
          page,
          limit: LIMIT,
          status,
          conflictType,
          urgency,
        });

      setReports(
        result.reports || []
      );

      setTotalPages(
        result.pagination
          ?.totalPages || 1
      );

      setTotalReports(
        result.pagination
          ?.totalReports ??
          result.reports
            ?.length ??
          0
      );
    } catch (err) {
      setReports([]);

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to load conflict reports.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [
    page,
    status,
    conflictType,
    urgency,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    status,
    conflictType,
    urgency,
  ]);

  const visibleReports =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return reports;
      }

      return reports.filter(
        (report) => {
          const type =
            getConflictTypeLabel(
              report.conflictType
            ).toLowerCase();

          const description =
            (
              report.description ||
              ''
            ).toLowerCase();

          const location =
            getLocationLabel(
              report
            ).toLowerCase();

          const reporter =
            (
              report.reporter
                ?.name ||
              report.reporter
                ?.email ||
              ''
            ).toLowerCase();

          return (
            type.includes(
              query
            ) ||
            description.includes(
              query
            ) ||
            location.includes(
              query
            ) ||
            reporter.includes(
              query
            )
          );
        }
      );
    }, [
      reports,
      search,
    ]);

  function clearFilters() {
    setStatus('');
    setConflictType('');
    setUrgency('');
    setSearch('');
    setPage(1);
  }

  function openArchiveModal(
    report
  ) {
    setArchiveTarget(
      report
    );

    setArchiveReason('');

    setArchiveError('');
  }

  function closeArchiveModal() {
    if (archiving) {
      return;
    }

    setArchiveTarget(
      null
    );

    setArchiveReason('');

    setArchiveError('');
  }

  async function handleArchive() {
    const reason =
      archiveReason.trim();

    if (
      reason.length < 3
    ) {
      setArchiveError(
        'Please provide a valid reason for archiving this report.'
      );

      return;
    }

    try {
      setArchiving(true);

      setArchiveError('');

      await archiveConflictReport(
        archiveTarget._id,
        reason
      );

      closeArchiveModal();

      /*
       * If last record on current
       * page was archived,
       * move to previous page.
       */
      if (
        reports.length === 1 &&
        page > 1
      ) {
        setPage(
          page - 1
        );
      } else {
        await loadReports();
      }
    } catch (err) {
      setArchiveError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to archive the report.'
      );
    } finally {
      setArchiving(false);
    }
  }

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}

        <section className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <ShieldAlert
                size={17}
              />

              Community Conflict Management
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Human-Wildlife Conflict Reports
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review community
              conflict reports and
              monitor operational
              responses.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/conflicts/archived'
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
              >
                <Archive
                  size={17}
                />

                Archived Reports
              </button>
            )}

            <button
              type="button"
              onClick={
                loadReports
              }
              disabled={
                loading
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh
            </button>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Active Reports"
            value={
              totalReports
            }
            description="Operational records"
          />

          <SummaryCard
            label="Loaded"
            value={
              reports.length
            }
            description="Current page"
          />

          <SummaryCard
            label="Responding"
            value={
              reports.filter(
                (item) =>
                  item.status ===
                  'RESPONDING'
              ).length
            }
            description="Active responses"
          />

          <SummaryCard
            label="Resolved"
            value={
              reports.filter(
                (item) =>
                  item.status ===
                  'RESOLVED'
              ).length
            }
            description="Current page"
          />
        </section>

        {/* FILTERS */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter
              size={18}
              className="text-emerald-700"
            />

            <h2 className="font-bold text-slate-800">
              Filter Reports
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search reports..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <select
              value={
                status
              }
              onChange={(
                event
              ) =>
                setStatus(
                  event.target
                    .value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={
                conflictType
              }
              onChange={(
                event
              ) =>
                setConflictType(
                  event.target
                    .value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500"
            >
              {TYPE_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>

            <select
              value={
                urgency
              }
              onChange={(
                event
              ) =>
                setUrgency(
                  event.target
                    .value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-500"
            >
              {URGENCY_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {(status ||
            conflictType ||
            urgency ||
            search) && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="mt-4 text-sm font-semibold text-emerald-700"
            >
              Clear all filters
            </button>
          )}
        </section>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle
              size={20}
              className="mt-0.5 text-red-600"
            />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading reports...
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            visibleReports
              .length === 0 && (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <ShieldAlert
                  size={35}
                  className="text-slate-400"
                />

                <h3 className="mt-4 font-bold text-slate-800">
                  No conflict reports found
                </h3>
              </div>
            )}

          {!loading &&
            visibleReports
              .length > 0 && (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1150px]">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-4">
                          Report
                        </th>

                        <th className="px-5 py-4">
                          Location
                        </th>

                        <th className="px-5 py-4">
                          Urgency
                        </th>

                        <th className="px-5 py-4">
                          Status
                        </th>

                        <th className="px-5 py-4">
                          Evidence
                        </th>

                        <th className="px-5 py-4">
                          Reported
                        </th>

                        <th className="px-5 py-4">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {visibleReports.map(
                        (
                          report
                        ) => (
                          <tr
                            key={
                              report._id
                            }
                            className="transition hover:bg-emerald-50/40"
                          >
                            <td className="px-5 py-4">
                              <div className="max-w-xs">
                                <p className="font-bold text-slate-800">
                                  {getConflictTypeLabel(
                                    report.conflictType
                                  )}
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {
                                    report.description
                                  }
                                </p>

                                {report
                                  .duplicateInfo
                                  ?.isPotentialDuplicate && (
                                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                    <Link2
                                      size={11}
                                    />

                                    Potential Duplicate
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex max-w-[200px] gap-2 text-sm text-slate-600">
                                <MapPin
                                  size={16}
                                  className="mt-0.5 shrink-0"
                                />

                                <span className="line-clamp-2">
                                  {getLocationLabel(
                                    report
                                  )}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <UrgencyBadge
                                urgency={
                                  report.urgencyLevel
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge
                                status={
                                  report.status
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <ImageIcon
                                  size={16}
                                />

                                {
                                  report
                                    .evidence
                                    ?.length ||
                                  0
                                }
                              </div>
                            </td>

                            <td className="px-5 py-4 text-xs text-slate-500">
                              {formatDate(
                                report.createdAt
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/conflicts/${report._id}`
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                  View
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openArchiveModal(
                                        report
                                      )
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                                  >
                                    <Archive
                                      size={14}
                                    />

                                    Archive
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}

                <div className="grid gap-3 p-4 lg:hidden">
                  {visibleReports.map(
                    (
                      report
                    ) => (
                      <div
                        key={
                          report._id
                        }
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-800">
                              {getConflictTypeLabel(
                                report.conflictType
                              )}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <StatusBadge
                                status={
                                  report.status
                                }
                              />

                              <UrgencyBadge
                                urgency={
                                  report.urgencyLevel
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                          {
                            report.description
                          }
                        </p>

                        <div className="mt-3 flex gap-2 text-xs text-slate-500">
                          <MapPin
                            size={15}
                          />

                          {getLocationLabel(
                            report
                          )}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/conflicts/${report._id}`
                              )
                            }
                            className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700"
                          >
                            View Details
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() =>
                                openArchiveModal(
                                  report
                                )
                              }
                              className="flex-1 rounded-xl bg-amber-100 px-3 py-2.5 text-xs font-bold text-amber-800"
                            >
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

          {/* PAGINATION */}

          {!loading &&
            !error &&
            totalPages > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs text-slate-500">
                  Page {page} of{' '}
                  {totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        page - 1
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />

                    Previous
                  </button>

                  <button
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        page + 1
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold disabled:opacity-40"
                  >
                    Next

                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>

      {/* =============================================
          ARCHIVE MODAL
      ============================================== */}

      {archiveTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Archive Conflict Report
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  The report will be
                  removed from normal
                  operational views.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  archiving
                }
                onClick={
                  closeArchiveModal
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                  Report
                </p>

                <p className="mt-1 font-bold text-amber-900">
                  {getConflictTypeLabel(
                    archiveTarget.conflictType
                  )}
                </p>

                <p className="mt-2 line-clamp-2 text-sm text-amber-800">
                  {
                    archiveTarget.description
                  }
                </p>
              </div>

              <div className="mt-5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Archive Reason
                </label>

                <textarea
                  value={
                    archiveReason
                  }
                  onChange={(
                    event
                  ) => {
                    setArchiveReason(
                      event.target
                        .value
                    );

                    setArchiveError(
                      ''
                    );
                  }}
                  maxLength={300}
                  rows={4}
                  placeholder="Example: Invalid test report"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-amber-500 focus:bg-white"
                />

                <div className="mt-1 text-right text-[11px] text-slate-400">
                  {
                    archiveReason.length
                  }
                  /300
                </div>
              </div>

              {archiveError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {
                    archiveError
                  }
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={
                    archiving
                  }
                  onClick={
                    closeArchiveModal
                  }
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    archiving
                  }
                  onClick={
                    handleArchive
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  <Archive
                    size={17}
                  />

                  {archiving
                    ? 'Archiving...'
                    : 'Archive Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  const styles = {
    SUBMITTED:
      'bg-blue-50 text-blue-700',

    UNDER_REVIEW:
      'bg-amber-50 text-amber-700',

    RESPONDING:
      'bg-violet-50 text-violet-700',

    RESOLVED:
      'bg-emerald-50 text-emerald-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ||
        styles.SUBMITTED
      }`}
    >
      {status
        ?.replaceAll(
          '_',
          ' '
        ) || 'SUBMITTED'}
    </span>
  );
}

function UrgencyBadge({
  urgency,
}) {
  const styles = {
    LOW:
      'bg-slate-100 text-slate-600',

    MEDIUM:
      'bg-blue-50 text-blue-700',

    HIGH:
      'bg-orange-50 text-orange-700',

    CRITICAL:
      'bg-red-50 text-red-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[urgency] ||
        styles.MEDIUM
      }`}
    >
      {urgency ||
        'MEDIUM'}
    </span>
  );
}