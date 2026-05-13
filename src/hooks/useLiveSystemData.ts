import { useEffect, useSyncExternalStore, useCallback } from 'react';
import { Match, PointsTableEntry } from '@/types';
import { getLiveSystemData } from '@/services/api';

interface LiveSystemDataState {
  matches: Match[] | null;
  pointsTable: PointsTableEntry[] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  isMockData: boolean;
}

// Poll every 5 minutes on the client side.
// The server enforces a 30-minute hard cooldown on external CricAPI calls,
// so more frequent client polls just return the cached server snapshot quickly.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const CACHE_KEY = 'ipl_api_cache_v4';
const CACHE_TIME_KEY = 'ipl_api_cache_time_v4';

type SnapshotListener = () => void;

let snapshot: LiveSystemDataState = {
  matches: null,
  pointsTable: null,
  loading: true,
  error: null,
  lastUpdated: null,
  isMockData: false,
};

let initialized = false;
let refreshTimer: ReturnType<typeof globalThis.setInterval> | null = null;
let inFlightRefresh: Promise<void> | null = null;
const listeners = new Set<SnapshotListener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function readCachedSnapshot(): LiveSystemDataState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const cachedData = window.localStorage.getItem(CACHE_KEY);
  const cachedTime = window.localStorage.getItem(CACHE_TIME_KEY);

  if (!cachedData || !cachedTime) {
    return null;
  }

  try {
    const parsed = JSON.parse(cachedData) as { matches?: Match[]; pointsTable?: PointsTableEntry[]; isMockData?: boolean };
    const parsedTime = Number(cachedTime);

    if (!Array.isArray(parsed.matches) || !Array.isArray(parsed.pointsTable) || Number.isNaN(parsedTime)) {
      return null;
    }

    return {
      matches: parsed.matches,
      pointsTable: parsed.pointsTable,
      loading: false,
      error: null,
      lastUpdated: parsedTime,
      isMockData: parsed.isMockData ?? false,
    };
  } catch {
    return null;
  }
}

function persistSnapshot(nextSnapshot: LiveSystemDataState) {
  if (typeof window === 'undefined' || !nextSnapshot.matches || !nextSnapshot.pointsTable) {
    return;
  }

  window.localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      matches: nextSnapshot.matches,
      pointsTable: nextSnapshot.pointsTable,
      isMockData: nextSnapshot.isMockData,
    }),
  );
  window.localStorage.setItem(CACHE_TIME_KEY, String(nextSnapshot.lastUpdated ?? Date.now()));
}

async function refreshLiveData(forceRefresh = false) {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  // Set loading state while fetching (but keep existing data visible)
  if (!snapshot.matches) {
    snapshot = { ...snapshot, loading: true };
    emitChange();
  }

  inFlightRefresh = (async () => {
    try {
      const data = await getLiveSystemData({ forceRefresh });

      snapshot = {
        matches: data.matches,
        pointsTable: data.pointsTable,
        loading: false,
        error: null,
        lastUpdated: (data as any).updatedAt ?? Date.now(),
        isMockData: data.isMockData ?? false,
      };

      persistSnapshot(snapshot);
      emitChange();
    } catch (fetchError) {
      console.error('Failed to refresh live IPL data:', fetchError);
      snapshot = {
        ...snapshot,
        loading: false,
        error: fetchError instanceof Error ? fetchError.message : 'Failed to load live IPL data',
      };
      emitChange();
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

function initializeStore() {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;

  // Immediately show cached data while fetching fresh data in background
  const cachedSnapshot = readCachedSnapshot();
  if (cachedSnapshot) {
    snapshot = cachedSnapshot;
    emitChange();
  }

  void refreshLiveData(false);

  // Poll every 5 minutes
  refreshTimer = globalThis.setInterval(() => {
    void refreshLiveData(false);
  }, REFRESH_INTERVAL_MS) as unknown as ReturnType<typeof globalThis.setInterval>;

  // Force refresh on window focus (user came back to the tab)
  window.addEventListener('focus', () => {
    void refreshLiveData(true);
  });

  // Sync across browser tabs via storage events
  window.addEventListener('storage', (event) => {
    if (event.key === CACHE_KEY || event.key === CACHE_TIME_KEY) {
      const updatedSnapshot = readCachedSnapshot();
      if (updatedSnapshot) {
        snapshot = updatedSnapshot;
        emitChange();
      }
    }
  });
}

function subscribe(listener: SnapshotListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

/** Exported so components can trigger a manual refresh (e.g. a refresh button) */
export function triggerManualRefresh() {
  return refreshLiveData(true);
}

export function useLiveSystemData(): LiveSystemDataState & { refresh: () => Promise<void> } {
  useEffect(() => {
    initializeStore();
  }, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(() => refreshLiveData(true), []);

  return { ...state, refresh };
}