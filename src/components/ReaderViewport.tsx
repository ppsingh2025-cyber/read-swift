/**
 * ReaderViewport — v1.1.0
 *
 * Outer structure: .viewportCard (flex-column)
 *   ├─ .readingArea — the RSVP word display (ORP-aligned layout)
 *   │    └─ .viewportInfo — absolute overlay: word count + page nav
 *   └─ .contextStrip — expandable context preview strip
 *
 * ORP layout: [pre-ORP right-aligned fixed col] [ORP char] [post-ORP + context words]
 * Tick marks anchor where the ORP char always lands (focal-tick-x CSS var).
 */

import { memo, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Orientation } from '../context/readerContextDef';
import { useReaderContext } from '../context/useReaderContext';
import { getContextPreview, getContextSegments } from '../utils/contextHelpers';
import styles from '../styles/ReaderViewport.module.css';

interface ReaderViewportProps {
  wordWindow: string[];
  highlightIndex: number;
  highlightColor: string;
  orientation: Orientation;
  orpEnabled: boolean;
  orpColored: boolean;
  peripheralFade: boolean;
  isLoading: boolean;
  loadingProgress: number;
  hasWords: boolean;
  fullHeight?: boolean;
  mainWordFontSize?: number;
  onFileSelect?: (file: File) => void;
  onShowPaste?: () => void;
  focalLine?: boolean;
  words?: string[];
}

function calcOrpIndex(word: string): number {
  if (!word) return 0;
  return Math.max(0, Math.ceil(word.length / 5) - 1);
}

