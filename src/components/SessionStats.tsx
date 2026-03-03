/**
 * SessionStats
 *
 * Lightweight session analytics panel. Displays:
 *  - Words consumed this session
 *  - Effective WPM (words / active reading time)
 *  - Total active reading time
 *
 * Non-intrusive: small, muted text in a compact bar. Hidden when session
 * hasn't started (0 words read). No tracking beyond localStorage.
 */

import { memo } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/SessionStats.module.css';

function formatTime(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const SessionStats = memo(function SessionStats() {
  const { sessionStats } = useReaderContext();
  const { wordsRead, activeTimeMs, effectiveWpm } = sessionStats;

  if (wordsRead === 0) return null;

  return (
    <div className={styles.bar} aria-label="Session statistics">
      <span className={styles.stat} title="Words read this session">
        {wordsRead.toLocaleString()} words
      </span>
      <span className={styles.divider}>·</span>
      <span className={styles.stat} title="Active reading time">
        {formatTime(activeTimeMs)}
      </span>
      {effectiveWpm > 0 && (
        <>
          <span className={styles.divider}>·</span>
          <span className={styles.stat} title="Effective WPM this session">
            {effectiveWpm} WPM avg
          </span>
        </>
      )}
    </div>
  );
});

export default SessionStats;
