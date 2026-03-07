/**
 * ContextPreview
 *
 * Shows a scrollable excerpt centered on the current word position.
 * Uses a fixed ±window approach (continuous reading engine) rather than
 * page-bounded display, eliminating the page-reset bug where the preview
 * would jump back to the top of a page on page changes.
 *
 * The current word is highlighted in the brand colour and every word is
 * clickable to jump directly to it.
 *
 * The component auto-scrolls so the active word stays visible whenever the
 * current word index changes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

/** Number of words shown before and after the current position */
const CONTEXT_HALF = 80;

const LS_KEY_COLLAPSED = 'contextPreview_collapsed';

export default function ContextPreview() {
  const {
    words,
    currentWordIndex,
    goToWord,
    isLoading,
  } = useReaderContext();

  const activeRef = useRef<HTMLSpanElement>(null);

  // Track whether the user explicitly collapsed the panel.
  // Default: collapsed — user must tap to expand. Persists in localStorage.
  const [userCollapsed, setUserCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(LS_KEY_COLLAPSED);
    // Not set (first run) → collapsed by default
    // 'false' → explicitly expanded
    // 'true' or anything else → collapsed
    return stored === null ? true : stored !== 'false';
  });

  const hasWords = words.length > 0;
  // Expanded when text is present AND the user has not explicitly collapsed it
  const isExpanded = hasWords && !userCollapsed;

  const collapsedSnippet = useMemo(() => {
    if (!hasWords) return '';
    const s = Math.max(0, currentWordIndex - 4);
    const e = Math.min(words.length, currentWordIndex + 14);
    return words.slice(s, e).join(' ');
  }, [words, currentWordIndex, hasWords]);

  const handleToggle = useCallback(() => {
    setUserCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(LS_KEY_COLLAPSED, String(next));
      return next;
    });
  }, []);

  const handleWordClick = useCallback(
    (globalIndex: number) => {
      goToWord(globalIndex);
    },
    [goToWord],
  );

  // Always use a rolling window centered on the current word index.
  const start = Math.max(0, currentWordIndex - CONTEXT_HALF);
  const end = Math.min(words.length, currentWordIndex + CONTEXT_HALF + 1);
  const visibleWords = words.slice(start, end);

  // Auto-scroll the active word into view on index change
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentWordIndex]);

  if (!words.length || isLoading) return null;

  return (
    <div className={styles.preview} aria-label="Reading context preview">
      <button
        className={styles.heading}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="context-preview-content"
      >
        {!isExpanded && hasWords ? (
          <span className={styles.collapsedSnippet} aria-hidden="true">…{collapsedSnippet}…</span>
        ) : (
          <span className={styles.headingLabel}>Context</span>
        )}
        <span
          className={styles.chevron}
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >▼</span>
      </button>
      {isExpanded && (
        <div id="context-preview-content" className={styles.content}>
          {visibleWords.map((word, i) => {
            const globalIndex = start + i;
            const isActive = globalIndex === currentWordIndex;
            return (
              <span
                key={globalIndex}
                ref={isActive ? activeRef : undefined}
                className={isActive ? styles.activeWord : styles.wordSpan}
                onClick={() => handleWordClick(globalIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleWordClick(globalIndex);
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
