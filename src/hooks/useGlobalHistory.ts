import { useCallback, useRef, useState } from "react";
import { BrandKit, ShortFilmShot, StudioState } from "../types/studio";

export interface GlobalHistorySnapshot {
  studioState: StudioState;
  brandKit: BrandKit;
  shortFilmShots: ShortFilmShot[];
}

export interface HistoryEntry {
  id: string;
  snapshot: GlobalHistorySnapshot;
  label: string;
  timestamp: number;
}

interface HistoryStackState {
  entries: HistoryEntry[];
  currentIndex: number;
}

export interface CommitHistoryOptions {
  label?: string;
  coalesceKey?: string;
  record?: boolean;
}

const MAX_HISTORY_STEPS = 60;
const COALESCE_WINDOW_MS = 500;

let entrySeq = 0;
function nextEntryId(): string {
  entrySeq += 1;
  return `hist-${Date.now()}-${entrySeq}`;
}

export function useGlobalHistory(
  initialSnapshot: GlobalHistorySnapshot | (() => GlobalHistorySnapshot)
) {
  const [stack, setStack] = useState<HistoryStackState>(() => {
    const snap = typeof initialSnapshot === "function" ? initialSnapshot() : initialSnapshot;
    return {
      entries: [
        {
          id: "hist-initial",
          snapshot: snap,
          label: "Initial studio",
          timestamp: Date.now(),
        },
      ],
      currentIndex: 0,
    };
  });

  const lastBurstRef = useRef<{ key: string; timestamp: number } | null>(null);

  const commit = useCallback(
    (
      updater: (prev: GlobalHistorySnapshot) => GlobalHistorySnapshot,
      options: CommitHistoryOptions = {}
    ) => {
      const { label = "Edit", coalesceKey, record = true } = options;

      setStack((curr) => {
        const currentEntry = curr.entries[curr.currentIndex];
        const next = updater(currentEntry.snapshot);
        if (
          next === currentEntry.snapshot ||
          (next.studioState === currentEntry.snapshot.studioState &&
            next.brandKit === currentEntry.snapshot.brandKit &&
            next.shortFilmShots === currentEntry.snapshot.shortFilmShots)
        ) {
          return curr;
        }

        if (!record) {
          const updatedEntries = curr.entries.map((entry, idx) =>
            idx === curr.currentIndex ? { ...entry, snapshot: next } : entry
          );
          return {
            ...curr,
            entries: updatedEntries,
          };
        }

        const now = Date.now();
        const lastBurst = lastBurstRef.current;
        const shouldCoalesce =
          Boolean(coalesceKey) &&
          curr.currentIndex > 0 &&
          lastBurst !== null &&
          lastBurst.key === coalesceKey &&
          now - lastBurst.timestamp < COALESCE_WINDOW_MS;

        if (shouldCoalesce && coalesceKey) {
          lastBurstRef.current = { key: coalesceKey, timestamp: now };
          const truncated = curr.entries.slice(0, curr.currentIndex + 1);
          truncated[curr.currentIndex] = {
            ...truncated[curr.currentIndex],
            snapshot: next,
            timestamp: now,
          };
          return {
            entries: truncated,
            currentIndex: truncated.length - 1,
          };
        }

        lastBurstRef.current = coalesceKey ? { key: coalesceKey, timestamp: now } : null;

        const base = curr.entries.slice(0, curr.currentIndex + 1);
        const appended: HistoryEntry[] = [
          ...base,
          {
            id: nextEntryId(),
            snapshot: next,
            label,
            timestamp: now,
          },
        ];

        const trimmed =
          appended.length > MAX_HISTORY_STEPS + 1
            ? appended.slice(-(MAX_HISTORY_STEPS + 1))
            : appended;

        return {
          entries: trimmed,
          currentIndex: trimmed.length - 1,
        };
      });
    },
    []
  );

  const canUndo = stack.currentIndex > 0;
  const canRedo = stack.currentIndex < stack.entries.length - 1;
  const undoLabel = canUndo ? stack.entries[stack.currentIndex].label : null;
  const redoLabel = canRedo ? stack.entries[stack.currentIndex + 1].label : null;

  const undo = useCallback((): string | null => {
    if (!undoLabel) return null;
    lastBurstRef.current = null;
    setStack((curr) => {
      if (curr.currentIndex <= 0) return curr;
      return {
        ...curr,
        currentIndex: curr.currentIndex - 1,
      };
    });
    return undoLabel;
  }, [undoLabel]);

  const redo = useCallback((): string | null => {
    if (!redoLabel) return null;
    lastBurstRef.current = null;
    setStack((curr) => {
      if (curr.currentIndex >= curr.entries.length - 1) return curr;
      return {
        ...curr,
        currentIndex: curr.currentIndex + 1,
      };
    });
    return redoLabel;
  }, [redoLabel]);

  const jumpTo = useCallback(
    (targetIndex: number): { label: string; direction: "back" | "forward" } | null => {
      if (
        targetIndex < 0 ||
        targetIndex >= stack.entries.length ||
        targetIndex === stack.currentIndex
      ) {
        return null;
      }
      const targetEntry = stack.entries[targetIndex];
      const direction = targetIndex < stack.currentIndex ? "back" : "forward";
      lastBurstRef.current = null;
      setStack((curr) => {
        if (targetIndex < 0 || targetIndex >= curr.entries.length) return curr;
        return {
          ...curr,
          currentIndex: targetIndex,
        };
      });
      return { label: targetEntry.label, direction };
    },
    [stack.currentIndex, stack.entries]
  );

  return {
    present: stack.entries[stack.currentIndex].snapshot,
    entries: stack.entries,
    currentIndex: stack.currentIndex,
    commit,
    undo,
    redo,
    jumpTo,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    undoCount: stack.currentIndex,
    redoCount: stack.entries.length - 1 - stack.currentIndex,
  };
}
