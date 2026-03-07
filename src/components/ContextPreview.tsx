/**
 * ContextPreview — "Page Preview"
 *
 * Page-based static rendering. Zero scroll jitter.
 *
 * Words are divided into fixed pages of PAGE_SIZE.
 * The rendered word list only changes when currentWordIndex
 * crosses a page boundary. The accent highlight moves within
 * the static list without any scrollIntoView or scroll at all.
 *
 * When collapsed: content area is not rendered (null).
 */

import { useCallback, useMemo, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

const PAGE_SIZE = 80;
const LS_KEY = 'contextPreview_collapsed';

export default function ContextPreview() {
  const { words, currentWordIndex, goToWord, isLoading } = useReaderContext();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const s = localStorage.getItem(LS_KEY);
    return s === null ? true : s !== 'false';
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

  // Page boundaries — only recomputed when currentWordIndex crosses a boundary
  const pageNum = Math.floor(currentWordIndex / PAGE_SIZE);

  // pageWords only changes when the page changes — stable reference mid-page
  const { pageStart, pageWords } = useMemo(() => {
    const start = pageNum * PAGE_SIZE;
    const end   = Math.min(words.length, start + PAGE_SIZE);
    return { pageStart: start, pageWords: words.slice(start, end) };
  }, [words, pageNum]);

  // Collapsed snippet: a few words around current position
  const snippet = useMemo(() => {
    if (!hasWords) return '';
    const s = Math.max(0, currentWordIndex - 3);
    const e = Math.min(words.length, currentWordIndex + 12);
    return words.slice(s, e).join(' ');
  }, [words, currentWordIndex, hasWords]);

  // Page indicator: "p.3 / 12"
  const totalPages = Math.ceil(words.length / PAGE_SIZE);

  if (!hasWords || isLoading) return null;

  return (
    <div className={styles.preview} aria-label="Page preview">

      {/* ── Header toggle ── */}
      <button
        className={styles.heading}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="page-preview-content"
      >
        {!isExpanded ? (
          <span className={styles.snippet} aria-hidden="true">…{snippet}…</span>
        ) : (
          <span className={styles.headingLabel}>
            Page Preview
            {totalPages > 1 && (
              <span className={styles.pageIndicator}>
                p.{pageNum + 1}/{totalPages}
              </span>
            )}
          </span>
        )}
        <span
          className={styles.chevron}
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >▼</span>
      </button>

      {/* ── Content — only rendered when expanded ── */}
      {isExpanded && (
        <div id="page-preview-content" className={styles.content}>
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
