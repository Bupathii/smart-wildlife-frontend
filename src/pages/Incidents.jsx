import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ImageIcon,
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

import { getIncidentReports } from '../api/incidents';
import { resolveApiAssetUrl } from '../api/client';

/* ─── filter option lists ────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: '',             label: 'All Statuses' },
  { value: 'SUBMITTED',    label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'RESOLVED',     label: 'Resolved' },
];

const TYPE_OPTIONS = [
  { value: '',                 label: 'All Types' },
  { value: 'POACHING',         label: 'Poaching' },
  { value: 'SNARE',            label: 'Snare' },
  { value: 'ANIMAL_CARCASS',   label: 'Animal Carcass' },
  { value: 'ILLEGAL_CAMP',     label: 'Illegal Camp' },
  { value: 'ANIMAL_FOOTPRINT', label: 'Animal Footprint' },
  { value: 'OTHER',            label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: '',         label: 'All Severities' },
  { value: 'LOW',      label: 'Low' },
  { value: 'MEDIUM',   label: 'Medium' },
  { value: 'HIGH',     label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const PAGE_SIZE = 10;

/* ─── small pure helpers ─────────────────────────────────────────── */

function severityBadge(severity) {
  const map = {
    LOW:      'bg-green-100  text-green-800',
    MEDIUM:   'bg-yellow-100 text-yellow-800',
    HIGH:     'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100    text-red-800',
  };
  return map[severity] ?? 'bg-gray-100 text-gray-700';
}

function statusBadge(status) {
  const map = {
    SUBMITTED:    'bg-blue-100   text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    RESOLVED:     'bg-green-100  text-green-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}

function formatLabel(str) {
  return str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ─── sub-components ─────────────────────────────────────────────── */

function FilterBar({ filters, onChange, onReset, hasActive }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* search is client-side — we filter the fetched page */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search ranger or description…"
          value={filters.search}
          onChange={(e) => onChange('search', e.target.value)}
          className="h-9 w-64 rounded-lg border border-gray-200 pl-8 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
        />
      </div>

      <select
        value={filters.incidentType}
        onChange={(e) => onChange('incidentType', e.target.value)}
        className="h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-teal-500"
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={filters.incidentStatus}
        onChange={(e) => onChange('incidentStatus', e.target.value)}
        className="h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-teal-500"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={filters.severity}
        onChange={(e) => onChange('severity', e.target.value)}
        className="h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-teal-500"
      >
        {SEVERITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasActive && (
        <button
          onClick={onReset}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}

function IncidentRow({ report, onSelect }) {
  const thumb = report.evidence?.[0]?.url
    ? resolveApiAssetUrl(report.evidence[0].url)
    : null;

  return (
    <tr
      className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-teal-50/40"
      onClick={() => onSelect(report)}
    >
      {/* Evidence thumbnail */}
      <td className="w-16 px-4 py-3">
        {thumb ? (
          <img
            src={thumb}
            alt="evidence"
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        )}
      </td>

      {/* Type */}
      <td className="px-4 py-3 text-sm font-medium text-gray-800">
        {formatLabel(report.incidentType)}
      </td>

      {/* Ranger */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {report.ranger?.name ?? '—'}
      </td>

      {/* Location */}
      <td className="px-4 py-3">
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={12} className="shrink-0 text-teal-600" />
          {report.location
            ? `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`
            : '—'}
        </span>
      </td>

      {/* Severity */}
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityBadge(report.severity)}`}>
          {formatLabel(report.severity)}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(report.incidentStatus)}`}>
          {formatLabel(report.incidentStatus)}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-xs text-gray-500">
        {formatDate(report.createdAt)}
      </td>
    </tr>
  );
}

function IncidentDetailModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-teal-700" />
            <span className="text-lg font-bold text-gray-900">
              {formatLabel(report.incidentType)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityBadge(report.severity)}`}>
              {formatLabel(report.severity)} Severity
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(report.incidentStatus)}`}>
              {formatLabel(report.incidentStatus)}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {report.location?.source ?? '—'} Location
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
            <p className="text-sm leading-relaxed text-gray-700">{report.description}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Reported By</p>
              <p className="mt-1 font-medium text-gray-800">{report.ranger?.name ?? '—'}</p>
              <p className="text-xs text-gray-500">{report.ranger?.email ?? ''}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date</p>
              <p className="mt-1 font-medium text-gray-800">{formatDate(report.createdAt)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">GPS Coordinates</p>
              <p className="mt-1 font-medium text-gray-800">
                {report.location
                  ? `${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Evidence photos */}
          {report.evidence?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Evidence Photos ({report.evidence.length})
              </p>
              <div className="grid grid-cols-3 gap-3">
                {report.evidence.map((photo) => (
                  <a
                    key={photo._id ?? photo.url}
                    href={resolveApiAssetUrl(photo.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >
                    <img
                      src={resolveApiAssetUrl(photo.url)}
                      alt={photo.originalName ?? 'evidence'}
                      className="h-28 w-full object-cover transition-transform hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────────── */

const INITIAL_FILTERS = {
  search: '',
  incidentType: '',
  incidentStatus: '',
  severity: '',
};

export default function Incidents() {
  const [reports,  setReports]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filters,  setFilters]  = useState(INITIAL_FILTERS);
  const [selected, setSelected] = useState(null);

  /* Fetch whenever server-side filters or page change */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getIncidentReports({
          page,
          limit: PAGE_SIZE,
          incidentType:   filters.incidentType,
          incidentStatus: filters.incidentStatus,
          severity:       filters.severity,
        });
        if (!cancelled) {
          setReports(data.reports ?? []);
          setTotal(data.total ?? 0);
          setPages(data.pages ?? 1);
        }
      } catch {
        if (!cancelled) setError('Failed to load incident reports.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [page, filters.incidentType, filters.incidentStatus, filters.severity]);

  /* Client-side search (over the current page) */
  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.ranger?.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [reports, filters.search]);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== 'search') setPage(1);
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }

  const hasActive =
    filters.search ||
    filters.incidentType ||
    filters.incidentStatus ||
    filters.severity;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Page header ── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wildlife &amp; Poaching Incidents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review incidents reported by wildlife rangers.
            {!loading && (
              <span className="ml-1 font-medium text-teal-700">{total} total</span>
            )}
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Filter size={15} className="shrink-0 text-gray-400" />
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          hasActive={hasActive}
        />
      </div>

      {/* ── Content ── */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw size={24} className="animate-spin text-teal-600" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white text-gray-400">
          <ShieldAlert size={36} />
          <p className="text-sm font-medium">No incidents found</p>
          {hasActive && (
            <button
              onClick={handleReset}
              className="mt-1 text-xs text-teal-600 underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Ranger</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <IncidentRow
                  key={r._id}
                  report={r}
                  onSelect={setSelected}
                />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">
                Page {page} of {pages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Detail modal ── */}
      {selected && (
        <IncidentDetailModal
          report={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}