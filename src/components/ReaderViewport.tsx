/**
 * ReaderViewport
 *
 * Displays the rolling word window with a guaranteed-stable focal position.
 *
 * Layout approach:
 *   Horizontal mode uses an inline-block center word inside a text-align:center
 *   container. Peripheral words are absolutely positioned relative to the center
 *   word's container edges so they never cause the ORP word to shift horizontally.
 *   Left peripherals extend to the left, right peripherals extend to the right,
 *   all without affecting the center word's position.
 *
 *   Vertical mode stacks words in a flex column; the center word is still
 *   highlighted but there is no horizontal shift problem in this orientation.
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

import { memo, useRef } from 'react';
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
  /** Whether to show the subtle focus marker dot beneath the ORP character */
  focusMarkerEnabled?: boolean;
  /** When true, renders a vertical focal guide line and ORP letter highlight */
  focalLine?: boolean;
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
  return [
    `clamp(${(minFontRem * userScale).toFixed(3)}rem,`,
    ` calc(${(vwCoeff * userScale).toFixed(3)}vw),`,
    ` ${(maxFontRem * userScale).toFixed(3)}rem)`,
  ].join('');
}


/**
 * OrpAnchorLayout — used when focalLine is ON and orientation is horizontal.
 *
 * Forces the ORP character to the horizontal center of a grid container that
 * fills the viewport width, so it aligns with the tick marks at left: 50%.
 *
 * Grid: [left 1fr] [ORP auto] [right 1fr]
 * No overflow:hidden anywhere — words are always fully visible.
 */
function OrpAnchorLayout({
  word,
  highlightColor,
}: {
  word: string;
  highlightColor: string;
}) {
  const idx = calcOrpIndex(word);
  return (
    <div className={styles.focalWordGrid}>
      <span className={styles.focalWordLeft}>{word.slice(0, idx)}</span>
      <span className={styles.focalWordOrp} style={{ color: highlightColor }}>
        {word[idx]}
      </span>
      <span className={styles.focalWordRight}>{word.slice(idx + 1)}</span>
    </div>
  );
}


