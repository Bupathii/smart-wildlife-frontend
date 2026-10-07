import { useState } from 'react';

import {
  CalendarPlus,
  CheckCircle2,
  Pencil,
  Smartphone,
  XCircle,
} from 'lucide-react';

import {
  cancelPatrol,
  createPatrol,
  getPatrols,
  getRangers,
  readApiError,
  updatePatrol,
} from '../api/patrols';
import { Card, EmptyState, ErrorState, LoadingState } from '../components/PatrolWidgets';
import { getCurrentUser } from '../config/roleAccess';
import {
  OPEN_PATROL_STATUSES,
  PATROL_DEFAULT_DURATION_HOURS,
  ROUTE_MANAGER_ROLES,
  formatDateTime,
  rangerNames,
  toDateTimeInput,
} from '../config/patrolUi';
import usePatrolData, { useParkMap } from '../hooks/usePatrolData';

const loadAllPatrols = () => getPatrols();
const HOUR_MS = 3_600_000;
const INPUT_STYLE =
  'w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500';
const BUTTON_STYLE =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100';

/** A blank plan starting in 30 minutes, or a copy of a planned patrol to edit. */
function toDraft(patrol) {
  const start = patrol ? new Date(patrol.startTime) : new Date(Date.now() + HOUR_MS / 2);
  const end = patrol
    ? new Date(patrol.endTime)
    : new Date(start.getTime() + PATROL_DEFAULT_DURATION_HOURS * HOUR_MS);

  return {
    patrolId: patrol?.patrolId ?? null,
    routeId: patrol?.route.routeId ?? '',
    rangerIds: patrol?.rangers.map((ranger) => ranger.rangerId) ?? [],
    startTime: toDateTimeInput(start),
    endTime: toDateTimeInput(end),
  };
}

/** Which patrol (planned or in the field) each ranger is already on. */
function busyRangers(patrols, ownPatrolId) {
  const busy = {};
  patrols
    .filter((patrol) => OPEN_PATROL_STATUSES.includes(patrol.status))
    .filter((patrol) => patrol.patrolId !== ownPatrolId)
    .forEach((patrol) => {
      patrol.rangers.forEach((ranger) => {
        busy[ranger.rangerId] = patrol.patrolId;
      });
    });
  return busy;
}

