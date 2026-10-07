import { useNavigate } from 'react-router-dom';

import {
  AlertTriangle,
  Binoculars,
  MapPinned,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { getMonitoringDashboard } from '../api/patrols';
import PatrolMap from '../components/PatrolMap';
import PatrolTable from '../components/PatrolTable';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineBadge,
  RefreshControl,
  SummaryCards,
  WarningBanner,
} from '../components/PatrolWidgets';
import { REFRESH_INTERVAL_MS, coverageColor, formatTime } from '../config/patrolUi';
import usePatrolData, { useParkMap, useRangerRetry } from '../hooks/usePatrolData';

/** The four headline numbers at the top of the dashboard. */
function summaryCards(summary) {
  return [
    {
      label: 'Active patrols',
      value: summary.activePatrols,
      hint: 'patrols in progress',
      icon: Users,
    },
    {
      label: 'Rangers online / offline',
      value: `${summary.rangersOnline} / ${summary.rangersOffline}`,
      hint: 'on patrol right now',
      icon: MapPinned,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Average coverage',
      value: `${summary.averageCoverage}%`,
      hint: 'across all zones',
      icon: ShieldCheck,
    },
    {
      label: 'Under-patrolled zones',
      value: summary.underPatrolledZones,
      hint: 'need attention',
      icon: AlertTriangle,
      tone: 'bg-red-50 text-red-600',
    },
  ];
}

/** Main flow step 8: zones that need attention, plus offline rangers (EX1). */
function AlertsPanel({ zones, offlineRangers, retry }) {
  if (zones.length === 0 && offlineRangers.length === 0) {
    return <p className="text-sm text-slate-500">No areas need attention right now.</p>;
  }

  return (
    <ul className="space-y-3">
      {zones.map((zone) => (
        <li key={zone.zoneId} className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <AlertTriangle size={16} className="text-red-600" />
            {zone.name} – {zone.percentage}% coverage
          </p>
          {zone.reasons.map((reason) => (
            <p key={reason} className="ml-6 text-xs text-slate-600">{reason}</p>
          ))}
        </li>
      ))}
      {offlineRangers.map((ranger) => (
        <li key={ranger.rangerId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1.5 text-sm font-bold text-slate-900">
            {ranger.name} · {ranger.patrolId}
          </p>
          <OfflineBadge
            ranger={ranger}
            onRetry={retry.retry}
            retrying={retry.retryingId === ranger.rangerId}
          />
        </li>
      ))}
    </ul>
  );
}

/** Main flow step 7: coverage of each zone as a donut with a legend. */
function CoverageByZone({ zones, average }) {
  return (
    <div>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={zones} dataKey="percentage" nameKey="name" innerRadius={52} outerRadius={78} minAngle={4}>
              {zones.map((zone) => (
                <Cell key={zone.zoneId} fill={coverageColor(zone.percentage)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{average}%</span>
          <span className="text-xs text-slate-500">average</span>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5">
        {zones.map((zone) => (
          <li key={zone.zoneId} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: coverageColor(zone.percentage) }}
              />
              {zone.name}
            </span>
            <span className="font-semibold text-slate-900">{zone.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Screen 1: Patrol Monitoring Dashboard (main flow steps 1-8 and 12).
 * Also shows EX2 (no active patrols), EX3 (GPS unavailable) and EX4.
 */
export default function PatrolMonitoring() {
  const navigate = useNavigate();
  const dashboard = usePatrolData(getMonitoringDashboard, { intervalMs: REFRESH_INTERVAL_MS });
  const parkMap = useParkMap();
  const retry = useRangerRetry(dashboard.loadedAt);

  if (dashboard.status === 'loading') return <LoadingState />;
  if (dashboard.status === 'error') {
    return <ErrorState message={dashboard.error.message} onRetry={dashboard.refresh} />;
  }

  const { data } = dashboard;
  const openPatrol = (patrolId) => navigate(`/patrols/${patrolId}`);
  const activePatrols = data.activePatrols.map((patrol) => ({
    ...patrol,
    rangers: retry.apply(patrol.rangers),
  }));
  const rangers = activePatrols.flatMap((patrol) =>
    patrol.rangers.map((ranger) => ({ ...ranger, patrolId: patrol.patrolId }))
  );
  const offlineRangers = rangers.filter((ranger) => ranger.trackingStatus === 'OFFLINE');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Live view of ranger patrols. Refreshes automatically every {REFRESH_INTERVAL_MS / 1000} seconds.
        </p>
        <RefreshControl
          loadedAt={dashboard.loadedAt}
          refreshing={dashboard.refreshing}
          onRefresh={dashboard.refresh}
        />
      </div>

      {dashboard.refreshFailed && (
        <WarningBanner>
          Could not refresh – showing data from {formatTime(dashboard.loadedAt)}
        </WarningBanner>
      )}
      {data.gpsStatus === 'UNAVAILABLE' && (
        <WarningBanner>
          Location service unavailable – showing last synchronised locations
        </WarningBanner>
      )}

      <SummaryCards cards={summaryCards(data.summary)} />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Park coverage map" className="xl:col-span-2">
          <PatrolMap
            zones={parkMap.data?.zones}
            routes={parkMap.data?.routes}
            zoneCoverage={data.zoneCoverage}
            rangers={rangers}
            onRetry={retry.retry}
            retryingId={retry.retryingId}
          />
        </Card>
        <Card title="Alerts">
          <AlertsPanel zones={data.underPatrolledZones} offlineRangers={offlineRangers} retry={retry} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Active patrols" className="xl:col-span-2">
          {data.noActivePatrols ? (
            <EmptyState
              icon={Binoculars}
              title="No active patrols are currently running"
              message="All ranger teams are at base or between patrols."
              actionLabel="View completed patrols"
              onAction={() => navigate('/patrols/completed')}
            />
          ) : (
            <PatrolTable patrols={activePatrols} onSelect={openPatrol} />
          )}
        </Card>
        <Card title="Coverage by zone">
          <CoverageByZone zones={data.zoneCoverage} average={data.summary.averageCoverage} />
        </Card>
      </div>

      {data.recentlyCompleted.length > 0 && (
        <Card title="Completed in the last 24 hours">
          <PatrolTable patrols={data.recentlyCompleted} onSelect={openPatrol} variant="history" />
        </Card>
      )}
    </div>
  );
}
