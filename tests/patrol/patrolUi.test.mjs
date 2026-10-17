/*
 * Display constants and formatters used by every patrol screen
 * (src/config/patrolUi.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COVERAGE_THRESHOLD_PERCENT,
  GOOD_COVERAGE_PERCENT,
  MAP_COLORS,
  OPEN_PATROL_STATUSES,
  PATROL_STATUS,
  coverageColor,
  dayBoundary,
  formatDateTime,
  formatDuration,
  formatTime,
  pathLengthKm,
  rangerNames,
  toDateTimeInput,
} from '../../src/config/patrolUi.js';

const KM_PER_DEGREE_LATITUDE = 111.19;

test('status labels match the PatrolStatus enum exactly (no "Solved")', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(PATROL_STATUS).map(([key, { label }]) => [key, label])),
    {
      PLANNED: 'Planned',
      ACTIVE: 'Active',
      DELAYED: 'Delayed',
      ON_HOLD: 'On Hold',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    }
  );
  assert.ok(Object.values(PATROL_STATUS).every((status) => status.badge.startsWith('bg-')));
  assert.deepEqual(OPEN_PATROL_STATUSES, ['PLANNED', 'ACTIVE', 'DELAYED', 'ON_HOLD']);
});

test('coverage colours change exactly at the 40% and 70% thresholds', () => {
  assert.equal(COVERAGE_THRESHOLD_PERCENT, 40);
  assert.equal(GOOD_COVERAGE_PERCENT, 70);
  assert.equal(coverageColor(0), MAP_COLORS.low);
  assert.equal(coverageColor(39.9), MAP_COLORS.low);
  assert.equal(coverageColor(40), MAP_COLORS.medium, '40% is not under-patrolled');
  assert.equal(coverageColor(69.9), MAP_COLORS.medium);
  assert.equal(coverageColor(70), MAP_COLORS.good);
  assert.equal(coverageColor(100), MAP_COLORS.good);
});

test('times are shown as 24-hour HH:MM and missing values have a placeholder', () => {
  const afternoon = new Date(2026, 4, 18, 14, 5);
  const morning = new Date(2026, 4, 18, 7, 9);

  assert.equal(formatTime(afternoon), '14:05');
  assert.equal(formatTime(morning.toISOString()), '07:09', 'ISO text is accepted too');
  assert.equal(formatTime(null), '--:--');
  assert.equal(formatTime(undefined), '--:--');
});

test('date-times include the date, year and 24-hour time', () => {
  const text = formatDateTime(new Date(2026, 4, 18, 14, 5));

  assert.match(text, /18/);
  assert.match(text, /2026/);
  assert.match(text, /14:05/);
  assert.equal(formatDateTime(null), '—');
});

test('durations are shown in hours and minutes', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(45), '45m');
  assert.equal(formatDuration(60), '1h 0m');
  assert.equal(formatDuration(165), '2h 45m');
  assert.equal(formatDuration(240.4), '4h 0m');
  assert.equal(formatDuration(null), '—');
  assert.equal(formatDuration(undefined), '—');
});

test('ranger names are joined, with a dash when a patrol has none', () => {
  const patrol = (names) => ({ rangers: names.map((name) => ({ name })) });

  assert.equal(rangerNames(patrol(['Thilina Perera'])), 'Thilina Perera');
  assert.equal(rangerNames(patrol(['Kamal Fernando', 'Priya Nadarajah'])), 'Kamal Fernando, Priya Nadarajah');
  assert.equal(rangerNames(patrol([])), '—');
});

test('date filters cover the whole local day', () => {
  const start = new Date(dayBoundary('2026-05-18'));
  const end = new Date(dayBoundary('2026-05-18', true));

  assert.deepEqual(
    [start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes()],
    [2026, 4, 18, 0, 0]
  );
  assert.deepEqual([end.getDate(), end.getHours(), end.getMinutes(), end.getSeconds()], [18, 23, 59, 59]);
  assert.equal(dayBoundary(''), '');
  assert.equal(dayBoundary(undefined), '');
});

test('datetime-local values are zero-padded local time', () => {
  assert.equal(toDateTimeInput(new Date(2026, 0, 5, 7, 3)), '2026-01-05T07:03');
  assert.equal(toDateTimeInput(new Date(2026, 11, 31, 23, 59)), '2026-12-31T23:59');
});

test('route length preview uses the Haversine distance', () => {
  const north = (degrees) => ({ latitude: degrees, longitude: 81 });

  assert.equal(pathLengthKm([]), 0);
  assert.equal(pathLengthKm([north(6)]), 0);
  assert.ok(Math.abs(pathLengthKm([north(6), north(7)]) - KM_PER_DEGREE_LATITUDE) < 0.1);
  assert.ok(Math.abs(pathLengthKm([north(6), north(7), north(8)]) - 2 * KM_PER_DEGREE_LATITUDE) < 0.1);
  assert.equal(pathLengthKm([north(6), north(6)]), 0, 'a repeated point adds nothing');
});
