import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ImageIcon,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Save,
  ShieldAlert,
  Smartphone,
  UserRound,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getConflictReportById,
  updateConflictResponse,
} from '../api/conflicts';
import { resolveApiAssetUrl } from '../api/client';

/*
 * =====================================================
 * OPTIONS
 * =====================================================
 */

const STATUS_OPTIONS = [
  {
    value: 'SUBMITTED',
    label: 'Submitted',
  },
  {
    value: 'UNDER_REVIEW',
    label: 'Under Review',
  },
  {
    value: 'RESPONDING',
    label: 'Responding',
  },
  {
    value: 'RESOLVED',
    label: 'Resolved',
  },
];

const URGENCY_OPTIONS = [
  {
    value: 'LOW',
    label: 'Low',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
  },
  {
    value: 'HIGH',
    label: 'High',
  },
  {
    value: 'CRITICAL',
    label: 'Critical',
  },
];

/*
 * =====================================================
 * HELPERS
 * =====================================================
 */

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(
        'user'
      ) || 'null'
    );
  } catch {
    return null;
  }
}

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

function getStatusLabel(
  status
) {
  switch (status) {
    case 'SUBMITTED':
      return 'Submitted';

    case 'UNDER_REVIEW':
      return 'Under Review';

    case 'RESPONDING':
      return 'Responding';

    case 'RESOLVED':
      return 'Resolved';

    default:
      return (
        status?.replaceAll(
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

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return 'Not available';
  }

  return parsed.toLocaleString();
}

function getDuplicateReference(
  duplicateOf
) {
  if (!duplicateOf) {
    return null;
  }

  if (
    typeof duplicateOf ===
    'string'
  ) {
    return duplicateOf;
  }

  return (
    duplicateOf._id ||
    null
  );
}

/*
 * =====================================================
 * MAIN COMPONENT
 * =====================================================
 */

export default function ConflictReportDetails() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const currentUser =
    useMemo(
      () =>
        getCurrentUser(),
      []
    );

  /*
   * Web response editing is provided
   * only to Community Liaison Officer.
   *
   * Rangers perform the same response
   * workflow from the mobile app.
   */
  const canRespond =
    currentUser?.role ===
    'COMMUNITY_LIAISON_OFFICER';

  const [
    report,
    setReport,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState(
    'SUBMITTED'
  );

  const [
    selectedUrgency,
    setSelectedUrgency,
  ] = useState(
    'MEDIUM'
  );

  const [
    responseNote,
    setResponseNote,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    updateError,
    setUpdateError,
  ] = useState('');

  /*
   * ===================================================
   * LOAD REPORT
   * ===================================================
   */

  const loadReport =
    useCallback(
      async () => {
        if (!id) {
          setError(
            'Invalid report reference.'
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError('');

          const result =
            await getConflictReportById(
              id
            );

          const loadedReport =
            result.report ||
            null;

          setReport(
            loadedReport
          );

          if (
            loadedReport
          ) {
            setSelectedStatus(
              loadedReport.status ||
                'SUBMITTED'
            );

            setSelectedUrgency(
              loadedReport
                .urgencyLevel ||
                'MEDIUM'
            );

            setResponseNote(
              loadedReport
                .response
                ?.note || ''
            );
          }
        } catch (err) {
          setReport(null);

          setError(
            err.response?.data
              ?.message ||
              err.message ||
              'Unable to load conflict report.'
          );
        } finally {
          setLoading(false);
        }
      },
      [id]
    );

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  /*
   * ===================================================
   * CHECK UNSAVED CHANGES
   * ===================================================
   */

  const hasChanges =
    useMemo(() => {
      if (!report) {
        return false;
      }

      const originalNote =
        report.response
          ?.note || '';

      return (
        selectedStatus !==
          report.status ||
        selectedUrgency !==
          report.urgencyLevel ||
        responseNote.trim() !==
          originalNote.trim()
      );
    }, [
      report,
      selectedStatus,
      selectedUrgency,
      responseNote,
    ]);

  /*
   * ===================================================
   * UPDATE RESPONSE
   * ===================================================
   */

  async function handleSaveResponse() {
    if (
      !canRespond ||
      !report
    ) {
      return;
    }

    try {
      setSaving(true);

      setUpdateError('');

      setSuccessMessage('');

      const payload = {
        status:
          selectedStatus,

        urgencyLevel:
          selectedUrgency,

        responseNote:
          responseNote.trim(),
      };

      const result =
        await updateConflictResponse(
          report._id,
          payload
        );

      const updatedReport =
        result.report;

      setReport(
        updatedReport
      );

      setSelectedStatus(
        updatedReport.status
      );

      setSelectedUrgency(
        updatedReport
          .urgencyLevel
      );

      setResponseNote(
        updatedReport.response
          ?.note || ''
      );

      setSuccessMessage(
        'Conflict report updated successfully.'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      setUpdateError(
        err.response?.data
          ?.message ||
          err.message ||
          'Unable to update the conflict report.'
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ===================================================
   * LOADING
   * ===================================================
   */

  if (loading) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading conflict
          report...
        </p>
      </div>
    );
  }

  /*
   * ===================================================
   * ERROR
   * ===================================================
   */

  if (
    error ||
    !report
  ) {
    return (
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() =>
            navigate(
              '/conflicts'
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          <ArrowLeft
            size={17}
          />

          Back to Conflict Reports
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle
            size={40}
            className="mx-auto text-red-600"
          />

          <h2 className="mt-4 text-lg font-bold text-red-900">
            Unable to load report
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error ||
              'Report not found.'}
          </p>

          <button
            type="button"
            onClick={
              loadReport
            }
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-800"
          >
            <RefreshCw
              size={17}
            />

            Try Again
          </button>
        </div>
      </div>
    );
  }

  const duplicateReference =
    getDuplicateReference(
      report.duplicateInfo
        ?.duplicateOf
    );

  return (
    <div className="mx-auto max-w-[1500px]">

      {/* =========================
          BACK
      ========================== */}

      <button
        type="button"
        onClick={() =>
          navigate(
            '/conflicts'
          )
        }
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
      >
        <ArrowLeft
          size={17}
        />

        Back to Conflict Reports
      </button>

      {/* =========================
          SUCCESS MESSAGE
      ========================== */}

      {successMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <div>
            <p className="font-semibold text-emerald-900">
              Report updated
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {
                successMessage
              }
            </p>
          </div>
        </div>
      )}

      {/* =========================
          HEADER
      ========================== */}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 to-green-800 shadow-sm">
        <div className="p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">

            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <ShieldAlert
                  size={18}
                />

                Community Conflict Report
              </div>

              <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">
                {getConflictTypeLabel(
                  report.conflictType
                )}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50/80">
                Review the
                community report,
                location, evidence
                and response
                information.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge
                status={
                  report.status
                }
              />

              <UrgencyBadge
                urgency={
                  report.urgencyLevel
                }
              />
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Report Reference
            </p>

            <p className="mt-1 break-all text-sm font-medium text-white">
              {report._id}
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          DUPLICATE
      ========================== */}

      {report.duplicateInfo
        ?.isPotentialDuplicate && (
        <section className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <Link2
            size={22}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <h2 className="font-bold text-blue-900">
              Potential Duplicate Report
            </h2>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              A similar recent
              conflict report was
              identified. This report
              remains active and
              available for staff
              review.
            </p>

            {duplicateReference && (
              <p className="mt-2 text-xs text-blue-600">
                Related report:{' '}
                <span className="font-semibold">
                  {
                    duplicateReference
                  }
                </span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* =========================
          MAIN GRID
      ========================== */}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">

        {/* LEFT COLUMN */}

        <div className="space-y-6">

          {/* Description */}

          <SectionCard
            icon={FileText}
            title="Conflict Description"
          >
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {report.description ||
                'No description provided.'}
            </p>
          </SectionCard>

          {/* Location */}

          <SectionCard
            icon={MapPin}
            title="Conflict Location"
          >
            {report.location
              ?.source ===
            'GPS' ? (
              <>
                <div className="mb-4 inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  GPS LOCATION
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InformationBox
                    label="Latitude"
                    value={
                      report
                        .location
                        ?.latitude ??
                      'Not available'
                    }
                  />

                  <InformationBox
                    label="Longitude"
                    value={
                      report
                        .location
                        ?.longitude ??
                      'Not available'
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  MANUAL LOCATION
                </div>

                <p className="text-sm leading-7 text-slate-700">
                  {report.location
                    ?.manualLocation ||
                    'No manual location information available.'}
                </p>
              </>
            )}
          </SectionCard>

          {/* Evidence */}

          <SectionCard
            icon={ImageIcon}
            title={`Supporting Evidence (${
              report.evidence
                ?.length || 0
            })`}
          >
            {report.evidence
              ?.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {report.evidence.map(
                  (
                    evidence,
                    index
                  ) => (
                    <button
                      type="button"
                      key={
                        evidence._id ||
                        evidence.publicId ||
                        `${evidence.url}-${index}`
                      }
                      onClick={() =>
                        window.open(
                          resolveApiAssetUrl(evidence.url),
                          '_blank',
                          'noopener,noreferrer'
                        )
                      }
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={
                            resolveApiAssetUrl(evidence.url)
                          }
                          alt={`Conflict evidence ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="p-3">
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {evidence.originalName ||
                            `Evidence ${
                              index +
                              1
                            }`}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Click to open
                        </p>
                      </div>
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <ImageIcon
                  size={30}
                  className="text-slate-400"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No evidence attached
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Evidence was
                  optional for this
                  community report.
                </p>
              </div>
            )}
          </SectionCard>

          {/* ==================================
              CLO RESPONSE MANAGEMENT
          =================================== */}

          {canRespond ? (
            <SectionCard
              icon={
                MessageSquareText
              }
              title="Manage Response"
            >
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Community Liaison Officer Actions
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Update the urgency,
                  response status and
                  response note for
                  this community
                  conflict report.
                </p>
              </div>

              {/* Status */}

              <div className="mt-5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Response Status
                </label>

                <select
                  value={
                    selectedStatus
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedStatus(
                      event.target
                        .value
                    );

                    setSuccessMessage(
                      ''
                    );
                  }}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                >
                  {STATUS_OPTIONS.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Urgency */}

              <div className="mt-5">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Urgency Level
                </label>

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {URGENCY_OPTIONS.map(
                    (
                      option
                    ) => {
                      const selected =
                        selectedUrgency ===
                        option.value;

                      return (
                        <button
                          type="button"
                          key={
                            option.value
                          }
                          onClick={() => {
                            setSelectedUrgency(
                              option.value
                            );

                            setSuccessMessage(
                              ''
                            );
                          }}
                          className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
                            selected
                              ? 'border-emerald-600 bg-emerald-700 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {
                            option.label
                          }
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Note */}

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Response Note
                  </label>

                  <span className="text-[11px] text-slate-400">
                    {
                      responseNote.length
                    }
                    /1000
                  </span>
                </div>

                <textarea
                  value={
                    responseNote
                  }
                  maxLength={
                    1000
                  }
                  onChange={(
                    event
                  ) => {
                    setResponseNote(
                      event.target
                        .value
                    );

                    setSuccessMessage(
                      ''
                    );
                  }}
                  rows={6}
                  placeholder="Example: Ranger team has been informed and is responding to the reported location."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              {/* Update Error */}

              {updateError && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <p className="text-sm text-red-700">
                    {
                      updateError
                    }
                  </p>
                </div>
              )}

              {/* Save */}

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Current stored status:
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {getStatusLabel(
                      report.status
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    saving ||
                    !hasChanges
                  }
                  onClick={
                    handleSaveResponse
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save
                        size={18}
                      />

                      Save Response
                    </>
                  )}
                </button>
              </div>
            </SectionCard>
          ) : (
            /*
             * Read-only response view
             * for Manager/Admin/
             * Supervisor/Researcher.
             */
            <SectionCard
              icon={
                MessageSquareText
              }
              title="Response Information"
            >
              {report.response
                ?.note ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-900">
                    {
                      report
                        .response
                        .note
                    }
                  </p>

                  <div className="mt-4 border-t border-emerald-200 pt-4">
                    <p className="text-xs text-emerald-700">
                      Responded by:{' '}
                      <span className="font-semibold">
                        {report
                          .response
                          ?.respondedBy
                          ?.name ||
                          'Authorized Wildlife Personnel'}
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-emerald-600">
                      {formatDate(
                        report
                          .response
                          ?.respondedAt
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    No response note
                    has been added
                    yet.
                  </p>
                </div>
              )}

              <p className="mt-4 text-xs leading-5 text-slate-400">
                This account has
                read-only access to
                community conflict
                response information.
              </p>
            </SectionCard>
          )}
        </div>

        {/* RIGHT COLUMN */}

        <div className="space-y-6">

          {/* Reporter */}

          <SectionCard
            icon={UserRound}
            title="Reporter Information"
          >
            <div className="space-y-4">
              <InfoRow
                icon={UserRound}
                label="Name"
                value={
                  report.reporter
                    ?.name ||
                  'Community Member'
                }
              />

              <InfoRow
                icon={Mail}
                label="Email"
                value={
                  report.reporter
                    ?.email ||
                  'Not available'
                }
              />

              {report.reporter
                ?.phone && (
                <InfoRow
                  icon={
                    Smartphone
                  }
                  label="Phone"
                  value={
                    report
                      .reporter
                      .phone
                  }
                />
              )}
            </div>
          </SectionCard>

          {/* Metadata */}

          <SectionCard
            icon={Clock3}
            title="Report Information"
          >
            <div className="space-y-4">
              <InfoRow
                icon={
                  CalendarDays
                }
                label="Reported On"
                value={formatDate(
                  report.createdAt
                )}
              />

              <InfoRow
                icon={Clock3}
                label="Last Updated"
                value={formatDate(
                  report.updatedAt
                )}
              />

              <InfoRow
                icon={
                  Smartphone
                }
                label="Reporting Channel"
                value={
                  report.reportingChannel
                    ?.replaceAll(
                      '_',
                      ' '
                    ) ||
                  'Not available'
                }
              />
            </div>
          </SectionCard>

          {/* Assigned */}

          <SectionCard
            icon={ShieldAlert}
            title="Assigned Personnel"
          >
            {report.assignedTo ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">
                  {report
                    .assignedTo
                    ?.name ||
                    'Assigned Staff Member'}
                </p>

                <p className="text-xs text-slate-500">
                  {report
                    .assignedTo
                    ?.role
                    ?.replaceAll(
                      '_',
                      ' '
                    ) ||
                    'Wildlife Personnel'}
                </p>

                {report
                  .assignedTo
                  ?.email && (
                  <p className="text-xs text-slate-500">
                    {
                      report
                        .assignedTo
                        .email
                    }
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No wildlife
                personnel have been
                assigned yet.
              </p>
            )}
          </SectionCard>

          {/* State */}

          <SectionCard
            icon={ShieldAlert}
            title="Current State"
          >
            <div className="space-y-4">
              <InformationBox
                label="Status"
                value={getStatusLabel(
                  report.status
                )}
              />

              <InformationBox
                label="Urgency"
                value={
                  report.urgencyLevel ||
                  'MEDIUM'
                }
              />

              <InformationBox
                label="Potential Duplicate"
                value={
                  report
                    .duplicateInfo
                    ?.isPotentialDuplicate
                    ? 'Yes'
                    : 'No'
                }
              />
            </div>
          </SectionCard>

          {/* Latest response */}

          {report.response
            ?.note && (
            <SectionCard
              icon={
                MessageSquareText
              }
              title="Latest Response"
            >
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {
                  report.response
                    .note
                }
              </p>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  Updated by{' '}
                  <span className="font-semibold text-slate-700">
                    {report
                      .response
                      ?.respondedBy
                      ?.name ||
                      'Wildlife Personnel'}
                  </span>
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(
                    report
                      .response
                      ?.respondedAt
                  )}
                </p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * =====================================================
 * SECTION CARD
 * =====================================================
 */

function SectionCard({
  icon: Icon,
  title,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <Icon
            size={19}
            className="text-emerald-700"
          />
        </div>

        <h2 className="font-bold text-slate-800">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

/*
 * =====================================================
 * INFORMATION BOX
 * =====================================================
 */

function InformationBox({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {String(value)}
      </p>
    </div>
  );
}

/*
 * =====================================================
 * INFO ROW
 * =====================================================
 */

function InfoRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon
          size={16}
          className="text-slate-500"
        />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * =====================================================
 * STATUS BADGE
 * =====================================================
 */

function StatusBadge({
  status,
}) {
  const config = {
    SUBMITTED: {
      label: 'Submitted',
      className:
        'bg-blue-500/20 text-blue-100 ring-blue-300/30',
    },

    UNDER_REVIEW: {
      label: 'Under Review',
      className:
        'bg-amber-500/20 text-amber-100 ring-amber-300/30',
    },

    RESPONDING: {
      label: 'Responding',
      className:
        'bg-violet-500/20 text-violet-100 ring-violet-300/30',
    },

    RESOLVED: {
      label: 'Resolved',
      className:
        'bg-emerald-500/20 text-emerald-100 ring-emerald-300/30',
    },
  };

  const selected =
    config[status] ||
    config.SUBMITTED;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${selected.className}`}
    >
      {selected.label}
    </span>
  );
}

/*
 * =====================================================
 * URGENCY BADGE
 * =====================================================
 */

function UrgencyBadge({
  urgency,
}) {
  const config = {
    LOW: {
      className:
        'bg-slate-500/20 text-slate-100 ring-slate-300/30',
    },

    MEDIUM: {
      className:
        'bg-blue-500/20 text-blue-100 ring-blue-300/30',
    },

    HIGH: {
      className:
        'bg-orange-500/20 text-orange-100 ring-orange-300/30',
    },

    CRITICAL: {
      className:
        'bg-red-500/20 text-red-100 ring-red-300/30',
    },
  };

  const selected =
    config[urgency] ||
    config.MEDIUM;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${selected.className}`}
    >
      {urgency || 'MEDIUM'} URGENCY
    </span>
  );
}