/** Checkbox list of rangers; those on another patrol cannot be picked. */
function RangerPicker({ rangers, busy, selected, onChange, disabled }) {
  const toggle = (rangerId) =>
    onChange(
      selected.includes(rangerId)
        ? selected.filter((id) => id !== rangerId)
        : [...selected, rangerId]
    );

  return (
    <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
      {rangers.map((ranger) => {
        const onPatrol = busy[ranger.rangerId];
        return (
          <li key={ranger.rangerId}>
            <label
              className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${
                onPatrol ? 'text-slate-400' : 'cursor-pointer text-slate-800 hover:bg-slate-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(ranger.rangerId)}
                disabled={disabled || Boolean(onPatrol)}
                onChange={() => toggle(ranger.rangerId)}
                className="h-4 w-4 accent-emerald-700"
              />
              <span className="flex-1">
                {ranger.name}
                <span className="ml-2 text-xs text-slate-500">{ranger.rank}</span>
              </span>
              {ranger.usesMobileApp && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800"
                  title="This ranger signs in to the mobile app and is tracked by their phone"
                >
                  <Smartphone size={12} />
                  Mobile app
                </span>
              )}
              {onPatrol && <span className="text-xs">on {onPatrol}</span>}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/** The plan form: route, rangers, start and end time. */
function PlanForm({ draft, onChange, onSave, onCancel, routes, rangers, busy, errors, failure, saving }) {
  const set = (field) => (event) => onChange({ ...draft, [field]: event.target.value });
  const border = (field) => (errors[field] ? 'border-red-400' : 'border-slate-300');

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
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Patrol route</span>
        <select
          value={draft.routeId}
          onChange={set('routeId')}
          disabled={saving}
          className={`${INPUT_STYLE} ${border('routeId')}`}
        >
          <option value="">Choose a route…</option>
          {routes.map((route) => (
            <option key={route.routeId} value={route.routeId}>
              {route.name} ({route.routeLength} km)
            </option>
          ))}
        </select>
        {errors.routeId && <span className="mt-1 block text-sm text-red-600">{errors.routeId}</span>}
      </label>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-slate-700">
          Rangers ({draft.rangerIds.length} selected)
        </p>
        <RangerPicker
          rangers={rangers}
          busy={busy}
          selected={draft.rangerIds}
          onChange={(rangerIds) => onChange({ ...draft, rangerIds })}
          disabled={saving}
        />
        {errors.rangerIds && <p className="mt-1 text-sm text-red-600">{errors.rangerIds}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Planned start</span>
          <input
            type="datetime-local"
            value={draft.startTime}
            onChange={set('startTime')}
            disabled={saving}
            className={`${INPUT_STYLE} ${border('startTime')}`}
          />
          {errors.startTime && (
            <span className="mt-1 block text-sm text-red-600">{errors.startTime}</span>
          )}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">Planned end</span>
          <input
            type="datetime-local"
            value={draft.endTime}
            onChange={set('endTime')}
            disabled={saving}
            className={`${INPUT_STYLE} ${border('endTime')}`}
          />
          {errors.endTime && <span className="mt-1 block text-sm text-red-600">{errors.endTime}</span>}
        </label>
      </div>

      {failure && <p className="text-sm text-red-600" role="alert">{failure}</p>}

      <div className="flex justify-end gap-3">
        {draft.patrolId && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Stop editing
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : draft.patrolId ? 'Save changes' : 'Assign patrol'}
        </button>
      </div>
    </form>
  );
}

/** Patrols that are assigned but not started yet. */
function PlannedPatrolList({ patrols, canManage, onEdit, onCancel }) {
  if (patrols.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No planned patrols"
        message="Assign rangers to a route to plan the next patrol."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {patrols.map((patrol) => (
        <li key={patrol.patrolId} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-slate-900">
              {patrol.patrolId} · {patrol.route.name}
            </p>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              Planned
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{rangerNames(patrol)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(patrol.startTime)} → {formatDateTime(patrol.endTime)}
          </p>
          {canManage && (
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => onEdit(patrol)} className={BUTTON_STYLE}>
                <Pencil size={13} />
                Edit
              </button>
              <button type="button" onClick={() => onCancel(patrol)} className={BUTTON_STYLE}>
                <XCircle size={13} />
                Cancel patrol
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Plan Patrols: the Park Manager assigns rangers to a route for a time
 * slot. The patrol stays "Planned" until the ranger starts it in the
 * mobile app; from then on it appears on the Monitoring tab.
 */
export default function PatrolPlanning() {
  const patrols = usePatrolData(loadAllPatrols);
  const rangerList = usePatrolData(getRangers);
  const parkMap = useParkMap();
  const [draft, setDraft] = useState(() => toDraft(null));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = ROUTE_MANAGER_ROLES.includes(getCurrentUser()?.role);

  if (patrols.status === 'loading') return <LoadingState label="Loading patrol plans…" />;
  if (patrols.status === 'error') {
    return <ErrorState message={patrols.error.message} onRetry={patrols.refresh} />;
  }

  const allPatrols = patrols.data.patrols;
  const planned = allPatrols
    .filter((patrol) => patrol.status === 'PLANNED')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  function resetForm(message = '') {
    setDraft(toDraft(null));
    setErrors({});
    setFailure('');
    setNotice(message);
  }

  async function savePlan() {
    setSaving(true);
    setFailure('');
    setNotice('');
    try {
      const body = {
        routeId: draft.routeId,
        rangerIds: draft.rangerIds,
        startTime: draft.startTime ? new Date(draft.startTime).toISOString() : '',
        endTime: draft.endTime ? new Date(draft.endTime).toISOString() : '',
      };
      const saved = draft.patrolId
        ? await updatePatrol(draft.patrolId, body)
        : await createPatrol(body);
      resetForm(`Patrol ${saved.patrolId} ${draft.patrolId ? 'updated' : 'assigned'}`);
      await patrols.refresh();
    } catch (error) {
      const { message, fields } = readApiError(error);
      setErrors(fields);
      setFailure(Object.keys(fields).length > 0 ? '' : message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelPlan(patrol) {
    if (!window.confirm(`Cancel patrol ${patrol.patrolId}? Its rangers become free again.`)) return;
    try {
      await cancelPatrol(patrol.patrolId);
      resetForm(`Patrol ${patrol.patrolId} cancelled`);
      await patrols.refresh();
    } catch (error) {
      setNotice('');
      setFailure(readApiError(error).message);
    }
  }

  return (
    <div className="space-y-5">
      {notice && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {canManage && (
          <Card title={draft.patrolId ? `Edit patrol ${draft.patrolId}` : 'Assign a new patrol'}>
            <PlanForm
              draft={draft}
              onChange={setDraft}
              onSave={savePlan}
              onCancel={() => resetForm()}
              routes={parkMap.data?.routes ?? []}
              rangers={rangerList.data ?? []}
              busy={busyRangers(allPatrols, draft.patrolId)}
              errors={errors}
              failure={failure}
              saving={saving}
            />
          </Card>
        )}

        <Card title={`Planned patrols (${planned.length})`}>
          <PlannedPatrolList
            patrols={planned}
            canManage={canManage}
            onEdit={(patrol) => {
              setDraft(toDraft(patrol));
              setErrors({});
              setFailure('');
              setNotice('');
            }}
            onCancel={cancelPlan}
          />
          <p className="mt-4 text-xs text-slate-500">
            The assigned ranger starts the patrol in the mobile app. Once started it moves to the
            Monitoring tab, and a ranger marked “Mobile app” is tracked by their phone.
          </p>
        </Card>
      </div>
    </div>
  );
}
