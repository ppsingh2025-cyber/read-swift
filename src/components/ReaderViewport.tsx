/**
 * ReaderViewport
 *
 * v11 — ORP-aligned tick marks with pre-ORP fixed column layout.
 *
 * Layout principle:
 *   Every word is split: [pre-ORP text] [ORP char] [post-ORP text + context words]
 *
 *   The pre-ORP span has a FIXED width = 3 × charWidth (right-aligned).
 *   This accommodates the maximum pre-ORP length for any English word (3 chars).
 *   The ORP character therefore always lands at the same screen X.
 *   The tick marks confirm that fixed X — they never move.
 *
 *   Single-word and multi-word modes share identical JSX structure.
 *   Context words appear in the postOrpArea after the post-ORP text.
 *
 * Font metrics:
 *   A hidden 'n' span (measureRef) is always rendered to measure char width.
 *   useEffect([mainWordFontSize]) sets --pre-orp-col and --focal-tick-x once.
 *   currentWordIndex is NEVER in the dependency array — ticks are static.
 */

import { memo, useEffect, useRef } from 'react';
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
  /** Called when the user clicks the "Upload File" placeholder button */
  onFileSelect?: (file: File) => void;
  /** Called when the user clicks the "Paste Text" placeholder button */
  onShowPaste?: () => void;
  /** When true, renders focal guide tick marks above and below the ORP character */
  focalLine?: boolean;
  /** All loaded words — used to gate tick mark visibility */
  words?: string[];
}

/**
 * Calculate the ORP index for a word (0-based character index).
 * Classic algorithm: position ≈ ceil(length / 5) - 1 (≈ 20% from left).
 * Single-character words use index 0.
 * Maximum pre-ORP chars in English = 3 (for words ≥ 9 chars).
 */
function calcOrpIndex(word: string): number {
  if (!word) return 0;
  return Math.max(0, Math.ceil(word.length / 5) - 1);
}

/**
 * Compute a CSS font-size value for the main word based on the user's
 * mainWordFontSize preference (percentage 60–200, mapped to a scale factor).
 */
function computeMainWordFontSize(
  isFullHeight: boolean,
  userScale: number,
): string | undefined {
  if (userScale === 1) return undefined;
  const minFontRem = isFullHeight ? 2 : 1.1;
  const maxFontRem = isFullHeight ? 6 : 3.2;
  const vwCoeff    = isFullHeight ? 10 : 8;
  return [
    `clamp(${(minFontRem * userScale).toFixed(3)}rem,`,
    ` calc(${(vwCoeff * userScale).toFixed(3)}vw),`,
    ` ${(maxFontRem * userScale).toFixed(3)}rem)`,
  ].join('');
}

