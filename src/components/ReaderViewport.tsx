/**
 * ReaderViewport
 *
 * Displays the rolling word window with a guaranteed-stable focal position.
 *
 * Layout stability guarantee:
 *   Each word slot is rendered as a fixed-width grid column (--slot-width).
 *   Because every column is the same width, the center column is ALWAYS at
 *   the exact horizontal midpoint of the grid, regardless of word length.
 *   No reflow, no horizontal drift.
 *
 * ORP (Optimal Recognition Point):
 *   When orpEnabled is true the center word is split into three spans:
 *   [prefix][orp-letter][suffix]. The ORP letter sits at approximately 20%
 *   from the left of the word (classic Spritz placement), rendered in a
 *   slightly different hue to guide the fixation point.
 *   The ORP letter is always aligned to the visual center of its slot so it
 *   effectively remains at the same screen position as words change.
 */

import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { Orientation } from '../context/readerContextDef';
import styles from '../styles/ReaderViewport.module.css';

interface ReaderViewportProps {
  /** Ordered list of words in the current window (length = windowSize) */
  wordWindow: string[];
  /** Index within wordWindow that should be highlighted (the center word) */
  highlightIndex: number;
  /** CSS color string for the highlighted word */
  highlightColor: string;
  /** Layout direction for the word window */
  orientation: Orientation;
  /** Whether to render ORP (Optimal Recognition Point) on the center word */
  orpEnabled: boolean;
  /** Whether to dim non-center words proportional to their distance from center */
  peripheralFade: boolean;
  isLoading: boolean;
  loadingProgress: number;
  hasWords: boolean;
  /** When true, the viewport expands to fill the available vertical space */
  fullHeight?: boolean;
}

/** Non-breaking space used to keep empty window slots visible without text */
const EMPTY_SLOT_PLACEHOLDER = '\u00A0';

/**
 * Calculate the ORP index for a word (0-based character index).
 * Classic algorithm: position ≈ ceil(length / 5) - 1 (≈ 20% from left).
 * Single-character words use index 0.
 */
function calcOrpIndex(word: string): number {
  if (!word) return 0;
  return Math.max(0, Math.ceil(word.length / 5) - 1);
}

/** Render a center word with the ORP letter highlighted */
function WordWithOrp({
  word,
  baseColor,
}: {
  word: string;
  baseColor: string;
}) {
  const idx = calcOrpIndex(word);
  const before = word.slice(0, idx);
  const orpChar = word[idx] ?? '';
  const after = word.slice(idx + 1);
  return (
    <>
      <span>{before}</span>
      {/* ORP letter — slightly brighter/larger to anchor the eye */}
      <span className={styles.orpChar} style={{ color: baseColor }}>
        {orpChar}
      </span>
      <span>{after}</span>
    </>
  );
}

const ReaderViewport = memo(function ReaderViewport({
  wordWindow,
  highlightIndex,
  highlightColor,
  orientation,
  orpEnabled,
  peripheralFade,
  isLoading,
  loadingProgress,
  hasWords,
  fullHeight,
}: ReaderViewportProps) {
  /**
   * Peripheral fade: opacity decreases with distance from the center slot.
   * Center = 1.0, distance-1 = 0.5, distance-2+ = 0.25.
   * Only applied when peripheralFade is enabled AND word count > 1.
   */
  const slotOpacity = (i: number): number => {
    if (!peripheralFade || wordWindow.length === 1) return 1;
    const dist = Math.abs(i - highlightIndex);
    if (dist === 0) return 1;
    if (dist === 1) return 0.5;
    return 0.25;
  };
  return (
    <div
      className={`${styles.viewport}${fullHeight ? ` ${styles.viewportFull}` : ''}`}
      aria-live="assertive"
      aria-atomic="true"
    >
      {isLoading ? (
        <div className={styles.loading}>
          <p>Parsing file… {loadingProgress}%</p>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={loadingProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      ) : !hasWords ? (
        <p className={styles.placeholder}>
          Upload a file, paste text, or enter a URL to start reading
        </p>
      ) : (
        /*
         * Fixed-width grid: each slot gets exactly --slot-width.
         * With equal columns, slot N is always at the same horizontal
         * position regardless of word content — no layout shifts.
         */
        <div
          className={
            orientation === 'vertical' ? styles.windowVertical : styles.windowHorizontal
          }
          style={{ '--slot-count': wordWindow.length } as CSSProperties}
        >
          {wordWindow.map((word, i) => {
            const isCenter = i === highlightIndex;
            const opacity = slotOpacity(i);
            return (
              <span
                key={i}
                className={`${styles.wordSlot}${isCenter ? ` ${styles.wordSlotCenter}` : ''}`}
                style={{
                  ...(isCenter ? { color: highlightColor } : undefined),
                  ...(opacity < 1 ? { opacity } : undefined),
                }}
                aria-hidden={word === '' ? true : undefined}
              >
                {word
                  ? isCenter && orpEnabled
                    ? <WordWithOrp word={word} baseColor={highlightColor} />
                    : word
                  : EMPTY_SLOT_PLACEHOLDER}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ReaderViewport;
