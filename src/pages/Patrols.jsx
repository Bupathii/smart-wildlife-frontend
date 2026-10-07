import { NavLink, Route, Routes } from 'react-router-dom';

import { Activity, Filter, History } from 'lucide-react';

import PatrolDetails from './PatrolDetails';
import PatrolFilter from './PatrolFilter';
import PatrolHistory from './PatrolHistory';
import PatrolMonitoring from './PatrolMonitoring';

const TABS = [
  { to: '/patrols', label: 'Monitoring', icon: Activity, end: true },
  { to: '/patrols/filter', label: 'Filter Patrols', icon: Filter },
  { to: '/patrols/completed', label: 'Completed Patrols', icon: History },
];

/**
 * Entry point of "Monitor and Evaluate Ranger Patrol Activities".
 * Gives every patrol screen the same heading and tabs (consistent layout)
 * and decides which screen to show.
 */
export default function Patrols() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Patrol Monitoring</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor and evaluate ranger patrol activities in Yala National Park.
        </p>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2 border-b border-slate-200" aria-label="Patrol screens">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<PatrolMonitoring />} />
        <Route path="filter" element={<PatrolFilter />} />
        <Route path="completed" element={<PatrolHistory />} />
        <Route path=":patrolId" element={<PatrolDetails />} />
      </Routes>
    </div>
  );
}