function getSlotOpacity(
  slotIndex: number,
  windowSize: number,
  peripheralFade: boolean,
): number {
  if (windowSize === 1) return 1;
  if (slotIndex === 0) return 1;            // main word always full opacity
  // ALL context slots receive the same uniform value (no progressive gradient).
  // fade ON:  0.45 — clearly subordinate to the main word
  // fade OFF: 0.65 — slightly dim to maintain size-based hierarchy
  // windowSize is capped at 3 in v11; both slots 1 and 2 receive the same value.
  return peripheralFade ? 0.45 : 0.65;
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
  onFileSelect,
  onShowPaste,
  focalLine = false,
  words = [],
}: ReaderViewportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Outermost viewport div — receives --pre-orp-col and --focal-tick-x CSS variables */
  const viewportRef  = useRef<HTMLDivElement>(null);
  /** Hidden 'n' span — always rendered for font metric measurement */
  const measureRef   = useRef<HTMLSpanElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange  = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
  };

  const userScale   = mainWordFontSize / 100;
  const isMultiWord = wordWindow.length > 1;

  // ORP coloring: focalLine always wins
  const shouldColorOrp = orpEnabled || focalLine;

  // Ticks appear in horizontal mode only when a document is loaded
  const showFocalTicks =
    focalLine &&
    orientation === 'horizontal' &&
    words.length > 0;

  // Split current word (slot 0) into pre-ORP / ORP char / post-ORP
  const currentWord = wordWindow[0] ?? '';
  const orpIdx      = calcOrpIndex(currentWord);
  const preOrpText  = currentWord.slice(0, orpIdx);
  const orpChar     = currentWord[orpIdx] ?? '';
  const postOrpText = currentWord.slice(orpIdx + 1);

  /**
   * Measure font metrics to set CSS variables for ORP-aligned layout.
   *
   * --pre-orp-col : 3 × charWidth — fixed pre-ORP column (right-aligned)
   * --focal-tick-x: padding-left + pre-orp-col + 0.5 × charWidth — tick center
   *
   * Dependency: [mainWordFontSize] only.
   * currentWordIndex is DELIBERATELY EXCLUDED — layout does not change per word.
   * This runs at mount (initial measurement) and whenever font size changes.
   */
  useEffect(() => {
    if (!measureRef.current || !viewportRef.current) return;

    const charRect  = measureRef.current.getBoundingClientRect();
    const charWidth = charRect.width;

    // PADDING_LEFT matches the hardcoded 16px in .wordRow CSS.
    // Both must be kept in sync. The CSS spec says --space-4 = 16px (immutable).
    const PADDING_LEFT  = 16;   // var(--space-4) = 16px — keep in sync with .wordRow CSS
    const PRE_ORP_CHARS = 3;    // max pre-ORP chars in any English word (research-derived)

    const preOrpColWidth = PRE_ORP_CHARS * charWidth;
    const tickX          = PADDING_LEFT + preOrpColWidth + charWidth * 0.5;

    viewportRef.current.style.setProperty('--pre-orp-col',    `${preOrpColWidth}px`);
    viewportRef.current.style.setProperty('--focal-tick-x',   `${tickX}px`);
  }, [mainWordFontSize]);
  // ⚠️ currentWordIndex DELIBERATELY EXCLUDED — ORP position is fixed, not per-word.

  const scaledFont = computeMainWordFontSize(fullHeight ?? false, userScale);

  return (
    <div
      ref={viewportRef}
      className={`${styles.viewport}${fullHeight ? ` ${styles.viewportFull}` : ''}`}
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Hidden measuring span — always rendered for layout metrics.
          Must use same CSS class as reading words for accurate char width. */}
      <span
        ref={measureRef}
        className={styles.mainWord}
        aria-hidden="true"
        style={{
          visibility: 'hidden',
          position: 'absolute',
          pointerEvents: 'none',
          top: 0,
          left: 0,
          whiteSpace: 'nowrap',
          ...(scaledFont ? { fontSize: scaledFont } : undefined),
        }}
      >
        n
      </span>

      {/* Tick marks — only when focalLine ON, horizontal, document loaded */}
      {showFocalTicks && (
        <>
          <div className={styles.focalTickTop}    aria-hidden="true" />
          <div className={styles.focalTickBottom} aria-hidden="true" />
        </>
      )}

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
        <div className={styles.placeholder}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.epub,.txt,.md,.html,.htm,.rtf,.srt,.docx"
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
          <p className={styles.helpHeading}>Ready to speed-read?</p>
          <p className={styles.helpBody}>
            <button
              className={styles.helpLink}
              onClick={handleUploadClick}
              aria-label="Upload a file to start reading"
            >
              Upload a file
            </button>
            {' '}(PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX){' '}
            or{' '}
            <button
              className={styles.helpLink}
              onClick={() => onShowPaste?.()}
              aria-label="Paste text to start reading"
            >
              paste text
            </button>
            {' '}to get started.
          </p>
        </div>
      ) : orientation === 'vertical' ? (
        /*
         * Vertical layout: words stacked, each centered.
         * No horizontal ORP alignment in this mode — tick marks not shown.
         */
        <div
          className={styles.windowVertical}
          style={{ '--slot-count': wordWindow.length } as CSSProperties}
        >
          {wordWindow.map((word, i) => {
            const isCenter   = i === highlightIndex;
            const opacity    = getSlotOpacity(i, wordWindow.length, peripheralFade);
            return (
              <span
                key={i}
                className={`${styles.wordSlot}${isCenter ? ` ${styles.wordSlotCenter}` : ''}`}
                style={{
                  ...(isCenter && !focalLine ? { color: highlightColor } : undefined),
                  ...(opacity < 1 ? { opacity } : undefined),
                  ...(isCenter && scaledFont ? { fontSize: scaledFont } : undefined),
                }}
                aria-hidden={!word ? true : undefined}
              >
                {word || '\u00A0'}
              </span>
            );
          })}
        </div>
      ) : (
        /*
         * Horizontal layout — unified ORP-aligned structure for both modes.
         *
         * [padding-left 16px]
         * [pre-ORP: right-aligned fixed col = 3×charWidth]
         * [ORP char: exactly at tick X]
         * [post-ORP + context words: fill remaining space]
         *
         * The pre-ORP column is ALWAYS 3×charWidth, regardless of word length.
         * Short pre-ORP text ("t") right-aligns within it, hugging the tick.
         * Long pre-ORP text ("Dos") fills it exactly.
         * The ORP character therefore lands at the same screen X for every word.
         */
        <div className={styles.wordRow}>

          {/* Pre-ORP: right-aligned to the fixed-width column */}
          <span
            className={`${styles.mainWord} ${styles.preOrp}`}
            style={scaledFont ? { fontSize: scaledFont } : undefined}
          >
            {preOrpText}
          </span>

          {/* ORP character — sits exactly at tick X */}
          <span
            className={`${styles.mainWord} ${styles.orpChar}`}
            style={{
              color: shouldColorOrp ? highlightColor : 'inherit',
              ...(scaledFont ? { fontSize: scaledFont } : undefined),
            }}
          >
            {orpChar}
          </span>

          {/* Post-ORP area — post-ORP text + context words */}
          <div className={styles.postOrpArea}>

            {/* Post-ORP text of the current word */}
            <span
              className={`${styles.mainWord} ${styles.postOrp}`}
              style={scaledFont ? { fontSize: scaledFont } : undefined}
            >
              {postOrpText}
            </span>

            {/* Context words — multi-word mode only */}
            {isMultiWord && wordWindow.slice(1).map((word, i) => {
              if (!word) return null; // empty trailing slot — no DOM node

              const actualSlot = i + 1;
              const isLastSlot = actualSlot === wordWindow.length - 1;

              return (
                <span
                  key={actualSlot}
                  className={
                    isLastSlot
                      ? styles.contextWordLast
                      : styles.contextWord
                  }
                  style={{
                    opacity: getSlotOpacity(
                      actualSlot,
                      wordWindow.length,
                      peripheralFade,
                    ),
                  }}
                >
                  {word}
                </span>
              );
            })}

          </div>

        </div>
      )}
    </div>
  );
});

export default ReaderViewport;
