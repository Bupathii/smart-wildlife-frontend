import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
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
  getConflictAnalyticsReports,
} from '../api/conflicts';

function getTypeLabel(
  value
) {
  switch (value) {
    case 'ELEPHANT_SIGHTING':
      return 'Elephant Sighting';

    case 'CROP_RAIDING':
      return 'Crop Raiding';

    default:
      return 'Other Conflict';
  }
}

function getMonthKey(
  date
) {
  const value =
    new Date(date);

  return `${value.getFullYear()}-${String(
    value.getMonth() + 1
  ).padStart(2, '0')}`;
}

function getMonthLabel(
  key
) {
  const [
    year,
    month,
  ] = key.split('-');

  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString(
    undefined,
    {
      month: 'short',
      year: 'numeric',
    }
  );
}

function getLastMonthKeys(
  count
) {
  const result = [];

  const now =
    new Date();

  for (
    let i = count - 1;
    i >= 0;
    i--
  ) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    result.push(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`
    );
  }

  return result;
}

export default function ConflictAnalytics() {
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
    period,
    setPeriod,
  ] = useState('6');

  const [
    truncated,
    setTruncated,
  ] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const result =
        await getConflictAnalyticsReports();

      setReports(
        result.reports ||
          []
      );

      setTruncated(
        Boolean(
          result.truncated
        )
      );
    } catch (err) {
      setReports([]);

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to load conflict analytics.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * ============================
   * PERIOD FILTER
   * ============================
   */
  const filteredReports =
    useMemo(() => {
      if (
        period === 'ALL'
      ) {
        return reports;
      }

      const months =
        Number(period);

      const start =
        new Date();

      start.setMonth(
        start.getMonth() -
          months
      );

      return reports.filter(
        (report) => {
          const created =
            new Date(
              report.createdAt
            );

          return (
            created >= start
          );
        }
      );
    }, [
      reports,
      period,
    ]);

  /*
   * ============================
   * SUMMARY
   * ============================
   */
  const total =
    filteredReports.length;

  const resolved =
    filteredReports.filter(
      (item) =>
        item.status ===
        'RESOLVED'
    ).length;

  const responding =
    filteredReports.filter(
      (item) =>
        item.status ===
        'RESPONDING'
    ).length;

  const critical =
    filteredReports.filter(
      (item) =>
        item.urgencyLevel ===
        'CRITICAL'
    ).length;

  const resolvedRate =
    total > 0
      ? Math.round(
          (resolved / total) *
            100
        )
      : 0;

  /*
   * ============================
   * TYPE DISTRIBUTION
   * ============================
   */
  const typeData =
    useMemo(() => {
      const values = {
        ELEPHANT_SIGHTING: 0,
        CROP_RAIDING: 0,
        OTHER: 0,
      };

      filteredReports.forEach(
        (report) => {
          const key =
            report.conflictType;

          if (
            values[key] !==
            undefined
          ) {
            values[key]++;
          } else {
            values.OTHER++;
          }
        }
      );

      return Object.entries(
        values
      ).map(
        ([
          key,
          count,
        ]) => ({
          key,
          label:
            getTypeLabel(
              key
            ),
          count,
        })
      );
    }, [
      filteredReports,
    ]);

  /*
   * ============================
   * STATUS DISTRIBUTION
   * ============================
   */
  const statusData =
    useMemo(() => {
      const values = {
        SUBMITTED: 0,
        UNDER_REVIEW: 0,
        RESPONDING: 0,
        RESOLVED: 0,
      };

      filteredReports.forEach(
        (report) => {
          if (
            values[
              report.status
            ] !== undefined
          ) {
            values[
              report.status
            ]++;
          }
        }
      );

      return [
        {
          label:
            'Submitted',
          count:
            values.SUBMITTED,
        },
        {
          label:
            'Under Review',
          count:
            values.UNDER_REVIEW,
        },
        {
          label:
            'Responding',
          count:
            values.RESPONDING,
        },
        {
          label:
            'Resolved',
          count:
            values.RESOLVED,
        },
      ];
    }, [
      filteredReports,
    ]);

  /*
   * ============================
   * MONTHLY TREND
   * ============================
   */
  const monthlyTrend =
    useMemo(() => {
      const numberOfMonths =
        period === 'ALL'
          ? 12
          : Number(period);

      const keys =
        getLastMonthKeys(
          numberOfMonths
        );

      const counts = {};

      keys.forEach(
        (key) => {
          counts[key] = 0;
        }
      );

      reports.forEach(
        (report) => {
          const key =
            getMonthKey(
              report.createdAt
            );

          if (
            counts[key] !==
            undefined
          ) {
            counts[key]++;
          }
        }
      );

      return keys.map(
        (key) => ({
          key,
          label:
            getMonthLabel(
              key
            ),
          count:
            counts[key],
        })
      );
    }, [
      reports,
      period,
    ]);

  /*
   * ============================
   * LOCATION ANALYSIS
   * ============================
   */
  const locationData =
    useMemo(() => {
      const locationMap =
        new Map();

      let gpsCount = 0;

      filteredReports.forEach(
        (report) => {
          if (
            report.location
              ?.source ===
            'GPS'
          ) {
            gpsCount++;

            return;
          }

          const raw =
            report.location
              ?.manualLocation
              ?.trim();

          if (!raw) {
            return;
          }

          const normalized =
            raw.toLowerCase();

          const existing =
            locationMap.get(
              normalized
            );

          if (existing) {
            existing.count++;
          } else {
            locationMap.set(
              normalized,
              {
                name: raw,
                count: 1,
              }
            );
          }
        }
      );

      const topManual =
        Array.from(
          locationMap.values()
        )
          .sort(
            (a, b) =>
              b.count -
              a.count
          )
          .slice(0, 5);

      return {
        gpsCount,
        topManual,
      };
    }, [
      filteredReports,
    ]);

  const maxMonthly =
    Math.max(
      1,
      ...monthlyTrend.map(
        (item) =>
          item.count
      )
    );

  if (loading) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Preparing conflict
          analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() =>
            navigate(
              '/reports'
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"
        >
          <ArrowLeft
            size={17}
          />

          Back to Reports
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle
            size={38}
            className="mx-auto text-red-600"
          />

          <h2 className="mt-4 text-lg font-bold text-red-900">
            Unable to load analytics
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadData
            }
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white"
          >
            <RefreshCw
              size={17}
            />

            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* HEADER */}

      <button
        type="button"
        onClick={() =>
          navigate(
            '/reports'
          )
        }
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
      >
        <ArrowLeft
          size={17}
        />

        Back to Reports
      </button>

      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
            <TrendingUp
              size={18}
            />

            Conflict Analytics
          </div>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Human-Wildlife Conflict Trends
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Analyse community
            conflict reports by
            type, status, time and
            reported location.
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={
              period
            }
            onChange={(
              event
            ) =>
              setPeriod(
                event.target
                  .value
              )
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none"
          >
            <option value="6">
              Last 6 Months
            </option>

            <option value="12">
              Last 12 Months
            </option>

            <option value="ALL">
              All Available Data
            </option>
          </select>

          <button
            type="button"
            onClick={
              loadData
            }
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
          >
            <RefreshCw
              size={17}
            />

            Refresh
          </button>
        </div>
      </section>

      {truncated && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Analytics currently uses
          the first 1,000 available
          conflict reports.
        </div>
      )}

      {/* SUMMARY */}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={
            ShieldAlert
          }
          label="Conflict Reports"
          value={total}
          detail="Selected period"
        />

        <SummaryCard
          icon={Clock3}
          label="Active Responses"
          value={
            responding
          }
          detail="Currently responding"
        />

        <SummaryCard
          icon={
            CheckCircle2
          }
          label="Resolved"
          value={resolved}
          detail={`${resolvedRate}% resolution rate`}
        />

        <SummaryCard
          icon={
            AlertCircle
          }
          label="Critical"
          value={critical}
          detail="Critical urgency"
        />
      </section>

      {/* MONTHLY TREND */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <BarChart3
            size={21}
            className="text-emerald-700"
          />

          <div>
            <h2 className="font-bold text-slate-900">
              Conflict Reports Over Time
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Number of community
              conflict reports per
              month.
            </p>
          </div>
        </div>

        <div className="mt-8 grid min-h-[250px] grid-cols-6 items-end gap-3 md:grid-cols-12">
          {monthlyTrend.map(
            (item) => {
              const height =
                item.count ===
                0
                  ? 4
                  : Math.max(
                      12,
                      (item.count /
                        maxMonthly) *
                        190
                    );

              return (
                <div
                  key={
                    item.key
                  }
                  className="flex min-w-0 flex-col items-center"
                >
                  <span className="mb-2 text-xs font-bold text-slate-600">
                    {
                      item.count
                    }
                  </span>

                  <div className="flex h-[190px] w-full items-end justify-center rounded-t-lg bg-slate-50">
                    <div
                      style={{
                        height:
                          `${height}px`,
                      }}
                      className="w-8 max-w-full rounded-t-lg bg-emerald-600 transition-all"
                    />
                  </div>

                  <span className="mt-2 w-full truncate text-center text-[10px] text-slate-400">
                    {
                      item.label
                    }
                  </span>
                </div>
              );
            }
          )}
        </div>
      </section>

      {/* DISTRIBUTIONS */}

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <DistributionCard
          title="Conflict Type Distribution"
          subtitle="Reports grouped by conflict type"
          data={typeData}
          total={total}
        />

        <DistributionCard
          title="Response Status Distribution"
          subtitle="Current report workflow status"
          data={
            statusData
          }
          total={total}
        />
      </section>

      {/* LOCATIONS */}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <MapPin
            size={21}
            className="text-emerald-700"
          />

          <div>
            <h2 className="font-bold text-slate-900">
              Location Overview
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Reported GPS records
              and frequently entered
              manual locations.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl bg-blue-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
              GPS Reports
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {
                locationData.gpsCount
              }
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700">
              Reports containing
              GPS coordinates.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700">
              Top Manual Locations
            </p>

            {locationData
              .topManual
              .length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                No manual location
                data available.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {locationData.topManual.map(
                  (
                    location,
                    index
                  ) => (
                    <div
                      key={`${location.name}-${index}`}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                          {index +
                            1}
                        </div>

                        <p className="text-sm font-medium text-slate-700">
                          {
                            location.name
                          }
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {
                          location.count
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
        <Icon
          size={19}
          className="text-emerald-700"
        />
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function DistributionCard({
  title,
  subtitle,
  data,
  total,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        {subtitle}
      </p>

      <div className="mt-6 space-y-5">
        {data.map(
          (item) => {
            const percentage =
              total > 0
                ? Math.round(
                    (item.count /
                      total) *
                      100
                  )
                : 0;

            return (
              <div
                key={
                  item.label
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-700">
                    {
                      item.label
                    }
                  </p>

                  <p className="text-xs font-bold text-slate-500">
                    {item.count}{' '}
                    ({percentage}%)
                  </p>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{
                      width:
                        `${percentage}%`,
                    }}
                    className="h-full rounded-full bg-emerald-600"
                  />
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}