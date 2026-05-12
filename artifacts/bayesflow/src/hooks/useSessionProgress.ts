import { useState, useEffect } from "react";

interface ProgressState {
  unlockedUpTo: number;
}

function storageKey(sessionId: string) {
  return `bayesflow_progress_${sessionId}`;
}

function readState(sessionId: string): ProgressState {
  if (!sessionId || sessionId === "new") return { unlockedUpTo: 1 };
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (raw) return JSON.parse(raw) as ProgressState;
  } catch {}
  return { unlockedUpTo: 1 };
}

function writeState(sessionId: string, state: ProgressState) {
  if (!sessionId || sessionId === "new") return;
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify(state));
  } catch {}
}

/**
 * Called by stage-1 after it gets the brand-new sessionId from the API,
 * before navigating to stage 2. Seeds progress for that session so stage 2
 * shows as unlocked.
 */
export function seedSessionProgress(newSessionId: string, unlockedUpTo: number) {
  writeState(newSessionId, { unlockedUpTo });
}

/**
 * Per-session stage progress hook.
 * - isUnlocked(n)  — true if stage n is accessible
 * - isCompleted(n) — true if stage n has been passed (Next was clicked on it)
 * - unlockNext(n)  — call when stage n is completed; unlocks stage n+1
 */
export function useSessionProgress(sessionId: string) {
  const [state, setState] = useState<ProgressState>(() => readState(sessionId));

  // Re-read whenever the sessionId changes (e.g., after stage-1 creates a new session)
  useEffect(() => {
    const fresh = readState(sessionId);
    setState(fresh);
  }, [sessionId]);

  const unlockNext = (currentStage: number) => {
    setState((prev) => {
      const next: ProgressState = {
        unlockedUpTo: Math.max(prev.unlockedUpTo, currentStage + 1),
      };
      writeState(sessionId, next);
      return next;
    });
  };

  const isUnlocked = (stage: number) => stage <= state.unlockedUpTo;

  // A stage is "completed" if we have already moved past it
  const isCompleted = (stage: number) => stage < state.unlockedUpTo;

  return { isUnlocked, isCompleted, unlockNext, unlockedUpTo: state.unlockedUpTo };
}
