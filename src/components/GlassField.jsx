function GlassField({ label, id, ...inputProps }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-white/70 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 outline-none transition focus:border-emerald-300/60 focus:bg-white/15 focus:ring-2 focus:ring-emerald-300/30"
        {...inputProps}
      />
    </div>
  );
}

export default GlassField;
