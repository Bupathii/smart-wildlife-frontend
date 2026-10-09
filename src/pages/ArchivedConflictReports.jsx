import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  getArchivedConflictReports,
  permanentlyDeleteConflictReport,
  restoreConflictReport,
} from '../api/conflicts';

function getConflictTypeLabel(
  type
) {
  switch (type) {
    case 'ELEPHANT_SIGHTING':
      return 'Elephant Sighting';

    case 'CROP_RAIDING':
      return 'Crop Raiding';

    case 'OTHER':
      return 'Other Conflict';

    default:
      return (
        type?.replaceAll(
          '_',
          ' '
        ) || 'Unknown'
      );
  }
}

function formatDate(
  date
) {
  if (!date) {
    return 'Not available';
  }

  return new Date(
    date
  ).toLocaleString();
}

export default function ArchivedConflictReports() {
  const navigate =
    useNavigate();

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    totalReports,
    setTotalReports,
  ] = useState(0);

  /*
   * Restore modal
   */
  const [
    restoreTarget,
    setRestoreTarget,
  ] = useState(null);

  const [
    restoring,
    setRestoring,
  ] = useState(false);

  /*
   * Delete modal
   */
  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState('');

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState('');

  const LIMIT = 10;

  async function loadReports() {
    try {
      setLoading(true);
      setError('');

      const result =
        await getArchivedConflictReports({
          page,
          limit: LIMIT,
        });

      setReports(
        result.reports || []
      );

      setTotalPages(
        result.pagination
          ?.totalPages || 1
      );

      setTotalReports(
        result.pagination
          ?.totalReports ??
          result.reports
            ?.length ??
          0
      );
    } catch (err) {
      setReports([]);

      setError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to load archived reports.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [page]);

  const visibleReports =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return reports;
      }

      return reports.filter(
        (report) =>
          getConflictTypeLabel(
            report.conflictType
          )
            .toLowerCase()
            .includes(
              query
            ) ||
          (
            report.description ||
            ''
          )
            .toLowerCase()
            .includes(
              query
            ) ||
          (
            report.archiveInfo
              ?.reason ||
            ''
          )
            .toLowerCase()
            .includes(
              query
            )
      );
    }, [
      reports,
      search,
    ]);

  async function handleRestore() {
    if (
      !restoreTarget
    ) {
      return;
    }

    try {
      setRestoring(true);
      setActionError('');

      await restoreConflictReport(
        restoreTarget._id
      );

      setRestoreTarget(
        null
      );

      if (
        reports.length === 1 &&
        page > 1
      ) {
        setPage(
          page - 1
        );
      } else {
        await loadReports();
      }
    } catch (err) {
      setActionError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to restore the report.'
      );
    } finally {
      setRestoring(false);
    }
  }

  async function handlePermanentDelete() {
    if (
      !deleteTarget ||
      deleteConfirmation !==
        'DELETE'
    ) {
      return;
    }

    try {
      setDeleting(true);
      setActionError('');

      await permanentlyDeleteConflictReport(
        deleteTarget._id
      );

      setDeleteTarget(
        null
      );

      setDeleteConfirmation(
        ''
      );

      if (
        reports.length === 1 &&
        page > 1
      ) {
        setPage(
          page - 1
        );
      } else {
        await loadReports();
      }
    } catch (err) {
      setActionError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to permanently delete the report.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1500px]">

      {/* HEADER */}

      <button
        type="button"
        onClick={() =>
          navigate(
            '/conflicts'
          )
        }
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-emerald-700"
      >
        <ArrowLeft
          size={17}
        />

        Back to Conflict Reports
      </button>

      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
            <Archive
              size={18}
            />

            System Administration
          </div>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Archived Conflict Reports
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Review reports removed
            from normal operations.
            Archived reports can be
            restored or permanently
            deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={
            loadReports
          }
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
        >
          <RefreshCw
            size={17}
          />

          Refresh
        </button>
      </section>

      {/* WARNING */}

      <section className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <AlertCircle
          size={21}
          className="mt-0.5 shrink-0 text-red-600"
        />

        <div>
          <p className="font-bold text-red-900">
            Permanent deletion cannot be undone
          </p>

          <p className="mt-1 text-sm leading-6 text-red-700">
            Permanently deleting an
            archived report removes
            the database record and
            its uploaded evidence.
          </p>
        </div>
      </section>

      {/* SUMMARY / SEARCH */}

      <section className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Archived Reports
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalReports}
          </p>
        </div>

        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative w-full">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search archived reports..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* LIST */}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {loading && (
          <div className="flex min-h-[420px] flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading archived reports...
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          visibleReports
            .length === 0 && (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <Archive
                size={38}
                className="text-slate-400"
              />

              <h2 className="mt-4 font-bold text-slate-800">
                No archived reports
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Archived conflict
                reports will appear
                here.
              </p>
            </div>
          )}

        {!loading &&
          visibleReports
            .length > 0 && (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">
                        Report
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Archive Reason
                      </th>

                      <th className="px-5 py-4">
                        Archived By
                      </th>

                      <th className="px-5 py-4">
                        Archived On
                      </th>

                      <th className="px-5 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleReports.map(
                      (
                        report
                      ) => (
                        <tr
                          key={
                            report._id
                          }
                        >
                          <td className="px-5 py-4">
                            <div className="max-w-xs">
                              <p className="font-bold text-slate-800">
                                {getConflictTypeLabel(
                                  report.conflictType
                                )}
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {
                                  report.description
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                              {report.status?.replaceAll(
                                '_',
                                ' '
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[240px] text-sm text-slate-600">
                              {report
                                .archiveInfo
                                ?.reason ||
                                'No reason provided'}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <UserRound
                                size={16}
                                className="text-slate-400"
                              />

                              <span className="text-sm text-slate-600">
                                {report
                                  .archiveInfo
                                  ?.archivedBy
                                  ?.name ||
                                  'Administrator'}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2 text-xs text-slate-500">
                              <Clock3
                                size={15}
                              />

                              {formatDate(
                                report
                                  .archiveInfo
                                  ?.archivedAt
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() => {
                                  setActionError(
                                    ''
                                  );

                                  setRestoreTarget(
                                    report
                                  );
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                              >
                                <RotateCcw
                                  size={14}
                                />

                                Restore
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActionError(
                                    ''
                                  );

                                  setDeleteConfirmation(
                                    ''
                                  );

                                  setDeleteTarget(
                                    report
                                  );
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                              >
                                <Trash2
                                  size={14}
                                />

                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="grid gap-4 p-4 lg:hidden">
                {visibleReports.map(
                  (
                    report
                  ) => (
                    <div
                      key={
                        report._id
                      }
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <p className="font-bold text-slate-800">
                        {getConflictTypeLabel(
                          report.conflictType
                        )}
                      </p>

                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {
                          report.description
                        }
                      </p>

                      <div className="mt-4 rounded-xl bg-amber-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-amber-600">
                          Archive Reason
                        </p>

                        <p className="mt-1 text-sm text-amber-900">
                          {report
                            .archiveInfo
                            ?.reason ||
                            'No reason provided'}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            setRestoreTarget(
                              report
                            )
                          }
                          className="rounded-xl bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-700"
                        >
                          Restore
                        </button>

                        <button
                          onClick={() => {
                            setDeleteConfirmation(
                              ''
                            );

                            setDeleteTarget(
                              report
                            );
                          }}
                          className="rounded-xl bg-red-50 px-3 py-3 text-xs font-bold text-red-700"
                        >
                          Permanent Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}

        {!loading &&
          !error &&
          totalPages > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs text-slate-500">
                Page {page} of{' '}
                {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      page - 1
                    )
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border bg-white px-3 text-xs font-bold disabled:opacity-40"
                >
                  <ChevronLeft
                    size={15}
                  />

                  Previous
                </button>

                <button
                  disabled={
                    page >=
                    totalPages
                  }
                  onClick={() =>
                    setPage(
                      page + 1
                    )
                  }
                  className="inline-flex h-9 items-center gap-1 rounded-lg border bg-white px-3 text-xs font-bold disabled:opacity-40"
                >
                  Next

                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          )}
      </section>

      {/* RESTORE MODAL */}

      {restoreTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Restore Report?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This report will
                  return to the active
                  conflict reports and
                  become available for
                  normal operational
                  use.
                </p>
              </div>

              <button
                onClick={() =>
                  setRestoreTarget(
                    null
                  )
                }
                className="p-1 text-slate-400"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={
                  restoring
                }
                onClick={() =>
                  setRestoreTarget(
                    null
                  )
                }
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                disabled={
                  restoring
                }
                onClick={
                  handleRestore
                }
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                <RotateCcw
                  size={17}
                />

                {restoring
                  ? 'Restoring...'
                  : 'Restore Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE MODAL */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

            <div className="border-b border-red-100 bg-red-50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-red-700">
                    <Trash2
                      size={20}
                    />

                    <h2 className="text-lg font-bold">
                      Permanent Delete
                    </h2>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-red-700">
                    This action cannot
                    be undone.
                  </p>
                </div>

                <button
                  disabled={
                    deleting
                  }
                  onClick={() => {
                    setDeleteTarget(
                      null
                    );

                    setDeleteConfirmation(
                      ''
                    );
                  }}
                  className="text-red-400"
                >
                  <X
                    size={20}
                  />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-bold text-red-900">
                  {getConflictTypeLabel(
                    deleteTarget.conflictType
                  )}
                </p>

                <p className="mt-2 line-clamp-3 text-sm text-red-700">
                  {
                    deleteTarget.description
                  }
                </p>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                This will permanently
                remove the report and
                its uploaded evidence.
                To confirm, type{' '}
                <strong className="text-red-700">
                  DELETE
                </strong>{' '}
                below.
              </p>

              <input
                value={
                  deleteConfirmation
                }
                onChange={(
                  event
                ) =>
                  setDeleteConfirmation(
                    event.target
                      .value
                  )
                }
                placeholder="Type DELETE"
                className="mt-3 h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-900 outline-none focus:border-red-500"
              />

              {actionError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {
                    actionError
                  }
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  disabled={
                    deleting
                  }
                  onClick={() => {
                    setDeleteTarget(
                      null
                    );

                    setDeleteConfirmation(
                      ''
                    );
                  }}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold"
                >
                  Cancel
                </button>

                <button
                  disabled={
                    deleting ||
                    deleteConfirmation !==
                      'DELETE'
                  }
                  onClick={
                    handlePermanentDelete
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Trash2
                    size={17}
                  />

                  {deleting
                    ? 'Deleting...'
                    : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}