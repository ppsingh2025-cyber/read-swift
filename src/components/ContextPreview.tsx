/**
 * ContextPreview — "Context"
 *
 * Shows the current page of the loaded text using real pageBreaks from ReaderContext.
 * viewPage follows currentPage automatically but can be navigated independently.
 * Header contains Prev/Next buttons + clickable page pill for direct page jump.
 * A ▸ cursor icon marks the currently reading word.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

const LS_KEY = 'contextPreview_collapsed';

interface ContextPreviewProps {
  onExpandChange?: (expanded: boolean) => void;
}

export default function ContextPreview({ onExpandChange }: ContextPreviewProps) {
  const {
    words, currentWordIndex, pageBreaks, currentPage, totalPages,
    goToWord, goToPage, isLoading
  } = useReaderContext();

  const [collapsed, setCollapsed] = useState<boolean>(() =>
    localStorage.getItem(LS_KEY) === 'true'
  );

  // viewPage follows currentPage unless user manually navigated
  const [viewPage, setViewPage] = useState<number>(currentPage);
  const [isDetached, setIsDetached] = useState(false);

  // Page jump editing state
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInputVal, setPageInputVal] = useState('');
  const pageInputRef = useRef<HTMLInputElement>(null);

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

  const startPageEdit = useCallback(() => {
    setPageInputVal(String(viewPage));
    setIsEditingPage(true);
    setTimeout(() => pageInputRef.current?.select(), 0);
  }, [viewPage]);

  const commitPageEdit = useCallback(() => {
    const parsed = parseInt(pageInputVal, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      setViewPage(parsed);
      setIsDetached(parsed !== currentPage);
      goToPage(parsed);
    }
    setIsEditingPage(false);
  }, [pageInputVal, totalPages, currentPage, goToPage]);

  const handlePageKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitPageEdit();
    if (e.key === 'Escape') setIsEditingPage(false);
  }, [commitPageEdit]);

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
      {/* ── Header row with nav ── */}
      <div className={styles.headingRow}>
        {totalPages > 1 && (
          <button type="button" className={styles.navBtn}
                  onClick={goPrev} disabled={viewPage <= 1}
                  aria-label="Previous page" title="Previous page">‹</button>
        )}
        <button
          type="button"
          className={styles.heading}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls="page-context-content"
        >
          <span className={styles.headingLabel}>Context</span>
          {totalPages > 1 && (
            isEditingPage ? (
              <input
                ref={pageInputRef}
                className={styles.pageInput}
                type="number"
                min={1}
                max={totalPages}
                value={pageInputVal}
                autoFocus
                onChange={e => setPageInputVal(e.target.value)}
                onBlur={commitPageEdit}
                onKeyDown={handlePageKey}
                onClick={e => e.stopPropagation()}
                aria-label={`Jump to page 1–${totalPages}`}
              />
            ) : (
              <span
                className={styles.pagePill}
                onClick={e => { e.stopPropagation(); startPageEdit(); }}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && startPageEdit()}
                title="Click to jump to page"
              >
                {viewPage} / {totalPages}
              </span>
            )
          )}
          {isDetached && totalPages <= 1 && (
            <button type="button" className={styles.snapBtn}
                    onClick={e => { e.stopPropagation(); setViewPage(currentPage); setIsDetached(false); }}>
              ↩ current
            </button>
          )}
          <span className={styles.headingChevron} aria-hidden="true">
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>
        {totalPages > 1 && (
          <button type="button" className={styles.navBtn}
                  onClick={goNext} disabled={viewPage >= totalPages}
                  aria-label="Next page" title="Next page">›</button>
        )}
      </div>

      {isExpanded && (
        <div id="page-context-content" className={styles.body}>
          {isDetached && totalPages > 1 && (
            <div className={styles.detachedBar}>
              <button type="button" className={styles.snapBtn}
                      onClick={() => { setViewPage(currentPage); setIsDetached(false); }}>
                ↩ current page
              </button>
            </div>
          )}
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
                  {isCurrent && <span className={styles.wordCursor} aria-hidden="true">▸</span>}
                  {word}{' '}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
