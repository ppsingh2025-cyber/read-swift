/**
 * ContextPreview — "Page Context"
 *
 * Shows the current page of the loaded text using real pageBreaks from ReaderContext.
 * viewPage follows currentPage automatically but can be navigated independently.
 * "↩ current" snaps the view back to the reading position.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

const LS_KEY = 'contextPreview_collapsed';

interface ContextPreviewProps {
  onExpandChange?: (expanded: boolean) => void;
}

export default function ContextPreview({ onExpandChange }: ContextPreviewProps) {
  const {
    words, currentWordIndex, pageBreaks, currentPage, totalPages,
    goToWord, isLoading
  } = useReaderContext();

  const [collapsed, setCollapsed] = useState<boolean>(() =>
    localStorage.getItem(LS_KEY) === 'true'
  );

  // viewPage follows currentPage unless user manually navigated
  const [viewPage, setViewPage] = useState<number>(currentPage);
  const [isDetached, setIsDetached] = useState(false);

  useEffect(() => {
    if (!isDetached) setViewPage(currentPage);
  }, [currentPage, isDetached]);

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

  const goPrev = useCallback(() => {
    const target = Math.max(1, viewPage - 1);
    setViewPage(target);
    setIsDetached(target !== currentPage);
  }, [viewPage, currentPage]);

  const goNext = useCallback(() => {
    const target = Math.min(totalPages, viewPage + 1);
    setViewPage(target);
    setIsDetached(target !== currentPage);
  }, [viewPage, totalPages, currentPage]);

  const snapToCurrent = useCallback(() => {
    setViewPage(currentPage);
    setIsDetached(false);
  }, [currentPage]);

  // Compute word slice for the viewed page using real pageBreaks
  const { pageStart, pageWords } = useMemo(() => {
    if (pageBreaks.length === 0 || words.length === 0) {
      return { pageStart: 0, pageWords: words };
    }
    const zeroPage = viewPage - 1; // 0-indexed
    const start = zeroPage < pageBreaks.length ? pageBreaks[zeroPage] : 0;
    const end   = zeroPage + 1 < pageBreaks.length ? pageBreaks[zeroPage + 1] : words.length;
    return { pageStart: start, pageWords: words.slice(start, end) };
  }, [words, viewPage, pageBreaks]);

  if (!hasWords || isLoading) return null;

  return (
    <div className={styles.preview} aria-label="Page context">
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
              {viewPage} / {totalPages}
            </span>
          )}
        </span>
        <span className={styles.headingChevron} aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div id="page-context-content" className={styles.body}>
          <div className={styles.scrollArea}>
            {pageWords.map((word, i) => {
              const globalIdx = pageStart + i;
              const isCurrent = globalIdx === currentWordIndex;
              return (
                <span
                  key={globalIdx}
                  className={`${styles.word} ${isCurrent ? styles.wordActive : ''}`}
                  onClick={() => goToWord(globalIdx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && goToWord(globalIdx)}
                >
                  {word}{' '}
                </span>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.nav}>
              <button type="button" className={styles.navBtn}
                      onClick={goPrev} disabled={viewPage <= 1} aria-label="Previous page">‹</button>
              {isDetached && (
                <button type="button" className={styles.snapBtn}
                        onClick={snapToCurrent}>↩ current</button>
              )}
              <button type="button" className={styles.navBtn}
                      onClick={goNext} disabled={viewPage >= totalPages} aria-label="Next page">›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
