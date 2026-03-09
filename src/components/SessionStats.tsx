/**
 * SessionStats — multi-session analytics panel inside burger menu.
 * Shows current session + rolling history of past sessions.
 */

import { memo, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/SessionStats.module.css';

function fmtTime(ms: number) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const SessionStats = memo(function SessionStats() {
  const { sessionStats, sessionHistory, clearSessionHistory, fileMetadata } = useReaderContext();
  const { wordsRead, activeTimeMs, effectiveWpm } = sessionStats;
  const [histOpen, setHistOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      {/* Current session */}
      <div className={styles.current}>
        <span className={styles.currentLabel}>
          {fileMetadata ? fileMetadata.name : 'No file loaded'}
        </span>
        {wordsRead === 0 ? (
          <p className={styles.empty}>Start reading to track this session.</p>
        ) : (
          <div className={styles.statRow3}>
            <div className={styles.stat}><span className={styles.statVal}>{wordsRead.toLocaleString()}</span><span className={styles.statKey}>words</span></div>
            <div className={styles.stat}><span className={styles.statVal}>{fmtTime(activeTimeMs)}</span><span className={styles.statKey}>active</span></div>
            <div className={styles.stat}><span className={styles.statVal}>{effectiveWpm > 0 ? effectiveWpm : '—'}</span><span className={styles.statKey}>WPM</span></div>
          </div>
        )}
      </div>

      {/* Session history */}
      {sessionHistory.length > 0 && (
        <div className={styles.histSection}>
          <button type="button" className={styles.histToggle}
                  onClick={() => setHistOpen(v => !v)}>
            Past sessions ({sessionHistory.length}) {histOpen ? '▲' : '▼'}
          </button>
          {histOpen && (
            <ul className={styles.histList}>
              {sessionHistory.map(s => (
                <li key={s.id} className={styles.histItem}>
                  <div className={styles.histMeta}>
                    <span className={styles.histBook}>{s.bookName}</span>
                    <span className={styles.histDate}>{fmtDate(s.startedAt)}</span>
                  </div>
                  <div className={styles.histStats}>
                    <span>{s.wordsRead.toLocaleString()} words</span>
                    <span>{fmtTime(s.durationMs)}</span>
                    <span>{s.avgWpm} WPM</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className={styles.clearBtn}
                  onClick={clearSessionHistory}>Clear history</button>
        </div>
      )}
    </div>
  );
});

export default SessionStats;
