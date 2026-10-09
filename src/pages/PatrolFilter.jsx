import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Filter, RotateCcw, SearchX } from 'lucide-react';

import { getPatrols, getRangers } from '../api/patrols';
import PatrolMap from '../components/PatrolMap';
import PatrolTable from '../components/PatrolTable';
import { Card, EmptyState, ErrorState, LoadingState } from '../components/PatrolWidgets';
import { PATROL_STATUS, dayBoundary } from '../config/patrolUi';
import usePatrolData, { useParkMap } from '../hooks/usePatrolData';

const NO_FILTERS = { rangerId: '', routeId: '', status: '', from: '', to: '' };
const INPUT_STYLE =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500';

/** One labelled filter control with its error message underneath. */
function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

/** The filter bar: ranger, route, status, date range, Apply and Clear. */
function FilterBar({ draft, onChange, onApply, onClear, rangers, routes, errors }) {
  const set = (field) => (event) => onChange({ ...draft, [field]: event.target.value });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
    >
      <Field label="Ranger">
        <select value={draft.rangerId} onChange={set('rangerId')} className={INPUT_STYLE}>
          <option value="">All rangers</option>
          {rangers.map((ranger) => (
            <option key={ranger.rangerId} value={ranger.rangerId}>{ranger.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Route">
        <select value={draft.routeId} onChange={set('routeId')} className={INPUT_STYLE}>
          <option value="">All routes</option>
          {routes.map((route) => (
            <option key={route.routeId} value={route.routeId}>{route.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Status" error={errors.status}>
        <select value={draft.status} onChange={set('status')} className={INPUT_STYLE}>
          <option value="">All statuses</option>
          {Object.entries(PATROL_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>
      <Field label="From" error={errors.from}>
        <input type="date" value={draft.from} onChange={set('from')} className={INPUT_STYLE} />
      </Field>
      <Field label="To" error={errors.to}>
        <input type="date" value={draft.to} onChange={set('to')} className={INPUT_STYLE} />
      </Field>

      <div className="flex gap-3 md:col-span-2 xl:col-span-5 xl:justify-end">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Clear
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Filter size={15} />
          Apply
        </button>
      </div>
    </form>
  );
}

/** Screen 2: Filter Patrols (AF1). */
export default function PatrolFilter() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(NO_FILTERS);
  const [applied, setApplied] = useState(NO_FILTERS);

  const loadPatrols = useCallback(
    () =>
      getPatrols({
        ...applied,
        from: dayBoundary(applied.from),
        to: dayBoundary(applied.to, true),
      }),
    [applied]
  );
  const results = usePatrolData(loadPatrols);
  const rangerList = usePatrolData(getRangers);
  const parkMap = useParkMap();

  const clearFilters = () => {
    setDraft(NO_FILTERS);
    setApplied(NO_FILTERS);
  };
  const patrols = results.data?.patrols ?? [];
  const fieldErrors = results.error?.fields ?? {};
  const invalidFilters = Object.keys(fieldErrors).length > 0;
  const filtersApplied = Object.values(applied).some(Boolean);
  const routeIds = patrols.map((patrol) => patrol.route.routeId);
  const inField = patrols.filter((patrol) => patrol.status !== 'COMPLETED');

  return (
    <div className="space-y-5">
      <Card title="Patrol filters">
        <FilterBar
          draft={draft}
          onChange={setDraft}
          onApply={() => setApplied(draft)}
          onClear={clearFilters}
          rangers={rangerList.data ?? []}
          routes={parkMap.data?.routes ?? []}
          errors={fieldErrors}
        />
      </Card>

      {results.status === 'loading' && <LoadingState label="Loading patrols…" />}
      {results.status === 'error' && !invalidFilters && (
        <ErrorState message={results.error.message} onRetry={results.refresh} />
      )}

      {results.status === 'ready' && (
        <div className="grid gap-5 xl:grid-cols-3">
          <Card
            title={`Showing ${patrols.length} patrol${patrols.length === 1 ? '' : 's'}`}
            className="xl:col-span-2"
            action={
              filtersApplied && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Filters applied
                </span>
              )
            }
          >
            {patrols.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No patrols match these filters"
                actionLabel="Clear filters"
                onAction={clearFilters}
              />
            ) : (
              <PatrolTable
                patrols={patrols}
                onSelect={(patrolId) => navigate(`/patrols/${patrolId}`)}
              />
            )}
          </Card>
          <Card title="Map preview">
            <PatrolMap
              zones={parkMap.data?.zones}
              routes={(parkMap.data?.routes ?? []).filter((route) => routeIds.includes(route.routeId))}
              rangers={inField.flatMap((patrol) =>
                patrol.rangers.map((ranger) => ({ ...ranger, patrolId: patrol.patrolId }))
              )}
              height={300}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
