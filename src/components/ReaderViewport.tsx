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

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Orientation, StructuralMarker } from '../context/readerContextDef';
import { useReaderContext } from '../context/useReaderContext';
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
  /** Whether to color the ORP character (vs show word in uniform color) */
  orpColored: boolean;
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
  /** Current 0-based word index — used for the word-count overlay */
  currentWordIndex?: number;
  /** Total word count — used for the word-count overlay */
  totalWordCount?: number;
  /** Current 1-indexed page — used for page-nav overlay */
  currentPage?: number;
  /** Total page count — used for page-nav overlay */
  totalPages?: number;
  /** Jump to page callback — used for page-nav overlay */
  goToPage?: (page: number) => void;
  /** Jump-to-word callback — used for word-count overlay click */
  goToWord?: (index: number) => void;
  /** Structural map from the loaded document — used to build word-jump anchors */
  structureMap?: Map<number, StructuralMarker>;
  /** Called when user swipes up or taps the word display area */
  onPlayPause?: () => void;
  /** Called when user swipes left (faster) */
  onFaster?: () => void;
  /** Called when user swipes right (slower) */
  onSlower?: () => void;
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

/** Minimum horizontal pixel delta to trigger a swipe-faster or swipe-slower gesture */
const SWIPE_THRESHOLD_H = 50;
/** Minimum vertical pixel delta (upward) to trigger a swipe-play/pause gesture */
const SWIPE_THRESHOLD_V = 60;
/** Minimum fractional distance (0–1) between jump option word indices to avoid duplication */
const MIN_JUMP_OPTION_SEPARATION = 0.02;

