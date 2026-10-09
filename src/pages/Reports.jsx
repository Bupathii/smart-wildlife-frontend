import {
  ArrowRight,
  BarChart3,
  MapPinned,
  ShieldAlert,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

export default function Reports() {
  const navigate =
    useNavigate();

  return (
    <main>
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
          <BarChart3
            size={18}
          />

          Reports & Analytics
        </div>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Conservation Analytics
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Review analytical reports
          generated from wildlife
          conservation operations.
        </p>
      </div>

      <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* CONFLICT ANALYTICS */}

        <button
          type="button"
          onClick={() =>
            navigate(
              '/reports/conflicts'
            )
          }
          className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <ShieldAlert
              size={23}
              className="text-emerald-700"
            />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            Human-Wildlife Conflict Trends
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Analyse community
            conflict reports by type,
            location, response status
            and time.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-700">
            View Analytics

            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </button>

        {/* PLACEHOLDER FOR GROUP */}

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <MapPinned
              size={23}
              className="text-slate-500"
            />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-700">
            Additional Analytics
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Patrol, incident and other
            conservation analytics can
            be integrated here by the
            relevant project modules.
          </p>
        </div>
      </section>
    </main>
  );
}