/**
 * Controls
 *
 * Three-row playback panel (v1.0.6):
 *   Row 1 – Info: word count (left) + page navigation (right)
 *   Row 2 – Action buttons: Upload · Paste · Back · Play/Pause · Next · Reset
 *   Row 3 – Speed: − · logarithmic slider · + · WPM readout
 *
 * All interactive elements meet the 44 px minimum touch-target size.
 * Progress bar removed — word count and page pill are sufficient navigation.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReaderContext } from '../context/useReaderContext';
import styles from '../styles/Controls.module.css';

const MIN_WPM = 60;
const MAX_WPM = 1500;
const SLIDER_MIN = 0;
const SLIDER_MAX = 100;

function wpmToSlider(wpm: number): number {
  return (
    ((Math.log(wpm) - Math.log(MIN_WPM)) /
      (Math.log(MAX_WPM) - Math.log(MIN_WPM))) *
    (SLIDER_MAX - SLIDER_MIN)
  );
}

function sliderToWpm(sliderVal: number): number {
  return Math.round(
    Math.exp(
      Math.log(MIN_WPM) +
        (sliderVal / SLIDER_MAX) * (Math.log(MAX_WPM) - Math.log(MIN_WPM)),
    ),
  );
}

interface ControlsProps {
  onFileSelect: (file: File) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onFaster: () => void;
  onSlower: () => void;
  onPrevWord: () => void;
  onNextWord: () => void;
  /** Toggle the paste input panel above the bottom bar */
  onPasteToggle: () => void;
  /** Whether the paste panel is currently open */
  pasteOpen: boolean;
  /** When true (maximize/focus mode) upload and paste buttons are hidden */
  focused?: boolean;
}

export default function Controls({
  onFileSelect,
  onPlay,
  onPause,
  onReset,
  onFaster,
  onSlower,
  onPrevWord,
  onNextWord,
  onPasteToggle,
  pasteOpen,
  focused,
}: ControlsProps) {
  const { isPlaying, wpm, setWpm, words, isLoading, currentWordIndex,
    totalPages, currentPage, goToPage } =
    useReaderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Page-jump popover ──────────────────────────────────────── */
  const [showPageJump, setShowPageJump] = useState(false);
  const pageJumpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPageJump) return;
    const handler = (e: MouseEvent) => {
      if (pageJumpRef.current && !pageJumpRef.current.contains(e.target as Node)) {
        setShowPageJump(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPageJump]);

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

  /* ── Speed slider ────────────────────────────────────────────── */
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setWpm(sliderToWpm(Number(e.target.value)));
    },
    [setWpm],
  );

  const hasWords = words.length > 0;

  return (
    <div className={styles.controls}>
      <div className={styles.inner}>

      {/* ── Row 1: Info — word count (left) + page nav (right) ── */}
      <div className={styles.infoRow}>
        <span className={styles.wordCount}>
          {hasWords
            ? `${(currentWordIndex + 1).toLocaleString()} / ${words.length.toLocaleString()}`
            : '—'}
        </span>

        {hasWords && totalPages > 1 && (
          <div className={styles.pageNav} ref={pageJumpRef}>
            <button
              className={styles.pageSkipBtn}
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >−</button>

            <button
              className={styles.pagePill}
              onClick={() => setShowPageJump(prev => !prev)}
              aria-label={`Page ${currentPage} of ${totalPages}`}
            >
              p.{currentPage}/{totalPages}
            </button>

            <button
              className={styles.pageSkipBtn}
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >+</button>

            {showPageJump && (
              <div className={styles.pageJumpPopover}>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  defaultValue={currentPage}
                  className={styles.pageJumpInput}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val >= 1 && val <= totalPages) {
                        goToPage(val);
                        setShowPageJump(false);
                      }
                    }
                    if (e.key === 'Escape') setShowPageJump(false);
                  }}
                  autoFocus
                />
                <span className={styles.pageJumpHint}>Enter page number + Enter to jump</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Row 2: Action buttons ───────────────────────────────── */}
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
          className={styles.controlBtn}
          onClick={onPrevWord}
          disabled={!hasWords || currentWordIndex <= 0}
          title="Previous word (←)"
          aria-label="Previous word"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span className={styles.controlBtnLabel}>Back</span>
        </button>

        <button
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
          className={styles.controlBtn}
          onClick={onNextWord}
          disabled={!hasWords || currentWordIndex >= words.length - 1}
          title="Next word (→)"
          aria-label="Next word"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className={styles.controlBtnLabel}>Next</span>
        </button>

        <button
          className={styles.resetBtn}
          onClick={onReset}
          disabled={!hasWords}
          title="Restart from beginning"
          aria-label="Restart"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          <span className={styles.resetBtnLabel}>Reset</span>
        </button>
      </div>

      {/* ── Row 3: WPM slider ───────────────────────────────────── */}
      <div className={styles.wpmRow}>
        <button
          className={styles.wpmAdjBtn}
          onClick={onSlower}
          disabled={isLoading}
          title="Slower (↓)"
          aria-label="Decrease speed"
        >−</button>

        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={1}
          value={wpmToSlider(wpm)}
          onChange={handleSliderChange}
          className={styles.wpmSlider}
          aria-label={`Reading speed: ${wpm} words per minute`}
        />

        <button
          className={styles.wpmAdjBtn}
          onClick={onFaster}
          disabled={isLoading}
          title="Faster (↑)"
          aria-label="Increase speed"
        >+</button>

        <span className={styles.wpmLabel}>{wpm} WPM</span>
      </div>

      </div>
    </div>
  );
}

