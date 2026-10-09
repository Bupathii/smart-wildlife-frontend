function PlaceholderPage({
  title,
  description,
  children,
}) {
  return (
    <div>
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
          <div className="flex min-h-40 items-center justify-center text-center">
            <div>
              <p className="font-medium text-slate-600">
                Module Ready
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Functionality will be implemented in
                the relevant development phase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaceholderPage;