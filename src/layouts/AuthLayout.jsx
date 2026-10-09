function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900 flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-lime-300/10 blur-2xl" />

      <div className="relative w-full max-w-sm">
        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-8">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 mb-3">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-white/60 mb-8">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
