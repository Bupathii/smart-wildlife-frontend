import {
  AlertCircle,
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
  getConflictReports,
} from '../api/conflicts';

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
      return type
        ?.replaceAll('_', ' ') ||
        'Unknown';
  }
}

function getLocationLabel(
  report
) {
  if (
    report?.location?.source ===
    'GPS'
  ) {
    const lat =
      report.location.latitude;

    const lng =
      report.location.longitude;

    if (
      lat !== undefined &&
      lng !== undefined
    ) {
      return `${Number(
        lat
      ).toFixed(5)}, ${Number(
        lng
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
          result.count ??
          result.reports?.length ??
          0
      );
    } catch (err) {
      setError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to load conflict reports.'
      );

      setReports([]);
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

  /*
   * Reset pagination whenever
   * filters change.
   */
  useEffect(() => {
    setPage(1);
  }, [
    status,
    conflictType,
    urgency,
  ]);

  /*
   * Search is done on currently
   * loaded page.
   *
   * No backend search endpoint is
   * assumed.
   */
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

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 lg:p-8">

        {/* =========================
            HEADER
        ========================== */}

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
              Review conflict reports
              submitted by community
              members and monitor their
              response status.
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadReports
            }
            disabled={
              loading
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
        </section>

        {/* =========================
            SUMMARY CARDS
        ========================== */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Reports"
            value={
              totalReports
            }
            description="Available conflict records"
          />

          <SummaryCard
            label="Current Page"
            value={
              reports.length
            }
            description="Reports loaded"
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
            description="Resolved on this page"
          />
        </section>

        {/* =========================
            FILTERS
        ========================== */}

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

            {/* Search */}

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
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            {/* Status */}

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
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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

            {/* Conflict Type */}

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
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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

            {/* Urgency */}

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
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
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
              className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Clear all filters
            </button>
          )}
        </section>

        {/* =========================
            ERROR
        ========================== */}

        {error && (
          <section className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="font-semibold text-red-800">
                Unable to load conflict reports
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>
          </section>
        )}

        {/* =========================
            CONTENT
        ========================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Loading */}

          {loading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading conflict
                reports...
              </p>
            </div>
          )}

          {/* Empty */}

          {!loading &&
            !error &&
            visibleReports
              .length === 0 && (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <ShieldAlert
                    size={27}
                  />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-800">
                  No conflict reports found
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  No reports match
                  the selected
                  filters.
                </p>
              </div>
            )}

          {/* Desktop Table */}

          {!loading &&
            visibleReports
              .length > 0 && (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1050px]">
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

                        <th className="w-16 px-5 py-4" />
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
                            onClick={() =>
                              navigate(
                                `/conflicts/${report._id}`
                              )
                            }
                            className="cursor-pointer transition hover:bg-emerald-50/40"
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
                                  <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                                    <Link2
                                      size={11}
                                    />

                                    Potential Duplicate
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex max-w-[210px] items-start gap-2 text-sm text-slate-600">
                                <MapPin
                                  size={16}
                                  className="mt-0.5 shrink-0 text-slate-400"
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
                                  className="text-violet-500"
                                />

                                {
                                  report
                                    .evidence
                                    ?.length ||
                                  0
                                }
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex max-w-[180px] items-start gap-2 text-xs text-slate-500">
                                <Clock3
                                  size={15}
                                  className="mt-0.5 shrink-0"
                                />

                                {formatDate(
                                  report.createdAt
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <ChevronRight
                                size={19}
                                className="text-slate-400"
                              />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Cards */}

                <div className="grid gap-3 p-4 lg:hidden">
                  {visibleReports.map(
                    (
                      report
                    ) => (
                      <button
                        type="button"
                        key={
                          report._id
                        }
                        onClick={() =>
                          navigate(
                            `/conflicts/${report._id}`
                          )
                        }
                        className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
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

                          <ChevronRight
                            size={20}
                            className="shrink-0 text-slate-400"
                          />
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">
                          {
                            report.description
                          }
                        </p>

                        <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0"
                          />

                          {getLocationLabel(
                            report
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <Clock3
                            size={15}
                          />

                          {formatDate(
                            report.createdAt
                          )}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </>
            )}

          {/* =========================
              PAGINATION
          ========================== */}

          {!loading &&
            !error &&
            totalPages > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Page{' '}
                  <strong className="text-slate-700">
                    {page}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-700">
                    {
                      totalPages
                    }
                  </strong>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />

                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
    </main>
  );
}

/*
 * =====================================================
 * SUMMARY CARD
 * =====================================================
 */
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

/*
 * =====================================================
 * STATUS BADGE
 * =====================================================
 */
function StatusBadge({
  status,
}) {
  const config = {
    SUBMITTED: {
      label: 'Submitted',
      className:
        'bg-blue-50 text-blue-700 ring-blue-200',
    },

    UNDER_REVIEW: {
      label: 'Under Review',
      className:
        'bg-amber-50 text-amber-700 ring-amber-200',
    },

    RESPONDING: {
      label: 'Responding',
      className:
        'bg-violet-50 text-violet-700 ring-violet-200',
    },

    RESOLVED: {
      label: 'Resolved',
      className:
        'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
  };

  const selected =
    config[status] ||
    config.SUBMITTED;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${selected.className}`}
    >
      {selected.label}
    </span>
  );
}

/*
 * =====================================================
 * URGENCY BADGE
 * =====================================================
 */
function UrgencyBadge({
  urgency,
}) {
  const config = {
    LOW: {
      className:
        'bg-slate-100 text-slate-600',
    },

    MEDIUM: {
      className:
        'bg-blue-50 text-blue-700',
    },

    HIGH: {
      className:
        'bg-orange-50 text-orange-700',
    },

    CRITICAL: {
      className:
        'bg-red-50 text-red-700',
    },
  };

  const selected =
    config[urgency] ||
    config.MEDIUM;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${selected.className}`}
    >
      {urgency || 'MEDIUM'}
    </span>
  );
}