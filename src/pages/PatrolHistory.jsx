import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Route as RouteIcon,
  ShieldCheck,
} from 'lucide-react';

import { getCompletedPatrols, getPatrolDetails } from '../api/patrols';
import PatrolMap from '../components/PatrolMap';
import PatrolTable from '../components/PatrolTable';
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PatrolTimeline,
  SummaryCards,
} from '../components/PatrolWidgets';
import { formatDuration } from '../config/patrolUi';
import usePatrolData, { useParkMap } from '../hooks/usePatrolData';

/** Headline statistics for all completed patrols. */
function statisticCards(statistics) {
  return [
    {
      label: 'Completed patrols',
      value: statistics.totalCompleted,
      hint: `${statistics.evaluatedCount} evaluated`,
      icon: CheckCircle2,
    },
    {
      label: 'Average coverage',
      value: `${statistics.averageCoverage}%`,
      hint: 'of assigned zones',
      icon: ShieldCheck,
    },
    {
      label: 'Total distance',
      value: `${statistics.totalDistanceKm} km`,
      hint: 'covered on patrol',
      icon: RouteIcon,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Average duration',
      value: formatDuration(statistics.averageDurationMinutes),
      hint: 'per patrol',
      icon: Clock,
      tone: 'bg-amber-50 text-amber-700',
    },
  ];
}

/** The selected patrol's historical track on the map, with its timeline. */
function HistoricalRoute({ selection, zones, onOpen }) {
  if (selection.status === 'loading') return <LoadingState label="Loading patrol track…" />;
  if (selection.status === 'error') {
    return <ErrorState message={selection.error.message} onRetry={selection.refresh} />;
  }

  const patrol = selection.data;
  return (
    <div className="space-y-4">
      <PatrolMap
        zones={zones}
        zoneCoverage={patrol.zoneCoverage}
        routes={[patrol.route]}
        track={patrol.track}
        height={280}
      />
      <PatrolTimeline events={patrol.timeline} />
      <button
        type="button"
        onClick={() => onOpen(patrol.patrolId)}
        className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Open details and evaluation
      </button>
    </div>
  );
}

/** Screen 4: Completed Patrol History (AF2). */
export default function PatrolHistory() {
  const navigate = useNavigate();
  const history = usePatrolData(getCompletedPatrols);
  const parkMap = useParkMap();
  const [chosenId, setChosenId] = useState(null);

  // Until the manager picks a row, the newest patrol is shown.
  const selectedId = chosenId ?? history.data?.patrols[0]?.patrolId ?? null;
  const loadSelected = useCallback(
    () => (selectedId ? getPatrolDetails(selectedId) : Promise.resolve(null)),
    [selectedId]
  );
  const selection = usePatrolData(loadSelected);

  if (history.status === 'loading') return <LoadingState />;
  if (history.status === 'error') {
    return <ErrorState message={history.error.message} onRetry={history.refresh} />;
  }

  const { statistics, patrols } = history.data;
  if (patrols.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No completed patrols yet"
          message="Patrols appear here once rangers finish them."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <SummaryCards cards={statisticCards(statistics)} />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Completed patrols" className="xl:col-span-2">
          <PatrolTable
            patrols={patrols}
            onSelect={setChosenId}
            selectedId={selectedId}
            variant="history"
          />
        </Card>
        <Card title={`Historical patrol route${selectedId ? ` – ${selectedId}` : ''}`}>
          {selection.data || selection.status !== 'ready' ? (
            <HistoricalRoute
              selection={selection}
              zones={parkMap.data?.zones}
              onOpen={(patrolId) => navigate(`/patrols/${patrolId}`)}
            />
          ) : (
            <p className="text-sm text-slate-500">Select a patrol to see its track.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
