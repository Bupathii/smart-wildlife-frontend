import { useCallback, useEffect, useRef, useState } from 'react';

import { getParkMap, readApiError, retryRangerLocation } from '../api/patrols';
import { DEFAULT_PARK_ID } from '../config/patrolUi';

const LOADING = {
  status: 'loading',
  data: null,
  error: null,
  refreshFailed: false,
  loadedAt: null,
};

/**
 * SOLID-S: loading, polling and failure handling live here, so pages only
 * describe what to show. SOLID-D: the hook depends on a `load` function
 * passed in, not on a particular API call.
 *
 * Loads data for a patrol screen and optionally refreshes it on a timer.
 *
 * Failure rules (from the use case):
 *  - the FIRST load fails  → status "error" (full error screen, "Try again")
 *  - a LATER refresh fails → the last data is kept and `refreshFailed` is
 *    set, so the screen can say "Could not refresh – showing data from HH:MM"
 *
 * @param {() => Promise<object>} load function that fetches the data; when a
 *        different function is passed (e.g. new filters) loading starts again
 * @param {{ intervalMs?: number }} [options] set intervalMs to poll
 */
export default function usePatrolData(load, { intervalMs = 0 } = {}) {
  const [state, setState] = useState({ ...LOADING, source: load });
  const [refreshing, setRefreshing] = useState(false);
  const hasData = useRef(false);
  const latestLoad = useRef(load);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await load();
      // A slow answer to an earlier request must not replace newer results.
      if (latestLoad.current !== load) return;
      hasData.current = true;
      setState({ ...LOADING, status: 'ready', data, loadedAt: new Date(), source: load });
    } catch (error) {
      if (latestLoad.current !== load) return;
      setState((current) =>
        hasData.current && current.source === load
          ? { ...current, refreshFailed: true }
          : { ...LOADING, status: 'error', error: readApiError(error), source: load }
      );
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    hasData.current = false;
    latestLoad.current = load;
    refresh();

    if (!intervalMs) return undefined;
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [load, refresh, intervalMs]);

  // Results that belong to an earlier `load` (old filters, another patrol)
  // are never shown: the screen is "loading" until the new ones arrive.
  const current = state.source === load ? state : LOADING;
  return { ...current, refreshing, refresh };
}

const loadDefaultParkMap = () => getParkMap(DEFAULT_PARK_ID);

/** Zones and routes of the park, for the map and the route dropdown. */
export function useParkMap() {
  return usePatrolData(loadDefaultParkMap);
}

/**
 * The Retry button for an offline ranger (EX1): asks the server to query
 * GPS again for that ranger only. A returned fix replaces the ranger's
 * marker; otherwise the offline badge simply stays.
 *
 * @param {*} dataVersion identifies the data on screen; results of a retry
 *        are dropped as soon as newer data has been loaded
 */
export function useRangerRetry(dataVersion) {
  const [latest, setLatest] = useState({ version: dataVersion, rangers: {} });
  const [retryingId, setRetryingId] = useState(null);

  const retry = useCallback(
    async (rangerId) => {
      setRetryingId(rangerId);
      try {
        const ranger = await retryRangerLocation(rangerId);
        setLatest((current) => ({
          version: dataVersion,
          rangers: {
            ...(current.version === dataVersion ? current.rangers : {}),
            [rangerId]: ranger,
          },
        }));
      } catch {
        // The ranger stays offline; the badge already tells the manager so.
      } finally {
        setRetryingId(null);
      }
    },
    [dataVersion]
  );

  /** Applies any newer locations to a list of rangers. */
  const apply = useCallback(
    (rangers) => {
      const overrides = latest.version === dataVersion ? latest.rangers : {};
      return rangers.map((ranger) => ({ ...ranger, ...overrides[ranger.rangerId] }));
    },
    [latest, dataVersion]
  );

  return { retry, retryingId, apply };
}
