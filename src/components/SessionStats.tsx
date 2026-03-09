/**
 * SessionStats — unified session analytics + reading history panel.
 * Shows current session stats + rolling history of past sessions with resume.
 */

import { memo, useCallback, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import { deleteRecord } from '../utils/recordsUtils';
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
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Unknown date';
  }
}

interface SessionStatsProps {
  onFileSelect: (file: File) => void;
}

const SessionStats = memo(function SessionStats({ onFileSelect }: SessionStatsProps) {
  const {
    sessionStats, sessionHistory, clearSessionHistory, fileMetadata,
    records, setRecords,
  } = useReaderContext();
  const { wordsRead, activeTimeMs, effectiveWpm } = sessionStats;
  const [histOpen, setHistOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResumeClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleResumeFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
        e.target.value = '';
      }
    },
    [onFileSelect],
  );

  const handleDeleteRecord = useCallback(
    (name: string) => {
      setRecords(deleteRecord(name));
    },
    [setRecords],
  );

  return (
    <div className={styles.wrapper}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub,.txt,.md,.html,.htm,.rtf,.srt,.docx"
        style={{ display: 'none' }}
        onChange={handleResumeFileChange}
        aria-label="Re-upload file to resume reading"
      />

      {/* Current session */}
      <div className={styles.current}>
        <div className={styles.currentHeader}>
          <span className={styles.currentLabel}>
            {fileMetadata ? fileMetadata.name : 'No file loaded'}
          </span>
        </div>
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
          <div className={styles.histHeader}>
            <button type="button" className={styles.histToggle}
                    onClick={() => setHistOpen(v => !v)}>
              Past sessions ({sessionHistory.length}) {histOpen ? '▲' : '▼'}
            </button>
            <button type="button" className={styles.clearBtn}
                    onClick={clearSessionHistory} aria-label="Clear session history">
              Clear ✕
            </button>
          </div>
          {histOpen && (
            <ul className={styles.histList}>
              {sessionHistory.map(s => {
                // Find matching reading record for progress bar + resume
                const record = records.find(r => r.name === s.bookName);
                const progress = record && record.wordCount > 1
                  ? Math.min(100, Math.round((record.lastWordIndex / (record.wordCount - 1)) * 100))
                  : 0;
                return (
                  <li key={s.id} className={styles.histItem}>
                    <div className={styles.histMeta}>
                      <span className={styles.histBook}>{s.bookName}</span>
                      <span className={styles.histDate}>{fmtDate(s.startedAt)}</span>
                    </div>
                    <div className={styles.histStats}>
                      <span>{s.wordsRead.toLocaleString()} words</span>
                      <span>{fmtTime(s.durationMs)}</span>
                      <span>{s.avgWpm > 0 ? `${s.avgWpm} WPM` : '—'}</span>
                    </div>
                    {record && (
                      <div className={styles.histResume}>
                        <div className={styles.histProgressBar} aria-hidden="true">
                          <div className={styles.histProgressFill} style={{ width: `${progress}%` }} />
                        </div>
                        <span className={styles.histProgressPct}>{progress}%</span>
                        <button type="button" className={styles.resumeBtn}
                                onClick={handleResumeClick}
                                title={`Resume reading ${s.bookName}`}
                                aria-label={`Resume reading ${s.bookName}`}>
                          ↩ Resume
                        </button>
                        <button type="button" className={styles.deleteRecordBtn}
                                onClick={() => handleDeleteRecord(s.bookName)}
                                title={`Remove progress for ${s.bookName}`}
                                aria-label={`Remove progress for ${s.bookName}`}>
                          ✕
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});

export default SessionStats;
