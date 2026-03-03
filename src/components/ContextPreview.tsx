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

import { useCallback, useEffect, useRef } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/ContextPreview.module.css';

/** Number of words shown before and after the current position */
const CONTEXT_HALF = 80;

export default function ContextPreview() {
  const {
    words,
    currentWordIndex,
    goToWord,
    isLoading,
  } = useReaderContext();

  const activeRef = useRef<HTMLSpanElement>(null);

  // Always use a rolling window centered on the current word index.
  // This gives a true continuous reading experience with no page boundaries.
  const start = Math.max(0, currentWordIndex - CONTEXT_HALF);
  const end = Math.min(words.length, currentWordIndex + CONTEXT_HALF + 1);

  const visibleWords = words.slice(start, end);

  // Auto-scroll the active word into view on index change
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentWordIndex]);

  const handleWordClick = useCallback(
    (globalIndex: number) => {
      goToWord(globalIndex);
    },
    [goToWord],
  );

  if (!words.length || isLoading) return null;

  return (
    <div className={styles.preview} aria-label="Reading context preview">
      <p className={styles.heading}>Context</p>
      <div className={styles.content}>
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
    </div>
  );
}
