/**
 * useAdaptiveSpeed
 *
 * Tracks user reading behavior within a session and subtly adjusts the
 * adaptive WPM baseline stored in localStorage.
 *
 * Tracked signals:
 *   - Rewinds: currentWordIndex moving backward (frequent rewinds → slow down)
 *   - Session completion %: words read / total words (low completion → slow down)
 *   - Smooth sessions: no rewinds + high completion → very slight speed increase
 *
 * Adjustments are capped at ±5% per session and never exceed the 60–1500 WPM
 * hard limits used by the RSVP engine.
 *
 * The adaptive baseline is ONLY used when the user has not manually adjusted WPM
 * during the current session.
 */

import { useCallback, useEffect, useRef } from 'react';

const LS_ADAPTIVE_BASELINE = 'fastread_adaptive_wpm';
const LS_SESSION_REWINDS = 'fastread_session_rewinds';

const WPM_MIN = 60;
const WPM_MAX = 1500;
const REWIND_THRESHOLD = 5;               // rewinds per session before slowing down
const SLOW_FACTOR = 0.95;                  // −5% on high-rewind or low-completion
const FAST_FACTOR = 1.02;                  // +2% on smooth session
const LOW_COMPLETION_THRESHOLD = 0.5;      // below 50% → reduce speed
const HIGH_COMPLETION_THRESHOLD = 0.8;     // above 80% (+ no rewinds) → nudge speed up
const MIN_WORDS_FOR_COMPLETION_CHECK = 50; // ignore tiny partial reads
const MIN_WORDS_FOR_SPEEDUP = 100;         // minimum words consumed to warrant a speedup

export function useAdaptiveSpeed(
  currentWordIndex: number,
  totalWords: number,
  isPlaying: boolean,
) {
  const prevIndexRef = useRef(currentWordIndex);
  const rewindCountRef = useRef(0);
  const sessionStartIndexRef = useRef(currentWordIndex);
  const wasPlayingRef = useRef(false);

  // Reset rewind count when a new session starts (isPlaying transitions to true)
  useEffect(() => {
    if (isPlaying && !wasPlayingRef.current) {
      rewindCountRef.current = 0;
      sessionStartIndexRef.current = currentWordIndex;
      prevIndexRef.current = currentWordIndex;
      // Persist rewind counter reset
      localStorage.setItem(LS_SESSION_REWINDS, '0');
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, currentWordIndex]);

  // Track rewinds: detect backward movement in word index
  useEffect(() => {
    if (isPlaying && currentWordIndex < prevIndexRef.current) {
      rewindCountRef.current += 1;
      localStorage.setItem(LS_SESSION_REWINDS, String(rewindCountRef.current));
    }
    prevIndexRef.current = currentWordIndex;
  }, [currentWordIndex, isPlaying]);

  /**
   * Compute and store a new adaptive WPM baseline.
   * Called when a reading session ends (isPlaying → false).
   *
   * @param currentWpm   WPM at session end
   * @returns            Suggested new baseline WPM (caller may apply it)
   */
  const finalizeSession = useCallback(
    (currentWpm: number): number => {
      if (totalWords === 0) return currentWpm;

      // prevIndexRef.current mirrors currentWordIndex (updated on every tick)
      // so we can read the final position without capturing currentWordIndex
      // as a dep (which would recreate this callback on every word tick).
      const wordsConsumed = Math.max(0, prevIndexRef.current - sessionStartIndexRef.current);
      const completionPct = totalWords > 0 ? wordsConsumed / totalWords : 0;
      const rewinds = rewindCountRef.current;

      let adjusted = currentWpm;

      // High rewind count → reading was too fast
      if (rewinds >= REWIND_THRESHOLD) {
        adjusted = Math.round(adjusted * SLOW_FACTOR);
      }

      // Low session completion → reading was too fast or too hard
      if (completionPct < LOW_COMPLETION_THRESHOLD && wordsConsumed > MIN_WORDS_FOR_COMPLETION_CHECK) {
        adjusted = Math.round(adjusted * SLOW_FACTOR);
      }

      // Smooth session (no rewinds + high completion) → nudge speed up
      if (rewinds === 0 && completionPct > HIGH_COMPLETION_THRESHOLD && wordsConsumed > MIN_WORDS_FOR_SPEEDUP) {
        adjusted = Math.round(adjusted * FAST_FACTOR);
      }

      // Hard clamp to engine limits
      adjusted = Math.max(WPM_MIN, Math.min(WPM_MAX, adjusted));

      // Store new baseline
      localStorage.setItem(LS_ADAPTIVE_BASELINE, String(adjusted));
      return adjusted;
    },
    [totalWords],
  );

  /** Load the stored adaptive baseline (null if never set) */
  const getAdaptiveBaseline = useCallback((): number | null => {
    const raw = localStorage.getItem(LS_ADAPTIVE_BASELINE);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : Math.max(WPM_MIN, Math.min(WPM_MAX, parsed));
  }, []);

  return { finalizeSession, getAdaptiveBaseline };
}
