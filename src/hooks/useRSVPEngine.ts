/**
 * useRSVPEngine
 *
 * Core hook that drives the rolling-window word display.
 *
 * Architecture decisions:
 * - Uses requestAnimationFrame (rAF) with delta-based timing so high WPM rates
 *   don't accumulate errors the way setInterval can at short intervals.
 *   The loop fires on every animation frame, checks whether enough time has
 *   elapsed, and advances the index only when due. This avoids setInterval
 *   drift while keeping the main thread responsive.
 * - Current word index is mirrored in a ref inside the engine so the rAF
 *   callback can read/write it without stale-closure issues.
 * - currentWordIndex always points to the CENTER (highlight) word of the window.
 *   The window advances by ONE word per tick regardless of window size, keeping
 *   WPM accuracy independent of window size.
 * - Punctuation pause: after a word ending with . ? ! the delay is multiplied by
 *   PUNCT_MAJOR_MULT; after , ; : it is multiplied by PUNCT_MINOR_MULT.
 * - Long-word compensation: words longer than LONG_WORD_THRESHOLD get a small
 *   extra delay proportional to excess character count.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReaderContext } from '../context/useReaderContext';

const LONG_WORD_THRESHOLD = 8;   // characters — pause bonus kicks in above this
const LONG_WORD_BONUS = 0.04;    // +4% per extra character
const PUNCT_MAJOR_MULT = 1.4;    // pause multiplier after . ? !
const PUNCT_MINOR_MULT = 1.2;    // pause multiplier after , ; :
/** How many words to advance between session-stats batch writes during playback */
const STATS_UPDATE_BATCH_SIZE = 30;

/** Calculate the delay multiplier for a given word */
function wordDelayMultiplier(word: string, punctuationPause: boolean, longWordComp: boolean): number {
  let mult = 1.0;

  if (punctuationPause) {
    const last = word.slice(-1);
    if (/[.?!]/.test(last)) mult *= PUNCT_MAJOR_MULT;
    else if (/[,;:]/.test(last)) mult *= PUNCT_MINOR_MULT;
  }

  if (longWordComp) {
    const len = word.replace(/[^a-zA-Z0-9]/g, '').length;
    if (len > LONG_WORD_THRESHOLD) {
      mult += (len - LONG_WORD_THRESHOLD) * LONG_WORD_BONUS;
    }
  }

  return mult;
}

