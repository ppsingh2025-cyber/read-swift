/**
 * ContextPreview — "Page Context"
 *
 * Shows the current 80-word page of the loaded text.
 * viewPage follows currentWordIndex automatically but can be navigated
 * independently with Prev / Next buttons, letting the user read ahead.
 * "Go to current" snaps the view back to the reading position.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

const PAGE_SIZE = 80;
const LS_KEY = 'contextPreview_collapsed';

interface ContextPreviewProps {
  onExpandChange?: (expanded: boolean) => void;
}

export default function ContextPreview({ onExpandChange }: ContextPreviewProps) {
  const { words, currentWordIndex, goToWord, isLoading } = useReaderContext();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const s = localStorage.getItem(LS_KEY);
    return s === 'true';           // default: expanded
  });

  // The page the user is VIEWING (may differ from the reading page)
  const readingPage = Math.floor(currentWordIndex / PAGE_SIZE);
  const [viewPage, setViewPage] = useState<number>(readingPage);

  // When reading crosses a page boundary, auto-sync viewPage unless user
  // has manually navigated away (isDetached)
  const [isDetached, setIsDetached] = useState(false);

  useEffect(() => {
    if (!isDetached) {
      setViewPage(readingPage);
    }
  }, [readingPage, isDetached]);

  const totalPages = Math.ceil(words.length / PAGE_SIZE);
  const hasWords = words.length > 0;
  const isExpanded = hasWords && !collapsed;

  const handleToggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(LS_KEY, String(next));
      onExpandChange?.(!next); // !next = expanded
      return next;
    });
  }, [onExpandChange]);

  // Fire initial expand state on mount
  useEffect(() => {
    onExpandChange?.(!collapsed);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goPrev = useCallback(() => {
    setViewPage(p => Math.max(0, p - 1));
    setIsDetached(true);
  }, []);

  const goNext = useCallback(() => {
    setViewPage(p => Math.min(totalPages - 1, p + 1));
    setIsDetached(true);
  }, [totalPages]);

  const snapToCurrent = useCallback(() => {
    setViewPage(readingPage);
    setIsDetached(false);
  }, [readingPage]);

  const { pageStart, pageWords } = useMemo(() => {
    const start = viewPage * PAGE_SIZE;
    const end   = Math.min(words.length, start + PAGE_SIZE);
    return { pageStart: start, pageWords: words.slice(start, end) };
  }, [words, viewPage]);

  if (!hasWords || isLoading) return null;

  return (
    <div className={styles.preview} aria-label="Page context">

      {/* ── Header ── */}
      <button
        type="button"
        className={styles.heading}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="page-context-content"
      >
        <span className={styles.headingLabel}>
          Page Context
          {totalPages > 1 && (
            <span className={styles.pageIndicator}>
              {viewPage + 1} / {totalPages}
            </span>
          )}
          {isDetached && (
            <span className={styles.detachedBadge} aria-label="Viewing different page from current">
              browsing
            </span>
          )}
        </span>
        <span
          className={styles.chevron}
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >▼</span>
      </button>

      {/* ── Content ── */}
      {isExpanded && (
        <>
          <div id="page-context-content" className={styles.content}>
            {pageWords.map((word, i) => {
              const globalIndex = pageStart + i;
              const isActive    = globalIndex === currentWordIndex;
              return (
                <span
                  key={globalIndex}
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

          {/* ── Page navigation bar ── */}
          {totalPages > 1 && (
            <div className={styles.navBar}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={goPrev}
                disabled={viewPage <= 0}
                aria-label="Previous page"
                title="Previous page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                     width="12" height="12" aria-hidden="true">
                  <polyline points="15 6 9 12 15 18"/>
                </svg>
              </button>

              <span className={styles.navInfo}>
                {viewPage + 1} / {totalPages}
              </span>

              {isDetached && (
                <button
                  type="button"
                  className={styles.snapBtn}
                  onClick={snapToCurrent}
                  aria-label="Jump to current reading position"
                  title="Jump to current word"
                >
                  ◎ Now
                </button>
              )}

              <button
                type="button"
                className={styles.navBtn}
                onClick={goNext}
                disabled={viewPage >= totalPages - 1}
                aria-label="Next page"
                title="Next page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                     width="12" height="12" aria-hidden="true">
                  <polyline points="9 6 15 12 9 18"/>
                </svg>
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
