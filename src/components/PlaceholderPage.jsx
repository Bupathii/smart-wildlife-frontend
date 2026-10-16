import { ArrowUpRight, Construction, Leaf, ShieldCheck } from 'lucide-react';

function PlaceholderPage({
  title,
  description,
  children,
}) {
  return (
    <div className="ws-placeholder-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {children || (
          <div className="ws-placeholder-content">
            <div className="ws-placeholder-orb"><Construction size={27} strokeWidth={1.6} /></div>
            <span className="ws-placeholder-tag"><Leaf size={13} /> UPCOMING MODULE</span>
            <h3>Taking shape behind the scenes.</h3>
            <p>This workspace is planned for a future implementation phase. Existing operational features remain available from the navigation.</p>
            <div className="ws-placeholder-foot"><ShieldCheck size={16} /> WildSentinel Operations Platform <ArrowUpRight size={15}/></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaceholderPage;