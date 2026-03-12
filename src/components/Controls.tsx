/**
 * Controls
 *
 * Three-row playback panel:
 *   Row 1 – Action buttons: Upload · Paste · Back · Play/Pause · Next
 *   Row 2 – WPM pill stepper: [−] 300 WPM [+]
 *   Row 3 – Reset to beginning (low-key text button, opens modal)
 *
 * All interactive elements meet the 44 px minimum touch-target size.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/Controls.module.css';

interface ControlsProps {
  onFileSelect: (file: File) => void;
  onPlay: () => void;
  onPause: () => void;
  onResetRequest: () => void;
  onFaster: () => void;
  onSlower: () => void;
  onPrevWord: () => void;
  onNextWord: () => void;
  /** Toggle the paste input panel above the bottom bar */
  onPasteToggle: () => void;
  /** Whether the paste panel is currently open */
  pasteOpen: boolean;
  /** When true, the "previous word" button is disabled */
  prevDisabled?: boolean;
  /** When true, the "next word" button is disabled */
  nextDisabled?: boolean;
  /** When true (maximize/focus mode) upload and paste buttons are hidden */
  focused?: boolean;
}

/** Duration in ms for the WPM flash animation — matches the CSS @keyframes wpmFlash */
const WPM_FLASH_DURATION = 200;

export default memo(function Controls({
  onFileSelect,
  onPlay,
  onPause,
  onResetRequest,
  onFaster,
  onSlower,
  onPrevWord,
  onNextWord,
  onPasteToggle,
  pasteOpen,
  prevDisabled,
  nextDisabled,
  focused,
}: ControlsProps) {
  const { isPlaying, wpm, setWpm, words, isLoading } =
    useReaderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── WPM inline edit ─────────────────────────────────────────── */
  const [wpmEditing, setWpmEditing] = useState(false);
  const [wpmDraft,   setWpmDraft]   = useState('');
  const wpmInputRef = useRef<HTMLInputElement>(null);

  /* ── WPM flash on speed change ───────────────────────────────── */
  const [wpmFlash, setWpmFlash] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setWpmFlash(true), 0);
    const t2 = setTimeout(() => setWpmFlash(false), WPM_FLASH_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [wpm]);

  /* ── File upload ─────────────────────────────────────────────── */
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
        e.target.value = '';
      }
    },
    [onFileSelect],
  );

  const hasWords = words.length > 0;

  return (
    <div className={styles.controls}>
      <div className={styles.inner}>

      {/* ── Row 1: Action buttons ───────────────────────────────── */}
      <div className={styles.actionRow}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub,.txt,.md,.html,.htm,.rtf,.srt,.docx"
          className={styles.hiddenInput}
          onChange={handleFileChange}
          aria-label="Upload file"
        />

        {!focused && (
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleFileClick}
            disabled={isLoading}
            title="Upload file (PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX)"
            aria-label="Upload file"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V3m0 0l-4 4m4-4l4 4"/>
              <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2"/>
            </svg>
            <span className={styles.controlBtnLabel}>Upload</span>
          </button>
        )}

        {!focused && (
          <button
            type="button"
            className={`${styles.controlBtn}${pasteOpen ? ` ${styles.controlBtnActive}` : ''}`}
            onClick={onPasteToggle}
            title="Paste text"
            aria-label="Toggle paste panel"
            aria-pressed={pasteOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="9" y="2" width="6" height="4" rx="1"/>
              <path d="M9 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2h-2"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
            <span className={styles.controlBtnLabel}>Paste</span>
          </button>
        )}

        <button
          type="button"
          className={styles.controlBtn}
          onClick={onPrevWord}
          disabled={prevDisabled}
          title="Previous word (←)"
          aria-label="Previous word"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 6 9 12 15 18"/>
          </svg>
          <span className={styles.controlBtnLabel}>Back</span>
        </button>

        <button
          type="button"
          className={styles.playBtn}
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasWords}
          title="Play / Pause (Space)"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" fill="currentColor" rx="1"/>
              <rect x="14" y="4" width="4" height="16" fill="currentColor" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <polygon points="6,4 20,12 6,20" fill="currentColor"/>
            </svg>
          )}
          <span className={styles.playBtnLabel}>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          type="button"
          className={styles.controlBtn}
          onClick={onNextWord}
          disabled={nextDisabled}
          title="Next word (→)"
          aria-label="Next word"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 6 15 12 9 18"/>
          </svg>
          <span className={styles.controlBtnLabel}>Next</span>
        </button>

      </div>

      {/* ── WPM pill stepper ── */}
      <div className={styles.wpmPill}>
        <button
          type="button"
          className={styles.wpmPillBtn}
          onClick={onSlower}
          disabled={isLoading}
          aria-label="Decrease speed"
          title="Slower (↓)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        {wpmEditing ? (
          <input
            ref={wpmInputRef}
            type="number"
            className={styles.wpmPillInput}
            value={wpmDraft}
            min={60}
            max={1500}
            onChange={(e) => setWpmDraft(e.target.value)}
            onBlur={() => {
              const v = parseInt(wpmDraft, 10);
              if (!isNaN(v)) setWpm(Math.min(1500, Math.max(60, v)));
              setWpmEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setWpmEditing(false);
            }}
            autoFocus
            aria-label="Words per minute"
          />
        ) : (
          <button
            type="button"
            className={`${styles.wpmPillValue}${wpmFlash ? ` ${styles.wpmPillFlash}` : ''}`}
            onClick={() => { setWpmDraft(String(wpm)); setWpmEditing(true); }}
            aria-label={`${wpm} words per minute, tap to edit`}
            title="Tap to set exact WPM"
          >
            {wpm} <span className={styles.wpmUnit}>WPM</span>
          </button>
        )}

        <button
          type="button"
          className={styles.wpmPillBtn}
          onClick={onFaster}
          disabled={isLoading}
          aria-label="Increase speed"
          title="Faster (↑)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── Row 3: Reset ── */}
      <div className={styles.resetRow}>
        <button
          type="button"
          className={styles.resetRowBtn}
          onClick={onResetRequest}
          disabled={!hasWords}
          title="Reset to beginning"
          aria-label="Reset to beginning"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
               strokeLinecap="round" strokeLinejoin="round" width="13" height="13" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <polyline points="3 3 3 8 8 8"/>
          </svg>
          Reset to beginning
        </button>
      </div>

      </div>
    </div>
  );
})
