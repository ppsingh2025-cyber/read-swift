/**
 * ReadingHistory
 *
 * Displays a collapsible list of reading records saved in localStorage.
 * Each record shows the file name, reading progress, and the last-read date.
 * Records can be individually deleted or resumed by re-uploading the file.
 */

import { useCallback, useRef } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import { deleteRecord } from '../utils/recordsUtils';
import styles from '../styles/ReadingHistory.module.css';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface ReadingHistoryProps {
  onFileSelect: (file: File) => void;
}

export default function ReadingHistory({ onFileSelect }: ReadingHistoryProps) {
  const { records, setRecords } = useReaderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = useCallback(
    (name: string) => {
      setRecords(deleteRecord(name));
    },
    [setRecords],
  );

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

  if (records.length === 0) return null;

  return (
    <details className={styles.historyDetails}>
      <summary className={styles.heading}>📚 Reading History ({records.length})</summary>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub"
        style={{ display: 'none' }}
        onChange={handleResumeFileChange}
        aria-label="Re-upload file to resume reading"
      />
      <ul className={styles.list}>
        {records.map((record) => {
          const progress =
            record.wordCount > 1
              ? Math.min(
                  100,
                  Math.round(
                    (record.lastWordIndex / (record.wordCount - 1)) * 100,
                  ),
                )
              : 0;
          return (
            <li key={record.name} className={styles.item}>
              <div className={styles.info}>
                <span className={styles.name} title={record.name}>
                  {record.name}
                </span>
                <span className={styles.meta}>
                  {progress}% · {record.wordCount.toLocaleString()} words ·{' '}
                  {formatDate(record.lastReadAt)}
                </span>
                <div className={styles.bar} aria-hidden="true">
                  <div
                    className={styles.fill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.resumeBtn}
                  onClick={handleResumeClick}
                  title={`Resume reading ${record.name}`}
                  aria-label={`Resume reading ${record.name}`}
                >
                  ↩ Resume
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(record.name)}
                  title={`Remove record for ${record.name}`}
                  aria-label={`Remove record for ${record.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
