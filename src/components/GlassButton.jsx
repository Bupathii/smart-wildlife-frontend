function GlassButton({ children, ...buttonProps }) {
  return (
    <button
      className="w-full rounded-xl bg-emerald-400 py-2.5 font-semibold text-emerald-950 shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default GlassButton;
