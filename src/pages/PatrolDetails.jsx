import { useCallback } from 'react';

import { Link, useParams } from 'react-router-dom';

import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Phone,
  Route as RouteIcon,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

import { getPatrolDetails } from '../api/patrols';
import EvaluationForm from '../components/EvaluationForm';
import PatrolMap from '../components/PatrolMap';
import {
  Card,
  ErrorState,
  LoadingState,
  OfflineBadge,
  PatrolTimeline,
  ProgressBar,
  StatusBadge,
  SummaryCards,
  WarningBanner,
} from '../components/PatrolWidgets';
import {
  PATROL_STATUS,
  REFRESH_INTERVAL_MS,
  formatDateTime,
  formatDuration,
  formatTime,
} from '../config/patrolUi';
import usePatrolData, { useParkMap, useRangerRetry } from '../hooks/usePatrolData';

/** Status, progress, coverage and distance at a glance. */
function headlineCards(patrol) {
  return [
    {
      label: 'Patrol status',
      value: PATROL_STATUS[patrol.status]?.label ?? patrol.status,
      hint: `Started ${formatDateTime(patrol.startTime)}`,
      icon: ShieldCheck,
    },
    {
      label: 'Progress',
      value: `${patrol.progressPercentage}%`,
      hint: 'of route completed',
      icon: TrendingUp,
    },
    {
      label: 'Coverage',
      value: `${patrol.coveragePercentage}%`,
      hint: 'of assigned zones',
      icon: ShieldCheck,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Distance covered',
      value: `${patrol.distanceCoveredKm} km`,
      hint: `of ${patrol.route.routeLength} km · ${formatDuration(patrol.durationMinutes)}`,
      icon: RouteIcon,
      tone: 'bg-amber-50 text-amber-700',
    },
  ];
}

/** Ranger details with the live / offline state of each ranger. */
function RangerProfiles({ rangers, inField, retry }) {
  return (
    <ul className="space-y-4">
      {rangers.map((ranger) => (
        <li key={ranger.rangerId} className="space-y-1.5">
          <p className="font-bold text-slate-900">{ranger.name}</p>
          <p className="text-sm text-slate-500">
            {ranger.rank} · {ranger.rangerId}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={14} />
            {ranger.phoneNumber || 'No phone number'}
          </p>
          {inField && ranger.trackingStatus === 'OFFLINE' && (
            <OfflineBadge
              ranger={ranger}
              onRetry={retry.retry}
              retrying={retry.retryingId === ranger.rangerId}
            />
          )}
          {inField && ranger.trackingStatus === 'ONLINE' && (
            <p className="text-sm font-medium text-emerald-700">
              Online · last location {formatTime(ranger.lastSyncTime)}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Two-column list of facts about the route and the patrol times. */
function RouteInformation({ patrol }) {
  const rows = [
    ['Route', patrol.route.name],
    ['Route ID', patrol.route.routeId],
    ['Total distance', `${patrol.route.routeLength} km`],
    ['Start time', formatDateTime(patrol.startTime)],
    [patrol.status === 'COMPLETED' ? 'End time' : 'Planned end', formatDateTime(patrol.endTime)],
    ['Last update', formatDateTime(patrol.lastUpdate)],
  ];
  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4">
          <dt className="text-slate-500">{label}</dt>
          <dd className="text-right font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Coverage per zone and the zones the manager should look at. */
function CoverageByZone({ patrol }) {
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {patrol.zoneCoverage.map((zone) => (
          <li key={zone.zoneId} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">{zone.name}</span>
            <ProgressBar value={zone.percentage} />
          </li>
        ))}
      </ul>
      {patrol.areasNeedingAttention.map((zone) => (
        <p
          key={zone.zoneId}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-slate-800"
        >
          <AlertTriangle size={16} className="shrink-0 text-red-600" />
          {zone.name} needs attention – only {zone.percentage}% covered
        </p>
      ))}
    </div>
  );
}

/**
 * Screen 3: Patrol Details and Evaluation (main flow steps 9-11, AF3, AF4).
 */
export default function PatrolDetails() {
  const { patrolId } = useParams();
  const loadPatrol = useCallback(() => getPatrolDetails(patrolId), [patrolId]);
  const details = usePatrolData(loadPatrol, { intervalMs: REFRESH_INTERVAL_MS });
  const parkMap = useParkMap();
  const retry = useRangerRetry(details.loadedAt);

  const backLink = (
    <Link to="/patrols" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
      <ArrowLeft size={16} />
      Back to patrol monitoring
    </Link>
  );

  if (details.status === 'loading') return <LoadingState label="Loading patrol details…" />;
  if (details.status === 'error') {
    return (
      <div className="space-y-4">
        {backLink}
        <ErrorState message={details.error.message} onRetry={details.refresh} />
      </div>
    );
  }

  const patrol = details.data;
  const inField = patrol.status !== 'COMPLETED';
  const rangers = retry.apply(patrol.rangers);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900">Patrol {patrol.patrolId}</h2>
          <StatusBadge status={patrol.status} />
        </div>
        {backLink}
      </div>

      {details.refreshFailed && (
        <WarningBanner>
          Could not refresh – showing data from {formatTime(details.loadedAt)}
        </WarningBanner>
      )}
      {patrol.gpsStatus === 'UNAVAILABLE' && (
        <WarningBanner>
          Location service unavailable – showing last synchronised locations
        </WarningBanner>
      )}

      <SummaryCards cards={headlineCards(patrol)} />

      <div className="grid gap-5 xl:grid-cols-4">
        <div className="space-y-5">
          <Card title="Ranger details">
            <RangerProfiles rangers={rangers} inField={inField} retry={retry} />
          </Card>
          <Card title="Route information">
            <RouteInformation patrol={patrol} />
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-2">
          <Card title={inField ? 'Patrol route and current location' : 'Patrol route and recorded track'}>
            <PatrolMap
              zones={parkMap.data?.zones}
              zoneCoverage={patrol.zoneCoverage}
              routes={[patrol.route]}
              rangers={inField ? rangers : []}
              track={patrol.track}
              onRetry={retry.retry}
              retryingId={retry.retryingId}
            />
          </Card>
          <Card title="Patrol timeline" action={<Clock size={17} className="text-slate-400" />}>
            <PatrolTimeline events={patrol.timeline} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Coverage by zone">
            <CoverageByZone patrol={patrol} />
          </Card>
          <Card title="Record evaluation">
            <EvaluationForm
              key={patrol.patrolId}
              patrolId={patrol.patrolId}
              evaluation={patrol.evaluation}
              canEvaluate={patrol.canEvaluate}
              onSaved={details.refresh}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
