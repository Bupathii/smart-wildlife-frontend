import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from 'react-leaflet';

import apiClient from '../api/client';

const ACTION_STYLES = {
  acknowledge: 'bg-emerald-600 hover:bg-emerald-700',
  response: 'bg-amber-500 hover:bg-amber-600',
  resolve: 'bg-slate-700 hover:bg-slate-800',
  escalate: 'bg-red-600 hover:bg-red-700',
};

function statusBadgeClass(status = '') {
  const normalized = String(status).toUpperCase();

  if (normalized === 'ACKNOWLEDGED') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized === 'RESPONSE_INITIATED') {
    return 'bg-amber-100 text-amber-700';
  }

  if (normalized === 'RESOLVED') {
    return 'bg-slate-200 text-slate-700';
  }

  if (normalized === 'ESCALATED') {
    return 'bg-red-100 text-red-700';
  }

  return 'bg-sky-100 text-sky-700';
}

function priorityBadgeClass(priority = '') {
  const normalized = String(priority).toUpperCase();

  if (normalized === 'HIGH') {
    return 'bg-red-100 text-red-700';
  }

  if (normalized === 'MEDIUM') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function AlertLocationMap({ latitude, longitude }) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return (
    <div className="mt-4 h-52 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[lat, lng]}
          radius={200}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#f87171',
            fillOpacity: 0.35,
            weight: 2,
          }}
        />
        <CircleMarker center={[lat, lng]} radius={8} pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.9 }}>
          <Popup>
            <div className="text-sm font-medium text-slate-700">
              Animal detected here
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const activeAlerts = useMemo(
    () => alerts.filter(
      (alert) => !['RESOLVED', 'ESCALATED'].includes(String(alert.status || '').toUpperCase())
    ),
    [alerts]
  );

  const summary = useMemo(() => {
    const total = activeAlerts.length;
    const high = activeAlerts.filter((alert) => String(alert.priority || '').toUpperCase() === 'HIGH').length;
    const acknowledged = activeAlerts.filter((alert) => String(alert.status || '').toUpperCase() === 'ACKNOWLEDGED').length;
    const response = activeAlerts.filter((alert) => String(alert.status || '').toUpperCase() === 'RESPONSE_INITIATED').length;

    return { total, high, acknowledged, response };
  }, [activeAlerts]);

  const loadAlerts = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setError('');
      }

      const { data } = await apiClient.get('/tracking/alerts');
      setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
    } catch (err) {
      if (!silent) {
        setError(err?.response?.data?.message || 'Unable to load wildlife alerts.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const updateAlert = useCallback(async (alertId, action) => {
    try {
      setBusyId(alertId);

      if (action === 'acknowledge') {
        await apiClient.post(`/tracking/alerts/${alertId}/acknowledge`);
      } else if (action === 'response') {
        await apiClient.put(`/tracking/alerts/${alertId}/response`, {
          responseType: 'INVESTIGATE',
          notes: 'Response initiated by dashboard ranger.',
        });
      } else if (action === 'resolve') {
        await apiClient.put(`/tracking/alerts/${alertId}/resolve`, {
          notes: 'Resolved through dashboard action.',
        });
      } else if (action === 'escalate') {
        await apiClient.put(`/tracking/alerts/${alertId}/escalate`, {
          notes: 'Escalated from dashboard.',
        });
      }

      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update the alert.');
    } finally {
      setBusyId(null);
    }
  }, [loadAlerts]);

  useEffect(() => {
    void loadAlerts();
    const refreshTimer = window.setInterval(() => {
      void loadAlerts({ silent: true });
    }, 5000);

    return () => window.clearInterval(refreshTimer);
  }, [loadAlerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Wildlife Risk Alerts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Active alerts assigned to the Ranger responder workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Active</p>
            <BellRing size={18} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{summary.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">High priority</p>
            <TriangleAlert size={18} className="text-red-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{summary.high}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Acknowledged</p>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{summary.acknowledged}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">In response</p>
            <Clock3 size={18} className="text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-800">{summary.response}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Loading risk alerts...
        </div>
      ) : activeAlerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
          No active wildlife risk alerts at the moment.
        </div>
      ) : (
        <div className="grid gap-4">
          {activeAlerts.map((alert) => (
            <div key={alert.alertId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${priorityBadgeClass(alert.priority)}`}>
                      {alert.priority || 'MEDIUM'} PRIORITY
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${statusBadgeClass(alert.status)}`}>
                      {alert.status || 'NEW'}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Alert ID</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-800">{alert.alertId}</h3>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <BellRing size={16} className="text-amber-500" />
                      <span>Animal: <strong className="text-slate-800">{alert.animalId}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-emerald-600" />
                      <span>Zone: <strong className="text-slate-800">{alert.zone}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <ShieldAlert size={16} className="text-red-500" />
                      <span>Coordinates: <strong className="text-slate-800">{Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <AlertTriangle size={16} className="text-sky-500" />
                      <span>Time: <strong className="text-slate-800">{alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Not available'}</strong></span>
                    </div>
                  </div>

                  <AlertLocationMap latitude={alert.latitude} longitude={alert.longitude} />
                </div>

                <div className="flex w-full max-w-xs flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => updateAlert(alert.alertId, 'acknowledge')}
                    disabled={busyId === alert.alertId}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${ACTION_STYLES.acknowledge} ${busyId === alert.alertId ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    Acknowledge
                  </button>

                  <button
                    type="button"
                    onClick={() => updateAlert(alert.alertId, 'response')}
                    disabled={busyId === alert.alertId}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${ACTION_STYLES.response} ${busyId === alert.alertId ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    Initiate Response
                  </button>

                  <button
                    type="button"
                    onClick={() => updateAlert(alert.alertId, 'resolve')}
                    disabled={busyId === alert.alertId}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${ACTION_STYLES.resolve} ${busyId === alert.alertId ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    Resolve
                  </button>

                  <button
                    type="button"
                    onClick={() => updateAlert(alert.alertId, 'escalate')}
                    disabled={busyId === alert.alertId}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${ACTION_STYLES.escalate} ${busyId === alert.alertId ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    Escalate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={16} />
          Ranger workflow ready
        </div>
        <p className="mt-1 text-emerald-700/80">
          This page uses the same backend alert lifecycle as the mobile prototype and keeps the response flow aligned with the wildlife risk alert system.
        </p>
      </div>
    </div>
  );
}