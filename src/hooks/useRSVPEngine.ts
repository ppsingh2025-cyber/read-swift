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
 * - currentWordIndex always points to the leftmost (slot 0) word of the window.
 *   The window advances by ONE word per tick regardless of window size, keeping
 *   WPM accuracy independent of window size.
 * - Punctuation pause: after a word ending with . ? ! the delay is multiplied by
 *   PUNCT_SENTENCE_MULT (1.25×). Minor punctuation (,;:) gets no additional pause —
 *   research-validated pauses only (Masson 1983).
 * - Long-word compensation: words longer than LONG_WORD_THRESHOLD get a small
 *   extra delay proportional to excess character count.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useReaderContext } from '../context/useReaderContext';

const LONG_WORD_THRESHOLD = 8;   // characters — pause bonus kicks in above this
const LONG_WORD_BONUS = 0.04;    // +4% per extra character
const PUNCT_SENTENCE_MULT = 1.25; // pause multiplier after . ? ! — reduced from 1.4 (Masson 1983)
/** Minimum active reading time (ms) before WPM is considered valid */
const MIN_VALID_ACTIVE_MS = 2_000;

/** Calculate the delay multiplier for a given word */
function wordDelayMultiplier(word: string, punctuationPause: boolean, longWordComp: boolean): number {
  let mult = 1.0;

  if (punctuationPause) {
    const last = word.slice(-1);
    // Sentence-ending punctuation only — research-validated (Masson 1983)
    if (/[.?!]/.test(last)) mult *= PUNCT_SENTENCE_MULT;
    // Minor punctuation (,;:) — no pause, not research-validated
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
  // --- Session analytics (pure refs — no stale-closure issues) ---
  /** performance.now() when the current play segment started; 0 when not playing */
  const segmentStartRef = useRef<number>(0);
  /** Accumulated active reading time across all completed segments (ms) */
  const totalActiveTimeMsRef = useRef<number>(0);
  /** Total words actually displayed (incremented once per rAF tick that advances a word) */
  const totalWordsDisplayedRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => { indexRef.current = currentWordIndex; }, [currentWordIndex]);
  useEffect(() => { wordsLenRef.current = words.length; wordsRef.current = words; }, [words]);
  useEffect(() => { wpmRef.current = wpm; }, [wpm]);
  useEffect(() => { punctuationPauseRef.current = punctuationPause; }, [punctuationPause]);
  useEffect(() => { longWordCompRef.current = longWordCompensation; }, [longWordCompensation]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Reset analytics refs when a new file is loaded (words array replaced)
  useEffect(() => {
    totalWordsDisplayedRef.current = 0;
    totalActiveTimeMsRef.current = 0;
    segmentStartRef.current = 0;
  }, [words]);

  const clearEngine = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Flush accumulated segment time and word count to state when playback stops
  const flushSessionStats = useCallback(() => {
    if (segmentStartRef.current > 0) {
      const elapsed = performance.now() - segmentStartRef.current;
      segmentStartRef.current = 0;
      totalActiveTimeMsRef.current += elapsed;
    }
    const activeMs = totalActiveTimeMsRef.current;
    const displayedWords = totalWordsDisplayedRef.current;
    if (displayedWords > 0 && activeMs >= MIN_VALID_ACTIVE_MS) {
      updateSessionStats({
        wordsRead: displayedWords,
        activeTimeMs: activeMs,
      });
    } else if (displayedWords > 0) {
      // Not enough time elapsed yet — store words but skip WPM update
      updateSessionStats({ wordsRead: displayedWords, activeTimeMs: activeMs });
    }
  }, [updateSessionStats]);

  /** Ref tracking index at play segment start (to count words consumed) */
  const indexAtSegmentStartRef = useRef<number>(0);

  const startEngine = useCallback(() => {
    clearEngine();
    const baseMs = 60_000 / wpmRef.current;
    nextTickRef.current = performance.now() + baseMs;

    // Record segment start for active-time tracking
    segmentStartRef.current = performance.now();
    indexAtSegmentStartRef.current = indexRef.current;

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

        // Count this word as displayed (only increments during actual playback)
        totalWordsDisplayedRef.current += 1;

        // Calculate delay for the NEXT word (the one just shown)
        const currentWord = wordsRef.current[nextIndex] ?? '';
        const mult = wordDelayMultiplier(currentWord, punctuationPauseRef.current, longWordCompRef.current);
        const nextBaseMs = 60_000 / wpmRef.current;
        nextTickRef.current = now + nextBaseMs * mult;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [clearEngine, setCurrentWordIndex, setIsPlaying]);

  // (Re)start engine whenever play state, speed, or word list changes
  useEffect(() => {
    if (isPlaying && words.length > 0) {
      startEngine();
    } else {
      clearEngine();
      // Flush remaining active time and final word count on pause/stop
      if (!isPlaying) {
        flushSessionStats();
      }
    }
    return clearEngine;
  }, [isPlaying, wpm, words.length, startEngine, clearEngine, flushSessionStats]);

  const play = useCallback(() => setIsPlaying(true), [setIsPlaying]);
  const pause = useCallback(() => setIsPlaying(false), [setIsPlaying]);
  const reset = useCallback(() => {
    totalWordsDisplayedRef.current = 0;
    totalActiveTimeMsRef.current = 0;
    segmentStartRef.current = 0;
    resetReader();
  }, [resetReader]);

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
    if (windowSize === 1) {
      // Single word — slot 0, unchanged
      return [words[currentWordIndex] ?? ''];
    }

    // Multi-word — left-anchored: current word is slot 0, upcoming words fill slots 1+
    const result: string[] = Array(windowSize).fill('');
    for (let slot = 0; slot < windowSize; slot++) {
      const wordIdx = currentWordIndex + slot;
      result[slot] = (wordIdx >= 0 && wordIdx < words.length) ? words[wordIdx] : '';
    }
    return result;
  }, [words, currentWordIndex, windowSize]);

  // currentWord is always words[currentWordIndex] — slot 0 of the left-anchored window
  const currentWord = words[currentWordIndex] ?? '';

  return { currentWord, wordWindow, play, pause, reset, faster, slower, prevWord, nextWord };
}
