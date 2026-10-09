import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Star,
  WifiOff,
} from 'lucide-react';

import {
  MAX_RATING,
  PATROL_STATUS,
  coverageColor,
  formatDateTime,
  formatTime,
} from '../config/patrolUi';

/*
 * Small presentational pieces shared by every patrol screen. Each one does
 * a single job and receives everything through props (no data fetching).
 */

/** White rounded panel used for every section. */
export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Coloured label for a PatrolStatus value. */
export function StatusBadge({ status }) {
  const style = PATROL_STATUS[status] || PATROL_STATUS.PLANNED;
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
      {style.label}
    </span>
  );
}

/** Horizontal bar with the percentage beside it. */
export function ProgressBar({ value, color }) {
  const percentage = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-24 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color || coverageColor(percentage) }}
        />
      </div>
      <span className="w-10 text-xs font-semibold text-slate-700">{percentage}%</span>
    </div>
  );
}

/**
 * SOLID-S: one job - show that a ranger is offline and offer a Retry.
 * EX1: shown beside a ranger whose location is not live. Displays when the
 * location was last synchronised and offers a Retry for that ranger only.
 */
export function OfflineBadge({ ranger, onRetry, retrying = false }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
        <WifiOff size={13} />
        Offline – last synced {formatTime(ranger.lastSyncTime)}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry(ranger.rangerId)}
          disabled={retrying}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </span>
  );
}

/** SOLID-S: only lays out numbers it is given; pages decide what they are. */
/** Row of headline numbers. `cards` = [{ label, value, hint, icon, tone }]. */
export function SummaryCards({ cards }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, tone = 'bg-emerald-50 text-emerald-700' }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          {Icon && (
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon size={22} />
            </div>
          )}
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {hint && <p className="text-xs text-slate-500">{hint}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Read-only star rating, e.g. in the history table. */
export function RatingStars({ rating }) {
  if (!rating) return <span className="text-xs text-slate-400">Not evaluated</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of ${MAX_RATING}`}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star
          key={index}
          size={14}
          className={index < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </span>
  );
}

/** Spinner shown while a screen loads for the first time. */
export function LoadingState({ label = 'Loading patrol data…' }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500" role="status">
      <Loader2 className="animate-spin" size={22} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/** EX4: full error screen with a "Try again" button. */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert">
      <AlertTriangle className="text-red-600" size={36} />
      <h2 className="mt-3 text-lg font-bold text-slate-900">Something went wrong</h2>
      <p className="mt-1 max-w-md text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Try again
      </button>
    </div>
  );
}

/** Centred message with an optional action button (empty lists, EX2). */
export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Icon size={30} />
        </div>
      )}
      <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** Yellow warning bar (EX3 GPS unavailable, failed refresh). */
export function WarningBanner({ children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="status">
      <AlertTriangle size={18} className="shrink-0 text-amber-600" />
      <span>{children}</span>
    </div>
  );
}

/** "Last updated HH:MM" with the manual Refresh button. */
export function RefreshControl({ loadedAt, refreshing, onRefresh }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-500">Last updated {formatTime(loadedAt)}</span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        Refresh
      </button>
    </div>
  );
}

/** Vertical list of what happened during a patrol, oldest first. */
export function PatrolTimeline({ events }) {
  return (
    <ol className="space-y-3">
      {events.map((event, index) => (
        <li key={`${event.label}-${index}`} className="flex gap-3">
          <span
            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
              event.type === 'WAYPOINT' ? 'bg-emerald-500' : 'bg-emerald-800'
            }`}
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">{event.label}</p>
            <p className="text-xs text-slate-500">{formatDateTime(event.timestamp)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
