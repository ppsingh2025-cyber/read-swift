/**
 * Controls
 *
 * Three-row playback panel:
 *   Row 1 – Progress: clickable progress bar + word counter (click to jump)
 *   Row 2 – Playback: upload · prev · play/pause · next · reset
 *   Row 3 – Speed: slower · logarithmic slider · faster · WPM readout
 *
 * All interactive elements meet the 44 px minimum touch-target size.
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
}: ControlsProps) {
  const { isPlaying, wpm, setWpm, words, isLoading, currentWordIndex, goToWord } =
    useReaderContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Word-jump editing ───────────────────────────────────────── */
  const [isEditingWord, setIsEditingWord] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const wordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingWord) wordInputRef.current?.select();
  }, [isEditingWord]);

  const startWordEdit = useCallback(() => {
    setWordInput(String(currentWordIndex + 1));
    setIsEditingWord(true);
  }, [currentWordIndex]);

  const commitWordEdit = useCallback(() => {
    const n = parseInt(wordInput, 10);
    if (!isNaN(n) && n >= 1 && n <= words.length) goToWord(n - 1);
    setIsEditingWord(false);
  }, [wordInput, goToWord, words.length]);

  const handleWordInputKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') commitWordEdit();
      if (e.key === 'Escape') setIsEditingWord(false);
    },
    [commitWordEdit],
  );

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

  /* ── Clickable progress bar ──────────────────────────────────── */
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      goToWord(Math.round(ratio * (words.length - 1)));
    },
    [words.length, goToWord],
  );

  const progress = hasWords
    ? Math.round((currentWordIndex / Math.max(words.length - 1, 1)) * 100)
    : 0;

  return (
    <div className={styles.controls}>
      {/* ── Row 1: Progress ─────────────────────────────────────── */}
      <div className={styles.progressRow}>
        {hasWords ? (
          <>
            {isEditingWord ? (
              <input
                ref={wordInputRef}
                className={styles.wordInput}
                type="number"
                min={1}
                max={words.length}
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                onBlur={commitWordEdit}
                onKeyDown={handleWordInputKey}
                autoFocus
                aria-label={`Go to word (1–${words.length})`}
              />
            ) : (
              <button
                className={styles.wordCounter}
                onClick={startWordEdit}
                title="Click to jump to a specific word"
                aria-label={`Word ${currentWordIndex + 1} of ${words.length} — click to jump`}
              >
                {(currentWordIndex + 1).toLocaleString()}
                <span className={styles.sep}>/</span>
                {words.length.toLocaleString()}
              </button>
            )}
            <div
              className={styles.progressTrack}
              onClick={handleProgressClick}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Reading progress: ${progress}%`}
              title="Click to jump to position"
            >
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressPct}>{progress}%</span>
          </>
        ) : (
          <p className={styles.emptyHint}>Upload a file, paste text, or enter a URL to begin</p>
        )}
      </div>

      {/* ── Row 2: Playback ─────────────────────────────────────── */}
      <div className={styles.playbackRow}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub,.txt,.md,.html,.htm,.rtf,.srt,.docx"
          className={styles.hiddenInput}
          onChange={handleFileChange}
          aria-label="Upload file"
        />
        <button
          className={styles.uploadBtn}
          onClick={handleFileClick}
          disabled={isLoading}
          title="Upload file (PDF, EPUB, TXT, MD, HTML, RTF, SRT, DOCX)"
          aria-label="Upload file"
        >
          📂
        </button>

        <button
          className={styles.navBtn}
          onClick={onPrevWord}
          disabled={!hasWords || currentWordIndex <= 0}
          title="Previous word (←)"
          aria-label="Previous word"
        >
          ‹
        </button>

        <button
          className={styles.playBtn}
          onClick={isPlaying ? onPause : onPlay}
          disabled={!hasWords}
          title="Play / Pause (Space)"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className={styles.navBtn}
          onClick={onNextWord}
          disabled={!hasWords || currentWordIndex >= words.length - 1}
          title="Next word (→)"
          aria-label="Next word"
        >
          ›
        </button>

        <button
          className={styles.resetBtn}
          onClick={onReset}
          disabled={!hasWords}
          title="Restart from beginning"
          aria-label="Restart"
        >
          ↩
        </button>
      </div>

      {/* ── Row 3: Speed ────────────────────────────────────────── */}
      <div className={styles.speedRow}>
        <button
          className={styles.speedBtn}
          onClick={onSlower}
          disabled={isLoading}
          title="Slower (↓)"
          aria-label="Decrease speed"
        >
          −
        </button>
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={1}
            value={wpmToSlider(wpm)}
            onChange={handleSliderChange}
            className={styles.slider}
            aria-label={`Reading speed: ${wpm} words per minute`}
          />
        </div>
        <button
          className={styles.speedBtn}
          onClick={onFaster}
          disabled={isLoading}
          title="Faster (↑)"
          aria-label="Increase speed"
        >
          +
        </button>
        <span className={styles.wpmLabel}>{wpm} WPM</span>
      </div>
    </div>
  );
}
