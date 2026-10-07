import { useState } from 'react';

import { CheckCircle2, Star } from 'lucide-react';

import { readApiError, savePatrolEvaluation } from '../api/patrols';
import { getCurrentUser } from '../config/roleAccess';
import {
  DEMO_MANAGER_ID,
  MAX_RATING,
  NOTES_MAX_LENGTH,
  NOTES_REQUIRED_AT_OR_BELOW,
  formatDateTime,
} from '../config/patrolUi';

/** Checks the same rules as the server so mistakes show immediately. */
function validate(rating, notes) {
  const errors = {};
  if (!rating) errors.rating = 'Rating is required';
  if (notes.length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer`;
  } else if (rating && rating <= NOTES_REQUIRED_AT_OR_BELOW && notes.trim() === '') {
    errors.notes = `Notes are required when the rating is ${NOTES_REQUIRED_AT_OR_BELOW} or lower`;
  }
  return errors;
}

/** Clickable 1-5 stars. */
function StarInput({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: MAX_RATING }, (_, index) => index + 1).map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          className="rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed"
        >
          <Star
            size={28}
            className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * SOLID-S: owns the evaluation form only (input, validation messages, save).
 * AF4 Record Patrol Evaluation. Disabled until the patrol is COMPLETED.
 * A patrol has one evaluation, so saving again updates it.
 */
export default function EvaluationForm({ patrolId, evaluation, canEvaluate, onSaved }) {
  const [rating, setRating] = useState(evaluation?.rating ?? 0);
  const [notes, setNotes] = useState(evaluation?.notes ?? '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState('');

  if (!canEvaluate) {
    return (
      <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
        Evaluation available after the patrol is completed
      </p>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaved(false);
    setFailure('');

    const problems = validate(rating, notes);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      const evaluatedBy = getCurrentUser()?.id ?? DEMO_MANAGER_ID;
      const result = await savePatrolEvaluation(patrolId, { rating, notes, evaluatedBy });
      setSaved(true);
      onSaved?.(result.evaluation);
    } catch (error) {
      // EX5: show the server's field errors under the inputs.
      const { message, fields } = readApiError(error);
      setErrors(fields);
      setFailure(Object.keys(fields).length > 0 ? '' : message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-slate-700">Rating</p>
        <StarInput value={rating} onChange={setRating} disabled={saving} />
        {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
      </div>

      <div>
        <label htmlFor="evaluation-notes" className="mb-1.5 block text-sm font-semibold text-slate-700">
          Notes
        </label>
        <textarea
          id="evaluation-notes"
          rows={4}
          value={notes}
          disabled={saving}
          onChange={(event) => setNotes(event.target.value)}
          aria-invalid={Boolean(errors.notes)}
          placeholder="What went well, and what needs attention?"
          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
            errors.notes ? 'border-red-400' : 'border-slate-300'
          }`}
        />
        <div className="mt-1 flex justify-between gap-3 text-xs">
          <span className="text-sm text-red-600">{errors.notes}</span>
          <span className={notes.length > NOTES_MAX_LENGTH ? 'text-red-600' : 'text-slate-400'}>
            {notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </div>
      </div>

      {failure && <p className="text-sm text-red-600" role="alert">{failure}</p>}
      {saved && (
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700" role="status">
          <CheckCircle2 size={17} />
          Evaluation saved
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          {evaluation ? `Last saved ${formatDateTime(evaluation.evaluatedAt)}` : 'Not evaluated yet'}
        </span>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : evaluation ? 'Update evaluation' : 'Save evaluation'}
        </button>
      </div>
    </form>
  );
}
