import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  ImageIcon,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getIncidentReports, updateIncidentStatus } from '../api/incidents';
import { resolveApiAssetUrl } from '../api/client';
import { getCurrentUser } from '../config/roleAccess';

/* ΓöÇΓöÇΓöÇ constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

const PAGE_SIZE = 10;

/** Roles that may change the status of an incident. */
const CAN_EDIT_ROLES = new Set(['ADMIN', 'PARK_MANAGER', 'RANGER_SUPERVISOR']);

const STATUS_OPTIONS = [
  { value: '',             label: 'All Statuses' },
  { value: 'SUBMITTED',    label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'RESOLVED',     label: 'Resolved' },
];

/** Status options for the edit dropdown (no "All" entry). */
const STATUS_EDIT_OPTIONS = STATUS_OPTIONS.slice(1);

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

const INITIAL_FILTERS = {
  search: '',
  incidentType: '',
  incidentStatus: '',
  severity: '',
};

/* ΓöÇΓöÇΓöÇ pure helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

function googleMapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

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
  if (!iso) return 'ΓÇö';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ΓöÇΓöÇΓöÇ FilterBar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

function FilterBar({ filters, onChange, onReset, hasActive }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search ranger or descriptionΓÇª"
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

/* ΓöÇΓöÇΓöÇ IncidentRow ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

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
        {report.ranger?.name ?? 'ΓÇö'}
      </td>

      {/* Location ΓÇö clicking opens Google Maps */}
      <td className="px-4 py-3">
        {report.location ? (
          <a
            href={googleMapsUrl(report.location.latitude, report.location.longitude)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-teal-700 underline underline-offset-2 hover:text-teal-900"
          >
            <MapPin size={12} className="shrink-0" />
            {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
          </a>
        ) : (
          <span className="text-xs text-gray-400">ΓÇö</span>
        )}
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

/* ΓöÇΓöÇΓöÇ Pagination ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

/**
 * Numbered pagination control matching the project's existing UI style.
 * Shows prev / page-numbers / next with ellipsis for large page counts.
 */
function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  /**
   * Build the list of page numbers to show.
   * Always includes first, last, current ┬▒1, with 'ΓÇª' gaps.
   */
  function getPageNumbers() {
    const range = new Set([1, pages, page, page - 1, page + 1]);
    const sorted = [...range]
      .filter((n) => n >= 1 && n <= pages)
      .sort((a, b) => a - b);

    const result = [];
    let prev = null;
    for (const n of sorted) {
      if (prev !== null && n - prev > 1) result.push('ΓÇª');
      result.push(n);
      prev = n;
    }
    return result;
  }

  const items = getPageNumbers();

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-500">
        Page {page} of {pages}
      </p>

      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numbered buttons */}
        {items.map((item, idx) =>
          item === 'ΓÇª' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-gray-400"
            >
              ΓÇª
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                item === page
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}

        {/* Next */}
        <button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ΓöÇΓöÇΓöÇ IncidentDetailModal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

/**
 * @param {{ report: object, canEdit: boolean,
 *           onClose: () => void,
 *           onStatusUpdated: (updated: object) => void }} props
 */
function IncidentDetailModal({ report, canEdit, onClose, onStatusUpdated }) {
  if (!report) return null;

  const [selectedStatus, setSelectedStatus] = useState(report.incidentStatus);
  const [saving,         setSaving]         = useState(false);
  const [saveError,      setSaveError]       = useState('');
  const [saveSuccess,    setSaveSuccess]     = useState(false);

  const isDirty = selectedStatus !== report.incidentStatus;

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const result = await updateIncidentStatus(report._id, selectedStatus);
      setSaveSuccess(true);
      onStatusUpdated(result.report);
      // Auto-dismiss success after 1.5 s
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (err) {
      setSaveError(
        err?.response?.data?.message ?? 'Failed to update status. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* ΓöÇΓöÇ Header ΓöÇΓöÇ */}
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
          {/* ΓöÇΓöÇ Status section ΓöÇΓöÇ */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Incident Status
            </p>

            {canEdit ? (
              /* Editable dropdown for PARK_MANAGER / RANGER_SUPERVISOR */
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setSaveError('');
                    setSaveSuccess(false);
                  }}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
                >
                  {STATUS_EDIT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? 'SavingΓÇª' : saveSuccess ? 'Saved!' : 'Save Status'}
                </button>

                {saveError && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle size={13} />
                    {saveError}
                  </p>
                )}
              </div>
            ) : (
              /* Read-only badge for RESEARCHER */
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(report.incidentStatus)}`}>
                  {formatLabel(report.incidentStatus)}
                </span>
                <span className="text-xs text-gray-400">(read-only)</span>
              </div>
            )}
          </div>

          {/* ΓöÇΓöÇ Severity + source badges ΓöÇΓöÇ */}
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityBadge(report.severity)}`}>
              {formatLabel(report.severity)} Severity
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {report.location?.source ?? 'ΓÇö'} Location
            </span>
          </div>

          {/* ΓöÇΓöÇ Description ΓöÇΓöÇ */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
            <p className="text-sm leading-relaxed text-gray-700">{report.description}</p>
          </div>

          {/* ΓöÇΓöÇ Details grid ΓöÇΓöÇ */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Reported By</p>
              <p className="mt-1 font-medium text-gray-800">{report.ranger?.name ?? 'ΓÇö'}</p>
              <p className="text-xs text-gray-500">{report.ranger?.email ?? ''}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date</p>
              <p className="mt-1 font-medium text-gray-800">{formatDate(report.createdAt)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">GPS Coordinates</p>
              {report.location ? (
                <a
                  href={googleMapsUrl(report.location.latitude, report.location.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900"
                >
                  <MapPin size={13} className="shrink-0" />
                  {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                </a>
              ) : (
                <p className="mt-1 font-medium text-gray-800">ΓÇö</p>
              )}
            </div>
          </div>

          {/* ΓöÇΓöÇ Evidence photos ΓöÇΓöÇ */}
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

/* ΓöÇΓöÇΓöÇ Main page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */

export default function Incidents() {
  const currentUser = useMemo(() => getCurrentUser(), []);

  /**
   * True when the logged-in user is allowed to change incident status.
   * RESEARCHER can only read.
   */
  const canEdit = CAN_EDIT_ROLES.has(currentUser?.role);

  const [reports,    setReports]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [filters,    setFilters]    = useState(INITIAL_FILTERS);
  const [selected,   setSelected]   = useState(null);
  /**
   * Incrementing refreshKey forces a re-fetch even when page/filters
   * haven't changed ΓÇö used by the Refresh button.
   */
  const [refreshKey, setRefreshKey] = useState(0);

  /* Fetch whenever server-side filters, page, or refreshKey change */
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
  }, [page, filters.incidentType, filters.incidentStatus, filters.severity, refreshKey]);

  /* Client-side search over the current page */
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

  /** Force a network re-fetch without changing filters or page. */
  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  /**
   * Called when a status update succeeds inside the modal.
   * Patches the report in-place in the list so the table reflects
   * the new status immediately without a full re-fetch.
   */
  function handleStatusUpdated(updatedReport) {
    setReports((prev) =>
      prev.map((r) => (r._id === updatedReport._id ? updatedReport : r))
    );
    // Also update the selected report shown in the modal
    setSelected(updatedReport);
  }

  const hasActive =
    filters.search ||
    filters.incidentType ||
    filters.incidentStatus ||
    filters.severity;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ΓöÇΓöÇ Page header ΓöÇΓöÇ */}
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
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ΓöÇΓöÇ Filters ΓöÇΓöÇ */}
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Filter size={15} className="shrink-0 text-gray-400" />
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          hasActive={hasActive}
        />
      </div>

      {/* ΓöÇΓöÇ Error banner ΓöÇΓöÇ */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* ΓöÇΓöÇ Role notice for read-only users ΓöÇΓöÇ */}
      {!canEdit && !loading && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
          <Clock3 size={14} className="shrink-0" />
          You have read-only access.
        </div>
      )}

      {/* ΓöÇΓöÇ Table / empty / loading ΓöÇΓöÇ */}
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

          {/* Numbered pagination */}
          <Pagination
            page={page}
            pages={pages}
            onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      )}

      {/* ΓöÇΓöÇ Detail / status modal ΓöÇΓöÇ */}
      {selected && (
        <IncidentDetailModal
          report={selected}
          canEdit={canEdit}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
