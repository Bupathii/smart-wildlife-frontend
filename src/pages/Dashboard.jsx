import {
  AlertTriangle,
  BellRing,
  Map,
  PawPrint,
  Users,
} from 'lucide-react';

import {
  getCurrentUser,
} from '../config/roleAccess';

const cards = [
  {
    label: 'Active Rangers',
    value: '--',
    icon: Users,
  },
  {
    label: 'Active Patrols',
    value: '--',
    icon: Map,
  },
  {
    label: 'Reported Incidents',
    value: '--',
    icon: AlertTriangle,
  },
  {
    label: 'Active Alerts',
    value: '--',
    icon: BellRing,
  },
  {
    label: 'Tracked Animals',
    value: '--',
    icon: PawPrint,
  },
];

function Dashboard() {
  const user = getCurrentUser();

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
            Patrol coverage and ranger
            locations will appear here.
          </p>
        </div>

        <div className="min-h-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-800">
            Recent Activity
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Recent incidents, conflict
            reports and alerts will
            appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;