function computeMainWordFontSize(isFullHeight: boolean, userScale: number): string | undefined {
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

function getSlotOpacity(slotIndex: number, windowSize: number, peripheralFade: boolean): number {
  if (windowSize === 1) return 1;
  if (slotIndex === 0) return 1;
  return peripheralFade ? 0.45 : 0.65;
}

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
}: ReaderViewportProps) {
  const { currentWordIndex, totalPages, currentPage, goToPage } = useReaderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewportRef  = useRef<HTMLDivElement>(null);
  const measureRef   = useRef<HTMLSpanElement>(null);

  const [contextExpanded, setContextExpanded] = useState(
    () => localStorage.getItem('fastread_context_expanded') === 'true',
  );

  const [showPageJump, setShowPageJump] = useState(false);

  useEffect(() => {
    localStorage.setItem('fastread_context_expanded', String(contextExpanded));
  }, [contextExpanded]);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange  = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
  };

  const userScale   = mainWordFontSize / 100;
  const isMultiWord = wordWindow.length > 1;

  const shouldColorOrp = orpColored && (orpEnabled || focalLine);
  const showFocalTicks = focalLine && orientation === 'horizontal' && words.length > 0;

  const currentWord = wordWindow[0] ?? '';
  const orpIdx      = calcOrpIndex(currentWord);
  const preOrpText  = currentWord.slice(0, orpIdx);
  const orpChar     = currentWord[orpIdx] ?? '';
  const postOrpText = currentWord.slice(orpIdx + 1);

  useEffect(() => {
    if (!measureRef.current || !viewportRef.current) return;
    const charRect  = measureRef.current.getBoundingClientRect();
    const charWidth = charRect.width;
    const PADDING_LEFT  = 16;
    const PRE_ORP_CHARS = 3;
    const preOrpColWidth = PRE_ORP_CHARS * charWidth;
    const tickX          = PADDING_LEFT + preOrpColWidth + charWidth * 0.5;
    viewportRef.current.style.setProperty('--pre-orp-col',  `${preOrpColWidth}px`);
    viewportRef.current.style.setProperty('--focal-tick-x', `${tickX}px`);
  }, [mainWordFontSize]);

  const scaledFont = computeMainWordFontSize(fullHeight ?? false, userScale);

  return (
    <div
      ref={viewportRef}
      className={`${styles.viewportCard}${fullHeight ? ` ${styles.viewportCardFull}` : ''}`}
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* ── Reading area ────────────────────────────────────── */}
      <div className={styles.readingArea}>

        {/* Hidden measuring span for font metrics */}
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

        {/* Tick marks */}
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
              <div className={styles.progressFill} style={{ width: `${loadingProgress}%` }} />
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
              <button className={styles.helpLink} onClick={handleUploadClick} aria-label="Upload a file">
                Upload a file
              </button>
              {' '}(PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX){' '}
              or{' '}
              <button className={styles.helpLink} onClick={() => onShowPaste?.()} aria-label="Paste text">
                paste text
              </button>
              {' '}to get started.
            </p>
          </div>
        ) : orientation === 'vertical' ? (
          <div className={styles.windowVertical} style={{ '--slot-count': wordWindow.length } as CSSProperties}>
            {wordWindow.map((word, i) => {
              const isCenter = i === highlightIndex;
              const opacity  = getSlotOpacity(i, wordWindow.length, peripheralFade);
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
          <div className={styles.wordRow}>
            <span className={`${styles.mainWord} ${styles.preOrp}`} style={scaledFont ? { fontSize: scaledFont } : undefined}>
              {preOrpText}
            </span>
            <span
              className={`${styles.mainWord} ${styles.orpChar}`}
              style={{
                color: shouldColorOrp ? highlightColor : 'inherit',
                ...(scaledFont ? { fontSize: scaledFont } : undefined),
              }}
            >
              {orpChar}
            </span>
            <div className={styles.postOrpArea}>
              <span className={`${styles.mainWord} ${styles.postOrp}`} style={scaledFont ? { fontSize: scaledFont } : undefined}>
                {postOrpText}
              </span>
              {isMultiWord && wordWindow.slice(1).map((word, i) => {
                if (!word) return null;
                const actualSlot = i + 1;
                const isLastSlot = actualSlot === wordWindow.length - 1;
                return (
                  <span
                    key={actualSlot}
                    className={isLastSlot ? styles.contextWordLast : styles.contextWord}
                    style={{ opacity: getSlotOpacity(actualSlot, wordWindow.length, peripheralFade) }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Word count + page nav overlay (only when doc loaded) */}
        {words.length > 0 && (
          <div className={styles.viewportInfo}>
            <span className={styles.viewportWordCount}>
              {currentWordIndex.toLocaleString()} / {words.length.toLocaleString()}
            </span>
            {totalPages > 1 && (
              <div className={styles.viewportPageNav}>
                <button
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >‹</button>
                <button
                  onClick={() => setShowPageJump(p => !p)}
                  aria-label={`Page ${currentPage} of ${totalPages}`}
                >
                  p.{currentPage}/{totalPages}
                </button>
                <button
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                >›</button>
                {showPageJump && (
                  <div className={styles.pageJumpPopover}>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      defaultValue={currentPage}
                      className={styles.pageJumpInput}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = Number((e.target as HTMLInputElement).value);
                          if (val >= 1 && val <= totalPages) { goToPage(val); setShowPageJump(false); }
                        }
                        if (e.key === 'Escape') setShowPageJump(false);
                      }}
                      autoFocus
                    />
                    <span className={styles.pageJumpHint}>Enter + jump</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Context strip ────────────────────────────────────── */}
      {words.length > 0 && (
        <div
          className={`${styles.contextStrip}${contextExpanded ? ` ${styles.contextStripExpanded}` : ''}`}
          onClick={() => setContextExpanded(p => !p)}
          role="button"
          aria-expanded={contextExpanded}
        >
          <div className={styles.contextHandle} />
          {!contextExpanded && (
            <p className={styles.contextPreview}>{getContextPreview(words, currentWordIndex)}</p>
          )}
          {contextExpanded && (
            <p className={styles.contextFull}>
              {getContextSegments(words, currentWordIndex).map((seg, i) =>
                seg.isCurrent
                  ? <mark key={i} className={styles.contextMark}>{seg.text} </mark>
                  : <span key={i}>{seg.text} </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default ReaderViewport;