const ReaderViewport = memo(function ReaderViewport({
  wordWindow,
  highlightIndex,
  highlightColor,
  orientation,
  orpEnabled,
  orpColored,
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
  currentWordIndex,
  totalWordCount,
  currentPage,
  totalPages,
  goToPage,
  goToWord,
  structureMap,
  onPlayPause,
  onFaster,
  onSlower,
}: ReaderViewportProps) {
  const { isPlaying } = useReaderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Outermost viewport div — receives --pre-orp-col and --focal-tick-x CSS variables */
  const viewportRef  = useRef<HTMLDivElement>(null);
  /** Hidden 'n' span — always rendered for font metric measurement */
  const measureRef   = useRef<HTMLSpanElement>(null);
  /** Touch start coordinates for swipe detection */
  const touchStartX  = useRef<number>(0);
  const touchStartY  = useRef<number>(0);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange  = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    // Horizontal swipe: must exceed threshold and be more horizontal than vertical
    if (absX > SWIPE_THRESHOLD_H && absX > absY) {
      e.preventDefault();
      if (deltaX < -SWIPE_THRESHOLD_H) { onFaster?.(); }
      else                              { onSlower?.(); }
    }
    // Vertical swipe upward: vertical threshold is larger to avoid accidental triggers
    else if (deltaY < -SWIPE_THRESHOLD_V && absY > absX) {
      e.preventDefault();
      onPlayPause?.();
    }
  }, [onFaster, onSlower, onPlayPause]);

  /* ── Page-jump popover ──────────────────────────────────────── */
  const [showPageJump, setShowPageJump] = useState(false);
  const [pageJumpDraft, setPageJumpDraft] = useState('');
  const pageJumpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPageJump) return;
    const handler = (e: MouseEvent) => {
      if (pageJumpRef.current && !pageJumpRef.current.contains(e.target as Node)) {
        setShowPageJump(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPageJump]);

  /* ── Word-jump popover ──────────────────────────────────────── */
  const [showWordJump, setShowWordJump] = useState(false);
  const wordJumpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showWordJump) return;
    const handler = (e: MouseEvent) => {
      if (wordJumpRef.current && !wordJumpRef.current.contains(e.target as Node)) {
        setShowWordJump(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showWordJump]);

  /* ── Jump options for word-jump select ──────────────────────── */
  const jumpOptions = useMemo(() => {
    const total = totalWordCount ?? 0;
    if (total === 0) return [];
    const opts: { label: string; wordIndex: number }[] = [];
    const pcts = [0, 10, 25, 50, 75, 90];
    pcts.forEach(p => {
      const idx = Math.round((p / 100) * (total - 1));
      opts.push({ label: `${p}% — word ${(idx + 1).toLocaleString()}`, wordIndex: idx });
    });
    if (structureMap) {
      const structural: { label: string; wordIndex: number }[] = [];
      structureMap.forEach((marker, wordIndex) => {
        if (marker.type === 'header' || marker.type === 'scene-separator') {
          const pct = Math.round(((wordIndex + 1) / total) * 100);
          const label = marker.label
            ? `${marker.label} — ${pct}%`
            : `${marker.type === 'header' ? 'Chapter' : 'Scene'} at ${pct}%`;
          structural.push({ label, wordIndex });
        }
      });
      structural.sort((a, b) => a.wordIndex - b.wordIndex);
      structural.forEach(s => {
        const tooClose = opts.some(o => Math.abs(o.wordIndex - s.wordIndex) < total * MIN_JUMP_OPTION_SEPARATION);
        if (!tooClose) opts.push(s);
      });
    }
    opts.sort((a, b) => a.wordIndex - b.wordIndex);
    return opts;
  }, [structureMap, totalWordCount]);

  const userScale   = mainWordFontSize / 100;
  const isMultiWord = wordWindow.length > 1;

  // ORP coloring: focalLine always wins
  // Structural split always happens (pre/ORP/post) — required for tick alignment.
  // Color is only applied when orpColored is true.
  const shouldColorOrp = orpColored && (orpEnabled || focalLine);

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
   * Measure font metrics and update CSS variables for ORP-aligned layout.
   *
   * --pre-orp-col : 3 × charWidth
   * --focal-tick-x: padding-left + pre-orp-col + 0.5 × charWidth
   * --focal-tick-h: max(10px, lineHeight × 0.55)
   *
   * Called: on mount, on mainWordFontSize change, on viewport resize.
   * currentWordIndex is DELIBERATELY NEVER a dependency — ORP is fixed, not per-word.
   */
  const measureAndSetVars = useCallback(() => {
    if (!measureRef.current || !viewportRef.current) return;

    const spanRect   = measureRef.current.getBoundingClientRect();
    const charWidth  = spanRect.width;
    const lineHeight = spanRect.height;

    // PADDING_LEFT matches the hardcoded 16px in .wordRow CSS.
    // Both must be kept in sync. The CSS spec says --space-4 = 16px (immutable).
    const PADDING_LEFT  = 16;   // var(--space-4) = 16px — keep in sync with .wordRow CSS
    const PRE_ORP_CHARS = 3;    // max pre-ORP chars in any English word (research-derived)

    const preOrpColWidth = PRE_ORP_CHARS * charWidth;
    const tickX          = PADDING_LEFT + preOrpColWidth + charWidth * 0.5;
    const tickHeight     = Math.max(10, Math.round(lineHeight * 0.55));

    viewportRef.current.style.setProperty('--pre-orp-col',  `${preOrpColWidth}px`);
    viewportRef.current.style.setProperty('--focal-tick-x', `${tickX}px`);
    viewportRef.current.style.setProperty('--focal-tick-h', `${tickHeight}px`);
  }, []);
  // ⚠️ currentWordIndex is DELIBERATELY ABSENT from deps.
  // mainWordFontSize is NOT in deps here — the useEffect below handles that trigger.

  // Effect 1: re-measure when font size preference changes
  useEffect(() => {
    measureAndSetVars();
  }, [mainWordFontSize, measureAndSetVars]);
  // ⚠️ currentWordIndex DELIBERATELY EXCLUDED.

  // Effect 2: re-measure when the viewport container is resized
  // (handles vw-based clamp font changes on window resize)
  useEffect(() => {
    if (!viewportRef.current) return;

    const ro = new ResizeObserver(() => {
      measureAndSetVars();
    });

    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [measureAndSetVars]);
  // ⚠️ currentWordIndex DELIBERATELY EXCLUDED.

  const scaledFont = computeMainWordFontSize(fullHeight ?? false, userScale);

  return (
    <div
      ref={viewportRef}
      className={`${styles.viewport}${fullHeight ? ` ${styles.viewportFull}` : ''}`}
      aria-live="assertive"
      aria-atomic="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
          onClick={() => { if (hasWords && !isLoading) onPlayPause?.(); }}
          role="button"
          tabIndex={hasWords && !isLoading ? 0 : -1}
          aria-label={isPlaying ? 'Tap to pause' : 'Tap to play'}
          onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && hasWords && !isLoading) { e.preventDefault(); onPlayPause?.(); } }}
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
        <div
          className={styles.wordRow}
          onClick={() => { if (hasWords && !isLoading) onPlayPause?.(); }}
          role="button"
          tabIndex={hasWords && !isLoading ? 0 : -1}
          aria-label={isPlaying ? 'Tap to pause' : 'Tap to play'}
          onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && hasWords && !isLoading) { e.preventDefault(); onPlayPause?.(); } }}
        >

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
      {/* ── Bottom overlays — page nav (left) + word count (right) ── */}
      {hasWords && !isLoading && (
        <div className={styles.overlayBar}>

          {currentPage !== undefined && totalPages !== undefined && totalPages > 1 && goToPage && (
            <div className={styles.pageNavOverlay} ref={pageJumpRef}>
              <button
                className={styles.pageNavBtn}
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true">
                  <polyline points="15 6 9 12 15 18"/>
                </svg>
              </button>
              <button
                className={styles.pagePillOverlay}
                onClick={() => { setPageJumpDraft(String(currentPage)); setShowPageJump(p => !p); }}
                aria-label={`Page ${currentPage} of ${totalPages}`}
              >
                Page {currentPage}<span style={{opacity:0.5, margin:'0 3px'}}>/</span>{totalPages}
              </button>
              <button
                className={styles.pageNavBtn}
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true">
                  <polyline points="9 6 15 12 9 18"/>
                </svg>
              </button>
              {showPageJump && (
                <div className={styles.pageJumpPopover}>
                  <input
                    type="number" min={1} max={totalPages}
                    value={pageJumpDraft}
                    className={styles.pageJumpInput}
                    onChange={e => setPageJumpDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = parseInt(pageJumpDraft, 10);
                        if (v >= 1 && v <= totalPages) { goToPage(v); setShowPageJump(false); }
                      }
                      if (e.key === 'Escape') setShowPageJump(false);
                    }}
                    autoFocus
                    aria-label="Jump to page"
                  />
                  <span className={styles.pageJumpHint}>Enter to jump</span>
                </div>
              )}
            </div>
          )}

          {currentWordIndex !== undefined && totalWordCount !== undefined && goToWord && (
            <div className={styles.wordNavOverlay} ref={wordJumpRef}>
              <button
                className={styles.pageNavBtn}
                onClick={() => { if (currentWordIndex > 0) goToWord(currentWordIndex - 1); }}
                disabled={currentWordIndex <= 0}
                aria-label="Previous word"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true">
                  <polyline points="15 6 9 12 15 18"/>
                </svg>
              </button>
              <button
                className={styles.pagePillOverlay}
                onClick={() => { setShowWordJump(p => !p); }}
                aria-label={`Word ${currentWordIndex + 1} of ${totalWordCount}, ${Math.round(((currentWordIndex + 1) / totalWordCount) * 100)}% complete`}
              >
                Word {(currentWordIndex + 1).toLocaleString()}
                <span className={styles.wcSep}>/</span>
                {totalWordCount.toLocaleString()}
                <span className={styles.wcPct}>· {Math.round(((currentWordIndex + 1) / totalWordCount) * 100)}%</span>
              </button>
              <button
                className={styles.pageNavBtn}
                onClick={() => { if (currentWordIndex < totalWordCount - 1) goToWord(currentWordIndex + 1); }}
                disabled={currentWordIndex >= totalWordCount - 1}
                aria-label="Next word"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true">
                  <polyline points="9 6 15 12 9 18"/>
                </svg>
              </button>
              {showWordJump && (
                <div className={styles.wordJumpPopover}>
                  <select
                    className={styles.wordJumpSelect}
                    defaultValue=""
                    autoFocus
                    aria-label="Jump to position"
                    onChange={e => {
                      const idx = parseInt(e.target.value, 10);
                      if (!isNaN(idx)) { goToWord(idx); setShowWordJump(false); }
                    }}
                    onKeyDown={e => { if (e.key === 'Escape') setShowWordJump(false); }}
                  >
                    <option value="" disabled>Jump to…</option>
                    {jumpOptions.map((opt, i) => (
                      <option key={i} value={opt.wordIndex}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
});

export default ReaderViewport;
