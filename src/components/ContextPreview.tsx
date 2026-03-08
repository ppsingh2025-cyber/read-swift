/**
 * ContextPreview — "Page Context"
 *
 * Shows the words on the current book page (using real pageBreaks from the parser).
 * Falls back to 80-word artificial pages when the document has no page structure.
 *
 * Design rules:
 *  - Expanded by default
 *  - Collapsed state shows header only (no snippet text)
 *  - Content area scrolls; last line is never clipped
 *  - Words never jitter mid-page — only re-renders when page changes
 */

import { useCallback, useMemo, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

const FALLBACK_PAGE_SIZE = 80;
const LS_KEY = 'contextPreview_collapsed';

export default function ContextPreview() {
  const {
    words,
    currentWordIndex,
    goToWord,
    isLoading,
    pageBreaks,
    currentPage,
    totalPages,
  } = useReaderContext();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const s = localStorage.getItem(LS_KEY);
    // Default: expanded (false). Only collapsed if user explicitly closed it.
    return s === 'true';
  });

  const hasWords = words.length > 0;
  const isExpanded = hasWords && !collapsed;

  const handleToggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(LS_KEY, String(next));
      return next;
    });
  }, []);

  // Determine page word range using real pageBreaks when available
  const { pageStart, pageEnd } = useMemo(() => {
    const hasRealPages = pageBreaks.length > 1;
    if (hasRealPages) {
      // pageBreaks is 1-indexed in the context (currentPage is 1-based)
      // pageBreaks[i] = word index where page i+1 starts
      const pageIdx = currentPage - 1; // 0-based
      const start = pageBreaks[pageIdx] ?? 0;
      const end = pageBreaks[pageIdx + 1] ?? words.length;
      return { pageStart: start, pageEnd: end };
    } else {
      // Fallback: artificial 80-word pages
      const pageNum = Math.floor(currentWordIndex / FALLBACK_PAGE_SIZE);
      const start = pageNum * FALLBACK_PAGE_SIZE;
      const end = Math.min(words.length, start + FALLBACK_PAGE_SIZE);
      return { pageStart: start, pageEnd: end };
    }
  }, [pageBreaks, currentPage, currentWordIndex, words.length]);

  // pageWords is stable while the reader is on the same page
  const pageWords = useMemo(
    () => words.slice(pageStart, pageEnd),
    [words, pageStart, pageEnd],
  );

  // Displayed page numbers
  const displayPage = currentPage > 0 ? currentPage : Math.floor(currentWordIndex / FALLBACK_PAGE_SIZE) + 1;
  const displayTotal = totalPages > 0 ? totalPages : Math.ceil(words.length / FALLBACK_PAGE_SIZE);

  if (!hasWords || isLoading) return null;

  return (
    <div className={styles.preview} aria-label="Page context">

      {/* ── Header toggle ── */}
      <button
        className={styles.heading}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="page-context-content"
      >
        <span className={styles.headingLabel}>
          Page Context
          {displayTotal > 1 && (
            <span className={styles.pageIndicator}>
              {displayPage} / {displayTotal}
            </span>
          )}
        </span>
        <span
          className={styles.chevron}
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >▼</span>
      </button>

      {/* ── Content — only rendered when expanded ── */}
      {isExpanded && (
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
      )}

    </div>
  );
}
