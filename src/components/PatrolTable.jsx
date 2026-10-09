import {
  formatDateTime,
  formatDuration,
  formatTime,
  rangerNames,
} from '../config/patrolUi';

import {
  OfflineBadge,
  ProgressBar,
  RatingStars,
  StatusBadge,
} from './PatrolWidgets';

/** Columns for patrols that are in the field or mixed (dashboard, filter). */
const ACTIVE_COLUMNS = ['Patrol ID', 'Ranger', 'Route', 'Status', 'Progress', 'Coverage', 'Last update'];

/** Columns for the completed patrol history. */
const HISTORY_COLUMNS = ['Patrol ID', 'Ranger', 'Route', 'Completed on', 'Duration', 'Coverage', 'Rating'];

function RangerCell({ patrol }) {
  const offline = patrol.rangers.filter((ranger) => ranger.trackingStatus === 'OFFLINE');
  const inField = patrol.status !== 'COMPLETED';

  return (
    <div>
      <p className="font-medium text-slate-800">{rangerNames(patrol)}</p>
      {inField && offline.map((ranger) => <OfflineBadge key={ranger.rangerId} ranger={ranger} />)}
    </div>
  );
}

function ActiveCells({ patrol }) {
  return (
    <>
      <td className="px-4 py-3"><StatusBadge status={patrol.status} /></td>
      <td className="px-4 py-3"><ProgressBar value={patrol.progressPercentage} color="#047857" /></td>
      <td className="px-4 py-3"><ProgressBar value={patrol.coveragePercentage} /></td>
      <td className="px-4 py-3 text-slate-500">{formatTime(patrol.lastUpdate)}</td>
    </>
  );
}

function HistoryCells({ patrol }) {
  return (
    <>
      <td className="px-4 py-3 text-slate-600">{formatDateTime(patrol.endTime)}</td>
      <td className="px-4 py-3 text-slate-600">{formatDuration(patrol.durationMinutes)}</td>
      <td className="px-4 py-3"><ProgressBar value={patrol.coveragePercentage} /></td>
      <td className="px-4 py-3"><RatingStars rating={patrol.evaluation?.rating} /></td>
    </>
  );
}

/**
 * SOLID-S: displays rows and reports which one was clicked; nothing else.
 * Table of patrols. Clicking a row selects that patrol (main flow step 9,
 * AF3). `variant="history"` switches to the completed-patrol columns.
 */
export default function PatrolTable({ patrols, onSelect, selectedId = null, variant = 'active' }) {
  const history = variant === 'history';
  const columns = history ? HISTORY_COLUMNS : ACTIVE_COLUMNS;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patrols.map((patrol) => (
            <tr
              key={patrol.patrolId}
              onClick={() => onSelect(patrol.patrolId)}
              onKeyDown={(event) => event.key === 'Enter' && onSelect(patrol.patrolId)}
              tabIndex={0}
              aria-selected={selectedId === patrol.patrolId}
              className={`cursor-pointer border-b border-slate-100 transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none ${
                selectedId === patrol.patrolId ? 'bg-emerald-50' : ''
              }`}
            >
              <td className="px-4 py-3 font-semibold text-emerald-800">{patrol.patrolId}</td>
              <td className="px-4 py-3"><RangerCell patrol={patrol} /></td>
              <td className="px-4 py-3 text-slate-600">{patrol.route.name}</td>
              {history ? <HistoryCells patrol={patrol} /> : <ActiveCells patrol={patrol} />}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
