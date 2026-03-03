/**
 * ReaderViewport
 *
 * Displays the rolling word window with a guaranteed-stable focal position.
 *
 * Layout approach:
 *   Horizontal mode uses inline text flow (flexbox with baseline alignment and
 *   tight gap). Words render like a natural sentence — the ORP (center) word
 *   is displayed at a scaled font size and all words sit on the same baseline,
 *   preserving typographic rhythm.
 *
 * ORP (Optimal Recognition Point):
 *   When orpEnabled is true the center/ORP word is split into three spans:
 *   [prefix][orp-letter][suffix]. The ORP letter sits at approximately 20%
 *   from the left of the word (classic Spritz placement), rendered in a
 *   slightly different hue to guide the fixation point.
 *
 * Highlight index (ORP slot):
 *   - Odd window sizes (1, 3, 5): center slot = floor(n/2)
 *   - Even window sizes (2, 4): left-middle slot = n/2 - 1
 *   - Both: Math.ceil(n/2) - 1
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
  /** User-controlled font size scale for the ORP (center) word (percentage, 60–200, default 100) */
  mainWordFontSize?: number;
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

/**
 * Compute a CSS font-size value for the ORP (center) word based on the user's
 * mainWordFontSize preference (percentage 60–200, mapped to a scale factor).
 *
 * The scale is applied to the CSS clamp() parameters so the ORP word scales
 * proportionally without shifting the layout. Side words always render at
 * scale 1 so they provide natural peripheral context.
 *
 * Returns undefined when userScale is 1 (no change needed from CSS default).
 */
function computeOrpFontSize(
  isFullHeight: boolean,
  userScale: number,
): string | undefined {
  if (userScale === 1) return undefined;
  const minFontRem = isFullHeight ? 2 : 1.1;
  const maxFontRem = isFullHeight ? 6 : 3.2;
  const vwCoeff    = isFullHeight ? 10 : 8;
  const slotCount  = 1; // ORP word scales as if it were a single-word slot
  return [
    `clamp(${(minFontRem * userScale).toFixed(3)}rem,`,
    ` calc(${(vwCoeff * userScale).toFixed(3)}vw / ${slotCount}),`,
    ` ${(maxFontRem * userScale).toFixed(3)}rem)`,
  ].join('');
}


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
  mainWordFontSize = 100,
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

  const userScale = mainWordFontSize / 100;

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
          Upload a file or paste text to start reading
        </p>
      ) : (
        /*
         * Inline text-flow word window.
         * Horizontal: words flow naturally side-by-side like a sentence.
         * Vertical: words stacked, each centered on the focal axis.
         * The ORP (center) word is scaled by the user's mainWordFontSize
         * preference; side words always render at the default size.
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
            // Only scale the ORP word; side words stay at CSS default
            const scaledFont = isCenter
              ? computeOrpFontSize(fullHeight ?? false, userScale)
              : undefined;
            return (
              <span
                key={i}
                className={`${styles.wordSlot}${isCenter ? ` ${styles.wordSlotCenter}` : ''}`}
                style={{
                  ...(isCenter ? { color: highlightColor } : undefined),
                  ...(opacity < 1 ? { opacity } : undefined),
                  ...(scaledFont ? { fontSize: scaledFont } : undefined),
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