export function useRSVPEngine() {
  const {
    words,
    currentWordIndex,
    isPlaying,
    wpm,
    windowSize,
    punctuationPause,
    longWordCompensation,
    sessionStats,
    setCurrentWordIndex,
    setIsPlaying,
    resetReader,
    setWpm,
    updateSessionStats,
  } = useReaderContext();

  const rafRef = useRef<number | null>(null);
  // Mirror of currentWordIndex accessible inside rAF callback without stale closure
  const indexRef = useRef<number>(currentWordIndex);
  const wordsLenRef = useRef<number>(words.length);
  // Timestamp when the next word advance is due
  const nextTickRef = useRef<number>(0);
  // Refs for engine parameters readable without re-creating the loop
  const wpmRef = useRef<number>(wpm);
  const punctuationPauseRef = useRef<boolean>(punctuationPause);
  const longWordCompRef = useRef<boolean>(longWordCompensation);
  const wordsRef = useRef<string[]>(words);
  const isPlayingRef = useRef<boolean>(isPlaying);
  // Session analytics refs
  const sessionPlayStartRef = useRef<number>(0); // performance.now() when play last started
  const sessionWordsAtPlayStartRef = useRef<number>(sessionStats.wordsRead);
  const sessionActiveTimeAtStartRef = useRef<number>(sessionStats.activeTimeMs);

  // Keep refs in sync with state
  useEffect(() => { indexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { wordsLenRef.current = words.length; wordsRef.current = words; }, [words]);
  useEffect(() => { wpmRef.current = wpm; }, [wpm]);
  useEffect(() => { punctuationPauseRef.current = punctuationPause; }, [punctuationPause]);
  useEffect(() => { longWordCompRef.current = longWordCompensation; }, [longWordCompensation]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  // Keep session analytics refs in sync
  useEffect(() => { sessionWordsAtPlayStartRef.current = sessionStats.wordsRead; }, [sessionStats.wordsRead]);
  useEffect(() => { sessionActiveTimeAtStartRef.current = sessionStats.activeTimeMs; }, [sessionStats.activeTimeMs]);

  const clearEngine = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Flush accumulated session time when playback stops
  const flushSessionTime = useCallback(() => {
    if (sessionPlayStartRef.current > 0) {
      const elapsed = performance.now() - sessionPlayStartRef.current;
      sessionPlayStartRef.current = 0;
      updateSessionStats({ activeTimeMs: sessionActiveTimeAtStartRef.current + elapsed });
    }
  }, [updateSessionStats]);

  /** Ref tracking how many words were at the session start of current play segment */
  const wordsAtSegmentStartRef = useRef<number>(0);
  /** Ref tracking index at play segment start (to count words consumed) */
  const indexAtSegmentStartRef = useRef<number>(0);

  const startEngine = useCallback(() => {
    clearEngine();
    const baseMs = 60_000 / wpmRef.current;
    nextTickRef.current = performance.now() + baseMs;

    // Record when playback started for analytics
    sessionPlayStartRef.current = performance.now();
    indexAtSegmentStartRef.current = indexRef.current;
    wordsAtSegmentStartRef.current = sessionWordsAtPlayStartRef.current;

    const tick = () => {
      if (!isPlayingRef.current) return; // safety guard
      const now = performance.now();

      if (now >= nextTickRef.current) {
        const nextIndex = indexRef.current + 1;
        if (nextIndex >= wordsLenRef.current) {
          setIsPlaying(false);
          return;
        }
        indexRef.current = nextIndex;
        setCurrentWordIndex(nextIndex);

        // Update session words-read counter (incremental, no setState rate concern)
        const wordsConsumed = nextIndex - indexAtSegmentStartRef.current;
        const newWordsRead = wordsAtSegmentStartRef.current + wordsConsumed;
        // Batch the state update — update at most once per second to avoid
        // excessive re-renders; the exact count is always correct on pause.
        if (wordsConsumed % STATS_UPDATE_BATCH_SIZE === 0) {
          updateSessionStats({ wordsRead: newWordsRead });
        }

        // Calculate delay for the NEXT word (the one just shown)
        const currentWord = wordsRef.current[nextIndex] ?? '';
        const mult = wordDelayMultiplier(currentWord, punctuationPauseRef.current, longWordCompRef.current);
        const nextBaseMs = 60_000 / wpmRef.current;
        nextTickRef.current = now + nextBaseMs * mult;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [clearEngine, setCurrentWordIndex, setIsPlaying, updateSessionStats]);

  // (Re)start engine whenever play state, speed, or word list changes
  useEffect(() => {
    if (isPlaying && words.length > 0) {
      startEngine();
    } else {
      clearEngine();
      // Flush remaining active time and final word count on pause/stop
      if (!isPlaying) {
        flushSessionTime();
        const finalWords = indexRef.current - indexAtSegmentStartRef.current;
        if (finalWords > 0) {
          updateSessionStats({ wordsRead: wordsAtSegmentStartRef.current + finalWords });
        }
      }
    }
    return clearEngine;
  }, [isPlaying, wpm, words.length, startEngine, clearEngine, flushSessionTime, updateSessionStats]);

  const play = useCallback(() => setIsPlaying(true), [setIsPlaying]);
  const pause = useCallback(() => setIsPlaying(false), [setIsPlaying]);
  const reset = useCallback(() => resetReader(), [resetReader]);

  const faster = useCallback(() => {
    setWpm(Math.min(1500, Math.round(wpm * 1.2)));
  }, [setWpm, wpm]);

  const slower = useCallback(() => {
    setWpm(Math.max(60, Math.round(wpm / 1.2)));
  }, [setWpm, wpm]);

  const prevWord = useCallback(() => {
    setIsPlaying(false);
    setCurrentWordIndex(Math.max(0, currentWordIndex - 1));
  }, [setIsPlaying, setCurrentWordIndex, currentWordIndex]);

  const nextWord = useCallback(() => {
    setIsPlaying(false);
    setCurrentWordIndex(Math.min(words.length - 1, currentWordIndex + 1));
  }, [setIsPlaying, setCurrentWordIndex, currentWordIndex, words.length]);

  /**
   * Build the rolling word window centered on currentWordIndex.
   * The array always has `windowSize` slots; slots beyond word boundaries
   * are empty strings so the middle word stays in a fixed focal position.
   *
   * Window size timing: the engine always advances ONE word per tick, so WPM
   * accuracy is completely independent of window size — the window is purely
   * a rendering concern.
   */
  const wordWindow = useMemo<string[]>(() => {
    // For odd sizes (1,3,5): ORP is center slot → half = floor(n/2)
    // For even sizes (2,4): ORP is left-middle slot → half = n/2 - 1
    // Both cases: half = ceil(n/2) - 1
    const half = Math.ceil(windowSize / 2) - 1;
    return Array.from({ length: windowSize }, (_, slot) => {
      const wordIdx = currentWordIndex - half + slot;
      if (wordIdx < 0 || wordIdx >= words.length) return '';
      return words[wordIdx];
    });
  }, [words, currentWordIndex, windowSize]);

  // The center word is the traditional "current word" for backward compat
  const currentWord = words[currentWordIndex] ?? '';

  return { currentWord, wordWindow, play, pause, reset, faster, slower, prevWord, nextWord };
}
