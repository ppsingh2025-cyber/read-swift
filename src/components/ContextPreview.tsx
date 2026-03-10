/**
 * ContextPreview — "Page Preview"
 *
 * Shows the current page of the loaded text using the same page structure as
 * the main viewport (pageBreaks from ReaderContext). viewPage follows
 * currentPage automatically but can be navigated independently.
 * Header row: label · ‹ N/total › page cluster · ▼ collapse toggle.
 * Active word auto-scrolls into view as reading advances.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

const LS_KEY = 'contextPreview_collapsed';
const LS_AUTOSCROLL_KEY = 'contextPreview_autoScroll';

interface ContextPreviewProps {
  onExpandChange?: (expanded: boolean) => void;
}

export default function ContextPreview({ onExpandChange }: ContextPreviewProps) {
  const { words, currentWordIndex, goToWord, isLoading, pageBreaks, currentPage, totalPages } = useReaderContext();

  const [collapsed, setCollapsed] = useState<boolean>(() =>
    localStorage.getItem(LS_KEY) === 'true'
  );

  const [autoScroll, setAutoScroll] = useState<boolean>(() =>
    localStorage.getItem(LS_AUTOSCROLL_KEY) !== 'false'
  );

  // 0-based view page index — tracks the 1-based currentPage from context
  const readingPage = Math.max(0, currentPage - 1);
  const [viewPage, setViewPage] = useState<number>(readingPage);
  const [isDetached, setIsDetached] = useState(false);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const contentRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDetached) setViewPage(readingPage);
  }, [readingPage, isDetached]);

  // Threshold-based instant scroll using getBoundingClientRect() for reliable
  // position calculation (offsetTop is relative to offsetParent, not the scroll
  // container, so it gives wrong values when the content div has no position:relative).
  // The active word "walks" down the visible area. When its bottom edge passes
  // 75% of the container height, the view snaps so the word sits at 25% from the
  // top — giving the reader plenty of forward context below.
  useEffect(() => {
    if (collapsed || !activeWordRef.current || !contentRef.current) return;
    if (!autoScroll) return;
    const el        = activeWordRef.current;
    const container = contentRef.current;
    const elRect    = el.getBoundingClientRect();
    const cRect     = container.getBoundingClientRect();
    const ch        = container.clientHeight;

    // Position of active word's edges within the visible container area
    const relTop    = elRect.top - cRect.top;
    const relBottom = elRect.bottom - cRect.top;

    // Word's bottom is past 75% of the visible area → snap so word sits at 25% from top
    if (relBottom > ch * 0.75) {
      container.scrollTop += relTop - ch * 0.25;
    }
    // Word is above the visible area (page changed, content replaced) → same snap
    else if (relTop < 0) {
      container.scrollTop += relTop - ch * 0.25;
    }
    // Word is in the comfortable zone (top 0–75%) → do nothing
  }, [currentWordIndex, collapsed, autoScroll]);

  // When there are no structural page breaks (plain text, short paste),
  // totalPages is 0 or 1 — treat the entire word list as a single page.
  const effectiveTotalPages = Math.max(1, totalPages);
  const hasPageNav = effectiveTotalPages > 1;

  const hasWords = words.length > 0;
  const isExpanded = hasWords && !collapsed;

  const handleToggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(LS_KEY, String(next));
      onExpandChange?.(!next);
      return next;
    });
  }, [onExpandChange]);

  useEffect(() => { onExpandChange?.(!collapsed); }, []); // eslint-disable-line

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewPage(p => Math.max(0, p - 1));
    setIsDetached(true);
  }, []);

  const goNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewPage(p => Math.min(effectiveTotalPages - 1, p + 1));
    setIsDetached(true);
  }, [effectiveTotalPages]);

  const snapToCurrent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setViewPage(readingPage);
    setIsDetached(false);
  }, [readingPage]);

  const { pageStart, pageWords } = useMemo(() => {
    // When structural page breaks exist, use them directly so the context panel
    // shows the exact same words as the main viewport page.
    // When no breaks exist (plain text), show the entire word list.
    if (hasPageNav && pageBreaks.length > 0) {
      const start = pageBreaks[viewPage] ?? 0;
      const end   = pageBreaks[viewPage + 1] ?? words.length;
      return { pageStart: start, pageWords: words.slice(start, end) };
    }
    return { pageStart: 0, pageWords: words };
  }, [words, viewPage, pageBreaks, hasPageNav]);

  if (!hasWords || isLoading) return null;

  return (
    <div className={styles.preview} aria-label="Page preview">

      {/* ── Header row ── */}
      <div className={styles.headerRow}>

        {/* Label */}
        <span className={styles.headingLabel}>
          Page Preview
          {isDetached && (
            <button
              type="button"
              className={styles.returnBtn}
              onClick={snapToCurrent}
              aria-label="Return to current reading position"
              title="Return to current reading position"
            >
              ↩ current
            </button>
          )}
        </span>

        {/* Page nav cluster — ‹ 3/42 › */}
        {hasPageNav && (
          <div className={styles.pageCluster}>
            <button
              type="button"
              className={styles.pageNavBtn}
              onClick={goPrev}
              disabled={viewPage <= 0}
              aria-label="Previous page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                   width="11" height="11" aria-hidden="true">
                <polyline points="15 6 9 12 15 18"/>
              </svg>
            </button>
            <span className={styles.pageNum}>
              {viewPage + 1} / {effectiveTotalPages}
            </span>
            <button
              type="button"
              className={styles.pageNavBtn}
              onClick={goNext}
              disabled={viewPage >= effectiveTotalPages - 1}
              aria-label="Next page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                   width="11" height="11" aria-hidden="true">
                <polyline points="9 6 15 12 9 18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Auto-scroll toggle */}
        <button
          type="button"
          className={styles.autoScrollBtn}
          onClick={() => {
            const next = !autoScroll;
            setAutoScroll(next);
            localStorage.setItem(LS_AUTOSCROLL_KEY, String(next));
          }}
          aria-label={autoScroll ? 'Auto-scroll on, click to disable' : 'Auto-scroll off, click to enable'}
          title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
        >
          {autoScroll ? 'Auto ●' : 'Auto ○'}
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls="page-preview-content"
          aria-label={isExpanded ? 'Collapse page preview' : 'Expand page preview'}
        >
          <span
            className={styles.chevron}
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >▼</span>
        </button>
      </div>

      {/* ── Content ── */}
      {isExpanded && (
        <div id="page-preview-content" className={styles.content} ref={contentRef}>
          {pageWords.map((word, i) => {
            const globalIndex = pageStart + i;
            const isActive    = globalIndex === currentWordIndex;
            return (
              <span
                key={globalIndex}
                ref={isActive ? activeWordRef : undefined}
                className={isActive ? styles.activeWord : styles.word}
                onClick={() => goToWord(globalIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToWord(globalIndex);
                  }
                }}
                aria-label={`${word}${isActive ? ' (current)' : ''}`}
                aria-pressed={isActive}
              >
                {word}{' '}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
