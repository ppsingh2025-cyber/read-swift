/**
 * Controls — v1.1.0
 *
 * Three rows:
 *   1. Action row — 6 buttons: Upload, Paste, Back, Play/Pause, Next, Reset
 *   2. WPM row    — [−] [slider] [+]
 *   3. WPM value  — centered "{wpm} WPM"
 */

import React, { useCallback, useRef } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/Controls.module.css';

interface ControlsProps {
  onFileSelect: (file: File) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onPrevWord: () => void;
  onNextWord: () => void;
  onPasteClick: () => void;
}

export default function Controls({
  onFileSelect,
  onPlay,
  onPause,
  onReset,
  onPrevWord,
  onNextWord,
  onPasteClick,
}: ControlsProps) {
  const { isPlaying, wpm, setWpm, words, isLoading, currentWordIndex } = useReaderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) { onFileSelect(file); e.target.value = ''; }
    },
    [onFileSelect],
  );

  const hasWords = words.length > 0;
  const togglePlayPause = isPlaying ? onPause : onPlay;

  const handleBack = useCallback(() => onPrevWord(), [onPrevWord]);
  const handleNext = useCallback(() => onNextWord(), [onNextWord]);
  const handleReset = useCallback(() => onReset(), [onReset]);

  const adjustWpm = useCallback((delta: number) => {
    setWpm(Math.min(1000, Math.max(100, wpm + delta)));
  }, [wpm, setWpm]);

  return (
    <div className={styles.controls}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub,.txt,.md,.html,.htm,.rtf,.srt,.docx"
        className={styles.hiddenInput}
        onChange={handleFileChange}
        aria-label="Upload file"
      />

      {/* ── Action row — 6 buttons ─────────────────────────── */}
      <div className={styles.actionRow}>
        <button className={styles.controlBtn} onClick={handleUpload} disabled={isLoading} aria-label="Upload file">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className={styles.lbl}>Upload</span>
        </button>

        <button className={styles.controlBtn} onClick={onPasteClick} aria-label="Paste text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
          <span className={styles.lbl}>Paste</span>
        </button>

        <button className={styles.controlBtn} onClick={handleBack} disabled={!hasWords || currentWordIndex <= 0} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span className={styles.lbl}>Back</span>
        </button>

        <button className={styles.playBtn} onClick={togglePlayPause} disabled={!hasWords} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5,3 19,12 5,21"/></svg>
          }
          <span className={styles.playLbl}>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button className={styles.controlBtn} onClick={handleNext} disabled={!hasWords || currentWordIndex >= words.length - 1} aria-label="Next">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className={styles.lbl}>Next</span>
        </button>

        <button className={styles.resetBtn} onClick={handleReset} disabled={!hasWords} aria-label="Reset">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 11-9-9"/>
            <polyline points="21 3 21 9 15 9"/>
          </svg>
          <span className={styles.lbl}>Reset</span>
        </button>
      </div>

      {/* ── WPM section ────────────────────────────────────── */}
      <div className={styles.wpmSection}>
        <div className={styles.wpmRow}>
          <button className={styles.wpmBtn} onClick={() => adjustWpm(-10)} disabled={isLoading} aria-label="Decrease speed">−</button>
          <input
            type="range"
            className={styles.wpmSlider}
            min={100}
            max={1000}
            step={10}
            value={wpm}
            onChange={e => setWpm(Number(e.target.value))}
            aria-label={`Reading speed: ${wpm} words per minute`}
          />
          <button className={styles.wpmBtn} onClick={() => adjustWpm(+10)} disabled={isLoading} aria-label="Increase speed">+</button>
        </div>
        <div className={styles.wpmVal}>{wpm} WPM</div>
      </div>
    </div>
  );
}