function WordWithOrp({
  word,
  baseColor,
  focusMarkerEnabled,
}: {
  word: string;
  baseColor: string;
  focusMarkerEnabled: boolean;
}) {
  const idx = calcOrpIndex(word);
  const before = word.slice(0, idx);
  const orpChar = word[idx] ?? '';
  const after = word.slice(idx + 1);
  return (
    <>
      {/* Prefix and suffix: slightly muted so the pivot stands out */}
      <span className={styles.orpContext}>{before}</span>
      {/* ORP pivot letter — full color, bold, slightly larger */}
      <span
        className={`${styles.orpChar}${focusMarkerEnabled ? ` ${styles.orpCharMarker}` : ''}`}
        style={{ color: baseColor }}
      >
        {orpChar}
      </span>
      <span className={styles.orpContext}>{after}</span>
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
  onFileSelect,
  onShowPaste,
  focusMarkerEnabled = true,
  focalLine = false,
}: ReaderViewportProps) {
  /**
   * Peripheral fade: left-anchor — slot 0 (current word) is always full opacity.
   * Upcoming words (slots 1+) fade progressively.
   * Only applied when peripheralFade is enabled AND more than one word is shown.
   */
  const slotOpacity = (i: number): number => {
    if (wordWindow.length === 1) return 1;
    // Slot 0 = current word — always full opacity
    if (i === 0) return 1;
    // Context words: slightly dimmed even without peripheralFade to maintain visual hierarchy
    if (!peripheralFade) return 0.65;
    // peripheralFade ON — progressive dimming by slot position
    if (i === 1) return 0.55;
    if (i === 2) return 0.35;
    return 0.2;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const userScale = mainWordFontSize / 100;
  // Focal line and ORP only make sense in single-word mode (wordWindow.length === 1).
  // In multi-word mode the eye has context and no fixed anchor is needed.
  const isSingleWord = wordWindow.length === 1;
  const isMultiWord = !isSingleWord;
  // Color the entire center word only when focalLine is OFF or vertical orientation.
  // When focalLine is ON + horizontal (single-word), only the ORP character gets highlightColor.
  const showFocalLayout = isSingleWord && focalLine && orientation === 'horizontal';
  const shouldColorCenterWord = !showFocalLayout;

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
            <button className={styles.helpLink} onClick={handleUploadClick} aria-label="Upload a file to start reading">
              Upload a file
            </button>
            {' '}(PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX){' '}
            or{' '}
            <button className={styles.helpLink} onClick={() => onShowPaste?.()} aria-label="Paste text to start reading">
              paste text
            </button>
            {' '}to get started.
          </p>
        </div>
      ) : orientation === 'vertical' ? (
        /*
         * Vertical layout: words stacked, each centered on the focal axis.
         * No horizontal shift problem in this orientation — keep flat map.
         */
        <div
          className={styles.windowVertical}
          style={{ '--slot-count': wordWindow.length } as CSSProperties}
        >
          {wordWindow.map((word, i) => {
            const isCenter = i === highlightIndex;
            const opacity = slotOpacity(i);
            const scaledFont = isCenter
              ? computeOrpFontSize(fullHeight ?? false, userScale)
              : undefined;
            return (
              <span
                key={i}
                className={`${styles.wordSlot}${isCenter ? ` ${styles.wordSlotCenter}` : ''}`}
                style={{
                  ...(isCenter && shouldColorCenterWord ? { color: highlightColor } : undefined),
                  ...(opacity < 1 ? { opacity } : undefined),
                  ...(scaledFont ? { fontSize: scaledFont } : undefined),
                }}
                aria-hidden={word === '' ? true : undefined}
              >
                {word
                  ? isCenter && showFocalLayout
                    ? <OrpAnchorLayout word={word} highlightColor={highlightColor} />
                    : isCenter && isSingleWord && orpEnabled
                      ? <WordWithOrp word={word} baseColor={highlightColor} focusMarkerEnabled={focusMarkerEnabled} />
                      : word
                  : EMPTY_SLOT_PLACEHOLDER}
              </span>
            );
          })}
        </div>
      ) : isMultiWord ? (
        /*
         * Multi-word horizontal layout — left-anchored flex row.
         *
         * Slot 0 (main word) is always full opacity, never clipped, uses the
         * same font size as single-word mode. Slots 1+ (context words) are
         * smaller, dimmed, and self-clip with ellipsis.
         *
         * Rules:
         *  - Container overflow: visible — slot 0 must never be clipped.
         *  - align-items: baseline — mixed font sizes stay on the same baseline.
         *  - Slot 0: flex-shrink 0, overflow visible.
         *  - Slots 1+: flex-shrink 1, overflow hidden, text-overflow: ellipsis.
         */
        <div className={styles.wordLayoutMulti}>
          {wordWindow.map((word, slotIndex) => {
            const opacity = slotOpacity(slotIndex);
            if (slotIndex === 0) {
              const scaledFont = computeOrpFontSize(fullHeight ?? false, userScale);
              return (
                <span
                  key={slotIndex}
                  className={`${styles.wordSlotCenter} ${styles.mainWordInRow}`}
                  style={{
                    ...(shouldColorCenterWord ? { color: highlightColor } : undefined),
                    ...(scaledFont ? { fontSize: scaledFont } : undefined),
                  }}
                  aria-hidden={word === '' ? true : undefined}
                >
                  {word || EMPTY_SLOT_PLACEHOLDER}
                </span>
              );
            }
            return (
              <span
                key={slotIndex}
                className={styles.contextWord}
                style={opacity < 1 ? { opacity } : undefined}
                aria-hidden={word === '' ? true : undefined}
              >
                {word || EMPTY_SLOT_PLACEHOLDER}
              </span>
            );
          })}
        </div>
      ) : (
        /*
         * Single-word horizontal layout — centered, existing behavior.
         * This path is completely unchanged from before multi-word layout was added.
         */
        <div
          className={styles.windowHorizontal}
          style={{ '--slot-count': wordWindow.length } as CSSProperties}
        >
          <div className={styles.wordLayout}>
            {/* Center (ORP) word — always at fixed horizontal center */}
            {(() => {
              const word = wordWindow[highlightIndex] ?? '';
              const scaledFont = computeOrpFontSize(fullHeight ?? false, userScale);
              return (
                <span
                  className={`${styles.wordSlot} ${styles.wordSlotCenter}`}
                  style={{
                    ...(shouldColorCenterWord ? { color: highlightColor } : undefined),
                    ...(scaledFont ? { fontSize: scaledFont } : undefined),
                  }}
                >
                  {word
                    ? showFocalLayout
                      ? <OrpAnchorLayout word={word} highlightColor={highlightColor} />
                      : isSingleWord && orpEnabled
                        ? <WordWithOrp word={word} baseColor={highlightColor} focusMarkerEnabled={focusMarkerEnabled} />
                        : word
                    : EMPTY_SLOT_PLACEHOLDER}
                </span>
              );
            })()}
          </div>
        </div>
      )}
      {showFocalLayout && (
        <>
          <div className={styles.focalTickTop} aria-hidden="true" />
          <div className={styles.focalTickBottom} aria-hidden="true" />
        </>
      )}
    </div>
  );
});

export default ReaderViewport;
