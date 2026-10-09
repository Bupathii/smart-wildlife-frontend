import {
  AlertTriangle,
  BellRing,
  Map,
  PawPrint,
  Users,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import apiClient from '../api/client';

import {
  getCurrentUser,
} from '../config/roleAccess';

function Dashboard() {
  const user = getCurrentUser();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const { data } = await apiClient.get('/tracking/alerts');
        setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
      } catch (error) {
        setAlerts([]);
      }
    }

    loadAlerts();
  }, []);

  const summary = useMemo(() => {
    const activeAlerts = alerts.filter(
      (alert) => !['RESOLVED', 'ESCALATED'].includes(String(alert.status || '').toUpperCase())
    );

    return {
      activeRangers: 1,
      activePatrols: 1,
      reportedIncidents: 0,
      activeAlerts: activeAlerts.length,
      trackedAnimals: 1,
    };
  }, [alerts]);

  const recentAlerts = useMemo(
    () => alerts.slice(0, 4),
    [alerts]
  );

  const cards = [
    { label: 'Active Rangers', value: summary.activeRangers, icon: Users },
    { label: 'Active Patrols', value: summary.activePatrols, icon: Map },
    { label: 'Reported Incidents', value: summary.reportedIncidents, icon: AlertTriangle },
    { label: 'Active Alerts', value: summary.activeAlerts, icon: BellRing },
    { label: 'Tracked Animals', value: summary.trackedAnimals, icon: PawPrint },
  ];

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Welcome back,{' '}
          {user?.name || 'User'}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(
          ({
            label,
            value,
            icon: Icon,
          }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon size={20} />
              </div>

              <p className="text-sm text-slate-500">
                {label}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-800">
                {value}
              </p>
            </div>
          )
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="min-h-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800">
            Patrol Overview
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Patrol coverage and ranger locations will appear here.
          </p>
        </div>

        <div className="min-h-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800">
            Recent Activity
          </h3>

          {recentAlerts.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              Recent incidents, conflict reports and alerts will appear here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.alertId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">{alert.alertId}</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                      {alert.status || 'NEW'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Animal {alert.animalId} • {alert.zone}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;