import { useState } from 'react';

import {
  CheckCircle2,
  MapPinned,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';

import {
  createRoute,
  deleteRoute,
  getRoutes,
  readApiError,
  updateRoute,
} from '../api/patrols';
import RouteEditorMap from '../components/RouteEditorMap';
import { Card, EmptyState, ErrorState, LoadingState } from '../components/PatrolWidgets';
import { getCurrentUser } from '../config/roleAccess';
import {
  DEFAULT_PARK_ID,
  ROUTE_DESCRIPTION_MAX_LENGTH,
  ROUTE_MANAGER_ROLES,
  ROUTE_MIN_WAYPOINTS,
  ROUTE_NAME_MAX_LENGTH,
  pathLengthKm,
} from '../config/patrolUi';
import usePatrolData, { useParkMap } from '../hooks/usePatrolData';

const loadRoutes = () => getRoutes(DEFAULT_PARK_ID);
const INPUT_STYLE =
  'w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500';
const BUTTON_STYLE =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50';

/** Checks the same rules as the server so mistakes show immediately. */
function validate(draft) {
  const errors = {};
  if (draft.name.trim() === '') errors.name = 'Route name is required';
  if (draft.waypoints.length < ROUTE_MIN_WAYPOINTS) {
    errors.waypoints = `A route needs at least ${ROUTE_MIN_WAYPOINTS} waypoints`;
  }
  return errors;
}

/** A blank form, or a copy of an existing route ready to edit. */
function toDraft(route) {
  return {
    routeId: route?.routeId ?? null,
    name: route?.name ?? '',
    description: route?.description ?? '',
    waypoints: (route?.waypoints ?? []).map(({ latitude, longitude }) => ({ latitude, longitude })),
    locked: Boolean(route?.hasActivePatrol),
  };
}

/** How a route is being used by patrols. */
function UsageBadge({ route }) {
  if (route.hasActivePatrol) {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        In use now
      </span>
    );
  }
  if (route.patrolCount > 0) {
    return (
      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">
        Used by {route.patrolCount} patrol{route.patrolCount === 1 ? '' : 's'}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      Not used yet
    </span>
  );
}

/** One route in the list, with its Edit and Delete buttons. */
function RouteListItem({ route, zoneNames, selected, canManage, onSelect, onEdit, onDelete }) {
  return (
    <li
      className={`rounded-xl border p-4 transition ${
        selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
      }`}
    >
      <button type="button" onClick={() => onSelect(route.routeId)} className="w-full text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-slate-900">{route.name}</p>
          <UsageBadge route={route} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {route.routeId} · {route.routeLength} km · {route.waypoints.length} waypoints
        </p>
        <p className="mt-1 text-xs text-slate-500">Zones: {zoneNames || '—'}</p>
        {route.description && <p className="mt-2 text-sm text-slate-600">{route.description}</p>}
      </button>

      {canManage && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => onEdit(route)} className={BUTTON_STYLE}>
            <Pencil size={13} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(route)}
            disabled={route.patrolCount > 0}
            title={route.patrolCount > 0 ? 'Routes used by patrols cannot be deleted' : ''}
            className={BUTTON_STYLE}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

/** The numbered waypoints of the route being edited. */
function WaypointList({ draft, onChange }) {
  const remove = (index) =>
    onChange({ ...draft, waypoints: draft.waypoints.filter((_, position) => position !== index) });

  if (draft.waypoints.length === 0) {
    return <p className="text-sm text-slate-500">Click on the map to add the first waypoint. You can drag waypoints afterwards to adjust them.</p>;
  }
  return (
    <ol className="max-h-44 space-y-1 overflow-y-auto">
      {draft.waypoints.map((waypoint, index) => (
        <li
          key={`${waypoint.latitude}-${waypoint.longitude}-${index}`}
          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
        >
          <span>
            <span className="font-bold">{index + 1}.</span> {waypoint.latitude}, {waypoint.longitude}
          </span>
          {!draft.locked && (
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Remove waypoint ${index + 1}`}
              className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-red-600"
            >
              <X size={14} />
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The create / edit form. Waypoints are added by clicking the map. */
function RouteForm({ draft, onChange, onSave, onCancel, errors, failure, saving }) {
  const set = (field) => (event) => onChange({ ...draft, [field]: event.target.value });
  const undoLast = () => onChange({ ...draft, waypoints: draft.waypoints.slice(0, -1) });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      noValidate
      className="space-y-4"
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Route name</span>
        <input
          value={draft.name}
          onChange={set('name')}
          maxLength={ROUTE_NAME_MAX_LENGTH}
          disabled={saving}
          placeholder="e.g. Northern Waterhole Loop"
          className={`${INPUT_STYLE} ${errors.name ? 'border-red-400' : 'border-slate-300'}`}
        />
        {errors.name && <span className="mt-1 block text-sm text-red-600">{errors.name}</span>}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span>
        <textarea
          rows={2}
          value={draft.description}
          onChange={set('description')}
          maxLength={ROUTE_DESCRIPTION_MAX_LENGTH}
          disabled={saving}
          className={`${INPUT_STYLE} ${errors.description ? 'border-red-400' : 'border-slate-300'}`}
        />
        {errors.description && (
          <span className="mt-1 block text-sm text-red-600">{errors.description}</span>
        )}
      </label>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Waypoints ({draft.waypoints.length}) · {pathLengthKm(draft.waypoints)} km
          </span>
          {!draft.locked && (
            <button
              type="button"
              onClick={undoLast}
              disabled={draft.waypoints.length === 0 || saving}
              className={BUTTON_STYLE}
            >
              <Undo2 size={13} />
              Undo last
            </button>
          )}
        </div>
        {draft.locked && (
          <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            A patrol is using this route, so its waypoints cannot be changed. You can still edit
            the name and description.
          </p>
        )}
        <WaypointList draft={draft} onChange={onChange} />
        {errors.waypoints && <p className="mt-1 text-sm text-red-600">{errors.waypoints}</p>}
      </div>

      {failure && <p className="text-sm text-red-600" role="alert">{failure}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : draft.routeId ? 'Save changes' : 'Create route'}
        </button>
      </div>
    </form>
  );
}

/**
 * Patrol Routes: view, create, edit and delete the planned routes that
 * patrols follow. Length and zones are worked out from the waypoints.
 */
export default function PatrolRoutes() {
  const routes = usePatrolData(loadRoutes);
  const parkMap = useParkMap();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = ROUTE_MANAGER_ROLES.includes(getCurrentUser()?.role);
  const zones = parkMap.data?.zones ?? [];

  if (routes.status === 'loading') return <LoadingState label="Loading patrol routes…" />;
  if (routes.status === 'error') {
    return <ErrorState message={routes.error.message} onRetry={routes.refresh} />;
  }

  const allRoutes = routes.data;
  const selected = allRoutes.find((route) => route.routeId === selectedId) ?? null;
  const zoneNamesOf = (route) =>
    zones
      .filter((zone) => route.zoneIds.includes(zone.zoneId))
      .map((zone) => zone.name)
      .join(', ');

  function startEditing(route) {
    setDraft(toDraft(route));
    setSelectedId(route?.routeId ?? null);
    setErrors({});
    setFailure('');
    setNotice('');
  }

  async function saveDraft() {
    const problems = validate(draft);
    setErrors(problems);
    setFailure('');
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      const body = { name: draft.name, description: draft.description, waypoints: draft.waypoints };
      const saved = draft.routeId
        ? await updateRoute(DEFAULT_PARK_ID, draft.routeId, body)
        : await createRoute(DEFAULT_PARK_ID, body);
      setNotice(`Route "${saved.name}" ${draft.routeId ? 'updated' : 'created'}`);
      setSelectedId(saved.routeId);
      setDraft(null);
      await routes.refresh();
    } catch (error) {
      const { message, fields } = readApiError(error);
      setErrors(fields);
      setFailure(Object.keys(fields).length > 0 ? '' : message);
    } finally {
      setSaving(false);
    }
  }

  async function removeRoute(route) {
    if (!window.confirm(`Delete the route "${route.name}"? This cannot be undone.`)) return;
    setNotice('');
    setFailure('');
    try {
      await deleteRoute(DEFAULT_PARK_ID, route.routeId);
      setNotice(`Route "${route.name}" deleted`);
      setSelectedId(null);
      await routes.refresh();
    } catch (error) {
      setFailure(readApiError(error).message);
    }
  }

  const editingWaypoints = draft && !draft.locked;
  const addWaypoint = (point) =>
    setDraft((current) => ({ ...current, waypoints: [...current.waypoints, point] }));
  const moveWaypoint = (index, point) =>
    setDraft((current) => ({
      ...current,
      waypoints: current.waypoints.map((waypoint, position) =>
        position === index ? point : waypoint
      ),
    }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patrol Routes</h1>
          <p className="mt-1 text-sm text-slate-500">
            The planned routes that ranger patrols follow in Yala National Park.
          </p>
        </div>
        {canManage && !draft && (
          <button
            type="button"
            onClick={() => startEditing(null)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Plus size={16} />
            New route
          </button>
        )}
      </div>

      {notice && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </p>
      )}
      {failure && !draft && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {failure}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="xl:col-span-2">
          {draft ? (
            <Card title={draft.routeId ? `Edit route ${draft.routeId}` : 'New route'}>
              <RouteForm
                draft={draft}
                onChange={setDraft}
                onSave={saveDraft}
                onCancel={() => setDraft(null)}
                errors={errors}
                failure={failure}
                saving={saving}
              />
            </Card>
          ) : (
            <Card title={`Routes (${allRoutes.length})`}>
              {allRoutes.length === 0 ? (
                <EmptyState
                  icon={MapPinned}
                  title="No patrol routes yet"
                  message="Create the first route to start planning patrols."
                />
              ) : (
                <ul className="space-y-3">
                  {allRoutes.map((route) => (
                    <RouteListItem
                      key={route.routeId}
                      route={route}
                      zoneNames={zoneNamesOf(route)}
                      selected={route.routeId === selectedId}
                      canManage={canManage}
                      onSelect={setSelectedId}
                      onEdit={startEditing}
                      onDelete={removeRoute}
                    />
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <Card
          title={editingWaypoints ? 'Click the map to add a waypoint · drag a waypoint to move it' : 'Route map'}
          className="xl:col-span-3"
        >
          <RouteEditorMap
            zones={zones}
            routes={allRoutes.filter((route) => route.routeId !== (draft?.routeId ?? selectedId))}
            waypoints={draft ? draft.waypoints : (selected?.waypoints ?? [])}
            focusKey={draft ? `edit-${draft.routeId ?? 'new'}` : selectedId}
            onAddWaypoint={editingWaypoints ? addWaypoint : undefined}
            onMoveWaypoint={editingWaypoints ? moveWaypoint : undefined}
          />
          <p className="mt-3 text-xs text-slate-500">
            {draft
              ? 'Drag a numbered waypoint to adjust it, or click the map to add one at the end. Waypoints must stay inside the outlined park zones. Other routes are shown in grey.'
              : 'Select a route to see its waypoints. Other routes are shown in grey.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
